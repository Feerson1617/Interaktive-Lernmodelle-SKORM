const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');const root=path.resolve(__dirname,'../eye');let checks=0;const check=(v,m)=>{assert(v,m);checks++};const all=[];
class El{constructor(id=''){this.id=id;this.children=[];this.dataset={};this.className='';this.hidden=false;this.style={setProperty(){}};this.classList={toggle(){},add(){},remove(){}};this.offsetHeight=190;this.offsetWidth=130;this.clientHeight=650;this.clientWidth=1000;all.push(this);}addEventListener(){}append(...v){this.children.push(...v)}replaceChildren(...v){this.children=v;}setAttribute(){}getAttribute(){return ''}querySelector(s){return this.children.find(n=>'.'+n.className===s)||new El()}getBoundingClientRect(){return {left:0,top:0,width:1000,height:650}}scrollIntoView(){}}
const ids=new Map(),el=id=>{if(!ids.has(id))ids.set(id,new El(id));return ids.get(id)},document={getElementById:el,querySelector:s=>el(s),querySelectorAll:s=>s==='.part-row'?all.filter(e=>e.className==='part-row'):[],createElement:()=>new El(),body:new El(),addEventListener(){}};
const c=vm.createContext({console,document,requestAnimationFrame:()=>1,performance:{now:()=>10000},matchMedia:()=>({matches:false})});c.window=c;c.innerWidth=1280;c.SenseBridge={paused:false,allowed:()=>true,barrier(){},leave:()=>false};vm.runInContext(fs.readFileSync(path.join(root,'three.min.js'),'utf8'),c);
let app=fs.readFileSync(path.join(root,'app.js'),'utf8');app=app.slice(0,app.indexOf("  $('receptors-link').addEventListener"))+`window.test={setNear,setFocusPlayback,advanceFocus,animateAnatomy,syncView,resetAll,acSystems,pupilMeshes,updateLight,state,views,groups,meshes,anchors,allData,VIEWS,viewTrail,visibility,setMode,goUp,zoom,selectPart,focusPart,syncVisibility,updateCamera,visibleInHierarchy,get orbit(){return orbit},get camera(){return camera},init(){scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1000/650,.025,150);orbit={theta:.78,thetaGoal:.78,phi:1.06,phiGoal:1.06,distance:12,distanceGoal:12,target:new THREE.Vector3(),targetGoal:new THREE.Vector3()};buildEye();buildMicro();buildDetails();ready=true;setMode('eye');updateCamera();}};})();`;
vm.runInContext(app,c);const t=c.test;t.init();
for(const [view,meta] of Object.entries(t.VIEWS)){t.setMode('eye');t.setMode(view);for(const id of meta.ids){check(t.groups[id],view+' mesh group '+id);check(t.anchors[id],view+' label anchor '+id);check(t.allData[id]?.text,view+' text '+id);t.selectPart(id);check(el('info-title').textContent===t.allData[id].name,'popup '+id);}}
for(const m of t.meshes){check(m.geometry.attributes.position.array.every(Number.isFinite),'finite geometry');check(t.allData[m.userData.id],'semantic mesh');}
for(const id of ['cone-s','cone-m','cone-l'])check(t.groups[id].children.some(o=>o.isMesh),'distinct rendered cone '+id);
t.setMode('eye');t.setMode('retina');t.setMode('receptors');check(t.viewTrail.join(',')==='eye,retina','receptor hierarchy');t.goUp();check(t.state.mode==='retina','first return to retina');t.goUp();check(t.state.mode==='eye','second return to eye');
t.setMode('retina');t.setMode('receptors');t.setMode('retina');check(t.viewTrail.join(',')==='eye','ancestor shortcut does not make a cycle');t.goUp();check(t.state.mode==='eye','shortcut still returns to eye');
t.setMode('retina');t.state.selected=null;for(let i=0;i<4;i++)t.zoom(.8,'cone-s');check(t.state.mode==='receptors','zoom aimed at cone enters fine view without selection');for(let i=0;i<3;i++)t.zoom(1.25);check(t.state.mode==='retina','zoom out from receptors returns to retina');
t.setMode('receptors');t.selectPart('pr-s');t.focusPart();for(const m of t.meshes.filter(m=>m.userData.receptorType)){check(m.visible===(m.userData.receptorType==='pr-s'),'isolated S cell retains its own entire fine structure');}check(t.groups['pr-inner'].visible,'inner segment remains in whole cell focus');t.goUp();check(t.state.mode==='receptors'&&!t.state.focus,'isolated cell returns to comparison');check(t.meshes.filter(m=>m.userData.receptorType).every(m=>m.visible),'comparison restores all cells');
for(const type of ['pr-rod','pr-s','pr-m','pr-l'])check(t.meshes.some(m=>m.userData.id==='pr-discs'&&m.userData.receptorType===type&&m.count===24),'membrane stack '+type);
// Continuous distance changes must survive navigation and deform both views alike.
t.setMode('eye');
const widths=[],rings=[],fibres=[];
for(const near of [0,.25,.5,.75,1]){
  t.setNear(near);t.animateAnatomy(10000);
  const a=t.acSystems[0],b=t.acSystems[1];
  widths.push(a.lens.scale.x);rings.push(a.ciliary.scale.y);
  fibres.push(Array.from(a.fibers.children.find(m=>m.isMesh).geometry.attributes.position.array));
  check(Math.abs(a.lens.scale.x-b.lens.scale.x)<1e-8,'overview and detail lens agree');
  check(Math.abs(a.ciliary.scale.y-b.ciliary.scale.y)<1e-8,'overview and detail muscle agree');
  check(el('focus-distance').value===String((1-near)*100),'distance range direction');
  for(const system of t.acSystems)system.fibers.traverse(m=>{if(m.isMesh)check(m.geometry.attributes.position.array.every(Number.isFinite),'valid moving fibres');});
  t.syncView();check(Math.abs(t.state.near-near)<1e-12,'view refresh preserves intermediate distance');
}
check(widths.every((v,i)=>!i||v>widths[i-1]),'lens rounds continuously toward near');
check(rings.every((v,i)=>!i||v<rings[i-1]),'ring contracts continuously toward near');
check(fibres[0].some((v,i)=>Math.abs(v-fibres[4][i])>.02),'fibres visibly loosen');
t.setNear(.37);t.setMode('accommodation');check(t.state.near===.37,'distance preserved entering detail');t.goUp();check(t.state.near===.37,'distance preserved returning');
const pupil=t.pupilMeshes[0].scale.x,light=t.state.light;
t.setNear(0);t.animateAnatomy(10000);
check(Math.abs(t.acSystems[0].lens.scale.x-widths[0])<1e-8,'far shape returns without drift');
check(t.state.light===light&&t.pupilMeshes[0].scale.x===pupil,'distance does not change independent light experiment');
t.setFocusPlayback(true);t.advanceFocus(1000);check(t.state.near>0&&t.state.near<1,'playback advances continuously');
t.setNear(.6);check(!t.state.focusPlaying,'manual input stops playback');
const chosen=t.state.near;t.advanceFocus(1000);check(t.state.near===chosen,'paused distance remains chosen');
t.setFocusPlayback(true);t.setMode('retina');check(!t.state.focusPlaying,'leaving relevant view stops animation');
t.setMode('eye');t.setFocusPlayback(true);t.resetAll();check(!t.state.focusPlaying&&t.state.near===0&&el('focus-distance').value==='100','reset stops animation and restores far');
t.setNear(2);check(t.state.near===1,'clamp upper bound');t.setNear(-2);check(t.state.near===0,'clamp lower bound');t.setNear(NaN);check(t.state.near===0,'ignore invalid input');
console.log(JSON.stringify({checks,views:Object.keys(t.VIEWS),result:'PASS'},null,2));
