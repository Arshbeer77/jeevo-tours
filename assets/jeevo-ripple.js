/* ---------------------------------------------------------------
   Moves the mask that uncovers the flag pattern under the heading.
   One element, two custom properties, batched to a frame.
   --------------------------------------------------------------- */
(function (win, doc) {
  'use strict';

  function init() {
    var zone = doc.querySelector('.jv-selector-header');
    if (!zone) return;
    /* a coarse pointer has no cursor to reveal anything with */
    if (win.matchMedia && !win.matchMedia('(hover:hover)').matches) return;

    zone.classList.add('jv-ripple-zone');

    var layer = doc.createElement('div');
    layer.className = 'jv-reveal';
    layer.setAttribute('aria-hidden', 'true');
    zone.insertBefore(layer, zone.firstChild);

    var pending = null, px = 0, py = 0;

    function paint() {
      pending = null;
      layer.style.setProperty('--mx', px + 'px');
      layer.style.setProperty('--my', py + 'px');
    }

    zone.addEventListener('pointermove', function (e) {
      var r = zone.getBoundingClientRect();
      /* the layer is inset -40px, so its own origin sits 40px out */
      px = e.clientX - r.left + 40;
      py = e.clientY - r.top  + 40;
      if (pending === null) pending = win.requestAnimationFrame(paint);
    }, { passive: true });

    zone.addEventListener('pointerenter', function () { zone.classList.add('is-live'); });
    zone.addEventListener('pointerleave', function () { zone.classList.remove('is-live'); });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
