// Friends and chat. A signed-in hub keeps a "social" WebSocket open for the friend list with live status, world chat,
// private messages and invites; room chat (lobby and match) travels over the game connection and is routed here.
import * as D from './data.js';
import * as Snd from './audio.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('rel.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rel.'+k,JSON.stringify(v))}catch{}}};
const KEEP=100;

const X={ws:null,want:null,retry:0,retryT:0,me:null,
  fr:{friends:[],inReq:[],outReq:[],blocked:[],recent:[]},
  world:[],dms:{},room:[],roomCode:null,guild:null,gtag:null,glog:[],unread:{world:0,room:0,guild:0},dmUnread:{},
  tab:'world',open:false,screen:'auth',filter:store.get('chatFilter',true),invites:[],pick:null,
  host:null,listeners:new Set()};

// host: {join(code), sendRoom(text,team), inRoom(), roomCode(), pvp(), myTeam()}
export function setup(host){X.host=host;bindDock();bindMatchChat()}
export const onChange=f=>X.listeners.add(f);
const guildListeners=new Set();
export const onGuild=f=>guildListeners.add(f);
export const guildTag=()=>X.gtag;
const changed=()=>{for(const f of X.listeners)try{f()}catch(e){console.warn(e)}};
export const friends=()=>X.fr;
export const pending=()=>X.fr.inReq.length;
export const connected=()=>!!(X.ws&&X.ws.readyState===1&&X.me);

// ---------- connection ----------
export function connect(token){
  if(!token)return disconnect();
  if(X.want===token&&X.ws)return;
  disconnect();X.want=token;open();
}
export function disconnect(){
  X.want=null;clearTimeout(X.retryT);X.me=null;
  if(X.ws){const w=X.ws;X.ws=null;try{w.close()}catch{}}
  X.fr={friends:[],inReq:[],outReq:[],blocked:[],recent:[]};X.world=[];X.dms={};X.dmUnread={};X.unread.world=0;X.invites=[];
  X.guild=null;X.gtag=null;X.glog=[];X.unread.guild=0;
  renderDock();renderInvites();changed();
}
function open(){
  let ws;try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws')}catch{return}
  X.ws=ws;const tok=X.want;
  ws.onopen=()=>ws.send(JSON.stringify({type:'social',token:tok}));
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch{return}onMsg(m)};
  ws.onclose=()=>{if(X.ws!==ws)return;X.ws=null;X.me=null;renderDock();changed();
    // reconnect with a growing delay while the player stays signed in (server restart, network change)
    if(X.want===tok){const d=Math.min(30000,2000*2**X.retry++);X.retryT=setTimeout(()=>{if(X.want===tok&&!X.ws)open()},d)}};
}
const sendS=m=>{if(X.ws&&X.ws.readyState===1)X.ws.send(JSON.stringify(m))};
function onMsg(m){
  switch(m.type){
    case 'social':
      if(!m.ok){X.want=null;return}
      X.me=m.me;X.retry=0;X.world=m.world||[];X.dms=m.dms||{};renderDock();changed();break;
    case 'friends':{const before=new Set(X.fr.inReq.map(f=>f.id));X.fr={friends:m.friends,inReq:m.inReq,outReq:m.outReq,blocked:m.blocked,recent:m.recent||[]};
      if(X.tab.startsWith('dm:')&&!isFriend(X.tab.slice(3)))X.tab='world';
      renderDock();changed();break}
    case 'chat':{
      if(m.pid!==X.me&&(m.ch==='dm'||m.ch==='guild'))Snd.play('msg',null,{ui:true,gap:.6,vol:m.ch==='dm'?.9:.5});
      if(m.ch==='world'){push(X.world,m);if(!(X.open&&X.tab==='world'))X.unread.world++}
      else if(m.ch==='guild'){push(X.glog,m);
        if(X.screen==='hud'&&m.pid!==X.me)matchLine(`<span class="cg">[${esc(X.gtag)}] ${esc(m.from)}:</span> ${txt(m.text)}`);
        else if(!(X.open&&X.tab==='guild')&&m.pid!==X.me)X.unread.guild++}
      else if(m.ch==='dm'){push(X.dms[m.with]??=[],m);const mine=m.pid===X.me;
        if(!mine&&!(X.open&&X.tab==='dm:'+m.with)){X.dmUnread[m.with]=(X.dmUnread[m.with]|0)+1;
          if(X.screen==='hud')matchLine(`<span class="cw">Šepot od ${esc(m.from)}:</span> ${txt(m.text)}`);else toast(`Zpráva od ${m.from}: ${shorten(m.text)}`)}}
      renderDock();break}
    case 'invite':{
      Snd.play('relicUp',null,{ui:true,vol:.6});
      X.invites=X.invites.filter(i=>i.pid!==m.pid);X.invites.push({...m,at:Date.now()});
      if(X.screen==='hud')matchLine(`<span class="cw">${esc(m.from)} tě zve do místnosti ${esc(m.code)}.</span> Pozvánku najdeš po zápase.`);
      renderInvites();break}
    case 'note':toast(m.msg,m.bad);break;
    case 'guildHist':
      if(m.gid!==X.guild){X.unread.guild=0;if(!m.gid&&X.tab==='guild')X.tab='world'}
      X.guild=m.gid;X.gtag=m.tag;X.glog=m.list||[];renderDock();changed();break;
    case 'guildUpd':for(const f of guildListeners)try{f()}catch(e){console.warn(e)}break;
  }
}
const push=(a,m)=>{a.push(m);if(a.length>KEEP)a.shift()};
const isFriend=id=>X.fr.friends.some(f=>f.id===id);
const friendById=id=>X.fr.friends.find(f=>f.id===id);
const shorten=s=>s.length>60?s.slice(0,57)+'…':s;
const txt=s=>esc(X.filter?D.maskSwears(s):s);
const hm=t=>{const d=new Date(t);return`${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`};
let toastT;
function toast(msg,bad){const t=$('#toast');if(!t)return;t.textContent=msg;t.className=bad?'bad':'';t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3500)}

