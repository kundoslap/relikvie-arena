// Relikvie Aréna — client. Renders snapshots from the simulation (local for training, the server for online play).
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as S from './sim.js';
import {buildHero,buildNpc,buildBoss,buildArena,HDR,DISC_GEO} from './models.js';
import * as Hub from './hub.js';
import {svg,esc} from './hub.js';
import * as Social from './social.js';
import * as Snd from './audio.js';
import * as Cfg from './settings.js';

const {TICK,TEAM_COL,TEAM_NAME,CLASSES,MAPS,MODES,BOSSES,RARITIES}=S;
const V3=THREE.Vector3,$=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const lerpAng=(a,b,k)=>{let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));return a+d*k};
const store={get(k,d){try{const v=localStorage.getItem('rel.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rel.'+k,JSON.stringify(v))}catch{}}};
let isTouch=matchMedia('(pointer: coarse)').matches;

// ---------- renderer ----------
const hiQ=Cfg.quality()==='high';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
const pixelRatio=()=>Math.min(devicePixelRatio,hiQ?2:1.25)*Cfg.get('scale');
renderer.setPixelRatio(pixelRatio());
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=hiQ;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('#stage').appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x04060c);
scene.fog=new THREE.Fog(0x04060c,52,130);
const envTex=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;
scene.environment=envTex;
const camera=new THREE.PerspectiveCamera(46,1,.1,500);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),hiQ?.65:.5,.4,.7);composer.addPass(bloomPass);bloomPass.enabled=Cfg.get('bloom');
composer.addPass(new OutputPass());
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
// settings that apply at once: resolution, bloom, names over units
function applyCfg(){
  if(Math.abs(renderer.getPixelRatio()-pixelRatio())>.001){renderer.setPixelRatio(pixelRatio());composer.setPixelRatio?.(pixelRatio());resize()}
  bloomPass.enabled=Cfg.get('bloom');G.slotsFor='';document.body.classList.toggle('nonames',!Cfg.get('names'));$('#fps').hidden=!Cfg.get('fps');
  applyTeamColors();
}
Cfg.onChange(applyCfg);
// team colours from the settings: CSS variables for the interface, TEAM_COL (shared with the models) for the 3D world.
// Heroes on the field and the team markers are rebuilt at once.
const teamHex=t=>Cfg.teamColors()[t];
function applyTeamColors(){
  const c=Cfg.teamColors(),n=c.map(h=>parseInt(h.slice(1),16));
  for(const t of [0,1])document.documentElement.style.setProperty('--t'+t,c[t]);
  if(n[0]===TEAM_COL[0]&&n[1]===TEAM_COL[1])return;
  TEAM_COL[0]=n[0];TEAM_COL[1]=n[1];
  for(const v of [...views.values()]){const info=G.roster.get(v.id);dropView(v);if(info)ensureView(info)}
  if(arena){const k=arena.mapKey;arena.dispose();arena=null;setMap(k)}
  if(G.info)buildFlags(G.info);
}

let arena=null;
function setMap(key){if(!MAPS[key])key='core';if(arena&&arena.mapKey===key)return;arena?.dispose();arena=buildArena(scene,key,hiQ)}
const relicMesh=new THREE.Group(),relicLight=new THREE.PointLight(0xffc66d,0,16,1.3);
relicMesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.55,0),new THREE.MeshBasicMaterial({color:HDR(0xffc66d,2.6)})));
relicMesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.95,1),new THREE.MeshBasicMaterial({color:HDR(0xffc66d,1.4),wireframe:true,transparent:true,opacity:.5})));
relicMesh.position.y=1.6;relicMesh.visible=false;scene.add(relicMesh);relicLight.position.y=2.2;scene.add(relicLight);

// ---------- particles & fx ----------
const PMAX=4000,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),parts=[];
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.3,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const points=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.55,map:pTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));points.frustumCulled=false;scene.add(points);
const _c=new THREE.Color();
function burst(p,color,n,spd=6,up=3,life=.6,y=1.2){_c.set(color);if(!hiQ)n*=.5;n=Math.ceil(n*Cfg.get('particles'));
  for(let i=0;i<n&&parts.length<PMAX;i++){const a=rnd(0,Math.PI*2),s=rnd(.2,1)*spd;parts.push({x:p.x,y,z:p.z,vx:Math.cos(a)*s,vy:rnd(0,up),vz:Math.sin(a)*s,l:life*rnd(.6,1.2),m:life,r:_c.r*2,g:_c.g*2,b:_c.b*2})}}
function updParts(dt){let n=0;
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.l-=dt;if(q.l<=0){parts[i]=parts[parts.length-1];parts.pop();continue}
    q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.vy-=4*dt;q.vx*=.96;q.vz*=.96;if(q.y<.05){q.y=.05;q.vy*=-.3}}
  for(const q of parts){const k=q.l/q.m;pPos[n*3]=q.x;pPos[n*3+1]=q.y;pPos[n*3+2]=q.z;pCol[n*3]=q.r*k;pCol[n*3+1]=q.g*k;pCol[n*3+2]=q.b*k;n++}
  pGeo.setDrawRange(0,n);pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
let fxList=[];
const RING_GEO=new THREE.RingGeometry(.86,1,64),SECTOR_GEO=new THREE.RingGeometry(.35,1,24,1,-Math.PI/2-.95,1.9);
const BEAM_GEO=new THREE.CylinderGeometry(1,1,1,8,1,true),DOME_GEO=new THREE.IcosahedronGeometry(1,2),WALL_GEO=new THREE.CylinderGeometry(1,1,1.4,96,1,true);
const BOX_Z=new THREE.BoxGeometry(1,1,1).translate(0,0,.5);
const addMat=(color,k=2.4,extra={})=>new THREE.MeshBasicMaterial({color:HDR(color,k),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,...extra});
function addFx(obj,dur,upd){scene.add(obj);fxList.push({obj,t:0,dur,upd})}
function dropFx(f){scene.remove(f.obj);f.obj.traverse(o=>o.material&&o.material.dispose())}
function updFx(dt){for(let i=fxList.length-1;i>=0;i--){const f=fxList[i];f.t+=dt;const k=f.t/f.dur;if(k>=1){dropFx(f);fxList.splice(i,1);continue}f.upd(k,f.obj)}}
function ringFx(p,color,r0,r1,dur=.45,op=1){const m=new THREE.Mesh(RING_GEO,addMat(color));m.rotation.x=-Math.PI/2;m.position.set(p.x,.1,p.z);addFx(m,dur,(k,o)=>{o.scale.setScalar(r0+(r1-r0)*(1-(1-k)**3));o.material.opacity=op*(1-k)})}
function discFx(p,color,r,dur=.35){const m=new THREE.Mesh(DISC_GEO,addMat(color,1.2));m.rotation.x=-Math.PI/2;m.position.set(p.x,.06,p.z);m.scale.setScalar(r);addFx(m,dur,(k,o)=>{o.material.opacity=.5*(1-k)})}
function beamFx(a,b,color,w=.1,dur=.25){const m=new THREE.Mesh(BEAM_GEO,addMat(color,3));m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(w,a.distanceTo(b),w);
  m.quaternion.setFromUnitVectors(new V3(0,1,0),b.clone().sub(a).normalize());addFx(m,dur,(k,o)=>{o.material.opacity=1-k;o.scale.x=o.scale.z=w*(1-k*.7)})}
function boltFx(a,b,color){let p=a.clone();for(let i=1;i<=6;i++){const q=a.clone().lerp(b,i/6);if(i<6)q.add(new V3(rnd(-.5,.5),rnd(-.4,.4),rnd(-.5,.5)));beamFx(p,q,color,.07,.3);p=q}}
function columnFx(p,color){beamFx(new V3(p.x,0,p.z),new V3(p.x,16,p.z),color,.45,.45);beamFx(new V3(p.x,0,p.z),new V3(p.x,16,p.z),0xffffff,.12,.3)}
function domeFx(p,color,r,dur=.8){const m=new THREE.Mesh(DOME_GEO,addMat(color,1.6,{wireframe:true}));m.position.set(p.x,0,p.z);addFx(m,dur,(k,o)=>{o.scale.setScalar(r*(.4+.6*Math.min(1,k*3)));o.material.opacity=.7*(1-k)})}
function arcFx(p,face,color,range){const g=new THREE.Group(),m=new THREE.Mesh(SECTOR_GEO,addMat(color,1.8));m.rotation.x=-Math.PI/2;g.add(m);g.position.set(p.x,.7,p.z);g.rotation.y=face;m.scale.setScalar(range);addFx(g,.18,(k,o)=>{o.children[0].material.opacity=.8*(1-k)})}
function slashFx(p,face,color,tilt){const g=new THREE.Group(),m=new THREE.Mesh(SECTOR_GEO,addMat(color,2.6));m.rotation.x=-Math.PI/2;g.add(m);g.position.set(p.x,1.1,p.z);g.rotation.set(tilt,face,0);m.scale.setScalar(2.6);addFx(g,.22,(k,o)=>{o.children[0].material.opacity=1-k;o.rotation.y=face+k*.6*Math.sign(tilt||1)})}
function teleFx(e){
  const col=0xff3355;
  if(e.sh==='c'){const g=new THREE.Group();g.position.set(e.x,.09,e.z);
    const edge=new THREE.Mesh(RING_GEO,addMat(col,1.8));edge.rotation.x=-Math.PI/2;edge.scale.setScalar(e.r);
    const fill=new THREE.Mesh(DISC_GEO,addMat(col,.9));fill.rotation.x=-Math.PI/2;g.add(edge,fill);
    addFx(g,e.d,k=>{fill.scale.setScalar(Math.max(.01,e.r*k));fill.material.opacity=.18+.25*k;edge.material.opacity=.55+.45*Math.abs(Math.sin(k*18))})}
  else{const dx=e.x2-e.x,dz=e.z2-e.z,L=Math.hypot(dx,dz)||1,g=new THREE.Group();g.position.set(e.x,.09,e.z);g.rotation.y=Math.atan2(dx,dz);
    const frame=new THREE.Mesh(BOX_Z,addMat(col,.7));frame.scale.set(e.w,.02,L);
    const fill=new THREE.Mesh(BOX_Z,addMat(col,1.6));fill.scale.set(e.w*.9,.03,.01);g.add(frame,fill);
    addFx(g,e.d,k=>{fill.scale.z=Math.max(.01,L*k);frame.material.opacity=.35+.3*Math.abs(Math.sin(k*18))})}
}

// ---------- text overlays ----------
let floaters=[];const _v=new V3();
function toScreen(p,y){_v.set(p.x,y??p.y??0,p.z).project(camera);return{x:(_v.x*.5+.5)*innerWidth,y:(-_v.y*.5+.5)*innerHeight,off:_v.z>1}}
function floatText(p,text,cls,color){if(floaters.length>60)return;if(!Cfg.get('dmgNums')&&(cls==='dmg'||cls==='out'||cls==='in'||cls==='dot'))return;const el=document.createElement('div');el.className='fl '+cls;el.textContent=text;if(color)el.style.color=color;$('#floaters').appendChild(el);floaters.push({el,p:{x:p.x+rnd(-.5,.5),y:p.y??2.7,z:p.z+rnd(-.5,.5)},t:0,life:cls==='loot'?1.8:.9})}
function updFloaters(dt){for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;f.p.y+=dt*1.8;if(f.t>f.life){f.el.remove();floaters.splice(i,1);continue}
  const s=toScreen(f.p);f.el.style.transform=`translate(${s.x}px,${s.y}px) translate(-50%,-50%) scale(${1+Math.max(0,.15-f.t)*3})`;f.el.style.opacity=f.t<f.life-.3?1:(f.life-f.t)/.3}}
let bannerT=0;
function banner(title,sub='',dur=2.2,color='var(--gold)'){if(G.mode==='menu')return;const b=$('#banner');b.querySelector('b').textContent=title;b.querySelector('b').style.color=color;b.querySelector('small').textContent=sub;b.classList.add('on');bannerT=dur}
function feed(html){if(G.mode==='menu')return;const el=document.createElement('div');el.innerHTML=html;const f=$('#feed');f.prepend(el);while(f.children.length>5)f.lastChild.remove();setTimeout(()=>el.remove(),6000)}
const nameOf=id=>G.roster.get(id)?.n||'?';
const mutNames=mods=>(mods||[]).map(k=>S.MUTATORS[k]?.name).filter(Boolean).join(' + ');
const tag=id=>{const r=G.roster.get(id);return r?`<span class="t${r.t}">${esc(r.n)}</span>`:'?'};
let flashT=0;function screenFlash(k=.8){if(Cfg.get('flash'))flashT=Math.max(flashT,k)}

// ---------- session state ----------
const G={mode:'menu',M:null,acc:0,you:0,roster:new Map(),snaps:[],last:null,evq:[],stats:[],ended:false,info:{mode:'arena',map:'core'},
  pred:null,show:null,hist:[],seq:0,pendingCast:[],paused:false,ws:null,lobby:null,ping:0,inAcc:0,slotsFor:'',shake:0,lastOpts:null,solo:false};
const views=new Map(),projMeshes=new Map(),zoneMeshes=new Map(),beamMeshes=new Map(),ringMeshes=new Map(),lootMeshes=new Map();
let pointMeshes=[];

