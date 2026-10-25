# Aquarium 1.0 als flüchtiges Unterrichtspaket

## Bauen

Der bestehende Exporter erhält eine zusätzliche Konfiguration `configs/aquarium.json`.
Er verwendet `trackingMode: "asset"`. Andere Konfigurationen bleiben standardmäßig
SCOs mit der bisherigen Sitzungslaufzeit.

```sh
git clone --no-checkout https://github.com/Feerson1617/Simulation-Aquarium .build/aquarium-source
git -C .build/aquarium-source checkout cbbd20b44f3b14199d4f01170824a6cc78db651d
node scripts/prepare-aquarium.mjs
npm run build -- configs/aquarium.json
SCORM_ZIP=dist/Aquarium-1.0-itslearning-SCORM12.zip TEST_WEBKIT=1 npx playwright test --config playwright.smoke.config.js
SCORM_ZIP=dist/Aquarium-1.0-itslearning-SCORM12.zip TEST_WEBKIT=1 npx playwright test --config playwright.aquarium.config.js
```

Die Vorbereitung verweigert einen anderen Commit oder veränderte getrackte Quellen.
Sie kopiert nur Root-Module/CSS, das modulare index.html, direkte Laufzeitressourcen
in catalog/species/realism, lokale Vendor-Lizenzen und zwei verlinkte Unterrichtstexte.
Unterordner mit Modellquellen, Prüfbelegen, Tests, Git-Historie und die große
Standalone-Backup-Datei werden ausgeschlossen. Die Originaldateien bleiben unverändert.
Die vorbereitete Kopie ist temporär unter `.build/`; Assets werden nicht eingecheckt.
Inventar/Quellcommit stehen in `aquarium-source.json`, Hashes der vorbereiteten
Anwendung in `__scorm/package-info.json`. Letztere belegen die Integrität der
Exportkopie, nicht Bytegleichheit der angepassten Module mit dem Upstream.

## Speicher- und Datenvertrag

Untersucht: Hauptmodul im index.html, single-learning-ui, single-classroom-ui,
learning-ui, single-teacher-settings, study-ui und graphics-profiles. Direkte
localStorage-Zugriffe werden in der Kopie auf einen explizit importierten
Aquarium-Adapter umgestellt. Die AST-Transformation ersetzt nur ausführbare
Bezeichner. Die Vorbereitung bricht bei verbleibenden lokalen/persistenten
Speicherbezeichnern ab. Es werden keine globalen Browser-Speicherfunktionen ersetzt,
keine fremden Schlüssel gelesen und keine fremden Daten gelöscht.

Der Host classroom.html hält eine Map im RAM. getItem/setItem/removeItem/clear,
length/key und Object.keys arbeiten damit wie die bisherigen Aquarium-Speicherwege.
Alle Missions-, Szenario-, Notiz- und Lehrkraftschlüssel teilen dieselbe Map.
Interne Navigation lädt nur ein index.html-iframe neu. Vorher sichert die Anwendung
über aquariumPrepareNavigation in die RAM-Map. Die aus dem festgelegten Upstream
übernommene Lifecycle-Funktion stoppt Timer/Animationen/Ereignisse und gibt
Renderer/WebGL-Kontexte frei. Es bleibt maximal ein iframe; die Diagnosehistorie
ist auf 30 Einträge begrenzt und enthält keine Lernprodukte.

Ein Reload des Hosts erzeugt eine neue Map. pagehide leert die Map; eine Rückkehr
aus dem Back/Forward-Cache erzwingt einen Neustart. Ein manuelles Reload nur des
inneren iframe gehört zur laufenden Host-Sitzung. Für eine neue Unterrichtssitzung
immer das ganze Lernmodul neu laden oder schließen.

