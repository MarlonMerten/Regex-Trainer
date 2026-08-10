/* Differentialtest: Browser-Engine gegen CPython-re.
   Aufruf aus app/: node tests/python-differential.js */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const pythonBin = process.env.PYTHON || 'python3';

const pyVersionCheck = spawnSync(
  pythonBin,
  ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")'],
  { encoding: 'utf8' }
);
const pyVersion = (pyVersionCheck.stdout || '').trim();
const pyParts = pyVersion.split('.').map(Number);
if (pyVersionCheck.status !== 0 || pyParts[0] !== 3 || pyParts[1] < 14) {
  console.error(`CPython 3.14+ erforderlich (gefunden: ${pyVersion || 'nicht verfügbar'} über ${pythonBin})`);
  process.exit(1);
}

/* Absichtlich ohne window: derselbe Ladeweg muss auch im Web Worker gehen. */
const workerGlobal = { console };
workerGlobal.globalThis = workerGlobal;
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'engine.js'), 'utf8'),
  workerGlobal,
  { filename: 'engine.js' }
);
const E = workerGlobal.RT.engine;

const cases = [
  { op: 'fullmatch', p: 'a|ab', t: 'ab' },
  { op: 'fullmatch', p: 'a$', t: 'a\n' },
  { op: 'fullmatch', p: '', t: '' },
  { op: 'fullmatch', p: '', t: 'x' },
  { op: 'fullmatch', p: '', t: '😀' },
  { op: 'finditer', p: 'a*', t: '😀' },
  { op: 'finditer', p: '', t: '😀' },
  { op: 'finditer', p: '$', t: '😀' },
  { op: 'finditer', p: '\\A', t: 'x😀' },
  { op: 'finditer', p: '\\B', t: 'x😀y' },
  { op: 'finditer', p: '(?<!.)', t: 'x😀y' },
  { op: 'finditer', p: '|a', t: 'a' },
  { op: 'finditer', p: '.*?', t: 'ab' },
  { op: 'finditer', p: 'x', t: '😀x' },
  { op: 'finditer_count', p: 'a*', t: 'b'.repeat(18000) },
  { op: 'findall', p: '\\w+', t: 'a\u0301 ² ¼ é' },
  { op: 'findall', p: '\\w+', t: 'Größe Café', f: 'a' },
  { op: 'findall', p: '\\s+', t: '\u001c\ufeff\u00a0' },
  { op: 'findall', p: '\\s+', t: '\u001c \u00a0', f: 'a' },
  { op: 'findall', p: '.', t: '\r\u2028\n' },
  { op: 'findall', p: '.', t: 'a\n😀', f: 's' },
  { op: 'findall', p: '[^\\D]+', t: '1a٢b' },
  { op: 'findall', p: '[^\\S]+', t: ' a\u001cb' },
  { op: 'findall', p: '[^aeiouAEIOU\\W\\d_]', t: 'Ball und Apfel ²' },
  { op: 'findall', p: '(?<=ab|cd)x', t: 'abx cdx' },
  { op: 'findall', p: '(?P<x>a)(?P=x)', t: 'aa ab' },
  { op: 'findall', p: '\\111+', t: 'III 111' },
  { op: 'findall', p: '[\\11]+', t: '\t x' },
  { op: 'findall', p: 'a{foo}', t: 'a{foo} a' },
  { op: 'findall', p: 'a{,3}', t: 'aaaa' },
  { op: 'findall', p: '^.+$', t: 'a\rb\u2028c\nd', f: 'm' },
  { op: 'findall', p: '\\d+  # Zahl\n [a-z]+', t: '12abc', f: 'x' },
  { op: 'findall', p: 'i', t: 'İıiI', f: 'i' },
  { op: 'findall', p: '[a-z]', t: 'İıſKAZ', f: 'i' },
  { op: 'findall', p: '[^i]', t: 'İıiIſKAZ', f: 'i' },
  { op: 'findall', p: 'i', t: 'İıiIſKAZ', f: 'ai' },
  { op: 'findall', p: '[a-z]', t: 'İıiIſKAZ', f: 'ai' },
  { op: 'findall', p: '[^i]', t: 'İıiIſKAZ', f: 'ai' },
  { op: 'findall', p: '\\x69', t: 'İıiI', f: 'i' },
  { op: 'findall', p: '[İ]', t: 'İıiI', f: 'i' },
  { op: 'fullmatch', p: '(a)\\1', t: 'aA', f: 'ai' },
  { op: 'fullmatch', p: '(?P<x>k)(?P=x)', t: 'kK', f: 'i' },
  { op: 'findall', p: '(?P<grüße>a)', t: 'a' },
  { op: 'findall', p: '(?<=\\😀|x)y', t: '😀y xy' },
  { op: 'compile', p: '(?<=\\😀|ab)y' },
  { op: 'findall', p: '(?# comment)a', t: 'a', f: 'x' },
  { op: 'fullmatch', p: '[] #]', t: ' ', f: 'x' },
  { op: 'fullmatch', p: 'a{ 2}', t: 'a{2}', f: 'x' },
  { op: 'fullmatch', p: 'a{2, 3}', t: 'a{2,3}', f: 'x' },
  { op: 'fullmatch', p: 'a{2 # Kommentar\n}', t: 'a{2}', f: 'x' },
  { op: 'fullmatch', p: '  (?i)a', t: 'A', f: 'x' },
  { op: 'fullmatch', p: '# Kommentar\n(?i)a', t: 'A', f: 'x' },
  { op: 'fullmatch', p: '(?x) (?i)a', t: 'A' },
  { op: 'fullmatch', p: '(?# comment)(?i)a', t: 'A' },
  { op: 'fullmatch', p: '(?# comment)(?i)a', t: 'A', f: 'x' },
  { op: 'fullmatch', p: '(?x) # Kommentar\n(?# zwei)(?i)a', t: 'A' },
  { op: 'fullmatch', p: '(?i)(?# Kommentar)(?m)^a', t: 'A' },
  { op: 'fullmatch', p: '(a)\\1 2', t: 'aa2', f: 'x' },
  { op: 'compile', p: 'a* ?', f: 'x' },
  { op: 'compile', p: '(?P <x>a)', f: 'x' },
  { op: 'compile', p: '(?< =a)a', f: 'x' },
  { op: 'compile', p: '\\x 41', f: 'x' },
  { op: 'compile', p: '\\u 0041', f: 'x' },
  { op: 'compile', p: '\\U 00000041', f: 'x' },
  { op: 'compile', p: '[\\W-a]' },
  { op: 'compile', p: '[\\w-a]' },
  { op: 'compile', p: 'a{4294967295}' },
  { op: 'compile', p: '\\b*' },
  { op: 'compile', p: '\\B+' },
  { op: 'compile', p: '$?' },
  { op: 'sub', p: '$', t: '😀', repl: '-' },
  { op: 'split', p: '\\B', t: 'x😀y' },
  { op: 'repr', t: '\b\f\v\0\u001c\u007f\u2028' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\0' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\g<0>' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\111' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\&' },
  { op: 'sub', p: '(?P<x>a)?b', t: 'b ab', repl: '<\\g<x>>' },
  { op: 'split', p: '|a', t: 'a' },
  { op: 'split', p: '(\\d)', t: 'a1b' },
  { op: 'compile', p: '\\q' },
  { op: 'compile', p: '[\\q]' },
  { op: 'compile', p: '\\8' },
  { op: 'compile', p: '(a)\\2' },
  { op: 'compile', p: 'abc\\' },
  { op: 'compile', p: '[\\A]' },
  { op: 'compile', p: '[\\Z]' },
  { op: 'compile', p: '(?<=a+)b' },
  { op: 'compile', p: '(?<=a|bc)x' },
  { op: 'compile', p: '(?<=ab|cd)x' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\q' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\2' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\g<x>' },
  { op: 'sub', p: '(a)', t: 'a', repl: '\\' },
  { op: 'escape', t: 'a.b* 100% a/b #x&~' }
];

const focusedCaseCount = cases.length + 3;
workerGlobal.window = workerGlobal;
for (const file of ['data-reference.js', 'data-lessons.js', 'data-exercises.js']) {
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'),
    workerGlobal,
    { filename: file }
  );
}

