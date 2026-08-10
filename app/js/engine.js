/* =============================================================
   engine.js — Python-3.14-Kompatibilitätsschicht für die unterstützte Regex-Teilmenge
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
  var PYTHON_VERSION = '3.14';
  var MAX_MATCHES = 20000;
  var WORD_U = '\\p{L}\\p{N}_';          // str.isalnum() + "_"
  var WORD_A = 'A-Za-z0-9_';            // ASCII   (= Python mit re.A, = JS)
  var SPACE_U = '\\p{White_Space}\\u001C-\\u001F'; // str.isspace()
  var SPACE_A = '\\t\\n\\v\\f\\r ';

  /* ---------------------------------------------------------------
     re.X / re.VERBOSE: Whitespace und Kommentare entfernen
     --------------------------------------------------------------- */
  function isEscapedAtEnd(text) {
    var slashes = 0;
    for (var i = text.length - 2; i >= 0 && text[i] === '\\'; i--) slashes++;
    return slashes % 2 === 1;
  }

  function forbiddenVerboseJoin(out, next) {
    if (!out) return false;
    var last = out[out.length - 1];
    if (last === '(' && next === '?' && !isEscapedAtEnd(out)) return true;
    if (out.slice(-2) === '(?') return true;
    if (out.slice(-3) === '(?<' && (next === '=' || next === '!')) return true;
    if (out.slice(-3) === '(?P' && (next === '<' || next === '=')) return true;
    var namedStart = Math.max(out.lastIndexOf('(?P<'), out.lastIndexOf('(?P='));
    var namedEnd = Math.max(out.lastIndexOf('>'), out.lastIndexOf(')'));
    if (namedStart > namedEnd) return true;
    if (/\(\?[aiLmsux-]*$/.test(out) && /[aiLmsux:\-)]/.test(next)) return true;
    if (/\\(?:x[0-9A-Fa-f]{0,1}|u[0-9A-Fa-f]{0,3}|U[0-9A-Fa-f]{0,7})$/.test(out) &&
        /[0-9A-Fa-f]/.test(next)) return true;
    var repeated = (last === '*' || last === '+' || last === '?') && !isEscapedAtEnd(out);
    if (last === '}' && /\{(?:\d+|\d+,\d*|,\d+)\}$/.test(out)) repeated = true;
    return repeated && (next === '?' || next === '+');
  }

  function needsNumericEscapeBoundary(out, next) {
    return /\\(?:0[0-7]{0,1}|[1-9][0-9]?)$/.test(out) && /[0-9]/.test(next);
  }

  function verboseSyntaxError() {
    var e = new Error('whitespace is not allowed inside a regex token in verbose mode');
    e.pythonRegexSyntax = true;
    throw e;
  }

  function stripVerbose(p) {
    var out = '', inClass = false, classFirst = false, separated = false;
    for (var i = 0; i < p.length; i++) {
      var c = p[i];

      if (inClass) {
        if (c === '\\') {
          if (i + 1 >= p.length) { out += c; continue; }
          var escaped = String.fromCodePoint(p.codePointAt(i + 1));
          out += c + escaped;
          i += escaped.length;
          classFirst = false;
          continue;
        }
        out += c;
        if (c === '^' && classFirst) continue;
        if (c === ']' && !classFirst) inClass = false;
        else classFirst = false;
        continue;
      }

      /* Enthält eine geschweifte Klammer Whitespace oder einen
         #-Kommentar, ist sie in Python kein Quantifizierer. Der ignorierte
         Text verschwindet trotzdem; die Klammern bleiben dann Literale. */
      if (c === '{') {
        var braceOut = '', braceIgnored = false, braceEnd = -1;
        for (var bi = i + 1; bi < p.length; bi++) {
          var bc = p[bi];
          if (bc === '\\' && bi + 1 < p.length) {
            var braceEscaped = String.fromCodePoint(p.codePointAt(bi + 1));
            braceOut += bc + braceEscaped;
            bi += braceEscaped.length;
            continue;
          }
          if (/[ \t\n\r\f\v]/.test(bc)) { braceIgnored = true; continue; }
          if (bc === '#') {
            braceIgnored = true;
            while (bi < p.length && p[bi] !== '\n') bi++;
            continue;
          }
          if (bc === '}') { braceEnd = bi; break; }
          braceOut += bc;
        }
        if (braceEnd !== -1 && braceIgnored) {
          if (separated && forbiddenVerboseJoin(out, '\\')) verboseSyntaxError();
          out += '\\{' + braceOut + '\\}';
          i = braceEnd;
          separated = false;
          continue;
        }
      }

      if (p.slice(i, i + 3) === '(?#') {
        var commentEnd = p.indexOf(')', i + 3);
        if (commentEnd === -1) { out += p.slice(i); break; }
        if (separated && forbiddenVerboseJoin(out, '(')) verboseSyntaxError();
        out += p.slice(i, commentEnd + 1);
        i = commentEnd;
        separated = false;
        continue;
      }
      if (c === '\\') {
        if (i + 1 >= p.length) { out += c; continue; }
        var escapedOutside = String.fromCodePoint(p.codePointAt(i + 1));
        if (separated && needsNumericEscapeBoundary(out, '\\')) out += '(?:)';
        else if (separated && forbiddenVerboseJoin(out, '\\')) verboseSyntaxError();
        out += c + escapedOutside;
        i += escapedOutside.length;
        separated = false;
        continue;
      }
      if (c === '[') {
        if (separated && forbiddenVerboseJoin(out, c)) verboseSyntaxError();
        inClass = true;
        classFirst = true;
        out += c;
        separated = false;
        continue;
      }
      /* Python ignoriert hier nur ASCII-Whitespace, nicht jedes Unicode-\s. */
      if (/[ \t\n\r\f\v]/.test(c)) { separated = true; continue; }
      if (c === '#') {
        while (i < p.length && p[i] !== '\n') i++;
        separated = true;
        continue;
      }
      if (separated && needsNumericEscapeBoundary(out, c)) out += '(?:)';
      else if (separated && forbiddenVerboseJoin(out, c)) verboseSyntaxError();
      out += c;
      separated = false;
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

  function stripLeadingRegexComments(p) {
    while (p.slice(0, 3) === '(?#') {
      var end = p.indexOf(')', 3);
      if (end === -1) break;
      p = p.slice(end + 1);
    }
    return p;
  }

  /* ---------------------------------------------------------------
     Python-Syntax vor der JS-Übersetzung prüfen. JS akzeptiert einige
     Dinge stillschweigend (z. B. ungültige Rückverweise) und erlaubt
     variable Lookbehinds; beides wäre für einen Python-Trainer fatal.
     Der kleine Parser berechnet zugleich die feste Breite von Gruppen.
     --------------------------------------------------------------- */
  function captureSet(values) {
    var out = Object.create(null);
    (values || []).forEach(function (value) { out[value] = true; });
    return out;
  }

  function mergeCaptureSets(a, b) {
    var out = Object.create(null), key;
    for (key in (a || {})) if (Object.prototype.hasOwnProperty.call(a, key)) out[key] = true;
    for (key in (b || {})) if (Object.prototype.hasOwnProperty.call(b, key)) out[key] = true;
    return out;
  }

  function intersectCaptureSets(a, b) {
    var out = Object.create(null), key;
    for (key in (a || {})) {
      if (Object.prototype.hasOwnProperty.call(a, key) && b && b[key]) out[key] = true;
    }
    return out;
  }

  function width(min, max, always, captures, rootCapture) {
    return {
      min: min, max: max,
      always: always || Object.create(null),
      captures: captures || Object.create(null),
      rootCapture: rootCapture || null
    };
  }

  function addWidth(a, b) {
    return width(
      a.min + b.min,
      a.max === Infinity || b.max === Infinity ? Infinity : a.max + b.max,
      mergeCaptureSets(a.always, b.always),
      mergeCaptureSets(a.captures, b.captures)
    );
  }

  function PatternParser(pattern) {
    this.pattern = pattern;
    this.pos = 0;
    this.groupCount = 0;
    this.groupWidths = [width(0, 0)];
    this.groupNamesByIndex = [];
    this.groupIndexByName = Object.create(null);
    this.hasBackreference = false;
  }

  var PY_GROUP_NAME_RE = /^[_\p{ID_Start}][_\p{ID_Continue}]*$/u;
  function isPythonGroupName(name) {
    return PY_GROUP_NAME_RE.test(name);
  }

  PatternParser.prototype.fail = function (message) {
    var e = new Error(message);
    e.pythonRegexSyntax = true;
    throw e;
  };

  PatternParser.prototype.capture = function (name) {
    if (name && Object.prototype.hasOwnProperty.call(this.groupIndexByName, name)) {
      this.fail('redefinition of group name ' + name);
    }
    var n = ++this.groupCount;
    this.groupNamesByIndex[n - 1] = name || null;
    if (name) this.groupIndexByName[name] = n;
    return n;
  };

  PatternParser.prototype.parse = function (insideGroup, inheritedAlways) {
    var alternatives = [];
    var current = width(0, 0);
    inheritedAlways = inheritedAlways || Object.create(null);
    while (this.pos < this.pattern.length) {
      var c = this.pattern[this.pos];
      if (insideGroup && c === ')') break;
      if (!insideGroup && c === ')') this.fail('unbalanced parenthesis');
      if (c === '|') {
        alternatives.push(current);
        current = width(0, 0);
        this.pos++;
        continue;
      }
      var atom = this.parseAtom(mergeCaptureSets(inheritedAlways, current.always));
      if (atom.comment) continue;
      current = addWidth(current, this.parseQuantifier(atom));
    }
    alternatives.push(current);
    var min = alternatives[0].min, max = alternatives[0].max;
    var always = alternatives[0].always;
    var captures = alternatives[0].captures;
    for (var i = 1; i < alternatives.length; i++) {
      min = Math.min(min, alternatives[i].min);
      max = Math.max(max, alternatives[i].max);
      always = intersectCaptureSets(always, alternatives[i].always);
      captures = mergeCaptureSets(captures, alternatives[i].captures);
    }
    return width(min, max, always, captures);
  };

  PatternParser.prototype.parseEscape = function (inClass, availableCaptures) {
    this.pos++; // Backslash
    if (this.pos >= this.pattern.length) this.fail('bad escape (end of pattern)');
    var escapedCodePoint = this.pattern.codePointAt(this.pos);
    var n = String.fromCodePoint(escapedCodePoint);
    this.pos += n.length;
    var rest, digits, value, group;

    if (/[0-9]/.test(n)) {
      rest = this.pattern.slice(this.pos);
      if (inClass || n === '0') {
        if (n === '8' || n === '9') this.fail('bad escape \\' + n);
        digits = n;
        while (digits.length < 3 && /^[0-7]/.test(rest)) {
          digits += rest[0]; rest = rest.slice(1); this.pos++;
        }
        value = parseInt(digits, 8);
        if (value > 255) this.fail('octal escape value outside of range 0-0o377');
        return width(1, 1);
      }
      if (/^[0-7]{2}/.test(rest) && /[0-7]/.test(n)) {
        digits = n + rest.slice(0, 2);
        this.pos += 2;
        if (parseInt(digits, 8) > 255) this.fail('octal escape value outside of range 0-0o377');
        return width(1, 1);
      }
      digits = n;
      if (/^[0-9]/.test(rest)) { digits += rest[0]; this.pos++; }
      group = +digits;
      if (!group || group > this.groupCount || !this.groupWidths[group]) {
        this.fail('invalid group reference ' + group);
      }
      if (!inClass && (!availableCaptures || !availableCaptures[group])) {
        this.fail('backreferences to groups that may be unmatched are not supported in the browser');
      }
      this.hasBackreference = true;
      return this.groupWidths[group];
    }

    if (n === 'x' || n === 'u' || n === 'U') {
      var count = n === 'x' ? 2 : (n === 'u' ? 4 : 8);
      var hex = this.pattern.slice(this.pos, this.pos + count);
      if (hex.length !== count || !new RegExp('^[0-9A-Fa-f]{' + count + '}$').test(hex)) {
        this.fail('incomplete escape \\' + n);
      }
      if (n === 'U' && parseInt(hex, 16) > 0x10FFFF) this.fail('bad escape \\U');
      this.pos += count;
      return width(1, 1);
    }
    if (n === 'N') {
      var named = /^\{[^}]+\}/.exec(this.pattern.slice(this.pos));
      if (!named) this.fail('missing { in \\N escape');
      /* Unicode-Namen lassen sich im Browser ohne große Namensdatenbank
         nicht zuverlässig auflösen: lieber klar ablehnen als falsch matchen. */
      this.fail('\\N{name} wird im Browser nicht unterstützt');
    }
    if (inClass && (n === 'A' || n === 'B' || n === 'Z' || n === 'z')) this.fail('bad escape \\' + n);
    if (!inClass && (n === 'A' || n === 'Z' || n === 'z' || n === 'b' || n === 'B')) {
      var anchorWidth = width(0, 0);
      anchorWidth.pythonNoRepeat = true;
      return anchorWidth;
    }
    if ('abfnrtvdswDSW'.indexOf(n) !== -1) return width(1, 1);
    if (/[A-Za-z]/.test(n)) this.fail('bad escape \\' + n);
    return width(1, 1);
  };

  PatternParser.prototype.parseClass = function () {
    this.pos++; // [
    if (this.pattern[this.pos] === '^') this.pos++;
    var previousType = null, rangeLeft = null;
    if (this.pattern[this.pos] === ']') { this.pos++; previousType = 'char'; } // ] direkt am Anfang ist literal
    while (this.pos < this.pattern.length && this.pattern[this.pos] !== ']') {
      var tokenType;
      if (this.pattern[this.pos] === '-' && previousType && this.pattern[this.pos + 1] !== ']') {
        rangeLeft = previousType;
        previousType = null;
        this.pos++;
        continue;
      }
      if (this.pattern[this.pos] === '\\') {
        var escaped = String.fromCodePoint(this.pattern.codePointAt(this.pos + 1));
        tokenType = 'dDsSwW'.indexOf(escaped) !== -1 ? 'category' : 'char';
        this.parseEscape(true);
      } else {
        var cp = this.pattern.codePointAt(this.pos);
        this.pos += cp > 0xFFFF ? 2 : 1;
        tokenType = 'char';
      }
      if (rangeLeft) {
        if (rangeLeft === 'category' || tokenType === 'category') this.fail('bad character range');
        rangeLeft = null;
      }
      previousType = tokenType;
    }
    if (this.pattern[this.pos] !== ']') this.fail('unterminated character set');
    this.pos++;
    return width(1, 1);
  };

  PatternParser.prototype.parseGroupBody = function (inheritedAlways) {
    var w = this.parse(true, inheritedAlways);
    if (this.pattern[this.pos] !== ')') this.fail('missing ), unterminated subpattern');
    this.pos++;
    return w;
  };

  PatternParser.prototype.parseAtom = function (availableCaptures) {
    var c = this.pattern[this.pos];
    if (c === '\\') return this.parseEscape(false, availableCaptures);
    if (c === '[') return this.parseClass();
    if (c === '^' || c === '$') {
      this.pos++;
      var lineAnchorWidth = width(0, 0);
      lineAnchorWidth.pythonNoRepeat = true;
      return lineAnchorWidth;
    }
    if (c === '*' || c === '+' || c === '?') this.fail('nothing to repeat');

    if (c === '(') {
      var rest = this.pattern.slice(this.pos);
      var m, number, name, w;
      if ((m = /^\(\?#[^)]*\)/.exec(rest))) {
        this.pos += m[0].length;
        var commentWidth = width(0, 0);
        commentWidth.comment = true;
        return commentWidth;
      }
      if (rest.slice(0, 4) === '(?P<') {
        var nameEnd = rest.indexOf('>', 4);
        if (nameEnd === -1) this.fail('missing > in group name');
        name = rest.slice(4, nameEnd);
        if (!isPythonGroupName(name)) this.fail('bad character in group name');
        number = this.capture(name); this.pos += nameEnd + 1;
        w = this.parseGroupBody(availableCaptures);
        this.groupWidths[number] = w;
        w.always = mergeCaptureSets(w.always, captureSet([number]));
        w.captures = mergeCaptureSets(w.captures, captureSet([number]));
        w.rootCapture = number;
        return w;
      }
      if (rest.slice(0, 4) === '(?P=') {
        var refEnd = rest.indexOf(')', 4);
        if (refEnd === -1) this.fail('missing ), unterminated group reference');
        name = rest.slice(4, refEnd);
        if (!isPythonGroupName(name)) this.fail('bad character in group name');
        if (!Object.prototype.hasOwnProperty.call(this.groupIndexByName, name)) this.fail('unknown group name ' + name);
        if (!availableCaptures || !availableCaptures[this.groupIndexByName[name]]) {
          this.fail('backreferences to groups that may be unmatched are not supported in the browser');
        }
        this.hasBackreference = true;
        this.pos += refEnd + 1;
        return this.groupWidths[this.groupIndexByName[name]];
      }
      if (/^\(\?<[^=!]/.test(rest)) this.fail('unknown extension ?<'); // JS-Namensgruppe ist nicht Python
      if (/^\(\?>/.test(rest)) this.fail('atomic groups are not supported in the browser');
      if (/^\(\?\(/.test(rest)) this.fail('conditional groups are not supported in the browser');
      if ((m = /^\(\?(?:[aiLmsux]+(?:-[imsx]+)?|[aiLmsux]*-[imsx]+):/.exec(rest))) {
        this.fail('scoped inline flags are not supported in the browser');
      }
      if (/^\(\?[aiLmsux]+\)/.test(rest)) this.fail('global flags not at the start of the expression');

      var kind = 'capture';
      if (rest.slice(0, 3) === '(?:') { kind = 'noncapture'; this.pos += 3; }
      else if (rest.slice(0, 3) === '(?=') { kind = 'positiveLook'; this.pos += 3; }
      else if (rest.slice(0, 3) === '(?!') { kind = 'negativeLook'; this.pos += 3; }
      else if (rest.slice(0, 4) === '(?<=') { kind = 'positiveLookbehind'; this.pos += 4; }
      else if (rest.slice(0, 4) === '(?<!') { kind = 'negativeLookbehind'; this.pos += 4; }
      else if (rest.slice(0, 2) === '(?') this.fail('unknown extension');
      else { number = this.capture(null); this.pos++; }

      w = this.parseGroupBody(availableCaptures);
      if (kind === 'capture') {
        this.groupWidths[number] = w;
        w.always = mergeCaptureSets(w.always, captureSet([number]));
        w.captures = mergeCaptureSets(w.captures, captureSet([number]));
        w.rootCapture = number;
      }
      if (kind.indexOf('Lookbehind') !== -1 && (w.min !== w.max || w.max === Infinity)) {
        this.fail('look-behind requires fixed-width pattern');
      }
      if (kind === 'positiveLook' || kind === 'positiveLookbehind') {
        var positiveWidth = width(0, 0, w.always, w.captures);
        positiveWidth.browserNoRepeat = true;
        return positiveWidth;
      }
      if (kind === 'negativeLook' || kind === 'negativeLookbehind') {
        var negativeWidth = width(0, 0, Object.create(null), w.captures);
        negativeWidth.browserNoRepeat = true;
        return negativeWidth;
      }
      return w;
    }

    var cp = this.pattern.codePointAt(this.pos);
    this.pos += cp > 0xFFFF ? 2 : 1;
    return width(1, 1);
  };

  PatternParser.prototype.parseQuantifier = function (atom) {
    var rest = this.pattern.slice(this.pos), m, min, max;
    if (rest[0] === '*') { min = 0; max = Infinity; this.pos++; }
    else if (rest[0] === '+') { min = 1; max = Infinity; this.pos++; }
    else if (rest[0] === '?') { min = 0; max = 1; this.pos++; }
    else if ((m = /^\{(\d+)\}/.exec(rest))) { min = max = +m[1]; this.pos += m[0].length; }
    else if ((m = /^\{(\d+),(\d*)\}/.exec(rest))) {
      min = +m[1]; max = m[2] === '' ? Infinity : +m[2]; this.pos += m[0].length;
    } else if ((m = /^\{,(\d+)\}/.exec(rest))) { min = 0; max = +m[1]; this.pos += m[0].length; }
    else return atom;
    if (atom.pythonNoRepeat) this.fail('nothing to repeat');
    if (atom.browserNoRepeat) this.fail('quantified lookarounds are not supported in the browser');
    if (max < min) this.fail('min repeat greater than max repeat');
    if (min > 4294967294 || (max !== Infinity && max > 4294967294)) {
      this.fail('the repetition number is too large');
    }
    if (this.pattern[this.pos] === '?') this.pos++; // lazy
    else if (this.pattern[this.pos] === '+') this.fail('possessive quantifiers are not supported in the browser');
    if (max > 1) {
      var nested = Object.keys(atom.captures).filter(function (id) { return +id !== atom.rootCapture; });
      if (nested.length) this.fail('captures nested in repeated groups are not supported in the browser');
      if (atom.rootCapture && atom.min === 0) {
        this.fail('captures that can be empty in repeated groups are not supported in the browser');
      }
    }
    return width(
      atom.min * min,
      atom.max === Infinity || max === Infinity ? Infinity : atom.max * max,
      min === 0 ? Object.create(null) : atom.always,
      atom.captures
    );
  };

  function analyzePattern(pattern) {
    var parser = new PatternParser(pattern);
    var totalWidth = parser.parse(false);
    return {
      count: parser.groupCount,
      names: parser.groupNamesByIndex.filter(function (n) { return n !== null; }),
      groupNamesByIndex: parser.groupNamesByIndex,
      groupIndexByName: parser.groupIndexByName,
      hasBackreference: parser.hasBackreference,
      canMatchNonEmpty: totalWidth.max > 0
    };
  }

  function isSimpleGreedyOptional(pattern) {
    var i = 0;
    if (!pattern) return false;
    if (pattern[i] === '\\') {
      i++;
      if (i >= pattern.length) return false;
      var escaped = pattern[i++];
      if (escaped === 'x') i += 2;
      else if (escaped === 'u') i += 4;
      else if (escaped === 'U') i += 8;
      else if (/[1-9]/.test(escaped) && /[0-9]/.test(pattern[i] || '')) i++;
    } else if (pattern[i] === '[') {
      i++;
      if (pattern[i] === '^') i++;
      if (pattern[i] === ']') i++;
      while (i < pattern.length && pattern[i] !== ']') {
        if (pattern[i] === '\\' && i + 1 < pattern.length) i += 2;
        else i += String.fromCodePoint(pattern.codePointAt(i)).length;
      }
      if (pattern[i] !== ']') return false;
      i++;
    } else {
      var atom = String.fromCodePoint(pattern.codePointAt(i));
      if ('()|^$*+?{}'.indexOf(atom) !== -1) return false;
      i += atom.length;
    }

    var quantifier = pattern.slice(i);
    if (quantifier === '*' || quantifier === '?') return true;
    return /^\{(?:0,\d*|,\d+)\}$/.test(quantifier);
  }

  function hexEscape(value) {
    return '\\u' + ('0000' + value.toString(16)).slice(-4);
  }

  function escapedLiteral(n, inClass) {
    var syntax = '^$\\.*+?()[]{}|/';
    if (inClass && (n === '-' || n === ']')) return '\\' + n;
    return syntax.indexOf(n) !== -1 ? '\\' + n : n;
  }

  var PYTHON_I_FAMILY = '[iI\\u0130\\u0131]';

  function caseFoldLiteralSource(ch, opts, fallback) {
    if (!opts.ignorecase) return fallback;
    if (opts.unicode && (ch === 'i' || ch === 'I' || ch === '\u0130' || ch === '\u0131')) {
      return PYTHON_I_FAMILY;
    }
    if (!opts.unicode && /^[A-Za-z]$/.test(ch)) {
      var lower = ch.toLowerCase(), upper = ch.toUpperCase();
      return '[' + lower + upper + ']';
    }
    return fallback;
  }

  function sourceMatchesChar(source, ch, flags) {
    try {
      return new RegExp('^(?:' + source + ')$(?![\\s\\S])', flags).test(ch);
    } catch (e) {
      return false;
    }
  }

  function patchCaseInsensitiveClass(union, source, negated, opts) {
    if (!opts.ignorecase) return source;

    if (opts.unicode) {
      var iFamily = ['i', 'I', '\u0130', '\u0131'];
      var includesI = iFamily.some(function (ch) { return sourceMatchesChar(union, ch, 'iu'); });
      if (!includesI) return source;
      return negated
        ? '(?:(?!' + PYTHON_I_FAMILY + ')' + source + ')'
        : '(?:' + source + '|' + PYTHON_I_FAMILY + ')';
    }

    /* re.A|re.I darf ausschließlich ASCII-Buchstaben falten. Wir lassen
       das JS-i-Flag deshalb weg und ergänzen nur tatsächlich fehlende
       Gegenbuchstaben der positiven Zeichenmenge. */
    var missing = [];
    for (var cp = 65; cp <= 122; cp++) {
      if (cp > 90 && cp < 97) continue;
      var ch = String.fromCharCode(cp);
      var other = cp <= 90 ? ch.toLowerCase() : ch.toUpperCase();
      var desired = sourceMatchesChar(union, ch, 'u') || sourceMatchesChar(union, other, 'u');
      if (desired && !sourceMatchesChar(union, ch, 'u')) missing.push(hexEscape(cp));
    }
    if (!missing.length) return source;
    var missingClass = '[' + missing.join('') + ']';
    return negated
      ? '(?:(?!' + missingClass + ')' + source + ')'
      : '(?:' + source + '|' + missingClass + ')';
  }

  function translateNumericEscape(pattern, slashIndex, inClass) {
    var i = slashIndex + 1;
    var first = pattern[i], digits = first;
    if (inClass || first === '0') {
      while (digits.length < 3 && /[0-7]/.test(pattern[i + 1] || '')) digits += pattern[++i];
      return { source: hexEscape(parseInt(digits, 8)), end: i };
    }
    if (/[0-7]/.test(first) && /^[0-7]{2}/.test(pattern.slice(i + 1))) {
      digits += pattern[++i] + pattern[++i];
      return { source: hexEscape(parseInt(digits, 8)), end: i };
    }
    if (/[0-9]/.test(pattern[i + 1] || '')) digits += pattern[++i];
    return { source: '\\' + digits, end: i };
  }

  function translateClass(pattern, start, opts) {
    var unicode = opts.unicode;
    var W = unicode ? WORD_U : WORD_A;
    var S = unicode ? SPACE_U : SPACE_A;
    var wc = '[' + W + ']', nwc = '[^' + W + ']';
    var dc = unicode ? '[\\p{Nd}]' : '[0-9]';
    var ndc = unicode ? '[^\\p{Nd}]' : '[^0-9]';
    var sc = '[' + S + ']', nsc = '[^' + S + ']';
    var base = '', extras = [], i = start + 1, negated = false;
    if (pattern[i] === '^') { negated = true; i++; }
    if (pattern[i] === ']') { base += '\\]'; i++; }

    for (; i < pattern.length && pattern[i] !== ']'; i++) {
      var c = pattern[i];
      if (c !== '\\') { base += c; continue; }
      var escapedClassCodePoint = pattern.codePointAt(i + 1);
      var n = String.fromCodePoint(escapedClassCodePoint);
      if (/[0-9]/.test(n)) {
        var oct = translateNumericEscape(pattern, i, true);
        base += oct.source; i = oct.end; continue;
      }
      i += n.length;
      if (n === 'w') base += W;
      else if (n === 'd') base += unicode ? '\\p{Nd}' : '0-9';
      else if (n === 's') base += S;
      else if (n === 'W') extras.push(nwc);
      else if (n === 'D') extras.push(ndc);
      else if (n === 'S') extras.push(nsc);
      else if (n === 'b') base += '\\x08';
      else if (n === 'a') base += '\\x07';
      else if (n === 'f') base += '\\f';
      else if (n === 'n') base += '\\n';
      else if (n === 'r') base += '\\r';
      else if (n === 't') base += '\\t';
      else if (n === 'v') base += '\\v';
      else if (n === 'x') { base += pattern.slice(i - 1, i + 3); i += 2; }
      else if (n === 'u') { base += pattern.slice(i - 1, i + 5); i += 4; }
      else if (n === 'U') {
        var cp = parseInt(pattern.slice(i + 1, i + 9), 16);
        base += cp <= 0xFFFF ? hexEscape(cp) : '\\u{' + cp.toString(16) + '}'; i += 8;
      } else base += escapedLiteral(n, true);
    }

    var pieces = [];
    if (base) pieces.push('[' + base + ']');
    pieces = pieces.concat(extras);
    var union = pieces.length === 1 ? pieces[0] : '(?:' + pieces.join('|') + ')';
    var source;
    if (!extras.length) source = '[' + (negated ? '^' : '') + base + ']';
    else if (negated) source = '(?:(?!' + union + ')[\\s\\S])';
    else source = union;
    source = patchCaseInsensitiveClass(union, source, negated, opts);
    return { source: source, end: i };
  }

  /* ---------------------------------------------------------------
     Kern: Python-Muster -> JS-Muster. Das JS-u-Flag bleibt immer an;
     opts.unicode steuert nur Python-Unicodeklassen gegenüber re.A.
     --------------------------------------------------------------- */
  function translate(pattern, opts) {
    var unicode = opts.unicode;
    var multiline = opts.multiline;
    var dotall = opts.dotall;
    var W = unicode ? WORD_U : WORD_A;
    var S = unicode ? SPACE_U : SPACE_A;
    var wc = '[' + W + ']';
    var nwc = '[^' + W + ']';
    var digit = unicode ? '\\p{Nd}' : '[0-9]';
    var nDigit = unicode ? '[^\\p{Nd}]' : '[^0-9]';
    var space = '[' + S + ']';
    var nSpace = '[^' + S + ']';
    var boundary = '(?:(?<!' + wc + ')(?=' + wc + ')|(?<=' + wc + ')(?!' + wc + '))';
    var nBoundary = '(?:(?<=' + wc + ')(?=' + wc + ')|(?<!' + wc + ')(?!' + wc + '))';

    var out = '';
    var warnings = [];

    for (var i = 0; i < pattern.length; i++) {
      var c = pattern[i];

      /* ---- Escape-Sequenzen ---- */
      if (c === '\\') {
        var escapedPatternCodePoint = pattern.codePointAt(i + 1);
        var n = String.fromCodePoint(escapedPatternCodePoint);
        if (/[0-9]/.test(n)) {
          var num = translateNumericEscape(pattern, i, false);
          out += num.source; i = num.end; continue;
        }
        i += n.length;
        switch (n) {
          case 'w': out += wc; break;
          case 'W': out += nwc; break;
          case 'd': out += digit; break;
          case 'D': out += nDigit; break;
          case 's': out += space; break;
          case 'S': out += nSpace; break;
          case 'b': out += boundary; break;
          case 'B': out += nBoundary; break;
          case 'A': out += '^'; break;
          case 'Z': out += '$(?![\\s\\S])'; break;
          case 'z': out += '$(?![\\s\\S])'; break;
          case 'a': out += '\\x07'; break;
          case 'f': out += '\\f'; break;
          case 'n': out += '\\n'; break;
          case 'r': out += '\\r'; break;
          case 't': out += '\\t'; break;
          case 'v': out += '\\v'; break;
          case 'x': {
            var xCodepoint = parseInt(pattern.slice(i + 1, i + 3), 16);
            var xRaw = pattern.slice(i - 1, i + 3);
            out += caseFoldLiteralSource(String.fromCodePoint(xCodepoint), opts, xRaw);
            i += 2; break;
          }
          case 'u': {
            var uCodepoint = parseInt(pattern.slice(i + 1, i + 5), 16);
            var uRaw = pattern.slice(i - 1, i + 5);
            out += caseFoldLiteralSource(String.fromCodePoint(uCodepoint), opts, uRaw);
            i += 4; break;
          }
          case 'U': {
            var codepoint = parseInt(pattern.slice(i + 1, i + 9), 16);
            var codepointSource = codepoint <= 0xFFFF ? hexEscape(codepoint) : '\\u{' + codepoint.toString(16) + '}';
            out += caseFoldLiteralSource(String.fromCodePoint(codepoint), opts, codepointSource);
            i += 8; break;
          }
          default:
            out += caseFoldLiteralSource(n, opts, escapedLiteral(n, false));
        }
        continue;
      }

      /* ---- Zeichenklassen ---- */
      if (c === '[') {
        var cls = translateClass(pattern, i, opts);
        out += cls.source; i = cls.end;
        continue;
      }

      /* ---- Gruppen in Python-Schreibweise ---- */
      if (c === '(' && pattern[i + 1] === '?') {
        var rest = pattern.slice(i);
        var mm;
        if (rest.slice(0, 4) === '(?P<') {
          var groupNameEnd = rest.indexOf('>', 4);
          var groupName = rest.slice(4, groupNameEnd);
          out += '(?<' + groupName + '>';
          i += groupNameEnd;
          continue;
        }
        if (rest.slice(0, 4) === '(?P=') {
          var groupRefEnd = rest.indexOf(')', 4);
          var groupRefName = rest.slice(4, groupRefEnd);
          out += '\\k<' + groupRefName + '>';
          i += groupRefEnd;
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
        qm = /^\{(?:\d+|\d+,\d*)\}/.exec(pattern.slice(i));
        if (qm) { out += qm[0]; i += qm[0].length - 1; continue; }
        /* Anders als JS-u behandelt Python unvollständige {…}-Formen literal. */
        out += '\\{';
        continue;
      }
      if (c === '}') { out += '\\}'; continue; }

      /* Python kennt als Zeilentrenner für Punkt und Anker nur \n. */
      if (c === '.') { out += dotall ? '[\\s\\S]' : '[^\\n]'; continue; }
      if (c === '^') { out += multiline ? '(?:^|(?<=\\n))' : '^'; continue; }
      if (c === '$') {
        out += multiline
          ? '(?:(?=\\n)|$(?![\\s\\S]))'
          : '(?:$(?![\\s\\S])|(?=\\n$(?![\\s\\S])))';
        continue;
      }

      var literalCodePoint = String.fromCodePoint(pattern.codePointAt(i));
      out += caseFoldLiteralSource(literalCodePoint, opts, literalCodePoint);
      i += literalCodePoint.length - 1;
    }

    return { source: out, warnings: warnings };
  }

  /* ---------------------------------------------------------------
     Fehlermeldungen eindeutschen
     --------------------------------------------------------------- */
  var ERR_MAP = [
    [/atomic groups are not supported/i, 'Atomare Gruppen (?>…) sind in Python gültig, werden von der Browser-Engine aber noch nicht unterstützt.'],
    [/possessive quantifiers are not supported/i, 'Possessive Quantifizierer wie *+ sind in Python gültig, werden von der Browser-Engine aber noch nicht unterstützt.'],
    [/scoped inline flags are not supported/i, 'Lokale Inline-Flags wie (?i:…) sind in Python gültig, werden von der Browser-Engine aber noch nicht unterstützt.'],
    [/conditional groups are not supported/i, 'Bedingte Gruppen (?(id)…) sind in Python gültig, werden von der Browser-Engine aber noch nicht unterstützt.'],
    [/\\N\{name\}.*not supported|\\N\{name\}.*nicht unterstützt/i, 'Unicode-Namen mit \\N{…} sind in Python gültig, werden von der Browser-Engine aber noch nicht unterstützt.'],
    [/captures nested in repeated groups/i, 'Verschachtelte Captures in wiederholten Gruppen sind in Python gültig, können im Browser aber eine andere Capture-Historie liefern und werden deshalb nicht ausgewertet.'],
    [/captures that can be empty in repeated groups/i, 'Leere Captures in wiederholten Gruppen sind in Python gültig, können im Browser aber eine andere Capture-Historie liefern und werden deshalb nicht ausgewertet.'],
    [/quantified lookarounds are not supported/i, 'Quantifizierte Lookarounds sind in Python gültig, werden von der Browser-Engine aber nicht zuverlässig unterstützt.'],
    [/backreferences to groups that may be unmatched/i, 'Dieser Rückverweis kann auf eine nicht beteiligte Gruppe zeigen. Python unterstützt das, die Browser-Engine würde es anders auswerten und lehnt es deshalb ab.'],
    [/case-insensitive backreferences are not supported/i, 'Rückverweise zusammen mit re.I sind in Python gültig, werden wegen abweichender Unicode-Faltung im Browser aber nicht ausgewertet.'],
    [/whitespace is not allowed inside a regex token in verbose mode/i, 'Im Verbose-Modus darf Whitespace mehrteilige Regex-Tokens wie *?, (?P<…>) oder \\xHH nicht trennen.'],
    [/the repetition number is too large/i, 'Die Wiederholungszahl ist für Python zu groß.'],
    [/bad character range/i, 'Ungültiger Bereich in der Zeichenklasse. Kategorien wie \\w oder \\W dürfen keine Bereichsgrenze sein.'],
    [/unknown extension \?<$/i, 'Die Schreibweise (?<name>…) ist JavaScript/.NET-Syntax. Python verwendet (?P<name>…).'],
    [/Unterminated group|missing \)/i, 'Eine Klammer ( wurde nicht geschlossen.'],
    [/Unmatched \'\)\'|Unmatched \)/i, 'Eine schließende Klammer ) hat keinen Partner.'],
    [/character class|character set|Unterminated character class/i, 'Eine Zeichenklasse [ wurde nicht mit ] geschlossen.'],
    [/Nothing to repeat/i, 'Ein Quantifizierer (* + ? {…}) steht ohne etwas davor, das er wiederholen könnte.'],
    [/Invalid group(?! reference)/i, 'Ungültige Gruppen-Syntax.'],
    [/Invalid escape|bad escape|incomplete escape|octal escape/i, 'Ungültige Escape-Sequenz (\\ vor einem Zeichen, das das nicht erlaubt).'],
    [/Invalid regular expression flags/i, 'Ungültige Flag-Kombination.'],
    [/Invalid quantifier|Incomplete quantifier/i, 'Ungültiger Quantifizierer — geschweifte Klammern brauchen die Form {n}, {n,} oder {n,m}.'],
    [/Invalid named capture|Duplicate capture group/i, 'Problem mit einer benannten Gruppe (Name doppelt oder ungültig).'],
    [/Invalid property name|Invalid Unicode/i, 'Ungültige Unicode-Eigenschaft.'],
    [/Lone quantifier brackets/i, 'Einzelne geschweifte Klammer — meintest du \\{ ?'],
    [/backreference|group reference|unknown group name/i, 'Ungültiger Rückverweis (\\1, \\2 …) — die referenzierte Gruppe existiert nicht.'],
    [/look-behind requires fixed-width/i, 'Ein Lookbehind muss in Python auf allen Wegen dieselbe feste Länge haben.'],
    [/global flags not at the start/i, 'Globale Inline-Flags wie (?i) müssen am Anfang des Musters stehen.']
  ];

  function germanError(msg) {
    for (var i = 0; i < ERR_MAP.length; i++) {
      if (ERR_MAP[i][0].test(msg)) return ERR_MAP[i][1];
    }
    return 'Das Muster ist syntaktisch nicht gültig.';
  }

  /* ---------------------------------------------------------------
     re.escape — Metazeichen maskieren (wie Pythons re.escape)
     --------------------------------------------------------------- */
  var ESCAPE_RE = /[()\[\]{}?*+\-|^$\\.&~# \t\n\r\v\f]/g;

  function escape(str) {
    return String(str).replace(ESCAPE_RE, function (c) {
      return '\\' + c;
    });
  }

  /* ---------------------------------------------------------------
     compile(pattern, flags) -> { ok, regex, warnings, error, ascii }
     flags: String aus "imsxa" (wie re.I | re.M | re.S | re.X | re.A)
     --------------------------------------------------------------- */
  function compile(pattern, flags) {
    flags = flags || '';
    if (typeof pattern !== 'string') {
      return { ok: false, error: 'Kein Muster eingegeben.', empty: true, warnings: [] };
    }

    if (/[^aiLmsux]/.test(flags)) {
      return { ok: false, error: 'Ungültige Flag-Kombination.', raw: 'bad inline flags', warnings: [] };
    }

    /* Unter re.X dürfen ignorierter Whitespace und #-Kommentare vor
       globalen Inline-Flags stehen. Darum Flags und Verbose-Normalisierung
       iterativ verarbeiten, bis am Anfang kein weiteres Flag mehr steht. */
    var previousPattern;
    try {
      do {
        previousPattern = pattern;
        pattern = stripLeadingRegexComments(pattern);
        var inline = extractInlineFlags(pattern);
        pattern = inline.pattern;
        flags += inline.flags;
        if (flags.indexOf('x') !== -1) pattern = stripVerbose(pattern);
      } while (pattern !== previousPattern);
    } catch (verboseErr) {
      return { ok: false, error: germanError(String(verboseErr.message)), raw: String(verboseErr.message), warnings: [] };
    }

    var localeWarn = [];
    if (flags.indexOf('L') !== -1) {
      localeWarn.push('re.L (Locale) wird im Browser nicht unterstützt — \\w und \\b verhalten sich wie ohne Locale-Flag.');
    }

    if (/[^aiLmsux]/.test(flags) || (flags.indexOf('a') !== -1 && flags.indexOf('u') !== -1)) {
      return { ok: false, error: 'Ungültige Flag-Kombination.', raw: 'bad inline flags', warnings: [] };
    }

    var analysis;
    try { analysis = analyzePattern(pattern); }
    catch (syntaxErr) {
      return { ok: false, error: germanError(String(syntaxErr.message)), raw: String(syntaxErr.message), warnings: [] };
    }

    var ignorecase = flags.indexOf('i') !== -1;
    var casefoldBackrefMode = ignorecase && analysis.hasBackreference
      ? (flags.indexOf('a') !== -1 ? 'ascii' : 'unicode')
      : null;
    if (casefoldBackrefMode) {
      localeWarn.push(casefoldBackrefMode === 'ascii'
        ? 'Rückverweise mit re.A|re.I werden nur für reine ASCII-Muster und -Testtexte ausgewertet.'
        : 'Rückverweise mit re.I werden bei Texten mit İ oder ı vorsorglich abgelehnt, weil Browser diese Sonderfälle anders falten.');
    }

    var jsFlags = 'gu';
    var multiline = flags.indexOf('m') !== -1;
    var wantAscii = flags.indexOf('a') !== -1;
    if (ignorecase && (!wantAscii || casefoldBackrefMode === 'ascii')) jsFlags += 'i';

    var tr = translate(pattern, {
      unicode: !wantAscii,
      ignorecase: ignorecase,
      multiline: multiline,
      dotall: flags.indexOf('s') !== -1
    });
    try {
      var re = new RegExp(tr.source, jsFlags);
      re.__rtCanMatchNonEmpty = analysis.canMatchNonEmpty;
      re.__rtSimpleGreedyOptional = isSimpleGreedyOptional(pattern);
      re.__rtCasefoldBackrefMode = casefoldBackrefMode;
      re.__rtPatternHasNonAscii = /[^\x00-\x7f]/.test(pattern);
      return {
        ok: true, regex: re, warnings: tr.warnings.concat(localeWarn), ascii: wantAscii,
        source: tr.source, flags: flags, pythonVersion: PYTHON_VERSION,
        groupCount: analysis.count, groupNames: analysis.names,
        groupNamesByIndex: analysis.groupNamesByIndex,
        groupIndexByName: analysis.groupIndexByName
      };
    } catch (e) {
      var lastErr = e;
    }
    return {
      ok: false,
      error: germanError(lastErr ? String(lastErr.message) : ''),
      raw: lastErr ? String(lastErr.message) : '',
      warnings: []
    };
  }

  /* ---------------------------------------------------------------
     Alle Treffer einsammeln (entspricht re.finditer)
     --------------------------------------------------------------- */
  function codePointIndex(text, codeUnitIndex) {
    var count = 0;
    for (var i = 0; i < codeUnitIndex; i++, count++) {
      var first = text.charCodeAt(i);
      if (first >= 0xD800 && first <= 0xDBFF && i + 1 < codeUnitIndex) {
        var second = text.charCodeAt(i + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) i++;
      }
    }
    return count;
  }

  function buildCodePointMap(text) {
    var map = new Uint32Array(text.length + 1);
    var cp = 0, i = 0;
    while (i < text.length) {
      map[i] = cp;
      var first = text.charCodeAt(i);
      if (first >= 0xD800 && first <= 0xDBFF && i + 1 < text.length) {
        var second = text.charCodeAt(i + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          map[i + 1] = cp;
          i += 2;
          cp++;
          continue;
        }
      }
      i++;
      cp++;
    }
    map[text.length] = cp;
    return map;
  }

  function isCodePointBoundary(text, index) {
    if (index <= 0 || index >= text.length) return true;
    var before = text.charCodeAt(index - 1), after = text.charCodeAt(index);
    return !(before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF);
  }

  function advanceCodePoint(text, index) {
    if (index >= text.length) return text.length + 1;
    var first = text.charCodeAt(index);
    if (first >= 0xD800 && first <= 0xDBFF && index + 1 < text.length) {
      var second = text.charCodeAt(index + 1);
      if (second >= 0xDC00 && second <= 0xDFFF) return index + 2;
    }
    return index + 1;
  }

  function matchObject(m, text, indexMap, groupOffset, ignoredGroupName) {
    var groups = [];
    groupOffset = groupOffset || 0;
    for (var i = 1 + groupOffset; i < m.length; i++) groups.push(m[i]);
    var startCU = m.index, endCU = m.index + m[0].length;
    var named = m.groups ? Object.assign({}, m.groups) : null;
    if (named && ignoredGroupName) delete named[ignoredGroupName];
    if (named && Object.keys(named).length === 0) named = null;
    return {
      start: indexMap ? indexMap[startCU] : codePointIndex(text, startCU),
      end: indexMap ? indexMap[endCU] : codePointIndex(text, endCU),
      startCU: startCU,
      endCU: endCU,
      text: m[0],
      groups: groups,
      named: named
    };
  }

  function regexFlagsWithout(re, chars) {
    var out = '';
    for (var i = 0; i < re.flags.length; i++) if (chars.indexOf(re.flags[i]) === -1) out += re.flags[i];
    return out;
  }

  function assertCasefoldBackrefSafe(re, text) {
    if (re.__rtCasefoldBackrefMode === 'unicode' && /[\u0130\u0131]/.test(text)) {
      var unicodeError = new Error('Rückverweise mit re.I und den Zeichen İ/ı können im Browser nicht Python-genau ausgewertet werden.');
      unicodeError.pythonUnsupported = true;
      throw unicodeError;
    }
    if (re.__rtCasefoldBackrefMode === 'ascii' &&
        (re.__rtPatternHasNonAscii || /[^\x00-\x7f]/.test(text))) {
      var asciiError = new Error('Rückverweise mit re.A|re.I können im Browser nur für reine ASCII-Muster und -Testtexte Python-genau ausgewertet werden.');
      asciiError.pythonUnsupported = true;
      throw asciiError;
    }
  }

  function shiftNumericBackrefs(source, delta) {
    var out = '';
    for (var i = 0; i < source.length; i++) {
      if (source[i] !== '\\') { out += source[i]; continue; }
      if (source[i + 1] === '\\') { out += '\\\\'; i++; continue; }
      if (/[1-9]/.test(source[i + 1] || '')) {
        var digits = source[++i];
        if (/[0-9]/.test(source[i + 1] || '')) digits += source[++i];
        out += '\\' + (Number(digits) + delta);
        continue;
      }
      out += source[i];
    }
    return out;
  }

  function buildNonEmptyRegex(re) {
    var prefixName = '__rtPrefix';
    while (re.source.indexOf('?<' + prefixName + '>') !== -1) prefixName += '_';
    var shifted = shiftNumericBackrefs(re.source, 1);
    try {
      var source = '(?<=^(?<' + prefixName + '>[\\s\\S]*))(?:' + shifted + ')' +
        '(?<=^\\k<' + prefixName + '>[\\s\\S]+)';
      var regex = new RegExp(source, regexFlagsWithout(re, 'gy') + 'y');
      return { regex: regex, prefixName: prefixName };
    } catch (e) {
      return null;
    }
  }

  /* Seit Python 3.7 darf direkt nach einem leeren Treffer am selben Ort
     noch ein nichtleerer Treffer folgen. Die einmal kompilierte Hilfsregex
     merkt sich im Lookbehind den aktuellen Präfix und verlangt am Ende
     mindestens ein weiteres Zeichen. So vermeiden wir eine neue Regex und
     einen Scan ab Stringanfang für jeden leeren Treffer. */
  function nonEmptyAt(helper, text, startCU) {
    if (!helper) return null;
    helper.regex.lastIndex = startCU;
    var m = helper.regex.exec(text);
    return m && m.index === startCU && m[0] !== '' &&
      isCodePointBoundary(text, m.index + m[0].length) ? m : null;
  }

  function findMatches(re, text, limit) {
    assertCasefoldBackrefSafe(re, text);
    limit = limit === undefined ? MAX_MATCHES : limit;
    var canMatchNonEmpty = re.__rtCanMatchNonEmpty !== false;
    var skipAdjacentAfterEmpty = re.__rtSimpleGreedyOptional === true;
    var r = new RegExp(re.source, regexFlagsWithout(re, 'y') + (re.flags.indexOf('g') === -1 ? 'g' : ''));
    var nonEmptyHelper = canMatchNonEmpty ? buildNonEmptyRegex(r) : null;
    r.lastIndex = 0;
    var out = [], m, indexMap = buildCodePointMap(text);
    while ((m = r.exec(text)) !== null) {
      var endCU = m.index + m[0].length;
      if (!isCodePointBoundary(text, m.index) || !isCodePointBoundary(text, endCU)) {
        r.lastIndex = advanceCodePoint(text, m.index);
        continue;
      }
      if (out.length >= limit) { out.truncated = true; break; }
      out.push(matchObject(m, text, indexMap));
      if (m[0] === '') {
        var adjacent = canMatchNonEmpty && !skipAdjacentAfterEmpty
          ? nonEmptyAt(nonEmptyHelper, text, m.index)
          : null;
        if (adjacent) {
          if (out.length >= limit) { out.truncated = true; break; }
          out.push(matchObject(adjacent, text, indexMap, 1, nonEmptyHelper.prefixName));
          r.lastIndex = adjacent.index + adjacent[0].length;
        } else r.lastIndex = advanceCodePoint(text, m.index);
      }
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
  function findallFromMatches(compiled, ms) {
    ensureCompleteMatches(ms);
    var n = compiled.groupCount;
    if (n === 0) return ms.map(function (m) { return m.text; });
    if (n === 1) return ms.map(function (m) { return m.groups[0] === undefined ? '' : m.groups[0]; });
    return ms.map(function (m) {
      return m.groups.map(function (g) { return g === undefined ? '' : g; });
    });
  }

  function findall(compiled, text) {
    return findallFromMatches(compiled, findMatches(compiled.regex, text));
  }

  function matchLimitError() {
    var e = new Error('Mehr als ' + MAX_MATCHES + ' Treffer. Grenze das Muster oder den Testtext weiter ein.');
    e.pythonMatchLimit = true;
    return e;
  }

  function ensureCompleteMatches(matches) {
    if (matches && matches.truncated) throw matchLimitError();
    return matches;
  }

  /* re.search / re.match / re.fullmatch */
  function search(compiled, text) {
    assertCasefoldBackrefSafe(compiled.regex, text);
    var re = new RegExp(compiled.regex.source, regexFlagsWithout(compiled.regex, 'gy') + 'g');
    var m;
    while ((m = re.exec(text)) !== null) {
      var endCU = m.index + m[0].length;
      if (isCodePointBoundary(text, m.index) && isCodePointBoundary(text, endCU)) {
        return matchObject(m, text);
      }
      re.lastIndex = advanceCodePoint(text, m.index);
    }
    return null;
  }
  function matchAt(compiled, text) {
    assertCasefoldBackrefSafe(compiled.regex, text);
    var re = new RegExp(compiled.regex.source, regexFlagsWithout(compiled.regex, 'gy') + 'y');
    re.lastIndex = 0;
    var m = re.exec(text);
    return m && isCodePointBoundary(text, m.index + m[0].length) ? matchObject(m, text) : null;
  }
  function fullmatch(compiled, text) {
    assertCasefoldBackrefSafe(compiled.regex, text);
    /* Die Endbedingung gehört in denselben Regex-Lauf. Nur so kann z. B.
       a|ab nach dem zunächst gewählten a noch zu ab zurücktracken. */
    var source = '^(?:' + compiled.regex.source + ')$(?![\\s\\S])';
    var re = new RegExp(source, regexFlagsWithout(compiled.regex, 'gy'));
    var m = re.exec(text);
    return m ? matchObject(m, text) : null;
  }

  /* ---------------------------------------------------------------
     re.sub — Python-Ersetzungssyntax \1 \g<1> \g<name> \\ \n
     --------------------------------------------------------------- */
  function replacementError(message) {
    var e = new Error(message);
    e.pythonReplacement = true;
    return e;
  }

  function replacementTokens(repl, compiled) {
    var tokens = [];
    for (var i = 0; i < repl.length; i++) {
      var c = repl[i];
      if (c !== '\\') { tokens.push({ t: 'text', v: c }); continue; }
      if (i + 1 >= repl.length) throw replacementError('Ungültiger Ersatz: einzelner Backslash am Ende.');
      var n = repl[++i], digits, value, close, ref, index;

      if (/[0-9]/.test(n)) {
        if (n === '0' || (/[0-7]/.test(n) && /^[0-7]{2}/.test(repl.slice(i + 1)))) {
          digits = n;
          while (digits.length < 3 && /[0-7]/.test(repl[i + 1] || '')) digits += repl[++i];
          value = parseInt(digits, 8);
          if (value > 255) throw replacementError('Ungültiger Ersatz: Oktalwert liegt außerhalb von 0o377.');
          tokens.push({ t: 'text', v: String.fromCharCode(value) });
          continue;
        }
        digits = n;
        if (/[0-9]/.test(repl[i + 1] || '')) digits += repl[++i];
        index = +digits;
        if (!index || index > compiled.groupCount) {
          throw replacementError('Ungültiger Ersatz: Gruppe ' + index + ' existiert nicht.');
        }
        tokens.push({ t: 'group', i: index });
        continue;
      }

      if (n === 'g') {
        if (repl[i + 1] !== '<' || (close = repl.indexOf('>', i + 2)) === -1) {
          throw replacementError('Ungültiger Ersatz: \\g braucht die Form \\g<name> oder \\g<1>.');
        }
        ref = repl.slice(i + 2, close); i = close;
        if (/^[0-9]+$/.test(ref)) {
          index = +ref;
          if (index > compiled.groupCount) throw replacementError('Ungültiger Ersatz: Gruppe ' + index + ' existiert nicht.');
        } else {
          if (!isPythonGroupName(ref) ||
              !Object.prototype.hasOwnProperty.call(compiled.groupIndexByName || {}, ref)) {
            throw replacementError('Ungültiger Ersatz: Gruppenname „' + ref + '“ existiert nicht.');
          }
          index = compiled.groupIndexByName[ref];
        }
        tokens.push({ t: 'group', i: index });
        continue;
      }

      var controls = { a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '\\': '\\' };
      if (Object.prototype.hasOwnProperty.call(controls, n)) tokens.push({ t: 'text', v: controls[n] });
      else if (/[A-Za-z]/.test(n)) throw replacementError('Ungültiger Ersatz: unbekannte Escape-Sequenz \\' + n + '.');
      else tokens.push({ t: 'text', v: '\\' + n });
    }
    return tokens;
  }

  function applyReplacement(tokens, m) {
    var out = '';
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (token.t === 'text') out += token.v;
      else if (token.i === 0) out += m.text;
      else {
        var g = m.groups[token.i - 1];
        out += g === undefined || g === null ? '' : g;
      }
    }
    return out;
  }

  function subFromMatches(compiled, repl, text, count, ms) {
    var tokens = replacementTokens(String(repl), compiled);
    if (count > 0) ms = ms.slice(0, count);
    else if (count < 0) ms = [];
    var out = '', pos = 0;
    for (var i = 0; i < ms.length; i++) {
      out += text.slice(pos, ms[i].startCU) + applyReplacement(tokens, ms[i]);
      pos = ms[i].endCU;
    }
    return { result: out + text.slice(pos), count: ms.length };
  }

  function sub(compiled, repl, text, count) {
    var ms = findMatches(compiled.regex, text, count > 0 ? count : MAX_MATCHES);
    if (!(count > 0)) ensureCompleteMatches(ms);
    return subFromMatches(compiled, repl, text, count, ms);
  }

  /* re.split — Gruppeninhalte landen mit in der Liste */
  function splitFromMatches(compiled, text, maxsplit, ms) {
    if (maxsplit > 0) ms = ms.slice(0, maxsplit);
    else if (maxsplit < 0) ms = [];
    var out = [], pos = 0;
    for (var i = 0; i < ms.length; i++) {
      out.push(text.slice(pos, ms[i].startCU));
      for (var g = 0; g < ms[i].groups.length; g++) {
        out.push(ms[i].groups[g] === undefined ? null : ms[i].groups[g]);
      }
      pos = ms[i].endCU;
    }
    out.push(text.slice(pos));
    return out;
  }

  function split(compiled, text, maxsplit) {
    var ms = findMatches(compiled.regex, text, maxsplit > 0 ? maxsplit : MAX_MATCHES);
    if (!(maxsplit > 0)) ensureCompleteMatches(ms);
    return splitFromMatches(compiled, text, maxsplit, ms);
  }

  /* ---------------------------------------------------------------
     Python-repr für die Ergebnisanzeige
     --------------------------------------------------------------- */
  function pyStr(s) {
    s = String(s);
    var q = s.indexOf("'") !== -1 && s.indexOf('"') === -1 ? '"' : "'";
    var body = '';
    for (var ch of s) {
      var cp = ch.codePointAt(0);
      if (ch === '\\') body += '\\\\';
      else if (ch === q) body += '\\' + ch;
      else if (ch === '\n') body += '\\n';
      else if (ch === '\t') body += '\\t';
      else if (ch === '\r') body += '\\r';
      else if (cp < 0x20 || cp === 0x7F || (ch !== ' ' && /[\p{C}\p{Z}]/u.test(ch))) {
        if (cp <= 0xFF) body += '\\x' + ('0' + cp.toString(16)).slice(-2);
        else if (cp <= 0xFFFF) body += '\\u' + ('0000' + cp.toString(16)).slice(-4);
        else body += '\\U' + ('00000000' + cp.toString(16)).slice(-8);
      } else body += ch;
    }
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
    var res = { ok: true, compiled: c, warnings: c.warnings, matches: [] };
    var all = null;
    function allMatches() {
      if (!all) all = ensureCompleteMatches(findMatches(c.regex, text));
      return all;
    }

    try { switch (fn) {
      case 'findall':
        res.matches = allMatches();
        res.value = findallFromMatches(c, res.matches);
        res.display = pyReprFindall(res.value);
        break;
      case 'finditer':
        res.matches = allMatches();
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
        res.matches = allMatches();
        var r = subFromMatches(c, extra.repl || '', text, extra.count || 0, res.matches);
        res.value = r.result;
        res.display = pyStr(r.result);
        res.plain = r.result;
        break;
      }
      case 'split':
        res.matches = allMatches();
        res.value = splitFromMatches(c, text, extra.maxsplit || 0, res.matches);
        res.display = '[' + res.value.map(pyRepr).join(', ') + ']';
        break;
      default:
        res.matches = allMatches();
        res.value = findallFromMatches(c, res.matches);
        res.display = pyReprFindall(res.value);
    } } catch (operationError) {
      if (operationError && (operationError.pythonReplacement || operationError.pythonMatchLimit || operationError.pythonUnsupported)) {
        return { ok: false, error: operationError.message, warnings: c.warnings, matches: [] };
      }
      throw operationError;
    }
    return res;
  }

  RT.engine = {
    compile: compile,
    escape: escape,
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
})(typeof globalThis !== 'undefined' ? globalThis : self);
