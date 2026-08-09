/* =============================================================
   selftest.js — Prüfstand für Engine, Inhalte und Highlighter

   Ausführen aus dem app-Verzeichnis:
       node tests/selftest.js

   Keine Abhängigkeiten. Die App-Skripte werden in ein Fake-Window
   geladen, damit sich die Engine ohne Browser testen lässt.
   ============================================================= */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const APP = path.join(__dirname, '..', 'js');
const win = {
  document: {
    createElement: () => ({
      style: {}, classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, appendChild() {}, setAttribute() {}
    }),
    createTextNode: () => ({}),
    querySelector: () => null, querySelectorAll: () => [],
    body: { appendChild() {} }, addEventListener() {}
  },
  navigator: {}, requestAnimationFrame: () => {},
  setTimeout, clearTimeout,
  addEventListener() {}, removeEventListener() {}
};
win.window = win;
const ctx = vm.createContext(win);
['engine.js', 'explain.js', 'core.js',
 'data-reference.js', 'data-lessons.js', 'data-exercises.js', 'data-quiz.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx, { filename: f }));

const RT = win.RT;
const E = RT.engine;
const py = RT.ui.pyCode;

let fails = 0, checks = 0;

function eq(label, got, want) {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { fails++; console.log(`  ✗ ${label}\n      erwartet ${w}\n      bekommen ${g}`); }
}
function fa(p, t, f) {
  const c = E.compile(p, f || '');
  return c.ok ? E.findall(c, t) : 'FEHLER:' + c.error;
}

/* ---------------------------------------------------------------- */
console.log('\n=== 1 · Engine-Grundverhalten ===');
eq('\\d auf "Hausnummer 27"', fa('\\d', 'Hausnummer 27'), ['2', '7']);
eq('\\d+', fa('\\d+', 'Heute 20 und 50 Euro'), ['20', '50']);
eq('a* liefert leere Treffer', fa('a*', 'baaa'), ['', 'aaa', '']);
eq('a+', fa('a+', 'caaab'), ['aaa']);
eq('\\w+ unicode (Python 3)', fa('\\w+', 'Größe'), ['Größe']);
eq('\\w+ mit re.A', fa('\\w+', 'Größe', 'a'), ['Gr', 'e']);
eq('\\b\\w{5}\\b', fa('\\b\\w{5}\\b', 'Heute ist ein guter Tag'), ['Heute', 'guter']);
eq('\\bcat\\b', fa('\\bcat\\b', 'cat catalog scattered'), ['cat']);
eq('[^aeiou]', fa('[^aeiou]', 'Haus'), ['H', 's']);
eq('(\\w)\\1', fa('(\\w)\\1', 'cool'), ['o']);
eq('zwei Gruppen → Tupel', fa('(\\d+)\\s?(Euro)', '100 Euro und 200Euro'),
   [['100', 'Euro'], ['200', 'Euro']]);
eq('eine Gruppe → Gruppe', fa('Jahr (\\d{4})', 'Jahr 2019, Jahr 2024'), ['2019', '2024']);
eq('(?:…) → ganze Treffer', fa('\\d+\\s?(?:Euro|euro)', '100 Euro und 200euro'),
   ['100 Euro', '200euro']);
eq('Lookbehind', fa('(?<=dark\\s)\\w+', 'the dark sky, a dark shape'), ['sky', 'shape']);
eq('Lookahead', fa('\\d+(?=\\s?[Ee]uros?)', '100 Euro, 200 euros, 300euro, 400Euros, 500 Dollar'),
   ['100', '200', '300', '400']);
eq('(?P<name>…)', fa('(?P<t>\\d{2})\\.(?P<m>\\d{2})', '24.12.2025'), [['24', '12']]);
eq('(?P=name)', fa('(?P<z>\\w)(?P=z)', 'Wasserfall'), ['s', 'l']);
eq('Umlaute an Wortgrenzen', fa('\\b\\w+\\b', 'Größe und Café'), ['Größe', 'und', 'Café']);
eq('re.I', fa('euro', '100 Euro, 200 euro, 300EURO', 'i'), ['Euro', 'euro', 'EURO']);
eq('re.M mit ^', fa('^\\w+', 'Zeile eins\nZeile zwei', 'm'), ['Zeile', 'Zeile']);
eq('$ matcht vor finalem \\n', fa('\\w+$', 'Hallo Welt\n'), ['Welt']);
eq('\\Z ignoriert finales \\n', fa('\\w+\\Z', 'Hallo Welt\n'), []);
eq('re.S', fa('A.+D', 'AB\nCD', 's'), ['AB\nCD']);
eq('. ohne re.S', fa('A.+D', 'AB\nCD'), []);
eq('re.X', fa('\\d+   # Zahl\n  [a-z]+', '12abc', 'x'), ['12abc']);
eq('Inline (?i)', fa('(?i)euro', '100 Euro'), ['Euro']);
eq('\\A trotz re.M', fa('\\AZeile', 'Zeile 1\nZeile 2', 'm'), ['Zeile']);
eq('{,m} == {0,m}', fa('a{,3}', 'aaaa'), fa('a{0,3}', 'aaaa'));
eq('{,3} auf "aaaa"', fa('a{,3}', 'aaaa'), ['aaa', 'a', '']);

console.log('\n=== 2 · Identitäts-Escapes bleiben im Unicode-Modus ===');
[['\\-\\d+', 'Wert -42 hier', ['-42']],
 ['100\\%', 'Rabatt 100% jetzt', ['100%']],
 ['\\w+\\-\\w+', 'High-speed Grüß-Gott', ['High-speed', 'Grüß-Gott']],
 ['\\(\\d+\\)', 'Betrag (42) netto', ['(42)']],
 ['\\$\\d+', 'Preis $99', ['$99']],
 ['\\d+\\/\\d+', 'am 24/12 los', ['24/12']]
].forEach(([p, t, w]) => {
  eq('r"' + p + '"', fa(p, t), w);
  checks++;
  const c = E.compile(p, '');
  if (c.ok && c.ascii) { fails++; console.log(`  ✗ r"${p}" fällt unnötig auf ASCII zurück`); }
});

console.log('\n=== 3 · match / search / fullmatch ===');
const one = (fn, p, t) => { const r = E.run(p, '', t, fn); return r.ok ? (r.value ? r.value.text : null) : 'FEHLER'; };
eq('match am Anfang', one('match', '\\d+', '50 Euro'), '50');
eq('match nicht in der Mitte', one('match', '\\d+', 'Preis 50'), null);
eq('fullmatch verlangt alles', one('fullmatch', '\\d+', '50 Euro'), null);
eq('fullmatch passt', one('fullmatch', '\\d+', '50'), '50');
eq('search findet überall', one('search', '\\d+', 'Preis 50'), '50');

console.log('\n=== 4 · sub / split ===');
const sub = (p, r, t) => { const c = E.compile(p, ''); return c.ok ? E.sub(c, r, t).result : 'FEHLER'; };
const sp = (p, t) => { const c = E.compile(p, ''); return c.ok ? E.split(c, t) : 'FEHLER'; };
eq('sub mit \\1 \\2', sub('(\\d+)\\.(\\d+)', '\\1,\\2', 'Preise: 15.99 und 3.20'), 'Preise: 15,99 und 3,20');
eq('sub Whitespace', sub('\\s+', ' ', 'zu   viel\n\tLuft'), 'zu viel Luft');
eq('sub \\g<name>', sub('(?P<a>\\d)(?P<b>[a-z])', '\\g<b>\\g<a>', '1x 2y'), 'x1 y2');
eq('sub Satzzeichen weg', sub('[^\\w\\s]', '', 'Hallo, Welt!'), 'Hallo Welt');
eq('split einfach', sp('[;,]\\s*', 'a, b;c,  d'), ['a', 'b', 'c', 'd']);
eq('split behält Gruppen', sp('(\\d)', 'a1b'), ['a', '1', 'b']);
eq('split Sätze', sp('(?<=[.!?])\\s+(?=[A-Z])', 'Er kam. Sie ging! Warum?'),
   ['Er kam.', 'Sie ging!', 'Warum?']);

console.log('\n=== 5 · Fehlermeldungen ===');
[['(abc', 'offene Klammer'], ['*abc', 'loser Quantifizierer'], ['[a-z', 'offene Zeichenklasse']]
  .forEach(([p, label]) => {
    checks++;
    const c = E.compile(p, '');
    if (c.ok) { fails++; console.log(`  ✗ ${label} hätte scheitern müssen`); }
    else console.log(`  · ${label}: ${c.error}`);
  });

console.log('\n=== 6 · Alle Referenz-Beispiele ===');
let n6 = 0;
RT.reference.forEach(r => {
  if (!r.pattern) return;
  checks++;
  const res = E.run(r.pattern, r.flags || '', r.text || '', r.fn || 'findall', { repl: r.repl });
  if (!res.ok) { fails++; n6++; console.log(`  ✗ [${r.sym}] ${res.error}`); }
});
console.log(`  ${RT.reference.length} Einträge, ${n6} fehlerhaft`);

console.log('\n=== 7 · Alle Lektions-Demos ===');
let n7 = 0;
RT.lessons.forEach(l => l.blocks.filter(b => b.t === 'demo').forEach(b => {
  checks++;
  const res = E.run(b.pattern, b.flags || '', b.text || '', b.fn || 'findall', { repl: b.repl });
  if (!res.ok) { fails++; n7++; console.log(`  ✗ [${l.id}] r"${b.pattern}" → ${res.error}`); }
}));
console.log(`  ${RT.lessons.length} Kapitel, ${n7} fehlerhafte Demos`);

console.log('\n=== 8 · Musterlösungen der Aufgaben ===');
const verbose = process.argv.includes('-v');
RT.exercises.forEach(ex => {
  const fn = ex.fn || 'findall';
  ex.cases.forEach((c, i) => {
    checks++;
    const res = E.run(ex.solution, ex.flags || '', c.text, fn, { repl: ex.repl });
    if (!res.ok) { fails++; console.log(`  ✗ ${ex.id} Fall ${i}: ${res.error}`); return; }
    if (fn === 'findall' && res.value.length === 0) {
      fails++; console.log(`  ✗ ${ex.id} Fall ${i}: Musterlösung findet nichts`);
    }
    if (verbose) console.log(`  · ${ex.id.padEnd(7)} ${('r"' + ex.solution + '"').padEnd(50)} → ${res.display.slice(0, 70)}`);
  });
});
console.log(`  ${RT.exercises.length} Aufgaben geprüft` + (verbose ? '' : '   (mit -v im Detail)'));

console.log('\n=== 9 · Quizfragen ===');
RT.quiz.forEach(q => {
  checks++;
  if (q.correct < 0 || q.correct >= q.options.length) { fails++; console.log(`  ✗ ${q.id}: correct-Index ungültig`); }
  if (new Set(q.options).size !== q.options.length) { fails++; console.log(`  ✗ ${q.id}: doppelte Antwortoptionen`); }
  if (!q.why) { fails++; console.log(`  ✗ ${q.id}: keine Erklärung`); }
});
console.log(`  ${RT.quiz.length} Fragen geprüft`);

console.log('\n=== 10 · Python-Highlighter (Rundlauf) ===');
const strip = h => h.replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function checkPy(src, label) {
  checks++;
  const h = py(src);
  if (strip(h) !== src) { fails++; console.log(`  ✗ ${label}: Text verändert`); return; }
  if ((h.match(/<span/g) || []).length !== (h.match(/<\/span>/g) || []).length) {
    fails++; console.log(`  ✗ ${label}: unbalancierte spans`); return;
  }
  if (/class="<|class=""/.test(h)) { fails++; console.log(`  ✗ ${label}: zerstörtes Attribut`); }
}
let n10 = 0;
[['re.findall(r"a*", "baaa")', 'einfach'],
 ['print(len("\\b"))    # Backspace', 'escape + kommentar'],
 ["df[df['text'].str.contains(r'\\bx\\b', na=False)]", 'einfache Anführungszeichen'],
 ['m = re.compile(r"""\n    \\d+   # Betrag\n""", re.X)', 'dreifache Anführungszeichen'],
 ['a < b and c > d', 'spitze Klammern']
].forEach(([s, l]) => { checkPy(s, l); n10++; });
RT.reference.forEach(r => { if (r.py) { checkPy(r.py, 'ref ' + r.sym); n10++; } });
RT.lessons.forEach(l => l.blocks.filter(b => b.t === 'code').forEach(b => { checkPy(b.code, 'lektion ' + l.id); n10++; }));
RT.quiz.forEach(q => { if (q.code) { checkPy(q.code, 'quiz ' + q.id); n10++; } });
console.log(`  ${n10} Codeschnipsel geprüft`);

console.log('\n=== 11 · Tokenizer verliert keine Zeichen ===');
['\\b(?P<x>\\d{2,3})[.,]?\\s*(?:€|Euro)\\b',
 '^(?=.*[A-Z])(?=.*\\d).{8,}$',
 '(?<=[.!?])\\s+(?=[A-Z])',
 '[\\w.+-]+@[\\w-]+\\.[\\w.]+'
].forEach(p => {
  checks++;
  const joined = RT.explain.tokenize(p).map(t => t.raw).join('');
  if (joined !== p) { fails++; console.log(`  ✗ ${p}\n      wurde zu ${joined}`); }
});
console.log('  4 Muster zerlegt');

console.log('\n' + '='.repeat(62));
console.log(fails === 0 ? `ALLES GRÜN  (${checks} Prüfungen)` : `${fails} FEHLER von ${checks} Prüfungen`);
process.exit(fails ? 1 : 0);
