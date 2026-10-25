# Anweisungen für Codex in dieser eigenständigen Vorlage

- Lies README.md und docs/ARCHITEKTUR.md vor Änderungen.
- Diese Vorlage muss ohne Dateien oder Git-Historie eines übergeordneten Repositories funktionieren.
- Ändere die didaktische Anwendungslogik nicht für einen Export. Verwende ein fertiges Web-Verzeichnis.
- Übertrage keine Noten, Identitäten, Antworten, Interaktionen oder suspend_data. Nur ein neuer Versuch darf auf incomplete gesetzt werden. Keine künstliche Fertigmeldung.
- Erhalte API-Suche in Eltern/Opener, Fehleranzeige, Commit, Finish und Wiederaufnahme. Die Laufzeit darf keine anwendungsspezifischen Selektoren benötigen.
- Unterrichtsmodus nur über einen benannten, explizit von der Anwendung geladenen Adapter. Keine globalen Storage-Patches und keine Löschung fremder Daten.
- Validierung muss die tatsächliche ZIP prüfen und fehlendes Wurzelmanifest, äußeren Ordner und ZIP-in-ZIP ablehnen.
- Für Infrastrukturänderungen: npm run prepare:example, npm run build, npm test, Browserbeispiel und allgemeine Starttests in Chromium/WebKit ausführen. Für neue Anwendungen zusätzlich deren projektspezifische Tests ergänzen.
- Belege Tests mit Ergebnissen. Ein Mock-LMS und Linux-WebKit ersetzen weder itslearning-Import noch reales iPad/Safari.
- Ändere keinen Pages-Workflow, veröffentliche kein neues Repository und merge nicht ohne entsprechenden Auftrag.
