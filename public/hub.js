// Relikvie Aréna — hub: sign-in, character, inventory, skill tree, market, shop, leaderboard and match rewards.
import * as D from './data.js';
import * as Social from './social.js';

const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICONS={
  slash:'<path d="M6 26 22 6M12 28 28 10"/>',eye:'<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16Z"/><circle cx="16" cy="16" r="3.5"/><path d="M5 27 27 5"/>',
  arrow:'<path d="M5 27 25 7M17 6h9v9M5 22l5 5M9 19l4 4"/>',bolt:'<path d="m18 3-10 15h7l-2 11 11-16h-7Z"/>',
  anchor:'<path d="M16 6v21M10 11h12M6 18c0 6 5 9 10 9s10-3 10-9"/><circle cx="16" cy="5" r="2"/>',charge:'<path d="M4 16h18M15 8l9 8-9 8M4 10v12"/>',
  dome:'<path d="M4 24a12 12 0 0 1 24 0Z M10 24a6 6 0 0 1 12 0"/>',slam:'<path d="M16 3v14M10 11l6 6 6-6M3 26h26M7 21l-3 5M25 21l3 5"/>',
  nano:'<circle cx="9" cy="10" r="2"/><circle cx="21" cy="8" r="2"/><circle cx="15" cy="17" r="2"/><circle cx="8" cy="23" r="2"/><circle cx="23" cy="22" r="2"/><circle cx="16" cy="16" r="12"/>',
  heal:'<path d="M12 5h8v7h7v8h-7v7h-8v-7H5v-8h7Z"/>',emp:'<circle cx="16" cy="16" r="3"/><path d="M9 9a10 10 0 0 0 0 14M23 9a10 10 0 0 1 0 14M5 5a16 16 0 0 0 0 22M27 5a16 16 0 0 1 0 22"/>',
  chain:'<path d="M4 6l8 7-5 4 9 9M16 26l4-7 8 3"/>',
  double:'<path d="M5 7l12 12M27 7 15 19M9 25l3-3M23 25l-3-3"/><circle cx="16" cy="20" r="2"/>',
  dodge:'<path d="M4 22c6 0 8-12 16-12M16 6l5 4-5 4"/><path d="M4 27h10" stroke-dasharray="2 3"/>',
  decon:'<path d="M16 4 6 8v8c0 6 4 10 10 12 6-2 10-6 10-12V8Z"/><path d="M11 16h10M16 11v10"/>',
  beacon:'<circle cx="16" cy="13" r="3"/><path d="M10 7a8 8 0 0 0 0 12M22 7a8 8 0 0 1 0 12M16 16v12M11 28h10"/>',
  cleave:'<path d="M5 22a14 14 0 0 1 22 0M8 26l18-16M16 6v6"/>',rend:'<path d="M6 26 26 6M10 8l2 6M18 18l2 6M22 10l4 2"/><circle cx="9" cy="24" r="2"/>',
  drive:'<path d="M4 16h20M18 9l7 7-7 7M4 10l6 6-6 6"/>',ambush:'<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6"/>',
  feint:'<path d="M9 6c-4 4-4 16 0 20M23 6c4 4 4 16 0 20M16 8v16" stroke-dasharray="3 3"/>',scatter:'<path d="M5 27 16 16M16 16l12-4M16 16l10 8M16 16l6-12M16 16 4 9"/>',
  arcs:'<path d="M4 20l6-8 5 7 5-9 4 6 4-4"/>',leak:'<path d="M16 4c-4 6-8 10-8 15a8 8 0 0 0 16 0c0-5-4-9-8-15Z M12 20h8"/>',
  pulse:'<circle cx="16" cy="16" r="4"/><circle cx="16" cy="16" r="9"/><circle cx="16" cy="16" r="14" stroke-dasharray="4 3"/>',
  bulwark:'<path d="M6 8h20v8c0 6-5 10-10 12-5-2-10-6-10-12Z M11 14h10M11 19h10"/>',patch:'<path d="M8 12l12 12M12 8l12 12M6 18l8 8M18 6l8 8"/>',
  intercept:'<path d="M4 24 14 14M14 14h-6M14 14v6"/><path d="M18 6h8v8l-4 6h-8v-8Z"/>',
  striker:'<path d="M6 27 25 8M15 8h10v10M9 7l4 5M24 23l4 4"/>',guardian:'<path d="M7 6h18v12l-9 9-9-9Z M11 12h10M16 12v11"/>',technician:'<rect x="9" y="9" width="14" height="14" rx="2"/><path d="M13 4v5M19 4v5M13 23v5M19 23v5M4 13h5M4 19h5M23 13h5M23 19h5"/>'
};
export const svg=k=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const num=n=>Math.round(n).toLocaleString('cs-CZ');
const store={get(k,d){try{const v=localStorage.getItem('rel.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rel.'+k,JSON.stringify(v))}catch{}}};

export const H={token:store.get('token',null),profile:null,guest:false,offline:false,tab:'play',cb:null,
  cls:store.get('cls','striker'),play:store.get('play',{mode:'arena',map:'core',boss:'collector',diff:'normal'}),guestName:store.get('nick',''),
  inv:{slot:'',minR:0,sel:null},tree:{cls:null,draft:null},mk:{slot:'',r:'',sort:'price',mine:false,list:null},top:null};
if(!D.CLASSES[H.cls])H.cls='striker';
if(!H.play||typeof H.play!=='object')H.play={mode:'arena',map:'core',boss:'collector',diff:'normal'};

async function api(path,body){
  const r=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(H.token?{Authorization:'Bearer '+H.token}:{})},body:body?JSON.stringify(body):undefined});
  let j={};try{j=await r.json()}catch{}
  if(!r.ok){if(r.status===401&&H.token&&!path.includes('/login')){Social.disconnect();H.token=null;store.set('token',null);H.profile=null;showAuth()}throw new Error(j.error||'Chyba serveru.')}
  return j;
}
async function act(name,body,okMsg){
  try{const j=await api('/api/act/'+name,body);H.profile=j.profile;if(okMsg)toast(typeof okMsg==='function'?okMsg(j):okMsg);renderHub();return j}
  catch(e){toast(e.message,true);return null}
}
let toastT;
export function toast(msg,bad){const t=$('#toast');t.textContent=msg;t.className=bad?'bad':'';t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3500)}
export const token=()=>H.token;
export const playerClass=()=>H.cls;
export const isOffline=()=>H.offline;
export function setProfile(p){if(p){H.profile=p;H.cls=p.cls||H.cls}}

export async function init(cb){
  H.cb=cb;
  try{const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok)throw 0;await r.json()}catch{H.offline=true}
  if(!H.offline&&H.token){try{H.profile=(await api('/api/me')).profile;H.cls=H.profile.cls;return showHub()}catch{}}
  showAuth();
}

// ---------- sign-in ----------
let authMode='login';
export function showAuth(){
  H.cb.showOnly('auth');
  const b=$('#authBody');
  if(H.offline){
    b.innerHTML=`<div class="authbox"><b>Server není dostupný</b><p class="help">Účty, inventář, tržiště a online hra fungují, jen když stránku otevřeš ze spuštěného serveru Relikvie Aréna. Bez něj si můžeš zahrát trénink proti botům ve všech režimech, postup se ale neukládá.</p>
      <div><button class="go" id="offBtn" type="button">Trénink proti botům</button></div></div>`;
    $('#offBtn').onclick=()=>{H.guest=true;showHub()};return;
  }
  const reg=authMode==='register';
  b.innerHTML=`<form class="authbox" id="authForm">
      <div class="seg" role="tablist"><button type="button" data-m="login" aria-pressed="${!reg}">Přihlásit</button><button type="button" data-m="register" aria-pressed="${reg}">Nový účet</button></div>
      <label class="field">Přezdívka<input id="aNick" maxlength="16" autocomplete="username" required value="${esc(H.guestName)}"></label>
      <label class="field">Heslo<input id="aPass" type="password" maxlength="100" autocomplete="${reg?'new-password':'current-password'}" required></label>
      ${reg?'<label class="field">Heslo znovu<input id="aPass2" type="password" maxlength="100" autocomplete="new-password" required></label>':''}
      <div class="btns"><button class="go" type="submit">${reg?'Založit účet':'Přihlásit'}</button></div>
      <div class="err" id="authErr" role="status"></div>
      <p class="help">${reg?'Heslo má alespoň 8 znaků. Server ukládá jen jeho otisk, ne heslo samotné.':'Účet drží tvou úroveň, implantáty, strom dovedností a kredity.'}</p>
    </form>
    <div class="authbox"><b>Bez účtu</b><p class="help">Jako host můžeš hrát online i proti botům, ale nezískáš zkušenosti ani kořist.</p>
      <div><button class="ghost" id="guestBtn" type="button">Hrát jako host</button></div></div>`;
  b.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{authMode=x.dataset.m;showAuth()});
  $('#guestBtn').onclick=()=>{H.guest=true;H.guestName=$('#aNick').value.trim()||H.guestName;showHub()};
  $('#authForm').onsubmit=async e=>{
    e.preventDefault();const nick=$('#aNick').value.trim(),pass=$('#aPass').value;
    if(reg&&pass!==$('#aPass2').value){$('#authErr').textContent='Hesla se neshodují.';return}
    try{const j=await api('/api/'+(reg?'register':'login'),{nick,pass});H.token=j.token;store.set('token',j.token);store.set('nick',nick);H.profile=j.profile;H.cls=j.profile.cls;H.guest=false;H.tab='play';showHub();
      if(reg)toast('Účet založen. Dostal jsi tři startovní implantáty a 200 kreditů.')}
    catch(err){$('#authErr').textContent=err.message}
  };
}
async function logout(){Social.disconnect();try{await api('/api/logout',{})}catch{}H.token=null;store.set('token',null);H.profile=null;H.guest=false;showAuth()}

