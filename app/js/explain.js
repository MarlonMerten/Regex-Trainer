/* =============================================================
   explain.js — zerlegt ein Muster in Bausteine und erklärt sie
   Liefert eine Liste von Tokens:
     { raw, start, end, kind, label, desc }
   kind steuert die Einfärbung in der UI.
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});

  var ESCAPES = {
    d: ['Ziffer', 'Eine Ziffer 0–9 (in Python 3 auch Ziffern anderer Schriftsysteme).'],
    D: ['keine Ziffer', 'Ein Zeichen, das keine Ziffer ist.'],
    w: ['Wortzeichen', 'Buchstabe, Ziffer oder Unterstrich. In Python 3 zählen auch Umlaute und Akzente dazu.'],
    W: ['kein Wortzeichen', 'Alles außer Buchstabe, Ziffer und Unterstrich — also z. B. Leerzeichen und Satzzeichen.'],
    s: ['Whitespace', 'Leerzeichen, Tab, Zeilenumbruch und Verwandte.'],
    S: ['kein Whitespace', 'Jedes Zeichen, das kein Leerraum ist.'],
    b: ['Wortgrenze', 'Die Nahtstelle zwischen Wortzeichen und Nicht-Wortzeichen. Verbraucht selbst kein Zeichen.'],
    B: ['keine Wortgrenze', 'Eine Position mitten im Wort (oder mitten im Nichts).'],
    A: ['Stringanfang', 'Nur ganz am Anfang des Strings — anders als ^ auch bei re.M.'],
    Z: ['Stringende', 'Nur ganz am Ende des Strings — anders als $ auch bei re.M.'],
    n: ['Zeilenumbruch', 'Das Newline-Zeichen \\n.'],
    t: ['Tabulator', 'Das Tab-Zeichen \\t.'],
    r: ['Wagenrücklauf', 'Das Carriage-Return-Zeichen \\r.'],
    f: ['Seitenvorschub', 'Das Form-Feed-Zeichen \\f.'],
    v: ['Vertikaltab', 'Das vertikale Tab-Zeichen \\v.']
  };

  var CLASS_NAMES = {
    'a-z': 'Kleinbuchstaben a–z',
    'A-Z': 'Großbuchstaben A–Z',
    '0-9': 'Ziffern 0–9'
  };

  function describeClassBody(body) {
    var parts = [];
    for (var i = 0; i < body.length; i++) {
      var c = body[i];
      if (c === '\\') {
        var n = body[i + 1]; i++;
        if (ESCAPES[n]) parts.push(ESCAPES[n][0]);
        else parts.push('das Zeichen „' + n + '“');
        continue;
      }
      if (body[i + 1] === '-' && body[i + 2] && body[i + 2] !== ']') {
        var range = c + '-' + body[i + 2];
        parts.push(CLASS_NAMES[range] || ('Zeichen von „' + c + '“ bis „' + body[i + 2] + '“'));
        i += 2;
        continue;
      }
      // aufeinanderfolgende Einzelzeichen zusammenfassen
      var run = c;
      while (body[i + 1] && body[i + 1] !== '\\' && !(body[i + 2] === '-' && body[i + 3])) {
        if (body[i + 1] === '-' ) break;
        run += body[++i];
      }
      parts.push(run.length === 1 ? '„' + run + '“' : 'eines der Zeichen „' + run + '“');
    }
    return parts;
  }

  function quantDesc(q) {
    var lazy = /[?]$/.test(q) && q.length > 1;
    var core = lazy ? q.slice(0, -1) : q;
    var possessive = /[+]$/.test(q) && q.length > 1 && /[*+?}]/.test(q[q.length - 2]);
    var base;
    if (core === '*') base = 'beliebig oft (auch keinmal)';
    else if (core === '+') base = 'mindestens einmal';
    else if (core === '?') base = 'einmal oder gar nicht';
    else {
      var m = /^\{(\d*)(,?)(\d*)\}$/.exec(core);
      if (m) {
        if (!m[2]) base = 'genau ' + m[1] + '-mal';
        else if (m[1] && m[3]) base = m[1] + '- bis ' + m[3] + '-mal';
        else if (m[1]) base = 'mindestens ' + m[1] + '-mal';
        else base = 'höchstens ' + m[3] + '-mal';
      } else base = 'wiederholt';
    }
    var suffix = '';
    if (lazy) suffix = ' — und zwar genügsam (lazy): nimmt so wenig wie möglich.';
    else if (possessive) suffix = ' — possessiv: einmal genommen, nie wieder hergegeben.';
    else if (core !== '?' ) suffix = ' — gierig (greedy): nimmt so viel wie möglich und gibt nur zurück, wenn es sonst nicht passt.';
    return { label: base, desc: 'Wiederholt den Baustein davor ' + base + '.' + suffix };
  }

  function tokenize(pattern) {
    var toks = [];
    var i = 0;
    var groupNum = 0;
    var stack = [];

    function push(t) { toks.push(t); }

    while (i < pattern.length) {
      var start = i;
      var c = pattern[i];

      /* --- Quantifizierer --- */
      if (c === '*' || c === '+' || c === '?' || (c === '{' && /^\{\d*,?\d*\}/.test(pattern.slice(i)))) {
        var q = c;
        if (c === '{') q = /^\{\d*,?\d*\}/.exec(pattern.slice(i))[0];
        i += q.length;
        if (pattern[i] === '?' || pattern[i] === '+') { q += pattern[i]; i++; }
        var qd = quantDesc(q);
        push({ raw: q, start: start, end: i, kind: 'quant', label: qd.label, desc: qd.desc });
        continue;
      }

      /* --- Escape --- */
      if (c === '\\') {
        var n = pattern[i + 1];
        i += 2;
        if (n === undefined) { push({ raw: '\\', start: start, end: i, kind: 'err', label: 'unvollständig', desc: 'Ein einzelner Backslash am Ende.' }); continue; }
        if (/[1-9]/.test(n)) {
          var num = n;
          while (/[0-9]/.test(pattern[i] || '')) num += pattern[i++];
          push({ raw: '\\' + num, start: start, end: i, kind: 'ref', label: 'Rückverweis auf Gruppe ' + num, desc: 'Muss exakt denselben Text matchen, den Gruppe ' + num + ' gefunden hat. Damit findet man Wiederholungen wie „oo“ in cool.' });
          continue;
        }
        if (ESCAPES[n]) {
          var k = (n === 'b' || n === 'B' || n === 'A' || n === 'Z') ? 'anchor' : 'class';
          push({ raw: '\\' + n, start: start, end: i, kind: k, label: ESCAPES[n][0], desc: ESCAPES[n][1] });
          continue;
        }
        if (n === 'k' && pattern[i] === '<') {
          var close = pattern.indexOf('>', i);
          var nm = close === -1 ? '' : pattern.slice(i + 1, close);
          i = close === -1 ? i : close + 1;
          push({ raw: '\\k<' + nm + '>', start: start, end: i, kind: 'ref', label: 'Rückverweis auf „' + nm + '“', desc: 'Muss denselben Text matchen wie die benannte Gruppe „' + nm + '“.' });
          continue;
        }
        push({ raw: '\\' + n, start: start, end: i, kind: 'lit', label: 'Zeichen „' + n + '“', desc: 'Der Backslash entwertet die Sonderbedeutung: hier ist wirklich das Zeichen „' + n + '“ gemeint.' });
        continue;
      }

      /* --- Zeichenklasse --- */
      if (c === '[') {
        var j = i + 1, neg = false;
        if (pattern[j] === '^') { neg = true; j++; }
        if (pattern[j] === ']') j++;
        while (j < pattern.length && pattern[j] !== ']') {
          if (pattern[j] === '\\') j++;
          j++;
        }
        var raw = pattern.slice(i, Math.min(j + 1, pattern.length));
        var body = raw.slice(neg ? 2 : 1, raw.length - (raw[raw.length - 1] === ']' ? 1 : 0));
        i = j + 1;
        var parts = describeClassBody(body);
        var listed = parts.join(', ');
        push({
          raw: raw, start: start, end: i, kind: 'set',
          label: neg ? 'kein Zeichen aus [' + body + ']' : 'ein Zeichen aus [' + body + ']',
          desc: (neg
            ? 'Genau EIN Zeichen, das NICHT dazugehört: ' + listed + '.'
            : 'Genau EIN Zeichen aus dieser Menge: ' + listed + '.') +
            ' Eine Zeichenklasse steht immer für ein einziges Zeichen — für mehrere braucht sie einen Quantifizierer.'
        });
        continue;
      }

      /* --- Gruppen --- */
      if (c === '(') {
        var rest = pattern.slice(i);
        var m;
        if ((m = /^\(\?P<([A-Za-z_]\w*)>/.exec(rest)) || (m = /^\(\?<([A-Za-z_]\w*)>/.exec(rest))) {
          groupNum++;
          stack.push('Gruppe „' + m[1] + '“');
          i += m[0].length;
          push({ raw: m[0], start: start, end: i, kind: 'group', label: 'benannte Gruppe „' + m[1] + '“', desc: 'Fängt den Treffer ein und legt ihn unter dem Namen „' + m[1] + '“ ab. Zugriff über m.group("' + m[1] + '") oder m.groupdict().' });
          continue;
        }
        if (rest.indexOf('(?:') === 0) {
          stack.push('Gruppe (nicht fangend)');
          i += 3;
          push({ raw: '(?:', start: start, end: i, kind: 'group', label: 'Gruppe ohne Speichern', desc: 'Klammert nur zum Zusammenfassen — der Inhalt landet NICHT in den Gruppen. Wichtig, weil findall() sonst plötzlich Gruppen statt Treffer liefert.' });
          continue;
        }
        if (rest.indexOf('(?=') === 0) {
          stack.push('Lookahead');
          i += 3;
          push({ raw: '(?=', start: start, end: i, kind: 'look', label: 'positiver Lookahead', desc: 'Prüft, ob RECHTS davon das Folgende steht — verbraucht dabei aber kein Zeichen. Der Text bleibt außerhalb des Treffers.' });
          continue;
        }
        if (rest.indexOf('(?!') === 0) {
          stack.push('negativer Lookahead');
          i += 3;
          push({ raw: '(?!', start: start, end: i, kind: 'look', label: 'negativer Lookahead', desc: 'Prüft, ob RECHTS davon das Folgende NICHT steht. Verbraucht kein Zeichen.' });
          continue;
        }
        if (rest.indexOf('(?<=') === 0) {
          stack.push('Lookbehind');
          i += 4;
          push({ raw: '(?<=', start: start, end: i, kind: 'look', label: 'positiver Lookbehind', desc: 'Prüft, ob LINKS davon das Angegebene steht. In Python muss ein Lookbehind feste Länge haben.' });
          continue;
        }
        if (rest.indexOf('(?<!') === 0) {
          stack.push('negativer Lookbehind');
          i += 4;
          push({ raw: '(?<!', start: start, end: i, kind: 'look', label: 'negativer Lookbehind', desc: 'Prüft, ob LINKS davon das Angegebene NICHT steht. Feste Länge erforderlich.' });
          continue;
        }
        if ((m = /^\(\?#[^)]*\)/.exec(rest))) {
          i += m[0].length;
          push({ raw: m[0], start: start, end: i, kind: 'cmt', label: 'Kommentar', desc: 'Wird von der Engine ignoriert.' });
          continue;
        }
        if ((m = /^\(\?([aiLmsux]+)\)/.exec(rest))) {
          i += m[0].length;
          push({ raw: m[0], start: start, end: i, kind: 'flag', label: 'Inline-Flag ' + m[1], desc: 'Schaltet Flags direkt im Muster ein (i = ignore case, s = DOTALL, m = MULTILINE, x = verbose). Muss in Python am Anfang stehen.' });
          continue;
        }
        groupNum++;
        stack.push('Gruppe ' + groupNum);
        i++;
        push({ raw: '(', start: start, end: i, kind: 'group', label: 'Gruppe ' + groupNum + ' beginnt', desc: 'Fängt den Treffer ein: Gruppe ' + groupNum + '. Abrufbar mit m.group(' + groupNum + ') — und beeinflusst, was findall() zurückgibt.' });
        continue;
      }

      if (c === ')') {
        i++;
        var owner = stack.pop() || 'Gruppe';
        push({ raw: ')', start: start, end: i, kind: 'group', label: owner + ' endet', desc: 'Schließt: ' + owner + '.' });
        continue;
      }

      /* --- Anker & Sonderzeichen --- */
      if (c === '^') {
        i++;
        push({ raw: '^', start: start, end: i, kind: 'anchor', label: 'Anfang', desc: 'Anfang des Strings — mit dem Flag re.M zusätzlich der Anfang jeder Zeile. Verbraucht kein Zeichen.' });
        continue;
      }
      if (c === '$') {
        i++;
        push({ raw: '$', start: start, end: i, kind: 'anchor', label: 'Ende', desc: 'Ende des Strings (und direkt vor einem abschließenden \\n) — mit re.M auch jedes Zeilenende.' });
        continue;
      }
      if (c === '.') {
        i++;
        push({ raw: '.', start: start, end: i, kind: 'class', label: 'beliebiges Zeichen', desc: 'Ein beliebiges Zeichen außer Zeilenumbruch. Mit dem Flag re.S (DOTALL) auch der Zeilenumbruch.' });
        continue;
      }
      if (c === '|') {
        i++;
        push({ raw: '|', start: start, end: i, kind: 'alt', label: 'oder', desc: 'Alternative: entweder das links davon oder das rechts davon. Gilt bis zur nächsten Klammergrenze — deshalb fast immer einklammern.' });
        continue;
      }

      /* --- Literale zusammenfassen --- */
      var lit = '';
      while (i < pattern.length && !/[\\\[\](){}^$.|*+?]/.test(pattern[i])) {
        lit += pattern[i++];
      }
      if (lit === '') { lit = pattern[i]; i++; }
      push({
        raw: lit, start: start, end: i, kind: 'lit',
        label: lit.length === 1 ? 'Zeichen „' + lit + '“' : 'Text „' + lit + '“',
        desc: 'Muss genau so im Text stehen' + (lit.length > 1 ? ' — Zeichen für Zeichen.' : '.')
      });
    }
    return toks;
  }

  /* Kurzer Fließtext-Satz über das ganze Muster */
  function summarize(toks) {
    if (!toks.length) return '';
    var bits = toks.map(function (t) { return t.label; });
    return 'Gesucht wird: ' + bits.join(' → ') + '.';
  }

  RT.explain = { tokenize: tokenize, summarize: summarize };
})(window);
