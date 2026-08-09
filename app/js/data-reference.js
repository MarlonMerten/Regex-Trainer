/* =============================================================
   data-reference.js — Das Nachschlagewerk
   Jeder Eintrag:
     sym    Syntax bzw. Befehl (Überschrift)
     title  Kurzbezeichnung
     desc   Erklärung
     cat    Kategorie-ID
     pattern/text/fn/repl   -> Live-Beispiel, Ergebnis wird berechnet
     py     Python-Codeschnipsel
     note   Hinweis / Stolperfalle
     tags   zusätzliche Suchbegriffe
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});

  RT.categories = [
    { id: 'basics',  label: 'Grundlagen',      hint: 'Literale, Escaping, Raw Strings' },
    { id: 'classes', label: 'Zeichenklassen',  hint: '\\d \\w \\s und der Punkt' },
    { id: 'sets',    label: 'Eigene Mengen',   hint: 'Alles in eckigen Klammern' },
    { id: 'anchors', label: 'Anker & Grenzen', hint: '^ $ \\b — Positionen statt Zeichen' },
    { id: 'quant',   label: 'Quantifizierer',  hint: 'Wie oft? * + ? {n,m}' },
    { id: 'groups',  label: 'Gruppen & Oder',  hint: 'Einfangen, zusammenfassen, alternieren' },
    { id: 'look',    label: 'Lookaround',      hint: 'Umschauen, ohne zu verbrauchen' },
    { id: 'flags',   label: 'Flags',           hint: 're.I, re.M, re.S, re.X, re.A' },
    { id: 're',      label: 're-Befehle',      hint: 'Die Funktionen des Moduls re' },
    { id: 'match',   label: 'Match-Objekt',    hint: 'group, span, groupdict …' },
    { id: 'pandas',  label: 'pandas .str',     hint: 'Regex auf ganzen Spalten' },
    { id: 'recipes', label: 'Rezepte',         hint: 'Fertige Muster für den Alltag' },
    { id: 'traps',   label: 'Stolperfallen',   hint: 'Was in Klausuren schiefgeht' }
  ];

  RT.reference = [

    /* ===================== GRUNDLAGEN ===================== */
    {
      sym: 'Katze', title: 'Literal', cat: 'basics',
      desc: 'Alles, was kein Sonderzeichen ist, steht für sich selbst. Ein Muster ohne Metazeichen ist schlicht eine Textsuche.',
      pattern: 'Katze', text: 'Die Katze jagt eine andere Katze.', fn: 'findall',
      py: 're.findall(r"Katze", text)', tags: ['text', 'suchen', 'literal']
    },
    {
      sym: '\\.', title: 'Sonderzeichen entwerten', cat: 'basics',
      desc: 'Ein Backslash nimmt dem folgenden Metazeichen seine Sonderbedeutung. \\. ist ein echter Punkt, nicht „irgendein Zeichen“.',
      pattern: '\\d+\\.\\d+', text: 'Version 3.14 kostet 2,71', fn: 'findall',
      note: 'Diese Zeichen brauchen einen Backslash: . ^ $ * + ? { } [ ] \\ | ( )',
      py: 're.findall(r"\\d+\\.\\d+", text)', tags: ['escape', 'punkt', 'maskieren']
    },
    {
      sym: 'r"..."', title: 'Raw String', cat: 'basics',
      desc: 'In Python schreibt man Regex-Muster IMMER als Raw String. Sonst frisst Python die Backslashes selbst, bevor re sie zu sehen bekommt: "\\b" wird zum Backspace-Zeichen, r"\\b" bleibt die Wortgrenze.',
      note: 'Faustregel: jedes Muster mit r davor. Kostet nichts, rettet Nerven.',
      py: 'regex = r"\\bWort\\b"   # richtig\nregex = "\\bWort\\b"     # kaputt: \\b ist Backspace',
      tags: ['rawstring', 'backslash', 'python']
    },
    {
      sym: 're.escape()', title: 'Text sicher einbauen', cat: 'basics',
      desc: 'Maskiert alle Metazeichen in einem String. Nötig, wenn Benutzereingaben oder Variableninhalte wörtlich gesucht werden sollen.',
      py: 'begriff = "Preis (netto)"\nre.findall(re.escape(begriff), text)',
      tags: ['escape', 'variable', 'sicher']
    },
    {
      sym: 'fr"...{var}..."', title: 'Muster aus Variablen bauen', cat: 'basics',
      desc: 'f-String plus Raw-String: so setzt man Variablen in ein Muster ein — genau der Trick aus der Pronomen-Aufgabe im Praktikum.',
      py: 'for person in ["i", "you", "he"]:\n    regex = fr"\\b{person}\\b"\n    print(person, len(re.findall(regex, text.lower())))',
      note: 'Enthält die Variable Sonderzeichen, gehört re.escape() drum herum.',
      tags: ['fstring', 'variable', 'schleife']
    },

    /* ===================== ZEICHENKLASSEN ===================== */
    {
      sym: '\\d', title: 'Ziffer', cat: 'classes',
      desc: 'Genau eine Ziffer. Entspricht [0-9] — in Python 3 zusätzlich Ziffern anderer Schriftsysteme.',
      pattern: '\\d', text: 'Hausnummer 27', fn: 'findall',
      py: 're.findall(r"\\d", "Hausnummer 27")', tags: ['zahl', 'ziffer', 'digit']
    },
    {
      sym: '\\D', title: 'Keine Ziffer', cat: 'classes',
      desc: 'Ein Zeichen, das keine Ziffer ist. Die Großschreibung kehrt bei allen Kurzformen die Bedeutung um.',
      pattern: '\\D', text: 'A1B2', fn: 'findall', tags: ['negation']
    },
    {
      sym: '\\w', title: 'Wortzeichen', cat: 'classes',
      desc: 'Buchstabe, Ziffer oder Unterstrich. In Python 3 unicode-bewusst: Umlaute und Akzente gehören dazu.',
      pattern: '\\w+', text: '#Python_3 für Anfänger!', fn: 'findall',
      note: 'Merke: \\w schließt den Unterstrich ein, aber nicht den Bindestrich.',
      tags: ['wort', 'word', 'buchstabe']
    },
    {
      sym: '\\W', title: 'Kein Wortzeichen', cat: 'classes',
      desc: 'Alles außer Buchstabe, Ziffer, Unterstrich — also Leerzeichen und Satzzeichen.',
      pattern: '\\W', text: 'A_1!', fn: 'findall', tags: ['negation', 'satzzeichen']
    },
    {
      sym: '\\s', title: 'Whitespace', cat: 'classes',
      desc: 'Ein Leerraum-Zeichen: Leerzeichen, Tab, Zeilenumbruch, Carriage Return, Form Feed.',
      pattern: '\\s', text: 'Hallo\tWelt\nda', fn: 'findall', tags: ['leerzeichen', 'space', 'tab']
    },
    {
      sym: '\\S', title: 'Kein Whitespace', cat: 'classes',
      desc: 'Jedes sichtbare Zeichen. \\S+ ist ein grober „Token“-Begriff, der auch Satzzeichen mitnimmt.',
      pattern: '\\S+', text: ' A\tB ', fn: 'findall', tags: ['token']
    },
    {
      sym: '.', title: 'Beliebiges Zeichen', cat: 'classes',
      desc: 'Genau ein Zeichen — jedes außer dem Zeilenumbruch. Mit dem Flag re.S (DOTALL) auch der Zeilenumbruch.',
      pattern: '.', text: 'AB\nCD', fn: 'findall',
      note: 'Innerhalb von [ ] verliert der Punkt seine Magie: [.] ist ein echter Punkt.',
      tags: ['punkt', 'dot', 'alles']
    },

    /* ===================== EIGENE MENGEN ===================== */
    {
      sym: '[abc]', title: 'Eines dieser Zeichen', cat: 'sets',
      desc: 'Eine selbstgebaute Zeichenklasse steht für GENAU EIN Zeichen aus der Menge.',
      pattern: '[aeiou]', text: 'Haus am Meer', fn: 'findall',
      py: 're.findall(r"[aeiou]", "Haus")', tags: ['vokal', 'menge', 'auswahl']
    },
    {
      sym: '[^abc]', title: 'Keines dieser Zeichen', cat: 'sets',
      desc: 'Ein ^ direkt hinter der öffnenden Klammer negiert die ganze Menge.',
      pattern: '[^aeiou ]', text: 'Haus am Meer', fn: 'findall',
      note: 'Das ^ negiert nur an erster Stelle. In [a^b] ist es ein normales Dach-Zeichen.',
      tags: ['negation', 'nicht']
    },
    {
      sym: '[a-z]', title: 'Bereich', cat: 'sets',
      desc: 'Der Bindestrich spannt einen Bereich nach Zeichencode auf. Mehrere Bereiche lassen sich kombinieren.',
      pattern: '[a-zA-Z0-9]+', text: 'ID: ab12-XY', fn: 'findall',
      note: 'a-z deckt KEINE Umlaute ab. Für Deutsch: [a-zäöüßA-ZÄÖÜ] oder gleich \\w.',
      tags: ['range', 'bereich', 'bindestrich']
    },
    {
      sym: '[A-Z]', title: 'Großbuchstabe', cat: 'sets',
      desc: 'Ein Großbuchstabe von A bis Z.',
      pattern: '\\b[A-Z]\\w*', text: 'Herr Meier geht nach Köln', fn: 'findall',
      tags: ['gross', 'uppercase']
    },
    {
      sym: '[-.]', title: 'Sonderzeichen in Mengen', cat: 'sets',
      desc: 'In einer Zeichenklasse verlieren die meisten Metazeichen ihre Bedeutung. Der Bindestrich muss aber ganz vorn oder ganz hinten stehen, sonst wird er als Bereich gelesen.',
      pattern: '[0-9.,-]+', text: 'Werte: 1.234,56 und 7-9', fn: 'findall',
      note: 'Zu maskieren sind in [ ] nur: ] \\ ^ (am Anfang) und - (in der Mitte).',
      tags: ['bindestrich', 'escape', 'klasse']
    },
    {
      sym: '[\\d\\s]', title: 'Kurzformen mischen', cat: 'sets',
      desc: 'Kurzformen wie \\d, \\w, \\s dürfen in eigenen Mengen stehen und werden dazugerechnet.',
      pattern: '[\\dA-F]{2}', text: 'Farbe #1A2B3C', fn: 'findall',
      tags: ['hex', 'kombination']
    },
    {
      sym: '[^aeiouAEIOU\\W\\d_]', title: 'Konsonant', cat: 'sets',
      desc: 'Ein Klassiker: „Buchstabe, aber kein Vokal“. Man verbietet Vokale, Nicht-Wortzeichen, Ziffern und den Unterstrich — übrig bleiben Konsonanten.',
      pattern: '\\b[^aeiouAEIOU\\W\\d_]\\w*', text: 'Ball und Apfel treffen', fn: 'findall',
      tags: ['konsonant', 'trick']
    },

    /* ===================== ANKER ===================== */
    {
      sym: '^', title: 'Stringanfang', cat: 'anchors',
      desc: 'Passt auf die Position ganz am Anfang. Mit dem Flag re.M zusätzlich hinter jedem Zeilenumbruch.',
      pattern: '^\\w+', text: 'Hallo Welt', fn: 'findall',
      note: 'Anker verbrauchen kein Zeichen — sie prüfen nur, WO man gerade ist.',
      tags: ['anfang', 'start', 'anker']
    },
    {
      sym: '$', title: 'Stringende', cat: 'anchors',
      desc: 'Passt auf die Position am Ende (und direkt vor einem abschließenden Zeilenumbruch). Mit re.M auch an jedem Zeilenende.',
      pattern: '\\w+$', text: 'Hallo Welt', fn: 'findall', tags: ['ende', 'end', 'anker']
    },
    {
      sym: '\\b', title: 'Wortgrenze', cat: 'anchors',
      desc: 'Die Naht zwischen einem Wortzeichen und einem Nicht-Wortzeichen. Das wichtigste Werkzeug, um ganze Wörter zu treffen.',
      pattern: '\\bcat\\b', text: 'cat catalog scattered cat.', fn: 'findall',
      note: 'Ohne \\b findet man „man“ auch in „mankind“ und „woman“.',
      tags: ['wortgrenze', 'boundary', 'ganzes wort']
    },
    {
      sym: '\\B', title: 'Keine Wortgrenze', cat: 'anchors',
      desc: 'Das Gegenteil: eine Position mitten im Wort. Nützlich, um Treffer INNERHALB von Wörtern zu finden.',
      pattern: '\\Bcat\\B', text: 'cat scattered catalog', fn: 'findall',
      tags: ['innen', 'negation']
    },
    {
      sym: '\\A', title: 'Absoluter Anfang', cat: 'anchors',
      desc: 'Wie ^, ignoriert aber re.M — passt wirklich nur am Stringanfang.',
      pattern: '\\AZeile', text: 'Zeile 1\nZeile 2', fn: 'findall', tags: ['anfang']
    },
    {
      sym: '\\Z', title: 'Absolutes Ende', cat: 'anchors',
      desc: 'Wie $, ignoriert aber re.M und akzeptiert kein abschließendes \\n.',
      pattern: '\\d\\Z', text: 'Zeile 1\nZeile 2', fn: 'findall',
      note: 'In anderen Sprachen heißt das \\z — Python kennt nur \\Z.',
      tags: ['ende']
    },

    /* ===================== QUANTIFIZIERER ===================== */
    {
      sym: '*', title: 'Beliebig oft', cat: 'quant',
      desc: 'Null oder mehr Wiederholungen des Bausteins davor. Kann also auch gar nichts matchen — daher die vielen leeren Treffer.',
      pattern: 'a*', text: 'baaa', fn: 'findall',
      note: 'Ein alleinstehendes * liefert oft leere Strings. Meist willst du + .',
      tags: ['stern', 'null oder mehr']
    },
    {
      sym: '+', title: 'Mindestens einmal', cat: 'quant',
      desc: 'Ein oder mehr Wiederholungen. Der Arbeitsesel unter den Quantifizierern.',
      pattern: 'a+', text: 'caaab', fn: 'findall', tags: ['plus', 'ein oder mehr']
    },
    {
      sym: '?', title: 'Optional', cat: 'quant',
      desc: 'Null- oder einmal. Macht den Baustein davor freiwillig.',
      pattern: 'colou?r', text: 'color und colour', fn: 'findall', tags: ['optional', 'fragezeichen']
    },
    {
      sym: '{n}', title: 'Genau n-mal', cat: 'quant',
      desc: 'Exakt n Wiederholungen.',
      pattern: '\\b\\w{5}\\b', text: 'Heute ist ein guter Tag', fn: 'findall',
      tags: ['genau', 'anzahl']
    },
    {
      sym: '{n,m}', title: 'n- bis m-mal', cat: 'quant',
      desc: 'Zwischen n und m Wiederholungen — greedy, nimmt also so viele wie möglich.',
      pattern: '\\d{3,5}-\\d{3,5}', text: 'Telefon 0211-45678', fn: 'findall',
      tags: ['bereich', 'zwischen']
    },
    {
      sym: '{n,}', title: 'Mindestens n-mal', cat: 'quant',
      desc: 'n oder mehr Wiederholungen, ohne Obergrenze.',
      pattern: '\\b[A-Z]{2,}\\b', text: 'In den USA und der EU', fn: 'findall',
      note: '{,m} geht auch und bedeutet {0,m}.',
      tags: ['mindestens']
    },
    {
      sym: '*?  +?  ??', title: 'Lazy (genügsam)', cat: 'quant',
      desc: 'Ein angehängtes ? macht den Quantifizierer genügsam: er nimmt so wenig wie möglich. Rettung bei allem, was von Klammer zu Klammer geht.',
      pattern: '<.+?>', text: '<div>Text</div>', fn: 'findall',
      note: 'Vergleich: <.+> verschlingt alles von der ersten < bis zur letzten >.',
      tags: ['lazy', 'nongreedy', 'genügsam', 'sparsam']
    },
    {
      sym: '.*  vs  .*?', title: 'Greedy gegen Lazy', cat: 'quant',
      desc: 'Standardmäßig sind Quantifizierer gierig: sie schnappen sich erst alles und geben nur so viel zurück, wie nötig ist, damit der Rest noch passt.',
      pattern: '".*"', text: 'a "eins" und "zwei" b', fn: 'findall',
      note: 'Probiere im Playground ".*?" — der Unterschied ist der halbe Regex-Alltag.',
      tags: ['greedy', 'gierig', 'backtracking']
    },

    /* ===================== GRUPPEN ===================== */
    {
      sym: '(...)', title: 'Gruppe (fangend)', cat: 'groups',
      desc: 'Klammert einen Teil zusammen UND merkt sich den Treffer als Gruppe 1, 2, 3 …',
      pattern: '(\\d+)-(\\d+)', text: 'Zeitraum 2019-2024', fn: 'findall',
      note: 'Achtung: Sobald eine Gruppe im Muster steht, gibt findall() die Gruppen zurück statt der ganzen Treffer.',
      tags: ['gruppe', 'capture', 'klammer']
    },
    {
      sym: '(?:...)', title: 'Gruppe ohne Speichern', cat: 'groups',
      desc: 'Klammert nur zum Zusammenfassen, ohne eine Gruppe anzulegen. Genau das Richtige, wenn man nur einen Quantifizierer oder ein | einklammern will.',
      pattern: '(?:ab)+', text: 'ababab cd', fn: 'findall',
      note: 'Damit bleibt findall() bei den ganzen Treffern — der saubere Weg.',
      tags: ['noncapturing', 'gruppe']
    },
    {
      sym: '|', title: 'Alternative (oder)', cat: 'groups',
      desc: 'Entweder links oder rechts. Bindet extrem schwach — es gilt bis zur nächsten Klammer.',
      pattern: '\\b(?:Hund|Katze|Maus)\\b', text: 'Hund, Katze und Vogel', fn: 'findall',
      note: 'Falle: ^Hund|Katze$ heißt „(^Hund) oder (Katze$)“, nicht was du denkst. Klammern!',
      tags: ['oder', 'alternative', 'pipe']
    },
    {
      sym: '(?P<name>...)', title: 'Benannte Gruppe', cat: 'groups',
      desc: 'Wie eine normale Gruppe, aber mit sprechendem Namen. Python-Schreibweise mit P.',
      pattern: '(?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})', text: 'Termin am 24.12.2025', fn: 'finditer',
      py: 'm = re.search(r"(?P<tag>\\d{2})\\.(?P<monat>\\d{2})", text)\nm.group("tag")   # "24"\nm.groupdict()    # {"tag": "24", "monat": "12"}',
      tags: ['named', 'benannt', 'groupdict']
    },
    {
      sym: '\\1', title: 'Rückverweis', cat: 'groups',
      desc: 'Verlangt denselben Text noch einmal, den Gruppe 1 gefunden hat. So findet man Doppelungen.',
      pattern: '(\\w)\\1', text: 'cool, Schifffahrt, egal', fn: 'findall',
      note: 'Klassiker für doppelte Buchstaben oder doppelte Wörter: \\b(\\w+)\\s+\\1\\b',
      tags: ['backreference', 'doppelt', 'wiederholung']
    },
    {
      sym: '(?P=name)', title: 'Rückverweis auf Namen', cat: 'groups',
      desc: 'Wie \\1, nur über den Gruppennamen.',
      pattern: '(?P<z>\\w)(?P=z)', text: 'Wasserfall', fn: 'findall',
      tags: ['backreference', 'benannt']
    },

    /* ===================== LOOKAROUND ===================== */
    {
      sym: '(?=...)', title: 'Positiver Lookahead', cat: 'look',
      desc: 'Bedingung nach rechts: „danach muss … kommen“. Der geprüfte Text gehört NICHT zum Treffer.',
      pattern: '\\d+(?=\\s?€)', text: '20 € und 30 Punkte und 40€', fn: 'findall',
      note: 'Ideal, wenn man etwas nur unter einer Bedingung will, die Bedingung selbst aber nicht ausgeben mag.',
      tags: ['lookahead', 'vorausschau', 'bedingung']
    },
    {
      sym: '(?!...)', title: 'Negativer Lookahead', cat: 'look',
      desc: 'Bedingung nach rechts, verneint: „danach darf … NICHT kommen“.',
      pattern: '\\b\\w+\\b(?!\\s*€)', text: 'Betrag 20 € oder 30 Stück', fn: 'findall',
      tags: ['lookahead', 'negativ', 'ausschluss']
    },
    {
      sym: '(?<=...)', title: 'Positiver Lookbehind', cat: 'look',
      desc: 'Bedingung nach links: „davor muss … stehen“. In Python muss der Lookbehind feste Länge haben.',
      pattern: '(?<=dark\\s)\\w+', text: 'the dark sky above the dark forest', fn: 'findall',
      note: '(?<=ab|abc) ist in Python ein Fehler — unterschiedliche Längen sind verboten.',
      tags: ['lookbehind', 'rückschau', 'davor']
    },
    {
      sym: '(?<!...)', title: 'Negativer Lookbehind', cat: 'look',
      desc: 'Bedingung nach links, verneint: „davor darf … NICHT stehen“.',
      pattern: '(?<!@)\\b\\w+\\.\\w+', text: 'mail@domain.de und datei.txt', fn: 'findall',
      tags: ['lookbehind', 'negativ']
    },
    {
      sym: '(?=.*a)(?=.*1)', title: 'Mehrere Bedingungen stapeln', cat: 'look',
      desc: 'Lookaheads verbrauchen nichts — man kann sie hintereinander hängen und so mehrere Anforderungen gleichzeitig prüfen. Der Passwort-Klassiker.',
      pattern: '^(?=.*[A-Z])(?=.*\\d)\\w{8,}$', text: 'Passwort1', fn: 'findall',
      py: 'bool(re.fullmatch(r"(?=.*[A-Z])(?=.*\\d)\\w{8,}", pw))',
      tags: ['passwort', 'validierung', 'kombination']
    },

    /* ===================== FLAGS ===================== */
    {
      sym: 're.I', title: 'Groß-/Kleinschreibung egal', cat: 'flags',
      desc: 're.IGNORECASE, kurz re.I. Aus „Euro“ wird auch „euro“ und „EURO“.',
      pattern: 'euro', flags: 'i', text: '100 Euro, 200 euros, 300EURO', fn: 'findall',
      py: 're.findall(r"euro", text, re.I)',
      tags: ['ignorecase', 'gross', 'klein']
    },
    {
      sym: 're.M', title: 'Mehrzeilig', cat: 'flags',
      desc: 're.MULTILINE: ^ und $ passen zusätzlich an jedem Zeilenanfang bzw. -ende.',
      pattern: '^\\w+', flags: 'm', text: 'Zeile eins\nZeile zwei\nZeile drei', fn: 'findall',
      py: 're.findall(r"^\\w+", text, re.M)',
      tags: ['multiline', 'zeilen']
    },
    {
      sym: 're.S', title: 'Punkt matcht auch \\n', cat: 'flags',
      desc: 're.DOTALL: Der Punkt schließt den Zeilenumbruch mit ein. Nötig, wenn ein Treffer über Zeilen gehen darf.',
      pattern: 'A.+D', flags: 's', text: 'AB\nCD', fn: 'findall',
      py: 're.findall(r"A.+D", text, re.S)',
      tags: ['dotall', 'zeilenumbruch']
    },
    {
      sym: 're.X', title: 'Verbose — lesbare Muster', cat: 'flags',
      desc: 're.VERBOSE: Whitespace im Muster wird ignoriert und # leitet einen Kommentar ein. So bleiben lange Muster lesbar.',
      py: 'muster = re.compile(r"""\n    \\d+          # Betrag\n    [.,]?\\d*     # optionale Nachkommastellen\n    \\s?          # optionales Leerzeichen\n    (?:€|[Ee]uros?)  # Währung\n""", re.X)',
      note: 'Echte Leerzeichen musst du dann als \\  oder [ ] schreiben.',
      tags: ['verbose', 'kommentar', 'lesbar']
    },
    {
      sym: 're.A', title: 'ASCII erzwingen', cat: 'flags',
      desc: 're.ASCII: \\w, \\d, \\b beschränken sich auf ASCII. Ohne dieses Flag ist Python 3 unicode-bewusst.',
      pattern: '\\w+', flags: 'a', text: 'Café Größe', fn: 'findall',
      note: 'Vergleiche denselben Ausdruck ohne das Flag — der Unterschied bei Umlauten ist deutlich.',
      tags: ['ascii', 'unicode', 'umlaute']
    },
    {
      sym: 're.I | re.M', title: 'Flags kombinieren', cat: 'flags',
      desc: 'Mehrere Flags werden mit dem Pipe-Operator verodert.',
      py: 're.findall(r"^euro", text, re.I | re.M)',
      tags: ['kombination', 'pipe']
    },
    {
      sym: '(?i)', title: 'Inline-Flag', cat: 'flags',
      desc: 'Flags direkt im Muster, ganz am Anfang. Praktisch, wenn man das Muster als String weiterreicht.',
      pattern: '(?i)euro', text: '100 Euro, 200 euro', fn: 'findall',
      note: 'In Python 3.11+ muss das Inline-Flag am Musteranfang stehen, sonst gibt es einen Fehler.',
      tags: ['inline', 'flag']
    },

    /* ===================== re-BEFEHLE ===================== */
    {
      sym: 're.findall(muster, text)', title: 'Alle Treffer als Liste', cat: 're',
      desc: 'Der meistgenutzte Befehl. Liefert eine Liste von Strings — oder von Gruppen, sobald das Muster Klammern enthält.',
      pattern: '\\d+', text: 'Heute 20 Bananen für 50 Euro', fn: 'findall',
      py: 'ergebnisse = re.findall(r"\\d+", text)\n# ["20", "50"]',
      note: 'Gruppenregel: 0 Gruppen → ganze Treffer · 1 Gruppe → nur diese Gruppe · mehrere → Tupel.',
      tags: ['findall', 'liste', 'alle']
    },
    {
      sym: 're.search(muster, text)', title: 'Erster Treffer irgendwo', cat: 're',
      desc: 'Sucht den ersten Treffer an beliebiger Stelle und liefert ein Match-Objekt — oder None.',
      pattern: '\\d+', text: 'Preis: 50 Euro, dann 60', fn: 'search',
      py: 'm = re.search(r"\\d+", text)\nif m:\n    print(m.group(), m.span())',
      tags: ['search', 'erster', 'suchen']
    },
    {
      sym: 're.match(muster, text)', title: 'Treffer AM ANFANG', cat: 're',
      desc: 'Prüft, ob das Muster am Stringanfang passt. Der Rest des Strings darf beliebig weitergehen.',
      pattern: '\\d+', text: '50 Euro', fn: 'match',
      note: 'Häufiger Irrtum: re.match prüft NICHT auf vollständige Übereinstimmung — das macht re.fullmatch.',
      py: 're.match(r"\\d+", "50 Euro")   # Treffer\nre.match(r"\\d+", "Preis 50")   # None',
      tags: ['match', 'anfang']
    },
    {
      sym: 're.fullmatch(muster, text)', title: 'Ganzer String muss passen', cat: 're',
      desc: 'Nur ein Treffer, wenn das Muster den kompletten String abdeckt. Die richtige Wahl zum Validieren.',
      pattern: '\\d+', text: '50', fn: 'fullmatch',
      py: 'bool(re.fullmatch(r"\\d{5}", plz))',
      tags: ['fullmatch', 'validierung', 'komplett']
    },
    {
      sym: 're.finditer(muster, text)', title: 'Alle Treffer als Objekte', cat: 're',
      desc: 'Wie findall, liefert aber Match-Objekte — inklusive Positionen und Gruppen. Speicherschonend, weil es ein Iterator ist.',
      pattern: '\\b[A-Z]\\w+', text: 'Anna trifft Bert in Berlin', fn: 'finditer',
      py: 'for m in re.finditer(r"\\b[A-Z]\\w+", text):\n    print(m.group(), m.start(), m.end())',
      tags: ['finditer', 'position', 'iterator']
    },
    {
      sym: 're.sub(muster, ersatz, text)', title: 'Ersetzen', cat: 're',
      desc: 'Ersetzt alle Treffer. Im Ersatztext greift \\1 auf Gruppe 1 zu, \\g<name> auf benannte Gruppen.',
      pattern: '(\\d+)\\.(\\d+)', repl: '\\1,\\2', text: 'Preise: 15.99 und 3.20', fn: 'sub',
      py: 're.sub(r"(\\d+)\\.(\\d+)", r"\\1,\\2", text)',
      note: 'Auch der Ersatztext gehört in einen Raw String, sonst wird \\1 falsch interpretiert.',
      tags: ['sub', 'ersetzen', 'replace']
    },
    {
      sym: 're.sub(..., count=1)', title: 'Nur die ersten n ersetzen', cat: 're',
      desc: 'Mit count begrenzt man die Zahl der Ersetzungen.',
      py: 're.sub(r"\\s+", " ", text, count=1)',
      tags: ['count', 'begrenzen']
    },
    {
      sym: 're.sub(muster, funktion, text)', title: 'Ersetzen mit Funktion', cat: 're',
      desc: 'Statt eines Strings darf man eine Funktion übergeben. Sie bekommt das Match-Objekt und liefert den Ersatz — so kann man rechnen.',
      py: 'def verdopple(m):\n    return str(int(m.group()) * 2)\n\nre.sub(r"\\d+", verdopple, "3 und 7")   # "6 und 14"',
      tags: ['callback', 'funktion', 'sub']
    },
    {
      sym: 're.subn(...)', title: 'Ersetzen mit Zähler', cat: 're',
      desc: 'Wie sub, liefert aber ein Tupel (neuer_text, anzahl).',
      py: 'text_neu, n = re.subn(r"\\s+", " ", text)',
      tags: ['subn', 'anzahl']
    },
    {
      sym: 're.split(muster, text)', title: 'Zerlegen', cat: 're',
      desc: 'Teilt den String an jedem Treffer. Enthält das Muster Gruppen, landen deren Inhalte mit in der Liste.',
      pattern: '[;,]\\s*', text: 'a, b;c,  d', fn: 'split',
      py: 're.split(r"[;,]\\s*", text)',
      tags: ['split', 'trennen', 'zerlegen']
    },
    {
      sym: 're.compile(muster)', title: 'Muster vorkompilieren', cat: 're',
      desc: 'Übersetzt das Muster einmal und liefert ein Pattern-Objekt mit allen Methoden. Lohnt sich in Schleifen und macht den Code lesbarer.',
      py: 'ZAHL = re.compile(r"\\d+(?:[.,]\\d+)?")\nfor zeile in zeilen:\n    print(ZAHL.findall(zeile))',
      tags: ['compile', 'performance', 'pattern']
    },
    {
      sym: 're.IGNORECASE …', title: 'Die Flag-Konstanten', cat: 're',
      desc: 'Langformen der Flags: re.IGNORECASE (I), re.MULTILINE (M), re.DOTALL (S), re.VERBOSE (X), re.ASCII (A).',
      py: 're.findall(muster, text, re.IGNORECASE | re.MULTILINE)',
      tags: ['flags', 'konstanten']
    },

    /* ===================== MATCH-OBJEKT ===================== */
    {
      sym: 'm.group()', title: 'Der ganze Treffer', cat: 'match',
      desc: 'Ohne Argument (oder mit 0) den kompletten Treffer, mit Zahl die jeweilige Gruppe.',
      py: 'm = re.search(r"(\\d+)-(\\d+)", "Zeitraum 2019-2024")\nm.group()    # "2019-2024"\nm.group(1)   # "2019"\nm.group(2)   # "2024"',
      tags: ['group', 'treffer']
    },
    {
      sym: 'm.groups()', title: 'Alle Gruppen als Tupel', cat: 'match',
      desc: 'Liefert ein Tupel mit allen Gruppen — ohne den Gesamttreffer.',
      py: 'm.groups()   # ("2019", "2024")',
      tags: ['groups', 'tupel']
    },
    {
      sym: 'm.groupdict()', title: 'Benannte Gruppen als dict', cat: 'match',
      desc: 'Nur für benannte Gruppen — perfekt, um daraus direkt eine Zeile für einen DataFrame zu bauen.',
      py: 'm = re.search(r"(?P<tag>\\d{2})\\.(?P<monat>\\d{2})", "24.12.")\nm.groupdict()   # {"tag": "24", "monat": "12"}',
      tags: ['groupdict', 'dict', 'benannt']
    },
    {
      sym: 'm.span()', title: 'Position des Treffers', cat: 'match',
      desc: 'Tupel (start, ende). Einzeln über m.start() und m.end() erreichbar, auch pro Gruppe: m.span(1).',
      py: 'm.span()    # (9, 18)\nm.start()   # 9\nm.end()     # 18',
      tags: ['span', 'position', 'index']
    },
    {
      sym: 'if m := re.search(...)', title: 'Walross-Operator', cat: 'match',
      desc: 'Suchen und Prüfen in einem Schritt — spart die Zwischenvariable und ist der übliche Stil ab Python 3.8.',
      py: 'if m := re.search(r"\\d+", text):\n    print(m.group())',
      tags: ['walrus', 'idiom']
    },

    /* ===================== PANDAS ===================== */
    {
      sym: '.str.contains(muster)', title: 'Zeilen filtern', cat: 'pandas',
      desc: 'Boolesche Maske: Enthält der Text das Muster? Damit filtert man einen DataFrame.',
      py: 'df[df["text"].str.contains(r"\\bfehler\\b", case=False, na=False)]',
      note: 'na=False nicht vergessen, sonst werfen fehlende Werte einen Fehler.',
      tags: ['contains', 'filter', 'maske']
    },
    {
      sym: '.str.extract(muster)', title: 'Gruppen in Spalten', cat: 'pandas',
      desc: 'Zieht die Capture-Gruppen des ersten Treffers heraus — eine Spalte pro Gruppe. Benannte Gruppen werden zu Spaltennamen.',
      py: 'df["datei"].str.extract(r"(?P<name>\\w+)\\.(?P<endung>\\w+)")',
      tags: ['extract', 'spalten', 'gruppen']
    },
    {
      sym: '.str.extractall(muster)', title: 'Alle Treffer je Zeile', cat: 'pandas',
      desc: 'Wie extract, behält aber jeden Treffer — Ergebnis ist ein MultiIndex-DataFrame.',
      py: 'df["text"].str.extractall(r"(\\d+)")',
      tags: ['extractall', 'mehrfach']
    },
    {
      sym: '.str.replace(muster, ersatz, regex=True)', title: 'Spalte bereinigen', cat: 'pandas',
      desc: 'Ersetzt per Regex in der ganzen Spalte. Seit pandas 2 muss regex=True explizit gesetzt werden.',
      py: 'df["preis"] = df["preis"].str.replace(r"[^\\d,.]", "", regex=True)',
      tags: ['replace', 'cleaning', 'bereinigen']
    },
    {
      sym: '.str.findall(muster)', title: 'Trefferliste je Zelle', cat: 'pandas',
      desc: 'Liefert pro Zeile eine Liste aller Treffer.',
      py: 'df["tags"] = df["text"].str.findall(r"#\\w+")',
      tags: ['findall', 'liste']
    },
    {
      sym: '.str.match / .fullmatch', title: 'Format prüfen', cat: 'pandas',
      desc: 'match prüft ab Zeilenanfang, fullmatch verlangt die komplette Zelle. Zum Validieren von Spaltenformaten.',
      py: 'gueltig = df["plz"].str.fullmatch(r"\\d{5}")',
      tags: ['validierung', 'match']
    },
    {
      sym: '.str.count(muster)', title: 'Treffer zählen', cat: 'pandas',
      desc: 'Zählt die Treffer pro Zelle — praktisch als Feature für ein Modell.',
      py: 'df["anz_zahlen"] = df["text"].str.count(r"\\d+")',
      tags: ['count', 'feature']
    },
    {
      sym: '.str.split(muster, expand=True)', title: 'Zerlegen in Spalten', cat: 'pandas',
      desc: 'Zerlegt per Regex und verteilt die Teile mit expand=True auf eigene Spalten.',
      py: 'df["ort"].str.split(r"\\s*,\\s*", expand=True, regex=True)',
      tags: ['split', 'expand']
    },
    {
      sym: 'df.filter(regex=...)', title: 'Spalten per Regex wählen', cat: 'pandas',
      desc: 'Wählt Spalten anhand ihres Namens aus — nützlich bei breiten Tabellen.',
      py: 'df.filter(regex=r"^wert_\\d+$")',
      tags: ['filter', 'spalten']
    },

    /* ===================== REZEPTE ===================== */
    {
      sym: '\\b\\d+\\b', title: 'Ganze Zahlen', cat: 'recipes',
      desc: 'Nur vollständige Zahlen, nicht Teile von 3.14 oder abc123.',
      pattern: '\\b\\d+\\b', text: 'Werte 42, 3.14 und x7', fn: 'findall',
      tags: ['zahl', 'integer']
    },
    {
      sym: '\\d+(?:[.,]\\d+)?', title: 'Dezimalzahl', cat: 'recipes',
      desc: 'Zahl mit optionalen Nachkommastellen, Punkt oder Komma als Trenner.',
      pattern: '\\d+(?:[.,]\\d+)?', text: 'Preise: 2,50 · 3.20 · 10', fn: 'findall',
      tags: ['dezimal', 'komma', 'preis']
    },
    {
      sym: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)', title: 'Geldbetrag', cat: 'recipes',
      desc: 'Der „Find the money“-Klassiker: Betrag plus Währung in allen Schreibweisen.',
      pattern: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)', text: 'A gab 200 euro, das Gerät ist 100Euro wert, dazu 20.50 Euros und 0,50 euro Trinkgeld, am liebsten 500 € pro Tag.', fn: 'findall',
      note: 'Die nicht-fangende Gruppe (?: ) ist hier entscheidend — mit ( ) gäbe findall nur die Währung zurück.',
      tags: ['geld', 'euro', 'währung', 'money']
    },
    {
      sym: '\\d+(?=\\s*(?:€|[Ee]uros?))', title: 'Nur der Betrag ohne Währung', cat: 'recipes',
      desc: 'Lookahead statt Gruppe: die Währung wird geprüft, aber nicht mit ausgegeben.',
      pattern: '\\d+(?:[.,]\\d+)?(?=\\s*(?:€|[Ee]uros?))', text: '100 Euro, 200 euros, 300euro, 400Euros', fn: 'findall',
      tags: ['lookahead', 'geld']
    },
    {
      sym: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', title: 'E-Mail-Adresse', cat: 'recipes',
      desc: 'Pragmatische Variante — deckt den Alltag ab. Eine wirklich vollständige E-Mail-Regex ist absurd lang.',
      pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', text: 'Schreib an max.mustermann+news@uni-koeln.de oder info@test.io', fn: 'findall',
      tags: ['email', 'mail']
    },
    {
      sym: 'https?://\\S+', title: 'URL', cat: 'recipes',
      desc: 'Grobe, aber robuste URL-Erkennung in Fließtext.',
      pattern: 'https?://[^\\s<>"]+', text: 'Siehe https://regex101.com und http://example.org/pfad?x=1', fn: 'findall',
      tags: ['url', 'link', 'http']
    },
    {
      sym: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', title: 'IP-Adresse', cat: 'recipes',
      desc: 'Vier Zahlengruppen mit Punkten. Prüft nicht, ob die Zahlen ≤ 255 sind — für Logfiles reicht das meist.',
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', text: 'Zugriff von 192.168.0.42 und 10.0.0.1', fn: 'findall',
      tags: ['ip', 'log', 'netzwerk']
    },
    {
      sym: '\\d{2}\\.\\d{2}\\.\\d{4}', title: 'Datum (deutsch)', cat: 'recipes',
      desc: 'TT.MM.JJJJ. Für ISO-Datum: \\d{4}-\\d{2}-\\d{2}.',
      pattern: '\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}', text: 'Abgabe am 24.12.2025, Klausur 7.2.26', fn: 'findall',
      tags: ['datum', 'date']
    },
    {
      sym: '\\d{1,2}:\\d{2}(?::\\d{2})?', title: 'Uhrzeit', cat: 'recipes',
      desc: 'hh:mm mit optionalen Sekunden.',
      pattern: '\\d{1,2}:\\d{2}(?::\\d{2})?', text: 'Start 9:00, Ende 17:30:45', fn: 'findall',
      tags: ['zeit', 'uhrzeit']
    },
    {
      sym: '<[^>]+>', title: 'HTML-Tag', cat: 'recipes',
      desc: 'Alles zwischen spitzen Klammern. [^>]+ ist hier besser als .+?, weil es gar nicht erst über das > hinausläuft.',
      pattern: '<[^>]+>', text: '<div class="a">Text</div>', fn: 'findall',
      note: 'Für echtes HTML-Parsen gehört BeautifulSoup her — Regex reicht nur für simple Fälle.',
      tags: ['html', 'tag']
    },
    {
      sym: 'href="([^"]+)"', title: 'Link-Ziel extrahieren', cat: 'recipes',
      desc: 'Die Gruppe holt nur den Inhalt der Anführungszeichen heraus.',
      pattern: '<a[^>]*href="([^"]+)"', text: '<a class="x" href="page.html">Link</a>', fn: 'findall',
      tags: ['html', 'link', 'href']
    },
    {
      sym: '#\\w+', title: 'Hashtag', cat: 'recipes',
      desc: 'Alles nach einer Raute bis zum nächsten Nicht-Wortzeichen.',
      pattern: '#\\w+', text: 'Loving #Python and #Regex101!', fn: 'findall',
      tags: ['hashtag', 'social']
    },
    {
      sym: '\\bun\\w+', title: 'Wörter mit Präfix', cat: 'recipes',
      desc: 'Alle Wörter, die mit einer bestimmten Silbe beginnen — hier „un“.',
      pattern: '\\bun\\w+', text: 'unglaublich unfair, aber verständlich', fn: 'findall',
      tags: ['präfix', 'prefix', 'anfang']
    },
    {
      sym: '\\b\\w+ing\\b', title: 'Wörter mit Endung', cat: 'recipes',
      desc: 'Alle Wörter mit einem bestimmten Suffix.',
      pattern: '\\b\\w+ing\\b', text: 'running, jumping, run, sing', fn: 'findall',
      tags: ['suffix', 'endung']
    },
    {
      sym: '\\b[A-Z]{2,}\\b', title: 'Abkürzungen', cat: 'recipes',
      desc: 'Zwei oder mehr Großbuchstaben am Stück.',
      pattern: '\\b[A-Z]{2,}\\b', text: 'In den USA und der EU gilt die DSGVO.', fn: 'findall',
      tags: ['abkürzung', 'akronym']
    },
    {
      sym: '\\b\\w*\\d\\w*\\b', title: 'Wörter mit Ziffer', cat: 'recipes',
      desc: 'Tokens, in denen irgendwo eine Ziffer steckt — typisch für Versionsnummern und IDs.',
      pattern: '\\b\\w*\\d\\w*\\b', text: 'version2 alpha3 beta', fn: 'findall',
      tags: ['version', 'id']
    },
    {
      sym: '(\\w)\\1', title: 'Doppelte Buchstaben', cat: 'recipes',
      desc: 'Rückverweis auf die eigene Gruppe.',
      pattern: '(\\w)\\1', text: 'cool, Schifffahrt, Ebbe', fn: 'findall',
      tags: ['doppelt', 'backreference']
    },
    {
      sym: '\\b(\\w+)\\s+\\1\\b', title: 'Doppelte Wörter', cat: 'recipes',
      desc: 'Findet versehentliche Wortdopplungen — der Lektorats-Klassiker.',
      pattern: '\\b(\\w+)\\s+\\1\\b', text: 'Das ist ist ein Test test.', flags: 'i', fn: 'findall',
      tags: ['dopplung', 'lektorat']
    },
    {
      sym: '(?<=dark\\s)\\w+', title: 'Wort nach einem Wort', cat: 'recipes',
      desc: 'Kontextanalyse: Welche Wörter folgen auf „dark“? Genau die Aufgabe aus dem Praktikum.',
      pattern: '(?<=dark\\s)\\w+', text: 'the dark sky, a dark shape, dark water', fn: 'findall',
      note: 'Alternative ohne Lookbehind: r"dark\\s(\\w+)" — dann liefert findall die Gruppe.',
      tags: ['kontext', 'nachbarwort', 'lookbehind']
    },
    {
      sym: '[^.?!]+[.?!]', title: 'Sätze zerlegen', cat: 'recipes',
      desc: 'Grobe Satztrennung: alles bis zum nächsten Satzzeichen, das Satzzeichen inklusive.',
      pattern: '[^.?!]+[.?!]', text: "Hallo. Wie geht's? Gut!", fn: 'findall',
      note: 'Sauberer: split an einem Satzzeichen, dem ein Leerzeichen und ein Großbuchstabe folgen.',
      tags: ['satz', 'sentence', 'trennen']
    },
    {
      sym: '(?<=[.!?])\\s+(?=[A-Z])', title: 'Satztrennung per split', cat: 'recipes',
      desc: 'Trennt genau an der Lücke zwischen Satzzeichen und nächstem Großbuchstaben — die Satzzeichen bleiben am Satz.',
      pattern: '(?<=[.!?])\\s+(?=[A-Z])', text: 'Er kam. Sie ging! Warum? Keiner weiß es.', fn: 'split',
      py: 'sentences = re.split(r"(?<=[.!?])\\s+(?=[A-Z])", text)',
      tags: ['satz', 'split', 'lookaround']
    },
    {
      sym: '\\b[a-zA-ZäöüÄÖÜß]+\\b', title: 'Nur Wörter (keine Zahlen)', cat: 'recipes',
      desc: 'Für Wortzählungen: reine Buchstabenfolgen, deutsche Umlaute inklusive.',
      pattern: "\\b[a-zA-ZäöüÄÖÜß']+\\b", text: 'Über 42 schöne Wörter, don\'t stop', fn: 'findall',
      py: 'woerter = re.findall(r"\\b[a-zA-ZäöüÄÖÜß]+\\b", text)\nprint(len(woerter), len(set(woerter)))',
      tags: ['wortzählung', 'wortschatz', 'tokens']
    },
    {
      sym: '\\s+', title: 'Whitespace normalisieren', cat: 'recipes',
      desc: 'Der wohl häufigste Cleaning-Schritt: mehrfache Leerräume zu einem einzigen Leerzeichen.',
      pattern: '\\s+', repl: ' ', text: 'zu   viel\n\tLuft   hier', fn: 'sub',
      py: 'text = re.sub(r"\\s+", " ", text).strip()',
      tags: ['cleaning', 'whitespace', 'normalisieren']
    },
    {
      sym: '[^\\w\\s]', title: 'Satzzeichen entfernen', cat: 'recipes',
      desc: 'Alles wegwerfen, was weder Wortzeichen noch Leerraum ist — Standard vor einer Worthäufigkeitsanalyse.',
      pattern: '[^\\w\\s]', repl: '', text: 'Hallo, Welt! Geht\'s?', fn: 'sub',
      py: 'sauber = re.sub(r"[^\\w\\s]", "", text.lower())',
      tags: ['cleaning', 'nlp', 'tokenisierung']
    },
    {
      sym: '\\d+\\s?(?:kg|g|t|m|cm)\\b', title: 'Zahl mit Einheit', cat: 'recipes',
      desc: 'Messwerte samt Einheit, mit oder ohne Leerzeichen.',
      pattern: '\\d+(?:[.,]\\d+)?\\s?(?:kg|g|t|cm|m)\\b', text: '50 kg, 100g und 1,8 m', fn: 'findall',
      tags: ['einheit', 'messwert']
    },
    {
      sym: '^(\\w+)\\s+(\\d+)$', title: 'Zeile in Felder zerlegen', cat: 'recipes',
      desc: 'Zeilenweises Parsen mit mehreren Gruppen — findall liefert dann Tupel.',
      pattern: '^(\\w+)\\s+(\\d+)$', flags: 'm', text: 'apfel 12\nbirne 7\nkirsche 30', fn: 'findall',
      tags: ['parsen', 'zeilen', 'tupel']
    },
    {
      sym: '(?P<level>INFO|WARN|ERROR)', title: 'Logzeile parsen', cat: 'recipes',
      desc: 'Benannte Gruppen machen aus einer Logzeile direkt ein Dictionary.',
      pattern: '(?P<zeit>\\d{2}:\\d{2}:\\d{2})\\s+(?P<level>INFO|WARN|ERROR)\\s+(?P<msg>.+)', text: '09:12:01 INFO Start\n09:12:05 ERROR Verbindung verloren', flags: 'm', fn: 'finditer',
      py: 'for m in PATTERN.finditer(log):\n    rows.append(m.groupdict())\ndf = pd.DataFrame(rows)',
      tags: ['log', 'parsen', 'dataframe']
    },
    {
      sym: '\\b\\d{5}\\b', title: 'Deutsche Postleitzahl', cat: 'recipes',
      desc: 'Genau fünf Ziffern als eigenständiges Token.',
      pattern: '\\b\\d{5}\\b', text: '50667 Köln, nicht 123456', fn: 'findall',
      tags: ['plz', 'postleitzahl']
    },
    {
      sym: '(?<!\\S)-?\\d+(?!\\S)', title: 'Zahl als eigenes Token', cat: 'recipes',
      desc: 'Auch negative Zahlen, aber nur wenn links und rechts Leerraum steht. \\b würde beim Minus versagen.',
      pattern: '(?<!\\S)-?\\d+(?!\\S)', text: 'Werte: -5 12 x9 -3', fn: 'findall',
      tags: ['negativ', 'minus', 'zahl']
    },

    /* ===================== STOLPERFALLEN ===================== */
    {
      sym: 'findall + Gruppen', title: 'Die Gruppenfalle', cat: 'traps',
      desc: 'Sobald das Muster fangende Klammern enthält, gibt findall nicht mehr die Treffer zurück, sondern die Gruppen. Bei mehreren Gruppen kommen Tupel.',
      pattern: '(\\d+)\\s?(Euro)', text: '100 Euro und 200Euro', fn: 'findall',
      note: 'Abhilfe: (?: … ) verwenden — oder finditer nehmen und m.group() lesen.',
      tags: ['findall', 'gruppen', 'falle']
    },
    {
      sym: 'match ≠ fullmatch', title: 'match prüft nur den Anfang', cat: 'traps',
      desc: 're.match verankert das Muster am Stringanfang, der Rest darf beliebig sein. Vollständige Übereinstimmung liefert nur re.fullmatch.',
      py: 're.match(r"\\d+", "50 Euro")      # Treffer!\nre.fullmatch(r"\\d+", "50 Euro")  # None',
      note: 'Diese Verwechslung steht sogar in vielen Skripten falsch drin.',
      tags: ['match', 'fullmatch', 'falle']
    },
    {
      sym: '.* frisst zu viel', title: 'Greedy überschießt', cat: 'traps',
      desc: 'Gierige Quantifizierer nehmen erst alles und geben nur widerwillig zurück. Zwischen zwei Anführungszeichen landet dann der ganze Text.',
      pattern: '".*"', text: '"eins" dazwischen "zwei"', fn: 'findall',
      note: 'Lösung: ".*?" (lazy) oder "[^"]*" (präzise) — Letzteres ist schneller.',
      tags: ['greedy', 'falle']
    },
    {
      sym: '. matcht kein \\n', title: 'Der Punkt hört an der Zeile auf', cat: 'traps',
      desc: 'Ohne re.S endet der Punkt am Zeilenumbruch. Muster über mehrere Zeilen scheitern lautlos.',
      pattern: 'Anfang.*Ende', text: 'Anfang\nEnde', fn: 'findall',
      note: 'Mit dem Flag re.S (DOTALL) klappt es. Probier es im Playground aus.',
      tags: ['dotall', 'zeilenumbruch', 'falle']
    },
    {
      sym: '| bindet zu schwach', title: 'Alternative ohne Klammern', cat: 'traps',
      desc: '^Hund|Katze$ bedeutet „(^Hund) oder (Katze$)“ — fast nie das Gemeinte. Alternativen gehören eingeklammert.',
      pattern: '^(?:Hund|Katze)$', flags: 'm', text: 'Hund\nKatze\nHundeleine', fn: 'findall',
      tags: ['alternative', 'klammern', 'falle']
    },
    {
      sym: '\\b und Umlaute', title: 'Wortgrenzen bei Umlauten', cat: 'traps',
      desc: 'In Python 3 zählen Umlaute zu \\w, alles passt. Mit re.A oder in vielen anderen Sprachen zerfällt „Größe“ dagegen in „Gr“ und „e“.',
      pattern: '\\b\\w+\\b', flags: 'a', text: 'Größe und Café', fn: 'findall',
      note: 'Lass das Flag a im Playground weg und vergleiche das Ergebnis.',
      tags: ['unicode', 'umlaute', 'ascii', 'falle']
    },
    {
      sym: '"\\d" ohne r', title: 'Vergessener Raw String', cat: 'traps',
      desc: 'Ohne r interpretiert Python die Escape-Sequenzen selbst. Bei \\d fällt das nicht auf, bei \\b (Backspace) schon.',
      py: 'print(len("\\b"))    # 1  -> Backspace-Zeichen\nprint(len(r"\\b"))   # 2  -> Backslash + b',
      tags: ['rawstring', 'falle']
    },
    {
      sym: 'sub mit "\\1"', title: 'Rückverweis im Ersatztext', cat: 'traps',
      desc: 'Auch der Ersatzstring braucht ein r davor, sonst kommt \\1 nie bei re an.',
      py: 're.sub(r"(\\d)(\\w)", r"\\2\\1", text)   # richtig\nre.sub(r"(\\d)(\\w)", "\\2\\1", text)    # kaputt',
      tags: ['sub', 'rawstring', 'falle']
    },
    {
      sym: '[A-z]', title: 'Der schiefe Bereich', cat: 'traps',
      desc: 'A-z umfasst nach Zeichencode auch [ \\ ] ^ _ ` — fast immer ein Tippfehler für [A-Za-z].',
      pattern: '[A-z]+', text: 'Hallo_Welt^2', fn: 'findall',
      tags: ['bereich', 'tippfehler', 'falle']
    },
    {
      sym: 'a{2,3}?', title: 'Zwei Bedeutungen von ?', cat: 'traps',
      desc: 'Ein ? nach einem Baustein macht ihn optional. Ein ? nach einem Quantifizierer macht ihn lazy. Gleiche Zeichen, völlig andere Wirkung.',
      pattern: 'a{2,3}?', text: 'aaaa', fn: 'findall',
      tags: ['lazy', 'optional', 'falle']
    },
    {
      sym: '(a+)+b', title: 'Katastrophales Backtracking', cat: 'traps',
      desc: 'Verschachtelte Quantifizierer über derselben Zeichenmenge lassen die Engine exponentiell viele Möglichkeiten durchprobieren. Bei langen Nicht-Treffern hängt das Programm.',
      note: 'Faustregel: keine Quantifizierer um Gruppen, die selbst quantifiziert sind. Statt (\\s|\\t)+ lieber [\\s\\t]+.',
      tags: ['performance', 'redos', 'backtracking', 'falle']
    },
    {
      sym: 'a? mit findall', title: 'Leere Treffer', cat: 'traps',
      desc: 'Muster, die auch nichts matchen können, liefern an jeder Position einen leeren String — die Liste ist plötzlich voller \'\'.',
      pattern: 'a?', text: 'aaab', fn: 'findall',
      note: 'Meist ist + statt * bzw. ? gemeint.',
      tags: ['leer', 'quantifizierer', 'falle']
    }
  ];
})(window);
