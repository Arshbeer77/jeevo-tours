/* ============================================================
   POST /api/enquiry  →  Airtable     (Cloudflare Pages version)

   Same job as api/enquiry.js, which is the Vercel version.
   Both can sit in the repo; each host only runs its own.
     Vercel      reads  /api/*
     Cloudflare  reads  /functions/api/*
   ============================================================ */

const ALLOWED = [
  'https://jeevo-tours.vercel.app',
  'https://jeevotours.com',
  'https://www.jeevotours.com',
  'http://localhost:8765',
  'http://localhost:3000'
];

/* ▼ Airtable column names, exactly as spelled in the table ▼ */
const FIELD = {
  name        : 'Customer Name',
  email       : 'Email',
  phone       : 'Phone',
  destination : 'Travel Destination',
  // dates    : 'Travel Dates',
  // budget   : 'Budget Range',
  // people   : 'Number of Travellers',
  // message  : 'Notes',
};

function cors(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (ALLOWED.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}


/* Airtable rejects the whole record if any field name is wrong. Rather than
   lose the lead, drop the offending field and try again — so a mis-named
   column costs that one value, never the enquiry. */
async function writeRecord(BASE, TABLE, TOKEN, fields) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`, {
      method : 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body   : JSON.stringify({ records: [{ fields }], typecast: true })
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, data, dropped: [] };

    const msg = data?.error?.message || '';
    const bad = /Unknown field name:\s*"?([^"]+)"?/i.exec(msg);
    if (bad && fields[bad[1]] !== undefined) {
      delete fields[bad[1]];
      if (Object.keys(fields).length === 0) return { ok: false, data };
      continue;                       // try again without it
    }
    return { ok: false, data };
  }
  return { ok: false, data: { error: { message: 'too many unknown fields' } } };
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: cors(context.request.headers.get('Origin') || '') });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin  = request.headers.get('Origin') || '';
  const headers = cors(origin);
  const reply   = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers });

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  if (body.company) return reply({ ok: true });          // honeypot

  const name  = String(body.name  || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const phone = String(body.phone || '').trim().slice(0, 40);
  if (!name && !email && !phone) {
    return reply({ error: 'Need at least a name, email or phone' }, 400);
  }

  const TOKEN = env.AIRTABLE_TOKEN;
  const BASE  = env.AIRTABLE_BASE  || 'applubpwEol9u8iSs';
  const TABLE = env.AIRTABLE_TABLE || 'Customer Inquiries';
  if (!TOKEN) return reply({ error: 'AIRTABLE_TOKEN not set in Cloudflare' }, 500);

  const fields = {};
  const put = (k, v) => { if (FIELD[k] && v) fields[FIELD[k]] = v; };
  put('name', name);
  put('email', email);
  put('phone', phone);
  put('destination', String(body.destination || body.tour || '').slice(0, 200));
  put('dates',   String(body.travel_dates || body.date || '').slice(0, 120));
  put('budget',  String(body.budget || '').slice(0, 80));
  put('people',  String(body.travellers || body.travelers || '').slice(0, 40));
  put('message', String(body.message || body.notes || '').slice(0, 2000));

  try {
    const out = await writeRecord(BASE, TABLE, TOKEN, fields);
    if (!out.ok) return reply({ error: 'Airtable rejected the record', detail: out.data?.error }, 502);
    return reply({ ok: true, id: out.data.records?.[0]?.id });
  } catch (e) {
    return reply({ error: 'Could not reach Airtable' }, 502);
  }
}
