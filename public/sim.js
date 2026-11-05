// Relikvie Aréna — authoritative simulation. Runs on the server and, for offline matches, in the browser.
// Pure logic: no rendering. Visual effects leave the simulation as events in M.events.
import {CLASSES,CLASS_KEYS,MAPS,MODES,NPCS,BOSSES,BOSS_KEYS,ENDLESS_MODS,ECHO_MODS,TACTICS,BOT_TACTIC,rollItem,skillDef,MASTERY,masteryKey,BURN,POISON_HEAL,MASTERY_BASIC,MUTATORS,mutatorsOfWeek,arenaLike,EVADES} from './data.js';
export * from './data.js';

export const MATCH_TIME=360, RELIC_EVERY=40, TICK=1/30, TEAM_SIZE=3;
// lag compensation: a human's hits are judged against where targets were on their screen, at most this many seconds back
export const LAG_MAX=.3;
export const TEAM_COL=[0x3fb8ff,0xff3f8e], TEAM_NAME=['Modří','Rudí'];
export const BOT_NAMES=['Rys','Sova','Vega','Kobra','Orin','Mara','Jiskra','Stín','Kestrel','Dusk','Iskra','Nox'];
export const DIFF={easy:{err:2.4,react:.7,skill:.45,dmg:.8,hp:.75},normal:{err:1.3,react:.4,skill:.8,dmg:1,hp:1},hard:{err:.55,react:.2,skill:1,dmg:1.15,hp:1.3}};

Object.setPrototypeOf(DIFF,null); // indexed by the difficulty name a player sends; see the note at the end of data.js
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const r2=v=>Math.round(v*100)/100;
// key moments also go to M.log, the timeline shown in the match debrief (hero ult banners carry i and are left out)
const LOGGED={ban:1,feed:1,waveClear:1,point:1};
const fx=(M,e)=>{M.events.push(e);if(LOGGED[e.t]&&!(e.t==='ban'&&e.i)&&M.state==='play'&&M.log.length<80)M.log.push({...e,at:Math.round(M.time)})};
const m=(u,k)=>u.mods[k]||0;

// ---------- match ----------
// Custom rules of a created room: the score to win and the match length relative to the mode (PvP only),
// and whether bots fill the empty seats. A PvP match with another target or length is "custom" (rewards scale with its length).
export const RULES={win:{short:.5,std:1,long:1.5},time:{short:2/3,std:1,long:1.5}};
export function ruleValues(mode,r){
  const D=MODES[mode];r=r||{};if(!D)return{win:0,time:0,bots:true};
  return{win:D.pvp?Math.max(1,Math.ceil(D.win*(RULES.win[r.win]||1))):0,time:D.pvp?Math.round((D.time||MATCH_TIME)*(RULES.time[r.time]||1)):0,bots:r.bots!==false};
}
export const isCustom=(r,mode)=>!!r&&!!MODES[mode]?.pvp&&((r.win||'std')!=='std'||(r.time||'std')!=='std');
export function createMatch(o={}){
  if(typeof o==='string')o={diff:o};
  const mode=MODES[o.mode]?o.mode:'arena',D=o.win>0&&MODES[mode].pvp?{...MODES[mode],win:o.win|0}:MODES[mode];
  const mapKey=MAPS[o.map]&&D.maps.includes(o.map)?o.map:D.maps[0],map=MAPS[mapKey];
  return{mode,D,mapKey,map,units:[],log:[],bossKeys:[],projs:[],zones:[],timers:[],events:[],beams:[],rings:[],loot:[],danger:[],
    score:[0,0],time:0,timeLeft:D.waves?1e9:o.time>0?o.time:D.time||MATCH_TIME,countdown:3,state:'countdown',custom:!!o.custom,
    elim:D.rounds?{n:1,state:'fight',t:0,t0:-1,r:map.r}:null,
    relic:{state:arenaLike(mode)?'wait':'off',t:20},
    points:mode==='control'?map.points.map(p=>({x:p.x,z:p.z,r:4,own:-1,prog:0})):[],
    lives:D.lives||0,wave:0,waveState:'break',waveT:6,bossKey:BOSSES[o.boss]?o.boss:'collector',bossId:0,
    last:o.last||D.last||0,waveBoss:BOSSES[o.waveBoss]?o.waveBoss:null,emod:new Set(o.mods||(D.mutators?mutatorsOfWeek():[])),mission:o.mission||null,
    nextId:1,diffKey:DIFF[o.diff]?o.diff:'normal',diff:DIFF[o.diff]||DIFF.normal,winner:null,rosterVer:1,scoreAcc:0};
}
const NO_PROF={skills:['c0','c1','c2'],pass:[],branch:null,mod:null,ultMod:false,cap:null};
function baseUnit(M,C,team,ctrl,name,kind,key){
  return{id:M.nextId++,kind,key,C,team,ctrl,name,x:0,z:0,vx:0,vz:0,face:0,aimX:0,aimZ:0,maxHp:C.hp,radius:C.radius||.7,
    kills:0,deaths:0,dmgDealt:0,healDone:0,relics:0,npcKills:0,ult:0,input:null,queue:[],lastSeq:0,hist:[],lag:0,
    mods:{},uniq:new Set(),skin:'default',level:1,bag:[],hpScale:1,dmgScale:1,threat:{},prof:NO_PROF,pass:new Set(),title:null,
    ai:{think:0,target:null,strafe:1,strafeT:0,err:{x:0,z:0},lane:0,retreat:false,cd:{},lock:0,acc:0}};
}
export function addUnit(M,k,team,ctrl,name,load){
  if(!CLASSES[k])k='striker';
  const u=baseUnit(M,CLASSES[k],team,ctrl,name,'hero',k);u.clsKey=k;
  if(load){u.mods={...(load.mods||{})};u.uniq=new Set(load.uniq||[]);u.skin=load.skin||'default';u.level=load.level||1;u.title=load.title||null;
    if(load.prof&&Array.isArray(load.prof.skills)&&load.prof.skills.length===3&&load.prof.skills.every(id=>skillDef(k,id))){u.prof=load.prof;u.pass=new Set(load.prof.pass||[])}}
  u.tactic=TACTICS[load?.tactic]?load.tactic:ctrl==='bot'?BOT_TACTIC[k]:'dodge';u.tcd=0;
  // ability mastery: ranks and branches per ability, and how often each was used (the server turns that into mastery XP)
  u.mast=load?.mastery&&typeof load.mastery==='object'?load.mastery:{};u.mcount={};
  if(u.mast[k+':ult']?.b?.[0]===1)u.ult=25;
  if(M.emod.has('swift'))u.mods.cdr=(u.mods.cdr||0)+25;
  // Mutace týdne
  if(M.emod.has('haste'))u.mods.speed=(u.mods.speed||0)+20;
  if(M.emod.has('ultra'))u.mods.ult=(u.mods.ult||0)+100;
  u.maxHp=Math.round(u.C.hp*(1+m(u,'hp')/100)*(M.emod.has('glass')?.65:1));u.radius=k==='guardian'?.85:.7;
  resetUnit(u,M);M.units.push(u);M.rosterVer++;return u;
}
function addNpc(M,key,x,z,hpScale=1,dmgScale=1,team=1){
  const C=NPCS[key],u=baseUnit(M,C,team,'npc',C.name,'npc',key);
  if(team===1){if(M.emod.has('tough'))hpScale*=1.35;if(M.emod.has('fierce'))dmgScale*=1.25}
  u.hpScale=hpScale;u.dmgScale=dmgScale;u.maxHp=Math.round(C.hp*hpScale);
  spawnAt(u,x,z,M);M.units.push(u);M.rosterVer++;fx(M,{t:'spawn',x:r2(u.x),z:r2(u.z),g:u.id});return u;
}
// the tutorial places weak enemy NPCs by hand
export const addTrainingNpc=(M,key,x,z,hpScale=.6,dmgScale=.25)=>addNpc(M,key,x,z,hpScale,dmgScale,1);
function spawnBoss(M,key,scale){
  const C=BOSSES[key],u=baseUnit(M,C,1,'boss',C.name,'boss',key);
  const heroes=M.units.filter(x=>x.kind==='hero').length;
  u.hpScale=scale*(.6+.6*heroes)*M.diff.hp*(M.emod.has('tough')?1.35:1);u.dmgScale=M.diff.dmg*(M.mode==='waves'?.85:1)*(M.emod.has('fierce')?1.25:1);u.maxHp=Math.round(C.hp*u.hpScale);
  const at=M.map.bossAt;spawnAt(u,at.x,at.z,M);u.ai.cd={a:5,b:9,c:12};
  M.units.push(u);M.rosterVer++;M.bossId=u.id;
  fx(M,{t:'ban',ti:C.name,sub:C.title+' · '+C.desc,col:'var(--red)',d:3});fx(M,{t:'spawn',x:r2(u.x),z:r2(u.z),g:u.id});
  return u;
}
function spawnAt(u,x,z,M){
  u.x=x;u.z=z;u.vx=u.vz=0;u.hp=u.maxHp;u.shield=0;u.energy=0;u.cds=[0,0,0];u.atkCd=rnd(.2,1);u.dead=false;u.respawn=0;
  u.st={stun:0,slow:0,silence:0,cloak:0,inv:.5,relic:0,bleed:null,hot:null,fieldAcc:0,hazAcc:0,nanite:null,decon:0,marked:0};u.ambush=0;u.dash=null;u.lastHit=null;u.lastHitT=-99;
  u.face=Math.atan2(-x,-z);collide(u,M.map);u.hist=[];
}
export function resetUnit(u,M){
  const b=M.map.bases[u.team],a=rnd(0,Math.PI*2),r=rnd(0,2.4);
  u.x=b.x+Math.cos(a)*r;u.z=b.z+Math.sin(a)*r;u.vx=u.vz=0;u.face=u.team===0?Math.PI/2:-Math.PI/2;
  u.hp=u.maxHp;u.dlog=[];u.ecd=0;
  // Náskok (ultimate mastery 30): at least 15 % ultimate after every respawn
  if(u.mast?.[u.clsKey+':ult']?.b?.[4]===1)u.ult=Math.max(u.ult||0,15);u.shield=u.pass.has('reserve')?60:0;u.energy=u.uniq.has('capacitor')?100:Math.min(100,60+m(u,'start'));u.cds=[0,0,0];u.atkCd=0;u.dead=false;u.respawn=0;
  u.st={stun:0,slow:0,silence:0,cloak:0,inv:1.5,relic:0,bleed:null,hot:null,fieldAcc:0,hazAcc:0,haste:0,hasteK:1,bulwark:0,nanite:null,decon:0,marked:0};
  u.ambush=0;u.ambushK=0;u.drive=null;u.bomb=null;u.hurtT=-99;u.dash=null;u.lastHit=null;u.lastHitT=-99;u.ai.retreat=false;u.ai.lane=rnd(-12,12);u.hist=[];
}
// Called once all heroes are in: spawns the boss or prepares the first wave.
export function startMatch(M){if(M.mode==='boss')spawnBoss(M,M.bossKey,1);if(M.mode==='ctf')ctfSetup(M)}

const atk=(M,u)=>u.C.atk*(1+m(u,'atk')/100)*(u.ctrl==='bot'?M.diff.dmg:1)*u.dmgScale;
const tech=(M,u)=>u.C.tech*(1+m(u,'tech')/100)*(u.ctrl==='bot'?M.diff.dmg:1);
export const speedOf=u=>u.spd??u.C.speed*(1+(u.mods?.speed||0)/100)*(u.st.slow>0?.6:1)*(u.st.cloak>0?1.12:1)*(u.st.haste>0?u.st.hasteK||1.2:1)*(u.carry!=null?.85:1);
const pw=(M,u)=>Math.max(atk(M,u),tech(M,u));
const maxShield=u=>u.maxHp*.7;
const foes=(M,u)=>M.units.filter(e=>e.team!==u.team&&!e.dead);
const friends=(M,u)=>M.units.filter(e=>e.team===u.team&&!e.dead);
const heroesOf=(M,team)=>M.units.filter(e=>e.kind==='hero'&&e.team===team&&!e.dead);
const near=(arr,p,r)=>arr.filter(e=>d2(e,p)<r+e.radius);
const visibleTo=(u,e)=>!e.dead&&(e.st.cloak<=0||d2(u,e)<3.5);
const later=(M,t,fn)=>M.timers.push({t,fn});
function blocked(map,a,b,pad=0){
  const dx=b.x-a.x,dz=b.z-a.z,L=dx*dx+dz*dz||1;
  for(const [x,z,r] of map.pillars){const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/L,0,1);if(Math.hypot(a.x+dx*t-x,a.z+dz*t-z)<r+pad)return true}
  return false;
}
function inArena(M,p,mg=1){const R=M.map.r,l=Math.hypot(p.x,p.z);if(l>R-mg){p.x*=(R-mg)/l;p.z*=(R-mg)/l}return p}
function clampReach(M,u,p,max){let dx=p.x-u.x,dz=p.z-u.z;const l=Math.hypot(dx,dz);if(l>max){dx*=max/l;dz*=max/l}return inArena(M,{x:u.x+dx,z:u.z+dz})}
function aimDir(u,p){let dx=p.x-u.x,dz=p.z-u.z;const l=Math.hypot(dx,dz);if(l<.1){dx=Math.sin(u.face);dz=Math.cos(u.face)}else{dx/=l;dz/=l}u.face=Math.atan2(dx,dz);return{x:dx,z:dz}}
const ahead=(u,dir,k)=>({x:u.x+dir.x*k,z:u.z+dir.z*k});
function tele(M,e,dur,fn){e.t='tele';e.d=dur;fx(M,e);if(e.sh==='c')M.danger.push({x:e.x,z:e.z,r:e.r,until:M.time+dur});later(M,dur,fn)}

