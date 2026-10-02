/* Jeevo trip planner — guided, runs entirely in the browser.
   Matches the visitor to one of Jeevo's real itineraries using the real
   routes and drive times, then hands the lead to the existing enquiry
   endpoint. No API, no key, no per-message cost. */
(function () {
  'use strict';

  var DATA_URL = 'ai/index.json';
  var ENQUIRY  = '/api/enquiry';
  var STORE    = 'jeevo_plan_v1';

  var data = null, answers = {}, step = 0, el = {};

  var STEPS = [
    { key:'region', q:"Where are you drawn to?",
      opts:[ ['Rajasthan','Rajasthan'], ['Kerala & the south','South India'],
             ['Delhi, Agra & Jaipur','Rajasthan'], ['East India & Kolkata','East India'],
             ['India & Nepal','India & Nepal'], ['Vietnam','Vietnam'],
             ["I'm not sure yet",''] ] },
    { key:'nights', q:"Roughly how long have you got?",
      opts:[ ['Under a week','5'], ['About a week','7'], ['Two weeks','14'],
             ['Three weeks or more','19'], ['Not decided',''] ] },
    { key:'party', q:"Who's travelling?",
      opts:[ ['Just the two of us','2 adults'], ['Solo','1 adult'],
             ['Family with children','family'], ['A group of friends','group'],
             ['Larger group / tour','large group'] ] },
    { key:'hotel', q:"What sort of places do you like to stay?",
      opts:[ ['Comfortable & clean','3-star – comfortable'],
             ['A step up','4-star – premium'],
             ['Properly luxurious','5-star – luxury'],
             ['Heritage & palaces','Heritage / palace stays'],
             ['Not fussed','' ] ] },
    { key:'budget', q:"Any rough budget per person? It only changes which hotels we suggest.",
      opts:[ ['Under $2,000','Under $2,000'], ['$2,000 – $3,500','$2,000 – $3,500'],
             ['$3,500 – $5,000','$3,500 – $5,000'], ['$5,000 – $8,000','$5,000 – $8,000'],
             ['$8,000+','$8,000+'], ['Rather not say',''] ] },
  ];

  function save(){ try{ sessionStorage.setItem(STORE, JSON.stringify({answers:answers, step:step})); }catch(e){} }
  function load(){ try{ var r=sessionStorage.getItem(STORE); if(r){ var s=JSON.parse(r); answers=s.answers||{}; step=s.step||0; } }catch(e){} }

  function build(){
    var fab = document.createElement('button');
    fab.className='jv-chat-fab'; fab.type='button';
    fab.setAttribute('aria-label','Plan a trip with us');
    fab.innerHTML='<i class="fas fa-route" aria-hidden="true"></i>';

    var panel=document.createElement('div');
    panel.className='jv-chat-panel'; panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Plan your trip');
    panel.innerHTML=
      '<div class="jv-chat-head">'+
        '<div><h3>Plan your trip</h3><p>A few questions &mdash; takes a minute</p></div>'+
        '<button class="jv-chat-close" type="button" aria-label="Close">&times;</button>'+
      '</div>'+
      '<div class="jv-chat-log" role="log" aria-live="polite"></div>'+
      '<div class="jv-chat-foot"><div class="jv-chat-opts"></div>'+
        '<p class="jv-chat-note">Suggestions come from trips we actually run. A consultant confirms details and pricing.</p>'+
      '</div>';

    document.body.appendChild(fab); document.body.appendChild(panel);
    el.fab=fab; el.panel=panel;
    el.log=panel.querySelector('.jv-chat-log');
    el.opts=panel.querySelector('.jv-chat-opts');
    el.close=panel.querySelector('.jv-chat-close');
  }

  function bubble(html, kind){
    var d=document.createElement('div');
    d.className='jv-chat-msg '+kind;
    if(kind==='plan') d.innerHTML=html; else d.textContent=html;
    el.log.appendChild(d); el.log.scrollTop=el.log.scrollHeight; return d;
  }

  function options(list, onPick){
    el.opts.innerHTML='';
    list.forEach(function(o){
      var b=document.createElement('button');
      b.type='button'; b.className='jv-chat-opt'; b.textContent=o[0];
      b.addEventListener('click', function(){ onPick(o); });
      el.opts.appendChild(b);
    });
  }

  /* pick the closest real itinerary: region first, then trip length */
  function match(){
    if(!data) return null;
    var want=answers.region, nights=Number(answers.nights)||0;
    var pool=data.itineraries.filter(function(i){ return !want || i.region===want; });
    if(!pool.length) pool=data.itineraries.slice();
    pool.sort(function(a,b){
      if(!nights) return b.days-a.days;
      return Math.abs(a.days-nights)-Math.abs(b.days-nights);
    });
    return pool[0];
  }

  function legFor(a,b){
    if(!data) return null;
    for(var i=0;i<data.routes.length;i++){
      var r=data.routes[i];
      if(r.from.toLowerCase()===a.toLowerCase() && r.to.toLowerCase()===b.toLowerCase()) return r;
    }
    return null;
  }

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function showPlan(){
    var it=match();
    if(!it){ bubble("Let's get a consultant onto this one.", 'bot'); return askContact(); }

    /* show the legs that belong to the route we actually display, or a
       customer sees drive times between two places they were never shown */
    var shown = it.route.slice(0, 8);
    var html='<strong>'+esc(it.region)+' &middot; about '+it.days+' days</strong><br><span class="jv-plan-route">';
    html+=shown.map(esc).join(' &rarr; ')+(it.route.length>shown.length?' &rarr; &hellip;':'')+'</span>';

    var legs=[];
    for(var i=0;i<shown.length-1 && legs.length<3;i++){
      var leg=legFor(shown[i], shown[i+1]);
      if(leg){
        var hrs = leg.hours ? ', '+leg.hours+(leg.hours===1?' hr':' hrs') : '';
        legs.push(esc(leg.from)+' to '+esc(leg.to)+' &middot; '+leg.km+'km'+hrs);
      }
    }
    if(legs.length) html+='<br><span class="jv-plan-legs">Real drive times on this route:<br>'+legs.join('<br>')+'</span>';
    if(answers.hotel) html+='<br><span class="jv-plan-legs">Built around '+esc(answers.hotel)+'.</span>';

    bubble("Based on what you've told me, here's the closest trip we actually run:", 'bot');
    bubble(html, 'plan');
    bubble("A consultant can shape this around your dates and confirm pricing. Shall I have someone come back to you?", 'bot');
    askContact();
  }

  function askContact(){
    el.opts.innerHTML=
      '<form class="jv-chat-lead">'+
        '<input name="name"  type="text"  placeholder="Your name" required>'+
        '<input name="email" type="email" placeholder="Email" required>'+
        '<input name="phone" type="tel"   placeholder="Phone (optional)">'+
        '<button type="submit" class="jv-chat-opt is-go">Send it over</button>'+
      '</form>';
    el.opts.querySelector('form').addEventListener('submit', sendLead);
  }

  function sendLead(e){
    e.preventDefault();
    var f=e.target, btn=f.querySelector('button');
    btn.disabled=true; btn.textContent='Sending…';
    var it=match();
    fetch(ENQUIRY,{ method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        name:f.name.value, email:f.email.value, phone:f.phone.value,
        destination: it ? it.region : (answers.region||'Not sure'),
        travellers: answers.party||'', hotel_standard: answers.hotel||'',
        budget: answers.budget||'', nights: answers.nights||'',
        source:'Trip planner',
        message:'Trip planner: '+(it?it.tour+' ('+it.days+' days)':'no match')+
                ' | party: '+(answers.party||'-')+' | hotels: '+(answers.hotel||'-')+
                ' | budget: '+(answers.budget||'-')
      })})
      .then(function(r){ return r.ok; })
      .catch(function(){ return false; })
      .then(function(ok){
        el.opts.innerHTML='';
        bubble(ok ? "Thanks — that's with our team. Someone will come back to you shortly."
                  : "Thanks — we've got your details. If you don't hear back today, email us directly and we'll jump on it.", 'bot');
        try{ sessionStorage.removeItem(STORE); }catch(err){}
      });
  }

  function ask(){
    if(step>=STEPS.length) return showPlan();
    var s=STEPS[step];
    bubble(s.q,'bot');
    options(s.opts, function(o){
      bubble(o[0],'me');
      answers[s.key]=o[1];
      step++; save();
      setTimeout(ask, 260);
    });
  }

  function start(){
    el.log.innerHTML=''; el.opts.innerHTML=''; answers={}; step=0;
    bubble("Hi! Answer a few quick questions and I'll show you the closest trip we actually run.", 'bot');
    setTimeout(ask, 320);
  }

  function open(){
    el.panel.classList.add('is-open'); el.fab.hidden=true;
    if(!el.log.children.length) start();
  }
  function close(){ el.panel.classList.remove('is-open'); el.fab.hidden=false; el.fab.focus(); }

  function init(){
    load(); build();
    el.fab.addEventListener('click', open);
    el.close.addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape' && el.panel.classList.contains('is-open')) close();
    });
    var base=location.pathname.indexOf('/tours/')===0 ? '../' : '';
    fetch(base+DATA_URL).then(function(r){ return r.json(); })
      .then(function(j){ data=j; })
      .catch(function(){ data=null; });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
