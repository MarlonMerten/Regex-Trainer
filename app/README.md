# Regex Trainer

Interaktiver Trainer für reguläre Ausdrücke — gebaut für die Data-Science-Klausur,
aber bewusst allgemein gehalten.

## Starten

Für den vollständigen Funktionsumfang vom Repository-Root einen lokalen Server
starten:

```bash
python3 -m http.server 4173 --directory app
```

Danach `http://localhost:4173` öffnen. Alternativ lässt sich `index.html` direkt
öffnen. Bei diesem `file://`-Kompatibilitätsmodus können Browser `localStorage`
einschränken; außerdem fehlen Service Worker, Offline-Cache, Update-Hinweis und der
600-ms-Worker-Abbruch gegen starkes Backtracking.

## Die fünf Bereiche

| Bereich          | Was drin ist |
|------------------|--------------|
| **Lernen**       | 10 Kapitel vom ersten Muster bis zur Textanalyse, mit editierbaren Beispielen |
| **Nachschlagen** | 119 Einträge: Syntax, `re`-Befehle, Match-Objekt, pandas `.str`, Rezepte, Stolperfallen |
| **Playground**   | Live-Tester mit Trefferhervorhebung, Gruppenansicht und Baustein-für-Baustein-Erklärung |
| **Training**     | 53 Aufgaben in 5 Stufen, jede gegen drei Texte geprüft |
| **Quiz**         | 36 Multiple-Choice-Fragen nach Klausurmuster |

Tastatur: `1`–`5` wechseln die Ansicht, `⌘K` springt in die Suche.

## Warum eine eigene Engine

Der Browser bringt eine JavaScript-Regex-Engine mit, die Klausur ist aber Python
3.14.
Die beiden unterscheiden sich real — `\w+` auf `"Wörter"` ergibt in Python
`['Wörter']`, in JavaScript `['W', 'rter']`. `js/engine.js` übersetzt deshalb die
vom Trainer unterstützte Teilmenge vor dem Ausführen:

- `\w \d \b` unicode-bewusst wie Python 3 (mit `re.A` schaltbar)
- `(?P<name>…)`, `(?P=name)`, `(?#…)`, `\A`, `\Z`/`\z`, `{,m}`, `re.X`
- das Python-3.14-Verhalten von `\B`, auch auf dem leeren String
- `$` matcht auch vor einem abschließenden `\n`
- Backslash vor Interpunktion (`\-`, `\%`), die JavaScript im Unicode-Modus ablehnt
- die Gruppenregel von `findall`: 0 Gruppen → Treffer, 1 → Gruppe, mehrere → Tupel
- `sub` mit `\1` und `\g<name>`, `split` inklusive Gruppeninhalten

Nicht unterstützt sind derzeit `\N{name}`, atomare Gruppen, possessive
Quantifizierer, bedingte Gruppen, quantifizierte Lookarounds und
bereichsbezogene Inline-Flags. Python-gültige Konstrukte mit abweichender
Browser-Capture-Historie werden mit einer erklärenden Meldung abgelehnt, statt
ein falsches Resultat zu zeigen. Case-insensitive Rückverweise besitzen für die
wenigen abweichenden Unicode-Faltungen zusätzliche Schutzgrenzen; `re.L` erzeugt
eine Warnung. Mehr als 20.000 Treffer brechen mit einer ausdrücklichen Meldung ab.
Für produktionskritische Muster bleibt CPython 3.14 maßgeblich.

## Aufbau

```
index.html
manifest.json       Metadaten für die installierbare Web-App
sw.js               Offline-Cache und kontrollierte Updates
css/styles.css
js/
  engine.js          Python-3.14-Kompatibilitätsschicht
  regex-worker.js    begrenzt Live-Auswertungen außerhalb des UI-Threads
  explain.js         zerlegt ein Muster in erklärte Bausteine
  core.js            geteilte UI-Bausteine (Editor, Flags, Demo-Widget)
  store.js           Fortschritt im localStorage
  data-*.js          Inhalte: Referenz, Lektionen, Aufgaben, Quiz
  ui-*.js            je eine Datei pro Ansicht
  boot.js            Router, Theme, Tastatur
tests/
  selftest.js        interne Engine-, Inhalts- und Highlighter-Regressionen
  python-differential.js  Vergleich mit CPython 3.14
  browser/
    smoke.spec.js          Kernabläufe, Worker, Offline und WCAG
    navigation.spec.js     History, Deep Links und Importhärtung
    training-mobile.spec.js Aufgabenregeln und 320-px-Reflow
    pwa-update.spec.js     kontrollierter A→B-Updateablauf
```

## Tests

Vom Repository-Root mit Node.js 20 oder neuer und CPython 3.14:

```bash
npm ci
npm test                         # Syntax, 461 interne und 392 CPython-/Schutzprüfungen
npx playwright install chromium  # einmalig lokal
npm run test:browser             # 20 Browserprüfungen
npm run test:all                 # alle Prüfungen
```

Für den Differentialtest muss `python3 --version` Python 3.14 melden. Der Selftest
prüft Engine, Inhalte und Highlighter; Playwright prüft Router und Deep Links,
Codegenerierung, den direkten `file://`-Start, gecachten Offline-Reload, einen
kontrollierten PWA-Updatewechsel, WCAG-A/AA in beiden Themes und alle Lektionen
bei 320 Pixel Breite.

Die Soll-Ergebnisse der Übungen werden zur Laufzeit aus der Musterlösung berechnet.
Das verhindert doppelt gepflegte Ergebnislisten, garantiert aber nicht allein,
dass Aufgabentext und Musterlösung inhaltlich übereinstimmen.

## PWA und Offline-Betrieb

Manifest und Service Worker werden nur über HTTPS oder `localhost` aktiv. Nach
dem ersten erfolgreichen Laden steht der statische App-Bestand offline bereit;
ein Update-Hinweis aktiviert neue Versionen kontrolliert. Die Browsertests prüfen
gecachten Offline-Reload und den Ablauf Version A → „Später“ → Version B;
nur die Installation über die Browseroberfläche selbst ist nicht automatisiert.

## Inhalte ändern

Alles Inhaltliche steckt in den `data-*.js`-Dateien und ist reines JSON-artiges
JavaScript. Eine neue Aufgabe braucht Titel, Aufgabentext, genau drei Testtexte,
gestufte Tipps und eine Musterlösung:

```js
{
  id: 'l2-10', level: 2, title: 'Neue Aufgabe',
  task: 'Finde …',
  cases: [
    { text: 'erster Testtext' },
    { text: 'Gegenprobe' },
    { text: 'Randfall' }
  ],
  hints: ['erster Anstoß', 'konkreter', 'fast die Lösung'],
  solution: '\\d+'
}
```

## Hinweis zum Praktikum

Die Übersicht im Praktikums-Notebook beschreibt `re.match` als Prüfung auf
*vollständige* Übereinstimmung. Das ist `re.fullmatch`; `re.match` verankert nur am
Stringanfang und lässt beliebigen Rest zu. Im Trainer steht die korrekte Bedeutung,
und der Unterschied ist als Stolperfalle markiert.