// ---------- friend actions (used by the Přátelé tab and the chat) ----------
export const fr=(op,arg)=>sendS({type:'fr',op,arg});
export const invite=id=>sendS({type:'invite',to:id});
export function openGuildChat(){if(!X.guild)return;X.tab='guild';X.open=true;renderDock();setTimeout(()=>$('#chatIn')?.focus(),0)}
export function openDM(id){if(!isFriend(id))return;X.tab='dm:'+id;X.open=true;X.dmUnread[id]=0;renderDock();setTimeout(()=>$('#chatIn')?.focus(),0)}
export function statusText(f){
  const where=f.mission?(f.mission==='echo'?'Ozvěna jádra':D.missionById(f.mission)?.name||'Kampaň'):D.MODES[f.mode]?.name||'';
  return f.st==='match'?`Ve hře · ${f.ranked?'hodnocená · ':''}${where}`:f.st==='lobby'?`V místnosti · ${where}${f.solo?'':` · ${f.n}/${f.max}`}`:f.st==='online'?'Online v hubu':'Offline';
}

// ---------- room chat (game connection) ----------
export function roomMsg(m){
  push(X.room,m);if(m.pid!==X.me||!m.pid)Snd.play('msg',null,{ui:true,gap:.6,vol:.6});
  if(X.screen==='hud'){const cls=m.team?'ct':`t${m.tm}`;matchLine(`<span class="${cls}">${m.team?'[Tým] ':''}${m.tag?`[${esc(m.tag)}] `:''}${esc(m.from)}:</span> ${txt(m.text)}`)}
  else if(!(X.open&&X.tab==='room'))X.unread.room++;
  renderDock();
}
export function roomHist(list){X.room=list.slice(-KEEP);renderDock()}
export function roomReset(code){
  if(code===X.roomCode)return;
  X.roomCode=code||null;X.room=[];X.unread.room=0;
  if(code){X.tab='room'}else if(X.tab==='room')X.tab='world';
  renderDock();
}

