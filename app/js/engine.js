/* =============================================================
   engine.js — Python-Regex-Semantik im Browser
   -------------------------------------------------------------
   Der Browser bringt eine JavaScript-Regex-Engine mit. Die ist
   der Python-Engine sehr ähnlich, aber eben nicht gleich. Damit
   der Trainer nicht das Falsche beibringt, übersetzen wir das
   Muster vor dem Ausführen in ein äquivalentes JS-Muster.

   Wichtigste Unterschiede, die hier behandelt werden:
     \w \d \b   Python 3 ist unicode-aware ("Wörter" ist EIN Wort),
                JS ist ASCII-only.
     (?P<x>..)  Python-Schreibweise für benannte Gruppen.
     (?P=x)     Rückverweis auf benannte Gruppe.
     (?#...)    Kommentar im Muster.
     \A \Z      Absoluter String-Anfang/-Ende.
     $          Python matcht auch VOR einem abschließenden \n.
     re.X       Verbose-Modus: Whitespace und # -Kommentare raus.

   Zusätzlich bilden wir die Rückgabewerte der re-Funktionen nach,
   insbesondere die Gruppenregel von findall().
   ============================================================= */
(function (global) {
  'use strict';

  var RT = (global.RT = global.RT || {});

  /* Zeichenmengen für "Wortzeichen" in beiden Welten */
  var WORD_U = '\\p{L}\\p{M}\\p{N}_';   // Unicode (= Python 3 default)
  var WORD_A = 'A-Za-z0-9_';            // ASCII   (= Python mit re.A, = JS)

  /* ---------------------------------------------------------------
     re.X / re.VERBOSE: Whitespace und Kommentare entfernen
     --------------------------------------------------------------- */
  function stripVerbose(p) {
    var out = '', inClass = false;
    for (var i = 0; i < p.length; i++) {
      var c = p[i];
      if (c === '\\') { out += c + (p[i + 1] || ''); i++; continue; }
      if (inClass) { if (c === ']') inClass = false; out += c; continue; }
      if (c === '[') { inClass = true; out += c; continue; }
      if (/\s/.test(c)) continue;
      if (c === '#') { while (i < p.length && p[i] !== '\n') i++; continue; }
      out += c;
    }
    return out;
  }

  /* ---------------------------------------------------------------
     Führende Inline-Flags  (?i)  (?im)  … einsammeln
     Python erlaubt die nur am Musteranfang, JS kennt sie gar nicht.
     --------------------------------------------------------------- */
  function extractInlineFlags(p) {
    var flags = '';
    var m;
    while ((m = /^\(\?([aiLmsux]+)\)/.exec(p))) {
      flags += m[1];
      p = p.slice(m[0].length);
    }
    return { pattern: p, flags: flags };
  }

  /* ---------------------------------------------------------------
     Kern: Python-Muster -> JS-Muster
     unicode=true  erzeugt die \p{...}-Variante (braucht u-Flag)
     unicode=false erzeugt die ASCII-Variante (Fallback)
     --------------------------------------------------------------- */
  function translate(pattern, opts) {
    var unicode = opts.unicode;
    var multiline = opts.multiline;
    var W = unicode ? WORD_U : WORD_A;
    var wc = '[' + W + ']';
    var nwc = '[^' + W + ']';
    var digit = unicode ? '\\p{Nd}' : '[0-9]';
    var nDigit = unicode ? '[^\\p{Nd}]' : '[^0-9]';
    var boundary = '(?:(?<!' + wc + ')(?=' + wc + ')|(?<=' + wc + ')(?!' + wc + '))';
    var nBoundary = '(?:(?<=' + wc + ')(?=' + wc + ')|(?<!' + wc + ')(?!' + wc + '))';

    var out = '';
    var inClass = false;
    var warnings = [];

    for (var i = 0; i < pattern.length; i++) {
      var c = pattern[i];

      /* ---- Escape-Sequenzen ---- */
      if (c === '\\') {
        var n = pattern[i + 1];
        if (n === undefined) { out += '\\\\'; break; }
        i++;
        if (inClass) {
          if (n === 'w') { out += W; }
          else if (n === 'd') { out += unicode ? '\\p{Nd}' : '0-9'; }
          else if (n === 'W' || n === 'D') {
            out += '\\' + n;
            warnings.push('\\' + n + ' innerhalb einer Zeichenklasse wird ASCII-basiert ausgewertet.');
          } else if (n === 'Z' || n === 'A') {
            out += n === 'Z' ? '\\u001a' : '\\u0007'; // in Python auch nur Literale in []
          } else {
            out += '\\' + n;
          }
          continue;
        }
        switch (n) {
          case 'w': out += wc; break;
          case 'W': out += nwc; break;
          case 'd': out += digit; break;
          case 'D': out += nDigit; break;
          case 'b': out += boundary; break;
          case 'B': out += nBoundary; break;
          case 'A': out += '(?<![\\s\\S])'; break;
          case 'Z': out += '(?![\\s\\S])'; break;
          case 'z':
            out += '(?![\\s\\S])';
            warnings.push('\\z gibt es in Python nicht — gemeint ist vermutlich \\Z.');
            break;
          default:
            /* Python erlaubt \ vor beliebiger Interpunktion, JS im u-Modus nicht.
               Wo der Backslash überflüssig ist, lassen wir ihn weg — sonst
               müssten wir auf den ASCII-Modus zurückfallen und verlören \w-Unicode. */
            if (/[A-Za-z0-9]/.test(n) || '^$\\.*+?()[]{}|/'.indexOf(n) !== -1) out += '\\' + n;
            else out += n;
        }
        continue;
      }

      /* ---- Zeichenklassen ---- */
      if (inClass) {
        if (c === ']') inClass = false;
        out += c;
        continue;
      }
      if (c === '[') {
        inClass = true;
        out += c;
        // "[]abc]" ist in Python KEIN leeres Set — ] direkt nach [ ist literal
        if (pattern[i + 1] === ']') { out += '\\]'; i++; }
        else if (pattern[i + 1] === '^' && pattern[i + 2] === ']') { out += '^\\]'; i += 2; }
        continue;
      }

      /* ---- Gruppen in Python-Schreibweise ---- */
      if (c === '(' && pattern[i + 1] === '?') {
        var rest = pattern.slice(i);
        var mm;
        if ((mm = /^\(\?P<([A-Za-z_][A-Za-z0-9_]*)>/.exec(rest))) {
          out += '(?<' + mm[1] + '>';
          i += mm[0].length - 1;
          continue;
        }
        if ((mm = /^\(\?P=([A-Za-z_][A-Za-z0-9_]*)\)/.exec(rest))) {
          out += '\\k<' + mm[1] + '>';
          i += mm[0].length - 1;
          continue;
        }
        if ((mm = /^\(\?#[^)]*\)/.exec(rest))) {   // Kommentar: ersatzlos raus
          i += mm[0].length - 1;
          continue;
        }
        if ((mm = /^\(\?([aiLmsux]+)\)/.exec(rest))) {
          warnings.push('Inline-Flags wie ' + mm[0] + ' gelten in Python nur am Musteranfang.');
          i += mm[0].length - 1;
          continue;
        }
      }

      /* ---- {,m} ist in Python {0,m}, in JS dagegen ein Literal ---- */
      if (c === '{') {
        var qm = /^\{,(\d+)\}/.exec(pattern.slice(i));
        if (qm) { out += '{0,' + qm[1] + '}'; i += qm[0].length - 1; continue; }
      }

      /* ---- $ : Python matcht auch vor einem finalen \n ---- */
      if (c === '$' && !multiline) { out += '(?=\\n?$)'; continue; }

      out += c;
    }

    return { source: out, warnings: warnings };
  }

  /* ---------------------------------------------------------------
     Fehlermeldungen eindeutschen
     --------------------------------------------------------------- */
  var ERR_MAP = [
    [/Unterminated group|missing \)/i, 'Eine Klammer ( wurde nicht geschlossen.'],
    [/Unmatched \'\)\'|Unmatched \)/i, 'Eine schließende Klammer ) hat keinen Partner.'],
    [/character class|Unterminated character class/i, 'Eine Zeichenklasse [ wurde nicht mit ] geschlossen.'],
    [/Nothing to repeat/i, 'Ein Quantifizierer (* + ? {…}) steht ohne etwas davor, das er wiederholen könnte.'],
    [/Invalid group/i, 'Ungültige Gruppen-Syntax.'],
    [/Invalid escape/i, 'Ungültige Escape-Sequenz (\\ vor einem Zeichen, das das nicht erlaubt).'],
    [/Invalid regular expression flags/i, 'Ungültige Flag-Kombination.'],
    [/Invalid quantifier|Incomplete quantifier/i, 'Ungültiger Quantifizierer — geschweifte Klammern brauchen die Form {n}, {n,} oder {n,m}.'],
    [/Invalid named capture|Duplicate capture group/i, 'Problem mit einer benannten Gruppe (Name doppelt oder ungültig).'],
    [/Invalid property name|Invalid Unicode/i, 'Ungültige Unicode-Eigenschaft.'],
    [/Lone quantifier brackets/i, 'Einzelne geschweifte Klammer — meintest du \\{ ?'],
    [/backreference/i, 'Ungültiger Rückverweis (\\1, \\2 …) — so viele Gruppen gibt es nicht.']
  ];

  function germanError(msg) {
    for (var i = 0; i < ERR_MAP.length; i++) {
      if (ERR_MAP[i][0].test(msg)) return ERR_MAP[i][1];
    }
    return 'Das Muster ist syntaktisch nicht gültig.';
  }

  /* ---------------------------------------------------------------
     compile(pattern, flags) -> { ok, regex, warnings, error, ascii }
     flags: String aus "imsxa" (wie re.I | re.M | re.S | re.X | re.A)
     --------------------------------------------------------------- */
  function compile(pattern, flags) {
    flags = flags || '';
    if (typeof pattern !== 'string' || pattern === '') {
      return { ok: false, error: 'Kein Muster eingegeben.', empty: true, warnings: [] };
    }

    var inline = extractInlineFlags(pattern);
    pattern = inline.pattern;
    flags += inline.flags;

    if (flags.indexOf('x') !== -1) pattern = stripVerbose(pattern);

    var jsFlags = 'g';
    if (flags.indexOf('i') !== -1) jsFlags += 'i';
    if (flags.indexOf('m') !== -1) jsFlags += 'm';
    if (flags.indexOf('s') !== -1) jsFlags += 's';

    var multiline = flags.indexOf('m') !== -1;
    var wantAscii = flags.indexOf('a') !== -1;

    var attempts = wantAscii ? [false] : [true, false];
    var lastErr = null;

    for (var a = 0; a < attempts.length; a++) {
      var uni = attempts[a];
      var tr = translate(pattern, { unicode: uni, multiline: multiline });
      try {
        var re = new RegExp(tr.source, jsFlags + (uni ? 'u' : ''));
        var warn = tr.warnings.slice();
        if (!uni && !wantAscii) {
          warn.push('Unicode-Modus nicht möglich — \\w, \\d und \\b verhalten sich hier ASCII-basiert (wie mit re.A).');
        }
        var info = groupInfo(re);
        return {
          ok: true, regex: re, warnings: warn, ascii: !uni,
          source: tr.source, flags: flags,
          groupCount: info.count, groupNames: info.names
        };
      } catch (e) {
        lastErr = e;
      }
    }
    return {
      ok: false,
      error: germanError(lastErr ? String(lastErr.message) : ''),
      raw: lastErr ? String(lastErr.message) : '',
      warnings: []
    };
  }

  /* Anzahl + Namen der Capture-Gruppen ermitteln */
  function groupInfo(re) {
    try {
      var probe = new RegExp(re.source + '|', re.flags.replace('g', ''));
      var m = probe.exec('');
      return { count: m.length - 1, names: m.groups ? Object.keys(m.groups) : [] };
    } catch (e) {
      return { count: 0, names: [] };
    }
  }

  /* ---------------------------------------------------------------
     Alle Treffer einsammeln (entspricht re.finditer)
     --------------------------------------------------------------- */
  function findMatches(re, text, limit) {
    limit = limit || 20000;
    var r = new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags);
    r.lastIndex = 0;
    var out = [], m, guard = 0;
    while ((m = r.exec(text)) !== null) {
      var groups = [];
      for (var i = 1; i < m.length; i++) groups.push(m[i]);
      out.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: groups,
        named: m.groups ? Object.assign({}, m.groups) : null
      });
      if (m[0] === '') r.lastIndex++;
      if (++guard >= limit) break;
    }
    return out;
  }

  /* ---------------------------------------------------------------
     findall: DIE Gruppenregel
       0 Gruppen  -> Liste der ganzen Treffer
       1 Gruppe   -> Liste der Gruppeninhalte
       n Gruppen  -> Liste von Tupeln
     Nicht beteiligte Gruppen liefern in Python '' (nicht None).
     --------------------------------------------------------------- */
  function findall(compiled, text) {
    var ms = findMatches(compiled.regex, text);
    var n = compiled.groupCount;
    if (n === 0) return ms.map(function (m) { return m.text; });
    if (n === 1) return ms.map(function (m) { return m.groups[0] === undefined ? '' : m.groups[0]; });
    return ms.map(function (m) {
      return m.groups.map(function (g) { return g === undefined ? '' : g; });
    });
  }

  /* re.search / re.match / re.fullmatch */
  function search(compiled, text) {
    var ms = findMatches(compiled.regex, text);
    return ms.length ? ms[0] : null;
  }
  function matchAt(compiled, text) {
    var ms = findMatches(compiled.regex, text);
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].start === 0) return ms[i];
      if (ms[i].start > 0) break;
    }
    return null;
  }
  function fullmatch(compiled, text) {
    var ms = findMatches(compiled.regex, text);
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].start === 0 && ms[i].end === text.length) return ms[i];
    }
    return null;
  }

  /* ---------------------------------------------------------------
     re.sub — Python-Ersetzungssyntax \1 \g<1> \g<name> \\ \n
     --------------------------------------------------------------- */
  function applyReplacement(repl, m) {
    var out = '';
    for (var i = 0; i < repl.length; i++) {
      var c = repl[i];
      if (c !== '\\') { out += c; continue; }
      var n = repl[i + 1];
      if (n === undefined) { out += '\\'; break; }
      if (/[0-9]/.test(n)) {
        var num = n; i++;
        if (/[0-9]/.test(repl[i + 1] || '') && (+(num + repl[i + 1])) <= m.groups.length) {
          num += repl[++i];
        }
        var g = m.groups[+num - 1];
        out += (+num === 0) ? m.text : (g === undefined ? '' : g);
        continue;
      }
      if (n === 'g' && repl[i + 2] === '<') {
        var close = repl.indexOf('>', i + 3);
        if (close !== -1) {
          var ref = repl.slice(i + 3, close);
          i = close;
          if (/^[0-9]+$/.test(ref)) {
            out += (+ref === 0) ? m.text : (m.groups[+ref - 1] === undefined ? '' : m.groups[+ref - 1]);
          } else {
            out += (m.named && m.named[ref] !== undefined && m.named[ref] !== null) ? m.named[ref] : '';
          }
          continue;
        }
      }
      i++;
      if (n === 'n') out += '\n';
      else if (n === 't') out += '\t';
      else if (n === 'r') out += '\r';
      else if (n === '\\') out += '\\';
      else out += '\\' + n;
    }
    return out;
  }

  function sub(compiled, repl, text, count) {
    var ms = findMatches(compiled.regex, text);
    if (count) ms = ms.slice(0, count);
    var out = '', pos = 0;
    for (var i = 0; i < ms.length; i++) {
      out += text.slice(pos, ms[i].start) + applyReplacement(repl, ms[i]);
      pos = ms[i].end;
    }
    return { result: out + text.slice(pos), count: ms.length };
  }

  /* re.split — Gruppeninhalte landen mit in der Liste */
  function split(compiled, text, maxsplit) {
    var ms = findMatches(compiled.regex, text);
    if (maxsplit) ms = ms.slice(0, maxsplit);
    var out = [], pos = 0;
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].text === '' && ms[i].start === pos && i === 0 && pos === 0) { /* Python 3.7+: ok */ }
      out.push(text.slice(pos, ms[i].start));
      for (var g = 0; g < ms[i].groups.length; g++) {
        out.push(ms[i].groups[g] === undefined ? null : ms[i].groups[g]);
      }
      pos = ms[i].end;
    }
    out.push(text.slice(pos));
    return out;
  }

  /* ---------------------------------------------------------------
     Python-repr für die Ergebnisanzeige
     --------------------------------------------------------------- */
  function pyStr(s) {
    var q = s.indexOf("'") !== -1 && s.indexOf('"') === -1 ? '"' : "'";
    var body = s
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');
    if (q === "'") body = body.replace(/'/g, "\\'");
    return q + body + q;
  }

  function pyRepr(v) {
    if (v === null || v === undefined) return 'None';
    if (typeof v === 'string') return pyStr(v);
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) {
      if (v.__tuple) return '(' + v.map(pyRepr).join(', ') + ')';
      return '[' + v.map(pyRepr).join(', ') + ']';
    }
    return String(v);
  }

  /* findall-Ergebnis hübsch als Python-Liste (Tupel als Tupel) */
  function pyReprFindall(list) {
    return '[' + list.map(function (item) {
      if (Array.isArray(item)) return '(' + item.map(pyRepr).join(', ') + ')';
      return pyRepr(item);
    }).join(', ') + ']';
  }

  /* ---------------------------------------------------------------
     Vergleich zweier findall-Ergebnisse (für die Aufgaben-Prüfung)
     --------------------------------------------------------------- */
  function sameResult(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      var x = a[i], y = b[i];
      if (Array.isArray(x) || Array.isArray(y)) {
        if (!Array.isArray(x) || !Array.isArray(y)) return false;
        if (x.length !== y.length) return false;
        for (var j = 0; j < x.length; j++) if (x[j] !== y[j]) return false;
      } else if (x !== y) return false;
    }
    return true;
  }

  /* ---------------------------------------------------------------
     Bequem-Wrapper: Muster + Text + Funktion -> Anzeige-Ergebnis
     --------------------------------------------------------------- */
  function run(pattern, flags, text, fn, extra) {
    var c = compile(pattern, flags);
    if (!c.ok) return { ok: false, error: c.error, empty: c.empty };
    extra = extra || {};
    var res = { ok: true, compiled: c, warnings: c.warnings, matches: findMatches(c.regex, text) };

    switch (fn) {
      case 'findall':
        res.value = findall(c, text);
        res.display = pyReprFindall(res.value);
        break;
      case 'finditer':
        res.value = res.matches;
        res.display = '[' + res.matches.map(function (m) {
          return '<re.Match span=(' + m.start + ', ' + m.end + '), match=' + pyStr(m.text) + '>';
        }).join(',\n ') + ']';
        break;
      case 'search': {
        var s = search(c, text);
        res.value = s;
        res.display = s ? '<re.Match span=(' + s.start + ', ' + s.end + '), match=' + pyStr(s.text) + '>' : 'None';
        res.matches = s ? [s] : [];
        break;
      }
      case 'match': {
        var mt = matchAt(c, text);
        res.value = mt;
        res.display = mt ? '<re.Match span=(' + mt.start + ', ' + mt.end + '), match=' + pyStr(mt.text) + '>' : 'None';
        res.matches = mt ? [mt] : [];
        break;
      }
      case 'fullmatch': {
        var fm = fullmatch(c, text);
        res.value = fm;
        res.display = fm ? '<re.Match span=(' + fm.start + ', ' + fm.end + '), match=' + pyStr(fm.text) + '>' : 'None';
        res.matches = fm ? [fm] : [];
        break;
      }
      case 'sub': {
        var r = sub(c, extra.repl || '', text);
        res.value = r.result;
        res.display = pyStr(r.result);
        res.plain = r.result;
        break;
      }
      case 'split':
        res.value = split(c, text);
        res.display = '[' + res.value.map(pyRepr).join(', ') + ']';
        break;
      default:
        res.value = findall(c, text);
        res.display = pyReprFindall(res.value);
    }
    return res;
  }

  RT.engine = {
    compile: compile,
    findMatches: findMatches,
    findall: findall,
    search: search,
    matchAt: matchAt,
    fullmatch: fullmatch,
    sub: sub,
    split: split,
    run: run,
    pyRepr: pyRepr,
    pyStr: pyStr,
    pyReprFindall: pyReprFindall,
    sameResult: sameResult
  };
})(window);
