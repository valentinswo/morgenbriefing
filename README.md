# Morgenbriefing

Das tägliche Morgenbriefing als kleine Web-App: Politik weltweit, Politik Deutschland, Gesundheitspolitik, Medizin & Forschung, Sport und Finanzmarkt. Jede Ausgabe bleibt im Archiv.

**Live:** https://valentinswo.github.io/morgenbriefing/

## Aufbau

```
index.html            Seite
style.css             Gestaltung (hell/dunkel automatisch)
app.js                lädt und zeigt die Ausgaben
briefings/index.json  Liste aller Ausgaben (neueste zuerst)
briefings/JJJJ-MM-TT.json   eine Datei pro Ausgabe
.nojekyll             sorgt dafür, dass GitHub Pages die Dateien unverändert ausliefert
```

Die App braucht keinen Server, kein Build und keine Pakete.

## Neue Ausgabe hinzufügen

1. Datei `briefings/JJJJ-MM-TT.json` anlegen (Format siehe unten).
2. Das Datum vorne in `briefings/index.json` unter `issues` eintragen.
3. Als Pull Request einreichen und übernehmen. GitHub Pages ist nach etwa einer Minute aktuell.

## Format einer Ausgabe

```json
{
  "date": "2026-10-31",
  "weekday": "Samstag",
  "dateLabel": "31. Oktober 2026",
  "lede": "Ein Satz mit den Top-Themen.",
  "createdAt": "2026-10-31T08:45:00+01:00",
  "footer": "Zusammengestellt am 31.10.2026, 8:45 Uhr (Berlin). Keine Anlageberatung.",
  "sections": [
    {
      "title": "Politik weltweit",
      "short": "Welt",
      "paragraphs": ["Absatz als reiner Text, **fett** ist erlaubt."],
      "sources": [{ "label": "tagesschau", "url": "https://www.tagesschau.de/..." }]
    },
    {
      "title": "Finanzmarkt",
      "short": "Finanzen",
      "figures": [{ "label": "DAX", "value": "25.818", "change": "−0,85 %" }],
      "paragraphs": ["..."],
      "sources": []
    }
  ]
}
```

- Absätze sind reiner Text, kein HTML. Nur `**fett**` wird umgesetzt.
- Quellenlinks müssen mit `https://` beginnen, sonst werden sie ausgeblendet.
- `figures` ist optional (gedacht für den Finanzmarkt). Ein `change`, das mit `-` oder `−` beginnt, wird rot angezeigt, sonst grün.

## Lokal ansehen

Weil die Seite JSON-Dateien nachlädt, braucht sie einen kleinen lokalen Server, ein Doppelklick auf `index.html` reicht nicht:

```
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.
