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
    fab.innerHTML='<i class="fas fa-route" aria-hidden="true"></i><span>Plan my trip</span>';

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
        '<div class="jv-chat-row" hidden>'+
          '<textarea class="jv-chat-input" rows="1" placeholder="Or just tell me what you\'re after\u2026" maxlength="1200" aria-label="Your message"></textarea>'+
          '<button class="jv-chat-send" type="button" aria-label="Send"><i class="fas fa-paper-plane" aria-hidden="true"></i></button>'+
        '</div>'+
        '<p class="jv-chat-note">Suggestions come from trips we actually run. A consultant confirms details and pricing.</p>'+
      '</div>';

    document.body.appendChild(fab); document.body.appendChild(panel);
    el.fab=fab; el.panel=panel;
    el.log=panel.querySelector('.jv-chat-log');
    el.opts=panel.querySelector('.jv-chat-opts');
    el.close=panel.querySelector('.jv-chat-close');
    el.row=panel.querySelector('.jv-chat-row');
    el.input=panel.querySelector('.jv-chat-input');
    el.send=panel.querySelector('.jv-chat-send');
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
    el.row.hidden = true;
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

  /* ---- conversational mode ------------------------------------------
     Tries the assistant first. If it is not configured, rate limited or
     down it returns 503 and we drop into the guided questions instead,
     which need no key and always work. The visitor is told once, plainly,
     and never sees a dead end. */
  var botOff = false, history = [], sending = false;

  function dots(on){
    var d = el.log.querySelector('.jv-chat-dots');
    if(!on){ if(d) d.remove(); return; }
    if(d) return;
    d=document.createElement('div'); d.className='jv-chat-dots';
    d.innerHTML='<i></i><i></i><i></i>';
    el.log.appendChild(d); el.log.scrollTop=el.log.scrollHeight;
  }

  function fallToGuided(explain){
    botOff = true;
    el.row.hidden = true;
    if(explain) bubble("Let me ask you a few quick questions instead — it only takes a minute.", 'bot');
    /* the opening question is already on screen from start(); re-asking
       it here printed it twice */
    if(step === 0 && el.opts.children.length) return;
    setTimeout(ask, 320);
  }

  function sendText(){
    var text=(el.input.value||'').trim();
    if(!text || sending || botOff) return;
    el.input.value=''; el.input.style.height='auto';
    bubble(text,'me'); history.push({role:'user',content:text});
    sending=true; el.send.disabled=true; dots(true);

    fetch('/api/chat',{ method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages: history }) })
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
      .then(function(res){
        sending=false; el.send.disabled=false; dots(false);
        if(res.ok && res.j.reply){
          bubble(res.j.reply,'bot');
          history.push({role:'assistant',content:res.j.reply});
          if(res.j.done){ el.row.hidden=true; askContact(); }
          return;
        }
        /* only the first failure switches modes; after that we would be
           yanking the conversation away from someone mid-sentence */
        bubble("Sorry \u2014 I lost my train of thought there. Let me ask you a few quick things instead.", 'bot');
        fallToGuided(false);
      })
      .catch(function(){
        sending=false; el.send.disabled=false; dots(false);
        bubble("Sorry \u2014 I couldn't reach our planner just then. Let me ask you a few quick things instead.", 'bot');
        fallToGuided(false);
      });
  }

  function ask(){
    if(step>=STEPS.length) return showPlan();
    var s=STEPS[step];
    bubble(s.q,'bot');
    options(s.opts, function(o){
      el.row.hidden = true;
      bubble(o[0],'me');
      answers[s.key]=o[1];
      step++; save();
      setTimeout(ask, 260);
    });
  }

  /* Decide the mode before showing anything. With the assistant connected
     this is a plain chat and no buttons appear at all; without it, the
     guided questions. Typing "hi" and being handed a form is worse than
     either. */
  function start(){
    el.log.innerHTML=''; el.opts.innerHTML=''; answers={}; step=0; history=[]; botOff=false;
    el.row.hidden = true;

    fetch('/api/chat').then(function(r){ return r.json(); }).catch(function(){ return {ready:false}; })
      .then(function(st){
        if(st && st.ready){
          botOff = false;
          el.row.hidden = false;
          bubble("Hi! I'm here to help you plan a trip \u2014 ask me anything, or just tell me what you're thinking.", 'bot');
          setTimeout(function(){ el.input.focus(); }, 80);
        } else {
          botOff = true;
          bubble("Hi! Answer a few quick questions and I'll build you an itinerary.", 'bot');
          setTimeout(ask, 320);
        }
      });
  }

  function open(){
    if(el.teaser && el.teaser.parentNode){ el.teaser.remove(); }
    markTeased();
    el.fab.classList.remove('is-new');
    el.panel.classList.add('is-open'); el.fab.hidden=true;
    if(!el.log.children.length) start();
  }
  function close(){ el.panel.classList.remove('is-open'); el.fab.hidden=false; el.fab.focus(); }

  /* One nudge, six seconds in, dismissible, and never shown twice in a
     session. Anything more insistent than that reads as a pop-up and
     people close the tab rather than the bubble. */
  var TEASED = 'jeevo_teased_v1';
  function teased(){ try{ return sessionStorage.getItem(TEASED)==='1'; }catch(e){ return false; } }
  function markTeased(){ try{ sessionStorage.setItem(TEASED,'1'); }catch(e){} }

  function teaser(){
    if(teased() || el.panel.classList.contains('is-open')) return;
    var t=document.createElement('div');
    t.className='jv-chat-teaser';
    t.innerHTML='<button class="jv-chat-teaser-x" type="button" aria-label="No thanks">&times;</button>'+
                "Planning a trip to India? <b>I'll build you an itinerary</b> in about a minute — free, no obligation.";
    t.addEventListener('click', function(e){
      if(e.target.classList.contains('jv-chat-teaser-x')){ markTeased(); t.remove(); return; }
      markTeased(); t.remove(); open();
    });
    document.body.appendChild(t);
    el.teaser = t;
    setTimeout(function(){ if(t.parentNode && !teased()){ markTeased(); t.remove(); } }, 16000);
  }

  function init(){
    load(); build();
    /* anything on the page can open the chat: data-jv-chat on a button or link */
    document.querySelectorAll('[data-jv-chat]').forEach(function(n){
      n.addEventListener('click', function(e){ e.preventDefault(); open(); });
    });
    if(!teased()){
      el.fab.classList.add('is-new');
      setTimeout(teaser, 6000);
    }
    el.fab.addEventListener('click', open);
    el.close.addEventListener('click', close);
    el.send.addEventListener('click', sendText);
    el.input.addEventListener('keydown', function(e){
      if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendText(); }
    });
    el.input.addEventListener('input', function(){
      el.input.style.height='auto';
      el.input.style.height=Math.min(el.input.scrollHeight,110)+'px';
    });
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