// ---------- combat ----------
function addShield(t,amt,src){t.shield=Math.min(maxShield(t),t.shield+amt*(1+(src?m(src,'shield'):0)/100))}
function damage(M,t,amt,src,o={}){
  if(!t||t.dead||t.st.inv>0)return 0;
  if(t.invuln){if(!o.dot&&Math.random()<.2)fx(M,{t:'txt',x:r2(t.x),z:r2(t.z),s:'Imunní',c:'info'});return 0}
  if(!o.dot&&src&&t.pass.has('reflex')&&Math.random()<.1){fx(M,{t:'txt',x:r2(t.x),z:r2(t.z),s:'Úhyb',c:'info'});return 0}
  if(src&&!o.dot){
    if(src.ambush>0){amt*=1.45+m(src,'ambush')/100+(src.ambushK||0);src.ambush=0;src.ambushK=0;fx(M,{t:'txt',x:r2(src.x),z:r2(src.z),s:'Přepad',c:'info'})}
    if(src.st.cloak>0)src.st.cloak=0;
  }
  if(src){if(src.pass.has('fury')&&src.hp<src.maxHp*.5)amt*=1.1;if(src.pass.has('executioner')&&t.hp<t.maxHp*.3)amt*=1.2}
  if(t.st.bulwark>0)amt*=.5;
  if(o.ult&&src)amt*=(1+m(src,'ultDmg')/100)*(src.uniq.has('reactor')?1.3:1);
  if(src&&src.st.relic>0&&src.clsKey==='striker')amt*=1.25;
  if(t.vuln>M.time)amt*=1.25;
  if(src&&src.kind==='hero'&&!o.dot){const bb=basicMastery(src).b;if((bb[1]===1||bb[6]===1)&&myDot(src,t))amt*=1+(bb[1]===1?.06:0)+(bb[6]===1?.05:0)}
  // mastery milestones 30–100: Zesílení / Popravčí on the attacker, Odolnost on the target, Oslabení from basic hits
  if(src){if(src.empT>M.time)amt*=1+src.empK;if(src.exT>M.time&&t.hp<t.maxHp*.35)amt*=1.15;if(src.weakT>M.time)amt*=.9}
  if(t.drT>M.time)amt*=1-t.drK;
  if(t.st.nanite?.rot)amt*=1.1;
  amt*=1-Math.min(.6,t.C.def+m(t,'def')/100);
  if(t.st.relic>0&&t.clsKey==='guardian')amt*=.8;
  if(t.mods.lowDR&&t.hp<t.maxHp*.3)amt*=.75;
  amt=Math.max(1,Math.round(amt));
  let rest=amt;if(t.shield>0){const s=Math.min(t.shield,rest);t.shield-=s;rest-=s}
  t.hp-=rest;
  if(src){src.dmgDealt+=amt;t.lastHit=src;t.lastHitT=M.time;
    if(src.kind==='hero')src.ult=Math.min(100,src.ult+amt*.3*(1+m(src,'ult')/100));
    if(!o.dot&&m(src,'leech')>0&&!src.dead)heal(M,src,amt*m(src,'leech')/100,null,true);
    if(!o.dot&&src!==t&&src.kind==='hero'&&M.emod.has('vamp')&&!src.dead)heal(M,src,amt*.12,null,true);
    if(src!==t&&src.lsT>M.time&&!src.dead)heal(M,src,amt*src.lsK,null,true);
    if(t.kind==='boss')t.threat[src.id]=(t.threat[src.id]||0)+amt}
  if(t.kind==='hero'){t.ult=Math.min(100,t.ult+amt*.08);t.hurtT=M.time;t.dmgTaken=(t.dmgTaken||0)+amt;
    // for the death recap: who hit this hero lately, and whether directly, with an ultimate or over time
    const L=t.dlog||(t.dlog=[]);L.push({t:M.time,s:src?src.id:0,a:amt,k:o.dot?'d':o.ult?'u':'h'});
    while(L.length&&(M.time-L[0].t>RECAP_WIN||L.length>240))L.shift();
    if(src&&!o.dot&&src.kind!=='hero'&&M.emod.has('bleed')&&!t.st.bleed)t.st.bleed={dps:5,t:3,acc:0,src}}
  fx(M,{t:'dmg',x:r2(t.x),z:r2(t.z),a:amt,s:src?src.id:0,g:t.id,o:o.dot?1:0,c:o.color??0xffffff});
  if(src&&!o.dot&&!o.noThorn&&src!==t){
    if(t.uniq.has('thorns'))damage(M,src,amt*.15,t,{noThorn:true,dot:true,color:0xff8a3d});
    if(t.st.bulwark>0&&t.prof.mod==='bulwark'&&t.prof.proto!=='b')damage(M,src,amt*.3,t,{noThorn:true,dot:true,color:0x5dffa8})}
  if(t.hp>0&&t.hp<t.maxHp*.3&&t.uniq.has('bastion')&&M.time>=(t.bastionT||0)){t.shield+=120;t.bastionT=M.time+30;fx(M,{t:'txt',x:r2(t.x),z:r2(t.z),s:'Živý val',c:'info'})}
  if(t.hp<=0){
    if(t.uniq.has('phoenix')&&!t.phoenixUsed){t.phoenixUsed=true;t.hp=Math.round(t.maxHp*.4);t.st.inv=1;
      fx(M,{t:'txt',x:r2(t.x),z:r2(t.z),s:'Fénix',c:'info'});fx(M,{t:'ring',x:r2(t.x),z:r2(t.z),c:0xffc66d,a:.5,b:5,d:.7})}
    // Poslední vzdor (ultimate mastery 100): once a match, with the ultimate at least half charged
    else if(t.kind==='hero'&&!t.lastStand&&t.ult>=50&&t.mast?.[t.clsKey+':ult']?.b?.[11]===1){t.lastStand=true;t.hp=1;t.ult=0;t.st.inv=2;
      fx(M,{t:'txt',x:r2(t.x),z:r2(t.z),s:'Poslední vzdor',c:'info'});fx(M,{t:'ring',x:r2(t.x),z:r2(t.z),c:0xc08bff,a:.5,b:5,d:.7})}
    else kill(M,t,src);
  }
  return amt;
}
function heal(M,t,amt,src,quiet){if(t.dead)return;amt*=(1+(src?m(src,'heal'):0)/100)*(M.emod.has('noheal')&&t.team===0?.5:1)*(t.st.poison?POISON_HEAL:1);const h=Math.min(amt,t.maxHp-t.hp);if(h<=0)return;t.hp+=h;if(src)src.healDone+=h;if(!quiet)fx(M,{t:'heal',x:r2(t.x),z:r2(t.z),a:Math.round(h),g:t.id})}
function kill(M,t,src){
  if(t.dead)return;
  // Šíření: the killer's elements jump to enemies standing close to the fallen one
  const kk=src||(t.lastHit&&M.time-t.lastHitT<6?t.lastHit:null);
  if(kk&&kk.kind==='hero'&&basicMastery(kk).b[2]===1){
    const ds=['bleed','poison','shock','burn'].filter(x=>t.st[x]?.src===kk).map(x=>({kind:x,dps:t.st[x].dps,t:Math.max(1.5,t.st[x].t)}));
    if(ds.length)for(const e of near(foes(M,kk).filter(x=>x!==t&&!x.dead),t,4)){for(const d of ds)applyDot(e,kk,d);fx(M,{t:'burst',x:r2(e.x),z:r2(e.z),y:1,c:0xffc66d,n:10,s:3,u:2,l:.4})}
  }
  t.dead=true;t.hp=0;t.shield=0;t.deaths++;t.st.bleed=null;t.st.burn=null;t.st.poison=null;t.st.shock=null;t.st.nanite=null;t.bomb=null;t.st.hot=null;t.dash=null;
  const k=src||(t.lastHit&&M.time-t.lastHitT<6?t.lastHit:null);
  fx(M,{t:'death',x:r2(t.x),z:r2(t.z),g:t.id});
  if(t.kind==='hero'){
    deathRecap(M,t,k);
    t.respawn=(M.elim?1e9:M.D.pvp?5+Math.min(4,t.deaths*.4):6+Math.min(4,t.deaths*.5))*(M.emod.has('rapid')?.5:1);
    if(k&&k.team!==t.team&&k.kind==='hero'){k.kills++;k.ult=Math.min(100,k.ult+15+(k.mast?.[k.clsKey+':ult']?.b?.[7]===0?10:0));echoReset(M,k)}
    if(arenaLike(M.mode)||M.mode==='duel'){if(k&&k.team!==t.team)M.score[k.team]++;else M.score[1-t.team]++}
    if(!M.D.pvp){M.lives=Math.max(0,M.lives-1);if(M.lives<=0&&M.state==='play')endMatch(M,1)}
    fx(M,k&&k.team!==t.team?{t:'feed',k:'kill',a:k.id,b:t.id}:{t:'feed',k:'field',b:t.id});
    if(k&&k.team!==t.team&&k.kind==='hero')streakKill(M,k,t);
    t.streak=0;
  }else{
    t.remove=true;
    if(k&&k.kind==='hero'){k.npcKills++;k.ult=Math.min(100,k.ult+(t.kind==='boss'?40:6));echoReset(M,k)}
    if(t.kind==='npc'&&k&&k.ctrl==='human'&&Math.random()<.08+M.wave*.004)spawnLoot(M,t,k,rollItem(k.level,{boost:M.wave*.03}));
    if(t.kind==='boss'){
      fx(M,{t:'feed',k:'boss',a:k?k.id:0,n:t.name});for(const h of M.units)h.bomb=null;
      for(const h of M.units)if(h.kind==='hero'&&h.ctrl==='human')spawnLoot(M,t,h,rollItem(h.level,{minR:2,boost:.8}));
      M.bossKills=(M.bossKills||0)+1;M.bossKeys.push(t.key);
      if(M.mode==='boss'&&M.state==='play')endMatch(M,0);
    }
  }
  checkWin(M);
}
// Kill streaks (kills without falling) and multi-kills (each within MULTI_GAP s of the previous): announcement events
// at the STREAKS steps and from a double kill up; ending a streak of 3+ is a shutdown.
export const STREAKS={3:'Série',5:'Řádění',8:'Nezastavitelný',12:'Legenda arény'},MULTI_GAP=4;
export const MULTI_NAME=n=>n===2?'Dvojité zničení':n===3?'Trojité zničení':n===4?'Čtyřnásobné zničení':'Zničení ×'+n;
function streakKill(M,k,t){
  k.streak=(k.streak|0)+1;k.bestStreak=Math.max(k.bestStreak|0,k.streak);
  k.multi=M.time-(k.lastKillT??-99)<=MULTI_GAP?(k.multi|0)+1:1;k.lastKillT=M.time;k.bestMulti=Math.max(k.bestMulti|0,k.multi);
  if((t.streak|0)>=3)fx(M,{t:'feed',k:'shut',a:k.id,b:t.id,n:t.streak});
  if(k.multi>=2)fx(M,{t:'feed',k:'multi',a:k.id,n:k.multi});
  else if(STREAKS[k.streak])fx(M,{t:'feed',k:'streak',a:k.id,n:k.streak});
}
// Death recap, sent only to the fallen hero's player: damage taken in the last RECAP_WIN seconds per attacker
// (direct hits, ultimates, damage over time; the arena itself as id 0) and how much health the killer had left.
export const RECAP_WIN=10;
function deathRecap(M,t,k){
  const by=new Map();
  for(const e of t.dlog||[])if(M.time-e.t<=RECAP_WIN){const r=by.get(e.s)||{h:0,u:0,d:0};r[e.k]+=e.a;by.set(e.s,r)}
  t.dlog=[];
  const src=[...by].map(([id,r])=>{const u=id?M.units.find(x=>x.id===id):null;
    return{i:id,n:u?u.name:'',c:u?.kind==='hero'?u.clsKey:null,b:u?.kind==='boss'?u.key:null,tm:u?u.team:-1,h:Math.round(r.h),u:Math.round(r.u),d:Math.round(r.d)}})
    .sort((a,b)=>b.h+b.u+b.d-(a.h+a.u+a.d)).slice(0,5);
  fx(M,{t:'recap',only:t.id,k:k?k.id:0,kh:k&&!k.dead?[Math.ceil(k.hp),k.maxHp]:null,src});
}
function echoReset(M,k){
  if(!k.pass.has('echo'))return;let i=0;for(let j=1;j<3;j++)if(k.cds[j]>k.cds[i])i=j;
  if(k.cds[i]>0){k.cds[i]=0;fx(M,{t:'txt',x:r2(k.x),z:r2(k.z),s:'Ozvěna',c:'info'})}
}
function spawnLoot(M,at,owner,item){
  const a=rnd(0,Math.PI*2),r=rnd(.5,2.5),p=inArena(M,{x:at.x+Math.cos(a)*r,z:at.z+Math.sin(a)*r},2);
  M.loot.push({id:M.nextId++,x:p.x,z:p.z,owner:owner.id,item,t:120});
}
function checkWin(M){
  if(M.state!=='play')return;
  if(M.D.pvp){const w=M.D.win;if(M.score[0]>=w)endMatch(M,0);else if(M.score[1]>=w)endMatch(M,1)}
}
function endMatch(M,winner){
  if(M.state==='end')return;M.state='end';
  M.winner=winner??(M.score[0]>M.score[1]?0:M.score[1]>M.score[0]?1:-1);
}

// Where e stood `lag` seconds ago, from its position history (recorded at the end of every step).
// A jump longer than 4 m between samples is a teleport or blink; the nearer sample is used instead of a point between them.
function posAt(M,e,lag){
  const h=e.hist;if(lag<=0||!h.length)return e;
  const t=M.time-lag;if(t<=h[0][0])return{x:h[0][1],z:h[0][2]};
  for(let i=h.length-1;i>0;i--){const a=h[i-1],b=h[i];if(t<a[0])continue;
    if(t>=b[0])return e;
    const k=(t-a[0])/(b[0]-a[0]||1),dx=b[1]-a[1],dz=b[2]-a[2];
    if(dx*dx+dz*dz>16)return k<.5?{x:a[1],z:a[2]}:{x:b[1],z:b[2]};
    return{x:a[1]+dx*k,z:a[2]+dz*k}}
  return e;
}
function recordHist(M){
  for(const u of M.units){if(u.dead)continue;const h=u.hist;h.push([M.time,u.x,u.z]);while(h.length&&h[0][0]<M.time-LAG_MAX-.1)h.shift()}
}
function shoot(M,u,dir,o){
  M.projs.push({id:M.nextId++,x:u.x+dir.x*(u.radius+.2),z:u.z+dir.z*(u.radius+.2),vx:dir.x*o.speed,vz:dir.z*o.speed,life:o.range/o.speed,o,src:u,team:u.team,hit:new Set(),color:o.color,size:o.size||1,lag:u.ctrl==='human'?u.lag:0});
}
function updProjs(M,dt){
  for(let i=M.projs.length-1;i>=0;i--){
    const p=M.projs[i],o=p.o;let end=false;
    p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;
    if(p.life<=0)end=true;
    if(!o.noHit){
      for(const [x,z,r] of M.map.pillars)if(Math.hypot(p.x-x,p.z-z)<r){end=true;break}
      if(!end)for(const e of M.units){if(e.team===p.team||e.dead||p.hit.has(e))continue;
        const q=posAt(M,e,p.lag);
        if(Math.hypot(p.x-q.x,p.z-q.z)<e.radius+.25*p.size){p.hit.add(e);damage(M,e,o.dmg,p.src,{color:o.color});o.onHit&&o.onHit(e,p.src);if(!o.pierce){end=true;break}}}
    }
    if(end){fx(M,{t:'burst',x:r2(p.x),z:r2(p.z),y:1.3,c:o.color,n:8,s:4,u:2,l:.3});o.onEnd&&o.onEnd({x:p.x,z:p.z});M.projs.splice(i,1)}
  }
}
function updZones(M,dt){
  for(let i=M.zones.length-1;i>=0;i--){const z=M.zones[i];z.t-=dt;z.acc+=dt;
    while(z.acc>=.5){z.acc-=.5;for(const e of near(M.units.filter(x=>x.team!==z.team&&!x.dead),z,z.r)){damage(M,e,z.dps*.5,z.src&&!z.src.dead?z.src:null,{dot:true,color:z.color});if(z.slow)e.st.slow=Math.max(e.st.slow,.6);if(z.burn&&z.src)burn(e,z.src,BURN.talent)}}
    if(z.t<=0)M.zones.splice(i,1)}
}
function updRings(M,dt){
  for(let i=M.rings.length-1;i>=0;i--){const g=M.rings[i];g.r+=g.v*dt;
    for(const e of M.units){if(e.team===g.team||e.dead||g.hit.has(e))continue;const d=d2(e,g);
      if(Math.abs(d-g.r)<.9+e.radius*.5){g.hit.add(e);if(!blocked(M.map,g,e))damage(M,e,g.dmg,g.src&&!g.src.dead?g.src:null,{color:g.color})}}
    if(g.r>g.max)M.rings.splice(i,1)}
}
function updBeams(M,dt){
  for(let i=M.beams.length-1;i>=0;i--){const b=M.beams[i],s=b.src;
    if(!s||s.dead){M.beams.splice(i,1);continue}
    b.x=s.x;b.z=s.z;
    if(b.warm>0){b.warm-=dt;continue}
    b.a+=b.w*dt;b.t-=dt;b.acc+=dt;
    if(b.acc>=.2){b.acc-=.2;const dx=Math.sin(b.a),dz=Math.cos(b.a);
      for(const e of M.units){if(e.team===s.team||e.dead)continue;const rx=e.x-b.x,rz=e.z-b.z,proj=rx*dx+rz*dz;if(proj<0||proj>b.len)continue;
        if(Math.abs(rx*dz-rz*dx)<e.radius+.5&&!blocked(M.map,b,e))damage(M,e,b.dps*.2*s.dmgScale,s,{color:0x6acbff})}}
    if(b.t<=0)M.beams.splice(i,1)}
}

function basic(M,u,pt){
  const B=u.C.basic;if(!B||u.dead||u.atkCd>0||u.st.stun>0||u.dash)return;
  const bm=u.kind==='hero'?basicMastery(u):{r:0,b:[]},bb=bm.b;
  u.atkCd=B.rate/(1+m(u,'rate')/100)/(bb[9]===0?1.06:1);
  // basic attack mastery: +0.5 % per rank up to the bonus cap, Těžká / Drtivá ruka, Mistr zbraně, every 4th a Kritický zásah
  let mul=(u.ctrl==='bot'?M.diff.dmg:1)*u.dmgScale*(1+Math.min(bm.r,MASTERY.bonusCap)*MASTERY_BASIC.dmgPerRank+(bb[5]===1?.06:0)+(bb[9]===1?.08:0)+(bb[11]===0?.1:0));
  if(bb[5]===0){u.critN=(u.critN||0)+1;if(u.critN%4===0)mul*=1.4}
  const dir=aimDir(u,pt);let col=u.C.color,pierce=false;
  if(u.drive&&u.drive.n>0){mul*=u.drive.mul;pierce=true;col=0xff7b5a;if(--u.drive.n<=0)u.drive=null}
  const razor=e=>{if(u.pass.has('razor')&&Math.random()<.15&&!e.dead)e.st.bleed={dps:6,t:3,acc:0,src:u};if(B.poison&&!e.dead)e.st.bleed={dps:7*u.dmgScale,t:4,acc:0,src:u}};
  fx(M,{t:'atk',i:u.id});
  if(B.type==='melee'){
    fx(M,{t:'arc',x:r2(u.x),z:r2(u.z),f:r2(u.face),c:col,r:B.range+(u.radius-.7)});let hit=false;
    const lag=u.ctrl==='human'?u.lag:0;
    for(const e of foes(M,u)){const q=posAt(M,e,lag),dx=q.x-u.x,dz=q.z-u.z,d=Math.hypot(dx,dz);
      if(d<B.range+e.radius+(u.radius-.7)&&(dx*dir.x+dz*dir.z)/(d||1)>.55){damage(M,e,B.dmg*mul,u,{color:col});razor(e);basicHit(M,u,e);hit=true}}
    if(hit&&u.clsKey==='guardian')addShield(u,6,u);
  }else if(u.key==='voice'){
    for(const a of [-.18,0,.18]){const ca=Math.cos(a),sa=Math.sin(a);shoot(M,u,{x:dir.x*ca-dir.z*sa,z:dir.x*sa+dir.z*ca},{dmg:B.dmg*mul,speed:B.speed,range:B.range,color:col,size:B.size})}
  }else{
    shoot(M,u,dir,{dmg:B.dmg*mul,speed:B.speed,range:B.range,color:col,size:B.size,pierce,onHit:(e,s)=>{
      razor(e);basicHit(M,s,e);
      if(s.clsKey==='striker'){const c=.35+m(s,'comboCdr');s.cds=s.cds.map(x=>Math.max(0,x-c))}
      else if(s.clsKey==='technician')s.energy=Math.min(100,s.energy+5);
    }});
  }
}

