# Neue Anwendungen mit Codex bereitstellen

1. Ein neues GitHub-Repository auswählen oder ausdrücklich dessen Anlage beauftragen. Diese Lieferung erstellt kein weiteres Repository automatisch.
2. Die Quellvorlage entpacken lassen und ihren Inhalt in die Repository-Wurzel übernehmen. Beispielauftrag:

   > Richte dieses Repository mit der beigefügten SCORM-Universalvorlage ein. Erhalte alle Dateien einschließlich .github. Lies AGENTS.md. Arbeite in einem eigenen Branch, aktiviere den manuellen Exportworkflow und merge nicht automatisch.

3. Die fertige Webanwendung beilegen, beispielsweise als `applications/mein-modell/`. Bei Frameworkprojekten vorher den statischen Build erzeugen lassen. Beispielauftrag:

   > Verwende applications/mein-modell als sourceDir und pages/start.html als entry. Erhalte sämtliche Funktionen und relativen Ressourcen. Verwende den Namen „Mein Lernmodell“ und output „Mein-Lernmodell-SCORM.zip“. classroomMode bleibt false. Löse externe Laufzeitabhängigkeiten lokal auf. Nutze die vorhandene Exportinfrastruktur, ohne ihre SCORM-Datenregeln aufzuweichen.

4. Für Unterrichtsmodus zusätzlich den Speichervertrag angeben. Codex soll zuerst die Speicherwege des konkreten Projekts prüfen, einen expliziten Adapter implementieren und dessen flüchtiges Verhalten sowie Erhalt fremder Daten testen. Nur dann `classroomMode` aktivieren.
5. Vorlagenprüfungen und projektspezifische Bedienprüfungen in Chromium/WebKit ausführen lassen. Bericht mit offenen dynamischen URLs, tatsächlich geprüften Szenen und Abnahmegrenzen verlangen. Keine stillen Test-Skips zum Grünmachen.
6. Workflow auf dem Standardbranch bereitstellen (Merge erst nach eigener Freigabe). Danach **Actions → SCORM exportieren → Run workflow**. Für weitere Konfigurationen im Formular den Pfad ihrer JSON-Datei angeben.
7. Artefakt **SCORM-Exportdatei** herunterladen und **einmal entpacken**. Die darin liegende konfigurierte ZIP ist die Importdatei. Sie wurde bereits vor dem Upload und nach dem Artefaktrückdownload geprüft.
8. Den tatsächlichen itslearning-/iPad-Test nach ABNAHME.md durchführen und das Ergebnis zum Paket-Hash dokumentieren.

Die Beispieltests in tests/browser bleiben unabhängig von der ausgewählten Exportkonfiguration. tests/smoke startet zusätzlich das im Formular ausgewählte Paket. Für die fachlichen Funktionen einer neuen Anwendung sind eigene Tests nötig.
