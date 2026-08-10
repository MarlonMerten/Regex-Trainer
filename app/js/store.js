/* =============================================================
   store.js — Fortschritt im localStorage
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});
  var KEY = 'regex-trainer/v1';

  var DEFAULT = {
    theme: null,          // null = Systemeinstellung
    solved: {},           // Aufgaben-ID  -> true
    readLessons: {},      // Lektions-ID  -> true
    quizDone: {},         // Quiz-ID      -> true|false (jemals gemeistert)
    quizLast: {},         // Quiz-ID      -> true|false (letzte Antwort)
    lastView: 'learn',
    lastLesson: null,
    lastLevel: 1,
    playground: null
  };

  var VIEWS = ['start', 'learn', 'ref', 'play', 'train', 'quiz'];
  var FUNCTIONS = ['findall', 'finditer', 'search', 'match', 'fullmatch', 'sub', 'split'];
  var MAX_IMPORT_BYTES = 2 * 1024 * 1024;

  function freshDefault() {
    var out = JSON.parse(JSON.stringify(DEFAULT));
    out.solved = Object.create(null);
    out.readLessons = Object.create(null);
    out.quizDone = Object.create(null);
    out.quizLast = Object.create(null);
    return out;
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function fail(strict, message) {
    if (strict) throw new Error(message);
    return false;
  }

  function owns(record, key) {
    return Object.prototype.hasOwnProperty.call(record, key);
  }

  function idsOf(list) {
    var ids = Object.create(null);
    (list || []).forEach(function (item) { ids[item.id] = true; });
    return ids;
  }

  function booleanMap(value, label, validIds, strict) {
    if (!isRecord(value)) {
      fail(strict, label + ' muss ein Objekt sein.');
      return Object.create(null);
    }
    var out = Object.create(null);
    var valid = true;
    Object.keys(value).forEach(function (id) {
      if (!owns(validIds, id) || typeof value[id] !== 'boolean') {
        valid = false;
        return;
      }
      out[id] = value[id];
    });
    if (!valid) fail(strict, label + ' enthält unbekannte IDs oder nicht-boolesche Werte.');
    return out;
  }

  function playgroundState(value, strict) {
    if (value === null) return null;
    if (!isRecord(value)) {
      fail(strict, 'playground muss null oder ein Objekt sein.');
      return null;
    }
    var fields = ['pattern', 'flags', 'fn', 'repl', 'text'];
    for (var i = 0; i < fields.length; i++) {
      if (typeof value[fields[i]] !== 'string') {
        fail(strict, 'playground.' + fields[i] + ' muss Text sein.');
        return null;
      }
    }
    if (!/^[imsxa]*$/.test(value.flags) || new Set(value.flags).size !== value.flags.length) {
      fail(strict, 'playground.flags enthält ungültige oder doppelte Flags.');
      return null;
    }
    if (FUNCTIONS.indexOf(value.fn) === -1) {
      fail(strict, 'playground.fn ist keine unterstützte re-Funktion.');
      return null;
    }
    if (value.pattern.length > 10000 || value.repl.length > 100000 || value.text.length > 1000000) {
      fail(strict, 'Die Playground-Daten sind zu groß.');
      return null;
    }
    return {
      pattern: value.pattern, flags: value.flags, fn: value.fn,
      repl: value.repl, text: value.text
    };
  }

  function normalize(value, strict) {
    if (!isRecord(value)) {
      fail(strict, 'Der Import muss ein JSON-Objekt sein.');
      return freshDefault();
    }
    if (strict && !Object.keys(DEFAULT).some(function (key) { return value[key] !== undefined; })) {
      throw new Error('Das JSON enthält keinen Regex-Trainer-Fortschritt.');
    }

    var out = freshDefault();
    var lessonIds = idsOf(RT.lessons);
    var exerciseIds = idsOf(RT.exercises);
    var quizIds = idsOf(RT.quiz);
    var levelIds = idsOf(RT.levels);

    if (value.theme === null || value.theme === 'dark' || value.theme === 'light') out.theme = value.theme;
    else if (value.theme !== undefined) fail(strict, 'theme muss null, "dark" oder "light" sein.');

    if (value.solved !== undefined) out.solved = booleanMap(value.solved, 'solved', exerciseIds, strict);
    if (value.readLessons !== undefined) out.readLessons = booleanMap(value.readLessons, 'readLessons', lessonIds, strict);
    if (value.quizDone !== undefined) out.quizDone = booleanMap(value.quizDone, 'quizDone', quizIds, strict);
    if (value.quizLast !== undefined) out.quizLast = booleanMap(value.quizLast, 'quizLast', quizIds, strict);
    else Object.keys(out.quizDone).forEach(function (id) { out.quizLast[id] = out.quizDone[id]; });

    if (value.lastView === undefined || VIEWS.indexOf(value.lastView) !== -1) out.lastView = value.lastView || out.lastView;
    else fail(strict, 'lastView enthält keine bekannte Ansicht.');

    if (value.lastLesson === null || value.lastLesson === undefined || owns(lessonIds, value.lastLesson)) {
      out.lastLesson = value.lastLesson === undefined ? out.lastLesson : value.lastLesson;
    } else fail(strict, 'lastLesson enthält keine bekannte Kapitel-ID.');

    if (value.lastLevel === undefined || (typeof value.lastLevel === 'number' && owns(levelIds, value.lastLevel))) {
      out.lastLevel = value.lastLevel || out.lastLevel;
    }
    else fail(strict, 'lastLevel enthält keine bekannte Stufe.');

    if (value.playground !== undefined) out.playground = playgroundState(value.playground, strict);
    return out;
  }

  var data = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw || raw.length > MAX_IMPORT_BYTES) return freshDefault();
      return normalize(JSON.parse(raw), false);
    } catch (e) {
      return freshDefault();
    }
  }

  var saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* z.B. privater Modus */ }
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 120);
  }

  RT.store = {
    all: function () { return data; },
    get: function (k) { return data[k]; },
    set: function (k, v) { data[k] = v; save(); },

    isSolved: function (id) { return owns(data.solved, id) && data.solved[id] === true; },
    markSolved: function (id) { data.solved[id] = true; save(); },

    isRead: function (id) { return owns(data.readLessons, id) && data.readLessons[id] === true; },
    markRead: function (id) { data.readLessons[id] = true; save(); },

    quizAnswer: function (id, correct) {
      data.quizLast[id] = !!correct;
      if (correct || !owns(data.quizDone, id)) data.quizDone[id] = !!correct;
      save();
    },
    quizResult: function (id) { return owns(data.quizLast, id) ? data.quizLast[id] : undefined; },
    isQuizAttempted: function (id) { return owns(data.quizLast, id); },

    exportJSON: function () {
      return JSON.stringify(data, null, 2);
    },

    importJSON: function (raw) {
      if (typeof raw !== 'string' || raw.length > MAX_IMPORT_BYTES) throw new Error('Die Importdatei ist ungültig oder zu groß.');
      var parsed = JSON.parse(raw);
      var imported = normalize(parsed, true);
      data = imported;
      saveNow();
    },

    levelProgress: function (levelId) {
      var all = RT.exercises.filter(function (e) { return e.level === levelId; });
      var done = all.filter(function (e) { return owns(data.solved, e.id) && data.solved[e.id] === true; });
      return { done: done.length, total: all.length };
    },

    overall: function () {
      var exTotal = RT.exercises.length;
      var exDone = RT.exercises.filter(function (e) { return owns(data.solved, e.id) && data.solved[e.id] === true; }).length;
      var leTotal = RT.lessons.length;
      var leDone = RT.lessons.filter(function (l) { return owns(data.readLessons, l.id) && data.readLessons[l.id] === true; }).length;
      var quTotal = RT.quiz.length;
      var quDone = RT.quiz.filter(function (q) { return owns(data.quizDone, q.id) && data.quizDone[q.id] === true; }).length;
      var quAttempted = RT.quiz.filter(function (q) { return owns(data.quizLast, q.id); }).length;
      /* Der Ring beschreibt einen stabilen Kernlernplan. Neue Bonuslektionen
         und neue Zufallsfragen lassen bestehenden Fortschritt so nicht sinken. */
      var coreLessons = RT.lessons.slice(0, Math.min(10, leTotal));
      var coreExercises = RT.exercises.slice(0, Math.min(53, exTotal));
      var coreLessonsDone = coreLessons.filter(function (l) { return owns(data.readLessons, l.id) && data.readLessons[l.id] === true; }).length;
      var coreExercisesDone = coreExercises.filter(function (e) { return owns(data.solved, e.id) && data.solved[e.id] === true; }).length;
      var quizGoal = Math.min(20, quTotal);
      var learnPart = coreLessons.length ? coreLessonsDone / coreLessons.length : 0;
      var exercisePart = coreExercises.length ? coreExercisesDone / coreExercises.length : 0;
      var quizPart = quizGoal ? Math.min(quDone, quizGoal) / quizGoal : 0;
      return {
        pct: Math.round((learnPart * .35 + exercisePart * .50 + quizPart * .15) * 100),
        exDone: exDone, exTotal: exTotal,
        leDone: leDone, leTotal: leTotal,
        quDone: quDone, quTotal: quTotal,
        quAttempted: quAttempted
      };
    },

    reset: function () {
      clearTimeout(saveTimer);
      saveTimer = null;
      data = freshDefault();
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    flush: saveNow
  };
})(window);
