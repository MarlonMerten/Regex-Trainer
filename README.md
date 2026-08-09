# Regex Trainer

Interaktiver Trainer für reguläre Ausdrücke — mit **Python-Semantik im Browser**.
Entstanden zur Vorbereitung auf eine Data-Science-Klausur, bewusst allgemein gehalten.

## Was er kann

| Bereich | Umfang |
|---|---|
| **Lernen** | 10 Kapitel vom ersten Muster bis zur Textanalyse, jedes Beispiel editierbar |
| **Nachschlagen** | 118 Einträge: Syntax, `re`-Befehle, Match-Objekt, pandas `.str`, Rezepte, Stolperfallen |
| **Playground** | Live-Tester mit Trefferhervorhebung, Gruppenansicht und Baustein-für-Baustein-Erklärung |
| **Training** | 46 Aufgaben in 5 Stufen, jede gegen mehrere Testtexte geprüft |
| **Quiz** | 34 Multiple-Choice-Fragen nach Klausurmuster |

Tastatur: `1`–`5` wechseln die Ansicht, `⌘K` springt in die Suche.

## Starten

`app/index.html` doppelklicken. Kein Build, keine Installation, offline nutzbar.

Die App ist rein statisch und nutzt Hash-Routing (`#play`, `#train`), lässt sich
also ohne Sonderkonfiguration auf jedem Static-Host ausliefern — das Verzeichnis
`app/` ist dabei das Wurzelverzeichnis.

Oder über einen lokalen Server, damit der Fortschritt gespeichert bleibt:

```bash
python3 -m http.server 4173 --directory app
```

## Warum eine eigene Regex-Engine

Der Browser bringt eine JavaScript-Engine mit, die Klausur ist aber Python — und die
beiden unterscheiden sich real. `\w+` auf `"Wörter"` ergibt in Python `['Wörter']`,
in JavaScript `['W', 'rter']`.

[`app/js/engine.js`](app/js/engine.js) übersetzt deshalb jedes Muster vor dem Ausführen:

- `\w \d \b` unicode-bewusst wie Python 3 (per `re.A` umschaltbar)
- `(?P<name>…)`, `(?P=name)`, `(?#…)`, `\A`, `\Z`, `{,m}`, `re.X`
- `$` matcht auch vor einem abschließenden `\n`
- die Gruppenregel von `findall`: 0 Gruppen → Treffer, 1 → Gruppe, mehrere → Tupel
- `sub` mit `\1` und `\g<name>`, `split` inklusive Gruppeninhalten

## Aufbau

```
app/
  index.html
  css/styles.css
  js/
    engine.js     Python-Semantik im Browser
    explain.js    zerlegt ein Muster in erklärte Bausteine
    core.js       geteilte UI-Bausteine
    store.js      Fortschritt im localStorage
    data-*.js     Inhalte: Referenz, Lektionen, Aufgaben, Quiz
    ui-*.js       je eine Datei pro Ansicht
    boot.js       Router, Theme, Tastatur
  tests/selftest.js
```

Alles Inhaltliche steckt in den `data-*.js`-Dateien. Details in
[`app/README.md`](app/README.md).

## Tests

```bash
node app/tests/selftest.js
```

382 Prüfungen: die Engine gegen bekannte Python-Ergebnisse, dazu jedes
Referenzbeispiel, jede Lektions-Demo und jede Musterlösung. Keine Abhängigkeiten.

## Lizenz

MIT
