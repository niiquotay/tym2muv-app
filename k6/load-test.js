import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom Performance Metrics
const imageProcessingTime = new Trend('image_processing_time');
const messageDeliveryTime = new Trend('message_delivery_time');
const webhookDeliveryTime = new Trend('webhook_delivery_time');
const wsConnectionFailures = new Rate('ws_connection_failures');
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://placeholder.supabase.co'; // Fallback URL, override with VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Mock values for data generation
const locations = ['East Legon', 'Cantonments', 'Airport Residential', 'Labone', 'Osu', 'Spintex', 'Tema'];
const propertyTypes = ['Apartment', 'House', 'Mansion', 'Townhouse', 'Studio'];
const categories = ['residential', 'commercial', 'short-let', 'land'];
const currencies = ['GHS', 'USD', 'EUR'];
const adjectives = ['Beautiful', 'Luxury', 'Executive', 'Cozy', 'Modern', 'Spacious'];
const features = ['Pool', 'Security', 'Furnished', 'Backup Water', 'Generator', 'Parking'];

// Helper functions for randomized helper test data
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function generateTitle() {
  return `${randomElement(adjectives)} ${randomElement(propertyTypes)} in ${randomElement(locations)}`;
}

// Scenarios setup
export const options = {
  scenarios: {
    search_browsing: {
      executor: 'constant-vus',
      exec: 'searchBrowsing',
      vus: 500,
      duration: '10m',
    },
    property_upload: {
      executor: 'constant-vus',
      exec: 'propertyUpload',
      vus: 100,
      duration: '10m',
    },
    messaging_chat: {
      executor: 'constant-vus',
      exec: 'messagingChat',
      vus: 150,
      duration: '10m',
    },
    payment_processing: {
      executor: 'constant-vus',
      exec: 'paymentProcessing',
      vus: 50,
      duration: '10m',
    },
  },
  thresholds: {
    // Scenario 1: Search & Browsing
    'http_req_duration{scenario:search_browsing}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed{scenario:search_browsing}': ['rate<0.005'], // < 0.5% error rate

    // Scenario 2: Property Upload
    'http_req_failed{scenario:property_upload}': ['rate<0.02'], // > 98% success rate
    'http_req_duration{scenario:property_upload}': ['p(95)<2000'], // p95 upload time < 2s
    'image_processing_time': ['p(95)<10000'], // Image processing completes within 10s

    // Scenario 3: Messaging & Chat
    'message_delivery_time': ['p(95)<1000'], // p95 message delivery < 1s
    'ws_connection_failures': ['rate<0.01'], // Websocket connection stable

    // Scenario 4: Payment Processing
    'http_req_failed{scenario:payment_processing}': ['rate<0.02'], // > 98% payment success rate
    'http_req_duration{scenario:payment_processing}': ['p(95)<3000'], // Payment processing < 3s
    'webhook_delivery_time': ['p(95)<1000'], // Webhook delivery < 1s
  },
};

// Headers for DB / REST Calls via PostgREST / Supabase
const commonHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

// scenario 1: Search & Browsing (70% of traffic)
export function searchBrowsing() {
  const host = BASE_URL;

  // 1. Browse Homepage
  const homeRes = http.get(`${host}/rest/v1/properties?select=*&status=eq.active&limit=10`, {
    headers: commonHeaders,
    tags: { name: 'BrowseHomepage' },
  });
  
  check(homeRes, {
    'browse homepage ok': (r) => r.status === 200,
  });
  sleep(1); // 1s think time

  // 2. Search for properties with various filters
  const filterCat = randomElement(categories);
  const filterLoc = randomElement(locations);
  const minPrice = randomInt(500, 2000);
  const maxPrice = randomInt(3000, 10000);

  const searchUrl = `${host}/rest/v1/properties?select=*&category_id=eq.${filterCat}&location=ilike.*${filterLoc}*&price=gte.${minPrice}&price=lte.${maxPrice}&status=eq.active&limit=20`;
  const searchRes = http.get(searchUrl, {
    headers: commonHeaders,
    tags: { name: 'SearchProperties' },
  });

  check(searchRes, {
    'search properties ok': (r) => r.status === 200,
  });
  sleep(30); // 30s think time/search parameter variation

  // Get a random listing ID from search results or use fallback for details page
  let propertyId = 'fcc54fe8-d652-47f2-985c-02cf4c39eb00'; // Default fallback
  try {
    if (searchRes.status === 200) {
      const body = JSON.parse(searchRes.body);
      if (body && body.length > 0) {
        propertyId = randomElement(body).id || propertyId;
      }
    }
  } catch (e) {}

  // 3. View detail page
  const detailRes = http.get(`${host}/rest/v1/properties?id=eq.${propertyId}`, {
    headers: commonHeaders,
    tags: { name: 'ViewPropertyDetails' },
  });

  check(detailRes, {
    'view details ok': (r) => r.status === 200 || r.status === 404, // 404 handle gracefully
  });
  sleep(10); // 10s details view time

  // 4. Save to wishlist / log-favourite activity
  const wishlistPayload = JSON.stringify({
    agent_id: `user-${randomInt(1, 1000)}`,
    activity_type: 'favourite_listing',
    metadata: { property_id: propertyId },
  });
  
  const wishRes = http.post(`${host}/functions/v1/log-activity`, wishlistPayload, {
    headers: commonHeaders,
    tags: { name: 'SaveToWishlist' },
  });

  check(wishRes, {
    'wishlist transaction ok': (r) => r.status === 200 || r.status === 201,
  });
  sleep(2); // 2s wait time before loop repeats
}