// ---------- hub frame ----------
const TABS=[['play','Hrát'],['campaign','Kampaň'],['goals','Cíle'],['hero','Postava'],['prof','Profese'],['tree','Dovednosti'],['inv','Inventář'],['market','Tržiště'],['shop','Obchod'],['friends','Přátelé'],['stats','Statistiky'],['top','Žebříček']];
export function showHub(tab){if(tab)H.tab=tab;if(H.profile&&!H.offline)Social.connect(H.token);H.cb.showOnly('hub');renderHub()}
export function joinRoom(code){H.cb.join(code,{cls:H.cls,name:H.profile?H.profile.nick:H.guestName||'Host'})}
export function renderHub(){
  const p=H.profile;
  if(!p&&H.tab!=='play'&&H.tab!=='top')H.tab='play';
  $('#hubTop').innerHTML=p?`<div class="who"><div class="lvl">${p.level}</div><div><div class="nick">${esc(p.nick)}${p.title?` <small class="help" style="color:var(--gold)">◇ ${esc(p.title)}</small>`:''}</div>
      <div class="xpbar" title="${p.xpNext?`${num(p.xp)} / ${num(p.xpNext)} zkušeností`:'Maximální úroveň'}"><i style="width:${p.xpNext?Math.min(100,p.xp/p.xpNext*100):100}%"></i></div></div></div>
    <div class="btns"><div class="cred">${num(p.credits)} <small>KREDITŮ</small></div><button class="ghost sm" id="logoutBtn" type="button">Odhlásit</button></div>`
    :`<div class="who"><div class="nick">${H.offline?'Offline trénink':'Host'}</div><small class="help">${H.offline?'Postup se neukládá.':'Bez účtu se postup neukládá.'}</small></div>
    ${H.offline?'':'<button class="ghost sm" id="loginBtn" type="button">Přihlásit nebo založit účet</button>'}`;
  $('#logoutBtn')&&($('#logoutBtn').onclick=logout);
  $('#loginBtn')&&($('#loginBtn').onclick=()=>{H.guest=false;showAuth()});
  $('#hubNav').innerHTML=TABS.map(([k,n])=>{const off=!p&&k!=='play'&&!(k==='top'&&!H.offline);return`<button type="button" data-t="${k}" ${H.tab===k?'aria-current="page"':''} ${off?'disabled title="Jen s účtem"':''}>${n}${k==='friends'?navBadge():''}</button>`}).join('');
  $('#hubNav').querySelectorAll('button').forEach(b=>b.onclick=()=>{H.tab=b.dataset.t;renderHub()});
  if(H.tab!=='hero')H.cb.preview(null);
  ({play:tabPlay,campaign:tabCampaign,goals:tabGoals,hero:tabHero,prof:tabProf,inv:tabInv,tree:tabTree,market:tabMarket,shop:tabShop,friends:tabFriends,stats:tabStats,top:tabTop})[H.tab]();
}
const navBadge=()=>{const n=Social.pending();return n?` <b>${n}</b>`:''};
// friend list updates arrive every few seconds; only the list part is redrawn so a half-typed nick stays
Social.onChange(()=>{
  const b=document.querySelector('#hubNav [data-t="friends"]');if(b)b.innerHTML='Přátelé'+navBadge();
  if(H.tab==='friends'&&!$('#hub').hidden&&$('#frList'))friendList();
});
function setCls(k){H.cls=k;store.set('cls',k);if(H.profile&&H.profile.cls!==k)act('cls',{cls:k});else renderHub()}

// ---------- shared pieces ----------
function derived(k){
  const C=D.CLASSES[k],L=D.computeLoadout(H.profile,k),m=L.mods,g=x=>m[x]||0;
  return{L,rows:[['Zdraví',Math.round(C.hp*(1+g('hp')/100))+' HP'],['Útok',Math.round(C.atk*(1+g('atk')/100))],['TECH',Math.round(C.tech*(1+g('tech')/100))],
    ['Obrana',Math.round(Math.min(60,C.def*100+g('def')))+' %'],['Rychlost',(C.speed*(1+g('speed')/100)).toFixed(1)+' m/s'],
    ['Obnova energie',(9*(1+g('regen')/100)).toFixed(1)+' /s'],['Zkrácení čekání',Math.min(40,g('cdr')).toFixed(1)+' %']]};
}
function classDetail(k){
  const c=D.CLASSES[k],lab=['Výdrž','Útok','TECH','Rychlost'];
  const rows=H.profile?derived(k).rows.map(([a,b])=>`<div class="stat">${a}<b>${b}</b></div>`).join(''):c.bars.map((v,i)=>`<div class="stat">${lab[i]}<i style="--v:${v*100}%"></i></div>`).join('');
  return`<div class="detail" style="--c:${c.css}"><div class="stats">${rows}<p class="talent"><b>${c.talent}.</b> ${c.talentDesc}<br><b>Relikvie.</b> ${c.relic}</p></div>
    <div class="skl"><div class="sk"><kbd>LMB</kbd><div><b>${c.basic.name}</b>${c.basic.type==='melee'?'Úder na blízko do oblouku.':'Rychlá střela na dálku.'}</div></div>
    ${c.skills.map((s,i)=>`<div class="sk"><kbd>${'QER'[i]}</kbd><div><b>${s.name}</b>${s.desc} <small>${s.cost} en · ${s.cd} s</small></div></div>`).join('')}
    <div class="sk"><kbd class="u">F</kbd><div><b>${c.ult.name}</b>${c.ult.desc}</div></div></div></div>`;
}
const classCards=()=>`<div class="classes">${Object.entries(D.CLASSES).map(([k,c])=>`<button type="button" class="cc" data-k="${k}" style="--c:${c.css}" aria-pressed="${k===H.cls}">${svg(k)}<b>${c.name}</b><small>${c.role}</small></button>`).join('')}</div>`;
const bindClassCards=()=>document.querySelectorAll('#hubBody .cc').forEach(b=>b.onclick=()=>setCls(b.dataset.k));
export function itemCard(it,o={}){
  if(!it)return`<div class="item empty"><b>${o.slot?D.SLOTS[o.slot].name:'Prázdné'}</b><small>Prázdný slot</small></div>`;
  return`<button type="button" class="item r${it.r}" data-id="${it.id}" aria-pressed="${!!o.sel}">${o.eq?'<span class="eqd">VYBAVENO</span>':''}<b>${esc(it.name)}</b><small>${D.RARITIES[it.r].name} · ${D.SLOTS[it.slot].name} · úr. ${it.lvl}</small></button>`;
}
const affixes=it=>it.aff.map(a=>D.fmtStat(a.k,a.v)).join(' · ');
const isEq=it=>H.profile&&Object.values(H.profile.eq).includes(it.id);

