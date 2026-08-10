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

  function debounce(fn, ms) {
    var timer = null;
    function debounced() {
      var self = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, ms);
    }
    debounced.cancel = function () {
      clearTimeout(timer);
      timer = null;
    };
    return debounced;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('Kopiert'); },
        function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    var ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0;opacity:0' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('Kopiert');
    } catch (e) {
      toast('Kopieren nicht möglich');
    }
    document.body.removeChild(ta);
  }

  function modKeyLabel() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Strg';
  }

  /* ---------- Treffer im Text markieren ---------- */
  function highlightHTML(text, matches) {
    if (!matches || !matches.length) return esc(text) + '\n';
    var out = '', pos = 0;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      /* Engine-Positionen folgen Python (Unicode-Codepoints). Zum
         Ausschneiden im DOM brauchen wir dagegen UTF-16-Indizes. */
      var start = m.startCU !== undefined ? m.startCU : m.start;
      var end = m.endCU !== undefined ? m.endCU : m.end;
      if (start < pos) continue;
      out += esc(text.slice(pos, start));
      var cls = 'hit' + (i % 2 ? ' alt' : '') + (m.text === '' ? ' empty' : '');
      out += '<mark class="' + cls + '">' + esc(m.text) + '</mark>';
      pos = end;
    }
    out += esc(text.slice(pos));
    return out + '\n';   // Abschluss-Newline hält die Höhe stabil
  }

  /* ---------- Überlagerter Editor ----------
     Textarea mit unsichtbarer Schrift über einer Ebene, auf der
     die Treffer markiert werden. Beide teilen dieselbe Typografie. */
  var editors = [];   // für Nachmessen bei Größenänderung
  var disposables = [];

  function onDispose(node, fn) {
    disposables.push({ node: node, fn: fn });
  }

  function disposeWithin(root) {
    if (!root) return;
    disposables = disposables.filter(function (d) {
      if (d.node === root || (root.contains && root.contains(d.node))) {
        try { d.fn(); } catch (e) { /* Aufräumen darf Navigation nie blockieren. */ }
        return false;
      }
      return true;
    });
    editors.slice().forEach(function (editor) {
      if (editor.node === root || (root.contains && root.contains(editor.node))) editor.destroy();
    });
  }

  function makeEditor(opts) {
    opts = opts || {};
    var back = el('div', { class: 'ta-back', 'aria-hidden': 'true' });
    var front = el('textarea', {
      class: 'ta-front', spellcheck: 'false', rows: '1',
      autocapitalize: 'off', autocorrect: 'off',
      placeholder: opts.placeholder || '',
      'aria-label': opts.ariaLabel || 'Testtext'
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
    function onInput() {
      grow();
      if (opts.onInput) opts.onInput(front.value);
    }
    front.addEventListener('input', onInput);

    var api = {
      node: wrap, input: front,
      get: function () { return front.value; },
      set: function (v) { front.value = v; grow(); },
      paint: paint,
      grow: grow,
      destroy: function () {
        front.removeEventListener('input', onInput);
        var i = editors.indexOf(api);
        if (i !== -1) editors.splice(i, 1);
      }
    };
    editors.push(api);
    return api;
  }

  /* Nach Layoutwechseln (Fenstergröße, Ansichtswechsel) alle Felder nachmessen */
  var regrowTimer = null;
  function regrowAll() {
    editors = editors.filter(function (e) {
      return typeof e.node.isConnected !== 'boolean' || e.node.isConnected;
    });
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

  function makeFlags(active, onChange, which, label) {
    var list = (which || 'imsxa').split('');
    var state = { v: active || '' };
    var wrap = el('div', { class: 'flags', role: 'group', 'aria-label': label || 'Regex-Flags' });
    list.forEach(function (f) {
      var on = state.v.indexOf(f) !== -1;
      var b = el('button', {
        class: 'flag' + (on ? ' on' : ''),
        type: 'button', title: FLAG_TITLES[f], text: f,
        'aria-label': f,
        'aria-pressed': on ? 'true' : 'false'
      });
      b.addEventListener('click', function () {
        if (state.v.indexOf(f) !== -1) state.v = state.v.replace(f, '');
        else state.v += f;
        var isOn = state.v.indexOf(f) !== -1;
        b.classList.toggle('on', isOn);
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
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
          var isOn = state.v.indexOf(b.textContent) !== -1;
          b.classList.toggle('on', isOn);
          b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        });
      }
    };
  }

  /* ---------- Regex-Eingabefeld mit r"…" ---------- */
  function makeRegexInput(value, onInput, placeholder, label) {
    var inp = el('input', {
      class: 'input', type: 'text', spellcheck: 'false',
      autocapitalize: 'off', autocorrect: 'off',
      maxlength: '10000',
      placeholder: placeholder || 'Muster eingeben …', value: value || '',
      'aria-label': label || 'Regulärer Ausdruck'
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
      toastNode = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
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

  /* ---------- Abbrechbare Regex-Auswertung ----------
     Nutzereingaben laufen in einem Worker. So kann ein Muster mit
     extremem Backtracking nicht den UI-Thread festhalten. file://
     bleibt als bewusst synchroner Kompatibilitätsmodus erhalten. */
  var SAFE_TIMEOUT = 600;
  var safeWorker = null;
  var safeSeq = 0;
  var safePending = {};
  var safeWorkerURL = null;

  try {
    var coreSrc = document.currentScript && document.currentScript.src;
    if (coreSrc) safeWorkerURL = new URL('regex-worker.js', coreSrc).href;
  } catch (e) { safeWorkerURL = null; }

  function timeoutResult(ms) {
    return {
      ok: false,
      timeout: true,
      error: 'Auswertung nach ' + ms + ' ms abgebrochen. Das Muster verursacht wahrscheinlich starkes Backtracking.'
    };
  }

  function workerErrorResult() {
    return { ok: false, error: 'Die geschützte Regex-Auswertung konnte nicht gestartet werden.' };
  }

  function stopSafeWorker(resultFactory) {
    if (safeWorker) safeWorker.terminate();
    safeWorker = null;
    Object.keys(safePending).forEach(function (id) {
      var pending = safePending[id];
      clearTimeout(pending.timer);
      delete safePending[id];
      pending.resolve(pending.jobs.map(resultFactory));
    });
  }

  function restartSafeWorkerAfterTimeout(timedOutId, ms) {
    if (safeWorker) safeWorker.terminate();
    safeWorker = null;
    var retry = [];
    Object.keys(safePending).forEach(function (id) {
      var pending = safePending[id];
      clearTimeout(pending.timer);
      delete safePending[id];
      if (String(id) === String(timedOutId)) {
        pending.resolve(pending.jobs.map(function () { return timeoutResult(ms); }));
      } else {
        retry.push(pending);
      }
    });
    /* Neuere Eingaben hingen nur hinter dem problematischen Auftrag in
       derselben Worker-Queue. Sie werden auf einem frischen Worker erneut
       ausgeführt, statt fälschlich ebenfalls als Timeout zu enden. */
    retry.forEach(function (pending) {
      safeBatch(pending.jobs, { timeout: pending.timeout }).then(pending.resolve);
    });
  }

  function ensureSafeWorker() {
    if (safeWorker) return true;
    if (!safeWorkerURL || !global.Worker || (global.location && global.location.protocol === 'file:')) return false;
    try {
      safeWorker = new global.Worker(safeWorkerURL);
      safeWorker.addEventListener('message', function (event) {
        var msg = event.data || {};
        var pending = safePending[msg.id];
        if (!pending) return;
        clearTimeout(pending.timer);
        delete safePending[msg.id];
        pending.resolve(Array.isArray(msg.results) ? msg.results : pending.jobs.map(workerErrorResult));
      });
      safeWorker.addEventListener('error', function () {
        stopSafeWorker(workerErrorResult);
      });
      return true;
    } catch (e) {
      safeWorker = null;
      return false;
    }
  }

  function syncBatch(jobs) {
    return jobs.map(function (job) {
      try {
        return E.run(job.pattern, job.flags || '', job.text || '', job.fn || 'findall', job.extra || {});
      } catch (error) {
        return { ok: false, error: 'Die Regex-Auswertung ist unerwartet fehlgeschlagen.' };
      }
    });
  }

  function safeBatch(jobs, opts) {
    jobs = Array.isArray(jobs) ? jobs : [];
    opts = opts || {};
    if (!jobs.length) return Promise.resolve([]);
    if (!ensureSafeWorker()) {
      /* Worker von file:// ist browserabhängig bzw. meist gesperrt.
         Der beworbene Direktstart behält daher die volle Funktion. */
      return Promise.resolve().then(function () { return syncBatch(jobs); });
    }

    var id = ++safeSeq;
    var ms = Math.max(100, Number(opts.timeout) || SAFE_TIMEOUT);
    return new Promise(function (resolve) {
      var timer = setTimeout(function () {
        if (!safePending[id]) return;
        restartSafeWorkerAfterTimeout(id, ms);
      }, ms);
      safePending[id] = { resolve: resolve, timer: timer, jobs: jobs, timeout: ms };
      try {
        safeWorker.postMessage({ id: id, jobs: jobs });
      } catch (e) {
        clearTimeout(timer);
        delete safePending[id];
        resolve(jobs.map(workerErrorResult));
        stopSafeWorker(workerErrorResult);
      }
    });
  }

  function safeRun(pattern, flags, text, fn, extra, opts) {
    return safeBatch([{ pattern: pattern, flags: flags, text: text, fn: fn, extra: extra }], opts)
      .then(function (results) { return results[0]; });
  }

  function makeDemo(cfg) {
    cfg = cfg || {};
    var state = {
      pattern: cfg.pattern || '',
      flags: cfg.flags || '',
      fn: cfg.fn || 'findall',
      repl: cfg.repl !== undefined ? cfg.repl : ''
    };

    var alive = true;
    var renderSeq = 0;
    var rx = makeRegexInput(state.pattern, function (v) { state.pattern = v; requestRender(); }, '', 'Regulärer Ausdruck im Beispiel');
    var flags = makeFlags(state.flags, function (v) { state.flags = v; requestRender(); }, null, 'Regex-Flags im Beispiel');

    var fnSel = el('select', { class: 'select', 'aria-label': 'Regex-Funktion im Beispiel' },
      FN_LABELS.map(function (f) {
        return el('option', { value: f[0], selected: f[0] === state.fn ? '' : null, text: 're.' + f[1] });
      })
    );
    fnSel.value = state.fn;
    fnSel.addEventListener('change', function () { state.fn = fnSel.value; syncRepl(); requestRender(); });

    var replInp = el('input', {
      class: 'input', type: 'text', spellcheck: 'false',
      placeholder: 'Ersatztext', value: state.repl,
      'aria-label': 'Ersatztext im Beispiel'
    });
    replInp.addEventListener('input', function () { state.repl = replInp.value; requestRender(); });
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

    var ed = makeEditor({ small: true, onInput: requestRender, ariaLabel: 'Testtext im Beispiel' });
    var out = el('div', { class: 'result', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    var meta = el('div', { class: 'meta' });
    var body = el('div', { class: 'demo-body' }, [ed.node, out, meta]);

    var root = el('div', { class: 'demo' }, [bar, body]);
    if (cfg.cap) root.appendChild(el('div', { class: 'demo-cap', text: cfg.cap }));

    function paintResult(res) {
      if (!alive) return;
      out.setAttribute('aria-busy', 'false');
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

    function snapshot() {
      return { pattern: state.pattern, flags: state.flags, text: ed.get(), fn: state.fn, repl: state.repl };
    }

    function renderSync() {
      var s = snapshot();
      renderSeq++;
      paintResult(E.run(s.pattern, s.flags, s.text, s.fn, { repl: s.repl }));
    }

    function renderAsync() {
      var seq = renderSeq;
      var s = snapshot();
      out.setAttribute('aria-busy', 'true');
      safeRun(s.pattern, s.flags, s.text, s.fn, { repl: s.repl }).then(function (res) {
        if (!alive || seq !== renderSeq) return;
        paintResult(res);
      });
    }

    var render = debounce(renderAsync, 90);

    function requestRender() {
      renderSeq++;
      ed.paint([]);
      out.setAttribute('aria-busy', 'true');
      render();
    }

    ed.set(cfg.text || '');
    renderSync();
    requestAnimationFrame(function () { ed.grow(); });
    onDispose(root, function () {
      alive = false;
      renderSeq++;
      render.cancel();
      ed.destroy();
    });
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
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" focusable="false" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  RT.ui = {
    $: $, $$: $$, el: el, esc: esc, icon: icon, toast: toast,
    debounce: debounce, copyText: copyText, modKeyLabel: modKeyLabel,
    highlightHTML: highlightHTML,
    makeEditor: makeEditor, makeFlags: makeFlags, makeRegexInput: makeRegexInput,
    regrowAll: regrowAll, onDispose: onDispose, disposeWithin: disposeWithin,
    makeDemo: makeDemo, pyCode: pyCode,
    FN_LABELS: FN_LABELS
  };
  RT.safeRun = { run: safeRun, batch: safeBatch, timeout: SAFE_TIMEOUT };
})(window);
