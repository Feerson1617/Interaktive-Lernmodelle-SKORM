# Aquarium-SCORM: Prüfbericht vom 25.10.2026

Paket: `Aquarium-1.0-itslearning-SCORM12.zip`

- Größe: 67.349.740 Bytes
- SHA-256: `05a33dfe025e61e5a7937e5cd036dc09370dc64d3d6da0f611242c64421457e7`
- Aquarium-Quelle: `cbbd20b44f3b14199d4f01170824a6cc78db651d`
- 551 ZIP-Einträge, Manifest direkt im ZIP-Hauptverzeichnis, SCORM-1.2-XSD gültig.
- Dateiinventar, relative Ressourcen, CRC, Standarddateien und SHA-256 aller vorbereiteten Anwendungsdateien geprüft. Nachträgliches erneutes Öffnen/Validieren erfolgreich.
- 19 statisch berechnete/dynamische Referenzstellen werden im vollständigen Validatorbericht ausdrücklich ausgewiesen; die statische Analyse beansprucht keine vollständige Programmanalyse.

## Ausgeführte Prüfungen

| Bereich | Ergebnis |
| --- | --- |
| Vorlagenlogik und RAM-Speicheradapter | 17 JS-Tests bestanden |
| Paket-/XSD-/Negativtests, einschließlich Asset ohne SCO-Runtime | 27 Python-Tests bestanden |
| Bisheriges 3D-Referenzbeispiel | 11 Chromium- und 11 WebKit-Browsertests bestanden |
| Bisheriger allgemeiner Referenzstart | 8 Kombinationen aus HTTP/HTTPS, eingebettet/Popup, Chromium/WebKit bestanden |
| Unveränderte Aquarium-Module | 202 Tests bestanden; Quellcheckout danach unverändert |
| Aquarium: Freies Forschen 8/9/10, fünf Szenarien im Menü, Nahrungsnetz-Szenario, sechs Analyseansichten, Genetik und acht echte Tutorialschritte | Chromium und WebKit bestanden |
| Aquarium: M1–M6 mit regulären Spielhandlungen bis zum Ergebnis | Chromium und WebKit bestanden |
| Normale Aquarium-Webversion, eigener ursprünglicher Speicher, Reload/Fortsetzen, 3D | Chromium und WebKit bestanden |
| Pinzette: sichtbares Objekt greifen/verschieben, erlaubte Position übernehmen, Kollision anzeigen, ungültige Bewegung abbrechen | Chromium und WebKit bestanden |
| Fertige Aquarium-ZIP: HTTP/HTTPS, eingebettet/Popup | Alle 8 Kombinationen in Chromium/WebKit bestanden |
| Sichtbare Missionslinks und Erhalt des exakten laufenden Versuchs | Chromium und WebKit bestanden |

Die Missionen verwenden echte Auswahlhandlungen, Füttern, Beobachtungsläufe,
Generationswechsel, Elternauswahl, Maßnahmenvergleiche und Antworten. Es werden
keine Fortschrittsflags oder fertigen Lernprodukte injiziert. Snapshots lesen nur
Ergebnisse, Modell- und Rendererzustand. Screenshotbelege wurden geprüft.

Die Sitzungstests in beiden Browsern prüfen zusätzlich:

- Kein einziger Zugriff auf localStorage, sessionStorage, IndexedDB oder CacheStorage (instrumentierte Getter protokollieren und verweigern jeden Zugriff).
- Keine SCORM-API-Aufrufe und keine Anfragen an fremde Ursprünge.
- Erhalt der M1-Vorhersage/Versuchskennung nach sechs Missionswechseln.
- Neue Versuchskennung nach vollständigem Reload des Hosts.
- Höchstens ein iframe; nach Navigation keine alten Timer, Animationscallbacks, registrierten Ereignisse oder WebGL-Kontexte.

Der produktive Adapter verändert keine Browser-Speicher-APIs. Die Sperren gehören
ausschließlich zur Testinstrumentierung. Der normale Webversions-Test belegt
separat, dass der Originalcode weiterhin seinen ursprünglichen Speicher nutzt.

## Umgebung und Grenzen

Linux, Node 24, Python 3.12.14 in der bereitgestellten virtuellen Umgebung,
Playwright 1.58.2, Chromium 154.0.8037.57 und Playwright-WebKit, Software-Rendering.
Die 3D-Prüfungen sind auf dieser CPU deutlich langsamer als einfache Starttests;
der vollständige Chromium-Missionslauf benötigte etwa elf Minuten.
Desktop- und Tablet-Viewports wurden verwendet; die Pinzettenprüfung verwendet
echte Mauszeigerereignisse, weitere Bedienungen echte Tastaturereignisse.

WebKit-Systembibliotheken und Browser lagen im Workspace. Für den lokalen Lauf
musste der mitgelieferte Browserlauncher den Bibliothekspfad übernehmen.
Die ldconfig-basierte Playwright-Vorprüfung sieht diese lokalen Bibliotheken nicht
und wurde deshalb lokal deaktiviert. Die Browser- und Spielprüfungen selbst wurden
vollständig ausgeführt. Der GitHub-Workflow installiert die regulären
Playwright-Systemabhängigkeiten und enthält diese lokale Umgehung der Vorprüfung nicht.

Erste Browserläufe fanden eine zu enge CSP für lokale GLB-Blob-Texturen. Dies wurde
im Paket korrigiert. WebKit fängt lokale Blob-Anfragen zusätzlich im Test-Routing ab;
der Filter unterscheidet deshalb nach tatsächlichem Ursprung. Das erlaubt lokale
Blob-Texturen und sperrt fremde Netzwerkziele weiterhin. Ein Rennen des Testcodes
beim Wechsel des iframe wurde durch explizites Abwarten des neuen Dokuments korrigiert.

## Veröffentlichung und reale Abnahme

Es wurde noch kein Release-Asset hochgeladen. Der vorbereitete manuelle Workflow
kann nach erfolgreichem Testlauf mit `configs/aquarium.json` und aktiviertem
`publish_aquarium` eine direkte Import-ZIP veröffentlichen. Vor Veröffentlichung
prüft er die Bytes durch Rückdownload aus einem Release-Entwurf. Der direkte Link
und SHA-256 erscheinen anschließend in der Actions-Zusammenfassung.

Realer itslearning-Asset-Import und physisches iPad/Safari sind offen. Auch die
konkrete Sandboxfreigabe des LMS und dessen eigene Zugriffsprotokollierung müssen
real geprüft werden. Kein Status-/SCO-Fallback und keine künstliche Fertigmeldung.
Bedienung und Import: [AQUARIUM.md](AQUARIUM.md).
