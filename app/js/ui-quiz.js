/* =============================================================
   ui-quiz.js — Ansicht "Quiz"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var wrap, bar, body, foot;
  var pool = [], pos = 0, right = 0, answered = false;
  var levelFilter = 0;   // 0 = alle

  function build(container) {
    container.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Quiz' }),
      el('p', { text: 'Vierunddreißig Fragen nach Klausurmuster: Was gibt dieser Aufruf zurück? Welches Muster ist richtig? Jede Antwort wird erklärt.' })
    ]));

    var filterRow = el('div', { class: 'pg-row', style: 'margin-bottom:20px;justify-content:center' });
    [[0, 'Alle Stufen']].concat(RT.levels.map(function (l) { return [l.id, 'Stufe ' + l.id]; }))
      .forEach(function (f) {
        var c = el('button', { type: 'button', class: 'chip' + (f[0] === levelFilter ? ' on' : ''), text: f[1] });
        c.addEventListener('click', function () {
          levelFilter = f[0];
          U.$$('.chip', filterRow).forEach(function (x) { x.classList.remove('on'); });
          c.classList.add('on');
          start();
        });
        filterRow.appendChild(c);
      });

    bar = el('div', { class: 'quiz-progress' }, el('i', { style: 'width:0%' }));
    body = el('div', { class: 'card card-pad' });
    foot = el('div', { class: 'quiz-foot' });

    wrap = el('div', { class: 'quiz-wrap' }, [filterRow, bar, body, foot]);
    container.appendChild(wrap);
    start();
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function start() {
    pool = RT.quiz.filter(function (q) { return !levelFilter || q.level === levelFilter; });
    pool = shuffle(pool.slice());
    pos = 0; right = 0;
    renderQ();
  }

  function renderQ() {
    answered = false;
    bar.firstChild.style.width = (pos / pool.length * 100) + '%';

    if (pos >= pool.length) return renderEnd();

    var q = pool[pos];
    body.innerHTML = '';
    body.appendChild(el('div', { style: 'display:flex;gap:9px;align-items:center;margin-bottom:12px' }, [
      el('span', { class: 'tag', text: 'Frage ' + (pos + 1) + ' / ' + pool.length }),
      el('span', { class: 'tag', text: 'Stufe ' + q.level })
    ]));
    body.appendChild(el('div', { class: 'quiz-q', html: q.q }));
    if (q.code) body.appendChild(el('div', { class: 'quiz-code', html: U.pyCode(q.code) }));

    var opts = el('div', { class: 'opts' });
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
  }

  function answer(q, chosen, optsBox, order) {
    if (answered) return;
    answered = true;
    var ok = chosen === q.correct;
    if (ok) right++;
    RT.store.quizAnswer(q.id, ok);
    RT.refreshProgress();

    U.$$('.opt', optsBox).forEach(function (b, shown) {
      b.disabled = true;
      var orig = order[shown];
      if (orig === q.correct) b.classList.add('right');
      else if (orig === chosen) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    var why = el('div', { class: 'why' }, [
      el('div', { class: 'why-head', text: ok ? 'Richtig' : 'Erklärung' }),
      el('div', { html: q.why })
    ]);
    if (q.demo) {
      var b = el('button', { class: 'btn sm ghost', type: 'button', style: 'margin-top:11px', html: U.icon('play') + ' Im Playground nachvollziehen' });
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
    foot.appendChild(el('span', { class: 'score', html: 'Richtig: <b>' + right + '</b> von <b>' + seen + '</b>' }));
    var next = el('button', { class: 'btn primary', type: 'button', html: (pos + 1 >= pool.length ? 'Auswertung' : 'Weiter') + ' &nbsp;&rarr;' });
    next.disabled = !answered;
    next.addEventListener('click', function () { pos++; renderQ(); });
    foot.appendChild(next);
  }

  function renderEnd() {
    bar.firstChild.style.width = '100%';
    var pct = pool.length ? Math.round(right / pool.length * 100) : 0;
    var msg = pct >= 90 ? 'Das sitzt. Bereit für die Klausur.'
            : pct >= 70 ? 'Solide. Geh die falschen Fragen noch einmal durch.'
            : pct >= 45 ? 'Grundlagen stehen — der Lernpfad füllt die Lücken.'
            : 'Noch wacklig. Starte beim Lernpfad und arbeite dich durchs Training.';

    body.innerHTML = '';
    body.appendChild(el('div', { class: 'finish' }, [
      el('div', { class: 'big', text: right + ' / ' + pool.length }),
      el('p', { text: msg }),
      el('div', { class: 'pg-row', style: 'justify-content:center' }, [
        (function () {
          var b = el('button', { class: 'btn primary', type: 'button', html: U.icon('reset') + ' Nochmal' });
          b.addEventListener('click', start);
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
  }

  RT.views = RT.views || {};
  RT.views.quiz = { build: build };
})(window);
