# Architektur und Prüfgrenzen

## Bewährte Grundlage

`runtime/session.js` ist bytegleich mit der ursprünglichen SCORM-Sitzungsimplementierung aus Commit `53edcec74cb6d6c8c6eb625da4b6b8723d34cc46` im Repository Feerson1617/Lernspiel-Sinne. Deren 16 Logiktests wurden übernommen. API-Suche, Initialisierung, Statusregel, Commit, Finish und Lifecycle wurden nicht neu erfunden. Die Sitzungsleiste verwendet nun keine Spielselektoren mehr; nach Finish werden übrige direkte Body-Elemente inert. Die Anwendung kann über das Ereignis `scorm:session` eigene laufende Simulationen anhalten.

Das frühere Build-/Prüfsystem war auf eine einzelne HTML-Datei, feste Namen und einen bestimmten Export beschränkt; es lehnte Netzwerkfunktionen einschließlich lokaler Imports grundsätzlich ab. Der universelle Builder erhält komplette Dateibäume, generiert Referenzen aus deren Inventar und überprüft lokale Ressourcen stattdessen gezielt.

Der bekannte fehlerhafte Erstimport ist nur aus dem Nutzerbericht bekannt. Ohne die damals korrigierte ZIP lassen sich deren Bytes und genaue Verpackungsänderung nicht vergleichen. Der vorhandene ZIP-Generator schrieb das Manifest bereits ins Hauptverzeichnis; eine zusätzliche Download-Verpackung ist ein möglicher, hier nicht nachgewiesener Entstehungsweg. Beide Fehlerformen (Ordner und äußere ZIP) sind eigenständige negative Tests.

## SCORM-Datenvertrag

| Operation | Daten |
| --- | --- |
| LMSInitialize | leerer String |
| LMSGetValue | ausschließlich cmi.core.lesson_status |
| LMSSetValue | nur lesson_status=incomplete für not attempted/leeren Anfangsstatus |
| LMSCommit / LMSFinish | leerer String |
| LMSGetLastError | Fehlercode nach Aufrufen |

Kein Score, keine Identität, Antwort, Interaktion, Lernzeit oder suspend_data. Vorhandene Statuswerte bleiben erhalten. Das explizite incomplete verhindert die SCORM-1.2-Standardfertigmeldung bei einem sonst ungemeldeten neuen Versuch. Serverseitige LMS-Regeln können dennoch eigene Ansichten erzeugen.

Eltern- und Openerfenster werden begrenzt durchsucht. Cross-Origin-Zugriff wird abgefangen; Browser-Sicherheitsgrenzen werden nicht umgangen. Ein neuer Tab braucht einen zugänglichen LMS-API-Elternkontext oder Opener. Ein direkter Tab/`noopener` ohne API bleibt als Webanwendung nutzbar, meldet aber keine erfolgreiche SCORM-Verbindung.

Bei Sichtbarkeitswechsel wird gespeichert, bei normalem pagehide oder „Sitzung beenden“ beendet. Erfolgreiches Finish erfolgt nur einmal. Simulierte Cache-Rückkehr kann neu initialisieren; explizite Wiederverbindung bleibt nach Fehlern möglich. Browser-/Betriebssystemabsturz oder hartes Schließen kann JavaScript verhindern. Ein allgemeiner Exporter kann das nicht zuverlässig beheben.

## Validierung

- ZIP-Hauptverzeichnis, doppelte/kollidierende Pfade, Symlinks, Traversal, CRC und 2048-MB-Limit (zusätzlich auch entpackt).
- Offline-XSD-Prüfung mit unabhängigem vertrauenswürdigem Schema, SCORM-1.2-Metadaten, ein SCO/ein Item, lokale Startdatei und vollständiges Dateiinventar.
- Unveränderte Standarddateien und Original-Anwendungsdateien über SHA-256; Start-HTML nach Entfernung der zwei Zusatzblöcke bytegleich.
- HTML/SVG-Attribute, CSS-URLs/-Imports, JS-Modulimporte sowie erkennbare literale fetch/Loader/Worker/URL-Aufrufe; GLTF-/GLB-Buffer und Textur-URIs.
- JS wird mit Acorn geparst. Dynamisch berechnete URLs werden im Bericht **als offene Prüfstellen** ausgewiesen. Bibliotheksloader erzeugen solche Einträge regulär. Beliebige Programme können statisch nicht vollständig analysiert werden; Kommentare oder Namensraum-URLs gelten nicht als Laufzeitzugriffe.
- Relative String-URLs von fetch/Loadern werden gegen die konfigurierte Startseite geprüft; `new URL(..., import.meta.url)` gegen das Modul. Bei anderen Dokumentbasen URL-Konstruktion ausdrücklich machen. Importmaps/bare Imports vor dem Export auflösen. Externe HTML-Verweise werden in diesem vollständig lokalen Profil auch bei Links abgelehnt.
- Playwright blockiert externe Ziele und prüft versuchte Anfragen, fehlende Dateien, JS-Fehler und SCORM-Datenzugriffe. Das Beispiel lädt und rendert GLB/GLTF; Pixelprüfung und Screenshots ergänzen die DOM-Prüfung. Die generischen Starttests prüfen nur die Startstrecke, nicht alle möglichen App-Zustände.

Erweiterungen wie Draco, Meshopt, KTX2, WASM oder Worker sind keine entfernten Dienste: Decoder und Worker müssen ebenfalls lokal ins Web-Verzeichnis. Für solche Erweiterungen gibt es noch keine eigene Referenzszene; sie müssen anwendungsspezifisch getestet werden. Leistungsgrenzen großer 3D-Modelle und GPU-Eigenheiten auf iPads lassen sich daraus nicht ableiten.

## Schemas und Abhängigkeiten

Lokale CP1.1.2-/ADL1.2-Schemas, unverändert übernommen; Quellen/Hashes in `schemas/sources.json`. Das generische XML-Namensraumschema stammt aus der ADL-Test-Suite und ersetzt die alte, mit modernen Parsern ungültige XML-Namensraumbindung. Es macht das Paket nicht zu SCORM 2004. Kein optionales IMS-LOM und kein Mastery-Score. Hinweise in THIRD-PARTY-NOTICES.txt.

Werkzeuge sind gesperrt in package-lock.json und requirements.txt. Installation benötigt Paketquellen, die exportierte Anwendung nicht. npm Three.js dient nur der Beispielvorbereitung. Für andere Projekte ist es keine vorgeschriebene Engine. Die Quellvorlage enthält keine Dateien aus dem ursprünglichen Spiel.
