/* ============================================================
   COSMO5 — Case Study Cosmos  v2
   Earth → 3D Orbital Constellation → Case Panel
   ============================================================ */
'use strict';

let CASES = [];

fetch('cases.json')
  .then(r => r.json())
  .then(data => { CASES = data; boot(); })
  .catch(err => { console.error('Failed to load cases.json', err); boot(); });

function boot(){

/* ── Country centroids ── */
const CC = {
  'Spain':       [-3.7, 40.4],  'Italy':       [12.5, 42.0],
  'US':          [-98.0,39.0],  'Germany':     [10.4, 51.2],
  'Canada':      [-106.,56.0],  'UK':          [-2.0, 54.0],
  'France':      [2.3,  46.2],  'Netherlands': [5.3,  52.1],
  'Hong Kong':   [114.2,22.3],  'Switzerland': [8.2,  46.8],
  'Portugal':    [-8.0, 39.5],  'Austria':     [14.5, 47.5],
};

/* ── Service colours ── */
const SVC_COL = {
  'Video Ads':        '#ffdba4', 'Social Paid':      '#fff4dd',
  'SEA':              '#e8b15a', 'Amazon':           '#ffb97a',
  'Programmatic':     '#c9d6ff', 'Search':           '#b9e4ff',
  'Feed':             '#a9f0d1', 'Data':             '#c4f0ff',
  'Marketplaces':     '#ffc6d9', 'Business strategy':'#e6c9ff',
  'GEO':              '#ffe29a', 'Media':            '#fff4dd',
  'Commerce':         '#ffbf8a', 'SEO':              '#a9f0d1',
  'Consulting':       '#e6c9ff', 'Creative':         '#ffb9a6',
  'Organization':     '#e6c9ff', 'Data Measurement': '#c4f0ff',
};
function hue(t){ return SVC_COL[t] || '#fff4dd'; }

/* ── Index ── */
const BY_COUNTRY = {};
for(const c of CASES){
  for(const cc of c.countries){
    (BY_COUNTRY[cc] = BY_COUNTRY[cc] || []).push(c);
  }
}
const ALL_COUNTRIES = Object.keys(BY_COUNTRY);
const ALL_SVCS = [...new Set(CASES.flatMap(c=>c.services))];
const YEAR_MIN = Math.min(...CASES.map(c=>c.year));
const YEAR_MAX = Math.max(...CASES.map(c=>c.year));

/* ── Globe stats strip ── */
document.getElementById('s-c').textContent = CASES.length;
document.getElementById('s-t').textContent = ALL_COUNTRIES.length;
document.getElementById('s-s').textContent = ALL_SVCS.length;
document.getElementById('s-y').textContent = (YEAR_MAX - YEAR_MIN + 1);

/* ── Deterministic hash ── */
function hash(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return ((h>>>0)%10000)/10000;
}

/* ── hex → THREE.Color ── */
function hexCol(h){ return new THREE.Color().setStyle(h); }
function hexRGB(h){
  return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
}

/* ============================================================
   LAYER 1 — Ambient Three.js starfield (always on)
   ============================================================ */
;(function(){
  const canvas = document.getElementById('starfield');
  const rend = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  rend.setPixelRatio(Math.min(devicePixelRatio,2));
  rend.setSize(innerWidth,innerHeight);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,2000);
  cam.position.z = 400;
  function layer(n,spread,sz,col){
    const g=new THREE.BufferGeometry();
    const p=new Float32Array(n*3);
    for(let i=0;i<n;i++){
      p[i*3]=(Math.random()-.5)*spread;
      p[i*3+1]=(Math.random()-.5)*spread;
      p[i*3+2]=(Math.random()-.5)*spread;
    }
    g.setAttribute('position',new THREE.BufferAttribute(p,3));
    return new THREE.Points(g,new THREE.PointsMaterial(
      {color:col,size:sz,sizeAttenuation:true,transparent:true,opacity:.85,
       depthWrite:false,blending:THREE.AdditiveBlending}));
  }
  const far=layer(1400,1600,.9,0xfff4dd);
  const mid=layer(500,900,1.4,0xffdba4);
  const nr=layer(120,600,2.6,0xe8b15a);
  scene.add(far,mid,nr);
  function tick(t){ t*=.0001;
    far.rotation.y=t*.3;far.rotation.x=t*.1;
    mid.rotation.y=t*.6;mid.rotation.x=t*.2;
    nr.rotation.y=t*.9;nr.rotation.x=t*.3;
    rend.render(scene,cam); requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  addEventListener('resize',()=>{
    cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
    rend.setSize(innerWidth,innerHeight);
  });
})();

/* ============================================================
   LAYER 2 — D3 Orthographic Globe
   ============================================================ */
const globe = (function(){
  const canvas = document.getElementById('globe-canvas');
  const ctx = canvas.getContext('2d');
  const tip = document.getElementById('ctip');
  let size,radius,proj,pathGen;
  let land=null,borders=null;
  let rot=[20,-20,0];
  let drag=false,ds=null,rs=null;
  let autoR=true;

  function resize(){
    size=Math.min(innerWidth*.85,innerHeight*.85,760);
    canvas.width=size*devicePixelRatio; canvas.height=size*devicePixelRatio;
    canvas.style.width=size+'px'; canvas.style.height=size+'px';
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(devicePixelRatio,devicePixelRatio);
    radius=size*.42;
    proj=d3.geoOrthographic().translate([size/2,size/2]).scale(radius).rotate(rot).clipAngle(90);
    pathGen=d3.geoPath(proj,ctx);
  }
  resize();

  const markers=ALL_COUNTRIES.filter(c=>CC[c]).map(c=>({name:c,coords:CC[c],count:BY_COUNTRY[c].length}));
  const maxCount=Math.max(...markers.map(m=>m.count));

  function draw(){
    ctx.clearRect(0,0,size,size);
    proj.rotate(rot);
    /* atmosphere */
    const ag=ctx.createRadialGradient(size/2,size/2,radius*.9,size/2,size/2,radius*1.14);
    ag.addColorStop(0,'rgba(90,120,200,.18)'); ag.addColorStop(1,'transparent');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(size/2,size/2,radius*1.14,0,Math.PI*2); ctx.fill();
    /* sphere */
    ctx.beginPath(); pathGen({type:'Sphere'});
    const sg=ctx.createRadialGradient(size*.37,size*.37,0,size/2,size/2,radius);
    sg.addColorStop(0,'#131827'); sg.addColorStop(.7,'#0a0d16'); sg.addColorStop(1,'#05070d');
    ctx.fillStyle=sg; ctx.fill();
    /* graticule */
    ctx.beginPath(); pathGen(d3.geoGraticule10());
    ctx.strokeStyle='rgba(232,177,90,.055)'; ctx.lineWidth=.5; ctx.stroke();
    /* land */
    if(land){
      ctx.beginPath(); pathGen(land);
      ctx.fillStyle='rgba(245,237,223,.055)'; ctx.fill();
      ctx.strokeStyle='rgba(245,237,223,.17)'; ctx.lineWidth=.55; ctx.stroke();
    }
    if(borders){
      ctx.beginPath(); pathGen(borders);
      ctx.strokeStyle='rgba(245,237,223,.07)'; ctx.lineWidth=.35; ctx.stroke();
    }
    /* markers */
    const t=Date.now();
    for(const m of markers){
      const p=proj(m.coords); if(!p) continue;
      const dx=p[0]-size/2,dy=p[1]-size/2;
      if(dx*dx+dy*dy>radius*radius) continue;
      const gd=d3.geoDistance(m.coords,[-rot[0],-rot[1]]);
      if(gd>Math.PI/2) continue;
      const alpha=1-(gd/(Math.PI/2))*.35;
      const rBase=3+(m.count/maxCount)*9;
      /* halo */
      const hg=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],rBase*3.5);
      hg.addColorStop(0,`rgba(232,177,90,${.5*alpha})`);
      hg.addColorStop(.4,`rgba(232,177,90,${.15*alpha})`);
      hg.addColorStop(1,'rgba(232,177,90,0)');
      ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(p[0],p[1],rBase*3.5,0,Math.PI*2); ctx.fill();
      /* dot */
      ctx.beginPath(); ctx.arc(p[0],p[1],rBase*.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,244,221,${alpha})`; ctx.fill();
      /* pulse ring */
      const pk=(Math.sin(t*.002+m.name.length)+1)/2;
      ctx.beginPath(); ctx.arc(p[0],p[1],rBase*(.8+pk*.55),0,Math.PI*2);
      ctx.strokeStyle=`rgba(232,177,90,${.3*alpha*(1-pk*.6)})`; ctx.lineWidth=.9; ctx.stroke();
      m._p=p; m._r=rBase;
    }
  }

  function loop(){ if(autoR&&!drag) rot[0]+=.08; draw(); requestAnimationFrame(loop); }

  /* interactions */
  canvas.addEventListener('pointerdown',e=>{
    drag=true; autoR=false; ds=[e.clientX,e.clientY]; rs=rot.slice();
  });
  addEventListener('pointermove',e=>{
    const rect=canvas.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    let found=null;
    for(const m of markers){
      if(!m._p) continue;
      const dx=m._p[0]-mx,dy=m._p[1]-my;
      if(dx*dx+dy*dy<(m._r*m._r+36)){ found=m; break; }
    }
    if(found){
      canvas.style.cursor='pointer';
      tip.classList.add('on');
      tip.style.left=e.clientX+'px'; tip.style.top=e.clientY+'px';
      document.getElementById('ctip-n').textContent=found.name;
      document.getElementById('ctip-c').textContent=found.count+' case'+(found.count>1?'s':'');
    } else {
      canvas.style.cursor=drag?'grabbing':'grab';
      tip.classList.remove('on');
    }
    if(drag){
      rot[0]=rs[0]+(e.clientX-ds[0])*.38;
      rot[1]=Math.max(-80,Math.min(80,rs[1]-(e.clientY-ds[1])*.38));
    }
  });
  addEventListener('pointerup',e=>{
    if(!drag) return; drag=false;
    const moved=Math.hypot(e.clientX-ds[0],e.clientY-ds[1]);
    if(moved<5){
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left,my=e.clientY-rect.top;
      for(const m of markers){
        if(!m._p) continue;
        const dx=m._p[0]-mx,dy=m._p[1]-my;
        if(dx*dx+dy*dy<(m._r*m._r+60)){ openConstellation(m.name); break; }
      }
    }
    setTimeout(()=>{ autoR=true; },3000);
  });
  addEventListener('resize',resize);

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r=>r.json())
    .then(w=>{
      land=topojson.feature(w,w.objects.countries);
      borders=topojson.mesh(w,w.objects.countries,(a,b)=>a!==b);
      loop();
      setTimeout(()=>document.getElementById('loader').classList.add('done'),600);
    }).catch(()=>{ loop(); setTimeout(()=>document.getElementById('loader').classList.add('done'),600); });

  return {
    focus(country){
      const coords=CC[country]; if(!coords) return;
      autoR=false;
      const target=[-coords[0],-coords[1]],from=rot.slice(),t0=performance.now();
      function a(t){ const k=Math.min(1,(t-t0)/900),e=1-Math.pow(1-k,3);
        rot[0]=from[0]+(target[0]-from[0])*e; rot[1]=from[1]+(target[1]-from[1])*e;
        if(k<1) requestAnimationFrame(a); }
      requestAnimationFrame(a);
    }
  };
})();

/* ============================================================
   LAYER 3 — Three.js 3D Constellation (orbital)
   ============================================================ */
const constellation = (function(){
  const canvas = document.getElementById('constellation-canvas');
  const rend = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  rend.setPixelRatio(Math.min(devicePixelRatio,2));
  rend.setClearColor(0x000000,0);
  rend.setSize(innerWidth,innerHeight);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,3000);

  /* ── Orbit state ── */
  let sph={theta:0,phi:.15,r:520};
  let tgt={theta:0,phi:.15,r:520};
  let isOrbit=false,lastMx=0,lastMy=0,autoSpin=true;
  let activeCountry=null;

  /* ── Object lists ── */
  let starMeshes=[],glowSprites=[],clusterObjs=[],labelData=[];
  let hoveredMesh=null;
  let activeSvcType=null;
  const focusPos=new THREE.Vector3(0,0,0);
  const tgtFocusPos=new THREE.Vector3(0,0,0);
  let savedR=700;
  const YEAR_BOOST={2024:1,2025:1,2026:1};
  /* Attention gradient constants — shared between updateLabels and tick */
  const ZOOM_FAR=680,ZOOM_NEAR=280;
  let labelBoost = 0; /* 0 = auto (current behavior), 1 = all labels full visibility */
  /* Temporary vector reused each frame */
  const _tv=new THREE.Vector3();

  /* ── Glow texture cache ── */
  const glowCache={};
  function glowTex(hex){
    if(!glowCache[hex]){
      const sz=128,c=document.createElement('canvas');
      c.width=c.height=sz;
      const cx=c.getContext('2d'),h=sz/2;
      const g=cx.createRadialGradient(h,h,0,h,h,h);
      const [r,gb,b]=hexRGB(hex);
      g.addColorStop(0,  `rgba(${r*255|0},${gb*255|0},${b*255|0},.9)`);
      g.addColorStop(.25,`rgba(${r*255|0},${gb*255|0},${b*255|0},.45)`);
      g.addColorStop(.6, `rgba(${r*255|0},${gb*255|0},${b*255|0},.1)`);
      g.addColorStop(1,  `rgba(${r*255|0},${gb*255|0},${b*255|0},0)`);
      cx.fillStyle=g; cx.fillRect(0,0,sz,sz);
      glowCache[hex]=new THREE.CanvasTexture(c);
    }
    return glowCache[hex];
  }

  /* ── Shared geometries ── */
  const BASE_GEO = new THREE.SphereGeometry(1,9,9);
  const GA = Math.PI*(3-Math.sqrt(5)); /* golden angle */

  /* ── Clear scene ── */
  function clearScene(){
    const labelCont=document.getElementById('star-labels');
    labelData.forEach(d=>d.el&&d.el.remove());
    for(const o of [...starMeshes,...glowSprites,...clusterObjs]){
      scene.remove(o);
      if(o.geometry) o.geometry.dispose();
      if(o.material) o.material.dispose();
    }
    starMeshes=[]; glowSprites=[]; clusterObjs=[]; labelData=[];
    hoveredMesh=null;
    activeSvcType=null;
    focusPos.set(0,0,0); tgtFocusPos.set(0,0,0);
  }

  /* ── Build constellation for a country ── */
  function build(country){
    clearScene();
    activeCountry=country;
    const cases=BY_COUNTRY[country]||[];

    /* group by primary service */
    const groups={};
    cases.forEach(c=>{
      const t=c.services[0]||'Other';
      (groups[t]=groups[t]||[]).push(c);
    });
    const types=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);

    /* cluster centers in xy — widened for orbital breathing room */
    const cR=n=>Math.min(120,32+Math.sqrt(n)*20);
    const screenR=Math.min(innerWidth,innerHeight)*.46;

    const centers={};
    if(types.length===1){
      centers[types[0]]=[0,0];
    } else if(types.length<=8){
      const mcR=Math.max(...types.map(t=>cR(groups[t].length)));
      const ringR=Math.min(screenR,Math.max(screenR*.5,mcR/Math.sin(Math.PI/types.length)*1.1));
      types.forEach((t,i)=>{
        const a=(i/types.length)*Math.PI*2-Math.PI/2;
        centers[t]=[Math.cos(a)*ringR,Math.sin(a)*ringR];
      });
    } else {
      const oC=Math.ceil(types.length*.6);
      const outer=types.slice(0,oC),inner=types.slice(oC);
      const oR=screenR*.85,iR=oR*.45;
      outer.forEach((t,i)=>{
        const a=(i/outer.length)*Math.PI*2-Math.PI/2;
        centers[t]=[Math.cos(a)*oR,Math.sin(a)*oR];
      });
      inner.forEach((t,i)=>{
        const a=(i/Math.max(1,inner.length))*Math.PI*2+Math.PI/inner.length;
        centers[t]=[Math.cos(a)*iR,Math.sin(a)*iR];
      });
    }

    /* star positions — ORBITAL: each case is an electron on its own orbital plane around the service nucleus */
    const allStars=[];
    const clusterMaxR={};
    types.forEach(t=>{
      const [gx,gy]=centers[t],arr=groups[t],n=arr.length;
      const center=new THREE.Vector3(gx,gy,0);
      /* per-cluster orbit ring: min→max scaled by cluster size */
      const rMin=Math.max(18,cR(n)*.38);
      const rMax=Math.max(rMin+14,cR(n)*1.15);
      clusterMaxR[t]=rMax;
      arr.forEach((c,i)=>{
        const ah='orb'+c.id;
        /* unique orbital axis per star */
        const ax=new THREE.Vector3(
          hash(ah+'ax')-.5,
          hash(ah+'ay')-.5,
          hash(ah+'az')-.5
        ).normalize();
        let up=new THREE.Vector3(0,1,0);
        if(Math.abs(ax.dot(up))>.92) up.set(1,0,0);
        /* orthonormal basis for orbital plane */
        const u=new THREE.Vector3().crossVectors(ax,up).normalize();
        const v=new THREE.Vector3().crossVectors(ax,u).normalize();
        const r=n===1?0:(rMin+hash(ah+'r')*(rMax-rMin));
        const phase=hash(ah+'p')*Math.PI*2;
        const dir=hash(ah+'d')>.5?1:-1;
        const speed=(.00008+hash(ah+'s')*.00020)*dir;
        /* initial position at phase 0 (t=0 snapshot) */
        const x=gx+r*(u.x*Math.cos(phase)+v.x*Math.sin(phase));
        const y=gy+r*(u.y*Math.cos(phase)+v.y*Math.sin(phase));
        const z=0 +r*(u.z*Math.cos(phase)+v.z*Math.sin(phase));
        const orbit={center,u,v,r,phase,speed};
        allStars.push({x,y,z,case:c,type:t,gx,gy,orbit});
      });
    });

    /* ── Cluster halos — encompass the orbital shell ── */
    types.forEach(t=>{
      const [gx,gy]=centers[t],n=groups[t].length;
      const r=(clusterMaxR[t]||cR(n))+18;
      const [rv,gv,bv]=hexRGB(hue(t));
      const geo=new THREE.SphereGeometry(r,16,16);
      const mat=new THREE.MeshBasicMaterial({
        color:new THREE.Color(rv,gv,bv),transparent:true,
        opacity:.07,depthWrite:false,side:THREE.BackSide
      });
      const m=new THREE.Mesh(geo,mat);
      m.position.set(gx,gy,0); m.userData={isCluster:true,svc:t,cx:gx,cy:gy};
      scene.add(m); clusterObjs.push(m);

      /* cluster label — observatory plate */
      const labelCont=document.getElementById('star-labels');
      const div=document.createElement('div');
      div.className='cl'; div.dataset.svc=t;
      const svcHue=hue(t);
      div.style.setProperty('--cl-accent',svcHue);
      const [cr,cg,cb]=hexRGB(svcHue);
      div.style.setProperty('--cl-glow',`rgba(${(cr*255)|0},${(cg*255)|0},${(cb*255)|0},.4)`);
      const nameEl=document.createElement('div');
      nameEl.className='cl-name'; nameEl.textContent=t;
      const countEl=document.createElement('div');
      countEl.className='cl-count'; countEl.textContent=String(n).padStart(2,'0');
      const subEl=document.createElement('div');
      subEl.className='cl-sub'; subEl.textContent=n===1?'case study':'case studies';
      div.appendChild(nameEl); div.appendChild(countEl); div.appendChild(subEl);
      div.addEventListener('click',()=>focusCluster(t));
      labelCont.appendChild(div);
      labelData.push({mesh:m,el:div,isCluster:true,offsetY:r+44,svc:t});
    });

    /* ── Intra-cluster constellation lines intentionally removed — orbital motion carries the grouping ── */

    /* ── Stars + glows ── */
    const labelCont=document.getElementById('star-labels');
    allStars.forEach((sd,idx)=>{
      const hex=sd.case.permission?hue(sd.type):'#6b6e79';
      const [rv,gv,bv]=hexRGB(hex);
      const starR=Math.min(6.5,sd.case.permission?(2.8+(sd.case.metrics?.length||0)*.35):1.8);
      const yb=YEAR_BOOST[sd.case.year]??.9;
      const baseOp=sd.case.permission?(.95*yb):(.45*yb);

      const mat=new THREE.MeshBasicMaterial({
        color:new THREE.Color(rv,gv,bv),
        transparent:true,opacity:baseOp
      });
      const mesh=new THREE.Mesh(BASE_GEO,mat);
      mesh.scale.setScalar(starR);
      mesh.position.set(sd.x,sd.y,sd.z);
      mesh.userData={case:sd.case,type:sd.type,hex,starR,idx,baseOp,
        orbit:sd.orbit,
        homePos:new THREE.Vector3(sd.x,sd.y,sd.z),
        gatherPos:new THREE.Vector3(sd.x,sd.y,sd.z),
        curPos:new THREE.Vector3(sd.x,sd.y,sd.z)};
      scene.add(mesh); starMeshes.push(mesh);

      /* glow sprite */
      const smat=new THREE.SpriteMaterial({
        map:glowTex(hex),transparent:true,
        opacity:(sd.case.permission?.65:.2)*yb,
        depthWrite:false,blending:THREE.AdditiveBlending
      });
      const sprite=new THREE.Sprite(smat);
      sprite.position.copy(mesh.position);
      sprite.scale.setScalar(starR*7);
      scene.add(sprite); glowSprites.push(sprite);

      /* HTML label */
      const div=document.createElement('div');
      div.className='sl'; div.textContent=sd.case.client;
      labelCont.appendChild(div);
      labelData.push({mesh,el:div,isCluster:false});
    });

    /* twinkle: offset each glow sprite phase */
    glowSprites.forEach((s,i)=>{s.userData.phase=Math.random()*Math.PI*2;});
  }

  /* ── Cluster focus ── */
  function focusCluster(svc){
    if(activeSvcType===svc){ unfocusAll(); return; }
    activeSvcType=svc;
    /* find cluster center */
    const cl=labelData.find(d=>d.isCluster&&d.svc===svc);
    if(cl&&cl.mesh){
      const {x,y,z}=cl.mesh.position;
      tgtFocusPos.set(x,y,z);
    }
    savedR=tgt.r; tgt.r=Math.min(tgt.r,420);
    /* dim / highlight stars */
    starMeshes.forEach(m=>{
      const match=m.userData.type===svc;
      m.material.opacity=match?(m.userData.baseOp??.9):.12;
      glowSprites[starMeshes.indexOf(m)].material.opacity=match?.7:.05;
    });
    /* dim other cluster halos */
    clusterObjs.forEach(o=>{
      if(o.isPoints||o.isLine) return;
      if(o.userData?.svc) o.material.opacity=(o.userData.svc===svc)?.13:.018;
    });
    /* label styling */
    labelData.filter(d=>d.isCluster).forEach(d=>{
      d.el.classList.toggle('focused',d.svc===svc);
    });
    const hint=document.getElementById('focus-hint');
    const txt=document.getElementById('fh-text');
    if(hint&&txt){ txt.textContent=svc; hint.classList.add('on'); }
  }

  /* ── Filter + Gather state ── */
  const filterState={years:new Set(),scopes:new Set(),services:new Set(),search:''};
  let gatherActive=false;
  let gatherLineObj=null; /* MST lines drawn between gathered stars */

  function matchesSearch(c){
    const q=filterState.search.toLowerCase().trim();
    if(!q) return true;
    const fields=[c.client,c.title,c.challenge,c.approach,c.contributor_name,
      (c.services||[]).join(' '),(c.countries||[]).join(' ')].join(' ').toLowerCase();
    return q.split(/\s+/).every(word=>fields.includes(word));
  }

  function matchesFilter(c){
    if(!matchesSearch(c)) return false;
    if(filterState.years.size && !filterState.years.has(c.year)) return false;
    if(filterState.services.size){
      const has=(c.services||[]).some(s=>filterState.services.has(s));
      if(!has) return false;
    }
    if(filterState.scopes.size){
      const nC=(c.countries||[]).length;
      const tag = nC>=2 ? 'multi' : 'single';
      if(!filterState.scopes.has(tag)) return false;
    }
    return true;
  }

  function anyFilterActive(){
    return filterState.years.size||filterState.scopes.size||
           filterState.services.size||(filterState.search.trim().length>0);
  }

  function buildGatherLines(matched){
    /* remove old gather lines */
    if(gatherLineObj){ scene.remove(gatherLineObj); gatherLineObj=null; }
    if(matched.length<2) return;
    /* MST on 2D phyllotaxis positions (gatherPos.x/y) */
    const pts=matched;
    const inTree=new Set([0]);
    const pos=[], col=[];
    while(inTree.size<pts.length){
      let best=null;
      for(const i of inTree){
        for(let j=0;j<pts.length;j++){
          if(inTree.has(j)) continue;
          const pi=pts[i].userData.gatherPos, pj=pts[j].userData.gatherPos;
          const d=Math.hypot(pi.x-pj.x,pi.y-pj.y);
          if(!best||d<best.d) best={i,j,d};
        }
      }
      if(!best) break;
      const pi=pts[best.i].userData.gatherPos, pj=pts[best.j].userData.gatherPos;
      /* teal lines, slightly transparent */
      pos.push(pi.x,pi.y,pi.z, pj.x,pj.y,pj.z);
      col.push(.0,.886,.878, .0,.886,.878);
      inTree.add(best.j);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    gatherLineObj=new THREE.LineSegments(geo,new THREE.LineBasicMaterial(
      {vertexColors:true,transparent:true,opacity:0}));
    gatherLineObj.userData.targetOp=.34;
    scene.add(gatherLineObj);
  }

  function computeGatherPositions(){
    /* phyllotaxis disc — flat plane, no year depth */
    const matched=starMeshes.filter(m=>matchesFilter(m.userData.case));
    const GA=Math.PI*(3-Math.sqrt(5));
    const base=20, step=7.5;
    matched.forEach((m,i)=>{
      const r=base+Math.sqrt(i)*step*2.2;
      const a=i*GA;
      m.userData.gatherPos.set(Math.cos(a)*r,Math.sin(a)*r,0);
    });
    /* non-matched: keep their current orbital position (snapshot) so they fade out in place */
    starMeshes.forEach(m=>{
      if(!matchesFilter(m.userData.case))
        m.userData.gatherPos.copy(m.position);
    });
    /* tear down existing MST so tick rebuilds once stars re-settle */
    if(gatherLineObj){ scene.remove(gatherLineObj); gatherLineObj=null; }
  }

  function applyFilter(){
    const active=anyFilterActive();
    let matchCount=0;
    starMeshes.forEach((m,i)=>{
      const ok=matchesFilter(m.userData.case);
      if(ok) matchCount++;
      const base=m.userData.baseOp??.9;
      const sR=m.userData.starR;
      if(!active){
        m.visible=true;
        if(glowSprites[i]) glowSprites[i].visible=true;
        m.material.opacity=base;
        m.scale.setScalar(sR);
        glowSprites[i].material.opacity=
          (m.userData.case?.permission?.65:.2)*(YEAR_BOOST[m.userData.case?.year]??.9);
      } else if(gatherActive){
        /* gather: matched stars scale up hard, pop; non-matched fully extinct */
        m.material.opacity=ok?1:0;
        m.visible=true;
        m.scale.setScalar(ok?sR*2.0:sR*.6);
        glowSprites[i].material.opacity=ok?1:0;
        glowSprites[i].visible=true;
      } else {
        m.visible=true;
        if(glowSprites[i]) glowSprites[i].visible=true;
        m.material.opacity=ok?Math.max(base,.92):.06;
        m.scale.setScalar(sR);
        glowSprites[i].material.opacity=ok?.75:.02;
      }
    });
    /* cluster lines/halos */
    clusterObjs.forEach(o=>{
      if(o.type==='LineSegments'){
        if(o.material){
          o.material.opacity=gatherActive?0:(active?.08:.22);
          o.material.transparent=true;
        }
      }
      if(o.userData?.isCluster){
        o.material.opacity=gatherActive?0:(active?.038:.07);
      }
    });
    /* cluster labels: fade in gather, dim (not hidden) in filter-only */
    labelData.filter(d=>d.isCluster).forEach(d=>{
      if(gatherActive) d.el.style.filter='grayscale(.8) opacity(.15)';
      else if(active){
        const anyMatch=starMeshes.some(m=>m.userData.type===d.svc&&matchesFilter(m.userData.case));
        d.el.style.filter=anyMatch?'none':'grayscale(.5) opacity(.35)';
      } else {
        d.el.style.filter='none';
      }
    });
    /* show/hide gather stage disc */
    const stage=document.getElementById('gatherStage');
    if(stage) stage.classList.toggle('on',gatherActive);
    document.body.classList.toggle('gather-on',gatherActive);

    /* gather-mode label dedup: collapse same-client matches to one label */
    if(gatherActive){
      const seen=new Map();
      labelData.forEach(d=>{
        if(d.isCluster) return;
        const c=d.mesh.userData.case;
        if(!matchesFilter(c)){ d.el.classList.add('gather-hide'); return; }
        d.el.classList.remove('gather-hide');
        const key=c.client;
        if(seen.has(key)){
          const first=seen.get(key);
          first.count++;
          first.d.el.textContent=first.count>1?`${key} ×${first.count}`:key;
          d.el.classList.add('gather-hide');
        } else {
          seen.set(key,{d,count:1});
          d.el.textContent=key;
        }
      });
    } else {
      /* restore original client labels */
      labelData.forEach(d=>{
        if(d.isCluster) return;
        d.el.classList.remove('gather-hide');
        d.el.textContent=d.mesh.userData.case.client;
      });
    }

    /* gather caption — filter signature memory aid */
    const cap=document.getElementById('gsCaption');
    const buildSignature=()=>{
      const parts=[];
      const rp=document.querySelector('.rail-pill.on');
      if(rp){
        const label=rp.firstChild?.textContent?.trim()||rp.textContent.replace(/\d+$/,'').trim();
        parts.push(`<b>${label}</b>`);
      }
      if(filterState.services.size)
        parts.push([...filterState.services].join(' + '));
      if(filterState.scopes.size)
        parts.push([...filterState.scopes].map(s=>s==='multi'?'Multi-country':'Single-country').join(', '));
      if(filterState.years.size)
        parts.push([...filterState.years].sort().join(' · '));
      if(filterState.search) parts.push(`"${filterState.search}"`);
      return parts;
    };
    if(cap){
      if(gatherActive){
        const parts=buildSignature();
        parts.push(`<b style="color:var(--teal)">${matchCount} case${matchCount===1?'':'s'}</b>`);
        cap.innerHTML=parts.join('<span class="sep">·</span>');
      } else {
        cap.innerHTML='';
      }
    }

    /* side panel — ALWAYS visible. Content adapts: all cases → filtered → gathered */
    const glList=document.getElementById('gatherList');
    const glBody=document.getElementById('glBody');
    const glCount=document.getElementById('glCount');
    const glBadge=document.getElementById('glBadge');
    const glSub=document.getElementById('glSub');
    const glHead=glList?glList.querySelector('.gl-head h3'):null;
    if(glList && glBody){
      glList.classList.toggle('gathered',gatherActive);
      /* visible list = filtered when any filter, else all */
      const visible=active
        ? starMeshes.filter(m=>matchesFilter(m.userData.case))
        : [...starMeshes];
      const count=visible.length;
      glCount.textContent=count;
      glBadge.textContent=count;
      if(glHead) glHead.textContent=gatherActive?'Gathered':(active?'Filtered':'All cases');
      const sigParts=buildSignature();
      glSub.innerHTML=sigParts.length
        ? sigParts.join('<span class="sep">·</span>')
        : `${activeCountry||''}`.trim()||'—';
      if(count===0){
        glBody.innerHTML='<div class="gl-empty">No cases match.<br>Drop a filter to widen the search.</div>';
      } else {
        glBody.innerHTML=visible.map(m=>{
          const c=m.userData.case;
          const title=(c.title||'').replace(/[<>]/g,'');
          const client=(c.client||'').replace(/[<>]/g,'');
          const svc=(c.services||[])[0]||'';
          const country=(c.countries||[])[0]||'';
          const multi=(c.countries||[]).length>1?` +${c.countries.length-1}`:'';
          return `<div class="gl-item" data-idx="${starMeshes.indexOf(m)}">
            <div class="gli-client">${client}</div>
            <div class="gli-title">${title}</div>
            <div class="gli-meta">
              <span class="gli-year">${c.year||'—'}</span>
              <span class="gli-dot"></span>
              <span class="gli-country">${country}${multi}</span>
              ${svc?`<span class="gli-dot"></span><span class="gli-svc">${svc}</span>`:''}
            </div>
          </div>`;
        }).join('');
        glBody.querySelectorAll('.gl-item').forEach(el=>{
          const idx=+el.dataset.idx;
          const mesh=starMeshes[idx];
          if(!mesh) return;
          el.addEventListener('click',()=>{ openPanel(mesh.userData.case); });
          el.addEventListener('mouseenter',()=>{
            hoveredMesh=mesh;
            el.classList.add('focused');
          });
          el.addEventListener('mouseleave',()=>{
            if(hoveredMesh===mesh) hoveredMesh=null;
            el.classList.remove('focused');
          });
        });
      }
    }

    if(gatherActive) computeGatherPositions();
    else if(gatherLineObj){ scene.remove(gatherLineObj); gatherLineObj=null; }
    return matchCount;
  }

  let gatherSavedR=null,gatherSavedFocus=null,gatherSavedSvc=null;
  function setGather(on){
    const wasOn=gatherActive;
    gatherActive=!!on;
    if(gatherActive && !wasOn){
      /* seize the camera: snapshot current state, then pull to center-stage */
      gatherSavedR=tgt.r;
      gatherSavedFocus=tgtFocusPos.clone();
      gatherSavedSvc=activeSvcType;
      /* clear any cluster focus so it doesn't compete */
      activeSvcType=null;
      labelData.filter(d=>d.isCluster).forEach(d=>d.el.classList.remove('focused'));
      const hint=document.getElementById('focus-hint');
      if(hint) hint.classList.remove('on');
      /* frame the gather disc */
      tgtFocusPos.set(0,0,0);
      tgt.r=340;
      tgt.phi=Math.PI/2; /* top-down on the disc */
      autoSpin=false;
      computeGatherPositions();
    } else if(!gatherActive && wasOn){
      /* release camera */
      starMeshes.forEach(m=>m.userData.gatherPos.copy(m.userData.homePos));
      if(gatherLineObj){ scene.remove(gatherLineObj); gatherLineObj=null; }
      const stage=document.getElementById('gatherStage');
      if(stage) stage.classList.remove('on');
      if(gatherSavedR!=null) tgt.r=gatherSavedR;
      if(gatherSavedFocus) tgtFocusPos.copy(gatherSavedFocus);
      tgt.phi=.85; /* return to orbit tilt */
      setTimeout(()=>{autoSpin=true;},600);
      gatherSavedR=null; gatherSavedFocus=null; gatherSavedSvc=null;
    }
  }

  function clearFilters(){
    filterState.years.clear();
    filterState.scopes.clear();
    filterState.services.clear();
    filterState.search='';
    setGather(false);
    applyFilter();
  }

  function unfocusAll(){
    activeSvcType=null;
    tgtFocusPos.set(0,0,0);
    tgt.r=savedR||520;
    starMeshes.forEach(m=>{
      m.material.opacity=m.userData.baseOp??.9;
      const yb=YEAR_BOOST[m.userData.case?.year]??.9;
      glowSprites[starMeshes.indexOf(m)].material.opacity=(m.userData.case?.permission?.65:.2)*yb;
    });
    clusterObjs.forEach(o=>{
      if(o.isPoints||o.isLine) return;
      if(o.userData?.svc) o.material.opacity=.07;
    });
    labelData.filter(d=>d.isCluster).forEach(d=>d.el.classList.remove('focused'));
    const hint=document.getElementById('focus-hint');
    if(hint) hint.classList.remove('on');
  }

  /* ── Camera orbit ── */
  function camPos(){
    const {theta,phi,r}=sph;
    const sinP=Math.sin(phi),cosP=Math.cos(phi);
    cam.position.set(r*sinP*Math.sin(theta)+focusPos.x,r*cosP+focusPos.y,r*sinP*Math.cos(theta)+focusPos.z);
    cam.lookAt(focusPos);
  }

  /* ── Raycaster ── */
  const ray=new THREE.Raycaster();
  ray.params.Points.threshold=5;

  function getHit(mx,my){
    const ndc=new THREE.Vector2(
      (mx/innerWidth)*2-1,-((my/innerHeight)*2-1));
    ray.setFromCamera(ndc,cam);
    const hits=ray.intersectObjects(starMeshes);
    return hits.length?hits[0].object:null;
  }

  /* ── Label update loop ── */
  function updateLabels(t){
    const W=innerWidth,H=innerHeight;
    /* depth fade range adapts to current zoom */
    const r=sph.r, nearD=r*0.62, farD=r*1.32;
    /* unified zoom factor (same constants as --zoom in tick) */
    const z01=Math.max(0,Math.min(1,(ZOOM_FAR-sph.r)/(ZOOM_FAR-ZOOM_NEAR)));
    labelData.forEach(d=>{
      if(!d.mesh||!d.el) return;
      const wp=d.mesh.position;
      const v=wp.clone().project(cam);
      /* cull if behind camera or outside viewport */
      const outFrame = v.z>=1 || v.x<-1.05 || v.x>1.05 || v.y<-1.05 || v.y>1.05;
      if(outFrame){d.el.style.opacity='0';return;}
      /* distance-based fade — further from camera = fainter */
      const dist=wp.distanceTo(cam.position);
      const depth = dist<=nearD ? 1 : dist>=farD ? 0 : 1-(dist-nearD)/(farD-nearD);
      const sx=(v.x*.5+.5)*W,sy=(v.y*-.5+.5)*H;

      if(d.isCluster){
        d.el.style.transform=`translate(${sx|0}px,${(sy+(d.offsetY||0))|0}px) translateX(-50%)`;
        const hovOwn = hoveredMesh && hoveredMesh.userData.type===d.svc;
        /* INVERTED with zoom: cluster labels are navigation at far orbit,
           but recede as you zoom in and star labels take over. */
        let op;
        if(gatherActive){
          op = 0; /* gather suppresses cluster labels entirely */
        } else if(hovOwn){
          op = 0; /* hovering a star in this cluster - suppress its label */
        } else {
          const clusterFade = 1 - z01 * 0.72 * (1 - labelBoost * 0.8);
          op = clusterFade;
          if(activeSvcType && activeSvcType!==d.svc) op *= 0.18;
        }
        op *= depth;
        d.el.style.opacity = op.toFixed(3);
      } else {
        d.el.style.transform=`translate(${(sx+10)|0}px,${(sy-7)|0}px)`;
        const isHov=(hoveredMesh===d.mesh);
        d.el.classList.toggle('hover',isHov);
        /* ── Star labels: three inputs drive visibility ──
           1. z01 (zoom level) — global gate: far=hidden, close=visible
           2. Screen-center proximity — gaze focus: center stars show, edges don't
           3. Depth gate — soft cull for stars behind the scene
           No depth MULTIPLIER (all stars at ~same dist from camera in orbital layout). */
        let op;
        if(isHov){
          op = 1;
        } else if(gatherActive){
          op = matchesFilter(d.mesh.userData.case) ? 0.9 : 0;
        } else {
          /* screen-center proximity: NDC distance from viewport center (0→~1.4) */
          const screenR = Math.sqrt(v.x*v.x + v.y*v.y);
          const gaze = Math.max(0, 1 - screenR * 0.78);
          const dGate = depth < 0.05 ? 0 : depth < 0.25 ? (depth - 0.05) / 0.2 : 1;
          const zFactor = 0.18 + z01 * 0.82;
          const autoOp = zFactor * gaze * dGate * 0.88;
          /* labelBoost: lerp between auto opacity and full visibility */
          op = autoOp + labelBoost * (dGate * 0.92 - autoOp);
        }
        if(activeSvcType && d.mesh.userData.type!==activeSvcType) op = 0;
        if(isHov) op = Math.max(op, 0.94);
        d.el.style.opacity = op.toFixed(3);
      }
    });
    /* twinkle + depth-of-field star brightness */
    const dofNear=sph.r*0.62, dofFar=sph.r*1.32;
    glowSprites.forEach((s,i)=>{
      const m=starMeshes[i];
      if(!m) return;
      const base=m.userData.starR||3;
      const tw=.93+Math.sin(t*.0009+(s.userData.phase||0))*.07;
      const gatherBoost=(gatherActive&&matchesFilter(m.userData.case))?1.5:1;
      s.scale.setScalar(base*7*tw*gatherBoost);
      /* depth-of-field: as zoom increases, stars closer to camera brighten,
         farther stars dim. At far orbit, everything stays at base opacity. */
      if(!gatherActive && z01 > 0.05){
        const sdist=m.position.distanceTo(cam.position);
        const dof=sdist<=dofNear?1:sdist>=dofFar?0:1-(sdist-dofNear)/(dofFar-dofNear);
        const opMod=1 - z01 * 0.4 * (1-dof); /* at max zoom, back-plane dims by 40% */
        m.material.opacity=Math.min(1,(m.userData.baseOp||.9)*opMod);
        s.material.opacity=Math.min(1,(m.userData.case?.permission?.65:.2)*opMod);
      }
    });
  }

  /* ── Render loop ── */
  let rafId=null;
  function tick(t){
    rafId=requestAnimationFrame(tick);
    if(autoSpin&&!isOrbit) tgt.theta+=.00042;
    /* lerp orbit */
    const spd=.07;
    sph.theta+=(tgt.theta-sph.theta)*spd;
    sph.phi  +=(tgt.phi  -sph.phi  )*spd;
    sph.r    +=(tgt.r    -sph.r    )*spd;
    sph.phi=Math.max(.08,Math.min(Math.PI-.08,sph.phi));
    focusPos.lerp(tgtFocusPos,0.08);
    /* ── Attention gradient: broadcast zoom level as CSS custom prop ── */
    const zoom01=Math.max(0,Math.min(1,(ZOOM_FAR-sph.r)/(ZOOM_FAR-ZOOM_NEAR)));
    document.body.style.setProperty('--zoom',zoom01.toFixed(3));
    /* position lerp: orbit ↔ gather */
    const psp=.055;
    let anyMoving=false;
    starMeshes.forEach((m,i)=>{
      if(gatherActive){
        _tv.copy(m.userData.gatherPos);
      } else {
        const o=m.userData.orbit;
        if(o){
          const a=o.phase+t*o.speed;
          const cosA=Math.cos(a),sinA=Math.sin(a);
          _tv.set(
            o.center.x+o.r*(o.u.x*cosA+o.v.x*sinA),
            o.center.y+o.r*(o.u.y*cosA+o.v.y*sinA),
            o.center.z+o.r*(o.u.z*cosA+o.v.z*sinA)
          );
        } else {
          _tv.copy(m.userData.homePos);
        }
      }
      const cur=m.position;
      const dx=_tv.x-cur.x, dy=_tv.y-cur.y, dz=_tv.z-cur.z;
      /* only track movement during gather transitions, so rebuild gate works */
      if(gatherActive && (Math.abs(dx)+Math.abs(dy)+Math.abs(dz)>.05)) anyMoving=true;
      cur.x+=dx*psp; cur.y+=dy*psp; cur.z+=dz*psp;
      if(glowSprites[i]) glowSprites[i].position.copy(cur);
    });
    /* build gather lines ONCE once stars have settled, then fade them in */
    if(gatherActive&&!anyMoving&&!gatherLineObj){
      buildGatherLines(starMeshes.filter(m=>matchesFilter(m.userData.case)));
    }
    if(gatherLineObj){
      const tgtOp=gatherLineObj.userData.targetOp||0;
      const cur=gatherLineObj.material.opacity;
      gatherLineObj.material.opacity=cur+(tgtOp-cur)*.06;
    }
    camPos();
    updateLabels(t);
    rend.render(scene,cam);
  }

  /* ── Pointer events on constellation canvas ── */
  canvas.addEventListener('pointerdown',e=>{
    isOrbit=true; autoSpin=false;
    lastMx=e.clientX; lastMy=e.clientY;
  });
  addEventListener('pointermove',e=>{
    if(isOrbit){
      const dx=e.clientX-lastMx,dy=e.clientY-lastMy;
      tgt.theta-=dx*.005; tgt.phi-=dy*.005;
      lastMx=e.clientX; lastMy=e.clientY;
    }
    if(canvas.style.display!=='none'&&canvas.style.opacity!=='0'){
      const hit=getHit(e.clientX,e.clientY);
      canvas.style.cursor=hit?'pointer':'default';
      if(hit!==hoveredMesh){
        /* de-highlight prev */
        if(hoveredMesh) hoveredMesh.scale.setScalar(hoveredMesh.userData.starR);
        hoveredMesh=hit;
        if(hoveredMesh) hoveredMesh.scale.setScalar(hoveredMesh.userData.starR*1.7);
      }
    }
  });
  addEventListener('pointerup',e=>{
    if(!isOrbit) return;
    const moved=Math.hypot(e.clientX-lastMx,e.clientY-lastMy);
    isOrbit=false;
    let hit=null;
    if(moved<4){
      hit=getHit(e.clientX,e.clientY);
      if(hit) openPanel(hit.userData.case);
    }
    if(moved<4 && !hit && activeSvcType) unfocusAll();
    setTimeout(()=>{ autoSpin=true; },5000);
  });
  addEventListener('wheel',e=>{
    if(canvas.style.display==='none') return;
    tgt.r=Math.max(240,Math.min(1400,tgt.r+e.deltaY*.4));
  },{passive:true});

  /* ── Entry animation ── */
  function animateEntry(){
    /* cinematic sweep: dive from high orbit into flat plane */
    sph.r=1800; tgt.r=700;
    sph.theta=-.18; tgt.theta=0;
    sph.phi=.55;   tgt.phi=.15;
    autoSpin=false;
    setTimeout(()=>{ autoSpin=true; },2600);
  }

  /* ── Resize ── */
  addEventListener('resize',()=>{
    cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix();
    rend.setSize(innerWidth,innerHeight);
  });

  function availableServices(){
    const s=new Set();
    starMeshes.forEach(m=>(m.userData.case?.services||[]).forEach(x=>s.add(x)));
    return [...s].sort();
  }
  function availableYears(){
    const s=new Set();
    starMeshes.forEach(m=>s.add(m.userData.case?.year));
    return [...s].filter(Boolean).sort();
  }

  return {
    show(country){ build(country); clearFilters(); animateEntry(); if(!rafId) requestAnimationFrame(tick); },
    setLabelBoost(v){ labelBoost=v; },
    hide(){ clearScene(); },
    toggleYear(y){ filterState.years.has(y)?filterState.years.delete(y):filterState.years.add(y); return applyFilter(); },
    toggleScope(s){ filterState.scopes.has(s)?filterState.scopes.delete(s):filterState.scopes.add(s); return applyFilter(); },
    toggleService(s){ filterState.services.has(s)?filterState.services.delete(s):filterState.services.add(s); return applyFilter(); },
    setSearch(q){ filterState.search=q||''; return applyFilter(); },
    clearFilters(){ clearFilters(); return applyFilter(); },
    setGather(on){ setGather(on); },
    getFilterState(){ return {
      years:[...filterState.years],scopes:[...filterState.scopes],services:[...filterState.services],
      gather:gatherActive,
      services_available:availableServices(),
      years_available:availableYears(),
      hue
    }; },
    anyFilter(){ return anyFilterActive(); },
    countMatches(){ let n=0; starMeshes.forEach(m=>{ if(matchesFilter(m.userData.case)) n++; }); return n; }
  };
})();

/* ============================================================
   UI STATE MACHINE
   ============================================================ */
let mode='earth'; // 'earth' | 'constellation'
let currentCountry=null;

function buildCountryRail(){
  const rail=document.getElementById('countryRail');
  if(rail.dataset.built) return;
  const ordered=ALL_COUNTRIES
    .filter(c=>BY_COUNTRY[c]&&BY_COUNTRY[c].length)
    .sort((a,b)=>BY_COUNTRY[b].length-BY_COUNTRY[a].length);
  ordered.forEach(c=>{
    const b=document.createElement('button');
    b.className='rail-pill'; b.dataset.country=c;
    b.innerHTML=`<span>${c}</span><span class="n">${BY_COUNTRY[c].length}</span>`;
    b.addEventListener('click',()=>switchCountry(c));
    rail.appendChild(b);
  });
  rail.dataset.built='1';
}

function setRailActive(country){
  document.querySelectorAll('.rail-pill').forEach(p=>{
    p.classList.toggle('on',p.dataset.country===country);
  });
  /* scroll active into view */
  const active=document.querySelector('.rail-pill.on');
  if(active) active.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
}

function switchCountry(country){
  if(country===currentCountry) return;
  const cv=document.getElementById('constellation-canvas');
  /* quick fade + rebuild in place */
  cv.style.transition='opacity .45s var(--ease),transform .45s var(--ease)';
  cv.classList.remove('active');
  setTimeout(()=>{
    currentCountry=country;
    constellation.show(country);
    document.getElementById('here').textContent=country;
    const n=(BY_COUNTRY[country]||[]).length;
    document.getElementById('hereCount').textContent=n+' case'+(n>1?'s':'');
    setRailActive(country);
    rebuildFilterPanel(country);
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
      cv.style.transition=''; cv.classList.add('active');
    }); });
  },480);
}

function openConstellation(country){
  if(mode==='constellation'){ switchCountry(country); return; }
  mode='constellation';
  currentCountry=country;
  buildCountryRail();
  document.getElementById('globe-stage').classList.add('exit');
  document.getElementById('hero').classList.add('exit');
  document.getElementById('stats').classList.add('exit');
  setTimeout(()=>{
    const cv=document.getElementById('constellation-canvas');
    cv.style.display='block';
    constellation.show(country);
    requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ cv.classList.add('active'); }); });
  },520);
  document.getElementById('crumb').classList.add('on');
  setTimeout(()=>{ document.getElementById('cosmoControls').classList.add('on'); },700);
  setTimeout(()=>{ document.getElementById('countryRail').classList.add('on'); },900);
  setTimeout(()=>{
    document.getElementById('filtersWrap').classList.add('on');
    document.getElementById('searchWrap').classList.add('on');
    rebuildFilterPanel(country);
    document.body.classList.add('constellation');
  },1150);
  document.getElementById('here').textContent=country;
  const n=(BY_COUNTRY[country]||[]).length;
  document.getElementById('hereCount').textContent=n+' case'+(n>1?'s':'');
  setRailActive(country);
  document.getElementById('ctip').classList.remove('on');
}

function goEarth(){
  if(mode==='earth') return;
  mode='earth';
  currentCountry=null;
  const cv=document.getElementById('constellation-canvas');
  cv.classList.remove('active');
  setTimeout(()=>{ cv.style.display='none'; constellation.hide(); },1000);
  document.getElementById('globe-stage').classList.remove('exit');
  document.getElementById('hero').classList.remove('exit');
  document.getElementById('stats').classList.remove('exit');
  document.getElementById('crumb').classList.remove('on');
  document.getElementById('countryRail').classList.remove('on');
  document.getElementById('filtersWrap').classList.remove('on');
  document.getElementById('searchWrap').classList.remove('on');
  document.getElementById('gatherStage').classList.remove('on');
  document.getElementById('cosmoControls').classList.remove('on');
  document.getElementById('focus-hint').classList.remove('on');
  document.body.classList.remove('constellation');
  /* ensure panel resets to collapsed for next visit */
  const gl=document.getElementById('gatherList');
  if(gl) gl.classList.add('collapsed');
  closePanel();
}

/* ── Filter panel UI ── */
function rebuildFilterPanel(country){
  const state=constellation.getFilterState();
  const yc=document.getElementById('fc-year');
  const sc=document.getElementById('fc-scope');
  const svc=document.getElementById('fc-service');
  yc.innerHTML=''; sc.innerHTML=''; svc.innerHTML='';

  state.years_available.forEach(y=>{
    const b=document.createElement('button');
    b.className='fchip'; b.dataset.year=y; b.textContent=y;
    b.addEventListener('click',()=>{ b.classList.toggle('on'); onFilterChange(); });
    yc.appendChild(b);
  });
  [['single','Single-country'],['multi','Multi-country']].forEach(([k,lbl])=>{
    const b=document.createElement('button');
    b.className='fchip'; b.dataset.scope=k; b.textContent=lbl;
    b.addEventListener('click',()=>{ b.classList.toggle('on'); onFilterChange(); });
    sc.appendChild(b);
  });
  state.services_available.forEach(s=>{
    const b=document.createElement('button');
    b.className='fchip'; b.dataset.service=s;
    const hex=state.hue(s);
    b.innerHTML=`<span class="dot" style="--fc-dot:${hex}"></span>${s}`;
    b.addEventListener('click',()=>{ b.classList.toggle('on'); onFilterChange(); });
    svc.appendChild(b);
  });
  updateFilterCount();
}

function onFilterChange(){
  /* read chip state -> constellation */
  const years=new Set([...document.querySelectorAll('#fc-year .fchip.on')].map(b=>+b.dataset.year));
  const scopes=new Set([...document.querySelectorAll('#fc-scope .fchip.on')].map(b=>b.dataset.scope));
  const services=new Set([...document.querySelectorAll('#fc-service .fchip.on')].map(b=>b.dataset.service));
  /* push to constellation by diffing current state */
  const state=constellation.getFilterState();
  const curY=new Set(state.years);
  const curSc=new Set(state.scopes);
  const curSv=new Set(state.services);
  [...years].filter(y=>!curY.has(y)).forEach(y=>constellation.toggleYear(y));
  [...curY].filter(y=>!years.has(y)).forEach(y=>constellation.toggleYear(y));
  [...scopes].filter(s=>!curSc.has(s)).forEach(s=>constellation.toggleScope(s));
  [...curSc].filter(s=>!scopes.has(s)).forEach(s=>constellation.toggleScope(s));
  [...services].filter(s=>!curSv.has(s)).forEach(s=>constellation.toggleService(s));
  [...curSv].filter(s=>!services.has(s)).forEach(s=>constellation.toggleService(s));
  updateFilterCount();
}

function updateFilterCount(){
  const any=constellation.anyFilter();
  const n=constellation.countMatches();
  document.getElementById('f-count').textContent=any?n:'All';
  const gb=document.getElementById('gatherBtn');
  gb.disabled=!any;
  if(!any){ gb.classList.remove('on'); constellation.setGather(false);
    document.getElementById('gatherLbl').textContent='Gather to center'; }
}

document.getElementById('filterClear').addEventListener('click',()=>{
  document.querySelectorAll('.filters .fchip.on').forEach(b=>b.classList.remove('on'));
  const si=document.getElementById('searchInput');
  if(si){ si.value=''; }
  const gi=document.getElementById('globalSearch');
  if(gi) gi.value='';
  const sc=document.getElementById('searchClear');
  if(sc) sc.style.opacity='0';
  const gc=document.getElementById('globalSearchClear');
  if(gc) gc.style.opacity='0';
  constellation.clearFilters();
  const gb=document.getElementById('gatherBtn');
  gb.classList.remove('on'); gb.disabled=true;
  document.getElementById('gatherLbl').textContent='Gather to center';
  document.getElementById('f-count').textContent='All';
});

document.getElementById('gatherBtn').addEventListener('click',()=>{
  const gb=document.getElementById('gatherBtn');
  const on=!gb.classList.contains('on');
  gb.classList.toggle('on',on);
  constellation.setGather(on);
  document.getElementById('gatherLbl').textContent=on?'Release':'Gather to center';
});

/* ── Collapsible filter tab ── */
document.getElementById('filtersTab').addEventListener('click',()=>{
  document.getElementById('filtersWrap').classList.toggle('collapsed');
});

/* ── Gather list collapse tab ── */
document.getElementById('glTab').addEventListener('click',()=>{
  document.getElementById('gatherList').classList.toggle('collapsed');
});

/* ── Search wiring ── */
(()=>{
  const inp=document.getElementById('searchInput');
  const clrBtn=document.getElementById('searchClear');
  let debounceT;
  inp.addEventListener('input',()=>{
    clearTimeout(debounceT);
    debounceT=setTimeout(()=>{
      const q=inp.value.trim();
      constellation.setSearch(q);
      clrBtn.style.opacity=q?'1':'0';
      updateFilterCount();
      /* enable gather if any results */
      const any=constellation.anyFilter();
      const gb=document.getElementById('gatherBtn');
      gb.disabled=!any;
      if(!any){ gb.classList.remove('on'); constellation.setGather(false);
        document.getElementById('gatherLbl').textContent='Gather to center'; }
    },180);
  });
  clrBtn.style.opacity='0';
  clrBtn.addEventListener('click',()=>{
    inp.value='';
    constellation.setSearch('');
    clrBtn.style.opacity='0';
    updateFilterCount();
  });
  /* also clear search in filterClear */
})();

document.getElementById('back').addEventListener('click',goEarth);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('panel').classList.contains('open')) closePanel();
    else if(mode==='constellation') goEarth();
  }
  if(mode==='constellation' && (e.key==='ArrowLeft'||e.key==='ArrowRight')){
    e.preventDefault();
    const pills=[...document.querySelectorAll('.rail-pill')];
    if(!pills.length) return;
    const idx=pills.findIndex(p=>p.classList.contains('on'));
    let next;
    if(e.key==='ArrowRight') next=(idx+1)%pills.length;
    else next=(idx-1+pills.length)%pills.length;
    const country=pills[next].dataset.country;
    if(country) switchCountry(country);
  }
});

/* ============================================================
   PANEL
   ============================================================ */
function openPanel(c){
  const $=id=>document.getElementById(id);
  const panel=$('panel');
  const wasOpen=panel.classList.contains('open');
  if(wasOpen){
    /* quick content crossfade */
    const inner=panel.querySelector('.panel-inner');
    inner.style.transition='opacity .18s ease';
    inner.style.opacity='0';
    setTimeout(()=>{
      _fillPanel(c,$);
      inner.style.opacity='1';
      panel.scrollTop=0;
    },180);
    return;
  }
  _fillPanel(c,$);
  panel.classList.add('open');
  document.getElementById('panelScrim').classList.add('on');
}

function _fillPanel(c,$){
  $('p-region').textContent=(c.region||'')+(c.contributor_source?' · '+c.contributor_source:'');
  $('p-client').textContent=c.client;
  $('p-title').textContent=c.title||'';

  /* meta chips */
  const metaEl=$('p-meta'); metaEl.innerHTML='';
  const yr=document.createElement('span');
  yr.className='chip chip-yr'; yr.textContent=c.year; metaEl.appendChild(yr);
  (c.services||[]).forEach(s=>{
    const sp=document.createElement('span');
    sp.className='chip chip-svc'; sp.textContent=s; metaEl.appendChild(sp);
  });
  (c.countries||[]).forEach(co=>{
    const sp=document.createElement('span');
    sp.className='chip chip-geo'; sp.textContent=co; metaEl.appendChild(sp);
  });

  /* challenge / approach */
  $('p-chal').textContent=c.challenge||'Not available.';
  $('p-appr').textContent=c.approach||'Not available.';
  $('p-chal-wrap').style.display=c.challenge?'block':'none';
  $('p-appr-wrap').style.display=c.approach?'block':'none';

  /* impact metrics */
  const impWrap=$('p-impact'),mg=$('p-metrics');
  mg.innerHTML='';
  if(c.permission&&c.metrics&&c.metrics.length){
    impWrap.style.display='block';
    c.metrics.forEach(m=>{
      const card=document.createElement('div'); card.className='metric-card';
      const vEl=document.createElement('div');
      const isPos=m.value.startsWith('+');
      const isNeg=m.value.startsWith('-');
      vEl.className='metric-val '+(isPos?'pos':isNeg?'neg':'neu');
      vEl.textContent=m.value;
      const lEl=document.createElement('div');
      lEl.className='metric-lbl';
      lEl.textContent=m.label||'';
      card.appendChild(vEl); card.appendChild(lEl);
      mg.appendChild(card);
    });
  } else {
    impWrap.style.display='none';
  }

  /* contributor */
  const cw=$('p-contrib-wrap');
  if(c.contributor_name){
    cw.style.display='block';
    $('p-avatar').textContent=c.contributor_name.trim()[0].toUpperCase();
    $('p-cname').textContent=c.contributor_name;
    $('p-csrc').textContent=c.contributor_source||'Cosmo5 Contributor';
  } else { cw.style.display='none'; }

  /* locked */
  $('p-locked').style.display=c.permission?'none':'block';
  $('p-chal-wrap').style.display=(c.permission&&c.challenge)?'block':'none';
  $('p-appr-wrap').style.display=(c.permission&&c.approach)?'block':'none';
}

function closePanel(){
  document.getElementById('panel').classList.remove('open');
  document.getElementById('panelScrim').classList.remove('on');
}

document.getElementById('close').addEventListener('click',closePanel);
document.getElementById('panelScrim').addEventListener('click',closePanel);

/* ── Label visibility slider ── */
document.getElementById('labelSlider').addEventListener('input',e=>{
  const v=+e.target.value;
  const valEl=document.getElementById('labelVal');
  if(v===0){ valEl.textContent='Auto'; }
  else if(v===100){ valEl.textContent='Full'; }
  else { valEl.textContent=v+'%'; }
  constellation.setLabelBoost(v/100);
});

/* ── Global search bar ── */
(()=>{
  const gi=document.getElementById('globalSearch');
  const gc=document.getElementById('globalSearchClear');
  const si=document.getElementById('searchInput');
  let gDebounce;
  gc.style.opacity='0';
  gi.addEventListener('input',()=>{
    clearTimeout(gDebounce);
    gDebounce=setTimeout(()=>{
      const q=gi.value.trim();
      /* sync with sidebar search */
      if(si) si.value=q;
      constellation.setSearch(q);
      gc.style.opacity=q?'1':'0';
      const sc=document.getElementById('searchClear');
      if(sc) sc.style.opacity=q?'1':'0';
      updateFilterCount();
      const any=constellation.anyFilter();
      const gb=document.getElementById('gatherBtn');
      gb.disabled=!any;
      if(!any){ gb.classList.remove('on'); constellation.setGather(false);
        document.getElementById('gatherLbl').textContent='Gather to center'; }
    },180);
  });
  gc.addEventListener('click',()=>{
    gi.value=''; if(si) si.value='';
    constellation.setSearch('');
    gc.style.opacity='0';
    const sc=document.getElementById('searchClear');
    if(sc) sc.style.opacity='0';
    updateFilterCount();
  });
  /* also sync sidebar search → global */
  if(si){
    const origHandler=si.oninput;
    si.addEventListener('input',()=>{
      gi.value=si.value;
      gc.style.opacity=si.value.trim()?'1':'0';
    });
  }
})();

} /* end boot */