// Relikvie Aréna — 3D models (heroes with skins, NPCs, bosses) and map environments.
import * as THREE from 'three';
import {CLASSES,NPCS,BOSSES,MAPS,TEAM_COL,skinOf} from './sim.js';
const PORTAL_COL=[0x7df9ff,0xff7de9];

export const HDR=(c,k=2.4)=>new THREE.Color(c).multiplyScalar(k);
export const DISC_GEO=new THREE.CircleGeometry(1,40);
const rnd=(a,b)=>a+Math.random()*(b-a);

// ---------- shared model pieces ----------
// o: optional skin finish — metal (0..1, polished armour), dark (suit colour), accent (second armour colour)
function kit(armorCol,glowCol,team,o={}){
  const metal=o.metal??0;
  const armor=new THREE.MeshStandardMaterial({color:new THREE.Color(armorCol).multiplyScalar(1.5),metalness:.5+.45*metal,roughness:.38-.26*metal,envMapIntensity:1.1+metal,transparent:true,emissive:0x000000});
  const dark=new THREE.MeshStandardMaterial({color:o.dark??0x0e121c,metalness:.4,roughness:.7,transparent:true,side:THREE.DoubleSide,emissive:0x000000});
  const accent=new THREE.MeshStandardMaterial({color:new THREE.Color(o.accent??armorCol).multiplyScalar(1.4),metalness:.5+.4*metal,roughness:.4-.2*metal,envMapIntensity:1.1+metal,transparent:true,side:THREE.DoubleSide,emissive:0x000000});
  const glow=new THREE.MeshBasicMaterial({color:HDR(glowCol,2.4),transparent:true,side:THREE.DoubleSide});
  const tglow=new THREE.MeshBasicMaterial({color:HDR(TEAM_COL[team]??0xffffff,2),transparent:true,side:THREE.DoubleSide});
  return{armor,dark,accent,glow,tglow,mats:[armor,dark,accent,glow,tglow],flash:[armor,dark,accent]};
}
// flat shapes for chest emblems and wings
function shapeGeo(pts,depth=.02){const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false})}
const STAR=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.055:.14;return[Math.cos(a)*r,Math.sin(a)*r]});
const EMBLEMS={star:STAR,diamond:[[0,.15],[.13,0],[0,-.15],[-.13,0]],bolt:[[.04,.15],[-.07,0],[0,0],[-.05,-.15],[.08,.02],[0,.02]],
  wing:[[-.2,.05],[-.06,.02],[0,.09],[.06,.02],[.2,.05],[.12,-.06],[.03,-.03],[0,-.1],[-.03,-.03],[-.12,-.06]],
  eye:[[-.15,0],[-.05,.07],[.05,.07],[.15,0],[.05,-.07],[-.05,-.07]],flame:[[0,.16],[.09,.02],[.06,-.12],[0,-.06],[-.06,-.12],[-.09,.02]]};
const WING=[[0,0],[.25,.35],[.7,.62],[1.05,.55],[.85,.25],[.95,.05],[.6,-.05],[.7,-.3],[.35,-.25],[.25,-.45]];
function box(p,w,h,d,m,x,y,z){const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.castShadow=true;p.add(me);return me}
function mesh(p,g,m,x=0,y=0,z=0){const me=new THREE.Mesh(g,m);me.position.set(x,y,z);me.castShadow=true;p.add(me);return me}
function common(root,K,team,scale,radius){
  const shadow=new THREE.Mesh(DISC_GEO,new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.5,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.03;shadow.scale.setScalar(radius*1.05);root.add(shadow);
  const ring=new THREE.Mesh(new THREE.RingGeometry(radius*1.25,radius*1.45,48),K.tglow);ring.rotation.x=-Math.PI/2;ring.position.y=.04;root.add(ring);
  const meRing=new THREE.Mesh(new THREE.RingGeometry(radius*1.7,radius*1.8,48),new THREE.MeshBasicMaterial({color:HDR(0xffc66d,2),transparent:true,side:THREE.DoubleSide}));meRing.rotation.x=-Math.PI/2;meRing.position.y=.04;root.add(meRing);
  const bubble=new THREE.Mesh(new THREE.IcosahedronGeometry(radius*1.9,1),new THREE.MeshBasicMaterial({color:HDR(TEAM_COL[team]??0xffffff,1.4),wireframe:true,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false}));bubble.position.y=1.2*scale;root.add(bubble);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.42,.045,6,24),new THREE.MeshBasicMaterial({color:HDR(0xffc66d,2.6)}));halo.rotation.x=Math.PI/2;halo.position.y=2.75*scale;root.add(halo);
  const stun=new THREE.Mesh(new THREE.TorusGeometry(.32*scale,.03,4,5),new THREE.MeshBasicMaterial({color:HDR(0xfff2a0,2.4)}));stun.rotation.x=Math.PI/2;stun.position.y=2.5*scale;root.add(stun);
  return{bubble,halo,stun,meRing,ring};
}

