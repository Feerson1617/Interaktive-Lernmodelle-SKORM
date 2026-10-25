# Quellstand und reproduzierbarer Export

## Herkunft und Vollständigkeit

Übernommen wurde der vollständige Ordner `Modell:sinne:` aus Commit `86006235258195cae76a6cfe33c0be58f4bd05d1` („Modell Sinne eingepflegt“), jetzt `modelle/sinnblick/`. Die Originaldokumentation datiert den Stand auf den **28. September 2026**. Alle 30 Originaldateien einschließlich bearbeitbarer Quellen, Bibliotheken/Lizenzen, Tests, Dokumentation, `modules.js` und beider Einzeldateien bleiben unverändert erhalten. [quellstand.json](quellstand.json) verzeichnet jeden Originalpfad und SHA-256; ein Test prüft diese Zuordnung.

`Sinnblick.html` und `Sinnblick-Nah-Fern.html` sind bytegleich (je 2.266.810 Bytes, SHA-256 `27cadaa2fa8d43c1c263b454c9a008fba31456b407b8e9a498d127ab24d60b1e`). `export_html.build()` erzeugt aus den modularen Quellen exakt diese Bytes. Auch beide eingebetteten Organmodule entsprechen exakt ihren Quellen. Es gibt daher keinen Versionskonflikt zwischen Einzeldatei und modularer Fassung. Die modularen Dateien sind die bearbeitbare Grundlage; ein veralteter Export wird nicht bevorzugt.

Enthalten sind das Kopfmodell, 13 Bestandteile im Gesamtauge und neun Augen-Detailansichten (einschließlich Netzhaut und Zellvergleich), Stäbchen und drei Zapfentypen mit isolierbarem Feinbau, Licht, Herauslösen, Schichten, Nah/Fern und Wiedergabe. Das Ohr umfasst Gesamtmodell, Außen-/Mittelohr, entrollte Hörschnecke, Hörnerv, Gleichgewichtsorgan, Druckausgleich, Haarzellen und elf auswählbare Teile der Knöchelchen-Feinansicht. Das Gleichgewichtsorgan bleibt in der Schallsimulation unbewegt, wie fachlich im Original vorgesehen. Riechen, Schmecken und Tasten waren keine eigenen Simulationen.

Nur `tests/check_eye.cjs` ist als ursprüngliche Testdatei vorhanden. Die in alten README-Dateien genannten weiteren historischen Testzahlen sind Herkunftshinweise und werden nicht als erneut ausgeführte Tests ausgegeben. Neue Ohr-Geometrie- und vollständige Browserprüfungen ergänzen die tatsächlich vorhandenen Tests.

## Vorbereitung und Änderungen ausschließlich im Export

```sh
npm ci
python3 -m pip install -r requirements.txt
npm run build:sinnblick
python3 scripts/validate.py dist/Sinnblick-SCORM-1.2.zip
```

`prepare-sinnblick.py` kopiert eine explizite Liste von 20 Laufzeitdateien nach `.build/sinnblick-web/` und ergänzt zwei Integrations-Stylesheets. Tests, Python, Dokumentation, doppelte Einzeldateien und das generierte `modules.js` werden nicht ausgeliefert. Three.js bleibt die originale lokale Version 0.160.1; ein Engine-Upgrade oder eine Änderung der Modellgeometrie findet nicht statt.

Die Aufbereitung nimmt folgende begrenzte Änderungen vor und bricht bei nicht mehr passenden Quellstellen ab:

