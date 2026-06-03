import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Mock options for data selection
const locations = ['East Legon', 'Cantonments', 'Airport Residential', 'Labone', 'Osu'];
const categories = ['residential', 'commercial', 'short-let', 'land'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Scenarios setup for SPIKE testing
export const options = {
  scenarios: {
    spike_browsing_traffic: {
      executor: 'ramping-vus',
      exec: 'searchBrowsing',
      startVUs: 500, // Starts directly at baseline normal load (500 VUs)
      stages: [
        { duration: '2m', target: 500 },   // Warm up & run stably at baseline load
        { duration: '30s', target: 2000 }, // Sudden spike up to 2,000 VUs (4x surge)
        { duration: '3m', target: 2000 },  // Sustain heavy spike load
        { duration: '30s', target: 500 },  // Rapidly drop load to observe recovery capability
        { duration: '3m', target: 500 },   // Maintain baseline to check memory/queue drain
        { duration: '1m', target: 0 },     // Tear down to zero VUs
      ],
    },
  },
  thresholds: {
    // Check that we can recover gracefully from the massive surge
    'http_req_duration': ['p(95)<1000', 'p(99)<2500'], // Fast response recoveries
    'http_req_failed': ['rate<0.01'], // Let maximum total failure stay < 1%
  },
};

const commonHeaders = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

export function searchBrowsing() {
  const host = BASE_URL;

  // 1. Fetch properties list
  const listRes = http.get(`${host}/rest/v1/properties?select=*&status=eq.active&limit=10`, {
    headers: commonHeaders,
    tags: { name: 'Spike_ListProperties' },
  });
  
  check(listRes, {
    'list status 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. Filter search query
  const queryUrl = `${host}/rest/v1/properties?select=*&category_id=eq.${randomElement(categories)}&location=ilike.*${randomElement(locations)}*&status=eq.active&limit=15`;
  const filterRes = http.get(queryUrl, {
    headers: commonHeaders,
    tags: { name: 'Spike_FilteredSearch' },
  });

  check(filterRes, {
    'search status 200': (r) => r.status === 200,
  });
  sleep(30);

  // 3. View detail page
  const detailRes = http.get(`${host}/rest/v1/properties?id=eq.fcc54fe8-d652-47f2-985c-02cf4c39eb00`, {
    headers: commonHeaders,
    tags: { name: 'Spike_ViewDetails' },
  });

  check(detailRes, {
    'detail status 200/404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(10);
}

export function handleSummary(data) {
  return {
    "k6/spike-test-summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