// ---------- unit views ----------
function ensureView(info){
  let v=views.get(info.i);
  if(v&&(v.k!==info.k||v.t!==info.t||v.sk!==info.sk)){dropView(v);v=null}
  if(!v){
    const el=document.createElement('div');el.innerHTML=`<span class="n"></span><div class="hb"><i class="h"></i><i class="s"></i></div><em></em>`;$('#bars').appendChild(el);
    const model=info.kind==='b'?buildBoss(info.k):info.kind==='n'?buildNpc(info.k,info.t):buildHero(info.k,info.t,info.sk);
    scene.add(model.root);
    v={id:info.i,k:info.k,t:info.t,sk:info.sk,kind:info.kind,model,bar:{el,n:el.querySelector('.n'),h:el.querySelector('.h'),s:el.querySelector('.s'),em:el.querySelector('em')},
      phase:0,attackAnim:0,flash:0,x:0,z:0,f:0,vx:0,vz:0,h:info.mh,s:0,fl:0,dead:false,hid:false,placed:false};
    views.set(info.i,v);
  }
  v.name=info.n;v.mh=info.mh;v.bot=info.b;v.bar.n.textContent=info.n;
  v.bar.el.className=`ub t${info.t}${info.kind!=='h'?' npc':info.b?'':' human'}${info.i===G.you?' mine':''}`;
}
function dropView(v){if(v.bombMesh){scene.remove(v.bombMesh);v.bombMesh.material.dispose()}scene.remove(v.model.root);v.model.root.traverse(o=>{if(o.geometry&&o.geometry!==DISC_GEO)o.geometry.dispose();o.material&&o.material.dispose()});v.bar.el.remove();views.delete(v.id)}
function onRoster(list){
  G.roster=new Map(list.map(u=>[u.i,u]));
  for(const u of list)ensureView(u);
  for(const v of [...views.values()])if(!G.roster.has(v.id))dropView(v);
}
// Únos relikvie: a stand with a beam in each fortress and the two team relics
let flagMeshes=[];
function buildFlags(info){
  for(const f of flagMeshes){scene.remove(f.stand);scene.remove(f.relic)}flagMeshes=[];
  if(info.mode!=='ctf')return;
  const map=MAPS[info.map];
  (map.flags||map.bases).forEach((h,team)=>{const c=TEAM_COL[team];
    const stand=new THREE.Group();stand.position.set(h.x,.08,h.z);
    const ring=new THREE.Mesh(RING_GEO,addMat(c,1.8));ring.rotation.x=-Math.PI/2;ring.scale.setScalar(S.CTF.score);
    const beam=new THREE.Mesh(BEAM_GEO,addMat(c,.7));beam.scale.set(.18,12,.18);beam.position.y=6;stand.add(ring,beam);scene.add(stand);
    const relic=new THREE.Group();relic.add(new THREE.Mesh(new THREE.OctahedronGeometry(.5,0),new THREE.MeshBasicMaterial({color:HDR(c,2.6)})));
    relic.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.85,1),new THREE.MeshBasicMaterial({color:HDR(c,1.4),wireframe:true,transparent:true,opacity:.5})));
    const light=new THREE.PointLight(c,8,12,1.4);relic.add(light);relic.position.set(h.x,1.5,h.z);scene.add(relic);
    flagMeshes.push({team,stand,relic,ring})});
}
function updFlagMeshes(t){
  const fg=G.last?.fg;if(!fg||!flagMeshes.length)return;
  for(const F of flagMeshes){const f=fg[F.team];if(!f)continue;const [st,x,z,car]=f;
    const v=st===1?views.get(car):null;
    if(v&&!v.dead)F.relic.position.set(v.x,3.1+Math.sin(t*4)*.12,v.z);else F.relic.position.set(x,1.5+Math.sin(t*2+F.team)*.15,z);
    F.relic.rotation.y+=.03;F.relic.scale.setScalar(st===2?1+.15*Math.sin(t*8):1);
    F.ring.material.opacity=st===0?.9:.25+.2*Math.sin(t*6)}
}
// Eliminace: a red wall and a line on the floor mark the closing circle
let elimWall=null;
function buildElimWall(info){
  if(elimWall){scene.remove(elimWall.g);for(const m of [elimWall.wall,elimWall.ring]){m.geometry.dispose();m.material.dispose()}elimWall=null}
  if(info.mode!=='elim')return;
  const R=MAPS[info.map].r,g=new THREE.Group();
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,5,128,1,true),addMat(0xff3f5e,.45));wall.position.y=2.5;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.985,1,128),addMat(0xff3f5e,2.2));ring.rotation.x=-Math.PI/2;ring.position.y=.1;
  g.add(wall,ring);g.visible=false;scene.add(g);elimWall={g,wall,ring,R,cur:R};
}
function updElimWall(dt,t){
  if(!elimWall)return;const E=elimWall,r=G.last?.el?G.last.el[2]:E.R;
  E.cur+=(r-E.cur)*Math.min(1,dt*5);E.g.visible=E.cur<E.R-.05&&E.cur>.05;
  E.g.scale.set(E.cur,1,E.cur);E.wall.material.opacity=.7+.3*Math.sin(t*5);
}
const flagText=(f,mine)=>!f?'':f[0]===0?'doma':f[0]===1?`unesena · ${esc(nameOf(f[3]))}`:`leží · vrátí se za ${f[4]} s`;
function setInfo(info){
  G.info=info;setMap(info.map);buildFlags(info);buildElimWall(info);
  for(const m of pointMeshes)scene.remove(m.g);pointMeshes=[];
  if(info.mode==='control')MAPS[info.map].points.forEach((p,i)=>{
    const g=new THREE.Group();g.position.set(p.x,.08,p.z);
    const ring=new THREE.Mesh(RING_GEO,addMat(0xffc66d,1.4));ring.rotation.x=-Math.PI/2;ring.scale.setScalar(4);
    const fill=new THREE.Mesh(DISC_GEO,addMat(0xffffff,.8));fill.rotation.x=-Math.PI/2;fill.material.opacity=.25;
    const col=new THREE.Mesh(BEAM_GEO,addMat(0xffc66d,.6));col.scale.set(.25,10,.25);col.position.y=5;
    g.add(ring,fill,col);scene.add(g);pointMeshes.push({g,ring,fill,col,i})});
}

// ---------- snapshots ----------
function clearWorld(){
  if(G.range){G.range=null;$('#range').hidden=true;$('#hud').classList.remove('tut')}
  for(const v of [...views.values()])dropView(v);
  for(const map of [projMeshes,zoneMeshes,beamMeshes,ringMeshes,lootMeshes]){for(const m of map.values()){scene.remove(m);m.traverse(o=>{o.material&&o.material.dispose()})}map.clear()}
  for(const m of pointMeshes)scene.remove(m.g);pointMeshes=[];
  fxList.forEach(dropFx);fxList=[];parts.length=0;floaters.forEach(f=>f.el.remove());floaters=[];$('#feed').innerHTML='';
  Object.assign(G,{roster:new Map(),snaps:[],last:null,evq:[],stats:[],ended:false,pred:null,show:null,hist:[],pendingCast:[],you:0,slotsFor:'',tut:null});
  tutMarker(null);$('#hud').classList.remove('tut');$('#tut').hidden=true;clearSignals();
  relicMesh.visible=false;relicLight.intensity=0;
}
// Online, everything is placed on the server's clock: snapshots are stamped with server time, and the client keeps an
// estimate of the offset between the server clock and its own. Network jitter then changes only how full the buffer
// is, not where units are drawn. The buffer (delay) grows with measured jitter and shrinks again on a calm connection.
const NET={off:null,jit:0,delay:120};
function clockSample(serverMs){
  const s=serverMs-performance.now();
  if(NET.off==null||s>NET.off+500||s<NET.off-2000){NET.off=s;NET.jit=0;return}
  // the offset follows the fastest arrivals (the upper envelope) and drifts down slowly if the clocks drift
  NET.off=Math.max(s,NET.off-.05);NET.jit+=((NET.off-s)-NET.jit)*.05;
  const want=Math.min(320,Math.max(90,1000/15*1.2+NET.jit*2.2+15));NET.delay+=(want-NET.delay)*(want>NET.delay?.2:.01);
}
function renderTime(){return G.mode==='on'?(NET.off==null?0:performance.now()+NET.off-NET.delay):(G.M?(G.M.time+G.acc)*1000-TICK*1000:0)}
// Server time of the world currently on screen; the server uses it to judge hits where the player saw the targets.
function viewTime(){
  const rt=renderTime(),S=G.snaps;if(!S.length)return 0;
  for(let i=S.length-1;i>0;i--){const a=S[i-1],b=S[i];if(rt>=a.recv)return rt>=b.recv?b.t:a.t+(b.t-a.t)*(rt-a.recv)/(b.recv-a.recv||1)}
  return S[0].t;
}
function syncMap(map,list,make,update){
  const seen=new Set();
  for(const row of list){const id=row[0];seen.add(id);let m=map.get(id);if(!m){m=make(row);scene.add(m);map.set(id,m)}update(m,row)}
  for(const [id,m] of map)if(!seen.has(id)){scene.remove(m);m.traverse(o=>{if(o.geometry&&![BEAM_GEO,BOX_Z,WALL_GEO,DISC_GEO,RING_GEO].includes(o.geometry))o.geometry.dispose();o.material&&o.material.dispose()});map.delete(id)}
}
function ingest(s){
  s.recv=s.t*1000;if(G.mode==='on')clockSample(s.recv);
  s.um=new Map(s.u.map(u=>[u.i,u]));
  G.snaps.push(s);if(G.snaps.length>40)G.snaps.shift();
  G.last=s;
  for(const e of s.ev)G.evq.push({at:s.recv,e});
  if(s.me&&s.me.i!==G.you){G.you=s.me.i;for(const r of G.roster.values())ensureView(r)}
  if(G.mode==='on')reconcile(s);
  syncMap(projMeshes,s.p,([id,x,z,vx,vz,c,sz])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.17*sz,10,8),new THREE.MeshBasicMaterial({color:HDR(c,3.2)}));m.userData.c=c;return m},
    (m,[id,x,z,vx,vz])=>{m.userData.s={x,z,vx,vz,at:s.recv}});
  syncMap(zoneMeshes,s.zn,([id,x,z,r,t,team,c])=>{const m=new THREE.Mesh(new THREE.RingGeometry(.2,r,40,3),addMat(c||0x5dff8a,1.2));m.rotation.x=-Math.PI/2;m.position.set(x,.07,z);m.userData.c=c||0x5dff8a;return m},(m,row)=>{m.userData.t=row[4]});
  syncMap(beamMeshes,s.bm,()=>{const g=new THREE.Group(),core=new THREE.Mesh(BOX_Z,addMat(0x6acbff,2.6)),glow=new THREE.Mesh(BOX_Z,addMat(0x6acbff,.8));g.add(core,glow);g.userData={core,glow};return g},
    (g,[id,x,z,a,len,warm])=>{g.position.set(x,1.3,z);g.rotation.y=a;const {core,glow}=g.userData;
      core.scale.set(warm?.06:.35,warm?.06:.35,len);glow.scale.set(warm?.2:1.1,warm?.2:1.1,len);core.material.color.copy(HDR(warm?0xff3355:0x9fe8ff,warm?1.6:3));glow.material.color.copy(HDR(warm?0xff3355:0x6acbff,.6))});
  syncMap(ringMeshes,s.rg,row=>{const m=new THREE.Mesh(WALL_GEO,addMat(row[4]||0x6acbff,1.4));m.position.y=.7;return m},(m,[id,x,z,r])=>{m.position.x=x;m.position.z=z;m.scale.set(r,1,r)});
  syncMap(lootMeshes,s.lt,([id,x,z,r])=>{const c=RARITIES[r].hex,g=new THREE.Group();g.position.set(x,0,z);
    const col=new THREE.Mesh(BEAM_GEO,addMat(c,1.4));col.scale.set(.12,6,.12);col.position.y=3;
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.35),new THREE.MeshBasicMaterial({color:HDR(c,2.6)}));gem.position.y=1;g.add(col,gem);g.userData.gem=gem;return g},()=>{});
}
function reconcile(s){
  if(G.spec){G.pred=null;G.hist=[];return}
  const me=s.me,mu=me&&s.um.get(me.i),info=me&&G.roster.get(me.i);
  if(!me||!mu||mu.d||mu.hid||(mu.fl&128)||!info||info.kind!=='h'){G.pred=null;G.hist=[];return}
  const p=G.pred||{radius:info.k==='guardian'?.85:.7,dash:null,st:{},mods:{}};
  p.x=me.x;p.z=me.z;p.vx=me.vx;p.vz=me.vz;p.spd=me.spd;p.st={slow:me.ss[0],stun:me.ss[1],cloak:me.ss[2]};
  G.hist=G.hist.filter(h=>h.seq>me.q);
  const map=MAPS[G.info.map];for(const h of G.hist)S.walk(p,h.mx,h.mz,TICK,s.st==='countdown',map);
  if(!G.pred){G.pred=p;G.show={x:p.x,z:p.z}}
}
// death recap: who hit you in the last seconds, split into direct hits, ultimates and damage over time
function showRecap(e){
  const el=$('#recap');if(!el)return;
  const tot=e.src.reduce((s,x)=>s+x.h+x.u+x.d,0);
  if(!tot){el.hidden=true;return}
  const who=x=>x.i?`<b class="t${x.tm}">${esc(x.n)}</b> <small>${x.c?CLASSES[x.c]?.name||'':x.b?'boss':''}</small>`:'<b>Prostředí</b> <small>láva, kruh, cizí základna</small>';
  const killer=e.src.find(x=>x.i===e.k);
  const bar=x=>{const t=x.h+x.u+x.d;return`<i class="rb">${[['h',x.h],['u',x.u],['d',x.d]].filter(([,v])=>v).map(([k,v])=>`<em class="${k}" style="width:${v/tot*100}%"></em>`).join('')}</i>`};
  el.innerHTML=`<div class="lbl">Rozbor smrti · posledních ${S.RECAP_WIN} s</div>
    ${killer?`<p>Dorazil tě ${who(killer)}${e.kh?` · zbylo mu <b>${e.kh[0]}</b> / ${e.kh[1]} HP`:''}</p>`:''}
    ${e.src.map(x=>`<div class="rr"><span>${who(x)}</span>${bar(x)}<b>${x.h+x.u+x.d}</b></div>`).join('')}
    <p class="rl"><span><em class="h"></em>zásahy</span><span><em class="u"></em>ultimátka</span><span><em class="d"></em>v čase</span><span>celkem <b>${tot}</b></span></p>`;
  el.hidden=false;G.recapAt=performance.now();
}
function sample(id,rt){
  const sn=G.snaps;if(!sn.length)return null;
  let i=sn.length-1;while(i>0&&sn[i].recv>rt)i--;
  const a=sn[i].um.get(id),bS=sn[i+1],b=bS&&bS.um.get(id);
  if(!a)return b||null;
  if(!b||a.d||a.hid||b.d||b.hid)return b&&sn[i].recv<rt?b:a;
  const k=Math.max(0,Math.min(1,(rt-sn[i].recv)/((bS.recv-sn[i].recv)||1)));
  // a jump of several metres between two snapshots (a teleport gate) is shown as a jump, not as a slide across the map
  if((b.x-a.x)**2+(b.z-a.z)**2>36)return k<.5?a:b;
  return{...b,x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,f:lerpAng(a.f,b.f,k),vx:b.vx,vz:b.vz};
}

