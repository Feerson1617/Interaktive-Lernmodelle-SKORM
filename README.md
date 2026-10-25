# SCORM-Universalvorlage

Eigenständiger Exporter für fertige HTML-/JavaScript-/WebGL-Anwendungen. Er erhält deren Verzeichnisstruktur, ergänzt SCORM 1.2 und erzeugt eine geprüfte ZIP mit `imsmanifest.xml` direkt im Hauptverzeichnis. Kein Zugriff auf das ursprüngliche Spielrepository erforderlich.

## Ohne Terminal: neues GitHub-Projekt

1. `SCORM-Universalvorlage.zip` entpacken. Diese Datei enthält **Quellcode**, kein LMS-Lernmodul.
2. Ein leeres GitHub-Repository anlegen und den **Inhalt** als Repository-Wurzel übernehmen. Auch `.github/workflows/export.yml`, `.gitignore` und `.gitattributes` übernehmen (versteckte Dateien einblenden). Das kann Codex erledigen; siehe [Codex-Anleitung](docs/CODEX.md).
3. Workflowdatei auf dem Standardbranch bereitstellen, Actions aktivieren.
4. **Actions → SCORM exportieren → Run workflow**. Für das enthaltene 3D-Beispiel sind keine Konfigurationsänderungen nötig.
5. Nach erfolgreichem Lauf das Artefakt **SCORM-Exportdatei** herunterladen. Diese GitHub-ZIP ist eine **äußere Transportdatei**: einmal entpacken. Nur die darin enthaltene konfigurierte Datei, zunächst **`Beispiel-SCORM-1.2.zip`**, unverändert in itslearning importieren.

Die innere Import-ZIP enthält unmittelbar `imsmanifest.xml`, die Startdatei in ihrem konfigurierten Unterordner und alle Ressourcen. Nicht die äußere Transportdatei importieren und die Import-ZIP nicht erneut mit einem übergeordneten Ordner verpacken. Der Workflow lädt sein Artefakt zurück und validiert die innere ZIP nochmals.

## Andere Anwendungen konfigurieren

`scorm.config.json` enthält:

| Feld | Bedeutung |
| --- | --- |
| `name` | Name im LMS/Manifest |
| `description` | Beschreibung in `__scorm/package-info.json`; kein optionales LOM erforderlich |
| `sourceDir` | Fertiges Web-Verzeichnis, relativ zur Konfigurationsdatei |
| `entry` | HTML-Startdatei relativ zu `sourceDir`, z. B. `pages/start.html` |
| `output` | Einfacher ZIP-Dateiname, z. B. `Mein-Modell.zip` |
| `classroomMode` | `false` oder ausdrücklich `true`; siehe unten |
| `classroomAdapter` | Pfad des eigenen Speicheradapters im Web-Verzeichnis; sonst `null` |

Die Quelldateien werden weder umgebündelt noch verändert. Nur der HTML-Startdatei werden zwei markierte SCORM-Blöcke hinzugefügt. Ihre Entfernung ergibt wieder exakt das Original. Jede Quelldatei ist mit SHA-256 im Paket dokumentiert. Ein identischer Eingabestand erzeugt mit den gesperrten Werkzeugversionen identische ZIP-Bytes, ohne Uhrzeit oder Git-Abhängigkeit.

Das Web-Verzeichnis darf keine Entwicklungsumgebung (`node_modules`, `.git`), versteckten Dateien oder Symlinks enthalten. Start-HTML braucht explizite `<head>`- und `<body>`-Elemente. Reserviert sind `imsmanifest.xml`, die SCORM-Schemadateinamen, `__scorm/`, die Integrationsmarker und IDs `scorm-session`, `scorm-message`, `scorm-exit`.

Unterstützt werden relative ES-Module, literale dynamische Imports, lokale CSS-Imports, JSON/fetch, Medien und GLB-/GLTF-Dateien mit externen lokalen Buffern/Texturen. Das Beispiel verwendet echtes Three.js samt GLTFLoader, lokal aus einer gesperrten npm-Version kopiert. Für andere Frameworks erst deren statischen Web-Build erstellen. Bare Imports wie `import 'three'` sowie Importmaps vorher mit einem Bundler auflösen oder in relative Modulpfade überführen. Keine CDNs, absoluten Serverpfade (`/assets/...`), APIs oder entfernten Schriftarten verwenden. Bei Vite z. B. `base: './'` einstellen.

## Unterrichtsmodus: Vertrag mit der Anwendung