// ---------- heroes ----------
export function buildHero(k,team,skinKey){
  const skin=skinOf(k,skinKey),K=kit(skin.armor,skin.glow,team,{metal:skin.metal,dark:skin.dark,accent:skin.accent});
  const {armor,dark,glow,tglow,accent}=K,root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const W=k==='guardian'?1.25:k==='technician'?.95:.9;
  const limb=(x,y)=>{const g=new THREE.Group();g.position.set(x,y,0);body.add(g);return g};
  const legL=limb(-.2*W,.95),legR=limb(.2*W,.95);
  for(const L of [legL,legR]){box(L,.22*W,.55,.26,armor,0,-.25,0);box(L,.2*W,.45,.24,dark,0,-.7,0);box(L,.24*W,.12,.36,armor,0,-.9,.05);box(L,.05,.3,.02,glow,0,-.3,.14)}
  box(body,.5*W,.26,.32,dark,0,1.0,0);
  const sx=k==='guardian'?.66:.45*W,armL=limb(-sx,1.62),armR=limb(sx,1.62);
  for(const A of [armL,armR]){box(A,.18*W,.42,.2,armor,0,-.2,0);box(A,.16*W,.4,.18,dark,0,-.6,0)}
  let drone=null,headY=1.95;
  if(k==='striker'){
    box(body,.62,.68,.36,armor,0,1.38,0);box(body,.06,.5,.02,glow,-.18,1.38,.19);
    mesh(body,new THREE.OctahedronGeometry(.12),glow,0,1.45,.21);
    box(body,.34,.16,.42,armor,-.4,1.76,0).rotation.z=.35;box(body,.36,.03,.44,glow,-.4,1.68,0).rotation.z=.35;
    box(body,.3,.34,.32,armor,0,1.95,0);box(body,.26,.06,.04,glow,0,1.97,.17);
    box(armR,.05,.05,1,glow,0,-.8,.42);box(armR,.2,.12,.26,armor,0,-.78,.05);
  }else if(k==='guardian'){
    box(body,.95,.8,.55,armor,0,1.4,0);box(body,.7,.06,.04,glow,0,1.5,.28);box(body,.5,.06,.04,glow,0,1.3,.28);
    for(const s of [-1,1]){box(body,.46,.3,.62,armor,s*.66,1.86,0);box(body,.48,.04,.64,glow,s*.66,1.72,0)}
    box(body,.42,.42,.42,armor,0,2.08,0);box(body,.36,.07,.04,glow,0,2.1,.22);headY=2.08;
    box(armL,.1,1.05,.8,dark,-.14,-.45,.16);box(armL,.11,.06,.66,glow,-.15,-.06,.16);box(armL,.11,.06,.66,glow,-.15,-.86,.16);
    const em=mesh(armL,new THREE.OctahedronGeometry(.14),glow,-.2,-.45,.16);em.scale.set(.4,1,1);
  }else if(k==='pyro'){
    // Žhář: armored torso, two fuel tanks on the back, a burner on the right arm and a visor mask
    box(body,.6,.66,.4,armor,0,1.38,0);box(body,.44,.05,.04,glow,0,1.5,.21);box(body,.3,.05,.04,glow,0,1.3,.21);
    for(const s of [-1,1]){const tk=mesh(body,new THREE.CylinderGeometry(.13,.13,.62,12),dark,s*.17,1.42,-.32);
      mesh(body,new THREE.CylinderGeometry(.135,.135,.06,12),glow,s*.17,1.62,-.32);mesh(body,new THREE.SphereGeometry(.13,10,8),armor,s*.17,1.74,-.32);tk.userData.tank=1}
    box(body,.34,.36,.34,armor,0,1.95,0);box(body,.28,.1,.04,glow,0,1.97,.18);box(body,.12,.12,.06,dark,0,1.86,.19);
    for(const s of [-1,1])box(body,.3,.12,.38,armor,s*.38,1.74,0).rotation.z=s*-.3;
    mesh(armR,new THREE.CylinderGeometry(.07,.11,.5,10),dark,0,-.8,.28).rotation.x=Math.PI/2;
    mesh(armR,new THREE.TorusGeometry(.09,.025,6,16),glow,0,-.8,.54);
    box(armR,.22,.14,.28,armor,0,-.72,.05);
  }else if(k==='cryo'){
    // Kryonik: a slim coat of ice plates, crystal shards over the shoulders, a frost core in the chest and an ice staff
    box(body,.56,.7,.36,armor,0,1.4,0);box(body,.5,.04,.38,glow,0,1.12,0);
    const core=mesh(body,new THREE.OctahedronGeometry(.11),glow,0,1.48,.2);core.scale.set(1,1.4,.6);
    for(const s of [-1,1]){const sh=mesh(body,new THREE.OctahedronGeometry(.16),armor,s*.36,1.82,0);sh.scale.set(1,1.6,1);sh.rotation.z=s*-.4;
      const tip=mesh(body,new THREE.ConeGeometry(.05,.34,5),glow,s*.44,2.04,-.02);tip.rotation.z=s*-.45}
    box(body,.32,.34,.34,armor,0,1.95,0);box(body,.26,.06,.04,glow,0,1.97,.18);
    const crest=mesh(body,new THREE.ConeGeometry(.07,.3,4),glow,0,2.22,-.04);crest.rotation.x=-.25;
    box(body,.5,.55,.06,dark,0,1.32,-.21);
    const staff=mesh(armR,new THREE.CylinderGeometry(.03,.03,1.5,6),dark,0,-.45,.2);staff.rotation.x=.15;
    const gem=mesh(armR,new THREE.OctahedronGeometry(.12),glow,0,.32,.31);gem.scale.set(.8,1.5,.8);
  }else{
    mesh(body,new THREE.CylinderGeometry(.34,.26,.72,8),armor,0,1.4,0);
    mesh(body,new THREE.CylinderGeometry(.36,.28,.36,8,1,true),dark,0,1.9,0);
    const ring=mesh(body,new THREE.TorusGeometry(.36,.025,6,24),glow,0,2.08,0);ring.rotation.x=Math.PI/2;
    mesh(body,new THREE.SphereGeometry(.2,16,12),armor,0,1.98,0);headY=1.98;
    box(body,.24,.05,.04,glow,0,2.0,.18);
    box(body,.4,.5,.2,dark,0,1.45,-.3);box(body,.04,.4,.02,glow,-.1,1.45,-.41);box(body,.04,.4,.02,glow,.1,1.45,-.41);
    drone=mesh(root,new THREE.OctahedronGeometry(.16),glow);
  }
  let cape=null,halo=null,wings=null;
  // chest front and height per class, so emblems and reactors sit on the armour
  const chestZ={striker:.19,guardian:.29,technician:.31,pyro:.21,cryo:.19}[k]||.2,chestY=k==='guardian'?1.5:1.45;
  const accs=Array.isArray(skin.acc)?skin.acc:skin.acc?[skin.acc]:[];
  const capeMat=skin.cape!=null?new THREE.MeshStandardMaterial({color:skin.cape,metalness:.2,roughness:.75,transparent:true,side:THREE.DoubleSide}):dark;
  if(capeMat!==dark)K.mats.push(capeMat);
  for(const acc of accs)switch(acc){
    case 'cape':{cape=new THREE.Group();cape.position.set(0,1.75,-.22);body.add(cape);
      box(cape,.62*W,1.15,.03,capeMat,0,-.58,0);box(cape,.62*W,.04,.04,glow,0,-1.15,0);break}
    case 'helm':box(body,.4,.38,.42,armor,0,headY+.02,0);box(body,.32,.05,.03,glow,0,headY+.05,.22);break;
    case 'mask':box(body,.32,.22,.05,accent,0,headY-.02,.2);for(const s of [-1,1])box(body,.08,.035,.02,glow,s*.07,headY+.03,.23);break;
    case 'ears':for(const s of [-1,1]){const e=mesh(body,new THREE.ConeGeometry(.06,.22,4),accent,s*.12,headY+.3,0);e.rotation.z=-s*.12}break;
    case 'reactor':{const r=mesh(body,new THREE.CylinderGeometry(.09,.09,.04,20),glow,0,chestY,chestZ+.02);r.rotation.x=Math.PI/2;
      const t=mesh(body,new THREE.TorusGeometry(.12,.025,6,24),accent,0,chestY,chestZ+.02);break}
    case 'emblem':{const e=mesh(body,shapeGeo(EMBLEMS[skin.emblem]||EMBLEMS.star),glow,0,chestY,chestZ+.01);break}
    case 'wings':{wings=new THREE.Group();wings.position.set(0,1.62,-.24);body.add(wings);
      for(const s of [-1,1]){const w=mesh(wings,shapeGeo(WING,.03),accent,0,0,0);w.scale.set(s*.95,.95,1);w.rotation.y=s*.35;
        const e=mesh(wings,shapeGeo(WING.slice(0,5),.035),glow,0,0,0);e.scale.set(s*.95,.95,1);e.rotation.y=s*.35}break}
    case 'shoulders':for(const s of [-1,1]){box(body,.36,.22,.5,accent,s*(k==='guardian'?.72:.46),headY-.24,0).rotation.z=s*-.25;box(body,.37,.04,.51,glow,s*(k==='guardian'?.72:.46),headY-.33,0).rotation.z=s*-.25}break;
    case 'halo':{halo=mesh(body,new THREE.TorusGeometry(.3,.025,8,32),glow,0,headY+.18,-.2);break}
    case 'quiver':{const q=mesh(body,new THREE.CylinderGeometry(.08,.07,.6,10),dark,.12,1.55,-.28);q.rotation.z=-.4;
      for(let i=0;i<3;i++){const a=mesh(body,new THREE.CylinderGeometry(.012,.012,.3,4),glow,.24+i*.03,1.92-i*.03,-.28);a.rotation.z=-.4}break}
    case 'skull':box(body,.38,.36,.4,accent,0,headY+.02,0);for(const s of [-1,1])box(body,.09,.08,.02,dark,s*.08,headY+.05,.21);box(body,.16,.03,.02,dark,0,headY-.08,.21);break;
    case 'tiara':for(let i=-1;i<=1;i++){const t=mesh(body,new THREE.ConeGeometry(.035,i?.12:.2,4),glow,i*.09,headY+.22+(i?0:.04),.12);t.rotation.x=-.2}break;
    case 'wingedHelm':box(body,.38,.34,.4,armor,0,headY+.02,0);for(const s of [-1,1]){const w=mesh(body,shapeGeo([[0,0],[.22,.16],[.3,.12],[.2,.02]],.02),glow,s*.2,headY+.08,0);w.scale.x=s;w.rotation.y=s*.3}break;
    case 'necklace':{const n=mesh(body,new THREE.TorusGeometry(.2,.022,6,24),glow,0,headY-.2,.02);n.rotation.x=Math.PI/2.3;break}
    case 'amulet':{const a=mesh(body,new THREE.OctahedronGeometry(.08),glow,0,chestY+.12,chestZ+.04);mesh(body,new THREE.TorusGeometry(.1,.015,6,20),accent,0,chestY+.12,chestZ+.03);break}
    case 'belt':box(body,.56*W,.08,.42,accent,0,1.03,0);box(body,.12,.1,.04,glow,0,1.03,.21);break;
    case 'hood':{const h=mesh(body,new THREE.SphereGeometry(.27,16,10,0,Math.PI*2,0,Math.PI*.6),dark,0,headY-.02,-.03);h.material=dark;
      const r=mesh(body,new THREE.TorusGeometry(.22,.02,6,20),glow,0,headY-.06,.06);r.rotation.x=.3;break}
    case 'horns':for(const s of [-1,1]){const h=mesh(body,new THREE.ConeGeometry(.07,.48,6),glow,s*.2,headY+.3,0);h.rotation.z=-s*.5}break;
    case 'crest':box(body,.05,.22,.5,glow,0,headY+.3,-.02);box(body,.12,.06,.52,armor,0,headY+.2,-.02);break;
    case 'crown':{const r=mesh(body,new THREE.TorusGeometry(.2,.03,6,20),glow,0,headY+.24,0);r.rotation.x=Math.PI/2;
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;mesh(body,new THREE.ConeGeometry(.04,.18,5),glow,Math.cos(a)*.2,headY+.34,Math.sin(a)*.2)}break}
    case 'antenna':for(const s of [-1,1]){const a=mesh(body,new THREE.CylinderGeometry(.012,.012,.5,4),dark,s*.14,headY+.3,-.05);a.rotation.z=-s*.25;mesh(body,new THREE.SphereGeometry(.05,8,6),glow,s*.2,headY+.55,-.05)}break;
  }
  const C=common(root,K,team,1,W*.75);
  return{root,body,legL,legR,armL,armR,drone,cape,...C,mats:K.mats,flash:K.flash,height:2.3,fx:skin.fx||null,
    anim(dt,t,sp,amp){if(cape)cape.rotation.x=-.15-amp*.55+Math.sin(t*6)*.04*amp;if(halo)halo.rotation.z=t*.8;
      if(wings)wings.children.forEach((w,i)=>w.rotation.y=(i%4<2?-1:1)*(.35+Math.sin(t*3)*.08+amp*.25))}};
}