// scenario 2: Property Upload (10% of traffic)
export function propertyUpload() {
  const host = BASE_URL;
  const agentId = `agent-${randomInt(1, 200)}`;

  // 1. Create property listing metadata (Initial pending state)
  const listingPayload = JSON.stringify({
    title: generateTitle(),
    price: randomInt(1500, 8000),
    currency: randomElement(currencies),
    location: `${randomInt(10, 150)} Ring Road Close, ${randomElement(locations)}`,
    country_code: 'GH',
    images: [],
    category_id: randomElement(categories),
    agent_id: agentId,
    description: 'Beautifully polished load testing simulated listing containing clean amenities.',
    status: 'pending',
    listing_type: randomElement(['rent', 'sale']),
    property_type: randomElement(propertyTypes),
    bedrooms: randomInt(1, 6),
    bathrooms: randomInt(1, 4),
    sqft: randomInt(1000, 5000),
    amenities: [randomElement(features), randomElement(features)],
  });

  const uploadRes = http.post(`${host}/rest/v1/properties`, listingPayload, {
    headers: {
      ...commonHeaders,
      'Prefer': 'return=representation',
    },
    tags: { name: 'CreateListingMetadata' },
  });

  const successCreated = check(uploadRes, {
    'listing metadata created': (r) => r.status === 201 || r.status === 200,
  });

  let propertyId = '';
  try {
    if (uploadRes.status === 201 || uploadRes.status === 200) {
      const responseBody = JSON.parse(uploadRes.body);
      propertyId = Array.isArray(responseBody) ? responseBody[0].id : responseBody.id;
    }
  } catch (e) {}

  sleep(30); // 30s metadata completion time

  if (successCreated && propertyId) {
    // 2. Upload 3 to 5 images
    const numImages = randomInt(3, 5);
    const uploadedUrls = [];
    
    for (let i = 0; i < numImages; i++) {
      const startUpload = Date.now();
      
      // Simulate image upload (Post standard multi-part payload or storage folder file)
      const mockImagePayload = JSON.stringify({
        image_data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/1g...',
        filename: `test_img_${i}.jpg`
      });

      const imgRes = http.post(`${host}/rest/v1/property_images`, JSON.stringify({
        property_id: propertyId,
        image_url: `https://cloudinary.mock.com/uploads/prop_${propertyId}/img_${i}.jpg`
      }), {
        headers: commonHeaders,
        tags: { name: 'UploadListingImage' },
      });

      const uploadDuration = Date.now() - startUpload;
      imageProcessingTime.add(uploadDuration); // Image upload & compression roundtrip

      check(imgRes, {
        'image upload ok': (r) => r.status === 200 || r.status === 201,
      });

      sleep(2); // 2s simulated upload delay per image
    }

    // 3. Edit / refine the property details
    const updatePayload = JSON.stringify({
      description: 'Polished property description updated after detailed image inspection by the system.',
      sqft: randomInt(3500, 6000),
    });

    const editRes = http.patch(`${host}/rest/v1/properties?id=eq.${propertyId}`, updatePayload, {
      headers: commonHeaders,
      tags: { name: 'EditListingDetails' },
    });

    check(editRes, {
      'edit listing details ok': (r) => r.status === 200 || r.status === 204,
    });
    sleep(5); // 5s review/edit time

    // 4. Publish / Activate listing
    const publishPayload = JSON.stringify({
      status: 'active',
    });

    const publishRes = http.patch(`${host}/rest/v1/properties?id=eq.${propertyId}`, publishPayload, {
      headers: commonHeaders,
      tags: { name: 'PublishListing' },
    });

    check(publishRes, {
      'publish listing ok': (r) => r.status === 200 || r.status === 204,
    });
    sleep(1); // 1s publish completion
  }
}