`classroomMode: true` allein kann unbekannte Anwendungen nicht zuverlässig flüchtig machen. Der Build verlangt deshalb einen existierenden `classroomAdapter`. Die Anwendung muss diesen Adapter **selbst vor ihren Speicherzugriffen laden**. Sie erhält früh im HTML-Head `window.SCORM_CONTEXT.classroomMode`. Das Beispiel importiert `modules/classroom.js`: Im Unterrichtsmodus nutzt es nur eine Modulvariable; im Normalmodus seinen eigenen localStorage-Schlüssel.

Die Vorlage ersetzt keine globalen Storage-, Cookie-, IndexedDB- oder Service-Worker-Funktionen und löscht keine Daten. Der Adapter muss alle projektspezifischen Speicherwege berücksichtigen; die Konfiguration ist kein automatischer Nachweis dafür. Anwendungen mit IndexedDB, Caches oder Service Workern benötigen eigene Anpassungen und Tests. Im Unterrichtsmodus Reload/Neustart sowie Erhalt fremder Speichereinträge prüfen. Das enthaltene Beispiel testet genau dies. Die allgemeine Sitzungsschnittstelle kann zum Anhalten von Animationen `scorm:session` mit `detail.phase === 'finished'` verwenden.

## Lokal bauen und prüfen

Node.js 24, Python 3.12+, OpenSSL und Playwright-Systembibliotheken verwenden:

```sh
npm ci
python3 -m pip install -r requirements.txt
npm run prepare:example
npm run build
npm test
npx playwright install --with-deps chromium webkit
TEST_WEBKIT=1 npm run test:browser
TEST_WEBKIT=1 npx playwright test --config playwright.smoke.config.js
python3 scripts/validate.py dist/Beispiel-SCORM-1.2.zip
```

Andere Konfiguration: `npm run build -- configs/mein-modell.json`. Dann den allgemeinen Starttest mit `SCORM_ZIP=dist/Mein-Modell.zip` ausführen. Der Beispieltest bleibt separat. Eigene fachliche/spielerische Browserprüfungen ergänzen: Der allgemeine Starttest deckt keine beliebigen späteren Interaktionen ab.

Quellvorlage erneut erzeugen: `python3 scripts/release.py` → `dist/SCORM-Universalvorlage.zip`.

## Struktur

```text
runtime/           unabhängige SCORM-Sitzung, Lifecycle und kleine Sitzungsleiste
schemas/           lokale, unveränderte SCORM-1.2-XSDs mit Quellen und Hashes
scripts/           Build, ZIP-/XSD-/Ressourcenprüfung, Testserver, Quellenexport
examples/webgl/    eigenständiges Modul-/Three.js-/GLB-/GLTF-Beispiel
tests/             Logik, negative Paketfälle, Mock-LMS, Browser- und Starttests
docs/              Architektur, Grenzen, Codex-Anleitung, manuelle Abnahme
.github/workflows/ manueller Export samt Tests und geprüftem Artefaktrückdownload
scorm.config.json  konkrete Anwendung
```

Die Vorlage stammt aus einer SCORM-1.2-Sitzungsintegration, deren bisheriges Lernpaket laut Auftraggeber in itslearning Schleswig-Holstein importiert und auf einem iPad gestartet wurde. **Das ist keine Abnahme dieser neuen Vorlage oder künftiger Exporte.** Die separat korrigierte Referenz-ZIP stand bei der Extraktion nicht zur Verfügung. Details und verbindliche manuelle Prüfung: [Architektur und Grenzen](docs/ARCHITEKTUR.md), [Abnahme](docs/ABNAHME.md).

## Aquarium 1.0

Zusätzlicher Export des festgelegten Aquarium-Commits mit flüchtiger RAM-Sitzung:
[Build, Datenschutz, direkte Release-ZIP und itslearning-Abnahme](docs/AQUARIUM.md).
Im Exportworkflow `configs/aquarium.json` wählen; `publish_aquarium` veröffentlicht
nach erfolgreichen Prüfungen ein Pre-Release mit direktem Import-Asset und
SHA-256-Rückdownloadprüfung. Die Beispielkonfiguration bleibt unabhängig.
`trackingMode` ist optional: `sco` (bisheriges Verhalten) oder `asset` (ohne
SCORM-API-Aufrufe). Die tatsächliche itslearning-Unterstützung des Asset-Imports
bleibt bis zur realen LMS-Abnahme offen.
