# Testdemo Neuvermietungsmanagement

Testseite für Immo Kontor Bremen: Wohnungsanfragen lesen, gegen die Vorgaben des Eigentümers prüfen, einladen und den Besichtigungstermin direkt im Chat buchen lassen. Zwei Ansichten: Verwaltung und Bewerber.

**Es sind keine Zugangsdaten enthalten.** Wohnungen, Anfragen und Termine liegen nur im localStorage des Browsers. Der einzige Aufruf nach außen geht an einen TuneFlow-Webhook, der den Bewerbertext von einem Mistral-Modell auslesen lässt. Der KI-Schlüssel liegt dort, nicht in dieser Seite. Der Webhook prüft Herkunft, Länge und Aufrufzahl.

Die Entscheidung trifft nicht die KI: Ampel, Empfehlung, Rückfragen und Termine rechnet die Seite aus den Vorgaben (`js/rules.js`). Freigegeben wird von Hand.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html`, `css/app.css` | Gerüst und Gestaltung (Marke 2026) |
| `js/beispiele.js` | zwei Beispielwohnungen, zehn Beispielanfragen, Illustrationen (alle Personen erfunden) |
| `js/rules.js` | Prüfung gegen die Vorgaben, Empfehlung, Zehn-Minuten-Termine |
| `js/templates.js` | Antwortvorlagen in Sie-Form |
| `js/state.js` | Zustand im Browser, Ablauf Bewerber und Verwaltung |
| `js/api.js` | Aufruf des Assistenten |
| `js/ui.js` | Darstellung beider Ansichten |

Ohne Build, ohne Framework. Lokal: `python3 -m http.server 8765`.
