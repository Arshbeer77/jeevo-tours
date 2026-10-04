/* Native scroll snapping keeps swipes fluid without intercepting touch events. */
document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.jv-selector-wrapper');
  if (!track) return;
  const slides = [...track.querySelectorAll('.jv-selector-item')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  track.id = 'journey-slider';
  track.setAttribute('role', 'region');
  track.setAttribute('aria-roledescription', 'carousel');
  track.setAttribute('aria-label', 'Featured journeys');
  track.tabIndex = 0;
  slides.forEach((slide, index) => {
    slide.classList.remove('active');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (index + 1) + ' of ' + slides.length);
    slide.querySelector('a').setAttribute('aria-label', 'Explore ' + slide.querySelector('.jv-selector-item-title').textContent);
  });
  const controls = document.createElement('div');
  controls.className = 'jv-slider-controls';
  controls.innerHTML = '<p class="jv-slider-hint">Find the journey that feels like you.</p>' +
    '<div class="jv-slider-navigation"><button type="button" class="jv-slider-prev" aria-label="Previous journeys" aria-controls="journey-slider">←</button>' +
    '<span class="jv-slider-count" aria-live="polite" aria-atomic="true"></span>' +
    '<button type="button" class="jv-slider-next" aria-label="Next journeys" aria-controls="journey-slider">→</button></div>';
  track.after(controls);
  const previous = controls.querySelector('.jv-slider-prev');
  const next = controls.querySelector('.jv-slider-next');
  const count = controls.querySelector('.jv-slider-count');
  let scheduled = false, settle;
  function update() {
    scheduled = false;
    previous.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    clearTimeout(settle);
    settle = setTimeout(() => {
      const viewport = track.getBoundingClientRect();
      const visible = slides.map((slide, i) => ({ i, r:slide.getBoundingClientRect() }))
        .filter(({r}) => r.left < viewport.right - 24 && r.right > viewport.left + 24);
      if (!visible.length) return;
      const start = visible[0].i + 1, last = visible[visible.length - 1].i + 1;
      count.textContent = (start === last ? start : start + '–' + last) + ' / ' + slides.length;
    }, 150);
  }
  function move(direction) {
    const step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollBy({ left:direction * step, behavior:reduce.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); track.scrollTo({ left:event.key === 'Home' ? 0 : track.scrollWidth, behavior:reduce.matches ? 'instant' : 'smooth' });
    }
  });
  track.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, { passive:true });
  if (window.ResizeObserver) new ResizeObserver(update).observe(track);
  else window.addEventListener('resize', update, { passive:true });
  update();
});
