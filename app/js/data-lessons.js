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
        { t: 'note', kind: 'py', html: 'Dieser Lernpfad beschreibt <b>Python 3.14</b> und das Standardmodul <code>re</code> für Unicode-Strings (<code>str</code>). Versionsabhängige Unterschiede sind ausdrücklich markiert.' },
        { t: 'p', html: 'Ein <b>regulärer Ausdruck</b> (kurz: Regex) ist eine Suchanfrage, die nicht nach einem festen Text sucht, sondern nach einem <b>Muster</b>. Statt „finde das Wort 50“ sagst du „finde eine beliebige Ziffernfolge“.' },
        { t: 'p', html: 'Die Engine liest den Text von links nach rechts und versucht an jeder Position, das Muster passend zu machen. Klappt es, wird der Treffer notiert und die Suche geht dahinter weiter.' },
        { t: 'h', text: 'Der einfachste Fall: reiner Text' },
        { t: 'p', html: 'Zeichen ohne Sonderbedeutung stehen für sich selbst. Das Muster unten ist nichts weiter als eine Textsuche — bearbeite es ruhig, das Ergebnis aktualisiert sich sofort.' },
        { t: 'demo', pattern: 'Katze', text: 'Die Katze jagt eine andere Katze.', cap: 'Zwei Treffer, weil das Wort zweimal vorkommt.' },
        { t: 'h', text: 'Und jetzt mit Muster' },
        { t: 'p', html: '<code>\\d</code> steht für „eine Ziffer“. Das <code>+</code> dahinter bedeutet „mindestens eine, gern mehr“. Zusammen: eine zusammenhängende Zahl.' },
        { t: 'demo', pattern: '\\d+', text: 'Heute hat jemand 20 Bananen gekauft und 50 Euro bezahlt.', cap: 'Ohne das + bekämest du ["2","0","5","0"] — probier es aus.' },
        { t: 'note', kind: 'py', html: 'In Python steckt das alles im Modul <code>re</code>. Für Muster mit Backslashes sind <b>Raw Strings die empfohlene Schreibweise</b>: <code>r"\\d+"</code>. Gewöhnliche Strings können zwar funktionieren, Python verarbeitet ihre Escape-Sequenzen aber zuerst — aus <code>"\\b"</code> wird beispielsweise ein Backspace-Zeichen.' },
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
          ['<code>\\d</code>', 'eine Unicode-Dezimalziffer', '<code>[0-9]</code> nur mit <code>re.A</code>'],
          ['<code>\\w</code>', 'Unicode-Buchstabe oder -Zahl, plus Unterstrich', '<code>[a-zA-Z0-9_]</code> nur mit <code>re.A</code>'],
          ['<code>\\s</code>', 'Unicode-Leerraum', 'z. B. Space, Tab, Zeilenumbruch'],
          ['<code>.</code>', 'irgendein Zeichen', 'alles außer <code>\\n</code>']
        ] },
        { t: 'p', html: 'Der Großbuchstabe kehrt die Bedeutung um: <code>\\D</code> ist „keine Ziffer“, <code>\\W</code> „kein Wortzeichen“, <code>\\S</code> „kein Leerraum“.' },
        { t: 'demo', pattern: '\\w+', text: '#Python_3 ist für Anfänger geeignet!', cap: 'Beachte: die Raute und das Ausrufezeichen fehlen — sie sind keine Wortzeichen. Der Unterstrich dagegen gehört dazu.' },
        { t: 'h', text: 'Eigene Mengen mit eckigen Klammern' },
        { t: 'p', html: 'Reicht die Kurzform nicht, baust du dir mit <code>[ ]</code> eine eigene Menge. Ein <code>^</code> direkt hinter der Klammer negiert sie, ein Bindestrich spannt einen Bereich auf.' },
        { t: 'demo', pattern: '[aeiou]', text: 'Haus am Meer', cap: 'Ändere es zu [^aeiou ] und beobachte, was passiert.' },
        { t: 'demo', pattern: '[A-Za-z]+', text: 'Test123 mit 45 Zahlen', cap: 'Zwei Bereiche in einer Menge.' },
        { t: 'note', kind: 'warn', html: 'Innerhalb von <code>[ ]</code> verlieren fast alle Metazeichen ihre Bedeutung. <code>[.]</code> ist ein echter Punkt, <code>[+*]</code> sind Plus und Stern. Sonderbehandlung brauchen vor allem <code>\\</code>, <code>]</code>, <code>^</code> an erster Stelle und <code>-</code> zwischen Zeichen; <code>]</code> und <code>-</code> lassen sich je nach Position auch ohne Backslash wörtlich schreiben.' },
        { t: 'h', text: 'Der Unicode-Unterschied' },
        { t: 'p', html: 'Python ist bei <code>str</code>-Mustern standardmäßig unicode-bewusst: <code>\\w</code> erfasst beispielsweise <code>ä ö ü é</code>, und <code>\\d</code> auch Dezimalziffern wie <code>٣</code>. Mit <code>re.A</code> (ASCII) werden die Kurzformen auf ASCII beschränkt — dann zerfällt „Größe“ in zwei Stücke und <code>\\d</code> entspricht <code>[0-9]</code>.' },
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
        { t: 'note', kind: 'tip', html: 'Noch klarer als lazy ist hier eine <b>negierte Klasse</b>: <code>"[^"]*"</code>. Die kann strukturell nicht über das Anführungszeichen hinauslaufen und ist häufig effizienter.' },
        { t: 'note', kind: 'warn', html: '<code>*</code> und <code>?</code> können auch <i>nichts</i> matchen. <code>re.findall(r"a*", "baaa")</code> liefert deshalb leere Strings mit. Wenn du „mindestens eines“ meinst, nimm <code>+</code>.' },
        { t: 'demo', pattern: 'a*', text: 'baaa', cap: 'Die leeren Strings sind kein Bug: Vor dem b und am Stringende gibt es jeweils einen leeren Treffer; die a-Folge dazwischen wird gierig als ein Treffer genommen.' }
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
          ['<code>\\A</code> / <code>\\z</code>', 'absoluter Anfang / absolutes Ende, ignoriert <code>re.M</code>']
        ] },
        { t: 'h', text: '\\b ist der wichtigste Anker' },
        { t: 'p', html: 'Eine Wortgrenze liegt überall dort, wo ein Wortzeichen auf ein Nicht-Wortzeichen trifft — auch am String-Rand. Ohne <code>\\b</code> findest du „man“ mitten in „mankind“.' },
        { t: 'demo', pattern: 'man', text: 'A man in mankind, a woman too.', cap: 'Drei Treffer — zwei davon willst du gar nicht.' },
        { t: 'demo', pattern: '\\bman\\b', text: 'A man in mankind, a woman too.', cap: 'Jetzt nur noch das eigenständige Wort.' },
        { t: 'note', kind: 'exam', html: 'Genau das war die Wortzählaufgabe im Praktikum: „man / men, aber nicht mankind“. Eine kompakte Lösung ist <code>re.findall(r"\\b(?:man|men)\\b", text, re.I)</code>. Ohne Flag geht auch <code>r"\\b[Mm][ae]n\\b"</code>.' },
        { t: 'note', kind: 'py', html: '<code>\\z</code> wurde in <b>Python 3.14</b> ergänzt und steht exakt für das Stringende. <code>\\Z</code> ist dort ein kompatibler Alias; in älteren Python-Versionen verwendest du <code>\\Z</code>.' },
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
        { t: 'demo', pattern: '\\b(?:Hund|Katze|Maus)\\b', text: 'Hund, Katze und Vogel', cap: 'Ohne die Klammern würden die beiden Wortgrenzen nicht mehr alle drei Alternativen gemeinsam umschließen.' },
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
        { t: 'p', html: 'Im Ersatztext greifst du mit <code>\\1</code> auf Gruppe 1 zu, mit <code>\\g&lt;name&gt;</code> auf benannte Gruppen. Auch für Ersatztexte mit Rückverweisen sind Raw Strings die sichere Schreibweise.' },
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
      sub: 'Fünf Schalter, die das Verhalten ändern',
      minutes: 5,
      blocks: [
        { t: 'p', html: 'Flags übergibst du als Argument <code>flags=...</code>; mehrere kombinierst du mit <code>|</code>. Die Schlüsselwortschreibweise ist besonders bei <code>re.sub</code> und <code>re.split</code> eindeutig, weil dort vorher noch <code>count</code> beziehungsweise <code>maxsplit</code> steht.' },
        { t: 'table', head: ['Flag', 'Kurz', 'Wirkung'], rows: [
          ['<code>re.IGNORECASE</code>', '<code>re.I</code>', 'Groß-/Kleinschreibung egal'],
          ['<code>re.MULTILINE</code>', '<code>re.M</code>', '<code>^</code> und <code>$</code> gelten je Zeile'],
          ['<code>re.DOTALL</code>', '<code>re.S</code>', 'der Punkt matcht auch <code>\\n</code>'],
          ['<code>re.VERBOSE</code>', '<code>re.X</code>', 'Whitespace und <code>#</code>-Kommentare im Muster erlaubt'],
          ['<code>re.ASCII</code>', '<code>re.A</code>', 'Kurzformen wie <code>\\w \\d \\s</code> nur ASCII']
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
    },

    /* ---------------------------------------------------------- */
    {
      id: 'escaping-raw-strings',
      title: 'Escaping und Raw Strings',
      sub: 'Backslashes verstehen statt zählen',
      minutes: 8,
      blocks: [
        { t: 'p', html: 'Bei Regex in Python arbeiten <b>zwei Übersetzer</b> nacheinander: Zuerst liest Python den String, danach liest die Regex-Engine das entstandene Muster. Viele vermeintliche Regex-Fehler entstehen schon in der ersten Schicht.' },
        { t: 'table', head: ['Du willst …', 'Regex-Muster', 'empfohlener Python-Code'], rows: [
          ['eine Ziffer', '<code>\\d</code>', '<code>r"\\d"</code>'],
          ['einen echten Punkt', '<code>\\.</code>', '<code>r"\\."</code>'],
          ['eine Wortgrenze', '<code>\\b</code>', '<code>r"\\b"</code>'],
          ['einen Backslash', '<code>\\\\</code>', '<code>r"\\\\"</code>']
        ] },
        { t: 'h', text: 'Ein Punkt ist nicht immer ein Punkt' },
        { t: 'p', html: 'Außerhalb einer Zeichenklasse haben <code>. ^ $ * + ? { } [ ] \\ | ( )</code> eine Sonderbedeutung. Soll eines davon wörtlich vorkommen, maskierst du es mit einem Backslash oder setzt es — wo eindeutig — in eine Zeichenklasse.' },
        { t: 'demo', pattern: '\\.', text: 'Version 1.2.0 ist neuer als 1x1.', cap: 'Nur die echten Punkte werden gefunden. Ein unmaskierter Punkt würde fast jedes Zeichen treffen.' },
        { t: 'demo', pattern: 'A[+]B', text: 'A+B, AB und AAB', cap: 'In der Zeichenklasse ist das Plus wörtlich. Gleichwertig wäre A\\+B.' },
        { t: 'h', text: 'Was das r wirklich macht' },
        { t: 'p', html: 'Das <code>r</code> gehört zur <b>Python-Stringsyntax</b>, nicht zur Regex. Es verhindert, dass Python übliche Escape-Sequenzen wie <code>\\n</code> oder <code>\\b</code> vorab umwandelt. Im Regex-Eingabefeld dieses Trainers gibst du deshalb nur <code>\\bHund\\b</code> ein — ohne Anführungszeichen und ohne <code>r</code>.' },
        { t: 'demo', pattern: '\\bHund\\b', text: 'Hund, Hunde und Windhund', cap: 'Der Browser erhält direkt das Muster. In Python würdest du dasselbe als r"\\bHund\\b" schreiben.' },
        { t: 'note', kind: 'warn', html: 'Ein Raw String kann nicht mit einer <b>ungeraden Zahl von Backslashes</b> enden: <code>r"C:\\Temp\\"</code> ist deshalb kein gültiger Python-String. Setze den letzten Backslash separat zusammen oder verwende dort einen gewöhnlichen, korrekt maskierten String.' },
        { t: 'h', text: 'Variablen sicher einbauen' },
        { t: 'p', html: 'Kommt ein Suchbegriff aus einer Variable, ist er zunächst <b>Text und kein Muster</b>. Mit <code>re.escape()</code> werden seine Regex-Metazeichen wörtlich. Das ist sicherer als eine selbst gepflegte Liste von Sonderzeichen.' },
        { t: 'code', code: 'import re\n\nsuchbegriff = "C++ (Basis)"\nmuster = re.compile(re.escape(suchbegriff))\n\n# re.escape nur für Musterfragmente verwenden:\ntreffer = muster.search("Kurs: C++ (Basis) heute")' },
        { t: 'note', kind: 'tip', html: '<code>re.escape()</code> ist nicht für Ersatztexte von <code>re.sub()</code> gedacht. Dort haben Backslashes eigene Regeln; für Gruppen sind eindeutige Rückverweise wie <code>r"\\g&lt;name&gt;"</code> am lesbarsten.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'validieren-statt-suchen',
      title: 'Validieren statt suchen',
      sub: 'Wann wirklich die ganze Eingabe passen muss',
      minutes: 9,
      blocks: [
        { t: 'p', html: '<b>Suchen</b> beantwortet „kommt irgendwo ein Treffer vor?“. <b>Validieren</b> beantwortet „entspricht die komplette Eingabe meinen Regeln?“. Für Formulare, IDs und Dateinamen ist dieser Unterschied entscheidend.' },
        { t: 'table', head: ['Absicht', 'passende API', 'typisches Ergebnis'], rows: [
          ['irgendwo finden', '<code>re.search()</code>', 'erstes Match oder <code>None</code>'],
          ['alle Vorkommen extrahieren', '<code>re.findall()</code> / <code>re.finditer()</code>', 'Trefferliste / Iterator'],
          ['nur am Anfang prüfen', '<code>re.match()</code>', 'Match oder <code>None</code>'],
          ['gesamte Eingabe prüfen', '<code>re.fullmatch()</code>', 'Match oder <code>None</code>']
        ] },
        { t: 'h', text: 'Eine PLZ vollständig prüfen' },
        { t: 'demo', pattern: '[0-9]{5}', text: '50667', fn: 'fullmatch', cap: 'Fünf ASCII-Ziffern und sonst nichts. Ergänze ein Leerzeichen oder „PLZ “ und die Validierung scheitert.' },
        { t: 'code', code: 'PLZ = re.compile(r"[0-9]{5}")\n\nif PLZ.fullmatch(eingabe):\n    print("gültiges Format")\nelse:\n    print("Bitte genau fünf Ziffern eingeben")' },
        { t: 'note', kind: 'py', html: '<code>\\d</code> akzeptiert bei Python-<code>str</code> auch Unicode-Dezimalziffern wie <code>٣</code> oder <code>５</code>. Für technische Kennungen, die ausdrücklich aus 0 bis 9 bestehen sollen, ist <code>[0-9]</code> meist die klarere Regel.' },
        { t: 'h', text: 'Warum fullmatch klarer als ^…$ ist' },
        { t: 'p', html: '<code>^</code> und <code>$</code> hängen von Flags ab; außerdem kann <code>$</code> direkt vor einem abschließenden Zeilenumbruch passen. <code>fullmatch</code> drückt die Absicht direkt aus und verlangt, dass kein Zeichen übrig bleibt.' },
        { t: 'demo', pattern: '(?:ja|nein)', flags: 'i', text: 'JA', fn: 'fullmatch', cap: 'Eine geschlossene Auswahl: Die gesamte Eingabe muss „ja“ oder „nein“ sein, Großschreibung ist egal.' },
        { t: 'h', text: 'Format ist nicht Bedeutung' },
        { t: 'p', html: 'Regex kann prüfen, ob ein Datum wie ein Datum <i>aussieht</i>. Ob der 31. Februar existiert, ist eine fachliche Regel und gehört anschließend in Datumslogik.' },
        { t: 'demo', pattern: '(?:0[1-9]|[12]\\d|3[01])\\.(?:0[1-9]|1[0-2])\\.[0-9]{4}', text: '31.02.2026', fn: 'fullmatch', cap: 'Das Format passt — trotzdem ist dieses Datum unmöglich. Genau hier endet die Aufgabe der Regex.' },
        { t: 'code', code: 'from datetime import datetime\n\ntry:\n    datum = datetime.strptime(eingabe, "%d.%m.%Y")\nexcept ValueError:\n    print("Kein gültiges Kalenderdatum")' },
        { t: 'list', items: [
          '<b>Vorher entscheiden:</b> Sind führende oder folgende Leerzeichen erlaubt? Nur dann bewusst mit <code>.strip()</code> normalisieren.',
          '<b>Format prüfen:</b> Mit <code>fullmatch</code> sicherstellen, dass die ganze Eingabe passt.',
          '<b>Typ umwandeln:</b> Zahlen und Daten in passende Python-Typen konvertieren.',
          '<b>Fachlich prüfen:</b> Wertebereiche, Prüfziffern und Beziehungen gehören meist in normalen Python-Code.'
        ] },
        { t: 'note', kind: 'exam', html: 'Merksatz: <code>search</code> findet einen passenden <b>Teil</b>, <code>match</code> prüft den <b>Anfang</b>, <code>fullmatch</code> prüft das <b>Ganze</b>.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'debugging-performance',
      title: 'Debugging und Performance',
      sub: 'Fehler eingrenzen und teure Muster vermeiden',
      minutes: 10,
      blocks: [
        { t: 'p', html: 'Eine Regex kann syntaktisch falsch sein, die falschen Treffer liefern oder bei schwierigen Nicht-Treffern sehr langsam werden. Diese drei Fehlerarten brauchen unterschiedliche Werkzeuge.' },
        { t: 'h', text: 'In kleinen Schritten debuggen' },
        { t: 'list', items: [
          '<b>Minimalen Text bauen:</b> Ein Treffer und ein Nicht-Treffer reichen zunächst.',
          '<b>Muster verkürzen:</b> Entferne Bausteine, bis der Fehler verschwindet. Der zuletzt entfernte Teil ist dein erster Verdacht.',
          '<b>Zwischenergebnisse ansehen:</b> <code>finditer</code> zeigt mit <code>span()</code>, wo die Engine tatsächlich getroffen hat.',
          '<b>Positive und negative Fälle testen:</b> Ein Muster ist erst gut, wenn es Gewünschtes findet <i>und</i> Unerwünschtes ablehnt.',
          '<b>Syntaxfehler abfangen:</b> <code>re.error</code> enthält unter anderem Meldung und Fehlerposition.'
        ] },
        { t: 'code', code: 'import re\n\ntry:\n    muster = re.compile(r"[A-Z+")\nexcept re.error as err:\n    print(err.msg)      # z. B. "unterminated character set"\n    print(err.pos)      # Position im Muster' },
        { t: 'note', kind: 'py', html: 'Mit <code>re.DEBUG</code> zeigt Python beim Kompilieren die internen Regex-Bausteine: <code>re.compile(r"ID-[0-9]{4}", re.DEBUG)</code>. Das ist besonders hilfreich, wenn unklar ist, worauf ein Quantifizierer wirkt.' },
        { t: 'h', text: 'Backtracking: wenn die Engine zu viel ausprobieren muss' },
        { t: 'p', html: 'Python <code>re</code> arbeitet mit Backtracking. Bei mehrdeutigen, verschachtelten Wiederholungen kann ein später Fehlschlag sehr viele alternative Aufteilungen auslösen. Ein klassisches Warnsignal ist <code>^(a+)+$</code> auf einer langen a-Folge mit einem falschen Zeichen am Ende.' },
        { t: 'table', head: ['riskant oder unklar', 'meist besser', 'warum'], rows: [
          ['<code>^(a+)+$</code>', '<code>^a+$</code>', 'dieselbe Sprache ohne verschachtelte Wiederholung'],
          ['<code>".*"</code>', '<code>"[^"\\n]*"</code>', 'die Grenze ist Teil des Musters'],
          ['<code>.*;</code>', '<code>[^;\\n]*;</code>', 'kein Zurücklaufen über frühere Trennzeichen'],
          ['viele überlappende Alternativen', 'Alternativen eindeutig beginnen lassen', 'weniger gleichwertige Pfade']
        ] },
        { t: 'demo', pattern: '"[^"\\n]*"', text: 'Felder: "eins", "zwei drei", "vier"', cap: 'Die negierte Klasse kann weder über das nächste Anführungszeichen noch über einen Zeilenumbruch hinauslaufen.' },
        { t: 'note', kind: 'warn', html: '„Lazy“ ist keine allgemeine Performance-Lösung. <code>.*?</code> liefert oft den gewünschten kürzeren Treffer, muss bei einem fehlenden Ende aber weiterhin viele Positionen ausprobieren. Eine passende negierte Zeichenklasse beschreibt die Grenze eindeutiger.' },
        { t: 'h', text: 'Kompilieren, messen, begrenzen' },
        { t: 'code', code: 'from timeit import timeit\n\nTOKEN = re.compile(r"[A-Za-z_][A-Za-z_0-9]*")\ntext = "alpha beta_2 gamma"\n\nsekunden = timeit(lambda: TOKEN.findall(text), number=10_000)\nprint(sekunden)' },
        { t: 'p', html: '<code>re.compile()</code> macht ein schlechtes Muster nicht schnell; Python puffert zudem zuletzt verwendete Muster. Ein benanntes Pattern-Objekt verbessert aber Lesbarkeit und Wiederverwendung. Ob eine Änderung wirklich schneller ist, zeigt nur eine Messung mit realistischen Treffern <i>und Nicht-Treffern</i>.' },
        { t: 'note', kind: 'tip', html: 'Das Standardmodul <code>re</code> bietet keinen Timeout-Parameter pro Aufruf. Bei fremden oder sehr langen Eingaben: Länge begrenzen, mehrdeutige Muster vermeiden und harte Laufzeitgrenzen bei Bedarf durch Prozessisolation oder ein geeignetes anderes Werkzeug erzwingen.' }
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: 'rezepte-transfer',
      title: 'Regex-Rezepte mit Transfer',
      sub: 'Vom einzelnen Muster zur robusten Lösung',
      minutes: 10,
      blocks: [
        { t: 'p', html: 'Ein gutes Rezept besteht nicht nur aus einem Muster. Es verbindet eine klare Eingabeannahme, die passende <code>re</code>-Funktion und normalen Python-Code für die weitere Verarbeitung.' },
        { t: 'h', text: 'Rezept 1: Eine Kennung zerlegen' },
        { t: 'p', html: 'Ziel: Eine Bestellnummer wie <code>ORD-2026-0042</code> vollständig prüfen und ihre Teile direkt benennen.' },
        { t: 'demo', pattern: '(?P<prefix>[A-Z]{3})-(?P<jahr>[0-9]{4})-(?P<nummer>[0-9]{4})', text: 'ORD-2026-0042', fn: 'fullmatch', cap: 'fullmatch validiert die gesamte Kennung; die Namen erklären zugleich die drei Gruppen.' },
        { t: 'code', code: 'BESTELLUNG = re.compile(\n    r"(?P<prefix>[A-Z]{3})-(?P<jahr>[0-9]{4})-(?P<nummer>[0-9]{4})"\n)\n\nif m := BESTELLUNG.fullmatch(eingabe):\n    jahr = int(m.group("jahr"))\n    nummer = int(m.group("nummer"))' },
        { t: 'h', text: 'Rezept 2: Schlüssel-Wert-Zeilen lesen' },
        { t: 'p', html: 'Mit Zeilenankern, benannten Gruppen und <code>finditer</code> wird aus einer kleinen Konfigurationsdatei eine Folge strukturierter Treffer.' },
        { t: 'demo', pattern: '^(?P<key>[A-Za-z_]\\w*)[ \\t]*=[ \\t]*(?P<value>[^\\n]*)$', flags: 'm', text: 'host = localhost\nport=8080\ndebug = true', fn: 'finditer', cap: 'Klick auf die Treffer: key und value lassen sich getrennt auslesen.' },
        { t: 'code', code: 'EINTRAG = re.compile(\n    r"^(?P<key>[A-Za-z_]\\w*)[ \\t]*=[ \\t]*(?P<value>[^\\n]*)$",\n    re.M,\n)\n\nwerte = {\n    m.group("key"): m.group("value")\n    for m in EINTRAG.finditer(text)\n}' },
        { t: 'note', kind: 'warn', html: 'Für echte INI-, YAML- oder JSON-Dateien nimm den jeweiligen Parser. Das Rezept passt nur zu dem bewusst kleinen Format „ein einfacher Schlüssel und ein einzeiliger Wert“.' },
        { t: 'h', text: 'Rezept 3: Teile beim Ersetzen neu anordnen' },
        { t: 'demo', pattern: '(?P<nachname>\\w+),\\s*(?P<vorname>\\w+)', repl: '\\g<vorname> \\g<nachname>', text: 'Meier, Ada; Özdemir, Cem', fn: 'sub', cap: 'Benannte Rückverweise machen auch den Ersatztext ohne Gruppennummern verständlich.' },
        { t: 'h', text: 'Das Transfer-Schema' },
        { t: 'list', items: [
          '<b>Beispiele festlegen:</b> Welche Eingaben müssen passen, welche dürfen auf keinen Fall passen?',
          '<b>Einheit wählen:</b> Suchst du Zeichen, Wörter, Felder, Zeilen oder die gesamte Eingabe?',
          '<b>Grenzen sichtbar machen:</b> Wortgrenzen, Trennzeichen und Zeilenanker verhindern Zufallstreffer.',
          '<b>Varianten gezielt erlauben:</b> Optionales nur dort mit <code>?</code> oder Alternativen ergänzen, wo es fachlich vorgesehen ist.',
          '<b>API nach Absicht wählen:</b> <code>search</code>, <code>finditer</code>, <code>fullmatch</code>, <code>sub</code> und <code>split</code> lösen verschiedene Aufgaben.',
          '<b>Ergebnis weiterprüfen:</b> Gruppen in Typen umwandeln und semantische Regeln in Python ausdrücken.'
        ] },
        { t: 'table', head: ['Aufgabe', 'Regex?', 'besseres Werkzeug'], rows: [
          ['einfache Textmuster finden oder ersetzen', 'ja', '<code>re</code>'],
          ['verschachteltes JSON lesen', 'nein', '<code>json.loads()</code>'],
          ['HTML-Struktur zuverlässig auswerten', 'meist nein', 'HTML-Parser'],
          ['gültiges Kalenderdatum prüfen', 'nur fürs Format', '<code>datetime</code>'],
          ['Zahlenbereich oder Prüfziffer prüfen', 'nur fürs Format', 'normaler Python-Code']
        ] },
        { t: 'note', kind: 'tip', html: 'Der beste Transfer-Test: Erkläre in einem Satz, <b>warum jedes Zeichen im Muster da ist</b>. Wenn das nicht gelingt, zerlege das Muster in benannte Teilstücke oder wähle ein passenderes Werkzeug.' }
      ]
    }
  ];
})(window);
