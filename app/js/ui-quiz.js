/* =============================================================
   ui-quiz.js — Ansicht "Quiz"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var wrap, bar, body, foot;
  var pool = [], pos = 0, right = 0, answered = false;
  var levelFilter = 0;
  var retryWrong = false;
  var pendingRoute = null;

  function build(container) {
    levelFilter = 0;
    retryWrong = pendingRoute === 'retry';
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Quiz' }),
      el('p', { text: RT.quiz.length + ' Fragen nach Klausurmuster: Was gibt dieser Aufruf zurück? Welches Muster ist richtig? Jede Antwort wird erklärt.' })
    ]));

    var filterRow = el('div', { class: 'pg-row quiz-filters', role: 'group', 'aria-label': 'Quiz-Auswahl' });
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
          RT.setRoute('quiz', null);
          refreshChips(filterRow);
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
      refreshChips(filterRow);
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

    wrap = el('div', { class: 'quiz-wrap' }, [filterRow, bar, body, foot]);
    container.appendChild(wrap);

    if (pendingRoute === 'retry') {
      retryWrong = true;
      pendingRoute = null;
    }
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

  function openRoute(sub) {
    if (sub === 'retry') {
      retryWrong = true;
      levelFilter = 0;
      if (wrap) {
        var row = wrap.querySelector('.quiz-filters');
        if (row) refreshChips(row);
        start();
      } else {
        pendingRoute = 'retry';
      }
    } else {
      retryWrong = false;
      levelFilter = 0;
      if (wrap) {
        var row = wrap.querySelector('.quiz-filters');
        if (row) refreshChips(row);
        start();
      }
      if (sub) RT.setRoute('quiz', null);
    }
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function start() {
    pool = RT.quiz.filter(function (q) {
      if (retryWrong) return RT.store.quizResult(q.id) === false;
      return !levelFilter || q.level === levelFilter;
    });
    pool = shuffle(pool.slice());
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
            RT.setRoute('quiz', 'retry');
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
