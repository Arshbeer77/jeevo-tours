/* Adapted from the supplied Hyperiux immersive navigation reference. */
(function () {
  'use strict';
  const scriptURL = document.currentScript.src;
  const asset = name => new URL(name, scriptURL).href;
  const home = new URL('../index.html', scriptURL);
  const onHome = !location.pathname.includes('/tours/');
  const route = hash => onHome ? hash : home.href + hash;
  function init() {
    const trigger = document.getElementById('navToggle');
    if (!trigger || !window.HTMLDialogElement) return;
    const menu = document.createElement('dialog');
    menu.id = 'jeevo-menu';
    menu.className = 'jv-menu';
    menu.setAttribute('aria-label', 'Explore Jeevo');
    const links = [['Home','#home'],['Our story','#about'],['Destinations','#destinations'],['Journeys','#interactive-tours'],['Gallery','#gallery'],['Traveler stories','#testimonials'],['Let’s plan a trip','#contact']];
    const markup = links.map(([label, hash], index) => {
      const chars = [...label].map((char, i) => '<span style="--char:'+i+'">'+(char === ' ' ? '&nbsp;' : char)+'</span>').join('');
      return '<li style="--row:'+index+'"><a href="'+route(hash)+'"><span class="jv-menu-number" aria-hidden="true">0'+(index+1)+'</span><span class="jv-sr-only">'+label+'</span><span class="jv-menu-letters" aria-hidden="true">'+chars+'</span><span class="jv-menu-arrow" aria-hidden="true">↗</span></a></li>';
    }).join('');
    const photo = (file, name, caption, href, alt) => '<a href="'+new URL('../tours/'+href,scriptURL).href+'"><img src="'+asset('img/'+file+'-640.webp')+'" alt="'+alt+'" loading="lazy" width="640" height="800"><span><small>'+caption+'</small>'+name+' <b aria-hidden="true">↗</b></span></a>';
    menu.innerHTML = '<div class="jv-menu-header"><a class="jv-menu-brand" href="'+route('#home')+'"><img src="'+asset('jeevo-logo.svg')+'" alt="Jeevo Tours and Travels" width="150" height="66"></a><button class="jv-menu-close" type="button" aria-label="Close menu"><span>Close</span><i aria-hidden="true"></i></button></div>'+
      '<div class="jv-menu-content"><div class="jv-menu-kicker"><span>India & beyond</span><span>Made for your kind of journey</span></div><div class="jv-menu-grid"><nav aria-label="Main navigation"><ol>'+markup+'</ol></nav><aside class="jv-menu-discover" aria-label="Featured journeys"><p>A few places to begin.</p><div class="jv-menu-photos">'+
      photo('taj-mahal','Golden Triangle','7 days · Heritage','golden-triangle.html','Taj Mahal in Agra')+
      photo('kerala-backwaters','Kerala Paradise','10 days · Slow travel','kerala-paradise.html','Palm-lined Kerala backwaters')+
      '</div></aside></div><div class="jv-menu-footer"><span>Local knowledge. Personal journeys.</span><a href="'+route('#contact')+'">Talk to our team <span aria-hidden="true">↗</span></a></div></div>';
    document.body.appendChild(menu);
    trigger.innerHTML = '<span class="jv-menu-trigger-label">Menu</span><span class="jv-menu-trigger-lines" aria-hidden="true"><i></i><i></i></span>';
    trigger.setAttribute('aria-controls', menu.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-label', 'Open menu');
    document.documentElement.classList.add('jv-navigation-ready');
    // Leave mobile forms and slider controls unobstructed by floating buttons.
    if (window.IntersectionObserver) {
      const visible = new Set();
      const quiet = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
        document.documentElement.classList.toggle('jv-controls-in-view', visible.size > 0);
      });
      document.querySelectorAll('#interactive-tours, #contact, #booking').forEach(el => quiet.observe(el));
    }
    const closeButton = menu.querySelector('.jv-menu-close');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer, closing = false, savedOverflow = '', savedBodyOverflow = '';
    function open() {
      if (menu.open) return;
      clearTimeout(timer); closing = false;
      savedOverflow = document.documentElement.style.overflow;
      savedBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('jv-menu-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.showModal();
      menu.querySelector('.jv-menu-content').scrollTop = 0;
      closeButton.focus({ preventScroll:true });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (menu.open && !closing) menu.classList.add('is-open');
      }));
    }
    function close(after) {
      if (!menu.open || closing) return;
      closing = true; menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      timer = setTimeout(() => {
        menu.close();
        document.documentElement.style.overflow = savedOverflow;
        document.body.style.overflow = savedBodyOverflow;
        document.documentElement.classList.remove('jv-menu-open');
        closing = false;
        trigger.focus({ preventScroll:true });
        if (after) after();
      }, reduce.matches ? 0 : 420);
    }
    trigger.addEventListener('click', open);
    closeButton.addEventListener('click', () => close());
    menu.addEventListener('cancel', event => { event.preventDefault(); close(); });
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...menu.querySelectorAll('a[href], button')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    menu.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); const url = new URL(link.href);
      close(() => {
        const target = url.pathname === location.pathname || (onHome && url.pathname === home.pathname)
          ? document.getElementById(url.hash.slice(1)) : null;
        if (target) {
          history.pushState(null, '', url.hash);
          target.scrollIntoView({ behavior:reduce.matches ? 'instant' : 'smooth', block:'start' });
          const hadTabindex = target.hasAttribute('tabindex');
          if (!hadTabindex) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll:true });
          if (!hadTabindex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once:true });
        } else location.assign(url.href);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
