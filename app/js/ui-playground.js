/* =============================================================
   ui-playground.js — Ansicht "Playground"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el, E = RT.engine;

  var DEFAULTS = {
    pattern: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)',
    flags: '',
    fn: 'findall',
    repl: '',
    text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. ' +
          'Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld ' +
          'zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.'
  };

  var SNIPPETS = [
    '\\d', '\\w', '\\s', '.', '+', '*', '?', '{2,4}',
    '[a-z]', '[^ ]', '\\b', '^', '$', '(…)', '(?:…)', '(?P<n>…)',
    '|', '(?=…)', '(?!…)', '(?<=…)', '\\1'
  ];

  var EXAMPLES = [
    { label: 'Geldbeträge', pattern: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)', flags: '', text: DEFAULTS.text },
    { label: 'E-Mail', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', flags: '', text: 'Kontakt: anna@uni.de und support@firma.co.uk — spam@ ist keins.' },
    { label: 'IP-Adresse', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: '', text: 'Server 192.168.0.1 und 10.0.0.42 im Log, dazu 999.999.1.1 als Fehleintrag.' },
    { label: 'Log-Zeile', pattern: '^\\[(\\d{4}-\\d{2}-\\d{2})\\]\\s+(\\w+)\\s+(.*)$', flags: 'm', text: '[2024-12-24] ERROR Festplatte voll\n[2024-12-24] INFO Backup ok' },
    { label: 'Umlaute \\w', pattern: '\\b\\w+\\b', flags: '', text: 'Größe und Café — Wörter mit Umlauten.' }
  ];

  var st, rx, flags, fnSel, replWrap, replInp, ed;
  var outBox, metaBox, tokBox, tokList, matchBox, pyBox, summaryBox;
  var renderSeq = 0, saveTimer = null, alive = false;

  function build(container) {
    var saved = RT.store.get('playground');
    st = saved ? Object.assign({}, saved) : Object.assign({}, DEFAULTS);
    alive = true;
    ['pattern', 'flags', 'fn', 'repl', 'text'].forEach(function (k) {
      if (st[k] === undefined) st[k] = DEFAULTS[k];
    });

    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Playground' }),
      el('p', { text: 'Muster bauen und sofort sehen, was passiert — mit der unterstützten Python-3.14-Teilmenge: Unicode-\\w, die Gruppenregel von findall und passende re-Rückgabewerte.' })
    ]));

    var exampleSel = el('select', { class: 'select', 'aria-label': 'Beispiel laden' },
      [el('option', { value: '', text: 'Beispiel laden …' })].concat(
        EXAMPLES.map(function (ex, i) { return el('option', { value: String(i), text: ex.label }); })
      )
    );
    exampleSel.addEventListener('change', function () {
      if (exampleSel.value === '') return;
      var ex = EXAMPLES[+exampleSel.value];
      st.pattern = ex.pattern;
      st.flags = ex.flags || '';
      st.text = ex.text;
      apply(st);
      exampleSel.value = '';
      U.toast('Beispiel „' + ex.label + '" geladen');
    });

    /* ---------- Eingabezeile ---------- */
    rx = U.makeRegexInput(st.pattern, function (v) { st.pattern = v; requestRender(); }, 'Muster … z. B. \\b\\w+@\\w+\\.\\w+\\b', 'Regulärer Ausdruck');
    flags = U.makeFlags(st.flags, function (v) { st.flags = v; requestRender(); }, null, 'Regex-Flags');

    fnSel = el('select', { class: 'select', 'aria-label': 'Regex-Funktion' }, U.FN_LABELS.map(function (f) {
      return el('option', { value: f[0], text: 're.' + f[1] + '()' });
    }));
    fnSel.value = st.fn;
    fnSel.addEventListener('change', function () { st.fn = fnSel.value; syncRepl(); requestRender(); });

    replInp = el('input', {
      class: 'input', type: 'text', spellcheck: 'false',
      placeholder: 'Ersatztext, z. B. \\1,\\2', value: st.repl,
      'aria-label': 'Ersatztext'
    });
    replInp.addEventListener('input', function () { st.repl = replInp.value; requestRender(); });
    replWrap = el('div', { class: 'rx-wrap', style: 'flex:1 1 200px;min-width:0' }, [
      el('span', { class: 'rx-fix l', text: 'r"' }), replInp, el('span', { class: 'rx-fix r', text: '"' })
    ]);

    var patternBlock = el('div', { class: 'pg-block' }, [
      el('div', { class: 'field-head' }, [
        el('span', { class: 'label', text: 'Muster' }),
        el('span', { class: 'hint-r', id: 'pg-gcount' })
      ]),
      rx.node,
      el('div', { class: 'pg-row pg-row-tight' }, [flags.node, fnSel, replWrap, exampleSel])
    ]);

    /* ---------- Bausteine zum Einfügen ---------- */
    var snips = el('div', { class: 'snips' });
    SNIPPETS.forEach(function (s) {
      var b = el('button', { class: 'snip', type: 'button', text: s });
      b.addEventListener('click', function () { insert(s); });
      snips.appendChild(b);
    });

    /* ---------- Textbereich ---------- */
    ed = U.makeEditor({ onInput: function (v) { st.text = v; requestRender(); }, placeholder: 'Testtext …', ariaLabel: 'Testtext' });
    var textBlock = el('div', { class: 'pg-block' }, [
      el('div', { class: 'field-head' }, [
        el('span', { class: 'label', text: 'Testtext' }),
        el('span', { class: 'hint-r', id: 'pg-len' })
      ]),
      ed.node
    ]);

    /* ---------- Ergebnis ---------- */
    outBox = el('div', { class: 'result', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    metaBox = el('div', { class: 'meta' });
    var resultBlock = el('div', { class: 'pg-block' }, [
      el('span', { class: 'label', text: 'Rückgabewert' }),
      outBox, metaBox
    ]);

    /* ---------- Python-Zeile ---------- */
    pyBox = el('pre', { class: 'code', style: 'margin:0' });
    var copyPy = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('copy') + ' Kopieren' });
    copyPy.addEventListener('click', function () { U.copyText(pyBox.textContent); });
    var pyBlock = el('div', { class: 'pg-block' }, [
      el('div', { class: 'field-head' }, [
        el('span', { class: 'label', text: 'Als Python' }), copyPy
      ]),
      pyBox
    ]);

    var main = el('div', { class: 'pg-main' }, [
      el('div', { class: 'card card-pad' }, [patternBlock, el('div', { style: 'height:12px' }), snips]),
      el('div', { class: 'card card-pad' }, textBlock),
      el('div', { class: 'card card-pad' }, resultBlock),
      el('div', { class: 'card card-pad' }, pyBlock)
    ]);

    /* ---------- Seitenleiste ---------- */
    tokBox = el('div', { class: 'tokens' });
    summaryBox = el('div', { style: 'font-size:13px;color:var(--text-2);margin-top:10px' });
    tokList = el('ul', { class: 'tok-list', role: 'list' });
    var explainCard = el('div', { class: 'card card-pad' }, [
      el('span', { class: 'label', text: 'Muster erklärt' }),
      tokBox, summaryBox, tokList
    ]);

    matchBox = el('div', { class: 'match-list' });
    var matchCard = el('div', { class: 'card card-pad' }, [
      el('div', { class: 'field-head' }, [
        el('span', { class: 'label', text: 'Treffer' }),
        el('span', { class: 'hint-r', id: 'pg-mcount' })
      ]),
      matchBox
    ]);

    var resetBtn = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('reset') + ' Beispiel zurücksetzen' });
    resetBtn.addEventListener('click', function () {
      st = Object.assign({}, DEFAULTS);
      apply(st);
      U.toast('Zurückgesetzt');
    });

    var side = el('aside', { class: 'pg-side' }, [explainCard, matchCard, el('div', null, resetBtn)]);

    container.appendChild(el('div', { class: 'pg-grid' }, [main, side]));

    syncRepl();
    ed.set(st.text);
    if (saved) requestRender();
    else renderSync();
    requestAnimationFrame(function () { ed.grow(); });
    U.onDispose(container, function () {
      alive = false;
      renderSeq++;
      render.cancel();
      clearTimeout(saveTimer);
      ed.destroy();
    });
  }

  function syncRepl() {
    replWrap.style.display = st.fn === 'sub' ? 'flex' : 'none';
  }

  function insert(snippet) {
    var s = snippet.replace(/…/g, '');
    var inp = rx.input;
    var a = inp.selectionStart, b = inp.selectionEnd;
    var v = inp.value;
    var mid = s;
    if (snippet.indexOf('…') !== -1 && a !== b) {
      // Auswahl umschließen
      var open = s, close = '';
      if (/^\(/.test(s)) { close = ')'; open = s.slice(0, s.length - 1); }
      mid = open + v.slice(a, b) + close;
    }
    inp.value = v.slice(0, a) + mid + v.slice(b);
    var caret = a + mid.length;
    if (snippet.indexOf('…') !== -1 && a === b) caret = a + (/^\(/.test(s) ? s.length - 1 : s.length);
    inp.setSelectionRange(caret, caret);
    inp.focus();
    st.pattern = inp.value;
    requestRender();
  }

  function snapshot() {
    return {
      pattern: st.pattern, flags: st.flags, fn: st.fn,
      repl: st.repl || '', text: st.text
    };
  }

  function paintResult(res, snap) {
    if (!alive) return;
    outBox.setAttribute('aria-busy', 'false');
    if (!res.ok) {
      ed.paint([]);
      outBox.className = 'result bad';
      outBox.textContent = res.empty ? 'Noch kein Muster eingegeben.' : '⚠  ' + res.error;
      metaBox.innerHTML = '';
      matchBox.innerHTML = '<div style="color:var(--text-3);font-size:13px">—</div>';
      setText('pg-mcount', '');
      setText('pg-gcount', '');
    } else {
      ed.paint(res.matches);
      outBox.className = 'result' + (res.matches.length ? ' ok' : '');
      outBox.textContent = res.display;

      var bits = ['<span>Treffer <b>' + res.matches.length + '</b></span>'];
      if (res.compiled.groupCount) bits.push('<span>Gruppen <b>' + res.compiled.groupCount + '</b></span>');
      if (res.compiled.groupNames.length) bits.push('<span>benannt <b>' + res.compiled.groupNames.join(', ') + '</b></span>');
      if (snap.fn === 'findall') bits.push('<span>' + findallRule(res.compiled.groupCount) + '</span>');
      res.warnings.forEach(function (w) { bits.push('<span style="color:var(--warn)">⚠ ' + U.esc(w) + '</span>'); });
      metaBox.innerHTML = bits.join('');

      setText('pg-mcount', res.matches.length === 1 ? '1 Treffer' : res.matches.length + ' Treffer');
      setText('pg-gcount', res.compiled.groupCount ? res.compiled.groupCount + ' Gruppe(n)' : '');
      renderMatches(res.matches, res.compiled);
    }
  }

  function renderStatic(snap) {
    setText('pg-len', snap.text.length + ' Zeichen');
    renderExplain(snap.pattern);
    renderPy(snap);
  }

  function scheduleSave(snap) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (alive) RT.store.set('playground', Object.assign({}, snap));
    }, 400);
  }

  function flush() {
    clearTimeout(saveTimer);
    if (alive && st) RT.store.set('playground', snapshot());
    RT.store.flush();
  }

  function renderSync() {
    var snap = snapshot();
    renderSeq++;
    renderStatic(snap);
    paintResult(E.run(snap.pattern, snap.flags, snap.text, snap.fn, { repl: snap.repl }), snap);
    scheduleSave(snap);
  }

  function renderAsync() {
    var seq = renderSeq;
    var snap = snapshot();
    outBox.setAttribute('aria-busy', 'true');
    RT.safeRun.run(snap.pattern, snap.flags, snap.text, snap.fn, { repl: snap.repl }).then(function (res) {
      if (!alive || seq !== renderSeq) return;
      paintResult(res, snap);
    });
  }

  var render = U.debounce(renderAsync, 90);

  function requestRender() {
    var snap = snapshot();
    renderSeq++;
    ed.paint([]);
    outBox.setAttribute('aria-busy', 'true');
    renderStatic(snap);
    scheduleSave(snap);
    render();
  }

  function findallRule(n) {
    if (n === 0) return 'keine Gruppe → ganze Treffer';
    if (n === 1) return 'eine Gruppe → nur die Gruppe';
    return n + ' Gruppen → Tupel';
  }

  function setText(id, s) {
    var n = document.getElementById(id);
    if (n) n.textContent = s;
  }

  function renderMatches(ms, compiled) {
    matchBox.innerHTML = '';
    if (!ms.length) {
      matchBox.appendChild(el('div', { style: 'color:var(--text-3);font-size:13px', text: 'Keine Treffer.' }));
      return;
    }
    ms.slice(0, 200).forEach(function (m, i) {
      var row = el('div', { class: 'match-row' }, [
        el('span', { class: 'i', text: String(i) }),
        el('span', { class: 'v', text: m.text === '' ? '⌀ (leer)' : m.text }),
        el('span', { class: 's', text: m.start + '–' + m.end })
      ]);
      matchBox.appendChild(row);

      if (m.groups.length) {
        var g = el('div', { class: 'match-groups' });
        m.groups.forEach(function (val, gi) {
          var namesByIndex = compiled.groupNamesByIndex || compiled.groupNameByIndex || [];
          var name = namesByIndex[gi] || null;
          if (!name && compiled.groupIndexByName) {
            Object.keys(compiled.groupIndexByName).some(function (candidate) {
              if (compiled.groupIndexByName[candidate] === gi + 1) { name = candidate; return true; }
              return false;
            });
          }
          g.appendChild(el('div', null, [
            el('span', { class: 'gn', text: (gi + 1) + (name ? ' (' + name + ')' : '') + ': ' }),
            el('span', { text: val === undefined ? 'None' : E.pyStr(val) })
          ]));
        });
        matchBox.appendChild(g);
      }
    });
    if (ms.length > 200) {
      matchBox.appendChild(el('div', { style: 'color:var(--text-3);font-size:12px;padding:6px 10px',
                                       text: '… und ' + (ms.length - 200) + ' weitere' }));
    }
  }

  function renderExplain(pattern) {
    var toks = RT.explain.tokenize(pattern);
    var visibleTokens = toks.slice(0, 500);
    tokBox.innerHTML = '';
    tokList.innerHTML = '';
    if (!toks.length) {
      summaryBox.textContent = 'Gib ein Muster ein — hier wird es Baustein für Baustein zerlegt.';
      return;
    }
    summaryBox.textContent = toks.length > visibleTokens.length
      ? 'Die Erklärung zeigt die ersten 500 von ' + toks.length + ' Bausteinen.'
      : '';
    visibleTokens.forEach(function (t) {
      var chip = el('span', { class: 'tok k-' + t.kind, text: t.raw });
      tokBox.appendChild(chip);

      var row = el('li', { class: 'tok-row' }, [
        el('span', { class: 't tok k-' + t.kind, text: t.raw }),
        el('span', { class: 'd', html: '<b>' + U.esc(t.label) + '</b> — ' + U.esc(t.desc) })
      ]);
      row.addEventListener('mouseenter', function () { chip.style.outline = '2px solid var(--accent)'; });
      row.addEventListener('mouseleave', function () { chip.style.outline = ''; });
      tokList.appendChild(row);
    });
    if (toks.length > visibleTokens.length) {
      tokBox.appendChild(el('span', { class: 'tok k-cmt', text: '…' }));
    }
  }

  function renderPy(snap) {
    var lines = ['import re', ''];
    var flagExpr = snap.flags ? snap.flags.toUpperCase().split('').map(function (f) { return 're.' + f; }).join(' | ') : '';
    var flagStr = flagExpr ? ', flags=' + flagExpr : '';
    var pat = pythonString(snap.pattern, true);
    var call;
    if (snap.fn === 'sub') call = 're.sub(' + pat + ', ' + pythonString(snap.repl, true) + ', text' + flagStr + ')';
    else call = 're.' + snap.fn + '(' + pat + ', text' + flagStr + ')';

    if (snap.fn === 'finditer') {
      lines.push('for m in ' + call + ':');
      lines.push('    print(m.group(), m.span())');
    } else if (snap.fn === 'search' || snap.fn === 'match' || snap.fn === 'fullmatch') {
      lines.push('if m := ' + call + ':');
      lines.push('    print(m.group())');
    } else {
      lines.push('ergebnis = ' + call);
      lines.push('print(ergebnis)');
    }
    pyBox.innerHTML = '<code>' + U.pyCode(lines.join('\n')) + '</code>';
  }

  function pythonString(value, preferRaw) {
    value = String(value);
    var trailing = /\\+$/.exec(value);
    var rawSafe = !/[\r\n]/.test(value) && (!trailing || trailing[0].length % 2 === 0);
    if (preferRaw && rawSafe) {
      if (value.indexOf('"') === -1) return 'r"' + value + '"';
      if (value.indexOf("'") === -1) return "r'" + value + "'";
    }
    return '"' + value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t') + '"';
  }

  function apply(cfg) {
    st = Object.assign({}, DEFAULTS, cfg);
    rx.set(st.pattern);
    flags.set(st.flags);
    fnSel.value = st.fn;
    replInp.value = st.repl || '';
    syncRepl();
    ed.set(st.text);
    requestRender();
  }

  RT.views = RT.views || {};
  RT.views.play = { build: build, apply: apply, flush: flush };
})(window);
