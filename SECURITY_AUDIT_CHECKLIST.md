# Security Audit Checklist & Testing Results

## Mozilla Observatory Results
Our target score on [Mozilla Observatory](https://observatory.mozilla.org/) is **A+**.
With the customized `vercel.json` and Cloudflare WAF, we enforce:
- **CSP (Content-Security-Policy):** Restricts domains, blocks inline JS, blocks eval.
- **HSTS (Strict-Transport-Security):** Forces 1-year max-age sub-domain HTTTPS loading via `preload`.
- **X-Frame-Options:** `DENY` to prevent clickjacking in IFrames.
- **X-Content-Type-Options:** `nosniff` prevents MIME type sniffing.
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** explicitly drops permissions to mic, video, geolocation.

***Target Achieved: A+ Validation*** ✓

## OWASP ZAP (Zed Attack Proxy) Checklist
Ensure the following checks are run before major Production deployments:

- [x] **No Unauthenticated State Mutations:** Ensure SUPABASE RLS policies require `auth.uid() != null` for INSERT, UPDATE, DELETE.
- [x] **CSP Violation Logging Active:** Verified that violations hitting `/api/csp-report` correctly log out to Datadog Observability platform.
- [x] **JWT Token Handling:** Verifying no sensitive data (like credentials, SSN, API KEYS) is stuffed into raw JWT payloads or local-storage arrays.
- [x] **Idempotency Implemented:** Edge Functions (`process-payment`) must perform idempotency key lookups for robust processing and protection against replay attacks (already implemented).
- [x] **XSS (Cross-Site Scripting):** Rely entirely on React rendering (auto-escapes), block `dangerouslySetInnerHTML`.
- [x] **Cloudflare Proxying:** Direct raw endpoints are hidden, all egress goes through the Vercel/Cloudflare barrier.

## Supabase Auth & Credential Hardening
Ensure the identity provider layer is protected against credential stuffing and compromised authentication details:

- [x] **Leaked Password Protection:** Implemented in the local/development config (`supabase/config.toml`) under `[auth.security] leaked_passwords_enabled = true`.
- [x] **HaveIBeenPwned Check Strategy:** Production projects must have this setting checked in the **Supabase Dashboard** (under *Authentication* -> *Providers* -> *Email* -> *Password Security*) to automatically deny vulnerable/compromised passwords.
- [x] **Password Complexity Policies:** Minimum password length of 8 with mixed character constraints (enforced in config).

## CSP Violation Logging
- We have enabled the endpoint `/api/csp-report`.
- Violations are automatically forwarded into **Datadog Logs**. 
- **In Datadog:** Filter logs with `ddsource: csp-report` to generate real-time metrics and alerts for potential ongoing XSS injection attempts.
