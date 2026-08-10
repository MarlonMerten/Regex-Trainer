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
    Z: ['Stringende', 'Nur ganz am Ende des Strings. In Python 3.14 ist \\Z ein Alias für \\z.'],
    z: ['absolutes Stringende', 'Nur ganz am Ende des Strings (seit Python 3.14). Anders als $ nicht vor einem abschließenden Zeilenumbruch.'],
    a: ['Signalton', 'Das Steuerzeichen BEL mit dem Codepunkt 7.'],
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
    var possessive = /[+]$/.test(q) && q.length > 1 && /[*+?}]/.test(q[q.length - 2]);
    var core = (lazy || possessive) ? q.slice(0, -1) : q;
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
    else if (possessive) suffix = ' — possessiv: einmal genommen, nie wieder hergegeben (in Python gültig; in dieser Browser-Engine nicht unterstützt).';
    else if (core !== '?' ) suffix = ' — gierig (greedy): nimmt so viel wie möglich und gibt nur zurück, wenn es sonst nicht passt.';
    return { label: base, desc: 'Wiederholt den Baustein davor ' + base + '.' + suffix };
  }

  function quantifierEnd(pattern, start) {
    var c = pattern[start];
    if (c === '*' || c === '+' || c === '?') return start + 1;
    if (c !== '{') return -1;
    var i = start + 1, before = 0, after = 0;
    while (/[0-9]/.test(pattern[i] || '')) { before++; i++; }
    if (pattern[i] === '}') return before ? i + 1 : -1;
    if (pattern[i] !== ',') return -1;
    i++;
    while (/[0-9]/.test(pattern[i] || '')) { after++; i++; }
    return pattern[i] === '}' && (before || after) ? i + 1 : -1;
  }

  function tokenize(pattern) {
    var toks = [], i = 0, groupNum = 0, stack = [];
    function push(rawStart, rawEnd, kind, label, desc) {
      toks.push({ raw: pattern.slice(rawStart, rawEnd), start: rawStart, end: rawEnd,
                  kind: kind, label: label, desc: desc });
    }
    function at(text) { return pattern.startsWith(text, i); }

    while (i < pattern.length) {
      var start = i, c = pattern[i], end;

      end = quantifierEnd(pattern, i);
      if (end !== -1) {
        i = end;
        if (pattern[i] === '?' || pattern[i] === '+') i++;
        var qd = quantDesc(pattern.slice(start, i));
        push(start, i, 'quant', qd.label, qd.desc);
        continue;
      }

      if (c === '\\') {
        if (i + 1 >= pattern.length) {
          i++;
          push(start, i, 'err', 'unvollständig', 'Ein einzelner Backslash am Ende.');
          continue;
        }
        var escaped = String.fromCodePoint(pattern.codePointAt(i + 1));
        i += 1 + escaped.length;
        if (/[1-9]/.test(escaped)) {
          while (/[0-9]/.test(pattern[i] || '')) i++;
          var number = pattern.slice(start + 1, i);
          push(start, i, 'ref', 'Rückverweis auf Gruppe ' + number,
               'Muss exakt denselben Text matchen, den Gruppe ' + number + ' gefunden hat.');
          continue;
        }
        if (ESCAPES[escaped]) {
          var escapeKind = /[bBAZz]/.test(escaped) ? 'anchor' : 'class';
          push(start, i, escapeKind, ESCAPES[escaped][0], ESCAPES[escaped][1]);
          continue;
        }
        if (escaped === 'k' && pattern[i] === '<') {
          var jsRefEnd = pattern.indexOf('>', i + 1);
          i = jsRefEnd === -1 ? pattern.length : jsRefEnd + 1;
          push(start, i, 'err', 'keine Python-Syntax',
               '\\k<name> ist JavaScript/.NET-Syntax. Python verwendet im Muster (?P=name).');
          continue;
        }
        if (escaped === 'x' || escaped === 'u' || escaped === 'U') {
          var digits = escaped === 'x' ? 2 : (escaped === 'u' ? 4 : 8);
          var hexEnd = Math.min(pattern.length, i + digits);
          while (i < hexEnd && /[0-9A-Fa-f]/.test(pattern[i])) i++;
          if (i < hexEnd) i = hexEnd;
          push(start, i, 'lit', 'Zeichen per Unicode-/Hexcode',
               'Eine Python-Escape-Sequenz für einen konkreten Codepunkt.');
          continue;
        }
        if (escaped === 'N' && pattern[i] === '{') {
          var unicodeNameEnd = pattern.indexOf('}', i + 1);
          i = unicodeNameEnd === -1 ? pattern.length : unicodeNameEnd + 1;
          push(start, i, 'lit', 'benanntes Unicode-Zeichen',
               'Python löst \\N{NAME} über die Unicode-Datenbank auf; die Browser-Engine unterstützt diese Form nicht.');
          continue;
        }
        push(start, i, 'lit', 'Zeichen „' + escaped + '“',
             'Der Backslash entwertet die Sonderbedeutung: Gemeint ist das Zeichen „' + escaped + '“.');
        continue;
      }

      if (c === '[') {
        var j = i + 1, negated = false;
        if (pattern[j] === '^') { negated = true; j++; }
        if (pattern[j] === ']') j++;
        while (j < pattern.length && pattern[j] !== ']') {
          if (pattern[j] === '\\' && j + 1 < pattern.length) {
            j += 1 + String.fromCodePoint(pattern.codePointAt(j + 1)).length;
          } else j += String.fromCodePoint(pattern.codePointAt(j)).length;
        }
        i = j < pattern.length ? j + 1 : pattern.length;
        var raw = pattern.slice(start, i);
        var closed = raw[raw.length - 1] === ']';
        var body = raw.slice(negated ? 2 : 1, raw.length - (closed ? 1 : 0));
        var listed = describeClassBody(body).join(', ');
        push(start, i, closed ? 'set' : 'err',
             closed ? (negated ? 'kein Zeichen aus [' + body + ']' : 'ein Zeichen aus [' + body + ']') : 'offene Zeichenklasse',
             closed
               ? (negated ? 'Genau EIN Zeichen, das NICHT dazugehört: ' : 'Genau EIN Zeichen aus dieser Menge: ') + listed + '. Eine Zeichenklasse steht für ein Zeichen.'
               : 'Die Zeichenklasse wurde nicht mit ] geschlossen.');
        continue;
      }

      if (c === '(') {
        if (at('(?P=')) {
          var namedRefEnd = pattern.indexOf(')', i + 4);
          i = namedRefEnd === -1 ? pattern.length : namedRefEnd + 1;
          var refName = pattern.slice(start + 4, namedRefEnd === -1 ? pattern.length : namedRefEnd);
          push(start, i, namedRefEnd === -1 ? 'err' : 'ref',
               namedRefEnd === -1 ? 'unvollständiger Rückverweis' : 'Rückverweis auf „' + refName + '“',
               namedRefEnd === -1 ? 'Der benannte Rückverweis braucht eine schließende Klammer.' : 'Muss denselben Text matchen wie die benannte Gruppe „' + refName + '“.');
          continue;
        }
        if (at('(?P<')) {
          var nameEnd = pattern.indexOf('>', i + 4);
          i = nameEnd === -1 ? pattern.length : nameEnd + 1;
          var name = pattern.slice(start + 4, nameEnd === -1 ? pattern.length : nameEnd);
          if (nameEnd !== -1) { groupNum++; stack.push('Gruppe „' + name + '“'); }
          push(start, i, nameEnd === -1 ? 'err' : 'group',
               nameEnd === -1 ? 'unvollständige benannte Gruppe' : 'benannte Gruppe „' + name + '“',
               nameEnd === -1 ? 'Nach (?P<name fehlt das schließende >.' : 'Fängt den Treffer als Gruppe „' + name + '“ ein. Zugriff über m.group("' + name + '") oder m.groupdict().');
          continue;
        }
        if (at('(?<') && !at('(?<=') && !at('(?<!')) {
          var jsNameEnd = pattern.indexOf('>', i + 3);
          i = jsNameEnd === -1 ? pattern.length : jsNameEnd + 1;
          if (jsNameEnd !== -1) stack.push('ungültige JS-Gruppe');
          push(start, i, 'err', 'keine Python-Syntax',
               '(?<name>…) ist JavaScript/.NET-Syntax. Python verwendet (?P<name>…).');
          continue;
        }
        if (at('(?:')) {
          i += 3; stack.push('Gruppe (nicht fangend)');
          push(start, i, 'group', 'Gruppe ohne Speichern', 'Klammert nur zum Zusammenfassen; der Inhalt landet nicht in den Gruppen.');
          continue;
        }
        if (at('(?=')) {
          i += 3; stack.push('Lookahead');
          push(start, i, 'look', 'positiver Lookahead', 'Prüft rechts, ohne Zeichen zu verbrauchen.');
          continue;
        }
        if (at('(?!')) {
          i += 3; stack.push('negativer Lookahead');
          push(start, i, 'look', 'negativer Lookahead', 'Prüft, dass das Folgende rechts nicht steht. Verbraucht kein Zeichen.');
          continue;
        }
        if (at('(?<=')) {
          i += 4; stack.push('Lookbehind');
          push(start, i, 'look', 'positiver Lookbehind', 'Prüft links. In Python muss ein Lookbehind feste Länge haben.');
          continue;
        }
        if (at('(?<!')) {
          i += 4; stack.push('negativer Lookbehind');
          push(start, i, 'look', 'negativer Lookbehind', 'Prüft, dass das Angegebene links nicht steht. Feste Länge erforderlich.');
          continue;
        }
        if (at('(?#')) {
          var commentEnd = pattern.indexOf(')', i + 3);
          i = commentEnd === -1 ? pattern.length : commentEnd + 1;
          push(start, i, commentEnd === -1 ? 'err' : 'cmt', commentEnd === -1 ? 'offener Kommentar' : 'Kommentar',
               commentEnd === -1 ? 'Der Regex-Kommentar wurde nicht geschlossen.' : 'Wird von Python ignoriert.');
          continue;
        }
        if (at('(?>')) {
          i += 3; stack.push('atomare Gruppe');
          push(start, i, 'group', 'atomare Gruppe', 'In Python gültig; die Browser-Engine unterstützt atomare Gruppen derzeit nicht.');
          continue;
        }
        if (at('(?')) {
          var flagEnd = i + 2;
          while (/[aiLmsux-]/.test(pattern[flagEnd] || '')) flagEnd++;
          if (pattern[flagEnd] === ')' || pattern[flagEnd] === ':') {
            var scoped = pattern[flagEnd] === ':';
            var flagText = pattern.slice(i + 2, flagEnd);
            i = flagEnd + 1;
            if (scoped) stack.push('Gruppe mit lokalen Flags');
            push(start, i, 'flag', (scoped ? 'lokale ' : '') + 'Inline-Flags ' + flagText,
                 scoped ? 'In Python gültig; lokale Inline-Flags werden von der Browser-Engine derzeit nicht unterstützt.' : 'Schaltet Flags direkt im Muster ein und muss am Musteranfang stehen.');
            continue;
          }
          i += 2;
          push(start, i, 'err', 'unbekannte Gruppenerweiterung', 'Nach (? folgt keine hier erkannte Python-Gruppensyntax.');
          continue;
        }
        groupNum++;
        stack.push('Gruppe ' + groupNum);
        i++;
        push(start, i, 'group', 'Gruppe ' + groupNum + ' beginnt', 'Fängt den Treffer ein und beeinflusst die Rückgabe von findall().');
        continue;
      }

      if (c === ')') {
        i++;
        var owner = stack.pop() || 'Gruppe';
        push(start, i, 'group', owner + ' endet', 'Schließt: ' + owner + '.');
        continue;
      }
      if (c === '^' || c === '$') {
        i++;
        push(start, i, 'anchor', c === '^' ? 'Anfang' : 'Ende',
             c === '^' ? 'Stringanfang; mit re.M auch Zeilenanfang.' : 'Stringende (oder vor finalem \\n); mit re.M auch Zeilenende.');
        continue;
      }
      if (c === '.') {
        i++;
        push(start, i, 'class', 'beliebiges Zeichen', 'Ein Zeichen außer Zeilenumbruch; mit re.S auch der Zeilenumbruch.');
        continue;
      }
      if (c === '|') {
        i++;
        push(start, i, 'alt', 'oder', 'Alternative: entweder der linke oder der rechte Zweig.');
        continue;
      }

      while (i < pattern.length && !/[\\\[\](){}^$.|*+?]/.test(pattern[i])) {
        i += String.fromCodePoint(pattern.codePointAt(i)).length;
      }
      if (i === start) i += String.fromCodePoint(pattern.codePointAt(i)).length;
      var literal = pattern.slice(start, i);
      push(start, i, 'lit', literal.length === 1 ? 'Zeichen „' + literal + '“' : 'Text „' + literal + '“',
           'Muss genau so im Text stehen' + (literal.length > 1 ? ' — Zeichen für Zeichen.' : '.'));
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
