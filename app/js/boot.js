/* =============================================================
   boot.js — Router, Theme, Fortschritt, Tastaturkürzel
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var VIEWS = [
    { id: 'learn', label: 'Lernen' },
    { id: 'ref',   label: 'Nachschlagen' },
    { id: 'play',  label: 'Playground' },
    { id: 'train', label: 'Training' },
    { id: 'quiz',  label: 'Quiz' }
  ];

  var built = {};
  var currentView = null;
  var navPill, navBtns = {};

  /* ---------- Router ---------- */
  function go(id) {
    if (!VIEWS.some(function (v) { return v.id === id; })) id = 'learn';
    currentView = id;
    RT.store.set('lastView', id);

    VIEWS.forEach(function (v) {
      var section = document.getElementById('view-' + v.id);
      var on = v.id === id;
      section.classList.toggle('on', on);
      navBtns[v.id].classList.toggle('on', on);
    });

    if (!built[id]) {
      built[id] = true;
      RT.views[id].build(document.getElementById('view-' + id).querySelector('.shell'));
    } else if (RT.views[id].refresh) {
      RT.views[id].refresh();
    }

    movePill();
    /* Textfelder in der frisch sichtbaren Ansicht nachmessen —
       solange sie display:none waren, ließ sich die Höhe nicht ermitteln. */
    requestAnimationFrame(U.regrowAll);
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    window.scrollTo(0, 0);
  }

  function movePill() {
    if (!navPill || !currentView) return;
    var btn = navBtns[currentView];
    if (!btn || !btn.offsetParent) return;
    navPill.style.width = btn.offsetWidth + 'px';
    navPill.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    navPill.classList.add('ready');
  }

  function openInPlayground(cfg) {
    go('play');
    RT.views.play.apply(cfg);
    U.toast('Im Playground geöffnet');
  }

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    var btn = document.getElementById('theme-btn');
    if (btn) {
      var dark = t === 'dark' || (!t && !window.matchMedia('(prefers-color-scheme: light)').matches);
      btn.innerHTML = U.icon(dark ? 'sun' : 'moon');
      btn.title = dark ? 'Helles Design' : 'Dunkles Design';
    }
  }

  function toggleTheme() {
    var cur = RT.store.get('theme');
    var systemDark = !window.matchMedia('(prefers-color-scheme: light)').matches;
    var effective = cur || (systemDark ? 'dark' : 'light');
    var next = effective === 'dark' ? 'light' : 'dark';
    RT.store.set('theme', next);
    applyTheme(next);
  }

  /* ---------- Fortschrittsring ---------- */
  function refreshProgress() {
    var o = RT.store.overall();
    var ring = document.getElementById('ring-fg');
    var num = document.getElementById('ring-n');
    if (!ring) return;
    var r = 14, c = 2 * Math.PI * r;
    ring.setAttribute('stroke-dasharray', c.toFixed(1));
    ring.setAttribute('stroke-dashoffset', (c * (1 - o.pct / 100)).toFixed(1));
    num.textContent = o.pct;
    var host = document.getElementById('ring');
    if (host) {
      host.title = 'Fortschritt ' + o.pct + '%  ·  ' +
        o.leDone + '/' + o.leTotal + ' Kapitel, ' +
        o.exDone + '/' + o.exTotal + ' Aufgaben, ' +
        o.quDone + '/' + o.quTotal + ' Quizfragen';
    }
  }

  /* ---------- Start ---------- */
  function init() {
    /* Navigation aufbauen */
    var nav = document.getElementById('nav');
    navPill = el('span', { class: 'nav-pill' });
    nav.appendChild(navPill);
    VIEWS.forEach(function (v) {
      var b = el('button', { type: 'button', class: 'nav-btn', text: v.label });
      b.addEventListener('click', function () { go(v.id); });
      navBtns[v.id] = b;
      nav.appendChild(b);
    });

    /* Theme */
    applyTheme(RT.store.get('theme'));
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!RT.store.get('theme')) applyTheme(null);
    });

    /* Erste Ansicht: Hash schlägt gespeicherten Zustand */
    var start = location.hash.slice(1) || RT.store.get('lastView') || 'learn';
    go(start);
    refreshProgress();

    window.addEventListener('resize', movePill);
    window.addEventListener('hashchange', function () {
      var id = location.hash.slice(1);
      if (id && id !== currentView) go(id);
    });

    /* Tastatur */
    document.addEventListener('keydown', function (e) {
      var inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        go('ref');
        setTimeout(function () { RT.views.ref.focusSearch(); }, 60);
        return;
      }
      if (e.key === 'Escape' && inField) { document.activeElement.blur(); return; }
      if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= VIEWS.length) go(VIEWS[n - 1].id);
    });

    /* Fortschritt zurücksetzen */
    document.getElementById('reset-btn').addEventListener('click', function () {
      if (!confirm('Gelöste Aufgaben, gelesene Kapitel und Quiz-Ergebnisse verwerfen?')) return;
      RT.store.reset();
      built = {};
      VIEWS.forEach(function (v) {
        var s = document.getElementById('view-' + v.id).querySelector('.shell');
        s.innerHTML = '';
      });
      applyTheme(null);
      go('learn');
      refreshProgress();
      U.toast('Fortschritt zurückgesetzt');
    });

    setTimeout(movePill, 120);
  }

  RT.go = go;
  RT.openInPlayground = openInPlayground;
  RT.refreshProgress = refreshProgress;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