const SK={
  striker:[
    (M,u,pt)=>{const dir=aimDir(u,pt),dist=clamp(d2(u,pt),3,7+m(u,'dashLen'));u.st.cloak=0;const C=u.C.color,n=m(u,'triple')?3:2;
      const hit=(f,tilt)=>{if(u.dead)return;fx(M,{t:'slash',x:r2(u.x),z:r2(u.z),f:r2(u.face+f),c:C,tl:tilt});for(const e of near(foes(M,u),ahead(u,dir,1),2.6))damage(M,e,atk(M,u)*.9,u,{color:C})};
      u.dash={dx:dir.x,dz:dir.z,spd:30,t:dist/30,end:()=>{hit(0,.35);for(let i=1;i<n;i++)later(M,.15*i,()=>hit(.3*(i%2?1:-1),i%2?-.35:.35))}}},
    (M,u)=>{u.st.cloak=3.5+m(u,'cloakT');u.ambush=5;
      if(m(u,'cloakHeal')){heal(M,u,u.maxHp*.15,null);u.st.bleed=null}
      fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xb38bff,n:30,s:3,u:3,l:.7});fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x6acbff,a:.5,b:3,d:.5})},
    (M,u,pt)=>{const dps=9*(1+m(u,'bleed')/100);shoot(M,u,aimDir(u,pt),{dmg:atk(M,u)*.6,speed:48,range:24,color:0xff4466,size:1.4,pierce:true,onHit:(e,s)=>{e.st.bleed={dps,t:4,acc:0,src:s}}})},
    (M,u,pt)=>{const dir=aimDir(u,pt),o={x:u.x,z:u.z},n=3+m(u,'stormN');
      for(let k=1;k<=n;k++)later(M,.13*k,()=>{const p=inArena(M,{x:o.x+dir.x*4.2*k,z:o.z+dir.z*4.2*k});
        fx(M,{t:'storm',x:r2(p.x),z:r2(p.z)});
        for(const e of near(foes(M,u),p,3.2)){damage(M,e,atk(M,u)*1.7,u,{color:0xffd27a,ult:true});if(u.prof.ultMod)e.st.slow=Math.max(e.st.slow,2)}});
      fx(M,{t:'ban',ti:'Bouřový průraz',col:'var(--amber)',d:1.2,i:u.id})}
  ],
  guardian:[
    (M,u)=>{addShield(u,90+m(u,'anchorSh'),u);fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x5dffa8,a:.5,b:5.5,d:.6});fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x5dffa8,r:1.6,d:.5});for(const e of near(foes(M,u),u,5.5))e.st.slow=Math.max(e.st.slow,2)},
    (M,u,pt)=>{const dir=aimDir(u,pt),dist=clamp(d2(u,pt),3,8+m(u,'chargeLen')),stun=.9+m(u,'stunT');
      u.dash={dx:dir.x,dz:dir.z,spd:26,t:dist/26,end:()=>{fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x5dffa8,a:.5,b:3.2,d:.4});fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:0,c:0x5dffa8,n:24,s:8,u:3,l:.5});
        for(const e of near(foes(M,u),u,2.8)){damage(M,e,atk(M,u)*.9,u,{color:0x5dffa8});if(e.kind!=='boss'){e.st.stun=Math.max(e.st.stun,stun);const kx=e.x-u.x,kz=e.z-u.z,l=Math.hypot(kx,kz)||1;e.x+=kx/l*2.5;e.z+=kz/l*2.5;collide(e,M.map)}}}}},
    (M,u)=>{const sh=55+m(u,'domeSh'),hot=m(u,'domeHeal');fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x5dffa8,r:7,d:.9});
      for(const a of near(friends(M,u),u,7)){addShield(a,sh,u);if(hot)a.st.hot={hps:20,t:3,acc:0,src:u};fx(M,{t:'burst',x:r2(a.x),z:r2(a.z),y:1.2,c:0x5dffa8,n:10,s:2,u:3,l:.6})}},
    (M,u)=>{const um=u.prof.ultMod,R=8+m(u,'slamR')+(um?1:0),q=m(u,'quake');addShield(u,120,u);fx(M,{t:'slam',x:r2(u.x),z:r2(u.z),r:R});
      for(const e of near(foes(M,u),u,R)){
        if(um&&e.kind!=='boss'){const kx=u.x-e.x,kz=u.z-e.z,l=Math.hypot(kx,kz)||1,s=Math.min(2,Math.max(0,l-u.radius-e.radius));e.x+=kx/l*s;e.z+=kz/l*s;collide(e,M.map)}damage(M,e,atk(M,u)*2,u,{color:0x5dffa8,ult:true});if(e.kind!=='boss')e.st.stun=Math.max(e.st.stun,1.4+(q?.5:0));if(q)e.st.slow=Math.max(e.st.slow,3)}
      fx(M,{t:'ban',ti:'Titánův val',col:'var(--green)',d:1.2,i:u.id})}
  ],
  technician:[
    (M,u,pt)=>{const tp=clampReach(M,u,pt,15),dir=aimDir(u,tp),dist=Math.max(1,d2(u,tp)),T=tech(M,u),R=4+m(u,'zoneR'),long=m(u,'zoneLong');
      shoot(M,u,dir,{dmg:0,speed:22,range:dist,color:0x7dff9a,size:2.2,noHit:true,onEnd:(p)=>{
        M.zones.push({id:M.nextId++,x:p.x,z:p.z,r:R,t:5+(long?3:0),acc:0,dps:T*.5*(1+m(u,'zoneDps')/100),src:u,team:u.team,color:0x7dff9a,slow:!!long});
        fx(M,{t:'ring',x:r2(p.x),z:r2(p.z),c:0x7dff9a,a:.5,b:R,d:.4})}})},
    (M,u)=>{const hps=22+m(u,'restore'),sh=m(u,'restoreSh');fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x6affd8,a:.5,b:7.5,d:.6});
      for(const a of near(friends(M,u).filter(x=>x.kind==='hero'),u,7.5)){a.st.hot={hps,t:3,acc:0,src:u};a.st.bleed=null;a.st.burn=null;a.st.slow=0;if(sh)addShield(a,sh,u);fx(M,{t:'burst',x:r2(a.x),z:r2(a.z),y:1.2,c:0x6affd8,n:14,s:1.5,u:4,l:.8})}},
    (M,u,pt)=>{const tp=clampReach(M,u,pt,13),R=4.5+m(u,'empR'),ov=m(u,'overload');aimDir(u,tp);fx(M,{t:'beam',a:[r2(u.x),1.3,r2(u.z)],b:[r2(tp.x),.4,r2(tp.z)],c:0x6acbff,w:.06,d:.25});
      later(M,.2,()=>{fx(M,{t:'emp',x:r2(tp.x),z:r2(tp.z),r:R});
        for(const e of near(foes(M,u),tp,R)){damage(M,e,tech(M,u)*1.1*(ov?1.4:1),u,{color:0x6acbff});e.energy=Math.max(0,(e.energy||0)-40);e.st.silence=Math.max(e.st.silence,1.6+(ov?1:0))}})},
    (M,u)=>{const pool=foes(M,u).filter(e=>visibleTo(u,e)&&d2(u,e)<15).sort((a,b)=>d2(u,a)-d2(u,b));
      if(!pool.length)return false;
      const hit=new Set(),n=5+m(u,'chain');let from=[u.x,1.6,u.z],cur=pool[0];
      for(let k=0;k<n&&cur;k++){const c=cur,f=from;hit.add(c);
        later(M,k*.09,()=>{if(c.dead)return;fx(M,{t:'bolt',a:f,b:[r2(c.x),1.2,r2(c.z)],c:0x9fd8ff});damage(M,c,tech(M,u)*1.6,u,{color:0x9fd8ff,ult:true});if(u.prof.ultMod)c.st.silence=Math.max(c.st.silence,1)});
        from=[r2(c.x),1.2,r2(c.z)];cur=foes(M,u).filter(e=>!hit.has(e)&&d2(e,c)<9).sort((a,b)=>d2(a,c)-d2(b,c))[0]}
      fx(M,{t:'ban',ti:'Řetězový výboj',col:'var(--cyan)',d:1.2,i:u.id})}
  ]
};
// ---------- basic attack damage over time (bleed, poison, shock, burn) ----------
// Basic attack mastery decides what a hit adds: the class element from rank 5 and the chosen milestone branches.
function basicMastery(u){const bm=u.mast?.[u.clsKey+':basic'];return{r:bm?.r||0,b:bm?.b||[]}}
function basicHit(M,u,e){
  if(u.kind!=='hero'||!e||e.dead)return;
  if(u.ctrl==='human'){const k=u.clsKey+':basic';u.mcount[k]=(u.mcount[k]||0)+1/MASTERY_BASIC.hitsPerXp}
  const {r,b}=basicMastery(u),B=u.C.basic;
  // the Žhář's talent burns from the start; the element replaces it from rank 5
  if(r<MASTERY_BASIC.elementRank){if(u.clsKey==='pyro')burn(e,u,BURN.talent);return}
  const d={...B.dot,dps:B.dot.dps*(b[0]===0?1.5:1)*(b[4]===0?1.25:1)*(b[11]===0?1.25:1),t:B.dot.t+(b[0]===1?2:0)+(b[4]===1?1:0)};applyDot(e,u,d);
  if(b[10]===1)applyDot(e,u,{kind:MASTERY_BASIC.second[u.clsKey]||'shock',dps:6,t:3});
  else if(b[3]===1)applyDot(e,u,{kind:MASTERY_BASIC.second[u.clsKey]||'shock',dps:3,t:2});
  u.hitN=(u.hitN||0)+1;const n=u.hitN;
  if(b[1]===0&&n%5===0)spark(M,u,e,d);
  if(b[6]===0&&n%6===0)spark(M,u,e,d);
  if(b[3]===0&&n%8===0||b[10]===0&&n%6===0)detonate(M,u,e);
  // ranks 30–100
  if(b[7]===0)heal(M,u,u.maxHp*.004,null,true);
  if(b[7]===1)u.energy=Math.min(100,u.energy+1);
  if(b[8]===0&&n%5===0)e.st.slow=Math.max(e.st.slow,1.5);
  if(b[8]===1&&n%5===0)e.weakT=M.time+2;
  if(b[11]===1&&n%10===0)for(const x of near(foes(M,u).filter(f=>f!==e&&!f.dead),e,6).slice(0,3)){
    fx(M,{t:'bolt',a:[r2(e.x),1.2,r2(e.z)],b:[r2(x.x),1.2,r2(x.z)],c:0x9fd8ff});damage(M,x,B.dmg*.5*u.dmgScale,u,{color:0x9fd8ff})}
}
const myDot=(u,e)=>['bleed','poison','shock','burn'].some(k=>e.st[k]?.src===u);
function detonate(M,u,e){let total=0;for(const k of ['bleed','poison','shock','burn']){const d=e.st[k];if(d?.src===u){total+=d.dps*Math.max(0,d.t);e.st[k]=null}}
  if(total>0){fx(M,{t:'blast',x:r2(e.x),z:r2(e.z),r:1.6,c:0xffc66d});damage(M,e,total,u,{color:0xffc66d})}}
function applyDot(e,src,d){
  if(!e||e.dead||!d)return;
  if(d.kind==='burn')return burn(e,src,d);
  if(e.st.decon>0&&d.kind!=='shock')return;
  const dps=d.dps*(src.dmgScale||1)*(src.ctrl==='bot'?1:1),cur=e.st[d.kind];
  if(!cur||cur.dps<=dps)e.st[d.kind]={dps,t:d.t,acc:cur?.acc||0,src};else cur.t=Math.max(cur.t,d.t);
}
// Jiskra: the hit jumps to another enemy nearby and carries the element
function spark(M,s,from,d){
  const t=foes(M,s).filter(e=>e!==from&&!e.dead&&visibleTo(s,e)&&d2(e,from)<6).sort((a,b)=>d2(a,from)-d2(b,from))[0];if(!t)return;
  fx(M,{t:'bolt',a:[r2(from.x),1.2,r2(from.z)],b:[r2(t.x),1.2,r2(t.z)],c:0x9fd8ff});
  damage(M,t,Math.max(atk(M,s),tech(M,s))*.25,s,{color:0x9fd8ff});applyDot(t,s,d);
}
// one damage-over-time tick; the Vysátí branch heals the source
function dotTick(M,u,d,amt,color){const got=damage(M,u,amt,d.src&&!d.src.dead?d.src:null,{dot:true,color});
  if(got&&d.src&&!d.src.dead&&basicMastery(d.src).b[2]===0)heal(M,d.src,got*.15,null,true)}
function tickDot(M,u,k,color,dt){
  const d=u.st[k];if(!d)return;d.acc+=dt;d.t-=dt;
  while(u.st[k]&&d.acc>=.5&&!u.dead){d.acc-=.5;dotTick(M,u,d,d.dps*.5,color)}
  if(u.st[k]&&d.t<=0)u.st[k]=null;
}

// ---------- Žhář: burning and fire zones ----------
function burn(e,src,B){if(!e||e.dead||e.st.decon>0)return;const dps=B.dps*(1+m(src,'burnDps')/100)*(src.dmgScale||1),t=B.t+m(src,'burnT');
  if(!e.st.burn||e.st.burn.dps<=dps)e.st.burn={dps,t,acc:e.st.burn?.acc||0,src};else e.st.burn.t=Math.max(e.st.burn.t,t)}
function fireZone(M,u,p,r,t,dpsMul){
  const R=(r+m(u,'fireR'))*(u.st.relic>0?1.5:1);
  M.zones.push({id:M.nextId++,x:p.x,z:p.z,r:R,t,acc:0,dps:tech(M,u)*dpsMul*(1+m(u,'fireDps')/100),src:u,team:u.team,color:0xff6a1a,burn:true});
  fx(M,{t:'ring',x:r2(p.x),z:r2(p.z),c:0xff6a1a,a:.5,b:R,d:.4});fx(M,{t:'burst',x:r2(p.x),z:r2(p.z),y:.4,c:0xffa64d,n:24,s:3,u:4,l:.7});
}
SK.pyro=[
  // Plamenná vlna: a cone of fire
  (M,u,pt)=>{const dir=aimDir(u,pt),R=6+m(u,'waveR');fx(M,{t:'arc',x:r2(u.x),z:r2(u.z),f:r2(u.face),c:0xff6a1a,r:R});
    for(let k=1;k<=3;k++)fx(M,{t:'burst',x:r2(u.x+dir.x*R*k/3),z:r2(u.z+dir.z*R*k/3),y:1,c:k%2?0xff6a1a:0xffd27a,n:14,s:4,u:3,l:.5});
    const lag=u.ctrl==='human'?u.lag:0;
    for(const e of foes(M,u)){const q=posAt(M,e,lag),dx=q.x-u.x,dz=q.z-u.z,d=Math.hypot(dx,dz);
      if(d<R+e.radius&&(dx*dir.x+dz*dir.z)/(d||1)>.5&&!blocked(M.map,u,q)){damage(M,e,tech(M,u)*1.1,u,{color:0xff6a1a});burn(e,u,BURN.wave)}}
    if(m(u,'waveZone'))fireZone(M,u,inArena(M,ahead(u,dir,R-1)),2.5,3,.35)},
  // Žhnoucí půda: a burning area at the aimed point
  (M,u,pt)=>{const tp=clampReach(M,u,pt,14),dir=aimDir(u,tp),dist=Math.max(1,d2(u,tp));
    shoot(M,u,dir,{dmg:0,speed:24,range:dist,color:0xff6a1a,size:2,noHit:true,onEnd:p=>fireZone(M,u,p,3.5,4,.45)})},
  // Fázový plamen: a short blink that leaves fire behind
  (M,u,pt)=>{const from={x:u.x,z:u.z},dir=aimDir(u,pt),dist=clamp(d2(u,pt),2,7+(m(u,'blinkCd')?2:0));
    fireZone(M,u,from,2.5,3,.35);u.st.inv=Math.max(u.st.inv,.2);
    u.dash={dx:dir.x,dz:dir.z,spd:42,t:dist/42,end:()=>{fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1,c:0xffa64d,n:26,s:5,u:3,l:.5});const sh=m(u,'blinkSh');if(sh)addShield(u,sh,u)}}},
  // Inferno: pulses of fire around the caster
  (M,u)=>{const um=u.prof.ultMod,R=7+(um?2:0),n=3+(um?1:0);
    for(let k=0;k<n;k++)later(M,.45*k,()=>{if(u.dead)return;fx(M,{t:'blast',x:r2(u.x),z:r2(u.z),r:R,c:0xff6a1a});
      for(const e of near(foes(M,u),u,R)){
        if(k===0&&m(u,'infernoPull')&&e.kind!=='boss'){const kx=u.x-e.x,kz=u.z-e.z,l=Math.hypot(kx,kz)||1,s=Math.min(2,Math.max(0,l-u.radius-e.radius));e.x+=kx/l*s;e.z+=kz/l*s;collide(e,M.map)}
        damage(M,e,tech(M,u)*.9,u,{color:0xff6a1a,ult:true});burn(e,u,BURN.ult)}});
    fx(M,{t:'ban',ti:'Inferno',col:'#ff6a1a',d:1.2,i:u.id})}
];