// ---------- NPCs ----------
export function buildNpc(key,team){
  const C=NPCS[key],K=kit(0x2a1a22,C.color,team),{armor,dark,glow}=K,root=new THREE.Group(),body=new THREE.Group();root.add(body);
  let legL=null,legR=null,armL=null,armR=null,spin=null,scale=1,hover=0;
  if(key==='drone'){hover=1.4;mesh(body,new THREE.SphereGeometry(.42,16,12),armor,0,0,0);mesh(body,new THREE.SphereGeometry(.13,10,8),glow,0,.02,.38);
    spin=mesh(body,new THREE.TorusGeometry(.6,.04,6,28),glow);spin.rotation.x=Math.PI/2;
    for(const s of [-1,1])box(body,.5,.05,.18,dark,s*.55,0,0);}
  else if(key==='brute'){scale=1.3;
    legL=new THREE.Group();legL.position.set(-.3,.9,0);body.add(legL);legR=new THREE.Group();legR.position.set(.3,.9,0);body.add(legR);
    for(const L of [legL,legR]){box(L,.32,.9,.36,armor,0,-.45,0)}
    box(body,1.2,.9,.8,armor,0,1.45,.1).rotation.x=.25;box(body,.8,.1,.05,glow,0,1.5,.55);
    box(body,.4,.36,.4,dark,0,2.0,.35);box(body,.3,.06,.04,glow,0,2.02,.56);
    armL=new THREE.Group();armL.position.set(-.8,1.75,.1);body.add(armL);armR=new THREE.Group();armR.position.set(.8,1.75,.1);body.add(armR);
    for(const A of [armL,armR]){box(A,.36,1.1,.4,armor,0,-.5,0);box(A,.46,.36,.46,dark,0,-1.15,0)}}
  else if(key==='sentinel'){
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2,l=box(body,.08,1.1,.08,dark,Math.cos(a)*.35,.5,Math.sin(a)*.35);l.rotation.set(Math.sin(a)*.35,0,-Math.cos(a)*.35)}
    mesh(body,new THREE.CylinderGeometry(.35,.42,.6,8),armor,0,1.25,0);mesh(body,new THREE.SphereGeometry(.24,12,8),dark,0,1.62,0);
    const barrel=mesh(body,new THREE.CylinderGeometry(.07,.09,1.2,8),dark,0,1.62,.55);barrel.rotation.x=Math.PI/2;mesh(body,new THREE.SphereGeometry(.1,8,6),glow,0,1.62,1.17);}
  else if(key==='shard'||key==='fshard'){hover=1.6;
    const cr=mesh(body,new THREE.OctahedronGeometry(.8,0),new THREE.MeshStandardMaterial({color:C.color,emissive:C.color,emissiveIntensity:.6,metalness:.1,roughness:.1,transparent:true,opacity:.85}));cr.scale.set(.7,1.4,.7);
    spin=mesh(body,new THREE.TorusGeometry(1.1,.04,6,40),glow);spin.rotation.x=Math.PI/2;
    const beam=mesh(root,new THREE.CylinderGeometry(.06,.06,8,6,1,true),new THREE.MeshBasicMaterial({color:HDR(C.color,1.6),transparent:true,opacity:.5}));beam.position.y=4}
  else if(key==='warden'){hover=1.5;
    // shield bearer: an armoured core with a hexagonal shield frame turning around it
    mesh(body,new THREE.OctahedronGeometry(.5,0),armor,0,0,0).scale.set(1,1.3,1);mesh(body,new THREE.SphereGeometry(.16,10,8),glow,0,.05,.42);
    spin=mesh(body,new THREE.TorusGeometry(.95,.07,4,6),glow);spin.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++){const p=box(body,.5,.7,.06,dark,Math.cos(i*2.1)*.75,0,Math.sin(i*2.1)*.75);p.rotation.y=-i*2.1+Math.PI/2}}
  else if(key==='dummy'){
    // training target on a post: three rings facing every way
    mesh(body,new THREE.CylinderGeometry(.08,.12,1.2,8),dark,0,.6,0);mesh(body,new THREE.CylinderGeometry(.5,.6,.12,16),armor,0,.06,0);
    const head=new THREE.Group();head.position.y=1.75;body.add(head);
    mesh(head,new THREE.CylinderGeometry(.75,.75,.1,28),armor).rotation.x=Math.PI/2;
    for(const [r,m] of [[.62,glow],[.4,dark],[.18,glow]]){const t=mesh(head,new THREE.TorusGeometry(r,.05,6,28),m);t.position.z=.06;const b=mesh(head,new THREE.TorusGeometry(r,.05,6,28),m);b.position.z=-.06}
    spin=head;scale=1.4;}
  else{hover=1.3;mesh(body,new THREE.SphereGeometry(.34,14,10),armor,0,0,0);
    box(body,.42,.12,.12,glow,0,0,.32);box(body,.12,.42,.12,glow,0,0,.32);spin=mesh(body,new THREE.TorusGeometry(.5,.03,6,24),glow);}
  body.scale.setScalar(scale);
  const CM=common(root,K,team,scale,C.radius);
  return{root,body,legL,legR,armL,armR,...CM,mats:K.mats,flash:K.flash,height:(hover?hover+.6:2.2*scale),
    anim(dt,t){if(hover)body.position.y=hover+Math.sin(t*3+root.id)*.12;if(spin&&key==='dummy')spin.rotation.y+=dt*.6;else if(spin)spin.rotation.z+=dt*3}};
}