// ---------- dock (hub, lobby, end screen) ----------
export function screen(id){
  X.screen=id;
  const dock=$('#chatDock');if(!dock)return;
  dock.hidden=!(id==='hub'||id==='lobby'||id==='end')||!(X.want||X.roomCode);
  $('#mchat').hidden=id!=='hud'||!X.roomCode;
  if(id!=='hud')closeMatchChat();
  renderDock();renderInvites();
}
function tabs(){
  const t=[];
  if(X.roomCode)t.push(['room',`Místnost ${X.roomCode}`,X.unread.room]);
  if(X.guild)t.push(['guild',`Klan [${X.gtag}]`,X.unread.guild]);
  if(X.want)t.push(['world','Svět',X.unread.world]);
  for(const id of Object.keys(X.dms)){const f=friendById(id);if(f&&(X.dms[id].length||X.tab==='dm:'+id))t.push(['dm:'+id,f.nick,X.dmUnread[id]|0])}
  if(X.tab.startsWith('dm:')&&!t.some(x=>x[0]===X.tab)){const f=friendById(X.tab.slice(3));if(f)t.push([X.tab,f.nick,0])}
  return t;
}
function curLog(){return X.tab==='room'?X.room:X.tab==='world'?X.world:X.tab==='guild'?X.glog:X.dms[X.tab.slice(3)]||[]}
function renderDock(){
  const dock=$('#chatDock');if(!dock)return;
  const T=tabs();if(!T.some(x=>x[0]===X.tab)&&T.length)X.tab=T[0][0];
  if(X.open){if(X.tab==='world'||X.tab==='room'||X.tab==='guild')X.unread[X.tab]=0;else X.dmUnread[X.tab.slice(3)]=0}
  const badge=X.unread.room+X.unread.guild+Object.values(X.dmUnread).reduce((a,b)=>a+b,0);
  $('#chatToggle').innerHTML=`Chat${badge?` <b>${badge}</b>`:X.unread.world&&!X.open?' <i></i>':''}`;
  $('#chatToggle').setAttribute('aria-expanded',X.open);
  $('#chatPanel').hidden=!X.open;
  if(!X.open)return;
  $('#chatTabs').innerHTML=T.map(([k,n,u])=>`<button type="button" data-ct="${esc(k)}" aria-pressed="${k===X.tab}">${esc(n)}${u?` <b>${u}</b>`:''}</button>`).join('');
  $('#chatTabs').querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{X.tab=b.dataset.ct;X.pick=null;renderDock()});
  const log=$('#chatLog'),stick=log.scrollTop+log.clientHeight>=log.scrollHeight-24;
  const L=curLog(),dm=X.tab.startsWith('dm:');
  log.innerHTML=L.map(m=>{const me=m.pid&&m.pid===X.me,cls=m.ch==='room'?(m.team?'ct':`t${m.tm}`):me?'cme':'';
    const name=!dm&&m.pid&&!me?`<button type="button" class="cn ${cls}" data-pid="${esc(m.pid)}" data-nick="${esc(m.from)}">${esc(m.from)}</button>`:`<span class="cn ${cls}">${esc(m.from)}</span>`;
    return`<div class="cm"><small>${hm(m.t)}</small> ${m.team?'<span class="ct">[Tým]</span> ':''}${m.tag&&X.tab!=='guild'?`<span class="cg">[${esc(m.tag)}]</span> `:''}${name}${m.lv?` <small>úr. ${m.lv}</small>`:''}:${txt(m.text)}</div>`}).join('')
    ||`<p class="help">${X.tab==='world'?(connected()?'Zatím tu nikdo nic nenapsal. Svět vidí všichni přihlášení hráči.':'Připojuji k chatu…'):X.tab==='room'?'Zprávy uvidí všichni v místnosti.':X.tab==='guild'?'Klanový chat vidí jen členové klanu.':'Soukromá konverzace. Historie vydrží, dokud server neběží znovu.'}</p>`;
  if(stick)log.scrollTop=log.scrollHeight;
  log.querySelectorAll('button.cn').forEach(b=>b.onclick=()=>{X.pick={pid:b.dataset.pid,nick:b.dataset.nick};renderDock()});
  const P=X.pick,pb=$('#chatPick');
  if(P&&X.want){const f=isFriend(P.pid),out=X.fr.outReq.some(x=>x.id===P.pid);
    pb.hidden=false;pb.innerHTML=`<b>${esc(P.nick)}</b><button type="button" class="ghost sm" data-pk="prof">Profil</button>${f?'<button type="button" class="ghost sm" data-pk="dm">Soukromá zpráva</button>':out?'<small class="help">žádost čeká</small>':'<button type="button" class="ghost sm" data-pk="add">Přidat do přátel</button>'}
      <button type="button" class="ghost sm" data-pk="report">Nahlásit</button><button type="button" class="ghost sm" data-pk="block">Zablokovat</button><button type="button" class="ghost sm" data-pk="x" aria-label="Zavřít">×</button>`;
    pb.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{const k=b.dataset.pk;
      if(k==='report')reportDialog(P.pid,P.nick);
      else if(k==='prof')profileDialog({id:P.pid});
      else if(k==='dm')openDM(P.pid);else if(k==='add')fr('add',P.nick);else if(k==='block'){fr('block',P.pid);X.world=X.world.filter(m=>m.pid!==P.pid);X.room=X.room.filter(m=>m.pid!==P.pid)}
      X.pick=null;renderDock()});
  }else pb.hidden=true;
  const can=X.tab==='room'?!!X.roomCode:connected();
  $('#chatIn').disabled=!can;$('#chatIn').placeholder=X.tab==='room'?'Napiš do místnosti…':X.tab==='world'?'Napiš všem…':X.tab==='guild'?'Napiš klanu…':`Zpráva pro ${friendById(X.tab.slice(3))?.nick||''}…`;
  $('#chatFilter').setAttribute('aria-pressed',X.filter);
}
function bindDock(){
  $('#chatToggle').onclick=()=>{X.open=!X.open;renderDock();if(X.open&&!matchMedia('(pointer: coarse)').matches)$('#chatIn').focus()};
  $('#chatClose').onclick=()=>{X.open=false;renderDock()};
  $('#chatFilter').onclick=()=>{X.filter=!X.filter;store.set('chatFilter',X.filter);renderDock();toast(X.filter?'Sprostá slova se skrývají.':'Filtr sprostých slov je vypnutý.')};
  $('#chatForm').onsubmit=e=>{e.preventDefault();const t=D.cleanChat($('#chatIn').value);if(!t)return;
    if(X.tab==='room')X.host?.sendRoom(t,false);else if(X.tab==='world'||X.tab==='guild')sendS({type:'say',ch:X.tab,text:t});else sendS({type:'say',ch:'dm',to:X.tab.slice(3),text:t});
    $('#chatIn').value=''};
}

