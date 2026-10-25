/* Ohrblick – selbst formulierte Lerntexte für Klasse 8. */
(function(){
'use strict';
const parts={};
function p(id,name,color,text,note=''){parts[id]={name,color,text,note};}
p("auricle","Ohrmuschel","#e8ad98","Die Ohrmuschel fängt Schall auf und leitet ihn in den Gehörgang.");
p("canal","Gehörgang","#edc4a6","Der Gehörgang leitet Schall bis zum Trommelfell.");
p("eardrum","Trommelfell","#c9b4ee","Diese dünne Haut schwingt durch den Schall. Sie gibt die Bewegung an den Hammer weiter.");
p("malleus","Hammer","#e5d9c4","Der Hammer ist mit dem Trommelfell verbunden. Er gibt dessen Bewegung an den Amboss weiter.");
p("incus","Amboss","#d6c8b1","Der Amboss liegt zwischen Hammer und Steigbügel. Er gibt die Bewegung an den Steigbügel weiter.");
p("stapes","Steigbügel","#f0e5d0","Der Steigbügel ist der kleinste Knochen des Menschen. Er überträgt die Bewegung auf die Flüssigkeit im Innenohr.");
p("oval","Ovales Fenster","#93d5cc","Hier sitzt die Fußplatte des Steigbügels. Sie verschließt die Öffnung und überträgt Bewegung ins Innenohr.");
p("round","Rundes Fenster","#cba9e4","Diese dünne Haut gibt nach, wenn sich die Flüssigkeit im Innenohr bewegt. So gleicht sie den Druck aus.");
p("cochlea","Hörschnecke","#70cec3","Die Hörschnecke ist mit Flüssigkeit gefüllt. Ihre Sinneszellen wandeln Bewegung in Signale für den Hörnerv um.");
p("nerve","Hörnerv","#f1d486","Der Hörnerv leitet elektrische Signale zum Gehirn. Dort erkennen wir zum Beispiel Stimmen und Musik.");
p("balance","Gleichgewichtsorgan","#9ea9e3","Dieses Organ erkennt die Lage und Bewegung deines Kopfes. Es hilft dir, das Gleichgewicht zu halten.");
p("tube","Ohrtrompete","#d9a2bd","Die Ohrtrompete verbindet Mittelohr und Rachen. Beim Schlucken öffnet sie sich kurz und gleicht den Luftdruck aus.");
p("cavity","Luft im Mittelohr","#9ab4cf","Im Mittelohr ist Luft. Hier bewegen sich Hammer, Amboss und Steigbügel.");
p("cartilage","Knorpel der Ohrmuschel","#d8a48e","Biegsamer Knorpel gibt der Ohrmuschel ihre Form.");
p("canal_hairs","Härchen im Gehörgang","#d5be99","Diese Härchen halten Schmutz zurück. Sie dienen nicht dem Hören.");
p("wax","Ohrenschmalz","#d6a151","Ohrenschmalz schützt die Haut im Gehörgang und hält Staub fest.");
p("air","Luftschwingung","#90d7fa","Bei Schall schwingen Luftteilchen hin und her. Die Schwingung breitet sich bis zum Trommelfell aus.");
p("scala_upper","Oberer Flüssigkeitsgang","#94d8f0","Dieser mit Flüssigkeit gefüllte Gang führt vom ovalen Fenster zur Spitze der Hörschnecke.");
p("scala_lower","Unterer Flüssigkeitsgang","#98b5e5","Dieser mit Flüssigkeit gefüllte Gang führt von der Schneckenspitze zum runden Fenster.");
p("scala_media","Schneckengang","#b0dfc0","Dieser Gang liegt zwischen den beiden anderen Gängen. Er enthält Flüssigkeit und die Sinneszellen zum Hören.");
p("basilar","Basilarmembran","#d8b2ed","Auf diesem biegsamen Band sitzen die Haarzellen. Hohe und tiefe Töne bringen verschiedene Stellen zum Schwingen.");
p("corti","Hörsinneszellen","#f0b29b","Hier sitzen die Haarzellen. Sie wandeln Bewegung in Signale für den Hörnerv um.");
p("apex","Verbindung an der Spitze","#9acdd9","Hier sind der obere und der untere Flüssigkeitsgang miteinander verbunden.");
p("tectorial","Deckmembran","#a7ddd4","Diese weiche Schicht liegt über den Haarzellen. Bewegen sich beide gegeneinander, werden Sinneshärchen verbogen.");
p("inner_hair","Innere Haarzelle","#ecb2a8","Ihre feinen Härchen werden durch Bewegung verbogen. Die Zelle gibt daraufhin ein Signal an den Hörnerv weiter.");
p("outer_hair","Äußere Haarzellen","#b8b2e8","Diese Zellen ändern ihre Länge und verstärken dadurch die Bewegung. So kannst du auch leise Töne hören.");
p("stereocilia","Sinneshärchen","#f2d890","Werden diese feinen Härchen verbogen, öffnen sich winzige Kanäle in der Zelle. So reagiert sie auf Bewegung.");
p("links","Feine Verbindungsfäden","#cfdfef","Diese Fäden verbinden die Sinneshärchen. Wenn sie gespannt werden, helfen sie, kleine Zellöffnungen zu öffnen.");
p("channels","Kleine Zellöffnungen","#96e0cf","Durch diese winzigen Öffnungen gelangen elektrisch geladene Teilchen in die Zelle. Das löst ein elektrisches Signal aus.");
p("synapse","Kontakt zum Hörnerv","#ee9faf","Hier gibt die Haarzelle Botenstoffe ab. Sie übertragen das Signal auf eine Nervenfaser.");
p("support","Stützzellen","#92bfbf","Diese Zellen stützen und versorgen die Haarzellen.");
p("axon","Nervenfasern","#e7c781","Nervenfasern leiten elektrische Signale zum Gehirn. Die Lichtpunkte zeigen den Weg der Signale.");
p("myelin","Isolierende Hülle","#b6c7e5","Diese Hülle isoliert die Nervenfaser. Dadurch werden Signale schneller weitergeleitet.");
p("nodes","Lücken der Hülle","#f6d685","In diesen kleinen Lücken wird das elektrische Signal erneuert. So kommt es schnell und sicher weiter.");
p("semicircular","Drei Bogengänge","#aeb7f0","Die drei Bogengänge erkennen, wenn du den Kopf drehst. Dabei bewegt ihre Flüssigkeit feine Sinneshärchen.");
p("vestibule","Vorhof","#9accc9","Hier wird erkannt, wie dein Kopf zur Schwerkraft liegt. Auch Beschleunigen und Abbremsen werden wahrgenommen.");
p("ampulla","Sinneszellen im Bogengang","#d0b9e8","Hier sitzen die Sinneszellen eines Bogengangs. Bei einer Kopfdrehung werden ihre Härchen verbogen.");
p("mal-head","Hammerkopf und Hals","#e5d9c4","Der Hammerkopf ist mit dem Amboss verbunden. Der schmale Hals verbindet ihn mit dem Griff.");
p("mal-handle","Hammergriff","#e5d9c4","Der Griff ist am Trommelfell befestigt. Wenn es schwingt, bewegt es den Hammer.");
p("inc-body","Ambosskörper","#d6c8b1","Dieser Teil ist mit dem Hammer verbunden. Von ihm gehen ein kurzer und ein langer Arm aus.");
p("inc-short","Kurzer Arm des Ambosses","#d6c8b1","Ein Band hält diesen kurzen Arm an der Wand des Mittelohres fest.");
p("inc-long","Langer Arm des Ambosses","#d6c8b1","Dieser lange Arm verbindet den Amboss mit dem Steigbügel.");
p("sta-head","Steigbügelkopf","#f0e5d0","Der Kopf verbindet den Steigbügel mit dem Amboss.");
p("sta-crura","Bögen des Steigbügels","#f0e5d0","Die beiden dünnen Bögen verbinden Kopf und Fußplatte. Ihre Form erinnert an einen Steigbügel.");
p("sta-foot","Fußplatte des Steigbügels","#f0e5d0","Diese Platte sitzt im ovalen Fenster. Sie bewegt die Flüssigkeit im Innenohr.");
p("bone-joints","Gelenke","#c5bcac","Diese beweglichen Verbindungen halten die drei Knöchelchen zusammen. Sie helfen, die Schwingung weiterzugeben.");
window.EarContent={parts,modelNote:'Lernmodell · Klasse 8 · Größen und Bewegungen vereinfacht.',sources:[
{title:'Sensory Hair Cells: An Introduction to Structure and Physiology (2018)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6104712/'},
{title:'NCBI Bookshelf: Ossiculoplasty – Anatomie der Gehörknöchelchen',url:'https://www.ncbi.nlm.nih.gov/books/NBK563162/'},
{title:'Micro-CT of the human ossicular chain: Statistical shape modeling (2021)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8450485/'},
{title:'NIDCD: How Do We Hear?',url:'https://www.nidcd.nih.gov/health/how-do-we-hear'},
{title:'NCBI Bookshelf: Physiology, Ear',url:'https://www.ncbi.nlm.nih.gov/books/NBK540992/'},
{title:'NCBI Bookshelf: Hair Cells and the Mechanoelectrical Transduction of Sound Waves',url:'https://www.ncbi.nlm.nih.gov/books/NBK10867/'},
{title:'Fettiplace: Hair cell transduction, tuning and synaptic transmission (2017)',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5658794/'},
{title:'NIDCD: Balance Disorders – Gleichgewichtsorgan',url:'https://www.nidcd.nih.gov/health/balance-disorders'}]};
}());