// ---------- bosses ----------
export function buildBoss(key){
  const C=BOSSES[key],K=kit({armor:0x3a2a22,seraph:0x8a8270,carrier:0x2e2218}[key]||0x1c1a24,C.color,1),{armor,dark,glow}=K,root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const parts={};let legL=null,legR=null,armL=null,armR=null,scale=1,hover=0;
  if(key==='collector'){scale=1.5;
    legL=new THREE.Group();legL.position.set(-.3,1.1,0);legR=new THREE.Group();legR.position.set(.3,1.1,0);body.add(legL,legR);
    for(const L of [legL,legR]){box(L,.26,1.1,.3,armor,0,-.55,0);box(L,.3,.12,.5,dark,0,-1.08,.1)}
    box(body,.8,1,.45,armor,0,1.7,0);box(body,.5,.08,.04,glow,0,1.9,.24);box(body,.5,.08,.04,glow,0,1.6,.24);
    mesh(body,new THREE.OctahedronGeometry(.3),dark,0,2.5,.05);
    for(let i=0;i<4;i++)mesh(body,new THREE.SphereGeometry(.05,6,6),glow,-.12+i*.08,2.55,.28);
    for(let i=0;i<5;i++){const s=box(body,.05,.7+i*.08,.05,glow,-.3+i*.15,2.3,-.3);s.rotation.x=-.5}
    armL=new THREE.Group();armL.position.set(-.6,2.1,0);armR=new THREE.Group();armR.position.set(.6,2.1,0);body.add(armL,armR);
    for(const A of [armL,armR]){box(A,.2,1.2,.22,armor,0,-.6,0);for(let i=-1;i<=1;i++){const cl=mesh(A,new THREE.ConeGeometry(.05,.6,5),glow,i*.08,-1.45,.1);cl.rotation.x=Math.PI}}}
  else if(key==='armor'){scale=1.35;
    legL=new THREE.Group();legL.position.set(-.55,1.1,0);legR=new THREE.Group();legR.position.set(.55,1.1,0);body.add(legL,legR);
    for(const L of [legL,legR]){box(L,.55,1.1,.6,armor,0,-.55,0)}
    box(body,2,1.4,1.3,armor,0,1.9,0);for(let i=0;i<4;i++)box(body,.06,1.1,.04,glow,-.6+i*.4,1.9,.66);
    box(body,.6,.4,.5,dark,0,2.8,.35);box(body,.4,.06,.04,glow,0,2.82,.61);
    for(const s of [-1,1]){const sp=mesh(body,new THREE.ConeGeometry(.2,.8,6),dark,s*.9,2.85,0);sp.rotation.z=-s*.5}
    armL=new THREE.Group();armL.position.set(-1.3,2.4,0);armR=new THREE.Group();armR.position.set(1.3,2.4,0);body.add(armL,armR);
    for(const A of [armL,armR]){box(A,.6,1.6,.7,armor,0,-.8,0);box(A,.8,.6,.8,dark,0,-1.8,0);box(A,.82,.06,.82,glow,0,-1.5,0)}}
  else if(key==='voice'){hover=2.6;scale=1.3;
    parts.core=mesh(body,new THREE.IcosahedronGeometry(.75,1),glow);
    parts.shell=mesh(body,new THREE.IcosahedronGeometry(1.05,0),new THREE.MeshStandardMaterial({color:0x10182a,metalness:.8,roughness:.25,wireframe:true,transparent:true}));
    parts.r1=mesh(body,new THREE.TorusGeometry(1.6,.05,6,48),glow);parts.r2=mesh(body,new THREE.TorusGeometry(2,.04,6,48),glow);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,t=box(body,.05,1.6,.05,dark,Math.cos(a)*.6,-1.2,Math.sin(a)*.6);t.rotation.set(Math.sin(a)*.2,0,Math.cos(a)*.2)}}
  else if(key==='archivist'){hover=1.2;scale=1.3;
    const robe=mesh(body,new THREE.ConeGeometry(.9,2.6,8,1,true),dark,0,1.1,0);robe.material=dark;
    mesh(body,new THREE.CylinderGeometry(.42,.6,.9,8),armor,0,2.5,0);mesh(body,new THREE.SphereGeometry(.3,14,10),armor,0,3.15,0);
    box(body,.5,.07,.05,glow,0,3.17,.27);const hood=mesh(body,new THREE.ConeGeometry(.42,.7,8,1,true),dark,0,3.45,-.05);hood.material=dark;
    mesh(body,new THREE.OctahedronGeometry(.28),glow,0,2.55,.5);
    parts.books=[];for(let i=0;i<5;i++){const g=new THREE.Group();g.position.y=2.4;body.add(g);const b=box(g,.5,.7,.1,armor,1.7,0,0);box(g,.42,.04,.12,glow,1.7,.2,0);g.rotation.y=i/5*Math.PI*2;parts.books.push(g)}}
  else if(key==='omega'){scale=1.45;
    legL=new THREE.Group();legL.position.set(-.5,1.2,0);legR=new THREE.Group();legR.position.set(.5,1.2,0);body.add(legL,legR);
    for(const L of [legL,legR]){box(L,.45,1.2,.5,armor,0,-.6,0);box(L,.05,.8,.02,glow,0,-.5,.26)}
    box(body,1.5,1.3,.9,armor,0,1.95,0);mesh(body,new THREE.OctahedronGeometry(.4),glow,0,2,.5);
    for(const s of [-1,1]){const c=mesh(body,new THREE.OctahedronGeometry(.45),glow,s*1.05,2.75,0);c.scale.set(.6,1.4,.6)}
    box(body,.55,.5,.55,dark,0,2.9,0);box(body,.45,.07,.04,glow,0,2.92,.29);
    parts.r1=mesh(body,new THREE.TorusGeometry(1.1,.05,6,48),glow,0,3.4,-.3);parts.r2=mesh(body,new THREE.TorusGeometry(.8,.03,6,40),glow,0,3.4,-.3);
    armL=new THREE.Group();armL.position.set(-1,2.5,0);armR=new THREE.Group();armR.position.set(1,2.5,0);body.add(armL,armR);
    for(const A of [armL,armR]){box(A,.4,1.4,.45,armor,0,-.7,0);const bl=mesh(A,new THREE.ConeGeometry(.12,1,5),glow,0,-1.8,.15);bl.rotation.x=Math.PI}
    parts.omega=true}
  else if(key==='carrier'){scale=1.4;
    legL=new THREE.Group();legL.position.set(-.5,1,0);legR=new THREE.Group();legR.position.set(.5,1,0);body.add(legL,legR);
    for(const L of [legL,legR]){box(L,.5,1,.55,armor,0,-.5,0);box(L,.6,.14,.75,dark,0,-.95,.1)}
    const torso=box(body,1.6,1.1,1.1,armor,0,1.75,.15);torso.rotation.x=.3;box(body,1.1,.07,.05,glow,0,1.85,.75).rotation.x=.3;
    box(body,.5,.42,.5,dark,0,2.25,.75);box(body,.36,.06,.04,glow,0,2.27,1.01);
    // the burden: a caged core carried on the back
    parts.orb=mesh(body,new THREE.IcosahedronGeometry(.75,1),glow,0,2.75,-.75);
    parts.cage=mesh(body,new THREE.IcosahedronGeometry(1.05,0),new THREE.MeshStandardMaterial({color:0x2a1a10,metalness:.8,roughness:.3,wireframe:true,transparent:true}),0,2.75,-.75);
    for(const s of [-1,1]){const st=box(body,.12,1.3,.12,dark,s*.55,2.2,-.45);st.rotation.x=-.4}
    armL=new THREE.Group();armL.position.set(-1.05,2.2,.2);armR=new THREE.Group();armR.position.set(1.05,2.2,.2);body.add(armL,armR);
    for(const A of [armL,armR]){box(A,.5,1.5,.55,armor,0,-.75,0);box(A,.65,.5,.65,dark,0,-1.65,0);box(A,.67,.06,.67,glow,0,-1.4,0)}}
  else if(key==='manticore'){scale=1.3;
    const torso=mesh(body,new THREE.SphereGeometry(1,18,12),armor,0,1.5,0);torso.scale.set(.8,.7,1.6);
    for(let i=0;i<4;i++)box(body,.9-i*.1,.05,.06,glow,0,1.95-i*.03,.8-i*.5).rotation.x=-.1;
    const head=new THREE.Group();head.position.set(0,1.9,1.55);body.add(head);
    box(head,.7,.6,.7,armor,0,0,0);box(head,.5,.25,.5,dark,0,-.3,.35);for(const s of [-1,1])mesh(head,new THREE.SphereGeometry(.08,8,6),glow,s*.2,.1,.36);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,sp=mesh(head,new THREE.ConeGeometry(.08,.6,5),dark,Math.cos(a)*.42,Math.sin(a)*.42,-.2);sp.rotation.set(Math.PI/2,0,a-Math.PI/2)}
    parts.legs=[];for(const z of [.9,-.9])for(const s of [-1,1]){const g=new THREE.Group();g.position.set(s*.55,1.3,z);body.add(g);box(g,.26,1.3,.3,dark,0,-.6,0);box(g,.3,.1,.45,armor,0,-1.25,.1);parts.legs.push(g)}
    // segmented scorpion tail curling over the back
    parts.tail=new THREE.Group();parts.tail.position.set(0,1.8,-1.4);body.add(parts.tail);let seg=parts.tail;
    for(let i=0;i<6;i++){const g=new THREE.Group();g.position.set(0,i?.45:0,0);g.rotation.x=-.45;seg.add(g);mesh(g,new THREE.SphereGeometry(.26-i*.025,10,8),armor,0,.22,0);seg=g}
    const sting=mesh(seg,new THREE.ConeGeometry(.16,.8,6),glow,0,.7,.1);sting.rotation.x=.6}
  else if(key==='seraph'){hover=2.2;scale=1.25;
    mesh(body,new THREE.ConeGeometry(.6,2,8,1,true),dark,0,-.2,0).material=dark;
    mesh(body,new THREE.CylinderGeometry(.35,.5,1,8),armor,0,1.2,0);mesh(body,new THREE.SphereGeometry(.3,14,10),armor,0,1.95,0);
    box(body,.45,.06,.05,glow,0,1.97,.28);mesh(body,new THREE.OctahedronGeometry(.22),glow,0,1.3,.42);
    const halo=mesh(body,new THREE.TorusGeometry(.5,.05,6,32),glow,0,2.5,-.1);halo.rotation.x=Math.PI/2-.3;
    parts.wings=[];for(let i=0;i<3;i++)for(const s of [-1,1]){const g=new THREE.Group();g.position.set(s*.25,1.5+(1-i)*.45,-.25);body.add(g);
      const w=box(g,1.9-i*.3,.05,.6,armor,s*(.95-i*.15),0,0);w.rotation.z=s*(.25-i*.3);box(g,1.9-i*.3,.07,.08,glow,s*(.95-i*.15),0,.32).rotation.z=s*(.25-i*.3);
      g.userData={s,i};parts.wings.push(g)}}
  else if(key==='archon'){scale=1.5;
    legL=new THREE.Group();legL.position.set(-.4,1.2,0);legR=new THREE.Group();legR.position.set(.4,1.2,0);body.add(legL,legR);
    for(const L of [legL,legR]){box(L,.4,1.2,.45,armor,0,-.6,0);box(L,.42,.06,.47,glow,0,-.3,0)}
    const robe=mesh(body,new THREE.ConeGeometry(1,1.6,8,1,true),dark,0,1.1,0);robe.material=dark;
    box(body,1.3,1.2,.8,armor,0,2.1,0);box(body,.06,1,.04,glow,0,2.1,.41);
    for(const s of [-1,1]){box(body,.6,.25,.9,armor,s*.85,2.75,0).rotation.z=-s*.2;box(body,.62,.05,.92,glow,s*.85,2.62,0).rotation.z=-s*.2}
    box(body,.5,.55,.5,dark,0,3.0,0);box(body,.4,.06,.04,glow,0,3.02,.26);
    for(let i=0;i<5;i++){const a=(i-2)*.32;mesh(body,new THREE.ConeGeometry(.06,.45,5),glow,Math.sin(a)*.3,3.45,Math.cos(a)*.15-.05)}
    parts.r1=mesh(body,new THREE.TorusGeometry(1.4,.05,6,48),glow,0,2.6,-.7);parts.r2=mesh(body,new THREE.TorusGeometry(1,.03,6,40),glow,0,2.6,-.7);parts.omega=true;
    armL=new THREE.Group();armL.position.set(-.95,2.6,0);armR=new THREE.Group();armR.position.set(.95,2.6,0);body.add(armL,armR);
    for(const A of [armL,armR])box(A,.36,1.3,.4,armor,0,-.65,0);
    box(armR,.1,2.6,.06,glow,0,-1.6,.3);box(armR,.5,.08,.2,armor,0,-.4,.3);
    const scale2=new THREE.Group();scale2.position.set(0,-1.4,.2);armL.add(scale2);box(scale2,1,.04,.04,glow,0,0,0);
    for(const s of [-1,1])mesh(scale2,new THREE.CylinderGeometry(.22,.18,.05,10),armor,s*.48,-.35,0)}
  else{scale=1.25;
    const ab=mesh(body,new THREE.SphereGeometry(1,20,14),armor,0,1.3,-1.2);ab.scale.set(1.1,.8,1.5);
    for(let i=0;i<3;i++){const st=mesh(body,new THREE.TorusGeometry(.95-i*.12,.04,6,32),glow,0,1.3,-.7-i*.55);st.scale.set(1.15,.85,1)}
    box(body,1,.8,1,armor,0,1.6,.4);mesh(body,new THREE.SphereGeometry(.4,14,10),dark,0,2.0,1.0);
    for(const s of [-1,1])mesh(body,new THREE.SphereGeometry(.09,8,6),glow,s*.18,2.08,1.35);
    parts.legs=[];for(let i=0;i<3;i++)for(const s of [-1,1]){const g=new THREE.Group();g.position.set(s*.55,1.4,.6-i*.5);body.add(g);const l=box(g,.08,1.6,.08,dark,s*.55,-.5,0);l.rotation.z=s*.9;parts.legs.push(g)}}
  body.scale.setScalar(scale);
  const CM=common(root,K,1,scale,C.radius);
  return{root,body,legL,legR,armL,armR,...CM,mats:K.mats,flash:K.flash,height:(hover?hover+2:3*scale),boss:true,
    anim(dt,t,sp,amp){
      if(hover)body.position.y=hover+Math.sin(t*1.6)*.25;
      if(parts.omega){parts.r1.rotation.z=t*.9;parts.r2.rotation.z=-t*1.3}
      else if(parts.r1){parts.r1.rotation.x=t*.8;parts.r1.rotation.y=t*.5;parts.r2.rotation.y=-t*.6;parts.r2.rotation.z=t*.4;parts.shell.rotation.y=t*.3;parts.core.scale.setScalar(1+Math.sin(t*5)*.08)}
      if(parts.books)parts.books.forEach((g,i)=>{g.rotation.y=t*.7+i/5*Math.PI*2;g.position.y=2.4+Math.sin(t*2+i)*.2});
      if(parts.legs)parts.legs.forEach((g,i)=>g.rotation.x=Math.sin(t*8+i)*.35*amp);
      if(parts.orb){parts.orb.scale.setScalar(1+Math.sin(t*4)*.1);parts.cage.rotation.y=t*.6;parts.cage.rotation.x=t*.3}
      if(parts.tail){parts.tail.rotation.y=Math.sin(t*1.7)*.25;parts.tail.rotation.x=Math.sin(t*2.3)*.12}
      if(parts.wings)parts.wings.forEach(g=>g.rotation.z=g.userData.s*Math.sin(t*3+g.userData.i*.6)*.22)}};
}