// ---------- reporting ----------
// a small dialog; the server attaches the reported player's recent messages itself
export function reportDialog(pid,nick){
  if(!X.want)return toast('Nahlašovat můžou jen přihlášení hráči.',true);
  document.querySelector('#reportDlg')?.remove();
  const d=document.createElement('div');d.id='reportDlg';d.className='overlay';
  d.innerHTML=`<div class="center"><form class="card" style="width:min(460px,100%)" autocomplete="off"><h2 class="sec">Nahlásit · ${esc(nick)}</h2>
    <div class="flist">${Object.entries(D.REPORT_REASONS).map(([k,n],i)=>`<label class="setrow"><span>${n}</span><input type="radio" name="rr" value="${k}" ${i?'':'checked'}></label>`).join('')}</div>
    <label class="field">Co se stalo (nepovinné)<input name="note" maxlength="300" placeholder="Krátký popis pro moderátora"></label>
    <p class="help">K nahlášení se automaticky přiloží poslední zprávy hráče z chatu. Zneužívání nahlašování se trestá.</p>
    <div class="btns"><button class="go" type="submit">Odeslat</button><button class="ghost" type="button" data-x>Zrušit</button></div></form></div>`;
  document.body.appendChild(d);
  d.querySelector('[data-x]').onclick=()=>d.remove();
  d.addEventListener('pointerdown',e=>{if(e.target===d||e.target.classList.contains('center'))d.remove()});
  d.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target;
    try{const r=await fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+X.want},body:JSON.stringify({target:pid,reason:f.rr.value,note:f.note.value})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Nahlášení se nepodařilo odeslat.');
      d.remove();toast(`Díky, ${nick} je nahlášen. Moderátor se na to podívá.`)}
    catch(err){toast(err.message,true)}};
}