// ---------- events ----------
const nearMe=(e,r=12)=>{const p=myPos();return Math.hypot(e.x-p.x,e.z-p.z)<r};
// sound for a game event; the attract match behind the menu stays silent
const sfx=(name,pos,o)=>{if(G.mode!=='menu')Snd.play(name,pos,o)};
const ui=(name,o={})=>sfx(name,null,{...o,ui:true});
// basic attacks and casts: pitch by class, melee swings, heavier shots for NPCs and bosses; your own are louder
const CLS_F={striker:900,guardian:520,technician:1250,pyro:620};
function atkSound(e,v){
  const mine=e.i===G.you,o={key:e.i,gap:.05,vol:mine?1:.55};
  if(e.s===3)return sfx('ult',v,{...o,f:(CLS_F[v.k]||700)/4,gap:.3,vol:mine?1:.8});
  if(e.s===4)return sfx('tactic',v,o);
  if(e.s>=0)return sfx('cast',v,{...o,f:300+e.s*140+(CLS_F[v.k]||700)/6});
  const B=v.kind==='h'?CLASSES[v.k]?.basic:v.kind==='n'?S.NPCS[v.k]?.basic:null;
  if(v.kind==='b'||B?.type!=='melee'&&v.kind==='n'&&(S.NPCS[v.k]?.radius||0)>1)return sfx('heavyShot',v,{...o,f:v.kind==='b'?260:380});
  sfx(B?.type==='melee'?'swing':'shot',v,{...o,f:(CLS_F[v.k]||700)*(v.kind==='n'?1.25:1)});
}
const EV={
  dmg:e=>{floatText(e,e.a,e.o?'dot':e.s&&e.s===G.you?'out':e.g===G.you?'in':'dmg');burst(e,e.c,e.o?2:6,4,2,.35);
    const v=views.get(e.g);if(v&&!e.o)v.flash=.14;if(e.g===G.you&&!e.o){G.shake=Math.max(G.shake,Math.min(.6,e.a/80));if(e.a>=40)screenFlash(.5)}
    if(!e.o){if(e.g===G.you)ui('hitIn',{gap:.09,vol:Math.min(1,.5+e.a/60)});else if(e.s===G.you)ui('hitOut',{gap:.04,big:e.a>=60,vol:.8});else sfx('hit',e,{gap:.05,vol:.5})}},
  heal:e=>{floatText(e,'+'+e.a,'heal');if(e.g===G.you&&e.a>=8)ui('heal',{gap:.5,vol:.7})},
  txt:e=>floatText(e,e.s,e.c),
  death:e=>{const v=views.get(e.g);if(!v)return;const c=v.kind==='h'?CLASSES[v.k].color:v.kind==='b'?BOSSES[v.k].color:S.NPCS[v.k].color;
    burst(e,c,v.kind==='b'?120:40,v.kind==='b'?14:10,6,1);burst(e,TEAM_COL[v.t],30,8,5,.9);ringFx(e,TEAM_COL[v.t],.5,v.kind==='b'?12:5,.6);
    if(v.kind==='b'){columnFx(e,BOSSES[v.k].color);G.shake=1}if(e.g===G.you){G.shake=Math.max(G.shake,.8);screenFlash(1)}
    if(v.kind==='b')ui('boom',{s:2.2,gap:.2});if(e.g===G.you)ui('died',{dur:1.4});else sfx('death',e,{f:v.kind==='n'?700:460,gap:.04,vol:v.kind==='n'?.55:.85})},
  recap:e=>{if(e.only===G.you)showRecap(e)},
  tp:e=>{const c=0x7df9ff,to={x:e.x,z:e.z};burst({x:e.x0,z:e.z0},c,24,5,5,.6,.3);ringFx({x:e.x0,z:e.z0},c,.3,2.5,.4);burst(to,c,30,5,6,.7,.4);ringFx(to,c,.3,3,.45);
    if(e.g===G.you)ui('warp',{vol:.8});else sfx('warp',to,{gap:.05,vol:.6})},
  spawn:e=>{const v=views.get(e.g);if(!v)return;burst(e,TEAM_COL[v.t]??0xffffff,30,4,6,.8,.4);ringFx(e,TEAM_COL[v.t]??0xffffff,.4,3,.5);if(e.g===G.you)ui('spawn',{vol:.7})},
  feed:e=>{
    if(e.k==='kill'){feed(`${tag(e.a)} zničil ${tag(e.b)}`);if(e.b===G.you)banner('Zničen',`Dostal tě ${nameOf(e.a)}`,2,'var(--red)');
      else if(e.a===G.you){const v=views.get(e.b);if(v)floatText(v,'Zničen','info');ui('kill')}}
    else if(e.k==='field'){feed(`${tag(e.b)} padl`);if(e.b===G.you)banner('Zničen','',2,'var(--red)')}
    // streaks, multi-kills and shutdowns: a line in the feed for everyone, a banner and a sound for the one who did it
    else if(e.k==='multi'||e.k==='streak'){const name=e.k==='multi'?S.MULTI_NAME(e.n):S.STREAKS[e.n];
      feed(`${tag(e.a)} · <span class="g">${esc(name)}</span>${e.k==='streak'?` (${e.n} v řadě)`:''}`);
      if(e.a===G.you){banner(name,e.k==='multi'?`${e.n} soupeři rychle po sobě`:`${e.n} zničení bez pádu`,2,'var(--gold)');ui('streak',{n:e.n,dur:1.2})}}
    else if(e.k==='shut'){feed(`${tag(e.a)} ukončil sérii ${tag(e.b)} (${e.n})`);
      if(e.a===G.you){banner('Konec série',`Zastavil jsi ${nameOf(e.b)} po ${e.n} zničeních`,2,'var(--gold)');ui('streak',{n:2,dur:1})}}
    else if(e.k==='relic'){const r=G.roster.get(e.a),mine=G.roster.get(G.you);feed(`${tag(e.a)} získal <span class="g">relikvii</span>`);
      const v=views.get(e.a);if(v){burst(v,0xffc66d,50,9,7,1);ringFx(v,0xffc66d,.5,6,.7)}
      if(r)banner(e.a===G.you?'Relikvie je tvoje':`${r.n} drží relikvii`,CLASSES[r.k]?.relic||'',2.4,!mine||r.t===mine.t?'var(--gold)':'var(--red)');
      ui(!mine||!r||r.t===mine.t?'relicMine':'relicFoe',{dur:1.2})}
    else if(e.k==='boss'){feed(`<span class="g">${esc(e.n)} poražen</span>`);banner(`${e.n} poražen`,e.a?`Rozhodující zásah: ${nameOf(e.a)}`:'',3,'var(--gold)');ui('relicMine',{dur:1.2})}
  },
  relicUp:()=>{ringFx({x:0,z:0},0xffc66d,.5,6,.8);columnFx({x:0,z:0},0xffc66d);banner('Relikvie se objevila','Střed arény · +1 bod a dočasná síla',2.4);ui('relicUp',{dur:1})},
  atk:e=>{const v=views.get(e.i);if(!v)return;if(e.s===5){v.emote=null;sfx('evade',v,{key:e.i,gap:.05,vol:e.i===G.you?1:.55,k:v.k});return}v.attackAnim=1;atkSound(e,v)},
  arc:e=>arcFx(e,e.f,e.c,e.r),
  slash:e=>slashFx(e,e.f,e.c,e.tl),
  ring:e=>ringFx(e,e.c,e.a,e.b,e.d),
  dome:e=>domeFx(e,e.c,e.r,e.d),
  beam:e=>beamFx(new V3(...e.a),new V3(...e.b),e.c,e.w,e.d),
  bolt:e=>{const a=new V3(...e.a),b=new V3(...e.b);boltFx(a,b,e.c);burst({x:b.x,z:b.z},e.c,14,5,3,.4);sfx('bolt',{x:b.x,z:b.z},{gap:.08})},
  burst:e=>burst(e,e.c,e.n,e.s,e.u,e.l,e.y),
  storm:e=>{columnFx(e,0xffd27a);ringFx(e,0xffb347,.5,3.4,.5);burst(e,0xffe0a0,26,9,6,.6,0);if(nearMe(e,8))G.shake=Math.max(G.shake,.35);sfx('zap',e,{gap:.06});sfx('boom',e,{s:.5,gap:.08,vol:.7})},
  slam:e=>{const r=e.r||8;ringFx(e,0x5dffa8,.5,r,.7);ringFx(e,0xffffff,.5,r*.75,.5);discFx(e,0x5dffa8,r,.4);burst(e,0x8dffc0,60,14,5,.8,0);if(nearMe(e,r+4))G.shake=Math.max(G.shake,.6);sfx('boom',e,{s:r/6,gap:.08,range:60})},
  blast:e=>{const r=e.r||4;ringFx(e,e.c,.4,r,.6);ringFx(e,0xffffff,.3,r*.7,.4);discFx(e,e.c,r,.45);burst(e,e.c,Math.min(120,20+r*8),r*1.6,5,.8,0);if(nearMe(e,r+3))G.shake=Math.max(G.shake,Math.min(1,.3+r/20));sfx('boom',e,{s:r/5,gap:.06,range:50})},
  emp:e=>{const r=e.r||4.5;ringFx(e,0x6acbff,.4,r,.45);ringFx(e,0xc9a0ff,.4,r*.66,.35);burst(e,0x9fd8ff,30,8,3,.5,0);sfx('zap',e,{gap:.06})},
  tele:e=>{teleFx(e);sfx('warn',e,{gap:.4,range:60})},
  rupture:e=>{ringFx(e,0xff9c5b,1,60,1.2);ringFx(e,0xff3355,1,40,.9);columnFx(e,0xff9c5b);burst(e,0xffb38a,150,22,8,1.2,1);G.shake=1;screenFlash(.9);ui('boom',{s:3})},
  ban:e=>{banner(e.ti,e.sub||G.roster.get(e.i)?.n||'',e.d,e.col);ui('warn',{gap:.5,vol:.8})},
  wave:e=>{banner(e.b?`Vlna ${e.w} · boss`:`Vlna ${e.w}`,e.b?'Přichází boss s doprovodem':'Nepřátelé přicházejí z okraje arény',2.2,e.b?'var(--red)':'var(--gold)');ui('wave',{b:e.b,dur:1.2})},
  waveClear:e=>{banner(`Vlna ${e.w} zvládnuta`,e.w%5===0?'Bonusový život pro tým':'Krátká pauza, doplň síly na základně',2,'var(--green)');ui('clear',{dur:1})},
  point:e=>{const L='ABC'[e.i];feed(e.o<0?`Bod ${L} je neutrální`:`<span class="t${e.o}">${TEAM_NAME[e.o]}</span> obsadili bod ${L}`);if(e.o>=0)ui('point',{mine:e.o===(G.roster.get(G.you)?.t??0)})},
  sig:e=>onSignal(e),
  round:e=>{const my=G.roster.get(G.you)?.t??0;
    if(e.w<0){banner(`Kolo ${e.n} · remíza`,'Oba týmy padly zároveň, bod nikdo nezíská',2.4,'var(--gold)');ui('warn',{gap:.5})}
    else{banner(e.w===my?`Kolo ${e.n} je vaše`:`Kolo ${e.n} pro soupeře`,`${TEAM_NAME[e.w]} zůstali stát`,2.4,e.w===my?'var(--gold)':'var(--red)');ui(e.w===my?'win':'lose',{dur:1.6})}
    feed(e.w<0?`Kolo ${e.n}: remíza`:`Kolo ${e.n}: <span class="t${e.w}">${TEAM_NAME[e.w]}</span>`)},
  flag:e=>{const my=G.roster.get(G.you)?.t??0,ours=e.team===my,who=tag(e.u);
    if(e.k==='take'){feed(`${who} unesl ${ours?'vaši':'soupeřovu'} relikvii`);banner(ours?'Vaše relikvie je unesena!':'Relikvie je vaše, neste ji domů!',ours?`Nese ji ${nameOf(e.u)}`:`Nese ji ${nameOf(e.u)}`,2.2,ours?'var(--red)':'var(--gold)');ui(ours?'relicFoe':'relicMine',{dur:1.2})}
    else if(e.k==='cap'){feed(`${who} donesl relikvii · <span class="g">bod</span>`);banner(ours?'Soupeř bodoval':'Únos! +1 bod',`${nameOf(e.u)} donesl relikvii`,2.6,ours?'var(--red)':'var(--gold)');ui(ours?'lose':'win',{dur:2})}
    else if(e.k==='drop'){feed(`${ours?'Vaše':'Soupeřova'} relikvie leží na zemi`);ui('warn',{gap:.5,vol:.6})}
    else if(e.k==='return'){feed(`${ours?'Vaše':'Soupeřova'} relikvie je zpět doma${e.u?' · vrátil '+who:''}`);ui('clear',{vol:.6,dur:1})}},
  loot:e=>{const R=RARITIES[e.r];floatText({x:e.x,y:2.2,z:e.z},e.n,'loot',R.color);feed(`Kořist: <span style="color:${R.color}">${esc(e.n)}</span>`);burst(e,R.hex,30,4,6,.8,1);sfx('loot',e,{r:e.r,gap:.1})}
};
function playEvents(rt){
  while(G.evq.length&&G.evq[0].at<=rt){const {e}=G.evq.shift();const h=EV[e.t];if(h)try{h(e)}catch(err){console.warn(err)}}
}

// ---------- input ----------
const keys={};let mouseDown=false,touchAtk=false;
const ndc=new THREE.Vector2(),ray=new THREE.Raycaster(),groundPlane=new THREE.Plane(new V3(0,1,0),0),mouseWorld=new V3();
const canvas=renderer.domElement;
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1)});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){isTouch=true;applyTouch();return}if(e.button===0)mouseDown=true;ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1)});
addEventListener('pointerup',e=>{if(e.button===0)mouseDown=false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
const inGame=()=>(G.mode==='off'||G.mode==='on')&&!G.ended;
addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(e.code===Cfg.key('score')&&inGame()){e.preventDefault();$('#board').hidden=false;$('#board .inner').innerHTML=boardHTML(currentStats());return}
  if(e.code==='Escape'&&inGame()){setPause(!G.paused);return}
  if((e.code==='Enter'||e.code==='NumpadEnter')&&inGame()&&G.mode==='on'&&!G.solo&&!G.paused){
    e.preventDefault();for(const k in keys)keys[k]=false;mouseDown=false;Social.openMatchChat(e.shiftKey);return}
  if(G.spec&&inGame()&&!G.paused&&!e.repeat&&(e.code==='KeyQ'||e.code==='KeyE')){e.preventDefault();specSwitch(e.code==='KeyQ'?-1:1);return}
  // quick messages: the wheel opens with its key, numbers pick a message
  if(inGame()&&!G.paused&&!e.repeat&&!G.spec){
    if(!$('#wheel').hidden&&/^(Digit|Numpad)[0-9]$/.test(e.code)){e.preventDefault();sendSignal(WHEEL[(+e.code.slice(-1)+9)%10]);toggleWheel(false);return}
    if(e.code===Cfg.key('wheel')){e.preventDefault();toggleWheel();return}
    if(e.code===Cfg.key('ping')){e.preventDefault();sendSignal(e.altKey?'danger':'here',aimPoint());return}
  }
  keys[e.code]=true;
  if(!inGame()||G.paused||e.repeat)return;
  const cast=CAST_KEYS.findIndex(a=>Cfg.key(a)===e.code);
  if(cast>=0){e.preventDefault();G.pendingCast.push(cast)}
});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code===Cfg.key('score'))$('#board').hidden=true});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseDown=false;if(G.mode==='off'&&!G.ended)setPause(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.mode==='off'&&!G.ended)setPause(true)});
const touch={x:0,y:0,id:null},stick=$('#stick'),knob=stick.firstElementChild;
function moveStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy),m=r.width/2-10;if(l>m){dx*=m/l;dy*=m/l}
  touch.x=dx/m;touch.y=dy/m;knob.style.transform=`translate(${dx}px,${dy}px)`}
stick.addEventListener('pointerdown',e=>{touch.id=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});
stick.addEventListener('pointermove',e=>{if(e.pointerId===touch.id)moveStick(e)});
const endStick=e=>{if(e.pointerId!==touch.id)return;touch.id=null;touch.x=touch.y=0;knob.style.transform=''};
stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
const atkBtn=$('#tAtk');atkBtn.addEventListener('pointerdown',e=>{touchAtk=true;atkBtn.setPointerCapture(e.pointerId)});
['pointerup','pointercancel'].forEach(n=>atkBtn.addEventListener(n,()=>touchAtk=false));
function applyTouch(){document.body.classList.toggle('touch',isTouch);$('#touch').hidden=!isTouch}
function myPos(){if(G.show)return G.show;const v=views.get(G.you);return v||{x:0,z:0,f:0}}
// Eliminace: once you fall, the camera follows a teammate who is still standing until the round ends
function camFocus(){
  const me=views.get(G.you);if(G.info.mode!=='elim'||!me||!me.dead){G.watchMate=0;return myPos()}
  let v=views.get(G.watchMate);
  if(!v||v.dead||v.t!==me.t){v=[...views.values()].find(x=>x.kind==='h'&&x.t===me.t&&!x.dead&&x.id!==G.you);G.watchMate=v?.id||0}
  return v||myPos();
}
function autoAim(){const me=myPos(),mine=G.roster.get(G.you);let best=null,bd=20;
  for(const v of views.values()){if(!mine||v.t===mine.t||v.dead||v.hid)continue;const d=Math.hypot(v.x-me.x,v.z-me.z);if(d<bd){bd=d;best=v}}
  const f=views.get(G.you)?.f||0;return best?{x:best.x,z:best.z}:{x:me.x+Math.sin(f)*6,z:me.z+Math.cos(f)*6}}
const aimPoint=()=>isTouch?autoAim():{x:mouseWorld.x,z:mouseWorld.z};
function inputTick(){
  if(!G.you||G.spec)return;
  let mx=0,mz=0;
  if(!G.paused){
    const K=a=>keys[Cfg.key(a)];
    if(K('up')||keys.ArrowUp)mz-=1;if(K('down')||keys.ArrowDown)mz+=1;if(K('left')||keys.ArrowLeft)mx-=1;if(K('right')||keys.ArrowRight)mx+=1;
    if(touch.id!==null){mx=touch.x;mz=touch.y}
  }
  const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l}
  const aim=aimPoint();
  const inp={seq:++G.seq,mx:Math.round(mx*100)/100,mz:Math.round(mz*100)/100,ax:Math.round(aim.x*100)/100,az:Math.round(aim.z*100)/100,
    atk:(mouseDown||touchAtk)&&!G.paused,fm:isTouch&&!touchAtk,cast:G.pendingCast.splice(0)};
  if(G.mode==='off'){const u=G.M.units.find(x=>x.id===G.you);if(u)S.queueInput(u,inp)}
  else if(G.mode==='on'){
    wsSend({type:'input',...inp,vt:Math.round(viewTime()*100)/100});
    if(G.pred){S.walk(G.pred,inp.mx,inp.mz,TICK,G.last?.st==='countdown',MAPS[G.info.map]);G.hist.push({seq:inp.seq,mx:inp.mx,mz:inp.mz});if(G.hist.length>120)G.hist.shift()}
  }
}