1. **Lokale Organseiten:** Die zwei bisher in `srcdoc` eingebetteten HTML-Strings werden durch `eye/index.html` und `ear/index.html` im selben Paket ersetzt. Dadurch prüft die vorhandene Ressourcenvalidierung auch die Organseiten und ihre Bibliotheken direkt. Beide Frames behalten denselben Ursprung und denselben Navigations-/Nachrichtenvertrag; nur die gemeinsame Startseite erhält einen SCORM-Wrapper.
2. **Literatur offline:** Acht Augen- und acht Ohr-Quellen werden mit Originaltitel und URL als Text ausgegeben. Externe Links würden dem vollständig lokalen Profil der bestehenden Vorlage widersprechen. Die fachlichen Erklärungstexte bleiben erhalten.
3. **Platz für die Sitzungsleiste:** `body.in-module` verteilt die verfügbare Höhe auf SCORM-Leiste, Navigation und Organframe. Die ursprüngliche Rechnung `100dvh - 130px` berücksichtigte die zusätzliche Leiste nicht und schnitt den Frame unten ab. Ein ResizeObserver berücksichtigt auch umgebrochene Sitzungstexte.
4. **Touch-Ziele:** Bedienelemente mit ursprünglich kleineren Maßen erhalten bei grobem Zeiger mindestens 44 Pixel. Rendering, Geometrie, Pixeldichte, Farben und ursprüngliche Anordnung bleiben erhalten.
5. **Sitzung und Hintergrund:** Ein projektspezifischer Hook hört auf `scorm:session` und Sichtbarkeitswechsel. Er pausiert die existierenden Organ-Bridges; bei Wiederaufnahme setzt eine ergänzte `resume`-Nachricht die aktuelle Ansicht fort, ohne den normalen Organ-Einstieg mit Ansichtsreset auszulösen. Modellregler bleiben im RAM. Die ursprüngliche Nah/Fern-Wiedergabe pausiert beim Verlassen des Modells weiterhin.

`runtime/`, `schemas/`, der SCORM-Builder/-Validator und `scorm.config.json` bleiben unverändert. Der Workflow ergänzt Vorbereitung und Browserprüfungen nur für `configs/sinnblick.json`; benutzerdefinierte Exportkonfigurationen bleiben möglich. Pull Requests gegen `main`, die relevante Dateien ändern, erzeugen zusätzlich einen überprüfbaren Sinnblick-Export. Der Quellvorlagen-Export muss auch die neuen Quellen/Konfigurationen einschließen, damit seine Tests eigenständig ausführbar bleiben.

## Datenschutz und Grenzen

Der Original-Anwendungscode verwendet weder localStorage/sessionStorage, Cookies, IndexedDB, Cache Storage noch Service Worker. Deshalb bleiben `classroomMode: false` und `classroomAdapter: null`; ein zusätzlicher Speicheradapter wäre unnötig. Browsertests starten mit absichtlich blockierten Storage-Methoden, prüfen die Speicherfreiheit, den Erhalt fremder Einträge und das Zurücksetzen nach einem Reload. Die Produktionsanwendung manipuliert keine globalen Browser-Speicherfunktionen.

SCORM liest nur `cmi.core.lesson_status`, setzt nur bei einem neuen Versuch `incomplete` und führt Initialize, Commit und Finish aus. Keine Scores, Identitäten, Antworten, Interaktionen, Lernzeiten oder suspend_data. Eigene Statusanzeigen des LMS liegen außerhalb der Anwendung.

Die statische Prüfung meldet generische dynamische Loader in Three.js und den lokalen iframe-Pfad als zusätzliche Prüfstellen. Die Modelle erzeugen ihre Geometrie selbst; keine GLB-Dateien, Texturen, Decoder oder externen Downloads sind erforderlich. Die Browserprüfungen blockieren und protokollieren jede versuchte externe Anfrage während sämtlicher geprüfter Ansichten und Dialoge.

Linux-WebKit und synthetische Pointer-/Lifecycle-Ereignisse belegen keine realen iPad-Gesten, Safari-BFcache-Rückkehr oder Stabilität bei iPadOS-Speicherdruck. WebGL-Kontextverlust und der Wiederanlauf auf einem echten Gerät gehören ausdrücklich zur manuellen Abnahme.