// ---------- Hrát ----------
function tabPlay(){
  // settings come from localStorage and may be from an older version or damaged
  const P=H.play;if(!D.MODES[P.mode])P.mode='arena';if(!D.BOSSES[P.boss])P.boss='collector';if(!D.DIFF_REWARD[P.diff])P.diff='normal';
  const M=D.MODES[P.mode];if(!M.maps.includes(P.map))P.map=M.maps[0];
  $('#hubBody').innerHTML=`
    <section class="panel"><h3>Povolání</h3>${classCards()}${classDetail(H.cls)}</section>
    <section class="panel"><h3>Režim</h3>
      <div class="modes">${Object.entries(D.MODES).map(([k,m])=>`<button type="button" class="mc" data-mode="${k}" aria-pressed="${k===P.mode}"><span class="tag">${m.pvp?`PVP · ${m.team||3} PROTI ${m.team||3}`:'KOOPERACE · AŽ 4'}</span><b>${m.name}</b><small>${m.desc}</small></button>`).join('')}</div>
      <div><div class="lbl">Mapa</div><div class="chips">${M.maps.map(k=>`<button type="button" class="chip" data-map="${k}" aria-pressed="${k===P.map}">${D.MAPS[k].name}<small>${D.MAPS[k].desc}</small></button>`).join('')}</div></div>
      ${P.mode==='boss'?`<div><div class="lbl">Boss</div><div class="chips">${Object.entries(D.BOSSES).map(([k,b])=>`<button type="button" class="chip" data-boss="${k}" aria-pressed="${k===P.boss}">${b.name} · ${b.title}<small>${b.desc}</small></button>`).join('')}</div></div>`:''}
      <div><div class="lbl">Obtížnost</div><div class="seg" id="pDiff">${[['easy','Lehká'],['normal','Normální'],['hard','Těžká']].map(([k,n])=>`<button type="button" data-d="${k}" aria-pressed="${k===P.diff}">${n}</button>`).join('')}</div>
        <p class="help">${H.profile?'Těžší obtížnost dává víc zkušeností a kreditů (lehká ×0,6, těžká ×1,35).':''}</p></div>
      <div class="btns"><button class="go" id="soloBtn" type="button">${H.offline?'Spustit trénink':'Hrát s boty'}</button></div>
      ${H.offline?'':`<div class="lbl">Online s lidmi</div>
      <div class="inline">${H.profile?'':`<label class="field">Přezdívka hosta<input id="gNick" maxlength="16" value="${esc(H.guestName)}" placeholder="Např. Petan"></label>`}
        <button class="go" id="quickBtn" type="button">Rychlá hra · ${M.name}</button>
        <button class="go alt" id="createBtn" type="button">Založit místnost</button>
        <button type="button" class="chip" id="pubBtn" aria-pressed="${!!P.pub}">${P.pub?'Veřejná':'Soukromá'}<small>${P.pub?'Uvidí ji všichni v seznamu':'Jen přes kód'}</small></button>
        <label class="field">Kód místnosti<input id="roomCode" class="code" maxlength="4" autocomplete="off" placeholder="ABCD" value="${esc(new URLSearchParams(location.search).get('room')||'')}"></label>
        <button class="ghost" id="joinBtn" type="button">Připojit</button></div>
      <p class="help">Rychlá hra tě přidá do otevřené místnosti stejného režimu, nebo založí novou. Zápas začne do ${20} s, zbytek doplní boti.</p>`}
      <div class="err" id="netErr" role="status"></div>
    </section>
    ${rankedPanel()}
    ${H.offline?'':`<section class="panel"><div class="row"><h3>Veřejné místnosti <small class="help" id="onlineN"></small></h3><button class="ghost sm" id="roomsRef" type="button">Obnovit</button></div><div class="list" id="roomList"><p class="help">Načítám…</p></div></section>`}
    <p class="help" id="helpText">${H.cb.isTouch()?'Levým palcem pohyb, tlačítkem Útok střelba na nejbližšího soupeře. Schopnosti míří automaticky.':'<kbd>W A S D</kbd> pohyb · <kbd>myš</kbd> míření · <kbd>levé tlačítko</kbd> útok · <kbd>Q</kbd> <kbd>E</kbd> <kbd>R</kbd> schopnosti · <kbd>F</kbd> ultimátka · <kbd>Tab</kbd> skóre · <kbd>Esc</kbd> menu'}. Vlastní základna léčí a dobíjí energii.</p>`;
  bindClassCards();
  const save=()=>{store.set('play',P);tabPlay()};
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{P.mode=b.dataset.mode;save()});
  document.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{P.map=b.dataset.map;save()});
  document.querySelectorAll('[data-boss]').forEach(b=>b.onclick=()=>{P.boss=b.dataset.boss;save()});
  document.querySelectorAll('#pDiff button').forEach(b=>b.onclick=()=>{P.diff=b.dataset.d;save()});
  const opts=()=>({...P,cls:H.cls,name:H.profile?H.profile.nick:($('#gNick')?.value.trim()||H.guestName||'Host')});
  $('#soloBtn').onclick=()=>H.offline?H.cb.local(opts()):H.cb.solo(opts());
  if($('#createBtn')){
    const nameOk=()=>{if(H.profile)return true;const n=$('#gNick').value.trim();if(!n){$('#netErr').textContent='Zadej přezdívku hosta.';return false}H.guestName=n;store.set('nick',n);return true};
    $('#createBtn').onclick=()=>nameOk()&&H.cb.create(opts());
    $('#quickBtn').onclick=()=>nameOk()&&H.cb.quick(opts());
    $('#pubBtn').onclick=()=>{P.pub=!P.pub;save()};
    $('#joinBtn').onclick=()=>{const code=$('#roomCode').value.trim().toUpperCase();if(code.length!==4){$('#netErr').textContent='Kód místnosti má 4 písmena.';return}nameOk()&&H.cb.join(code,opts())};
    const loadRooms=async()=>{try{const j=await api('/api/rooms');if(H.tab!=='play'||!$('#roomList'))return;
      $('#onlineN').textContent=`· právě hraje ${j.online}`;
      $('#roomList').innerHTML=j.rooms.map(r=>`<div class="lrow"><div><b>${r.ranked?'Hodnocená · ':''}${D.MODES[r.mode]?.name||r.mode} · ${D.MAPS[r.map]?.name||''}${r.mode==='boss'?' · '+(D.BOSSES[r.boss]?.name||''):''}</b>
          <small>${r.code} · hostitel ${esc(r.host)} · ${r.state==='lobby'?(r.quick?'rychlá hra, brzy začne':'čeká v místnosti'):'zápas běží, nahradíš bota'}</small></div>
        <div class="price">${r.players}/${r.max}</div><button class="ghost sm" type="button" data-room="${r.code}" ${r.players>=r.max||r.ranked&&(r.state!=='lobby'||!H.profile)?'disabled':''}>Připojit</button></div>`).join('')||'<p class="help">Žádná veřejná místnost. Zkus Rychlou hru, nebo založ veřejnou místnost.</p>';
      document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>nameOk()&&H.cb.join(b.dataset.room,opts()))}
      catch(e){if($('#roomList'))$('#roomList').innerHTML=`<p class="err">${esc(e.message)}</p>`}};
    $('#roomsRef').onclick=loadRooms;loadRooms();
  }
  document.querySelectorAll('[data-ranked]').forEach(b=>b.onclick=()=>H.cb.ranked(b.dataset.ranked,opts()));
  $('#claimSeason')&&($('#claimSeason').onclick=()=>act('claimSeason',{},j=>`Odměna za sezónu: +${num(j.credits)} kreditů${j.item?' a implantát':''}${j.title?`, titul ${j.title}`:''}.`));
}
const divBadge=(r,sm)=>{const d=D.DIVISIONS[D.divisionOf(r)];return`<span class="rkb${sm?' sm':''}" style="--c:${d.color}">${d.name}</span>`};
const seasonRewardTxt=W=>`${num(W.credits)} kreditů${W.minR?` · implantát ${D.RARITIES[W.minR].name.toLowerCase()} nebo lepší`:''}${W.title?` · titul ${W.title}`:''}`;
// ranked: division, rating, season countdown, the two queues and a waiting season reward
function rankedPanel(){
  const p=H.profile;if(!p||H.offline||!p.ranked)return'';
  const R=p.ranked,di=D.divisionOf(R.rating),nx=D.DIVISIONS[di+1],placed=R.games>=D.PLACEMENT,P=p.rankedPrev;
  const days=Math.max(0,Math.ceil((D.seasonEnd(R.season)-Date.now())/864e5));
  return`<section class="panel"><div class="row"><h3>Hodnocená hra · sezóna ${D.seasonName(R.season)}</h3><small class="help">končí za ${days} ${days===1?'den':days>=2&&days<=4?'dny':'dní'}</small></div>
    ${P&&!P.claimed?`<div class="rew"><div class="lvup">Sezóna ${D.seasonName(P.season)} skončila</div><p class="help">Nejlepší divize: ${divBadge(D.DIVISIONS[P.div].min,true)} · odměna ${seasonRewardTxt(D.DIVISIONS[P.div].reward)}</p>
      <div class="btns"><button class="go sm" id="claimSeason" type="button">Vyzvednout odměnu</button></div></div>`:''}
    <div class="rank">${divBadge(R.rating)}<div><b>${placed?R.rating:`Umisťovací zápasy ${R.games} / ${D.PLACEMENT}`}</b>
      <small class="help">${placed?(nx?`${nx.min-R.rating} bodů do divize ${nx.name}`:'Nejvyšší divize'):`Zatím hodnocení ${R.rating}, v umisťovacích zápasech se mění rychleji`} · ${R.wins} výher · ${R.losses} proher · maximum ${R.peak}</small></div></div>
    <div class="btns"><button class="go" type="button" data-ranked="duel">Hodnocený souboj 1 proti 1</button><button class="go alt" type="button" data-ranked="arena">Hodnocená aréna 3 proti 3</button></div>
    <p class="help">Hraje se o hodnocení Elo. Hledání páruje hráče s podobným hodnocením a týmy se rozdělí vyrovnaně, chybějící místa doplní boti. Zápas se hodnotí, jen když na každé straně hraje aspoň jeden hráč s účtem. Kdo odejde před koncem, prohrává. Na konci měsíce dostaneš odměnu podle nejlepší dosažené divize a nová sezóna začne s polovičním odstupem od 1000.</p>
    <div class="divs">${D.DIVISIONS.map((d,i)=>`<span class="${i===di?'on':''}" style="--c:${d.color}">${d.name} ${d.min||''}${d.min?'+':''} · ${seasonRewardTxt(d.reward)}</span>`).join('')}</div>
  </section>`;
}
export function netError(msg){const e=$('#netErr');if(e)e.textContent=msg;const l=$('#lobbyErr');if(l)l.textContent=msg;if(msg&&!e&&!l)toast(msg,true)}

// ---------- Přátelé ----------
function tabFriends(){
  $('#hubBody').innerHTML=`<section class="panel"><h3>Přidat přítele</h3>
      <form class="inline" id="frAdd" autocomplete="off"><label class="field">Přezdívka hráče<input id="frNick" maxlength="16" placeholder="Přesná přezdívka"></label><button class="go" type="submit">Poslat žádost</button></form>
      <p class="help">Přátelé vidí, jestli jsi online a co hraješ, můžou se k tobě připojit do otevřené místnosti, pozvat tě do hry a psát ti soukromé zprávy. Hráče můžeš přidat i kliknutím na jeho jméno v chatu.</p></section>
    <div id="frList" class="grid2" style="align-items:start"></div>`;
  $('#frAdd').onsubmit=e=>{e.preventDefault();const n=$('#frNick').value.trim();if(!n)return;if(!Social.connected())return toast('Chat a přátelé se teprve připojují, zkus to za chvíli.',true);Social.fr('add',n);$('#frNick').value=''};
  friendList();
}
function friendList(){
  const F=Social.friends(),on=F.friends.filter(f=>f.st!=='offline').length;
  const row=(f,btns,sub)=>`<div class="fr"><i class="dot ${f.st||'offline'}"></i><span>${esc(f.nick)}${f.title?` <small style="display:inline;color:var(--gold)">◇ ${esc(f.title)}</small>`:''}<small>${sub}</small></span><div class="btns">${btns}</div></div>`;
  const info=f=>`úr. ${f.lv} · ${D.CLASSES[f.cls]?.name||''}`;
  const b=(k,id,n,cls='ghost sm')=>`<button type="button" class="${cls}" data-f="${k}" data-id="${esc(id)}">${n}</button>`;
  $('#frList').innerHTML=`<section class="panel"><div class="row"><h3>Přátelé · ${on} online</h3><small class="help">${F.friends.length} / ${D.FRIENDS_MAX}</small></div>
      ${Social.connected()?'':'<p class="help">Připojuji k serveru přátel…</p>'}
      <div class="flist">${F.friends.map(f=>row(f,`${f.code?b('join',f.code,'Připojit','go sm'):''}${b('dm',f.id,'Zpráva')}${b('remove',f.id,'Odebrat')}`,`${Social.statusText(f)} · ${info(f)}`)).join('')
        ||'<p class="help">Zatím nemáš žádné přátele. Pošli žádost přes přezdívku nahoře.</p>'}</div></section>
    <div style="display:grid;gap:22px">
    ${F.inReq.length?`<section class="panel"><h3>Žádosti o přátelství</h3><div class="flist">${F.inReq.map(f=>row(f,`${b('accept',f.id,'Přijmout','go sm')}${b('decline',f.id,'Odmítnout')}${b('block',f.id,'Blokovat')}`,info(f))).join('')}</div></section>`:''}
    ${F.outReq.length?`<section class="panel"><h3>Odeslané žádosti</h3><div class="flist">${F.outReq.map(f=>row(f,b('decline',f.id,'Zrušit'),'čeká na odpověď')).join('')}</div></section>`:''}
    ${F.blocked.length?`<section class="panel"><h3>Zablokovaní</h3><p class="help">Jejich zprávy ani žádosti nevidíš.</p><div class="flist">${F.blocked.map(f=>row(f,b('unblock',f.id,'Odblokovat'),'')).join('')}</div></section>`:''}
    </div>`;
  document.querySelectorAll('#frList [data-f]').forEach(x=>x.onclick=()=>{const k=x.dataset.f,id=x.dataset.id;
    if(k==='join')return joinRoom(id);
    if(k==='dm')return Social.openDM(id);
    // removing and blocking ask for a second click
    if((k==='remove'||k==='block')&&!x.dataset.sure){x.dataset.sure='1';x.textContent='Opravdu?';setTimeout(()=>{if(x.isConnected){delete x.dataset.sure;x.textContent=k==='remove'?'Odebrat':'Blokovat'}},3000);return}
    Social.fr(k,id)});
}