// ---------- local matches (training without a server, and the menu background) ----------
function newLocalMatch(o,humanClass){
  clearWorld();
  const M=S.createMatch(o),names=[...S.BOT_NAMES].sort(()=>Math.random()-.5),pvp=M.D.pvp;let you=0;
  for(const team of pvp?[0,1]:[0]){const used=[];
    if(team===0&&humanClass){you=S.addUnit(M,humanClass,0,'human',o.name||'Ty').id;used.push(humanClass)}
    while(used.length<S.teamSize(M.mode)){const free=S.CLASS_KEYS.filter(x=>!used.includes(x)),pool=free.length?free:S.CLASS_KEYS,k=pool[Math.floor(Math.random()*pool.length)];used.push(k);S.addUnit(M,k,team,'bot',names.pop())}}
  S.startMatch(M);
  G.M=M;G.acc=0;G.you=you;G.rosterVer=M.rosterVer;setInfo(S.matchInfo(M));onRoster(S.roster(M));
  return M;
}
function startAttract(){
  G.mode='menu';G.solo=false;
  const maps=['core','forge','archive'],M=newLocalMatch({mode:'arena',map:maps[Math.floor(Math.random()*maps.length)]},null);M.state='play';
}
function startLocal(o){
  G.lastOpts={...o,local:true};G.mode='off';G.paused=false;newLocalMatch(o,o.cls);
  showOnly('hud');applyTouch();buildSlots();$('#netInfo').textContent='Trénink bez serveru';
}
// ---------- tutorial ----------
// A guided local match on the arena map: each step sets up the situation, watches the simulation and moves on.
const kbd=(...a)=>a.map(x=>`<kbd>${esc(Cfg.keyLabel(Cfg.key(x)))}</kbd>`).join(' ');
const TUT_STEPS=[
  {k:'move',ti:'Pohyb',tx:()=>isTouch?'Levým palcem dojdi do zlatého kruhu.':`Klávesami ${kbd('up','left','down','right')} dojdi do zlatého kruhu.`},
  {k:'attack',ti:'Útok',tx:()=>isTouch?'Tlačítkem Útok zaútoč na cvičný dron. Míří se samo na nejbližšího soupeře.':'Miř <kbd>myší</kbd> a <kbd>levým tlačítkem</kbd> znič cvičný dron.'},
  {k:'skills',ti:'Schopnosti',tx:()=>`Použij všechny tři schopnosti ${isTouch?'tlačítky vpravo':kbd('q','e','r')}. Stojí energii (fialový pruh) a pak se chvíli nabíjejí.`},
  {k:'ult',ti:'Ultimátka',tx:()=>`Ultimátka se nabíjí bojem. Teď ji máš nabitou: odpal ji ${isTouch?'zlatým tlačítkem':'klávesou '+kbd('ult')}.`},
  {k:'tactic',ti:'Taktická akce',tx:()=>`Taktická akce nestojí energii. Výchozí je Úhyb: rychlý skok s krátkou nezranitelností. Použij ji ${isTouch?'modrým tlačítkem':'klávesou '+kbd('tac')}. Navíc máš vždy po ruce úskok ${isTouch?'(fialové tlačítko)':kbd('evade')} s krátkým čekáním, jiný pro každé povolání.`},
  {k:'base',ti:'Základna',tx:()=>'Jsi zraněný. Vrať se na svou základnu (modrý kruh na okraji arény): léčí a dobíjí energii.'},
  {k:'relic',ti:'Relikvie',tx:()=>'Ve středu arény se objevila relikvie. Seber ji: týmu dá bod a tobě na 20 s sílu podle povolání.'}
];
let tutMark=null;
function tutMarker(x,z){
  if(tutMark){scene.remove(tutMark);tutMark.traverse(o=>o.material&&o.material.dispose());tutMark=null}
  if(x==null)return;
  const g=new THREE.Group(),ring=new THREE.Mesh(RING_GEO,addMat(0xffc66d,2)),col=new THREE.Mesh(BEAM_GEO,addMat(0xffc66d,1));
  ring.rotation.x=-Math.PI/2;ring.scale.setScalar(2.4);col.scale.set(.08,7,.08);col.position.y=3.5;g.add(ring,col);g.position.set(x,.1,z);scene.add(g);tutMark=g;
}
function startTutorial(o){
  G.lastOpts=null;G.mode='off';G.paused=false;clearWorld();
  const M=S.createMatch({mode:'arena',map:'core',diff:'easy'});M.timeLeft=1e9;M.countdown=.6;M.relic.state='off';
  const you=S.addUnit(M,o.cls,0,'human',o.name||'Ty').id;S.startMatch(M);
  G.M=M;G.acc=0;G.you=you;G.rosterVer=M.rosterVer;setInfo(S.matchInfo(M));onRoster(S.roster(M));
  G.tut={i:-1,used:new Set(),drones:[],hold:0,acct:!!o.account};
  showOnly('hud');$('#hud').classList.add('tut');applyTouch();buildSlots();$('#netInfo').textContent='Výcvik';
  tutNext();
}
const tutMe=()=>G.M?.units.find(u=>u.id===G.you);
function tutNext(){
  const T=G.tut;T.i++;T.used=new Set();T.hold=0;const me=tutMe(),M=G.M,base=M.map.bases[0];
  if(T.i>=TUT_STEPS.length)return tutFinish();
  const k=TUT_STEPS[T.i].k;tutMarker(null);
  if(k==='move'){T.goal={x:base.x*.55,z:base.z*.55+6};tutMarker(T.goal.x,T.goal.z)}
  if(k==='attack')T.drones=[S.addTrainingNpc(M,'drone',me.x+Math.sign(-base.x||1)*9,me.z,.5,.15)];
  if(k==='skills'){me.energy=100;T.drones=[-5,0,5].map(dz=>S.addTrainingNpc(M,'drone',me.x+Math.sign(-base.x||1)*8,me.z+dz,1.5,.15))}
  if(k==='ult'){me.ult=100;if(!T.drones.some(d=>!d.dead))T.drones=[S.addTrainingNpc(M,'drone',me.x+Math.sign(-base.x||1)*7,me.z,1,.15)]}
  if(k==='base'){for(const d of M.units)if(d.kind==='npc')d.remove=true;me.hp=Math.round(me.maxHp*.35);tutMarker(base.x,base.z)}
  if(k==='relic'){M.relic.state='wait';M.relic.t=.4;tutMarker(0,0)}
  tutUI();
}
function tutUI(){
  const T=G.tut,el=$('#tut');if(!T){el.hidden=true;return}
  const s=TUT_STEPS[T.i],extra=s.k==='skills'?` <b>${[0,1,2].filter(i=>T.used.has(i)).length} / 3</b>`:'';
  el.hidden=false;el.innerHTML=`<div class="tutp">${TUT_STEPS.map((_,i)=>`<i class="${i<T.i?'d':i===T.i?'c':''}"></i>`).join('')}</div>
    <small>VÝCVIK · KROK ${T.i+1} / ${TUT_STEPS.length}</small><b>${s.ti}</b><p>${s.tx()}${extra}</p><button class="ghost sm" type="button" id="tutSkip">Ukončit výcvik</button>`;
  $('#tutSkip').onclick=()=>{G.tut=null;tutMarker(null);$('#hud').classList.remove('tut');tutUI();toHub()};
}
// called every simulation tick with that tick's events
function tutTick(ev){
  const T=G.tut;if(!T||T.i<0||T.i>=TUT_STEPS.length)return;
  const me=tutMe(),k=TUT_STEPS[T.i].k;if(!me)return;
  for(const e of ev)if(e.t==='atk'&&e.i===G.you&&e.s!=null)T.used.add(e.s);
  let done=false;
  if(k==='move')done=Math.hypot(me.x-T.goal.x,me.z-T.goal.z)<2.6;
  if(k==='attack')done=T.drones.every(d=>d.dead||d.remove||!G.M.units.includes(d));
  if(k==='skills'){const n=[0,1,2].filter(i=>T.used.has(i)).length;if(n!==T.shown){T.shown=n;tutUI()}done=n>=3;if(me.energy<30)me.energy=60}
  if(k==='ult')done=T.used.has(3);
  if(k==='tactic')done=T.used.has(4);
  if(k==='base')done=me.hp>=me.maxHp*.95;
  if(k==='relic')done=me.relics>0;
  // a short pause after each success so the player sees it worked
  if(done){T.hold+=TICK;if(T.hold>=.6){Snd.play('clear',null,{ui:true,vol:.7,dur:1});tutNext()}}
}
function tutFinish(){
  const T=G.tut;tutMarker(null);G.tut=null;$('#hud').classList.remove('tut');
  const el=$('#tut');el.hidden=false;
  el.innerHTML=`<small>VÝCVIK DOKONČEN</small><b>Jsi připraven do arény</b><p>${T.acct?'Za dokončení dostáváš 300 kreditů a implantát.':'S účtem bys za dokončení dostal 300 kreditů a implantát.'} Další tipy: <kbd>Tab</kbd> ukáže skóre, implantáty a strom dovedností najdeš v hubu.</p>
    <div class="btns"><button class="go sm" type="button" id="tutEnd">Do hubu</button></div>`;
  Snd.play('win',null,{ui:true,dur:2.5});
  if(T.acct)Hub.tutorialDone();
  $('#tutEnd').onclick=()=>{el.hidden=true;toHub()};
}

// ---------- shooting range ----------
// A local match without a server: the player's own build (with an account: implants, tree, profession, mastery)
// against targets that never fight back, with a damage meter. Three targets stand still, one circles.
// open ground of Neonové jádro: the player starts west of the middle, targets stand east of it
const RANGE_START={x:-6,z:0},RANGE_SPOTS=[{x:3,z:-5},{x:5,z:0},{x:3,z:5}],RANGE_ORBIT={x:8,z:0,r:5,w:.6},DPS_WIN=5;
function startRange(o){
  G.lastOpts=null;G.mode='off';G.paused=false;G.tut=null;clearWorld();
  const M=S.createMatch({mode:'arena',map:'core',diff:'normal'});M.timeLeft=1e9;M.countdown=.6;M.relic.state='off';
  const prof=Hub.profile(),load=prof?S.computeLoadout(prof,o.cls):null;
  const me=S.addUnit(M,o.cls,0,'human',o.name||'Ty',load);S.startMatch(M);me.x=RANGE_START.x;me.z=RANGE_START.z;
  const targets=[...RANGE_SPOTS,{x:RANGE_ORBIT.x+RANGE_ORBIT.r,z:0}].map(p=>{const d=S.addTrainingNpc(M,'dummy',p.x,p.z,20,0);d.home=p;return d});
  targets[3].orbit=true;
  G.M=M;G.acc=0;G.you=me.id;G.rosterVer=M.rosterVer;setInfo(S.matchInfo(M));onRoster(S.roster(M));
  G.range={targets,hits:[],total:0,max:0,t0:0,free:false,load:!!load};
  showOnly('hud');$('#hud').classList.add('tut');applyTouch();buildSlots();$('#netInfo').textContent='Střelnice';
  rangeUI();
}
function rangeUI(){
  const R=G.range,el=$('#range');if(!R){el.hidden=true;return}
  el.hidden=false;el.innerHTML=`<small>STŘELNICE</small>
    <div class="rgrid"><span>DPS (${DPS_WIN} s)</span><b id="rDps">0</b><span>Celkem</span><b id="rTot">0</b><span>Největší zásah</span><b id="rMax">0</b><span>Čas</span><b id="rTime">0 s</b></div>
    <p>${R.load?'Hraješ se svou sestavou: implantáty, strom, profese a mistrovství.':'Bez účtu hraješ se základním hrdinou.'} Terče nevrací úder a nedají se zničit.</p>
    <div class="btns"><button class="ghost sm" type="button" data-r="reset">Vynulovat</button><button class="ghost sm" type="button" data-r="free" aria-pressed="${R.free}">Bez čekání</button>
    <button class="ghost sm" type="button" data-r="ult">Nabít ultimátku</button><button class="ghost sm" type="button" data-r="end">Konec</button></div>`;
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const k=b.dataset.r,me=G.M?.units.find(u=>u.id===G.you);
    if(k==='reset'){R.hits=[];R.total=0;R.max=0;R.t0=G.M.time}
    else if(k==='free'){R.free=!R.free;b.setAttribute('aria-pressed',R.free)}
    else if(k==='ult'&&me)me.ult=100;
    else if(k==='end'){G.range=null;rangeUI();$('#hud').classList.remove('tut');toHub();return}
    b.blur()});
}
// called every simulation tick with that tick's events
function rangeTick(ev){
  const R=G.range,M=G.M,me=M.units.find(u=>u.id===G.you);if(!me)return;
  for(const e of ev)if(e.t==='dmg'&&e.s===G.you&&R.targets.some(d=>d.id===e.g)){R.hits.push({t:M.time,a:e.a});R.total+=e.a;R.max=Math.max(R.max,e.a)}
  while(R.hits.length&&M.time-R.hits[0].t>DPS_WIN)R.hits.shift();
  // targets stay put (the orbiting one moves on its circle) and never fall; the player cannot be hurt
  for(const d of R.targets){d.hp=d.maxHp;d.dead=false;
    if(d.orbit){const a=M.time*RANGE_ORBIT.w;d.x=RANGE_ORBIT.x+Math.cos(a)*RANGE_ORBIT.r;d.z=Math.sin(a)*RANGE_ORBIT.r}else{d.x=d.home.x;d.z=d.home.z}d.vx=d.vz=0}
  me.hp=me.maxHp;if(me.dead){me.dead=false;me.respawn=0}
  if(R.free){me.cds=[0,0,0];me.energy=100;me.tcd=0}
  if(((M.time*30)|0)%6===0){const span=Math.min(DPS_WIN,Math.max(.5,M.time-Math.max(R.t0,R.hits[0]?.t??M.time)));
    setTxt('rDps',R.hits.length?Math.round(R.hits.reduce((s,h)=>s+h.a,0)/span):0);setTxt('rTot',R.total);setTxt('rMax',R.max);setTxt('rTime',Math.round(M.time-R.t0)+' s')}
}
function stepLocal(dt){
  if(!G.M||G.paused||G.ended)return;
  G.acc+=Math.min(dt,.1);
  while(G.acc>=TICK){G.acc-=TICK;
    if(G.mode==='off')inputTick();
    S.step(G.M);
    if(G.M.rosterVer!==G.rosterVer){G.rosterVer=G.M.rosterVer;onRoster(S.roster(G.M))}
    const ev=G.M.events;G.M.events=[];if(G.tut)tutTick(ev);if(G.range)rangeTick(ev);ingest(S.snapshotFor(G.M,G.you,ev));
    if(G.M.state==='end'){
      if(G.mode==='menu'){startAttract();return}
      showEnd({winner:G.M.winner,score:G.M.score,stats:S.stats(G.M),wave:G.M.wave,mode:G.M.mode,log:G.M.log});Hub.showRewards({guest:true});return}
  }
}

