/* =============================================================
   ui-start.js — klarer, kontoloser Einstieg und Empfehlungen
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var root;

  function dailyIndex(length, salt) {
    if (!length) return 0;
    var day = new Date();
    var key = day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate() + '-' + (salt || '');
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    return Math.abs(hash) % length;
  }

  function firstUnreadLesson() {
    return RT.lessons.find(function (lesson) { return !RT.store.isRead(lesson.id); }) || RT.lessons[0];
  }

  function firstOpenExercise() {
    var preferred = Number(RT.store.get('lastLevel')) || 1;
    return RT.exercises.find(function (exercise) {
      return exercise.level === preferred && !RT.store.isSolved(exercise.id);
    }) || RT.exercises.find(function (exercise) { return !RT.store.isSolved(exercise.id); }) || RT.exercises[0];
  }

  function action(label, className, onClick, detail) {
    var button = el('button', { class: className, type: 'button' }, [
      el('span', { text: label }),
      detail ? el('small', { text: detail }) : null
    ]);
    button.addEventListener('click', onClick);
    return button;
  }

  function routeCard(kicker, title, text, meta, accent, onClick) {
    var button = el('button', {
      class: 'route-card card', type: 'button', style: '--route-accent:' + accent
    }, [
      el('span', { class: 'route-kicker', text: kicker }),
      el('strong', { text: title }),
      el('span', { class: 'route-copy', text: text }),
      el('span', { class: 'route-meta', text: meta + '  →' })
    ]);
    button.addEventListener('click', onClick);
    return button;
  }

  function continueTarget() {
    var view = RT.store.get('lastView');
    var lesson = firstUnreadLesson();
    var exercise = firstOpenExercise();
    if (view === 'train' && exercise) return {
      label: 'Beim Üben weitermachen', copy: 'Nächste offene Aufgabe · Stufe ' + exercise.level,
      go: function () { RT.go('train', exercise.id); }
    };
    if (view === 'quiz') return {
      label: 'Neue Quiz-Runde starten', copy: '10 neue Fragen, jedes Mal anders gemischt',
      go: function () { RT.go('quiz', 'quick'); }
    };
    if (view === 'play') return {
      label: 'Playground wieder öffnen', copy: 'Dein letzter Test bleibt auf diesem Gerät erhalten',
      go: function () { RT.go('play'); }
    };
    return {
      label: RT.store.overall().leDone ? 'Im Lernpfad weitermachen' : 'Mit Lektion 1 starten',
      copy: (lesson ? lesson.title : 'Regex-Grundlagen') + ' · ca. ' + (lesson ? lesson.minutes : 5) + ' Minuten',
      go: function () { RT.go('learn', lesson && lesson.id); }
    };
  }

  function build(container) {
    root = container;
    render();
  }

  function render() {
    if (!root) return;
    var progress = RT.store.overall();
    var next = continueTarget();
    var daily = RT.quiz[dailyIndex(RT.quiz.length, 'home')];
    var totalMinutes = RT.lessons.reduce(function (sum, lesson) { return sum + lesson.minutes; }, 0);

    root.innerHTML = '';

    var heroCopy = el('div', { class: 'home-hero-copy' }, [
      el('div', { class: 'eyebrow' }, [
        el('span', { class: 'live-dot', 'aria-hidden': 'true' }),
        el('span', { text: 'Direkt loslegen · ohne Anmeldung' })
      ]),
      el('h1', { html: '<span>Regex verstehen.</span><span>Nicht nur auswendig lernen.</span>' }),
      el('p', { class: 'hero-lead', text: 'Kurze Lektionen, echte Aufgaben und sofortiges Feedback. Starte einfach dort, wo du gerade stehst — dein Fortschritt bleibt privat auf diesem Gerät.' }),
      el('div', { class: 'hero-actions' }, [
        action('Zufallsaufgabe starten', 'btn primary btn-lg', function () { RT.go('train', 'random'); }),
        action(progress.leDone ? 'Weiterlernen' : 'Bei null anfangen', 'btn btn-lg', function () {
          var lesson = firstUnreadLesson();
          RT.go('learn', lesson && lesson.id);
        })
      ]),
      el('div', { class: 'trust-row', 'aria-label': 'Vorteile' }, [
        el('span', { text: '✓ Kein Konto' }),
        el('span', { text: '✓ Sofortiges Feedback' }),
        el('span', { text: '✓ Mobil & offline' })
      ])
    ]);

    var heroVisual = el('div', { class: 'hero-console card', 'aria-label': 'Beispiel für ein Regex-Muster' }, [
      el('div', { class: 'console-top' }, [
        el('span', { text: 'DEIN NÄCHSTER SCHRITT' }),
        el('span', { class: 'console-status', text: 'bereit' })
      ]),
      el('div', { class: 'console-pattern', html: '<span>/</span>(?:lernen|üben)<b>+</b><span>/g</span>' }),
      el('div', { class: 'console-lines' }, [
        el('div', null, [el('i', { text: '01' }), el('span', { text: 'kleine Schritte' }), el('em', { text: 'Treffer' })]),
        el('div', null, [el('i', { text: '02' }), el('span', { text: 'direkt ausprobieren' }), el('em', { text: 'Treffer' })]),
        el('div', null, [el('i', { text: '03' }), el('span', { text: 'sicher anwenden' }), el('em', { text: 'Treffer' })])
      ]),
      el('div', { class: 'console-foot', text: RT.lessons.length + ' Lektionen · ' + RT.exercises.length + ' Aufgaben · ' + RT.quiz.length + ' Quizfragen' })
    ]);

    root.appendChild(el('section', { class: 'home-hero', 'aria-labelledby': 'home-title' }, [heroCopy, heroVisual]));
    heroCopy.querySelector('h1').id = 'home-title';

    root.appendChild(el('section', { class: 'home-section', 'aria-labelledby': 'choose-title' }, [
      el('div', { class: 'section-intro' }, [
        el('div', null, [
          el('span', { class: 'section-kicker', text: 'Dein Tempo' }),
          el('h2', { id: 'choose-title', text: 'Was möchtest du heute machen?' })
        ]),
        el('p', { text: 'Du musst nichts einrichten. Wähle einfach einen Einstieg.' })
      ]),
      el('div', { class: 'route-grid' }, [
        routeCard('VERSTEHEN', progress.leDone ? 'Weiterlernen' : 'Grundlagen lernen', 'Geführte Kapitel mit Beispielen, die du direkt verändern kannst.', RT.lessons.length + ' Kapitel · ' + totalMinutes + ' Min', '#75a7ff', function () {
          var lesson = firstUnreadLesson();
          RT.go('learn', lesson && lesson.id);
        }),
        routeCard('ANWENDEN', 'Zufällig üben', 'Eine passende Aufgabe aus dem großen Pool — ohne lange Auswahl.', RT.exercises.length + ' Aufgaben · sofort geprüft', '#55d6b9', function () { RT.go('train', 'random'); }),
        routeCard('TESTEN', '10er-Quiz starten', 'Ein kurzer, jedes Mal neu gemischter Wissenscheck mit Erklärungen.', RT.quiz.length + ' Fragen im Pool · ca. 5 Min', '#ffb86b', function () { RT.go('quiz', 'quick'); })
      ])
    ]));

    var progressCard = el('article', { class: 'progress-card card' }, [
      el('div', { class: 'progress-copy' }, [
        el('span', { class: 'section-kicker', text: 'Dein Fortschritt' }),
        el('h2', { text: progress.pct ? 'Kernlernplan zu ' + progress.pct + '% geschafft' : 'Alles bereit für deinen Start' }),
        el('p', { text: next.copy }),
        action(next.label, 'btn primary', next.go)
      ]),
      el('div', { class: 'progress-stats' }, [
        stat(progress.leDone, progress.leTotal, 'Kapitel'),
        stat(progress.exDone, progress.exTotal, 'Aufgaben'),
        stat(progress.quDone, progress.quTotal, 'Quiz richtig')
      ]),
      el('div', { class: 'local-note', text: '🔒 Keine Cloud, kein Login: Dieser Stand wird nur lokal in deinem Browser gespeichert.' })
    ]);

    var dailyCard = el('article', { class: 'daily-card card' }, [
      el('div', { class: 'daily-top' }, [
        el('span', { class: 'section-kicker', text: 'Heute zufällig ausgewählt' }),
        el('span', { class: 'tag', text: 'Stufe ' + daily.level })
      ]),
      el('h2', { html: daily.q }),
      daily.code ? el('pre', { class: 'daily-code' }, el('code', { text: daily.code })) : null,
      el('p', { text: 'Die Antwort und eine verständliche Erklärung warten in deiner Quiz-Runde.' }),
      action('Im Quiz lösen', 'btn', function () { RT.go('quiz', 'daily-' + daily.id); })
    ]);

    root.appendChild(el('section', { class: 'home-bottom', 'aria-label': 'Fortschritt und Tagesfrage' }, [progressCard, dailyCard]));
  }

  function stat(done, total, label) {
    var pct = total ? Math.round(done / total * 100) : 0;
    return el('div', { class: 'home-stat' }, [
      el('div', { class: 'stat-line' }, [el('strong', { text: done + '/' + total }), el('span', { text: label })]),
      el('div', { class: 'stat-bar', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done) },
        el('i', { style: 'width:' + pct + '%', 'aria-hidden': 'true' }))
    ]);
  }

  RT.views = RT.views || {};
  RT.views.start = { build: build, refresh: render };
})(window);
