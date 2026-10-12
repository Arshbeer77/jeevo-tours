/* Two restrained flourishes, in the spirit of the Lando Norris site:
   kinetic type and quiet physical motion, not decoration for its own sake.

   1. a slow ticker of places Jeevo actually goes
   2. hero buttons that lean very slightly toward the cursor

   Both off for reduced motion; the magnetism is off for touch. */
(function (win, doc) {
  'use strict';

  var reduce = win.matchMedia &&
               win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* real destinations, taken from itineraries Jeevo has operated */
  var PLACES = ['Delhi','Jaipur','Varanasi','Agra','Udaipur','Jodhpur','Jaisalmer',
                'Ranthambore','Khajuraho','Orchha','Kolkata','Munnar','Cochin',
                'Alleppey','Periyar','Madurai','Pondicherry','Kathmandu'];

  /* ---------- 1. the ticker ---------- */
  function ticker() {
    var anchor = doc.querySelector('#destinations') || doc.querySelector('#about');
    if (!anchor || doc.querySelector('.jv-ticker')) return;

    var strip = doc.createElement('div');
    strip.className = 'jv-ticker';
    strip.setAttribute('aria-hidden', 'true');   // decorative; the places are listed properly elsewhere

    /* two identical runs so the loop has no seam */
    var run = PLACES.map(function (p) {
      return '<span class="jv-ticker__item">' + p + '<i></i></span>';
    }).join('');
    strip.innerHTML = '<div class="jv-ticker__rail">' + run + run + '</div>';

    anchor.parentNode.insertBefore(strip, anchor);
  }

  /* ---------- 2. magnetic buttons ----------
     A few pixels of lean, nothing more. Enough to feel responsive under the
     hand; not enough to make anything harder to click. */
  function magnetic() {
    if (reduce) return;
    if (win.matchMedia && win.matchMedia('(pointer: coarse)').matches) return;

    var PULL = 0.22, RADIUS = 90;
    var btns = [].slice.call(doc.querySelectorAll('.hero-btns .jv-origin-btn'));
    if (!btns.length) return;

    btns.forEach(function (b) {
      b.style.willChange = 'transform';
      var raf = null, tx = 0, ty = 0;

      function apply() { raf = null; b.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; }
      function queue() { if (!raf) raf = win.requestAnimationFrame(apply); }

      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        if (Math.abs(dx) > r.width / 2 + RADIUS) return;
        tx = dx * PULL; ty = dy * PULL; queue();
      }, { passive: true });

      b.addEventListener('mouseleave', function () {
        tx = 0; ty = 0;
        b.style.transition = 'transform .45s cubic-bezier(.22,1.2,.36,1)';
        queue();
        win.setTimeout(function () { b.style.transition = ''; }, 460);
      }, { passive: true });
    });
  }

  /* ---------- 3. editorial section numbers ----------
     The loudest thing about the Lando Norris site is scale contrast: an
     enormous element next to a tiny one, and almost nothing in between.
     Each section gets a big numeral against its existing small label. */
  function numbers() {
    var heads = [].slice.call(doc.querySelectorAll('.section-header'));
    if (!heads.length) return;

    heads.forEach(function (h, i) {
      if (h.querySelector('.jv-num')) return;
      var tag = h.querySelector('.section-tag');
      if (!tag) return;

      var n = doc.createElement('span');
      n.className = 'jv-num';
      n.setAttribute('aria-hidden', 'true');       // decorative counting
      n.textContent = String(i + 1).padStart(2, '0');

      var row = doc.createElement('div');
      row.className = 'jv-numrow';
      tag.parentNode.insertBefore(row, tag);
      row.appendChild(n);
      row.appendChild(tag);                        // the small label sits beside it
    });
  }

  function init() { ticker(); magnetic(); numbers(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