// ---------- online ----------
function wsSend(m){if(G.ws&&G.ws.readyState===1)G.ws.send(JSON.stringify(m))}
function closeWs(){if(G.ws){const ws=G.ws;G.ws=null;try{ws.send(JSON.stringify({type:'leave'}))}catch{}try{ws.close()}catch{}}clearInterval(G.pingT);stopResume()}
// drops the socket without leaving the room, so the server keeps the seat for a comeback
function dropWs(){const ws=G.ws;G.ws=null;clearInterval(G.pingT);if(ws){ws.onclose=null;try{ws.close()}catch{}}}
// ---------- coming back after a dropped connection ----------
// The server holds the seat of a dropped player for a minute (a bot plays the hero meanwhile). The client retries with
// the rejoin key from the lobby message, also after a reload of the tab. A socket that stays silent for 5 s in a match
// counts as dropped too: after a switch from Wi-Fi to mobile data the browser often notices the dead connection late.
const REJOIN_KEY='relikvie.rejoin',REJOIN_MS=60000;
const R={key:null,until:0,tries:0,timer:0};
function saveRejoin(k){R.key=k;try{k?sessionStorage.setItem(REJOIN_KEY,JSON.stringify({...k,t:Date.now()})):sessionStorage.removeItem(REJOIN_KEY)}catch{}}
function reconBar(text){let el=$('#reconBar');if(!el){el=document.createElement('div');el.id='reconBar';el.setAttribute('role','status');document.body.append(el)}el.hidden=!text;el.textContent=text||''}
function stopResume(){R.until=0;R.tries=0;clearTimeout(R.timer);reconBar('')}
function netLost(){
  if(!R.key||G.ended||G.spec)return false;
  if(!R.until)R.until=Date.now()+REJOIN_MS;tryResume();return true;
}
function tryResume(){
  clearTimeout(R.timer);
  if(Date.now()>R.until)return giveUp('Spojení se nepodařilo obnovit. Za tvou postavu dohraje bot.');
  R.tries++;reconBar(`Spojení přerušeno · obnovuji… (pokus ${R.tries})`);
  connect({type:'resume',code:R.key.code,rk:R.key.rk},true);
}
function giveUp(msg){
  // after a reload the hub is still on screen: only a note, no jump
  if(G.mode!=='on'&&$('#lobby').hidden){closeWs();saveRejoin(null);Hub.toast(msg,true);return}
  saveRejoin(null);toHub();Hub.netError(msg);
}
function resumeAfterReload(){
  let k=null;try{k=JSON.parse(sessionStorage.getItem(REJOIN_KEY)||'null')}catch{}
  if(!k||!k.code||!k.rk||Date.now()-k.t>REJOIN_MS||G.ws)return;
  R.key={code:k.code,rk:k.rk};R.until=Date.now()+15000;tryResume();
}
function connect(hello,resuming){
  Hub.netError('');if(resuming)dropWs();else closeWs();NET.off=null;NET.delay=120;NET.jit=0;
  let ws;
  try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws')}
  catch{Hub.netError('Online hra běží jen ze spuštěného serveru Relikvie Aréna.');return}
  G.ws=ws;
  ws.onopen=()=>{ws.send(JSON.stringify({...hello,token:Hub.token()}));G.lastMsg=performance.now();
    G.pingT=setInterval(()=>{wsSend({type:'ping',t:performance.now()});
      if(G.ws===ws&&G.mode==='on'&&!G.ended&&performance.now()-G.lastMsg>5000){dropWs();if(!netLost()){toHub();Hub.netError('Spojení se serverem se přerušilo.')}}},2000)};
  ws.onmessage=ev=>{G.lastMsg=performance.now();let m;try{m=JSON.parse(ev.data)}catch{return}onNet(m)};
  ws.onclose=()=>{clearInterval(G.pingT);if(G.ws!==ws)return;G.ws=null;
    if(R.until){R.timer=setTimeout(tryResume,Math.min(4000,600*R.tries));return}
    if(G.mode==='on'&&netLost())return;
    if(G.mode==='on'||!$('#lobby').hidden){toHub();Hub.netError('Spojení se serverem se přerušilo.')}
    else Hub.netError('Nepodařilo se připojit k serveru.')};
}
function onNet(m){
  switch(m.type){
    case 'error':Hub.netError(m.msg);if(!$('#lobby').hidden)Hub.toast(m.msg,true);if(G.mode!=='on'&&$('#lobby').hidden)closeWs();break;
    case 'lobby':
      G.lobby=m;G.solo=m.solo;Social.roomReset(m.solo?null:m.code);
      if(G.challenge&&m.state==='lobby'&&m.host===m.you){const fid=G.challenge;G.challenge=null;wsSend({type:'cfg',rules:{bots:false}});Social.invite(fid)}
      saveRejoin(m.state==='match'&&m.rk&&!G.ended?{code:m.code,rk:m.rk}:null);
      if(R.until){stopResume();Hub.toast('Spojení obnoveno, jsi zpět ve hře.')}
      if(!m.solo){try{history.replaceState(null,'','?room='+m.code)}catch{}}
      if(m.state==='match'){if(G.mode!=='on')enterOnlineMatch()}
      else if(m.solo){if(G.ended)closeWs()}
      else{if(G.mode==='on')startAttract();G.ended=false;showOnly('lobby');renderLobby()}
      break;
    case 'roster':if(G.mode!=='on')enterOnlineMatch();if(m.info&&(m.info.map!==G.info.map||m.info.mode!==G.info.mode||!pointMeshes.length&&m.info.mode==='control'))setInfo(m.info);G.info=m.info||G.info;onRoster(m.units);break;
    case 's':if(G.mode==='on')ingest(m);break;
    case 'specStart':{const first=!G.spec;G.spec=m;if(G.mode!=='on'){enterOnlineMatch();G.spec=m}if(first)Hub.toast('Sledování zápasu · Q/E přepíná hráče, Esc menu');renderSpecBar();break}
    case 'specEnd':{const msg=m.msg;toHub();Hub.toast(msg||'Sledování skončilo.');break}
    case 'stats':G.stats=m.stats;break;
    case 'end':saveRejoin(null);showEnd(m);Hub.showRewards(null);break;
    case 'resumeFail':giveUp(m.msg);break;
    case 'rewards':Hub.showRewards(m);if(m.profile)Hub.setProfile(m.profile);if(m.levelUps?.length||m.achNew?.length)setTimeout(()=>Snd.play('levelUp',null,{ui:true}),1400);break;
    case 'chat':Social.roomMsg(m);break;
    case 'chatHist':Social.roomHist(m.list||[]);break;
    case 'pong':G.ping=Math.round(performance.now()-m.t);$('#netInfo').textContent=`online · ping ${G.ping} ms · výkyvy ${Math.round(NET.jit)} ms`;break;
  }
}
function enterOnlineMatch(){
  clearWorld();G.M=null;G.mode='on';G.paused=false;G.inAcc=0;G.ended=false;
  showOnly('hud');applyTouch();
}
const hostOpts=o=>({mode:o.mode,map:o.map,boss:o.boss,diff:o.diff,cls:o.cls,name:o.name,pub:!!o.pub});
const hubCallbacks={
  showOnly:id=>showOnly(id),isTouch:()=>isTouch,
  preview:(cv,k,sk)=>setPreview(cv,k,sk),
  local:o=>startLocal(o),
  solo:o=>{G.lastOpts={...o,solo:true};connect({type:'hello',...hostOpts(o),create:true,solo:true})},
  mission:(id,o)=>{if(o.solo)G.lastOpts={...o,mission:id};connect({type:'hello',mission:id,diff:o.diff,cls:o.cls,name:o.name,create:true,solo:!!o.solo})},
  create:o=>connect({type:'hello',...hostOpts(o),create:true}),
  join:(code,o)=>connect({type:'hello',cls:o.cls,name:o.name,room:code}),
  quick:o=>connect({type:'hello',quick:true,mode:o.mode,diff:o.diff,cls:o.cls,name:o.name}),
  ranked:(mode,o)=>connect({type:'hello',ranked:true,mode,cls:o.cls,name:o.name}),
  tutorial:o=>{closeWs();startTutorial(o)},
  // challenge a friend: a private Souboj room without bots; the invite goes out as soon as the room exists
  challenge:(fid,o)=>{G.challenge=fid;connect({type:'hello',create:true,mode:'duel',map:'archive',diff:'normal',cls:o.cls,name:o.name})},
  range:o=>{closeWs();startRange(o)},
  spectate:pid=>connect({type:'spectate',friend:pid})
};
const mutatorsText=()=>'Tento týden: '+S.mutatorsOfWeek().map(k=>`<b>${S.MUTATORS[k].name}</b> (${S.MUTATORS[k].desc.toLowerCase().replace(/\.$/,'')})`).join(' a ')+'.';
// custom rules of a created room: score to win and match length (PvP) and filling empty seats with bots
function rulesHTML(L,seg){
  const r=L.rules,pvp=MODES[L.mode].pvp,v=k=>S.ruleValues(L.mode,{[k]:'short'}),n=S.ruleValues(L.mode,{}),l=k=>S.ruleValues(L.mode,{[k]:'long'});
  const min=s=>`${Math.round(s/60*2)/2} min`.replace('.',',');
  return `<div class="lbl" style="margin-top:4px">Pravidla</div>
    ${pvp?`<div class="rrow"><small>Cíl</small>${seg('lWin',[['short',`Kratší · ${v('win').win}`],['std',`Normální · ${n.win}`],['long',`Delší · ${l('win').win}`]],r.win)}</div>
    <div class="rrow"><small>Délka</small>${seg('lTime',[['short',min(v('time').time)],['std',min(n.time)],['long',min(l('time').time)]],r.time)}</div>`:''}
    <div class="rrow"><small>Boti</small>${seg('lBots',[['1','Doplnit volná místa'],['0','Bez botů']],r.bots?'1':'0')}</div>
    ${S.isCustom(r,L.mode)||!r.bots&&pvp?`<p class="help">${S.isCustom(r,L.mode)?'Vlastní pravidla: odměny se počítají podle skutečné délky zápasu (plné od 4 minut). ':''}${!r.bots&&pvp?'Bez botů musí mít každý tým aspoň jednoho hráče.':''}</p>`:''}`;
}
// quick play: everyone votes for the next map; the leader is highlighted, the winner is picked when the match starts
function voteHTML(L){
  const n=L.vote.counts,max=Math.max(0,...Object.values(n)),total=Object.values(n).reduce((a,b)=>a+b,0);
  return`<div><div class="lbl">Hlasování o mapě${total?` · ${total} ${total===1?'hlas':total<5?'hlasy':'hlasů'}`:''}</div>
    <div class="vote" id="lVote">${Object.keys(n).map(k=>`<button type="button" data-vote="${k}" aria-pressed="${L.vote.mine===k}" class="${max&&n[k]===max?'lead':''}">
      <b>${MAPS[k].name}</b><small>${n[k]} ${n[k]===1?'hlas':n[k]>1&&n[k]<5?'hlasy':'hlasů'}</small><i style="width:${total?n[k]/total*100:0}%"></i></button>`).join('')}</div>
    <p class="help">${L.vote.mine?'Hlas můžeš změnit.':'Klikni na mapu, kterou chceš hrát.'} Vyhraje mapa s nejvíc hlasy, při shodě rozhodne los. Bez hlasů zůstane ${MAPS[L.map].name}.</p></div>`;
}
function renderLobby(){
  const L=G.lobby;if(!L)return;
  const me=L.players.find(p=>p.cid===L.you),host=L.host===L.you,M=MODES[L.mode],pvp=M.pvp;
  $('#lobbyCode').textContent=L.code;
  const seg=(id,opts,cur)=>`<div class="seg" id="${id}">${opts.map(([k,n])=>`<button type="button" data-v="${k}" aria-pressed="${k===cur}" ${host?'':'disabled'}>${n}</button>`).join('')}</div>`;
  const ms=L.mission==='echo'?{name:'Ozvěna jádra',desc:'Týdenní výzva s modifikátory.'}:L.mission?S.missionById(L.mission):null;
  if(L.ranked){$('#lobbyCfg').innerHTML=`<div style="display:grid;gap:10px"><h2 class="sec">Hodnocená hra · ${esc(M.name)}</h2>
      <p class="help">Mapa ${MAPS[L.map].name}. Týmy se rozdělí podle hodnocení, chybějící místa doplní boti. Hodnocení se počítá, když na každé straně hraje aspoň jeden hráč s účtem. Kdo zápas opustí, prohrává.</p></div>`}
  else if(ms){$('#lobbyCfg').innerHTML=`<div style="display:grid;gap:10px"><h2 class="sec">Kampaň · ${esc(ms.name)}</h2><p class="help">${esc(ms.desc)} Mapa ${MAPS[L.map].name}.</p>
      ${seg('lDiff',[['easy','Lehká'],['normal','Normální'],['hard','Těžká']],L.diff)}<p class="help">Postup v kampani se započítá každému hráči, který má misi odemčenou.</p></div>`;
    document.querySelectorAll('#lDiff button').forEach(b=>b.onclick=()=>wsSend({type:'cfg',diff:b.dataset.v}))}
  else $('#lobbyCfg').innerHTML=`<div style="display:grid;gap:10px">
    ${L.quick?`<div class="lbl" style="margin:0;color:var(--gold);font-size:13px">Rychlá hra · ${esc(M.name)}</div>`:seg('lMode',Object.entries(MODES).map(([k,m])=>[k,m.name]),L.mode)}
    ${L.vote?voteHTML(L):seg('lMap',M.maps.map(k=>[k,MAPS[k].name]),L.map)}
    ${L.mode==='boss'?seg('lBoss',Object.entries(BOSSES).map(([k,b])=>[k,b.name]),L.boss):''}
    ${seg('lDiff',[['easy','Lehká'],['normal','Normální'],['hard','Těžká']],L.diff)}
    ${L.rules?rulesHTML(L,seg):''}
    <p class="help">${M.desc}${M.mutators?' '+mutatorsText():''}${host?'':' Nastavení mění hostitel.'}</p></div>`;
  const cfg=(id,key)=>document.querySelectorAll(`#${id} button`).forEach(b=>b.onclick=()=>wsSend({type:'cfg',[key]:b.dataset.v}));
  const rule=(id,key,val=v=>v)=>document.querySelectorAll(`#${id} button`).forEach(b=>b.onclick=()=>wsSend({type:'cfg',rules:{[key]:val(b.dataset.v)}}));
  document.querySelectorAll('#lVote [data-vote]').forEach(b=>b.onclick=()=>wsSend({type:'vote',map:b.dataset.vote}));
  if(!ms&&!L.ranked){cfg('lMode','mode');cfg('lMap','map');cfg('lBoss','boss');cfg('lDiff','diff');rule('lWin','win');rule('lTime','time');rule('lBots','bots',v=>v==='1')}
  const teams=pvp?[0,1]:[0],size=S.teamSize(L.mode);
  $('#lobbyTeams').className='teams'+(pvp?'':' one');
  $('#lobbyTeams').innerHTML=teams.map(t=>{
    const ps=L.players.filter(p=>pvp?p.team===t:true);
    const rk=p=>p.rt!=null?` <small style="color:${S.DIVISIONS[S.divisionOf(p.rt)].color}">· ${S.DIVISIONS[S.divisionOf(p.rt)].name} ${p.rt}</small>`:'';
    const rows=ps.map(p=>`<div class="pl${p.cid===L.you?' mine':''}"><span>${p.tag?`<span class="cg">[${esc(p.tag)}]</span> `:''}${p.pid?`<button type="button" class="pname" data-prof="${esc(p.pid)}" title="Profil hráče">${esc(p.name)}</button>`:esc(p.name)}${p.lv?` <small>· úr. ${p.lv}</small>`:''}${rk(p)}${p.cid===L.host&&!L.ranked?' <small>· hostitel</small>':''}</span><small>${CLASSES[p.cls].name}</small></div>`).join('');
    const empty=L.ranked?`<span>Volné místo</span><small>${size===1?'čeká se na soupeře':'hráč nebo bot'}</small>`:L.rules?.bots===false?'<span>Volné místo</span><small>bez bota</small>':'<span>Bot</span><small>doplní se</small>';
    const bots=Array.from({length:Math.max(0,size-ps.length)},()=>`<div class="pl bot">${empty}</div>`).join('');
    const canMove=pvp&&!L.ranked&&me&&me.team!==t&&ps.length<size;
    return `<div class="team t${t}"><h3>${pvp?TEAM_NAME[t]:'Tým'}</h3>${rows}${bots}${canMove?`<button class="ghost" type="button" data-team="${t}">Přejít k týmu ${TEAM_NAME[t]}</button>`:''}</div>`}).join('');
  $('#lobbyTeams').querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>wsSend({type:'team',team:+b.dataset.team}));
  $('#lobbyCls').innerHTML=Object.entries(CLASSES).map(([k,c])=>`<button type="button" data-k="${k}" style="--c:${c.css}" aria-pressed="${me&&me.cls===k}">${svg(k)}${c.name}</button>`).join('');
  $('#lobbyCls').querySelectorAll('button').forEach(b=>b.onclick=()=>wsSend({type:'cls',cls:b.dataset.k}));
  Social.lobbyFriends($('#lobbyFriends'),L);
  $('#lobbyStart').hidden=L.ranked?!L.autoIn:!host&&!L.autoIn;
  $('#lobbyWait').textContent=L.ranked&&!L.autoIn?'Hodnocená hra · hledám soupeře. Zápas začne, jakmile se připojí další hráč s účtem.':L.ranked?`Hodnocená hra · soupeř nalezen, zápas začne za ${L.autoIn} s.`:L.autoIn?`Rychlá hra · zápas začne za ${L.autoIn} s, zbytek doplní boti. Spustit ho může kdokoli.`:host?(L.pub?'Veřejná místnost · ':'')+`${L.players.length} / ${M.max} ${L.players.length===1?'hráč':'hráči'} · ${L.rules?.bots===false?'bez botů':'zbytek doplní boti'}`:'Čeká se, až hostitel spustí zápas.';
}
$('#lobbyStart').onclick=()=>wsSend({type:'start'});
$('#lobbyLeave').onclick=()=>toHub();
$('#copyBtn').onclick=async()=>{const url=location.origin+location.pathname+'?room='+(G.lobby?.code||'');
  try{await navigator.clipboard.writeText(url);$('#copyBtn').textContent='Zkopírováno'}catch{$('#copyBtn').textContent=url}
  setTimeout(()=>$('#copyBtn').textContent='Kopírovat pozvánku',2500)};

