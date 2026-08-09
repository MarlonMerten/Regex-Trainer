/* =============================================================
   ui-trainer.js — Ansicht "Training"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el, E = RT.engine;

  var lvBox, dotBox, cardBox;
  var level = 1, idx = 0;
  var attempt = { pattern: '', flags: '', hints: 0, revealed: false };
  var caseNodes = [];

  /* ---- Soll-Ergebnisse einmalig aus der Musterlösung berechnen ---- */
  function prepare() {
    RT.exercises.forEach(function (ex) {
      ex.fn = ex.fn || 'findall';
      ex.cases.forEach(function (c) {
        var res = E.run(ex.solution, ex.flags || '', c.text, ex.fn, { repl: ex.repl });
        c.want = res.ok ? res.display : '⚠ ' + res.error;
        c.wantMatches = res.ok ? res.matches : [];
      });
    });
  }

  function build(container) {
    prepare();
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Training' }),
      el('p', { text: 'Jede Aufgabe wird gegen mehrere Texte geprüft — der zweite ist die Gegenprobe. Ein Muster, das nur zufällig passt, fällt hier durch. Rückmeldung kommt sofort beim Tippen.' })
    ]));

    lvBox = el('div', { class: 'lv-grid' });
    dotBox = el('div', { class: 'ex-nav' });
    cardBox = el('div');
    container.appendChild(lvBox);
    container.appendChild(dotBox);
    container.appendChild(cardBox);

    level = RT.store.get('lastLevel') || 1;
    renderLevels();
    openLevel(level, true);
  }

  function renderLevels() {
    lvBox.innerHTML = '';
    RT.levels.forEach(function (lv) {
      var p = RT.store.levelProgress(lv.id);
      var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      var card = el('button', {
        type: 'button', class: 'lv-card' + (lv.id === level ? ' on' : ''),
        style: '--lv:' + lv.color
      }, [
        el('div', { class: 'lv-n', text: 'STUFE ' + lv.id }),
        el('div', { class: 'lv-name', text: lv.name }),
        el('div', { class: 'lv-sub', text: lv.sub }),
        el('div', { class: 'lv-bar' }, el('i', { class: 'lv-fill', style: 'width:' + pct + '%' })),
        el('div', { class: 'lv-count', text: p.done + ' / ' + p.total + ' gelöst' })
      ]);
      card.addEventListener('click', function () { openLevel(lv.id); });
      lvBox.appendChild(card);
    });
  }

  function exercisesOf(lv) {
    return RT.exercises.filter(function (e) { return e.level === lv; });
  }

  function openLevel(lv, keepIndex) {
    level = lv;
    RT.store.set('lastLevel', lv);
    if (!keepIndex) idx = 0;
    var list = exercisesOf(level);
    // erste ungelöste Aufgabe ansteuern
    if (!keepIndex) {
      var firstOpen = list.findIndex(function (e) { return !RT.store.isSolved(e.id); });
      idx = firstOpen === -1 ? 0 : firstOpen;
    }
    if (idx >= list.length) idx = 0;
    renderLevels();
    renderDots();
    openExercise(idx);
  }

  function renderDots() {
    var list = exercisesOf(level);
    dotBox.innerHTML = '';
    list.forEach(function (ex, i) {
      var d = el('button', {
        type: 'button',
        class: 'ex-dot' + (i === idx ? ' on' : '') + (RT.store.isSolved(ex.id) ? ' solved' : ''),
        title: ex.title, text: String(i + 1)
      });
      d.addEventListener('click', function () { openExercise(i); });
      dotBox.appendChild(d);
    });
  }

  function openExercise(i) {
    var list = exercisesOf(level);
    idx = Math.max(0, Math.min(i, list.length - 1));
    attempt = { pattern: '', flags: list[idx].requireFlags || '', hints: 0, revealed: false };
    renderDots();
    renderExercise(list[idx]);
  }

  function renderExercise(ex) {
    caseNodes = [];
    cardBox.innerHTML = '';

    var solved = RT.store.isSolved(ex.id);

    /* --- Kopf --- */
    var head = el('div', { style: 'display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-bottom:4px' }, [
      el('span', { class: 'tag', text: 'Aufgabe ' + (idx + 1) + ' / ' + exercisesOf(level).length }),
      el('h2', { style: 'font-size:19px', text: ex.title }),
      solved ? el('span', { class: 'tag', style: 'background:var(--ok-soft);color:var(--ok);border-color:transparent', text: 'gelöst' }) : null
    ]);

    var task = el('div', { class: 'ex-task', html: ex.task });

    /* --- Eingabe --- */
    var rx = U.makeRegexInput('', function (v) { attempt.pattern = v; evaluate(ex); },
                              'Dein Muster …');
    var flagsUI = U.makeFlags(attempt.flags, function (v) { attempt.flags = v; evaluate(ex); });

    var fnHint = ex.fn === 'sub'
      ? el('span', { class: 'hint-r', text: 're.sub(muster, r"' + (ex.repl === '' ? '' : ex.repl) + '", text)' })
      : ex.fn === 'split'
        ? el('span', { class: 'hint-r', text: 're.split(muster, text)' })
        : el('span', { class: 'hint-r', text: 're.findall(muster, text)' });

    var inputBlock = el('div', { class: 'pg-block' }, [
      el('div', { class: 'field-head' }, [el('span', { class: 'label', text: 'Dein Muster' }), fnHint]),
      rx.node,
      el('div', { class: 'pg-row', style: 'margin-top:2px' }, [
        flagsUI.node,
        ex.requireFlags
          ? el('span', { style: 'font-size:12.5px;color:var(--warn)', text: 'Für diese Aufgabe brauchst du das Flag ' + ex.requireFlags + '.' })
          : el('span', { style: 'font-size:12.5px;color:var(--text-3)', text: 'Flags bei Bedarf zuschalten.' })
      ])
    ]);

    /* --- Testfälle --- */
    var casesBox = el('div', { class: 'ex-cases' });
    ex.cases.forEach(function (c, ci) {
      var hl = el('div', { class: 'hl-box' });
      var got = el('div', { class: 'val got', text: '—' });
      var status = el('span', { class: 'st', text: 'offen' });
      var node = el('div', { class: 'case' }, [
        el('div', { class: 'case-head' }, [
          el('span', { text: ci === 0 ? 'Testtext' : 'Gegenprobe ' + ci }),
          status
        ]),
        el('div', { class: 'case-body' }, [
          hl,
          el('div', { class: 'io' }, [
            el('span', { class: 'lbl', text: 'Erwartet' }),
            el('div', { class: 'val want', text: c.want })
          ]),
          el('div', { class: 'io' }, [
            el('span', { class: 'lbl', text: 'Dein Ergebnis' }),
            got
          ])
        ])
      ]);
      caseNodes.push({ node: node, hl: hl, got: got, status: status, data: c });
      casesBox.appendChild(node);
    });

    /* --- Aktionen --- */
    var hintsBox = el('div', { class: 'hints' });
    var verdictBox = el('div');

    var hintBtn = el('button', { class: 'btn sm', type: 'button', html: U.icon('bulb') + ' Tipp' });
    hintBtn.addEventListener('click', function () {
      if (attempt.hints >= ex.hints.length) return;
      attempt.hints++;
      hintsBox.appendChild(el('div', { class: 'hint', 'data-n': String(attempt.hints), html: ex.hints[attempt.hints - 1] }));
      if (attempt.hints >= ex.hints.length) hintBtn.disabled = true;
    });

    var solBtn = el('button', { class: 'btn sm ghost', type: 'button', text: 'Lösung zeigen' });
    solBtn.addEventListener('click', function () {
      attempt.revealed = true;
      rx.set(ex.solution);
      attempt.pattern = ex.solution;
      flagsUI.set(ex.flags || '');
      attempt.flags = ex.flags || '';
      evaluate(ex);
      U.toast('Lösung eingesetzt — versteh sie im Playground');
    });

    var pgBtn = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('play') + ' Im Playground' });
    pgBtn.addEventListener('click', function () {
      RT.openInPlayground({
        pattern: attempt.pattern || ex.solution, flags: attempt.flags,
        text: ex.cases[0].text, fn: ex.fn, repl: ex.repl || ''
      });
    });

    var prevBtn = el('button', { class: 'btn sm ghost', type: 'button', html: '&larr; Vorherige' });
    var nextBtn = el('button', { class: 'btn sm ghost', type: 'button', html: 'Nächste &rarr;' });
    prevBtn.addEventListener('click', function () { openExercise(idx - 1); });
    nextBtn.addEventListener('click', function () { goNext(); });
    prevBtn.disabled = idx === 0;

    var actions = el('div', { class: 'pg-row' }, [
      hintBtn, solBtn, pgBtn,
      el('span', { class: 'spacer' }), prevBtn, nextBtn
    ]);

    cardBox.appendChild(el('div', { class: 'card card-pad ex-card' }, [
      head, task, inputBlock, casesBox, hintsBox, verdictBox, actions
    ]));

    cardBox._verdict = verdictBox;
    evaluate(ex);
    setTimeout(function () { rx.input.focus(); }, 60);
  }

  function goNext() {
    var list = exercisesOf(level);
    if (idx + 1 < list.length) { openExercise(idx + 1); return; }
    var nextLv = level + 1;
    if (nextLv <= RT.levels.length) { openLevel(nextLv); U.toast('Stufe ' + nextLv + ' — weiter geht’s'); }
    else { U.toast('Alle Stufen durch. Respekt.'); }
  }

  function evaluate(ex) {
    var verdict = cardBox._verdict;
    var anyInput = attempt.pattern.trim() !== '';
    var allPass = anyInput;
    var compileError = null;

    caseNodes.forEach(function (cn) {
      var c = cn.data;
      if (!anyInput) {
        cn.node.className = 'case';
        cn.status.textContent = 'offen';
        cn.hl.innerHTML = U.esc(c.text);
        cn.got.textContent = '—';
        cn.got.classList.remove('bad');
        return;
      }
      var res = E.run(attempt.pattern, attempt.flags, c.text, ex.fn, { repl: ex.repl });
      if (!res.ok) {
        compileError = res.error;
        allPass = false;
        cn.node.className = 'case fail';
        cn.status.textContent = 'Fehler';
        cn.hl.innerHTML = U.esc(c.text);
        cn.got.textContent = '⚠ ' + res.error;
        cn.got.classList.add('bad');
        return;
      }
      var ok = res.display === c.want;
      if (!ok) allPass = false;
      cn.node.className = 'case ' + (ok ? 'pass' : 'fail');
      cn.status.textContent = ok ? '✓ passt' : '✗ weicht ab';
      cn.hl.innerHTML = U.highlightHTML(c.text, res.matches);
      cn.got.textContent = res.display;
      cn.got.classList.toggle('bad', !ok);
    });

    verdict.innerHTML = '';
    if (!anyInput) return;

    if (allPass) {
      var wasSolved = RT.store.isSolved(ex.id);
      if (!attempt.revealed) RT.store.markSolved(ex.id);
      renderDots();
      renderLevels();
      RT.refreshProgress();

      var nb = el('button', { class: 'btn sm primary', type: 'button', html: 'Nächste Aufgabe &nbsp;&rarr;' });
      nb.addEventListener('click', goNext);
      verdict.appendChild(el('div', { class: 'verdict win' }, [
        el('span', { class: 'big', text: '✓' }),
        el('span', { text: attempt.revealed
          ? 'Die Musterlösung passt — probier sie beim nächsten Mal selbst.'
          : (wasSolved ? 'Passt wieder. Alle Testtexte bestanden.' : 'Alle Testtexte bestanden. Sitzt.') }),
        el('span', { class: 'spacer', style: 'flex:1' }),
        nb
      ]));
      if (!wasSolved && !attempt.revealed) U.toast('Gelöst  ·  ' + ex.title);
    } else if (!compileError) {
      var failing = caseNodes.filter(function (c) { return c.node.classList.contains('fail'); }).length;
      verdict.appendChild(el('div', { class: 'verdict miss' }, [
        el('span', { class: 'big', text: '·' }),
        el('span', { text: failing === 1
          ? 'Ein Testtext weicht noch ab — vergleich dort „Erwartet“ und „Dein Ergebnis“.'
          : failing + ' Testtexte weichen ab. Schau dir die markierten Treffer an.' })
      ]));
    }
  }

  RT.views = RT.views || {};
  RT.views.train = {
    build: build,
    refresh: function () { if (lvBox) { renderLevels(); renderDots(); } }
  };
})(window);
