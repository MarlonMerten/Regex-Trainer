# Regex Trainer

**[→ regex-trainer.appwrite.network](https://regex-trainer.appwrite.network)**

Reguläre Ausdrücke lernen, nachschlagen und üben — im Browser, ohne Anmeldung,
ohne Installation.

Entstanden zur Vorbereitung auf eine Data-Science-Klausur, weil es zwar unzählige
Regex-Tester gibt, aber kaum etwas, das einen **von null bis sicher** begleitet.
Wer Python und `re` lernt, ist hier richtig — die Grundlagen gelten aber überall.
Die Lerninhalte beziehen sich auf Python 3.14 und Unicode-Strings (`str`).

## Für wen das gedacht ist

Für alle, die Regex nicht nur googeln, sondern wirklich können wollen. Du brauchst
keine Vorkenntnisse. Wenn du schon weißt, was `\d+` macht, überspring den Lernpfad
und geh direkt ins Training.

## Was drin ist

**Lernpfad** — Zehn Kapitel vom ersten Muster bis zur Textanalyse. Jedes Beispiel
ist ein kleines Eingabefeld: Muster ändern, Text ändern, sofort sehen, was passiert.
Etwa 72 Minuten von vorn bis hinten.

**Nachschlagen** — 119 Einträge, durchsuchbar. Du kannst nach dem Zeichen suchen
(`\b`), nach dem Begriff („Wortgrenze") oder danach, was du erreichen willst
(„E-Mail", „Geldbetrag"). Neben der reinen Syntax stehen dort auch die
`re`-Befehle, die pandas-Methoden `.str.extract` und `.str.contains` sowie eine
Sammlung typischer Stolperfallen.

**Playground** — Der große Tester. Muster eingeben, Treffer werden im Text
markiert, Gruppen und Positionen stehen daneben. Die Besonderheit: Dein Muster
wird **Baustein für Baustein erklärt**. Statt „das funktioniert irgendwie" siehst
du, was jedes Zeichen tut.

**Training** — 53 Aufgaben in fünf Stufen, von „finde alle Zahlen" bis zu
Lookarounds und Logfile-Analyse. Rückmeldung kommt beim Tippen. Jede Aufgabe wird
gegen **mehrere** Texte geprüft, nicht nur gegen das Beispiel — ein Muster, das
nur zufällig passt, fällt durch. Wenn du hängst, gibt es gestufte Tipps und zum
Schluss die Lösung.

**Quiz** — 36 Multiple-Choice-Fragen im Klausurstil: „Was gibt dieser Aufruf
zurück?" Jede Antwort wird erklärt, richtig oder falsch.

Dein Fortschritt wird lokal im Browser gespeichert. Der Export kopiert ihn als
JSON in die Zwischenablage; über den Import kannst du dieses JSON wieder
einspielen. Nichts wird hochgeladen, es gibt kein Konto.

## Womit anfangen?

Wenn du bei null startest: **Lernpfad** Kapitel 1–4, dann **Training** Stufe 1–2.
Danach wechselst du am besten hin und her — ein Kapitel lesen, die passende Stufe
üben. Das **Quiz** eignet sich zum Wiederholen kurz vor einer Prüfung.

Tastatur: `1`–`5` springen zwischen den Bereichen, `⌘K` / `Strg+K` öffnet die Suche.

## Python statt JavaScript

Das ist der eigentliche Grund, warum es diesen Trainer gibt. Die meisten
Online-Regex-Tester laufen mit der Regex-Engine des Browsers — und die verhält
sich an entscheidenden Stellen **anders als Python**:

```python
re.findall(r"\w+", "Größe")
# Python 3:      ['Größe']
# JavaScript:    ['Gr', 'e']      ← Umlaute zählen dort nicht als Buchstaben
```

Die Lerninhalte zielen auf Python 3.14. Da im Browser keine CPython-Engine läuft,
bildet der Trainer die in Lernpfad und Aufgaben verwendete Teilmenge von `re` nach.
Dazu gehört auch die Regel, die in Klausuren häufig Punkte kostet:

```python
re.findall(r"(\d+) (Euro)", text)   # zwei Gruppen  → Liste von Tupeln
re.findall(r"(\d+) Euro",   text)   # eine Gruppe   → nur die Gruppe
re.findall(r"\d+ Euro",     text)   # keine Gruppe  → die ganzen Treffer
```

Ebenfalls berücksichtigt: Unicode-Kurzformen und Wortgrenzen, `(?P<name>…)`,
`\A`, `\Z`/`\z`, `{,m}`, `re.X`, `$` vor einem abschließenden Zeilenumbruch sowie
`sub` mit `\1` und `\g<name>`.

Das ist keine vollständige CPython-Implementierung: `\N{name}`, atomare Gruppen,
possessive Quantifizierer, bedingte Gruppen, quantifizierte Lookarounds und
bereichsbezogene Inline-Flags werden derzeit nicht unterstützt. Ebenfalls klar
abgelehnt werden Python-Fälle, bei denen Browser nachweislich andere Capture-
Historien liefern (etwa verschachtelte Captures in wiederholten Gruppen oder ein
Rückverweis auf eine möglicherweise nicht beteiligte Gruppe). Bei
case-insensitiven Rückverweisen gelten für die wenigen abweichenden
Unicode-Faltungen zusätzliche Schutzgrenzen; `re.L` wird nur mit Warnung
behandelt. Eine Live-Auswertung ist auf 20.000 Treffer begrenzt und meldet ein
Überschreiten ausdrücklich. Für produktionskritische Muster bleibt CPython 3.14
maßgeblich.

Über HTTPS beziehungsweise `localhost` laufen Live-Eingaben in einem Web Worker.
Hängt eine Auswertung durch starkes Backtracking, wird sie nach 600 ms abgebrochen
und der Worker automatisch neu gestartet.

## Offline benutzen

Für den vollständigen Funktionsumfang empfiehlt sich ein kleiner lokaler Server:

```bash
python3 -m http.server 4173 --directory app
```

Dann im Browser `http://localhost:4173` öffnen.

Nach dem ersten erfolgreichen Laden über HTTPS oder `localhost` hält der Service
Worker die statischen Dateien für spätere Offline-Starts vor.

Alternativ kannst du `app/index.html` direkt öffnen. Dieser `file://`-Modus ist
nur der Kompatibilitätsweg: Je nach Browser ist `localStorage` eingeschränkt,
Service Worker, Offline-Cache und Update-Hinweis fehlen, und Regex laufen ohne den
600-ms-Worker-Schutz synchron. Die heruntergeladene App selbst benötigt trotzdem
keine Internetverbindung.

## Mitmachen

Fehlt eine Aufgabe? Ist eine Erklärung unklar? Issues und Pull Requests sind
willkommen.

Alle Inhalte liegen als gut lesbare Listen in `app/js/data-*.js` — du brauchst
kein Setup, um etwas beizutragen. Eine neue Übungsaufgabe sieht so aus:

```js
{
  id: 'l2-10', level: 2, title: 'Neue Aufgabe',
  task: 'Finde alle …',
  cases: [
    { text: 'erster Testtext' },
    { text: 'Gegenprobe, damit Zufallstreffer auffallen' },
    { text: 'dritter Testtext mit einem Randfall' }
  ],
  hints: ['erster Anstoß', 'konkreter', 'fast die Lösung'],
  solution: '\\d+'
}
```

Das erwartete Ergebnis musst du nicht angeben — es wird aus der Musterlösung
berechnet. Dadurch gibt es keine doppelt gepflegten Ergebnislisten. Ob Aufgabentext
und Musterlösung inhaltlich übereinstimmen, sichern Inhaltsreviews und
Differentialtests ab.

## Technisches in Kürze

Statische Seite aus HTML, CSS und JavaScript ohne Framework, ohne Build-Schritt
und ohne externe Ressourcen. Gehostet auf [Appwrite Sites](https://appwrite.io).

```
app/
  index.html
  manifest.json
  sw.js
  css/styles.css
  js/
    engine.js     Python-3.14-Kompatibilitätsschicht der unterstützten Teilmenge
    regex-worker.js führt Live-Eingaben außerhalb des UI-Threads aus
    explain.js    zerlegt ein Muster in erklärte Bausteine
    core.js       geteilte Oberflächen-Bausteine
    store.js      Fortschritt im localStorage
    data-*.js     sämtliche Inhalte
    ui-*.js       je eine Datei pro Bereich
    boot.js       Navigation, Design-Umschaltung, Tastatur
  tests/
    selftest.js
    python-differential.js
    browser/
      smoke.spec.js
      navigation.spec.js
      training-mobile.spec.js
      pwa-update.spec.js
package.json
playwright.config.js
```

Die vollständige Prüfung benötigt Node.js 20 oder neuer, CPython 3.14 und für die Browsertests
einmalig Chromium:

```bash
npm ci
npm test                         # Syntax, 461 interne und 392 CPython-/Schutzprüfungen
npx playwright install chromium  # einmalig lokal
npm run test:browser             # 20 Browserprüfungen
npm run test:all                 # alle obigen Prüfungen
```

Der Selftest deckt Engine, alle Referenzbeispiele, Lektions-Demos, Musterlösungen
und den Highlighter ab. Der Differentialtest vergleicht die Kompatibilitätsschicht
mit CPython 3.14; Playwright prüft Router und History, Deep Links, Worker-Timeout,
kontrollierte PWA-Updates, Offline-Start, beide Themes mit WCAG-A/AA sowie alle
Lektionen bei 320 Pixel Breite. Dieselben Ebenen laufen in CI.

## Lizenz

MIT — benutz es, verändere es, gib es weiter.
