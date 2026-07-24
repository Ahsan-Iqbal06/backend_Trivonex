# Website Backend

Standalone Express + TypeScript API service for the website. Handles:

- **Payments** — Easypaisa Mobile Account (MA) transactions
- **Contact form** — sends submissions to your inbox via SMTP

Deployed separately from the TanStack Start frontend; the frontend calls this
service over HTTP (set `CORS_ORIGIN` to your frontend's domain).

## Setup

```bash
npm install
cp .env.example .env   # fill in your real credentials
npm run dev            # starts on http://localhost:4000 with hot reload
```

## Scripts

| Command             | Description                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Run with hot reload (`tsc --watch` + `node --watch`) |
| `npm run build`      | Compile TypeScript to `dist/`             |
| `npm start`          | Run the compiled build (`dist/index.js`)  |
| `npm run typecheck`  | Type-check without emitting output        |

## Environment variables

See `.env.example` for the full list. Required groups:

- `EASYPAISA_*` — from your Easypaisa partner account. `EASYPAISA_STORE_ID` is
  validated and coerced to a number automatically — just put the digits in
  `.env`, no quotes needed. `EASYPAISA_MERCHANT_EWP_ACCOUNT` is your merchant
  EWP Account #, found on the Easypaisa Merchant Portal profile page (this is
  different from the customer's mobile number used per-transaction).
- `SMTP_*` / `CONTACT_FORM_RECEIVER` — for the contact form's outgoing email.

The server refuses to start if any required variable is missing or malformed —
check the console output, it tells you exactly which field failed.

## API

### Payments

```
POST /api/payments/easypaisa/ma/initiate
Body: { "orderId": "order-123", "amount": 1500, "mobileAccountNo": "03xxxxxxxxx", "emailAddress": "customer@example.com" }

GET /api/payments/easypaisa/ma/status/:orderId
```

Flow: call `initiate`, then poll `status` every few seconds until `status` is
`PAID`, `FAILED`, or `EXPIRED` (the customer approves the payment on their phone
in between).

### Contact form

```
POST /api/contact
Body: { "name": "...", "email": "...", "phone": "...", "subject": "...", "message": "..." }
```

### Health check

```
GET /health
```

## Troubleshooting

### "INVALID STORE ID" (responseCode `0006`)

This means Easypaisa's system doesn't recognize `EASYPAISA_STORE_ID` as valid
for the credentials (`EASYPAISA_USERNAME` / `EASYPAISA_PASSWORD`) you sent.
`storeId` is sent as a real number in the request body (not a quoted string),
so a formatting issue is unlikely to be the cause — check these instead, in order:

1. **You're still using a placeholder value.** `EASYPAISA_STORE_ID` must be the
   actual Store ID Easypaisa issued for your merchant account, not the example
   value (`43`) from their documentation.
2. **Store ID / credentials mismatch.** The Store ID must belong to the same
   partner account as the username/password in the `Credentials` header —
   double check these were issued together.
3. **Environment mismatch.** Staging and production have separate Store IDs
   and credentials. Confirm `EASYPAISA_BASE_URL` (staging vs production)
   matches the environment your Store ID / credentials were issued for.

With `NODE_ENV` not set to `production`, `easypaisa-service.ts` logs the exact
outgoing payload and Easypaisa's raw response to the console — check there
first; if the Store ID and payload look correct, the next step is contacting
your Easypaisa integration contact with that logged payload to confirm the
Store ID on their end.

## Project structure

```
app.ts                 Express app factory (middleware, routes, error handling)
index.ts                Entry point — starts the HTTP server
env.ts                   Validated environment variables (zod)
payments.routes.ts        Payment route definitions, mounted under /api/payments
contact.routes.ts          Contact form route, mounted under /api/contact
payments.controller.ts      Payment request handlers
contact.controller.ts        Contact form request handler
easypaisa-service.ts           Easypaisa API client
mailer.service.ts                SMTP mailer client
errorHandler.ts                   404 + centralized error handler
validators.ts                      Zod request validation schemas
rateLimiters.ts                     Rate limiting config
apiError.ts                          Custom API error class
```

## Notes

- The `EASYPAISA_BASE_URL` in `.env.example` is Easypaisa's **staging** URL,
  confirmed working from their integration guide. Confirm the exact production
  URL with your Easypaisa account manager before going live — it wasn't
  explicitly documented for the REST v4 endpoints.
- Payment state is currently kept in an in-memory `Map` in
  `payments.controller.ts` as a placeholder — swap this for your real database
  before going to production, since in-memory state is lost on every restart
  and won't work if you ever run more than one instance.
- Both the payment-initiation and contact-form endpoints are rate-limited to
  reduce abuse; tune the limits in `rateLimiters.ts` as needed.
- Dev/debug logging in `easypaisa-service.ts` is automatically suppressed when
  `NODE_ENV=production`.