// ---------- screens ----------
function showOnly(id){for(const k of ['auth','hub','lobby','hud','end','pause'])$('#'+k).hidden=k!==id;$('#board').hidden=true;if(id!=='hub')setPreview(null);Social.screen(id)}
// ---------- spectating ----------
function renderSpecBar(){
  const el=$('#specBar'),S2=G.spec;if(!S2){el.hidden=true;$('#hud').classList.remove('spec');return}
  const h=S2.heroes.find(x=>x.i===S2.target);
  el.hidden=false;$('#hud').classList.add('spec');
  el.innerHTML=`<button class="ghost sm" type="button" data-sp="-1" aria-label="Předchozí hráč">◀ Q</button><div><small>SLEDUJEŠ · ${esc(MODES[S2.mode]?.name||'')}</small><b class="t${h?.t??0}">${esc(h?.n||'?')}</b></div><button class="ghost sm" type="button" data-sp="1" aria-label="Další hráč">E ▶</button><button class="ghost sm" type="button" id="specLeave">Odejít</button>`;
  el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>specSwitch(+b.dataset.sp));$('#specLeave').onclick=()=>toHub();
}
function specSwitch(d){const S2=G.spec;if(!S2)return;const H=S2.heroes,i=H.findIndex(x=>x.i===S2.target),n=H[(i+d+H.length)%H.length];if(n)wsSend({type:'specTarget',target:n.i})}
function toHub(){closeWs();saveRejoin(null);G.lobby=null;G.challenge=null;G.spec=null;renderSpecBar();Social.roomReset(null);try{history.replaceState(null,'',location.pathname)}catch{}startAttract();Hub.showHub()}
function setPause(p){
  if(!inGame())return;G.paused=p;mouseDown=false;
  $('#pause').hidden=!p;
  $('#pauseTitle').textContent=G.mode==='on'?'Menu':'Pauza';
  $('#pauseNote').innerHTML=(G.mode==='on'?'Online zápas běží dál, tvoje postava mezitím stojí. ':'')+
    `<button class="ghost sm" id="qBtn" type="button">Nastavení · ovládání, grafika, rozhraní</button>`;
  $('#qBtn').onclick=()=>Cfg.open('controls');
  $('#pauseSnd').innerHTML=Snd.panelHTML();Snd.bindPanel($('#pauseSnd'));
}
function currentStats(){return G.mode==='off'&&G.M?S.stats(G.M):G.stats}
function boardHTML(stats){
  const pve=!MODES[G.info.mode]?.pvp;
  const rows=[...stats].sort((a,b)=>a.t-b.t||b.ki-a.ki).map(u=>`<tr class="t${u.t}${u.i===G.you?' mine':''}"><td>${esc(u.n)}${u.b?' <small>bot</small>':''}</td><td>${CLASSES[u.k].name}</td><td>${pve?u.nk:u.ki}</td><td>${u.de}</td><td>${u.dm}</td><td>${u.he}</td>${pve?'':`<td>${u.re}</td>`}</tr>`).join('');
  return `<table class="st"><thead><tr><th>Hráč</th><th>Povolání</th><th>${pve?'Zničení NPC':'Zničení'}</th><th>Pády</th><th>Poškození</th><th>Léčení</th>${pve?'':'<th>Relikvie</th>'}</tr></thead><tbody>${rows}</tbody></table>`;
}
// match debrief: MVP, your share of the team's effort and a timeline of the key moments
function debriefHTML(m,pve){
  const stats=m.stats||[];if(!stats.length)return'';
  const me=G.roster.get(G.you),team=me?me.t:0,you=stats.find(s=>s.i===G.you);
  const mvpId=m.mvp||[...stats].sort((a,b)=>S.mvpScore(b,!pve)-S.mvpScore(a,!pve))[0].i,mvp=stats.find(s=>s.i===mvpId);
  const mine=stats.filter(s=>s.t===team),sum=k=>mine.reduce((a,s)=>a+(s[k]||0),0);
  const bars=you?[['Poškození','dm'],['Léčení','he'],[pve?'Zničení NPC':'Zničení','ki'],['Zachycené rány','tk'],...(pve?[]:[['Body a relikvie','obj']])].map(([n,k])=>{
    const get=s=>k==='ki'?(pve?s.nk:s.ki):k==='obj'?(s.re||0)+(s.cp||0):s[k]||0,tot=mine.reduce((a,s)=>a+get(s),0),sh=tot?Math.round(get(you)/tot*100):0;
    return`<div class="cb"><span>${n}</span><i style="--w:${sh}%"></i><b>${sh} %</b></div>`}).join(''):'';
  const nm=id=>esc(nameOf(id)),mm=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const line=e=>{switch(e.t){
    case 'feed':return e.k==='kill'?`<span class="t${G.roster.get(e.a)?.t??0}">${nm(e.a)}</span> zničil <span class="t${G.roster.get(e.b)?.t??1}">${nm(e.b)}</span>`:e.k==='field'?(e.b===G.you?`${nm(e.b)} padl`:null)
      :e.k==='relic'?`${nm(e.a)} získal relikvii`:e.k==='boss'?`<b style="color:var(--gold)">${esc(e.n)} poražen</b>`:null;
    case 'ban':return`<b>${esc(e.ti)}</b>${e.sub?` <small>${esc(e.sub)}</small>`:''}`;
    case 'waveClear':return`Vlna ${e.w} zvládnuta`;
    case 'point':return e.o<0?`Bod ${'ABC'[e.i]} neutrální`:`${TEAM_NAME[e.o]} obsadili bod ${'ABC'[e.i]}`;
  }return null};
  const tl=(m.log||[]).map(e=>[e.at,line(e)]).filter(x=>x[1]).slice(-24);
  return`<div class="deb"><div><h4>Rozbor zápasu</h4>${mvp?`<div class="mvp">MVP · ${esc(mvp.n)}</div><small class="help">${CLASSES[mvp.k]?.name||''} · ${pve?mvp.nk+' NPC':mvp.ki+' zničení'} · ${mvp.dm} poškození${mvp.he?` · ${mvp.he} léčení`:''}</small>`:''}
      ${you?`<h4 style="margin-top:6px">Tvůj podíl v týmu</h4>${bars}`:''}</div>
    <div><h4>Průběh</h4><div class="tline">${tl.map(([t,s])=>`<div><small>${mm(t)}</small><span>${s}</span></div>`).join('')||'<small>Bez zaznamenaných událostí.</small>'}</div></div></div>`;
}
function showEnd(m){
  G.ended=true;mouseDown=false;touchAtk=false;
  const me=G.roster.get(G.you),myTeam=me?me.t:0,w=m.winner,pve=!MODES[m.mode||G.info.mode]?.pvp;
  const h=$('#endTitle'),endless=MODES[m.mode||G.info.mode]?.endless;
  if(endless){h.textContent=`Vlna ${m.wave}`;h.className=m.wave>=S.ENDLESS_WIN?'win':''}
  else{h.textContent=w<0||w==null?'Remíza':w===myTeam?'Vítězství':'Porážka';h.className=w===myTeam?'win':w<0?'':'lose'}
  const ms=G.info.mission==='echo'?{name:'Ozvěna jádra'}:G.info.mission?S.missionById(G.info.mission):null;
  $('#endSub').textContent=pve?`${ms?'Kampaň · '+ms.name:MODES[m.mode||G.info.mode].name}${m.mode==='waves'?` · vlna ${m.wave}`:endless?' · tým padl':''} · ${MAPS[G.info.map].name}`:`${TEAM_NAME[0]} ${m.score[0]} : ${m.score[1]} ${TEAM_NAME[1]} · ${MAPS[G.info.map].name}`;
  Snd.play(endless?(m.wave>=S.ENDLESS_WIN?'win':'lose'):w===myTeam?'win':'lose',null,{ui:true,dur:2.5});
  $('#endTable').innerHTML=boardHTML(m.stats);
  $('#endDebrief').innerHTML=debriefHTML(m,pve);
  const room=G.mode==='on'&&!G.solo;
  $('#endNote').textContent=room?'Za chvíli se všichni vrátíte do místnosti.':'';
  $('#againBtn').hidden=room;$('#menuBtn').textContent=room?'Opustit místnost':'Zpět do hubu';
  showOnly('end');
}
// the finished online match leaves mode 'on'; without resetting it the new match's roster would not switch to the HUD
$('#againBtn').onclick=()=>{const o=G.lastOpts;if(!o)return toHub();if(G.mode==='on'){closeWs();startAttract()}G.ended=false;if(o.local)startLocal(o);else if(o.mission)hubCallbacks.mission(o.mission,o);else hubCallbacks.solo(o)};
$('#menuBtn').onclick=()=>toHub();
$('#resumeBtn').onclick=()=>setPause(false);
$('#quitBtn').onclick=()=>toHub();
$('#pauseBtn').onclick=()=>setPause(true);
// touch: ping at the auto-aim point (the nearest enemy or ahead), and the quick message panel
$('#pingBtn').onclick=()=>sendSignal('here',autoAim());
$('#wheelBtn').onclick=()=>toggleWheel();

