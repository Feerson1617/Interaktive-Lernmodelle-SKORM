# Sinnblick in itslearning verwenden

Die Importdatei heißt **`Sinnblick-SCORM-1.2.zip`**. Sie enthält das vollständige Lernmodell „Sinnblick – Vom Kopf zu den Sinneszellen“ mit Kopf, Auge und Ohr als **ein einziges SCORM-1.2-SCO**. Zum Öffnen genügt Safari innerhalb des itslearning-Players; eine zusätzliche App oder ein Backend ist nicht erforderlich.

## Herunterladen ohne Terminal

1. Im Repository **Actions → SCORM exportieren** öffnen.
2. Einen erfolgreichen Lauf für Sinnblick öffnen. Während der Prüfung dieses Pull Requests entstehen solche Läufe automatisch. Für einen eigenen Export **Run workflow** wählen, den Branch mit Sinnblick auswählen und im Feld **config** `configs/sinnblick.json` eingeben. Nach einem späteren Merge kann `main` verwendet werden. `scorm.config.json` exportiert weiterhin das technische Referenzmodell; eigene Konfigurationspfade bleiben möglich.
3. Unten unter **Artifacts** das Artefakt **SCORM-Exportdatei** herunterladen. Dafür bei GitHub angemeldet sein. Der Link steht auch in der Zusammenfassung des Laufs.
4. Die äußere GitHub-Transportdatei einmal entpacken. Darin liegt **`Sinnblick-SCORM-1.2.zip`**.
5. **Nur diese innere ZIP unverändert in itslearning als SCORM-1.2-Paket hochladen.** Nicht den GitHub-Download, nicht die Repository-Quellen-ZIP und nicht `SCORM-Universalvorlage.zip` importieren. Die innere ZIP nicht neu verpacken: `imsmanifest.xml` liegt bereits direkt in ihrer obersten Ebene.
6. Den Import mit einem Testkurs und einem verwalteten Schul-iPad gemäß [Abnahme](ABNAHME.md) prüfen.

Der Workflow prüft die erzeugte ZIP, öffnet sie in einem simulierten LMS, lädt das Exportartefakt nach dem Upload wieder herunter und vergleicht dessen Bytes mit der erzeugten Importdatei. **Export-Testnachweise** enthält Testergebnisse und Bildschirmaufnahmen. Artefakte werden 90 Tage aufbewahrt; danach einen neuen Export starten.

## Im Unterricht

- Kopf mit einem Finger drehen, mit zwei Fingern zoomen. Auge/Ohr oder deren Beschriftung auswählen; „Sehen“/„Hören“ öffnen das jeweilige Organ auch direkt.
- Im Auge Licht und Entfernung des Gegenstands verändern; „Linse vergrößern“, Netzhaut und Zellvergleich öffnen weitere Ansichten.
- Im Ohr „Schall simulieren“, Lautstärke und Tonhöhe verwenden. Die Simulation ist sichtbar, erzeugt aber keinen Ton. Haarzellen und Gehörknöchelchen besitzen eigene Feinansichten.
- Herauszoomen führt stufenweise zurück. „Zum Kopf“ bleibt oben erreichbar.
- „Sitzung beenden“ beendet nur die technische LMS-Verbindung. Es werden keine Noten, Antworten oder künstlichen Abschlussmeldungen erzeugt.

Sinnblick speichert keine Namen, Antworten oder Einstellungen dauerhaft. Einstellungen bleiben während der Sitzung im Arbeitsspeicher erhalten und werden beim Neuladen zurückgesetzt. Ein Organwechsel behält die Versuchsregler wie im Original bei. Die bibliographischen Quellen sind im Paket als lesbare Literaturangaben enthalten, ohne externe Navigation.

Der frühere erfolgreiche Import des technischen Beispiels ist **keine Abnahme dieses Sinnblick-Pakets**. Ergebnisse und offene Geräteprüfungen stehen im [Prüfbericht](PRUEFBERICHT.md).