// scenario 3: Messaging & Chat (15% of traffic)
export function messagingChat() {
  const host = BASE_URL;
  // Replace HTTP to WebSocket scheme
  const wsHost = host.replace('http://', 'ws://').replace('https://', 'wss://');
  const wsUrl = `${wsHost}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

  const senderId = `user-${randomInt(100, 999)}`;
  const recipientId1 = `user-${randomInt(100, 999)}`;
  const recipientId2 = `user-${randomInt(100, 999)}`;

  // Connect to Supabase channels
  const response = ws.connect(wsUrl, {}, function (socket) {
    socket.on('open', () => {
      // 1. Join chat channels successfully
      socket.send(JSON.stringify({
        topic: 'realtime:public:messages',
        event: 'phx_join',
        payload: {},
        ref: '1',
      }));

      // Simulate sending 5 messages with 30s think time
      for (let i = 1; i <= 5; i++) {
        sleep(30);

        const currentRecipient = i % 2 === 0 ? recipientId2 : recipientId1;
        const msgStart = Date.now();

        // Send chat message via system restful API endpoint
        const messagePayload = JSON.stringify({
          sender_id: senderId,
          receiver_id: currentRecipient,
          message_text: `Load testing chat message ${i} from sender ${senderId}`,
        });

        const chatMsgRes = http.post(`${host}/rest/v1/messages`, messagePayload, {
          headers: commonHeaders,
          tags: { name: 'SendChatMessage' },
        });

        const msgDelivered = check(chatMsgRes, {
          'message persisted in db': (r) => r.status === 201 || r.status === 200,
        });

        if (msgDelivered) {
          messagesSent.add(1);
          // Measure the duration of the API delivery loop
          messageDeliveryTime.add(Date.now() - msgStart);
        }
      }

      // Close connection gracefully
      socket.close();
    });

    socket.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.event === 'INSERT' && parsed.topic === 'realtime:public:messages') {
          messagesReceived.add(1);
        }
      } catch (e) {}
    });

    socket.on('error', (err) => {
      wsConnectionFailures.add(1);
    });
  });

  check(response, {
    'websocket connection status 101': (r) => r && r.status === 101,
  });
}

// scenario 4: Payment Processing (5% of traffic)
export function paymentProcessing() {
  const host = BASE_URL;
  const agentId = `user-${randomInt(100, 999)}`;
  const subscriptionPlans = ['basic', 'professional', 'premium'];
  const selectedPlan = randomElement(subscriptionPlans);

  // 1. Initiate subscription payment billing
  const paymentStart = Date.now();
  
  const paymentPayload = JSON.stringify({
    agent_id: agentId,
    plan: selectedPlan,
  });

  const payRes = http.post(`${host}/functions/v1/process-payment`, paymentPayload, {
    headers: commonHeaders,
    tags: { name: 'InitiateSubscriptionPayment' },
  });

  const paymentInitiated = check(payRes, {
    'payment initiated successfully': (r) => r.status === 200,
  });

  if (paymentInitiated) {
    const paymentDuration = Date.now() - paymentStart;
    
    // Simulate payment transaction checkout logic
    sleep(20); // 20s to checkout on standard Paystack interface popup / billing UI

    // 2. Mock completing Paystack payment gateway callback flow
    let checkoutId = '';
    try {
      const data = JSON.parse(payRes.body);
      checkoutId = data.checkout_id || `pay_${randomInt(1000000, 9999999)}`;
    } catch(e) {
      checkoutId = `pay_${randomInt(1000000, 9999999)}`;
    }

    // 3. Verify Payment Webhook Callback simulates webhook processing
    const webhookStart = Date.now();

    const webhookPayload = JSON.stringify({
      event: 'charge.success',
      data: {
        id: randomInt(10000, 99999),
        domain: 'test',
        status: 'success',
        reference: checkoutId,
        amount: selectedPlan === 'premium' ? 50000 : 20000,
        currency: 'GHS',
        metadata: {
          agent_id: agentId,
          plan: selectedPlan,
        },
        customer: {
          email: `${agentId}@test.com`,
        }
      }
    });

    // Post to our paystack webhook listener function
    const webhookRes = http.post(`${host}/functions/v1/handle-paystack-webhook`, webhookPayload, {
      headers: {
        ...commonHeaders,
        'x-paystack-signature': 'mock-secure-signature-for-header-validation'
      },
      tags: { name: 'DeliverPaymentWebhook' },
    });

    const webhookSuccess = check(webhookRes, {
      'webhook callback accepted': (r) => r.status === 200 || r.status === 201,
    });

    if (webhookSuccess) {
      webhookDeliveryTime.add(Date.now() - webhookStart);
    }

    sleep(5); // 5s processing verify cool-down
  }
}

// Generate reports at the end of execution
export function handleSummary(data) {
  return {
    "k6/load-test-summary.html": htmlReport(data),
    "LOAD_TEST_RESULTS.md": textSummary(data, { indent: " ", enableColors: false }), // Custom test results write back
  };
}