let referenceCaseCount = 0;
let lessonCaseCount = 0;
let exerciseCaseCount = 0;

for (const entry of workerGlobal.RT.reference) {
  if (typeof entry.pattern !== 'string') continue;
  cases.push({
    source: `Referenz: ${entry.sym} — ${entry.title}`,
    op: entry.fn || 'findall', p: entry.pattern, t: entry.text || '',
    f: entry.flags || '', repl: entry.repl || ''
  });
  referenceCaseCount++;
}

for (const lesson of workerGlobal.RT.lessons) {
  for (const block of lesson.blocks) {
    if (block.t !== 'demo') continue;
    cases.push({
      source: `Lektion: ${lesson.id}`,
      op: block.fn || 'findall', p: block.pattern || '', t: block.text || '',
      f: block.flags || '', repl: block.repl || ''
    });
    lessonCaseCount++;
  }
}

for (const exercise of workerGlobal.RT.exercises) {
  for (const exerciseCase of exercise.cases) {
    cases.push({
      source: `Aufgabe: ${exercise.id}`,
      op: exercise.fn || 'findall', p: exercise.solution, t: exerciseCase.text,
      f: exercise.flags || '', repl: exercise.repl || ''
    });
    exerciseCaseCount++;
  }
}

const pyProgram = String.raw`
import json, re, sys

def flags(s):
    value = 0
    for ch, flag in [('i', re.I), ('m', re.M), ('s', re.S), ('x', re.X), ('a', re.A)]:
        if ch in (s or ''): value |= flag
    return value

def match_value(m):
    if m is None: return None
    return {'span': list(m.span()), 'text': m.group(0),
            'groups': list(m.groups()), 'named': m.groupdict() or None}

def execute(c):
    try:
        if c['op'] == 'escape': return {'ok': True, 'value': re.escape(c['t'])}
        if c['op'] == 'repr': return {'ok': True, 'value': repr(c['t'])}
        p, f = c['p'], flags(c.get('f', ''))
        if c['op'] == 'compile':
            re.compile(p, f); return {'ok': True}
        if c['op'] == 'finditer':
            return {'ok': True, 'value': [match_value(m) for m in re.finditer(p, c['t'], f)]}
        if c['op'] == 'finditer_count': return {'ok': True, 'value': len(list(re.finditer(p, c['t'], f)))}
        if c['op'] == 'findall': return {'ok': True, 'value': re.findall(p, c['t'], f)}
        if c['op'] == 'search': return {'ok': True, 'value': match_value(re.search(p, c['t'], f))}
        if c['op'] == 'match': return {'ok': True, 'value': match_value(re.match(p, c['t'], f))}
        if c['op'] == 'fullmatch': return {'ok': True, 'value': match_value(re.fullmatch(p, c['t'], f))}
        if c['op'] == 'sub': return {'ok': True, 'value': re.sub(p, c['repl'], c['t'], flags=f)}
        if c['op'] == 'split': return {'ok': True, 'value': re.split(p, c['t'], flags=f)}
    except (re.error, IndexError, ValueError, OverflowError) as e:
        return {'ok': False}

print(json.dumps([execute(c) for c in json.load(sys.stdin)], ensure_ascii=False))
`;

