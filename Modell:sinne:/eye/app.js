/* Augenblick – self-contained educational 3D model. No network requests. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const bridge=window.SenseBridge||{paused:false,allowed:()=>true,barrier(){},leave:()=>false,ready(){}};let clearEmbeddedPointers=()=>{};
  const DATA = [
    {id:"cornea",name:"Hornhaut",color:"#b5e8f3",text:"Die durchsichtige Hornhaut schützt das Auge. Sie lenkt Licht zur Netzhaut."},
    {id:"iris",name:"Iris",color:"#4cbbb6",text:"Die Iris ist der farbige Ring im Auge. Ihre Muskeln regeln, wie viel Licht durch die Pupille fällt."},
    {id:"pupil",name:"Pupille",color:"#45576c",text:"Die Pupille ist die Öffnung in der Iris. Bei Helligkeit wird sie kleiner, bei Dunkelheit größer."},
    {id:"lens",name:"Linse",color:"#93dced",text:"Die Linse bündelt Licht auf der Netzhaut. Zum Scharfsehen wird sie für nahe Dinge runder und für ferne Dinge flacher."},
    {id:"ciliary",name:"Ziliarkörper mit Ziliarmuskel",color:"#c186c2",text:"Dieser Muskel im Ziliarkörper hilft beim Scharfstellen. Für die Nähe zieht er sich zusammen: Die Linsenbänder werden locker, die Linse runder.",short:"Ziliarmuskel"},
    {id:"vitreous",name:"Glaskörper",color:"#88b7e1",text:"Der Glaskörper ist eine durchsichtige, gelartige Masse hinter der Linse. Durch ihn gelangt Licht zur Netzhaut."},
    {id:"retina",name:"Netzhaut",color:"#f49e65",text:"In der Netzhaut nehmen Stäbchen und Zapfen Licht auf. Daraus entstehen Signale für das Gehirn."},
    {id:"choroid",name:"Aderhaut",color:"#b64e65",text:"Die Blutgefäße der Aderhaut versorgen die Sinneszellen mit Sauerstoff und Nährstoffen."},
    {id:"sclera",name:"Lederhaut",color:"#d7e3e8",text:"Die Lederhaut ist die feste, weiße Hülle des Auges. Sie schützt es und hält es in Form."},
    {id:"macula",name:"Gelber Fleck",color:"#f8ce5f",text:"In der Mitte des gelben Flecks siehst du am schärfsten. Dort sitzen besonders viele Zapfen."},
    {id:"disc",name:"Blinder Fleck",color:"#ffe2b3",text:"Hier verlässt der Sehnerv das Auge. Weil Stäbchen und Zapfen fehlen, kann diese Stelle kein Licht wahrnehmen."},
    {id:"nerve",name:"Sehnerv",color:"#f3d2a0",text:"Der Sehnerv leitet elektrische Signale zum Gehirn. Dort entsteht unser Seheindruck."},
    {id:"zonules",name:"Linsenbänder",color:"#d6bde9",text:"Diese feinen Fasern halten die Linse. Sind sie gespannt, ziehen sie die Linse flacher; sind sie locker, wird sie runder."}
  ];
  const MICRO = [
    {id:"rods",name:"Stäbchen",color:"#83d6e8",text:"Stäbchen helfen dir, bei wenig Licht zu sehen. Sie unterscheiden hell und dunkel, aber keine Farben."},
    {id:"cone-s",name:"Blau markierte Zapfen",color:"#7d9eeb",text:"Die blau markierten Zapfen nehmen besonders gut blaues Licht auf. Gemeinsam ermöglichen die drei Zapfentypen das Farbsehen.",short:"Zapfen · Blau"},
    {id:"cone-m",name:"Grün markierte Zapfen",color:"#81c99a",text:"Die grün markierten Zapfen nehmen besonders gut grünes Licht auf. Gemeinsam ermöglichen die drei Zapfentypen das Farbsehen.",short:"Zapfen · Grün"},
    {id:"cone-l",name:"Rot markierte Zapfen",color:"#ee9c85",text:"Die rot markierten Zapfen können rotes Licht aufnehmen. Gemeinsam ermöglichen die drei Zapfentypen das Farbsehen.",short:"Zapfen · Rot"},
    {id:"bipolar",name:"Schaltzellen",color:"#a9b2f0",text:"Diese Zellen geben die Signale von Stäbchen und Zapfen an Nervenzellen weiter."},
    {id:"ganglion",name:"Nervenzellen",color:"#96e1b3",text:"Diese Nervenzellen geben Signale an das Gehirn weiter. Ihre langen Fasern bilden den Sehnerv."},
    {id:"fibers",name:"Nervenfasern",color:"#f2d19a",text:"Diese Fasern leiten elektrische Signale weiter. Am blinden Fleck bilden sie zusammen den Sehnerv."},
    {id:"micro-nerve",name:"Sehnerv",color:"#ecc38e",text:"Der Sehnerv leitet die Signale aus der Netzhaut zum Gehirn."},
    {id:"pigment",name:"Pigmentschicht",color:"#a86962",text:"Diese dunkle Schicht nimmt überschüssiges Licht auf. So stört es das Sehen nicht."}
  ];
  const DETAIL_DATA = [
    {id:"iris-tissue",name:"Iris",color:"#4cbbb6",text:"Die Muskeln der Iris verändern die Größe der Pupille. Probiere den Lichtregler aus."},
    {id:"iris-ring",name:"Ringmuskel",color:"#edb770",text:"Bei hellem Licht zieht sich dieser Muskel zusammen. Die Pupille wird kleiner und lässt weniger Licht hinein."},
    {id:"iris-radial",name:"Strahlenmuskel",color:"#b8b4f0",text:"Bei Dunkelheit zieht dieser Muskel die Pupille weiter auf. So gelangt mehr Licht ins Auge."},
    {id:"iris-opening",name:"Pupillenöffnung",color:"#647b90",text:"Durch diese Öffnung fällt Licht ins Auge. Die Muskeln der Iris machen sie kleiner oder größer."},
    {id:"ac-lens",name:"Linse",color:"#a5e1f1",text:"Für nahe Dinge wird die Linse runder, für ferne Dinge flacher. So siehst du scharf."},
    {id:"ac-muscle",name:"Ziliarmuskel",color:"#c186c2",text:"Für die Nähe zieht sich der Muskel zusammen. Die Linsenbänder werden locker und die Linse runder."},
    {id:"ac-fibers",name:"Linsenbänder",color:"#d6bde9",text:"Gespannte Linsenbänder ziehen die Linse flach. Werden die Bänder locker, wird die Linse runder."},
    {id:"co-window",name:"Hornhaut",color:"#b5e8f3",text:"Die durchsichtige Hornhaut schützt das Auge. Ihre Wölbung lenkt das Licht zur Netzhaut."},
    {id:"co-rays",name:"Lichtbrechung",color:"#ffe29b",text:"Beim Eintritt in die Hornhaut ändert Licht seine Richtung. Das hilft, das Licht auf der Netzhaut zu bündeln."},
    {id:"wall-retina",name:"Netzhaut",color:"#f49e65",text:"In dieser Schicht sitzen Stäbchen und Zapfen. Sie nehmen Licht auf."},
    {id:"wall-choroid",name:"Aderhaut",color:"#b64e65",text:"Die Blutgefäße dieser Schicht versorgen die Sinneszellen mit Sauerstoff und Nährstoffen."},
    {id:"wall-sclera",name:"Lederhaut",color:"#d7e3e8",text:"Diese feste äußere Hülle schützt das Auge und hält es in Form."},
    {id:"mac-cones",name:"Dicht stehende Zapfen",color:"#ef9998",text:"Hier stehen die Zapfen besonders dicht. Deshalb erkennst du feinste Einzelheiten, etwa kleine Buchstaben."},
    {id:"mac-fovea",name:"Sehgrube",color:"#f8ce5f",text:"Diese kleine Vertiefung liegt in der Mitte des gelben Flecks. Hier siehst du am schärfsten."},
    {id:"disc-patch",name:"Blinder Fleck",color:"#ffe2b3",text:"Hier verlässt der Sehnerv das Auge. Weil Stäbchen und Zapfen fehlen, sieht diese Stelle nichts."},
    {id:"disc-fibers",name:"Nervenfasern",color:"#f2d19a",text:"Diese Fasern sammeln sich am blinden Fleck. Zusammen bilden sie den Sehnerv."},
    {id:"disc-nerve",name:"Sehnerv",color:"#ecc38e",text:"Der Sehnerv leitet elektrische Signale von der Netzhaut zum Gehirn."},
    {id:"nerve-cover",name:"Schutzhülle",color:"#cbaa82",text:"Die Hülle schützt den Sehnerv. Hier ist sie geöffnet, damit du hineinsehen kannst."},
    {id:"nerve-axons",name:"Nervenfasern",color:"#f3d2a0",text:"Viele feine Nervenfasern bilden gemeinsam den Sehnerv. Sie leiten Signale zum Gehirn."}
  ];
  const RECEPTOR_DATA=[
    {id:"pr-rod",name:"Stäbchen",color:"#b3d8df",text:"Stäbchen helfen dir, bei wenig Licht zu sehen. Sie unterscheiden hell und dunkel, aber keine Farben."},
    ...['s','m','l'].map(t=>({...MICRO.find(d=>d.id==='cone-'+t),id:'pr-'+t})),
    {id:"pr-discs",name:"Schichten mit Sehfarbstoff",color:"#dec994",text:"Viele dünne Schichten enthalten Sehfarbstoff. Dieser nimmt Licht auf und löst eine Reaktion der Zelle aus.",short:"Sehfarbstoff"},
    {id:"pr-inner",name:"Innerer Zellteil",color:"#e9be8d",text:"Hier liegen Mitochondrien. Sie liefern Energie für die Arbeit der Zelle.",short:"Innerer Zellteil"},
    {id:"pr-cilium",name:"Verbindungsstück",color:"#a8c7ce",text:"Diese schmale Verbindung bringt wichtige Stoffe zum lichtempfindlichen Teil der Zelle."},
    {id:"pr-nucleus",name:"Zellkörper mit Zellkern",color:"#c1b3db",text:"Im Zellkern liegt die Erbinformation. Sie enthält die Bauanleitungen für die Zelle.",short:"Zellkern"},
    {id:"pr-synapse",name:"Kontakt zu Schaltzellen",color:"#ddc19c",text:"Hier gibt die Sinneszelle ihr Signal an Schaltzellen weiter. Dazu nutzt sie kleine Botenstoffe.",short:"Kontaktstelle"}
  ];
  DETAIL_DATA.push(...RECEPTOR_DATA);
  const VIEWS = {
    receptors:{title:'Vier Sinneszellen im Vergleich.',badge:'STÄBCHEN & DREI ZAPFENTYPEN',ids:RECEPTOR_DATA.map(d=>d.id),size:5.6,center:[0,.1,0],theta:.13,phi:1.45,caption:'Drei Zapfentypen ermöglichen das Farbsehen. Jeder reagiert auf mehrere Lichtfarben.'},
    retina:{title:'Wo Licht zum Signal wird.',badge:'DIE NETZHAUT',ids:MICRO.map(d=>d.id),size:8.2,center:[.65,.15,0],theta:.26,phi:1.2,caption:'Licht erreicht die Stäbchen und Zapfen. Ihre Signale gelangen zum Sehnerv.'},
    iris:{title:'Eine Blende aus Muskeln.',badge:'IRIS & PUPILLE',ids:['iris-tissue','iris-ring','iris-radial','iris-opening'],size:4.2,center:[1.79,0,0],theta:1.43,phi:1.44,caption:'Mehr Licht → Ringmuskel zieht sich zusammen → Pupille wird enger.'},
    accommodation:{title:'Wie dein Auge scharfstellt.',badge:'LINSE & ZILIARMUSKEL',ids:['ac-lens','ac-muscle','ac-fibers'],size:4.4,center:[1.4,0,0],theta:.55,phi:1.12,caption:'Ferne: Ziliarmuskel entspannt · Linsenbänder gespannt · Linse flacher.'},
    cornea:{title:'Das durchsichtige Fenster.',badge:'DIE HORNHAUT',ids:['co-window','co-rays'],size:6.1,center:[1.6,0,0],theta:.22,phi:1.27,caption:'Die Hornhaut lenkt das Licht zur Netzhaut.'},
    wall:{title:'Drei Schichten, drei Aufgaben.',badge:'DIE AUGENWAND',ids:['wall-retina','wall-choroid','wall-sclera'],size:5.7,center:[0,0,0],theta:.26,phi:1.10,caption:'Von innen nach außen: Netzhaut → Aderhaut → Lederhaut.'},
    macula:{title:'Die Stelle des schärfsten Sehens.',badge:'GELBER FLECK & SEHGRUBE',ids:['mac-cones','mac-fovea'],size:5.3,center:[0,-.2,0],theta:.24,phi:1.06,caption:'Dicht stehende Zapfen ermöglichen besonders scharfes Sehen.'},
    disc:{title:'Hier verlassen Signale das Auge.',badge:'DER BLINDE FLECK',ids:['disc-patch','disc-fibers','disc-nerve'],size:5.6,center:[.45,0,0],theta:.40,phi:1.10,caption:'Hier verlässt der Sehnerv das Auge. Stäbchen und Zapfen fehlen.'},
    nerve:{title:'Die Verbindung zum Gehirn.',badge:'DER SEHNERV',ids:['nerve-cover','nerve-axons'],size:5.4,center:[0,0,0],theta:.35,phi:1.12,caption:'Die Hülle ist geöffnet: Innen liegen Nervenfasern.'}
  };
  const DETAIL_FOR={retina:'retina',iris:'iris',pupil:'iris',lens:'accommodation',ciliary:'accommodation',zonules:'accommodation',cornea:'cornea',choroid:'wall',sclera:'wall',macula:'macula',disc:'disc',nerve:'nerve','wall-retina':'retina',rods:'receptors','cone-s':'receptors','cone-m':'receptors','cone-l':'receptors','mac-cones':'receptors'};
  const allData = Object.fromEntries([...DATA,...MICRO,...DETAIL_DATA].map(d=>[d.id,d]));
  const viewTrail=[];
  const state = {mode:'eye',selected:null,cut:true,explode:0,labels:true,focus:null,light:.55,near:0,focusPlaying:false};
  const visibility = Object.fromEntries(Object.keys(allData).map(id=>[id,true]));
  let renderer,scene,camera,eye,micro,orbit,frame=0,ready=false,hoverId=null;
  const groups={},anchors={},labelNodes={},views={};
  const irisDeform=[],pupilMeshes=[],acSystems=[];
  let lightNow=.55,nearNow=0,zoomContext=null,zoomStartDistance=0,lastDrawTime=0;
  let focusStartDistance=0,eyeReturnAngles=null,focusPhase=0;
  const meshes=[]; const moving=[]; const cuts=[];
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eyeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const hiddenIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M9.5 5.3A12 12 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.7M6.5 6.5A20 20 0 0 0 2 12s3.5 7 10 7a13 13 0 0 0 5-1M10 10a3 3 0 0 0 4 4"/></svg>';
  function announce(message){$('status').textContent=message;}
  function activeData(){return state.mode==='eye'?DATA:VIEWS[state.mode].ids.map(id=>allData[id]);}
  function renderList(){
    const list=$('parts-list'); list.replaceChildren();
    activeData().forEach(d=>{
      const row=document.createElement('div'); row.className='part-row'; row.dataset.id=d.id;
      const select=document.createElement('button');select.className='part-select';select.dataset.select=d.id;
      const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=d.color;swatch.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.textContent=d.name;
      select.append(swatch,name);select.addEventListener('click',()=>selectPart(d.id,true));
      const toggle=document.createElement('button');toggle.className='visibility';toggle.dataset.toggle=d.id;
      toggle.addEventListener('click',()=>togglePart(d.id));row.append(select,toggle);list.append(row);
    });
    $('part-count').textContent=activeData().length;
    updateList();
  }
  function updateList(){
    document.querySelectorAll('.part-row').forEach(row=>{
      const id=row.dataset.id;
      row.classList.toggle('active',id===state.selected);row.classList.toggle('off',!visibility[id]);
      row.querySelector('.part-select').setAttribute('aria-pressed',String(id===state.selected));
      const toggle=row.querySelector('.visibility');toggle.innerHTML=visibility[id]?eyeIcon:hiddenIcon;
      toggle.setAttribute('aria-pressed',String(visibility[id]));toggle.setAttribute('aria-label',`${allData[id].name} ${visibility[id]?'ausblenden':'einblenden'}`);
      toggle.title=toggle.getAttribute('aria-label');
    });
  }
  function closeInfo(){state.selected=null;$('info-card').hidden=true;$('intro-hint').hidden=state.mode!=='eye'||!!state.focus;highlight();updateList();updateZoomHint();requestDraw();}
  function selectPart(id,fromList=false){
    if(!allData[id])return;
    if(state.focus&&state.focus!==id&&!(state.mode==='receptors'&&['pr-rod','pr-s','pr-m','pr-l'].includes(state.focus)&&id.startsWith('pr-')&&!['pr-rod','pr-s','pr-m','pr-l'].includes(id))){state.focus=null;syncView();resetCamera(false);}
    if(!visibility[id]){visibility[id]=true;syncVisibility();}
    state.selected=id;zoomContext=null;const d=allData[id];
    $('info-title').textContent=d.name;$('info-text').textContent=d.text;$('info-note').textContent=d.note||'';$('info-note').hidden=!d.note;
    $('info-kicker').textContent=state.mode!=='eye'?'IM DETAIL':id==='macula'||id==='disc'?'BEREICH DER NETZHAUT':'BESTANDTEIL DES AUGES';
    $('info-card').style.setProperty('--part-color',d.color);$('info-card').hidden=false;$('intro-hint').hidden=true;
    $('detail-button').hidden=id!=='retina'&&id!=='wall-retina';$('focus-button').hidden=!$('detail-button').hidden;$('focus-button').disabled=!ready;
    $('focus-button').textContent=state.focus===id?'Ansicht zentrieren ↗':DETAIL_FOR[id]?'In 3D entdecken ↗':'Nahansicht ↗';
    $('hide-selected').textContent='Ausblenden';
    updateList();highlight();updateZoomHint();requestDraw();announce(`${d.name}. ${d.text}`);
    if(fromList&&window.innerWidth<821)$('stage').scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'center'});
  }
  function togglePart(id){
    visibility[id]=!visibility[id];
    if(!visibility[id]&&state.selected===id)closeInfo();
    if(!visibility[id]&&state.focus===id){state.focus=null;syncView();resetCamera(false);}
    syncVisibility();updateList();requestDraw();announce(`${allData[id].name} ${visibility[id]?'eingeblendet':'ausgeblendet'}.`);
  }
  function syncVisibility(){
    const cellFocus=state.mode==='receptors'&&['pr-rod','pr-s','pr-m','pr-l'].includes(state.focus);
    Object.keys(groups).forEach(id=>{groups[id].visible=visibility[id]&&(!state.focus||id===state.focus||cellFocus&&id.startsWith('pr-'));});
    for(const m of meshes)if(m.userData.receptorType)m.visible=!cellFocus||m.userData.receptorType===state.focus;
  }
  function highlight(){
    if(!ready)return;
    meshes.forEach(m=>{if(m.material.emissive){m.material.emissive.set(m.userData.id===state.selected?allData[m.userData.id].color:0x000000);m.material.emissiveIntensity=m.userData.id===state.selected?.19:0;}});
    Object.entries(labelNodes).forEach(([id,n])=>n.classList.toggle('active',id===state.selected));
  }
  function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.49,metalness:.02,side:THREE.DoubleSide,...extra});}
  function createGroup(id,parent){const g=new THREE.Group();g.name=id;g.userData.id=id;parent.add(g);groups[id]=g;return g;}
  function addMesh(id,geometry,mat,parent=groups[id]){
    const m=new THREE.Mesh(geometry,mat);m.userData.id=id;parent.add(m);meshes.push(m);return m;
  }
  function ball(id,pos,scale,color,parent){const m=addMesh(id,new THREE.SphereGeometry(1,24,16),material(color||allData[id].color),parent);m.position.set(...pos);m.scale.set(...scale);return m;}
  function tube(id,points,radius,color,parent){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return addMesh(id,new THREE.TubeGeometry(curve,28,radius,8,false),material(color||allData[id].color),parent);}
  // Axis of eye is X. theta=0 is the cornea; theta=PI is the posterior pole.
  function surface(radius,startTheta,endTheta,startPhi,endPhi,thickness=0){
    const pos=[],ind=[],n=64,k=72;
    for(let i=0;i<=n;i++){const t=startTheta+(endTheta-startTheta)*i/n;
      for(let j=0;j<=k;j++){const p=startPhi+(endPhi-startPhi)*j/k;pos.push(radius*Math.cos(t),radius*Math.sin(t)*Math.sin(p),radius*Math.sin(t)*Math.cos(p));}}
    for(let i=0;i<n;i++)for(let j=0;j<k;j++){const a=i*(k+1)+j,b=a+k+1;ind.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();return g;
  }
  function shell(id,r,color,t0,opacity=1){
    const mat=material(color,{transparent:opacity<1,opacity,depthWrite:opacity===1,roughness:opacity<1?.18:.57});
    const whole=addMesh(id,surface(r,t0,Math.PI,0,Math.PI*2),mat);
    const cut=addMesh(id,surface(r,t0,Math.PI,Math.PI*.56,Math.PI*2),mat.clone());
    whole.userData.transparentCover=opacity<1;cut.userData.transparentCover=opacity<1;
    cuts.push({whole,cut});return {whole,cut};
  }
  function addRing(id,inner,outer,x,color){const m=addMesh(id,new THREE.RingGeometry(inner,outer,100),material(color));m.rotation.y=Math.PI/2;m.position.x=x;return m;}
  function anchor(id,p){const a=new THREE.Object3D();a.position.set(...p);groups[id].add(a);anchors[id]=a;}
  function buildEye(){
    eye=new THREE.Group();scene.add(eye);views.eye=eye;
    DATA.forEach(d=>createGroup(d.id,eye));
    shell('sclera',2.4,'#d4e2e9',.69);
    shell('choroid',2.31,'#9f4354',.74);
    shell('retina',2.22,'#e9985d',.88);
    shell('vitreous',2.12,'#8cc9eb',.88,.10);
    // Cut edge ribbons expose the three adjacent coats of the eyeball.
    ['sclera','choroid','retina'].forEach((id,index)=>{
      const r=[2.4,2.31,2.22][index],inner=r-.075;
      const edge=new THREE.Group();groups[id].add(edge);
      for(const phi of [0,Math.PI*.56]){
        const vertices=[],indices=[];
        for(let i=0;i<=80;i++){
          const theta=[.69,.74,.88][index]+(Math.PI-[.69,.74,.88][index])*i/80;
          for(const rr of [r,inner])vertices.push(rr*Math.cos(theta),rr*Math.sin(theta)*Math.sin(phi),rr*Math.sin(theta)*Math.cos(phi));
          if(i<80){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
        }
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
        addMesh(id,g,material(['#eef5f7','#d6757a','#ffd394'][index]),edge);
      }
      cuts.push({edge});
    });
    // Cornea, a transparent dome, joins the anterior scleral rim.
    const cornea=addMesh('cornea',new THREE.SphereGeometry(1,64,40,0,Math.PI*2,0,Math.PI/2),material('#a8e4f0',{transparent:true,opacity:.22,depthWrite:false,roughness:.12,metalness:.12}));
    cornea.rotation.z=-Math.PI/2;cornea.scale.set(1.535,.68,1.535);cornea.position.x=1.85;cornea.userData.transparentCover=true;
    const corneaRim=addMesh('cornea',new THREE.TorusGeometry(1.53,.023,8,96),material('#b6e4ed',{transparent:true,opacity:.75}));corneaRim.rotation.y=Math.PI/2;corneaRim.position.x=1.85;
    addRing('iris',.48,1.39,1.78,'#29918e');
    for(let i=0;i<120;i++){
      const p=i/120*Math.PI*2,r1=.50+(i%7)*.023,r2=1.37-(i%5)*.026;
      tube('iris',[[1.79,Math.sin(p)*r1,Math.cos(p)*r1],[1.794,Math.sin(p+.018)*.95,Math.cos(p+.018)*.95],[1.79,Math.sin(p)*r2,Math.cos(p)*r2]],.008,i%3?'#55bdb1':'#217574');
    }
    const pupil=addMesh('pupil',new THREE.CircleGeometry(.478,64),material('#071320',{roughness:1}));pupil.rotation.y=Math.PI/2;pupil.position.x=1.786;
    const lens=ball('lens',[1.37,0,0],[.33,.95,.95],'#a5e1f1');lens.material.roughness=.13;lens.material.metalness=.13;
    const ring=addMesh('ciliary',new THREE.TorusGeometry(1.47,.18,18,96),material('#a867aa'));ring.rotation.y=Math.PI/2;ring.position.x=1.38;
    for(let i=0;i<60;i++){
      const p=i/60*Math.PI*2;
      const fold=ball('ciliary',[1.38,Math.sin(p)*1.4,Math.cos(p)*1.4],[.22,.058,.09],i%2?'#b978b8':'#9d65a3');fold.rotation.x=-p;
      tube('zonules',[[1.38,Math.sin(p)*1.36,Math.cos(p)*1.36],[1.40,Math.sin(p)*1.12,Math.cos(p)*1.12],[1.37,Math.sin(p)*.95,Math.cos(p)*.95]],.009);
    }
    // Surface landmarks lie ON the neural retina, not outside it.
    const macula=ball('macula',[-2.165,-.13,.23],[.032,.25,.25],'#ecc953');
    ball('macula',[-2.12,-.13,.23],[.025,.079,.079],'#ffde77');
    const disc=ball('disc',[-1.97,-.18,-.97],[.08,.20,.18],'#ffe3b5');disc.rotation.y=-.43;
    // Optic nerve leaves nasally to the macula and continues away from the globe.
    const nervePoints=[[-1.97,-.18,-.97],[-2.47,-.25,-1.23],[-3.1,-.35,-1.40],[-3.8,-.48,-1.33]];
    tube('nerve',nervePoints,.255,'#d6b489');
    for(let j=0;j<9;j++){
      const p=j/9*Math.PI*2;const off=[Math.cos(p)*.13,Math.sin(p)*.13];
      tube('nerve',nervePoints.map(v=>[v[0],v[1]+off[0],v[2]+off[1]]),.027,'#f2d6a8');
    }
    // Stylized retinal blood vessels are attached to the retina group.
    for(let branch=0;branch<5;branch++){
      const pts=[];
      for(let i=0;i<15;i++){
        const t=i/14,theta=2.66-t*(.75+branch*.11),phi=3.1+(branch-2)*.33+t*.25;
        pts.push([2.195*Math.cos(theta),2.195*Math.sin(theta)*Math.sin(phi),2.195*Math.sin(theta)*Math.cos(phi)]);
      }
      tube('retina',pts,.012,branch%2?'#bf654f':'#b86660');
    }
    anchor('cornea',[2.5,.18,.53]);anchor('iris',[1.79,-.90,.53]);anchor('pupil',[1.80,0,0]);anchor('lens',[1.48,.37,.65]);anchor('ciliary',[1.38,1.32,-.54]);anchor('vitreous',[.2,.2,1.52]);anchor('retina',[-.85,-.10,2.04]);anchor('choroid',[-1.25,1.82,-.36]);anchor('sclera',[-.4,-1.99,.82]);anchor('macula',[-2.12,-.13,.23]);anchor('disc',[-1.91,-.18,-.97]);anchor('nerve',[-3.15,-.35,-1.40]);anchor('zonules',[1.38,-.65,.86]);
    Object.entries({cornea:[1.7,0,0],iris:[1.23,0,0],pupil:[1.23,0,0],lens:[.62,0,0],ciliary:[.23,0,0],zonules:[.23,0,0],vitreous:[-.15,0,0],retina:[-.9,0,0],macula:[-.9,0,0],disc:[-.9,0,0],choroid:[-1.65,0,0],sclera:[-2.4,0,0],nerve:[-2.4,0,0]}).forEach(([id,offset])=>moving.push({group:groups[id],offset:new THREE.Vector3(...offset)}));
    applyCut();
    registerIris(groups.iris);
    pupilMeshes.push(pupil);
    acSystems.push({lens,ciliary:groups.ciliary,fibers:groups.zonules});
  }
  function buildMicro(){
    micro=new THREE.Group();scene.add(micro);micro.visible=false;views.retina=micro;
    MICRO.forEach(d=>createGroup(d.id,micro));
    // Hexagonal pigment epithelium; the dark apical side faces outer segments.
    for(let r=0;r<5;r++)for(let c=0;c<11;c++){
      const x=-2.95+c*.51+(r%2)*.255,z=-1.18+r*.50;
      const tile=addMesh('pigment',new THREE.CylinderGeometry(.287,.28,.13,6),material((r+c)%3?'#81595a':'#976b64'));
      tile.position.set(x,-2.16,z);tile.rotation.y=Math.PI/6;
      ball('pigment',[x,-2.083,z],[.075,.013,.065],'#4e3b46');
    }
    const assigned=['cone-m','cone-l','cone-s','cone-l','cone-m','cone-l','cone-m','cone-l'];let ci=0;
    for(let row=0;row<3;row++)for(let col=0;col<10;col++){
      const x=-2.77+col*.51,z=(row-1)*.84,cone=(col+row*2)%4===1,id=cone?assigned[ci++%assigned.length]:'rods';
      const tint=allData[id].color;
      const profile=cone?[[.036,0],[.075,.17],[.113,.45],[.125,.59]]:[[.060,0],[.070,.04],[.070,.61],[.059,.66]];
      const geo=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),24);
      const outer=addMesh(id,geo,material(tint,{roughness:.62}));outer.position.set(x,-2.05,z);
      const lines=[];for(let j=0;j<12;j++){const y=.04+j*.047,r=cone?.045+y*.137:.071;
        for(let k=0;k<24;k++){const a=k/24*Math.PI*2,b=(k+1)/24*Math.PI*2;lines.push(x+r*Math.cos(a),-2.05+y,z+r*Math.sin(a),x+r*Math.cos(b),-2.05+y,z+r*Math.sin(b));}}
      const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));groups[id].add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:tint,transparent:true,opacity:.45})));
      tube(id,[[x,-1.46,z],[x,-1.36,z]],.023,tint);
      ball(id,[x,-1.17,z],[cone?.12:.085,.22,cone?.12:.085],tint);
      tube(id,[[x,-1.0,z],[x,-.74,z],[x,-.38,z]],cone?.028:.018,tint);
      ball(id,[x,-.66,z],[cone?.115:.08,.16,cone?.115:.08],tint);
      ball(id,[x,-.66,z+.063],[.046,.072,.022],'#6f719e');
      ball(id,[x,-.34,z],cone?[.13,.06,.115]:[.067,.065,.065],tint);
      if(!anchors[id])anchor(id,[x,-1.73,z]);
    }
    // Simplified vertical relay cells, with explicit contacts to photoreceptors.
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const x=-2.54+col*1.02,z=(row-1)*.84;
      ball('bipolar',[x,.22,z],[.11,.18,.11]);
      tube('bipolar',[[x,-.21,z],[x,.10,z],[x,.60,z]],.027);
      for(const delta of [-.23,.28])tube('bipolar',[[x,.0,z],[x+delta,-.22,z],[x+delta,-.32,z]],.022);
      tube('bipolar',[[x,.52,z],[x+.10,.68,z],[x+.2,.77,z]],.026);
    }
    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const x=-2.35+col*1.26,z=row? .73:-.67;
      ball('ganglion',[x,1.09,z],[.22,.19,.19]);
      for(const dx of [-.48,-.15,.3,.55])tube('ganglion',[[x,1.02,z],[x+dx*.55,.85,z-.05],[x+dx,.72,z+(dx>0?.12:-.12)]],.027);
      tube('ganglion',[[x,1.20,z],[x+.17,1.51,z],[x+.5,1.6,z]],.035);
      tube('fibers',[[x+.5,1.6,z],[1.8,1.68+row*.08,z],[2.7,1.66,z*.40],[3.15,1.50,z*.21],[3.52,1.48,z*.19]],.033);
    }
    tube('micro-nerve',[[3.1,1.52,0],[3.75,1.48,0],[4.4,1.32,0],[4.95,1.05,0]],.22,'#d1ae80');
    for(let i=0;i<9;i++){
      const p=i/9*Math.PI*2,y=Math.sin(p)*.13,z=Math.cos(p)*.13;
      tube('micro-nerve',[[3.12,1.52+y,z],[3.75,1.48+y,z],[4.4,1.32+y,z],[4.95,1.05+y,z]],.026,'#f3d6a2');
    }
    // Light travels from vitreous, through neural layers, to photoreceptors.
    const arrowMat=new THREE.MeshBasicMaterial({color:'#ffe399'});
    for(let i=0;i<3;i++){
      const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(-1.75+i*1.5,3,0),1.05,'#ffe399',.16,.12);micro.add(arrow);
    }
    const signalArrow=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(-3.3,-1.75,.1),2.9,'#8bdaf4',.18,.13);micro.add(signalArrow);
    anchor('bipolar',[-1.52,.22,.84]);anchor('ganglion',[-1.09,1.1,.73]);anchor('fibers',[1.72,1.74,.73]);anchor('micro-nerve',[4.32,1.34,0]);anchor('pigment',[-1.4,-2.13,1.4]);
  }
  function buildReceptors(){
    const root=views.receptors;RECEPTOR_DATA.forEach(d=>createGroup(d.id,root));
    const start=.62,arc=Math.PI*2-2*start;
    for(const [i,id] of ['pr-rod','pr-s','pr-m','pr-l'].entries()){
      const firstMesh=meshes.length;const x=-2.55+i*1.7,isRod=i===0,tint=allData[id].color;
      const profile=isRod?[[.15,-1.85],[.17,-1.79],[.17,-.22],[.15,-.16]]:[[.055,-1.70],[.085,-1.54],[.185,-.55],[.235,-.22],[.23,-.16]];
      const outer=addMesh(id,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48,start,arc),material(tint,{roughness:.65}));outer.position.x=x;
      // Separated disc edges stay visible within the cutaway; their spacing is exaggerated.
      const discGeo=new THREE.CylinderGeometry(1,1,.018,36);
      const discs=new THREE.InstancedMesh(discGeo,material(tint,{roughness:.67}),24);
      discs.userData.id='pr-discs';groups['pr-discs'].add(discs);meshes.push(discs);
      const matrix=new THREE.Matrix4();
      for(let j=0;j<24;j++){const y=(isRod?-1.76:-1.61)+j*(isRod?1.53:1.39)/23;const r=isRod?.145:.063+(y+1.61)/1.39*.143;
        matrix.makeScale(r,1,r);matrix.setPosition(x,y,0);discs.setMatrixAt(j,matrix);
      }discs.instanceMatrix.needsUpdate=true;
      // Thin connection, broader inner segment, cell body and synaptic ending.
      tube('pr-cilium',[[x,-.16,0],[x,-.035,0],[x,.02,0]],.047,'#a1b6b5');
      const innerProfile=[[.13,-.01],[.22,.12],[.255,.38],[.20,.68],[.13,.78]];
      const inner=addMesh('pr-inner',new THREE.LatheGeometry(innerProfile.map(p=>new THREE.Vector2(...p)),40,start,arc),material('#e3c3a1',{roughness:.75}));inner.position.x=x;
      for(let j=0;j<5;j++){const a=j/5*Math.PI*2;const m=ball('pr-inner',[x+Math.cos(a)*.115,.34+(j%2)*.035,Math.sin(a)*.11],[.052,.19,.048],'#b98966');m.rotation.z=(j-2)*.08;
        for(let k=0;k<3;k++)tube('pr-inner',[[x+Math.cos(a)*.115-.037,.25+k*.08,Math.sin(a)*.11+.034],[x+Math.cos(a)*.115,.27+k*.08,Math.sin(a)*.11+.048],[x+Math.cos(a)*.115+.037,.25+k*.08,Math.sin(a)*.11+.034]],.008,'#e8b985');}
      tube(id,[[x,.76,0],[x,1.08,0],[x,1.57,0]],isRod?.042:.053,tint);
      const body=ball('pr-nucleus',[x,1.12,0],[isRod?.18:.24,.28,isRod?.18:.23],'#c7bdcf');body.material.transparent=true;body.material.opacity=.40;body.material.depthWrite=false;
      ball('pr-nucleus',[x,1.12,.015],[isRod?.12:.16,.19,isRod?.12:.15],'#9c87bd');
      tube(id,[[x,1.38,0],[x,1.67,0],[x,1.91,0]],.04,tint);
      if(isRod)ball('pr-synapse',[x,1.99,0],[.13,.14,.13],'#c9b29d');
      else{const foot=addMesh('pr-synapse',new THREE.CylinderGeometry(.30,.07,.21,32),material('#d7b59b'));foot.position.set(x,1.97,0);ball('pr-synapse',[x,2.08,0],[.30,.045,.28],'#ddc6ad');}
      for(let j=0;j<4;j++)ball('pr-synapse',[x+(j-1.5)*.055,2.055,.055],[.018,.018,.018],'#ede0a9');
      anchor(id,[x,-1.05,-.015]);for(let j=firstMesh;j<meshes.length;j++)meshes[j].userData.receptorType=id;
    }
    anchor('pr-discs',[-2.55,-.7,.15]);anchor('pr-inner',[-.85,.4,.13]);anchor('pr-cilium',[.85,-.075,.05]);anchor('pr-nucleus',[2.55,1.12,.22]);anchor('pr-synapse',[.85,2.05,.27]);
  }

  function registerIris(group){
    group.traverse(m=>{if(m.isMesh){irisDeform.push({mesh:m,base:new Float32Array(m.geometry.attributes.position.array),plane:m.geometry.type==='RingGeometry'||m.geometry.type==='TorusGeometry'});}});
  }
  function clonePart(source,id,parent){
    const dest=createGroup(id,parent);
    groups[source].children.filter(c=>c.isMesh||c.isGroup).forEach(c=>{
      const copy=c.clone(true);
      copy.traverse(m=>{if(m.isMesh){m.geometry=m.geometry.clone();m.material=m.material.clone();m.userData={id};meshes.push(m);}});
      dest.add(copy);
    });return dest;
  }
  function buildDetails(){
    for(const key of Object.keys(VIEWS).filter(k=>k!=='retina')){const root=new THREE.Group();root.visible=false;views[key]=root;scene.add(root);}
    // Iris: actual annular tissue with a circular opening, ring and radial muscles.
    const irisRoot=views.iris;
    clonePart('iris','iris-tissue',irisRoot);registerIris(groups['iris-tissue']);
    createGroup('iris-ring',irisRoot);
    const sphincter=addMesh('iris-ring',new THREE.TorusGeometry(.555,.065,14,96),material('#f0b26d'));sphincter.rotation.y=Math.PI/2;sphincter.position.x=1.824;registerIris(groups['iris-ring']);
    createGroup('iris-radial',irisRoot);
    for(let i=0;i<28;i++){const p=i/28*Math.PI*2;tube('iris-radial',[[1.819,Math.sin(p)*.68,Math.cos(p)*.68],[1.82,Math.sin(p)*.97,Math.cos(p)*.97],[1.819,Math.sin(p)*1.33,Math.cos(p)*1.33]],.024,'#b9b6ed');}
    registerIris(groups['iris-radial']);
    clonePart('pupil','iris-opening',irisRoot);pupilMeshes.push(groups['iris-opening'].children.find(c=>c.isMesh));
    anchor('iris-tissue',[1.8,.75,.75]);anchor('iris-ring',[1.83,.55,0]);anchor('iris-radial',[1.84,-.72,.64]);anchor('iris-opening',[1.84,0,0]);
    // Accommodation assembly keeps all three working partners visible.
    const ac=views.accommodation;
    clonePart('lens','ac-lens',ac);clonePart('ciliary','ac-muscle',ac);clonePart('zonules','ac-fibers',ac);
    acSystems.push({lens:groups['ac-lens'].children.find(c=>c.isMesh),ciliary:groups['ac-muscle'],fibers:groups['ac-fibers']});
    anchor('ac-lens',[1.6,0,.6]);anchor('ac-muscle',[1.38,1.45,0]);anchor('ac-fibers',[1.4,-.7,.9]);
    // Cornea: separated rays clearly indicate only the principle of refraction.
    clonePart('cornea','co-window',views.cornea);createGroup('co-rays',views.cornea);
    for(const y of [-.85,0,.85]){
      tube('co-rays',[[4.1,y,0],[2.51-Math.abs(y)*.12,y,0],[1.05,y*.58,0],[-.65,0,0]],.017,'#ffe09a');
      const a=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(3.7,y,0),.65,'#ffe09a',.13,.09);views.cornea.add(a);
    }
    anchor('co-window',[2.26,1.08,.6]);anchor('co-rays',[3.25,.85,0]);
    // Exploded curved patches of the three coats of the eye wall.
    for(const [id,y,color] of [['wall-retina',.82,'#f0a270'],['wall-choroid',0,'#a5455d'],['wall-sclera',-.83,'#dce8ed']]){
      createGroup(id,views.wall);
      const slab=addMesh(id,new THREE.BoxGeometry(3.8,.19,2.5,32,1,24),material(color));
      const arr=slab.geometry.attributes.position;
      for(let i=0;i<arr.count;i++)arr.setY(i,arr.getY(i)+.10*(arr.getX(i)**2+arr.getZ(i)**2));
      slab.geometry.computeVertexNormals();slab.position.y=y;
      anchor(id,[.8,y+.2,1.05]);
    }
    for(let i=0;i<6;i++){
      const z=-1+i*.4;
      tube('wall-choroid',[[-1.8,.13+.10*(1.8**2+z*z),z],[0,.13+.1*z*z,z+.10],[1.8,.13+.10*(1.8**2+z*z),z]],.043,i%2?'#db8290':'#dd685b');
    }
    tube('wall-choroid',[[0,.2,-1.15],[.18,.13,0],[.1,.27,1.2]],.065,'#df827a');
    buildReceptors();
    // Central fovea: cones only, increased density and a shallow depression.
    createGroup('mac-fovea',views.macula);createGroup('mac-cones',views.macula);
    const patch=addMesh('mac-fovea',new THREE.CylinderGeometry(2.05,2.05,.2,80,6),material('#c89060'));patch.position.y=-.82;
    const pa=patch.geometry.attributes.position;
    for(let i=0;i<pa.count;i++){const r=Math.hypot(pa.getX(i),pa.getZ(i));pa.setY(i,pa.getY(i)-.20*Math.exp(-r*r));}patch.geometry.computeVertexNormals();
    for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){
      const x=i*.29,z=j*.29;if(x*x+z*z>2.6)continue;
      const y=-.23-.23*Math.exp(-(x*x+z*z));
      const cone=addMesh('mac-cones',new THREE.CylinderGeometry(.087,.028,.47,12),material((i+j)%3?'#ee9c85':'#81c99a'));cone.position.set(x,y,z);
      ball('mac-cones',[x,y+.36,z],[.06,.16,.06],'#f2bcad');
    }
    anchor('mac-cones',[-.7,.0,1.1]);anchor('mac-fovea',[0,-.83,0]);
    // Optic disc: fibers pass through a photoreceptor-free exit in a tissue ring.
    createGroup('disc-patch',views.disc);createGroup('disc-fibers',views.disc);createGroup('disc-nerve',views.disc);
    const tissue=addMesh('disc-patch',new THREE.RingGeometry(.58,1.8,80),material('#dc976c'));tissue.rotation.x=-Math.PI/2;
    const exit=addMesh('disc-patch',new THREE.TorusGeometry(.58,.07,10,64),material('#ffddb0'));exit.rotation.x=-Math.PI/2;
    for(let i=0;i<18;i++){
      const p=i/18*Math.PI*2;
      tube('disc-fibers',[[Math.cos(p)*1.7,.09,Math.sin(p)*1.7],[Math.cos(p)*.75,.08,Math.sin(p)*.75],[Math.cos(p)*.35,-.23,Math.sin(p)*.35],[.2+Math.cos(p)*.13,-1.10,Math.sin(p)*.13],[1.2,-1.55,Math.sin(p)*.13]],.027,'#ffe0a6');
    }
    tube('disc-nerve',[[.20,-1.08,0],[1.2,-1.55,0],[2.4,-1.52,0]],.22,'#ddbd92');
    anchor('disc-patch',[0,.02,0]);anchor('disc-fibers',[-1,.1,.8]);anchor('disc-nerve',[1.8,-1.55,0]);
    // Nerve segment: opened half-cylinder plus a bundle of individual fibers.
    createGroup('nerve-cover',views.nerve);createGroup('nerve-axons',views.nerve);
    const cover=addMesh('nerve-cover',new THREE.CylinderGeometry(.69,.69,3.8,48,1,true,Math.PI,Math.PI),material('#c7a47c'));cover.rotation.z=Math.PI/2;
    for(let i=0;i<19;i++){
      const r=i===0?0:i<7?.23:.47,p=(i<7?i/6:i/12)*Math.PI*2;
      const y=Math.sin(p)*r,z=Math.cos(p)*r;
      tube('nerve-axons',[[-2.15,y,z],[-.7,y+.05,z],[.7,y-.04,z],[2.15,y,z]],.069,i%3?'#f5d09a':'#f6e1b7');
    }
    anchor('nerve-cover',[0,-.63,0]);anchor('nerve-axons',[1.8,.34,.28]);
    // Cache deformation coordinates once so slider animations allocate no geometry.
    acSystems.forEach(s=>s.fibers.traverse(m=>{if(m.isMesh)m.userData.basePositions=new Float32Array(m.geometry.attributes.position.array);}));
  }
  function animateAnatomy(dt){
    const a=reduceMotion?1:1-Math.exp(-dt/170);
    const oldLight=lightNow,oldNear=nearNow;lightNow+=(state.light-lightNow)*a;nearNow+=(state.near-nearNow)*a;
    if(Math.abs(oldLight-lightNow)>.00001||!lastDrawTime){
      const inner=.86-.61*lightNow;
      irisDeform.forEach(({mesh,base,plane})=>{
        const attr=mesh.geometry.attributes.position,d=attr.array;
        for(let i=0;i<d.length;i+=3){const ai=plane?i:i+1,bi=plane?i+1:i+2;const r=Math.hypot(base[ai],base[bi]);const nr=inner+(r-.478)*(1.39-inner)/(.912),ratio=r?nr/r:1;d[ai]=base[ai]*ratio;d[bi]=base[bi]*ratio;}
        attr.needsUpdate=true;mesh.geometry.computeBoundingSphere();
      });
      pupilMeshes.forEach(m=>{m.scale.set(inner/.478,inner/.478,1);});
      if(anchors['iris-ring'])anchors['iris-ring'].position.y=inner+.07;
    }
    if(Math.abs(oldNear-nearNow)>.00001||!lastDrawTime){
      acSystems.forEach(s=>{
        s.lens.scale.set(.29+nearNow*.17,.95-nearNow*.04,.95-nearNow*.04);s.ciliary.scale.set(1,1-nearNow*.13,1-nearNow*.13);
        s.fibers.traverse(m=>{if(m.isMesh&&m.userData.basePositions){const d=m.geometry.attributes.position.array,b=m.userData.basePositions;
          for(let i=0;i<d.length;i+=3){const r=Math.hypot(b[i+1],b[i+2]),t=THREE.MathUtils.clamp((r-.95)/.41,0,1),nr=r-nearNow*(.04+t*.137);d[i]=b[i]+nearNow*.075*Math.sin(t*Math.PI);d[i+1]=b[i+1]*nr/r;d[i+2]=b[i+2]*nr/r;}m.geometry.attributes.position.needsUpdate=true;m.geometry.computeBoundingSphere();}});
      });
    }
    return Math.abs(state.light-lightNow)+Math.abs(state.near-nearNow)>.0001;
  }
  function updateLight(){
    const description=state.light<.28?'weit':state.light>.72?'eng':'mittel';
    $('light-result').textContent=`Pupille: ${description}`;$('light').setAttribute('aria-valuetext',`${Math.round(state.light*100)} Prozent Licht, Pupille ${description}`);
    if(state.mode==='iris')$('detail-caption').textContent=state.light>.55?'Viel Licht: Der Ringmuskel zieht sich zusammen. Die Pupille wird enger.':'Wenig Licht: Der Strahlenmuskel zieht die Pupille weiter auf.';
    requestDraw();
  }
  function writeFocusText(id,text){if($(id).textContent!==text)$(id).textContent=text;}
  function updateFocusControls(){
    const near=state.near>.8,far=state.near<.2;
    const label=near?'Nah · Linse runder':far?'Fern · Linse flacher':'Dazwischen · Linse passt sich an';
    const explanation=near?'Muskel zusammengezogen → Bänder locker → Linse runder.':far?'Muskel entspannt → Bänder gespannt → Linse flacher.':'Muskel teilweise zusammengezogen → Bänder weniger gespannt → Linse etwas runder.';
    $('focus-distance').value=String(Math.round((1-state.near)*100));
    $('focus-distance').setAttribute('aria-valuetext',label);
    writeFocusText('focus-result',label);writeFocusText('focus-explanation',explanation);
    for(const [id,active] of [['near-button',state.near>.995],['far-button',state.near<.005]]){
      $(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));
    }
    $('focus-play').setAttribute('aria-pressed',String(state.focusPlaying));
    writeFocusText('focus-play',state.focusPlaying?'Ⅱ Pause':'▶ Wechsel zeigen');
    if(state.mode==='accommodation')writeFocusText('detail-caption',explanation);
  }
  function setFocusPlayback(playing){
    state.focusPlaying=!!playing;
    if(playing)focusPhase=Math.acos(1-2*state.near);
    updateFocusControls();requestDraw();
  }
  function setNear(near){
    if(!Number.isFinite(Number(near)))return;
    state.focusPlaying=false;state.near=THREE.MathUtils.clamp(Number(near),0,1);
    updateFocusControls();requestDraw();
  }
  function advanceFocus(dt){
    if(!state.focusPlaying)return;
    focusPhase=(focusPhase+dt/1800)%(Math.PI*2);
    state.near=(1-Math.cos(focusPhase))/2;
    updateFocusControls();
  }
  function applyCut(){cuts.forEach(c=>{if(c.whole){c.whole.visible=!state.cut;c.cut.visible=state.cut;}else c.edge.visible=state.cut;});}
  function applyExplode(){moving.forEach(m=>m.group.position.copy(m.offset).multiplyScalar(state.explode));$('explode-value').value=`${Math.round(state.explode*100)} %`;requestDraw();}
  function syncView(){
    const retina=state.mode==='retina',detail=state.mode!=='eye',meta=VIEWS[state.mode];document.body.classList.toggle('retina',retina);document.body.classList.toggle('detail-view',detail);
    if(ready)Object.entries(views).forEach(([key,view])=>view.visible=key===state.mode);
    document.querySelector('.viewbar .segmented').hidden=detail||!!state.focus;
    $('explode-control').hidden=detail||!!state.focus;$('back-button').hidden=!detail&&!state.focus;
    $('back-button').textContent=state.focus&&detail?'← Zur Detailansicht':viewTrail.at(-1)==='retina'?'← Zur Netzhaut':viewTrail.at(-1)==='macula'?'← Zur Sehgrube':'← Zum Auge';
    $('view-title').textContent=state.focus?allData[state.focus].name:detail?meta.title:'Wie wir sehen.';
    $('eyebrow').textContent=detail?'GENAUER HINSEHEN':state.focus?'NAHANSICHT':'ENTDECKEN & VERSTEHEN';
    $('scene-badge').textContent=detail?meta.badge:state.focus?'NAHANSICHT':'01 / DAS AUGE';
    $('scene-caption').textContent=state.focus?'Einzeln betrachten · frei drehbar':state.cut?'Ein Blick ins Innere':'Die äußere Form';
    $('list-title').textContent=retina?'Zellen & Signalweg':detail?'Im Detail':'Bestandteile';
    $('retina-directions').hidden=!retina;$('receptors-link').hidden=state.mode!=='retina'&&state.mode!=='macula';$('receptor-legend').hidden=state.mode!=='receptors'||!!state.focus;
    $('scale-note').textContent=state.mode==='accommodation'?'Die Bewegung ist vergrößert gezeigt. Abstände sind nicht maßstabsgetreu.':detail?'Farben und Größen sind vereinfacht. Es sind nur einige Zellen gezeigt.':'Farben und Größen sind vereinfacht.';
    $('thought-text').textContent=state.mode==='accommodation'?'Warum wird die Linse für nahe Dinge runder?':retina?'Welchen Weg nimmt das Signal von den Sinneszellen zum Sehnerv?':'Warum kannst du im Dunkeln kaum Farben erkennen?';
    $('detail-caption').hidden=!detail||!!state.focus;$('detail-caption').textContent=detail?meta.caption:'';
    $('accommodation-control').hidden=state.mode!=='eye'&&state.mode!=='accommodation';
    $('focus-detail').hidden=state.mode==='accommodation';
    $('gesture-hint').textContent=detail||state.focus?'Ziehen: drehen · Herauszoomen: zurück zur größeren Ansicht':'Ziehen: drehen · Scrollen / 2 Finger: zoomen';
    const lightVisible=state.mode==='eye'||state.mode==='iris';
    document.querySelector('.light-control').hidden=!lightVisible;$('light-result').hidden=!lightVisible;
    document.querySelector('.experiment-bar').hidden=!lightVisible&&state.mode!=='accommodation';
    syncVisibility();updateLabelSet();updateLight();updateFocusControls();updateZoomHint();requestDraw();
  }
  function setMode(mode,back=false){
    const previousMode=state.mode;
    if(mode==='eye')viewTrail.length=0;else if(!back&&mode!==previousMode){const ancestor=viewTrail.indexOf(mode);if(ancestor>=0)viewTrail.splice(ancestor);else viewTrail.push(previousMode);}
    if(ready&&previousMode==='eye'&&mode!=='eye')eyeReturnAngles={theta:orbit.thetaGoal,phi:orbit.phiGoal};
    if(mode!=='eye'&&mode!=='accommodation')setFocusPlayback(false);
    state.mode=mode;state.focus=null;zoomContext=null;hoverId=null;closeInfo();syncView();renderList();resetCamera(true);
    if(ready&&mode==='eye'&&previousMode!=='eye'&&eyeReturnAngles){orbit.theta=orbit.thetaGoal=eyeReturnAngles.theta;orbit.phi=orbit.phiGoal=eyeReturnAngles.phi;requestDraw();}
    $('stage').classList.remove('view-enter');void $('stage').offsetWidth;$('stage').classList.add('view-enter');
    $('intro-hint').hidden=mode!=='eye';announce(mode==='eye'?'Gesamtes Augenmodell.':`${VIEWS[mode].badge} in 3D-Vergrößerung.`);
  }
  function goUp(){if(state.focus){state.focus=null;closeInfo();syncView();resetCamera(true);}else setMode(viewTrail.pop()||'eye',true);}
  function focusPart(){
    if(!ready||!state.selected)return;
    if(DETAIL_FOR[state.selected]){setMode(DETAIL_FOR[state.selected]);return;}
    state.focus=state.selected;syncView();
    const g=groups[state.selected],box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const maxSize=Math.max(size.x,size.y,size.z,.45);
    orbit.targetGoal.copy(center);orbit.distanceGoal=fitDistance(maxSize)*1.03;
    focusStartDistance=orbit.distanceGoal;
    if(state.mode==='eye'){orbit.thetaGoal=.93;orbit.phiGoal=1.22;}else {orbit.thetaGoal=.36;orbit.phiGoal=1.27;}
    $('focus-button').textContent='Ansicht zentrieren ↗';$('info-card').hidden=true;requestDraw();
    if(window.innerWidth<821)$('stage').scrollIntoView({behavior:'instant',block:'center'});
    announce(`${allData[state.selected].name} in Nahansicht. Mit „Zum Auge“ zur Übersicht zurückkehren.`);
  }
  function setCut(value){state.cut=value;applyCut();$('cut-button').classList.toggle('active',value);$('whole-button').classList.toggle('active',!value);$('cut-button').setAttribute('aria-pressed',value);$('whole-button').setAttribute('aria-pressed',!value);syncView();}
  function resetAll(){
    viewTrail.length=0;state.mode='eye';state.focus=null;state.selected=null;state.explode=0;state.labels=true;state.light=.55;state.near=0;state.focusPlaying=false;focusPhase=0;zoomContext=null;hoverId=null;eyeReturnAngles=null;focusStartDistance=0;Object.keys(visibility).forEach(id=>visibility[id]=true);
    $('explode').value=0;$('light').value=55;$('labels-button').setAttribute('aria-pressed','true');closeInfo();setCut(true);applyExplode();syncView();renderList();resetCamera(false);announce('Startansicht wiederhergestellt. Alle Bestandteile sind eingeblendet.');
  }
  function updateLabelSet(){
    if(!ready)return;
    const container=$('labels');container.replaceChildren();Object.keys(labelNodes).forEach(k=>delete labelNodes[k]);
    // Labels are large alternate hit targets, especially for small structures.
    const ids=state.focus?(state.mode==='receptors'&&['pr-rod','pr-s','pr-m','pr-l'].includes(state.focus)?[state.focus,'pr-discs','pr-inner','pr-cilium','pr-nucleus','pr-synapse']:[state.focus]):state.mode!=='eye'?VIEWS[state.mode].ids:['cornea','iris','lens','vitreous','retina','macula','disc','nerve'];
    ids.forEach(id=>{const b=document.createElement('button');b.className='label';b.dataset.label=id;b.textContent=allData[id].short||allData[id].name;b.style.setProperty('--color',allData[id].color);b.addEventListener('click',()=>selectPart(id));container.append(b);labelNodes[id]=b;});highlight();
  }
  function visibleInHierarchy(m){let n=m;while(n){if(!n.visible)return false;n=n.parent;}return true;}
  let lastLabelLayout=0;
  function layoutLabels(){
    if(!ready)return;
    $('labels').hidden=!state.labels;$('leaders').hidden=!state.labels;if(!state.labels)return;
    const w=$('stage').clientWidth,h=$('stage').clientHeight;
    const sides=[[],[]];const projected=new THREE.Vector3();
    if(state.mode==='receptors'&&w<520&&!state.focus){
      const types=['pr-rod','pr-s','pr-m','pr-l'],paths=[];
      for(const [id,node] of Object.entries(labelNodes)){
        node.hidden=!types.includes(id)||!visibility[id];if(node.hidden)continue;
        node.textContent=({'pr-rod':'Stäbchen','pr-s':'Blau','pr-m':'Grün','pr-l':'Rot'})[id];
        anchors[id].getWorldPosition(projected);projected.y=-1.94;projected.project(camera);
        const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h,ww=node.offsetWidth||65;
        node.style.left=Math.max(5,Math.min(w-ww-5,x-ww/2))+'px';node.style.top=Math.min(h-140,y+8)+'px';
        paths.push(`<path d="M${x},${y-12} L${x},${Math.min(h-140,y+8)}"/>`);
      }
      $('leaders').innerHTML=paths.join('');return;
    }

    for(const [id,node] of Object.entries(labelNodes)){
      node.textContent=allData[id].short||allData[id].name;
      if(!visibility[id]||!visibleInHierarchy(groups[id])){node.hidden=true;continue;}
      anchors[id].getWorldPosition(projected);if(state.mode==='receptors'&&['pr-rod','pr-s','pr-m','pr-l'].includes(state.focus))projected.x=anchors[state.focus].getWorldPosition(new THREE.Vector3()).x;projected.project(camera);
      if(projected.z>1||projected.z< -1||Math.abs(projected.x)>1.4||Math.abs(projected.y)>1.4){node.hidden=true;continue;}
      node.hidden=false;const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h;
      const side=x>w*.52?1:0;sides[side].push({id,node,x,y});
    }
    while(Math.abs(sides[0].length-sides[1].length)>1){const from=sides[0].length>sides[1].length?0:1;const moved=sides[from].sort((a,b)=>Math.abs(a.x-w/2)-Math.abs(b.x-w/2)).shift();sides[1-from].push(moved);}
    const paths=[];
    sides.forEach((items,side)=>{
      items.sort((a,b)=>a.y-b.y);
      const top=state.mode==='receptors'?172:state.mode==='retina'?118:102, bottom=h-(state.mode==='eye'?135:148),spacing=38;
      // Keep annotation boxes out of the info card when it is open.
      const cardOpen=!$('info-card').hidden;
      const usableBottom=cardOpen&&side===0?Math.min(bottom,h-$('info-card').offsetHeight-73):bottom;
      const limit=Math.max(top,usableBottom-(items.length-1)*spacing);
      let previous=top-spacing;
      items.forEach((p,i)=>{
        const ideal=Math.max(top,Math.min(p.y-16,limit+i*spacing));const y=Math.max(previous+spacing,ideal);previous=y;
        if(y+33>usableBottom+spacing){p.node.hidden=true;return;}
        const width=p.node.offsetWidth||100;const x=side?w-width-17:17;
        if(cardOpen){const card=$('info-card').getBoundingClientRect(),stage=$('stage').getBoundingClientRect(),cx=card.left-stage.left,cy=card.top-stage.top;
          if(x<cx+card.width&&x+width>cx&&y<cy+card.height&&y+34>cy){p.node.hidden=true;return;}}
        p.node.style.left=x+'px';p.node.style.top=y+'px';
        const endX=side?x:x+width,endY=y+16;
        paths.push(`<path d="M${p.x.toFixed(1)},${p.y.toFixed(1)} L${(endX+(side?-10:10)).toFixed(1)},${endY.toFixed(1)} L${endX},${endY.toFixed(1)}"/><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.1"/>`);
      });
    });
    $('leaders').innerHTML=paths.join('');
  }
  function fitDistance(diameter){const v=THREE.MathUtils.degToRad(camera.fov),h=2*Math.atan(Math.tan(v/2)*camera.aspect);return diameter/(2*Math.tan(Math.min(v,h)/2))*1.24;}
  function resetCamera(immediate=false){
    if(!ready)return;
    const meta=VIEWS[state.mode];
    orbit.targetGoal.set(...(meta?meta.center:[-.42,0,0]));
    orbit.thetaGoal=meta?meta.theta:.78;orbit.phiGoal=meta?meta.phi:1.06;
    orbit.distanceGoal=fitDistance(meta?meta.size:6.4+state.explode*3.2);
    if(immediate){orbit.target.copy(orbit.targetGoal);orbit.theta=orbit.thetaGoal;orbit.phi=orbit.phiGoal;orbit.distance=orbit.distanceGoal;}
    requestDraw();
  }
  function updateCamera(){
    const a=reduceMotion?1:.18;
    orbit.theta+=(orbit.thetaGoal-orbit.theta)*a;orbit.phi+=(orbit.phiGoal-orbit.phi)*a;orbit.distance+=(orbit.distanceGoal-orbit.distance)*a;orbit.target.lerp(orbit.targetGoal,a);
    camera.position.set(orbit.distance*Math.sin(orbit.phi)*Math.sin(orbit.theta),orbit.distance*Math.cos(orbit.phi),orbit.distance*Math.sin(orbit.phi)*Math.cos(orbit.theta)).add(orbit.target);
    camera.lookAt(orbit.target);camera.updateMatrixWorld();
    return Math.abs(orbit.thetaGoal-orbit.theta)+Math.abs(orbit.phiGoal-orbit.phi)+Math.abs(orbit.distanceGoal-orbit.distance)+orbit.target.distanceTo(orbit.targetGoal)>.0003;
  }
  function requestDraw(){if(ready&&!bridge.paused&&!frame)frame=requestAnimationFrame(draw);}
  function draw(time){frame=0;if(!ready||bridge.paused)return;const dt=Math.min(time-lastDrawTime||16,50);advanceFocus(dt);const anatomy=animateAnatomy(dt);lastDrawTime=time;const more=updateCamera();renderer.render(scene,camera);layoutLabels();if(more||anatomy||state.focusPlaying)requestDraw();}
  function updateZoomHint(){
    const id=zoomContext||state.selected;
    $('zoom-hint').hidden=!DETAIL_FOR[id]||DETAIL_FOR[id]===state.mode||!!state.focus;
    if(!$('zoom-hint').hidden)$('zoom-hint').textContent=`Weiter heranzoomen → ${id==='retina'?'Stäbchen & Zapfen':allData[id].short||allData[id].name} entdecken`;
  }
  function zoom(multiplier,candidate=null){
    if(!ready||!bridge.allowed())return;
    const nextDistance=orbit.distanceGoal*multiplier;
    if(multiplier>1&&state.mode==='eye'&&!state.focus&&nextDistance>fitDistance(6.4+state.explode*3.2)*1.32&&bridge.leave())return;
    // Separate entry/exit thresholds prevent accidental bouncing between levels.
    if(multiplier>1&&state.focus&&nextDistance>focusStartDistance*1.48){
      state.focus=null;closeInfo();syncView();resetCamera(true);bridge.barrier();announce('Zurück zur größeren Ansicht.');return;
    }
    if(multiplier>1&&state.mode!=='eye'&&!state.focus&&nextDistance>fitDistance(VIEWS[state.mode].size)*1.48){
      goUp();bridge.barrier();announce('Zurück zur übergeordneten Ansicht.');return;
    }
    if(multiplier<1&&!state.focus){
      const id=zoomContext||candidate||state.selected||hoverId;
      if(DETAIL_FOR[id]&&DETAIL_FOR[id]!==state.mode&&visibility[id]){
        if(!zoomContext){zoomContext=id;zoomStartDistance=orbit.distanceGoal;anchors[id].getWorldPosition(orbit.targetGoal);$('info-card').hidden=true;updateZoomHint();}
        if(orbit.distanceGoal*multiplier<zoomStartDistance*.48){setMode(DETAIL_FOR[id]);bridge.barrier();return;}
      }
    }else if(multiplier>1&&zoomContext){zoomContext=null;updateZoomHint();}
    orbit.distanceGoal=THREE.MathUtils.clamp(orbit.distanceGoal*multiplier,.55,70);requestDraw();
  }
  function resize(){if(!ready||!$('stage').clientWidth||!$('stage').clientHeight)return;const oldFit=fitDistance(1),w=$('stage').clientWidth,h=$('stage').clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const ratio=fitDistance(1)/oldFit;orbit.distance*=ratio;orbit.distanceGoal*=ratio;if(zoomContext)zoomStartDistance*=ratio;if(state.focus)focusStartDistance*=ratio;requestDraw();}
  function setupInput(){
    const canvas=$('canvas'),pointers=new Map();let drag=null,pinchDistance=0;
    clearEmbeddedPointers=()=>{for(const id of pointers.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);pointers.clear();drag=null;pinchDistance=0;};
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
    function hit(event,tolerant=false){
      const rect=canvas.getBoundingClientRect(),radius=event.pointerType==='touch'?9:5;
      const offsets=tolerant?[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]]:[[0,0]];
      const liveMeshes=meshes.filter(visibleInHierarchy);
      for(const [dx,dy] of offsets){
        pointer.set((event.clientX+dx-rect.left)/rect.width*2-1,-(event.clientY+dy-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
        const hits=raycaster.intersectObjects(liveMeshes,false);
        // Transparent cornea and vitreous should not steal taps from visible structures.
        const id=(hits.find(h=>!h.object.userData.transparentCover)||hits[0])?.object.userData.id;
        if(id)return id;
      }return null;
    }
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0&&e.pointerType==='mouse')return;
      canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1)drag={x:e.clientX,y:e.clientY,moved:false,multi:false};
      else{drag.multi=true;const p=[...pointers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);hoverId=hit({clientX:(p[0].x+p[1].x)/2,clientY:(p[0].y+p[1].y)/2,pointerType:'touch'},true);}
      $('hover-tip').hidden=true;
    });
    canvas.addEventListener('pointermove',e=>{
      if(pointers.has(e.pointerId)){
        const prev=pointers.get(e.pointerId);const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(pointers.size>1){const p=[...pointers.values()];const distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinchDistance>0&&distance>0)zoom(pinchDistance/distance);pinchDistance=distance;drag.multi=true;}
        else if(drag){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;if(drag.moved){zoomContext=null;updateZoomHint();orbit.thetaGoal-=dx*.008;orbit.phiGoal=THREE.MathUtils.clamp(orbit.phiGoal-dy*.008,.12,Math.PI-.12);requestDraw();}}
      }else if(e.pointerType==='mouse'){
        const id=hit(e);hoverId=id;canvas.style.cursor=id?'pointer':'grab';
        const tip=$('hover-tip');tip.hidden=!id;
        if(id){tip.textContent=allData[id].name;const rect=canvas.getBoundingClientRect();tip.style.left=Math.min(e.clientX-rect.left+13,rect.width-180)+'px';tip.style.top=Math.max(90,e.clientY-rect.top-35)+'px';}
      }
    });
    function endPointer(e,cancelled=false){
      if(!pointers.has(e.pointerId))return;
      if(!cancelled&&pointers.size===1&&drag&&!drag.moved&&!drag.multi){const id=hit(e,true);if(id)selectPart(id);else closeInfo();}
      pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
      if(!pointers.size){drag=null;pinchDistance=0;}
    }
    canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));canvas.addEventListener('lostpointercapture',e=>{pointers.delete(e.pointerId);if(!pointers.size)drag=null;});
    canvas.addEventListener('pointerleave',()=>{$('hover-tip').hidden=true;if(!pointers.size)hoverId=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY,-100,100)*.0025),hit(e));},{passive:false});
    canvas.addEventListener('keydown',e=>{
      const step=.13;let handled=true;
      if(e.key==='ArrowLeft')orbit.thetaGoal-=step;else if(e.key==='ArrowRight')orbit.thetaGoal+=step;
      else if(e.key==='ArrowUp')orbit.phiGoal=Math.max(.12,orbit.phiGoal-step);else if(e.key==='ArrowDown')orbit.phiGoal=Math.min(Math.PI-.12,orbit.phiGoal+step);
      else if(e.key==='+'||e.key==='=')zoom(.84);else if(e.key==='-')zoom(1.19);else handled=false;
      if(handled){e.preventDefault();requestDraw();}
    });
  }
  function init3D(){
    renderer=new THREE.WebGLRenderer({canvas:$('canvas'),antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.025,150);
    scene.add(new THREE.HemisphereLight('#def3ff','#334557',2.1));
    const key=new THREE.DirectionalLight('#fff7e4',3.1);key.position.set(3,6,6);scene.add(key);
    const fill=new THREE.DirectionalLight('#87c9ef',1.3);fill.position.set(-5,1,-4);scene.add(fill);
    const rim=new THREE.DirectionalLight('#dbfaff',1.6);rim.position.set(1,-2,-5);scene.add(rim);
    orbit={theta:.78,thetaGoal:.78,phi:1.06,phiGoal:1.06,distance:12,distanceGoal:12,target:new THREE.Vector3(),targetGoal:new THREE.Vector3()};
    buildEye();buildMicro();buildDetails();ready=true;resize();resetCamera(true);updateLabelSet();setupInput();updateLight();requestDraw();
    new ResizeObserver(resize).observe($('stage'));
    $('canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;$('fatal-error').hidden=false;});
    $('canvas').addEventListener('webglcontextrestored',()=>location.reload());
  }
  $('receptors-link').addEventListener('click',()=>{setMode('receptors');if(window.innerWidth<821)$('stage').scrollIntoView({behavior:'instant',block:'center'});});
  $('reset').addEventListener('click',resetAll);$('brand-reset').addEventListener('click',e=>{e.preventDefault();resetAll();});
  $('cut-button').addEventListener('click',()=>setCut(true));$('whole-button').addEventListener('click',()=>setCut(false));
  $('explode').addEventListener('input',e=>{state.explode=Number(e.target.value)/100;applyExplode();if(ready){orbit.distanceGoal=fitDistance(6.4+state.explode*3.2);requestDraw();}});
  $('zoom-in').addEventListener('click',()=>zoom(.80));$('zoom-out').addEventListener('click',()=>zoom(1.25));
  $('labels-button').addEventListener('click',()=>{state.labels=!state.labels;$('labels-button').setAttribute('aria-pressed',state.labels);requestDraw();});
  $('close-info').addEventListener('click',closeInfo);$('hide-selected').addEventListener('click',()=>state.selected&&togglePart(state.selected));
  $('focus-button').addEventListener('click',focusPart);$('detail-button').addEventListener('click',()=>setMode('retina'));
  $('retina-link').addEventListener('click',()=>{setMode('retina');if(window.innerWidth<821)$('stage').scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'center'});});
  $('back-button').addEventListener('click',goUp);
  $('show-all').addEventListener('click',()=>{const wasFocused=!!state.focus;activeData().forEach(d=>visibility[d.id]=true);state.focus=null;syncView();syncVisibility();updateList();if(wasFocused)resetCamera(false);requestDraw();announce('Alle Bestandteile eingeblendet.');});
  $('light').addEventListener('input',e=>{state.light=Number(e.target.value)/100;updateLight();});
  $('near-button').addEventListener('click',()=>setNear(1));$('far-button').addEventListener('click',()=>setNear(0));
  $('focus-distance').addEventListener('input',e=>setNear(1-Number(e.target.value)/100));
  // Stop playback before a drag or keyboard gesture, so it cannot fight the user.
  $('focus-distance').addEventListener('pointerdown',()=>setFocusPlayback(false));
  $('focus-distance').addEventListener('keydown',()=>setFocusPlayback(false));
  $('focus-play').addEventListener('click',()=>setFocusPlayback(!state.focusPlaying));
  $('focus-detail').addEventListener('click',()=>{setMode('accommodation');if(window.innerWidth<821)$('accommodation-control').scrollIntoView({behavior:'instant',block:'start'});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setFocusPlayback(false);});
  $('help-button').addEventListener('click',()=>$('help-dialog').showModal());$('sources-button').addEventListener('click',()=>$('sources-dialog').showModal());
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeInfo();});
  updateFocusControls();renderList();
  try{init3D();}catch(error){console.error(error);$('fatal-error').hidden=false;$('detail-button').disabled=true;$('retina-link').disabled=true;}
  bridge.ready({activate(){resize();setMode('eye');window.scrollTo(0,0);lastDrawTime=0;requestDraw();},pause(){setFocusPlayback(false);clearEmbeddedPointers();if(frame)cancelAnimationFrame(frame);frame=0;}});
  // Read-only diagnostics for checking local rendering and interaction quality.
  window.Augenblick={get state(){return {...state,visibility:{...visibility}};},get ready(){return ready;},get renderer(){return renderer;},get camera(){return camera;},get groups(){return groups;},get anchors(){return anchors;}};
})();