// ---------- Kampaň ----------
const modeLabel=m=>m.mode==='waves'?`Vlny · ${m.waves}${m.waveBoss?` · boss ${D.BOSSES[m.waveBoss].name}`:''}`:`Boss · ${D.BOSSES[m.boss].name}`;
function tabCampaign(){
  const p=H.profile,c=p.campaign,cv=Object.fromEntries(p.campaignView.map(x=>[x.id,x])),E=p.echo,P=H.play;
  const done=c.cleared.length;
  const play=(id)=>`<div class="btns"><button class="go sm" type="button" data-ms="${id}" data-solo="1">Hrát s boty</button><button class="ghost sm" type="button" data-ms="${id}">Založit místnost s přáteli</button></div>`;
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><h3>Kampaň relikvií · ${done} / ${D.MISSIONS.length}</h3>
      <div class="seg" id="cDiff">${[['easy','Lehká'],['normal','Normální'],['hard','Těžká']].map(([k,n])=>`<button type="button" data-d="${k}" aria-pressed="${k===P.diff}">${n}</button>`).join('')}</div></div>
      <p class="help">Mise se odemykají postupně a podle úrovně. První dokončení dává velkou odměnu a titul. Opakované výhry dávají střepy bosse: za ${D.SHARDS_FOR_PLAN} střepů vyrobíš legendární implantát. Hrát můžeš s boty nebo až se třemi přáteli.</p>
      <div class="lrow r2"><div><b>Týdenní cíl kampaně</b><small>${Math.min(c.weekWins,D.WEEKLY_CAMPAIGN_WINS)} / ${D.WEEKLY_CAMPAIGN_WINS} výher v misích nebo Ozvěně · odměna 400 kreditů a vzácný implantát</small></div>
        <div class="price">${Math.min(c.weekWins,D.WEEKLY_CAMPAIGN_WINS)}/${D.WEEKLY_CAMPAIGN_WINS}</div>${c.weekClaimed?'<small class="help">Vyzvednuto</small>':`<button class="go sm" type="button" id="cWeek" ${c.weekWins<D.WEEKLY_CAMPAIGN_WINS?'disabled':''}>Vyzvednout</button>`}</div></section>
    <div class="list">${D.MISSIONS.map((m,i)=>{const st=cv[m.id],key=m.boss||m.waveBoss,sh=key?c.shards[key]|0:0,r=m.reward;
      return`${!i||(m.act||1)!==(D.MISSIONS[i-1].act||1)?`<h2 class="sec">${D.ACTS[m.act||1]}</h2>`:''}<section class="panel" style="${st.open?'':'opacity:.6'}"><div class="row"><h3>${String(i+1).padStart(2,'0')} · ${m.name}</h3><span class="help">${st.cleared?'<b style="color:var(--green)">Dokončeno</b>':st.open?'<b style="color:var(--gold)">Odemčeno</b>':`Zamčeno · úroveň ${m.level}${i?` a mise ${D.MISSIONS[i-1].name}`:''}`}</span></div>
        <p class="help">${m.desc}</p><p class="help">${modeLabel(m)} · ${D.MAPS[m.map].name}</p>
        <p class="help">${st.cleared?(key?`Střepy ${D.BOSSES[key].name}: <b>${sh} / ${D.SHARDS_FOR_PLAN}</b> (+${D.SHARDS_PER_WIN} za výhru)`:'Opakování dává běžné odměny.'):`Odměna za první dokončení: ${num(r.xp)} zkušeností, ${num(r.credits)} kreditů, implantát ${D.RARITIES[r.minR].name.toLowerCase()} nebo lepší, titul „${r.title}“${r.skin?' a relikviový vzhled povolání, se kterým misi dokončíš':''}.`}</p>
        ${st.open?play(m.id):''}${key&&sh>=D.SHARDS_FOR_PLAN?`<button class="go alt sm" type="button" data-craft="${key}">Vyrobit plán ${D.BOSSES[key].name}</button>`:''}</section>`}).join('')}
      <section class="panel" style="${p.echoOpen?'':'opacity:.6'}"><div class="row"><h3>Ozvěna jádra · týdenní výzva</h3><span class="help">${p.echoOpen?(c.echoWon?'<b style="color:var(--green)">Tento týden pokořeno</b>':'<b style="color:var(--gold)">Otevřeno</b>'):'Odemkne se po misi Omega'}</span></div>
        <p class="help">Tento týden: ${D.BOSSES[E.boss].name} na mapě ${D.MAPS[E.map].name}. Modifikátory: ${E.mods.map(k=>`<b>${D.ECHO_MODS[k].name}</b> (${D.ECHO_MODS[k].desc.toLowerCase()})`).join(', ')}.</p>
        <p class="help">První výhra v týdnu: 600 zkušeností a epický implantát. Výzva se mění každé pondělí.</p>${p.echoOpen?play('echo'):''}</section></div>`;
  document.querySelectorAll('#cDiff button').forEach(b=>b.onclick=()=>{P.diff=b.dataset.d;store.set('play',P);tabCampaign()});
  document.querySelectorAll('[data-ms]').forEach(b=>b.onclick=()=>H.cb.mission(b.dataset.ms,{solo:!!b.dataset.solo,diff:P.diff,cls:H.cls,name:p.nick}));
  document.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>act('craftPlan',{boss:b.dataset.craft},j=>`Vyroben: ${j.item.name}.`));
  $('#cWeek')&&($('#cWeek').onclick=()=>act('claimWeekly',{},j=>`+${j.credits} kreditů a ${j.item.name}.`));
}

// ---------- Cíle ----------
function tabGoals(){
  const p=H.profile,G=p.goals;
  const card=(g,def,weekly)=>{const pr=Math.min(g.prog,def.target),ok=pr>=def.target;
    return`<div class="lrow ${g.claimed?'r0':ok?'r4':'r2'}"><div><b>${def.name}</b><small>${num(pr)} / ${num(def.target)} · ${num(def.xp)} zkušeností, ${num(def.cr)} kreditů${weekly?' a epický implantát':''}</small>
      <div class="xpbar" style="width:100%"><i style="width:${pr/def.target*100}%"></i></div></div>
      ${g.claimed?'<small class="help">Vyzvednuto</small>':`<button class="go sm" type="button" data-claim="${weekly?'weekly':g.id}" ${ok?'':'disabled'}>Vyzvednout</button>`}
      ${!weekly&&!g.claimed&&!G.rerolled?`<button class="ghost sm" type="button" data-reroll="${g.id}">Vyměnit</button>`:'<span></span>'}</div>`};
  $('#hubBody').innerHTML=`<section class="panel"><h3>Denní cíle</h3><p class="help">Nové cíle každý den o půlnoci (Praha). Jeden cíl denně můžeš vyměnit. Za vyzvednutí všech tří získáš navíc ${D.DAILY_BONUS.xp} zkušeností, ${D.DAILY_BONUS.cr} kreditů a implantát.${G.bonus?' <b style="color:var(--green)">Bonus za dnešek vyzvednut.</b>':''}</p>
      <div class="list">${G.list.map(g=>card(g,D.GOALS[g.id])).join('')}</div></section>
    <section class="panel"><h3>Týdenní cíl</h3><p class="help">Mění se každé pondělí.</p><div class="list">${G.weekly?card(G.weekly,D.WEEKLY_GOALS[G.weekly.id],true):''}</div></section>`;
  document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>act('claimGoal',{id:b.dataset.claim},j=>`+${num(j.xp)} zkušeností, +${num(j.credits)} kreditů${j.item?`, ${j.item.name}`:''}${j.levelUps.length?` · úroveň ${j.levelUps.at(-1)}!`:''}`));
  document.querySelectorAll('[data-reroll]').forEach(b=>b.onclick=()=>act('rerollGoal',{id:b.dataset.reroll},'Cíl vyměněn.'));
}

// ---------- Profese ----------
function tabProf(){
  const p=H.profile,L=D.PROF_LV,lv=p.level;
  const norm=x=>JSON.stringify(Object.fromEntries(Object.entries({...x,slots:x.slots||{}}).filter(([,v])=>v!=null&&v!==false).sort()));
  if(!H.pd||H.pd.key!==JSON.stringify(p.prof))H.pd={key:JSON.stringify(p.prof),base:norm(p.prof||{}),d:JSON.parse(JSON.stringify(p.prof||{}))};
  const d=H.pd.d;d.slots??={};
  const dirty=norm(d)!==H.pd.base,S=d.main?D.SCHOOLS[d.main]:null,k=H.cls;
  const gate=(need,body,title)=>`<section class="panel" style="${lv>=need?'':'opacity:.55'}"><div class="row"><h3>${title}</h3><span class="help">úroveň ${need}${lv>=need?'':' · zamčeno'}</span></div>${lv>=need?body:''}</section>`;
  const chips=(name,items,cur,dis)=>`<div class="chips">${items.map(([id,t,s])=>`<button type="button" class="chip" data-f="${name}" data-v="${id}" aria-pressed="${cur===id}" ${dis?'disabled':''}>${t}<small>${s}</small></button>`).join('')}</div>`;
  const passList=S?Object.entries(D.PASSIVES).filter(([,x])=>x.school===d.main):[];
  const pass=(f,other)=>S?chips(f,passList.filter(([id])=>!other.includes(id)).map(([id,x])=>[id,x.name,x.desc]),d[f]):'<p class="help">Nejdřív zvol hlavní profesi.</p>';
  const avail=D.availableSkills({level:lv,prof:d},k),cur=d.slots[k]||['c0','c1','c2'];
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><h3>Profese</h3><div class="btns"><button class="go" id="pSave" type="button" ${dirty?'':'disabled'}>Uložit profesi</button><button class="ghost" id="pUndo" type="button" ${dirty?'':'disabled'}>Zahodit změny</button></div></div>
      <p class="help">Profese platí pro všechna povolání. Odemyká nové schopnosti do slotů Q, E a R, pasivky a úpravy. Změny jsou zdarma mimo zápas.</p>
      ${lv<L.main?`<p class="help">Profesi zvolíš od úrovně ${L.main}. Tvoje úroveň je ${lv}.</p>`:''}</section>
    ${gate(L.main,`<div class="modes">${Object.entries(D.SCHOOLS).map(([id,s])=>`<button type="button" class="mc" data-main="${id}" aria-pressed="${d.main===id}"><span class="tag" style="color:${s.color}">PROFESE</span><b>${s.name}</b><small>${s.desc}</small><small>${s.skills.map(x=>D.PROF_SKILLS[x].name).join(' · ')}</small></button>`).join('')}</div>`,'Hlavní profese')}
    ${gate(L.main,pass('p1',[d.p2,d.p3]),'Talent profese')}
    ${gate(L.skills,S?`<div class="skl">${S.skills.map(id=>{const s=D.PROF_SKILLS[id];return`<div class="sk"><kbd>${svg(s.icon)}</kbd><div><b>${s.name}</b>${s.desc} <small>${s.cost} en · ${s.cd} s</small></div></div>`}).join('')}</div>
      <div class="lbl">Větev schopnosti · +15 % síly a −15 % čekání</div>${chips('branch',S.skills.map(id=>[id,D.PROF_SKILLS[id].name,'Posílit tuto schopnost']),d.branch)}`:'<p class="help">Nejdřív zvol hlavní profesi.</p>','Schopnosti profese a větev')}
    ${gate(L.pass2,pass('p2',[d.p1,d.p3]),'Druhá pasivka')}
    ${gate(L.second,`<p class="help">Jedna schopnost jiné profese, kterou si můžeš dát do slotu.</p>${chips('second',Object.entries(D.SCHOOLS).filter(([id])=>id!==d.main).map(([id,s])=>[id,s.name,s.desc]),d.second)}
      ${d.second&&D.SCHOOLS[d.second]?chips('secondSkill',D.SCHOOLS[d.second].skills.map(id=>[id,D.PROF_SKILLS[id].name,D.PROF_SKILLS[id].desc]),d.secondSkill):''}`,'Vedlejší profese')}
    ${gate(L.mod,S?`<p class="help">Jeden aktivní protokol mění, jak funguje jedna schopnost hlavní profese. Platí, jen když ji máš ve slotu. Každá schopnost má dva protokoly.</p>
      <div class="chips">${S.skills.flatMap(id=>['a','b'].map(v=>{const P=v==='a'?D.PROF_SKILLS[id].mod:D.PROF_SKILLS[id].proto,on=d.mod===id&&(d.proto==='b'?'b':'a')===v;
        return`<button type="button" class="chip" data-pr="${id}|${v}" aria-pressed="${on}">${P.name} · ${D.PROF_SKILLS[id].name}<small>${P.desc}</small></button>`})).join('')}</div>`:'','Protokoly')}
    ${gate(L.pass3,pass('p3',[d.p1,d.p2]),'Třetí pasivka')}
    ${gate(L.ult,`<div class="chips"><button type="button" class="chip" id="pUlt" aria-pressed="${!!d.ultMod}">${d.ultMod?'Zapnuto':'Vypnuto'}<small>Platí pro ultimátku povolání, které hraješ.</small></button></div>
      <div class="skl">${Object.entries(D.ULT_MODS).map(([c,u])=>`<div class="sk"><kbd>F</kbd><div><b>${D.CLASSES[c].name}: ${u.name}</b>${u.desc}</div></div>`).join('')}</div>`,'Úprava ultimátky')}
    ${gate(L.cap,S?`<p class="talent" style="--c:${S.color}"><b>${S.cap.name}.</b> ${S.cap.desc}</p>`:'','Vrchol profese')}
    <section class="panel"><div class="row"><h3>Sloty schopností</h3><div class="seg" id="pCls">${D.CLASS_KEYS.map(c=>`<button type="button" data-k="${c}" aria-pressed="${c===k}">${D.CLASSES[c].name}</button>`).join('')}</div></div>
      <p class="help">Vyber tři různé schopnosti pro klávesy Q, E a R. Ultimátka na F zůstává.</p>
      <div class="inline">${[0,1,2].map(i=>`<label class="field">${'QER'[i]}<select data-slot="${i}">${avail.map(id=>`<option value="${id}" ${cur[i]===id?'selected':''}>${D.skillDef(k,id).name}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="err" id="pErr"></div></section>`;
  const re=()=>tabProf();
  document.querySelectorAll('[data-main]').forEach(b=>b.onclick=()=>{if(d.main===b.dataset.main)return;const old=d.main?D.SCHOOLS[d.main].skills:[];
    Object.assign(d,{main:b.dataset.main,p1:null,p2:null,p3:null,branch:null,mod:null,proto:null});if(d.second===d.main){d.second=null;d.secondSkill=null}
    for(const c of Object.keys(d.slots))if(d.slots[c].some(x=>old.includes(x)))delete d.slots[c];re()});
  document.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>{const [id,v]=b.dataset.pr.split('|');if(d.mod===id&&(d.proto==='b'?'b':'a')===v){d.mod=null;d.proto=null}else{d.mod=id;d.proto=v==='b'?'b':null}re()});
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const f=b.dataset.f;d[f]=d[f]===b.dataset.v?null:b.dataset.v;if(f==='second')d.secondSkill=null;re()});
  $('#pUlt')&&($('#pUlt').onclick=()=>{d.ultMod=!d.ultMod;re()});
  document.querySelectorAll('#pCls button').forEach(b=>b.onclick=()=>{H.cls=b.dataset.k;store.set('cls',H.cls);re()});
  document.querySelectorAll('[data-slot]').forEach(s=>s.onchange=()=>{const a=[...cur];a[+s.dataset.slot]=s.value;d.slots[k]=a;re()});
  $('#pUndo').onclick=()=>{H.pd=null;re()};
  $('#pSave').onclick=()=>{
    for(const [c,s] of Object.entries(d.slots))if(new Set(s).size!==3){$('#pErr').textContent=`${D.CLASSES[c].name}: každý slot musí mít jinou schopnost.`;return}
    const body={...d};for(const x of Object.keys(body))if(body[x]==null)delete body[x];
    act('prof',body,'Profese uložena.').then(j=>{if(j)H.pd=null;renderHub()});
  };
}

