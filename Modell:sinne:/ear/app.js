/* Ohrblick – Maus, Touch, Ebenennavigation und Schallsimulation. */
(function(){'use strict';
  const bridge=window.SenseBridge;
  const T=window.THREE, $=id=>document.getElementById(id), content=window.EarContent;
  const builders=window.EarBuilders, fineBuilders=window.EarFineBuilders;
  const detailMap={auricle:{builder:'outer'},canal:{builder:'outer'},eardrum:{builder:'middle'},malleus:{builder:'middle'},incus:{builder:'middle'},stapes:{builder:'middle'},oval:{builder:'middle'},round:{builder:'middle'},cochlea:{builder:'cochlea'},nerve:{builder:'nerve'},balance:{builder:'balance'},tube:{builder:'pressure'}};
  const fineRoute={corti:'hair',basilar:'hair',scala_media:'hair',malleus:'ossicles',incus:'ossicles',stapes:'ossicles'};
  const autoZoomBlocked=new Set(['air','cavity']);
  const fineInfo={};
  const state = {
    cellType: 'ear', level: 'cell', detail: null, fine: null, selected: null,
    autoZoom: true, cut: true, labels: true, hidden: new Set(), root: null, view: null,
    cameraDistance: 12, targetDistance: 12, fitDistance: 12, focus: new T.Vector3(), targetFocus: new T.Vector3(),
    history: [], zoomContext: null, zoomProgress: 0, lastZoomAt: 0, lastZoomPoint: null,
    zoomLock: 0, transitionUntil: 0, motion: false, motionTime: 0,
    soundOn: false, amplitude: .65, pitch: .54, phase: 0, elapsed: 0, soundDirty: true,
    pointers: new Map(), down: null, pinch: null
  };
  let scene, camera, renderer, raycaster;
  const pointer = new T.Vector2();
  const labelNodes = new Map();
  const svgNS = 'http://www.w3.org/2000/svg';
  const fineNames = {hair:'Haarzellen · wie Hören beginnt',ossicles:'Drei winzige Knochen im Detail.'};

  function partInfo(id) {
    if (!id) return { name: 'Struktur', text: '', color: '#9fb8df' };
    if (content.parts[id]) return content.parts[id];
    const f = fineInfo[id];
    return f ? { id, name: f[0], text: f[1], note: f[2], color: '#9fb8df' } : { id, name: id.replace(/_/g, ' '), text: 'Ein Bestandteil in Nahansicht.', color: '#9fb8df' };
  }
  function cellName() { return 'Das Ohr'; }
  function currentIds() {
    // The model is the source of truth: no orphan list entries, no unlisted meshes.
    return state.view ? Object.keys(state.view.kit.groups).filter(id => state.view.kit.meshes.some(m => m.userData.part === id)) : [];
  }
  function nextRoute(id) {
    if (state.level === 'cell' && detailMap[id] && builders[detailMap[id].builder]) return detailMap[id].builder;
    if (state.level === 'detail' && fineRoute[id] && fineBuilders[fineRoute[id]]) return fineRoute[id];
    return null;
  }
  function canAutoEnter(id) {
    return !!id && !state.hidden.has(id) && !!nextRoute(id) && !(state.level === 'cell' && autoZoomBlocked.has(id));
  }
  function disposeView() {
    if (!state.root) return;
    scene.remove(state.root);
    const geometries = new Set(), materials = new Set();
    state.root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  }
  function fitDistance() {
    const s = state.view.boundsSize;
    const tangent = Math.tan(T.MathUtils.degToRad(camera.fov * .5));
    // Space for the two label rails without cutting off long flagella on phones.
    return Math.max(s.y / (2 * tangent), s.x / (2 * tangent * camera.aspect)) * (camera.aspect < .9 ? 1.32 : 1.22) + s.z * .5;
  }
  function resetZoomGesture() { state.zoomContext = null; state.zoomProgress = 0; state.lastZoomPoint = null; }
  function makeView(saved) {
    disposeView();
    let built;
    if (state.level === 'cell') built = EarModels.buildOverview(state.cellType);
    else {
      const root = new T.Group(), kit = EarModels.kit(state.cellType, root);
      const builder = state.level === 'detail' ? builders[detailMap[state.detail].builder] : fineBuilders[state.fine];
      const meta = builder(kit) || {};
      built = { root, kit, ...meta };
    }
    // Provide a correctly attached label even for a builder with no explicit anchor.
    Object.keys(built.kit.groups).forEach(id => {
      if (built.kit.anchors[id]) return;
      const box = new T.Box3().setFromObject(built.kit.groups[id]);
      if (!box.isEmpty()) built.kit.anchor(id, box.getCenter(new T.Vector3()).toArray());
    });
    built.animate?.({...state,soundOn:false});
    built.root.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(built.root);
    built.boundsSize = bounds.getSize(new T.Vector3());
    built.centerVector = bounds.getCenter(new T.Vector3());
    built.root.position.sub(built.centerVector);
    state.root = built.root; state.view = built; scene.add(built.root);
    state.hidden = new Set(saved?.hidden || []);
    state.cut = saved ? saved.cut : true;
    state.soundDirty = true;
    if (saved) state.root.rotation.fromArray(saved.rotation);
    else state.root.rotation.set(state.level==='detail'&&state.detail==='cochlea'?.28:.09,-.10,0);
    state.fitDistance = fitDistance();
    state.targetDistance = state.cameraDistance = state.fitDistance * (saved?.zoomRatio || 1);
    state.focus.set(0, 0, 0); if (saved?.focus) state.focus.fromArray(saved.focus);
    state.targetFocus.copy(state.focus);
    state.selected = saved?.selected || null;
    state.zoomLock = 0; resetZoomGesture();
    hideInfo(); applyCut(); updateCamera(); renderList(); renderLabels(); updateUI();
    if (saved?.infoOpen && state.selected) showInfo(state.selected);
  }
  function captureView() {
    return { level: state.level, detail: state.detail, fine: state.fine, selected: state.selected,
      rotation: state.root.rotation.toArray(), hidden: [...state.hidden], cut: state.cut,
      zoomRatio: Math.max(.65, Math.min(1.05, state.targetDistance / state.fitDistance)),
      focus: state.targetFocus.toArray(), infoOpen: !$('info').hidden };
  }
  function enterNext(id = state.selected) {
    if (!id || !nextRoute(id)) return false;
    state.history.push(captureView());
    if (state.level === 'cell') { state.detail = id; state.level = 'detail'; }
    else { state.fine = fineRoute[id]; state.level = 'fine'; }
    makeView(); return true;
  }
  function goBack() {
    const saved = state.history.pop();
    if (!saved) return false;
    state.level = saved.level; state.detail = saved.detail; state.fine = saved.fine;
    makeView(saved); return true;
  }
  function applyCut() {
    if (!state.view) return;
    state.root.updateMatrixWorld(true);
    const direction = camera ? camera.getWorldDirection(new T.Vector3()) : new T.Vector3(0, 0, -1);
    (state.view.kit.shells || []).forEach(mesh => {
      // Cut each shell through its own centre, preserving its back half.
      if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
      const center = mesh.geometry.boundingSphere.center.clone().applyMatrix4(mesh.matrixWorld);
      const plane = new T.Plane().setFromNormalAndCoplanarPoint(direction, center);
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(m => { const was = !!m.clippingPlanes?.length; m.clippingPlanes = state.cut ? [plane] : []; m.side = T.DoubleSide; if (was !== state.cut) m.needsUpdate = true; });
    });
    updateVisibility(false);
  }
  function updateVisibility(reset = true) {
    if (!state.view) return;
    Object.entries(state.view.kit.groups).forEach(([id,g]) => { g.visible = !state.hidden.has(id); });
    if (reset) resetZoomGesture();
  }
  function updateCamera() {
    camera.position.copy(state.focus).add(new T.Vector3(0, 0, state.cameraDistance));
    camera.lookAt(state.focus); camera.updateMatrixWorld(true); state.root?.updateMatrixWorld(true);
  }
  function visibleMesh(mesh) {
    for (let o = mesh; o; o = o.parent) if (!o.visible) return false;
    return mesh.material?.visible !== false;
  }
  function hitPart(x, y, mode = 'select') {
    if (!state.view) return null;
    const rect = $('model').getBoundingClientRect();
    if (x < rect.left || y < rect.top || x > rect.right || y > rect.bottom) return null;
    updateCamera();
    pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(state.view.kit.meshes, true);
    const eligible = hits.filter(hit => {
      const mesh = hit.object, id = mesh.userData.part;
      if (!id || !visibleMesh(mesh) || mesh.isLine || mesh.userData.pickThrough || state.hidden.has(id)) return false;
      if (state.level === 'cell' && autoZoomBlocked.has(id)) return false;
      const material = Array.isArray(mesh.material) ? mesh.material[hit.face?.materialIndex || 0] : mesh.material;
      if (material?.clippingPlanes?.some(p => p.distanceToPoint(hit.point) < 0)) return false;
      return true;
    });
    // Thin translucent envelopes never steal the click from an opaque visible part.
    const hit = eligible.find(h => !h.object.material.transparent || h.object.material.opacity >= .45) || eligible[0];
    if (!hit || (mode === 'zoom' && !canAutoEnter(hit.object.userData.part))) return null;
    return { id: hit.object.userData.part, point: hit.point.clone() };
  }
  function labelTarget(id) {
    if (!id || state.hidden.has(id) || !state.view.kit.anchors[id]) return null;
    return { id, point: state.view.kit.anchors[id].getWorldPosition(new T.Vector3()) };
  }
  function centralTarget() {
    if (canAutoEnter(state.selected)) return labelTarget(state.selected);
    const r = $('model').getBoundingClientRect(); return hitPart(r.left + r.width/2, r.top + r.height/2, 'zoom');
  }
  function zoomBy(factor, target, at) {
    if(!bridge.allowed())return;
    if (!state.view || !Number.isFinite(factor) || factor <= 0 || factor === 1) return;
    const now = performance.now(), direction = factor < 1 ? -1 : 1;
    const gap = now - state.lastZoomAt;
    const fresh = gap > 900 && !state.pinch;
    if (gap > 260 && !state.pinch) state.zoomLock = 0;
    const moved = at && state.lastZoomPoint && Math.hypot(at.x - state.lastZoomPoint.x, at.y - state.lastZoomPoint.y) > 30;
    if (moved || (fresh && target?.id !== state.zoomContext?.id)) resetZoomGesture();
    if (fresh || moved) state.zoomLock = 0;
    if (state.zoomLock && direction !== state.zoomLock && now >= state.transitionUntil) state.zoomLock = 0;
    state.lastZoomAt = now;
    if (at && !state.lastZoomPoint) state.lastZoomPoint = { ...at };
    if (now < state.transitionUntil || state.zoomLock === direction) return;
    const rawDistance = state.targetDistance * factor;
    if(state.autoZoom&&direction>0&&!state.history.length&&rawDistance>state.fitDistance*1.32&&bridge.leave())return;
    const min = state.fitDistance * .24, max = state.fitDistance * 2.3;
    if (state.autoZoom && direction > 0 && state.history.length && rawDistance > state.fitDistance * 1.30) {
      goBack(); state.zoomLock = direction; state.transitionUntil = now + 350;
      toast('Eine Ebene zurück'); return;
    }
    if (direction < 0 && state.autoZoom) {
      if (!state.zoomContext && canAutoEnter(target?.id)) {
        state.zoomContext = target;
        state.zoomProgress = 0;
        toast('Hineinzoomen → ' + partInfo(target.id).name);
      }
      if (state.zoomContext && canAutoEnter(state.zoomContext.id)) {
        state.zoomProgress += -Math.log(factor);
        if (state.zoomProgress >= .62) {
          const id = state.zoomContext.id;
          enterNext(id); state.zoomLock = direction; state.transitionUntil = now + 350;
          toast('Detailansicht · ' + partInfo(id).name); return;
        }
      }
    } else if (direction > 0 || !state.autoZoom) resetZoomGesture();
    state.targetDistance = Math.max(min, Math.min(max, rawDistance));
    // Follow the pointed-at position so off-centre organelles remain in view.
    if (direction < 0 && target?.point) {
      const t = target.point.clone(); t.z = 0;
      state.targetFocus.lerp(t, Math.min(.3, 1-factor));
    } else if (direction > 0) state.targetFocus.multiplyScalar(Math.max(0, 1-(factor-1)*1.7));
  }
  function toast(message) {
    const el = $('zoom-hint'); el.textContent = message; el.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 2300);
  }
  function setSelected(id) {
    if (!currentIds().includes(id)) return;
    state.selected = id; resetZoomGesture(); showInfo(id); updateSelection(); updateUI();
  }
  function updateSelection() {
    document.querySelectorAll('[data-part]').forEach(n => {
      const active = n.dataset.part === state.selected;
      n.classList.toggle('selected', active);
      if (n.classList.contains('model-label') || n.classList.contains('part-select')) n.setAttribute('aria-pressed', String(active));
    });
    state.view?.kit.meshes.forEach(m => {
      if (!m.material?.emissive) return;
      if (m.userData.baseEmissive === undefined) m.userData.baseEmissive = m.material.emissive.getHex();
      m.material.emissive.setHex(m.userData.part === state.selected ? 0x16273b : m.userData.baseEmissive);
    });
  }
  function showInfo(id) {
    const p = partInfo(id);
    $('info-kicker').textContent = state.level === 'cell' ? cellName().toUpperCase() : state.level === 'fine' ? (state.fine === 'ossicles' ? 'GEHÖRKNÖCHELCHEN IM DETAIL' : 'HAARZELLEN IM DETAIL') : 'IM DETAIL · ' + partInfo(state.detail).name.toUpperCase();
    $('info-title').textContent = p.name; $('info-text').textContent = p.text;
    $('info-note').textContent = p.note || ''; $('info').style.setProperty('--part-color', p.color || '#91b0eb');
    $('enter-detail').hidden = !nextRoute(id);
    $('enter-detail').textContent = 'Genauer ansehen ↗';
    $('info').hidden = false;
  }
  function hideInfo() { $('info').hidden = true; }
  function togglePart(id) {
    if (state.hidden.has(id)) state.hidden.delete(id); else state.hidden.add(id);
    if (state.hidden.has(state.selected)) { state.selected = null; hideInfo(); }
    updateVisibility(); renderList(); renderLabels(); updateSelection();
  }
  function renderList() {
    const list = $('part-list'), scroll = list.scrollTop; list.replaceChildren();
    const ids = currentIds(); $('part-count').textContent = ids.length + ' Teile';
    $('list-heading').textContent = state.level === 'cell' ? 'Bestandteile' : 'Im Detail';
    $('list-kicker').textContent = state.level === 'cell' ? 'AUF EINEN BLICK' : 'NOCH GENAUER';
    ids.forEach(id => {
      const p = partInfo(id), row = document.createElement('div'); row.className = 'part-row' + (state.hidden.has(id) ? ' off' : ''); row.dataset.part = id;
      const select = document.createElement('button'); select.className = 'part-select'; select.type = 'button'; select.dataset.part = id;
      const swatch = document.createElement('span'); swatch.className = 'swatch'; swatch.style.background = p.color || '#9fb8df';
      const name = document.createElement('span'); name.textContent = p.name; select.append(swatch,name);
      select.addEventListener('click', () => setSelected(id));
      const eye = document.createElement('button'); eye.className = 'eye-button'; eye.type = 'button'; eye.setAttribute('aria-label', (state.hidden.has(id) ? 'Einblenden: ' : 'Ausblenden: ') + p.name); eye.setAttribute('aria-pressed', String(!state.hidden.has(id)));
      eye.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
      eye.addEventListener('click', () => togglePart(id)); row.append(select,eye); list.append(row);
    });
    list.scrollTop = scroll; updateSelection();
  }
  function renderLabels() {
    labelNodes.clear(); $('labels').replaceChildren(); $('leaders').replaceChildren();
    if (!state.labels || !state.view) return;
    const visibleIds = currentIds().filter(id => !state.hidden.has(id));
    $('stage').style.minHeight = Math.max(425, Math.ceil(visibleIds.length / 2) * 40 + 145) + 'px';
    visibleIds.forEach(id => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'model-label'; b.dataset.part = id;
      b.textContent = partInfo(id).name; b.style.setProperty('--part-color', partInfo(id).color || '#9fb8df');
      // Pointer taps are resolved once at pointerup. Keyboard activation has no pointer gesture.
      b.addEventListener('click', e => { e.stopPropagation(); if (e.detail === 0) setSelected(id); });
      const line = document.createElementNS(svgNS,'path'); const dot = document.createElementNS(svgNS,'circle'); dot.setAttribute('r','2.5');
      $('leaders').append(line,dot); $('labels').append(b); labelNodes.set(id,{b,line,dot});
    });
    updateSelection(); positionLabels();
  }
  function positionLabels() {
    if (!state.view || !camera || !state.labels) return;
    const rect = $('model').getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const rails = [[],[]], top = 76, bottom = rect.height - 80;
    labelNodes.forEach((entry,id) => {
      const a = state.view.kit.anchors[id];
      const v = a?.getWorldPosition(new T.Vector3()).project(camera);
      const shown = v && v.z >= -1 && v.z <= 1 && Math.abs(v.x) < 1.5 && Math.abs(v.y) < 1.5;
      entry.b.hidden = !shown; entry.line.style.display = entry.dot.style.display = shown ? '' : 'none'; if (!shown) return;
      entry.w = entry.b.offsetWidth; entry.h = entry.b.offsetHeight;
      entry.x = (v.x*.5+.5)*rect.width; entry.y = (-v.y*.5+.5)*rect.height;
      if(entry.side===undefined){entry.side=entry.x<rect.width/2?0:1;entry.preferredY=entry.y/rect.height;}
      rails[entry.side].push(entry);
    });
    // Balance labels across rails, preserving the spatial order and drawing leaders.
    while (Math.abs(rails[0].length-rails[1].length)>1) {
      const from = rails[0].length > rails[1].length ? 0 : 1;
      rails[from].sort((a,b)=>Math.abs(a.x-rect.width/2)-Math.abs(b.x-rect.width/2)); const moved=rails[from].shift();moved.side=1-from;rails[1-from].push(moved);
    }
    rails.forEach((rail,side) => {
      rail.sort((a,b)=>a.preferredY-b.preferredY);
      const total = rail.reduce((sum,e)=>sum+e.h+5,0);
      const gap = Math.max(0, Math.min(6, (bottom-top-total)/Math.max(1,rail.length)));
      let last = top;
      rail.forEach((e,i)=> {
        const remaining = rail.slice(i).reduce((sum,v)=>sum+v.h+gap,0);
        const y = Math.max(last, Math.min(bottom-remaining, e.preferredY*rect.height-e.h/2));
        const x = side ? rect.width-e.w-10 : 10;
        e.b.style.left = x+'px'; e.b.style.top = y+'px'; last=y+e.h+gap;
        const endX = side ? x : x+e.w, endY=y+e.h/2;
        e.line.setAttribute('d',`M ${e.x} ${e.y} L ${endX} ${endY}`); e.dot.setAttribute('cx',e.x); e.dot.setAttribute('cy',e.y);
      });
    });
  }
  function updateUI() {
    const detailTitles={outer:'Außenohr · Schall auffangen',middle:'Mittelohr · Bewegung übertragen',cochlea:'Hörschnecke · entrollt',nerve:'Hörnerv · Signale weiterleiten',balance:'Das Gleichgewichtsorgan',pressure:'Druckausgleich im Mittelohr'};
    $('view-title').textContent=state.level==='cell'?'Wie wir hören.':state.level==='detail'?detailTitles[detailMap[state.detail].builder]:fineNames[state.fine];
    $('level-badge').textContent=state.level==='cell'?'DAS OHR / ÜBERSICHT':state.level==='detail'?'EBENE 2 / IM DETAIL':state.fine==='ossicles'?'EBENE 3 / GEHÖRKNÖCHELCHEN':'EBENE 3 / SINNESZELLEN';
    $('stage-subtitle').textContent=state.level==='cell'?'Außenohr · Mittelohr · Innenohr':state.level==='fine'?(state.fine==='ossicles'?'Hammer · Amboss · Steigbügel':'Bewegung wird zum Nervensignal'):state.detail==='cochlea'?'Links: hohe Töne · rechts: tiefe Töne':'Bestandteile antippen und Schall beobachten';
    $('back').hidden=!state.history.length;$('intro-hint').hidden=true;
    for(const [id,active] of [['cut',state.cut],['whole',!state.cut]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));$(id).disabled=!state.view?.kit.shells.length;}
    $('auto-zoom').checked=state.autoZoom;$('toggle-labels').setAttribute('aria-pressed',String(state.labels));
    const hint=state.autoZoom?'Über einem Bestandteil hineinzoomen: Details öffnen. Herauszoomen: zurück.':'Freies Zoomen. Die Infokarte öffnet Details; der Pfeil führt zurück.';
    $('zoom-mode-hint').textContent=hint;$('depth-hint').textContent=hint;
    const bc=$('breadcrumbs');bc.replaceChildren();const chain=[cellName()];if(state.level!=='cell')chain.push(partInfo(state.detail).name);if(state.level==='fine')chain.push(state.fine==='ossicles'?'Gehörknöchelchen':'Haarzellen');
    chain.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',()=>{while(state.history.length>i)goBack();});bc.append(b);if(i<chain.length-1){const span=document.createElement('span');span.textContent='›';bc.append(span);}});
    $('depth-3').textContent=state.fine==='ossicles'?'› Knöchelchen':'› Haarzellen';
    ['cell','detail','fine'].forEach((l,i)=>$('depth-'+(i+1)).classList.toggle('active',state.level===l));
    $('model-note').textContent=state.view?.note||content.modelNote;
    updateSoundUI();
  }
  function updateSoundUI(){
    $('sound-toggle').checked=state.soundOn;$('volume').value=Math.round(state.amplitude*100);$('pitch').value=Math.round(state.pitch*100);
    const tone=['sehr tief','tief','mittel','hoch','sehr hoch'][Math.min(4,Math.floor(state.pitch*5))];
    $('volume-value').textContent=Math.round(state.amplitude*100)+' %';$('pitch-value').textContent=tone;
    $('pitch').setAttribute('aria-valuetext',tone);$('volume').setAttribute('aria-valuetext',Math.round(state.amplitude*100)+' Prozent');
    $('sound-path').classList.toggle('playing',state.soundOn&&state.amplitude>0);
    $('sound-explanation').textContent=state.level==='detail'&&state.detail==='balance'?'Das Gleichgewichtsorgan erkennt Kopfbewegungen. Es bleibt bei dieser Simulation unbewegt.':!state.soundOn?'Schalte die Simulation ein und beobachte den Schallweg.':state.amplitude===0?'Lautstärke 0: Die Bewegung stoppt.':'Laute Töne: stärkere Bewegung. Hohe und tiefe Töne wirken an verschiedenen Stellen der Hörschnecke.';
  }
  function selectAt(x,y){const target=hitPart(x,y);if(target)setSelected(target.id);}
  function clearPointers(){state.pointers.clear();state.down=null;state.pinch=null;}
  function bindInputs() {
    const stage=$('stage'),canvas=$('model');
    const modelTarget=e=>e.target===canvas||!!e.target.closest?.('.model-label');
    const pair=()=>{const p=[...state.pointers.values()];return p.length<2?null:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};};
    stage.addEventListener('pointerdown',e=>{
      if(!modelTarget(e)||e.button>0)return;
      stage.setPointerCapture(e.pointerId);state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(state.pointers.size>=2){state.pinch=pair();state.down=null;resetZoomGesture();state.zoomLock=0;}
      else state.down={id:e.pointerId,x:e.clientX,y:e.clientY,originX:e.clientX,originY:e.clientY,moved:false,label:e.target.closest?.('.model-label')?.dataset.part};
    });
    stage.addEventListener('pointermove',e=>{
      if(!state.pointers.has(e.pointerId))return;
      state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(state.pointers.size>=2){const next=pair();if(state.pinch?.d>8&&next.d>8)zoomBy(state.pinch.d/next.d,hitPart(next.x,next.y,'zoom'),next);state.pinch=next;return;}
      const d=state.down;if(!d||d.id!==e.pointerId)return;
      if(Math.hypot(e.clientX-d.originX,e.clientY-d.originY)>6)d.moved=true;
      if(d.moved){state.root.rotation.y+=(e.clientX-d.x)*.008;state.root.rotation.x+=(e.clientY-d.y)*.006;resetZoomGesture();applyCut();}
      d.x=e.clientX;d.y=e.clientY;
    });
    const release=(e,cancel)=>{
      if(!state.pointers.has(e.pointerId))return;
      const tap=!cancel&&!state.pinch&&state.down&&!state.down.moved&&state.down.id===e.pointerId;
      const label=state.down?.label;state.pointers.delete(e.pointerId);state.pinch=null;state.down=null;
      if(tap){if(label)setSelected(label);else selectAt(e.clientX,e.clientY);}
      if(state.pointers.size===1){const [id,p]=[...state.pointers][0];state.down={id,...p,originX:p.x,originY:p.y,moved:true,label:null};}
      if(stage.hasPointerCapture?.(e.pointerId))stage.releasePointerCapture(e.pointerId);
      if(!state.pointers.size){resetZoomGesture();state.zoomLock=0;}
    };
    stage.addEventListener('pointerup',e=>release(e,false));stage.addEventListener('pointercancel',e=>release(e,true));stage.addEventListener('lostpointercapture',e=>{if(state.pointers.has(e.pointerId))release(e,true);});window.addEventListener('blur',clearPointers);
    stage.addEventListener('wheel',e=>{
      if(e.target.closest?.('.stage-tools,.info-card'))return;e.preventDefault();
      const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1);
      const delta=Math.max(-120,Math.min(120,pixels));
      const id=e.target.closest?.('.model-label')?.dataset.part;
      const target=id?(canAutoEnter(id)?labelTarget(id):null):hitPart(e.clientX,e.clientY,'zoom');
      zoomBy(Math.exp(delta*.0025),target,{x:e.clientX,y:e.clientY});
    },{passive:false});
    canvas.addEventListener('keydown',e=>{
      if(!state.root)return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))e.preventDefault();
      if(e.key==='ArrowLeft')state.root.rotation.y-=.08;if(e.key==='ArrowRight')state.root.rotation.y+=.08;if(e.key==='ArrowUp')state.root.rotation.x-=.06;if(e.key==='ArrowDown')state.root.rotation.x+=.06;
      if(e.key==='+'||e.key==='=')zoomBy(.86,centralTarget());if(e.key==='-')zoomBy(1.16);applyCut();
    });
  }
  function initScene(){
    if(renderer)return true;
    try{renderer=new T.WebGLRenderer({canvas:$('model'),antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.localClippingEnabled=true;}
    catch(e){$('error').hidden=false;return false;}
    scene=new T.Scene();camera=new T.PerspectiveCamera(37,1,.05,500);raycaster=new T.Raycaster();raycaster.params.Line.threshold=.04;
    scene.add(new T.HemisphereLight(0xdcecff,0x182943,1.7));
    const key=new T.DirectionalLight(0xffffff,2.7);key.position.set(4,6,8);scene.add(key);const fill=new T.DirectionalLight(0x8bb8ff,1.1);fill.position.set(-6,-3,4);scene.add(fill);
    bindInputs();new ResizeObserver(resize).observe($('stage'));resize();
    let previous=performance.now();
    function loop(now){requestAnimationFrame(loop);const dt=Math.min(50,now-previous);previous=now;if(bridge.paused||document.hidden||$('app').hidden||!state.view)return;
      const blend=1-Math.exp(-dt/85);state.cameraDistance+=(state.targetDistance-state.cameraDistance)*blend;state.focus.lerp(state.targetFocus,blend);updateCamera();
      if(state.soundOn){state.elapsed+=dt;state.phase+=dt*.001*Math.PI*2*(.45+state.pitch*.8);}
      if(state.view.animate&&(state.soundOn||state.soundDirty)){state.view.animate(state);state.soundDirty=false;applyCut();}
      renderer.render(scene,camera);positionLabels();
    }
    requestAnimationFrame(loop);return true;
  }
  function resize(){
    if(!renderer)return;const r=$('stage').getBoundingClientRect();if(!r.width||!r.height)return;
    const previous=state.fitDistance;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
    if(state.view){state.fitDistance=fitDistance();const ratio=state.fitDistance/previous;state.targetDistance*=ratio;state.cameraDistance*=ratio;updateCamera();positionLabels();}
  }
  function populateDialogs(){
    $('source-list').replaceChildren();content.sources.forEach(s=>{const li=document.createElement('li'),a=document.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=s.title;li.append(a);$('source-list').append(li);});
  }
  function launchEar(resetSound=false){
    if(resetSound){state.soundOn=false;state.amplitude=.65;state.pitch=.54;state.phase=0;state.elapsed=0;state.autoZoom=true;state.labels=true;}
    state.level='cell';state.detail=null;state.fine=null;state.selected=null;state.history=[];state.transitionUntil=0;state.lastZoomAt=0;clearPointers();
    if(initScene()){resize();makeView();$('model').focus({preventScroll:true});}
  }
  function setup(){
    populateDialogs();$('home').addEventListener('click',()=>launchEar());$('reset').addEventListener('click',()=>launchEar(true));$('back').addEventListener('click',goBack);
    $('cut').addEventListener('click',()=>{state.cut=true;applyCut();updateUI();});$('whole').addEventListener('click',()=>{state.cut=false;applyCut();updateUI();});
    $('auto-zoom').addEventListener('change',e=>{state.autoZoom=e.target.checked;resetZoomGesture();state.zoomLock=0;updateUI();});
    $('zoom-in').addEventListener('click',()=>zoomBy(.86,centralTarget()));$('zoom-out').addEventListener('click',()=>zoomBy(1.16));
    $('toggle-labels').addEventListener('click',()=>{state.labels=!state.labels;renderLabels();updateUI();});
    $('show-all').addEventListener('click',()=>{state.hidden.clear();updateVisibility();renderList();renderLabels();});
    $('close-info').addEventListener('click',hideInfo);$('enter-detail').addEventListener('click',()=>enterNext());$('hide-part').addEventListener('click',()=>{if(state.selected)togglePart(state.selected);});
    $('sound-toggle').addEventListener('change',e=>{state.soundOn=e.target.checked;state.soundDirty=true;if(!state.soundOn)state.phase=0;updateSoundUI();});
    $('volume').addEventListener('input',e=>{state.amplitude=Number(e.target.value)/100;state.soundDirty=true;updateSoundUI();});
    $('pitch').addEventListener('input',e=>{state.pitch=Number(e.target.value)/100;state.soundDirty=true;updateSoundUI();});
    $('bones-link').addEventListener('click',()=>{launchEar();enterNext('malleus');enterNext('malleus');window.scrollTo(0,0);});
    $('corti-link').addEventListener('click',()=>{launchEar();enterNext('cochlea');enterNext('corti');window.scrollTo(0,0);});
    [['sources-button','sources-dialog'],['path-button','path-dialog'],['help','help-dialog']].forEach(([button,dialog])=>$(button).addEventListener('click',()=>$(dialog).showModal()));
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
    document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')hideInfo();});
    launchEar();
    bridge.ready({activate(){launchEar();window.scrollTo(0,0);},pause(){clearPointers();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
}());
