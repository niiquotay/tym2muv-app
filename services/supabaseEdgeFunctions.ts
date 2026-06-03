// Supabase Edge Function API Service
// WARNING: Do NOT use supabase.rpc for sensitive operations like billing on the frontend!
// ALWAYS call Edge Functions constructed via this service.

const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

/**
 * Utility to make authenticated requests to Supabase Edge Functions
 */
export async function invokeEdgeFunction<T>(
  functionName: string,
  payload: Record<string, any>
): Promise<T> {
  const url = `${SUPABASE_PROJECT_URL}/functions/v1/${functionName}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to invoke edge function');
    }

    return data as T;
  } catch (error) {
    console.error(`Edge Function Error (${functionName}):`, error);
    throw error;
  }
}

// =========================================================================
// API BINDINGS
// =========================================================================

export async function updateSubscription(agentId: string, feature: string, increment: number = 1) {
  return invokeEdgeFunction('update-subscription', {
    agent_id: agentId,
    feature,
    increment,
  });
}

export async function processPayment(agentId: string, plan: string) {
  return invokeEdgeFunction('process-payment', {
    agent_id: agentId,
    plan
  });
}

export async function checkFraudScoring(propertyId: string) {
  return invokeEdgeFunction('ai-fraud-detection', {
    property_id: propertyId
  });
}

export async function logActivity(payload: Record<string, any>) {
  return invokeEdgeFunction('log-activity', payload);
}

