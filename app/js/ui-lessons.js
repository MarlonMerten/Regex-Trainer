/* =============================================================
   ui-lessons.js — Ansicht "Lernen"
   ============================================================= */
(function (global) {
  'use strict';
  var RT = global.RT, U = RT.ui, el = U.el;

  var root, navBox, body, current = 0;
  var pendingRoute = null;

  function build(container) {
    root = container;
    navBox = el('nav', { class: 'learn-nav', 'aria-label': 'Kapitel' });
    body = el('article', { class: 'lesson' });
    root.appendChild(el('div', { class: 'page-head' }, [
      el('h1', { text: 'Lernpfad' }),
      el('p', { text: 'Zehn Kapitel vom ersten Muster bis zur Textanalyse. Jedes Beispiel lässt sich direkt bearbeiten — verändere die Muster und schau, was passiert.' })
    ]));
    root.appendChild(el('div', { class: 'learn-grid' }, [navBox, body]));
    renderNav();
    if (pendingRoute) {
      open(indexOf(pendingRoute));
      pendingRoute = null;
    } else {
      open(RT.store.get('lastLesson') !== null ? indexOf(RT.store.get('lastLesson')) : 0);
    }
  }

  function indexOf(id) {
    for (var i = 0; i < RT.lessons.length; i++) if (RT.lessons[i].id === id) return i;
    return 0;
  }

  function openRoute(sub) {
    if (!sub) return;
    if (!navBox) {
      pendingRoute = sub;
      return;
    }
    open(indexOf(sub));
  }

  function renderNav() {
    var ol = el('ol');
    RT.lessons.forEach(function (l, i) {
      var b = el('button', {
        type: 'button',
        class: (i === current ? 'on ' : '') + (RT.store.isRead(l.id) ? 'done' : ''),
        text: l.title,
        'aria-current': i === current ? 'step' : 'false'
      });
      b.addEventListener('click', function () { open(i); });
      ol.appendChild(el('li', null, b));
    });
    navBox.innerHTML = '';
    navBox.appendChild(ol);
  }

  function open(i) {
    current = Math.max(0, Math.min(i, RT.lessons.length - 1));
    var l = RT.lessons[current];
    RT.store.set('lastLesson', l.id);
    RT.setRoute('learn', l.id);
    renderNav();
    renderLesson(l);
    requestAnimationFrame(function () {
      var heading = body && body.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
    if (root.getBoundingClientRect().top < -40) {
      window.scrollTo({ top: root.offsetTop - 70, behavior: 'smooth' });
    }
  }

  function finishLesson(l) {
    RT.store.markRead(l.id);
    RT.refreshProgress();
    renderNav();
  }

  function renderLesson(l) {
    U.disposeWithin(body);
    body.innerHTML = '';
    body.appendChild(el('header', { class: 'lesson-head' }, [
      el('span', { class: 'tag', text: 'Kapitel ' + (current + 1) + ' · ' + l.minutes + ' Min' }),
      el('h2', { text: l.title }),
      el('p', { text: l.sub })
    ]));

    l.blocks.forEach(function (b) {
      body.appendChild(renderBlock(b));
    });

    var prev = el('button', { class: 'btn ghost', type: 'button', html: '&larr;&nbsp; Zurück' });
    var next = el('button', { class: 'btn primary', type: 'button', html: 'Weiter &nbsp;&rarr;' });
    prev.addEventListener('click', function () { open(current - 1); });
    next.addEventListener('click', function () {
      finishLesson(l);
      if (current === RT.lessons.length - 1) RT.go('train');
      else open(current + 1);
    });
    if (current === 0) prev.disabled = true;
    if (current === RT.lessons.length - 1) next.innerHTML = 'Zum Training &nbsp;&rarr;';
    body.appendChild(el('footer', { class: 'lesson-foot' }, [prev, next]));
  }

  function renderBlock(b) {
    switch (b.t) {
      case 'p':
        return el('p', { html: b.html });
      case 'h':
        return el('h3', { text: b.text });
      case 'note':
        return el('div', { class: 'note ' + (b.kind || '') }, [
          el('span', { class: 'note-k', text: noteLabel(b.kind) }),
          el('span', { html: b.html })
        ]);
      case 'code':
        return el('pre', { class: 'code' }, el('code', { html: U.pyCode(b.code) }));
      case 'list':
        return el('ul', null, b.items.map(function (i) { return el('li', { html: i }); }));
      case 'table': {
        var thead = el('thead', null, el('tr', null, b.head.map(function (h) {
          return el('th', { html: h });
        })));
        var tbody = el('tbody', null, b.rows.map(function (r) {
          return el('tr', null, r.map(function (c) { return el('td', { html: c }); }));
        }));
        return el('div', { class: 'tbl-wrap' }, el('table', { class: 'tbl' }, [thead, tbody]));
      }
      case 'demo':
        return U.makeDemo(b);
      default:
        return el('div');
    }
  }

  function noteLabel(kind) {
    return { tip: 'Tipp', warn: 'Achtung', exam: 'Klausurrelevant', py: 'Python' }[kind] || 'Hinweis';
  }

  RT.views = RT.views || {};
  RT.views.learn = {
    build: build,
    openRoute: openRoute,
    refresh: function () { renderNav(); }
  };
})(window);
