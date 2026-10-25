# Sinnblick in itslearning verwenden

Die Importdatei heißt **`Sinnblick-SCORM-1.2.zip`**. Sie enthält das vollständige Lernmodell „Sinnblick – Vom Kopf zu den Sinneszellen“ mit Kopf, Auge und Ohr als **ein einziges SCORM-1.2-SCO**. Zum Öffnen genügt Safari innerhalb des itslearning-Players; eine zusätzliche App oder ein Backend ist nicht erforderlich.

## Herunterladen ohne Terminal

Der geprüfte Export vom 25. Oktober 2026 steht direkt als [SCORM-Exportdatei](https://github.com/Feerson1617/Interaktive-Lernmodelle-SKORM/actions/runs/40187535776/artifacts/12596886289) bereit. Dieser Download bleibt bis zum 23. Januar 2027 verfügbar; danach einen neuen Export erzeugen. **Hinweis:** Der hier verlinkte historische Export wurde noch als äußere GitHub-Transport-ZIP bereitgestellt und muss einmal entpackt werden. Neue Exporte nach der Workflow-Umstellung liefern die SCORM-ZIP direkt.

1. Im Repository **Actions → SCORM exportieren** öffnen.
2. Einen erfolgreichen Lauf für Sinnblick öffnen. Während der Prüfung dieses Pull Requests entstehen solche Läufe automatisch. Für einen eigenen Export **Run workflow** wählen, den Branch mit Sinnblick auswählen und im Feld **config** `configs/sinnblick.json` eingeben. Nach einem späteren Merge kann `main` verwendet werden. `scorm.config.json` exportiert weiterhin das technische Referenzmodell; eigene Konfigurationspfade bleiben möglich.
3. Unten unter **Artifacts** die Datei **`Sinnblick-SCORM-1.2.zip`** direkt herunterladen (GitHub-Anmeldung erforderlich). Das ist bereits das vollständige Importpaket – **keine äußere Transport-ZIP und kein Entpacken**.
4. **Genau die heruntergeladene `Sinnblick-SCORM-1.2.zip` unverändert** in itslearning als SCORM 1.2 importieren. `imsmanifest.xml` liegt bereits auf oberster ZIP-Ebene. Weder neu komprimieren noch die Repository-Quellen-ZIP verwenden.
5. Nur für **alte** GitHub-Actions-Läufe vor der Direktdownload-Umstellung gilt: Zuerst die äußere Transport-ZIP einmal entpacken und daraus die eigentliche `Sinnblick-SCORM-1.2.zip` nehmen.
6. Den Import mit einem Testkurs und einem verwalteten Schul-iPad gemäß [Abnahme](ABNAHME.md) prüfen.

Der Workflow prüft die erzeugte ZIP, öffnet sie in einem simulierten LMS, lädt die direkt veröffentlichte Import-ZIP nach dem Upload wieder herunter und vergleicht deren Bytes mit der erzeugten Importdatei. **Export-Testnachweise** enthält Testergebnisse und Bildschirmaufnahmen. Artefakte werden 90 Tage aufbewahrt; danach einen neuen Export starten.

## Im Unterricht

- Kopf mit einem Finger drehen, mit zwei Fingern zoomen. Auge/Ohr oder deren Beschriftung auswählen; „Sehen“/„Hören“ öffnen das jeweilige Organ auch direkt.
- Im Auge Licht und Entfernung des Gegenstands verändern; „Linse vergrößern“, Netzhaut und Zellvergleich öffnen weitere Ansichten.
- Im Ohr „Schall simulieren“, Lautstärke und Tonhöhe verwenden. Die Simulation ist sichtbar, erzeugt aber keinen Ton. Haarzellen und Gehörknöchelchen besitzen eigene Feinansichten.
- Herauszoomen führt stufenweise zurück. „Zum Kopf“ bleibt oben erreichbar.
- „Sitzung beenden“ beendet nur die technische LMS-Verbindung. Es werden keine Noten, Antworten oder künstlichen Abschlussmeldungen erzeugt.

Sinnblick speichert keine Namen, Antworten oder Einstellungen dauerhaft. Einstellungen bleiben während der Sitzung im Arbeitsspeicher erhalten und werden beim Neuladen zurückgesetzt. Ein Organwechsel behält die Versuchsregler wie im Original bei. Die bibliographischen Quellen sind im Paket als lesbare Literaturangaben enthalten, ohne externe Navigation.

Der frühere erfolgreiche Import des technischen Beispiels ist **keine Abnahme dieses Sinnblick-Pakets**. Ergebnisse und offene Geräteprüfungen stehen im [Prüfbericht](PRUEFBERICHT.md).