// ---------- player profile ----------
// a card with what anyone may see about a player (level, clan, division, stats, favourite classes, recent matches),
// opened from chat, friends, the leaderboard and the lobby; guests can look too
const RES={win:['Výhra','w'],loss:['Prohra','l'],draw:['Remíza','d'],short:['Krátký','d']};
const pct=(w,m)=>m?Math.round(100*w/m)+' %':'—';
const modeName=(k,ms)=>k==='campaign'||ms?(ms==='echo'?'Ozvěna jádra':D.missionById(ms)?.name||'Kampaň'):D.MODES[k]?.name||k;
// any element with data-prof (profile id) or data-profnick opens the card
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-prof],[data-profnick]');if(!b)return;e.preventDefault();
  profileDialog(b.dataset.prof?{id:b.dataset.prof}:{nick:b.dataset.profnick})});
export async function profileDialog(q){
  if(!q)return;
  document.querySelector('#profDlg')?.remove();
  const d=document.createElement('div');d.id='profDlg';d.className='overlay';
  d.innerHTML=`<div class="center"><div class="card prof" role="dialog" aria-label="Profil hráče"><p class="help">Načítám profil…</p></div></div>`;
  document.body.appendChild(d);
  const close=()=>d.remove();
  d.addEventListener('pointerdown',e=>{if(e.target===d||e.target.classList.contains('center'))close()});
  d.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  let P;
  try{const r=await fetch('/api/player?'+new URLSearchParams(q.id?{id:q.id}:{nick:q.nick}));P=await r.json().catch(()=>({}));if(!r.ok)throw new Error(P.error||'Profil se nepodařilo načíst.')}
  catch(err){d.querySelector('.card').innerHTML=`<p class="help">${esc(err.message)}</p><div class="btns"><button class="ghost" type="button" data-x>Zavřít</button></div>`;
    d.querySelector('[data-x]').onclick=close;return}
  if(!d.isConnected)return;
  const s=P.stats,C=D.CLASSES[P.cls],div=P.ranked?D.DIVISIONS[P.ranked.div]:null,best=P.rankedGames?D.DIVISIONS[P.bestDiv]:null;
  const me=P.id===X.me,f=isFriend(P.id),out=X.fr.outReq.some(x=>x.id===P.id),blocked=X.fr.blocked.some(x=>x.id===P.id);
  const tile=(n,v,sub='')=>`<div class="ptile"><b>${v}</b><small>${n}${sub?` · ${sub}`:''}</small></div>`;
  const bars=(list,name,col)=>list.length?list.map(x=>`<div class="pbar"><span>${esc(name(x.k))}</span><i><em style="width:${Math.round(100*x.m/list[0].m)}%;${col?`background:${col(x.k)}`:''}"></em></i><small>${x.m} · ${pct(x.w,x.m)}</small></div>`).join(''):'<p class="help">Zatím žádné zápasy.</p>';
  const hrs=Math.round(s.time/360)/10;
  d.querySelector('.card').innerHTML=`
    <div class="phead" style="--c:${C?.css||'#fff'}"><div><h2 class="sec">${P.guild?`<span class="cg">[${esc(P.guild.tag)}]</span> `:''}${esc(P.nick)}</h2>
      <small>${P.title?`<span style="color:var(--gold)">${esc(P.title)}</span> · `:''}úroveň ${P.level} · hraje za ${esc(C?.name||'')}${P.created?` · od ${new Date(P.created).toLocaleDateString('cs-CZ')}`:''}</small>
      ${P.guild?`<small>Klan ${esc(P.guild.name)} · úroveň ${P.guild.level}</small>`:''}</div>
      <button class="ghost sm" type="button" data-x aria-label="Zavřít">×</button></div>
    <div class="ptiles">${tile('zápasů',s.matches)}${tile('výher',s.wins,pct(s.wins,s.matches))}${tile('zničení',s.kills)}${tile('MVP',s.mvp)}${tile('body úspěchů',P.ach)}${tile('hodin ve hře',String(hrs).replace('.',','))}</div>
    <div class="pcols">
      <section><div class="lbl">Hodnocená hra</div>
        ${div?`<p><b style="color:${div.color}">${div.name}</b> · ${P.ranked.rating}${P.ranked.placed?'':' <small class="help">(umisťovací)</small>'}<br><small class="help">${P.ranked.games} zápasů této sezóny, výhry ${pct(P.ranked.wins,P.ranked.games)}</small></p>`:'<p class="help">Tuto sezónu zatím nehrál.</p>'}
        ${best?`<p class="help">Nejlepší divize: <b style="color:${best.color}">${best.name}</b></p>`:''}
        <div class="lbl">Rekordy</div><p class="help">Poražení bossové ${s.bossKills} · nejlepší vlna ${s.bestWave||'—'} · Nekonečno ${s.bestEndless||'—'}<br>Nejdelší série ${s.bestStreak||'—'} · nejvíc naráz ${s.bestMulti>1?s.bestMulti:'—'}</p></section>
      <section><div class="lbl">Oblíbená povolání</div>${bars(P.classes,k=>D.CLASSES[k]?.name||k,k=>D.CLASSES[k]?.css)}
        <div class="lbl">Režimy</div>${bars(P.modes,k=>modeName(k))}</section>
    </div>
    <div class="lbl">Poslední zápasy</div>
    ${P.recent.length?`<div class="precent">${P.recent.map(h=>{const r=RES[h.res]||RES.loss;return`<div><span class="pr ${r[1]}">${r[0]}</span><span>${esc(modeName(h.mode,h.mission))}</span><small>${esc(D.CLASSES[h.cls]?.name||'')}${h.score?` · ${h.score[0]}:${h.score[1]}`:''} · ${h.ki}/${h.de}${h.mvp?' · MVP':''}</small></div>`}).join('')}</div>`:'<p class="help">Zatím žádné zápasy.</p>'}
    ${X.want&&!me?`<div class="btns">${f?'<button class="go sm" type="button" data-pa="dm">Soukromá zpráva</button>':out?'<small class="help">Žádost o přátelství čeká.</small>':blocked?'':'<button class="go sm" type="button" data-pa="add">Přidat do přátel</button>'}
      <button class="ghost sm" type="button" data-pa="report">Nahlásit</button>${blocked?'':'<button class="ghost sm" type="button" data-pa="block">Zablokovat</button>'}</div>`:''}`;
  d.querySelector('[data-x]').onclick=close;d.querySelector('[data-x]').focus();
  d.querySelectorAll('[data-pa]').forEach(b=>b.onclick=()=>{const k=b.dataset.pa;close();
    if(k==='dm'){X.open=true;openDM(P.id)}else if(k==='add')fr('add',P.nick);else if(k==='report')reportDialog(P.id,P.nick);
    else if(k==='block'){fr('block',P.id);X.world=X.world.filter(m=>m.pid!==P.id);X.room=X.room.filter(m=>m.pid!==P.id);renderDock()}});
}