const py = spawnSync(pythonBin, ['-c', pyProgram], {
  input: JSON.stringify(cases), encoding: 'utf8'
});
if (py.status !== 0) {
  console.error(py.stderr || `${pythonBin} konnte nicht ausgeführt werden`);
  process.exit(1);
}
const expected = JSON.parse(py.stdout);

function jsMatch(m) {
  if (!m) return null;
  return { span: [m.start, m.end], text: m.text, groups: m.groups, named: m.named };
}

function executeJS(c) {
  if (c.op === 'escape') return { ok: true, value: E.escape(c.t) };
  if (c.op === 'repr') return { ok: true, value: E.pyStr(c.t) };
  if (c.op === 'compile') return { ok: E.compile(c.p, c.f || '').ok };
  if (c.op === 'finditer_count') {
    const result = E.run(c.p, c.f || '', c.t, 'finditer');
    return result.ok ? { ok: true, value: result.value.length } : { ok: false };
  }
  const result = E.run(c.p, c.f || '', c.t, c.op, { repl: c.repl || '' });
  if (!result.ok) return { ok: false };
  if (c.op === 'finditer') return { ok: true, value: result.value.map(jsMatch) };
  if (c.op === 'search' || c.op === 'match' || c.op === 'fullmatch') {
    return { ok: true, value: jsMatch(result.value) };
  }
  return { ok: true, value: result.value };
}

