/* ---------------------------------------------------------------
   Drives the mask that uncovers the flag pattern under the heading.

   Two layers, each easing toward the cursor at its own rate, so the
   patch has some weight to it rather than snapping. The radius opens
   and closes rather than popping. On a touch screen there is no
   cursor, so it drifts along a slow path of its own instead.
   --------------------------------------------------------------- */
(function (win, doc) {
  'use strict';

  var R_MAX   = 230;    // open radius, px - the zone is the whole section now
  var EASE    = [0.14, 0.075];   // front layer catches up faster than the trail
  var R_EASE  = 0.1;
  var SPEED_R = 46;     // how much a fast cursor widens the circle

  function init() {
    var zone = doc.querySelector('.jv-selector-section');
    if (!zone) return;

    var fine = !win.matchMedia || win.matchMedia('(hover:hover)').matches;
    var still = win.matchMedia && win.matchMedia('(prefers-reduced-motion:reduce)').matches;

    zone.classList.add('jv-ripple-zone');

    var layers = [];
    for (var i = 0; i < 2; i++) {
      var el = doc.createElement('div');
      el.className = 'jv-reveal' + (i ? ' jv-reveal--trail' : '');
      el.setAttribute('aria-hidden', 'true');
      zone.insertBefore(el, zone.firstChild);
      layers.push({ el: el, x: 0, y: 0 });
    }

    var tx = 0, ty = 0, tr = 0, r = 0;
    var px = 0, py = 0, speed = 0;
    var raf = null, t0 = 0;

    function size() { return zone.getBoundingClientRect(); }

    function frame(now) {
      /* how fast is the cursor moving? a quick flick opens the circle wider */
      var dx = tx - px, dy = ty - py;
      var d = Math.sqrt(dx * dx + dy * dy);
      speed += (Math.min(d, 60) - speed) * 0.12;
      px = tx; py = ty;

      var want = tr > 0 ? tr + speed / 60 * SPEED_R : 0;
      r += (want - r) * R_EASE;

      for (var i = 0; i < layers.length; i++) {
        var L = layers[i];
        L.x += (tx - L.x) * EASE[i];
        L.y += (ty - L.y) * EASE[i];
        L.el.style.setProperty('--mx', L.x.toFixed(1) + 'px');
        L.el.style.setProperty('--my', L.y.toFixed(1) + 'px');
        L.el.style.setProperty('--jv-r', (r * (i ? 1.25 : 1)).toFixed(1) + 'px');
      }

      /* stop the loop once it has closed and settled - no idle rAF */
      if (tr === 0 && r < 0.6) { r = 0; paintZero(); raf = null; return; }
      raf = win.requestAnimationFrame(frame);
    }
    function paintZero() {
      for (var i = 0; i < layers.length; i++) layers[i].el.style.setProperty('--jv-r', '0px');
    }
    function start() { if (raf === null) raf = win.requestAnimationFrame(frame); }

    if (fine) {
      zone.addEventListener('pointermove', function (e) {
        var b = size();
        tx = e.clientX - b.left + 60;   /* layer is inset -60px */
        ty = e.clientY - b.top  + 60;
        start();
      }, { passive: true });
      zone.addEventListener('pointerenter', function () { tr = R_MAX; start(); });
      zone.addEventListener('pointerleave', function () { tr = 0; start(); });
    } else if (!still) {
      /* no cursor: let it wander on its own so the section is not dead */
      var b0 = size();
      tx = b0.width / 2 + 60; ty = b0.height / 2 + 60; tr = R_MAX * 0.8;
      t0 = win.performance ? win.performance.now() : Date.now();
      (function wander(now) {
        var b = size();
        var t = ((now || 0) - t0) / 1000;
        tx = b.width  * (0.5 + 0.3 * Math.sin(t * 0.21)) + 60;
        ty = b.height * (0.5 + 0.26 * Math.sin(t * 0.33 + 1.1)) + 60;
        start();
        win.requestAnimationFrame(wander);
      })(t0);
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