// ---------- map environments ----------
const gridFrag=`uniform float t,R;uniform vec3 cA,cB,acc;uniform vec2 b0,b1;varying vec2 vP;
  float ln(vec2 p,float s){vec2 g=p/s;vec2 d=abs(fract(g-.5)-.5)/fwidth(g);return 1.-min(min(d.x,d.y),1.);}
  void main(){float r=length(vP);
    float inside=1.-smoothstep(R-.3,R+.2,r);
    float g=ln(vP,2.)*.16+ln(vP,8.)*.42;
    float pulse=.55+.45*sin(r*.35-t*1.6);
    vec3 c=mix(cA,cB,smoothstep(-14.,14.,vP.x));
    float edge=exp(-abs(r-R)*5.)*1.1;
    float mid=exp(-abs(r-5.)*6.)*.6;
    float e0=exp(-abs(length(vP-b0)-4.)*7.)*.8,e1=exp(-abs(length(vP-b1)-4.)*7.)*.8;
    vec3 col=c*(g*pulse*inside*smoothstep(R+2.,4.,r)+edge)+acc*mid+vec3(.15,.55,1.)*e0+vec3(1.,.2,.55)*e1;
    gl_FragColor=vec4(col,1.);}`;
const skyFrag=`uniform vec3 c0,c1;varying vec3 vW;
  float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  void main(){vec3 d=normalize(vW);float k=smoothstep(-.05,.6,d.y);vec3 col=mix(c0,c1,k);
    vec3 q=floor(d*180.);float s=step(.996,h(q))*smoothstep(.05,.3,d.y);col+=vec3(s)*.8;gl_FragColor=vec4(col,1.);}`;