// ---------- invites ----------
const INVITE_TTL=90000;
function renderInvites(){
  const el=$('#invites');if(!el)return;
  X.invites=X.invites.filter(i=>Date.now()-i.at<INVITE_TTL&&isFriend(i.pid));
  const show=X.screen==='hub'||X.screen==='lobby'||X.screen==='end';
  el.hidden=!show||!X.invites.length;
  el.innerHTML=X.invites.map(i=>{const where=i.mission?(i.mission==='echo'?'Ozvěna jádra':D.missionById(i.mission)?.name||'Kampaň'):D.MODES[i.mode]?.name||'';
    return`<div class="inv"><div><b>${esc(i.from)}</b> ${i.mode==='duel'&&!i.mission?'tě vyzývá na souboj':'tě zve do hry'}<small>${esc(where)} · místnost ${esc(i.code)}${i.state==='match'?' · zápas běží, nahradíš bota':''}</small></div>
      <div class="btns"><button class="go sm" type="button" data-ij="${esc(i.code)}">Připojit</button><button class="ghost sm" type="button" data-ix="${esc(i.pid)}">Zavřít</button></div></div>`}).join('');
  el.querySelectorAll('[data-ij]').forEach(b=>b.onclick=()=>{const code=b.dataset.ij;X.invites=X.invites.filter(i=>i.code!==code);renderInvites();X.host?.join(code)});
  el.querySelectorAll('[data-ix]').forEach(b=>b.onclick=()=>{X.invites=X.invites.filter(i=>i.pid!==b.dataset.ix);renderInvites()});
}
setInterval(()=>{if(X.invites.length)renderInvites()},5000);

