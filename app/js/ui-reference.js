/* =============================================================
   ui-reference.js — Ansicht "Nachschlagen"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el, E = RT.engine;

  var searchInput, sideBox, listBox;
  var activeCat = 'all';
  var query = '';
  var openIds = {};
  var pendingRoute = null;
  var routedKey = null;
  var showAll = false;
  var routeLookup = {};
  var routesByKey = {};

  function build(container) {
    activeCat = 'all';
    query = '';
    routedKey = null;
    showAll = false;
    openIds = {};
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Nachschlagen' }),
      el('p', { text: 'Jedes Syntaxelement, jeder re-Befehl und die typischen Rezepte — mit lauffähigem Beispiel. Suche nach Zeichen („\\b“), nach Begriff („Wortgrenze“) oder nach Zweck („E-Mail“).' })
    ]));

    searchInput = el('input', {
      class: 'input', type: 'search', spellcheck: 'false',
      placeholder: 'Suchen … z. B. \\d, Lookahead, findall, Geldbetrag',
      'aria-label': 'Regex-Nachschlagewerk durchsuchen'
    });
    searchInput.addEventListener('input', function () {
      routedKey = null;
      showAll = false;
      RT.setRoute('ref', null);
      query = searchInput.value.trim().toLowerCase();
      render();
    });

    var searchWrap = el('div', { class: 'search-wrap' }, [
      el('span', { html: U.icon('search'), 'aria-hidden': 'true' }),
      searchInput,
      el('span', { class: 'search-kbd', text: U.modKeyLabel() + 'K' })
    ]);
    container.appendChild(searchWrap);

    sideBox = el('aside', { class: 'ref-side', 'aria-label': 'Kategorien' });
    listBox = el('div', { class: 'ref-list', 'aria-label': 'Suchergebnisse' });
    container.appendChild(el('div', { class: 'ref-layout' }, [sideBox, listBox]));

    buildRoutes();
    renderSide();
    if (pendingRoute) {
      openRoute(pendingRoute);
      pendingRoute = null;
    } else {
      render();
    }
  }

  function slugPart(text) {
    var normalized = String(text).normalize ? String(text).normalize('NFKD') : String(text);
    return normalized.toLowerCase().replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eintrag';
  }

  function symSlug(sym) {
    return String(sym).replace(/[^\w.+()-]+/g, '-').replace(/^-|-$/g, '') || 'entry';
  }

  function shortHash(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function buildRoutes() {
    routeLookup = {};
    routesByKey = {};
    var used = {};
    RT.reference.forEach(function (entry, index) {
      var seed = entry.cat + '|' + entry.sym + '|' + entry.title;
      var base = entry.cat + '-' + slugPart(entry.title) + '-' + shortHash(seed);
      var route = base;
      var n = 2;
      while (used[route]) route = base + '-' + n++;
      used[route] = true;
      routeLookup[route] = entry;
      routesByKey[keyOf(entry, index)] = route;
    });
  }

  function routeOf(entry) {
    return routesByKey[keyOf(entry)] || null;
  }

  function findByRoute(sub) {
    if (routeLookup[sub]) return routeLookup[sub];
    var exact = RT.reference.filter(function (r) { return r.sym === sub; });
    if (exact.length === 1) return exact[0];
    var legacy = RT.reference.filter(function (r) { return symSlug(r.sym) === sub; });
    if (legacy.length === 1) return legacy[0];
    return null;
  }

  function openRoute(sub) {
    if (!listBox) {
      pendingRoute = sub;
      return;
    }
    if (!sub) {
      routedKey = null;
      openIds = {};
      showAll = false;
      activeCat = 'all';
      query = '';
      showAll = false;
      if (searchInput) searchInput.value = '';
      renderSide();
      render();
      return;
    }
    var entry = findByRoute(sub);
    if (entry) {
      activeCat = 'all';
      query = '';
      routedKey = keyOf(entry);
      if (searchInput) searchInput.value = '';
      renderSide();
      openIds[keyOf(entry)] = true;
      render();
      setTimeout(function () {
        var items = U.$$('.ref-item', listBox);
        if (items[0]) items[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }
    routedKey = null;
    query = sub.toLowerCase();
    if (searchInput) searchInput.value = sub;
    activeCat = 'all';
    renderSide();
    render();
  }

  function counts() {
    var c = { all: RT.reference.length };
    RT.reference.forEach(function (r) { c[r.cat] = (c[r.cat] || 0) + 1; });
    return c;
  }

  function renderSide() {
    var c = counts();
    sideBox.innerHTML = '';
    var cats = [{ id: 'all', label: 'Alles', hint: '' }].concat(RT.categories);
    cats.forEach(function (cat) {
      var b = el('button', {
        type: 'button', class: 'ref-cat' + (cat.id === activeCat ? ' on' : ''), title: cat.hint || '',
        'aria-pressed': cat.id === activeCat ? 'true' : 'false'
      }, [
        el('span', { text: cat.label }),
        el('span', { class: 'n', text: String(c[cat.id] || 0) })
      ]);
      b.addEventListener('click', function () {
        activeCat = cat.id;
        routedKey = null;
        showAll = false;
        RT.setRoute('ref', null);
        renderSide();
        render();
      });
      sideBox.appendChild(b);
    });
  }

  function matches(entry) {
    if (routedKey) return keyOf(entry) === routedKey;
    if (activeCat !== 'all' && entry.cat !== activeCat) return false;
    if (!query) return true;
    var hay = [
      entry.sym, entry.title, entry.desc, entry.note || '',
      entry.pattern || '', entry.py || '', (entry.tags || []).join(' ')
    ].join(' ').toLowerCase();
    // alle Suchwörter müssen vorkommen
    return query.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function render() {
    var hits = RT.reference.filter(matches);
    var initialOverview = !query && activeCat === 'all' && !routedKey && !showAll;
    var visibleHits = initialOverview ? hits.slice(0, 24) : hits;
    listBox.innerHTML = '';

    if (!hits.length) {
      listBox.appendChild(el('div', { class: 'empty' }, [
        el('div', { html: U.icon('empty') }),
        el('div', { text: 'Nichts gefunden für „' + query + '“.' }),
        el('div', { style: 'font-size:13px;margin-top:6px', text: 'Versuch es mit einem Stichwort wie „Gruppe“, „ersetzen“ oder „\\b“.' })
      ]));
      return;
    }

    var frag = document.createDocumentFragment();
    visibleHits.forEach(function (entry, i) {
      frag.appendChild(renderItem(entry, i));
    });
    listBox.appendChild(frag);
    if (initialOverview && hits.length > visibleHits.length) {
      var more = el('button', { class: 'btn ref-more', type: 'button', text: 'Alle ' + hits.length + ' Einträge anzeigen' });
      more.addEventListener('click', function () { showAll = true; render(); });
      listBox.appendChild(el('div', { class: 'ref-more-wrap' }, [
        el('p', { text: 'Tipp: Mit der Suche findest du Syntax, Begriffe und fertige Rezepte am schnellsten.' }),
        more
      ]));
    }
    listBox.classList.add('stagger');
    setTimeout(function () { listBox.classList.remove('stagger'); }, 700);
  }

  function keyOf(entry, knownIndex) {
    var index = typeof knownIndex === 'number' ? knownIndex : RT.reference.indexOf(entry);
    return index + '|' + entry.cat + '|' + entry.sym + '|' + entry.title;
  }

  function renderItem(entry) {
    var id = keyOf(entry);
    var isOpen = !!openIds[id] || (!!query && query.length > 2);
    var catLabel = (RT.categories.filter(function (c) { return c.id === entry.cat; })[0] || {}).label || '';

    var route = routeOf(entry);
    var bodyId = 'ref-body-' + route;
    var head = el('button', {
      type: 'button', class: 'ref-head',
      'aria-expanded': isOpen ? 'true' : 'false', 'aria-controls': bodyId
    }, [
      el('span', { class: 'ref-sym', text: entry.sym }),
      el('span', { class: 'ref-title', text: entry.title }),
      el('span', { class: 'ref-sub', text: catLabel }),
      el('span', { class: 'ref-chevron', 'aria-hidden': 'true', text: '⌄' })
    ]);

    var item = el('div', { class: 'ref-item' + (isOpen ? ' open' : '') }, head);
    var bodyNode = null;

    function toggle(force) {
      var wantOpen = force !== undefined ? force : !bodyNode;
      if (wantOpen && !bodyNode) {
        bodyNode = buildBody(entry);
        item.appendChild(bodyNode);
        item.classList.add('open');
        openIds[id] = true;
        head.setAttribute('aria-expanded', 'true');
      } else if (!wantOpen && bodyNode) {
        item.removeChild(bodyNode);
        bodyNode = null;
        item.classList.remove('open');
        delete openIds[id];
        head.setAttribute('aria-expanded', 'false');
      }
    }

    head.addEventListener('click', function () {
      var opening = !bodyNode;
      toggle(opening);
      RT.setRoute('ref', opening ? route : null);
      if (!opening && routedKey === id) {
        routedKey = null;
        render();
      }
    });
    if (isOpen) toggle(true);
    return item;
  }

  function buildBody(entry) {
    var kids = [el('div', { class: 'ref-desc', html: entry.desc })];

    if (entry.pattern) {
      var res = E.run(entry.pattern, entry.flags || '', entry.text || '', entry.fn || 'findall', { repl: entry.repl });
      var box = el('div', { class: 'hl-box', html: U.highlightHTML(entry.text || '', res.ok ? res.matches : []) });
      var outText = res.ok ? res.display : '⚠ ' + res.error;

      kids.push(el('div', { class: 'ref-ex' }, [
        el('div', { class: 'lbl', text: 'Beispiel' }),
        el('div', { class: 'result', style: 'font-size:12.5px', html:
          '<span style="color:var(--text-3)">re.' + (entry.fn || 'findall') + '(</span>r"' +
          U.esc(entry.pattern) + '"' +
          (entry.fn === 'sub' ? ', r"' + U.esc(entry.repl || '') + '"' : '') +
          ', text' + (entry.flags ? ', flags=re.' + entry.flags.toUpperCase().split('').join(' | re.') : '') +
          '<span style="color:var(--text-3)">)</span>'
        }),
        box,
        el('div', { class: 'result ok', text: outText })
      ]));
    }

    if (entry.py) {
      kids.push(el('pre', { class: 'code', style: 'margin:0' }, el('code', { html: U.pyCode(entry.py) })));
    }

    if (entry.note) {
      kids.push(el('div', { class: 'note warn', style: 'margin:0' }, [
        el('span', { class: 'note-k', text: 'Merke' }),
        el('span', { html: entry.note })
      ]));
    }

    var actions = el('div', { class: 'ref-actions' });
    if (entry.pattern) {
      var openBtn = el('button', { class: 'btn sm', type: 'button', html: U.icon('play') + ' Im Playground öffnen' });
      openBtn.addEventListener('click', function () {
        RT.openInPlayground({
          pattern: entry.pattern, flags: entry.flags || '', text: entry.text || '',
          fn: entry.fn || 'findall', repl: entry.repl || ''
        });
      });
      actions.appendChild(openBtn);

      var copyBtn = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('copy') + ' Muster kopieren' });
      copyBtn.addEventListener('click', function () {
        copy('r"' + entry.pattern + '"');
      });
      actions.appendChild(copyBtn);
    }
    if (entry.py) {
      var copyPy = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('copy') + ' Python kopieren' });
      copyPy.addEventListener('click', function () { copy(entry.py); });
      actions.appendChild(copyPy);
    }
    if (actions.children.length) kids.push(actions);

    return el('div', { class: 'ref-body', id: 'ref-body-' + routeOf(entry) }, kids);
  }

  function copy(s) {
    U.copyText(s);
  }

  function focusSearch() {
    if (searchInput) { searchInput.focus(); searchInput.select(); }
  }

  RT.views = RT.views || {};
  RT.views.ref = { build: build, focusSearch: focusSearch, openRoute: openRoute };
})(window);
