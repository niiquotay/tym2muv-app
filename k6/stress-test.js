import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom Performance Metrics to record stress bottlenecks
const imageProcessingTime = new Trend('image_processing_time');
const messageDeliveryTime = new Trend('message_delivery_time');
const websocketFails = new Rate('ws_fails');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Mock values for data generation
const locations = ['East Legon', 'Cantonments', 'Airport Residential', 'Labone', 'Osu', 'Spintex', 'Tema'];
const propertyTypes = ['Apartment', 'House', 'Mansion', 'Townhouse', 'Studio'];
const categories = ['residential', 'commercial', 'short-let', 'land'];
const currencies = ['GHS', 'USD', 'EUR'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTitle() {
  return `Premium ${randomElement(propertyTypes)} stress test listing in ${randomElement(locations)}`;
}

// Scenarios setup for STRESS testing (5x scale)
export const options = {
  scenarios: {
    search_browsing_stress: {
      executor: 'ramping-vus',
      exec: 'searchBrowsing',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },   // Warm up to normal load (500 VUs)
        { duration: '3m', target: 500 },   // Hold normal load
        { duration: '5m', target: 2500 },  // Ramp up to 5x stress capacity (2,500 VUs)
        { duration: '5m', target: 2500 },  // Maintain 5x stress capacity 
        { duration: '2m', target: 0 },     // Tear down gradually
      ],
    },
    property_upload_stress: {
      executor: 'ramping-vus',
      exec: 'propertyUpload',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Normal load (100 VUs)
        { duration: '3m', target: 100 },   // Hold
        { duration: '5m', target: 500 },   // Stress peak (500 concurrent uploaders)
        { duration: '5m', target: 500 },   // Maintain
        { duration: '2m', target: 0 },     // Tear down
      ],
    },
    messaging_chat_stress: {
      executor: 'ramping-vus',
      exec: 'messagingChat',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 150 },   // Normal load (150 VUs)
        { duration: '3m', target: 150 },   // Hold
        { duration: '5m', target: 750 },   // Stress peak (750 concurrent chat users)
        { duration: '5m', target: 750 },   // Maintain
        { duration: '2m', target: 0 },     // Tear down
      ],
    },
    payment_processing_stress: {
      executor: 'ramping-vus',
      exec: 'paymentProcessing',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },    // Normal load (50 VUs)
        { duration: '3m', target: 50 },    // Hold
        { duration: '5m', target: 250 },   // Stress peak (250 billings)
        { duration: '5m', target: 250 },   // Maintain
        { duration: '2m', target: 0 },     // Tear down
      ],
    },
  },
  thresholds: {
    // Under heavy 5x stress, thresholds are relaxed to find exact breaking boundaries
    'http_req_duration': ['p(95)<2000', 'p(99)<4000'], // Monitor saturation thresholds (p95 < 2s)
    'http_req_failed': ['rate<0.05'], // Accept up to 5% failure at peak stress before alert
    'image_processing_time': ['p(95)<15000'],
    'message_delivery_time': ['p(95)<2500'],
  },
};

const commonHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

// Scenario: Search & Browsing
export function searchBrowsing() {
  const host = BASE_URL;
  
  // Home query
  const homeRes = http.get(`${host}/rest/v1/properties?select=*&status=eq.active&limit=10`, {
    headers: commonHeaders,
    tags: { name: 'Stress_BrowseHomepage' },
  });
  check(homeRes, { 'homepage ready': (r) => r.status === 200 });
  sleep(1);

  // Filtered listing query
  const searchUrl = `${host}/rest/v1/properties?select=*&category_id=eq.${randomElement(categories)}&location=ilike.*${randomElement(locations)}*&status=eq.active&limit=20`;
  const searchRes = http.get(searchUrl, {
    headers: commonHeaders,
    tags: { name: 'Stress_SearchProperties' },
  });
  check(searchRes, { 'search results ready': (r) => r.status === 200 });
  sleep(30);

  // View Listing
  const getDetail = http.get(`${host}/rest/v1/properties?id=eq.fcc54fe8-d652-47f2-985c-02cf4c39eb00`, {
    headers: commonHeaders,
    tags: { name: 'Stress_ViewPropertyDetails' },
  });
  check(getDetail, { 'detail view ready': (r) => r.status === 200 || r.status === 404 });
  sleep(10);
}

