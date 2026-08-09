# Regex Trainer

Interaktiver Trainer für reguläre Ausdrücke — gebaut für die Data-Science-Klausur,
aber bewusst allgemein gehalten.

## Starten

`index.html` doppelklicken. Das war's — kein Build, keine Installation, keine
Internetverbindung. Alle Skripte sind klassische `<script>`-Tags mit relativen
Pfaden, deshalb funktioniert auch `file://`.

Wer lieber über einen Server geht:

```bash
python3 -m http.server 4173 --directory .
```

> Auf `file://` schränken manche Browser `localStorage` ein. Die App läuft dann
> normal, merkt sich aber den Fortschritt nicht. Über einen lokalen Server bleibt
> alles gespeichert.

## Die fünf Bereiche

| Bereich          | Was drin ist |
|------------------|--------------|
| **Lernen**       | 10 Kapitel vom ersten Muster bis zur Textanalyse, mit editierbaren Beispielen |
| **Nachschlagen** | 118 Einträge: Syntax, `re`-Befehle, Match-Objekt, pandas `.str`, Rezepte, Stolperfallen |
| **Playground**   | Live-Tester mit Trefferhervorhebung, Gruppenansicht und Baustein-für-Baustein-Erklärung |
| **Training**     | 46 Aufgaben in 5 Stufen, jede gegen mehrere Texte geprüft |
| **Quiz**         | 34 Multiple-Choice-Fragen nach Klausurmuster |

Tastatur: `1`–`5` wechseln die Ansicht, `⌘K` springt in die Suche.

## Warum eine eigene Engine

Der Browser bringt eine JavaScript-Regex-Engine mit, die Klausur ist aber Python.
Die beiden unterscheiden sich real — `\w+` auf `"Wörter"` ergibt in Python
`['Wörter']`, in JavaScript `['W', 'rter']`. `js/engine.js` übersetzt deshalb jedes
Muster vor dem Ausführen:

- `\w \d \b` unicode-bewusst wie Python 3 (mit `re.A` schaltbar)
- `(?P<name>…)`, `(?P=name)`, `(?#…)`, `\A`, `\Z`, `{,m}`, `re.X`
- `$` matcht auch vor einem abschließenden `\n`
- Backslash vor Interpunktion (`\-`, `\%`), die JavaScript im Unicode-Modus ablehnt
- die Gruppenregel von `findall`: 0 Gruppen → Treffer, 1 → Gruppe, mehrere → Tupel
- `sub` mit `\1` und `\g<name>`, `split` inklusive Gruppeninhalten

Lässt sich ein Muster nicht als Unicode-Variante übersetzen, fällt die Engine auf
ASCII zurück und sagt das im Hinweisfeld dazu.

## Aufbau

```
index.html
css/styles.css
js/
  engine.js          Python-Semantik im Browser
  explain.js         zerlegt ein Muster in erklärte Bausteine
  core.js            geteilte UI-Bausteine (Editor, Flags, Demo-Widget)
  store.js           Fortschritt im localStorage
  data-*.js          Inhalte: Referenz, Lektionen, Aufgaben, Quiz
  ui-*.js            je eine Datei pro Ansicht
  boot.js            Router, Theme, Tastatur
tests/selftest.js    Prüfstand (Node, ohne Abhängigkeiten)
```

## Tests

```bash
node tests/selftest.js
```

Prüft die Engine gegen bekannte Python-Ergebnisse und stellt sicher, dass jedes
Referenzbeispiel, jede Lektions-Demo und jede Musterlösung tatsächlich läuft.
`-v` zeigt zu jeder Aufgabe das erzeugte Soll-Ergebnis.

Die Soll-Ergebnisse der Übungen werden zur Laufzeit aus der Musterlösung berechnet.
Aufgabentext und Prüfung können dadurch nicht auseinanderlaufen.

## Inhalte ändern

Alles Inhaltliche steckt in den `data-*.js`-Dateien und ist reines JSON-artiges
JavaScript. Eine neue Aufgabe braucht Titel, Aufgabentext, mindestens zwei
Testtexte, gestufte Tipps und eine Musterlösung:

```js
{
  id: 'l2-10', level: 2, title: 'Neue Aufgabe',
  task: 'Finde …',
  cases: [{ text: 'erster Testtext' }, { text: 'Gegenprobe' }],
  hints: ['erster Anstoß', 'konkreter', 'fast die Lösung'],
  solution: '\\d+'
}
```

## Hinweis zum Praktikum

Die Übersicht im Praktikums-Notebook beschreibt `re.match` als Prüfung auf
*vollständige* Übereinstimmung. Das ist `re.fullmatch`; `re.match` verankert nur am
Stringanfang und lässt beliebigen Rest zu. Im Trainer steht die korrekte Bedeutung,
und der Unterschied ist als Stolperfalle markiert.
