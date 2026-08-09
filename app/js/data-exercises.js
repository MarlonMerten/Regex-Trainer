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
      id: 'l1-01', level: 1, title: 'Ganze Zahlen finden',
      task: 'Finde alle Zahlen im Text. Es geht zunächst nur um <b>zusammenhängende Ziffernfolgen</b>.',
      cases: [
        { text: 'Heute hat jemand 20 Bananen gekauft und 50 Euro bezahlt.' },
        { text: 'Im Jahr 2024 gab es 7 Versuche und 1 Erfolg.' }
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
        { text: 'PIN 4711' }
      ],
      hints: ['Was passiert, wenn du den Quantifizierer einfach weglässt?'],
      solution: '\\d'
    },
    {
      id: 'l1-03', level: 1, title: 'Wörter herausziehen',
      task: 'Finde alle <b>Wörter</b>. Satzzeichen sollen nicht mitkommen.',
      cases: [
        { text: 'Hallo Welt! Wie geht es dir?' },
        { text: 'Punkt. Komma, Strich - fertig!' }
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
        { text: '  a  b\nc  ' }
      ],
      hints: ['Die Großschreibung einer Kurzform kehrt ihre Bedeutung um.', '\\s ist Leerraum — was ist dann das Gegenteil?'],
      solution: '\\S+'
    },
    {
      id: 'l1-05', level: 1, title: 'Ein bestimmtes Wort',
      task: 'Zähle, wie oft das Wort <b>Katze</b> vorkommt — genau so geschrieben, mit großem K.',
      cases: [
        { text: 'Die Katze jagt eine andere Katze, die katze schläft.' },
        { text: 'Keine Katze weit und breit außer der Katze dort.' }
      ],
      hints: ['Ganz normale Buchstaben brauchen keine Sonderzeichen.'],
      solution: 'Katze'
    },
    {
      id: 'l1-06', level: 1, title: 'Der Punkt ist besonders',
      task: 'Finde alle <b>echten Punkte</b> im Text — nicht „irgendein Zeichen“.',
      cases: [
        { text: 'Version 3.14. Ende.' },
        { text: 'a.b.c' }
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
        { text: 'Werte: 0.5, 12, 100.25 und 7' }
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
        { text: 'color colour colur' }
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
        { text: 'Ein schoenes Beispiel' }
      ],
      hints: ['Eigene Zeichenmengen stehen in eckigen Klammern.'],
      solution: '[aeiou]'
    },
    {
      id: 'l2-02', level: 2, title: 'Alles außer Vokalen',
      task: 'Jetzt umgekehrt: alle Zeichen, die <b>keine</b> Vokale und <b>keine Leerzeichen</b> sind.',
      cases: [
        { text: 'Haus am Meer' },
        { text: 'abc xyz' }
      ],
      hints: ['Ein Dach direkt hinter der öffnenden Klammer negiert die Menge.', 'Das Leerzeichen muss mit in die verbotene Menge.'],
      solution: '[^aeiou ]'
    },
    {
      id: 'l2-03', level: 2, title: 'Wörter mit genau fünf Zeichen',
      task: 'Finde alle Wörter, die aus <b>genau fünf</b> Wortzeichen bestehen.',
      cases: [
        { text: 'Heute ist ein guter Tag zum Lernen' },
        { text: 'abcd abcde abcdef abcde' }
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
        { text: 'Rufe 12345-678 an, nicht 1-2' }
      ],
      hints: ['Geschweifte Klammern können auch einen Bereich angeben: {min,max}'],
      solution: '\\d{3,5}-\\d{3,5}'
    },
    {
      id: 'l2-05', level: 2, title: 'Hex-Farbcodes',
      task: 'Finde Farbcodes wie <code>#1A2B3C</code>: eine Raute und <b>genau sechs</b> Zeichen aus 0–9 und A–F.',
      cases: [
        { text: 'Farben: #1A2B3C, #FF0000 und #GG1122' },
        { text: '#ABCDEF #12345 #0f0f0f' }
      ],
      hints: [
        'Die Raute ist ein ganz normales Zeichen.',
        'In eine Zeichenklasse kannst du mehrere Bereiche packen: [0-9A-F]',
        'Klein geschriebene Buchstaben zählen hier nicht mit.'
      ],
      solution: '#[0-9A-F]{6}'
    },
    {
      id: 'l2-06', level: 2, title: 'Dezimalzahl mit Punkt oder Komma',
      task: 'Finde Zahlen, die <b>optional</b> Nachkommastellen haben — der Trenner darf Punkt oder Komma sein. Ganze Zahlen sollen ebenfalls gefunden werden.',
      cases: [
        { text: 'Die Preise waren 2,50 euro, 3.20 Euros und 10 Euro.' },
        { text: '0,5 · 100 · 12.75 · 8' }
      ],
      hints: [
        'Erst der ganzzahlige Teil, dann ein optionaler Nachkommateil.',
        'Der Trenner ist eine Zeichenklasse aus Punkt und Komma: [.,]',
        'Den optionalen Teil klammerst du mit (?:…)? ein — die nicht-fangende Gruppe hält findall sauber.'
      ],
      solution: '\\d+(?:[.,]\\d+)?'
    },
    {
      id: 'l2-07', level: 2, title: 'Gier bändigen',
      task: 'Finde die <b>einzelnen</b> Zitate in Anführungszeichen. Achtung: die naive Lösung verschluckt alles dazwischen.',
      cases: [
        { text: 'Er sagte "hallo" und dann "tschüss".' },
        { text: '"a" x "b" y "c"' }
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
        { text: '<p><b>fett</b></p>' }
      ],
      hints: ['Zwischen den spitzen Klammern darf alles stehen — außer der schließenden Klammer.'],
      solution: '<[^>]+>'
    },
    {
      id: 'l2-09', level: 2, title: 'Zahl mit Einheit',
      task: 'Finde Gewichtsangaben: eine Zahl, optional ein Leerzeichen, dann <b>kg</b> oder <b>g</b>.',
      cases: [
        { text: 'Das Paket wiegt 50 kg, der Brief 100g und die Kiste 7 kg.' },
        { text: '5kg 12 g 3 t' }
      ],
      hints: [
        'Das Leerzeichen ist optional — dafür gibt es ?',
        'Für „kg oder g“ brauchst du eine Alternative in nicht-fangenden Klammern.',
        'Reihenfolge zählt: (?:kg|g) — sonst matcht g zuerst und kg wird nie erreicht.'
      ],
      solution: '\\d+\\s?(?:kg|g)'
    },

    /* ==================== LEVEL 3 ==================== */
    {
      id: 'l3-01', level: 3, title: 'Nur das ganze Wort',
      task: 'Finde das Wort <b>cat</b> — aber nicht, wenn es Teil eines längeren Wortes ist.',
      cases: [
        { text: 'cat catalog scattered cat.' },
        { text: 'The cat sat on concatenate' }
      ],
      hints: ['Es gibt einen Anker für Wortgrenzen.', 'Er gehört vorne UND hinten hin: \\bcat\\b'],
      solution: '\\bcat\\b'
    },
    {
      id: 'l3-02', level: 3, title: 'man und men',
      task: 'Zähle die Wörter <b>man</b> und <b>men</b> — jeweils als eigenständige Wörter, Groß- und Kleinschreibung soll zählen (also auch <b>Man</b> und <b>Men</b>). „mankind“ und „woman“ dürfen nicht mitgezählt werden.',
      cases: [
        { text: 'A man among men. Man and Men. But not mankind, woman or women.' },
        { text: 'men mention Manager Man' }
      ],
      hints: [
        'Wortgrenzen vorne und hinten.',
        'Der erste Buchstabe darf groß oder klein sein: [Mm]',
        'Der Vokal ist a oder e: [Mm]e?… — nein, einfacher: [Mm][ae]n'
      ],
      solution: '\\b[Mm][ae]n\\b'
    },
    {
      id: 'l3-03', level: 3, title: 'Wörter mit Präfix',
      task: 'Finde alle Wörter, die mit <b>un</b> beginnen.',
      cases: [
        { text: 'unglaublich unfair, aber verständlich und rund' },
        { text: 'Ungenau, unter uns: unmöglich' }
      ],
      hints: ['Wortgrenze, dann das Präfix, dann der Rest des Wortes.', 'Der Rest ist \\w* — beliebig viele Wortzeichen.'],
      solution: '\\bun\\w*'
    },
    {
      id: 'l3-04', level: 3, title: 'Wörter mit Endung',
      task: 'Finde alle englischen Verlaufsformen — also Wörter, die auf <b>ing</b> enden.',
      cases: [
        { text: 'running, jumping, singing, run, king' },
        { text: 'Nothing is missing in the ring' }
      ],
      hints: ['Wortgrenze, dann beliebige Wortzeichen, dann ing, dann wieder Wortgrenze.'],
      solution: '\\b\\w+ing\\b'
    },
    {
      id: 'l3-05', level: 3, title: 'Abkürzungen',
      task: 'Finde Wörter aus <b>mindestens zwei Großbuchstaben</b> am Stück.',
      cases: [
        { text: 'In den USA und der EU gilt die DSGVO. Ein A allein nicht.' },
        { text: 'HTML, CSS und JS — aber Java nicht.' }
      ],
      hints: ['{2,} bedeutet „mindestens zwei“.', 'Wortgrenzen verhindern, dass „ABc“ als „AB“ durchgeht.'],
      solution: '\\b[A-Z]{2,}\\b'
    },
    {
      id: 'l3-06', level: 3, title: 'Wörter mit Großbuchstaben am Anfang',
      task: 'Finde alle Wörter, die mit einem <b>Großbuchstaben</b> beginnen.',
      cases: [
        { text: 'Herr Meier geht nach Köln und trifft dort Anna.' },
        { text: 'anna Bert carla Dora' }
      ],
      hints: ['Wortgrenze, ein Großbuchstabe, dann beliebig viele Wortzeichen.'],
      solution: '\\b[A-ZÄÖÜ]\\w*'
    },
    {
      id: 'l3-07', level: 3, title: 'Zeilenanfänge',
      task: 'Finde das <b>erste Wort jeder Zeile</b>. Aktiviere dazu das Flag <code>m</code> unter dem Eingabefeld.',
      cases: [
        { text: 'Zeile eins\nZeile zwei\nAnders hier' },
        { text: 'alpha beta\ngamma delta' }
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
        { text: 'a b c\nd e f' }
      ],
      requireFlags: 'm',
      hints: ['$ steht für das Ende.'],
      solution: '\\w+$', flags: 'm'
    },

    /* ==================== LEVEL 4 ==================== */
    {
      id: 'l4-01', level: 4, title: 'Eine Gruppe herausziehen',
      task: 'Gib nur die <b>Jahreszahlen</b> zurück, nicht das Wort „Jahr“ davor. Nutze eine fangende Gruppe.',
      cases: [
        { text: 'Jahr 2019, Jahr 2024 und irgendwo 1999' },
        { text: 'Jahr 2000 Jahr 2001 2002' }
      ],
      hints: [
        'Mit Klammern fängst du einen Teil des Treffers ein.',
        'Bei genau einer Gruppe gibt findall nur diese Gruppe zurück.',
        'Aufbau: Jahr\\s(\\d{4})'
      ],
      solution: 'Jahr\\s(\\d{4})'
    },
    {
      id: 'l4-02', level: 4, title: 'Zwei Gruppen — Tupel',
      task: 'Zerlege Zeitspannen wie <code>2019-2024</code> in <b>zwei Gruppen</b>. Das Ergebnis besteht dann aus Tupeln.',
      cases: [
        { text: 'Zeitraum 2019-2024 und 1990-1999' },
        { text: '2000-2010, 2011-2020' }
      ],
      hints: ['Zwei Klammerpaare, dazwischen der Bindestrich.'],
      solution: '(\\d{4})-(\\d{4})'
    },
    {
      id: 'l4-03', level: 4, title: 'Gruppe vermeiden',
      task: 'Finde <b>Euro-Beträge</b> als ganze Treffer — also inklusive Währung. Die Währung darf <code>Euro</code> oder <code>euro</code> heißen. <b>Wichtig:</b> das Ergebnis soll die kompletten Treffer enthalten, keine Gruppen.',
      cases: [
        { text: '100 Euro und 200euro sowie 300 Dollar' },
        { text: '5euro, 10 Euro, 15 EUR' }
      ],
      hints: [
        'Für „Euro oder euro“ brauchst du eine Alternative.',
        'Mit normalen Klammern liefert findall plötzlich nur die Währung.',
        'Die Lösung heißt (?:…) — nicht-fangende Gruppe.'
      ],
      solution: '\\d+\\s?(?:Euro|euro)'
    },
    {
      id: 'l4-04', level: 4, title: 'Alternativen richtig klammern',
      task: 'Finde die Tiere <b>Hund</b>, <b>Katze</b> oder <b>Maus</b> als eigenständige Wörter.',
      cases: [
        { text: 'Hund, Katze und Vogel, dazu eine Maus und ein Hundeleine-Regal' },
        { text: 'Mausklick Maus Katzenfutter Katze' }
      ],
      hints: [
        'Die Alternativen gehören in Klammern, sonst gilt \\b nur für die erste.',
        'Nicht-fangend klammern, damit findall die ganzen Wörter liefert.'
      ],
      solution: '\\b(?:Hund|Katze|Maus)\\b'
    },
    {
      id: 'l4-05', level: 4, title: 'Doppelte Buchstaben',
      task: 'Finde Stellen, an denen <b>derselbe Buchstabe zweimal hintereinander</b> steht.',
      cases: [
        { text: 'cool, Ebbe, Schifffahrt, egal' },
        { text: 'aabbcd eeff' }
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
        { text: 'Ein Fehler schleicht sich sich ein.' }
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
      task: 'Zerlege deutsche Datumsangaben in die benannten Gruppen <b>tag</b>, <b>monat</b> und <b>jahr</b> (Format TT.MM.JJJJ).',
      cases: [
        { text: 'Abgabe am 24.12.2025, Klausur am 07.02.2026' },
        { text: '01.01.2000 und 31.12.1999' }
      ],
      hints: [
        'Python schreibt benannte Gruppen als (?P<name>…).',
        'Die Punkte müssen maskiert werden.',
        'Aufbau: (?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})'
      ],
      solution: '(?P<tag>\\d{2})\\.(?P<monat>\\d{2})\\.(?P<jahr>\\d{4})'
    },
    {
      id: 'l4-08', level: 4, title: 'Link-Ziele',
      task: 'Ziehe aus den HTML-Links nur die <b>Adresse</b> heraus, die in <code>href="…"</code> steht.',
      cases: [
        { text: '<a class="x" href="page.html">Link</a> und <a href="http://a.de">A</a>' },
        { text: '<a href="/start">Start</a><a id="q" href="ende.htm">Ende</a>' }
      ],
      hints: [
        'Suche nach href=" und fange danach alles bis zum nächsten Anführungszeichen.',
        'Eine negierte Klasse ist hier besser als .*?',
        'Aufbau: href="([^"]+)"'
      ],
      solution: 'href="([^"]+)"'
    },
    {
      id: 'l4-09', level: 4, title: 'Zeilen in Felder zerlegen',
      task: 'Jede Zeile besteht aus einem Namen und einer Zahl. Zerlege sie in <b>zwei Gruppen</b>. Aktiviere das Flag <code>m</code>.',
      cases: [
        { text: 'apfel 12\nbirne 7\nkirsche 30' },
        { text: 'a 1\nbb 22' }
      ],
      requireFlags: 'm',
      hints: ['Verankere die Zeile mit ^ und $.', 'Aufbau: ^(\\w+)\\s+(\\d+)$'],
      solution: '^(\\w+)\\s+(\\d+)$', flags: 'm'
    },

    /* ==================== LEVEL 5 ==================== */
    {
      id: 'l5-01', level: 5, title: 'Betrag ohne Währung',
      task: 'Gib nur die <b>Zahlen</b> zurück, auf die <code>Euro</code> folgt (Groß-/Kleinschreibung und Plural erlaubt, Leerzeichen optional). Die Währung selbst darf <b>nicht</b> im Ergebnis stehen — und benutze dafür einen <b>Lookahead</b>, keine Gruppe.',
      cases: [
        { text: '100 Euro, 200 euros, 300euro, 400Euros, 500 Dollar' },
        { text: '7euro und 8 Euros, aber 9 Punkte' }
      ],
      hints: [
        'Ein Lookahead schreibt sich (?=…) und verbraucht nichts.',
        'Innerhalb des Lookaheads: optionaler Leerraum, dann die Währung.',
        'Aufbau: \\d+(?=\\s?[Ee]uros?)'
      ],
      solution: '\\d+(?=\\s?[Ee]uros?)'
    },
    {
      id: 'l5-02', level: 5, title: 'Find the money',
      task: 'Der große Klassiker aus dem Praktikum: extrahiere <b>alle Geldbeträge samt Währung</b>. Erlaubt sind Punkt und Komma als Dezimaltrenner, optionaler Abstand und die Schreibweisen <code>€</code>, <code>Euro</code>, <code>euro</code>, <code>Euros</code>, <code>euros</code>. Die Angabe <code>50 kg</code> darf <b>nicht</b> mitkommen.',
      cases: [
        { text: 'A hat 200 euro an B gegeben für ein Gerät das trotz 50 kg nur 100Euro wert ist. Immerhin hat B A danach für 20.50 Euros zum Essen eingeladen. Die 0,50 euro Trinkgeld zeigen aber wie geizig er ist. Am liebsten würde A 500 € pro Tag verdienen.' },
        { text: '1,99€ · 2.00 Euro · 3 euros · 4 kg · 5EURO' }
      ],
      hints: [
        'Fang mit \\d+ an und häng die optionalen Nachkommastellen an.',
        'Dann optionaler Leerraum: \\s*',
        'Dann die Währung als nicht-fangende Alternative: (?:€|[Ee]uros?)'
      ],
      solution: '\\d+(?:[.,]\\d+)?\\s*(?:€|[Ee]uros?)'
    },
    {
      id: 'l5-03', level: 5, title: 'Wort im Kontext',
      task: 'Welche Wörter folgen direkt auf <b>dark</b>? Gib nur das folgende Wort zurück — mit einem <b>Lookbehind</b>.',
      cases: [
        { text: 'the dark sky, a dark shape, the bright sun, dark water' },
        { text: 'dark night and dark clouds above' }
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
        { text: '0.5 sowie 100.25' }
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
        { text: 'a\n\n\nb   c' }
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
        { text: '#Python: 100% (wirklich)' }
      ],
      hints: ['Eine negierte Zeichenklasse, die zwei Kurzformen enthält.', 'Aufbau: [^\\w\\s]'],
      solution: '[^\\w\\s]'
    },
    {
      id: 'l5-07', level: 5, title: 'Sätze trennen',
      task: 'Zerlege den Text in <b>Sätze</b>. Getrennt wird am Leerraum zwischen einem Satzzeichen und einem folgenden Großbuchstaben — die Satzzeichen sollen also <b>am Satz bleiben</b>.',
      fn: 'split',
      cases: [
        { text: 'Er kam. Sie ging! Warum? Keiner weiß es.' },
        { text: 'Eins. Zwei. Drei.' }
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
        { text: 'abc 123 a1b Grüße' }
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
      task: 'Zerlege jede Logzeile in <b>Zeit</b>, <b>Level</b> und <b>Nachricht</b> — als drei benannte Gruppen <code>zeit</code>, <code>level</code>, <code>msg</code>. Level ist <code>INFO</code>, <code>WARN</code> oder <code>ERROR</code>. Flag <code>m</code> ist nötig.',
      cases: [
        { text: '09:12:01 INFO Start des Dienstes\n09:12:05 ERROR Verbindung verloren\n09:13:00 WARN Speicher knapp' },
        { text: '00:00:00 INFO a\n23:59:59 ERROR b' }
      ],
      requireFlags: 'm',
      hints: [
        'Die Zeit hat das Format \\d{2}:\\d{2}:\\d{2}.',
        'Das Level ist eine Alternative — hier darf sie fangend sein, sie ist ja eine benannte Gruppe.',
        'Die Nachricht ist der Rest der Zeile: .+ (der Punkt matcht kein \\n, das reicht also).'
      ],
      solution: '(?P<zeit>\\d{2}:\\d{2}:\\d{2})\\s+(?P<level>INFO|WARN|ERROR)\\s+(?P<msg>.+)', flags: 'm'
    },
    {
      id: 'l5-10', level: 5, title: 'E-Mail-Adressen',
      task: 'Finde die <b>E-Mail-Adressen</b> im Text. Punkte, Pluszeichen und Bindestriche dürfen im lokalen Teil und in der Domain vorkommen.',
      cases: [
        { text: 'Schreib an max.mustermann+news@uni-koeln.de oder info@test.io, nicht an @nowhere.' },
        { text: 'a@b.de, lange.adresse@sub.domain.com' }
      ],
      hints: [
        'Vor dem @: Wortzeichen plus Punkt, Plus und Bindestrich.',
        'Nach dem @: Wortzeichen und Bindestrich, dann ein Punkt, dann die Endung.',
        'Aufbau: [\\w.+-]+@[\\w-]+\\.[\\w.]+'
      ],
      solution: '[\\w.+-]+@[\\w-]+\\.[\\w.]+'
    },
    {
      id: 'l5-11', level: 5, title: 'Passwort validieren',
      task: 'Prüfe zeilenweise, welche Passwörter <b>mindestens acht Zeichen</b> lang sind und <b>mindestens einen Großbuchstaben</b> sowie <b>mindestens eine Ziffer</b> enthalten. Gib die gültigen Zeilen zurück. Flag <code>m</code> ist nötig.',
      cases: [
        { text: 'passwort\nPasswort\nPasswort1\nPw1\nGeheim2024' },
        { text: 'Abcdefg1\nabcdefg1\nABCDEFG1\nAbcdefgh' }
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
      task: 'Finde alle Zahlen, auf die <b>kein</b> Prozentzeichen folgt — mit einem <b>negativen Lookahead</b>.',
      cases: [
        { text: 'Anteil 40% von 200 Stück, Rabatt 15% auf 99 Euro' },
        { text: '10% 20 30% 40' }
      ],
      hints: [
        'Der negative Lookahead schreibt sich (?!…).',
        'Ohne Wortgrenzen findest du in „40%“ noch die Teilzahl „4“ — denn auf die 4 folgt eine 0, kein Prozentzeichen.',
        'Aufbau: \\b\\d+\\b(?!%)'
      ],
      solution: '\\b\\d+\\b(?!%)'
    }
  ];
})(window);
