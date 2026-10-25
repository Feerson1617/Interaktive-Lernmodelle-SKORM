# Augenblick – das Auge in 3D

Eine deutschsprachige, interaktive Lern-App für den Biologieunterricht der 8. Klasse.

## Starten und weitergeben

Die Datei **Augenblick.html** enthält die vollständige App einschließlich der 3D-Bibliothek. Sie kann einzeln über eine Lernplattform, per E-Mail oder USB-Stick weitergegeben werden.

1. Die HTML-Datei herunterladen und auf dem Gerät speichern.
2. Auf Mac/Windows mit einem aktuellen Browser öffnen, etwa Chrome, Edge, Firefox oder Safari. Für iPhone/iPad die Datei auf einer Website bereitstellen und deren HTTPS-Link in Safari öffnen.
3. Einen Bestandteil antippen oder mit dem Modell experimentieren.

Es sind keine Installation, Anmeldung und keine Internetverbindung nötig. Die App lädt keine Schriftarten, Modelle oder Bibliotheken aus dem Internet. Nur die freiwillig aufrufbaren Quellenlinks benötigen Internet. Es gibt keine Analyse- oder Trackingdienste und keine Dateneingabe.

Eine HTML-Vorschau in einer Lernplattform oder einer Mail-App führt JavaScript möglicherweise nicht aus. Dann die Datei herunterladen und direkt im Browser öffnen. Auf verwalteten Schulgeräten können örtliche Einstellungen das Öffnen von HTML-Dateien einschränken. Die App benötigt WebGL beziehungsweise Hardwarebeschleunigung.

## Bedienung

- **Drehen:** mit gedrückter Maustaste oder einem Finger ziehen.
- **Zoomen:** Mausrad, zwei Finger oder + / −.
- **Erklären:** auf ein 3D-Teil, eine Beschriftung am Modell oder einen Namen in der Liste tippen.
- **Tiefe entdecken:** auf die Netzhaut zielen oder sie auswählen und weiter heranzoomen. Automatisch öffnet sich die Zellansicht. Das funktioniert auch bei anderen Strukturen mit eigener Detailansicht.
- **Zurückzoomen:** aus einer Einzelansicht weiter herauszoomen, um zur übergeordneten Ansicht zurückzukehren; aus einer Detailansicht führt weiteres Herauszoomen zum ganzen Auge. Der Zurück-Button bleibt zusätzlich verfügbar.
- **Schnell zur Netzhaut:** „Noch genauer hinsehen“ rechts auswählen; auf schmalen Bildschirmen steht die Liste unter dem Modell.
- **Schichten entfernen:** Augensymbole in der Liste, Schnittansicht oder Regler „Herauslösen“ verwenden.
- **Licht:** den Lichtregler bewegen. Die Iris verändert die Pupillenweite.
- **Nah und fern sehen:** „Entfernung des Gegenstands“ stufenlos von Nah nach Fern verschieben. Linse, Ziliarmuskel und Linsenbänder bewegen sich gemeinsam, auch in der Gesamtansicht. „Linse vergrößern“ öffnet alle drei Teile in 3D. „Wechsel zeigen“ spielt den Wechsel langsam ab; der Regler übernimmt jederzeit wieder die Steuerung.
- **Neustart:** „Zurücksetzen“ stellt alle Ausgangswerte wieder her.

Tastatur: Tab und Enter für Bedienelemente; im 3D-Feld Pfeiltasten zum Drehen, + / − zum Zoomen. Escape schließt die Erklärung.

## Inhalte

Das Gesamtmodell enthält Hornhaut, Iris, Pupille, Linse, Ziliarkörper/Ziliarmuskel, Glaskörper, Netzhaut, Aderhaut, Lederhaut, gelben Fleck, blinden Fleck, Sehnerv und Linsenbänder.

Neun zusätzliche Detailansichten zeigen:

