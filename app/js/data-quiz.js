/* =============================================================
   data-quiz.js — Multiple-Choice für die Klausurreflexe
   { id, level, q, code, options[], correct, why, demo? }
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});

  RT.quiz = [

    /* ---------- Stufe 1 ---------- */
    {
      id: 'q01', level: 1, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"\\d", "Hausnummer 27")',
      options: ["['27']", "['2', '7']", "['Hausnummer', '27']", "['2']"],
      correct: 1,
      why: '\\d steht für <b>genau eine</b> Ziffer. Ohne Quantifizierer wird jede Ziffer einzeln gefunden. Für „27“ bräuchtest du \\d+.',
      demo: { pattern: '\\d', text: 'Hausnummer 27' }
    },
    {
      id: 'q02', level: 1, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"a+", "caaab")',
      options: ["['a', 'a', 'a']", "['aaa']", "['caaab']", "[]"],
      correct: 1,
      why: '+ ist gierig und nimmt so viele a wie möglich am Stück — also einen Treffer mit drei Zeichen.',
      demo: { pattern: 'a+', text: 'caaab' }
    },
    {
      id: 'q03', level: 1, q: 'Und was liefert das hier?',
      code: 're.findall(r"a*", "baaa")',
      options: ["['aaa']", "['', 'aaa', '']", "['a', 'a', 'a']", "['']"],
      correct: 1,
      why: '* erlaubt auch <b>null</b> Wiederholungen. An der Position vor dem b und am Stringende passt deshalb jeweils der leere String. Deshalb nimmt man fast immer +.',
      demo: { pattern: 'a*', text: 'baaa' }
    },
    {
      id: 'q04', level: 1, q: 'Welches Zeichen steht für „ein beliebiges Zeichen außer Zeilenumbruch“?',
      options: ['\\w', '.', '\\S', '*'],
      correct: 1,
      why: 'Der Punkt. \\w ist enger (nur Wortzeichen), \\S ist „kein Leerraum“, und * ist ein Quantifizierer, kein Platzhalter.'
    },
    {
      id: 'q05', level: 1, q: 'Welche Schreibweise ist für Regex mit Backslashes in Python empfohlen?',
      options: ['"\\d+"', "r'\\d+'", 'f"\\d+"', "'''\\d+'''"],
      correct: 1,
      why: 'Ein Raw String reicht die Backslashes unverändert an re weiter. Ein gewöhnlicher String mit \\d kann derzeit zwar funktionieren, aber bei \\b entsteht ein Backspace und unbekannte String-Escapes erzeugen Warnungen. Deshalb ist r"…" die verlässliche Standardform.'
    },

    /* ---------- Stufe 2 ---------- */
    {
      id: 'q06', level: 2, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"[^aeiou]", "Haus")',
      options: ["['a', 'u']", "['H', 's']", "['H', 'a', 'u', 's']", "[]"],
      correct: 1,
      why: 'Das ^ direkt hinter der eckigen Klammer negiert die Menge: gesucht sind alle Zeichen, die <b>keine</b> Vokale sind.',
      demo: { pattern: '[^aeiou]', text: 'Haus' }
    },
    {
      id: 'q07', level: 2, q: 'Welches Muster findet Wörter mit genau vier Buchstaben?',
      options: ['\\w{4}', '\\b[a-zA-Z]{4}\\b', '[a-zA-Z]{4,}', '\\b\\w{4,}\\b'],
      correct: 1,
      why: 'Ohne Wortgrenzen würde \\w{4} auch die ersten vier Zeichen eines längeren Wortes nehmen. {4,} bedeutet „mindestens vier“ — das ist zu viel.',
      demo: { pattern: '\\b[a-zA-Z]{4}\\b', text: 'This test will work perfectly' }
    },
    {
      id: 'q08', level: 2, q: 'Was ist der Unterschied zwischen <code>.*</code> und <code>.*?</code>',
      options: [
        '.*? erlaubt auch Zeilenumbrüche',
        '.*? nimmt so wenig wie möglich, .* so viel wie möglich',
        '.*? ist schneller, sonst identisch',
        'Es gibt keinen — das ? ist nur Kosmetik'
      ],
      correct: 1,
      why: 'Das angehängte ? macht den Quantifizierer <b>genügsam</b> (lazy). Standardmäßig sind Quantifizierer gierig.',
      demo: { pattern: '".*?"', text: 'Er sagte "hallo" und "tschüss".' }
    },
    {
      id: 'q09', level: 2, q: 'Was bedeutet <code>a{2,}</code>?',
      options: ['genau zwei a', 'zwei oder drei a', 'mindestens zwei a', 'höchstens zwei a'],
      correct: 2,
      why: 'Das Komma ohne Obergrenze bedeutet „mindestens“. {,2} wäre umgekehrt „höchstens zwei“.'
    },
    {
      id: 'q10', level: 2, q: 'Warum ist <code>&lt;[^&gt;]+&gt;</code> besser als <code>&lt;.+&gt;</code> zum Finden von HTML-Tags?',
      options: [
        'Es ist kürzer',
        'Es kann gar nicht erst über das schließende &gt; hinauslaufen',
        '.+ funktioniert in Python nicht',
        'Es findet auch verschachtelte Tags'
      ],
      correct: 1,
      why: '<code>.+</code> ist gierig und verschluckt bei <code>&lt;div&gt;Text&lt;/div&gt;</code> alles bis zum letzten &gt;. Die negierte Klasse kann das strukturell nicht.',
      demo: { pattern: '<[^>]+>', text: '<div>Text</div>' }
    },
    {
      id: 'q11', level: 2, q: 'Welche Zeichen brauchen <b>innerhalb</b> von <code>[ ]</code> besondere Behandlung?',
      options: [
        'alle Metazeichen wie draußen auch',
        '] und \\, außerdem ^ am Anfang und - zwischen Zeichen',
        'gar keine',
        'nur den Punkt'
      ],
      correct: 1,
      why: 'In einer Zeichenklasse verlieren die meisten Metazeichen ihre Bedeutung. <code>[.+*]</code> sind einfach Punkt, Plus und Stern. Ein Bindestrich ist am Anfang oder Ende auch ohne Backslash wörtlich; ein <code>]</code> lässt sich ebenfalls positionsabhängig oder maskiert schreiben.'
    },

    /* ---------- Stufe 3 ---------- */
    {
      id: 'q12', level: 3, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"\\bcat\\b", "cat catalog scattered")',
      options: ["['cat', 'cat', 'cat']", "['cat']", "['cat', 'cat']", "[]"],
      correct: 1,
      why: '\\b verlangt eine Wortgrenze auf beiden Seiten. In „catalog“ folgt direkt ein Wortzeichen, in „scattered“ steht auch links eines.',
      demo: { pattern: '\\bcat\\b', text: 'cat catalog scattered' }
    },
    {
      id: 'q13', level: 3, q: 'Was macht das Flag <code>re.M</code>?',
      options: [
        'Der Punkt matcht auch den Zeilenumbruch',
        '^ und $ gelten zusätzlich an jedem Zeilenanfang bzw. -ende',
        'Groß- und Kleinschreibung werden ignoriert',
        'Mehrere Treffer statt nur einem'
      ],
      correct: 1,
      why: 'Das ist re.MULTILINE. „Der Punkt matcht \\n“ wäre re.S (DOTALL) — eine beliebte Verwechslung.',
      demo: { pattern: '^\\w+', flags: 'm', text: 'Zeile eins\nZeile zwei' }
    },
    {
      id: 'q14', level: 3, q: 'Was ist der Unterschied zwischen <code>\\A</code> und <code>^</code>?',
      options: [
        'Es gibt keinen',
        '\\A gilt auch mit re.M nur am Stringanfang, ^ dann an jedem Zeilenanfang',
        '\\A ist die ASCII-Variante von ^',
        '\\A funktioniert nur in Zeichenklassen'
      ],
      correct: 1,
      why: '\\A und \\z sind die absoluten Anker: Sie lassen sich von re.M nicht beeindrucken. In Python 3.14 ist \\Z ein gleichbedeutender Alias für \\z.'
    },
    {
      id: 'q15', level: 3, q: 'Welche Aussage über Anker stimmt?',
      options: [
        'Anker matchen genau ein Zeichen',
        'Anker matchen Positionen und verbrauchen kein Zeichen',
        'Anker funktionieren nur am Musteranfang',
        'Anker sind in Python nicht verfügbar'
      ],
      correct: 1,
      why: 'Anker sind „nullbreit“. Genau deshalb kann man sie stapeln und beliebig kombinieren.'
    },
    {
      id: 'q16', level: 3, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"\\w+", "Größe")   # Python 3.14',
      options: ["['Gr', 'e']", "['Größe']", "['G', 'r', 'ö', 'ß', 'e']", "[]"],
      correct: 1,
      why: 'Python 3 ist standardmäßig unicode-bewusst — Umlaute und ß zählen zu \\w. Erst mit dem Flag re.A käme <code>[\'Gr\', \'e\']</code> heraus.',
      demo: { pattern: '\\w+', text: 'Größe' }
    },

    /* ---------- Stufe 4 ---------- */
    {
      id: 'q17', level: 4, q: 'Was liefert dieser Aufruf?',
      code: 're.findall(r"(\\d+)\\s?(Euro)", "100 Euro und 200Euro")',
      options: [
        "['100 Euro', '200Euro']",
        "[('100', 'Euro'), ('200', 'Euro')]",
        "['100', '200']",
        "['Euro', 'Euro']"
      ],
      correct: 1,
      why: 'Die Gruppenregel von findall: <b>mehrere</b> fangende Gruppen ergeben eine Liste von <b>Tupeln</b>. Willst du die ganzen Treffer, nimm (?:…).',
      demo: { pattern: '(\\d+)\\s?(Euro)', text: '100 Euro und 200Euro' }
    },
    {
      id: 'q18', level: 4, q: 'Und was liefert das hier?',
      code: 're.findall(r"Jahr (\\d{4})", "Jahr 2019, Jahr 2024")',
      options: [
        "['Jahr 2019', 'Jahr 2024']",
        "['2019', '2024']",
        "[('2019',), ('2024',)]",
        "['Jahr', 'Jahr']"
      ],
      correct: 1,
      why: 'Bei <b>genau einer</b> Gruppe gibt findall nur deren Inhalt zurück — kein Tupel, kein Gesamttreffer.',
      demo: { pattern: 'Jahr (\\d{4})', text: 'Jahr 2019, Jahr 2024' }
    },
    {
      id: 'q19', level: 4, q: 'Wozu dient <code>(?:…)</code>?',
      options: [
        'Zum Kommentieren im Muster',
        'Zum Gruppieren, ohne den Inhalt als Gruppe zu speichern',
        'Für optionale Gruppen',
        'Für benannte Gruppen'
      ],
      correct: 1,
      why: 'Die nicht-fangende Gruppe klammert nur. Damit bleibt findall bei den vollständigen Treffern und die Gruppennummern verschieben sich nicht.'
    },
    {
      id: 'q20', level: 4, q: 'Was matcht <code>^Hund|Katze$</code>?',
      options: [
        'Nur die Wörter Hund und Katze allein auf einer Zeile',
        '„Hund“ am Anfang ODER „Katze“ am Ende',
        'Hund gefolgt von Katze',
        'Nichts — das Muster ist ungültig'
      ],
      correct: 1,
      why: 'Der Pipe-Operator bindet sehr schwach: er teilt das <b>gesamte</b> Muster. Gemeint war fast sicher <code>^(?:Hund|Katze)$</code>.'
    },
    {
      id: 'q21', level: 4, q: 'Was findet <code>(\\w)\\1</code> im Wort „cool“?',
      options: ["['oo']", "['o']", "['c', 'o', 'o', 'l']", "[]"],
      correct: 1,
      why: 'Der Treffer ist „oo“, aber findall gibt bei einer Gruppe deren Inhalt zurück — und die Gruppe hat nur das erste o gefangen. Mit finditer sähest du m.group() == "oo".',
      demo: { pattern: '(\\w)\\1', text: 'cool' }
    },
    {
      id: 'q22', level: 4, q: 'Wie heißt eine benannte Gruppe in Python?',
      options: ['(?&lt;name&gt;…)', '(?P&lt;name&gt;…)', '(?name:…)', '(&lt;name&gt;…)'],
      correct: 1,
      why: 'Python schreibt das P mit: <code>(?P&lt;name&gt;…)</code>. <code>(?&lt;name&gt;…)</code> ist unter anderem JavaScript-Syntax und wird auch in Python 3.14 nicht als benannte Gruppe akzeptiert.'
    },

    /* ---------- Stufe 5 ---------- */
    {
      id: 'q23', level: 5, q: 'Was ist der Unterschied zwischen <code>re.match</code> und <code>re.fullmatch</code>?',
      options: [
        'Es gibt keinen',
        'match prüft nur den Anfang, fullmatch verlangt den kompletten String',
        'match liefert eine Liste, fullmatch ein Match-Objekt',
        'fullmatch ignoriert Groß- und Kleinschreibung'
      ],
      correct: 1,
      why: '<code>re.match(r"\\d+", "50 Euro")</code> ist ein <b>Treffer</b>, <code>re.fullmatch</code> liefert dort None. Diese Verwechslung steht in erschreckend vielen Skripten.',
      demo: { pattern: '\\d+', text: '50 Euro', fn: 'match' }
    },
    {
      id: 'q24', level: 5, q: 'Was liefert <code>re.search</code>, wenn nichts gefunden wird?',
      options: ['Eine leere Liste []', 'None', 'Einen leeren String', 'Eine Exception'],
      correct: 1,
      why: 'Deshalb immer prüfen: <code>if m := re.search(...):</code> — sonst gibt es einen AttributeError beim Zugriff auf .group().'
    },
    {
      id: 'q25', level: 5, q: 'Welche Einschränkung gilt für Lookbehind in Python?',
      options: [
        'Es ist gar nicht verfügbar',
        'Der Ausdruck muss feste Länge haben',
        'Es funktioniert nur mit re.M',
        'Es darf keine Zeichenklassen enthalten'
      ],
      correct: 1,
      why: '<code>(?&lt;=ab)</code> geht, <code>(?&lt;=a+)</code> und <code>(?&lt;=ab|abc)</code> werfen einen Fehler. Beim Lookahead gibt es diese Einschränkung nicht.'
    },
    {
      id: 'q26', level: 5, q: 'Was liefert dieser Aufruf?',
      code: 're.sub(r"\\s+", " ", "zu   viel   Luft")',
      options: ['"zuvielLuft"', '"zu viel Luft"', "['zu', 'viel', 'Luft']", '"zu   viel   Luft"'],
      correct: 1,
      why: 'Jede Folge von Leerraum wird durch ein einzelnes Leerzeichen ersetzt. Der Standard-Cleaning-Schritt.',
      demo: { pattern: '\\s+', text: 'zu   viel   Luft', fn: 'sub', repl: ' ' }
    },
    {
      id: 'q27', level: 5, q: 'Was liefert <code>re.subn</code>?',
      options: [
        'Nur den neuen String',
        'Ein Tupel (neuer_string, anzahl_ersetzungen)',
        'Eine Liste aller Ersetzungen',
        'Die Anzahl als Integer'
      ],
      correct: 1,
      why: 'Praktisch, wenn du wissen willst, ob überhaupt etwas ersetzt wurde.'
    },
    {
      id: 'q28', level: 5, q: 'Was passiert, wenn das Muster in <code>re.split</code> eine fangende Gruppe enthält?',
      options: [
        'Die Gruppe wird ignoriert',
        'Die Gruppeninhalte landen mit in der Ergebnisliste',
        'Es gibt einen Fehler',
        'Nur die Gruppe wird zurückgegeben'
      ],
      correct: 1,
      why: '<code>re.split(r"(\\d)", "a1b")</code> ergibt <code>[\'a\', \'1\', \'b\']</code>. Manchmal genau das Gewünschte, oft eine Überraschung.',
      demo: { pattern: '(\\d)', text: 'a1b', fn: 'split' }
    },
    {
      id: 'q29', level: 5, q: 'Wofür ist <code>re.escape()</code> da?',
      options: [
        'Um Backslashes im Ergebnis zu entfernen',
        'Um Metazeichen in einem String zu maskieren, damit er wörtlich gesucht wird',
        'Um aus einem Muster einen Raw String zu machen',
        'Um Unicode in ASCII umzuwandeln'
      ],
      correct: 1,
      why: 'Unverzichtbar, sobald Benutzereingaben oder Variableninhalte ins Muster wandern — sonst wird aus einem Punkt versehentlich „irgendein Zeichen“.'
    },
    {
      id: 'q30', level: 5, q: 'Welche pandas-Methode zieht Capture-Gruppen in eigene Spalten?',
      options: ['.str.contains()', '.str.extract()', '.str.findall()', '.str.match()'],
      correct: 1,
      why: '<code>.str.extract(r"(?P&lt;name&gt;\\w+)\\.(?P&lt;endung&gt;\\w+)")</code> — benannte Gruppen werden direkt zu Spaltennamen.'
    },
    {
      id: 'q31', level: 5, q: 'Warum ist <code>[A-z]</code> fast immer ein Fehler?',
      options: [
        'Es ist ungültige Syntax',
        'Der Bereich umfasst nach Zeichencode auch [ \\ ] ^ _ und `',
        'Es matcht nur Großbuchstaben',
        'Es funktioniert nicht mit re.I'
      ],
      correct: 1,
      why: 'Zwischen Z und a liegen im ASCII sechs Sonderzeichen. Gemeint ist praktisch immer <code>[A-Za-z]</code>.',
      demo: { pattern: '[A-z]+', text: 'Hallo_Welt^2' }
    },
    {
      id: 'q32', level: 5, q: 'Warum ist <code>(a+)+b</code> gefährlich?',
      options: [
        'Es ist syntaktisch ungültig',
        'Verschachtelte Quantifizierer führen zu exponentiellem Backtracking',
        'Es matcht immer den ganzen String',
        'Python unterstützt es nicht'
      ],
      correct: 1,
      why: 'Bei diesem Muster probiert die Engine für einen langen Nicht-Treffer exponentiell viele Aufteilungen der a-Folge. Verschachtelte Quantifizierer über derselben Zeichenmenge sind deshalb ein Warnsignal; formuliere die Wiederholung eindeutig oder nutze, wo passend, atomare Gruppen.'
    },
    {
      id: 'q33', level: 5, q: 'Womit trennst du Sätze, ohne die Satzzeichen zu verlieren?',
      options: [
        're.split(r"[.!?]", text)',
        're.split(r"(?<=[.!?])\\s+(?=[A-Z])", text)',
        're.findall(r"[.!?]", text)',
        're.sub(r"[.!?]", "\\n", text)'
      ],
      correct: 1,
      why: 'Getrennt wird nur der Leerraum. Die Lookarounds prüfen die Umgebung, ohne sie zu verbrauchen — deshalb bleiben Satzzeichen und Großbuchstabe erhalten.',
      demo: { pattern: '(?<=[.!?])\\s+(?=[A-Z])', text: 'Er kam. Sie ging! Warum? Keiner weiß es.', fn: 'split' }
    },
    {
      id: 'q34', level: 5, q: 'Was gibt <code>re.finditer</code> zurück?',
      options: [
        'Eine Liste von Strings',
        'Einen Iterator über Match-Objekte, inklusive Positionen und Gruppen',
        'Ein Dictionary',
        'Denselben Wert wie findall'
      ],
      correct: 1,
      why: 'Genau deshalb nimmt man finditer, wenn man <code>m.start()</code>, <code>m.span()</code> oder <code>m.groupdict()</code> braucht — oder wenn der Text riesig ist.'
    },
    {
      id: 'q35', level: 2, q: 'Was liefert dieser Aufruf bei einem Python-<code>str</code>?',
      code: 're.findall(r"\\d+", "ASCII 12, arabisch-indisch ٣٤")',
      options: ["['12']", "['12', '٣٤']", "['1', '2', '٣', '٤']", '[]'],
      correct: 1,
      why: '<code>\\d</code> steht standardmäßig für jede Unicode-Dezimalziffer. Erst mit <code>re.A</code> wäre das Ergebnis nur <code>[\'12\']</code>.',
      demo: { pattern: '\\d+', text: 'ASCII 12, arabisch-indisch ٣٤' }
    },
    {
      id: 'q36', level: 3, q: 'Welche Aussage zu <code>\\z</code> stimmt für Python 3.14?',
      options: [
        'Es markiert das absolute Stringende; \\Z ist ein kompatibler Alias',
        'Es markiert nur ein Zeilenende mit re.M',
        'Es steht für eine beliebige Ziffer',
        'Python unterstützt \\z erst ab Version 4'
      ],
      correct: 0,
      why: '<code>\\z</code> wurde in Python 3.14 als Anker für das absolute Stringende ergänzt. <code>\\Z</code> hat dort dieselbe Bedeutung; in älteren Python-Versionen verwendet man <code>\\Z</code>.'
    }
  ];
})(window);
