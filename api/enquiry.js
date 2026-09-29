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
  'http://localhost:8765'
];

/* ▼ Airtable column names, exactly as spelled in the table ▼ */
const FIELD = {
  name        : 'Customer Name',
  email       : 'Email',
  phone       : 'Phone',
  destination : 'Travel Destination',
  // dates    : 'Travel Dates',
  // people   : 'Number of Travellers',
  // message  : 'Notes',
  // source   : 'Source',
};

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });
  if (!TOKEN) return res.status(500).json({ error: 'AIRTABLE_TOKEN not set in Vercel' });

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

  const fields = {};
  const put = (key, value) => { if (FIELD[key] && value) fields[FIELD[key]] = value; };
  put('name', name);
  put('email', email);
  put('phone', phone);
  put('destination', String(body.destination || body.tour || '').slice(0, 200));
  put('dates',   String(body.travel_dates || body.date || '').slice(0, 120));
  put('people',  String(body.travellers || body.travelers || '').slice(0, 40));
  put('message', String(body.message || body.notes || '').slice(0, 2000));
  put('source',  body.source || 'Website');

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`, {
      method : 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body   : JSON.stringify({ records: [{ fields }], typecast: true })
    });
    const data = await r.json();

    if (!r.ok) {
      /* surfaces "Unknown field name: X" so a wrong column is obvious */
      console.error('[airtable]', r.status, JSON.stringify(data));
      return res.status(502).json({ error: 'Airtable rejected the record', detail: data?.error });
    }
    return res.status(200).json({ ok: true, id: data.records?.[0]?.id });
  } catch (e) {
    console.error('[airtable] request failed', e);
    return res.status(502).json({ error: 'Could not reach Airtable' });
  }
};