1. Netzhaut mit Stäbchen, Zapfen, Bipolarzellen, Ganglienzellen, Nervenfasern, Sehnerv und Pigmentschicht.
2. Iris mit Ringmuskel, Strahlenmuskel und Pupillenöffnung.
3. Linse, Ziliarmuskel und Linsenbänder beim Scharfstellen.
4. Hornhaut und das Prinzip der Lichtbrechung.
5. Die drei Schichten der Augenwand.
6. Die zentrale Sehgrube mit dicht stehenden Zapfen.
7. Den blinden Fleck als Austrittsstelle der Nervenfasern.
8. Den Sehnerv als geschütztes Bündel aus Nervenfasern.
9. Vergleich von Stäbchen und drei Zapfentypen mit ihren Zellbestandteilen.

## Fachliche Vereinfachungen

Alle Modelle sind schematisch. Farben, Zellzahlen, Größen und Schichtdicken sind nicht maßstabsgetreu. Die Netzhautansicht zeigt ausgewählte Zelltypen und einen vereinfachten Signalweg. Weitere Schaltzellen und Verschaltungen sind nicht dargestellt. Die Verbindung zum Sehnerv ist verkürzt. Die Lichtstrahlen an der Hornhaut zeigen das Prinzip und sind keine genaue optische Simulation.

Die Pupille ist eine Öffnung. Die dunkle, auswählbare Markierung stellt keinen festen Körper dar. Gelber und blinder Fleck sind Bereiche der Netzhaut. Zur Auswahl sind sie farbig hervorgehoben. In der zentralen Sehgrube zeigt die Detailansicht nur Zapfen. Am blinden Fleck fehlen die Lichtsinneszellen.

Der Lichtregler zeigt die Pupillenreaktion der Iris. Der Ziliarmuskel ist für das Scharfstellen zuständig; dafür gibt es eine separate Nah-/Fern-Steuerung. Die zusätzliche Pupillenverengung bei der Nahreaktion wird in diesem vereinfachten Modell nicht dargestellt.

Die fachlichen Quellen sind direkt in der App unter „Modell & Quellen“ verlinkt.

## Bearbeitbares Projekt

`index.html`, `styles.css`, `app.js` und `three.min.js` gehören zusammen. `index.html` lässt sich direkt im Browser öffnen. Es sind weder ein Paketmanager noch ein Build nötig. Alternativ kann der Ordner von einem statischen Webserver bereitgestellt werden.

Die Einzeldatei `Augenblick.html` ist ein Export derselben App. Änderungen an den separaten Projektdateien ändern diesen Export nicht automatisch.

Three.js 0.160.1 ist unter der MIT-Lizenz enthalten. Der vollständige Lizenztext liegt in `THREE-LICENSE.txt` und ist außerdem in der Einzeldatei eingebettet.

## Aktualisierung vom 28. September 2026

Die Steuerung bietet echte Zwischenstellungen. Beim Wechsel zwischen Gesamtmodell und Nahansicht bleiben sie erhalten. Manuelle Eingabe, Zurücksetzen, Verlassen der Linsenansicht in andere Feinansichten oder Wechsel zum Kopf stoppen die Wiedergabe. Entfernungen sind qualitativ, nicht in Metern kalibriert. Der Ziliarmuskel wirkt über die Haltefasern auf die Linse; er drückt sie nicht unmittelbar zusammen.

3.731 Prüfbedingungen für Modell, Auswahl, Zoom und neue Steuerung bestanden. Darunter fünf Entfernungsstufen, übereinstimmende Formen in beiden Ansichten, rückläufige Bewegung ohne Verformungsdrift sowie Pause, manuelle Übernahme und Zurücksetzen. Im Browser zusätzlich Regler, Nahansicht, Zwischenstellung, Wiedergabe und Rückweg über die fertigen Einzeldateien bedient. Smartphoneformat geprüft; kein physischer iPhone-/iPad-Test.