// ---------- Postava ----------
function tabHero(){
  const p=H.profile,k=H.cls,d=derived(k),cur=p.skin?.[k]||'default',st=p.stats;
  const mods=Object.entries(d.L.mods).filter(([x])=>D.STATS[x]).map(([x,v])=>`<span>${D.fmtStat(x,v)}</span>`).join('')||'<span>Žádné bonusy</span>';
  const uniq=d.L.uniq.map(u=>`<p class="talent"><b style="color:var(--gold)">${D.UNIQUES[u].name}.</b> ${D.UNIQUES[u].desc}</p>`).join('');
  $('#hubBody').innerHTML=`${classCards()}
    <div class="grid2">
      <section class="panel"><h3>${D.CLASSES[k].name} · vzhled</h3><canvas id="preview" width="520" height="520"></canvas>
        <div class="skins">${D.SKINS[k].map(s=>{const own=D.skinOwned(p,k,s.k),r=s.req;
          const note=own?(s.k===cur?'Nasazeno':'Vlastníš'):r?.level?`Od úrovně ${r.level}`:r?.credits?`${num(r.credits)} kreditů v Obchodě`:'Padá z bossů';
          return`<button type="button" class="skin${s.k===cur?' cur':''}" data-skin="${s.k}" style="--a:${hex(s.armor)};--g:${hex(s.glow)}" ${own?'':'disabled'}><div class="sw"></div><b>${s.name}</b><small>${note}</small></button>`}).join('')}</div></section>
      <section class="panel"><h3>Vlastnosti</h3><div class="stats">${d.rows.map(([a,b])=>`<div class="stat">${a}<b>${b}</b></div>`).join('')}</div>
        <div class="lbl">Bonusy z implantátů a stromu</div><div class="mods">${mods}</div>${uniq}
        <div class="lbl">Implantáty</div><div class="items">${D.SLOT_KEYS.map(s=>itemCard(p.inv.find(i=>i.id===p.eq[s]),{slot:s,eq:true})).join('')}</div>
        <div class="lbl">Taktická akce · klávesa T</div><div class="chips">${D.TACTIC_KEYS.map(t=>{const T=D.TACTICS[t],ok=p.level>=T.lvl;
          return`<button type="button" class="chip" data-tac="${t}" aria-pressed="${(p.tactic||'dodge')===t}" ${ok?'':'disabled'}>${T.name} · ${T.cd} s<small>${ok?T.desc:`Od úrovně ${T.lvl}`}</small></button>`}).join('')}</div>
        <div class="lbl">Titul</div>${p.titles.length?`<div class="chips">${['',...p.titles].map(t=>`<button type="button" class="chip" data-title="${esc(t)}" aria-pressed="${(p.title||'')===t}">${t?esc(t):'Bez titulu'}</button>`).join('')}</div>`:'<p class="help">Tituly získáš za první dokončení misí kampaně.</p>'}
      </section></div>
    <section class="panel"><div class="row"><h3>Sestavy · ${p.builds.length} / ${D.BUILDS_MAX}</h3>
        <div class="inline"><label class="field">Název sestavy<input id="bName" maxlength="24" placeholder="Např. Boss tank"></label><button class="go sm" id="bSave" type="button">Uložit aktuální</button></div></div>
      <p class="help">Sestava si pamatuje povolání, vybavené implantáty, strom dovedností, vzhled a sloty profese. Načtení je zdarma, mimo zápas. Stejný název přepíše starou sestavu.</p>
      <div class="list">${p.builds.map(b=>{const eq=D.SLOT_KEYS.map(s=>p.inv.find(i=>i.id===b.eq[s])).filter(Boolean);
        return`<div class="lrow"><div><b>${esc(b.name)}</b><small>${D.CLASSES[b.cls].name} · ${D.treeSpent(b.tree)} b. ve stromu · ${eq.map(i=>`<span style="color:${D.RARITIES[i.r].color}">${esc(i.name)}</span>`).join(', ')||'bez implantátů'}${b.slots?' · '+b.slots.map(id=>D.skillDef(b.cls,id)?.name).join(', '):''}</small></div>
          <button class="go sm" type="button" data-bl="${b.id}">Načíst</button><button class="ghost sm" type="button" data-bd="${b.id}">Smazat</button></div>`}).join('')||'<p class="help">Zatím žádná sestava.</p>'}</div></section>`;
  bindClassCards();
  document.querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>act('skin',{cls:k,skin:b.dataset.skin},'Vzhled nasazen.'));
  document.querySelectorAll('[data-tac]').forEach(b=>b.onclick=()=>act('tactic',{tactic:b.dataset.tac},'Taktická akce nastavena.'));
  document.querySelectorAll('[data-title]').forEach(b=>b.onclick=()=>act('title',{title:b.dataset.title||null},'Titul nastaven.'));
  document.querySelectorAll('#hubBody .item[data-id]').forEach(b=>b.onclick=()=>{H.inv.sel=b.dataset.id;H.tab='inv';renderHub()});
  $('#bSave').onclick=()=>act('buildSave',{name:$('#bName').value,cls:k},j=>`Sestava ${j.build.name} uložena.`);
  document.querySelectorAll('[data-bl]').forEach(b=>b.onclick=async()=>{const j=await act('buildLoad',{id:b.dataset.bl},j=>j.missing.length?`Načteno, chybí: ${j.missing.join(', ')}.`:'Sestava načtena.');
    if(j){H.cls=j.profile.cls;store.set('cls',H.cls);H.pd=null;H.tree.draft=null;renderHub()}});
  document.querySelectorAll('[data-bd]').forEach(b=>b.onclick=()=>act('buildDelete',{id:b.dataset.bd},'Sestava smazána.'));
  H.cb.preview($('#preview'),k,cur);
}

