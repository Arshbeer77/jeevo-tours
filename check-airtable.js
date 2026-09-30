/* Diagnoses the Airtable connection and says plainly what is wrong.
     AIRTABLE_TOKEN=pat... node check-airtable.js                     */
const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE  = process.env.AIRTABLE_BASE  || 'applubpwEol9u8iSs';
const TABLE = process.env.AIRTABLE_TABLE || 'Customer Inquiries';

(async () => {
  if (!TOKEN) return console.log('\n  ✗ No token. Run:  AIRTABLE_TOKEN=patXXX node check-airtable.js\n');
  console.log(`\n  token  ${TOKEN.slice(0,8)}…  (${TOKEN.length} chars)`);
  console.log(`  base   ${BASE}`);
  console.log(`  table  ${TABLE}\n`);

  // 1. can the token see the base at all?
  const meta = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`,
    { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (meta.ok) {
    const j = await meta.json();
    console.log('  Tables this token can see:');
    j.tables.forEach(t => console.log(`    • ${t.name}`));
    const t = j.tables.find(x => x.name === TABLE || x.id === TABLE);
    if (!t) {
      console.log(`\n  ✗ No table called "${TABLE}". Use one of the names above.\n`);
      return;
    }
    console.log(`\n  Columns in "${t.name}":`);
    t.fields.forEach(f => console.log(`    • ${f.name}   (${f.type})`));
  } else {
    const e = await meta.json().catch(() => ({}));
    console.log(`  (couldn't read schema: ${meta.status} ${e?.error?.message || ''})`);
    console.log('   — that is fine if the token only has data.records:write\n');
  }

  // 2. try an actual write
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`, {
    method : 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body   : JSON.stringify({ records: [{ fields: { 'Customer Name': 'CONNECTION TEST — delete me' } }], typecast: true })
  });
  const out = await r.json();
  if (r.ok) {
    console.log(`\n  ✓ WRITE WORKED — record ${out.records[0].id} created. Delete it in Airtable.\n`);
  } else {
    console.log(`\n  ✗ WRITE FAILED — HTTP ${r.status}`);
    console.log(`    ${out?.error?.type || ''}: ${out?.error?.message || JSON.stringify(out)}\n`);
  }
})();
