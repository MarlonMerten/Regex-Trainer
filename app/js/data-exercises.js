/* =============================================================
   data-exercises.js — Aufgaben in fünf Schwierigkeitsstufen

   Jede Aufgabe wird gegen MEHRERE Texte geprüft. Der zweite und
   dritte Text sind Gegenproben: sie fangen Muster ab, die nur
   zufällig auf dem Beispieltext funktionieren.

   Die Soll-Ergebnisse werden zur Laufzeit aus der Musterlösung
   berechnet (siehe app.js). Damit können Aufgabentext und Prüfung
   nicht auseinanderlaufen.
   ============================================================= */
(function (global) {
  'use strict';
  var RT = (global.RT = global.RT || {});

  RT.levels = [
    { id: 1, name: 'Grundlagen',            sub: 'Zeichen, Klassen, erste Quantifizierer', color: '#4ade80' },
    { id: 2, name: 'Mengen & Mengenlehre',  sub: 'Eigene Zeichenklassen, genaue Anzahlen, greedy vs. lazy', color: '#38bdf8' },
    { id: 3, name: 'Anker & Wortgrenzen',   sub: 'Ganze Wörter, Zeilen, Positionen', color: '#a78bfa' },
    { id: 4, name: 'Gruppen & Alternativen',sub: 'Einfangen, oder, Rückverweise, die findall-Regel', color: '#fb923c' },
    { id: 5, name: 'Lookaround & Praxis',   sub: 'Bedingungen, Ersetzen, Zerlegen, echte Textanalyse', color: '#f472b6' }
  ];

  RT.exercises = [

    /* ==================== LEVEL 1 ==================== */
    {
      id: 'l1-01', level: 1, title: 'Ziffernfolgen finden',
      task: 'Finde alle <b>zusammenhängenden Ziffernfolgen</b>. Python versteht <code>\\d</code> bei Unicode-Strings nicht nur als 0–9, sondern als Dezimalziffern aller Schriftsysteme.',
      cases: [
        { text: 'Heute hat jemand 20 Bananen gekauft und 50 Euro bezahlt.' },
        { text: 'Im Jahr 2024 gab es 7 Versuche und 1 Erfolg.' },
        { text: 'ASCII 42, arabisch-indisch ٤٢ und vollbreit １２.' }
      ],
      hints: [
        'Für „eine Ziffer“ gibt es eine Kurzform mit Backslash.',
        'Eine einzelne Ziffer reicht nicht — du brauchst „eine oder mehr“.',
        'Die Kurzform ist \\d, der Quantifizierer +.'
      ],
      solution: '\\d+'
    },
    {
      id: 'l1-02', level: 1, title: 'Einzelne Ziffern',
      task: 'Und jetzt das Gegenteil: gib <b>jede Ziffer einzeln</b> zurück, nicht die ganze Zahl.',
      cases: [
        { text: 'Hausnummer 27, Etage 3' },
        { text: 'PIN 4711' },
        { text: 'Unicode-Ziffern: ٣ und ９' }
      ],
      hints: ['Was passiert, wenn du den Quantifizierer einfach weglässt?'],
      solution: '\\d'
    },
    {
      id: 'l1-03', level: 1, title: 'Wortzeichenfolgen herausziehen',
      task: 'Finde alle Folgen aus <b>Wortzeichen</b>. Dazu zählen in Python Unicode-Buchstaben und -Zahlen sowie der Unterstrich; Satzzeichen und Bindestriche gehören nicht dazu.',
      cases: [
        { text: 'Hallo Welt! Wie geht es dir?' },
        { text: 'Punkt. Komma, Strich - fertig!' },
        { text: 'Python_3, Größe und ID-42' }
      ],
      hints: [
        'Es gibt eine Kurzform für „Buchstabe, Ziffer oder Unterstrich“.',
        'Und wieder brauchst du „eine oder mehr“ davon.'
      ],
      solution: '\\w+'
    },
    {
      id: 'l1-04', level: 1, title: 'Alles außer Leerraum',
      task: 'Zerlege den Text in Tokens: alles, was <b>kein Leerraum</b> ist, gehört zusammen — Satzzeichen inklusive.',
      cases: [
        { text: 'Hallo, Welt! Alles\tklar?' },
        { text: '  a  b\nc  ' },
        { text: 'eins\u00a0zwei — drei' }
      ],
      hints: ['Die Großschreibung einer Kurzform kehrt ihre Bedeutung um.', '\\s ist Leerraum — was ist dann das Gegenteil?'],
      solution: '\\S+'
    },
    {
      id: 'l1-05', level: 1, title: 'Eine bestimmte Zeichenfolge',
      task: 'Finde die <b>Zeichenfolge Katze</b> — genau so geschrieben, mit großem K. Wortgrenzen kommen erst später; hier zählt „Katze“ deshalb auch in „Katzenkorb“.',
      cases: [
        { text: 'Die Katze jagt eine andere Katze, die katze schläft.' },
        { text: 'Keine Katze weit und breit außer der Katze dort.' },
        { text: 'Katzenkorb, Wildkatze, Katze' }
      ],
      hints: ['Ganz normale Buchstaben brauchen keine Sonderzeichen.'],
      solution: 'Katze'
    },
    {
      id: 'l1-06', level: 1, title: 'Der Punkt ist besonders',
      task: 'Finde alle <b>echten Punkte</b> im Text — nicht „irgendein Zeichen“.',
      cases: [
        { text: 'Version 3.14. Ende.' },
        { text: 'a.b.c' },
        { text: 'Keine Frage? Doch. Zwei Punkte..' }
      ],
      hints: [
        'Ein unmaskierter Punkt bedeutet „beliebiges Zeichen“.',
        'Mit einem Backslash davor wird er wieder wörtlich.'
      ],
      solution: '\\.'
    },
    {
      id: 'l1-07', level: 1, title: 'Dezimalzahlen mit Punkt',
      task: 'Finde Zahlen mit <b>Punkt als Dezimaltrennzeichen</b>, also z. B. <code>15.99</code>. Reine Ganzzahlen sollen <b>nicht</b> dabei sein.',
      cases: [
        { text: 'Er bezahlte 15.99 Euro und später nochmal 3 Euro.' },
        { text: 'Werte: 0.5, 12, 100.25 und 7' },
        { text: 'Build 2x3, Messwert 8.0 und deutsches 1,25' }
      ],
      hints: [
        'Ziffern, dann ein echter Punkt, dann wieder Ziffern.',
        'Der Punkt muss maskiert werden: \\.',
        'Aufbau: \\d+ \\. \\d+ — ohne Leerzeichen dazwischen.'
      ],
      solution: '\\d+\\.\\d+'
    },
    {
      id: 'l1-08', level: 1, title: 'Optionales Zeichen',
      task: 'Finde sowohl <b>color</b> als auch <b>colour</b> — mit einem einzigen Muster.',
      cases: [
        { text: 'Britisch colour, amerikanisch color, aber nicht coloor.' },
        { text: 'color colour colur' },
        { text: 'colors, colours, collar und colour' }
      ],
      hints: ['Ein Zeichen soll freiwillig sein.', 'Der Quantifizierer für „null- oder einmal“ ist ?'],
      solution: 'colou?r'
    },

    /* ==================== LEVEL 2 ==================== */
    {
      id: 'l2-01', level: 2, title: 'Nur Vokale',
      task: 'Finde alle <b>Vokale</b> (a, e, i, o, u) — Kleinschreibung genügt.',
      cases: [
        { text: 'Haus am Meer' },
        { text: 'Ein schoenes Beispiel' },
        { text: 'AEIOU bleiben draußen; audio und uhu liefern kleine Vokale.' }
      ],
      hints: ['Eigene Zeichenmengen stehen in eckigen Klammern.'],
      solution: '[aeiou]'
    },
    {
      id: 'l2-02', level: 2, title: 'Alles außer Vokalen',
      task: 'Jetzt umgekehrt: alle Zeichen, die <b>keine</b> Vokale und <b>kein Whitespace</b> sind. Tabs und Zeilenumbrüche sollen also ebenfalls draußen bleiben.',
      cases: [
        { text: 'Haus am Meer' },
        { text: 'abc xyz' },
        { text: 'a\tb\nc u' }
      ],
      hints: ['Ein Dach direkt hinter der öffnenden Klammer negiert die Menge.', 'Nimm die Kurzform für Whitespace mit in die verbotene Menge.'],
      solution: '[^aeiou\\s]'
    },
    {
      id: 'l2-03', level: 2, title: 'Wörter mit genau fünf Zeichen',
      task: 'Finde alle Wörter, die aus <b>genau fünf</b> Wortzeichen bestehen.',
      cases: [
        { text: 'Heute ist ein guter Tag zum Lernen' },
        { text: 'abcd abcde abcdef abcde' },
        { text: 'A_123 zählt als fünf Wortzeichen, 12345 ebenso' }
      ],
      hints: [
        'Für eine exakte Anzahl gibt es geschweifte Klammern.',
        'Damit „abcde“ in „abcdef“ nicht mitzählt, brauchst du Wortgrenzen: \\b',
        'Aufbau: \\b \\w{5} \\b'
      ],
      solution: '\\b\\w{5}\\b'
    },
    {
      id: 'l2-04', level: 2, title: 'Telefonnummern',
      task: 'Finde Nummern im Format <b>3–5 Ziffern, Bindestrich, 3–5 Ziffern</b>.',
      cases: [
        { text: 'Telefon 0211-45678 oder 89-12 (ungültig)' },
        { text: 'Rufe 12345-678 an, nicht 1-2' },
        { text: 'Gültig 123-456; ungültig 123456-789 und 123-456789' }
      ],
      hints: ['Geschweifte Klammern können auch einen Bereich angeben: {min,max}', 'Wortgrenzen verhindern Teiltreffer aus zu langen Nummern.'],
      solution: '\\b\\d{3,5}-\\d{3,5}\\b'
    },
    {
      id: 'l2-05', level: 2, title: 'Hex-Farbcodes',
      task: 'Finde Farbcodes wie <code>#1A2B3C</code>: eine Raute und <b>genau sechs</b> Zeichen aus 0–9 und A–F.',
      cases: [
        { text: 'Farben: #1A2B3C, #FF0000 und #GG1122' },
        { text: '#ABCDEF #12345 #0f0f0f' },
        { text: '#00FF7F ist gültig, #00FF7F0 und #00FF7FG nicht' }
      ],
      hints: [
        'Die Raute ist ein ganz normales Zeichen.',
        'In eine Zeichenklasse kannst du mehrere Bereiche packen: [0-9A-F]',
        'Klein geschriebene Buchstaben zählen hier nicht mit.',
        'Eine Wortgrenze am Ende verhindert Präfixtreffer in längeren Codes.'
      ],
      solution: '#[0-9A-F]{6}\\b'
    },
    {
      id: 'l2-06', level: 2, title: 'Dezimalzahl mit Punkt oder Komma',
      task: 'Finde Zahlen, die <b>optional</b> Nachkommastellen haben — der Trenner darf Punkt oder Komma sein. Ganze Zahlen sollen ebenfalls gefunden werden.',
      cases: [
        { text: 'Die Preise waren 2,50 euro, 3.20 Euros und 10 Euro.' },
        { text: '0,5 · 100 · 12.75 · 8' },
        { text: 'Version v2 und Werte 7,00 / 9.5 / 11' }
      ],
      hints: [
        'Erst der ganzzahlige Teil, dann ein optionaler Nachkommateil.',
        'Der Trenner ist eine Zeichenklasse aus Punkt und Komma: [.,]',
        'Den optionalen Teil klammerst du mit (?:…)? ein; Wortgrenzen schließen Kennungen wie v2 aus.'
      ],
      solution: '\\b\\d+(?:[.,]\\d+)?\\b'
    },
    {
      id: 'l2-07', level: 2, title: 'Gier bändigen',
      task: 'Finde die <b>einzelnen</b> Zitate in Anführungszeichen. Achtung: die naive Lösung verschluckt alles dazwischen.',
      cases: [
        { text: 'Er sagte "hallo" und dann "tschüss".' },
        { text: '"a" x "b" y "c"' },
        { text: 'Leer "" sowie "fertig"; ohne Anführungszeichen.' }
      ],
      hints: [
        'Probier zuerst ".*" und schau dir das Ergebnis an.',
        'Ein angehängtes ? macht den Quantifizierer genügsam.',
        'Noch sauberer: eine negierte Klasse, die das Anführungszeichen ausschließt.'
      ],
      solution: '"[^"]*"'
    },
    {
      id: 'l2-08', level: 2, title: 'HTML-Tags',
      task: 'Finde alle <b>Tags</b> — also alles zwischen spitzen Klammern, jeweils einzeln.',
      cases: [
        { text: '<div class="a">Text</div>' },
        { text: '<p><b>fett</b></p>' },
        { text: 'Text <br> und <!-- Hinweis -->; eine einzelne Klammer < bleibt draußen' }
      ],
      hints: ['Zwischen den spitzen Klammern darf alles stehen — außer der schließenden Klammer.'],
      solution: '<[^>]+>'
    },
    {
      id: 'l2-09', level: 2, title: 'Zahl mit Einheit',
      task: 'Finde Gewichtsangaben: eine Zahl, optional ein Leerzeichen, dann <b>kg</b> oder <b>g</b>.',
      cases: [
        { text: 'Das Paket wiegt 50 kg, der Brief 100g und die Kiste 7 kg.' },
        { text: '5kg 12 g 3 t' },
        { text: 'Gültig: 8kg und 9 g; nicht: 10kgs oder 11gramm' }
      ],
      hints: [
        'Das Leerzeichen ist optional — dafür gibt es ?',
        'Für „kg oder g“ brauchst du eine Alternative in nicht-fangenden Klammern.',
        'Bei kg und g ist die Reihenfolge egal, weil sie an derselben Position mit verschiedenen Anfangsbuchstaben starten. Eine Wortgrenze verhindert dagegen Treffer in „kgs“ und „gramm“.'
      ],
      solution: '\\b\\d+\\s?(?:kg|g)\\b'
    },
    {
      id: 'l2-10', level: 2, title: 'Nur ASCII-Ziffern mit re.A',
      task: 'Finde mit <code>\\d+</code> ausschließlich Ziffernfolgen aus <b>0–9</b>. Aktiviere dafür das Flag <code>a</code>; Ziffern anderer Schriftsysteme sollen nicht mitkommen.',
      cases: [
        { text: 'ASCII 2026, arabisch-indisch ٢٠٢٦' },
        { text: 'IDs 42 und vollbreit ４２' },
        { text: 'Gemischt 3٣4 sowie 99' }
      ],
      requireFlags: 'a',
      hints: [
        '\\d ist ohne Flag Unicode-bewusst.',
        're.A beziehungsweise das Flag a beschränkt die Kurzformen auf ASCII.'
      ],
      solution: '\\d+', flags: 'a'
    },

    /* ==================== LEVEL 3 ==================== */
    {
      id: 'l3-01', level: 3, title: 'Nur das ganze Wort',
      task: 'Finde das Wort <b>cat</b> — aber nicht, wenn es Teil eines längeren Wortes ist.',
      cases: [
        { text: 'cat catalog scattered cat.' },
        { text: 'The cat sat on concatenate' },
        { text: 'wildcat cat cat2 _cat und cat!' }
      ],
      hints: ['Es gibt einen Anker für Wortgrenzen.', 'Er gehört vorne UND hinten hin: \\bcat\\b'],
      solution: '\\bcat\\b'
    },
    {
      id: 'l3-02', level: 3, title: 'man und men',
      task: 'Finde die Wörter <b>man</b> und <b>men</b> als eigenständige Wörter, unabhängig von Groß- und Kleinschreibung. Aktiviere dazu das Flag <code>i</code>. „mankind“, „woman“ und „mention“ dürfen nicht mitkommen.',
      cases: [
        { text: 'A man among men. Man and Men. But not mankind, woman or women.' },
        { text: 'men mention Manager Man' },
        { text: 'MAN, mEn, human, woman, men2 und _man' }
      ],
      requireFlags: 'i',
      hints: [
        'Wortgrenzen vorne und hinten.',
        'Klammer die beiden Alternativen man und men nicht-fangend.',
        'Das Flag i übernimmt die Groß-/Kleinschreibung: \\b(?:man|men)\\b'
      ],
      solution: '\\b(?:man|men)\\b', flags: 'i'
    },
    {
      id: 'l3-03', level: 3, title: 'Wörter mit Präfix',
      task: 'Finde alle Wörter, die mit dem exakt klein geschriebenen Präfix <b>un</b> beginnen.',
      cases: [
        { text: 'unglaublich unfair, aber verständlich und rund' },
        { text: 'Ungenau, unter uns: unmöglich' },
        { text: 'un, unten, gesund, rundum und unklar' }
      ],
      hints: ['Wortgrenze, dann das Präfix, dann der Rest des Wortes.', 'Der Rest ist \\w* — beliebig viele Wortzeichen.'],
      solution: '\\bun\\w*'
    },
    {
      id: 'l3-04', level: 3, title: 'Wörter mit Endung',
      task: 'Finde alle Wörter, die auf der Zeichenfolge <b>ing</b> enden. Das Muster prüft nur die Schreibweise, nicht die grammatische Wortart — „king“ und „ring“ zählen deshalb ebenfalls.',
      cases: [
        { text: 'running, jumping, singing, run, king' },
        { text: 'Nothing is missing in the ring' },
        { text: 'ing, thing, singer, walking2 und bringing.' }
      ],
      hints: ['Wortgrenze, dann beliebige Wortzeichen, dann ing, dann wieder Wortgrenze.'],
      solution: '\\b\\w+ing\\b'
    },
    {
      id: 'l3-05', level: 3, title: 'Abkürzungen',
      task: 'Finde Wörter aus <b>mindestens zwei Großbuchstaben</b> am Stück.',
      cases: [
        { text: 'In den USA und der EU gilt die DSGVO. Ein A allein nicht.' },
        { text: 'HTML, CSS und JS — aber Java nicht.' },
        { text: 'AB ABc X ABC_ und XYZ' }
      ],
      hints: ['{2,} bedeutet „mindestens zwei“.', 'Wortgrenzen verhindern, dass „ABc“ als „AB“ durchgeht.'],
      solution: '\\b[A-Z]{2,}\\b'
    },
    {
      id: 'l3-06', level: 3, title: 'Wörter mit Großbuchstaben am Anfang',
      task: 'Finde alle Wörter, die mit einem <b>deutschen lateinischen Großbuchstaben</b> (A–Z, Ä, Ö, Ü) beginnen.',
      cases: [
        { text: 'Herr Meier geht nach Köln und trifft dort Anna.' },
        { text: 'anna Bert carla Dora' },
        { text: 'Öl Übermut ärger Éclair und Zürich' }
      ],
      hints: ['Wortgrenze, ein Großbuchstabe, dann beliebig viele Wortzeichen.'],
      solution: '\\b[A-ZÄÖÜ]\\w*'
    },
    {
      id: 'l3-07', level: 3, title: 'Zeilenanfänge',
      task: 'Finde das <b>erste Wort jeder Zeile</b>. Aktiviere dazu das Flag <code>m</code> unter dem Eingabefeld.',
      cases: [
        { text: 'Zeile eins\nZeile zwei\nAnders hier' },
        { text: 'alpha beta\ngamma delta' },
        { text: 'Direkt gefunden\n  eingerückt nicht\nDritte passt' }
      ],
      requireFlags: 'm',
      hints: ['^ steht für den Anfang.', 'Ohne re.M gilt ^ nur einmal ganz vorn — schalte das Flag m ein.'],
      solution: '^\\w+', flags: 'm'
    },
    {
      id: 'l3-08', level: 3, title: 'Zeilenenden',
      task: 'Finde das <b>letzte Wort jeder Zeile</b>. Das Flag <code>m</code> brauchst du wieder.',
      cases: [
        { text: 'erste Zeile hier\nzweite Zeile dort' },
        { text: 'a b c\nd e f' },
        { text: 'endet mit Wort\nendet mit 42\nPunkt danach.' }
      ],
      requireFlags: 'm',
      hints: ['$ steht für das Ende.'],
      solution: '\\w+$', flags: 'm'
    },
    {
      id: 'l3-09', level: 3, title: 'Ersten Treffer mit re.search finden',
      task: 'Diese Aufgabe verwendet <code>re.search</code>. Finde den <b>ersten</b> Fehlercode im Format <code>ERROR</code>, Leerraum und genau drei Ziffern — egal, wo er im Text steht.',
      fn: 'search',
      cases: [
        { text: 'INFO Start; ERROR 4040 ist zu lang; später ERROR 500' },
        { text: 'INFO 200 — hier steht kein Fehlercode' },
        { text: 'Vorspann\nWARN langsam\nERROR 503 Dienst weg' }
      ],
      hints: [
        're.search sucht selbstständig an jeder Position; ein führendes .* ist unnötig.',
        'Nach ERROR folgt mindestens ein Whitespace-Zeichen und dann genau drei Ziffern; (?!\\d) schließt eine vierte aus.'
      ],
      solution: 'ERROR\\s+\\d{3}(?!\\d)'
    },
    {
      id: 'l3-10', level: 3, title: 'Nur am Anfang mit re.match',
      task: 'Diese Aufgabe verwendet <code>re.match</code>. Erkenne einen Ticketcode aus zwei Großbuchstaben, Bindestrich und mindestens einer Ziffer — aber nur, wenn er <b>direkt am Stringanfang</b> steht.',
      fn: 'match',
      cases: [
        { text: 'AB-123 offen' },
        { text: 'AB-123x ist ungültig; CD-7 steht erst später' },
        { text: 'XY-9: erledigt' }
      ],
      hints: [
        're.match prüft bereits nur am Stringanfang; ein ^ ist hier nicht nötig.',
        'Zwei Großbuchstaben, Bindestrich, dann \\d+ und eine Wortgrenze.'
      ],
      solution: '[A-Z]{2}-\\d+\\b'
    },
    {
      id: 'l3-11', level: 3, title: 'Komplette PLZ mit re.fullmatch',
      task: 'Diese Aufgabe verwendet <code>re.fullmatch</code>. Validiere eine deutsche Postleitzahl als <b>genau fünf ASCII-Ziffern</b>. Zusatztext, sechs Ziffern und Unicode-Ziffern sollen scheitern.',
      fn: 'fullmatch',
      cases: [
        { text: '50667' },
        { text: '50667 Köln' },
        { text: '１２３４５' }
      ],
      hints: [
        'fullmatch verlangt bereits den ganzen String; ^ und $ brauchst du nicht.',
        'Für ausdrücklich ASCII nimm [0-9] statt \\d.'
      ],
      solution: '[0-9]{5}'
    },
    {
      id: 'l3-12', level: 3, title: 'Über Zeilen hinweg mit re.S',
      task: 'Finde jeden Block von <code>BEGINN</code> bis zum nächstfolgenden <code>ENDE</code>, auch über Zeilenumbrüche hinweg. Aktiviere <code>s</code> und halte den Punkt mit <code>?</code> genügsam.',
      cases: [
        { text: 'BEGINN\nalpha\nbeta\nENDE' },
        { text: 'vorher BEGINN eins ENDE nachher' },
        { text: 'BEGINN\nA\nENDE und BEGINN\nB\nENDE' }
      ],
      requireFlags: 's',
      hints: [
        'Ohne re.S matcht der Punkt keinen Zeilenumbruch.',
        '.*? endet am jeweils nächsten ENDE statt am letzten.'
      ],
      solution: 'BEGINN.*?ENDE', flags: 's'
    },

    /* ==================== LEVEL 4 ==================== */
    {
      id: 'l4-01', level: 4, title: 'Eine Gruppe herausziehen',
      task: 'Gib nur die <b>Jahreszahlen</b> zurück, nicht das Wort „Jahr“ davor. Nutze eine fangende Gruppe.',
      cases: [
        { text: 'Jahr 2019, Jahr 2024 und irgendwo 1999' },
        { text: 'Jahr 2000 Jahr 2001 2002' },
        { text: 'Jahr\t1998, Baujahr 2010, Jahr 20220 und Jahr: 2022' }
      ],
      hints: [
        'Mit Klammern fängst du einen Teil des Treffers ein.',
        'Bei genau einer Gruppe gibt findall nur diese Gruppe zurück.',
        'Eine Wortgrenze nach den vier Ziffern verhindert einen Präfixtreffer in einer fünfstelligen Zahl.'
      ],
      solution: 'Jahr\\s(\\d{4})\\b'
    },
    {
      id: 'l4-02', level: 4, title: 'Zwei Gruppen — Tupel',
      task: 'Zerlege Zeitspannen wie <code>2019-2024</code> in <b>zwei Gruppen</b>. Das Ergebnis besteht dann aus Tupeln.',
      cases: [
        { text: 'Zeitraum 2019-2024 und 1990-1999' },
        { text: '2000-2010, 2011-2020' },
        { text: 'Gültig 1234-5678; zu lang 12345-6789 und 1234-56789' }
      ],
      hints: ['Zwei Klammerpaare, dazwischen der Bindestrich.'],
      solution: '\\b(\\d{4})-(\\d{4})\\b'
    },
    {
      id: 'l4-03', level: 4, title: 'Gruppe vermeiden',
      task: 'Finde <b>Euro-Beträge</b> als ganze Treffer — also inklusive Währung. Die Währung darf <code>Euro</code> oder <code>euro</code> heißen. <b>Wichtig:</b> das Ergebnis soll die kompletten Treffer enthalten, keine Gruppen.',
      cases: [
        { text: '100 Euro und 200euro sowie 300 Dollar' },
        { text: '5euro, 10 Euro, 15 EUR' },
        { text: '1 Euro, 2 euros, 3 EURO und 4Euro' }
      ],
      hints: [
        'Für „Euro oder euro“ brauchst du eine Alternative.',
        'Mit normalen Klammern liefert findall plötzlich nur die Währung.',
        'Die Lösung heißt (?:…) — nicht-fangende Gruppe.'
      ],
      solution: '\\d+\\s?(?:Euro|euro)\\b'
    },
    {
      id: 'l4-04', level: 4, title: 'Alternativen richtig klammern',
      task: 'Finde die Tiere <b>Hund</b>, <b>Katze</b> oder <b>Maus</b> als eigenständige Wörter.',
      cases: [
        { text: 'Hund, Katze und Vogel, dazu eine Maus und ein Hundeleine-Regal' },
        { text: 'Mausklick Maus Katzenfutter Katze' },
        { text: 'Hund2 _Hund HUND und Hund.' }
      ],
      hints: [
        'Die Alternativen gehören in Klammern, sonst gilt \\b nur für die erste.',
        'Nicht-fangend klammern, damit findall die ganzen Wörter liefert.'
      ],
      solution: '\\b(?:Hund|Katze|Maus)\\b'
    },
    {
      id: 'l4-05', level: 4, title: 'Doppelte Buchstaben',
      task: 'Finde Stellen, an denen <b>dasselbe Wortzeichen zweimal hintereinander</b> steht. Weil eine fangende Gruppe im Muster steht, gibt <code>findall</code> jeweils das einmal gefangene Zeichen zurück.',
      cases: [
        { text: 'cool, Ebbe, Schifffahrt, egal' },
        { text: 'aabbcd eeff' },
        { text: 'Ballon, Tee, 11 und AAbb' }
      ],
      hints: [
        'Fang ein Zeichen in einer Gruppe ein.',
        'Mit \\1 verlangst du genau dasselbe Zeichen noch einmal.'
      ],
      solution: '(\\w)\\1'
    },
    {
      id: 'l4-06', level: 4, title: 'Doppelte Wörter',
      task: 'Finde versehentlich <b>doppelt geschriebene Wörter</b>. Gib das Wort selbst zurück (die Gruppe).',
      cases: [
        { text: 'Das ist ist ein doppelt doppelt geschriebener Satz.' },
        { text: 'Ein Fehler schleicht sich sich ein.' },
        { text: 'Test test zählt ohne i nicht, aber aber zählt.' }
      ],
      hints: [
        'Ein Wort einfangen, dann Leerraum, dann dasselbe Wort noch einmal.',
        'Vergiss die Wortgrenzen nicht.',
        'Aufbau: \\b(\\w+)\\s+\\1\\b'
      ],
      solution: '\\b(\\w+)\\s+\\1\\b'
    },
    {
      id: 'l4-07', level: 4, title: 'Benannte Gruppen',
      requireGroupNames: ['tag', 'monat', 'jahr'],
      task: 'Zerlege Zeichenfolgen im Format TT.MM.JJJJ in die benannten Gruppen <b>tag</b>, <b>monat</b> und <b>jahr</b>. Hier wird nur das Ziffernformat geprüft, nicht die kalendarische Gültigkeit.',
      cases: [
        { text: 'Abgabe am 24.12.2025, Klausur am 07.02.2026' },
        { text: '01.01.2000 und 31.12.1999' },
        { text: 'Format passt: 99.99.0000; zu kurz 1.2.2025, zu lang 124.12.20250' }
      ],
      hints: [
        'Python schreibt benannte Gruppen als (?P<name>…).',
        'Die Punkte müssen maskiert werden.',
        'Wortgrenzen außen verhindern Teiltreffer in längeren Ziffernfolgen.'
      ],
      solution: '\\b(?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})\\b'
    },
    {
      id: 'l4-08', level: 4, title: 'Link-Ziele',
      task: 'Ziehe aus den HTML-Links nur die <b>Adresse</b> heraus, die in <code>href="…"</code> steht.',
      cases: [
        { text: '<a class="x" href="page.html">Link</a> und <a href="http://a.de">A</a>' },
        { text: '<a href="/start">Start</a><a id="q" href="ende.htm">Ende</a>' },
        { text: '<img src="x"><a data-href="falsch" href="richtig.html">OK</a>' }
      ],
      hints: [
        'Suche nach Whitespace und dann href="; so zählt data-href nicht als echtes href-Attribut.',
        'Eine negierte Klasse ist hier besser als .*?',
        'Aufbau: [ \\t]href="([^"]+)"'
      ],
      solution: '[ \\t]href="([^"]+)"'
    },
    {
      id: 'l4-09', level: 4, title: 'Zeilen in Felder zerlegen',
      task: 'Jede Zeile besteht aus einem Namen und einer Zahl. Zerlege sie in <b>zwei Gruppen</b>. Aktiviere das Flag <code>m</code>.',
      cases: [
        { text: 'apfel 12\nbirne 7\nkirsche 30' },
        { text: 'a 1\nbb 22' },
        { text: 'tab\t9\ngetrennt\n10\nkorrekt 11' }
      ],
      requireFlags: 'm',
      hints: ['Verankere die Zeile mit ^ und $.', 'Verwende [ \\t]+ statt \\s+, damit der Trenner nicht über einen Zeilenumbruch springt.'],
      solution: '^(\\w+)[ \\t]+(\\d+)$', flags: 'm'
    },
    {
      id: 'l4-10', level: 4, title: 'Lesbares Muster mit re.X',
      task: 'Zerlege TT.MM.JJJJ in drei Gruppen. Das Muster soll zur Lesbarkeit echte Leerzeichen zwischen seinen Bausteinen enthalten; aktiviere <code>x</code>, damit diese im Muster ignoriert werden.',
      cases: [
        { text: 'Termin 24.12.2025' },
        { text: '01.01.2000 und kurz 1.1.2000' },
        { text: 'Ungültig 31-12-1999 und 131.12.19990; gültig 31.12.1999' }
      ],
      requireFlags: 'x',
      requirePatternWhitespace: true,
      hints: [
        'Mit re.X wird unmaskierter Whitespace im Muster ignoriert.',
        'Schreib die drei Gruppen mit sichtbaren Abständen und Wortgrenzen außen.'
      ],
      solution: '\\b (\\d{2}) \\. (\\d{2}) \\. (\\d{4}) \\b', flags: 'x'
    },
    {
      id: 'l4-11', level: 4, title: 'Trefferobjekte mit re.finditer',
      task: 'Diese Aufgabe verwendet <code>re.finditer</code>. Finde alle Hashtags, die mit einem ASCII-Buchstaben beginnen und danach beliebig viele Wortzeichen enthalten. Achte in der Ausgabe auf Treffertext und Position.',
      fn: 'finditer',
      cases: [
        { text: 'Heute #Python und #Regex101 lernen.' },
        { text: '#42 ist kein Tag, #A42 schon; Mail a#b.de nicht.' },
        { text: 'Doppelt #eins, dann #zwei_2 und nur #.' }
      ],
      hints: [
        'Vor der Raute darf kein Wortzeichen stehen; nutze einen negativen Lookbehind.',
        'Dann folgen ein wörtliches # und [A-Za-z].',
        '\\w* erlaubt danach auch Ziffern und Unterstriche.'
      ],
      solution: '(?<!\\w)#[A-Za-z]\\w*'
    },

    /* ==================== LEVEL 5 ==================== */
    {
      id: 'l5-01', level: 5, title: 'Betrag ohne Währung',
      task: 'Gib nur die <b>Beträge</b> zurück, auf die <code>Euro</code> folgt (großes oder kleines E, Singular oder Plural, höchstens ein Whitespace-Zeichen dazwischen). Punkt und Komma als Dezimaltrenner sind erlaubt. Die Währung selbst darf nicht im Ergebnis stehen — benutze einen <b>Lookahead</b>.',
      cases: [
        { text: '100 Euro, 200 euros, 300euro, 400Euros, 500 Dollar' },
        { text: '7euro und 8 Euros, aber 9 Punkte' },
        { text: '1,99 Euro, 2.50euros, x3Euro und 4 EURO' }
      ],
      hints: [
        'Ein Lookahead schreibt sich (?=…) und verbraucht nichts.',
        'Setze den optionalen Dezimalteil vor den Lookahead.',
        'Mit (?<![\\w.,]) verhinderst du Teiltreffer in Bezeichnern und Dezimalzahlen.'
      ],
      solution: '(?<![\\w.,])\\d+(?:[.,]\\d+)?(?=\\s?[Ee]uros?\\b)'
    },
    {
      id: 'l5-02', level: 5, title: 'Find the money',
      task: 'Der große Klassiker aus dem Praktikum: extrahiere <b>alle Geldbeträge samt Währung</b>. Erlaubt sind Punkt und Komma als Dezimaltrenner, optionaler Abstand und die Schreibweisen <code>€</code>, <code>Euro</code>, <code>euro</code>, <code>Euros</code>, <code>euros</code>. Die Angabe <code>50 kg</code> darf <b>nicht</b> mitkommen.',
      cases: [
        { text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.' },
        { text: '1,99€ · 2.00 Euro · 3 euros · 4 kg · 5EURO' },
        { text: '0 Euro, 10,00 Euros, 12.5euro, eingebettet x3euro, kaputt 1.2.3 Euro und 9 Dollar' }
      ],
      hints: [
        'Fang mit \\d+ an und häng die optionalen Nachkommastellen an.',
        'Dann optionaler Leerraum: \\s*',
        'Sichere links den Tokenanfang ab und beende ausgeschriebene Währungen mit einer Wortgrenze.'
      ],
      solution: '(?<![\\w.,])\\d+(?:[.,]\\d+)?\\s*(?:€(?!\\w)|[Ee]uros?\\b)'
    },
    {
      id: 'l5-03', level: 5, title: 'Wort im Kontext',
      task: 'Welche Wörter folgen direkt auf <b>dark</b>? Gib nur das folgende Wort zurück — mit einem <b>Lookbehind</b>.',
      cases: [
        { text: 'the dark sky, a dark shape, the bright sun, dark water' },
        { text: 'dark night and dark clouds above' },
        { text: 'darkness falls; Dark sky; dark\tspace; dark forest' }
      ],
      hints: [
        'Ein Lookbehind schreibt sich (?<=…).',
        'Denk an das Leerzeichen zwischen „dark“ und dem Folgewort.',
        'Aufbau: (?<=dark\\s)\\w+'
      ],
      solution: '(?<=dark\\s)\\w+'
    },
    {
      id: 'l5-04', level: 5, title: 'Punkt zu Komma',
      task: 'Ersetze in Dezimalzahlen den <b>Punkt durch ein Komma</b>. Der Ersatztext <code>\\1,\\2</code> ist vorgegeben — du schreibst nur das Muster mit den passenden zwei Gruppen.',
      fn: 'sub', repl: '\\1,\\2',
      cases: [
        { text: 'Preise: 15.99 und 3.20 Euro' },
        { text: '0.5 sowie 100.25' },
        { text: 'Komma 2,50 bleibt; Punkt 7.00 wird geändert.' }
      ],
      hints: ['Zwei Gruppen: vor und nach dem Punkt.', 'Der Punkt in der Mitte muss maskiert sein.'],
      solution: '(\\d+)\\.(\\d+)'
    },
    {
      id: 'l5-05', level: 5, title: 'Whitespace normalisieren',
      task: 'Ersetze jede Folge von Leerraum durch <b>ein einzelnes Leerzeichen</b>. Der Ersatztext ist vorgegeben.',
      fn: 'sub', repl: ' ',
      cases: [
        { text: 'zu   viel\n\tLuft    hier' },
        { text: 'a\n\n\nb   c' },
        { text: '  Rand\tund\u00a0geschütztes Leerzeichen  ' }
      ],
      hints: ['Es gibt eine Kurzform für Leerraum — du brauchst „eine oder mehr“ davon.'],
      solution: '\\s+'
    },
    {
      id: 'l5-06', level: 5, title: 'Satzzeichen entfernen',
      task: 'Wirf alles weg, was <b>weder Wortzeichen noch Leerraum</b> ist — der übliche Cleaning-Schritt vor einer Textanalyse. Der Ersatz ist ein leerer String.',
      fn: 'sub', repl: '',
      cases: [
        { text: "Hallo, Welt! Geht's? Ja - klar." },
        { text: '#Python: 100% (wirklich)' },
        { text: 'Umlaute bleiben: Größe; Unter_strich auch.' }
      ],
      hints: ['Eine negierte Zeichenklasse, die zwei Kurzformen enthält.', 'Aufbau: [^\\w\\s]'],
      solution: '[^\\w\\s]'
    },
    {
      id: 'l5-07', level: 5, title: 'Sätze trennen',
      task: 'Zerlege den Text mit einer <b>einfachen Satzheuristik</b>: Getrennt wird am Leerraum zwischen einem Satzzeichen und einem folgenden ASCII-Großbuchstaben. Die Satzzeichen bleiben am Satz; Abkürzungen wie „z. B.“ können dabei bewusst falsch getrennt werden.',
      fn: 'split',
      cases: [
        { text: 'Er kam. Sie ging! Warum? Keiner weiß es.' },
        { text: 'Eins. Zwei. Drei.' },
        { text: 'Abkürzung z. B. bleibt heikel. klein beginnt nicht. Groß schon.' }
      ],
      hints: [
        'Getrennt wird nur der Leerraum selbst — also \\s+ als Muster.',
        'Links davon muss ein Satzzeichen stehen: Lookbehind.',
        'Rechts davon ein Großbuchstabe: Lookahead. Aufbau: (?<=[.!?])\\s+(?=[A-Z])'
      ],
      solution: '(?<=[.!?])\\s+(?=[A-Z])'
    },
    {
      id: 'l5-08', level: 5, title: 'Nur Wörter, keine Zahlen',
      task: 'Für eine Worthäufigkeitsanalyse: finde nur <b>reine Buchstabenfolgen</b>. Zahlen und Wörter mit Ziffern sollen draußen bleiben, deutsche Umlaute aber mitkommen.',
      cases: [
        { text: 'Über 42 schöne Wörter, version2 und straße' },
        { text: 'abc 123 a1b Grüße' },
        { text: 'Unter_strich, E-Mail und naïve: nur definierte Buchstabenfolgen' }
      ],
      hints: [
        '\\w wäre zu großzügig — es enthält Ziffern und den Unterstrich.',
        'Bau eine eigene Klasse aus a-z, A-Z und den Umlauten.',
        'Wortgrenzen sorgen dafür, dass „version2“ nicht als „version“ durchrutscht.'
      ],
      solution: '\\b[a-zA-ZäöüÄÖÜß]+\\b'
    },
    {
      id: 'l5-09', level: 5, title: 'Logzeilen parsen',
      task: 'Zerlege jede vollständige Logzeile in <b>Zeit</b>, <b>Level</b> und <b>Nachricht</b> — als drei benannte Gruppen <code>zeit</code>, <code>level</code>, <code>msg</code>. Geprüft wird das Zeitformat HH:MM:SS, nicht der gültige Wertebereich. Die Aufgabe verwendet <code>re.finditer</code>; Flag <code>m</code> ist nötig.',
      fn: 'finditer',
      cases: [
        { text: '09:12:01 INFO Start des Dienstes\n09:12:05 ERROR Verbindung verloren\n09:13:00 WARN Speicher knapp' },
        { text: '00:00:00 INFO a\n23:59:59 ERROR b' },
        { text: 'x 10:00:00 INFO nicht komplett\n10:00:01\tWARN\tknapp\n10:00 INFO zu kurze Zeit' }
      ],
      requireFlags: 'm',
      requireGroupNames: ['zeit', 'level', 'msg'],
      hints: [
        'Die Zeit hat das Format \\d{2}:\\d{2}:\\d{2}.',
        'Das Level ist eine Alternative — hier darf sie fangend sein, sie ist ja eine benannte Gruppe.',
        'Verankere mit ^ und $; zwischen den Feldern erlaubt [ \\t]+ horizontalen Whitespace, aber keinen Zeilenwechsel.'
      ],
      solution: '^(?P<zeit>\\d{2}:\\d{2}:\\d{2})[ \\t]+(?P<level>INFO|WARN|ERROR)[ \\t]+(?P<msg>.+)$', flags: 'm'
    },
    {
      id: 'l5-10', level: 5, title: 'E-Mail-Adressen',
      task: 'Finde mit einer <b>pragmatischen</b>, nicht vollständig RFC-konformen Regex die E-Mail-Adressen im Text. Punkte, Pluszeichen und Bindestriche dürfen im lokalen Teil und in der Domain vorkommen; ein abschließender Satzpunkt gehört nicht zur Adresse.',
      cases: [
        { text: 'Schreib an max.mustermann+news@uni-koeln.de oder info@test.io, nicht an @nowhere.' },
        { text: 'a@b.de, lange.adresse@sub.domain.com' },
        { text: 'Am Satzende info@test.io. Ohne Endung x@y; gültig a-b@sub.example.org' }
      ],
      hints: [
        'Vor dem @: Wortzeichen plus Punkt, Plus und Bindestrich.',
        'Nach dem @ folgen Labels aus Wortzeichen und Bindestrichen; jedes weitere Label beginnt mit einem Punkt.',
        'Aufbau: [\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+'
      ],
      solution: '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+'
    },
    {
      id: 'l5-11', level: 5, title: 'Passwort validieren',
      task: 'Prüfe zeilenweise, welche Passwörter <b>mindestens acht Zeichen</b> lang sind und mindestens einen ASCII-Großbuchstaben A–Z sowie eine Unicode-Dezimalziffer enthalten. Alle übrigen Zeichen außer Zeilenumbrüchen — auch Leerzeichen — sind erlaubt. Flag <code>m</code> ist nötig.',
      cases: [
        { text: 'passwort\nPasswort\nPasswort1\nPw1\nGeheim2024' },
        { text: 'Abcdefg1\nabcdefg1\nABCDEFG1\nAbcdefgh' },
        { text: 'Passwort٣\nÄbcdefg1\nAbc def1\nKurzA1' }
      ],
      requireFlags: 'm',
      hints: [
        'Zwei gestapelte Lookaheads am Zeilenanfang prüfen die Bedingungen.',
        '(?=.*[A-Z]) heißt „irgendwo rechts kommt ein Großbuchstabe“.',
        'Aufbau: ^(?=.*[A-Z])(?=.*\\d).{8,}$'
      ],
      solution: '^(?=.*[A-Z])(?=.*\\d).{8,}$', flags: 'm'
    },
    {
      id: 'l5-12', level: 5, title: 'Zahl ohne Prozentzeichen',
      task: 'Finde eigenständige positive <b>Ganzzahlen</b>, auf die nicht unmittelbar ein Prozentzeichen folgt. Teile von Dezimalzahlen und Bezeichnern dürfen ebenfalls nicht erscheinen.',
      cases: [
        { text: 'Anteil 40% von 200 Stück, Rabatt 15% auf 99 Euro' },
        { text: '10% 20 30% 40' },
        { text: 'Dezimal 3.14, Quote 2,50, frei 7 und 8% sowie x9.' }
      ],
      hints: [
        'Der negative Lookahead schreibt sich (?!…).',
        'Mit (?<![\\w.,]) schließt du einen Wort-, Punkt- oder Komma-Nachbarn links aus.',
        'Rechts dürfen weder ein Wortzeichen noch ein Dezimaltrenner mit folgender Ziffer stehen; danach folgt der Prozent-Lookahead.'
      ],
      solution: '(?<![\\w.,])\\d+(?!\\w|[.,]\\d)(?!%)'
    }
  ];
})(window);