// ---------- HUD ----------
// key binding of each action slot: three abilities, ultimate, tactical action, evade
const CAST_KEYS=['q','e','r','ult','tac','evade'];
function mySkills(){const me=G.roster.get(G.you);if(!me||me.kind!=='h')return null;const ids=G.last?.me?.sk||['c0','c1','c2'];const tac=G.last?.me?.tc?.[0]||'dodge';return{k:me.k,ids,tac,key:me.k+':'+ids.join(',')+':'+tac,defs:ids.map(id=>S.skillDef(me.k,id)||CLASSES[me.k].skills[0])}}
function buildSlots(){
  const s0=mySkills();if(!s0)return;
  G.slotsFor=s0.key;const C=CLASSES[s0.k],el=$('#slots');el.innerHTML='';
  const T={...S.TACTICS[s0.tac],cost:0},E={...S.EVADES[s0.k],cost:0};
  [...s0.defs,C.ult,T,E].forEach((s,i)=>{
    const w=document.createElement('div');w.className='slotwrap';
    w.innerHTML=`<button type="button" class="slot${i===3?' ult':i===4?' tac':i===5?' eva':''}" style="--c:${i===3?'#ffc66d':i===4?'#9fd8ff':i===5?'#e4d2ff':C.css}" aria-label="${s.name}"><span class="k">${esc(Cfg.keyLabel(Cfg.key(CAST_KEYS[i])))}</span>${svg(s.icon)}${i<3?`<span class="c">${s.cost}</span>`:''}<span class="t"></span></button>
      <div class="tip"><b>${s.name}</b>${s.desc}${i<3?`<br><small>${s.cost} energie · čekání ${s.cd} s</small>`:i===4?`<br><small>Taktická akce · čekání ${s.cd} s · bez energie</small>`:i===5?`<br><small>Úskok · čekání ${String(s.cd).replace('.',',')} s · bez energie · ve směru pohybu</small>`:'<br><small>Nabíjí se poškozením a časem</small>'}</div>`;
    w.firstElementChild.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(inGame()&&!G.paused)G.pendingCast.push(i)});
    el.appendChild(w);
  });
  $('#meName').textContent=C.name;
}
const mini=$('#mini'),mg=mini.getContext('2d');
const setTxt=(id,t)=>{const e=$('#'+id);if(e.textContent!==String(t))e.textContent=t};
function drawHUD(){
  const s=G.last;if(!s||$('#hud').hidden)return;
  const info=G.info,mode=info.mode,meInfo=G.roster.get(G.you),sk=mySkills();if(sk&&G.slotsFor!==sk.key)buildSlots();
  const clock=s.tl>1e6?'':`${Math.floor(s.tl/60)}:${String(s.tl%60).padStart(2,'0')}`;
  let mb='';
  if(MODES[mode]?.pvp){setTxt('sL','Modří');setTxt('sR','Rudí');setTxt('s0',s.sc[0]);setTxt('s1',s.sc[1]);setTxt('scoreSub','do '+(G.info?.win||MODES[mode].win));
    if(mode==='ctf'&&s.fg){const my=meInfo?.t??0;mb=`<div class="flags">${[my,1-my].map(team=>`<div class="fl${team}"><b>${team===my?'Vaše':'Soupeřova'} relikvie</b> ${flagText(s.fg[team])}</div>`).join('')}</div>`}
    if(mode==='elim'&&s.el){const [n,pause,,a0,a1,shrinkIn]=s.el,my=meInfo?.t??0,size=S.teamSize(mode),dots=(k,t)=>`<span class="t${t}">${'●'.repeat(k)}${'○'.repeat(Math.max(0,size-k))}</span>`;
      mb=`<div class="elimbar"><b>Kolo ${n}</b> ${dots(my?a1:a0,my)} <small>proti</small> ${dots(my?a0:a1,1-my)}<small>${pause?`další kolo za ${pause} s`:shrinkIn?`kruh se zmenší za ${shrinkIn} s`:'aréna se zmenšuje'}</small></div>`}
    if(mode==='control')mb=`<div class="pts">${s.pt.map(([o,pr],i)=>`<div class="pt${o>=0?' o'+o:''}" style="background:linear-gradient(0deg,color-mix(in srgb,var(--t${pr<0?0:1}) 35%,transparent) ${Math.abs(pr)}%,var(--panel) 0)">${'ABC'[i]}</div>`).join('')}</div>`}
  else{const wv=s.wv,W=MODES[mode]?.waves;setTxt('sL',W?'Vlna':'Životy');setTxt('s0',W?wv?.[0]??0:s.lv);setTxt('sR',W?'Životy':'Boss');
    setTxt('s1',W?s.lv:(s.bs?Math.ceil(s.bs[1]/s.bs[2]*100)+'%':'—'));
    setTxt('scoreSub',W?(wv&&wv[1]?`pauza ${wv[1]} s`:`nepřátel ${wv?.[2]??0}`):'životy týmu');}
  if(s.bs){const [id,hp,mh,sh,inv,fort]=s.bs,B=BOSSES[G.roster.get(id)?.k];
    mb+=`<div class="bossbar"><div class="bn">${B?B.name:'Boss'}<small>${inv?(B?.invTxt||'Nezranitelná · zničte roj'):fort?`Roztržení za ${fort} s · prolomte štít`:B?.title||''}</small></div><div class="bb"><i style="width:${hp/mh*100}%"></i>${sh?`<u style="width:${Math.min(100,sh/mh*100)}%"></u>`:''}</div></div>`}
  const mbEl=$('#modeBar');if(mbEl.innerHTML!==mb)mbEl.innerHTML=mb;
  setTxt('clock',clock);
  const me=s.me,mv=views.get(G.you);
  if(me&&mv&&meInfo&&meInfo.kind==='h'){
    const C=CLASSES[meInfo.k];
    $('#hpFill').style.width=(mv.h/mv.mh*100)+'%';$('#shFill').style.width=Math.min(100,mv.s/mv.mh*100)+'%';
    setTxt('hpText',`${Math.max(0,Math.ceil(mv.h))} / ${mv.mh}${mv.s>1?` · štít ${Math.round(mv.s)}`:''}`);
    $('#enFill').style.width=me.e+'%';setTxt('enText',`energie ${me.e}`);
    const f=mv.fl,tags=[];if(me.rt>0)tags.push(`relikvie ${me.rt} s`);if(me.dr)tags.push(`průnik ×${me.dr}`);if(f&32)tags.push('maskování');if(me.am)tags.push('přepad');if(f&1)tags.push('omráčen');if(f&2)tags.push('umlčen');if(f&8)tags.push('zpomalen');if(f&4)tags.push('krvácíš');if(f&16384)tags.push('hoříš');if(f&32768)tags.push('otrávený · léčení −30 %');if(f&65536)tags.push('šok');if(f&1024)tags.push('BŘEMENO · uteč od týmu');if(f&2048)tags.push(`mor nanitů · ${me.nn} zásahů${me.tc?.[0]==='decon'?' · T: Dekontaminace':''}`);if(f&4096)tags.push('dekontaminace');if(f&8192)tags.push('označen');
    setTxt('meStatus',tags.join(' · ')||C.talent);
    document.querySelectorAll('#slots .slot').forEach((el,i)=>{
      if(i===5){const ev=me.ev||0,cd=S.EVADES[meInfo.k]?.cd||4;el.style.setProperty('--cd',Math.min(1,ev/cd).toFixed(3));el.querySelector('.t').textContent=ev>0?(ev<1?ev.toFixed(1).replace('.',','):Math.ceil(ev)):''}
      else if(i===4){const [tk,tc]=me.tc||['dodge',0],cd=S.TACTICS[tk]?.cd||1;el.style.setProperty('--cd',Math.min(1,tc/cd).toFixed(3));el.querySelector('.t').textContent=tc>0?Math.ceil(tc):''}
      else if(i===3){el.style.setProperty('--cd',(1-me.u/100).toFixed(3));el.classList.toggle('ready',me.u>=100);el.querySelector('.t').textContent=me.u>=100?'':me.u+'%'}
      else{const sk=(sk0=>sk0?.defs[i])(mySkills())||C.skills[i];el.style.setProperty('--cd',Math.min(1,me.c[i]/sk.cd).toFixed(3));el.querySelector('.t').textContent=me.c[i]>0?Math.ceil(me.c[i]):'';el.classList.toggle('poor',me.e<sk.cost)}
    });
    const mu=s.um.get(G.you);$('#dead').hidden=!(mu&&mu.d);
    const rc=$('#recap');if(!rc.hidden&&(!(mu&&mu.d)||performance.now()-G.recapAt>9000))rc.hidden=true;
    if(mu&&mu.d){const html=mode==='elim'?'Vyřazen · sleduješ spoluhráče do konce kola':'Zničen · obnova za <b id="deadT"></b> s';
      if($('#dead').dataset.m!==mode){$('#dead').dataset.m=mode;$('#dead').innerHTML=html}if(mode!=='elim')setTxt('deadT',mu.d)}
  }
  setTxt('relicInfo',S.arenaLike(mode)?(s.rl[0]?'Relikvie čeká ve středu':`Relikvie za ${s.rl[1]} s`)+(MODES[mode].mutators?' · '+mutNames(info.mods):''):(!MODES[mode].pvp&&me?`Kořist v batohu: ${me.bag}`:''));
  // minimap
  const map=MAPS[info.map],W=mini.width,sc=W/((map.r+2)*2),cx=W/2,toM=x=>cx+x*sc;
  mg.clearRect(0,0,W,W);mg.save();mg.beginPath();mg.arc(cx,cx,cx-2,0,Math.PI*2);mg.clip();
  mg.strokeStyle='rgba(143,166,255,.5)';mg.lineWidth=3;mg.beginPath();mg.arc(cx,cx,map.r*sc,0,Math.PI*2);mg.stroke();
  map.bases.forEach((b,i)=>{mg.globalAlpha=.25;mg.fillStyle=teamHex(i);mg.beginPath();mg.arc(toM(b.x),toM(b.z),4*sc,0,Math.PI*2);mg.fill();mg.globalAlpha=1});
  mg.fillStyle='rgba(255,106,26,.45)';for(const h of map.hazards){mg.beginPath();mg.arc(toM(h.x),toM(h.z),h.r*sc,0,Math.PI*2);mg.fill()}
  (map.portals||[]).forEach((pair,i)=>{mg.strokeStyle=i?'#ff7de9':'#7df9ff';mg.lineWidth=3;for(const p of pair){mg.beginPath();mg.arc(toM(p.x),toM(p.z),Math.max(3,1.6*sc),0,Math.PI*2);mg.stroke()}});
  mg.fillStyle='#2a3350';for(const [x,z,r] of map.pillars){mg.beginPath();mg.arc(toM(x),toM(z),r*sc,0,Math.PI*2);mg.fill()}
  if(mode==='control')map.points.forEach((p,i)=>{const o=s.pt[i]?.[0];mg.strokeStyle=o===0||o===1?teamHex(o):'#ffc66d';mg.lineWidth=4;mg.beginPath();mg.arc(toM(p.x),toM(p.z),4*sc,0,Math.PI*2);mg.stroke()});
  if(mode==='elim'&&s.el&&s.el[2]<map.r){mg.fillStyle='rgba(255,40,80,.22)';mg.beginPath();mg.arc(cx,cx,cx,0,Math.PI*2);mg.arc(cx,cx,s.el[2]*sc,0,Math.PI*2,true);mg.fill();
    mg.strokeStyle='#ff3f5e';mg.lineWidth=3;mg.beginPath();mg.arc(cx,cx,s.el[2]*sc,0,Math.PI*2);mg.stroke()}
  if(s.rl[0]&&S.arenaLike(mode)){mg.fillStyle='#ffc66d';mg.beginPath();mg.arc(cx,cx,7,0,Math.PI*2);mg.fill()}
  for(const L of s.lt){mg.fillStyle=RARITIES[L[3]].color;mg.fillRect(toM(L[1])-4,toM(L[2])-4,8,8)}
  if(mode==='ctf'&&s.fg)s.fg.forEach(([st,x,z],team)=>{const h=(map.flags||map.bases)[team];mg.strokeStyle=teamHex(team);mg.lineWidth=3;mg.beginPath();mg.arc(toM(h.x),toM(h.z),9,0,Math.PI*2);mg.stroke();
    mg.fillStyle=teamHex(team);mg.save();mg.translate(toM(x),toM(z));mg.rotate(Math.PI/4);const k=st===2?7+3*Math.sin(performance.now()/120):8;mg.fillRect(-k/2,-k/2,k,k);mg.restore()});
  for(const p of pingMarks){mg.strokeStyle='#'+SIG_COL[p.k].toString(16).padStart(6,'0');mg.lineWidth=4;mg.beginPath();mg.arc(toM(p.x),toM(p.z),10+4*Math.sin(performance.now()/120),0,Math.PI*2);mg.stroke()}
  for(const v of views.values()){if(v.dead||v.hid)continue;
    mg.fillStyle=teamHex(v.t?1:0);mg.beginPath();mg.arc(toM(v.x),toM(v.z),v.kind==='b'?13:v.kind==='n'?4:v.id===G.you?9:7,0,Math.PI*2);mg.fill();
    if(v.id===G.you){mg.strokeStyle='#ffc66d';mg.lineWidth=3;mg.stroke()}}
  mg.restore();
}