Datei-Downloader werden in der Exportkopie deaktiviert; Import-/Export- und
Sicherungsbedienelemente werden durch den Aquarium-Adapter entfernt und ihr
Klickpfad gesperrt. In RAM abgelegte frühere Durchgänge bleiben für Vergleiche
verfügbar. Das reguläre Aquarium wird nicht geändert. Externe Quellenlinks werden
nicht geöffnet; Quellenangaben bleiben lesbar. Eine CSP begrenzt Verbindungen auf
den lokalen Paketursprung und sperrt Formulare/Plugins.

## Nicht trackendes SCORM-1.2-Asset

Das XSD-gültige Manifest deklariert `adlcp:scormtype="asset"`. Der Export fügt keine
SCO-Sitzungslaufzeit und keine Sitzungsleiste ein: keine API-Suche, Initialize,
GetValue, SetValue, Commit oder Finish. Es gibt auch keine künstliche Fertigmeldung.
Der Validator prüft die Übereinstimmung von Metadaten/Manifest und den leeren
Runtime-Block. Die bisherigen SCO-Regeln bleiben separat bestehen.

Ein Asset ist im SCORM-1.2-Inhaltsmodell vorgesehen. Ob itslearning genau dieses
Asset als importiertes Unterrichtsmodul zulässt und welche eigenen Zugriffsprotokolle
das LMS führt, muss real geprüft werden. Das Paket kann LMS-seitige Protokollierung
von Aufrufen oder Zugriffen nicht verhindern. Es sendet selbst keine individuellen
SCORM-Runtime-Daten. Kein stiller Rückfall auf SCO/incomplete ist vorgesehen.

## GitHub und Import

1. PR prüfen; erst nach eigener Entscheidung mergen. Kein automatischer Merge.
2. **Actions → SCORM exportieren → Run workflow**. Konfiguration:
   `configs/aquarium.json`. Zum Veröffentlichen `publish_aquarium` aktivieren.
   Ein vorhandener Workflow auf dem Standardbranch kann auch mit dem Featurebranch
   ausgewählt werden; andernfalls muss zunächst die Workflowänderung gemergt werden.
3. Nach allen Tests veröffentlicht der zweite Job ein Pre-Release mit eindeutigem
   Run-Tag. `contents: write` ist nur für diesen Job gesetzt. Geschützte Actions-
   Umgebungen/Repositoryregeln gegebenenfalls durch den Projektinhaber freigeben.
4. Der Release-Job lädt die Import-ZIP direkt hoch, lädt sie erneut herunter und
   vergleicht SHA-256. Der direkte Link, Bytes und Hash stehen in der Laufzusammenfassung.
   Ein fehlgeschlagener/noch nicht ausgeführter Job bedeutet keine Veröffentlichung.
5. Direktes Release-Asset `Aquarium-1.0-itslearning-SCORM12.zip` herunterladen und
   in itslearning als SCORM-Lernpaket importieren. ZIP unverändert lassen. Bei einem
   Download aus Actions stattdessen nur das äußere Artefaktarchiv einmal entpacken.
   `imsmanifest.xml` liegt im Hauptverzeichnis der inneren Import-ZIP.
6. Als Schüler öffnen, zwischen Missionen wechseln, Modul vollständig neu laden und
   frischen Stand kontrollieren. Keine Bewertung oder Abschlussautomatik erwarten.

## Abnahmegrenzen

Automatisierte Prüfungen laufen gegen die erneut entpackte tatsächliche ZIP mit
Mock-LMS und gesperrten externen Zielen. Die Tests verwenden reale Bedienhandlungen;
Snapshots dienen der Prüfung und setzen keine Missionsfortschritte.
Realer itslearning-Import und physischer iPad/Safari-Test bleiben ausdrücklich offen.
Vollständige Abnahme einschließlich Pinzettenbewegungen und längerer 3D-Nutzung
muss zu einem konkreten Paket-Hash dokumentiert werden. Sie darf nicht aus reinen
Starttests abgeleitet werden. Aktuelle Ergebnisse: `test-results/` und PR-Bericht.
