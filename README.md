# Regex Trainer

**[→ regex-trainer.appwrite.network](https://regex-trainer.appwrite.network)**

Reguläre Ausdrücke lernen, nachschlagen und üben — im Browser, ohne Anmeldung,
ohne Installation.

Entstanden zur Vorbereitung auf eine Data-Science-Klausur, weil es zwar unzählige
Regex-Tester gibt, aber kaum etwas, das einen **von null bis sicher** begleitet.
Wer Python und `re` lernt, ist hier richtig — die Grundlagen gelten aber überall.

## Für wen das gedacht ist

Für alle, die Regex nicht nur googeln, sondern wirklich können wollen. Du brauchst
keine Vorkenntnisse. Wenn du schon weißt, was `\d+` macht, überspring den Lernpfad
und geh direkt ins Training.

## Was drin ist

**Lernpfad** — Zehn Kapitel vom ersten Muster bis zur Textanalyse. Jedes Beispiel
ist ein kleines Eingabefeld: Muster ändern, Text ändern, sofort sehen, was passiert.
Etwa 60 Minuten von vorn bis hinten.

**Nachschlagen** — 118 Einträge, durchsuchbar. Du kannst nach dem Zeichen suchen
(`\b`), nach dem Begriff („Wortgrenze") oder danach, was du erreichen willst
(„E-Mail", „Geldbetrag"). Neben der reinen Syntax stehen dort auch die
`re`-Befehle, die pandas-Methoden `.str.extract` und `.str.contains` sowie eine
Sammlung typischer Stolperfallen.

**Playground** — Der große Tester. Muster eingeben, Treffer werden im Text
markiert, Gruppen und Positionen stehen daneben. Die Besonderheit: Dein Muster
wird **Baustein für Baustein erklärt**. Statt „das funktioniert irgendwie" siehst
du, was jedes Zeichen tut.

**Training** — 46 Aufgaben in fünf Stufen, von „finde alle Zahlen" bis zu
Lookarounds und Logfile-Analyse. Rückmeldung kommt beim Tippen. Jede Aufgabe wird
gegen **mehrere** Texte geprüft, nicht nur gegen das Beispiel — ein Muster, das
nur zufällig passt, fällt durch. Wenn du hängst, gibt es gestufte Tipps und zum
Schluss die Lösung.

**Quiz** — 34 Multiple-Choice-Fragen im Klausurstil: „Was gibt dieser Aufruf
zurück?" Jede Antwort wird erklärt, richtig oder falsch.

Dein Fortschritt wird lokal im Browser gespeichert. Nichts wird hochgeladen, es
gibt kein Konto.

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

Wer so übt, lernt Details falsch. Dieser Trainer übersetzt jedes Muster vorher, um
sich wie Pythons `re` zu verhalten — inklusive der Regel, die in Klausuren am
häufigsten Punkte kostet:

```python
re.findall(r"(\d+) (Euro)", text)   # zwei Gruppen  → Liste von Tupeln
re.findall(r"(\d+) Euro",   text)   # eine Gruppe   → nur die Gruppe
re.findall(r"\d+ Euro",     text)   # keine Gruppe  → die ganzen Treffer
```

Ebenfalls berücksichtigt: `(?P<name>…)`, `\A` und `\Z`, `{,m}`, `re.X`,
`$` vor einem abschließenden Zeilenumbruch, sowie `sub` mit `\1` und `\g<name>`.

## Offline benutzen

Repository herunterladen und `app/index.html` doppelklicken. Das war's — kein
Build, keine Abhängigkeiten, keine Internetverbindung nötig.

Ein Hinweis: Manche Browser sperren die Fortschrittsspeicherung bei direkt
geöffneten Dateien. Wenn dir das wichtig ist, starte einen kleinen lokalen Server:

```bash
python3 -m http.server 4173 --directory app
```

Dann im Browser `http://localhost:4173` öffnen.

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
    { text: 'Gegenprobe, damit Zufallstreffer auffallen' }
  ],
  hints: ['erster Anstoß', 'konkreter', 'fast die Lösung'],
  solution: '\\d+'
}
```

Das erwartete Ergebnis musst du nicht angeben — es wird aus der Musterlösung
berechnet. So können Aufgabentext und Prüfung nicht auseinanderlaufen.

## Technisches in Kürze

Statische Seite aus HTML, CSS und JavaScript ohne Framework, ohne Build-Schritt
und ohne externe Ressourcen. Gehostet auf [Appwrite Sites](https://appwrite.io).

```
app/
  index.html
  css/styles.css
  js/
    engine.js     bildet Python-re-Semantik auf die Browser-Engine ab
    explain.js    zerlegt ein Muster in erklärte Bausteine
    core.js       geteilte Oberflächen-Bausteine
    store.js      Fortschritt im localStorage
    data-*.js     sämtliche Inhalte
    ui-*.js       je eine Datei pro Bereich
    boot.js       Navigation, Design-Umschaltung, Tastatur
  tests/selftest.js
```

Tests laufen ohne Abhängigkeiten:

```bash
node app/tests/selftest.js
```

382 Prüfungen — die Engine gegen bekannte Python-Ergebnisse, dazu jedes
Referenzbeispiel, jede Lektions-Demo und jede Musterlösung.

## Lizenz

MIT — benutz es, verändere es, gib es weiter.
