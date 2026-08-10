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
  var pendingRoute = null;
  var evaluationSeq = 0;
  var randomMode = false;
  var lastRandomId = null;

  /* ---- Soll-Ergebnisse einmalig aus der Musterlösung berechnen ---- */
  function prepare() {
    if (RT._exercisesPrepared) return;
    RT.exercises.forEach(function (ex) {
      ex.fn = ex.fn || 'findall';
      ex.cases.forEach(function (c) {
        var res = E.run(ex.solution, ex.flags || '', c.text, ex.fn, { repl: ex.repl });
        c.want = res.ok ? res.display : '⚠ ' + res.error;
        c.wantValue = res.ok ? res.value : null;
        c.wantMatches = res.ok ? res.matches : [];
      });
    });
    RT._exercisesPrepared = true;
  }

  function resultsMatch(res, c, ex) {
    if (!res.ok || c.wantValue === null) return false;
    var fn = ex.fn || 'findall';
    if (fn === 'findall') return E.sameResult(res.value, c.wantValue);
    if (fn === 'split') return E.sameResult(res.value, c.wantValue);
    if (fn === 'sub') return res.value === c.wantValue;
    if (fn === 'finditer') return sameMatchList(res.value, c.wantValue);
    return sameMatch(res.value, c.wantValue);
  }

  function sameMatch(a, b) {
    if (a === null || b === null) return a === b;
    if (!a || !b || a.start !== b.start || a.end !== b.end || a.text !== b.text) return false;
    if (!sameArray(a.groups || [], b.groups || [])) return false;
    var an = a.named || {}, bn = b.named || {};
    var ak = Object.keys(an).sort(), bk = Object.keys(bn).sort();
    if (!sameArray(ak, bk)) return false;
    return ak.every(function (key) { return an[key] === bn[key]; });
  }

  function sameArray(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function sameMatchList(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!sameMatch(a[i], b[i])) return false;
    return true;
  }

  function requirementFailures(ex, snap, results) {
    var failures = [];
    var requiredFlags = ex.requireFlags || '';
    for (var i = 0; i < requiredFlags.length; i++) {
      if (snap.flags.indexOf(requiredFlags[i]) === -1) {
        failures.push('Aktiviere das geforderte Flag ' + requiredFlags[i] + '.');
      }
    }
    if (ex.requirePatternWhitespace && !/[ \t\n\r\f\v]/.test(snap.pattern)) {
      failures.push('Verwende wie gefordert sichtbaren Whitespace im Muster.');
    }
    if (ex.requireGroupNames && results && results[0] && results[0].ok) {
      var names = results[0].compiled.groupNames || [];
      var missing = ex.requireGroupNames.filter(function (name) { return names.indexOf(name) === -1; });
      if (missing.length) failures.push('Es fehlen die benannten Gruppen: ' + missing.join(', ') + '.');
    }
    return failures;
  }

  function build(container) {
    prepare();
    var randomBtn = el('button', { class: 'btn random-train-btn', type: 'button', text: '↝ Zufällige Aufgabe' });
    randomBtn.addEventListener('click', openRandom);
    container.appendChild(el('div', { class: 'page-head page-head-actions' }, [
      el('div', null, [
        el('h1', { text: 'Üben' }),
        el('p', { text: 'Schreibe das Muster selbst. Wir prüfen es sofort gegen mehrere Texte und zeigen dir genau, was noch nicht passt.' })
      ]),
      randomBtn
    ]));

    lvBox = el('div', { class: 'lv-grid' });
    dotBox = el('div', { class: 'ex-nav', role: 'navigation', 'aria-label': 'Aufgaben dieser Stufe' });
    cardBox = el('div');
    container.appendChild(lvBox);
    container.appendChild(dotBox);
    container.appendChild(cardBox);

    level = RT.store.get('lastLevel') || 1;
    renderLevels();
    if (pendingRoute) {
      openById(pendingRoute);
      pendingRoute = null;
    } else {
      openLevel(level, false);
    }
  }

  function exerciseById(id) {
    for (var i = 0; i < RT.exercises.length; i++) {
      if (RT.exercises[i].id === id) return RT.exercises[i];
    }
    return null;
  }

  function openById(id) {
    var ex = exerciseById(id);
    if (!ex) return false;
    level = ex.level;
    RT.store.set('lastLevel', level);
    var list = exercisesOf(level);
    idx = list.findIndex(function (e) { return e.id === id; });
    if (idx < 0) idx = 0;
    renderLevels();
    renderDots();
    openExercise(idx);
    return true;
  }

  function openRoute(sub) {
    if (!sub) return;
    if (!lvBox) {
      pendingRoute = sub;
      return;
    }
    if (sub === 'random') {
      openRandom();
      return;
    }
    randomMode = false;
    if (!openById(sub)) {
      var list = exercisesOf(level);
      if (list[idx]) RT.setRoute('train', list[idx].id);
    }
  }

  function renderLevels() {
    lvBox.innerHTML = '';
    RT.levels.forEach(function (lv) {
      var p = RT.store.levelProgress(lv.id);
      var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      var card = el('button', {
        type: 'button', class: 'lv-card' + (lv.id === level ? ' on' : ''),
        style: '--lv:' + lv.color,
        'aria-current': lv.id === level ? 'step' : 'false'
      }, [
        el('div', { class: 'lv-n', text: 'STUFE ' + lv.id }),
        el('div', { class: 'lv-name', text: lv.name }),
        el('div', { class: 'lv-sub', text: lv.sub }),
        el('div', {
          class: 'lv-bar', role: 'progressbar',
          'aria-label': 'Fortschritt Stufe ' + lv.id,
          'aria-valuemin': '0', 'aria-valuemax': String(p.total), 'aria-valuenow': String(p.done)
        }, el('i', { class: 'lv-fill', style: 'width:' + pct + '%', 'aria-hidden': 'true' })),
        el('div', { class: 'lv-count', text: p.done + ' / ' + p.total + ' gelöst' })
      ]);
      card.addEventListener('click', function () { openLevel(lv.id); });
      lvBox.appendChild(card);
    });
  }

  function exercisesOf(lv) {
    return RT.exercises.filter(function (e) { return e.level === lv; });
  }

  function randomFrom(list) {
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function openRandom() {
    var sameLevel = exercisesOf(level).filter(function (exercise) {
      return !RT.store.isSolved(exercise.id) && exercise.id !== lastRandomId;
    });
    var allOpen = RT.exercises.filter(function (exercise) {
      return !RT.store.isSolved(exercise.id) && exercise.id !== lastRandomId;
    });
    var fallback = RT.exercises.filter(function (exercise) { return exercise.id !== lastRandomId; });
    var chosen = randomFrom(sameLevel) || randomFrom(allOpen) || randomFrom(fallback) || RT.exercises[0];
    if (!chosen) return;
    randomMode = true;
    lastRandomId = chosen.id;
    openById(chosen.id);
  }

  function openLevel(lv, keepIndex) {
    randomMode = false;
    level = lv;
    RT.store.set('lastLevel', lv);
    if (!keepIndex) idx = 0;
    var list = exercisesOf(level);
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
        title: ex.title, text: String(i + 1),
        'aria-label': 'Aufgabe ' + (i + 1) + ': ' + ex.title,
        'aria-current': i === idx ? 'step' : 'false'
      });
      d.addEventListener('click', function () { randomMode = false; openExercise(i); });
      dotBox.appendChild(d);
    });
  }

  function openExercise(i) {
    var list = exercisesOf(level);
    idx = Math.max(0, Math.min(i, list.length - 1));
    evaluateDebounced.cancel();
    evaluationSeq++;
    attempt = { pattern: '', flags: '', hints: 0, revealed: false };
    renderDots();
    renderExercise(list[idx]);
    RT.setRoute('train', list[idx].id);
    requestAnimationFrame(function () {
      var heading = cardBox && cardBox.querySelector('.ex-title');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }

  function renderExercise(ex) {
    caseNodes = [];
    cardBox.innerHTML = '';

    var solved = RT.store.isSolved(ex.id);

    var head = el('div', { class: 'ex-head' }, [
      el('span', { class: 'tag', text: 'Aufgabe ' + (idx + 1) + ' / ' + exercisesOf(level).length }),
      randomMode ? el('span', { class: 'tag tag-random', text: 'Zufallsmix' }) : null,
      el('h2', { class: 'ex-title', text: ex.title }),
      solved ? el('span', { class: 'tag tag-ok', text: 'gelöst' }) : null
    ]);

    var task = el('div', { class: 'ex-task', html: ex.task });

    var rx = U.makeRegexInput('', function (v) { attempt.pattern = v; requestEvaluation(ex); },
                              'Dein Muster …', 'Dein regulärer Ausdruck');
    var flagsUI = U.makeFlags(attempt.flags, function (v) { attempt.flags = v; requestEvaluation(ex); }, null, 'Regex-Flags für diese Aufgabe');

    var fnHint = ex.fn === 'sub'
      ? el('span', { class: 'hint-r', text: 're.sub(muster, r"' + (ex.repl === '' ? '' : ex.repl) + '", text)' })
      : ex.fn === 'split'
        ? el('span', { class: 'hint-r', text: 're.split(muster, text)' })
        : el('span', { class: 'hint-r', text: 're.' + (ex.fn || 'findall') + '(muster, text)' });

    var inputBlock = el('div', { class: 'pg-block' }, [
      el('div', { class: 'field-head' }, [el('span', { class: 'label', text: 'Dein Muster' }), fnHint]),
      rx.node,
      el('div', { class: 'pg-row pg-row-tight' }, [
        flagsUI.node,
        ex.requireFlags
          ? el('span', { class: 'flag-hint warn', text: 'Für diese Aufgabe brauchst du das Flag ' + ex.requireFlags + '.' })
          : el('span', { class: 'flag-hint', text: 'Flags bei Bedarf zuschalten.' })
      ])
    ]);

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

    var hintsBox = el('div', { class: 'hints' });
    var verdictBox = el('div', { class: 'verdict-live', 'aria-live': 'polite', 'aria-atomic': 'true' });

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
      evaluateSync(ex);
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
    var nextBtn = el('button', { class: 'btn sm ghost', type: 'button', html: randomMode ? 'Neue Zufallsaufgabe &rarr;' : 'Nächste &rarr;' });
    prevBtn.addEventListener('click', function () { openExercise(idx - 1); });
    nextBtn.addEventListener('click', function () { goNext(); });
    prevBtn.disabled = randomMode || idx === 0;

    var actions = el('div', { class: 'pg-row' }, [
      hintBtn, solBtn, pgBtn,
      el('span', { class: 'spacer' }), prevBtn, nextBtn
    ]);

    cardBox.appendChild(el('div', { class: 'card card-pad ex-card' }, [
      head, task, inputBlock, casesBox, hintsBox, verdictBox, actions
    ]));

    cardBox._verdict = verdictBox;
    paintEvaluation(ex, currentSnapshot(), null);
    if (global.innerWidth > 780 && global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setTimeout(function () { if (rx.input.isConnected) rx.input.focus({ preventScroll: true }); }, 60);
    }
  }

  function goNext() {
    if (randomMode) { openRandom(); return; }
    var list = exercisesOf(level);
    if (idx + 1 < list.length) { openExercise(idx + 1); return; }
    var nextLv = level + 1;
    if (nextLv <= RT.levels.length) { openLevel(nextLv); U.toast('Stufe ' + nextLv + ' — weiter geht\'s'); }
    else { U.toast('Alle Stufen durch. Respekt.'); }
  }

  function currentSnapshot() {
    return {
      pattern: attempt.pattern,
      flags: attempt.flags,
      revealed: attempt.revealed
    };
  }

  function paintEvaluation(ex, snap, results) {
    var verdict = cardBox._verdict;
    if (!verdict) return;
    verdict.setAttribute('aria-busy', 'false');
    var anyInput = snap.pattern !== '';
    var allPass = anyInput;
    var compileError = null;

    caseNodes.forEach(function (cn, ci) {
      var c = cn.data;
      if (!anyInput) {
        cn.node.className = 'case';
        cn.status.textContent = 'offen';
        cn.hl.innerHTML = U.esc(c.text);
        cn.got.textContent = '—';
        cn.got.classList.remove('bad');
        return;
      }
      var res = results && results[ci];
      if (!res) {
        allPass = false;
        return;
      }
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
      var ok = resultsMatch(res, c, ex);
      if (!ok) allPass = false;
      cn.node.className = 'case ' + (ok ? 'pass' : 'fail');
      cn.status.textContent = ok ? '✓ passt' : '✗ weicht ab';
      cn.hl.innerHTML = U.highlightHTML(c.text, res.matches);
      cn.got.textContent = res.display;
      cn.got.classList.toggle('bad', !ok);
    });

    var requirements = anyInput ? requirementFailures(ex, snap, results) : [];
    if (requirements.length) allPass = false;

    verdict.innerHTML = '';
    if (!anyInput) return;

    if (allPass) {
      var wasSolved = RT.store.isSolved(ex.id);
      if (!snap.revealed) RT.store.markSolved(ex.id);
      renderDots();
      renderLevels();
      RT.refreshProgress();

      var nb = el('button', { class: 'btn sm primary', type: 'button', html: 'Nächste Aufgabe &nbsp;&rarr;' });
      nb.addEventListener('click', goNext);
      verdict.appendChild(el('div', { class: 'verdict win' }, [
        el('span', { class: 'big', text: '✓' }),
        el('span', { text: snap.revealed
          ? 'Die Musterlösung passt — probier sie beim nächsten Mal selbst.'
          : (wasSolved ? 'Passt wieder. Alle Testtexte bestanden.' : 'Alle Testtexte bestanden. Sitzt.') }),
        el('span', { class: 'spacer', style: 'flex:1' }),
        nb
      ]));
      if (!wasSolved && !snap.revealed) U.toast('Gelöst  ·  ' + ex.title);
    } else if (compileError) {
      verdict.appendChild(el('div', { class: 'verdict miss', text: 'Musterfehler: ' + compileError }));
    } else if (requirements.length) {
      verdict.appendChild(el('div', { class: 'verdict miss', text: requirements[0] }));
    } else {
      var failing = caseNodes.filter(function (c) { return c.node.classList.contains('fail'); }).length;
      verdict.appendChild(el('div', { class: 'verdict miss' }, [
        el('span', { class: 'big', text: '·' }),
        el('span', { text: failing === 1
          ? 'Ein Testtext weicht noch ab — vergleich dort „Erwartet“ und „Dein Ergebnis“.'
          : failing + ' Testtexte weichen ab. Schau dir die markierten Treffer an.' })
      ]));
    }
  }

  function evaluateSync(ex) {
    evaluateDebounced.cancel();
    var seq = ++evaluationSeq;
    var snap = currentSnapshot();
    var results = ex.cases.map(function (c) {
      return E.run(snap.pattern, snap.flags, c.text, ex.fn, { repl: ex.repl });
    });
    if (seq === evaluationSeq) paintEvaluation(ex, snap, results);
  }

  function evaluateAsync(ex, snap, seq) {
    var verdict = cardBox._verdict;
    if (snap.pattern === '') {
      if (seq === evaluationSeq) paintEvaluation(ex, snap, null);
      return;
    }
    if (verdict) verdict.setAttribute('aria-busy', 'true');
    var jobs = ex.cases.map(function (c) {
      return {
        pattern: snap.pattern, flags: snap.flags, text: c.text,
        fn: ex.fn, extra: { repl: ex.repl }
      };
    });
    RT.safeRun.batch(jobs).then(function (results) {
      if (seq !== evaluationSeq) return;
      paintEvaluation(ex, snap, results);
    });
  }

  var evaluateDebounced = U.debounce(evaluateAsync, 90);

  function requestEvaluation(ex) {
    var seq = ++evaluationSeq;
    evaluateDebounced(ex, currentSnapshot(), seq);
  }

  RT.views = RT.views || {};
  RT.views.train = {
    build: build,
    openRoute: openRoute,
    refresh: function () { if (lvBox) { renderLevels(); renderDots(); } }
  };
})(window);