// ---------- pings and quick messages ----------
const SIG_COL={here:0xffc66d,attack:0xff3f5e,danger:0xff8a2a};
let pingMarks=[],bubbles=new Map();
function onSignal(e){
  const S2=S.SIGNALS[e.k];if(!S2||G.mode==='menu')return;
  if(S2.ping){
    const c=SIG_COL[e.k],g=new THREE.Group(),ring=new THREE.Mesh(RING_GEO,addMat(c,2)),col=new THREE.Mesh(BEAM_GEO,addMat(c,1.2));
    ring.rotation.x=-Math.PI/2;ring.scale.setScalar(1.6);col.scale.set(.06,5,.06);col.position.y=2.5;g.add(ring,col);g.position.set(e.x,.12,e.z);scene.add(g);
    pingMarks.push({g,x:e.x,z:e.z,k:e.k,tg:e.tg,until:performance.now()+3500});
    feed(`${tag(e.u)}: <span style="color:${'#'+c.toString(16).padStart(6,'0')}">${S2.name}${e.tg?' · '+esc(nameOf(e.tg)):''}</span>`);
    Snd.play('ping',null,{ui:true,danger:e.k==='danger',gap:.2});
  }else{
    const v=views.get(e.u);if(!v)return;bubbles.get(e.u)?.el.remove();
    const el=document.createElement('div');el.className='bubble'+(S2.emote?' emote':'');el.textContent=S2.name;$('#floaters').appendChild(el);bubbles.set(e.u,{el,until:performance.now()+(S2.emote?S2.d*1000:2600)});
    if(S2.emote){v.emote={k:e.k,t0:performance.now(),until:performance.now()+S2.d*1000};return}
    if(v.t===G.roster.get(G.you)?.t)feed(`${tag(e.u)}: ${S2.name}`);Snd.play('msg',null,{ui:true,vol:.5,gap:.3});
  }
}
function updSignals(t){
  const now=performance.now();
  pingMarks=pingMarks.filter(p=>{if(now>p.until){scene.remove(p.g);p.g.traverse(o=>o.material&&o.material.dispose());return false}
    if(p.tg){const v=views.get(p.tg);if(v&&!v.dead){p.x=v.x;p.z=v.z;p.g.position.set(v.x,.12,v.z)}}
    const k=(p.until-now)/3500;p.g.children[0].scale.setScalar(1.2+Math.sin(t*8)*.25);p.g.children[0].material.opacity=Math.min(1,k*2);p.g.children[1].material.opacity=Math.min(1,k*2)*.7;return true});
  for(const [id,b] of bubbles){const v=views.get(id);if(now>b.until||!v||v.dead){b.el.remove();bubbles.delete(id);continue}
    const s=toScreen(v,(v.model.height||2.3)+1.3);b.el.style.display=s.off?'none':'';b.el.style.transform=`translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;b.el.style.opacity=Math.min(1,(b.until-now)/400)}
}
function clearSignals(){for(const p of pingMarks)scene.remove(p.g);pingMarks=[];for(const b of bubbles.values())b.el.remove();bubbles.clear();$('#wheel').hidden=true}
function sendSignal(k,p){
  if(G.mode==='on')wsSend({type:'sig',k,x:p?.x??0,z:p?.z??0});
  else if(G.mode==='off'&&G.M){const u=G.M.units.find(x=>x.id===G.you);if(u)S.signal(G.M,u,k,p?.x??u.x,p?.z??u.z)}
}
// quick messages on 1–7, emotes on 8, 9 and 0
const WHEEL=['go','back','help','hold','thanks','gg','haha','wave','dance','cheer'];
const wheelKey=i=>String((i+1)%10);
function toggleWheel(show=$('#wheel').hidden){
  const w=$('#wheel');w.hidden=!show;if(!show)return;
  w.innerHTML=WHEEL.map((k,i)=>`<button type="button" data-sig="${k}"${S.SIGNALS[k].emote?' class="emo"':''}><kbd>${wheelKey(i)}</kbd>${S.SIGNALS[k].name}</button>`).join('');
  w.querySelectorAll('[data-sig]').forEach(b=>b.onclick=()=>{sendSignal(b.dataset.sig);toggleWheel(false)});
}

// ---------- legendary skin trails: particles that follow the hero, more while moving ----------
function skinTrail(v,fx,sp,dt){
  const rate=(sp>1?14:3)*Cfg.get('particles');if(Math.random()>rate*dt)return;
  const c=S.SKIN_FX[fx]??0xffffff,p={x:v.x+rnd(-.35,.35),z:v.z+rnd(-.35,.35)};
  switch(fx){
    case 'embers':burst(p,Math.random()<.5?c:0xffd23f,2,.6,3.2,.7,rnd(.4,1.8));break;
    case 'frost':burst(p,c,2,.5,.4,1,rnd(.1,1.2));break;
    case 'shadow':burst(p,c,2,.3,.2,.9,rnd(.05,.6));break;
    case 'lightning':if(sp>1&&Math.random()<.35)boltFx(new V3(v.x-v.vx*.12,1,v.z-v.vz*.12),new V3(v.x,1.2,v.z),c);else burst(p,c,2,1.5,1,.25,1);break;
    case 'stars':burst({x:v.x+rnd(-.8,.8),z:v.z+rnd(-.8,.8)},c,1,.2,.6,1,rnd(1,2.6));break;
    case 'quake':burst(p,c,2,1.8,.4,.4,.05);break;
    case 'runes':case 'hex':burst({x:v.x+Math.cos(performance.now()/300)*.8,z:v.z+Math.sin(performance.now()/300)*.8},c,1,.2,.8,.8,1.2);break;
    default:burst(p,c,2,1,1.5,.5,1);
  }
}

// emotes override the arms and body for a few seconds; moving or attacking ends them
function emoteAnim(v,M,sp){
  const E=v.emote;
  if(!E||!M.armL)return;
  const now=performance.now();
  if(now>E.until||sp>1.2||v.attackAnim>.05){v.emote=null;M.body.rotation.y=0;M.armL.rotation.z=M.armR.rotation.z=0;return}
  const s=(now-E.t0)/1000;
  if(E.k==='wave'){M.armR.rotation.x=-2.7;M.armR.rotation.z=-.25+Math.sin(s*11)*.45;M.armL.rotation.x=0}
  else if(E.k==='cheer'){const p=Math.sin(s*9);M.armL.rotation.x=M.armR.rotation.x=-2.6-p*.35;M.armL.rotation.z=.35;M.armR.rotation.z=-.35;M.body.position.y=Math.max(0,p)*.35}
  else if(E.k==='dance'){M.body.rotation.y=s*5;M.body.position.y=Math.abs(Math.sin(s*8))*.22;
    M.armL.rotation.x=-1.4+Math.sin(s*8)*.9;M.armR.rotation.x=-1.4-Math.sin(s*8)*.9;M.armL.rotation.z=.6;M.armR.rotation.z=-.6;
    if(M.legL){M.legL.rotation.x=Math.sin(s*8)*.5;M.legR.rotation.x=-Math.sin(s*8)*.5}}
}
// ---------- per-frame unit visuals ----------
function unitVisual(v,st,dt,t){
  const M=v.model,b=v.bar;
  v.dead=!st||!!st.d;v.hid=!!(st&&st.hid);
  if(v.bombMesh)v.bombMesh.visible=false;
  if(v.dead||v.hid){M.root.visible=false;b.el.style.display='none';v.placed=false;return}
  const own=v.id===G.you&&G.show;
  if(own){v.x=G.show.x;v.z=G.show.z}else{v.x=st.x;v.z=st.z}
  v.vx=st.vx;v.vz=st.vz;v.h=st.h;v.s=st.s;v.fl=st.fl;
  if(!v.placed){M.root.rotation.y=st.f;v.placed=true}
  if(v.id===G.you&&!isTouch&&!(st.fl&129)){const dx=mouseWorld.x-v.x,dz=mouseWorld.z-v.z;if(dx*dx+dz*dz>.01)v.f=Math.atan2(dx,dz);else v.f=st.f}else v.f=st.f;
  M.root.visible=true;v.airY=(v.airY||0)+((st.fl&512?6:0)-(v.airY||0))*Math.min(1,dt*2.5);M.root.position.set(v.x,v.airY,v.z);
  if(st.fl&1024){if(!v.bombMesh){v.bombMesh=new THREE.Mesh(RING_GEO,addMat(0xffa94d,2));v.bombMesh.rotation.x=-Math.PI/2;scene.add(v.bombMesh)}
    v.bombMesh.visible=true;v.bombMesh.position.set(v.x,.12,v.z);v.bombMesh.scale.setScalar(6);v.bombMesh.material.opacity=.45+.4*Math.abs(Math.sin(t*7))}
  M.root.rotation.y=lerpAng(M.root.rotation.y,v.f,Math.min(1,dt*(M.boss?6:16)));
  const sp=Math.hypot(v.vx,v.vz),amp=Math.min(1,sp/4);v.phase+=sp*dt*(M.boss?.9:1.5);const sw=Math.sin(v.phase)*amp*.7;
  if(M.legL){M.legL.rotation.x=sw;M.legR.rotation.x=-sw}
  v.attackAnim=Math.max(0,v.attackAnim-dt*5);
  if(M.armL){M.armL.rotation.x=-sw*.6;M.armR.rotation.x=sw*.6-v.attackAnim*1.5}
  if(M.legL){M.body.position.y=Math.abs(Math.sin(v.phase))*.06*amp;M.body.rotation.x=amp*.08}
  emoteAnim(v,M,sp);
  M.anim?.(dt,t,sp,amp);
  if(M.fx)skinTrail(v,M.fx,sp,dt);
  if(M.drone){M.drone.position.set(Math.sin(t*2+v.id)*.85,2.3+Math.sin(t*3)*.12,Math.cos(t*2+v.id)*.85);M.drone.rotation.y=t*3}
  const op=st.fl&32?.25:st.fl&64?.55+.45*Math.sin(t*22):1;for(const m of M.mats)m.opacity=op;
  v.flash=Math.max(0,v.flash-dt);const fl=v.flash>0?v.flash*7:0;for(const m of M.flash)m.emissive.setRGB(fl,fl*.9,fl*.85);
  M.bubble.visible=st.s>1||!!(st.fl&256);M.bubble.material.opacity=st.fl&256?.45:Math.min(.38,.06+st.s/250);M.bubble.rotation.y=t*.8;
  M.halo.visible=!!(st.fl&16);M.stun.visible=!!(st.fl&1);M.stun.rotation.z=t*6;M.meRing.visible=v.id===G.you;
  if(st.fl&2048&&Math.random()<dt*8)burst({x:v.x,z:v.z},0x7dff9a,2,1.5,2,.6,1.4);
  if(st.fl&32768&&Math.random()<dt*7)burst({x:v.x,z:v.z},0x9dff5d,2,.8,1.5,.7,1.6);
  if(st.fl&65536&&Math.random()<dt*9)burst({x:v.x+rnd(-.4,.4),z:v.z+rnd(-.4,.4)},0x9fd8ff,3,4,2,.18,1.3);
  if(st.fl&16384&&Math.random()<dt*10)burst({x:v.x,z:v.z},Math.random()<.5?0xff6a1a:0xffc66d,2,1,3.5,.5,1.2);
  if(st.fl&8192&&Math.random()<dt*5)burst({x:v.x,z:v.z},0xff5d6c,1,.6,3,.5,2.6);
  if(st.fl&128)burst(v,v.kind==='h'?CLASSES[v.k].color:0xff5d6c,3,1,1,.35,.8);
  if(G.mode==='menu'||v.kind==='b'){b.el.style.display='none';return}
  const s=toScreen(v,M.height+.8);if(s.off){b.el.style.display='none';return}
  b.el.style.display='';b.el.style.transform=`translate(${s.x-38}px,${s.y-30}px)`;
  b.h.style.width=Math.max(0,st.h/v.mh*100)+'%';b.s.style.width=Math.min(100,st.s/v.mh*100)+'%';
  const f=st.fl;b.em.textContent=G.last?.fg?.some(x=>x[0]===1&&x[3]===v.id)?'NESE RELIKVII':f&1024?'BŘEMENO':f&2048?'NAKAŽEN':f&8192?'OZNAČEN':f&1?'OMRÁČEN':f&2?'UMLČEN':f&4?'KRVÁCÍ':f&16384?'HOŘÍ':f&32768?'OTRÁVEN':f&65536?'ŠOK':f&8?'ZPOMALEN':f&16?'RELIKVIE':'';
}

// ---------- hero preview for the hub ----------
let PV=null;
function setPreview(cv,k,sk){
  if(PV&&(PV.cv!==cv||PV.k!==k||PV.sk!==sk)){PV.env.dispose();PV.r.dispose();PV.r.forceContextLoss?.();PV=null}
  if(!cv||PV)return;
  // a separate WebGL context needs its own environment texture; the main one does not carry over
  const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.toneMapping=THREE.ACESFilmicToneMapping;
  const env=new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(),.04).texture;
  const sc=new THREE.Scene();sc.environment=env;sc.add(new THREE.HemisphereLight(0xbfd3ff,0x202030,1.6));
  const l=new THREE.DirectionalLight(0xffffff,2.2);l.position.set(3,5,4);sc.add(l);const l2=new THREE.DirectionalLight(0x8fb4ff,1.2);l2.position.set(-4,2,-3);sc.add(l2);
  const cam=new THREE.PerspectiveCamera(30,1,.1,50);cam.position.set(0,1.9,7.4);cam.lookAt(0,1.15,0);
  const m=buildHero(k,0,sk);m.ring.visible=m.meRing.visible=m.bubble.visible=m.halo.visible=m.stun.visible=false;sc.add(m.root);
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(1,1.1,.15,40),new THREE.MeshStandardMaterial({color:0x121828,metalness:.7,roughness:.3}));ped.position.y=-.08;sc.add(ped);
  PV={cv,k,sk,r,sc,cam,m,env};
}
function drawPreview(dt,t){if(!PV)return;if(!PV.cv.isConnected){setPreview(null);return}
  const w=PV.cv.clientWidth;if(w&&PV.cv.width!==Math.round(w*Math.min(devicePixelRatio,2)))PV.r.setSize(w,w,false);
  PV.m.root.rotation.y+=dt*.6;PV.m.anim?.(dt,t,0,0);if(PV.m.drone)PV.m.drone.position.set(Math.sin(t*2)*.85,2.3,Math.cos(t*2)*.85);PV.r.render(PV.sc,PV.cam)}

// ---------- automatic quality ----------
// When the device cannot keep 30 FPS in a match for 6 s, the render resolution steps down (to 60 % at least) and the
// player is told once; everything stays adjustable in Settings. Frames while the tab is hidden do not count.
const AQ={t:0,n:0,told:false};
function autoQuality(dt){
  if(!inGame()||G.paused||document.hidden||dt>=.05){AQ.t=0;AQ.n=0;return}
  AQ.t+=dt;AQ.n++;if(AQ.t<6)return;
  const fps=AQ.n/AQ.t;AQ.t=0;AQ.n=0;
  if(fps<30&&Cfg.get('scale')>.6){Cfg.set('scale',Math.max(.6,Math.round((Cfg.get('scale')-.15)*100)/100));
    if(!AQ.told){AQ.told=true;Hub.toast(`Hra běžela jen ${Math.round(fps)} FPS, snížil jsem rozlišení. Změníš ho v Nastavení → Grafika.`)}}
}

// ---------- sound per frame: listener, music mood, low-health heartbeat ----------
let heartT=0,lastMood='';
function soundFrame(dt){
  const playing=(G.mode==='on'||G.mode==='off')&&!G.ended,p=playing?myPos():null;
  Snd.listener(p?.x||0,p?.z||0,playing);
  const md=playing?(G.last?.bs||G.info.mode==='boss'?'boss':'match'):!$('#end').hidden?'off':'calm';
  if(md!==lastMood){lastMood=md;Snd.mood(md)}
  const v=playing&&views.get(G.you);heartT-=dt;
  if(v&&!v.dead&&v.mh&&v.h/v.mh<.25&&heartT<=0){heartT=.95;Snd.play('heart',null,{ui:true,vol:.8})}
}
addEventListener('keydown',e=>{if(e.code===Cfg.key('mute')&&!e.repeat&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){Snd.toggleMute();Hub.toast(Snd.settings().mute?'Zvuk vypnutý (M)':'Zvuk zapnutý (M)')}});
// a quiet tick for menu buttons (not the skill slots, those have their own sounds)
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&!b.closest('#slots')&&!b.disabled)Snd.play('click',null,{ui:true,vol:.6})},true);

// ---------- main loop ----------
const camPos=new V3(),clock=new THREE.Clock();let menuAngle=0,fpsN=0,fpsT=0;
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  arena?.update(dt,t);
  if(G.mode==='menu'||G.mode==='off')stepLocal(dt);
  else if(G.mode==='on'&&!G.ended){G.inAcc+=dt;let n=0;while(G.inAcc>=TICK&&n<4){G.inAcc-=TICK;inputTick();n++}if(G.inAcc>TICK)G.inAcc=0}
  if(G.pred&&G.show){const dx=G.pred.x-G.show.x,dz=G.pred.z-G.show.z;if(dx*dx+dz*dz>16){G.show.x=G.pred.x;G.show.z=G.pred.z}else{const k=Math.min(1,dt*18);G.show.x+=dx*k;G.show.z+=dz*k}}
  else G.show=null;
  const rt=renderTime();
  soundFrame(dt);
  playEvents(rt);
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('#banner').classList.remove('on')}
  if(flashT>0){flashT=Math.max(0,flashT-dt*2.5);$('#flash').style.opacity=flashT.toFixed(2)}
  for(const v of views.values())unitVisual(v,v.id===G.you&&G.mode==='on'&&G.last?G.last.um.get(v.id):sample(v.id,rt),dt,t);
  for(const m of projMeshes.values()){const s=m.userData.s,k=Math.max(-.1,(rt-s.at)/1000);m.position.set(s.x+s.vx*k,1.3,s.z+s.vz*k);
    if(Math.random()<(hiQ?.7:.35)){_c.set(m.userData.c);parts.push({x:m.position.x,y:1.3,z:m.position.z,vx:rnd(-.3,.3),vy:rnd(-.2,.2),vz:rnd(-.3,.3),l:.25,m:.25,r:_c.r*2,g:_c.g*2,b:_c.b*2})}}
  for(const m of zoneMeshes.values()){m.material.opacity=.22*Math.min(1,m.userData.t)+.06*Math.sin(t*8);m.rotation.z+=dt*.6;
    if(Math.random()<.6){const a=rnd(0,6.28),r=rnd(0,3.5);burst({x:m.position.x+Math.cos(a)*r,z:m.position.z+Math.sin(a)*r},m.userData.c,1,.6,2.2,.7,0)}}
  updSignals(t);updFlagMeshes(t);updElimWall(dt,t);
  if(tutMark){tutMark.children[0].scale.setScalar(2.4+Math.sin(t*4)*.25);tutMark.children[1].material.opacity=.5+.3*Math.sin(t*6)}
  for(const g of lootMeshes.values()){g.userData.gem.rotation.y+=dt*2;g.userData.gem.position.y=1+Math.sin(t*3)*.15}
  for(const g of beamMeshes.values())g.userData.glow.material.opacity=.5+.3*Math.sin(t*30);
  if(G.last&&pointMeshes.length)for(const P of pointMeshes){const [o,pr]=G.last.pt[P.i]||[-1,0],c=o===0?TEAM_COL[0]:o===1?TEAM_COL[1]:0xffc66d;
    P.ring.material.color.copy(HDR(c,1.6));P.col.material.color.copy(HDR(c,.6));P.fill.scale.setScalar(Math.max(.05,Math.abs(pr)/100*4));P.fill.material.color.copy(HDR(pr<0?TEAM_COL[0]:TEAM_COL[1],.8))}
  const up=!!(G.last&&G.last.rl[0]&&S.arenaLike(G.info.mode));relicMesh.visible=up;
  if(up){relicMesh.rotation.y+=dt*1.4;relicMesh.rotation.x+=dt*.6;relicMesh.position.y=1.6+Math.sin(t*2)*.15;relicLight.intensity=10+Math.sin(t*4)*3;if(Math.random()<.4)burst({x:0,z:0},0xffc66d,1,1.2,2,.8,1.2)}
  else relicLight.intensity=Math.max(0,relicLight.intensity-dt*20);
  G.shake=Cfg.get('shake')?Math.max(0,G.shake-dt*2.2):0;
  if(!$('#fps').hidden){fpsN++;fpsT+=dt;if(fpsT>=.5){$('#fps').textContent=`${Math.round(fpsN/fpsT)} FPS`;fpsN=0;fpsT=0}}
  autoQuality(dt);
  if(G.mode==='menu'){menuAngle+=dt*.06;camera.position.set(Math.cos(menuAngle)*46,30,Math.sin(menuAngle)*46);camera.lookAt(-6,0,0)}
  else{const p=camFocus();camPos.lerp(new V3(p.x,0,p.z),1-Math.exp(-dt*6));const far=(camera.aspect<1?1.45:1)*Cfg.get('zoom'),boss=G.info.mode==='boss'||G.last?.bs?1.12:1;
    const sx=(Math.random()-.5)*G.shake*.9,sz=(Math.random()-.5)*G.shake*.9;
    camera.position.set(camPos.x+sx,26*far*boss,camPos.z+17*far*boss+sz);camera.lookAt(camPos.x+sx*.5,0,camPos.z-1+sz*.5)}
  ray.setFromCamera(ndc,camera);ray.ray.intersectPlane(groundPlane,mouseWorld);
  updParts(dt);updFx(dt);updFloaters(dt);
  composer.render();
  drawPreview(dt,t);
  drawHUD();
}

Cfg.setup();applyCfg();
Social.setup({join:code=>Hub.joinRoom(code),sendRoom:(text,team)=>wsSend({type:'say',ch:'room',text,team}),pvp:()=>!!MODES[G.info?.mode||G.lobby?.mode]?.pvp});
Social.onChange(()=>{if(!$('#lobby').hidden&&G.lobby)Social.lobbyFriends($('#lobbyFriends'),G.lobby)});
applyTouch();startAttract();frame();
Hub.init(hubCallbacks).then(resumeAfterReload);
// installable app: the service worker keeps a copy of the game for offline training
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('Service worker:',e.message));
window.__arena=G;