// ---------- profession skills ----------
// B: +15 % when the skill is the chosen branch; md / pb: protocol A or B of the skill is active
const SKP={
  cleave(M,u,pt,B,md,pb){const dir=aimDir(u,pt),R=5*(md?1.5:1);fx(M,{t:'arc',x:r2(u.x),z:r2(u.z),f:r2(u.face),c:0xff7b5a,r:R});
    const lag=u.ctrl==='human'?u.lag:0;
    for(const e of foes(M,u)){const q=posAt(M,e,lag),dx=q.x-u.x,dz=q.z-u.z,d=Math.hypot(dx,dz);if(d<R+e.radius&&(dx*dir.x+dz*dir.z)/(d||1)>.45){damage(M,e,pw(M,u)*1.3*B,u,{color:0xff7b5a});if(pb&&!e.dead)e.st.bleed={dps:8,t:3,acc:0,src:u}}}},
  rend(M,u,pt,B,md,pb){const dir=aimDir(u,pt),dist=clamp(d2(u,pt),2,pb?8:5),dps=12*B*(md?2:1);
    u.dash={dx:dir.x,dz:dir.z,spd:28,t:dist/28,hits:{dmg:pw(M,u)*.8*B,r:1.8,kb:0,set:new Set()},end:()=>{
      for(const e of foes(M,u))if(u.dashHit?.has(e))e.st.bleed={dps,t:4,acc:0,src:u}}};
    u.dashHit=u.dash.hits.set;fx(M,{t:'slash',x:r2(u.x),z:r2(u.z),f:r2(u.face),c:0xff3355,tl:.3})},
  drive(M,u,pt,B,md,pb){u.drive={n:md?5:pb?2:3,mul:(pb?1.8:1.4)*B};fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0xff7b5a,a:.4,b:2.4,d:.4});fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Průnik',c:'info'})},
  ambush(M,u,pt,B,md,pb){
    const t=foes(M,u).filter(e=>visibleTo(u,e)&&d2(u,e)<10.5).sort((a,b)=>d2(a,pt)-d2(b,pt))[0];if(!t)return false;
    fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xb388ff,n:24,s:3,u:3,l:.6});
    const dx=t.x-u.x,dz=t.z-u.z,l=Math.hypot(dx,dz)||1;u.x=t.x+dx/l*(t.radius+u.radius+.4);u.z=t.z+dz/l*(t.radius+u.radius+.4);collide(u,M.map);
    u.face=Math.atan2(-dx,-dz);u.ambush=3;u.ambushK=(md?.3:0)+(B-1);if(pb)u.st.cloak=Math.max(u.st.cloak,1.5);
    fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xb388ff,n:24,s:3,u:3,l:.6});fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0xb388ff,a:.3,b:2.5,d:.35})},
  feint(M,u,pt,B,md,pb){if(pb)heal(M,u,u.maxHp*.12,u);u.st.inv=Math.max(u.st.inv,1.5);u.st.haste=2;u.st.hasteK=1.4;fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xb388ff,n:30,s:4,u:2,l:.6});fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Klam',c:'info'})},
  scatter(M,u,pt,B,md,pb){const dir=aimDir(u,pt),n=md?8:5;
    for(let k=0;k<n;k++){const a=(k/(n-1)-.5)*.9,ca=Math.cos(a),sa=Math.sin(a);shoot(M,u,{x:dir.x*ca-dir.z*sa,z:dir.x*sa+dir.z*ca},{dmg:pw(M,u)*.55*B,speed:40,range:16,color:0xb388ff,size:1.1,onHit:pb?e=>{e.st.slow=Math.max(e.st.slow,2)}:null})}},
  arc(M,u,pt,B,md,pb){const dir=aimDir(u,pt),L=14,a={x:u.x,z:u.z},b=inArena(M,{x:u.x+dir.x*L,z:u.z+dir.z*L});
    fx(M,{t:'bolt',a:[r2(a.x),1.2,r2(a.z)],b:[r2(b.x),1.2,r2(b.z)],c:0x6acbff});
    const hit=new Set();for(const e of foes(M,u)){const rx=e.x-a.x,rz=e.z-a.z,pr=rx*dir.x+rz*dir.z;if(pr<0||pr>L)continue;if(Math.abs(rx*dir.z-rz*dir.x)<1.2+e.radius){hit.add(e);damage(M,e,pw(M,u)*1.2*B,u,{color:0x6acbff});if(pb)e.st.silence=Math.max(e.st.silence,1)}}
    if(md){const n=foes(M,u).filter(e=>!hit.has(e)&&d2(e,b)<8).sort((x,y)=>d2(x,b)-d2(y,b))[0];if(n){fx(M,{t:'bolt',a:[r2(b.x),1.2,r2(b.z)],b:[r2(n.x),1.2,r2(n.z)],c:0x6acbff});damage(M,n,pw(M,u)*.9*B,u,{color:0x6acbff})}}},
  leak(M,u,pt,B,md,pb){const tp=clampReach(M,u,pt,13);aimDir(u,tp);let got=0;fx(M,{t:'emp',x:r2(tp.x),z:r2(tp.z),r:4});
    for(const e of near(foes(M,u),tp,4)){const take=Math.min(30,e.energy||0);if(e.kind==='hero')e.energy-=take;got+=e.kind==='hero'?take:10;damage(M,e,pw(M,u)*.5*B,u,{color:0xc08bff});if(pb)e.st.slow=Math.max(e.st.slow,2);
      fx(M,{t:'beam',a:[r2(e.x),1.2,r2(e.z)],b:[r2(u.x),1.2,r2(u.z)],c:0xc08bff,w:.05,d:.3})}
    got=Math.min(60,got);u.energy=Math.min(100,u.energy+got);if(md&&got)heal(M,u,got,u)},
  pulse(M,u,pt,B,md,pb){const sh=(40+(md?30:0))*B;fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x6acbff,r:6,d:.7});fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x6acbff,a:.5,b:5,d:.4});
    for(const a of near(friends(M,u).filter(x=>x.kind==='hero'),u,6))addShield(a,sh,u);
    for(const e of near(foes(M,u),u,5))if(e.kind!=='boss'){const kx=e.x-u.x,kz=e.z-u.z,l=Math.hypot(kx,kz)||1,k=pb?6:3;e.x+=kx/l*k;e.z+=kz/l*k;collide(e,M.map);if(pb)e.st.stun=Math.max(e.st.stun,.6)}},
  bulwark(M,u,pt,B,md,pb){const T=pb?5:3;u.st.bulwark=T;addShield(u,60*B,u);fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x5dffa8,r:1.8,d:T})},
  patch(M,u,pt,B,md,pb){const hp=x=>x.maxHp*.25*B*(md?1.5:1)/2;
    const ally=near(friends(M,u).filter(x=>x.kind==='hero'&&x!==u),u,10).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    for(const a of [u,ally].filter(Boolean)){if(pb)heal(M,a,hp(a)*2,u);else a.st.hot={hps:hp(a),t:2,acc:0,src:u};fx(M,{t:'burst',x:r2(a.x),z:r2(a.z),y:1.2,c:0x5dffa8,n:16,s:1.5,u:4,l:.8})}},
  intercept(M,u,pt,B,md,pb){
    const a=friends(M,u).filter(x=>x.kind==='hero'&&x!==u&&d2(u,x)<10.5).sort((x,y)=>d2(x,pt)-d2(y,pt))[0];if(!a)return false;
    const dx=a.x-u.x,dz=a.z-u.z,l=Math.hypot(dx,dz)||1,dist=Math.max(.1,l-u.radius-a.radius-.3),sh=(70+(md?40:0))*B;aimDir(u,a);
    u.dash={dx:dx/l,dz:dz/l,spd:28,t:dist/28,end:()=>{for(const x of [u,a]){addShield(x,sh,u);fx(M,{t:'ring',x:r2(x.x),z:r2(x.z),c:0x5dffa8,a:.4,b:2.4,d:.4})}if(md)a.st.bleed=null;
      if(pb){fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x5dffa8,a:.5,b:3,d:.4});for(const e of near(foes(M,u),u,3))if(e.kind!=='boss')e.st.stun=Math.max(e.st.stun,1)}}}},
  // Dvojúder: blink to one side of the target and cut, then to the opposite side and cut again
  double(M,u,pt,B,md,pb){
    const t=foes(M,u).filter(e=>visibleTo(u,e)&&d2(u,e)<8.5).sort((a,b)=>d2(a,pt)-d2(b,pt))[0];if(!t)return false;
    const home={x:u.x,z:u.z},a0=Math.atan2(u.x-t.x,u.z-t.z)+Math.PI/2,sides=md?[a0,a0+Math.PI,a0-Math.PI/2]:[a0,a0+Math.PI];
    sides.forEach((a,i)=>later(M,i*.22,()=>{if(u.dead||t.dead)return;const r=t.radius+u.radius+.3;
      fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xffd16d,n:12,s:3,u:2,l:.35});
      u.x=t.x+Math.sin(a)*r;u.z=t.z+Math.cos(a)*r;collide(u,M.map);u.face=Math.atan2(t.x-u.x,t.z-u.z);
      fx(M,{t:'slash',x:r2(u.x),z:r2(u.z),f:r2(u.face),c:0xffd16d,tl:i%2?-.4:.4});damage(M,t,pw(M,u)*.75*B,u,{color:0xffd16d});
      if(pb&&i===sides.length-1)later(M,.25,()=>{if(u.dead)return;fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0xb388ff,n:16,s:3,u:2,l:.4});u.x=home.x;u.z=home.z;collide(u,M.map)})}))},
  // Mor nanitů: an infection that ticks once a second and jumps to enemies standing close
  nanites(M,u,pt,B,md,pb){
    const t=foes(M,u).filter(e=>visibleTo(u,e)&&d2(u,e)<14.5).sort((a,b)=>d2(a,pt)-d2(b,pt))[0];if(!t)return false;aimDir(u,t);
    shoot(M,u,aimDir(u,t),{dmg:0,speed:30,range:d2(u,t)+1,color:0x7dff9a,size:1.6,onHit:e=>infect(M,e,u,{dmg:pw(M,u)*.35*B,hits:md?8:6,r:md?5:3.5,rot:pb})})}
};
function infect(M,e,src,o){
  if(e.dead||e.st.decon>0||e.st.nanite||e.team===src.team)return;
  e.st.nanite={...o,src,acc:0};fx(M,{t:'txt',x:r2(e.x),z:r2(e.z),s:'Nákaza',c:'info'});fx(M,{t:'ring',x:r2(e.x),z:r2(e.z),c:0x7dff9a,a:.3,b:2,d:.4});
}
function updNanite(M,u,n,dt){
  n.acc+=dt;if(n.acc<1)return;n.acc-=1;
  const src=n.src&&!n.src.dead?n.src:null,got=damage(M,u,n.dmg,src,{dot:true,color:0x7dff9a});if(src)src.naniteDmg=(src.naniteDmg||0)+got;
  n.hits--;
  if(!u.dead&&n.hits>=2)for(const e of M.units)if(e!==u&&e.team===u.team&&!e.dead&&!e.st.nanite&&d2(e,u)<n.r){
    fx(M,{t:'beam',a:[r2(u.x),1.2,r2(u.z)],b:[r2(e.x),1.2,r2(e.z)],c:0x7dff9a,w:.05,d:.3});infect(M,e,n.src,{dmg:n.dmg,hits:Math.ceil(n.hits/2),r:n.r,rot:n.rot})}
  if(u.st.nanite===n&&n.hits<=0)u.st.nanite=null;
}
// Taktické akce on T: a universal action per hero with its own cooldown
function tactical(M,u,pt){
  if(u.kind!=='hero'||u.dead||u.tcd>0||M.state!=='play')return false;
  const T=TACTICS[u.tactic];if(!T||u.st.stun>0&&u.tactic!=='decon')return false;
  const s=u.st;
  switch(u.tactic){
    case 'dodge':{if(u.dash)return false;let dx=u.vx,dz=u.vz,l=Math.hypot(dx,dz);if(l<.5){dx=Math.sin(u.face);dz=Math.cos(u.face);l=1}
      s.inv=Math.max(s.inv,.4);u.dash={dx:dx/l,dz:dz/l,spd:32,t:6/32};fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1,c:0x9fd8ff,n:18,s:4,u:1,l:.4});break}
    case 'decon':s.nanite=null;s.bleed=null;s.burn=null;s.poison=null;s.shock=null;s.slow=0;s.silence=0;s.stun=0;s.decon=4;fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x7dff9a,r:1.8,d:.6});fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Dekontaminace',c:'info'});break;
    case 'overload':u.energy=Math.min(100,u.energy+45);fx(M,{t:'ring',x:r2(u.x),z:r2(u.z),c:0x6acbff,a:.4,b:3,d:.4});fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'+45 energie',c:'info'});break;
    case 'beacon':{const p=clampReach(M,u,pt,16);fx(M,{t:'emp',x:r2(p.x),z:r2(p.z),r:6});let n=0;
      for(const e of M.units)if(e.team!==u.team&&!e.dead&&d2(e,p)<6+e.radius){e.vuln=Math.max(e.vuln||0,M.time+4);e.st.marked=4;e.st.cloak=0;n++}
      if(!n)fx(M,{t:'txt',x:r2(p.x),z:r2(p.z),s:'Nikdo',c:'info'});break}
    case 'barrier':addShield(u,u.maxHp*.22,null);fx(M,{t:'dome',x:r2(u.x),z:r2(u.z),c:0x9fd8ff,r:1.7,d:.8});break;
  }
  u.tcd=T.cd;fx(M,{t:'atk',i:u.id,s:4});return true;
}
// milestone effects that trigger on a successful use (the ultimate has stronger versions)
function masteryAfter(M,u,i,br){
  const ult=i===3;
  if(br[1]===0)addShield(u,u.maxHp*(ult?.08:.04),null);
  if(br[1]===1){const k=ult?1.2:1.15;u.st.hasteK=u.st.haste>0?Math.max(u.st.hasteK||1,k):k;u.st.haste=Math.max(u.st.haste||0,ult?3:2)}
  if(br[2]===0)heal(M,u,u.maxHp*(ult?.06:.03),null,true);
  if(br[2]===1)u.energy=Math.min(100,u.energy+(ult?20:5));
  if(ult&&br[3]===0)u.ult=25;
  if(ult&&br[3]===1)u.cds=u.cds.map(c=>Math.max(0,c-2));
  if(!ult&&br[3]===1)u.mfocus={t:M.time+3,i};
  // ranks 30–100 (branch index 4–11); timed buffs keep the stronger of two at once
  const buff=(k,t,v)=>{if(!(u[k+'T']>M.time)||(u[k+'K']||0)<=v){u[k+'K']=v}u[k+'T']=Math.max(u[k+'T']||0,M.time+t)};
  const cleanse=all=>{const s=u.st;s.slow=0;s.bleed=null;s.burn=null;s.poison=null;s.shock=null;if(all){s.stun=0;s.silence=0;s.nanite=null}};
  const haste=(k,t)=>{u.st.hasteK=u.st.haste>0?Math.max(u.st.hasteK||1,k):k;u.st.haste=Math.max(u.st.haste||0,t)};
  if(ult){
    if(br[5]===0)addShield(u,u.maxHp*.12,null);
    if(br[5]===1)heal(M,u,u.maxHp*.1,null,true);
    if(br[6]===0)buff('emp',5,.12);
    if(br[6]===1)buff('dr',4,.2);
    if(br[7]===1)for(const a of friends(M,u))if(a!==u&&!a.dead&&a.kind==='hero'&&d2(a,u)<8)addShield(a,a.maxHp*.06,u);
    if(br[8]===0)u.energy=Math.min(100,u.energy+30);
    if(br[8]===1)u.cds=u.cds.map(c=>Math.max(0,c-3));
    if(br[9]===0)u.ult=Math.max(u.ult,35);
    if(br[9]===1){haste(1.25,4);u.st.slow=0}
    if(br[10]===0)buff('ls',5,.12);
    if(br[10]===1)cleanse(true);
    if(br[11]===0)buff('emp',5,.1);
  }else{
    if(br[4]===0)buff('emp',3,.08);
    if(br[5]===0)buff('dr',3,.12);
    if(br[6]===1)u.ult=Math.min(100,u.ult+4);
    if(br[7]===0)buff('ls',3,.08);
    if(br[7]===1)cleanse(false);
    if(br[8]===0)addShield(u,u.maxHp*.06,null);
    if(br[8]===1)heal(M,u,u.maxHp*.04,null,true);
    if(br[9]===0)u.cds=u.cds.map((c,j)=>j===i?c:Math.max(0,c-1));
    if(br[9]===1)u.energy=Math.min(100,u.energy+8);
    if(br[10]===0)u.exT=M.time+3;
    if(br[10]===1)haste(1.2,3);
  }
}
// ---------- evade (Space) ----------
// dir: where the player is moving; without movement the hero evades the way it faces
function evade(M,u,dir){
  if(u.kind!=='hero'||u.dead||(u.ecd||0)>0||u.dash||u.st.stun>0||M.state!=='play')return false;
  const E=EVADES[u.clsKey];if(!E)return false;
  let dx=dir?.x||0,dz=dir?.z||0,l=Math.hypot(dx,dz);if(l<.3){dx=Math.sin(u.face);dz=Math.cos(u.face);l=1}dx/=l;dz/=l;
  const s=u.st,at={x:r2(u.x),z:r2(u.z)};
  switch(u.clsKey){
    case 'striker':s.inv=Math.max(s.inv,.3);u.dash={dx,dz,spd:30,t:6.5/30,after:.1};fx(M,{t:'burst',...at,y:.6,c:0xffd27a,n:16,s:4,u:1,l:.35});break;
    case 'guardian':s.bulwark=Math.max(s.bulwark,.8);u.dash={dx,dz,spd:22,t:4.5/22,after:.1,hits:{r:1.7,dmg:atk(M,u)*.6,kb:2.5,set:new Set()}};
      fx(M,{t:'dome',...at,c:0x5dffa8,r:1.4,d:.4});break;
    case 'technician':s.inv=Math.max(s.inv,.15);fx(M,{t:'burst',...at,y:1,c:0x6acbff,n:22,s:3,u:2,l:.4});
      u.dash={dx,dz,spd:80,t:7/80,after:0,end:()=>fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1,c:0x6acbff,n:26,s:4,u:2,l:.45})};break;
    case 'pyro':s.inv=Math.max(s.inv,.25);fireZone(M,u,{x:u.x,z:u.z},2.2,2,.25);u.dash={dx,dz,spd:28,t:5.5/28,after:.1};break;
  }
  u.face=Math.atan2(dx,dz);u.ecd=E.cd;fx(M,{t:'atk',i:u.id,s:5});return true;
}
export function cast(M,u,i,pt){
  if(i===4)return tactical(M,u,pt||{x:u.aimX,z:u.aimZ});
  if(i===5)return evade(M,u,pt);
  if(u.kind!=='hero'||u.dead||u.st.stun>0||u.st.silence>0||u.dash||M.state!=='play')return false;
  let s=null,id=null;
  if(i!==3)id=u.prof.skills[i];
  // mastery of this ability: cheaper and faster with rank, plus the chosen milestone branches
  // the per-rank bonus counts up to MASTERY.bonusCap; higher ranks add power only through their milestones
  const mk=masteryKey(u.clsKey,i===3?'ult':id),ms=u.mast?.[mk],mr=Math.min(ms?.r||0,MASTERY.bonusCap),br=ms?.b||[];
  const focus=u.mfocus&&u.mfocus.t>M.time&&u.mfocus.i!==i;
  const costMul=Math.max(.5,1-mr*MASTERY.perRank-(br[0]===0?.1:0)-(focus?.2:0)-(br[5]===1?.1:0)-(br[11]===0?.1:0))*(u.pass.has('overcharge')?.9:1);
  if(i===3){if(u.ult<100)return false}
  else{s=skillDef(u.clsKey,id);if(!s||u.cds[i]>0)return false;
    if(u.energy<s.cost*costMul)return false}
  const P=pt||{x:u.aimX,z:u.aimZ};
  const pm=u.prof.mod===id,pa=pm&&u.prof.proto!=='b',pb=pm&&u.prof.proto==='b';
  const res=i===3?SK[u.clsKey][3](M,u,P):id[0]==='c'&&id.length===2?SK[u.clsKey][+id[1]](M,u,P):SKP[id](M,u,P,u.prof.branch===id?1.15:1,pa,pb);
  if(res===false)return false;
  if(i===3)u.ult=0;
  else{u.energy-=s.cost*costMul;
    let cd=s.cd*(1-Math.min(45,m(u,'cdr'))/100)*(u.st.relic>0&&u.clsKey==='technician'?.7:1)*(u.prof.branch===id?.85:1);
    if(id==='c1'&&u.clsKey==='technician'&&m(u,'restoreCd'))cd=Math.max(2,cd-4);
    if(id==='c2'&&u.clsKey==='pyro'&&m(u,'blinkCd'))cd=Math.max(2,cd-3);
    if(id==='feint'&&pa)cd=Math.max(2,cd-4);
    if(id==='rend'&&pb)cd=Math.max(2,cd-2);
    if(u.uniq.has('mirror')&&Math.random()<.25){cd=0;fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Zrcadlení',c:'info'})}
    cd*=Math.max(.4,1-mr*MASTERY.perRank-(br[0]===1?.08:0)-(br[4]===1?.08:0)-(br[11]===0?.1:0));
    const echo=(br[3]===0?.15:0)+(br[6]===0?.1:0);
    if(echo&&cd>0&&Math.random()<echo){cd=0;fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Ozvěna',c:'info'})}
    // Legenda: every 4th use of this ability skips its cooldown
    if(br[11]===1){u.mleg??={};u.mleg[mk]=(u.mleg[mk]||0)+1;if(u.mleg[mk]%4===0&&cd>0){cd=0;fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Legenda',c:'info'})}}
    u.cds[i]=cd}
  masteryAfter(M,u,i,br);
  if(mk&&u.ctrl==='human')u.mcount[mk]=(u.mcount[mk]||0)+1;
  if(u.pass.has('shadowstep')&&!(u.st.haste>0&&u.st.hasteK>1.2)){u.st.haste=2;u.st.hasteK=1.2}
  fx(M,{t:'atk',i:u.id,s:i});return true;
}

// ---------- movement (also used by the client for prediction) ----------
export function collide(u,map){
  for(const [x,z,r] of map.pillars){const dx=u.x-x,dz=u.z-z,d=Math.hypot(dx,dz),mn=r+u.radius;if(d<mn){const k=(mn-d)/(d||1);u.x+=dx*k;u.z+=dz*k;if(u.dash)u.dash.t=Math.min(u.dash.t,.02)}}
  const l=Math.hypot(u.x,u.z),lim=map.r-u.radius;if(l>lim){u.x*=lim/l;u.z*=lim/l}
}
export function walk(u,mx,mz,dt,frozen,map){
  const sp=u.st.stun>0||frozen?0:speedOf(u),k=1-Math.exp(-dt*12);
  u.vx+=(mx*sp-u.vx)*k;u.vz+=(mz*sp-u.vz)*k;
  u.x+=u.vx*dt;u.z+=u.vz*dt;collide(u,map);
}
function moveUnit(M,u,mx,mz,dt){
  // the last step covers only the time left, so a dash goes exactly its length
  if(u.dash){const D=u.dash,st=Math.min(dt,Math.max(0,D.t));u.x+=D.dx*D.spd*st;u.z+=D.dz*D.spd*st;D.t-=dt;collide(u,M.map);u.vx=D.dx*D.spd;u.vz=D.dz*D.spd;
    if(D.hits)for(const e of foes(M,u))if(!D.hits.set.has(e)&&d2(e,u)<D.hits.r+e.radius){D.hits.set.add(e);damage(M,e,D.hits.dmg,u,{color:u.C.color});
      const kx=e.x-u.x,kz=e.z-u.z,l=Math.hypot(kx,kz)||1;e.x+=kx/l*D.hits.kb;e.z+=kz/l*D.hits.kb;collide(e,M.map)}
    if(D.t<=0){u.dash=null;const k=D.after??.2;u.vx*=k;u.vz*=k;D.end&&D.end()}return}
  walk(u,mx,mz,dt,M.state==='countdown',M.map);
}
// ---------- teleport gates ----------
// Maps with portals have pairs of gates: a hero, drone or crusher stepping into one comes out of the other, a few metres
// further in the direction it was going, and cannot use a gate again for a moment. Bosses are too big for them.
export const PORTAL={r:1.3,cd:3,exit:2.6};
function updPortals(M,dt){
  units:for(const u of M.units){
    if(u.tpCd>0){u.tpCd-=dt;continue}
    if(u.dead||u.kind==='boss'||u.dash)continue;
    for(const pair of M.map.portals)for(let e=0;e<2;e++){const a=pair[e],b=pair[1-e];if(d2(u,a)>=PORTAL.r)continue;
      // keep going the way the unit moved; a unit standing still is sent towards the middle of the map
      let dx=u.vx,dz=u.vz,l=Math.hypot(dx,dz);if(l<1){dx=-b.x;dz=-b.z;l=Math.hypot(dx,dz)||1}
      const x0=u.x,z0=u.z;u.x=b.x+dx/l*PORTAL.exit;u.z=b.z+dz/l*PORTAL.exit;collide(u,M.map);
      u.tpCd=PORTAL.cd;if(u.ai)u.ai.nav=null;
      fx(M,{t:'tp',g:u.id,x0:r2(x0),z0:r2(z0),x:r2(u.x),z:r2(u.z)});continue units}
  }
}
function separate(M){
  const U=M.units;
  for(let i=0;i<U.length;i++)for(let j=i+1;j<U.length;j++){const a=U[i],b=U[j];if(a.dead||b.dead)continue;
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),mn=a.radius+b.radius;if(d<mn&&d>0){
      const wa=a.kind==='boss'?.1:b.kind==='boss'?.9:.5,k=(mn-d)/d;a.x-=dx*k*wa;a.z-=dz*k*wa;b.x+=dx*k*(1-wa);b.z+=dz*k*(1-wa)}}
}
// shared steering: push away from pillars and hazards ahead
// ---------- navigation ----------
// A 2 m grid of free cells per map (built once). When the straight way to a goal is blocked, a bot follows a
// breadth-first path and heads for the farthest path cell it can see, so it finds its way through walls and mazes.
const NAV_CELL=2,navCache={};
function navGrid(map){
  const key=map.name;if(navCache[key])return navCache[key];
  const R=map.r,n=Math.ceil(2*R/NAV_CELL)+1,free=new Uint8Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=-R+i*NAV_CELL,z=-R+j*NAV_CELL;
    free[j*n+i]=Math.hypot(x,z)<R-1&&!map.pillars.some(([px,pz,r])=>Math.hypot(x-px,z-pz)<r+1.1)&&!map.hazards.some(h=>Math.hypot(x-h.x,z-h.z)<h.r+.8)?1:0}
  return navCache[key]={n,R,free};
}
function navCell(N,p){let i=Math.round((p.x+N.R)/NAV_CELL),j=Math.round((p.z+N.R)/NAV_CELL);i=clamp(i,0,N.n-1);j=clamp(j,0,N.n-1);
  if(N.free[j*N.n+i])return j*N.n+i;
  // a point inside a wall: the nearest free cell around it
  for(let r=1;r<4;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const a=i+di,b=j+dj;if(a>=0&&b>=0&&a<N.n&&b<N.n&&N.free[b*N.n+a])return b*N.n+a}
  return j*N.n+i}
function navPath(M,from,to){
  const N=navGrid(M.map),s=navCell(N,from),g=navCell(N,to);if(s===g)return null;
  const prev=new Int32Array(N.n*N.n).fill(-1);prev[s]=s;const q=[s];let found=false;
  for(let h=0;h<q.length;h++){const c=q[h];if(c===g){found=true;break}const ci=c%N.n,cj=(c/N.n)|0;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const a=ci+di,b=cj+dj;if(a<0||b<0||a>=N.n||b>=N.n)continue;const k=b*N.n+a;
      if(prev[k]!==-1||!N.free[k])continue;if(di&&dj&&(!N.free[cj*N.n+a]||!N.free[b*N.n+ci]))continue;prev[k]=c;q.push(k)}}
  if(!found)return null;
  const path=[];for(let c=g;c!==s;c=prev[c])path.push({x:-N.R+(c%N.n)*NAV_CELL,z:-N.R+((c/N.n)|0)*NAV_CELL});return path.reverse();
}
// where to walk now on the way to goal: the goal itself when it is in sight, otherwise a waypoint on the path
function navNext(M,u,goal){
  if(!blocked(M.map,u,goal,.8))return goal;
  const P=u.ai.nav;
  if(!P||M.time>P.at+.6||Math.hypot(P.gx-goal.x,P.gz-goal.z)>3){u.ai.nav={at:M.time,gx:goal.x,gz:goal.z,path:navPath(M,u,goal)}}
  const path=u.ai.nav.path;if(!path||!path.length)return goal;
  let best=path[0];for(let i=Math.min(path.length-1,14);i>=0;i--){if(!blocked(M.map,u,path[i],.8)){best=path[i];break}}
  return best;
}
function steer(M,u,wx,wz){
  let wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl}
  const obs=[...M.map.pillars,...M.map.hazards.map(h=>[h.x,h.z,h.r+.6])];
  for(const [x,z,r] of obs){const rx=x-u.x,rz=z-u.z,dist=Math.hypot(rx,rz);if(dist>r+u.radius+3)continue;
    const dot=(rx*wx+rz*wz)/(dist||1),lat=rx*wz-rz*wx;
    if(dot>.2&&Math.abs(lat)<r+u.radius+.5){
      // pick a side once and keep it, otherwise the unit wobbles in front of an obstacle on its path
      const s=Math.abs(lat)>.4?Math.sign(lat):(u.ai.side||(u.ai.side=Math.random()<.5?1:-1));
      const px=s>0?-wz:wz,pz=s>0?wx:-wx,k=1.6*(1-Math.min(1,(dist-r-u.radius)/3)*.5);
      wx+=px*k;wz+=pz*k;wl=Math.hypot(wx,wz)||1;wx/=wl;wz/=wl}}
  if(Math.random()<.01)u.ai.side=0;
  for(const h of M.map.hazards){const d=d2(u,h);if(d<h.r+.5){wx+=(u.x-h.x)/(d||1)*2;wz+=(u.z-h.z)/(d||1)*2}}
  for(const g of M.danger){if(g.own===u)continue;const d=d2(u,g);if(d<g.r+.8){wx+=(u.x-g.x)/(d||1)*3;wz+=(u.z-g.z)/(d||1)*3}}
  wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl}
  return[wx,wz];
}

