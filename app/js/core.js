/* =============================================================
   core.js — gemeinsame Bausteine für alle Ansichten
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});
  var E = RT.engine;

  /* ---------- DOM-Kleinkram ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Treffer im Text markieren ---------- */
  function highlightHTML(text, matches) {
    if (!matches || !matches.length) return esc(text) + '\n';
    var out = '', pos = 0;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      if (m.start < pos) continue;
      out += esc(text.slice(pos, m.start));
      var cls = 'hit' + (i % 2 ? ' alt' : '') + (m.text === '' ? ' empty' : '');
      out += '<mark class="' + cls + '">' + esc(m.text) + '</mark>';
      pos = m.end;
    }
    out += esc(text.slice(pos));
    return out + '\n';   // Abschluss-Newline hält die Höhe stabil
  }

  /* ---------- Überlagerter Editor ----------
     Textarea mit unsichtbarer Schrift über einer Ebene, auf der
     die Treffer markiert werden. Beide teilen dieselbe Typografie. */
  var editors = [];   // für Nachmessen bei Größenänderung

  function makeEditor(opts) {
    opts = opts || {};
    var back = el('div', { class: 'ta-back', 'aria-hidden': 'true' });
    var front = el('textarea', {
      class: 'ta-front', spellcheck: 'false', rows: '1',
      autocapitalize: 'off', autocorrect: 'off',
      placeholder: opts.placeholder || ''
    });
    var wrap = el('div', { class: 'ta-wrap' + (opts.small ? ' sm' : '') }, [back, front]);

    function grow() {
      /* Unsichtbare Elemente melden scrollHeight 0 — dann lieber die
         bisherige Höhe behalten, statt das Feld zuzuklappen. */
      if (front.offsetParent === null) return;
      front.style.height = 'auto';
      front.style.height = front.scrollHeight + 'px';
    }
    function paint(matches) {
      back.innerHTML = highlightHTML(front.value, matches);
      grow();
    }
    front.addEventListener('input', function () {
      grow();
      if (opts.onInput) opts.onInput(front.value);
    });

    var api = {
      node: wrap, input: front,
      get: function () { return front.value; },
      set: function (v) { front.value = v; grow(); },
      paint: paint,
      grow: grow
    };
    editors.push(api);
    return api;
  }

  /* Nach Layoutwechseln (Fenstergröße, Ansichtswechsel) alle Felder nachmessen */
  var regrowTimer = null;
  function regrowAll() {
    editors.forEach(function (e) { e.grow(); });
  }
  window.addEventListener('resize', function () {
    clearTimeout(regrowTimer);
    regrowTimer = setTimeout(regrowAll, 90);
  });

  /* ---------- Flag-Leiste ---------- */
  var FLAG_TITLES = {
    i: 're.I — Groß-/Kleinschreibung ignorieren',
    m: 're.M — ^ und $ gelten je Zeile',
    s: 're.S — der Punkt matcht auch \\n',
    x: 're.X — Whitespace und # -Kommentare im Muster',
    a: 're.A — \\w \\d \\b nur ASCII'
  };

  function makeFlags(active, onChange, which) {
    var list = (which || 'imsxa').split('');
    var state = { v: active || '' };
    var wrap = el('div', { class: 'flags' });
    list.forEach(function (f) {
      var b = el('button', {
        class: 'flag' + (state.v.indexOf(f) !== -1 ? ' on' : ''),
        type: 'button', title: FLAG_TITLES[f], text: f
      });
      b.addEventListener('click', function () {
        if (state.v.indexOf(f) !== -1) state.v = state.v.replace(f, '');
        else state.v += f;
        b.classList.toggle('on');
        onChange(state.v);
      });
      wrap.appendChild(b);
    });
    return {
      node: wrap,
      get: function () { return state.v; },
      set: function (v) {
        state.v = v || '';
        $$('.flag', wrap).forEach(function (b) {
          b.classList.toggle('on', state.v.indexOf(b.textContent) !== -1);
        });
      }
    };
  }

  /* ---------- Regex-Eingabefeld mit r"…" ---------- */
  function makeRegexInput(value, onInput, placeholder) {
    var inp = el('input', {
      class: 'input', type: 'text', spellcheck: 'false',
      autocapitalize: 'off', autocorrect: 'off',
      placeholder: placeholder || 'Muster eingeben …', value: value || ''
    });
    inp.addEventListener('input', function () { onInput(inp.value); });
    var wrap = el('div', { class: 'rx-wrap' }, [
      el('span', { class: 'rx-fix l', text: 'r"' }),
      inp,
      el('span', { class: 'rx-fix r', text: '"' })
    ]);
    return { node: wrap, input: inp, get: function () { return inp.value; },
             set: function (v) { inp.value = v; } };
  }

  /* ---------- Python-Code minimal einfärben ----------
     Ein einziger Durchlauf über die Quelle. Wichtig: niemals über
     bereits erzeugtes Markup nochmals ersetzen — sonst zerlegt ein
     Schlüsselwort wie "str" die eigenen class-Attribute. */
  var PY_KEYWORDS = /^(import|from|as|for|while|in|if|elif|else|def|class|return|print|not|and|or|is|None|True|False|lambda|with|try|except|len|set|sorted|bool|str|int|float|list|dict|range|enumerate|zip)$/;

  function pyCode(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var c = src[i];

      /* Kommentar bis Zeilenende */
      if (c === '#') {
        var j = src.indexOf('\n', i);
        if (j === -1) j = n;
        out += '<span class="cmt">' + esc(src.slice(i, j)) + '</span>';
        i = j;
        continue;
      }

      /* String, ggf. mit Präfix (r, f, fr, rf) und dreifachen Anführungszeichen */
      var pre = /^(?:fr|rf|br|rb|[rfbu])?("""|'''|"|')/i.exec(src.slice(i));
      if (pre && /["']/.test(pre[1][0])) {
        var q = pre[1];
        var bodyStart = i + pre[0].length;
        var end = src.indexOf(q, bodyStart);
        while (end !== -1 && src[end - 1] === '\\' && src[end - 2] !== '\\') {
          end = src.indexOf(q, end + 1);
        }
        if (end === -1) end = n; else end += q.length;
        out += '<span class="str">' + esc(src.slice(i, end)) + '</span>';
        i = end;
        continue;
      }

      /* Bezeichner — Schlüsselwort oder nicht */
      if (/[A-Za-z_]/.test(c)) {
        var k = i;
        while (k < n && /[A-Za-z0-9_]/.test(src[k])) k++;
        var word = src.slice(i, k);
        out += PY_KEYWORDS.test(word) ? '<span class="kw">' + word + '</span>' : esc(word);
        i = k;
        continue;
      }

      out += esc(c);
      i++;
    }
    return out;
  }

  /* ---------- Toast ---------- */
  var toastNode = null, toastTimer = null;
  function toast(msg) {
    if (!toastNode) {
      toastNode = el('div', { class: 'toast' });
      document.body.appendChild(toastNode);
    }
    toastNode.textContent = msg;
    toastNode.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastNode.classList.remove('on'); }, 2000);
  }

  /* ---------- Wiederverwendbares Mini-Playground ----------
     cfg: { pattern, text, flags, fn, repl, cap, onOpen }        */
  var FN_LABELS = [
    ['findall', 'findall'], ['finditer', 'finditer'], ['search', 'search'],
    ['match', 'match'], ['fullmatch', 'fullmatch'], ['sub', 'sub'], ['split', 'split']
  ];

  function makeDemo(cfg) {
    cfg = cfg || {};
    var state = {
      pattern: cfg.pattern || '',
      flags: cfg.flags || '',
      fn: cfg.fn || 'findall',
      repl: cfg.repl !== undefined ? cfg.repl : ''
    };

    var rx = makeRegexInput(state.pattern, function (v) { state.pattern = v; render(); });
    var flags = makeFlags(state.flags, function (v) { state.flags = v; render(); });

    var fnSel = el('select', { class: 'select' },
      FN_LABELS.map(function (f) {
        return el('option', { value: f[0], selected: f[0] === state.fn ? '' : null, text: 're.' + f[1] });
      })
    );
    fnSel.value = state.fn;
    fnSel.addEventListener('change', function () { state.fn = fnSel.value; syncRepl(); render(); });

    var replInp = el('input', {
      class: 'input', type: 'text', spellcheck: 'false',
      placeholder: 'Ersatztext', value: state.repl
    });
    replInp.addEventListener('input', function () { state.repl = replInp.value; render(); });
    var replWrap = el('div', { class: 'rx-wrap', style: 'display:none;flex:1 1 140px;min-width:0' }, [
      el('span', { class: 'rx-fix l', text: '→' }), replInp, el('span', { class: 'rx-fix r', text: '"' })
    ]);
    function syncRepl() { replWrap.style.display = state.fn === 'sub' ? 'flex' : 'none'; }
    syncRepl();

    var openBtn = el('button', {
      class: 'btn sm ghost', type: 'button', title: 'Im Playground öffnen',
      html: icon('arrow') + ' Playground'
    });
    openBtn.addEventListener('click', function () {
      RT.openInPlayground({ pattern: state.pattern, flags: state.flags, text: ed.get(), fn: state.fn, repl: state.repl });
    });

    var bar = el('div', { class: 'demo-bar' }, [rx.node, replWrap, flags.node, fnSel, openBtn]);

    var ed = makeEditor({ small: true, onInput: render });
    var out = el('div', { class: 'result' });
    var meta = el('div', { class: 'meta' });
    var body = el('div', { class: 'demo-body' }, [ed.node, out, meta]);

    var root = el('div', { class: 'demo' }, [bar, body]);
    if (cfg.cap) root.appendChild(el('div', { class: 'demo-cap', text: cfg.cap }));

    function render() {
      var text = ed.get();
      var res = E.run(state.pattern, state.flags, text, state.fn, { repl: state.repl });
      if (!res.ok) {
        ed.paint([]);
        out.className = 'result bad';
        out.textContent = res.empty ? 'Kein Muster.' : '⚠  ' + res.error;
        meta.innerHTML = '';
        return;
      }
      ed.paint(res.matches);
      out.className = 'result' + (res.matches.length ? ' ok' : '');
      out.textContent = res.display;
      var bits = ['<span>Treffer <b>' + res.matches.length + '</b></span>'];
      if (res.compiled.groupCount) bits.push('<span>Gruppen <b>' + res.compiled.groupCount + '</b></span>');
      if (res.warnings && res.warnings.length) bits.push('<span style="color:var(--warn)">' + esc(res.warnings[0]) + '</span>');
      meta.innerHTML = bits.join('');
    }

    ed.set(cfg.text || '');
    render();
    requestAnimationFrame(function () { ed.grow(); });
    return root;
  }

  /* ---------- Icons ---------- */
  var ICONS = {
    search: '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"/>',
    sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:   '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    arrow:  '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    book:   '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6.5A2.5 2.5 0 0 1 4 19.5Zm0 0A2.5 2.5 0 0 1 6.5 17H19"/>',
    play:   '<path d="M6 4.5v15l13-7.5-13-7.5Z"/>',
    check:  '<path d="m20 6-11 11-5-5"/>',
    reset:  '<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
    copy:   '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    bulb:   '<path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
    empty:  '<circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01M9 15h6"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  RT.ui = {
    $: $, $$: $$, el: el, esc: esc, icon: icon, toast: toast,
    highlightHTML: highlightHTML,
    makeEditor: makeEditor, makeFlags: makeFlags, makeRegexInput: makeRegexInput,
    regrowAll: regrowAll,
    makeDemo: makeDemo, pyCode: pyCode,
    FN_LABELS: FN_LABELS
  };
})(window);
