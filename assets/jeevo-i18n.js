/* ---------------------------------------------------------------
   Language switcher. Swaps the interface strings only - navigation,
   headings and buttons. Detailed itineraries stay in English and the
   switcher says so rather than leaving people to discover it.
   --------------------------------------------------------------- */
(function (win, doc) {
  'use strict';
  var LANGS = win.JV_I18N || {}, S = win.JV_STRINGS || {};
  var KEY = 'jeevo_lang';

  function pick() {
    try { var sv = win.localStorage.getItem(KEY); if (sv && LANGS[sv]) return sv; } catch (e) {}
    /* fall back to the browser's own preference before defaulting to English */
    var navLangs = win.navigator.languages || [win.navigator.language || 'en'];
    for (var i = 0; i < navLangs.length; i++) {
      var base = String(navLangs[i]).toLowerCase().split('-')[0];
      if (LANGS[base]) return base;
    }
    return 'en';
  }

  function apply(lang) {
    if (!LANGS[lang]) lang = 'en';
    var nodes = doc.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-i18n');
      var row = S[k];
      if (!row) continue;
      nodes[i].textContent = row[lang] || row.en;
    }
    doc.documentElement.setAttribute('lang', lang);
    doc.documentElement.setAttribute('dir', LANGS[lang].dir);
    /* right-to-left needs the page mirrored, but never the logo or the photos */
    doc.documentElement.classList.toggle('jv-rtl', LANGS[lang].dir === 'rtl');
    try { win.localStorage.setItem(KEY, lang); } catch (e) {}
    var note = doc.querySelector('.jv-lang-note');
    if (note && S['i18n.note']) note.textContent = lang === 'en' ? '' : (S['i18n.note'][lang] || '');
    var cur = doc.querySelector('.jv-lang-current');
    if (cur) cur.textContent = LANGS[lang].name;
  }

  function build() {
    var host = doc.querySelector('.nav-container');
    if (!host || doc.querySelector('.jv-lang')) return;

    var wrap = doc.createElement('div');
    wrap.className = 'jv-lang';
    var opts = '';
    for (var code in LANGS) {
      opts += '<option value="' + code + '">' + LANGS[code].name + '</option>';
    }
    wrap.innerHTML =
      '<label class="jv-sr-only" for="jv-lang-select">' +
        ((S['i18n.label'] && S['i18n.label'].en) || 'Language') + '</label>' +
      '<span class="jv-lang-globe" aria-hidden="true">&#127760;</span>' +
      '<select id="jv-lang-select" class="jv-lang-select">' + opts + '</select>' +
      '<span class="jv-lang-current" aria-hidden="true"></span>';

    var toggle = host.querySelector('.nav-toggle');
    if (toggle) host.insertBefore(wrap, toggle); else host.appendChild(wrap);

    var sel = wrap.querySelector('select');
    sel.addEventListener('change', function () { apply(sel.value); });
    return sel;
  }

  function init() {
    var sel = build();
    var lang = pick();
    if (sel) sel.value = lang;
    apply(lang);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
