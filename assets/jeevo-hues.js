/* Page hues — the background drifts through a warm Indian palette as you
   move down the page: marigold at the top, through sandstone and tea, to
   the deep indigo of the contact section.

   Deliberately faint. It should read as the page having a mood, not as
   coloured blocks; if a visitor notices it as a feature it is too strong. */
(function (win, doc) {
  'use strict';

  var HUES = {
    home              : '255,196,  0',   // marigold
    about             : '244,162, 97',   // sandstone
    destinations      : '231,111, 81',   // terracotta
    'interactive-tours': '42,157,143',   // tea green
    gallery           : '233,196,106',   // turmeric
    testimonials      : '244,162, 97',
    contact           : ' 38, 70, 83',   // indigo
  };
  var STRENGTH = 0.07;          // alpha at full strength
  var DEFAULT  = '255,196,0';

  function init() {
    var sections = [].slice.call(doc.querySelectorAll('section[id]'))
      .filter(function (s) { return HUES[s.id]; });
    if (!sections.length) return;

    var wash = doc.createElement('div');
    wash.className = 'jv-hue';
    wash.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(wash);

    var reduce = win.matchMedia &&
                 win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) wash.style.transition = 'none';

    var current = null;
    function paint(rgb) {
      if (rgb === current) return;          // avoid restarting the transition
      current = rgb;
      wash.style.background =
        'radial-gradient(120% 80% at 50% 0%, rgba(' + rgb + ',' + STRENGTH + ') 0%,' +
        ' rgba(' + rgb + ',' + (STRENGTH * 0.45).toFixed(3) + ') 45%,' +
        ' rgba(' + rgb + ',0) 100%)';
    }
    paint(DEFAULT);

    /* Whichever section covers the middle of the screen owns the colour.
       Watching entry alone made the hue flip early on tall sections. */
    if (!win.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (e) {
        if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      });
      if (best) paint(HUES[best.target.id]);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5, 1] });

    sections.forEach(function (s) { io.observe(s); });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