// ---------- status ----------
function updStatus(M,u,dt){
  const s=u.st;
  for(const k of ['stun','slow','silence','cloak','inv','relic','haste','bulwark','decon','marked'])if(s[k]>0)s[k]=Math.max(0,s[k]-dt);
  if(s.decon>0){s.bleed=null;s.nanite=null;s.burn=null;s.poison=null;s.shock=null}
  if(s.marked>0)s.cloak=0;
  if(s.nanite)updNanite(M,u,s.nanite,dt);
  if(u.ambush>0){u.ambush-=dt;if(s.cloak<=0&&u.ambush>1.5)u.ambush=1.5}
  if(s.bleed){s.bleed.acc+=dt;s.bleed.t-=dt;
    while(s.bleed&&s.bleed.acc>=.5&&!u.dead){s.bleed.acc-=.5;damage(M,u,s.bleed.dps*.5,s.bleed.src,{dot:true,color:0xff3355})}
    if(s.bleed&&s.bleed.t<=0)s.bleed=null}
  tickDot(M,u,'poison',0x9dff5d,dt);tickDot(M,u,'shock',0x9fd8ff,dt);
  if(s.burn){s.burn.acc+=dt;s.burn.t-=dt;
    while(s.burn&&s.burn.acc>=.5&&!u.dead){s.burn.acc-=.5;const b=s.burn;dotTick(M,u,b,b.dps*.5*(b.src&&b.src.st.relic>0&&b.src.clsKey==='pyro'?2:1),0xff6a1a)}
    if(s.burn&&s.burn.t<=0)s.burn=null}
  if(u.dead)return;
  if(s.hot){s.hot.acc+=dt;s.hot.t-=dt;while(s.hot&&s.hot.acc>=.5){s.hot.acc-=.5;heal(M,u,s.hot.hps*.5,s.hot.src)}if(s.hot&&s.hot.t<=0)s.hot=null}
  if(u.shield>0)u.shield=Math.max(0,u.shield-dt*(u.kind==='boss'?0:3));
  for(const h of M.map.hazards)if(d2(u,h)<h.r&&u.kind!=='boss'){s.hazAcc+=dt;while(s.hazAcc>=.5&&!u.dead){s.hazAcc-=.5;damage(M,u,h.dps*.5,null,{dot:true,color:0xff6a1a})}}
  if(u.kind!=='hero')return;
  const echo=s.relic>0&&u.clsKey==='technician';
  u.energy=Math.min(100,u.energy+dt*9*(1+m(u,'regen')/100)*(echo?1.8:1)*(M.emod.has('surge')?1.5:1));u.ult=Math.min(100,u.ult+dt*1.2*(1+m(u,'ult')/100));
  if(u.pass.has('recovery')&&M.time-u.hurtT>4&&u.hp<u.maxHp)u.hp=Math.min(u.maxHp,u.hp+u.maxHp*.015*dt);
  for(let i=0;i<3;i++)if(u.cds[i]>0)u.cds[i]=Math.max(0,u.cds[i]-dt);
  if(u.tcd>0)u.tcd=Math.max(0,u.tcd-dt);if(u.ecd>0)u.ecd=Math.max(0,u.ecd-dt);
  if(u.atkCd>0)u.atkCd-=dt;
  if(d2(u,M.map.bases[u.team])<4.2){if(u.hp<u.maxHp)u.hp=Math.min(u.maxHp,u.hp+dt*45);u.energy=Math.min(100,u.energy+dt*25)}
  if(M.D.pvp&&d2(u,M.map.bases[1-u.team])<5){s.fieldAcc+=dt;while(s.fieldAcc>=.5&&!u.dead){s.fieldAcc-=.5;damage(M,u,30,null,{dot:true,color:TEAM_COL[1-u.team]})}}
}

