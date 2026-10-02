/* ============================================================
   POST /api/enquiry  →  Airtable
   Runs on Vercel. The Airtable token lives in Vercel's
   environment variables and never reaches the browser.
   ============================================================ */

const BASE  = process.env.AIRTABLE_BASE  || 'applubpwEol9u8iSs';
const TABLE = process.env.AIRTABLE_TABLE || 'Customer Inquiries';
const TOKEN = process.env.AIRTABLE_TOKEN;

/* Only these origins may post here. */
const ALLOWED = [
  'https://jeevo-tours.vercel.app',
  'https://www.jeevotours.com',      // kept so the forms keep working the
  'https://jeevotours.com',          // day the real domain is pointed here
  'http://localhost:3000',
  'http://localhost:8765',
  'http://localhost:8899'
];

/* ▼ Airtable column names, exactly as spelled in the table ▼ */
const FIELD = {
  name        : 'Customer Name',
  email       : 'Email',
  phone       : 'Phone',
  destination : 'Travel Destination',
  reason      : 'Enquiry Type',
  month       : 'Travel Month',
  dates       : 'Travel Dates',
  nights      : 'Nights',
  adults      : 'Adults',
  children    : 'Children',
  people      : 'Number of Travellers',
  hotel       : 'Hotel Standard',
  budget      : 'Budget Per Person',
  flights     : 'Flights Needed',
  message     : 'Notes',
  source      : 'Source',
};


/* Airtable rejects the whole record if any field name is wrong. Rather than
   lose the lead, drop the offending field and try again — so a mis-named
   column costs that one value, never the enquiry. */
async function writeRecord(BASE, TABLE, TOKEN, fields) {
  /* Airtable rejects the WHOLE record if one column name is wrong, so on an
     "unknown field" error we drop that field and retry. The budget has to
     cover every field we might send, otherwise a table that is missing
     several columns loses the enquiry entirely instead of degrading. */
  const budget  = Object.keys(fields).length + 2;
  const dropped = [];

  for (let attempt = 0; attempt < budget; attempt++) {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`, {
      method : 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body   : JSON.stringify({ records: [{ fields }], typecast: true })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, data, dropped };

    const msg = data?.error?.message || '';
    const bad = /Unknown field name:\s*"?([^"]+)"?/i.exec(msg);
    if (bad && fields[bad[1]] !== undefined) {
      dropped.push(bad[1]);
      delete fields[bad[1]];
      if (Object.keys(fields).length === 0) return { ok: false, data, dropped };
      continue;
    }
    return { ok: false, data, dropped };
  }
  return { ok: false, data: { error: { message: 'too many unknown fields' } }, dropped };
}


module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  /* a bot filling every field, including the hidden one, gets a polite 200 */
  if (body.company) return res.status(200).json({ ok: true });

  const name  = String(body.name  || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const phone = String(body.phone || '').trim().slice(0, 40);
  if (!name && !email && !phone) {
    return res.status(400).json({ error: 'Need at least a name, email or phone' });
  }

  /* checked after validation so bad input is rejected the same way
     whether or not the token happens to be configured */
  if (!TOKEN) return res.status(500).json({ error: 'AIRTABLE_TOKEN not set in Vercel' });

  const fields = {};
  const put = (key, value) => { if (FIELD[key] && value) fields[FIELD[key]] = value; };
  put('name', name);
  put('email', email);
  put('phone', phone);
  put('destination', String(body.destination || body.tour || '').slice(0, 200));
  put('reason',  String(body.reason || '').slice(0, 120));
  put('month',   String(body.travel_month || body.month || '').slice(0, 40));
  put('dates',   String(body.travel_dates || body.date || '').slice(0, 120));
  put('nights',  String(body.nights || '').slice(0, 10));
  put('adults',  String(body.adults || '').slice(0, 10));
  put('children',String(body.children || '').slice(0, 10));
  put('people',  String(body.travellers || body.travelers || '').slice(0, 40));
  put('hotel',   String(body.hotel_standard || body.hotel || '').slice(0, 60));
  put('budget',  String(body.budget || '').slice(0, 60));
  put('flights', String(body.flights || '').slice(0, 40));
  put('message', String(body.message || body.notes || '').slice(0, 2000));
  put('source',  body.source || 'Website form');

  try {
    const out = await writeRecord(BASE, TABLE, TOKEN, fields);
    if (!out.ok) {
      console.error('[airtable]', JSON.stringify(out.data));
      return res.status(502).json({ error: 'Airtable rejected the record', detail: out.data?.error });
    }
    return res.status(200).json({ ok: true, id: out.data.records?.[0]?.id, dropped: out.dropped });
  } catch (e) {
    console.error('[airtable] request failed', e);
    return res.status(502).json({ error: 'Could not reach Airtable' });
  }
};
