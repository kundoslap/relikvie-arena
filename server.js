// Relikvie Aréna — authoritative game server.
// Serves the client from ./public, the account API on /api and runs every match at 30 Hz; clients only send inputs.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';
import * as S from './public/sim.js';
import {openDB} from './db.js';
import {createMeta,HttpError} from './meta.js';

const PORT=Number(process.env.PORT)||8080;
const PUB=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.webp':'image/webp'};
const END_LINGER=12000;
const MATCH_SECONDS=Number(process.env.MATCH_SECONDS)||0; // optional override of the 6-minute match, handy for testing

const db=await openDB();
const meta=createMeta(db);
console.log('Úložiště:',db.kind);

// ---------- HTTP ----------
const hits=new Map();
function limited(ip,key,max,windowMs){
  const k=ip+'|'+key,now=Date.now(),h=hits.get(k);
  if(!h||h.reset<now){hits.set(k,{n:1,reset:now+windowMs});return false}
  return ++h.n>max;
}
setInterval(()=>{const now=Date.now();for(const [k,h] of hits)if(h.reset<now)hits.delete(k)},60000).unref();
function readBody(req){return new Promise((ok,bad)=>{let size=0,chunks=[];
  req.on('data',c=>{size+=c.length;if(size>16384){bad(new HttpError(413,'Požadavek je příliš velký.'));req.destroy()}else chunks.push(c)});
  req.on('end',()=>{try{ok(chunks.length?JSON.parse(Buffer.concat(chunks)):{})}catch{bad(new HttpError(400,'Neplatný JSON.'))}})})}
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};

async function api(req,res,p,url){
  const ip=req.headers['x-forwarded-for']?.split(',')[0].trim()||req.socket.remoteAddress||'?';
  if(limited(ip,'api',240,60000))throw new HttpError(429,'Příliš mnoho požadavků. Zkus to za chvíli.');
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const body=req.method==='POST'?await readBody(req):{};
  if(p==='/api/register'||p==='/api/login'){
    if(limited(ip,'auth',12,5*60000))throw new HttpError(429,'Příliš mnoho pokusů o přihlášení. Zkus to za pár minut.');
    return json(res,200,await meta[p.slice(5)](body.nick,body.pass));
  }
  if(p==='/api/top')return json(res,200,meta.top());
  if(p==='/api/rooms')return json(res,200,{rooms:publicRooms(),online:wss.clients.size});
  if(p==='/api/status')return json(res,200,{ok:true,storage:db.kind,rooms:rooms.size,players:wss.clients.size});
  const prof=meta.auth(token);if(!prof)throw new HttpError(401,'Přihlášení vypršelo. Přihlas se znovu.');
  if(p==='/api/logout'){meta.logout(token);return json(res,200,{ok:true})}
  if(p==='/api/me')return json(res,200,{profile:meta.view(prof)});
  if(p==='/api/market')return json(res,200,meta.market(prof,Object.fromEntries(url.searchParams)));
  if(p==='/api/guild'){const idx=presenceIndex();return json(res,200,meta.guildView(prof,id=>statusOf(idx,id)))}
  if(p==='/api/guilds')return json(res,200,{guilds:meta.guildList(url.searchParams.get('q'))});
  const m=p.match(/^\/api\/act\/(\w+)$/);
  if(m&&req.method==='POST'){
    if(inMatch(prof.id)&&['equip','tree','cls','skin','prof','buildLoad','tactic'].includes(m[1]))throw new HttpError(409,'Během zápasu sestavu měnit nejde.');
    const gid=prof.guild,{notify,noteTo,...out}=meta.act(prof,m[1],body);
    if(notify)guildChanged([...notify,prof.id],gid,noteTo);
    return json(res,200,out);
  }
  throw new HttpError(404,'Neznámá adresa.');
}

