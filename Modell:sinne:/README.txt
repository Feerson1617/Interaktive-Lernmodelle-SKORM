SINNBLICK – VOM KOPF ZU DEN SINNESZELLEN
Stand: 28. September 2026 – kurze, einfache Erklärungen

START
Sinnblick.html ist die vollständige Einzeldatei. Sie enthält die Kopfansicht,
das Augenmodell und das Ohrmodell einschließlich aller Bibliotheken.
Auf Mac/Windows im aktuellen Browser öffnen (WebGL erforderlich).
Für iPhone/iPad die Datei über die eigene Website per HTTPS anbieten.
Eine Vorschau in der Dateien-App ersetzt keinen vollständigen Webbrowser.

BEDIENUNG
• Kopf mit Maus oder einem Finger drehen.
• Über Auge/Ohr scrollen oder mit zwei Fingern auseinanderziehen: eintauchen.
• Beschriftung antippen: Erklärung. Über die Schaltfläche ins Organ wechseln.
• Herauszoomen führt von den Details zum Organ und dann zum Kopf.
  Zwischen Ebenen die Geste kurz unterbrechen. Dies verhindert Überspringen.
• „Zum Kopf“ sowie „Sehen“ und „Hören“ sind immer oben erreichbar.
• Im Ohr kann der automatische Ebenenwechsel ausgeschaltet werden.
• Lichtregler, Scharfstellen, Schallsimulation, Feinbau, Erklärungen,
  Ein-/Ausblenden und Schnittansichten der Ausgangsmodelle bleiben erhalten.
• Beim erneuten Einstieg erscheint das ganze Organ. Versuchsregler bleiben
  erhalten; „Zurücksetzen“ im Organ stellt die Ausgangswerte wieder her.
• Nicht sichtbare Modelle pausieren ihre Darstellung.

NEU IN DIESER FASSUNG
• Stufenloser Regler „Entfernung des Gegenstands“ im Auge: Nah bis Fern.
• Linse, Ziliarmuskel und Linsenbänder reagieren gemeinsam in beiden Ansichten.
• „Wechsel zeigen“ spielt den Vorgang ab; „Linse vergrößern“ öffnet die Nahansicht.
• Kurze Erklärungen ohne den zusätzlichen Fachbegriff fürs Scharfstellen.
• Alle 96 Einträge zu Auge und Ohr sprachlich geprüft und gekürzt.
• Kurze Erklärungen für Klasse 8, auch in den tiefsten Nahaufnahmen.
• Zapfentypen über Blau, Grün und Rot erklärt, ohne Wellenlängen.
• Auch Ansichtsüberschriften, Modellhinweise und Hilfetexte vereinfacht.

NAHAUFNAHMEN
• Drei Zapfentypen einzeln in der Netzhaut erkennbar und auswählbar.
• Neuer 3D-Vergleich mit Stäbchen, drei Zapfentypen, Membranstapeln,
  Innensegment/Mitochondrien, Verbindungsstück, Zellkern und Kontaktstellen.
• Einzelne Sinneszellen lassen sich mit ihrem gesamten Feinbau isolieren.
• Zusätzliche Zoomstufe: Netzhaut → Zellvergleich → Netzhaut.
• Gehörknöchelchen als zusammenhängende, organische Knochenformen.
• Eigene Knochen-Nahansicht mit elf auswählbaren Strukturen, darunter
  Hammergriff, Ambossfortsätze, Steigbügelschenkel und Fußplatte.
• Kegelförmigeres Trommelfell sowie feinere Haarzellformen und Haarbündel.
• Auf Smartphones zeigt der Zellvergleich zunächst die vier Zelltypen;
  die Einzelzell-Nahansicht beschriftet deren Bauteile.

