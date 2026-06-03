import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN')! || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global rate limiting map (for Deno memory during invocation)
const rateLimits = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify User Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized request" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1.5 Rate Limiting (Server-side)
    const now = Date.now();
    const lastRequest = rateLimits.get(user.id) || 0;
    if (now - lastRequest < 60000) { // 60 seconds cooldown
      return new Response(
        JSON.stringify({ error: "Too many payment attempts. Please wait 60 seconds." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    rateLimits.set(user.id, now);

    const { reference, listingId, idempotencyKey } = await req.json();

    if (!reference || !listingId || !idempotencyKey) {
      return new Response(
        JSON.stringify({ error: "Missing payment parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check Idempotency via payment_attempts
    const { data: attempt } = await supabaseAdmin
      .from('payment_attempts')
      .select('id, status, response')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (attempt) {
        if (attempt.status === 'succeeded') {
            return new Response(
              JSON.stringify({ success: true, data: attempt.response, cached: true }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        if (attempt.status === 'pending') {
            // Already processing, but we can perhaps proceed to verify if it's stuck, or return 409
            // A realistic approach: proceed to paystack verification below to ensure it's not complete there.
        }
    } else {
        // Insert new attempt as pending
        await supabaseAdmin.from('payment_attempts').insert({
            idempotency_key: idempotencyKey,
            user_id: user.id,
            listing_id: listingId,
            reference_id: reference,
            amount: 0, // We'll update this after verification
            status: 'pending'
        });
    }

    // 3. Verify Payment via Paystack
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Missing Paystack secret key");
    }

    const verifyReq = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`
      }
    });

    const verifyData = await verifyReq.json();
    const amountOut = verifyData?.data?.amount ? verifyData.data.amount / 100 : 0;

    if (!verifyData.status || verifyData.data.status !== 'success') {
      await supabaseAdmin.from('payment_attempts').update({
         status: 'failed',
         response: verifyData,
         amount: amountOut
      }).eq('idempotency_key', idempotencyKey);
      
      return new Response(
        JSON.stringify({ error: "Payment failed verification", success: false, reference }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Update the listing to isPremium = true
    const { error: listingError } = await supabaseAdmin
      .from('properties')
      .update({ is_premium: true })
      .eq('id', listingId);

    if (listingError) throw listingError;

    // 5. Insert payment record (if not exists) and update attempt
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        amount: amountOut, // Paystack amount is in pesewas/kobo
        currency: verifyData.data.currency,
        status: 'completed',
        purpose: 'listing_fee',
        reference_id: reference,
        gateway: 'Paystack'
      })
      .select()
      .single();

    await supabaseAdmin.from('payment_attempts').update({
       status: 'succeeded',
       response: verifyData,
       amount: amountOut
    }).eq('idempotency_key', idempotencyKey);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Payment processing failed", details: err.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