// ---------- hero bots ----------
// Únos relikvie: the carrier runs home; the nearest allies chase an enemy carrier or return a dropped relic;
// one bot per team defends, the others go stealing or escort their own carrier.
function ctfGoal(M,u,t,d){
  const own=flagOf(M,u.team),foe=flagOf(M,1-u.team),mates=heroesOf(M,u.team).filter(x=>!x.dead);
  if(u.carry!=null)return{p:own.home};
  const nearest=p=>mates.slice().sort((a,b)=>d2(a,p)-d2(b,p)).indexOf(u);
  if(own.state==='carried'){const c=M.units.find(x=>x.id===own.carrier);if(c&&nearest(c)<2)return{p:c,target:visibleTo(u,c)?c:null}}
  if(own.state==='dropped'&&nearest(own)===0)return{p:own};
  const role=mates.filter(x=>x.ctrl==='bot').sort((a,b)=>a.id-b.id).indexOf(u);
  if(role===0&&mates.length>1){if(d2(u,own.home)>7&&(!t||d>8))return{p:own.home};return null}
  if(foe.state==='carried'){const c=M.units.find(x=>x.id===foe.carrier);if(c&&c!==u&&(!t||d>8)&&d2(u,c)>4)return{p:c};return null}
  if(!t||d>6||u.hp>u.maxHp*.5)return{p:foe};
  return null;
}
function pickTarget(u,M){
  let best=null,bs=1e9;
  for(const e of foes(M,u)){if(!visibleTo(u,e))continue;const d=d2(u,e);if(d>(M.D.pvp?32:80))continue;
    const s=d+(e.hp/e.maxHp)*8+(blocked(M.map,u,e)?8:0)+(e===u.ai.target?-3:0)+(e.kind==='boss'?4:0)+(e.C.shield?-8:0);if(s<bs){bs=s;best=e}}
  return best;
}
function botSkills(M,u,t,d,aim,seen){
  const k=u.clsKey,hurt=near(friends(M,u).filter(x=>x.kind==='hero'),u,7.5).filter(a=>a.hp<a.maxHp*.6);
  if(k==='striker'){
    if(!t)return;
    if(u.ult>=100&&d<13&&seen){cast(M,u,3,aim);return}
    if(d<7&&seen&&cast(M,u,0,t))return;
    if(d<20&&seen&&cast(M,u,2,aim))return;
    if((u.hp<u.maxHp*.5&&d<10)||(d>12&&d<22&&Math.random()<.2))cast(M,u,1,aim);
  }else if(k==='guardian'){
    const n=near(foes(M,u),u,7).length;
    if(u.ult>=100&&(n>=2||(t&&d<4.5))){cast(M,u,3,u);return}
    if(t&&d>3.5&&d<9&&seen&&cast(M,u,1,t))return;
    if((hurt.length&&hurt.some(a=>a!==u))||u.hp<u.maxHp*.45){if(cast(M,u,2,u))return}
    if(t&&d<5.5&&u.hp<u.maxHp*.85)cast(M,u,0,u);
  }else if(k==='pyro'){
    if(!t)return;
    const n=near(foes(M,u),u,7).length;
    if(u.ult>=100&&(n>=2||d<6)){cast(M,u,3,u);return}
    if(d<6.5&&seen&&cast(M,u,0,aim))return;
    // the blink closes in on a target out of wave range; when low on health it escapes instead
    const l=d||1;
    if(u.hp<u.maxHp*.3&&d<6){if(cast(M,u,2,{x:u.x-(t.x-u.x)/l*7,z:u.z-(t.z-u.z)/l*7}))return}
    else if(d>8&&d<15&&seen&&u.energy>=55){if(cast(M,u,2,{x:t.x-(t.x-u.x)/l*3,z:t.z-(t.z-u.z)/l*3}))return}
    if(d<14&&cast(M,u,1,aim))return;
  }else{
    if(hurt.length&&cast(M,u,1,u))return;
    if(u.st.bleed&&cast(M,u,1,u))return;
    if(!t)return;
    if(u.ult>=100&&d<14){cast(M,u,3,aim);return}
    if(d<12.5&&cast(M,u,2,t))return;
    if(d<15)cast(M,u,0,t);
  }
}
function botUpdate(M,u,dt){
  const ai=u.ai,diff=M.diff;ai.think-=dt;ai.strafeT-=dt;
  if(ai.strafeT<=0){ai.strafe=Math.random()<.5?-1:1;ai.strafeT=rnd(.8,2.4)}
  let thinkNow=false;
  // a fresh team ping from a human ally: go there, or go after the marked enemy
  const ping=M.pings?.find(q=>q.team===u.team&&q.until>M.time&&q.src!==u.id);
  if(ai.think<=0){ai.think=diff.react*rnd(.6,1.4);ai.target=pickTarget(u,M);ai.err={x:rnd(-1,1)*diff.err,z:rnd(-1,1)*diff.err};thinkNow=true;
    if(ping?.tg){const e=M.units.find(x=>x.id===ping.tg);if(e&&!e.dead&&visibleTo(u,e)&&d2(u,e)<40)ai.target=e}}
  const t=ai.target&&!ai.target.dead&&visibleTo(u,ai.target)?ai.target:null;
  const d=t?d2(u,t):99,seen=t?!blocked(M.map,u,t,.2):false;
  if(u.hp<u.maxHp*.3)ai.retreat=true;if(ai.retreat&&u.hp>u.maxHp*.85)ai.retreat=false;
  let wx=0,wz=0,goal=null;const center={x:0,z:0};
  if(ai.retreat)goal=M.map.bases[u.team];
  else if(M.relic.state==='up'){const mine=friends(M,u).filter(x=>x.kind==='hero').sort((a,b)=>d2(a,center)-d2(b,center))[0];if(mine===u&&(!t||d2(u,center)<16))goal=center}
  else if(M.mode==='control'&&(!t||d>12)){
    const want=M.points.filter(p=>p.own!==u.team||Math.sign(p.prog)!==(u.team?1:-1)).sort((a,b)=>d2(u,a)-d2(u,b));
    const p=want[0]||M.points[(u.id+Math.floor(M.time/20))%M.points.length];
    if(d2(u,p)>2.5)goal=p;
  }
  if(M.flags&&!u.bomb){const g=ctfGoal(M,u,t,d);if(g){goal=g.p;if(g.target)ai.target=g.target}}
  if(!goal&&!ai.retreat&&ping&&!ping.tg&&ping.k==='here'&&(!t||d>8)&&d2(u,ping)>3)goal=ping;
  if(!goal&&!ai.retreat&&ping&&ping.k==='danger'&&d2(u,ping)<6){const dx=u.x-ping.x,dz=u.z-ping.z,l=Math.hypot(dx,dz)||1;goal=inArena(M,{x:u.x+dx/l*6,z:u.z+dz/l*6},2)}
  // carrying Nositel's burden: run away from the rest of the team
  if(u.bomb){const fr=heroesOf(M,u.team).filter(x=>x!==u);if(fr.length){let cx=0,cz=0;for(const f of fr){cx+=f.x;cz+=f.z}cx/=fr.length;cz/=fr.length;
    const dx=u.x-cx,dz=u.z-cz,l=Math.hypot(dx,dz)||1;goal=inArena(M,{x:u.x+dx/l*10,z:u.z+dz/l*10},3)}}
  // Eliminace: keep inside the closing circle with a margin; a goal outside it is pulled in, and a bot caught outside walks in first
  if(M.elim){const lim=Math.max(1.5,M.elim.r-3),pull=(p,r)=>{const l=Math.hypot(p.x,p.z);return l<=r?p:{x:p.x/l*r,z:p.z/l*r}};
    if(Math.hypot(u.x,u.z)>lim)goal=pull(u,Math.max(0,lim-2));else if(goal)goal=pull(goal,lim)}
  if(goal){const g=navNext(M,u,goal);wx=g.x-u.x;wz=g.z-u.z;if(Math.hypot(goal.x-u.x,goal.z-u.z)<1)wx=wz=0}
  else if(t){
    const way=seen?t:navNext(M,u,t);let tx=way.x-u.x,tz=way.z-u.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const pref=u.C.pref+(t.kind==='boss'&&u.clsKey!=='guardian'?3:0);
    if(!seen||d>pref+1.5){wx+=tx;wz+=tz}else if(d<pref-2){wx-=tx;wz-=tz}
    const sf=ai.strafe*(u.clsKey==='guardian'?.25:.8);wx+=-tz*sf;wz+=tx*sf;
  }else if(M.D.pvp){
    const g={x:u.team===0?6:-6,z:ai.lane};if(d2(u,g)<3)ai.lane=rnd(-14,14);
    wx=g.x-u.x;wz=g.z-u.z;
  }else{const h=heroesOf(M,u.team).find(x=>x.ctrl==='human');if(h&&d2(u,h)>6){wx=h.x-u.x;wz=h.z-u.z}}
  if(M.D.pvp){const eb=M.map.bases[1-u.team],ebd=d2(u,eb);if(ebd<8){wx+=(u.x-eb.x)/ebd*(8-ebd)/2;wz+=(u.z-eb.z)/ebd*(8-ebd)/2}}
  [wx,wz]=steer(M,u,wx,wz);
  moveUnit(M,u,wx,wz,dt);
  const play=M.state==='play';
  // evade out of a warned area (boss telegraphs, blasts), more reliably on higher difficulty
  if(thinkNow&&play&&!(u.ecd>0)&&!u.dash){const g=M.danger.find(g=>g.own!==u&&d2(u,g)<g.r+.5);
    const will=Math.random()<({easy:.25,normal:.5,hard:.8}[M.diffKey]??.5);
    if(g&&will){let ex=u.x-g.x,ez=u.z-g.z;if(Math.hypot(ex,ez)<.5){ex=Math.cos(u.face);ez=-Math.sin(u.face)}evade(M,u,{x:ex,z:ez})}
    // in a fight: with little health and an enemy close, evade away; the Strážce bashes in to reach a shooter out of reach
    else if(will&&t){const dt2=d2(u,t),dx=t.x-u.x,dz=t.z-u.z;
      if(u.hp<u.maxHp*.35&&dt2<7&&t.kind!=='boss'&&Math.random()<.6)evade(M,u,{x:-dx+(Math.random()-.5)*dz,z:-dz+(Math.random()-.5)*dx});
      else if(u.clsKey==='guardian'&&dt2>4.5&&dt2<9&&!blocked(M.map,u,t,.3)&&Math.random()<.5)evade(M,u,{x:dx,z:dz})}}
  if(t){
    const B=u.C.basic,lead=B.speed?d/B.speed:0;
    const aim={x:t.x+t.vx*lead+ai.err.x,z:t.z+t.vz*lead+ai.err.z};
    u.aimX=aim.x;u.aimZ=aim.z;
    if(seen&&d<B.range+(B.type==='melee'?t.radius:0)&&play)basic(M,u,aim);
    else if(!u.dash)u.face=Math.atan2(t.x-u.x,t.z-u.z);
    if(thinkNow&&Math.random()<diff.skill&&play)botSkills(M,u,t,d,aim,seen);
    if(thinkNow&&play&&u.tcd<=0)botTactic(M,u,t,d);
  }else{
    if(!u.dash&&u.vx*u.vx+u.vz*u.vz>.5)u.face=Math.atan2(u.vx,u.vz);
    if(thinkNow&&play)botSkills(M,u,null,99,u,false);
  }
}

function botTactic(M,u,t,d){
  const s=u.st,low=u.hp<u.maxHp*.45,danger=M.danger.some(g=>g.own!==u&&d2(u,g)<g.r+.5);
  const want={dodge:danger||low&&t&&d<6,decon:!!s.nanite||!!s.bleed&&low||s.slow>0&&s.silence>0,overload:u.energy<25,barrier:low&&M.time-u.hurtT<1,beacon:!!t&&d<14&&t.hp>t.maxHp*.3}[u.tactic];
  if(want)tactical(M,u,t?{x:t.x,z:t.z}:{x:u.x,z:u.z});
}
// ---------- NPCs ----------
function npcUpdate(M,u,dt){
  if(!u.C.speed){u.vx=u.vz=0;return}
  const ai=u.ai;ai.think-=dt;ai.strafeT-=dt;
  if(ai.strafeT<=0){ai.strafe=Math.random()<.5?-1:1;ai.strafeT=rnd(1,2.5)}
  if(u.key==='repair'){
    const boss=M.units.find(x=>x.kind==='boss'&&!x.dead&&x.team===u.team);
    const tgt=boss||friends(M,u).filter(x=>x!==u&&x.hp<x.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    let wx=0,wz=0;
    if(tgt){const d=d2(u,tgt);if(d>4){wx=tgt.x-u.x;wz=tgt.z-u.z}
      ai.acc+=dt;if(ai.acc>=.5){ai.acc-=.5;if(d<12&&tgt.hp<tgt.maxHp&&M.state==='play'){heal(M,tgt,(tgt.kind==='boss'?40:20)*.5,null,true);fx(M,{t:'beam',a:[r2(u.x),1.4,r2(u.z)],b:[r2(tgt.x),1.4,r2(tgt.z)],c:0x74ffb4,w:.05,d:.3})}}}
    [wx,wz]=steer(M,u,wx,wz);moveUnit(M,u,wx,wz,dt);return;
  }
  // Štítonoš: a shield for itself and the allies around it, every few seconds
  const SH=u.C.shield;
  if(SH&&M.state==='play'){ai.shT=(ai.shT??2)-dt;
    if(ai.shT<=0){ai.shT=SH.every;const near=friends(M,u).filter(x=>!x.dead&&x.kind!=='boss'&&d2(u,x)<SH.r);
      for(const x of near){x.shield=Math.max(x.shield,Math.round(x.maxHp*SH.frac));if(x!==u)fx(M,{t:'beam',a:[r2(u.x),1.6,r2(u.z)],b:[r2(x.x),1.2,r2(x.z)],c:0x6ad8ff,w:.06,d:.35})}
      fx(M,{t:'burst',x:r2(u.x),z:r2(u.z),y:1.2,c:0x6ad8ff,n:24,s:SH.r,u:1,l:.5})}}
  if(ai.think<=0){ai.think=rnd(.4,.8);let best=null,bd=1e9;for(const e of foes(M,u)){if(!visibleTo(u,e))continue;const d=d2(u,e);if(d<bd){bd=d;best=e}}ai.target=best}
  const t=ai.target&&!ai.target.dead?ai.target:null;let wx=0,wz=0;
  if(t){const d=d2(u,t),seen=!blocked(M.map,u,t,.15);let tx=t.x-u.x,tz=t.z-u.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
    if(!seen||d>u.C.pref+1){wx+=tx;wz+=tz}else if(d<u.C.pref-2){wx-=tx;wz-=tz}
    wx+=-tz*ai.strafe*.6;wz+=tx*ai.strafe*.6;
    const B=u.C.basic;if(B&&seen&&d<B.range+t.radius&&M.state==='play')basic(M,u,{x:t.x+rnd(-1,1),z:t.z+rnd(-1,1)});else if(!u.dash)u.face=Math.atan2(tx,tz);}
  [wx,wz]=steer(M,u,wx,wz);moveUnit(M,u,wx,wz,dt);if(u.atkCd>0)u.atkCd-=dt;
}

// ---------- bosses ----------
const BOSS_AI={
  collector(M,u,t,cd){
    if(cd.a<=0&&t){cd.a=9;const marks=u.hp<u.maxHp*.5?2:1,targets=heroesOf(M,0).sort(()=>Math.random()-.5).slice(0,marks);
      targets.forEach((tg,i)=>later(M,i*1.6,()=>{if(u.dead||tg.dead)return;const dx=tg.x-u.x,dz=tg.z-u.z,l=Math.hypot(dx,dz)||1,len=Math.min(18,l+4);
        const e=inArena(M,{x:u.x+dx/l*len,z:u.z+dz/l*len},2);u.ai.lock=1.3;
        fx(M,{t:'txt',x:r2(tg.x),z:r2(tg.z),s:'Označen',c:'info'});
        tele(M,{sh:'l',x:r2(u.x),z:r2(u.z),x2:r2(e.x),z2:r2(e.z),w:2.4},1.2,()=>{if(u.dead)return;const ddx=e.x-u.x,ddz=e.z-u.z,dl=Math.hypot(ddx,ddz)||1;
          u.dash={dx:ddx/dl,dz:ddz/dl,spd:30,t:dl/30,hits:{dmg:110*u.dmgScale,r:2.2,kb:3,set:new Set()}}})}))}
    if(cd.b<=0){cd.b=16;for(const s of [-1,1])addNpc(M,'drone',u.x+s*2.5,u.z+2,.8*u.hpScale/2,u.dmgScale);fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Drony',c:'info'})}
  },
  armor(M,u,t,cd){
    const A=u.ai;
    for(const th of [.66,.33])if(!A['f'+th]&&u.hp<u.maxHp*th){A['f'+th]=1;A.fortT=8;u.shield=u.maxHp*.2;
      fx(M,{t:'ban',ti:'Roztržení',sub:'Prolomte štít do 8 s, jinak se schovejte za sloup',col:'var(--red)',d:3})}
    if(A.fortT>0){A.fortT-=TICK;
      if(u.shield<=0){A.fortT=0;u.st.stun=3;u.vuln=M.time+6;fx(M,{t:'ban',ti:'Štít prolomen',sub:'Pancéřník je 6 s zranitelnější',col:'var(--gold)',d:2})}
      else if(A.fortT<=0){u.shield=0;fx(M,{t:'rupture',x:r2(u.x),z:r2(u.z)});
        for(const e of heroesOf(M,0))if(!blocked(M.map,u,e))damage(M,e,260*u.dmgScale,u,{color:0xff9c5b})}
      return}
    if(cd.a<=0){cd.a=8;const at={x:u.x,z:u.z};A.lock=1.4;
      tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:6.5},1.4,()=>{if(u.dead)return;fx(M,{t:'slam',x:r2(at.x),z:r2(at.z),r:6.5});
        for(const e of near(foes(M,u),at,6.5)){damage(M,e,140*u.dmgScale,u,{color:0xff9c5b});e.st.stun=Math.max(e.st.stun,1)}})}
    if(cd.b<=0){cd.b=11;for(const h of heroesOf(M,0)){const at={x:h.x,z:h.z};
      tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:3},1.3,()=>{fx(M,{t:'emp',x:r2(at.x),z:r2(at.z),r:3});for(const e of near(heroesOf(M,0),at,3))damage(M,e,90*u.dmgScale,u,{color:0xff9c5b})})}}
  },
  voice(M,u,t,cd){
    if(cd.a<=0){cd.a=9;M.rings.push({id:M.nextId++,x:u.x,z:u.z,r:1,v:9,max:M.map.r*2,dmg:70*u.dmgScale,team:u.team,src:u,hit:new Set(),color:0x6acbff});fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Vlna',c:'info'})}
    if(cd.c<=0){cd.c=15;const n=u.hp<u.maxHp*.5?2:1,a0=rnd(0,Math.PI*2),w=(Math.random()<.5?-1:1)*1.05;u.ai.lock=5.8;
      for(let k=0;k<n;k++)M.beams.push({id:M.nextId++,src:u,x:u.x,z:u.z,a:a0+k*Math.PI,w,len:M.map.r*2,t:5,warm:.9,acc:0,dps:110});
      fx(M,{t:'ban',ti:'Frekvence',sub:'Rotující paprsek · schovej se za sloup',col:'var(--cyan)',d:1.8})}
    if(cd.b<=0){cd.b=7;for(let k=0;k<10;k++){const a=k/10*Math.PI*2;shoot(M,u,{x:Math.sin(a),z:Math.cos(a)},{dmg:20*u.dmgScale,speed:18,range:30,color:0x9fd8ff,size:1.8})}}
  },
  matrona(M,u,t,cd){
    const A=u.ai,swarm=()=>M.units.some(x=>x.kind==='npc'&&x.team===u.team&&!x.dead);
    if(!A.half&&u.hp<u.maxHp*.5){A.half=1;u.invuln=true;for(let k=0;k<6;k++){const a=k/6*Math.PI*2;addNpc(M,k<4?'drone':'repair',u.x+Math.cos(a)*4,u.z+Math.sin(a)*4,u.hpScale/2.4,u.dmgScale)}
      fx(M,{t:'ban',ti:'Rozkaz roje',sub:'Matrona je nezranitelná, dokud žije roj',col:'var(--green)',d:3})}
    if(u.invuln&&!swarm()){u.invuln=false;fx(M,{t:'ban',ti:'Roj zničen',sub:'Matrona je opět zranitelná',col:'var(--gold)',d:2})}
    if(cd.a<=0){cd.a=13;for(let k=0;k<4;k++){const a=rnd(0,Math.PI*2);addNpc(M,k<3?'drone':'repair',u.x+Math.cos(a)*3.5,u.z+Math.sin(a)*3.5,u.hpScale/2.6,u.dmgScale)}}
    if(cd.b<=0){cd.b=9;for(const h of heroesOf(M,0).slice(0,3)){const at=inArena(M,{x:h.x+rnd(-1.5,1.5),z:h.z+rnd(-1.5,1.5)},2);
      tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:3.5},1.3,()=>{if(u.dead)return;M.zones.push({id:M.nextId++,x:at.x,z:at.z,r:3.5,t:5,acc:0,dps:25*u.dmgScale,src:u,team:u.team,color:0xd4ff4a,slow:true})})}}
  }
};
// shared boss moves, reused by Omega
function bossSlam(M,u,R,dmg){const at={x:u.x,z:u.z};u.ai.lock=1.4;
  tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:R},1.4,()=>{if(u.dead)return;fx(M,{t:'slam',x:r2(at.x),z:r2(at.z),r:R});
    for(const e of near(foes(M,u),at,R)){damage(M,e,dmg*u.dmgScale,u,{color:u.C.color});e.st.stun=Math.max(e.st.stun,1)}})}
function bossVolley(M,u,n,dmg,col){for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rnd(0,.3);shoot(M,u,{x:Math.sin(a),z:Math.cos(a)},{dmg:dmg*u.dmgScale,speed:18,range:32,color:col,size:1.8})}}
function bossBeams(M,u,n,warn){const a0=rnd(0,Math.PI*2),w=(Math.random()<.5?-1:1)*1.05;u.ai.lock=5.8;
  for(let k=0;k<n;k++)M.beams.push({id:M.nextId++,src:u,x:u.x,z:u.z,a:a0+k*Math.PI*2/n,w,len:M.map.r*2,t:5,warm:.9,acc:0,dps:110});
  fx(M,{t:'ban',ti:warn,sub:'Rotující paprsek · schovej se za sloup',col:'var(--cyan)',d:1.8})}
function bossCharge(M,u,tg,delay=0){later(M,delay,()=>{if(u.dead||tg.dead)return;const dx=tg.x-u.x,dz=tg.z-u.z,l=Math.hypot(dx,dz)||1,len=Math.min(18,l+4);
  const e=inArena(M,{x:u.x+dx/l*len,z:u.z+dz/l*len},2);u.ai.lock=1.3;fx(M,{t:'txt',x:r2(tg.x),z:r2(tg.z),s:'Označen',c:'info'});
  tele(M,{sh:'l',x:r2(u.x),z:r2(u.z),x2:r2(e.x),z2:r2(e.z),w:2.4},1.2,()=>{if(u.dead)return;const ddx=e.x-u.x,ddz=e.z-u.z,dl=Math.hypot(ddx,ddz)||1;
    u.dash={dx:ddx/dl,dz:ddz/dl,spd:30,t:dl/30,hits:{dmg:110*u.dmgScale,r:2.2,kb:3,set:new Set()}}})})}
