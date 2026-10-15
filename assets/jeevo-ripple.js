/* ---------------------------------------------------------------
   Flag-colour ripple under "Find your next journey".
   Pointer-driven, scoped to one block, and deliberately cheap:
   a single glow element plus a capped pool of expanding rings.
   --------------------------------------------------------------- */
(function (win, doc) {
  'use strict';

  var SPAWN_MS   = 95;   // never more than ~10 rings a second
  var MIN_TRAVEL = 26;   // and only once the cursor has actually moved
  var MAX_LIVE   = 7;    // hard cap, so a frantic cursor cannot pile them up
  var TINTS = ['jv-ripple--saffron', 'jv-ripple--white', 'jv-ripple--green'];

  function init() {
    var zone = doc.querySelector('.jv-selector-header');
    if (!zone) return;

    /* a coarse pointer has nothing to follow, and reduced motion means no rings */
    if (win.matchMedia && !win.matchMedia('(hover:hover)').matches) return;
    var still = win.matchMedia && win.matchMedia('(prefers-reduced-motion:reduce)').matches;

    zone.classList.add('jv-ripple-zone');

    var glow = doc.createElement('div');
    glow.className = 'jv-ripple-glow';
    glow.setAttribute('aria-hidden', 'true');
    zone.insertBefore(glow, zone.firstChild);

    var lastT = 0, lastX = 0, lastY = 0, tint = 0, live = 0;
    var pending = null;

    function move(e) {
      var r = zone.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;

      /* the glow only ever writes two custom properties, batched to a frame */
      if (pending === null) {
        pending = win.requestAnimationFrame(function () {
          pending = null;
          glow.style.setProperty('--mx', x + 'px');
          glow.style.setProperty('--my', y + 'px');
        });
      }

      if (still) return;

      var now = e.timeStamp || Date.now();
      var dx = x - lastX, dy = y - lastY;
      if (now - lastT < SPAWN_MS) return;
      if (dx * dx + dy * dy < MIN_TRAVEL * MIN_TRAVEL) return;
      if (live >= MAX_LIVE) return;
      lastT = now; lastX = x; lastY = y;

      var ring = doc.createElement('span');
      ring.className = 'jv-ripple ' + TINTS[tint++ % TINTS.length];
      ring.style.left = x + 'px';
      ring.style.top  = y + 'px';
      ring.setAttribute('aria-hidden', 'true');
      zone.appendChild(ring);
      live++;
      ring.addEventListener('animationend', function () {
        if (ring.parentNode) ring.parentNode.removeChild(ring);
        live--;
      });
    }

    zone.addEventListener('pointerenter', function () { zone.classList.add('is-live'); });
    zone.addEventListener('pointerleave', function () { zone.classList.remove('is-live'); });
    zone.addEventListener('pointermove', move, { passive: true });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
