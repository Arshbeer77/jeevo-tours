/* ============================================================
   /api/*  ->  the Vercel deployment
   ------------------------------------------------------------
   Cloudflare Pages serves the site; the two API routes stay where
   they are. chat.js reads the ai/ folder off disk with fs, which the
   Workers runtime has no equivalent for, so porting it is a real job
   rather than a rename. Forwarding costs one hop and keeps Arjun and
   the Airtable enquiry flow working exactly as they do today.

   Same-origin from the browser's point of view, so no CORS involved.
   When the functions are eventually ported, delete this file.
   ============================================================ */

const ORIGIN = 'https://jeevo-tours.vercel.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const target = ORIGIN + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.set('host', 'jeevo-tours.vercel.app');
  headers.set('origin', ORIGIN);          // satisfies the allow-list on the other side

  const res = await fetch(target, {
    method  : request.method,
    headers,
    body    : ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  });

  /* strip the upstream CORS headers - this is same-origin now */
  const out = new Headers(res.headers);
  out.delete('access-control-allow-origin');
  out.delete('vary');
  return new Response(res.body, { status: res.status, headers: out });
}
