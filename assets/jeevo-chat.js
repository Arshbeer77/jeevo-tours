/* Jeevo planning assistant — chat widget.
   Builds its own markup, so a page only needs to load this file. */
(function () {
  'use strict';

  var ENDPOINT = '/api/chat';
  var MAX_CHARS = 1500;
  var STORE = 'jeevo_chat_v1';
  var OPENER = "Hi! I can help you shape a trip to India — where are you drawn to, and roughly when were you thinking?";

  var history = [];      // [{role, content}] sent to the server
  var busy = false;
  var el = {};

  /* sessionStorage can throw outright in private mode, so never trust it */
  function load() {
    try {
      var raw = sessionStorage.getItem(STORE);
      if (raw) history = JSON.parse(raw) || [];
    } catch (e) { history = []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-24))); } catch (e) {}
  }

  function build() {
    var fab = document.createElement('button');
    fab.className = 'jv-chat-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Plan a trip with us');
    fab.innerHTML = '<i class="fas fa-comment-dots" aria-hidden="true"></i>';

    var panel = document.createElement('div');
    panel.className = 'jv-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Plan a trip');
    panel.innerHTML =
      '<div class="jv-chat-head">' +
        '<div><h3>Plan your trip</h3><p>Tell us what you have in mind</p></div>' +
        '<button class="jv-chat-close" type="button" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="jv-chat-log" role="log" aria-live="polite"></div>' +
      '<div class="jv-chat-foot">' +
        '<div class="jv-chat-row">' +
          '<textarea class="jv-chat-input" rows="1" placeholder="Kerala for 10 days in March…" ' +
            'maxlength="' + MAX_CHARS + '" aria-label="Your message"></textarea>' +
          '<button class="jv-chat-send" type="button" aria-label="Send">' +
            '<i class="fas fa-paper-plane" aria-hidden="true"></i></button>' +
        '</div>' +
        '<p class="jv-chat-note">Itineraries are a draft — a consultant confirms the details and pricing.</p>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    el.fab = fab;
    el.panel = panel;
    el.log = panel.querySelector('.jv-chat-log');
    el.input = panel.querySelector('.jv-chat-input');
    el.send = panel.querySelector('.jv-chat-send');
    el.close = panel.querySelector('.jv-chat-close');
  }

  function bubble(text, kind) {
    var d = document.createElement('div');
    d.className = 'jv-chat-msg ' + kind;
    d.textContent = text;
    el.log.appendChild(d);
    el.log.scrollTop = el.log.scrollHeight;
    return d;
  }

  function dots(on) {
    var existing = el.log.querySelector('.jv-chat-dots');
    if (!on) { if (existing) existing.remove(); return; }
    if (existing) return;
    var d = document.createElement('div');
    d.className = 'jv-chat-dots';
    d.innerHTML = '<i></i><i></i><i></i>';
    el.log.appendChild(d);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function render() {
    el.log.innerHTML = '';
    if (!history.length) { bubble(OPENER, 'bot'); return; }
    history.forEach(function (m) { bubble(m.content, m.role === 'user' ? 'me' : 'bot'); });
  }

  function open() {
    el.panel.classList.add('is-open');
    el.fab.hidden = true;
    render();
    setTimeout(function () { el.input.focus(); }, 60);
  }
  function close() {
    el.panel.classList.remove('is-open');
    el.fab.hidden = false;
    el.fab.focus();
  }

  function setBusy(on) {
    busy = on;
    el.send.disabled = on;
    el.input.disabled = on;
    dots(on);
  }

  function send() {
    var text = (el.input.value || '').trim();
    if (!text || busy) return;

    el.input.value = '';
    el.input.style.height = 'auto';
    bubble(text, 'me');
    history.push({ role: 'user', content: text });
    save();
    setBusy(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        setBusy(false);
        if (res.j && res.j.reply) {
          bubble(res.j.reply, 'bot');
          history.push({ role: 'assistant', content: res.j.reply });
          save();
          return;
        }
        if (!res.ok) throw new Error((res.j && res.j.error) || 'failed');
      })
      .catch(function () {
        setBusy(false);
        bubble('Sorry — I could not reach our planner just then. You can use the enquiry form below and a consultant will come straight back to you.', 'err');
      });
  }

  function wire() {
    el.fab.addEventListener('click', open);
    el.close.addEventListener('click', close);
    el.send.addEventListener('click', send);

    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    el.input.addEventListener('input', function () {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 110) + 'px';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.panel.classList.contains('is-open')) close();
    });
  }

  function init() { load(); build(); wire(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