const server=http.createServer(async(req,res)=>{
  // a malformed address (e.g. /%E0) must not throw: an unhandled rejection here would take the whole server down
  let url,p;try{url=new URL(req.url,'http://x');p=decodeURIComponent(url.pathname)}catch{res.writeHead(400);return res.end()}
  if(p.startsWith('/api/')){try{await api(req,res,p,url)}catch(e){if(!(e instanceof HttpError))console.error(e);json(res,e.status||500,{error:e instanceof HttpError?e.message:'Chyba serveru.'})}return}
  if(p==='/healthz'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('ok')}
  if(p==='/')p='/index.html';
  const f=path.normalize(path.join(PUB,p));
  if(!f.startsWith(PUB+path.sep)){res.writeHead(403);return res.end()}
  if(p.includes('\0')){res.writeHead(400);return res.end()}
  try{const data=await readFile(f);res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)}
  catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Nenalezeno')}
});

// ---------- rooms ----------
const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
const rooms=new Map();
let nextCid=1;

const cleanName=s=>String(s||'').replace(/[<>&"'`\u0000-\u001f]/g,'').trim().slice(0,16)||'Host';
const send=(c,m)=>{if(c.ws.readyState===1)c.ws.send(typeof m==='string'?m:JSON.stringify(m))};
const humans=room=>[...room.clients.values()];
const maxPlayers=room=>S.MODES[room.mode].max;
const QUICK_WAIT=20000; // a quick-play room starts on its own after this, the rest is filled with bots
const RANKED_WAIT=12000; // a ranked room with an opponent starts this long after the last player joined (at once when full)
function publicRooms(){
  return [...rooms.values()].filter(r=>r.pub&&!r.solo&&!r.mission).map(r=>({code:r.code,mode:r.mode,map:r.map,boss:r.boss,diff:r.diff,state:r.state,
    players:r.clients.size,max:maxPlayers(r),host:r.clients.get(r.host)?.name||'',quick:!!r.quick,ranked:!!r.ranked})).sort((a,b)=>(a.state==='lobby'?0:1)-(b.state==='lobby'?0:1)||b.players-a.players).slice(0,30);
}
function inMatch(pid){for(const r of rooms.values())if(r.match&&r.match.state!=='end')for(const c of r.clients.values())if(c.profile?.id===pid&&c.unitId)return true;return false}
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ';let c;do{c=Array.from({length:4},()=>A[Math.floor(Math.random()*A.length)]).join('')}while(rooms.has(c));return c}
function teamCounts(room){const n=[0,0];for(const c of room.clients.values())n[c.team]++;return n}
const loadOf=c=>c.profile?meta.loadoutFor(c.profile,c.cls):null;

function lobbyMsg(room,c){
  return{type:'lobby',code:room.code,you:c.cid,host:room.host,state:room.state,diff:room.diff,mode:room.mode,map:room.map,boss:room.boss,solo:!!room.solo,mission:room.mission||null,
    pub:!!room.pub,ranked:!!room.ranked,
    autoIn:room.quick&&room.state==='lobby'&&!(room.ranked&&room.clients.size<2)?Math.max(0,Math.ceil((room.autoAt-Date.now())/1000)):0,
    players:humans(room).map(x=>({cid:x.cid,name:x.name,cls:x.cls,team:x.team,lv:x.profile?.level||0,tag:x.profile?meta.tagOf(x.profile.id):null,rt:room.ranked?x.profile?.ranked?.rating??null:null}))};
}
function broadcastLobby(room){for(const c of room.clients.values())send(c,lobbyMsg(room,c))}
function broadcast(room,m){const s=JSON.stringify(m);for(const c of room.clients.values())send(c,s)}
function sendRoster(room){room.rosterVer=room.match.rosterVer;broadcast(room,{type:'roster',units:S.roster(room.match),info:S.matchInfo(room.match)})}

// ---------- friends, presence and chat ----------
// The hub keeps a second, "social" connection open for as long as the player is signed in. It carries the friend list
// with live status, world chat, private messages and invites. Room chat goes over the game connection.
const socials=new Map(); // profile id -> Set of social connections
const worldLog=[];        // last world chat messages, sent to everyone who connects
const dmLog=new Map();    // "idA|idB" -> last private messages of two friends (kept while the server runs)
const WORLD_KEEP=60,DM_KEEP=40,ROOM_KEEP=30;
const dmKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function roomOf(pid){for(const r of rooms.values())for(const c of r.clients.values())if(c.profile?.id===pid)return r;return null}
function presenceIndex(){const idx=new Map();for(const r of rooms.values())for(const c of r.clients.values())if(c.profile)idx.set(c.profile.id,r);return idx}
function statusOf(idx,pid){
  const r=idx.get(pid);
  if(r){const open=!r.solo&&!r.ranked&&r.clients.size<maxPlayers(r)&&!(r.match&&r.match.state==='end');
    return{st:r.state==='match'?'match':'lobby',mode:r.mode,mission:r.mission||null,ranked:!!r.ranked,solo:!!r.solo,code:open?r.code:null,n:r.clients.size,max:maxPlayers(r)}}
  return{st:socials.get(pid)?.size?'online':'offline'};
}
function pushFriends(pid,idx=presenceIndex()){
  const set=socials.get(pid),p=set?.size&&meta.profById(pid);if(!p)return;
  const s=JSON.stringify({type:'friends',...meta.friendsView(p,id=>statusOf(idx,id))});
  for(const c of set)if(c.lastFriends!==s){c.lastFriends=s;send(c,s)}
}
// status changes (joining a room, a match starting, going offline) reach friends within two seconds
setInterval(()=>{const idx=presenceIndex();for(const pid of socials.keys())pushFriends(pid,idx)},2000).unref();
const note=(c,msg,bad)=>send(c,{type:'note',msg,bad:!!bad});
// at most 5 messages in 6 s per connection, and the same text not twice in a row within 4 s
function chatOk(c,text){
  const now=Date.now();c.chatT=(c.chatT||[]).filter(t=>now-t<6000);
  if(c.chatT.length>=5){note(c,'Píšeš moc rychle, chvíli počkej.',true);return false}
  if(c.lastText===text&&now-c.lastTextAt<4000)return false;
  c.chatT.push(now);c.lastText=text;c.lastTextAt=now;return true;
}
const pushLog=(arr,m,keep)=>{arr.push(m);if(arr.length>keep)arr.shift()};
// guild chat lives in memory per guild; a guild change tells the affected players to refresh their Klan screen and chat tab
const guildLog=new Map(),GUILD_KEEP=60;
function guildInfo(pid){const p=meta.profById(pid),gid=p?.guild||null;return{type:'guildHist',gid,tag:gid?meta.tagOf(pid):null,list:gid?(guildLog.get(gid)||[]).filter(x=>!meta.blocks(p,{id:x.pid})):[]}}
function guildChanged(pids,oldGid,noteTo){
  if(oldGid&&!meta.guildMembers(oldGid).length)guildLog.delete(oldGid);
  for(const pid of new Set(pids)){const set=socials.get(pid);if(!set)continue;const info=guildInfo(pid);
    for(const x of set){send(x,{type:'guildUpd'});send(x,info);if(noteTo?.pid===pid)note(x,noteTo.msg)}}
}
function onSocial(c,m){
  const p=c.profile;
  switch(m.type){
    case 'fr':{
      let ids;try{ids=meta.friendOp(p,String(m.op||''),typeof m.arg==='string'?m.arg.slice(0,40):'')}catch(e){if(!(e instanceof HttpError))throw e;return note(c,e.message,true)}
      const idx=presenceIndex();for(const id of ids)pushFriends(id,idx);
      const o=ids[1]&&meta.profById(ids[1]);
      if(m.op==='add'&&o){if(p.social.friends.includes(o.id))note(c,`${o.nick} je teď tvůj přítel.`);else{note(c,`Žádost odeslána hráči ${o.nick}.`);
        for(const x of socials.get(o.id)||[])if(o.social.inReq.includes(p.id))send(x,{type:'note',msg:`${p.nick} ti poslal žádost o přátelství.`})}}
      if(m.op==='accept'&&o)for(const x of socials.get(o.id)||[])send(x,{type:'note',msg:`${p.nick} přijal tvou žádost o přátelství.`});
      break}
    case 'say':{
      const text=S.cleanChat(m.text);if(!text)return;
      const o=m.ch==='dm'?meta.profById(m.to):null;
      if(m.ch==='dm'&&(!o||!meta.isFriend(p,o)))return note(c,'Soukromé zprávy jdou posílat jen přátelům.',true);
      if(!chatOk(c,text))return;
      if(m.ch==='world'){
        const msg={type:'chat',ch:'world',from:p.nick,pid:p.id,lv:p.level,tag:meta.tagOf(p.id),text,t:Date.now()};pushLog(worldLog,msg,WORLD_KEEP);
        const s=JSON.stringify(msg);for(const set of socials.values())for(const x of set)if(!meta.blocks(x.profile,p))send(x,s);
      }else if(m.ch==='guild'){
        const gid=p.guild,ids=meta.guildMembers(gid);if(!ids.includes(p.id))return note(c,'Nejsi v žádném klanu.',true);
        const msg={type:'chat',ch:'guild',from:p.nick,pid:p.id,lv:p.level,text,t:Date.now()};
        if(!guildLog.has(gid))guildLog.set(gid,[]);pushLog(guildLog.get(gid),msg,GUILD_KEEP);
        const s=JSON.stringify(msg);for(const id of ids)for(const x of socials.get(id)||[])if(!meta.blocks(x.profile,p))send(x,s);
      }else if(m.ch==='dm'){
        const msg={type:'chat',ch:'dm',from:p.nick,pid:p.id,text,t:Date.now()},k=dmKey(p.id,o.id);
        if(!dmLog.has(k))dmLog.set(k,[]);pushLog(dmLog.get(k),msg,DM_KEEP);
        for(const x of socials.get(p.id)||[])send(x,{...msg,with:o.id});
        if(!meta.blocks(o,p))for(const x of socials.get(o.id)||[])send(x,{...msg,with:p.id});
        if(!socials.get(o.id)?.size)note(c,`${o.nick} není online. Zprávu uvidí, až se připojí.`);
      }
      break}
    case 'invite':{
      const o=meta.profById(m.to);if(!o||!meta.isFriend(p,o))return note(c,'Zvát můžeš jen přátele.',true);
      const r=roomOf(p.id);
      if(!r)return note(c,'Nejdřív založ místnost nebo se do nějaké připoj.',true);
      if(r.solo||r.ranked)return note(c,r.ranked?'Do hodnocené hry zvát nejde.':'Do sólo hry zvát nejde.',true);
      if(r.clients.size>=maxPlayers(r))return note(c,'Místnost je plná.',true);
      if(!socials.get(o.id)?.size)return note(c,`${o.nick} není online.`,true);
      const now=Date.now();c.invT??={};if(now-(c.invT[o.id]||0)<5000)return;c.invT[o.id]=now;
      if(!meta.blocks(o,p))for(const x of socials.get(o.id))send(x,{type:'invite',from:p.nick,pid:p.id,code:r.code,mode:r.mode,mission:r.mission||null,state:r.state});
      note(c,`Pozvánka odeslána hráči ${o.nick}.`);break}
  }
}
function roomSay(c,m){
  const room=c.room;if(!room||room.solo)return;
  const text=S.cleanChat(m.text);if(!text||!chatOk(c,text))return;
  const team=!!m.team&&S.MODES[room.mode].pvp;
  const msg={type:'chat',ch:'room',from:c.name,pid:c.profile?.id||null,tag:c.profile?meta.tagOf(c.profile.id):null,cid:c.cid,tm:c.team,team,text,t:Date.now()};
  if(!team)pushLog(room.chat??=[],msg,ROOM_KEEP);
  const s=JSON.stringify(msg);
  for(const x of room.clients.values())if((!team||x.team===c.team)&&!meta.blocks(x.profile,c.profile))send(x,s);
}

function startMatch(room){
  const pvp=S.MODES[room.mode].pvp;
  if(room.ranked){
    // balanced teams: from the highest rating down, each player goes to the side with the lower rating total that still has room
    const size=S.teamSize(room.mode),sum=[0,0],n=[0,0];
    for(const c of humans(room).sort((a,b)=>(b.profile?.ranked?.rating??0)-(a.profile?.ranked?.rating??0))){
      const r=c.profile?.ranked?.rating??S.RATING_START,t=n[0]>=size?1:n[1]>=size?0:sum[0]<=sum[1]?0:1;c.team=t;n[t]++;sum[t]+=r}
  }else if(pvp){const n=teamCounts(room);for(const c of humans(room)){if(n[c.team]>S.teamSize(room.mode)){n[c.team]--;c.team=1-c.team;n[c.team]++}}}
  else for(const c of humans(room))c.team=0;
  room.rankedEntries=room.ranked?humans(room).filter(c=>c.profile).map(c=>({pid:c.profile.id,team:c.team,cid:c.cid})):null;
  const ms=room.mission==='echo'?{...S.echoOfWeek(S.weekKey()),mode:'boss'}:S.missionById(room.mission);
  const M=S.createMatch(ms?{mode:ms.mode,map:ms.map,boss:ms.boss,last:ms.waves,waveBoss:ms.waveBoss,mods:ms.mods,mission:room.mission,diff:room.diff}
    :{mode:room.mode,map:room.map,diff:room.diff,boss:room.boss});
  if(MATCH_SECONDS&&!M.D.waves)M.timeLeft=MATCH_SECONDS;
  const names=[...S.BOT_NAMES].sort(()=>Math.random()-.5);
  for(const team of pvp?[0,1]:[0]){
    const hs=humans(room).filter(c=>c.team===team),size=S.teamSize(room.mode);
    for(const c of hs){const u=S.addUnit(M,c.cls,team,'human',c.name,loadOf(c));u.joinedAt=0;c.unitId=u.id}
    const used=hs.map(c=>c.cls);
    for(let i=hs.length;i<size;i++){const k=S.CLASS_KEYS.find(x=>!used.includes(x))||S.CLASS_KEYS[i%3];used.push(k);S.addUnit(M,k,team,'bot',names.pop())}
  }
  S.startMatch(M);
  room.match=M;room.state='match';room.endSent=false;room.tick=0;
  broadcastLobby(room);sendRoster(room);
}
function joinMatch(room,c){
  // a late joiner replaces a bot hero on the weaker team
  const M=room.match,pvp=M.D.pvp,n=teamCounts(room);n[c.team]--;
  const order=pvp?(n[0]<=n[1]?[0,1]:[1,0]):[0];
  for(const team of order){const b=M.units.find(x=>x.kind==='hero'&&x.ctrl==='bot'&&x.team===team);
    if(b){b.remove=true;const u=S.addUnit(M,c.cls,team,'human',c.name,loadOf(c));u.joinedAt=M.time;c.team=team;c.unitId=u.id;return true}}
  return false;
}
function leave(c){
  const room=c.room;if(!room)return;
  room.clients.delete(c.cid);c.room=null;
  if(room.match){const u=room.match.units.find(x=>x.id===c.unitId);if(u){u.ctrl='bot';u.name=c.name+' (bot)';u.queue=[];u.bag=[];room.match.rosterVer++}}
  c.unitId=0;
  if(!room.clients.size){rooms.delete(room.code);return}
  if(room.host===c.cid)room.host=room.clients.keys().next().value;
  broadcastLobby(room);
}
function finishMatch(room){
  const M=room.match;room.endSent=true;
  const stats=S.stats(M),pvp=M.D.pvp,mvp=[...stats].sort((a,b)=>S.mvpScore(b,pvp)-S.mvpScore(a,pvp))[0]?.i||0;
  broadcast(room,{type:'end',winner:M.winner,score:M.score,stats,wave:M.wave,mode:M.mode,log:M.log,mvp});
  // ranked: everyone who started is rated, including those who left (they lose); present = still controlling their hero
  let rk=null;
  if(room.rankedEntries){
    const present=e=>{const c=room.clients.get(e.cid);return!!(c&&c.profile?.id===e.pid&&M.units.some(x=>x.id===c.unitId&&x.ctrl==='human'))};
    rk=meta.rankedResult(M,room.rankedEntries.map(e=>({...e,present:present(e)})));room.rankedEntries=null;
  }
  for(const c of room.clients.values()){
    const u=M.units.find(x=>x.id===c.unitId&&x.ctrl==='human');if(!u)continue;
    if(!c.profile){send(c,{type:'rewards',guest:true});continue}
    const loot=M.loot.filter(L=>L.owner===u.id).map(L=>L.item);
    const mine=rk&&!rk.none?rk[c.profile.id]||null:null;
    const r=meta.rewardsFor(M,u,c.profile,loot,u.id===mvp,mine?mine.delta:null);
    send(c,{type:'rewards',...r,ranked:mine,rankedNone:rk?.none||null,profile:meta.view(c.profile)});
  }
  setTimeout(()=>{if(room.match!==M)return;room.match=null;room.state='lobby';room.autoAt=Date.now()+QUICK_WAIT;for(const c of room.clients.values())c.unitId=0;broadcastLobby(room)},room.solo?4000:END_LINGER);
}

wss.on('connection',(ws)=>{
  // a client is dropped after 10 s without a pong, so a short network hiccup on mobile does not kick the player
  const c={ws,cid:nextCid++,name:'Host',cls:'striker',team:0,room:null,unitId:0,alive:true,missed:0,msgs:0,profile:null};
  ws.on('pong',()=>c.alive=true);
  // an oversized or malformed frame raises an 'error' on the socket; without a handler it would take the whole server down
  ws.on('error',()=>{try{ws.terminate()}catch{}});
  ws.on('message',(buf)=>{
    if(++c.msgs>120)return; // per-second budget, reset by the heartbeat
    let m;try{m=JSON.parse(buf)}catch{return}
    if(!m||typeof m!=='object')return;
    // a thrown error in one message must not crash the server for everyone
    try{onMessage(c,m)}catch(e){console.error('Chyba při zpracování zprávy',m.type,e)}
  });
  ws.on('close',()=>{leave(c);if(c.social){const set=socials.get(c.profile.id);set?.delete(c);if(set&&!set.size)socials.delete(c.profile.id)}});
  c.hb=setInterval(()=>{if(!c.alive){if(++c.missed>=10){ws.terminate();return}}else c.missed=0;c.alive=false;c.msgs=0;try{ws.ping()}catch{}},1000);
  ws.on('close',()=>clearInterval(c.hb));
});

function onMessage(c,m){
    const room=c.room;
    if(c.social)return onSocial(c,m);
    switch(m.type){
      case 'social':{
        // the hub's social connection: one per tab, signed in only, never joins a room
        if(room)return;
        const p=meta.auth(m.token);if(!p)return send(c,{type:'social',ok:false});
        c.social=true;c.profile=p;c.name=p.nick;
        if(!socials.has(p.id))socials.set(p.id,new Set());socials.get(p.id).add(c);
        const dms={};for(const [k,list] of dmLog){const [a,b]=k.split('|'),o=a===p.id?b:b===p.id?a:null;if(o&&p.social.friends.includes(o))dms[o]=list}
        send(c,{type:'social',ok:true,me:p.id,world:worldLog.filter(x=>!meta.blocks(p,{id:x.pid})),dms});
        send(c,guildInfo(p.id));pushFriends(p.id);break}
      case 'say':if(m.ch==='room')roomSay(c,m);break;
      case 'hello':{
        if(room)leave(c);
        c.profile=meta.auth(m.token);
        c.name=c.profile?c.profile.nick:cleanName(m.name)+' (host)';
        c.cls=S.CLASSES[m.cls]?m.cls:(c.profile?.cls||'striker');
        if(c.profile&&c.profile.cls!==c.cls){c.profile.cls=c.cls;db.touch()}
        let r;
        if(m.ranked){
          // ranked queue: only accounts, only lobby rooms (no late joins), the closest average rating first
          if(!c.profile)return send(c,{type:'error',msg:'Hodnocená hra je jen pro hráče s účtem.'});
          const mode=S.RANKED_MODES.includes(m.mode)?m.mode:'duel',my=c.profile.ranked?.rating??S.RATING_START;
          const avg=x=>{const rs=humans(x).map(h=>h.profile?.ranked?.rating??S.RATING_START);return rs.reduce((a,b)=>a+b,0)/(rs.length||1)};
          r=[...rooms.values()].filter(x=>x.ranked&&x.mode===mode&&x.state==='lobby'&&x.clients.size<maxPlayers(x)&&!humans(x).some(h=>h.profile?.id===c.profile.id))
            .sort((a,b)=>Math.abs(avg(a)-my)-Math.abs(avg(b)-my)||b.clients.size-a.clients.size)[0];
          if(!r){r={code:newCode(),host:c.cid,clients:new Map(),state:'lobby',diff:'normal',mode,mission:null,map:S.MODES[mode].maps[Math.floor(Math.random()*S.MODES[mode].maps.length)],
            boss:'collector',match:null,solo:false,pub:true,quick:true,ranked:true,autoAt:Date.now()+RANKED_WAIT};rooms.set(r.code,r)}
        }else if(m.quick){
          // quick play: the fullest open public room of this mode, otherwise a new public one that starts by itself
          const mode=S.MODES[m.mode]?m.mode:'arena';
          r=[...rooms.values()].filter(x=>x.pub&&x.quick&&!x.ranked&&!x.solo&&x.mode===mode&&x.clients.size<maxPlayers(x)&&!(x.match&&x.match.state==='end'))
            .sort((a,b)=>(a.state==='lobby'?0:1)-(b.state==='lobby'?0:1)||b.clients.size-a.clients.size)[0];
          if(!r){r={code:newCode(),host:c.cid,clients:new Map(),state:'lobby',diff:S.DIFF[m.diff]?m.diff:'normal',mode,mission:null,map:S.MODES[mode].maps[Math.floor(Math.random()*S.MODES[mode].maps.length)],
            boss:S.BOSS_KEYS[Math.floor(Math.random()*S.BOSS_KEYS.length)],match:null,solo:false,pub:true,quick:true,autoAt:Date.now()+QUICK_WAIT};rooms.set(r.code,r)}
        }else if(m.create){
          let mode=S.MODES[m.mode]?m.mode:'arena',mission=null,map=m.map,boss=m.boss;
          if(m.mission){const err=meta.canStartMission(c.profile,m.mission);if(err)return send(c,{type:'error',msg:err});
            mission=m.mission;const ms=mission==='echo'?{...S.echoOfWeek(S.weekKey()),mode:'boss'}:S.missionById(mission);mode=ms.mode;map=ms.map;boss=ms.boss||ms.waveBoss}
          r={code:newCode(),host:c.cid,clients:new Map(),state:'lobby',diff:S.DIFF[m.diff]?m.diff:'normal',mode,mission,
            map:S.MODES[mode].maps.includes(map)?map:S.MODES[mode].maps[0],boss:S.BOSSES[boss]?boss:'collector',match:null,solo:!!m.solo,pub:!!m.pub&&!m.solo&&!mission};
          rooms.set(r.code,r);
        }else{r=rooms.get(String(m.room||'').toUpperCase().trim());
          if(!r)return send(c,{type:'error',msg:'Místnost s tímto kódem neexistuje.'});
          if(r.solo)return send(c,{type:'error',msg:'Do sólo hry se připojit nejde.'});
          if(r.ranked){if(!c.profile)return send(c,{type:'error',msg:'Hodnocená hra je jen pro hráče s účtem.'});
            if(r.state!=='lobby')return send(c,{type:'error',msg:'Hodnocený zápas už běží, připojit se nejde.'});
            if(humans(r).some(h=>h.profile?.id===c.profile.id))return send(c,{type:'error',msg:'Tímto účtem už v místnosti jsi.'})}
          if(r.clients.size>=maxPlayers(r))return send(c,{type:'error',msg:`Místnost je plná (${maxPlayers(r)} hráčů).`})}
        const n=teamCounts(r);c.team=S.MODES[r.mode].pvp&&n[1]<n[0]?1:0;
        r.clients.set(c.cid,c);c.room=r;
        if(r.chat?.length)send(c,{type:'chatHist',list:r.chat.filter(x=>!meta.blocks(c.profile,{id:x.pid}))});
        if(r.ranked&&r.clients.size>=2)r.autoAt=Date.now()+RANKED_WAIT;
        if(r.state==='match'&&r.match&&r.match.state!=='end'){if(joinMatch(r,c)){broadcastLobby(r);sendRoster(r)}}
        else if(r.solo)startMatch(r);
        else broadcastLobby(r);
        break}
      case 'cls':if(room&&room.state==='lobby'&&S.CLASSES[m.cls]){c.cls=m.cls;if(c.profile){c.profile.cls=m.cls;db.touch()}broadcastLobby(room)}break;
      case 'team':if(room&&room.state==='lobby'&&!room.ranked&&S.MODES[room.mode].pvp&&(m.team===0||m.team===1)&&teamCounts(room)[m.team]<S.teamSize(room.mode)){c.team=m.team;broadcastLobby(room)}break;
      case 'cfg':{
        if(!room||room.host!==c.cid||room.state!=='lobby'||room.ranked)break;
        if(room.mission||room.quick){if(S.DIFF[m.diff])room.diff=m.diff;broadcastLobby(room);break}
        if(S.MODES[m.mode]&&m.mode!==room.mode){
          if(room.clients.size>S.MODES[m.mode].max){send(c,{type:'error',msg:`Režim ${S.MODES[m.mode].name} je nejvýš pro ${S.MODES[m.mode].max} hráče.`});break}
          room.mode=m.mode;if(!S.MODES[m.mode].maps.includes(room.map))room.map=S.MODES[m.mode].maps[0];
          if(!S.MODES[m.mode].pvp)for(const x of room.clients.values())x.team=0;
        }
        if(S.MODES[room.mode].maps.includes(m.map))room.map=m.map;
        if(S.BOSSES[m.boss])room.boss=m.boss;
        if(S.DIFF[m.diff])room.diff=m.diff;
        broadcastLobby(room);break}
      case 'start':if(room&&(room.host===c.cid||room.quick)&&room.state==='lobby'&&!(room.ranked&&room.clients.size<2))startMatch(room);break;
      case 'input':{
        if(!room||!room.match)return;
        const u=room.match.units.find(x=>x.id===c.unitId);if(!u||u.ctrl!=='human')return;
        const num=(v,l)=>Number.isFinite(+v)?Math.max(-l,Math.min(l,+v)):0;
        S.queueInput(u,{seq:num(m.seq,1e9)|0,mx:num(m.mx,1),mz:num(m.mz,1),ax:num(m.ax,60),az:num(m.az,60),atk:!!m.atk,fm:!!m.fm,vt:num(m.vt,1e6),
          cast:Array.isArray(m.cast)?m.cast.slice(0,4).map(x=>x|0).filter(x=>x>=0&&x<=4):[]});
        break}
      case 'ping':send(c,{type:'pong',t:m.t});break;
      case 'leave':leave(c);send(c,{type:'left'});break;
    }
}

// fixed-step loop for every running match
let last=performance.now(),acc=0;
setInterval(()=>{
  const now=performance.now();acc+=Math.min(250,now-last);last=now;
  while(acc>=S.TICK*1000){acc-=S.TICK*1000;
    for(const room of rooms.values()){
      const M=room.match;if(room.state!=='match'||!M)continue;
      try{
        S.step(M);room.tick++;
        if(M.rosterVer!==room.rosterVer)sendRoster(room);
        const ev=M.events;M.events=[];
        for(const c of room.clients.values())send(c,S.snapshotFor(M,c.unitId,ev));
        if(room.tick%30===0)broadcast(room,{type:'stats',stats:S.stats(M)});
        if(M.state==='end'&&!room.endSent)finishMatch(room);
      }catch(e){
        // a bug in one match ends only that match (as a draw, without rewards), the others keep running
        console.error('Chyba v zápase',room.code,M.mode,e);
        if(M.state!=='end'){M.state='end';M.winner=-1}
        if(!room.endSent){room.endSent=true;broadcast(room,{type:'error',msg:'Zápas skončil kvůli chybě serveru.'});
          setTimeout(()=>{if(room.match!==M)return;room.match=null;room.state='lobby';room.autoAt=Date.now()+QUICK_WAIT;for(const c of room.clients.values())c.unitId=0;broadcastLobby(room)},2000)}
      }
    }
  }
},1000/60);

// quick-play rooms count down in the lobby and start on their own
setInterval(()=>{const now=Date.now();
  for(const r of rooms.values())if(r.quick&&r.state==='lobby'&&r.clients.size){
    // a ranked room waits for at least one opponent; with bots alone the match would not count
    if(r.ranked&&r.clients.size<2){broadcastLobby(r);continue}
    if(now>=r.autoAt||r.clients.size>=maxPlayers(r))startMatch(r);else broadcastLobby(r)}
},1000).unref();

server.listen(PORT,()=>console.log(`Relikvie Aréna běží na http://localhost:${PORT}`));

process.on('unhandledRejection',e=>console.error('Neošetřená chyba:',e));

// hosts stop the old instance with SIGTERM on every deploy; save data and close sockets cleanly
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{
  for(const c of wss.clients)c.close(1012,'Server se restartuje');
  await db.flush();
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(0),3000).unref();
});
