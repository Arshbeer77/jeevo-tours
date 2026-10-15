/* Sideways rail for the travellers section.
   CSS scroll-snap does the scrolling; this only drives the arrows and
   hides them at each end. Touch devices never see the arrows - they swipe. */
(function (doc) {
  'use strict';
  function init(wrap) {
    var rail = wrap.querySelector('.testimonials-grid');
    var prev = wrap.querySelector('.jv-rail-btn--prev');
    var next = wrap.querySelector('.jv-rail-btn--next');
    if (!rail || !prev || !next) return;

    function step() {
      var card = rail.querySelector('.testimonial-card');
      if (!card) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }
    function sync() {
      /* The rail carries horizontal padding so the card shadows are not
         clipped, which means scrollLeft starts at the padding value, not 0.
         Measure it rather than guessing, plus 2px for sub-pixel widths. */
      var slack = (parseFloat(getComputedStyle(rail).paddingLeft) || 0) + 2;
      prev.disabled = rail.scrollLeft <= slack;
      next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - slack;
    }
    prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { rail.scrollBy({ left:  step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
  function boot() {
    var w = doc.querySelectorAll('.jv-rail-wrap');
    for (var i = 0; i < w.length; i++) init(w[i]);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(document);