// lobby: online friends with an invite button
export function lobbyFriends(el,L){
  if(!el)return;
  if(!X.want||L.solo||L.ranked){el.hidden=true;return}
  const on=X.fr.friends.filter(f=>f.st!=='offline'),inRoom=new Set(L.players.map(p=>p.name));
  el.hidden=false;
  el.innerHTML=`<div class="lbl">Pozvat přátele</div>${on.length?`<div class="flist">${on.map(f=>`<div class="fr"><i class="dot ${f.st}"></i><span>${f.tag?`<span class="cg">[${esc(f.tag)}]</span> `:''}${esc(f.nick)}<small>${esc(statusText(f))}</small></span>
    ${inRoom.has(f.nick)?'<small class="help">v místnosti</small>':`<button type="button" class="ghost sm" data-inv="${esc(f.id)}">Pozvat</button>`}</div>`).join('')}</div>`
    :`<p class="help">${X.fr.friends.length?'Žádný přítel teď není online.':'Zatím nemáš přátele. Přidáš si je v hubu na kartě Přátelé.'} Pozvat můžeš i odkazem přes tlačítko Kopírovat pozvánku.</p>`}`;
  el.querySelectorAll('[data-inv]').forEach(b=>b.onclick=()=>{invite(b.dataset.inv);b.disabled=true;b.textContent='Pozváno';setTimeout(()=>{if(b.isConnected){b.disabled=false;b.textContent='Pozvat'}},5000)});
}

// ---------- in-match chat ----------
const MC={open:false,team:true};
function matchLine(html){
  const log=$('#mchatLog');if(!log)return;
  const d=document.createElement('div');d.innerHTML=html;log.appendChild(d);
  while(log.children.length>8)log.firstChild.remove();
  setTimeout(()=>d.classList.add('old'),10000);
}
export function openMatchChat(all){
  if(!X.roomCode||MC.open)return false;
  MC.open=true;MC.team=!all&&!!X.host?.pvp();
  $('#mchat').classList.add('on');$('#mchatForm').hidden=false;mcLabel();
  const i=$('#mchatIn');i.value='';i.focus();return true;
}
export const matchChatOpen=()=>MC.open;
function closeMatchChat(){MC.open=false;const f=$('#mchatForm');if(!f)return;f.hidden=true;$('#mchat').classList.remove('on');$('#mchatIn').blur()}
const mcLabel=()=>{const l=$('#mchatTo');l.textContent=MC.team?'Tým':'Všem';l.className=MC.team?'ct':''};
function bindMatchChat(){
  $('#mchatForm').onsubmit=e=>{e.preventDefault();const t=D.cleanChat($('#mchatIn').value);if(t)X.host?.sendRoom(t,MC.team);closeMatchChat()};
  $('#mchatIn').addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMatchChat()}
    else if(e.key==='Tab'){e.preventDefault();if(X.host?.pvp()){MC.team=!MC.team;mcLabel()}}});
  $('#mchatIn').addEventListener('blur',()=>setTimeout(()=>{if(MC.open&&document.activeElement!==$('#mchatIn'))closeMatchChat()},150));
  $('#mchatBtn').onclick=()=>openMatchChat(false);
}
