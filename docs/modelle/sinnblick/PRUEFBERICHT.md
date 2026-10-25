# Technischer Prüfbericht

Stand: **25. Oktober 2026**. Der vollständige GitHub-Actions-Lauf ist erfolgreich. Das hochgeladene Artefakt wurde wieder heruntergeladen, gegen die lokalen XML-Schemata geprüft und zusätzlich mit dem lokalen Export byteweise verglichen: identisch. Die reale itslearning-/iPad-Abnahme bleibt offen.

## Fertiges Paket und Nachweise

- [SCORM-Exportdatei herunterladen](https://github.com/Feerson1617/Interaktive-Lernmodelle-SKORM/actions/runs/40187535776/artifacts/12596886289)
- [Erfolgreicher Workflow „SCORM exportieren“, Lauf 6](https://github.com/Feerson1617/Interaktive-Lernmodelle-SKORM/actions/runs/40187535776)
- [Export-Testnachweise: JSON-Berichte, Validierung und Bildschirmaufnahmen](https://github.com/Feerson1617/Interaktive-Lernmodelle-SKORM/actions/runs/40187535776/artifacts/12596921198)
- [Pull Request gegen main](https://github.com/Feerson1617/Interaktive-Lernmodelle-SKORM/pull/1), Branch `feature/sinnblick-scorm`

**Den äußeren GitHub-Download einmal entpacken und ausschließlich die darin enthaltene `Sinnblick-SCORM-1.2.zip` unverändert in itslearning importieren.** GitHub-Anmeldung erforderlich; die Artefakte dieses Laufs laufen am 23. Januar 2027 ab. Ein neuer Lauf mit `configs/sinnblick.json` erzeugt einen neuen Download. Siehe [Anleitung ohne Terminal](README.md).

| Merkmal | Geprüfter Wert |
| --- | --- |
| Importdatei | `Sinnblick-SCORM-1.2.zip` |
| Größe | 595.898 Bytes |
| SHA-256 | `312ba2c966d70278ab3a08752215855ef4c8dc9d3cf7d04e1cb0bdcfebffa812` |
| Geprüfter Implementierungscommit | `520bc682d3b84c0413f65b10c081ff2201ff2398` |
| Paket | SCORM 1.2, ein SCO, Start `index.html` |
| Inhalt | 30 Dateien; `imsmanifest.xml` direkt an der ZIP-Wurzel |
| XML-/Ressourcenvalidierung | bestanden, einschließlich vollständiger lokaler XSD-Prüfung und Dateihashes |
| Wiederholbarkeit | zwei Builds bytegleich; GitHub-Artefakt und lokaler Export ebenfalls bytegleich |

Das Schülerpaket enthält keine weiteren ZIPs, Python-Dateien, Tests, Quelldokumentationen oder doppelten Einzeldatei-Exporte. Alle benötigten Bibliotheken, Organseiten und Stylesheets liegen im Paket. Ein Backend ist nicht erforderlich.

## Übernommener Quellstand und Umfang

Der vollständige ursprüngliche Ordner `Modell:sinne:` aus Commit `86006235258195cae76a6cfe33c0be58f4bd05d1` wurde nach `modelle/sinnblick/` überführt. Die Originaldokumentation nennt den **28. September 2026**. Alle 30 Originaldateien sind anhand von SHA-256 unverändert nachgewiesen; siehe [Quellverzeichnis](quellstand.json). Die beiden Einzeldatei-Exporte sind untereinander und mit einem erneuten Export aus den modularen Quellen bytegleich. Es besteht kein unterschiedlicher Versionsstand.

Erhalten sind das interaktive Kopfmodell, das vollständige Auge mit 13 auswählbaren Bestandteilen und neun Detailansichten einschließlich Netzhaut, vier Rezeptortypen, Feinbau und Nah/Fern-Animation sowie sämtliche neun Ohransichten einschließlich Haarzellen, elf Knöchelchenbestandteilen, Schallsimulation und Gleichgewichtsorgan. Die lokale originale Three.js-Version 0.160.1 und die Modellgeometrien bleiben erhalten. [Integrationsbeschreibung](INTEGRATION.md) dokumentiert Herkunft und Umfang genauer.

## Technische Anpassungen

Die Vorbereitung verändert ausschließlich die erzeugten Webdateien: lokale Organ-HTML-Dateien ersetzen die eingebetteten `srcdoc`-Strings, und externe Literaturverweise werden mit Titel und URL als Text dargestellt. Das Layout berücksichtigt die zusätzliche Sitzungsleiste (gemessener unterer Überstand: vorher 61 Pixel, nachher 0). Touch-Schaltflächen erhalten mindestens 44 × 44 Pixel; der Abstand der Augenbeschriftungen berücksichtigt ihre tatsächliche Höhe. Ein projektspezifischer Lifecycle-Hook pausiert die Modelle und setzt die bestehende Detailansicht mit ihren RAM-Einstellungen fort.

Die allgemeine SCORM-Laufzeit, der Builder, der Validator, die Schemata, das technische Referenzmodell und dessen Standardkonfiguration sind gegenüber dem Ausgangsstand unverändert. Der Workflow unterstützt weiterhin beliebige Konfigurationspfade. Keine fachliche Neuentwicklung, keine Änderung von Geometrie, Farben oder Renderauflösung. `.DS_Store` wurde entfernt und ausgeschlossen.

## Automatisierte Ergebnisse

Der erfolgreiche Actions-Lauf führte alle folgenden Prüfungen aus; keine Tests wurden deaktiviert oder übersprungen:

| Prüfgruppe | Ergebnis |
| --- | --- |
| Node-Tests | **18 bestanden**: 16 SCORM-Sitzungstests und zwei Sinnblick-Geometrietests |
| Python-/Pakettests | **30 bestanden**, einschließlich Quellvollständigkeit, Exportparität, ZIP-Inventar, reproduzierbarem Build und eigenständiger Quellvorlage |
| Referenzmodell im Browser | **22 bestanden** in Chromium und WebKit |
| Allgemeine Starttests der Sinnblick-ZIP | **8 bestanden**: HTTP/HTTPS und eingebetteter Player/Popup in beiden Browsern |
| Sinnblick-Bedienprüfungen der ZIP | **12 bestanden** in Chromium und WebKit |
| Artefakt-Rückdownload | bestanden: genau eine innere Import-ZIP, Bytegleichheit und erneute Paketvalidierung |

Damit bestehen **48 Unit-/Pakettests und 42 Browserprüfungen**, ohne Fehlschläge oder übersprungene Tests im abschließenden Actions-Lauf. Der ursprüngliche Augentest prüft zusätzlich **3.731 Bedingungen**. Der Ohrtest prüft alle neun Modelle mit insgesamt 544 Meshes in jeweils 18 Kombinationen von Schallzustand, Lautstärke und Tonhöhe auf gültige Geometrie und endliche Transformationen. Historische Testzahlen aus alten Dokumentationen wurden nicht als ausgeführte Tests gezählt.

Die Browserprüfungen laden die tatsächlich erzeugte und validiert entpackte ZIP unter einem verschachtelten LMS-Pfad. Sie prüfen bei **1024 × 768** und **768 × 1024** unter anderem:

- tatsächliche WebGL-Zeichenaufrufe, Kopf-/Organwechsel, anatomische Auswahl, Informationstexte, alle Detailrouten und Rückwege;
- Licht/Pupille, Nah/Fern samt Wiedergabe, Schichten, Herauslösen, Stäbchen/drei Zapfentypen und isolierten Feinbau;
- Schallregler, sichtbar bewegte Knöchelchen, Haarzellen, elf Knöchelchenteile und das unter Schall unbewegte Gleichgewichtsorgan;
- Rotation, Pinch-Zoom, stufenweise Zoomübergänge, Orientierungswechsel, Touch-Zielgrößen, überlappungsfreie Zellbeschriftungen und vollständige Framehöhe;
- Pausieren und simulierte Wiederaufnahme, erhaltene RAM-Reglerwerte/Detailansicht sowie Zurücksetzen nach Neuladen;
- keine Konsolen-/Seitenfehler, fehlgeschlagenen Ressourcen oder versuchten externen Anfragen in den geprüften Abläufen.

SCORM liest ausschließlich den vorhandenen `cmi.core.lesson_status`, setzt einen neuen Versuch auf `incomplete` und führt Initialize, Commit und Finish aus. Die Tests prüfen die exakten Schreib-/Lesezugriffe sowie einmaliges Finish. Es werden keine Scores, Namen, Antworten, Interaktionen, Lernzeiten oder `suspend_data` geschrieben und kein künstlicher Abschluss gemeldet.

Die Originalanwendung verwendet keine dauerhafte Browserspeicherung. Ein zusätzlicher Speicheradapter wurde deshalb nicht eingeführt. Tests mit absichtlich blockierten Storage-Methoden laufen erfolgreich; fremde Speichereinträge bleiben erhalten. Diese Sperren sind ausschließlich Testinstrumentierung. Die Produktionsanwendung verändert keine globalen Speicherfunktionen.

## Aussagegrenzen und offene Geräteabnahme

Chromium erhielt native Touch-Eingaben über CDP. Linux-WebKit wurde mit synthetischen Pointer-Ereignissen geprüft, weil Playwright dort keine Mehrfinger-API bereitstellt. Simulierte `pagehide`-/`pageshow`-Ereignisse prüfen den Lifecycle-Vertrag, ersetzen aber keine echte Safari-BFcache-Rückkehr. Die lokale Linux-Prüfumgebung verwendet vorhandenes Chromium und separat bereitgestellte WebKit-Systembibliotheken; GitHub Actions installiert beide Playwright-Browser samt Systemabhängigkeiten regulär.

**Offen bleiben der Import in itslearning Schleswig-Holstein und die Prüfung auf einem physischen, verwalteten Schul-iPad:** echte Fingergesten, Safari-/MDM-Einbettung, Displaysperre und Hintergrund/Rückkehr, WebGL-Kontextverlust, Wiederherstellung und Speicherdruck. Dafür liegt eine konkrete [manuelle Abnahmecheckliste](ABNAHME.md) vor. Der erfolgreiche frühere Referenzmodell-Import wurde nicht als Abnahme von Sinnblick gewertet.

Der Pull Request ist zur Prüfung bereit; es wurde weder gemergt noch GitHub Pages aktiviert.
