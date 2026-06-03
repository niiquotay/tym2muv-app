# Cloudflare Rate Limiting Rules

To protect the application from bot abuse, DDoS attacks, and API spam, configure the following Rate Limiting rules in your Cloudflare dashboard (WAF -> Rate Limiting rules).

## 1. Search API Limits
**Goal:** Prevent scraping of property data and overloading the database with expensive search queries.
* **Match:** URI Path starts with `/search` OR `API endpoint` for searching.
* **Rate:** 30 requests per minute
* **Action:** Block (or return 429 Too Many Requests)
* **By:** IP Address

## 2. Listing Creation Throttling
**Goal:** Prevent spam creation of fake properties.
* **Match:** URI Path starts with `/api/listings` and Method is `POST`.
* **Rate:** 10 requests per minute
* **Action:** Block (429)
* **By:** User ID / Session cookie / IP Address

## 3. Messaging Throttling
**Goal:** Stop bots from flooding users with spam chat messages.
* **Match:** URI Path starts with `/api/messages` and Method is `POST`.
* **Rate:** 20 requests per minute
* **Action:** Block (429)
* **By:** User ID / IP Address

## 4. Payment Processing Limits
**Goal:** Prevent card testing and transaction flooding.
* **Match:** URI Path starts with `/api/payments` or `/supabase/functions/process-payment`.
* **Rate:** 5 requests per minute
* **Action:** Block (429)
* **By:** User ID / IP Address

## JSON Configuration Example for automation (e.g. Terraform):

```json
[
  {
    "action": "block",
    "characteristics": ["ip.src"],
    "description": "Rate Limit: Search API",
    "expression": "http.request.uri.path contains \"/search\"",
    "period": 60,
    "requests_per_period": 30
  },
  {
    "action": "block",
    "characteristics": ["ip.src"],
    "description": "Rate Limit: Upload Listing",
    "expression": "http.request.uri.path contains \"/listings\" and http.request.method == \"POST\"",
    "period": 60,
    "requests_per_period": 10
  },
  {
    "action": "block",
    "characteristics": ["ip.src"],
    "description": "Rate Limit: Messaging",
    "expression": "http.request.uri.path contains \"/messages\" and http.request.method == \"POST\"",
    "period": 60,
    "requests_per_period": 20
  },
  {
    "action": "block",
    "characteristics": ["ip.src"],
    "description": "Rate Limit: Payment Processing",
    "expression": "http.request.uri.path contains \"/payments\" and http.request.method == \"POST\"",
    "period": 60,
    "requests_per_period": 5
  }
]
```