// Scenario: Property Upload
export function propertyUpload() {
  const host = BASE_URL;
  const agentId = `agent-stress-${randomInt(1, 500)}`;

  // Create metadata
  const body = JSON.stringify({
    title: generateTitle(),
    price: randomInt(2000, 15000),
    currency: 'GHS',
    location: `${randomInt(10, 200)} High Street, ${randomElement(locations)}`,
    country_code: 'GH',
    images: [],
    category_id: randomElement(categories),
    agent_id: agentId,
    description: 'Stress testing automated agent listing metadata.',
    status: 'pending',
  });

  const res = http.post(`${host}/rest/v1/properties`, body, {
    headers: { ...commonHeaders, 'Prefer': 'return=representation' },
    tags: { name: 'Stress_CreateListingMetadata' },
  });

  const successCreated = check(res, { 'listing setup successful': (r) => r.status === 201 || r.status === 200 });
  sleep(30);

  if (successCreated) {
    let propertyId = 'fcc54fe8-d652-47f2-985c-02cf4c39eb00';
    try {
      const parsedBody = JSON.parse(res.body);
      propertyId = Array.isArray(parsedBody) ? parsedBody[0].id : parsedBody.id;
    } catch(e) {}

    // Upload images
    const startUpload = Date.now();
    const mockImgRes = http.post(`${host}/rest/v1/property_images`, JSON.stringify({
      property_id: propertyId,
      image_url: `https://cloudinary.mock.com/stress/prop_${propertyId}/img_stress.jpg`
    }), {
      headers: commonHeaders,
      tags: { name: 'Stress_UploadImage' },
    });
    
    imageProcessingTime.add(Date.now() - startUpload);
    check(mockImgRes, { 'stress image upload ok': (r) => r.status === 200 || r.status === 201 });
    sleep(5);

    // Publish listing
    const publishRes = http.patch(`${host}/rest/v1/properties?id=eq.${propertyId}`, JSON.stringify({ status: 'active' }), {
      headers: commonHeaders,
      tags: { name: 'Stress_Publish' },
    });
    check(publishRes, { 'stress listing published': (r) => r.status === 200 || r.status === 204 });
  }
}

// Scenario: Messaging
export function messagingChat() {
  const host = BASE_URL;
  const wsHost = host.replace('http://', 'ws://').replace('https://', 'wss://');
  const wsUrl = `${wsHost}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

  ws.connect(wsUrl, {}, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        topic: 'realtime:public:messages',
        event: 'phx_join',
        payload: {},
        ref: '1',
      }));

      // Simulate chat sequence under stress conditions
      for (let i = 1; i <= 3; i++) {
        sleep(20);

        const startMsg = Date.now();
        const chatMsgRes = http.post(`${host}/rest/v1/messages`, JSON.stringify({
          sender_id: `agent-stress-${randomInt(1, 100)}`,
          receiver_id: `tenant-stress-${randomInt(1, 100)}`,
          message_text: `Stress loading check ping message ${i}`,
        }), {
          headers: commonHeaders,
          tags: { name: 'Stress_SendChatMessage' },
        });

        if (chatMsgRes.status === 201 || chatMsgRes.status === 200) {
          messageDeliveryTime.add(Date.now() - startMsg);
        }
      }
      socket.close();
    });

    socket.on('error', () => {
      websocketFails.add(1);
    });
  });
}

// Scenario: Payments
export function paymentProcessing() {
  const host = BASE_URL;
  const agentId = `stress-payment-${randomInt(1, 1000)}`;

  const payRes = http.post(`${host}/functions/v1/process-payment`, JSON.stringify({
    agent_id: agentId,
    plan: 'premium',
  }), {
    headers: commonHeaders,
    tags: { name: 'Stress_PaymentInitiate' },
  });

  const initiated = check(payRes, { 'bill initiated': (r) => r.status === 200 });
  sleep(20);

  if (initiated) {
    let checkoutId = `pay_stress_${randomInt(100000, 999999)}`;
    const mockWebhookRes = http.post(`${host}/functions/v1/handle-paystack-webhook`, JSON.stringify({
      event: 'charge.success',
      data: {
        reference: checkoutId,
        metadata: { agent_id: agentId, plan: 'premium' }
      }
    }), {
      headers: { ...commonHeaders, 'x-paystack-signature': 'mock-stress-sig' },
      tags: { name: 'Stress_WebhookCallback' },
    });

    check(mockWebhookRes, { 'webhook delivered stress': (r) => r.status === 200 || r.status === 201 });
  }
}

export function handleSummary(data) {
  return {
    "k6/stress-test-summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
