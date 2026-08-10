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
  var currentSub = null;
  var navPill, navBtns = {};
  var helpNode = null;
  var helpReturnFocus = null;
  var updateNode = null;
  var reloadingForUpdate = false;
  var routingDepth = 0;
  var historyRouteScheduled = false;

  /* ---------- Routing ---------- */
  function parseHash(hash) {
    var raw = (hash || location.hash || '').replace(/^#\/?/, '');
    if (!raw) return { view: null, sub: null };
    var slash = raw.indexOf('/');
    if (slash === -1) return { view: raw, sub: null };
    var encoded = raw.slice(slash + 1);
    var sub;
    try { sub = decodeURIComponent(encoded); } catch (e) { sub = encoded; }
    return { view: raw.slice(0, slash), sub: sub || null };
  }

  function hashFor(view, sub) {
    return sub ? view + '/' + encodeURIComponent(sub) : view;
  }

  function writeRoute(view, sub, mode) {
    var target = '#' + hashFor(view, sub);
    if (location.hash === target) return;
    if (mode === 'push') history.pushState(null, '', target);
    else history.replaceState(null, '', target);
  }

  function focusViewHeading() {
    var section = document.getElementById('view-' + currentView);
    if (!section) return;
    var h = section.querySelector('.page-head h1, .shell h1');
    if (h) h.setAttribute('tabindex', '-1');
    if (h) h.focus({ preventScroll: true });
  }

  function go(id, sub, options) {
    options = options || {};
    var historyMode = options.history || 'push';
    if (!VIEWS.some(function (v) { return v.id === id; })) id = 'learn';
    var requestedSub = sub || null;
    currentView = id;
    currentSub = requestedSub;
    RT.store.set('lastView', id);

    VIEWS.forEach(function (v) {
      var section = document.getElementById('view-' + v.id);
      var on = v.id === id;
      section.classList.toggle('on', on);
      navBtns[v.id].classList.toggle('on', on);
      navBtns[v.id].setAttribute('aria-current', on ? 'page' : 'false');
    });

    routingDepth++;
    try {
      var wasBuilt = !!built[id];
      if (!wasBuilt) {
        built[id] = true;
        RT.views[id].build(document.getElementById('view-' + id).querySelector('.shell'));
      } else if (RT.views[id].refresh) {
        RT.views[id].refresh();
      }

      /* build() darf seine Standard-Unterseite kanonisieren. Ein expliziter
         Deep Link wird anschließend genau einmal geöffnet. */
      if (RT.views[id].openRoute && (requestedSub || wasBuilt)) {
        RT.views[id].openRoute(requestedSub);
      }
    } finally {
      routingDepth--;
    }

    movePill();
    requestAnimationFrame(function () {
      U.regrowAll();
      if (options.focus !== false) focusViewHeading();
    });
    /* Bei Back/Forward bleibt der bestehende Eintrag unangetastet. Nur wenn
       eine Ansicht eine ungültige Unterroute kanonisiert hat, wird derselbe
       Eintrag korrigiert. Nutzeraktionen erhalten dagegen einen neuen Eintrag. */
    writeRoute(id, currentSub, historyMode);
    window.scrollTo(0, 0);
  }

  function routeFromHash(options) {
    options = options || {};
    var parsed = parseHash(location.hash);
    if (parsed.view === 'main-content') {
      if (currentView) {
        document.getElementById('main-content').focus({ preventScroll: true });
        writeRoute(currentView, currentSub, 'replace');
        return;
      }
      parsed = { view: null, sub: null };
    }
    var view = parsed.view || RT.store.get('lastView') || 'learn';
    if (!VIEWS.some(function (v) { return v.id === view; })) {
      view = 'learn';
      parsed.sub = RT.store.get('lastLesson') || (RT.lessons[0] && RT.lessons[0].id) || null;
    }
    /* Playground besitzt keine Unterrouten. Fremde Fragmente werden nicht
       als scheinbar gültige URL konserviert. Andere Ansichten kanonisieren
       ihre IDs beim Öffnen selbst; Nachschlagen nutzt Subs auch als Suche. */
    if (view === 'play') parsed.sub = null;
    go(view, parsed.sub, {
      history: options.history || 'replace',
      focus: options.focus !== false
    });
  }

  function scheduleHistoryRoute() {
    /* Chromium sendet bei einem Hash-History-Schritt popstate und hashchange.
       Beide Ereignisse werden zu genau einem Renderdurchlauf zusammengelegt. */
    if (historyRouteScheduled) return;
    historyRouteScheduled = true;
    setTimeout(function () {
      historyRouteScheduled = false;
      routeFromHash({ history: 'none' });
    }, 0);
  }

  function releaseInitialRouteFocus() {
    /* Einzelansichten fokussieren beim Öffnen ihre Überschrift. Beim ersten
       Seitenaufruf soll die Tab-Reihenfolge trotzdem am Skip-Link beginnen. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var active = document.activeElement;
        if (active && active.getAttribute && active.getAttribute('tabindex') === '-1') active.blur();
      });
    });
  }

  function setRoute(view, sub, options) {
    options = options || {};
    if (!VIEWS.some(function (v) { return v.id === view; })) return;
    if (currentView !== view) {
      go(view, sub, { history: options.history || 'push' });
      return;
    }
    currentSub = sub || null;
    if (!routingDepth) writeRoute(view, currentSub, options.history || 'push');
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
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effective = t || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', effective);
    var btn = document.getElementById('theme-btn');
    if (btn) {
      var dark = effective === 'dark';
      btn.innerHTML = U.icon(dark ? 'sun' : 'moon');
      btn.title = dark ? 'Helles Design' : 'Dunkles Design';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  function toggleTheme() {
    var cur = RT.store.get('theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effective = cur || (systemDark ? 'dark' : 'light');
    var next = effective === 'dark' ? 'light' : 'dark';
    RT.store.set('theme', next);
    applyTheme(next);
  }

  /* ---------- Fortschritt ---------- */
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
      var label = 'Fortschritt ' + o.pct + ' Prozent: ' +
        o.leDone + '/' + o.leTotal + ' Kapitel, ' +
        o.exDone + '/' + o.exTotal + ' Aufgaben, ' +
        o.quDone + '/' + o.quTotal + ' Quiz richtig (' + o.quAttempted + ' bearbeitet)';
      host.title = label;
      host.setAttribute('aria-label', label);
      host.setAttribute('aria-valuenow', String(o.pct));
      var live = document.getElementById('ring-live');
      if (live) live.textContent = label;
    }
  }

  function clearBuiltViews() {
    built = {};
    VIEWS.forEach(function (v) {
      var shell = document.getElementById('view-' + v.id).querySelector('.shell');
      U.disposeWithin(shell);
      shell.innerHTML = '';
    });
  }

  /* ---------- Fortschritt exportieren / importieren ---------- */
  function flushProgress() {
    if (RT.views.play && RT.views.play.flush) RT.views.play.flush();
    else RT.store.flush();
  }

  function exportProgress() {
    flushProgress();
    var json = RT.store.exportJSON();
    U.copyText(json);
  }

  function importProgress() {
    var raw = prompt('Fortschritt einfügen (JSON aus Export):');
    if (!raw) return;
    try {
      RT.store.importJSON(raw.trim());
      clearBuiltViews();
      applyTheme(RT.store.get('theme'));
      refreshProgress();
      routeFromHash();
      U.toast('Fortschritt importiert');
    } catch (e) {
      U.toast('Import fehlgeschlagen: ' + (e && e.message ? e.message : 'ungültiges JSON'));
    }
  }

  /* ---------- Tastatur-Hilfe ---------- */
  function setPageInert(inert) {
    var nodes = [document.querySelector('.topbar'), document.getElementById('main-content')];
    nodes.forEach(function (node) {
      if (node && 'inert' in node) node.inert = inert;
    });
  }

  function toggleHelp(force) {
    var open = force !== undefined ? force : !helpNode || helpNode.hidden;
    if (!helpNode) {
      helpNode = el('div', { class: 'help-overlay', id: 'keyboard-help', hidden: '' }, [
        el('section', { class: 'help-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'help-title' }, [
          el('h2', { id: 'help-title', text: 'Tastaturkürzel' }),
          el('dl', { class: 'help-list' }, [
            el('dt', { text: '1 – 5' }), el('dd', { text: 'Zwischen Bereichen wechseln' }),
            el('dt', { text: U.modKeyLabel() + ' + K' }), el('dd', { text: 'Nachschlagen öffnen und Suche fokussieren' }),
            el('dt', { text: '?' }), el('dd', { text: 'Diese Hilfe ein-/ausblenden' }),
            el('dt', { text: 'Esc' }), el('dd', { text: 'Eingabefeld verlassen oder Hilfe schließen' })
          ]),
          el('button', { class: 'btn primary', type: 'button', text: 'Schließen' })
        ])
      ]);
      helpNode.querySelector('.btn').addEventListener('click', function () { toggleHelp(false); });
      helpNode.addEventListener('click', function (e) {
        if (e.target === helpNode) toggleHelp(false);
      });
      document.body.appendChild(helpNode);
    }
    var helpBtn = document.getElementById('help-btn');
    if (open) {
      helpReturnFocus = document.activeElement;
      helpNode.hidden = false;
      helpNode.classList.add('on');
      setPageInert(true);
      helpBtn.setAttribute('aria-expanded', 'true');
      helpNode.querySelector('.btn').focus();
    } else {
      helpNode.classList.remove('on');
      helpNode.hidden = true;
      setPageInert(false);
      helpBtn.setAttribute('aria-expanded', 'false');
      if (helpReturnFocus && helpReturnFocus.isConnected) helpReturnFocus.focus();
      helpReturnFocus = null;
    }
  }

  /* ---------- Service Worker ---------- */
  function showUpdate(registration) {
    if (!registration.waiting || updateNode) return;
    var reload = el('button', { class: 'btn sm primary', type: 'button', text: 'Neu laden' });
    var later = el('button', { class: 'btn sm ghost', type: 'button', text: 'Später' });
    updateNode = el('div', { class: 'update-toast', role: 'status', 'aria-live': 'polite' }, [
      el('span', { text: 'Eine neue Version ist bereit.' }), reload, later
    ]);
    reload.addEventListener('click', function () {
      flushProgress();
      reloadingForUpdate = true;
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      else location.reload();
    });
    later.addEventListener('click', function () {
      updateNode.remove();
      updateNode = null;
    });
    document.body.appendChild(updateNode);
  }

  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloadingForUpdate) location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(function (registration) {
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration);
      registration.addEventListener('updatefound', function () {
        var installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', function () {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration);
        });
      });
    }).catch(function () { /* Offline-Start ohne bestehenden Worker bleibt normal. */ });
  }

  /* ---------- Start ---------- */
  function init() {
    var nav = document.getElementById('nav');
    navPill = el('span', { class: 'nav-pill', 'aria-hidden': 'true' });
    nav.appendChild(navPill);
    VIEWS.forEach(function (v) {
      var b = el('button', {
        type: 'button', class: 'nav-btn', text: v.label,
        'aria-current': 'false'
      });
      b.addEventListener('click', function () { go(v.id); });
      navBtns[v.id] = b;
      nav.appendChild(b);
    });

    applyTheme(RT.store.get('theme'));
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemTheme = function () {
      if (!RT.store.get('theme')) applyTheme(null);
    };
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', onSystemTheme);
    else if (themeQuery.addListener) themeQuery.addListener(onSystemTheme);

    document.getElementById('export-btn').addEventListener('click', exportProgress);
    document.getElementById('import-btn').addEventListener('click', importProgress);
    document.getElementById('help-btn').addEventListener('click', function () { toggleHelp(); });
    document.getElementById('help-btn').setAttribute('aria-expanded', 'false');

    var skip = document.querySelector('.skip-link');
    if (skip) skip.addEventListener('click', function (e) {
      e.preventDefault();
      var main = document.getElementById('main-content');
      main.focus({ preventScroll: true });
      main.scrollIntoView({ block: 'start' });
    });

    routeFromHash({ history: 'replace', focus: false });
    releaseInitialRouteFocus();
    refreshProgress();
    registerSW();

    window.addEventListener('resize', movePill);
    window.addEventListener('popstate', scheduleHistoryRoute);
    window.addEventListener('hashchange', scheduleHistoryRoute);
    window.addEventListener('pagehide', flushProgress);

    document.addEventListener('keydown', function (e) {
      var inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (helpNode && helpNode.classList.contains('on') && e.key === 'Escape') {
        e.preventDefault();
        toggleHelp(false);
        return;
      }
      if (helpNode && helpNode.classList.contains('on') && e.key === 'Tab') {
        var focusable = U.$$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', helpNode)
          .filter(function (node) { return !node.disabled && !node.hidden; });
        if (focusable.length) {
          var first = focusable[0], last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        return;
      }
      if (helpNode && helpNode.classList.contains('on')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        go('ref');
        setTimeout(function () { RT.views.ref.focusSearch(); }, 60);
        return;
      }
      if (e.key === '?' && !inField) {
        e.preventDefault();
        toggleHelp();
        return;
      }
      if (e.key === 'Escape' && inField) { document.activeElement.blur(); return; }
      if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= VIEWS.length) go(VIEWS[n - 1].id);
    });

    document.getElementById('reset-btn').addEventListener('click', function () {
      if (!confirm('Gelöste Aufgaben, gelesene Kapitel und Quiz-Ergebnisse verwerfen?')) return;
      RT.store.reset();
      clearBuiltViews();
      applyTheme(null);
      go('learn');
      refreshProgress();
      U.toast('Fortschritt zurückgesetzt');
    });

    setTimeout(movePill, 120);
  }

  RT.go = go;
  RT.setRoute = setRoute;
  RT.openInPlayground = openInPlayground;
  RT.refreshProgress = refreshProgress;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