Object.assign(BOSS_AI,{
  archivist(M,u,t,cd){
    const A=u.ai;
    if(A.col){A.col.t-=TICK;const tr=M.units.find(x=>x.id===A.col.tid),fs=M.units.find(x=>x.id===A.col.fid);
      if(!tr||tr.dead){if(fs&&!fs.dead){fs.remove=true;fs.dead=true}A.col=null;u.st.stun=3;u.vuln=M.time+6;
        fx(M,{t:'ban',ti:'Kolaps přerušen',sub:'Archivář je 6 s zranitelnější',col:'var(--gold)',d:2})}
      else if(fs&&fs.dead&&!A.col.boom){A.col.boom=1;fx(M,{t:'rupture',x:r2(fs.x),z:r2(fs.z)});for(const e of heroesOf(M,0))damage(M,e,80*u.dmgScale,u,{color:0xc08bff})}
      else if(A.col.t<=0){for(const x of [tr,fs])if(x&&!x.dead){x.remove=true;x.dead=true}A.col=null;fx(M,{t:'rupture',x:r2(u.x),z:r2(u.z)});
        for(const e of heroesOf(M,0))damage(M,e,200*u.dmgScale,u,{color:0xe7b2ff})}
      return}
    if(cd.a<=0){cd.a=17;const a=rnd(0,Math.PI*2),r=M.map.r*.55,hs=u.hpScale/1.6;
      const p1=inArena(M,{x:Math.cos(a)*r,z:Math.sin(a)*r},3),p2=inArena(M,{x:-Math.cos(a)*r,z:-Math.sin(a)*r},3),swap=Math.random()<.5;
      const tr=addNpc(M,'shard',...(swap?[p1.x,p1.z]:[p2.x,p2.z]),hs,1),fs=addNpc(M,'fshard',...(swap?[p2.x,p2.z]:[p1.x,p1.z]),hs,1);
      A.col={t:9,tid:tr.id,fid:fs.id};fx(M,{t:'ban',ti:'Zrcadlový kolaps',sub:'Zničte zlatý pravý střep do 9 s. Fialový je falešný.',col:'var(--gold)',d:3})}
    if(cd.b<=0){cd.b=8;bossVolley(M,u,12,18,0xe7b2ff)}
    if(cd.c<=0&&t){cd.c=11;const at={x:t.x,z:t.z};tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:3.2},1.2,()=>{fx(M,{t:'emp',x:r2(at.x),z:r2(at.z),r:3.2});for(const e of near(heroesOf(M,0),at,3.2)){damage(M,e,85*u.dmgScale,u,{color:0xe7b2ff});e.st.silence=Math.max(e.st.silence,1.5)}})}
  },
  omega(M,u,t,cd){
    const A=u.ai,ph=u.hp>u.maxHp*.66?1:u.hp>u.maxHp*.33?2:3;
    if(ph!==A.ph){if(A.ph)fx(M,{t:'ban',ti:`Omega · fáze ${ph}`,sub:ph===2?'Přidává rotující paprsky':'Výpady a roj dronů',col:'var(--red)',d:2.4});A.ph=ph;if(ph===3)cd.d=2}
    if(cd.a<=0){cd.a=ph===3?7:9;bossSlam(M,u,7,150)}
    if(cd.b<=0){cd.b=7;bossVolley(M,u,ph===3?16:12,20,0xff78e6)}
    if(ph>=2&&cd.c<=0){cd.c=16;bossBeams(M,u,ph===3?3:2,'Rozklad vazby')}
    if(ph===3&&cd.d<=0&&t){cd.d=10;heroesOf(M,0).sort(()=>Math.random()-.5).slice(0,2).forEach((h,i)=>bossCharge(M,u,h,i*1.6));
      for(const s of [-1,1])addNpc(M,'drone',u.x+s*3,u.z+2,u.hpScale/3,u.dmgScale)}
  },
  carrier(M,u,t,cd){
    const col=0xffa94d;
    for(const h of heroesOf(M,0)){if(!h.bomb)continue;
      if(M.time<h.bomb.at){M.danger.push({x:h.x,z:h.z,r:6,until:M.time+.05,own:h});continue}
      const at={x:h.x,z:h.z};h.bomb=null;fx(M,{t:'blast',x:r2(at.x),z:r2(at.z),r:6,c:col});
      damage(M,h,90*u.dmgScale,u,{color:col});
      for(const e of near(heroesOf(M,0).filter(x=>x!==h),at,6))damage(M,e,170*u.dmgScale,u,{color:col})}
    if(cd.a<=0){cd.a=14;const hs=heroesOf(M,0).filter(h=>!h.bomb).sort(()=>Math.random()-.5).slice(0,u.hp<u.maxHp*.5?2:1);
      for(const h of hs){h.bomb={at:M.time+6};fx(M,{t:'txt',x:r2(h.x),z:r2(h.z),s:'Břemeno',c:'info'})}
      if(hs.length)fx(M,{t:'ban',ti:'Břemeno',sub:'Kdo ho nese, ať uteče od týmu · výbuch za 6 s',col:'var(--red)',d:2.4})}
    if(cd.b<=0){cd.b=9;bossSlam(M,u,6.5,140)}
    if(cd.c<=0){cd.c=11;for(const h of heroesOf(M,0).sort(()=>Math.random()-.5).slice(0,3)){const at=inArena(M,{x:h.x+rnd(-2,2),z:h.z+rnd(-2,2)},2);
      tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:3},1.3,()=>{if(u.dead)return;fx(M,{t:'blast',x:r2(at.x),z:r2(at.z),r:3,c:col});for(const e of near(heroesOf(M,0),at,3))damage(M,e,95*u.dmgScale,u,{color:col})})}}
  },
  manticore(M,u,t,cd){
    const A=u.ai,col=0xb6ff3d;
    if(!A.rage&&u.hp<u.maxHp*.3){A.rage=1;u.mods={...u.mods,speed:35};fx(M,{t:'ban',ti:'Zuřivost',sub:'Mantikora je rychlejší a útočí častěji',col:'var(--red)',d:2.4})}
    if(A.rage)for(const k in cd)cd[k]-=TICK*.5;
    if(cd.a<=0&&t){cd.a=8;const far=heroesOf(M,0).sort((a,b)=>d2(u,b)-d2(u,a))[0];if(far)bossCharge(M,u,far)}
    if(cd.b<=0&&t&&!(A.lock>0)){cd.b=7;const dir=aimDir(u,t),a={x:u.x,z:u.z},e=inArena(M,ahead(u,dir,12),1);A.lock=1.1;
      tele(M,{sh:'l',x:r2(a.x),z:r2(a.z),x2:r2(e.x),z2:r2(e.z),w:4.5},1,()=>{if(u.dead)return;fx(M,{t:'slash',x:r2(a.x),z:r2(a.z),f:r2(Math.atan2(dir.x,dir.z)),c:col,tl:.2});
        for(const h of heroesOf(M,0))if(segD(h,a,e)<2.25+h.radius){damage(M,h,120*u.dmgScale,u,{color:col});h.st.bleed={dps:12,t:5,acc:0,src:u}}
        M.zones.push({id:M.nextId++,x:e.x,z:e.z,r:3,t:5,acc:0,dps:22*u.dmgScale,src:u,team:u.team,color:col})})}
    if(cd.c<=0){cd.c=15;for(const h of heroesOf(M,0).slice(0,4)){const at=inArena(M,{x:h.x+rnd(-1.5,1.5),z:h.z+rnd(-1.5,1.5)},2);
      tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:3.5},1.3,()=>{if(u.dead)return;M.zones.push({id:M.nextId++,x:at.x,z:at.z,r:3.5,t:6,acc:0,dps:24*u.dmgScale,src:u,team:u.team,color:col,slow:true})})}
      fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Jedová mlha',c:'info'})}
  },
  seraph(M,u,t,cd){
    const A=u.ai,col=0xfff1a8;
    if(A.fly){A.fly.t-=TICK;A.fly.acc+=TICK;A.lock=.5;
      if(A.fly.acc>=.8){A.fly.acc-=.8;for(const h of heroesOf(M,0)){const at=inArena(M,{x:h.x+h.vx*.6+rnd(-2.5,2.5),z:h.z+h.vz*.6+rnd(-2.5,2.5)},2);
        tele(M,{sh:'c',x:r2(at.x),z:r2(at.z),r:2.6},1.1,()=>{fx(M,{t:'blast',x:r2(at.x),z:r2(at.z),r:2.6,c:col});for(const e of near(heroesOf(M,0),at,2.6))damage(M,e,80*u.dmgScale,u,{color:col})})}}
      if(A.fly.t<=0){A.fly=null;u.invuln=false;u.air=false;bossSlam(M,u,6,120)}
      return}
    for(const th of [.7,.35])if(!A['v'+th]&&u.hp<u.maxHp*th){A['v'+th]=1;A.fly={t:8,acc:0};u.invuln=true;u.air=true;u.dash=null;
      fx(M,{t:'ban',ti:'Vzlet',sub:'Serafín je ve vzduchu · uhýbej dopadům světla',col:'var(--gold)',d:2.4});return}
    if(cd.a<=0){cd.a=9;A.lock=1.2;for(const h of heroesOf(M,0).sort(()=>Math.random()-.5).slice(0,3)){const a={x:u.x,z:u.z},e=inArena(M,ahead(u,aimDir(u,h),30),1);
      tele(M,{sh:'l',x:r2(a.x),z:r2(a.z),x2:r2(e.x),z2:r2(e.z),w:2.2},1.1,()=>{if(u.dead)return;fx(M,{t:'beam',a:[r2(a.x),1.4,r2(a.z)],b:[r2(e.x),1.4,r2(e.z)],c:col,w:.5,d:.4});
        for(const x of heroesOf(M,0))if(segD(x,a,e)<1.1+x.radius)damage(M,x,120*u.dmgScale,u,{color:col})})}
      fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Kopí světla',c:'info'})}
    if(cd.b<=0){cd.b=12;M.rings.push({id:M.nextId++,x:u.x,z:u.z,r:1,v:9,max:M.map.r*2,dmg:60*u.dmgScale,team:u.team,src:u,hit:new Set(),color:col})}
  },
  archon(M,u,t,cd){
    const A=u.ai,col=0xff4d6d,R=M.map.r;
    if(!A.half&&u.hp<u.maxHp*.5){A.half=1;for(const s of [-1,1])addNpc(M,'sentinel',u.x+s*4,u.z,u.hpScale/2.5,u.dmgScale);bossBeams(M,u,2,'Soudní paprsky');return}
    if(cd.a<=0){cd.a=A.half?13:16;const a=rnd(0,Math.PI*2),nx=Math.cos(a),nz=Math.sin(a),c={x:nx*R/2,z:nz*R/2};
      tele(M,{sh:'l',x:r2(c.x+nz*R),z:r2(c.z-nx*R),x2:r2(c.x-nz*R),z2:r2(c.z+nx*R),w:R},2.4,()=>{if(u.dead)return;fx(M,{t:'blast',x:r2(c.x),z:r2(c.z),r:R/2,c:col});
        for(const e of heroesOf(M,0))if(e.x*nx+e.z*nz>-.5)damage(M,e,280*u.dmgScale,u,{color:col})});
      M.danger.push({x:c.x,z:c.z,r:R*.6,until:M.time+2.4});
      fx(M,{t:'ban',ti:'Rozsudek',sub:'Přejdi na nespálenou polovinu arény',col:'var(--red)',d:2.2})}
    if(cd.b<=0){cd.b=14;for(const h of heroesOf(M,0)){const dx=u.x-h.x,dz=u.z-h.z,d=Math.hypot(dx,dz);if(d<4.5)continue;
        h.dash={dx:dx/d,dz:dz/d,spd:20,t:Math.min(d-4,10)/20};fx(M,{t:'beam',a:[r2(u.x),1.6,r2(u.z)],b:[r2(h.x),1.2,r2(h.z)],c:col,w:.12,d:.5})}
      fx(M,{t:'txt',x:r2(u.x),z:r2(u.z),s:'Gravitace',c:'info'});later(M,.6,()=>{if(!u.dead)bossSlam(M,u,6.5,150)})}
    if(cd.c<=0){cd.c=8;bossVolley(M,u,10,20,col)}
  }
});
const segD=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,L=dx*dx+dz*dz||1,k=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/L,0,1);return Math.hypot(a.x+dx*k-p.x,a.z+dz*k-p.z)};
function bossUpdate(M,u,dt){
  const A=u.ai;for(const k in A.cd)A.cd[k]-=dt;if(A.lock>0)A.lock-=dt;
  if(u.atkCd>0)u.atkCd-=dt;
  if(M.state!=='play'||u.st.stun>0){moveUnit(M,u,0,0,dt);return}
  let t=null,best=-1;
  for(const e of foes(M,u)){if(!visibleTo(u,e))continue;const s=(u.threat[e.id]||0)-d2(u,e)*8;if(s>best||!t){best=s;t=e}}
  for(const k in u.threat)u.threat[k]*=.995;
  let wx=0,wz=0;
  if(t&&!(A.lock>0)){const d=d2(u,t);let tx=t.x-u.x,tz=t.z-u.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
    if(d>u.C.pref+u.radius)wx=tx,wz=tz;else if(d<u.C.pref-2&&u.C.pref>5)wx=-tx,wz=-tz;
    const B=u.C.basic,seen=!blocked(M.map,u,t,.2);if(seen&&d<B.range+t.radius+u.radius)basic(M,u,t);else if(!u.dash)u.face=Math.atan2(tx,tz)}
  if(!u.dash){[wx,wz]=steer(M,u,wx,wz);}
  moveUnit(M,u,wx,wz,dt);
  BOSS_AI[u.key](M,u,t,A.cd);
}

// ---------- humans ----------
// input: {seq, mx, mz, ax, az, atk, fm (face by movement), cast:[i...]}
// ---------- pings and quick messages ----------
// Pings (here, attack, danger) go to the own team only and steer bot allies for a few seconds;
// quick messages appear above the hero for everyone. Each hero may signal at most 6 times in 8 s.
export const SIGNALS={here:{name:'Sem',ping:1},attack:{name:'Útok',ping:1},danger:{name:'Pozor',ping:1},
  go:{name:'Útok!'},back:{name:'Ustupte!'},help:{name:'Potřebuju pomoc!'},hold:{name:'Bráním!'},thanks:{name:'Díky!'},gg:{name:'Dobrá hra!'},haha:{name:'Haha!'},
  // emotes: everyone sees the hero animate for d seconds (until it moves or attacks)
  wave:{name:'Pozdrav',emote:1,d:2.2},dance:{name:'Tanec',emote:1,d:3.2},cheer:{name:'Oslava',emote:1,d:2.4}};
export const SIGNAL_KEYS=Object.keys(SIGNALS);
export function signal(M,u,k,x,z){
  if(!u||u.kind!=='hero'||!Object.hasOwn(SIGNALS,k)||M.state==='end'||SIGNALS[k].emote&&u.dead)return false;
  u.sigT=(u.sigT||[]).filter(t=>M.time-t<8);if(u.sigT.length>=6)return false;u.sigT.push(M.time);
  const S=SIGNALS[k];
  if(!S.ping){fx(M,{t:'sig',k,u:u.id});return true}
  const p=inArena(M,{x:clamp(+x||0,-60,60),z:clamp(+z||0,-60,60)});
  // a ping close to a visible enemy marks that enemy
  let tg=null;if(k!=='danger'){tg=foes(M,u).filter(e=>visibleTo(u,e)&&d2(e,p)<3+e.radius).sort((a,b)=>d2(a,p)-d2(b,p))[0]||null;if(tg)k='attack';else if(k==='attack')k='here'}
  M.pings=(M.pings||[]).filter(q=>q.until>M.time&&!(q.team===u.team&&q.src===u.id));
  M.pings.push({team:u.team,src:u.id,k,x:tg?tg.x:p.x,z:tg?tg.z:p.z,tg:tg?.id||0,until:M.time+6});
  fx(M,{t:'sig',k,u:u.id,x:r2(tg?tg.x:p.x),z:r2(tg?tg.z:p.z),tg:tg?.id||0,team:u.team});
  return true;
}
export function queueInput(u,inp){
  if(u.queue.length>=4){const old=u.queue.shift();inp.cast=[...(old.cast||[]),...(inp.cast||[])]}
  u.queue.push(inp);
}
function humanUpdate(M,u,dt){
  let inp=u.queue.shift();
  // vt = the server time of the world the player was looking at when sending this input
  if(inp){u.lastSeq=inp.seq;u.input=inp;u.lag=inp.vt>0?clamp(M.time-inp.vt,0,LAG_MAX):0}else if(u.input){inp={...u.input,cast:[]};u.input=inp}else inp={mx:0,mz:0,ax:u.x,az:u.z,atk:false,cast:[]};
  let mx=+inp.mx||0,mz=+inp.mz||0;const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l}
  moveUnit(M,u,mx,mz,dt);
  u.aimX=clamp(+inp.ax||0,-60,60);u.aimZ=clamp(+inp.az||0,-60,60);
  if(!u.dash&&u.st.stun<=0){
    if(inp.fm){if(u.vx*u.vx+u.vz*u.vz>.5)u.face=Math.atan2(u.vx,u.vz)}
    else{const dx=u.aimX-u.x,dz=u.aimZ-u.z;if(dx*dx+dz*dz>.01)u.face=Math.atan2(dx,dz)}
  }
  const aim={x:u.aimX,z:u.aimZ};
  for(const i of (inp.cast||[]))if(i===5)evade(M,u,{x:mx,z:mz});else if(i>=0&&i<=4)cast(M,u,i|0,aim);
  if(inp.atk&&M.state==='play')basic(M,u,aim);
}

