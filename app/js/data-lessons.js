/* =============================================================
   data-lessons.js — Der Lernpfad
   Blocktypen:
     p     Absatz (HTML erlaubt)
     h     Zwischenüberschrift
     demo  interaktives Beispiel { pattern, text, flags, fn, repl, cap }
     note  Kasten { kind: 'tip'|'warn'|'exam'|'py', html }
     code  Python-Schnipsel
     table { head:[], rows:[[]] }
     list  Aufzählung { items: [] }
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});

  RT.lessons = [

    /* ---------------------------------------------------------- */
    {
      id: 'was-ist-regex',
      title: 'Was eine Regex eigentlich ist',
      sub: 'Das Grundprinzip in fünf Minuten',
      minutes: 5,
      blocks: [
        { t: 'p', html: 'Ein <b>regulärer Ausdruck</b> (kurz: Regex) ist eine Suchanfrage, die nicht nach einem festen Text sucht, sondern nach einem <b>Muster</b>. Statt „finde das Wort 50“ sagst du „finde eine beliebige Ziffernfolge“.' },
        { t: 'p', html: 'Die Engine liest den Text von links nach rechts und versucht an jeder Position, das Muster passend zu machen. Klappt es, wird der Treffer notiert und die Suche geht dahinter weiter.' },
        { t: 'h', text: 'Der einfachste Fall: reiner Text' },
        { t: 'p', html: 'Zeichen ohne Sonderbedeutung stehen für sich selbst. Das Muster unten ist nichts weiter als eine Textsuche — bearbeite es ruhig, das Ergebnis aktualisiert sich sofort.' },
        { t: 'demo', pattern: 'Katze', text: 'Die Katze jagt eine andere Katze.', cap: 'Zwei Treffer, weil das Wort zweimal vorkommt.' },
        { t: 'h', text: 'Und jetzt mit Muster' },
        { t: 'p', html: '<code>\\d</code> steht für „eine Ziffer“. Das <code>+</code> dahinter bedeutet „mindestens eine, gern mehr“. Zusammen: eine zusammenhängende Zahl.' },
        { t: 'demo', pattern: '\\d+', text: 'Heute hat jemand 20 Bananen gekauft und 50 Euro bezahlt.', cap: 'Ohne das + bekämest du ["2","0","5","0"] — probier es aus.' },
        { t: 'note', kind: 'py', html: 'In Python steckt das alles im Modul <code>re</code>. Muster gehören <b>immer</b> in einen Raw String — also <code>r"\\d+"</code> statt <code>"\\d+"</code>. Sonst verarbeitet Python die Backslashes selbst, bevor <code>re</code> sie überhaupt sieht.' },
        { t: 'code', code: 'import re\n\ntext = "Heute hat jemand 20 Bananen gekauft und 50 Euro bezahlt."\nre.findall(r"\\d+", text)\n# ["20", "50"]' },
        { t: 'note', kind: 'tip', html: 'Alle Beispiele in diesem Trainer sind editierbar. Du lernst Regex nicht durch Lesen, sondern durch Kaputtmachen und Reparieren.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'zeichenklassen',
      title: 'Zeichenklassen',
      sub: 'Ein Platzhalter für eine ganze Zeichengruppe',
      minutes: 7,
      blocks: [
        { t: 'p', html: 'Eine Zeichenklasse steht für <b>genau ein</b> Zeichen aus einer Menge. Für die häufigsten Mengen gibt es Kurzformen:' },
        { t: 'table', head: ['Kurzform', 'Bedeutung', 'entspricht'], rows: [
          ['<code>\\d</code>', 'eine Ziffer', '<code>[0-9]</code>'],
          ['<code>\\w</code>', 'Buchstabe, Ziffer oder Unterstrich', '<code>[a-zA-Z0-9_]</code> + Umlaute'],
          ['<code>\\s</code>', 'Leerraum', 'Space, Tab, Zeilenumbruch'],
          ['<code>.</code>', 'irgendein Zeichen', 'alles außer <code>\\n</code>']
        ] },
        { t: 'p', html: 'Der Großbuchstabe kehrt die Bedeutung um: <code>\\D</code> ist „keine Ziffer“, <code>\\W</code> „kein Wortzeichen“, <code>\\S</code> „kein Leerraum“.' },
        { t: 'demo', pattern: '\\w+', text: '#Python_3 ist für Anfänger geeignet!', cap: 'Beachte: die Raute und das Ausrufezeichen fehlen — sie sind keine Wortzeichen. Der Unterstrich dagegen gehört dazu.' },
        { t: 'h', text: 'Eigene Mengen mit eckigen Klammern' },
        { t: 'p', html: 'Reicht die Kurzform nicht, baust du dir mit <code>[ ]</code> eine eigene Menge. Ein <code>^</code> direkt hinter der Klammer negiert sie, ein Bindestrich spannt einen Bereich auf.' },
        { t: 'demo', pattern: '[aeiou]', text: 'Haus am Meer', cap: 'Ändere es zu [^aeiou ] und beobachte, was passiert.' },
        { t: 'demo', pattern: '[A-Za-z]+', text: 'Test123 mit 45 Zahlen', cap: 'Zwei Bereiche in einer Menge.' },
        { t: 'note', kind: 'warn', html: 'Innerhalb von <code>[ ]</code> verlieren fast alle Metazeichen ihre Bedeutung. <code>[.]</code> ist ein echter Punkt, <code>[+*]</code> sind Plus und Stern. Nur <code>]</code>, <code>\\</code>, <code>^</code> (vorn) und <code>-</code> (in der Mitte) brauchen noch einen Backslash.' },
        { t: 'h', text: 'Der Unicode-Unterschied' },
        { t: 'p', html: 'Python 3 ist unicode-bewusst: <code>\\w</code> erfasst auch <code>ä ö ü é</code>. Mit dem Flag <code>re.A</code> beschränkt sich alles auf ASCII — dann zerfällt „Größe“ in zwei Stücke.' },
        { t: 'demo', pattern: '\\w+', text: 'Größe und Café', cap: 'Setze im Playground das Flag a — dann siehst du den Unterschied sofort.' },
        { t: 'note', kind: 'exam', html: 'Klausurfrage-Material: „Was liefert <code>re.findall(r\'\\w+\', \'Größe\')</code>?“ In Python 3: <code>[\'Größe\']</code>. In vielen anderen Sprachen: <code>[\'Gr\', \'e\']</code>.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'quantifizierer',
      title: 'Quantifizierer',
      sub: 'Wie oft soll das vorkommen?',
      minutes: 8,
      blocks: [
        { t: 'p', html: 'Ein Quantifizierer bezieht sich immer auf den <b>unmittelbar davorstehenden Baustein</b> — ein Zeichen, eine Klasse oder eine Gruppe.' },
        { t: 'table', head: ['Zeichen', 'Bedeutung'], rows: [
          ['<code>?</code>', 'null- oder einmal (optional)'],
          ['<code>*</code>', 'beliebig oft, auch keinmal'],
          ['<code>+</code>', 'mindestens einmal'],
          ['<code>{3}</code>', 'genau dreimal'],
          ['<code>{2,4}</code>', 'zwei- bis viermal'],
          ['<code>{2,}</code>', 'mindestens zweimal']
        ] },
        { t: 'demo', pattern: 'colou?r', text: 'Britisch colour, amerikanisch color.', cap: 'Das ? macht nur das u optional.' },
        { t: 'demo', pattern: '\\b\\w{5}\\b', text: 'Heute ist ein guter Tag zum Lernen', cap: 'Wörter mit genau fünf Zeichen.' },
        { t: 'h', text: 'Gierig gegen genügsam' },
        { t: 'p', html: 'Standardmäßig sind Quantifizierer <b>gierig</b>: sie nehmen erst so viel wie möglich und geben nur so viel zurück, wie nötig ist, damit der Rest des Musters noch passt.' },
        { t: 'demo', pattern: '".*"', text: 'Er sagte "hallo" und dann "tschüss".', cap: 'Ein einziger Treffer, der beide Zitate verschluckt — das ist Gier.' },
        { t: 'p', html: 'Ein angehängtes <code>?</code> macht den Quantifizierer <b>genügsam</b> (lazy): er nimmt so wenig wie möglich.' },
        { t: 'demo', pattern: '".*?"', text: 'Er sagte "hallo" und dann "tschüss".', cap: 'Jetzt zwei saubere Treffer.' },
        { t: 'note', kind: 'tip', html: 'Noch besser als lazy ist oft eine <b>negierte Klasse</b>: <code>"[^"]*"</code>. Die kann gar nicht erst über das Anführungszeichen hinauslaufen und ist deutlich schneller, weil die Engine nicht zurücksetzen muss.' },
        { t: 'note', kind: 'warn', html: '<code>*</code> und <code>?</code> können auch <i>nichts</i> matchen. <code>re.findall(r"a*", "baaa")</code> liefert deshalb leere Strings mit. Wenn du „mindestens eines“ meinst, nimm <code>+</code>.' },
        { t: 'demo', pattern: 'a*', text: 'baaa', cap: 'Die leeren Strings sind kein Bug — an jeder Position passt „nullmal a“.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'anker',
      title: 'Anker und Wortgrenzen',
      sub: 'Positionen statt Zeichen',
      minutes: 6,
      blocks: [
        { t: 'p', html: 'Anker matchen keine Zeichen, sondern <b>Positionen</b>. Sie verbrauchen nichts vom Text — sie stellen nur eine Bedingung an die Stelle, an der die Engine gerade steht.' },
        { t: 'table', head: ['Anker', 'Position'], rows: [
          ['<code>^</code>', 'Stringanfang (mit <code>re.M</code>: jeder Zeilenanfang)'],
          ['<code>$</code>', 'Stringende (mit <code>re.M</code>: jedes Zeilenende)'],
          ['<code>\\b</code>', 'Wortgrenze'],
          ['<code>\\B</code>', 'keine Wortgrenze — also mitten im Wort'],
          ['<code>\\A</code> / <code>\\Z</code>', 'absoluter Anfang / absolutes Ende, ignoriert <code>re.M</code>']
        ] },
        { t: 'h', text: '\\b ist der wichtigste Anker' },
        { t: 'p', html: 'Eine Wortgrenze liegt überall dort, wo ein Wortzeichen auf ein Nicht-Wortzeichen trifft — auch am String-Rand. Ohne <code>\\b</code> findest du „man“ mitten in „mankind“.' },
        { t: 'demo', pattern: 'man', text: 'A man in mankind, a woman too.', cap: 'Drei Treffer — zwei davon willst du gar nicht.' },
        { t: 'demo', pattern: '\\bman\\b', text: 'A man in mankind, a woman too.', cap: 'Jetzt nur noch das eigenständige Wort.' },
        { t: 'note', kind: 'exam', html: 'Genau das war die Wortzählaufgabe im Praktikum: „man / men, aber nicht mankind“. Die Lösung ist <code>r"\\b[Mm]e?[na]\\b"</code> oder simpler <code>r"\\b(?:man|men|Man|Men)\\b"</code>.' },
        { t: 'h', text: '^ und $ mit mehreren Zeilen' },
        { t: 'demo', pattern: '^\\w+', flags: 'm', text: 'Zeile eins\nZeile zwei\nZeile drei', cap: 'Mit dem Flag m gilt ^ an jedem Zeilenanfang. Nimm das m weg — dann bleibt ein Treffer.' },
        { t: 'note', kind: 'tip', html: 'Zum Validieren („ist die ganze Eingabe eine PLZ?“) brauchst du keine Anker: <code>re.fullmatch()</code> erledigt das. Anker sind für die Suche <i>im</i> Text da.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'gruppen',
      title: 'Gruppen und Alternativen',
      sub: 'Zusammenfassen, einfangen, auswählen',
      minutes: 9,
      blocks: [
        { t: 'p', html: 'Klammern erfüllen zwei Aufgaben gleichzeitig: Sie <b>fassen zusammen</b>, damit ein Quantifizierer sich auf mehrere Zeichen bezieht, und sie <b>fangen ein</b>, damit man den Teiltreffer später auslesen kann.' },
        { t: 'demo', pattern: '(ab)+', text: 'ababab und abc', cap: 'Der Quantifizierer bezieht sich auf die ganze Gruppe.' },
        { t: 'h', text: 'Der senkrechte Strich: oder' },
        { t: 'p', html: '<code>|</code> trennt Alternativen. Er bindet <b>sehr schwach</b> — er gilt bis zur nächsten Klammergrenze. Deshalb gehören Alternativen fast immer eingeklammert.' },
        { t: 'demo', pattern: '\\b(?:Hund|Katze|Maus)\\b', text: 'Hund, Katze und Vogel', cap: 'Ohne die Klammern würde \\b nur zum Hund gehören.' },
        { t: 'h', text: 'Die Gruppenfalle bei findall' },
        { t: 'p', html: 'Das ist der Punkt, an dem die meisten stolpern: <b>Sobald eine fangende Gruppe im Muster steht, ändert <code>findall</code> seine Rückgabe.</b>' },
        { t: 'table', head: ['Gruppen im Muster', 'findall liefert'], rows: [
          ['keine', 'Liste der vollständigen Treffer'],
          ['genau eine', 'Liste der Inhalte dieser einen Gruppe'],
          ['mehrere', 'Liste von Tupeln']
        ] },
        { t: 'demo', pattern: '(\\d+)\\s?(Euro)', text: '100 Euro und 200Euro', cap: 'Zwei Gruppen, also Tupel.' },
        { t: 'p', html: 'Willst du nur klammern, ohne einzufangen, nimm die <b>nicht-fangende Gruppe</b> <code>(?:…)</code>:' },
        { t: 'demo', pattern: '\\d+\\s?(?:Euro|euro)', text: '100 Euro und 200euro', cap: 'Jetzt kommen wieder die ganzen Treffer zurück.' },
        { t: 'h', text: 'Benannte Gruppen' },
        { t: 'p', html: 'Ab drei Gruppen verliert man den Überblick über die Nummern. Python schreibt benannte Gruppen als <code>(?P&lt;name&gt;…)</code>.' },
        { t: 'demo', pattern: '(?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})', text: 'Abgabe am 24.12.2025.', fn: 'finditer', cap: 'Klick auf den Treffer unten, um die Gruppen zu sehen.' },
        { t: 'code', code: 'm = re.search(r"(?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})", text)\nm.group("tag")   # "24"\nm.groupdict()    # {"tag": "24", "monat": "12", "jahr": "2025"}' },
        { t: 'note', kind: 'tip', html: '<code>m.groupdict()</code> plus <code>pd.DataFrame(rows)</code> ist der kürzeste Weg von rohem Text zu einer sauberen Tabelle.' },
        { t: 'h', text: 'Rückverweise' },
        { t: 'p', html: '<code>\\1</code> verlangt noch einmal <b>exakt denselben Text</b>, den Gruppe 1 gefunden hat.' },
        { t: 'demo', pattern: '(\\w)\\1', text: 'cool, Schifffahrt, Ebbe, egal', cap: 'Doppelte Buchstaben.' },
        { t: 'demo', pattern: '\\b(\\w+)\\s+\\1\\b', text: 'Das ist ist ein doppelt doppelt geschriebener Satz.', cap: 'Doppelte Wörter.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'lookaround',
      title: 'Lookaround',
      sub: 'Umschauen, ohne etwas mitzunehmen',
      minutes: 8,
      blocks: [
        { t: 'p', html: 'Lookarounds sind Bedingungen an die Umgebung. Sie prüfen, was links oder rechts steht — <b>ohne dass dieser Text Teil des Treffers wird</b>. Man nennt sie deshalb „nullbreit“.' },
        { t: 'table', head: ['Syntax', 'Bedeutung'], rows: [
          ['<code>(?=…)</code>', 'rechts davon muss … stehen'],
          ['<code>(?!…)</code>', 'rechts davon darf … nicht stehen'],
          ['<code>(?&lt;=…)</code>', 'links davon muss … stehen'],
          ['<code>(?&lt;!…)</code>', 'links davon darf … nicht stehen']
        ] },
        { t: 'h', text: 'Wozu das gut ist' },
        { t: 'p', html: 'Du willst die Zahl vor „Euro“, aber „Euro“ nicht im Ergebnis haben. Mit einer Gruppe ginge das auch — der Lookahead ist aber direkter.' },
        { t: 'demo', pattern: '\\d+(?=\\s?Euro)', text: '20 Euro, 30 Punkte, 40Euro', cap: 'Nur die Zahlen, die vor Euro stehen.' },
        { t: 'demo', pattern: '(?<=dark\\s)\\w+', text: 'the dark sky, a dark shape, the bright sun', cap: 'Kontextanalyse: Welches Wort folgt auf „dark“?' },
        { t: 'note', kind: 'warn', html: 'In Python muss ein <b>Lookbehind feste Länge</b> haben. <code>(?&lt;=ab)</code> geht, <code>(?&lt;=a+)</code> und <code>(?&lt;=ab|abc)</code> sind Fehler. Beim Lookahead gibt es diese Einschränkung nicht.' },
        { t: 'h', text: 'Bedingungen stapeln' },
        { t: 'p', html: 'Weil Lookarounds nichts verbrauchen, kann man mehrere hintereinander setzen. Alle müssen an derselben Stelle zutreffen — so prüft man mehrere Anforderungen gleichzeitig.' },
        { t: 'demo', pattern: '^(?=.*[A-Z])(?=.*\\d).{8,}$', flags: 'm', text: 'passwort\nPasswort\nPasswort1\nPw1', cap: 'Nur Zeilen mit Großbuchstabe, Ziffer und mindestens acht Zeichen.' },
        { t: 'note', kind: 'tip', html: 'Merksatz: Ein Lookaround ist eine <b>Frage an den Text</b>, kein Teil der Antwort.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 're-modul',
      title: 'Das Modul re',
      sub: 'Die Befehle und was sie zurückgeben',
      minutes: 9,
      blocks: [
        { t: 'p', html: 'Die Muster sind nur die halbe Miete. Welchen Befehl du nimmst, entscheidet über Form und Inhalt des Ergebnisses.' },
        { t: 'table', head: ['Befehl', 'Rückgabe', 'wofür'], rows: [
          ['<code>re.findall</code>', 'Liste von Strings (oder Tupeln)', 'alle Treffer, schnell weiterverarbeitbar'],
          ['<code>re.finditer</code>', 'Iterator über Match-Objekte', 'alle Treffer <b>mit Positionen und Gruppen</b>'],
          ['<code>re.search</code>', 'erstes Match-Objekt oder <code>None</code>', '„kommt das irgendwo vor?“'],
          ['<code>re.match</code>', 'Match-Objekt oder <code>None</code>', 'passt es <b>am Anfang</b>?'],
          ['<code>re.fullmatch</code>', 'Match-Objekt oder <code>None</code>', 'passt der <b>ganze</b> String? → Validierung'],
          ['<code>re.sub</code>', 'neuer String', 'ersetzen'],
          ['<code>re.split</code>', 'Liste', 'zerlegen'],
          ['<code>re.compile</code>', 'Pattern-Objekt', 'einmal übersetzen, oft benutzen']
        ] },
        { t: 'note', kind: 'exam', html: '<b>Häufig falsch dargestellt:</b> <code>re.match</code> prüft <u>nicht</u> auf vollständige Übereinstimmung, sondern nur, ob das Muster <b>am Anfang</b> passt. <code>re.match(r"\\d+", "50 Euro")</code> ist ein Treffer. Für „der ganze String“ gibt es <code>re.fullmatch</code>.' },
        { t: 'demo', pattern: '\\d+', text: '50 Euro kostet das', fn: 'match', cap: 'Stell unten auf fullmatch um — dann kommt None.' },
        { t: 'h', text: 'Ersetzen mit Rückverweisen' },
        { t: 'p', html: 'Im Ersatztext greifst du mit <code>\\1</code> auf Gruppe 1 zu, mit <code>\\g&lt;name&gt;</code> auf benannte Gruppen. Auch der Ersatztext gehört in einen Raw String.' },
        { t: 'demo', pattern: '(\\d+)\\.(\\d+)', repl: '\\1,\\2', text: 'Preise: 15.99 und 3.20', fn: 'sub', cap: 'Punkt zu Komma — mit vertauschbaren Teilen.' },
        { t: 'code', code: '# Ersatz kann auch eine Funktion sein:\ndef verdopple(m):\n    return str(int(m.group()) * 2)\n\nre.sub(r"\\d+", verdopple, "3 und 7")   # "6 und 14"' },
        { t: 'h', text: 'Zerlegen' },
        { t: 'demo', pattern: '[;,]\\s*', text: 'a, b;c,  d', fn: 'split', cap: 'Trennzeichen samt folgendem Leerraum.' },
        { t: 'note', kind: 'warn', html: 'Enthält das Split-Muster fangende Gruppen, landen deren Inhalte <b>mit in der Liste</b>. Manchmal praktisch, oft überraschend.' },
        { t: 'h', text: 'Vorkompilieren' },
        { t: 'code', code: 'ZAHL = re.compile(r"\\d+(?:[.,]\\d+)?")\n\nfor zeile in zeilen:\n    print(ZAHL.findall(zeile))     # kein Neuübersetzen pro Runde' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'flags',
      title: 'Flags',
      sub: 'Vier Schalter, die alles ändern',
      minutes: 5,
      blocks: [
        { t: 'p', html: 'Flags sind der dritte Parameter von fast allen <code>re</code>-Funktionen. Mehrere kombinierst du mit <code>|</code>.' },
        { t: 'table', head: ['Flag', 'Kurz', 'Wirkung'], rows: [
          ['<code>re.IGNORECASE</code>', '<code>re.I</code>', 'Groß-/Kleinschreibung egal'],
          ['<code>re.MULTILINE</code>', '<code>re.M</code>', '<code>^</code> und <code>$</code> gelten je Zeile'],
          ['<code>re.DOTALL</code>', '<code>re.S</code>', 'der Punkt matcht auch <code>\\n</code>'],
          ['<code>re.VERBOSE</code>', '<code>re.X</code>', 'Whitespace und <code>#</code>-Kommentare im Muster erlaubt'],
          ['<code>re.ASCII</code>', '<code>re.A</code>', '<code>\\w \\d \\b</code> nur ASCII']
        ] },
        { t: 'demo', pattern: 'euro', flags: 'i', text: '100 Euro, 200 euros, 300EURO', cap: 'Schalte das Flag i unten aus und wieder ein.' },
        { t: 'demo', pattern: 'Anfang.*Ende', flags: 's', text: 'Anfang\nEnde', cap: 'Ohne s scheitert das Muster am Zeilenumbruch.' },
        { t: 'h', text: 'Verbose: lange Muster lesbar halten' },
        { t: 'p', html: 'Mit <code>re.X</code> darfst du dein Muster umbrechen und kommentieren. Für alles, was länger als eine Zeile ist, lohnt sich das sofort.' },
        { t: 'code', code: 'GELD = re.compile(r"""\n    \\d+              # ganzzahliger Teil\n    (?:[.,]\\d+)?     # optionale Nachkommastellen\n    \\s*              # optionaler Abstand\n    (?:€|[Ee]uros?)  # Währung\n""", re.X)\n\nGELD.findall(text)' },
        { t: 'note', kind: 'tip', html: 'Im Verbose-Modus wird echter Leerraum ignoriert. Brauchst du ein Leerzeichen im Muster, schreib <code>\\ </code> oder <code>[ ]</code> oder <code>\\s</code>.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'strategie',
      title: 'Muster systematisch bauen',
      sub: 'Vom Beispiel zum Ausdruck',
      minutes: 7,
      blocks: [
        { t: 'p', html: 'Niemand schreibt eine komplexe Regex in einem Zug. Das übliche Vorgehen ist schrittweise:' },
        { t: 'list', items: [
          '<b>Beispiele sammeln.</b> Schreib dir drei Treffer und drei Nicht-Treffer auf. Ohne Gegenbeispiele merkst du nicht, dass du zu viel fängst.',
          '<b>Den einfachsten Fall matchen.</b> Erst <code>\\d+</code>, dann Nachkommastellen, dann die Währung.',
          '<b>Nach jedem Schritt testen.</b> Ein Muster, das drei Änderungen zurückliegt funktionierte, ist leichter zu reparieren als eins, das nie lief.',
          '<b>Fangen nur, wo nötig.</b> Sonst <code>(?:…)</code> — das hält <code>findall</code> berechenbar.',
          '<b>Verankern, wenn der Kontext zählt.</b> <code>\\b</code> ist meist die richtige Antwort auf „das findet zu viel“.'
        ] },
        { t: 'h', text: 'Ein Muster wachsen sehen' },
        { t: 'p', html: 'Ziel: alle Geldbeträge aus einem Fließtext. Der Text unten enthält absichtlich jede Schreibvariante.' },
        { t: 'demo', pattern: '\\d+', text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.', cap: 'Schritt 1 — alle Zahlen. Zu viel: die 50 kg sind dabei, und 20.50 zerfällt.' },
        { t: 'demo', pattern: '\\d+(?:[.,]\\d+)?', text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.', cap: 'Schritt 2 — Dezimalstellen halten zusammen. Die 50 kg stören noch.' },
        { t: 'demo', pattern: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)', text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.', cap: 'Schritt 3 — die Währung muss folgen. Fertig.' },
        { t: 'demo', pattern: '\\d+(?:[.,]\\d+)?(?=\\s*(?:€|[Ee]uros?))', text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.', cap: 'Variante — mit Lookahead bleibt die Währung draußen und du bekommst nur die Beträge.' },
        { t: 'note', kind: 'tip', html: 'Bau dein Muster im <b>Playground</b> und benutz die Erklärungs-Ansicht. Wenn du jeden Baustein benennen kannst, hast du es verstanden.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'praxis-ds',
      title: 'Regex in der Datenanalyse',
      sub: 'Wo es im Data-Science-Alltag auftaucht',
      minutes: 8,
      blocks: [
        { t: 'p', html: 'Regex ist selten Selbstzweck. In der Praxis begegnet es dir an vier Stellen: <b>Bereinigen</b>, <b>Extrahieren</b>, <b>Filtern</b> und <b>Zählen</b>.' },
        { t: 'h', text: '1. Bereinigen' },
        { t: 'demo', pattern: '\\s+', repl: ' ', text: 'zu   viel\n\tLuft    hier', fn: 'sub', cap: 'Der Standard-Cleaning-Schritt schlechthin.' },
        { t: 'code', code: 'text = re.sub(r"\\s+", " ", text).strip()\ntext = re.sub(r"[^\\w\\s]", "", text.lower())   # Satzzeichen raus' },
        { t: 'h', text: '2. Extrahieren' },
        { t: 'p', html: 'Aus halbstrukturiertem Text eine Tabelle machen — benannte Gruppen plus <code>groupdict()</code>:' },
        { t: 'demo', pattern: '(?P<zeit>\\d{2}:\\d{2}:\\d{2})\\s+(?P<level>INFO|WARN|ERROR)\\s+(?P<msg>.+)', flags: 'm', text: '09:12:01 INFO Start\n09:12:05 ERROR Verbindung verloren\n09:13:00 WARN Speicher knapp', fn: 'finditer', cap: 'Klick auf einen Treffer, um die Gruppen zu sehen.' },
        { t: 'code', code: 'rows = [m.groupdict() for m in PATTERN.finditer(log)]\ndf = pd.DataFrame(rows)' },
        { t: 'h', text: '3. Filtern in pandas' },
        { t: 'code', code: 'df[df["text"].str.contains(r"\\bfehler\\b", case=False, na=False)]\ndf["datei"].str.extract(r"(?P<name>\\w+)\\.(?P<endung>\\w+)")\ndf["preis"].str.replace(r"[^\\d,.]", "", regex=True)' },
        { t: 'note', kind: 'warn', html: 'Bei <code>.str.contains</code> immer <code>na=False</code> setzen, sonst stolpert die Maske über fehlende Werte. Und seit pandas 2 braucht <code>.str.replace</code> ein ausdrückliches <code>regex=True</code>.' },
        { t: 'h', text: '4. Zählen und auswerten' },
        { t: 'p', html: 'Die Textanalyse aus dem Praktikum in Kurzform:' },
        { t: 'code', code: 'woerter    = re.findall(r"\\b[a-zA-Z\']+\\b", text)\nwortschatz = set(woerter)\nsaetze     = re.split(r"(?<=[.!?])\\s+(?=[A-Z])", text)\n\nprint(len(woerter), "Wörter,", len(wortschatz), "verschiedene")\nprint(len(saetze), "Sätze")\n\n# Häufigkeit eines Begriffs, unabhängig von Groß-/Kleinschreibung\nfor person in ["i", "you", "he", "she", "they", "we"]:\n    n = len(re.findall(fr"\\b{person}\\b", text.lower()))\n    print(f"{person}: {n}")' },
        { t: 'note', kind: 'tip', html: 'Für Worthäufigkeiten reicht <code>collections.Counter(woerter)</code>. Regex holt die Tokens, Python zählt sie — jedes Werkzeug für das, was es kann.' },
        { t: 'note', kind: 'exam', html: 'Wenn du bis hier gekommen bist: geh in den <b>Trainingsbereich</b>. Lesen erzeugt Wiedererkennung, Schreiben erzeugt Können — und in der Klausur musst du schreiben.' }
      ]
    }
  ];
})(window);