UNTERRICHT
Die Kopfansicht ist eine schematische räumliche Orientierungshilfe.
Aktuell sind Sehen und Hören integriert, einschließlich des bereits im
Ohrmodell vorhandenen Gleichgewichtsorgans. Riechen, Schmecken und Tasten
sind noch keine eigenen Simulationen. Später können weitere Module ergänzt
werden. Die Haut als Sinnesorgan ist über den ganzen Körper verteilt.
Quellen, Modellgrenzen und Verlangsamungen stehen in den jeweiligen Modellen.
Die blau/grün/rötlichen Zellfarben sind Kennfarben, keine Naturfarben.
S-, M- und L-Zapfen unterscheiden sich vor allem durch ihre Sehfarbstoffe;
ihre Empfindlichkeitsbereiche überlappen. Die Form ist vereinfacht.
Die Knochen wurden für dieses Lernmodell neu modelliert; es sind keine
individuellen CT-Rekonstruktionen. Zellzahlen, Membranabstände und Bewegung
sind nicht maßstabsgetreu.

PROJEKTDATEIEN
index.html, styles.css, app.js: gemeinsame Oberfläche und 3D-Kopf.
eye/: vollständige Augenmodell-Quellen mit Übergang zur Kopfebene.
ear/: vollständige Ohrmodell-Quellen mit Übergang zur Kopfebene.
ear/bone-geometry.js: Erzeugung der geglätteten Knochengeometrie.
modules.js: eingebettete, automatisch erzeugte Module.
three.min.js, THREE-LICENSE.txt: mitgelieferte 3D-Bibliothek und MIT-Lizenz.
build.py, export_html.py: Einzeldatei ohne Zusatzpakete neu erzeugen.

Nach Änderungen an den Quellen im Projektordner ausführen:
    python3 build.py
Danach enthält Sinnblick.html den aktuellen Stand. Auch index.html greift auf
die neu erzeugte modules.js zu. Keine externen Bibliotheksabrufe nötig.
Augenblick.html enthält nun denselben aktuellen Augenstand einschließlich
der Nah-Fern-Steuerung. Das separate Ohrblick.html wurde nicht verändert.

PRÜFUNGEN
Aktuelle Textüberarbeitung:
• Kurztexte in Netzhaut, Zellvergleich, Haarzellen und Knöchelchen geprüft.
• Infokarten wechseln beim Antippen einer anderen Beschriftung.
• Smartphoneformat 390 × 844: Karten lesbar, kein seitlicher Überlauf.
• 3.096 Augenprüfungen und 257 Prüfungen der Ohrsteuerung erneut bestanden.
• Keine Browserfehler; Einbettung aller Ressourcen geprüft.

Zusätzliche Prüfungen der vorigen Modellüberarbeitung:
• Einzeldatei im Browser über lokalen Webserver geöffnet.
• Mausrad: Kopf → Auge, Netzhaut → Auge → Kopf.
• Mausrad: Kopf → Ohr, Haarzellen → Hörschnecke → Ohr → Kopf.
• Beschriftungsklick, Netzhaut/Haarzellen, Lichtregler und Schallschalter.
• Smartphoneformat 390 × 844, keine horizontalen Überläufe in beiden Modulen.
• 34 automatische Prüfungen zu Kopf-Treffern, Zweifinger-Gesten, Übergängen,
  Nachrichtenherkunft und Schutz gegen überspringende Zoombewegungen.
• 257 Prüfungen der erweiterten Ohrsteuerung, einschließlich Knochen-Nahansicht.
• 3.096 Prüfungen von Augen-Geometrie, Zuordnung, Einzelzellansicht und Zoom.
• Über 22.000 Prüfungen der Ohr-Geometrien und Animationszustände.
• Neue Nahaufnahmen auf Desktop und bei 390 × 844 Pixeln visuell geprüft.
• Im Browser: direkte Zoomwechsel Netzhaut ↔ Zellvergleich;
  Knochen-Feinbau → Mittelohr → Ohr → Kopf sowie Infokartenwechsel.
• Einzeldatei auf vollständige Einbettung der Ressourcen geprüft.
Kein Test auf einem physischen iPhone/iPad. Lokales file://-Öffnen wurde
nicht zusätzlich automatisiert geprüft; die identische Einzeldatei wurde
über HTTP getestet.

Nah-Fern-Erweiterung: 3.731 Prüfbedingungen bestanden; Browserbedienung mit
Zwischenstellung, Wiedergabe und Rückweg geprüft. Physischer Gerätetest offen.
