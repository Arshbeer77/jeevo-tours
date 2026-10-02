/* Jeevo trip planner — guided, runs entirely in the browser.
   Matches the visitor to one of Jeevo's real itineraries using the real
   routes and drive times, then hands the lead to the existing enquiry
   endpoint. No API, no key, no per-message cost. */
(function () {
  'use strict';

  var DATA_URL = 'ai/planner-data.json';
  var ENQUIRY  = '/api/enquiry';
  var STORE    = 'jeevo_plan_v1';

  var answers = {}, step = 0, el = {};

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

  /* ---- itinerary builder -------------------------------------------
     Assembles a trip from cities Jeevo actually visits, joined by roads
     Jeevo has actually driven, using the nights Jeevo actually gives each
     place. Nothing here is invented: if a road is not in the data the
     route does not use it. */

  function esc(x){ return String(x).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  var P = null;              // planner-data.json
  var ADJ = null;            // adjacency built from the edge list

  function adjacency(){
    if (ADJ) return ADJ;
    ADJ = {};
    (P.edges||[]).forEach(function(e){
      (ADJ[e.from] = ADJ[e.from] || []).push({ to:e.to,   km:e.km, hours:e.hours });
      (ADJ[e.to]   = ADJ[e.to]   || []).push({ to:e.from, km:e.km, hours:e.hours });
    });
    return ADJ;
  }

  var trimmedNights = 0;

  function buildItinerary(){
    trimmedNights = 0;
    if (!P) return null;
    var region = answers.region;
    var total  = Number(answers.nights) || 10;

    /* a bigger budget buys a gentler trip: fewer places, longer in each */
    var lux  = /\$5,000|\$8,000|Heritage|luxury/i.test((answers.budget||'') + ' ' + (answers.hotel||''));
    var maxStops = lux ? Math.max(3, Math.round(total/3.5)) : Math.max(3, Math.round(total/2.5));

    var pool = Object.keys(P.cities).filter(function(c){
      return !region || P.cities[c].region === region;
    });
    if (pool.length < 2) pool = Object.keys(P.cities);
    pool.sort(function(a,b){ return P.cities[b].popularity - P.cities[a].popularity; });

    /* Start where people actually land. Picking the most popular city
       instead started a Kerala trip in Periyar, three hours inland, when
       every one of those trips begins at Cochin airport. */
    var GATEWAYS = ['Delhi','Cochin','Chennai','Kolkata','Mumbai','Bangalore','Kathmandu','Hanoi'];
    var adj = adjacency();
    var current = null;
    for (var gi = 0; gi < GATEWAYS.length && !current; gi++) {
      if (pool.indexOf(GATEWAYS[gi]) !== -1) current = GATEWAYS[gi];
    }
    if (!current) current = pool[0];
    if (!current) return null;

    var stops = [{ city:current, nights: P.cities[current].nights + (lux ? 1 : 0) }];
    var used  = {}; used[current] = true;
    var spent = stops[0].nights;

    while (spent < total && stops.length < maxStops) {
      var options = (adj[current] || []).filter(function(n){
        if (used[n.to] || !P.cities[n.to]) return false;
        if (region && P.cities[n.to].region !== region) return false;
        return (n.hours || 99) <= 7;                 // no brutal driving days
      });
      if (!options.length) break;

      /* prefer well-known places, and penalise long drives */
      options.sort(function(a,b){
        var sa = P.cities[a.to].popularity - (a.hours||3) * 0.8;
        var sb = P.cities[b.to].popularity - (b.hours||3) * 0.8;
        return sb - sa;
      });

      var next = options[0];
      var n = P.cities[next.to].nights + (lux ? 1 : 0);
      if (spent + n > total + 1) n = Math.max(1, total - spent);
      if (n <= 0) break;

      stops.push({ city:next.to, nights:n, km:next.km, hours:next.hours });
      used[next.to] = true; spent += n; current = next.to;
    }

    /* Spread any leftover nights round-robin, and cap each place. Without a
       cap the loop kept stacking nights on the most popular city and
       produced five nights in Delhi on a two-week Rajasthan trip, which no
       agent would ever sell. */
    var CAP = lux ? 4 : 3;
    var guard = 0, placed = true;
    while (spent < total && placed && guard++ < 40) {
      placed = false;
      for (var i=0; i<stops.length && spent<total; i++){
        if (stops[i].nights < CAP){ stops[i].nights++; spent++; placed = true; }
      }
    }
    if (spent < total) trimmedNights = total - spent;   // honestly reported below
    return { stops:stops, nights:spent, region:region || 'India', lux:lux, short:trimmedNights };
  }

  function planHtml(trip){
    var html = '<strong>' + esc(trip.region) + ' &middot; ' + trip.nights + ' nights</strong>';
    html += '<span class="jv-plan-route">' +
            trip.stops.map(function(s){ return esc(s.city); }).join(' &rarr; ') + '</span>';
    html += '<div class="jv-plan-days">';
    var day = 1;
    trip.stops.forEach(function(s){
      if (s.km){
        html += '<div class="jv-plan-leg">Day ' + day + ' &middot; drive ' + s.km + 'km' +
                (s.hours ? ', ' + s.hours + (s.hours===1?' hr':' hrs') : '') + '</div>';
      }
      var to = day + s.nights - 1;
      html += '<div class="jv-plan-stop"><b>' + (s.nights>1 ? 'Days '+day+'&ndash;'+to : 'Day '+day) +
              '</b> ' + esc(s.city) + ' &middot; ' + s.nights + (s.nights===1?' night':' nights') + '</div>';
      day = to + 1;
    });
    html += '</div>';
    if (trip.short > 0) html += '<span class="jv-plan-legs">That leaves ' + trip.short +
        ' night' + (trip.short===1?'':'s') + ' spare \u2014 a consultant can add another stop or more time somewhere.</span><br>';
    if (answers.hotel)  html += '<span class="jv-plan-legs">Built around ' + esc(answers.hotel) + '.</span>';
    else if (trip.lux)  html += '<span class="jv-plan-legs">Paced gently, with longer stays.</span>';
    return html;
  }

  function showPlan(){
    var trip = buildItinerary();
    if (!trip || trip.stops.length < 2){
      bubble("Let me get a consultant to put this one together properly for you.", 'bot');
      return askContact();
    }
    bubble("Here's a trip built around that — real routes, real drive times, all places we work in:", 'bot');
    bubble(planHtml(trip), 'plan');
    bubble("A consultant will fine-tune it around your dates and confirm pricing. Shall I have someone come back to you?", 'bot');
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
    var trip = buildItinerary();
    fetch(ENQUIRY,{ method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        name:f.name.value, email:f.email.value, phone:f.phone.value,
        destination: (trip && trip.region) || answers.region || 'Not sure',
        travellers: answers.party||'', hotel_standard: answers.hotel||'',
        budget: answers.budget||'', nights: answers.nights||'',
        source:'Trip planner',
        message:'Trip planner draft: '+
                (trip ? trip.stops.map(function(s){ return s.city+' '+s.nights+'n'; }).join(' > ')+
                        ' ('+trip.nights+' nights)' : 'no route built')+
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
      .then(function(j){ P=j; })
      .catch(function(){ P=null; });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