// ---------- Inventář ----------
function tabInv(){
  const p=H.profile,I=H.inv;
  const list=p.inv.filter(i=>(!I.slot||i.slot===I.slot)&&i.r>=I.minR).sort((a,b)=>b.r-a.r||b.lvl-a.lvl);
  const sel=p.inv.find(i=>i.id===I.sel);
  const cheap=p.inv.filter(i=>i.r===0&&!isEq(i));
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><h3>Inventář · ${p.inv.length} / ${D.INV_MAX}</h3>
      <button class="ghost sm" id="sellCommon" type="button" ${cheap.length?'':'disabled'}>Prodat běžné nevybavené (${cheap.length}) za ${num(cheap.reduce((a,i)=>a+D.itemValue(i),0))} kr.</button></div>
      <div class="row"><div class="seg" id="fSlot"><button type="button" data-s="" aria-pressed="${!I.slot}">Vše</button>${D.SLOT_KEYS.map(s=>`<button type="button" data-s="${s}" aria-pressed="${I.slot===s}">${D.SLOTS[s].name}</button>`).join('')}</div>
      <div class="seg" id="fR">${D.RARITIES.map((r,i)=>`<button type="button" data-r="${i}" aria-pressed="${I.minR===i}">${i?r.name+' +':'Všechny'}</button>`).join('')}</div></div></section>
    <div class="grid2"><section class="panel"><div class="items">${list.map(it=>itemCard(it,{sel:it.id===I.sel,eq:isEq(it)})).join('')||'<p class="help">Žádné předměty v tomto filtru. Implantáty padají z NPC, bossů a po zápasech. Koupit je můžeš v Obchodě nebo na Tržišti.</p>'}</div></section>
      <section class="panel">${sel?itemDetail(sel):'<p class="help">Vyber implantát a uvidíš jeho vlastnosti. Vybavit můžeš jeden do každého slotu: Jádro, Derma a Neurál. Implantáty platí pro všechna povolání.</p>'}</section></div>`;
  document.querySelectorAll('#fSlot button').forEach(b=>b.onclick=()=>{I.slot=b.dataset.s;tabInv()});
  document.querySelectorAll('#fR button').forEach(b=>b.onclick=()=>{I.minR=+b.dataset.r;tabInv()});
  document.querySelectorAll('#hubBody .item[data-id]').forEach(b=>b.onclick=()=>{I.sel=b.dataset.id;tabInv()});
  $('#sellCommon').onclick=()=>act('sell',{ids:cheap.map(i=>i.id)},j=>`Prodáno za ${num(j.credits)} kreditů.`);
  if(sel){
    const eq=isEq(sel);
    $('#eqBtn').onclick=()=>act('equip',{slot:sel.slot,itemId:eq?null:sel.id},eq?'Implantát sundán.':'Implantát vybaven.');
    $('#sellBtn').onclick=()=>{I.sel=null;act('sell',{ids:[sel.id]},j=>`Prodáno za ${num(j.credits)} kreditů.`)};
    $('#listBtn').onclick=()=>{const price=+$('#listPrice').value;I.sel=null;act('marketList',{itemId:sel.id,price},`Nabídnuto na tržišti za ${num(price)} kreditů.`)};
  }
}
function itemDetail(it){
  const eq=isEq(it),v=D.itemValue(it);
  return`<div class="idet r${it.r}"><h4>${esc(it.name)}</h4><small class="help">${D.RARITIES[it.r].name} · ${D.SLOTS[it.slot].name} · úroveň ${it.lvl}${eq?' · vybaveno':''}</small>
    <ul>${it.aff.map(a=>`<li>${D.fmtStat(a.k,a.v)}</li>`).join('')}</ul>${it.u?`<p class="uq">${D.UNIQUES[it.u].desc}</p>`:''}
    <div class="btns"><button class="go sm" id="eqBtn" type="button">${eq?'Sundat':'Vybavit'}</button><button class="ghost sm" id="sellBtn" type="button">Prodat za ${num(v)} kr.</button></div>
    <div class="inline"><label class="field">Cena na tržišti<input id="listPrice" type="number" min="10" max="1000000" value="${Math.max(10,v*3)}"></label><button class="ghost sm" id="listBtn" type="button">Nabídnout</button></div>
    <p class="help">Tržiště si z prodeje bere ${D.MARKET_FEE*100} %. Nabídka vyprší po 7 dnech a předmět se ti vrátí.</p></div>`;
}

// ---------- Dovednosti ----------
function tabTree(){
  const p=H.profile,T=H.tree;
  if(!T.cls)T.cls=H.cls;
  if(!T.draft||T.draft.cls!==T.cls)T.draft={cls:T.cls,a:{...(p.tree[T.cls]||{})}};
  const a=T.draft.a,total=Math.max(0,p.level-1),spent=D.treeSpent(a),C=D.CLASSES[T.cls];
  const dirty=JSON.stringify(a)!==JSON.stringify(p.tree[T.cls]||{});
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><div class="seg" id="tCls">${D.CLASS_KEYS.map(k=>`<button type="button" data-k="${k}" aria-pressed="${k===T.cls}">${D.CLASSES[k].name}</button>`).join('')}</div>
      <div class="cred">${total-spent} <small>VOLNÝCH BODŮ Z ${total}</small></div></div>
      <p class="help">Každá úroveň přináší jeden bod do stromu každého povolání. Další řádek větve se odemkne po 3 bodech v té větvi, poslední schopnost po 12. Přerozdělení je zdarma.</p></section>
    <div class="tree" style="--c:${C.css}">${D.TREES[T.cls].map(br=>{let inBr=0;br.nodes.forEach(n=>inBr+=a[n.id]|0);
      return`<div class="branch"><h4>${br.name}</h4><small>${br.desc} · ${inBr} b.</small>${br.nodes.map((n,t)=>{const r=a[n.id]|0,locked=spentIn(br,a,t)<t*3;
        return`<div class="node${r?' on':''}${t===4?' cap':''}${locked&&!r?' locked':''}"><span class="tier">ŘÁDEK ${t+1}${t?` · ${t*3} b. ve větvi`:''}</span><span class="rk">${r} / ${n.max}</span><b>${n.name}</b><small>${n.desc}</small>
          <div class="btns" style="grid-column:1/-1"><button class="ghost sm" type="button" data-add="${n.id}" ${r>=n.max||locked||spent>=total?'disabled':''}>Přidat bod</button>${r?`<button class="ghost sm" type="button" data-rm="${n.id}">Odebrat</button>`:''}</div></div>`}).join('')}</div>`}).join('')}</div>
    <div class="btns"><button class="go" id="tSave" type="button" ${dirty?'':'disabled'}>Uložit strom</button><button class="ghost" id="tUndo" type="button" ${dirty?'':'disabled'}>Zahodit změny</button><button class="ghost" id="tReset" type="button" ${spent?'':'disabled'}>Vrátit všechny body</button></div>`;
  document.querySelectorAll('#tCls button').forEach(b=>b.onclick=()=>{T.cls=b.dataset.k;tabTree()});
  const tryA=next=>{if(D.safeTree(T.cls,next,p.level)){T.draft.a=next;tabTree()}else toast('Tento bod nejde odebrat, vyšší řádky na něm závisí.',true)};
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>tryA({...a,[b.dataset.add]:(a[b.dataset.add]|0)+1}));
  document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const n={...a};n[b.dataset.rm]--;if(!n[b.dataset.rm])delete n[b.dataset.rm];tryA(n)});
  $('#tSave').onclick=()=>act('tree',{cls:T.cls,alloc:a},'Strom uložen.').then(()=>{T.draft=null});
  $('#tUndo').onclick=()=>{T.draft=null;tabTree()};
  $('#tReset').onclick=()=>{T.draft.a={};tabTree()};
}
function spentIn(br,a,t){let s=0;for(let i=0;i<t;i++)s+=a[br.nodes[i].id]|0;return s}

