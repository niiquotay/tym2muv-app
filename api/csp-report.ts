export const config = {
  runtime: 'edge', // Edge Function
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const report = await req.json();
    
    // Log violation to Datadog
    const datadogToken = process.env.VITE_DATADOG_CLIENT_TOKEN;
    if (datadogToken) {
      await fetch(`https://http-intake.logs.datadoghq.com/api/v2/logs?dd-api-key=${datadogToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'CSP Violation',
          cspReport: report['csp-report'] || report,
          service: 'tym2muv-web-csp',
          ddsource: 'csp-report',
        }),
      });
    } else {
      console.warn("CSP Violation received but Datadog token not configured", report);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to parse or log CSP report:', error);
    return new Response('Bad Request', { status: 400 });
  }
}
