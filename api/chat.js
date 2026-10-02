/* Jeevo planning assistant.
   Answers from Jeevo's own itineraries. Never prices, never visa/health advice.
   Rules live in ai/system-prompt.md; trip data in ai/index.json. */

const fs   = require('fs');
const path = require('path');

const KEY   = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CHAT_MODEL || 'claude-sonnet-5';

/* Caps. This is a paid endpoint open to the internet, so every one matters. */
const MAX_TURNS     = 24;    // messages in one conversation
const MAX_CHARS     = 1500;  // per message
const MAX_TOKENS    = 1100;  // per reply
const MAX_MATCHES   = 3;     // full itineraries pulled in

const ALLOWED = [
  'https://jeevo-tours.vercel.app',
  'https://www.jeevotours.com',
  'https://jeevotours.com',
  'http://localhost:3000',
  'http://localhost:8899',
];

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

/* Visitors say "Kerala" or "Golden Triangle"; the itineraries say "Munnar"
   and "Fatehpur Sikri". Without this map a Kerala enquiry scores zero on
   every Kerala tour and duration alone decides, which returned Vietnam. */
const ALIASES = {
  kerala:        ['cochin','munnar','alleppey','periyar','kumarakom','kovalam','trivandrum'],
  backwaters:    ['alleppey','kumarakom'],
  rajasthan:     ['jaipur','jodhpur','udaipur','jaisalmer','bikaner','ranakpur','bundi'],
  'golden triangle': ['delhi','agra','jaipur'],
  'taj mahal':   ['agra'],
  'south india': ['madurai','tanjore','chennai','mahabalipuram','pondicherry','ooty','mysore'],
  nepal:         ['kathmandu'],
  vietnam:       ['hanoi','saigon','halong'],
  varanasi:      ['varanasi'],
  ganges:        ['varanasi','haridwar'],
  tigers:        ['ranthambore'],
  wildlife:      ['ranthambore','periyar'],
  temples:       ['khajuraho','madurai','tanjore','varanasi'],
  pilgrimage:    ['varanasi','haridwar','ayodhya','rameshwaram'],
  yatra:         ['varanasi','haridwar','ayodhya','rameshwaram'],
  beaches:       ['kovalam','goa'],
};

function pickItineraries(text, k) {
  const t = text.toLowerCase();

  /* expand what they said into the place names the documents actually use */
  const wanted = new Set();
  for (const [word, places] of Object.entries(ALIASES)) {
    if (t.includes(word)) places.forEach(p => wanted.add(p));
  }

  const nights = Number((t.match(/(\d{1,2})\s*(?:nights?|days?)/) || [])[1]) || 0;

  const scored = k.index.itineraries.map(it => {
    let score = 0;
    const route = it.route.map(r => r.toLowerCase());

    /* a named place is the strongest signal there is */
    for (const place of route) {
      if (place.length > 3 && t.includes(place)) score += 10;
      for (const w of wanted) if (place.includes(w)) { score += 8; break; }
    }
    if (t.includes(it.region.toLowerCase())) score += 10;

    /* duration only separates tours that already matched on place */
    if (nights && score > 0) score += Math.max(0, 3 - Math.abs(it.days - nights) / 3);
    return { it, score };
  });

  return scored.filter(s => s.score >= 8)
               .sort((a, b) => b.score - a.score)
               .slice(0, MAX_MATCHES)
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
  if (req.method !== 'POST')    return res.status(405).json({ error: 'POST only' });
  if (!KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length) return res.status(400).json({ error: 'No messages' });
  if (incoming.length > MAX_TURNS) {
    return res.status(429).json({
      error: 'conversation_too_long',
      reply: "We've covered a lot here. Let me get a consultant to pick this up — what's the best email for you?",
    });
  }

  const messages = incoming.slice(-MAX_TURNS).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, MAX_CHARS),
  })).filter(m => m.content);

  const k = knowledge();
  const said = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  const matches = pickItineraries(said, k);

  /* The rules, the tour index and the road-leg table are byte-identical on
     every message of every conversation - roughly 4,800 tokens re-sent each
     time. Marking that block cacheable means it is read back cheaply instead
     of charged in full on each turn. The matched itineraries sit outside the
     cached block because they change as the conversation narrows. */
  const system = [
    {
      type: 'text',
      text: k.rules +
        '\n\n## Jeevo itineraries (summary)\n' + JSON.stringify(k.index.itineraries) +
        '\n\n## Road legs Jeevo has operated (real distances and drive times)\n' +
        JSON.stringify(k.index.routes),
      cache_control: { type: 'ephemeral' },
    },
  ];
  if (matches.length) {
    /* Once the conversation has settled on a region these matches stop
       changing, so this block is worth caching too - it is the larger of
       the two by far. If the visitor switches region the cache simply
       misses for that turn, which costs no more than not caching at all. */
    system.push({
      type: 'text',
      text: '\n## Closest matching itineraries, in full\n' + JSON.stringify(matches),
      cache_control: { type: 'ephemeral' },
    });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method : 'POST',
      headers: {
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[chat]', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: 'assistant_unavailable' });
    }
    const reply = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    return res.status(200).json({ reply, usage: data.usage });
  } catch (e) {
    console.error('[chat] request failed', e);
    return res.status(502).json({ error: 'assistant_unavailable' });
  }
};
