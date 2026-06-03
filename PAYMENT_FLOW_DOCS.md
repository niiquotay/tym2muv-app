# Payment Flow & Idempotency Architecture

This document describes the payment processing lifecycle, focusing on how we prevent double-charging users during network partitions and timeouts.

## Sequence Diagram

1. **User** clicks `Pay` on `PaymentPage`.
2. **Frontend** generates an `idempotencyKey` based on `hash(userId, listingId, amount, timestamp)`.
3. **Frontend** initiates payment via Paystack Inline widget.
4. **Paystack** processes payment and returns a `reference`.
5. **Frontend** calls `process-payment` edge function with `reference` and `idempotencyKey`.
    - If request times out, Frontend applies Exponential Backoff (retries up to 3 times, intervals of 1s, 2s, 4s).
6. **Edge Function (`process-payment`)**:
    - Checks `payment_attempts` using `idempotencyKey`.
    - **Exists & Succeeded**: Returns cached success immediately (prevents duplicate downstream processing).
    - **Not Exists**: Inserts `pending` row into `payment_attempts`.
    - Verifies payment status via Paystack API.
    - Updates `payment_attempts` to `succeeded` or `failed`.
    - If succeeded, updates `properties.is_premium` and inserts `payments` record.
7. **Webhook (`handle-paystack-webhook`)**:
    - Listens for asynchronous `charge.success` or `charge.failed` events.
    - Uses cryptographic signature (`x-paystack-signature`) for authentication.
    - Updates `payment_attempts` status if not already handled.
    - Calls `process_successful_payment` RPC as a fallback mechanism for updating downstream rental_request states if the core edge function dropped.

## Edge Cases Mitigated

- **Double Submitting (`409 Conflict`)**: Idempotency key locks the specific payment context.
- **Client Disconnect Before Verification**: Webhook catches the `charge.success` asynchronously and fulfills the system state.
- **Flaky Internet on Client**: Front-end encapsulates the `process-payment` edge invocation in an exponential backoff loop (`withRetry` core mechanics) to handle 502/504 errors.
