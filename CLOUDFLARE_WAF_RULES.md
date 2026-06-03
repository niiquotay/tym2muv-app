# Cloudflare WAF Rules documentation

To protect Tym2Muv from malicious traffic, please configure the following rules in the Cloudflare Dashboard -> Security -> WAF.

## 1. SQL Injection Prevention
- **Name:** SQLi Protection
- **Rule Expression:** `(http.request.uri.query contains "SELECT") or (http.request.uri.query contains "UNION") or (http.request.uri.query contains "DROP")`
- **Action:** Block or Managed Challenge
- **Note:** Also enable Cloudflare's Managed Ruleset (SQLi rules) which catches advanced obfuscated SQLi.

## 2. XSS Attack Prevention
- **Name:** XSS Protection
- **Rule Expression:** `(http.request.uri.query contains "<script>") or (http.request.uri.query contains "javascript:")`
- **Action:** Block
- **Note:** Enable the Cloudflare Managed Ruleset for complete Cross-Site Scripting protection.

## 3. Bot Detection and Blocking
- **Bot Fight Mode:** Enable "Bot Fight Mode" globally.
- **Rule Expression (Custom Bot Rule):** `(cf.client.bot) or (http.user_agent contains "curl")`
- **Action:** Managed Challenge

## 4. Rate Limiting Rules
- **Rule Name:** API Rate Limiting
- **Traffic Matching:** `(http.request.uri.path matches "^/api/") or (http.request.uri.path matches "^/services/supabase/")`
- **Rate Limit:** 100 requests per 10 seconds.
- **Action:** Block for 1 hour.
- **Note:** See `CLOUDFLARE_RATE_LIMITS.md` for extended limits.

## 5. Geo-Blocking (Optional)
- **Rule Expression:** `(ip.geoip.country in {"XX", "YY"})`
- **Action:** Block / Challenge
- **Note:** Only configure if business operations do not require traffic from high-risk origin countries.
