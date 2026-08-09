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
    quizDone: {},         // Quiz-ID      -> true|false (richtig/falsch)
    lastView: 'learn',
    lastLesson: null,
    lastLevel: 1,
    playground: null
  };

  var data = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      var parsed = JSON.parse(raw);
      Object.keys(DEFAULT).forEach(function (k) {
        if (parsed[k] === undefined) parsed[k] = JSON.parse(JSON.stringify(DEFAULT[k]));
      });
      return parsed;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* z.B. privater Modus */ }
    }, 120);
  }

  RT.store = {
    all: function () { return data; },
    get: function (k) { return data[k]; },
    set: function (k, v) { data[k] = v; save(); },

    isSolved: function (id) { return !!data.solved[id]; },
    markSolved: function (id) { data.solved[id] = true; save(); },

    isRead: function (id) { return !!data.readLessons[id]; },
    markRead: function (id) { data.readLessons[id] = true; save(); },

    quizAnswer: function (id, correct) { data.quizDone[id] = !!correct; save(); },
    quizResult: function (id) { return data.quizDone[id]; },

    levelProgress: function (levelId) {
      var all = RT.exercises.filter(function (e) { return e.level === levelId; });
      var done = all.filter(function (e) { return !!data.solved[e.id]; });
      return { done: done.length, total: all.length };
    },

    overall: function () {
      var exTotal = RT.exercises.length;
      var exDone = RT.exercises.filter(function (e) { return !!data.solved[e.id]; }).length;
      var leTotal = RT.lessons.length;
      var leDone = RT.lessons.filter(function (l) { return !!data.readLessons[l.id]; }).length;
      var quTotal = RT.quiz.length;
      var quDone = RT.quiz.filter(function (q) { return data.quizDone[q.id] === true; }).length;
      var total = exTotal + leTotal + quTotal;
      var done = exDone + leDone + quDone;
      return {
        pct: total ? Math.round(done / total * 100) : 0,
        exDone: exDone, exTotal: exTotal,
        leDone: leDone, leTotal: leTotal,
        quDone: quDone, quTotal: quTotal
      };
    },

    reset: function () {
      data = JSON.parse(JSON.stringify(DEFAULT));
      data.theme = null;
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})(window);
