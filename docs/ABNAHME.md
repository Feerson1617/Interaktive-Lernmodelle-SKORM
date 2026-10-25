# Manuelle Abnahme jedes neuen Exports

Ergebnis, Datum, Paket-SHA-256, LMS-Version/Instanz, iPad-Modell, iPadOS/Safari-Version und Person festhalten. Erst nach echtem Import von itslearning-Kompatibilität für dieses Paket sprechen.

1. Bei neuen Workflows das direkt herunterladbare **SCORM-ZIP-Artefakt** unverändert verwenden, ohne es zu entpacken oder neu zu komprimieren. Prüfen, dass `imsmanifest.xml` auf oberster ZIP-Ebene liegt. Bei alten Workflow-Läufen die äußere GitHub-Transport-ZIP einmal entpacken und nur die darin enthaltene eigentliche Import-ZIP auswählen.
2. In der vorgesehenen itslearning-Umgebung als SCORM 1.2 importieren. Titel, Startdatei, Dateifunde und eventuelle Importmeldungen dokumentieren.
3. Auf einem physischen iPad unter HTTPS eingebettet starten; zusätzlich separaten Tab/Fenster starten. API-Verbindung, Größenänderung, Hoch-/Querformat, Touch, Tastatur, Zoom und Scrollen prüfen.
4. Alle Anwendungsfunktionen, Medien und bei 3D Kamera, Texturen, Decoder, Performance und Kontextverlust prüfen. Auch verzögert geladene Inhalte aufrufen.
5. „Sitzung beenden“, Playernavigation, Tabwechsel, Hintergrund/Rückkehr und erneutes Öffnen prüfen. Bei gesperrtem Storage und Popup-Sperre verständliches Verhalten bestätigen.
6. Im LMS bestätigen, dass keine Noten/Antworten/Interaktionen übermittelt werden und keine künstliche Fertigmeldung entsteht. Ein vorhandener Abschlussstatus darf erhalten bleiben. Eigene LMS-Regeln gesondert dokumentieren.
7. Im optionalen Unterrichtsmodus neu laden/neu starten: eigene Daten flüchtig; fremde Daten erhalten. Im Normalmodus das projektspezifisch beabsichtigte Speichern bestätigen.

Playwright-Chromium, Linux-WebKit, simulierte Touch-Viewports und selbstsigniertes HTTPS des Testservers ersetzen diese Abnahme nicht. Auch synthetische pagehide/pageshow-Ereignisse beweisen kein reales Safari-BFcache-Verhalten. Ein erfolgreicher älterer Import gilt nicht automatisch für einen neu erzeugten Export.