let failures = 0;
cases.forEach((c, i) => {
  const got = executeJS(c);
  if (JSON.stringify(got) !== JSON.stringify(expected[i])) {
    failures++;
    console.error(`✗ ${c.source || c.op} · ${c.op} ${JSON.stringify(c.p || c.t)}`);
    console.error('  Python:', JSON.stringify(expected[i]));
    console.error('  Engine:', JSON.stringify(got));
  }
});

/* Bewusst enger als CPython: Fälle, die JavaScript nachweislich anders
   auswerten würde, werden klar abgelehnt statt mit falschem Ergebnis
   weiterzulaufen. */
const guardedUnsupported = [
  { p: '(a)?\\1', f: '', t: 'b', part: 'nicht beteiligte Gruppe' },
  { p: '(?P<x>a)?(?P=x)', f: '', t: 'b', part: 'nicht beteiligte Gruppe' },
  { p: '(a|(b))*', f: '', t: 'ba', part: 'Capture-Historie' },
  { p: '(a?)*', f: '', t: 'a', part: 'Capture-Historie' },
  { p: '(a*)*', f: '', t: '', part: 'Capture-Historie' },
  { p: '(?P<x>i)(?P=x)', f: 'i', t: 'iİ', part: 'İ/ı' },
  { p: '(?P<x>k)(?P=x)', f: 'ai', t: 'kK', part: 'reine ASCII' },
  { p: '(?=a)*', f: '', t: 'a', part: 'Quantifizierte Lookarounds' },
  { p: '(?<=a)+', f: '', t: 'aa', part: 'Quantifizierte Lookarounds' }
];
guardedUnsupported.forEach((c) => {
  const result = E.run(c.p, c.f, c.t, 'fullmatch');
  if (result.ok || !String(result.error || '').includes(c.part)) {
    failures++;
    console.error(`✗ Schutzgrenze ${JSON.stringify(c.p)}: ${result.error || 'unerwartet akzeptiert'}`);
  }
});

const tooMany = E.run('.', '', 'a'.repeat(20001), 'findall');
if (tooMany.ok || !/20\.000|20000/.test(tooMany.error || '')) {
  failures++;
  console.error('✗ Mehr als 20.000 Treffer müssen mit einer klaren Grenze abbrechen');
}

/* Python 3.14-spezifisch; das lokal verfügbare python3 kann älter sein. */
const z = E.run('\\d\\z', '', 'x2', 'findall');
if (!z.ok || JSON.stringify(z.value) !== '["2"]') {
  failures++; console.error('✗ Python 3.14: \\z muss absolutes Ende sein');
}
const bEmpty = E.run('\\B', '', '', 'finditer');
if (!bEmpty.ok || bEmpty.value.length !== 1 || bEmpty.value[0].start !== 0) {
  failures++; console.error('✗ Python 3.14: \\B muss auf leeren String passen');
}
const version = E.compile('', '');
if (!version.ok || version.pythonVersion !== '3.14') {
  failures++; console.error('✗ Leeres Muster / ausgewiesene Python-Version');
}

if (failures) {
  console.error(`${failures} Differentialfehler`);
  process.exit(1);
}
console.log(
  `ALLES GRÜN (${cases.length + 3 + guardedUnsupported.length + 1} Differential-/Schutzprüfungen gegen CPython ${pyVersion}: ` +
  `${focusedCaseCount + guardedUnsupported.length + 1} gezielte, ${referenceCaseCount} Referenz-, ${lessonCaseCount} Lektions- und ` +
  `${exerciseCaseCount} Aufgabenfälle)`
);