// ---------- Tržiště ----------
async function loadMarket(){const K=H.mk;try{const q=new URLSearchParams({slot:K.slot,r:K.r,sort:K.sort,mine:K.mine?'1':''});K.list=(await api('/api/market?'+q)).listings}catch(e){toast(e.message,true);K.list=[]}if(H.tab==='market')tabMarket()}
function tabMarket(){
  const K=H.mk;if(!K.list){K.list=[];loadMarket()}
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><h3>Tržiště</h3><button class="ghost sm" id="mRef" type="button">Obnovit</button></div>
      <div class="row"><div class="seg" id="mSlot"><button type="button" data-s="" aria-pressed="${!K.slot}">Vše</button>${D.SLOT_KEYS.map(s=>`<button type="button" data-s="${s}" aria-pressed="${K.slot===s}">${D.SLOTS[s].name}</button>`).join('')}</div>
      <div class="seg" id="mR">${D.RARITIES.map((r,i)=>`<button type="button" data-r="${i||''}" aria-pressed="${String(K.r)===String(i||'')}">${i?r.name+' +':'Všechny'}</button>`).join('')}</div>
      <div class="seg" id="mSort"><button type="button" data-o="price" aria-pressed="${K.sort==='price'}">Nejlevnější</button><button type="button" data-o="new" aria-pressed="${K.sort==='new'}">Nejnovější</button></div>
      <div class="seg"><button type="button" id="mMine" aria-pressed="${K.mine}">Moje nabídky</button></div></div>
      <p class="help">Předmět nabídneš v Inventáři. Kupuješ za kredity, prodávající dostane cenu bez ${D.MARKET_FEE*100} % poplatku.</p></section>
    <section class="panel"><div class="list">${K.list.map(l=>`<div class="lrow r${l.item.r}"><div><b>${esc(l.item.name)}</b><small>${D.RARITIES[l.item.r].name} · ${D.SLOTS[l.item.slot].name} · úr. ${l.item.lvl} · ${esc(affixes(l.item))}${l.item.u?' · '+esc(D.UNIQUES[l.item.u].desc):''}</small><small>Prodává ${esc(l.sellerNick)}</small></div>
      <div class="price">${num(l.price)}</div>${l.mine?`<button class="ghost sm" type="button" data-cancel="${l.id}">Stáhnout</button>`:`<button class="go sm" type="button" data-buy="${l.id}" ${H.profile.credits<l.price?'disabled':''}>Koupit</button>`}</div>`).join('')||'<p class="help">Žádné nabídky. Buď první, kdo něco nabídne.</p>'}</div></section>`;
  const re=()=>{K.list=null;tabMarket()};
  $('#mRef').onclick=re;
  document.querySelectorAll('#mSlot button').forEach(b=>b.onclick=()=>{K.slot=b.dataset.s;re()});
  document.querySelectorAll('#mR button').forEach(b=>b.onclick=()=>{K.r=b.dataset.r;re()});
  document.querySelectorAll('#mSort button').forEach(b=>b.onclick=()=>{K.sort=b.dataset.o;re()});
  $('#mMine').onclick=()=>{K.mine=!K.mine;re()};
  document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{const j=await act('marketBuy',{id:b.dataset.buy},j=>`Koupeno: ${j.item.name}.`);if(j)re()});
  document.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{const j=await act('marketCancel',{id:b.dataset.cancel},'Nabídka stažena, předmět je zpět v inventáři.');if(j)re()});
}

// ---------- Obchod ----------
function tabShop(){
  const p=H.profile,MR=p.merchant;
  $('#hubBody').innerHTML=`<section class="panel"><div class="row"><h3>Obchodník · dnešní zboží</h3>
      ${MR.rerolled?'<small class="help">Zboží dnes už vyměněno</small>':`<button class="ghost sm" type="button" id="mrRe" ${p.credits<D.MERCHANT.rerollCost?'disabled':''}>Vyměnit zboží za ${D.MERCHANT.rerollCost} kr.</button>`}</div>
      <p class="help">Každý den o půlnoci přiveze čtyři vybrané implantáty tvé úrovně: vzácný nebo lepší do každého slotu a jeden epický nebo legendární. Každý kus koupíš jen jednou, na rozdíl od zásobníku víš předem, co dostaneš.</p>
      <div class="list">${MR.offers.map((o,i)=>`<div class="lrow r${o.item.r}" style="${o.sold?'opacity:.5':''}"><div><b>${esc(o.item.name)}</b><small>${D.RARITIES[o.item.r].name} · ${D.SLOTS[o.item.slot].name} · úr. ${o.item.lvl} · ${esc(affixes(o.item))}${o.item.u?' · '+esc(D.UNIQUES[o.item.u].desc):''}</small></div>
        <div class="price">${num(o.price)}</div>${o.sold?'<small class="help">Koupeno</small>':`<button class="go sm" type="button" data-mr="${i}" ${p.credits<o.price?'disabled':''}>Koupit</button>`}</div>`).join('')}</div></section>
    <div class="grid2"><section class="panel"><h3>Zásobníky</h3>${Object.entries(D.CRATES).map(([k,c])=>`<div class="lrow ${k==='rare'?'r2':'r0'}"><div><b>${c.name}</b><small>${c.desc}</small></div><div class="price">${num(c.price)}</div><button class="go sm" type="button" data-crate="${k}" ${p.credits<c.price?'disabled':''}>Koupit</button></div>`).join('')}
      <p class="help">Šance na vzácnost: ${D.RARITIES.map(r=>`${r.name} ${r.weight} %`).join(', ')}. Vzácný zásobník šance na vyšší vzácnost zvyšuje.</p></section>
    <section class="panel"><h3>Vzhledy</h3><div class="list">${D.CLASS_KEYS.flatMap(k=>D.SKINS[k].filter(s=>s.req?.credits).map(s=>{const own=D.skinOwned(p,k,s.k);
      return`<div class="lrow"><div><b style="color:${hex(s.glow)}">${s.name}</b><small>${D.CLASSES[k].name}</small></div><div class="price">${num(s.req.credits)}</div>${own?'<small class="help">Vlastníš</small>':`<button class="go sm" type="button" data-bk="${k}" data-bs="${s.k}" ${p.credits<s.req.credits?'disabled':''}>Koupit</button>`}</div>`})).join('')}</div>
      <p class="help">Další vzhledy se odemknou na úrovni 5. Relikviové vzhledy padají jen z poražených bossů.</p></section></div>`;
  document.querySelectorAll('[data-crate]').forEach(b=>b.onclick=()=>act('crate',{type:b.dataset.crate},j=>`Získáno: ${j.item.name} (${D.RARITIES[j.item.r].name}).`));
  document.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>act('buySkin',{cls:b.dataset.bk,skin:b.dataset.bs},'Vzhled koupen a nasazen.'));
  document.querySelectorAll('[data-mr]').forEach(b=>b.onclick=()=>act('merchantBuy',{i:+b.dataset.mr},j=>`Koupeno: ${j.item.name}.`));
  $('#mrRe')&&($('#mrRe').onclick=()=>act('merchantReroll',{},'Obchodník přivezl nové zboží.'));
}

// ---------- Statistiky ----------
const RES={win:['Výhra','var(--green)'],loss:['Prohra','var(--red)'],draw:['Remíza','var(--muted)'],short:['Krátký','var(--muted)']};
const pct=(a,b)=>b?Math.round(a/b*100)+' %':'—';
const dur=s=>s>=3600?`${Math.floor(s/3600)} h ${Math.floor(s%3600/60)} min`:`${Math.floor(s/60)} min`;
function tabStats(){
  const p=H.profile,st=p.stats;
  const modeName=k=>k==='campaign'?'Kampaň':D.MODES[k]?.name||k;
  const rows=(obj,name)=>Object.entries(obj).sort((a,b)=>b[1].m-a[1].m).map(([k,v])=>`<tr><td>${name(k)}</td><td>${v.m}</td><td>${v.w}</td><td>${pct(v.w,v.m)}</td></tr>`).join('');
  $('#hubBody').innerHTML=`<section class="panel"><h3>Souhrn</h3><div class="stats">${[['Zápasy',num(st.matches)],['Výhry',`${num(st.wins)} · ${pct(st.wins,st.matches)}`],['MVP zápasu',num(st.mvp)],['Odehraný čas',dur(st.time)],
      ['Zničení hráčů',num(st.kills)],['Zničení NPC',num(st.npcKills)],['Poražení bossové',num(st.bossKills)],['Poškození celkem',num(st.dmg)],['Léčení celkem',num(st.heal)],
      ['Nejlepší vlna',num(st.bestWave)],['Rekord v Nekonečnu',num(st.bestEndless)]].map(([a,b])=>`<div class="stat">${a}<b>${b}</b></div>`).join('')}</div></section>
    <div class="grid2"><section class="panel"><h3>Podle povolání</h3><div class="tbl"><table class="st"><thead><tr><th>Povolání</th><th>Zápasy</th><th>Výhry</th><th>Úspěšnost</th></tr></thead><tbody>${rows(st.byCls,k=>D.CLASSES[k]?.name||k)||'<tr><td colspan="4">Zatím nic</td></tr>'}</tbody></table></div></section>
      <section class="panel"><h3>Podle režimu</h3><div class="tbl"><table class="st"><thead><tr><th>Režim</th><th>Zápasy</th><th>Výhry</th><th>Úspěšnost</th></tr></thead><tbody>${rows(st.byMode,modeName)||'<tr><td colspan="4">Zatím nic</td></tr>'}</tbody></table></div></section></div>
    <section class="panel"><h3>Poražení bossové</h3><div class="stats">${D.BOSS_KEYS.map(k=>`<div class="stat" style="${st.byBoss[k]?'':'opacity:.5'}">${D.BOSSES[k].name}<b>${num(st.byBoss[k]|0)}×</b></div>`).join('')}</div></section>
    <section class="panel"><h3>Posledních ${D.HISTORY_MAX} zápasů</h3><div class="tbl" style="overflow-x:auto"><table class="st"><thead><tr><th>Kdy</th><th>Režim</th><th>Výsledek</th><th>Povolání</th><th>Z / P</th><th>Poškození</th><th>Léčení</th><th>Odměna</th></tr></thead><tbody>
      ${p.history.map(h=>{const [rn,rc]=RES[h.res]||[h.res,''],ms=h.mission==='echo'?'Ozvěna jádra':h.mission?D.missionById(h.mission)?.name:null;
        return`<tr><td>${new Date(h.at).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
        <td>${ms?'Kampaň · '+esc(ms):modeName(h.mode)}${h.boss?' · '+D.BOSSES[h.boss].name:''}${h.wave?' · vlna '+h.wave:''}<br><small class="help">${D.MAPS[h.map]?.name||''} · ${dur(h.dur)}</small></td>
        <td style="color:${rc}">${rn}${h.score?` ${h.score[0]}:${h.score[1]}`:''}${h.mvp?' <b style="color:var(--gold)">MVP</b>':''}${h.rk!=null?`<br><small class="help">hodnocená ${h.rk>=0?'+':''}${h.rk}</small>`:''}</td><td>${D.CLASSES[h.cls]?.name||''}</td>
        <td>${D.MODES[h.mode]?.pvp?h.ki:h.nk} / ${h.de}</td><td>${num(h.dm)}</td><td>${num(h.he)}</td><td>+${num(h.xp)} zk. · +${num(h.cr)} kr.</td></tr>`}).join('')||'<tr><td colspan="8">Zatím žádný zápas s účtem.</td></tr>'}</tbody></table></div></section>`;
}

// ---------- Žebříček ----------
async function tabTop(){
  $('#hubBody').innerHTML='<section class="panel"><h3>Žebříček</h3><p class="help">Načítám…</p></section>';
  try{const j=await api('/api/top');if(H.tab!=='top')return;
    const me=x=>H.profile&&x.nick===H.profile.nick?'mine':'';
    $('#hubBody').innerHTML=`<section class="panel"><h3>Hodnocená hra · sezóna ${D.seasonName(j.season)}</h3>${j.ranked?.length?`<div class="tbl" style="overflow-x:auto"><table class="st"><thead><tr><th>Hráč</th><th>Divize</th><th>Hodnocení</th><th>Zápasy</th><th>Výhry</th><th>Úspěšnost</th></tr></thead><tbody>
      ${j.ranked.map((x,i)=>`<tr class="${me(x)}"><td>${i+1}. ${esc(x.nick)} <small class="help">${D.CLASSES[x.cls]?.name||''}</small></td><td>${divBadge(x.rating,true)}</td><td>${x.placed?x.rating:`${x.rating} <small class="help">umisťuje se</small>`}</td><td>${x.games}</td><td>${x.wins}</td><td>${pct(x.wins,x.games)}</td></tr>`).join('')}</tbody></table></div>`
      :'<p class="help">V této sezóně zatím nikdo neodehrál hodnocený zápas.</p>'}</section>
    <section class="panel"><h3>Žebříček · nejvyšší úrovně</h3><div class="tbl" style="overflow-x:auto"><table class="st"><thead><tr><th>Hráč</th><th>Povolání</th><th>Úroveň</th><th>Výhry</th><th>Bossové</th><th>Nejlepší vlna</th><th>Nekonečno</th></tr></thead><tbody>
      ${j.players.map((x,i)=>`<tr class="${H.profile&&x.nick===H.profile.nick?'mine':''}"><td>${i+1}. ${esc(x.nick)}</td><td>${D.CLASSES[x.cls]?.name||''}</td><td>${x.level}</td><td>${x.wins}</td><td>${x.bossKills}</td><td>${x.bestWave}</td><td>${x.bestEndless|0}</td></tr>`).join('')}</tbody></table></div></section>`}
  catch(e){$('#hubBody').innerHTML=`<section class="panel"><p class="err">${esc(e.message)}</p></section>`}
}

// ---------- rewards after a match ----------
export function showRewards(m){
  const el=$('#endRewards');
  if(!m){el.innerHTML='';return}
  if(m.guest){el.innerHTML=`<div class="rew"><p class="help">Hraješ jako host, odměny se neukládají. Přihlas se a získávej zkušenosti, kredity a implantáty.</p></div>`;return}
  const R=m.ranked,rk=R?`<div class="rank">${divBadge(R.rating)}<div><span class="rkd" style="color:${R.delta>=0?'var(--green)':'var(--red)'}">${R.delta>=0?'+':''}${R.delta}</span> hodnocení · nyní <b style="display:inline;font-size:20px">${R.rating}</b>
      ${R.div>R.prevDiv?`<div class="lvup">Postup do divize ${D.DIVISIONS[R.div].name}</div>`:R.div<R.prevDiv?`<p class="help">Sestup do divize ${D.DIVISIONS[R.div].name}.</p>`:''}
      ${R.games<=D.PLACEMENT?`<p class="help">Umisťovací zápas ${R.games} / ${D.PLACEMENT}.</p>`:''}</div></div>`:m.rankedNone?`<p class="help">${esc(m.rankedNone)}</p>`:'';
  if(m.res==='short'){el.innerHTML=`<div class="rew">${rk}<p class="help">Zápas trval méně než 45 sekund, odměny se nepočítají.${m.items.length?' Sebraná kořist ti zůstává.':''}</p>${m.items.length?`<div class="items">${m.items.map(i=>itemCard(i)).join('')}</div>`:''}</div>`}
  else el.innerHTML=`<div class="rew">${rk}<div class="big"><div><span>+${num(m.xp)}</span> zkušeností</div><div><span>+${num(m.credits)}</span> kreditů</div></div>
    ${m.levelUps.length?`<div class="lvup">Nová úroveň ${m.levelUps.at(-1)}! Bod do stromu dovedností a bonus kreditů.</div>`:''}
    ${m.skin?`<div class="lvup">Odemčen vzhled: ${esc(D.skinOf(...m.skin.split(':')).name)}</div>`:''}
    ${m.camp?.first?`<div class="lvup">Mise dokončena poprvé: ${esc(m.camp.first)}</div>`:''}
    ${m.camp?.title?`<p class="help">Nový titul: <b style="color:var(--gold)">${esc(m.camp.title)}</b></p>`:''}
    ${m.camp?.shards?`<p class="help">Střepy ${esc(D.BOSSES[m.camp.shards.boss].name)}: ${m.camp.shards.n} / ${D.SHARDS_FOR_PLAN}${m.camp.shards.n>=D.SHARDS_FOR_PLAN?' · plán můžeš vyrobit v Kampani':''}</p>`:''}
    ${m.camp?.echo?'<div class="lvup">Ozvěna jádra pokořena · bonus týdne</div>':''}
    ${m.record?`<div class="lvup">Nový rekord v Nekonečnu · vlna ${m.record}</div>`:''}
    ${m.mvp?'<div class="lvup">MVP zápasu · +15 % zkušeností a kreditů</div>':''}
    ${m.goalsDone?.length?`<p class="help">Splněné cíle: <b style="color:var(--green)">${m.goalsDone.map(esc).join(', ')}</b>. Odměnu vyzvedneš v Cílech.</p>`:''}
    ${m.items.length?`<div class="lbl">Kořist</div><div class="items">${m.items.map(i=>itemCard(i)).join('')}</div>`:'<p class="help">Tentokrát bez kořisti.</p>'}
    ${m.sold?`<p class="help">Inventář byl plný, ${m.sold} ${m.sold===1?'předmět byl prodán':'předměty byly prodány'} automaticky.</p>`:''}</div>`;
  if(m.profile){H.profile=m.profile;H.cls=m.profile.cls}
}
