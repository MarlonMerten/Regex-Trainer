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

  function build(container) {
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Nachschlagen' }),
      el('p', { text: 'Jedes Syntaxelement, jeder re-Befehl und die typischen Rezepte — mit lauffähigem Beispiel. Suche nach Zeichen („\\b“), nach Begriff („Wortgrenze“) oder nach Zweck („E-Mail“).' })
    ]));

    searchInput = el('input', {
      class: 'input', type: 'search', spellcheck: 'false',
      placeholder: 'Suchen … z. B. \\d, Lookahead, findall, Geldbetrag'
    });
    searchInput.addEventListener('input', function () { query = searchInput.value.trim().toLowerCase(); render(); });

    var searchWrap = el('div', { class: 'search-wrap' }, [
      el('span', { html: U.icon('search') }),
      searchInput,
      el('span', { class: 'search-kbd', text: '⌘K' })
    ]);
    container.appendChild(searchWrap);

    sideBox = el('aside', { class: 'ref-side' });
    listBox = el('div', { class: 'ref-list' });
    container.appendChild(el('div', { class: 'ref-layout' }, [sideBox, listBox]));

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
        type: 'button', class: 'ref-cat' + (cat.id === activeCat ? ' on' : ''), title: cat.hint || ''
      }, [
        el('span', { text: cat.label }),
        el('span', { class: 'n', text: String(c[cat.id] || 0) })
      ]);
      b.addEventListener('click', function () {
        activeCat = cat.id;
        renderSide();
        render();
      });
      sideBox.appendChild(b);
    });
  }

  function matches(entry) {
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
    hits.forEach(function (entry, i) {
      frag.appendChild(renderItem(entry, i));
    });
    listBox.appendChild(frag);
    listBox.classList.add('stagger');
    setTimeout(function () { listBox.classList.remove('stagger'); }, 700);
  }

  function keyOf(entry) { return entry.cat + '|' + entry.sym; }

  function renderItem(entry) {
    var id = keyOf(entry);
    var isOpen = !!openIds[id] || (!!query && query.length > 2);
    var catLabel = (RT.categories.filter(function (c) { return c.id === entry.cat; })[0] || {}).label || '';

    var head = el('button', { type: 'button', class: 'ref-head' }, [
      el('span', { class: 'ref-sym', text: entry.sym }),
      el('span', { class: 'ref-title', text: entry.title }),
      el('span', { class: 'ref-sub', text: catLabel })
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
      } else if (!wantOpen && bodyNode) {
        item.removeChild(bodyNode);
        bodyNode = null;
        item.classList.remove('open');
        delete openIds[id];
      }
    }

    head.addEventListener('click', function () { toggle(); });
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
          ', text' + (entry.flags ? ', re.' + entry.flags.toUpperCase().split('').join(' | re.') : '') +
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

    return el('div', { class: 'ref-body' }, kids);
  }

  function copy(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s).then(function () { U.toast('Kopiert'); },
                                            function () { U.toast('Kopieren nicht möglich'); });
    } else {
      var ta = el('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = s; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); U.toast('Kopiert'); } catch (e) { U.toast('Kopieren nicht möglich'); }
      document.body.removeChild(ta);
    }
  }

  function focusSearch() {
    if (searchInput) { searchInput.focus(); searchInput.select(); }
  }

  RT.views = RT.views || {};
  RT.views.ref = { build: build, focusSearch: focusSearch };
})(window);
