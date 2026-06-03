# Monitoring Runbook & Alert Escalations

## Alert Rules (Datadog Monitors)

1. **High API Response Time (p95 > 500ms)**
   - **Condition:** `avg(last_5m):p95:tym2muv.web.latency > 500`
   - **Severity:** Warning
   - **Action:** Check Upstash Redis hit rates and Vercel/Cloud Run CPU limits.

2. **Database Query Time Degraded (> 1s)**
   - **Condition:** `avg(last_5m):tym2muv.db.slow_query_count > 10`
   - **Severity:** Warning / Critical (> 5s)
   - **Action:** Inspect Supabase Postgres `pg_stat_statements` for unindexed queries using `type: "query"`.

3. **Global Error Rate Spiking (> 1%)**
   - **Condition:** `sum(last_5m):tym2muv.web.error_count / sum:tym2muv.web.request_count > 0.01`
   - **Severity:** Warning (> 1%), Critical (> 5%)
   - **Action:** PagerDuty trigger. Review RUM errors and Logs (`status:error`). Check network timeouts.

4. **Payment Failures Anomalous (> 2%)**
   - **Condition:** `sum(last_15m):tym2muv.business.payment_processed{status:failure} > 5`
   - **Severity:** Critical
   - **Action:** Alert billing team. Check Paystack API status page. 

5. **Supabase Realtime Connections Failing**
   - **Condition:** Websocket drops > 10 in 5 mins.
   - **Severity:** Critical
   - **Action:** Check Supabase Realtime dashboard. Potential tenant quota limits exceeded (Scale up to Pro).

## Debugging Workflow

1. Go to **Datadog RUM -> Sessions**
2. Filter by `userId` or `user.email`.
3. Replay session to view the layout and DOM state right before failure.
4. Open the Logs panel attached to the session trace to find API timeouts or unhandled exceptions.
