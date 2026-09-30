# Website → Airtable: the one setup step left

Everything is built and deployed. Forms already work — enquiries go to
`jazzdtrainer@gmail.com` by email. To also have them land in Airtable,
three environment variables need adding in Vercel. That's the whole job.

## What needs doing (≈2 minutes, needs Vercel access)

**Vercel → `jeevo-tours` → Settings → Environment Variables → add:**

| Name | Value |
|---|---|
| `AIRTABLE_TOKEN` | the `pat…` token (sent separately — never commit it) |
| `AIRTABLE_BASE` | `applubpwEol9u8iSs` |
| `AIRTABLE_TABLE` | `Customer Inquiries` |

Then **Deployments → ⋯ on the newest → Redeploy.**
Environment variables only take effect on a fresh build, which is why the
redeploy is needed. Normal code pushes deploy on their own.

## How to check it worked

Submit an enquiry on the live site, then look in the Airtable
**Customer Inquiries** table. A row should appear.

Or from a terminal in this folder:

```bash
AIRTABLE_TOKEN=pat... node check-airtable.js
```

That prints the real table and column names and attempts a test write,
reporting exactly what failed if anything does.

## How submissions are handled

Three routes, tried in order, so an enquiry is never silently lost:

1. `/api/enquiry` → **Airtable** — as soon as the token above is set
2. **Web3Forms** → email to the enquiries inbox — works with no setup
3. `mailto:` → the visitor's own mail client — last resort

So the site is safe to go live before step 1 is done.

## Files

| File | What it is |
|---|---|
| `api/enquiry.js` | Vercel function. Receives the form post, writes to Airtable. Reads the token from the environment — never from the code. |
| `assets/jeevo-forms.js` | Booking + newsletter forms. Holds contact details in one config block at the top. |
| `script.js` | Contact form on the homepage. |
| `dev-server.js` | Runs the site and the function together on :3000 for local testing. |
| `check-airtable.js` | Diagnoses the Airtable connection. |

## Known gaps

- Only four Airtable columns are mapped: **Customer Name, Email, Phone,
  Travel Destination**. Travel dates, budget, traveller count and the
  message are collected but not yet saved — the remaining column names
  need confirming in `api/enquiry.js` (see the `FIELD` map at the top).
- The WhatsApp number on the site is still the placeholder
  `+91 98765 43210`. Every WhatsApp button goes nowhere until it's changed
  in `assets/jeevo-forms.js`.
- The homepage stats (1,200 travellers, 50 destinations, 8 years) are
  placeholders from the original build and are not true.
