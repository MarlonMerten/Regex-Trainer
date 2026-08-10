/* =============================================================
   ui-quiz.js — Ansicht "Quiz"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var wrap, bar, body, foot, modeRow, filterRow;
  var pool = [], pos = 0, right = 0, answered = false;
  var levelFilter = 0;
  var retryWrong = false;
  var sessionSize = 10;
  var requiredId = null;
  var pendingRoute = null;

  function build(container) {
    applyRoute(pendingRoute || 'quick');
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Quiz' }),
      el('p', { text: 'Kurze, zufällig gemischte Runden aus ' + RT.quiz.length + ' Fragen. Du bekommst nach jeder Antwort sofort eine verständliche Erklärung.' })
    ]));

    modeRow = el('div', { class: 'quiz-mode-row', role: 'group', 'aria-label': 'Länge der Quiz-Runde' });
    [[10, '10 Fragen', 'Schnellrunde'], [20, '20 Fragen', 'Intensiv'], [0, 'Alle', RT.quiz.length + ' Fragen']]
      .forEach(function (choice) {
        var active = !retryWrong && sessionSize === choice[0];
        var button = el('button', {
          type: 'button', class: 'session-choice' + (active ? ' on' : ''),
          'aria-pressed': active ? 'true' : 'false'
        }, [el('strong', { text: choice[1] }), el('span', { text: choice[2] })]);
        button.addEventListener('click', function () {
          retryWrong = false;
          requiredId = null;
          sessionSize = choice[0];
          RT.setRoute('quiz', choice[0] === 10 ? 'quick' : (choice[0] === 20 ? 'mix20' : 'all'));
          refreshControls();
          start();
        });
        modeRow.appendChild(button);
      });

    filterRow = el('div', { class: 'pg-row quiz-filters', role: 'group', 'aria-label': 'Schwierigkeit auswählen' });
    [[0, 'Alle Stufen']].concat(RT.levels.map(function (l) { return [l.id, 'Stufe ' + l.id]; }))
      .forEach(function (f) {
        var active = f[0] === levelFilter && !retryWrong;
        var c = el('button', {
          type: 'button', class: 'chip' + (active ? ' on' : ''), text: f[1],
          'aria-pressed': active ? 'true' : 'false'
        });
        c.addEventListener('click', function () {
          levelFilter = f[0];
          retryWrong = false;
          requiredId = null;
          RT.setRoute('quiz', sessionSize === 20 ? 'mix20' : (sessionSize === 0 ? 'all' : 'quick'));
          refreshControls();
          start();
        });
        filterRow.appendChild(c);
      });

    var retryChip = el('button', {
      type: 'button', class: 'chip chip-warn' + (retryWrong ? ' on' : ''), text: 'Falsche wiederholen',
      'aria-pressed': retryWrong ? 'true' : 'false'
    });
    retryChip.addEventListener('click', function () {
      retryWrong = true;
      levelFilter = 0;
      requiredId = null;
      refreshControls();
      RT.setRoute('quiz', 'retry');
      start();
    });
    filterRow.appendChild(retryChip);

    bar = el('div', {
      class: 'quiz-progress', role: 'progressbar', 'aria-label': 'Quiz-Fortschritt',
      'aria-valuemin': '0', 'aria-valuemax': '0', 'aria-valuenow': '0'
    }, el('i', { style: 'width:0%', 'aria-hidden': 'true' }));
    body = el('div', { class: 'card card-pad' });
    foot = el('div', { class: 'quiz-foot' });

    wrap = el('div', { class: 'quiz-wrap' }, [
      el('div', { class: 'quiz-setup card' }, [
        el('div', { class: 'setup-label', text: 'Rundenlänge' }), modeRow,
        el('div', { class: 'setup-label', text: 'Schwierigkeit' }), filterRow
      ]),
      bar, body, foot
    ]);
    container.appendChild(wrap);

    pendingRoute = null;
    RT.setRoute('quiz', retryWrong ? 'retry' : (requiredId ? 'daily-' + requiredId : (sessionSize === 20 ? 'mix20' : (sessionSize === 0 ? 'all' : 'quick'))), { history: 'replace' });
    refreshControls();
    start();
  }

  function refreshChips(row) {
    U.$$('.chip', row).forEach(function (c, i) {
      if (c.classList.contains('chip-warn')) {
        c.classList.toggle('on', retryWrong);
        c.setAttribute('aria-pressed', retryWrong ? 'true' : 'false');
      } else {
        var active = !retryWrong && (i === 0 ? levelFilter === 0 : RT.levels[i - 1].id === levelFilter);
        c.classList.toggle('on', active);
        c.setAttribute('aria-pressed', active ? 'true' : 'false');
      }
    });
  }

  function refreshControls() {
    if (filterRow) refreshChips(filterRow);
    if (modeRow) U.$$('.session-choice', modeRow).forEach(function (button, index) {
      var size = [10, 20, 0][index];
      var active = !retryWrong && sessionSize === size;
      button.classList.toggle('on', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyRoute(sub) {
    levelFilter = 0;
    retryWrong = false;
    requiredId = null;
    sessionSize = 10;
    if (sub === 'retry') retryWrong = true;
    else if (sub === 'all') sessionSize = 0;
    else if (sub === 'mix20') sessionSize = 20;
    else if (sub && sub.indexOf('daily-') === 0) requiredId = sub.slice(6);
  }

  function openRoute(sub) {
    var validDaily = sub && sub.indexOf('daily-') === 0 && RT.quiz.some(function (q) { return q.id === sub.slice(6); });
    var valid = !sub || sub === 'quick' || sub === 'mix20' || sub === 'all' || sub === 'retry' || validDaily;
    var route = valid ? (sub || 'quick') : 'quick';
    applyRoute(route);
    if (!wrap) {
      pendingRoute = route;
      return;
    }
    refreshControls();
    start();
    RT.setRoute('quiz', route, { history: 'replace' });
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function start() {
    var candidates = RT.quiz.filter(function (q) {
      if (retryWrong) return RT.store.quizResult(q.id) === false;
      return !levelFilter || q.level === levelFilter;
    });
    if (retryWrong) {
      pool = shuffle(candidates.slice());
    } else {
      var unseen = [], wrong = [], mastered = [];
      candidates.forEach(function (q) {
        var result = RT.store.quizResult(q.id);
        if (result === undefined) unseen.push(q);
        else if (result === false) wrong.push(q);
        else mastered.push(q);
      });
      pool = shuffle(wrong).concat(shuffle(unseen), shuffle(mastered));
      if (requiredId) {
        var required = RT.quiz.find(function (q) { return q.id === requiredId; });
        pool = pool.filter(function (q) { return q.id !== requiredId; });
        if (required && (!levelFilter || required.level === levelFilter)) pool.unshift(required);
      }
      if (sessionSize) pool = pool.slice(0, sessionSize);
      /* Die Kategorien werden priorisiert, innerhalb der Runde aber gemischt.
         Eine angepinnte Tagesfrage bleibt bewusst an erster Stelle. */
      if (!requiredId) shuffle(pool);
    }
    pos = 0; right = 0;
    bar.setAttribute('aria-valuemax', String(pool.length));
    if (!pool.length) {
      renderEmpty();
      return;
    }
    renderQ();
  }

  function renderEmpty() {
    updateProgress(0);
    body.innerHTML = '';
    body.appendChild(el('div', { class: 'empty' }, [
      el('div', { html: U.icon('empty') }),
      el('div', { text: retryWrong ? 'Keine falsch beantworteten Fragen — erst mal ein Quiz durchspielen.' : 'Keine Fragen in dieser Auswahl.' })
    ]));
    foot.innerHTML = '';
    foot.classList.remove('is-actionable');
  }

  function renderQ() {
    answered = false;
    updateProgress(pos);

    if (pos >= pool.length) return renderEnd();

    var q = pool[pos];
    body.innerHTML = '';
    body.appendChild(el('div', { class: 'quiz-meta' }, [
      el('span', { class: 'tag', text: 'Frage ' + (pos + 1) + ' / ' + pool.length }),
      el('span', { class: 'tag', text: 'Stufe ' + q.level })
    ]));
    body.appendChild(el('h2', { class: 'quiz-q', id: 'quiz-question', html: q.q }));
    if (q.code) body.appendChild(el('div', { class: 'quiz-code', html: U.pyCode(q.code) }));

    var opts = el('div', { class: 'opts quiz-options', role: 'group', 'aria-labelledby': 'quiz-question' });
    var order = q.options.map(function (_, i) { return i; });
    shuffle(order);

    order.forEach(function (origIdx, shown) {
      var b = el('button', { type: 'button', class: 'opt' }, [
        el('span', { class: 'k', text: 'ABCD'[shown] }),
        el('span', { class: 'txt', html: q.options[origIdx] })
      ]);
      b.addEventListener('click', function () { answer(q, origIdx, opts, order); });
      opts.appendChild(b);
    });
    body.appendChild(opts);

    renderFoot(q);
    requestAnimationFrame(function () {
      var heading = body && body.querySelector('#quiz-question');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }

  function answer(q, chosen, optsBox, order) {
    if (answered) return;
    answered = true;
    var ok = chosen === q.correct;
    if (ok) right++;
    RT.store.quizAnswer(q.id, ok);
    RT.refreshProgress();
    updateProgress(pos + 1);

    U.$$('.opt', optsBox).forEach(function (b, shown) {
      b.disabled = true;
      var orig = order[shown];
      if (orig === q.correct) b.classList.add('right');
      else if (orig === chosen) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    var why = el('div', { class: 'why', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, [
      el('div', { class: 'why-head', text: ok ? 'Richtig' : 'Erklärung' }),
      el('div', { html: q.why })
    ]);
    if (q.demo) {
      var b = el('button', { class: 'btn sm ghost', type: 'button', html: U.icon('play') + ' Im Playground nachvollziehen' });
      b.addEventListener('click', function () {
        RT.openInPlayground({
          pattern: q.demo.pattern, flags: q.demo.flags || '', text: q.demo.text,
          fn: q.demo.fn || 'findall', repl: q.demo.repl || ''
        });
      });
      why.appendChild(b);
    }
    body.appendChild(why);
    renderFoot(q);
  }

  function renderFoot(q) {
    var seen = pos + (answered ? 1 : 0);
    foot.innerHTML = '';
    foot.classList.toggle('is-actionable', answered);
    foot.appendChild(el('span', { class: 'score', 'aria-live': 'polite', html: 'Richtig: <b>' + right + '</b> von <b>' + seen + '</b>' }));
    var next = el('button', { class: 'btn primary', type: 'button', html: (pos + 1 >= pool.length ? 'Auswertung' : 'Weiter') + ' &nbsp;&rarr;' });
    next.disabled = !answered;
    next.addEventListener('click', function () { pos++; renderQ(); });
    foot.appendChild(next);
  }

  function renderEnd() {
    updateProgress(pool.length);
    var pct = pool.length ? Math.round(right / pool.length * 100) : 0;
    var msg = pct >= 90 ? 'Das sitzt. Bereit für die Klausur.'
            : pct >= 70 ? 'Solide. Geh die falschen Fragen noch einmal durch.'
            : pct >= 45 ? 'Grundlagen stehen — der Lernpfad füllt die Lücken.'
            : 'Noch wacklig. Starte beim Lernpfad und arbeite dich durchs Training.';

    body.innerHTML = '';
    body.appendChild(el('div', { class: 'finish' }, [
      el('h2', { class: 'big', tabindex: '-1', text: right + ' / ' + pool.length }),
      el('p', { text: msg }),
      el('div', { class: 'pg-row pg-row-center' }, [
        (function () {
          var b = el('button', { class: 'btn primary', type: 'button', html: U.icon('reset') + ' Nochmal' });
          b.addEventListener('click', start);
          return b;
        })(),
        (function () {
          var b = el('button', { class: 'btn ghost', type: 'button', text: 'Falsche wiederholen' });
          b.addEventListener('click', function () {
            retryWrong = true;
            requiredId = null;
            levelFilter = 0;
            RT.setRoute('quiz', 'retry');
            refreshControls();
            start();
          });
          return b;
        })(),
        (function () {
          var b = el('button', { class: 'btn ghost', type: 'button', html: U.icon('book') + ' Zum Lernpfad' });
          b.addEventListener('click', function () { RT.go('learn'); });
          return b;
        })()
      ])
    ]));
    foot.innerHTML = '';
    foot.classList.remove('is-actionable');
    requestAnimationFrame(function () {
      var heading = body && body.querySelector('h2');
      if (heading) heading.focus({ preventScroll: true });
    });
  }

  function updateProgress(done) {
    var total = pool.length;
    var pct = total ? Math.round(done / total * 100) : 0;
    bar.firstChild.style.width = pct + '%';
    bar.setAttribute('aria-valuemax', String(total || 1));
    bar.setAttribute('aria-valuenow', String(Math.min(done, total)));
    bar.setAttribute('aria-valuetext', done + ' von ' + total + ' Fragen abgeschlossen');
  }

  RT.views = RT.views || {};
  RT.views.quiz = { build: build, openRoute: openRoute };
})(window);