const lavaFrag=`uniform float t;varying vec2 vU;
  void main(){vec2 p=vU*6.;float n=sin(p.x*1.3+t*1.7)*sin(p.y*1.1-t*1.3)+sin((p.x+p.y)*.8+t*.9);
    float r=length(vU-.5)*2.;vec3 c=mix(vec3(1.,.25,.02),vec3(1.,.75,.2),.5+.5*n);c*=1.05*(1.-smoothstep(.85,1.,r));gl_FragColor=vec4(c,1.-smoothstep(.9,1.,r));}`;

export function buildArena(scene,mapKey,hiQ){
  const map=MAPS[mapKey],T=map.theme,g=new THREE.Group(),R=map.r,updaters=[];
  scene.fog.color.set(T.fog);scene.background=new THREE.Color(T.fog);
  // lights
  g.add(new THREE.HemisphereLight(0x8fb4ff,0x0a0a14,.7));
  const sun=new THREE.DirectionalLight(0xd8e4ff,1.35);sun.position.set(14,32,16);
  if(hiQ){sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=sc.bottom=-R-4;sc.right=sc.top=R+4;sc.near=1;sc.far=90;sun.shadow.bias=-.0008;sun.shadow.normalBias=.03}
  g.add(sun,sun.target);
  map.bases.forEach((b,i)=>{const l=new THREE.PointLight(TEAM_COL[i],14,22,1.2);l.position.set(b.x,3,b.z);g.add(l)});
  // floor and grid
  const floor=new THREE.Mesh(new THREE.CircleGeometry(R+2,96),new THREE.MeshStandardMaterial({color:T.floor,metalness:.6,roughness:.45,envMapIntensity:.15}));
  floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;g.add(floor);
  const gu={t:{value:0},R:{value:R},cA:{value:new THREE.Vector3(...T.gridA)},cB:{value:new THREE.Vector3(...T.gridB)},acc:{value:new THREE.Color(T.accent)},b0:{value:new THREE.Vector2(map.bases[0].x,-map.bases[0].z)},b1:{value:new THREE.Vector2(map.bases[1].x,-map.bases[1].z)}};
  const grid=new THREE.Mesh(new THREE.PlaneGeometry(R*2+12,R*2+12),new THREE.ShaderMaterial({uniforms:gu,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:gridFrag}));
  grid.rotation.x=-Math.PI/2;grid.position.y=.02;g.add(grid);updaters.push((dt,t)=>gu.t.value=t);
  map.bases.forEach((b,i)=>{const d=new THREE.Mesh(new THREE.CircleGeometry(4,48),new THREE.MeshBasicMaterial({color:TEAM_COL[i],transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));d.rotation.x=-Math.PI/2;d.position.set(b.x,.03,b.z);g.add(d)});
  // pillars
  const pm=new THREE.MeshStandardMaterial({color:0x161c2c,metalness:.8,roughness:.3,envMapIntensity:.6});
  for(const [x,z,r] of map.pillars){
    const c=x<-1?TEAM_COL[0]:x>1?TEAM_COL[1]:T.accent;let geo,m,h=5;
    if(T.pillar==='box'){h=4.4;geo=new THREE.BoxGeometry(r*1.5,h,r*1.5);m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x2a1d16,metalness:.7,roughness:.55}));m.rotation.y=Math.PI/4}
    else if(T.pillar==='crystal'){h=6;geo=new THREE.CylinderGeometry(r*.45,r,h,5);m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x9fd8ff,metalness:.1,roughness:.08,transparent:true,opacity:.55,emissive:0x15354a}))}
    else if(T.pillar==='wall'){h=3.2;geo=new THREE.CylinderGeometry(r*1.02,r*1.08,h,8);m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x1a1630,metalness:.75,roughness:.35}))}
    else if(T.pillar==='obelisk'){h=7.5;geo=new THREE.CylinderGeometry(r*.3,r*.95,h,4);m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x1a0c12,metalness:.6,roughness:.35}));m.rotation.y=Math.PI/4}
    else{geo=new THREE.CylinderGeometry(r*.82,r,h,6);m=new THREE.Mesh(geo,pm)}
    m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;g.add(m);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:HDR(T.pillar==='crystal'?0xdff6ff:c,1.3)}));e.position.copy(m.position);e.rotation.copy(m.rotation);g.add(e);
    if(T.pillar==='box'){for(const y of [.6,3.6]){const s=new THREE.Mesh(new THREE.BoxGeometry(r*1.52,.14,r*1.52),new THREE.MeshBasicMaterial({color:HDR(T.accent,1.8)}));s.position.set(x,y,z);s.rotation.y=Math.PI/4;g.add(s)}}
    else if(T.pillar==='crystal'){const sh=new THREE.Mesh(new THREE.OctahedronGeometry(r*.45),new THREE.MeshBasicMaterial({color:HDR(0x9ffcff,2)}));sh.position.set(x,h+1.2,z);g.add(sh);updaters.push((dt,t)=>{sh.rotation.y+=dt;sh.position.y=h+1.2+Math.sin(t*1.5+x)*.25})}
    else if(T.pillar==='obelisk'){for(const y of [1.5,3.5,5.5]){const s=new THREE.Mesh(new THREE.CylinderGeometry(r*(.95-y/h*.6)+.02,r*(.95-y/h*.6)+.04,.12,4,1,true),new THREE.MeshBasicMaterial({color:HDR(T.accent,2),side:THREE.DoubleSide}));s.position.set(x,y,z);s.rotation.y=Math.PI/4;g.add(s)}}
    else{const band=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r*.92,.12,6,1,true),new THREE.MeshBasicMaterial({color:HDR(c,1.6),side:THREE.DoubleSide}));band.position.set(x,3.4,z);g.add(band)}
  }
  // hazards
  for(const hz of map.hazards){
    const u={t:{value:0}};const lava=new THREE.Mesh(new THREE.CircleGeometry(hz.r,40),new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,
      vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:lavaFrag}));
    lava.rotation.x=-Math.PI/2;lava.position.set(hz.x,.05,hz.z);g.add(lava);updaters.push((dt,t)=>u.t.value=t+hz.x);
    const rim=new THREE.Mesh(new THREE.RingGeometry(hz.r,hz.r+.25,40),new THREE.MeshStandardMaterial({color:0x2a1208,metalness:.6,roughness:.5}));rim.rotation.x=-Math.PI/2;rim.position.set(hz.x,.06,hz.z);g.add(rim);
    const l=new THREE.PointLight(0xff6a1a,6,10,1.5);l.position.set(hz.x,1.2,hz.z);g.add(l);
  }
  // teleport gates: each pair has its own colour, a glowing floor disc, an upright spinning ring and a light
  (map.portals||[]).forEach((pair,pi)=>{const col=PORTAL_COL[pi%PORTAL_COL.length];
    for(const p of pair){
      const disc=new THREE.Mesh(new THREE.CircleGeometry(1.3,40),new THREE.MeshBasicMaterial({color:HDR(col,1.2),transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));
      disc.rotation.x=-Math.PI/2;disc.position.set(p.x,.06,p.z);g.add(disc);
      const base=new THREE.Mesh(new THREE.RingGeometry(1.3,1.55,40),new THREE.MeshBasicMaterial({color:HDR(col,2),side:THREE.DoubleSide}));base.rotation.x=-Math.PI/2;base.position.set(p.x,.07,p.z);g.add(base);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.09,8,48),new THREE.MeshBasicMaterial({color:HDR(col,2.2)}));ring.position.set(p.x,1.6,p.z);g.add(ring);
      const inner=new THREE.Mesh(new THREE.TorusGeometry(.8,.05,6,40),new THREE.MeshBasicMaterial({color:HDR(col,1.6),transparent:true,opacity:.7}));inner.position.copy(ring.position);g.add(inner);
      const l=new THREE.PointLight(col,5,9,1.5);l.position.set(p.x,1.4,p.z);g.add(l);
      updaters.push((dt,t)=>{ring.rotation.y=t*1.4+pi;inner.rotation.x=t*2.1;inner.rotation.y=-t*.9;disc.material.opacity=.28+Math.sin(t*3+pi)*.08})}});
  // wall, rim, skyline, sky
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(R+1.6,R+1.6,1.4,96,1,true),new THREE.MeshStandardMaterial({color:0x10162a,metalness:.7,roughness:.4,side:THREE.DoubleSide}));wall.position.y=.7;wall.receiveShadow=true;g.add(wall);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R+1.6,.07,6,128),new THREE.MeshBasicMaterial({color:HDR(T.rim,1.6)}));rim.rotation.x=Math.PI/2;rim.position.y=1.4;g.add(rim);
  const bm=new THREE.MeshStandardMaterial({color:0x0a0e18,metalness:.5,roughness:.6});
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2+rnd(-.04,.04),r=rnd(R+18,R+54),h=rnd(6,34),w=rnd(3,8);
    const geo=new THREE.BoxGeometry(w,h,w),m=new THREE.Mesh(geo,bm);m.position.set(Math.cos(a)*r,h/2-1,Math.sin(a)*r);m.rotation.y=-a;g.add(m);
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:T.skyline[i%4],transparent:true,opacity:.28}));e.position.copy(m.position);e.rotation.copy(m.rotation);g.add(e)}
  const sky=new THREE.Mesh(new THREE.SphereGeometry(220,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{c0:{value:new THREE.Color(T.sky[0])},c1:{value:new THREE.Color(T.sky[1])}},
    vertexShader:`varying vec3 vW;void main(){vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:skyFrag}));
  g.add(sky);
  // per-map landmark
  if(mapKey==='core'){const h=new THREE.Mesh(new THREE.TorusGeometry(9,.12,6,96),new THREE.MeshBasicMaterial({color:HDR(0xffc66d,1.4),transparent:true,opacity:.6}));h.position.y=14;h.rotation.x=Math.PI/2;g.add(h);updaters.push((dt,t)=>{h.rotation.z=t*.1;h.position.y=14+Math.sin(t*.6)*.5})}
  if(mapKey==='forge'){for(let i=0;i<3;i++){const gear=new THREE.Mesh(new THREE.TorusGeometry(7+i*2,.9,6,12),new THREE.MeshStandardMaterial({color:0x2a160c,metalness:.8,roughness:.4,emissive:0x2a0800}));
    const a=i*2.1+.5;gear.position.set(Math.cos(a)*(R+30),14+i*3,Math.sin(a)*(R+30));gear.lookAt(0,10,0);g.add(gear);updaters.push(dt=>gear.rotation.z+=dt*.15*(i%2?1:-1))}}
  if(mapKey==='archive'){const ring=new THREE.Group();ring.position.y=11;g.add(ring);
    for(let i=0;i<48;i++){const a=i/48*Math.PI*2,c=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),new THREE.MeshBasicMaterial({color:HDR(i%3?0x9ffcff:0x6acbff,1.3)}));c.position.set(Math.cos(a)*15,Math.sin(i)*.6,Math.sin(a)*15);ring.add(c)}
    updaters.push(dt=>ring.rotation.y+=dt*.08)}
  if(mapKey==='sanctum'){for(let i=0;i<6;i++){const a=i/6*Math.PI*2,r=new THREE.Mesh(new THREE.TorusGeometry(2.2,.08,6,40),new THREE.MeshBasicMaterial({color:HDR(i%2?0xff527e:0xac8dff,1.6)}));
    r.position.set(Math.cos(a)*(R+6),9,Math.sin(a)*(R+6));g.add(r);updaters.push((dt,t)=>{r.rotation.y=t*.7+i;r.position.y=9+Math.sin(t+i)*.8})}}
  if(mapKey==='observ'){const dome=new THREE.Group();dome.position.y=16;g.add(dome);
    for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(8+i*3,.1,6,96),new THREE.MeshBasicMaterial({color:HDR(i===1?0xff7de9:0x7df9ff,1.4),transparent:true,opacity:.55}));r.rotation.x=Math.PI/2+i*.35;dome.add(r)}
    const star=new THREE.Mesh(new THREE.IcosahedronGeometry(1.4),new THREE.MeshBasicMaterial({color:HDR(0xdff6ff,2.4)}));dome.add(star);
    updaters.push((dt,t)=>{dome.rotation.y=t*.12;dome.children.forEach((c,i)=>{if(i<3)c.rotation.z=t*(.1+i*.05)});star.rotation.x=t*.5})}
  // relic pedestal in the centre
  const pg=new THREE.CylinderGeometry(1.6,1.9,.3,6),ped=new THREE.Mesh(pg,pm);ped.position.y=.15;ped.receiveShadow=true;g.add(ped);
  const pe=new THREE.LineSegments(new THREE.EdgesGeometry(pg),new THREE.LineBasicMaterial({color:HDR(T.accent,1.6)}));pe.position.y=.15;g.add(pe);
  // ambient particles
  const N=hiQ?500:220,pos=new Float32Array(N*3),seed=[];
  for(let i=0;i<N;i++){const a=rnd(0,Math.PI*2),r=Math.sqrt(Math.random())*(R+8);pos[i*3]=Math.cos(a)*r;pos[i*3+1]=rnd(0,14);pos[i*3+2]=Math.sin(a)*r;seed.push(rnd(.3,1))}
  const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const amb=new THREE.Points(ag,new THREE.PointsMaterial({color:HDR(T.ambColor,T.amb==='snow'?1:1.8),size:T.amb==='snow'?.18:.12,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));amb.frustumCulled=false;g.add(amb);
  updaters.push((dt,t)=>{for(let i=0;i<N;i++){const s=seed[i];
    if(T.amb==='snow'){pos[i*3+1]-=dt*s*1.2;pos[i*3]+=Math.sin(t+i)*dt*.3;if(pos[i*3+1]<0)pos[i*3+1]=14}
    else if(T.amb==='embers'){pos[i*3+1]+=dt*s*1.6;pos[i*3]+=Math.sin(t*2+i)*dt*.5;if(pos[i*3+1]>14)pos[i*3+1]=0}
    else{pos[i*3+1]+=dt*s*.35;if(pos[i*3+1]>14)pos[i*3+1]=0}}ag.attributes.position.needsUpdate=true});
  scene.add(g);
  return{group:g,mapKey,
    update(dt,t){for(const f of updaters)f(dt,t)},
    dispose(){scene.remove(g);g.traverse(o=>{if(o.geometry&&o.geometry!==DISC_GEO)o.geometry.dispose();if(o.material){o.material.map?.dispose?.();o.material.dispose()}})}};
}
