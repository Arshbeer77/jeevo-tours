/* Tricolour cursor trail — the cursor paints a ribbon that runs saffron,
   white and green along its length, so the flag is the stroke itself
   rather than three separate dots chasing the pointer.

   Off for touch (there is no cursor), off for reduced motion, and the
   loop stops when the pointer stops, so it costs nothing when idle. */
(function () {
  'use strict';

  if (!window.matchMedia) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;          // phones
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SAFFRON = [255, 153, 51];
  var WHITE   = [255, 255, 255];
  var GREEN   = [19, 136, 8];

  var LIFE   = 620;    // ms a point stays visible
  var MAXPTS = 46;
  var WIDTH  = 13;     // px at the head of the stroke
  var IDLE   = 900;    // stop animating this long after the pointer stops

  var pts = [], raf = null, lastMove = 0, cv, ctx, dpr = 1;

  function build() {
    cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;' +
                       'pointer-events:none;z-index:9300';
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    size();
    addEventListener('resize', size, { passive: true });
  }

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width  = Math.floor(innerWidth  * dpr);
    cv.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* saffron at the head, white through the middle, green at the tail */
  function bandAt(t) {
    var a, b, k;
    if (t < 0.5) { a = SAFFRON; b = WHITE; k = t / 0.5; }
    else         { a = WHITE;   b = GREEN; k = (t - 0.5) / 0.5; }
    return [
      Math.round(a[0] + (b[0] - a[0]) * k),
      Math.round(a[1] + (b[1] - a[1]) * k),
      Math.round(a[2] + (b[2] - a[2]) * k),
    ];
  }

  function onMove(e) {
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > MAXPTS) pts.shift();
    lastMove = performance.now();
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function draw() {
    var now = performance.now();
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    while (pts.length && now - pts[0].t > LIFE) pts.shift();

    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      var age  = (now - p.t) / LIFE;            // 0 fresh, 1 gone
      var pos  = 1 - (i / pts.length);          // 0 head, 1 tail
      var rgb  = bandAt(pos);

      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(p.x, p.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      /* Taper gently rather than to nothing. Tapering hard made the tail
         1.5px wide, so the green band - the oldest part of the stroke -
         was barely on screen and the thing did not read as a flag. */
      ctx.lineWidth = WIDTH * (1 - pos * 0.5) * (1 - age * 0.6) + 2;
      ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' +
                        (0.9 * (1 - age) * (1 - pos * 0.15)).toFixed(3) + ')';
      ctx.stroke();
    }

    /* keep going while there is anything left to fade, then sleep */
    if (pts.length || now - lastMove < IDLE) raf = requestAnimationFrame(draw);
    else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  function init() {
    build();
    addEventListener('mousemove', onMove, { passive: true });
    /* a tab switch leaves a frozen streak behind otherwise */
    addEventListener('blur', function () { pts = []; }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pts = [];
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
