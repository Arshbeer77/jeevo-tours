# Jeevo — last-minute items before launch

Launch: **11 October 2026**. Working through these one at a time with Aaron.
Nothing here blocks the site functioning — it all works. These are the things
that would embarrass us or cost us a lead once real people are looking.

---

## 1. The WhatsApp button goes to a fake number
**Where:** homepage (bottom CTA) + all 6 tour pages + the form success message.
**Now:** `wa.me/919876543210` — an Indian placeholder, like a 555 number.
**Effect:** a customer clicks "WhatsApp Us", gets a dead chat, assumes the
business is broken, goes elsewhere.

**Decision needed:** whose number answers the business?
- Have one → one line in `assets/jeevo-forms.js` (`whatsapp` + `phoneDisplay`), fixes all 7 pages
- Don't → remove the buttons. Forms, email and Arjun still cover contact.

Parked: Aaron doesn't yet know whose number to use.

---

## 2. The homepage claims numbers that aren't true
`1,200 Happy Travelers · 50 Destinations · 8 Years Experience`, on an agency
that has not opened. It is the first thing a visitor reads, and it is a
false-representation risk.

**Options:** make them true, or replace with things that are
("Family-run · 40+ itineraries · India, Nepal & Vietnam").

---

## 3. Where did the India itineraries come from?
14 of the 22 Word documents were created by "Save As" from one Spanish file
(`INDIA -TRIÁNGULO CON VARANASI WITH PUSHKAR.docx`), and several still have
Spanish text inside. One Europe PDF contains the word **Europamundo**, a
Spanish tour wholesaler.

Holding a wholesaler's brochure is completely normal. Republishing its wording
as ours is not. Arjun writes his own prose, so nothing is being copied today —
but we should know the answer before a customer asks.

**Needs:** a straight answer from Aaron's brother.

---

## 4. Real customers' names are in the repo
11 files in `Itenaries/` are named after real travellers — BARKLEM, HARISH
PANDEY, MAHESHWARI LAL, SHAH FAMILY, SONIA SAHEJA, NAVEEN KUMAR, AMRPAL SINGH,
LYDIA AKNOLA, CHHAVI — and contain their trips.

They are excluded from everything customer-facing and the repo is private, so
nothing is exposed. But if this repo is ever made public, that is other
people's personal data. Worth moving out of the repo entirely.

---

## 5. The abandoned CRM folder should go
`crm/` is a half-built FastAPI app that was never deployed (its URL 404s). It
has `allow_origins=["*"]` and no admin authentication. It does nothing now,
but it is a working blueprint for an insecure service sitting in the repo.

**Suggested:** delete it. The Airtable CRM replaced it.

---

## 6. `bookings@jeevotours.com` may not be a real inbox
It appears on the site as a contact address. Enquiries go to
`jazzdtrainer@gmail.com`. If nobody reads the bookings address, anyone who
emails it is talking to nothing.

**Needs:** confirm it exists, or remove it.

---

## 7. Wikimedia images need attribution
The photos replacing the earlier mismatched stock images come from Wikimedia
under licences that require credit. A small credits line in the footer covers it.

---

## 8. Vercel's free plan is non-commercial (not urgent)
The Hobby plan's terms exclude commercial use. Once the business is taking
money it should be on Pro (~$20/month). Nothing breaks before then — just
don't let it be a surprise.

---

## Done, don't redo
- Airtable CRM — all 16 fields land, `dropped: []` verified
- Arjun — live, free tier, no card
- Itinerary generator — real routes and drive times
- Source tracking — Website form / Arjun (chat) / Arjun (trip planner)
- Conversation carries across pages
- FTO folders + researched Australian list — on the Desktop