// ---------- mode logic ----------
function updRelic(M,dt){
  const R=M.relic;if(R.state==='off')return;
  if(R.state==='wait'){R.t-=dt;if(R.t<=0){R.state='up';fx(M,{t:'relicUp'})}}
  else for(const u of M.units){if(u.dead||u.kind!=='hero'||Math.hypot(u.x,u.z)>1.7)continue;
    R.state='wait';R.t=RELIC_EVERY*(M.emod.has('relic')?.5:1);u.st.relic=20;u.relics++;M.score[u.team]++;
    if(u.clsKey==='guardian')u.shield=Math.min(maxShield(u)+150,u.shield+150);
    fx(M,{t:'feed',k:'relic',a:u.id});checkWin(M);break}
}
// ---------- Únos relikvie (capture the relic) ----------
// Each team keeps a relic on a stand in front of its base. Touching the enemy relic picks it up; the carrier is slower
// and cannot hide. Bringing it to your own stand while your relic is at home scores. A dropped relic returns home when
// its team touches it, or by itself after 15 s.
export const CTF={pick:1.7,score:2.6,ret:15,slow:.85};
function ctfSetup(M){
  M.flags=M.map.bases.map((b,team)=>{const l=Math.hypot(b.x,b.z)||1,h=M.map.flags?.[team]||{x:b.x-b.x/l*10,z:b.z-b.z/l*10};
    return{team,home:{...h},x:h.x,z:h.z,state:'home',carrier:0,t:0}});
}
const flagOf=(M,team)=>M.flags?.[team];
function dropFlag(M,u){const f=M.flags?.find(f=>f.state==='carried'&&f.carrier===u.id);if(!f)return;
  f.state='dropped';f.carrier=0;f.x=u.x;f.z=u.z;f.t=CTF.ret;u.carry=null;fx(M,{t:'flag',k:'drop',team:f.team,u:u.id,x:r2(u.x),z:r2(u.z)})}
function homeFlag(M,f,by){f.state='home';f.carrier=0;f.x=f.home.x;f.z=f.home.z;fx(M,{t:'flag',k:'return',team:f.team,u:by?.id||0})}
function updFlags(M,dt){
  for(const f of M.flags){
    if(f.state==='carried'){const c=M.units.find(u=>u.id===f.carrier);if(!c||c.dead||c.remove){if(c)dropFlag(M,c);else homeFlag(M,f);continue}
      f.x=c.x;f.z=c.z;c.st.cloak=0;
      // a capture: the carrier reaches its own stand while its own relic is at home
      const own=flagOf(M,c.team);
      if(own.state==='home'&&d2(c,own.home)<CTF.score&&M.state==='play'){c.carry=null;c.caps=(c.caps||0)+1;M.score[c.team]++;homeFlag(M,f);
        fx(M,{t:'flag',k:'cap',team:f.team,u:c.id});checkWin(M)}
      continue}
    if(f.state==='dropped'){f.t-=dt;if(f.t<=0){homeFlag(M,f);continue}}
    if(M.state!=='play')continue;
    for(const u of M.units){if(u.kind!=='hero'||u.dead||d2(u,f)>CTF.pick)continue;
      if(u.team===f.team){if(f.state==='dropped'){homeFlag(M,f,u);break}continue}
      if(u.carry!=null||u.st.inv>0&&u.dash)continue;
      f.state='carried';f.carrier=u.id;u.carry=f.team;u.st.cloak=0;fx(M,{t:'flag',k:'take',team:f.team,u:u.id});break}
  }
}
function updPoints(M,dt){
  for(const p of M.points){const c=[0,0];for(const u of M.units)if(u.kind==='hero'&&!u.dead&&d2(u,p)<p.r)c[u.team]++;
    if(c[0]&&!c[1])p.prog=Math.max(-100,p.prog-dt*22*Math.sqrt(c[0]));else if(c[1]&&!c[0])p.prog=Math.min(100,p.prog+dt*22*Math.sqrt(c[1]));
    const before=p.own;
    if(p.prog<=-100)p.own=0;else if(p.prog>=100)p.own=1;else if((p.own===0&&p.prog>0)||(p.own===1&&p.prog<0))p.own=-1;
    if(p.own!==before){fx(M,{t:'point',i:M.points.indexOf(p),o:p.own});if(p.own>=0)for(const u of M.units)if(u.kind==='hero'&&!u.dead&&u.team===p.own&&d2(u,p)<p.r)u.caps=(u.caps||0)+1}}
  if(M.state!=='play')return;
  M.scoreAcc+=dt;while(M.scoreAcc>=2){M.scoreAcc-=2;for(const p of M.points)if(p.own>=0)M.score[p.own]++}
  checkWin(M);
}
// Eliminace: rounds without respawns. A team that has nobody standing loses the round. After `shrinkAt` seconds the
// arena closes in to nothing over `shrinkTime`; outside the circle heroes burn for `burn` of their max HP per second,
// so every round ends. Between rounds the survivors are untouchable and everyone comes back for the next one.
export const ELIM={shrinkAt:40,shrinkTime:45,burn:.08,pause:4};
function updElim(M,dt){
  const E=M.elim;if(M.state!=='play')return;
  if(E.t0<0){E.t0=M.time;fx(M,{t:'ban',ti:'Kolo 1',sub:'Bez oživení · vyhrává tým, který zůstane stát',col:'var(--gold)',d:2.5})}
  if(E.state==='pause'){E.t-=dt;if(E.t>0)return;
    E.n++;E.state='fight';E.t0=M.time;E.r=M.map.r;
    M.projs=[];M.zones=[];M.beams=[];M.rings=[];M.danger=[];M.timers=[];
    for(const u of M.units)if(u.kind==='hero'){const ult=u.ult;resetUnit(u,M);u.ult=ult;fx(M,{t:'spawn',x:r2(u.x),z:r2(u.z),g:u.id})}
    fx(M,{t:'ban',ti:`Kolo ${E.n}`,sub:`${M.score[0]} : ${M.score[1]} · hraje se do ${M.D.win}`,col:'var(--gold)',d:2.5});return}
  const el=M.time-E.t0,R=M.map.r;
  E.r=el<ELIM.shrinkAt?R:Math.max(0,R*(1-(el-ELIM.shrinkAt)/ELIM.shrinkTime));
  if(el>=ELIM.shrinkAt&&el-dt<ELIM.shrinkAt)fx(M,{t:'ban',ti:'Aréna se zmenšuje',sub:'Mimo kruh to pálí, drž se uvnitř',col:'var(--red)',d:2.5});
  for(const u of M.units){if(u.kind!=='hero'||u.dead||Math.hypot(u.x,u.z)<=E.r){if(u.st)u.st.ringAcc=0;continue}
    u.st.ringAcc=(u.st.ringAcc||0)+dt;if(u.st.ringAcc>=.5){u.st.ringAcc-=.5;damage(M,u,u.maxHp*ELIM.burn*.5,null,{dot:true,color:0xff3f5e})}}
  const up=[0,1].map(t=>heroesOf(M,t).length);
  if(up[0]&&up[1])return;
  // the round is over: a point for the side still standing, nothing when both fell at once
  const w=up[0]?0:up[1]?1:-1;
  if(w>=0)M.score[w]++;
  fx(M,{t:'round',n:E.n,w});
  checkWin(M);if(M.state!=='play')return;
  E.state='pause';E.t=ELIM.pause;
  for(const u of M.units)if(u.kind==='hero'&&!u.dead){u.st.inv=ELIM.pause+.5;u.st.bleed=u.st.burn=u.st.poison=u.st.shock=u.st.nanite=null}
}
function spawnWave(M){
  const w=M.wave,h=Math.max(1,heroesOf(M,0).length+M.units.filter(x=>x.kind==='hero'&&x.dead).length);
  const hp=(1+.12*w)*(1+Math.max(0,w-16)*.08)*(.7+.15*h)*M.diff.hp,dmg=(1+.05*w)*M.diff.dmg;
  const spot=()=>{for(let k=0;k<20;k++){const a=rnd(-1.2,1.2)+(Math.random()<.25?Math.PI/2*(Math.random()<.5?1:-1):0),r=M.map.r-rnd(3,6),p={x:Math.cos(a)*r,z:Math.sin(a)*r};
    if(!M.map.pillars.some(([x,z,pr])=>Math.hypot(p.x-x,p.z-z)<pr+1.5)&&!M.map.hazards.some(z=>d2(p,z)<z.r+1))return p}return{x:M.map.r-5,z:0}};
  if(w%5===0){
    // endless draws a random boss that was not among the last few; plain waves go through them in order
    let key=M.waveBoss||BOSS_KEYS[(w/5-1)%BOSS_KEYS.length];
    if(M.D.endless){M.recent??=[];const pool=BOSS_KEYS.filter(k=>!M.recent.includes(k));key=pool[Math.floor(Math.random()*pool.length)];M.recent=[...M.recent,key].slice(-4)}
    spawnBoss(M,key,.25+.04*w);for(let k=0;k<2;k++){const p=spot();addNpc(M,'drone',p.x,p.z,hp,dmg)}}
  else{const n=3+Math.round(Math.min(w,16)*1.4)+(h-1)*2;
    // Štítonoš from wave 4: one, plus one more every 6 waves
    let wardens=w>=4?1+Math.floor((w-4)/6):0;
    for(let k=0;k<n;k++){const p=spot(),r=Math.random();const key=wardens>0&&k>=n/3&&r<.25?(wardens--,'warden'):w>=3&&r<.2?'sentinel':w>=2&&r<.45?'brute':'drone';later(M,k*.25,()=>addNpc(M,key,p.x,p.z,hp,dmg))}
    M.waveSpawnUntil=M.time+n*.25+.5}
  fx(M,{t:'wave',w,b:w%5===0?1:0});
}
function updWaves(M,dt){
  if(M.state!=='play')return;
  const left=M.units.filter(u=>u.team===1&&!u.dead&&!u.remove).length;
  if(M.waveState==='fight'){
    if(!left&&M.time>(M.waveSpawnUntil||0)){
      M.waveState='break';M.waveT=7;fx(M,{t:'waveClear',w:M.wave});
      if(M.wave%5===0)M.lives++;
      if(M.last&&M.wave>=M.last)endMatch(M,0);
    }
  }else{M.waveT-=dt;if(M.waveT<=0){M.wave++;M.waveState='fight';M.waveSpawnUntil=M.time+1;
    if(M.D.endless&&M.wave%10===0){const k=ENDLESS_MODS[M.wave/10-1];if(k&&!M.emod.has(k)){M.emod.add(k);fx(M,{t:'ban',ti:'Ozvěna sílí',sub:ECHO_MODS[k].name+' · '+ECHO_MODS[k].desc,col:'var(--red)',d:3})}}
    spawnWave(M)}}
  M.score[0]=M.wave;
}
function updLoot(M,dt){
  for(let i=M.loot.length-1;i>=0;i--){const L=M.loot[i];L.t-=dt;const o=M.units.find(u=>u.id===L.owner);
    if(o&&!o.dead&&d2(o,L)<1.8){o.bag.push(L.item);fx(M,{t:'loot',g:o.id,r:L.item.r,n:L.item.name,x:r2(L.x),z:r2(L.z)});M.loot.splice(i,1)}
    else if(L.t<=0&&o){o.bag.push(L.item);M.loot.splice(i,1)}}
}

// ---------- step ----------
export function step(M,dt=TICK){
  if(M.state==='end')return;
  M.time+=dt;
  if(M.state==='countdown'){M.countdown-=dt;if(M.countdown<=0){M.state='play';
    if(M.D.mutators)fx(M,{t:'ban',ti:'Mutace týdne',sub:[...M.emod].map(k=>MUTATORS[k]?.name).join(' + '),col:'var(--gold)',d:3.5})}}
  else if(M.state==='play'){M.timeLeft-=dt;if(M.timeLeft<=0){endMatch(M,M.D.pvp?undefined:1);return}}
  for(let i=M.timers.length-1;i>=0;i--){const T=M.timers[i];T.t-=dt;if(T.t<=0){M.timers.splice(i,1);T.fn()}}
  M.danger=M.danger.filter(g=>g.until>M.time);
  for(const u of M.units){
    if(u.dead){if(u.kind==='hero'){u.respawn-=dt;if(u.respawn<=0&&M.state!=='end'){resetUnit(u,M);fx(M,{t:'spawn',x:r2(u.x),z:r2(u.z),g:u.id})}}continue}
    updStatus(M,u,dt);if(u.dead)continue;
    if(u.ctrl==='bot')botUpdate(M,u,dt);else if(u.ctrl==='human')humanUpdate(M,u,dt);else if(u.ctrl==='npc')npcUpdate(M,u,dt);else bossUpdate(M,u,dt);
  }
  separate(M);if(M.map.portals)updPortals(M,dt);recordHist(M);updProjs(M,dt);updZones(M,dt);updRings(M,dt);updBeams(M,dt);updRelic(M,dt);updLoot(M,dt);
  if(M.mode==='control')updPoints(M,dt);
  if(M.flags)updFlags(M,dt);
  if(M.elim)updElim(M,dt);
  if(M.D.waves)updWaves(M,dt);
  if(M.units.some(u=>u.remove)){M.units=M.units.filter(u=>!u.remove);M.rosterVer++}
}

// ---------- network views ----------
export function roster(M){return M.units.map(u=>({i:u.id,n:u.name,k:u.key,kind:u.kind[0],t:u.team,mh:u.maxHp,b:u.ctrl==='human'?0:1,sk:u.skin,lv:u.level}))}
export function stats(M){return M.units.filter(u=>u.kind==='hero').map(u=>({i:u.id,n:u.name,k:u.clsKey,t:u.team,b:u.ctrl==='bot'?1:0,ki:u.kills,de:u.deaths,dm:Math.round(u.dmgDealt),he:Math.round(u.healDone),re:u.relics,nk:u.npcKills,tk:Math.round(u.dmgTaken||0),cp:u.caps||0,nd:Math.round(u.naniteDmg||0),bs:u.bestStreak|0,bm:u.bestMulti|0}))}
export function matchInfo(M){return{mode:M.mode,map:M.mapKey,boss:M.bossKey,diff:M.diffKey,mission:M.mission,mods:[...M.emod],last:M.last,win:M.D.win||0,custom:M.custom}}
function flags(u){const s=u.st;return (s.stun>0?1:0)|(s.silence>0?2:0)|(s.bleed?4:0)|(s.slow>0?8:0)|(s.relic>0?16:0)|(s.cloak>0?32:0)|(s.inv>0?64:0)|(u.dash?128:0)|(u.invuln?256:0)|(u.air?512:0)|(u.bomb?1024:0)|(s.nanite?2048:0)|(s.decon>0?4096:0)|(s.marked>0?8192:0)|(s.burn?16384:0)|(s.poison?32768:0)|(s.shock?65536:0)}
// Per-viewer snapshot: hides cloaked enemies far from the viewer and loot that belongs to someone else.
export function snapshotFor(M,uid,events){
  const me=M.units.find(u=>u.id===uid);
  // team pings are seen only by that team
  if(events?.some(e=>e.team!=null))events=events.filter(e=>e.team==null||(me&&e.team===me.team));
  const vis=u=>!me||u.team===me.team||u.st.cloak<=0||(!me.dead&&d2(u,me)<3.5);
  const boss=M.units.find(u=>u.kind==='boss');
  return{type:'s',t:r2(M.time),st:M.state,cd:r2(M.countdown),tl:Math.ceil(M.timeLeft),sc:M.score,
    rl:[M.relic.state==='up'?1:0,Math.ceil(M.relic.t)],
    pt:M.points.map(p=>[p.own,Math.round(p.prog)]),lv:M.lives,
    fg:M.flags?M.flags.map(f=>[{home:0,carried:1,dropped:2}[f.state],r2(f.x),r2(f.z),f.carrier,Math.ceil(f.t)]):null,
    el:M.elim?[M.elim.n,M.elim.state==='pause'?Math.ceil(M.elim.t):0,r2(M.elim.r),heroesOf(M,0).length,heroesOf(M,1).length,Math.max(0,Math.ceil(M.elim.t0+ELIM.shrinkAt-M.time))]:null,
    wv:M.D.waves?[M.wave,M.waveState==='break'?Math.ceil(M.waveT):0,M.units.filter(u=>u.team===1).length]:null,
    bs:boss?[boss.id,Math.ceil(boss.hp),boss.maxHp,Math.round(boss.shield),boss.invuln?1:0,boss.ai.fortT>0?Math.ceil(boss.ai.fortT):0]:null,
    u:M.units.map(u=>u.dead?{i:u.id,d:Math.ceil(u.respawn)}:vis(u)?{i:u.id,x:r2(u.x),z:r2(u.z),vx:r2(u.vx),vz:r2(u.vz),f:r2(u.face),h:Math.ceil(u.hp),s:Math.round(u.shield),fl:flags(u)}:{i:u.id,hid:1}),
    p:M.projs.map(p=>[p.id,r2(p.x),r2(p.z),r2(p.vx),r2(p.vz),p.color,p.size]),
    zn:M.zones.map(z=>[z.id,r2(z.x),r2(z.z),z.r,r2(z.t),z.team,z.color]),
    bm:M.beams.map(b=>[b.id,r2(b.x),r2(b.z),r2(b.a),b.len,b.warm>0?1:0]),
    rg:M.rings.map(g=>[g.id,r2(g.x),r2(g.z),r2(g.r),g.color]),
    lt:M.loot.filter(L=>L.owner===uid).map(L=>[L.id,r2(L.x),r2(L.z),L.item.r]),
    me:me?{i:me.id,e:Math.floor(me.energy),u:Math.floor(me.ult),c:me.cds.map(c=>Math.round(c*10)/10),am:me.ambush>0?1:0,rt:Math.ceil(me.st.relic),q:me.lastSeq,
      x:me.x,z:me.z,vx:me.vx,vz:me.vz,ss:[me.st.slow,me.st.stun,me.st.cloak],spd:r2(speedOf(me)),bag:me.bag.length,sk:me.prof.skills,dr:me.drive?.n||0,tc:[me.tactic,Math.round(me.tcd*10)/10],ev:Math.round((me.ecd||0)*10)/10,nn:me.st.nanite?me.st.nanite.hits:0}:null,
    ev:events.filter(e=>!(e.g&&me&&e.t!=='death'&&e.t!=='spawn'&&e.t!=='loot'&&!vis(M.units.find(u=>u.id===e.g)||me))&&!(e.t==='loot'&&e.g!==uid)&&!(e.only&&e.only!==uid))};
}
