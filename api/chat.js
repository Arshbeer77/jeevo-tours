/* Jeevo planning assistant — Google AI Studio (Gemini) free tier.
   No card required. If the key is missing, rate-limited or the call fails,
   the browser falls back to the offline guided planner, so the widget
   always works.

   PRIVACY: names, emails and phone numbers are never sent here. The
   conversation is only about places, dates and budgets; contact details
   go straight to /api/enquiry and into Airtable without passing through
   any model. Free tiers of these services generally train on what they
   receive, so the fix is not to send it. */

const fs   = require('fs');
const path = require('path');

const KEY  = process.env.GEMINI_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* Google renames these models regularly and a stale name fails the whole
   call, so ask the API which ones this key can actually use and pick a
   flash-class one. Cached for the life of the instance; one extra request
   on a cold start, none afterwards. CHAT_MODEL overrides it entirely. */
let MODEL_CACHE = process.env.CHAT_MODEL || null;

async function pickModel() {
  if (MODEL_CACHE) return MODEL_CACHE;
  const r = await fetch(`${BASE}/models?key=${encodeURIComponent(KEY)}`);
  if (!r.ok) throw Object.assign(new Error('list_models'), { status: r.status });
  const j = await r.json();
  const usable = (j.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''));

  const prefer = [
    n => /flash/.test(n) && /2\.5|3/.test(n) && !/lite|preview|thinking|image|tts/.test(n),
    n => /flash/.test(n) && !/lite|preview|image|tts/.test(n),
    n => /flash/.test(n),
    () => true,
  ];
  for (const test of prefer) {
    const hit = usable.find(test);
    if (hit) { MODEL_CACHE = hit; return hit; }
  }
  throw Object.assign(new Error('no_model'), { status: 404 });
}

const MAX_TURNS = 20;
const MAX_CHARS = 1200;
const MAX_OUT   = 900;

const ALLOWED = [
  'https://jeevo-tours.vercel.app',
  'https://www.jeevotours.com',
  'https://jeevotours.com',
  'http://localhost:3000',
  'http://localhost:8899',
];

/* Anything that looks like contact details should not reach the model.
   The widget does not send them, but a visitor can always type one in. */
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/g;
function scrub(s) {
  return String(s).replace(EMAIL, '[email removed]').replace(PHONE, '[number removed]');
}

let CACHE = null;
function knowledge() {
  if (CACHE) return CACHE;
  const dir = path.join(process.cwd(), 'ai');
  CACHE = {
    rules: fs.readFileSync(path.join(dir, 'system-prompt.md'), 'utf8'),
    index: JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')),
    full:  JSON.parse(fs.readFileSync(path.join(dir, 'itineraries-full.json'), 'utf8')),
  };
  return CACHE;
}

const ALIASES = {
  kerala:['cochin','munnar','alleppey','periyar','kumarakom','kovalam','trivandrum'],
  backwaters:['alleppey','kumarakom'],
  rajasthan:['jaipur','jodhpur','udaipur','jaisalmer','bikaner','ranakpur','bundi'],
  'golden triangle':['delhi','agra','jaipur'], 'taj mahal':['agra'],
  'south india':['madurai','tanjore','chennai','mahabalipuram','pondicherry','ooty','mysore'],
  nepal:['kathmandu'], vietnam:['hanoi','saigon','halong'],
  ganges:['varanasi','haridwar'], tigers:['ranthambore'], wildlife:['ranthambore','periyar'],
  temples:['khajuraho','madurai','tanjore','varanasi'],
  pilgrimage:['varanasi','haridwar','ayodhya','rameshwaram'],
  yatra:['varanasi','haridwar','ayodhya','rameshwaram'],
};

function pickItineraries(text, k, max) {
  const t = text.toLowerCase();
  const wanted = new Set();
  for (const [w, places] of Object.entries(ALIASES)) if (t.includes(w)) places.forEach(p => wanted.add(p));
  const nights = Number((t.match(/(\d{1,2})\s*(?:nights?|days?)/) || [])[1]) || 0;

  return k.index.itineraries.map(it => {
    let score = 0;
    for (const place of it.route.map(r => r.toLowerCase())) {
      if (place.length > 3 && t.includes(place)) score += 10;
      for (const w of wanted) if (place.includes(w)) { score += 8; break; }
    }
    if (t.includes(it.region.toLowerCase())) score += 10;
    if (nights && score > 0) score += Math.max(0, 3 - Math.abs(it.days - nights) / 3);
    return { it, score };
  }).filter(s => s.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => k.full.find(f => f.tour === s.it.tour))
    .filter(Boolean);
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  /* Cheap readiness probe. The widget asks this when it opens so it can
     show a real chat when there is a brain behind it, and the guided
     questions when there is not - rather than letting someone type "hi"
     and get pushed into a form. Checks the env var only; costs nothing. */
  if (req.method === 'GET') return res.status(200).json({ ready: !!KEY });

  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });
  /* 503 rather than 500: the widget treats it as "use the offline planner" */
  if (!KEY) return res.status(503).json({ error: 'assistant_unavailable', reason: 'no_key' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length) return res.status(400).json({ error: 'No messages' });
  if (incoming.length > MAX_TURNS) {
    return res.status(200).json({
      reply: "We've covered plenty here — let me pass this to a consultant who can finish it off properly. Pop your details in below and someone will come back to you.",
      done: true,
    });
  }

  const messages = incoming.slice(-MAX_TURNS)
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: scrub(m.content).slice(0, MAX_CHARS) }))
    .filter(m => m.text);

  const k = knowledge();
  const said = messages.filter(m => m.role === 'user').map(m => m.text).join(' ');
  const matches = pickItineraries(said, k, 2);

  const system =
    k.rules +
    '\n\n## Jeevo itineraries (summary)\n' + JSON.stringify(k.index.itineraries) +
    '\n\n## Road legs Jeevo has operated (real distances and drive times)\n' + JSON.stringify(k.index.routes) +
    (matches.length ? '\n\n## Closest matching itineraries, in full\n' + JSON.stringify(matches) : '') +
    '\n\n## Contact details\nNever ask for a name, email or phone number. The website collects those separately. If someone offers them, thank them and say the form below will pass them on.';

  try {
    const model = await pickModel();
    const r = await fetch(`${BASE}/models/${model}:generateContent?key=` + encodeURIComponent(KEY), {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { maxOutputTokens: MAX_OUT, temperature: 0.7 },
      }),
    });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      /* 429 is the free-tier daily cap; the widget falls back silently */
      console.error('[chat]', model, r.status, JSON.stringify(data).slice(0, 400));
      if (r.status === 404 || r.status === 400) MODEL_CACHE = process.env.CHAT_MODEL || null; // re-pick next time
      return res.status(503).json({
        error: 'assistant_unavailable',
        reason: r.status === 429 ? 'rate_limited' : 'upstream',
        upstream: r.status, model,
      });
    }

    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '').join('').trim();
    if (!reply) return res.status(503).json({ error: 'assistant_unavailable', reason: 'empty' });

    return res.status(200).json({ reply });
  } catch (e) {
    console.error('[chat] request failed', e && e.message, e && e.status);
    return res.status(503).json({
      error: 'assistant_unavailable',
      reason: e && e.message === 'list_models' ? 'key_rejected' : 'network',
      upstream: (e && e.status) || null,
    });
  }
};
