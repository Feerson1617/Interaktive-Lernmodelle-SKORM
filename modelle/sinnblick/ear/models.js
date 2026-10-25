/* Ohrblick – eigens erstellte schematische 3D-Modelle. */
(function(){'use strict';const T=window.THREE;
  function mat(color, extra) {
    if (color && color.isMaterial) return color;
    const opts = Object.assign({ roughness: 0.48, metalness: 0.02 }, extra || {});
    opts.color = color || '#ffffff';
    return new T.MeshStandardMaterial(opts);
  }

  function kit(cellType, root) {
    const groups = Object.create(null);
    const anchors = Object.create(null);
    const anchorInstances = Object.create(null);
    const meshes = [];
    const shells = [];
    const K = {
      cellType, root, groups, anchors, anchorInstances, meshes, shells,
      material(color, extra) { return mat(color, extra); },
      group(id) {
        if (!groups[id]) {
          groups[id] = new T.Group();
          groups[id].name = id;
          root.add(groups[id]);
        }
        return groups[id];
      },
      add(id, object) {
        const g = this.group(id);
        g.add(object);
        object.traverse?.(child => {
          if (child.isMesh || child.isLine || child.isSprite) {
            child.userData.part = id;
            if (!meshes.includes(child)) meshes.push(child);
          }
        });
        return object;
      },
      mesh(id, geometry, color, options) {
        const o = options || {};
        const object = new T.Mesh(geometry, color && color.isMaterial ? color : mat(color, o.material));
        if (o.position) object.position.set(...o.position);
        if (o.scale) object.scale.set(...o.scale);
        if (o.rotation) object.rotation.set(...o.rotation);
        object.userData.part = id;
        object.userData.shell = !!o.shell;
        object.userData.pickThrough = !!o.pickThrough || ['cavity', 'air'].includes(id);
        if (o.shell) shells.push(object);
        if (o.name) object.name = o.name;
        this.group(id).add(object);
        meshes.push(object);
        return object;
      },
      sphere(id, position, scale, color, options) {
        const s = Array.isArray(scale) ? scale : [scale, scale, scale];
        return this.mesh(id, new T.SphereGeometry(1, 28, 18), color, Object.assign({ position, scale: s }, options || {}));
      },
      tube(id, points, radius, color, options) {
        const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
        const geometry = new T.TubeGeometry(curve, Math.max(8, points.length * 3), radius, 8, false);
        return this.mesh(id, geometry, color, options);
      },
      anchor(id, position) {
        const a = new T.Object3D();
        a.position.set(...position);
        a.userData.part = id;
        this.group(id).add(a);
        // Keep every occurrence for spatial targeting, plus one stable label.
        (anchorInstances[id] || (anchorInstances[id] = [])).push(a);
        if (!anchors[id]) anchors[id] = a;
        return a;
      }
    };
    return K;
  }
  const P=window.EarContent.parts, B={}, F={};
  const color=id=>P[id]?.color||'#9ecbd4';
  const V=p=>new T.Vector3(...p);
  const transparent=(opacity=.3)=>({transparent:true,opacity,depthWrite:false,side:T.DoubleSide});
  function sph(K,id,p,s,extra={}){return K.sphere(id,p,s,color(id),extra);}
  function tube(K,id,pts,r,extra={}){return K.tube(id,pts,r,color(id),extra);}
  function rod(K,id,a,b,r=.08){const d=V(b).sub(V(a));const m=K.mesh(id,new T.CylinderGeometry(r,r,d.length(),12),color(id),{position:V(a).add(V(b)).multiplyScalar(.5).toArray()});m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
  function ring(K,id,p,r,thick=.04,rotation=[0,0,0]){return K.mesh(id,new T.TorusGeometry(r,thick,8,56),color(id),{position:p,rotation});}
  function anchor(K,id,p){K.anchor(id,p);}
  function meta(animate,note){return {size:5,center:[0,0,0],animate,note};}
  function sound(s){const a=s.soundOn?s.amplitude:0;return {a,phase:s.phase,w:Math.sin(s.phase),peak:.86-s.pitch*.7};}
  function resettable(m){return {m,p:m.position.clone(),s:m.scale.clone(),r:m.rotation.clone()};}
  function drum(K,p=[-1.2,0,0],size=1){
    const vertices=[],ix=[],nr=16,na=64;
    for(let i=0;i<=nr;i++)for(let j=0;j<=na;j++){
      const r=i/nr,a=j/na*Math.PI*2;vertices.push(p[0]+size*.19*(1-r*r),p[1]+size*(.8*r*Math.cos(a)-.46*(1-r)),p[2]+size*.66*r*Math.sin(a));
      if(i<nr&&j<na){const k=i*(na+1)+j;ix.push(k,k+1,k+na+1,k+1,k+na+2,k+na+1);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(ix);geo.computeVertexNormals();
    const membrane=K.mesh('eardrum',geo,'#bebbd2',{material:{...transparent(.54),roughness:.76}});
    const edges=[];for(let j=0;j<=64;j++){const a=j/64*Math.PI*2;edges.push([p[0],p[1]+.8*size*Math.cos(a),p[2]+.66*size*Math.sin(a)]);}K.tube('eardrum',edges,.025*size,'#d7c8ba');
    for(let i=0;i<14;i++){const a=i/14*Math.PI*2;K.tube('eardrum',[[p[0]+.18*size,p[1]-.44*size,p[2]],[p[0]+.14*size,p[1]+.4*size*Math.cos(a)-.23*size,p[2]+.33*size*Math.sin(a)],[p[0]+.003,p[1]+.78*size*Math.cos(a),p[2]+.64*size*Math.sin(a)]],.0035*size,'#d5cdd4',{material:transparent(.42)});}
    anchor(K,'eardrum',[p[0]-.015,p[1]-.16,p[2]+.59*size]);return resettable(membrane);
  }
  function auricle(K,center=[-4.4,0,0],scale=1,id='auricle'){
    // A concave, irregular cartilaginous bowl with helix and antihelix folds.
    const pos=[],ix=[],rows=20,cols=72;
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      const r=i/rows,a=j/cols*Math.PI*2;
      const pinch=1-.20*Math.max(0,Math.cos(a));
      pos.push(center[0]+scale*(Math.cos(a)*.87*r*pinch+.08*Math.sin(2*a)*r),center[1]+scale*Math.sin(a)*1.55*r,center[2]+scale*(.44*r*r-.27+.10*Math.sin(a)*r));
      if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();K.mesh(id,g,color(id),{material:{side:T.DoubleSide,roughness:.7}});
    const helix=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return [center[0]+scale*Math.cos(a)*.87*(1-.2*Math.max(0,Math.cos(a))),center[1]+scale*Math.sin(a)*1.55,center[2]+scale*(.17+.1*Math.sin(a))];});tube(K,id,helix,.11*scale);
    tube(K,id,[[-.3,-.8,.13],[-.45,-.2,.02],[-.42,.5,.12],[-.1,.95,.15],[.3,1,.2]].map(p=>p.map((v,i)=>center[i]+v*scale)),.095*scale);
    sph(K,id,[center[0]+.13*scale,center[1]-1.45*scale,center[2]+.12*scale],[.36*scale,.35*scale,.18*scale]);
    sph(K,id,[center[0]+.52*scale,center[1]-.19*scale,center[2]+.26*scale],[.19*scale,.29*scale,.13*scale]);
    anchor(K,id,[center[0]-.65*scale,center[1]+.85*scale,center[2]+.3*scale]);
  }
  function airField(K,start=-5.9,end=-1.3,y=0){
    const waves=[],particles=[];
    for(let i=0;i<7;i++){const m=ring(K,'air',[start+i/7*(end-start),y,0],.46,.017,[0,Math.PI/2,0]);m.material.transparent=true;m.material.opacity=.45;waves.push(m);}
    for(let i=0;i<18;i++){const x=start+(i/17)*(end-start);const m=sph(K,'air',[x,y+.22*Math.sin(i*2.4),.22*Math.cos(i*2.4)],.035);particles.push({m,x});}
    anchor(K,'air',[start+.6,y+.48,0]);
    return (s)=>{const q=sound(s);waves.forEach((m,i)=>{m.position.x=start+((s.phase/(2*Math.PI)*.45+i/7)%1)*(end-start);m.visible=q.a>0;m.material.opacity=q.a*.45;});particles.forEach(({m,x})=>{m.position.x=x+q.a*.085*Math.sin(s.phase-x*2.1);m.visible=q.a>0;});};
  }
  function ossicles(K,detailed=false){
    const movingParts={malleus:[],incus:[],stapes:[]};
    const shades={malleus:'#e5d9c4',incus:'#d6c8b1',stapes:'#f0e5d0'};
    for(const bone of ['malleus','incus','stapes'])for(const [id,geometry] of Object.entries(window.EarBoneGeometry.make(bone,detailed))){
      K.mesh(id,geometry,shades[bone],{material:{roughness:.68,metalness:0,vertexColors:true}});movingParts[bone].push(id);
    }
    // Articular surfaces are small, pale caps; the long processes remain continuous bone.
    for(const [bone,p,scale] of [['malleus',[-.451,.635,.035],[.016,.112,.103]],['incus',[.31,-.079,.058],[.015,.065,.055]]]){
      const id=detailed?'bone-joints':bone;K.sphere(id,p,scale,'#c5bcac',{material:{roughness:.38}});
    }
    const rim=K.mesh('oval',new T.TorusGeometry(1,.067,12,56),color('oval'),{position:[1.10,-.083,.06],rotation:[0,Math.PI/2,0],scale:[.183,.339,.10],material:{roughness:.78}});
    sph(K,'oval',[1.12,-.083,.06],[.019,.303,.156],{material:transparent(.22),pickThrough:true});
    sph(K,'round',[1.18,-.76,.03],[.035,.175,.16],{material:transparent(.68)});
    if(detailed){
      const aa={'mal-head':[-.69,.79,.2],'mal-handle':[-.915,-.18,.10],'inc-body':[-.22,.73,.22],'inc-short':[.16,.82,-.02],'inc-long':[.06,.19,.12],'sta-head':[.385,-.08,.15],'sta-crura':[.74,.18,.14],'sta-foot':[1.064,-.27,.19],'bone-joints':[.308,-.079,.12]};for(const [id,p] of Object.entries(aa))anchor(K,id,p);
    }else for(const [id,p] of [['malleus',[-.70,.80,.20]],['incus',[-.16,.72,.21]],['stapes',[.71,.19,.14]]])anchor(K,id,p);
    anchor(K,'oval',[1.11,.21,.16]);anchor(K,'round',[1.19,-.79,.2]);
    const pivot=new T.Vector3(-.44,.63,.025),rot=new T.Quaternion(),offset=new T.Vector3();
    return s=>{const q=sound(s),angle=q.a*q.w*.062;rot.setFromAxisAngle(new T.Vector3(0,0,1),angle);offset.copy(pivot).sub(pivot.clone().applyQuaternion(rot));
      for(const bone of ['malleus','incus'])for(const id of movingParts[bone]){K.groups[id].quaternion.copy(rot);K.groups[id].position.copy(offset);}
      if(detailed){K.groups['bone-joints'].quaternion.copy(rot);K.groups['bone-joints'].position.copy(offset);}
      const dx=Math.sin(angle)*.71;for(const id of movingParts.stapes)K.groups[id].position.x=dx;
      K.groups.oval.position.x=dx;K.groups.round.position.x=-dx*.95;
    };
  }
  function spiral(K){
    const pts=Array.from({length:141},(_,i)=>{const u=i/140,a=Math.PI+u*Math.PI*4.8,r=1.27*(1-u)+.16;return [2.56+Math.cos(a)*r,-.4+Math.sin(a)*r,-.1+u*.65];});
    tube(K,'cochlea',pts,.20,{material:transparent(.68)});
    tube(K,'cochlea',[[1.12,-.07,.02],[1.10,-.22,-.04],pts[0]],.21,{material:transparent(.68)});
    const beads=[];for(let i=0;i<30;i++){const u=i/29,p=pts[Math.round(u*140)];beads.push({m:sph(K,'cochlea',p,.085),u});}
    anchor(K,'cochlea',[3.05,-1.43,.25]);
    return s=>{const q=sound(s);beads.forEach(({m,u})=>{const env=Math.exp(-Math.pow((u-q.peak)/.18,2));const v=q.a*env*(.5+.5*Math.sin(s.phase-u*17));m.scale.setScalar(.075+v*.045);m.material.emissive.setRGB(v*.08,v*.45,v*.25);});};
  }
  function balance(K,center=[1.9,1.35,-.15],scale=.72,separate=false){
    const id=separate?'semicircular':'balance';
    const shapes=[a=>[Math.cos(a)*.85,Math.sin(a)*.95,0],a=>[Math.cos(a)*.4,Math.sin(a)*.95,Math.cos(a)*.72],a=>[Math.cos(a)*.9,Math.sin(a)*.28-.45,Math.sin(a)*.7]];
    shapes.forEach((fn,j)=>{const pts=Array.from({length:55},(_,i)=>fn(-Math.PI*.55+i/54*Math.PI*1.8).map((v,k)=>center[k]+v*scale));tube(K,id,pts,.105*scale);sph(K,separate?'ampulla':id,pts[0],[.17*scale,.2*scale,.17*scale]);});
    sph(K,separate?'vestibule':id,[center[0],center[1]-.6*scale,center[2]],[.39*scale,.32*scale,.28*scale]);
    anchor(K,id,[center[0]-.65*scale,center[1]+.65*scale,center[2]]);
    if(separate){anchor(K,'ampulla',[center[0]-.15*scale,center[1]-.93*scale,center[2]]);anchor(K,'vestibule',[center[0],center[1]-.6*scale,center[2]+.3*scale]);}
  }
  function auditoryNerve(K,pts,id='nerve',radius=.13){
    tube(K,id,pts,radius);const path=new T.CatmullRomCurve3(pts.map(V));
    const pulses=Array.from({length:6},()=>sph(K,id,pts[0],radius*.52,{material:{emissive:'#fff2a0',emissiveIntensity:.65}}));
    anchor(K,id,pts[Math.floor(pts.length*.65)]);
    return s=>{const q=sound(s);pulses.forEach((m,i)=>{m.visible=q.a>0&&i<Math.ceil(q.a*6);m.position.copy(path.getPoint((s.elapsed*.0003+i/6)%1));});};
  }
  function buildOverview(){
    const root=new T.Group(),K=kit('ear',root);
    auricle(K);tube(K,'canal',[[-4.03,-.14,-.17],[-3.25,-.05,-.1],[-2.35,.07,0],[-1.25,0,0]],.43,{shell:true,material:transparent(.42)});anchor(K,'canal',[-2.8,.3,.3]);
    const d=drum(K),o=ossicles(K),c=spiral(K),a=airField(K),n=auditoryNerve(K,[[2.66,-.4,-.33],[3.45,-.16,-.4],[4.15,.25,-.3],[4.8,.6,-.4]]);
    balance(K);tube(K,'tube',[[.24,-.8,-.22],[.65,-1.5,-.23],[1.16,-2.2,-.2]],.19,{material:transparent(.6)});anchor(K,'tube',[.9,-1.82,0]);
    return {root,kit:K,...meta(s=>{const q=sound(s);d.m.position.x=d.p.x+q.a*q.w*.07;o(s);c(s);a(s);n(s);},'Der Schallweg: Außenohr → Mittelohr → Innenohr.')};
  }
  B.outer=K=>{auricle(K,[-2.8,0,0],1.2);tube(K,'canal',[[-2.3,-.2,-.2],[-1.1,-.1,0],[.2,0,0],[1.55,0,0]],.59,{shell:true,material:transparent(.5)});anchor(K,'canal',[-.5,.5,.1]);const d=drum(K,[1.62,0,0],1.12);const a=airField(K,-4.5,1.45);
    for(let i=0;i<7;i++){const x=-1.9+i*.13;rod(K,'canal_hairs',[x,-.39,.3],[x+.08,-.14,.32],.013);}anchor(K,'canal_hairs',[-1.55,-.23,.31]);
    for(let i=0;i<4;i++)sph(K,'wax',[-1.55+i*.24,.26,-.23],[.13,.05,.08]);anchor(K,'wax',[-1.2,.3,-.18]);
    return meta(s=>{a(s);const q=sound(s);d.m.position.x=d.p.x+q.a*q.w*.13;},'Schall bringt das Trommelfell zum Schwingen.');};
  B.middle=K=>{const d=drum(K),o=ossicles(K);const a=airField(K,-3.3,-1.3);
    K.mesh('cavity',new T.BoxGeometry(2.8,2.7,1.6),color('cavity'),{position:[0,0,-.14],shell:true,material:transparent(.065),pickThrough:true});anchor(K,'cavity',[-.55,-1.17,-.5]);
    tube(K,'tube',[[.3,-.95,-.22],[.72,-1.55,-.2],[1.2,-2.1,-.2]],.18,{shell:true,material:transparent(.48)});anchor(K,'tube',[.9,-1.8,0]);
    return meta(s=>{o(s);a(s);const q=sound(s);d.m.position.x=d.p.x+q.a*q.w*.08;},'Trommelfell → Hammer → Amboss → Steigbügel → Flüssigkeit im Innenohr.');};
  function ribbon(K,id,widthAt,length=6,y=0){
    const pos=[],ix=[],n=100;
    for(let i=0;i<=n;i++){const u=i/n,w=widthAt(u);pos.push(-length/2+length*u,y,-w,-length/2+length*u,y,w);if(i<n){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();return K.mesh(id,g,color(id),{material:{side:T.DoubleSide,roughness:.6}});
  }
  B.cochlea=K=>{
    const paths={scala_upper:[[-3,.7,0],[-1.4,.95,0],[1.4,.95,0],[3,.65,0]],scala_lower:[[-3,-.83,0],[-1.4,-.95,0],[1.4,-.95,0],[3,-.62,0]]};
    for(const [id,pts] of Object.entries(paths)){tube(K,id,pts,.42,{shell:true,material:transparent(.2)});anchor(K,id,[id==='scala_upper'?-1.6:1.6,id==='scala_upper'?1.05:-1.05,.2]);}
    K.mesh('scala_media',new T.BoxGeometry(5.8,.5,1.35),color('scala_media'),{position:[0,.22,0],shell:true,material:transparent(.08)});anchor(K,'scala_media',[1.4,.38,.7]);
    tube(K,'apex',[[3,.68,0],[3.38,.4,0],[3.38,-.35,0],[3,-.62,0]],.35,{material:transparent(.3)});anchor(K,'apex',[3.42,.1,.3]);
    sph(K,'oval',[-3.03,.65,0],[.07,.36,.34]);sph(K,'round',[-3.03,-.83,0],[.07,.32,.3]);anchor(K,'oval',[-3.07,.7,.4]);anchor(K,'round',[-3.07,-.87,.35]);
    const band=ribbon(K,'basilar',u=>.16+.48*u);anchor(K,'basilar',[.8,-.08,.55]);
    const cells=[];for(let i=0;i<24;i++){const u=i/23,x=-2.8+u*5.6;const m=sph(K,'corti',[x,.13,.02],[.08,.16,.10]);cells.push({m,u});}anchor(K,'corti',[-.4,.23,.12]);
    const nerve=auditoryNerve(K,[[0,-.2,.35],[0,-.65,.8],[.8,-1.6,.8],[2,-1.8,.8]],'nerve',.06);
    const arr=band.geometry.attributes.position;
    return meta(s=>{const q=sound(s);for(let i=0;i<=100;i++){const u=i/100,env=Math.exp(-Math.pow((u-q.peak)/.17,2));const y=q.a*.20*env*Math.sin(s.phase-u*17);arr.setY(i*2,y);arr.setY(i*2+1,y);}arr.needsUpdate=true;band.geometry.computeVertexNormals();
      cells.forEach(({m,u})=>{const env=Math.exp(-Math.pow((u-q.peak)/.17,2));m.position.y=.13+q.a*.20*env*Math.sin(s.phase-u*17);m.material.emissive.setRGB(q.a*env*.22,q.a*env*.11,.015);});
      K.groups.oval.position.x=q.a*q.w*.075;K.groups.round.position.x=-q.a*q.w*.09;nerve(s);
    },'Die Hörschnecke ist hier entrollt. Hohe Töne wirken nahe am Eingang, tiefe nahe an der Spitze.');
  };
  F.hair=K=>{
    K.mesh('basilar',new T.BoxGeometry(5.1,.14,2),color('basilar'),{position:[.1,-1.1,0]});anchor(K,'basilar',[-2.15,-1.1,.8]);
    const innerProfile=[[0,-.76],[.11,-.76],[.24,-.65],[.32,-.35],[.29,.12],[.20,.48],[.205,.72],[.19,.75],[0,.75]];
    const inner=K.mesh('inner_hair',new T.LatheGeometry(innerProfile.map(p=>new T.Vector2(...p)),48),color('inner_hair'),{position:[-1.18,-.22,.18],material:{roughness:.63}});anchor(K,'inner_hair',[-1.4,-.18,.42]);
    const outers=[];for(let i=0;i<3;i++){const g=new T.LatheGeometry([[0,-.76],[.085,-.76],[.17,-.67],[.19,-.4],[.19,.45],[.175,.72],[.17,.75],[0,.75]].map(p=>new T.Vector2(...p)),40);outers.push(K.mesh('outer_hair',g,color('outer_hair'),{position:[.15+i*.68,-.22,0],material:{roughness:.58}}));}anchor(K,'outer_hair',[1.48,-.3,.24]);
    for(const x of [-1.8,-.58,.15,.83,1.51,2.05]){rod(K,'support',[x,-1,.02],[x+.1,-.48,-.12],.09);}anchor(K,'support',[2,-.82,.1]);
    // The pillars frame the tunnel between inner and outer hair-cell rows.
    tube(K,'support',[[-.73,-1.02,-.23],[-.65,-.38,-.23],[-.42,.29,-.23]],.064);tube(K,'support',[[.02,-1.02,-.23],[-.16,-.38,-.23],[-.42,.29,-.23]],.064);
    const plate=K.sphere('tectorial',[.98,1.23,-.05],[1.58,.12,.92],color('tectorial'),{material:{...transparent(.36),roughness:.78}});anchor(K,'tectorial',[1.75,1.28,.65]);
    const bundles=[],channels=[],linkRods=[];
    for(const [cx,baseY,cz] of [[-1.18,.5,.18],[.15,.5,0],[.83,.5,0],[1.51,.5,0]]){
      const bundle=new T.Group();bundle.position.set(cx,baseY,cz);K.group('stereocilia').add(bundle);
      const channelBundle=new T.Group();channelBundle.position.copy(bundle.position);K.group('channels').add(channelBundle);
      const linkBundle=new T.Group();linkBundle.position.copy(bundle.position);K.group('links').add(linkBundle);
      for(let j=0;j<3;j++)for(let k=0;k<5;k++){
        const bendShape=cx<0?[.045,.012,0,.012,.045]:[.065,0,.04,0,.065];
        const h=.325+j*.16,x=-.13+j*.11+bendShape[k],z=-.16+k*.08;
        const m=rod(K,'stereocilia',[x,0,z],[x,h,z],.019);bundle.attach(m);
        // attach preserves world transform; use local coordinates under the bundle.
        m.position.add(bundle.position);
        const ch=sph(K,'channels',[x,h-.02,z],.027);channelBundle.attach(ch);ch.position.add(channelBundle.position);channels.push(ch);
        if(j<2){const ln=rod(K,'links',[x,h-.02,z],[x+.11,h+.10,z],.007);linkBundle.attach(ln);ln.position.add(linkBundle.position);linkRods.push(ln);}
      }
      bundles.push(bundle,channelBundle,linkBundle);
    }
    anchor(K,'stereocilia',[-1.23,.95,.34]);anchor(K,'channels',[-1.17,.85,.4]);anchor(K,'links',[.94,.89,.18]);
    sph(K,'synapse',[-1.18,-.89,.60],[.30,.10,.18]);anchor(K,'synapse',[-1.2,-.91,.74]);
    const release=Array.from({length:7},(_,i)=>sph(K,'synapse',[-1.35+(i%3)*.14,-.67,.56+(i%2)*.05],.032));
    const nerve=auditoryNerve(K,[[-1.18,-1.0,.6],[-1.18,-1.38,.6],[-.5,-1.75,.6],[.7,-1.8,.6],[2.6,-1.8,.6]],'nerve',.075);
    return meta(s=>{const q=sound(s),dy=q.a*.055*q.w,bend=-q.a*.19*q.w,active=Math.max(0,q.w)*q.a;
      for(const id of ['basilar','inner_hair','outer_hair','support','stereocilia','channels','links'])K.groups[id].position.y=dy;
      bundles.forEach(b=>b.rotation.z=bend);plate.position.x=.98+q.a*.07*q.w;
      outers.forEach(m=>m.scale.y=1-q.a*.035*q.w);
      channels.forEach(m=>m.material.emissive.setRGB(active*.15,active*.6,active*.3));inner.material.emissive.setRGB(active*.24,active*.06,.02);
      release.forEach((m,i)=>{m.visible=active>.16&&i<Math.ceil(q.a*7);m.position.y=-.65-((s.phase/(2*Math.PI)*2+i/7)%1)*.2;});nerve(s);
    },'Härchen verbiegen sich → Haarzelle reagiert → Signal an den Hörnerv.');
  };
  F.ossicles=K=>{const animate=ossicles(K,true);return meta(animate,'Drei verbundene Knochen geben die Bewegung weiter. Hier siehst du sie stark vergrößert.');};
  B.nerve=K=>{const pulses=[];
    for(let j=0;j<4;j++){const y=(j-1.5)*.55,z=(j%2)*.25;rod(K,'axon',[-2.7,y,z],[2.7,y,z],.045);for(let i=0;i<6;i++){K.mesh('myelin',new T.CylinderGeometry(.16,.16,.7,16),color('myelin'),{position:[-2.2+i*.85,y,z],rotation:[0,0,Math.PI/2]});if(i<5)ring(K,'nodes',[-1.81+i*.85,y,z],.06,.024,[0,Math.PI/2,0]);}for(let i=0;i<5;i++)pulses.push({m:sph(K,'axon',[-2.5,y,z+.12],.07,{material:{emissive:'#fff2b0',emissiveIntensity:.8}}),y,z,i});}
    anchor(K,'axon',[-2.65,.25,.2]);anchor(K,'myelin',[-1.35,.81,.2]);anchor(K,'nodes',[.73,-.3,.1]);
    return meta(s=>{const q=sound(s);pulses.forEach(({m,i})=>{m.visible=q.a>0&&i<Math.ceil(q.a*5);m.position.x=-2.65+((s.elapsed*.0003+i/5)%1)*5.3;});},'Lichtpunkte zeigen, wie Signale zum Gehirn weitergeleitet werden.');};
  B.balance=K=>{balance(K,[0,.5,0],1.75,true);return meta(null,'Dieser Teil erkennt Kopfbewegungen. Die Schallsimulation bewegt ihn nicht.');};
  B.pressure=K=>{const d=drum(K,[-1.2,.5,0]);tube(K,'tube',[[.2,.15,-.1],[.3,-.7,-.1],[1,-1.8,-.1]],.27,{shell:true,material:transparent(.6)});anchor(K,'tube',[.8,-1.4,.1]);K.mesh('cavity',new T.BoxGeometry(2.2,2,1.4),color('cavity'),{position:[-.1,.5,0],shell:true,material:transparent(.11)});anchor(K,'cavity',[.8,.65,.5]);return meta(s=>{const q=sound(s);d.m.position.x=d.p.x+q.a*q.w*.07;},'Beim Schlucken öffnet sich die Ohrtrompete kurz zum Druckausgleich. Hier bleibt sie unbewegt.');};
  window.EarModels={kit,buildOverview};window.EarBuilders=B;window.EarFineBuilders=F;
}());
