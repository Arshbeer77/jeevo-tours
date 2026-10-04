/* Shared scroll motion: one passive listener, compositor-only progress, one-shot reveals. */
(function(win,doc){
  'use strict';
  function init(){
    const reduce=win.matchMedia('(prefers-reduced-motion: reduce)');
    const bar=doc.createElement('div');
    bar.className='jv-progress';bar.setAttribute('aria-hidden','true');
    bar.style.width='100%';bar.style.transformOrigin='left';
    doc.body.appendChild(bar);
    let queued=false;
    function update(){
      queued=false;
      const max=doc.documentElement.scrollHeight-win.innerHeight;
      bar.style.transform='scaleX('+(max>0?Math.max(0,Math.min(1,win.scrollY/max)):0)+')';
    }
    function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
    win.addEventListener('scroll',schedule,{passive:true});
    win.addEventListener('resize',schedule,{passive:true});
    update();
    const targets=[...doc.querySelectorAll('.dest-card,.testimonial-card,.gallery-item,.section-header,.highlight-item')];
    if(reduce.matches||!win.IntersectionObserver)return;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in');io.unobserve(entry.target);}});
    },{rootMargin:'0px 0px 60px 0px',threshold:0});
    targets.forEach((target,index)=>{
      if(target.getBoundingClientRect().top<win.innerHeight)return;
      target.classList.add('jv-rise');
      target.style.transitionDelay=(index%3)*45+'ms';
      io.observe(target);
    });
    reduce.addEventListener('change',()=>{
      if(reduce.matches){targets.forEach(t=>t.classList.add('is-in'));io.disconnect();}
    });
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
