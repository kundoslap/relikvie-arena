// Accounts, profiles, inventory, rewards and the player market. All state lives in db.doc.
import {scrypt,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import * as D from './public/data.js';

const scryptAsync=promisify(scrypt);
const sha=t=>createHash('sha256').update(String(t)).digest('hex');
const NICK_RE=/^[\p{L}\p{N} _.\-]{3,16}$/u;
const LISTING_DAYS=7;

export class HttpError extends Error{constructor(status,msg){super(msg);this.status=status}}
const fail=(msg,status=400)=>{throw new HttpError(status,msg)};

export function createMeta(db,{admins=''}={}){
  const doc=db.doc;doc.guilds??={};doc.reports??={};doc.modlog??=[];
  // moderators are named by nick in the ADMIN_NICKS environment variable, never stored in the data
  const ADMINS=new Set(String(admins).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
  const tokenIndex=new Map();
  for(const u of Object.values(doc.users))for(const t of u.tokens||[])tokenIndex.set(t,u.id);

  function newProfile(id,nick){
    const inv=D.SLOT_KEYS.map(slot=>D.rollItem(1,{slot,maxR:0}));
    return migrate({id,nick,level:1,xp:0,credits:200,cls:'striker',inv,eq:Object.fromEntries(inv.map(i=>[i.slot,i.id])),tree:{},skins:[],skin:{},
      stats:{matches:0,wins:0,losses:0,kills:0,npcKills:0,bossKills:0,bestWave:0,bestEndless:0},created:Date.now()});
  }
  // fills in fields added in later versions, so old saves keep working
  function migrate(p){
    p.prof??={};p.titles??=[];p.title??=null;
    p.campaign??={};const c=p.campaign;c.cleared??=[];c.shards??={};c.week??=null;c.weekWins??=0;c.weekClaimed??=false;c.echoWon??=false;
    p.goals??={day:null,list:[],rerolled:false,bonus:false,week:null,weekly:null};
    p.merchant??={day:null,offers:[],rerolled:false};p.tactic??='dodge';p.builds??=[];p.history??=[];
    p.ranked??={season:null,rating:D.RATING_START,games:0,wins:0,losses:0,peak:D.RATING_START};p.rankedPrev??=null;
    p.social??={friends:[],inReq:[],outReq:[],blocked:[]};p.social.recent??=[];
    p.mod??={muteUntil:0,banUntil:0,warns:0,banNote:''};
    p.essence??=0;p.frags??=0;p.crystals??={};p.mastery??={};
    p.guild??=null;p.guildInv??=[];p.guildWeek??=null;p.pass??={season:null,xp:0,claimed:[]};p.login??={last:null,streak:0};
    // a disbanded guild, or a membership that was removed while the save was elsewhere
    if(p.guild&&!isMember(guildById(p.guild),p.id))p.guild=null;
    // repairs saves damaged by the old "constructor" lookups (NaN credits, empty items, unknown class)
    if(!Number.isFinite(p.credits))p.credits=0;if(p.inv.some(i=>!i||!i.id))p.inv=p.inv.filter(i=>i&&i.id);if(!D.CLASSES[p.cls])p.cls='striker';
    const st=p.stats;st.bestEndless??=0;st.byCls??={};st.byMode??={};st.byBoss??={};st.dmg??=0;st.heal??=0;st.time??=0;st.mvp??=0;
    // achievement counters; the ranked ones start from the current season so existing players keep their progress
    st.relics??=0;st.legendary??=0;st.sold??=0;st.rankedGames??=p.ranked.games|0;st.rankedWins??=p.ranked.wins|0;
    st.bestDiv??=p.ranked.games>0?D.divisionOf(p.ranked.peak):0;p.ach??={};
    return p;
  }
  function rollGoals(p){
    const G=p.goals,day=D.dayKey(),wk=D.weekKey();
    if(G.day!==day){const keys=Object.keys(D.GOALS).sort(()=>Math.random()-.5).slice(0,D.DAILY_COUNT);G.day=day;G.list=keys.map(id=>({id,prog:0,claimed:false}));G.rerolled=false;G.bonus=false}
    if(G.week!==wk){const keys=Object.keys(D.WEEKLY_GOALS);G.week=wk;G.weekly={id:keys[Math.floor(Math.random()*keys.length)],prog:0,claimed:false}}
    const c=p.campaign;if(c.week!==wk){c.week=wk;c.weekWins=0;c.weekClaimed=false;c.echoWon=false}
    if(p.merchant.day!==day){p.merchant={day,offers:merchantOffers(p),rerolled:false}}
    rollSeason(p);rollPass(p);
  }
  // ---------- season pass ----------
  // a new month starts a new pass; tiers reached but not claimed are paid out automatically (a skin of your current class)
  function rollPass(p){
    const P=p.pass,key=D.seasonKey();if(P.season===key)return;
    let auto=0;
    if(P.season)for(let n=1;n<=D.passTier(P.xp);n++)if(!P.claimed.includes(n))try{passClaim(p,n,p.cls);auto++}catch{}
    p.pass={season:key,xp:0,claimed:[],auto:auto?{season:P.season,n:auto}:null};
  }
  // which day of the login cycle is next and whether it can be claimed today
  function loginState(p){
    const L=p.login,today=D.dayKey(),n=D.LOGIN_DAYS.length;
    if(L.last===today)return{can:false,day:L.streak,claimed:L.streak,next:L.streak%n+1};
    const day=L.last===D.prevDay(today)?L.streak%n+1:1;
    return{can:true,day,claimed:day-1,next:day,broken:!!L.last&&L.last!==D.prevDay(today)&&L.streak>0};
  }
  function passGain(p,xp){rollPass(p);const before=D.passTier(p.pass.xp);p.pass.xp+=Math.max(0,Math.round(xp));return{gain:Math.round(xp),tier:D.passTier(p.pass.xp),before}}
  const passSkins=()=>D.CLASS_KEYS.map(k=>[k,D.SKINS[k].find(s=>s.req?.pass)]).filter(x=>x[1]);
  function passClaim(p,n,cls){
    const P=p.pass;n=Number(n);
    if(!Number.isInteger(n)||n<1||n>D.PASS.tiers)fail('Neznámý stupeň průkazu.');
    if(D.passTier(P.xp)<n)fail('Tento stupeň ještě nemáš.');if(P.claimed.includes(n))fail('Odměnu už máš.');
    const R=D.PASS_REWARDS[n-1],out={credits:R.credits||0,item:null,skins:[],title:null};
    if(R.minR!=null&&p.inv.length>=D.INV_MAX)fail('Inventář je plný. Uvolni místo pro implantát.');
    if(R.skin==='pick'){
      const s=D.SKINS[cls]?.find(x=>x.req?.pass);if(!s)fail('Vyber povolání pro vzhled.');
      if(D.skinOwned(p,cls,s.k)){if(passSkins().some(([k,x])=>!D.skinOwned(p,k,x.k)))fail('Tento vzhled už máš, vyber jiné povolání.');out.credits+=600}
      else{p.skins.push(cls+':'+s.k);out.skins.push(s.name)}
    }
    if(R.skin==='all'){const left=passSkins().filter(([k,x])=>!D.skinOwned(p,k,x.k));for(const [k,x] of left){p.skins.push(k+':'+x.k);out.skins.push(x.name)}if(!left.length)out.credits+=600}
    if(R.minR!=null){out.item=D.rollItem(p.level,{minR:R.minR,boost:.3});p.inv.push(out.item)}
    if(R.title&&!p.titles.includes(R.title)){p.titles.push(R.title);out.title=R.title}
    p.credits+=out.credits;P.claimed.push(n);return out;
  }
  // a new month starts a new season: the rating is softened and the best division of the old one waits as a reward
  function rollSeason(p){
    const R=p.ranked,now=D.seasonKey();if(R.season===now)return;
    if(R.season&&R.games>0)p.rankedPrev={season:R.season,div:D.divisionOf(R.peak),rating:R.rating,games:R.games,claimed:false};
    const r=R.season?D.softReset(R.rating):D.RATING_START;
    p.ranked={season:now,rating:r,games:0,wins:0,losses:0,peak:r};
  }
  // three slot-specific offers of rare or better, plus one epic-or-better special
  function merchantOffers(p){
    return [...D.SLOT_KEYS.map(slot=>D.rollItem(p.level,{slot,minR:2,boost:.3})),D.rollItem(p.level,{minR:3,boost:.3})]
      .map(item=>({item,price:Math.max(150,Math.round(D.itemValue(item)*D.MERCHANT.markup/10)*10),sold:false}));
  }
  function grantXp(p,xp){const ups=[];p.xp+=xp;
    while(p.level<D.MAX_LEVEL&&p.xp>=D.xpFor(p.level)){p.xp-=D.xpFor(p.level);p.level++;p.credits+=25*p.level;ups.push(p.level)}
    if(p.level>=D.MAX_LEVEL)p.xp=0;return ups}
  const missionOpen=(p,m)=>{const i=D.MISSIONS.indexOf(m);return p.level>=m.level&&(i===0||p.campaign.cleared.includes(D.MISSIONS[i-1].id))};
  const echoOpen=p=>p.campaign.cleared.includes('m8');
  // checks whether a player may start a campaign mission; returns an error message or null
  function canStartMission(p,id){
    if(!p)return'Kampaň hraješ jen s účtem.';
    migrate(p);rollGoals(p);
    if(id==='echo')return echoOpen(p)?null:'Ozvěna jádra se odemkne po dokončení celé kampaně.';
    const m=D.missionById(id);if(!m)return'Neznámá mise.';
    return missionOpen(p,m)?null:`Mise se odemkne na úrovni ${m.level} po dokončení předchozí mise.`;
  }
  function issueToken(user){
    const token=randomBytes(32).toString('hex'),h=sha(token);
    user.tokens=[...(user.tokens||[]),h].slice(-5);
    for(const [k,v] of tokenIndex)if(v===user.id&&!user.tokens.includes(k))tokenIndex.delete(k);
    tokenIndex.set(h,user.id);db.touch();return token;
  }
  async function hashPass(pass,salt){return (await scryptAsync(String(pass),salt,64)).toString('hex')}

  async function register(nick,pass){
    nick=String(nick||'').trim();pass=String(pass||'');
    if(!NICK_RE.test(nick))fail('Přezdívka musí mít 3–16 znaků: písmena, číslice, mezera, tečka, pomlčka nebo podtržítko.');
    if(pass.length<8||pass.length>100)fail('Heslo musí mít alespoň 8 znaků.');
    const key=nick.toLowerCase();if(Object.hasOwn(doc.users,key))fail('Tato přezdívka je obsazená.',409);
    if(['__proto__','constructor','prototype'].includes(key))fail('Tuto přezdívku použít nejde.');
    const salt=randomBytes(16).toString('hex'),id=D.newId();
    const user={id,nick,salt,hash:await hashPass(pass,salt),tokens:[],created:Date.now()};
    // two registrations of the same nick can both pass the first check while hashing
    if(Object.hasOwn(doc.users,key))fail('Tato přezdívka je obsazená.',409);
    doc.users[key]=user;doc.profiles[id]=newProfile(id,nick);
    return{token:issueToken(user),profile:view(doc.profiles[id])};
  }
  async function login(nick,pass){
    const key=String(nick||'').trim().toLowerCase(),user=Object.hasOwn(doc.users,key)?doc.users[key]:null;
    const h=await hashPass(pass||'',user?.salt||'00');
    if(!user||!timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(user.hash,'hex')))fail('Nesprávná přezdívka nebo heslo.',401);
    const p=migrate(doc.profiles[user.id]);if(banned(p))fail(banText(p),403);
    return{token:issueToken(user),profile:view(p)};
  }
  // ---------- moderation ----------
  const isAdmin=p=>!!p&&ADMINS.has(p.nick.toLowerCase());
  const FOREVER=8.64e15;
  const muted=p=>p&&migrate(p).mod.muteUntil>Date.now()?p.mod.muteUntil:0;
  const banned=p=>p&&migrate(p).mod.banUntil>Date.now()?p.mod.banUntil:0;
  const when=t=>t>=FOREVER?'natrvalo':'do '+new Date(t).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Prague'});
  const banText=p=>`Účet je zablokovaný ${when(p.mod.banUntil)}.${p.mod.banNote?' Důvod: '+p.mod.banNote:''}`;
  const muteText=p=>`Máš zákaz chatu ${when(p.mod.muteUntil)}.`;
  function modlog(by,target,kind,detail){doc.modlog.unshift({t:Date.now(),by,target,kind,detail});doc.modlog.length=Math.min(doc.modlog.length,200)}
  // ctx: recent messages of the reported player, collected by the server from its chat logs
  function report(p,{target,reason,note},ctx=[]){
    const o=profById(target)||profByNick(target);if(!o)fail('Hráč nenalezen.',404);if(o.id===p.id)fail('Sám sebe nahlásit nejde.');
    if(!Object.hasOwn(D.REPORT_REASONS,reason))fail('Vyber důvod nahlášení.');
    const now=Date.now(),all=Object.values(doc.reports);
    if(all.filter(r=>r.from===p.id&&now-r.at<864e5).length>=D.MOD.reportsPerDay)fail('Dnes už jsi nahlásil moc hráčů.',429);
    if(all.some(r=>r.from===p.id&&r.target===o.id&&r.status==='open'))fail(`${o.nick} už od tebe má nahlášení, které čeká na vyřízení.`,409);
    const r={id:D.newId(),from:p.id,fromNick:p.nick,target:o.id,targetNick:o.nick,reason,note:D.cleanChat(note).slice(0,300),at:now,status:'open',
      ctx:(Array.isArray(ctx)?ctx:[]).slice(-15).map(m=>({ch:m.ch,text:String(m.text).slice(0,200),t:m.t}))};
    doc.reports[r.id]=r;
    // old closed reports are dropped so the document stays small
    const closed=all.filter(x=>x.status!=='open').sort((a,b)=>a.at-b.at);for(const x of closed.slice(0,Math.max(0,all.length-800)))delete doc.reports[x.id];
    // several different players reporting the same person within an hour mutes them until a moderator looks
    let auto=false;
    const recent=new Set(all.concat(r).filter(x=>x.target===o.id&&x.status==='open'&&now-x.at<D.MOD.autoWindow*60000).map(x=>x.from));
    if(recent.size>=D.MOD.autoReporters&&!muted(o)&&!isAdmin(o)){o.mod.muteUntil=now+D.MOD.autoMute*60000;auto=true;modlog('auto',o.nick,'mute',`${recent.size} nahlášení za hodinu`)}
    db.touch();return{ok:true,auto,target:o.id};
  }
  function modView(p,q={}){
    if(!isAdmin(p))fail('Jen pro moderátory.',403);
    const st=o=>{migrate(o);return{id:o.id,nick:o.nick,level:o.level,created:o.created,muteUntil:muted(o),banUntil:banned(o),warns:o.mod.warns,
      reports:Object.values(doc.reports).filter(r=>r.target===o.id).length,admin:isAdmin(o)}};
    const open=Object.values(doc.reports).filter(r=>r.status==='open').sort((a,b)=>b.at-a.at).slice(0,100).map(r=>({...r,targetState:profById(r.target)?st(profById(r.target)):null}));
    const look=q.nick?profByNick(q.nick):null;
    return{open,log:doc.modlog.slice(0,50),player:look?{...st(look),history:Object.values(doc.reports).filter(r=>r.target===look.id).sort((a,b)=>b.at-a.at).slice(0,20)}:null,
      sanctioned:Object.values(doc.profiles).filter(o=>muted(o)||banned(o)).slice(0,50).map(st)};
  }
  // returns what the server must do: kick a banned player, tell the target
  function modAction(p,{kind,target,minutes,report:rid,note}){
    if(!isAdmin(p))fail('Jen pro moderátory.',403);
    const r=typeof rid==='string'&&Object.hasOwn(doc.reports,rid)?doc.reports[rid]:null;
    const o=profById(target)||(typeof target==='string'?profByNick(target):null)||(r?profById(r.target):null);
    const close=st=>{if(r){r.status=st;r.by=p.nick;r.closed=Date.now()}};
    const mins=Math.round(Number(minutes));note=D.cleanChat(note).slice(0,200);
    const out={ok:true};
    if(kind==='dismiss'){if(!r)fail('Nahlášení nenalezeno.',404);close('dismissed');modlog(p.nick,r.targetNick,'dismiss','');db.touch();return out}
    if(!o)fail('Hráč nenalezen.',404);if(isAdmin(o))fail('Moderátora potrestat nejde.');
    switch(kind){
      case 'warn':o.mod.warns++;out.notify={pid:o.id,msg:`Varování od moderátora${note?': '+note:''}. Opakované porušení pravidel vede k zákazu chatu nebo zablokování.`};break;
      case 'mute':if(!(mins>=5&&mins<=43200))fail('Délka zákazu chatu je 5 minut až 30 dní.');o.mod.muteUntil=Date.now()+mins*60000;
        out.notify={pid:o.id,msg:`Moderátor ti zakázal chat ${when(o.mod.muteUntil)}.${note?' Důvod: '+note:''}`};break;
      case 'unmute':o.mod.muteUntil=0;out.notify={pid:o.id,msg:'Zákaz chatu byl zrušen.'};break;
      case 'ban':if(!(mins===0||mins>=60&&mins<=525600))fail('Délka zablokování je 1 hodina až 1 rok, nebo 0 natrvalo.');
        o.mod.banUntil=mins===0?FOREVER:Date.now()+mins*60000;o.mod.banNote=note;out.kick={pid:o.id,msg:banText(o)};break;
      case 'unban':o.mod.banUntil=0;o.mod.banNote='';break;
      default:fail('Neznámá akce.',404);
    }
    close(kind);modlog(p.nick,o.nick,kind,kind==='mute'||kind==='ban'?(mins?mins+' min':'natrvalo')+(note?' · '+note:''):note);db.touch();return out;
  }
  function logout(token){const h=sha(token),id=tokenIndex.get(h);if(!id)return;tokenIndex.delete(h);
    const u=Object.values(doc.users).find(x=>x.id===id);if(u)u.tokens=(u.tokens||[]).filter(t=>t!==h);db.touch()}
  function auth(token){if(!token)return null;const id=tokenIndex.get(sha(token));const p=id?doc.profiles[id]||null:null;if(p){migrate(p);if(banned(p))return null;rollGoals(p)}return p}

  function view(p){
    migrate(p);rollGoals(p);
    return{...p,xpNext:p.level>=D.MAX_LEVEL?0:D.xpFor(p.level),echo:D.echoOfWeek(D.weekKey()),
      campaignView:D.MISSIONS.map(m=>({id:m.id,open:missionOpen(p,m),cleared:p.campaign.cleared.includes(m.id)})),echoOpen:echoOpen(p),
      skinState:Object.fromEntries(D.CLASS_KEYS.map(k=>[k,D.SKINS[k].map(s=>({k:s.k,owned:D.skinOwned(p,k,s.k)}))])),
      listings:Object.values(doc.market).filter(l=>l.seller===p.id).length,achView:achView(p),admin:isAdmin(p),muteUntil:muted(p),loginView:loginState(p)};
  }
  const item=(p,id)=>p.inv.find(i=>i.id===id)||fail('Předmět nenalezen.',404);
  // own keys only: an id like "constructor" must not resolve to Object.prototype.constructor
  const listing=id=>typeof id==='string'&&Object.hasOwn(doc.market,id)?doc.market[id]:null;
  function unequip(p,id){for(const s of D.SLOT_KEYS)if(p.eq[s]===id)delete p.eq[s]}
  // ---------- forge helpers ----------
  function pay(p,c){
    if(c.credits&&p.credits<c.credits||c.essence&&p.essence<c.essence||c.fragments&&p.frags<c.fragments)
      fail(`Potřebuješ ${[c.credits?c.credits+' kreditů':'',c.essence?c.essence+' esence':'',c.fragments?c.fragments+' legendárních fragmentů':''].filter(Boolean).join(', ')}.`);
    p.credits-=c.credits||0;p.essence-=c.essence||0;p.frags-=c.fragments||0;
  }
  function addCrystal(p,key,n=1){if(!D.parseCrystal(key))return;p.crystals[key]=(Object.hasOwn(p.crystals,key)?p.crystals[key]:0)+n}
  function takeCrystals(p,it){for(const s of it.sock||[])if(s)addCrystal(p,s);if(it.sock)it.sock=it.sock.map(()=>null)}
  function salvageOne(p,it,out){
    unequip(p,it.id);takeCrystals(p,it);p.inv=p.inv.filter(i=>i!==it);
    // upgrades return part of the essence spent on them
    let e=D.ESSENCE[it.r];for(let n=0;n<(it.up|0);n++)e+=Math.floor((D.upgradeCost(it,n)?.essence||0)/2);
    p.essence+=e;out.essence+=e;p.frags+=D.FRAGMENTS[it.r];out.frags+=D.FRAGMENTS[it.r];out.n++;
    if(it.r>=3&&(it.r===4||Math.random()<.5)){const k=D.rollCrystal(it.r===4?2:1);addCrystal(p,k);out.crystals.push(k)}
  }
  function giveItem(p,it){if(p.inv.length<D.INV_MAX){p.inv.push(it);return true}p.credits+=D.itemValue(it);return false}

  // ---------- profile actions ----------
  const actions={
    equip(p,{slot,itemId}){
      if(!D.SLOTS[slot])fail('Neznámý slot.');
      if(!itemId){delete p.eq[slot];return}
      const it=item(p,itemId);if(it.slot!==slot)fail('Předmět do tohoto slotu nepatří.');p.eq[slot]=it.id;
    },
    cls(p,{cls}){if(!D.CLASSES[cls])fail('Neznámé povolání.');p.cls=cls},
    tree(p,{cls,alloc}){if(!D.CLASSES[cls])fail('Neznámé povolání.');const t=D.safeTree(cls,alloc,p.level);if(!t)fail('Rozdělení bodů porušuje pravidla stromu.');p.tree[cls]=t},
    skin(p,{cls,skin}){if(!D.CLASSES[cls])fail('Neznámé povolání.');if(!D.skinOwned(p,cls,skin))fail('Tento vzhled ještě nemáš.');p.skin[cls]=skin},
    buySkin(p,{cls,skin}){
      const s=D.SKINS[cls]?.find(x=>x.k===skin);if(!s||!s.req?.credits)fail('Tento vzhled se nedá koupit.');
      if(D.skinOwned(p,cls,skin))fail('Tento vzhled už máš.');if(p.credits<s.req.credits)fail('Nemáš dost kreditů.');
      p.credits-=s.req.credits;p.skins.push(cls+':'+skin);p.skin[cls]=skin;
    },
    sell(p,{ids}){
      if(!Array.isArray(ids)||!ids.length)fail('Vyber předměty k prodeji.');let got=0,n=0;
      for(const id of ids.slice(0,80)){const it=p.inv.find(i=>i.id===id);if(!it||it.lock)continue;unequip(p,id);takeCrystals(p,it);p.inv=p.inv.filter(i=>i!==it);got+=D.itemValue(it);n++}
      if(!n)fail('Zamčené předměty prodat nejde.');
      p.credits+=got;return{credits:got};
    },

    // a milestone branch of one ability; free to change outside a match
    masteryBranch(p,{key,tier,choice}){
      if(typeof key!=='string'||!Object.hasOwn(p.mastery,key))fail('Tuto schopnost ještě nemáš rozvinutou.');
      tier=Number(tier);if(![0,1,2,3].includes(tier))fail('Neplatný milník.');
      if(choice!==0&&choice!==1&&choice!==null)fail('Vyber jednu ze dvou větví.');
      const m=p.mastery[key];if(D.masteryRank(m.xp).rank<D.MASTERY.tiers[tier])fail(`Milník se odemyká na úrovni mistrovství ${D.MASTERY.tiers[tier]}.`);
      m.br??=[null,null,null,null];m.br[tier]=choice;
    },
    // ---------- forge ----------
    lock(p,{itemId}){const it=item(p,itemId);it.lock=!it.lock;return{lock:it.lock}},
    salvage(p,{ids}){
      if(!Array.isArray(ids)||!ids.length)fail('Vyber předměty k rozložení.');
      const out={essence:0,frags:0,crystals:[],n:0};
      for(const id of ids.slice(0,80)){const it=p.inv.find(i=>i.id===id);if(!it||it.lock)continue;salvageOne(p,it,out)}
      if(!out.n)fail('Zamčené předměty rozložit nejde.');return out;
    },
    // every unequipped, unlocked, untouched implant up to the given rarity
    salvageBulk(p,{maxR}){
      maxR=Number(maxR);if(![0,1,2].includes(maxR))fail('Hromadně jde rozložit nejvýš vzácné implantáty.');
      const eq=new Set(Object.values(p.eq)),out={essence:0,frags:0,crystals:[],n:0};
      for(const it of [...p.inv])if(it.r<=maxR&&!eq.has(it.id)&&!it.lock&&!(it.up>0)&&!(it.sock||[]).some(Boolean)&&!it.offer)salvageOne(p,it,out);
      if(!out.n)fail('Není co rozložit.');return out;
    },
    upgrade(p,{itemId}){
      const it=item(p,itemId);if(it.offer)fail('Nejdřív rozhodni o přeladění.');
      const c=D.upgradeCost(it);if(!c)fail(`Implantát má nejvyšší stupeň +${D.UPGRADE_MAX}.`);
      if(p.level<c.level)fail(`Další vylepšení vyžaduje úroveň ${c.level}.`);
      pay(p,c);it.up=(it.up|0)+1;return{up:it.up};
    },
    retune(p,{itemId,i}){
      const it=item(p,itemId);if(it.offer)fail('Nejdřív rozhodni o předchozím přeladění.');
      i=Number(i);if(!Number.isInteger(i)||i<0||i>=it.aff.length)fail('Vyber vlastnost.');
      const c=D.retuneCost(it);if(p.level<c.level)fail(`Přeladění vyžaduje úroveň ${c.level}.`);
      const pool=D.affixPool(it.slot).filter(k=>!it.aff.some(a=>a.k===k));if(!pool.length)fail('Pro tento implantát není jiná vlastnost.');
      pay(p,c);const k=pool[Math.floor(Math.random()*pool.length)];it.offer={i,k,v:D.rollAffix(k,it.lvl,it.r)};return{offer:it.offer};
    },
    retuneResolve(p,{itemId,accept}){
      const it=item(p,itemId);if(!it.offer)fail('Žádné přeladění nečeká.');if(typeof accept!=='boolean')fail('Vyber původní nebo novou vlastnost.');
      if(accept)it.aff[it.offer.i]={k:it.offer.k,v:it.offer.v};delete it.offer;return{accepted:accept};
    },
    socketOpen(p,{itemId}){
      const it=item(p,itemId);it.sock??=[];const n=it.sock.length;
      if(n>=D.SOCKETS_MAX[it.r])fail(D.SOCKETS_MAX[it.r]?'Implantát už má všechny zdířky.':'Běžný implantát zdířku mít nemůže.');
      pay(p,D.SOCKET_COST[n]);it.sock.push(null);return{sockets:it.sock.length};
    },
    socketSet(p,{itemId,idx,crystal}){
      const it=item(p,itemId),c=D.parseCrystal(crystal);idx=Number(idx);
      if(!it.sock||!Number.isInteger(idx)||idx<0||idx>=it.sock.length)fail('Neplatná zdířka.');if(it.sock[idx])fail('Zdířka je obsazená. Krystal nejdřív vyjmi.');
      if(!c||!Object.hasOwn(p.crystals,crystal)||!(p.crystals[crystal]>0))fail('Tento krystal nemáš.');
      if(it.sock.some(s=>s&&D.parseCrystal(s).type===c.type))fail('Dva krystaly stejného druhu v jednom implantátu být nemůžou.');
      p.crystals[crystal]--;if(!p.crystals[crystal])delete p.crystals[crystal];it.sock[idx]=crystal;return{};
    },
    socketTake(p,{itemId,idx}){
      const it=item(p,itemId);idx=Number(idx);const key=it.sock?.[idx];const c=key&&D.parseCrystal(key);if(!c)fail('Zdířka je prázdná.');
      pay(p,{credits:30*c.tier});it.sock[idx]=null;addCrystal(p,key);return{};
    },
    crystalCombine(p,{key}){
      const c=D.parseCrystal(key);if(!c)fail('Neznámý krystal.');if(c.tier>=5)fail('Krystal má nejvyšší stupeň.');
      if((Object.hasOwn(p.crystals,key)?p.crystals[key]:0)<3)fail('Ke spojení potřebuješ tři stejné krystaly.');
      pay(p,{credits:D.CRYSTAL_COMBINE[c.tier-1]});p.crystals[key]-=3;if(!p.crystals[key])delete p.crystals[key];
      const nk=D.crystalKey(c.type,c.tier+1);addCrystal(p,nk);return{crystal:nk};
    },
    distill(p){pay(p,{essence:D.DISTILL.essence});const k=D.rollCrystal(1);addCrystal(p,k);return{crystal:k}},
    craft(p,{kind,slot}){
      const C=Object.hasOwn(D.CRAFT,kind)?D.CRAFT[kind]:null;if(!C)fail('Neznámý recept.');if(!D.SLOTS[slot])fail('Vyber slot.');
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný.');
      pay(p,C);const it=D.rollItem(p.level,{slot,minR:C.minR,boost:.3});p.inv.push(it);return{item:it};
    },
    crate(p,{type}){
      const c=D.CRATES[type];if(!c)fail('Neznámý zásobník.');if(p.credits<c.price)fail('Nemáš dost kreditů.');
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný. Nejdřív něco prodej.');
      p.credits-=c.price;const it=D.rollItem(p.level,{boost:c.boost,minR:c.minR});p.inv.push(it);return{item:it};
    },
    marketList(p,{itemId,price}){
      price=Math.round(+price);if(!(price>=10&&price<=1e6))fail('Cena musí být 10 až 1 000 000 kreditů.');
      if(Object.values(doc.market).filter(l=>l.seller===p.id).length>=10)fail('Najednou můžeš prodávat nejvýš 10 předmětů.');
      const it=item(p,itemId);if(it.lock)fail('Zamčený implantát nejdřív odemkni.');if(it.offer)fail('Nejdřív rozhodni o přeladění.');
      unequip(p,it.id);p.inv=p.inv.filter(i=>i!==it);
      const l={id:D.newId(),seller:p.id,sellerNick:p.nick,item:it,price,created:Date.now()};doc.market[l.id]=l;return{listing:l};
    },
    marketCancel(p,{id}){
      const l=listing(id);if(!l||l.seller!==p.id)fail('Nabídka nenalezena.',404);
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný.');delete doc.market[id];p.inv.push(l.item);
    },
    prof(p,body){
      const o=D.validateProf(p.level,body);if(typeof o==='string')fail(o);
      p.prof=o;
    },
    tactic(p,{tactic}){const T=D.TACTICS[tactic];if(!T)fail('Neznámá taktická akce.');if(p.level<T.lvl)fail(`Tuhle akci odemkneš na úrovni ${T.lvl}.`);p.tactic=tactic},
    title(p,{title}){if(title&&!p.titles.includes(title))fail('Tento titul ještě nemáš.');p.title=title||null},
    claimGoal(p,{id}){
      const G=p.goals,weekly=id==='weekly',g=weekly?G.weekly:G.list.find(x=>x.id===id);
      const def=weekly?D.WEEKLY_GOALS[g?.id]:D.GOALS[id];
      if(!g||!def)fail('Cíl nenalezen.',404);if(g.claimed)fail('Odměnu už máš.');if(g.prog<def.target)fail('Cíl ještě není splněný.');
      g.claimed=true;let xp=def.xp,cr=def.cr,item=null;
      if(weekly){item=D.rollItem(p.level,{minR:3});giveItem(p,item)}
      else if(!G.bonus&&G.list.every(x=>x.claimed)){G.bonus=true;xp+=D.DAILY_BONUS.xp;cr+=D.DAILY_BONUS.cr;item=D.rollItem(p.level,{boost:D.DAILY_BONUS.boost,minR:1});giveItem(p,item)}
      p.credits+=cr;const levelUps=grantXp(p,xp);
      const pass=passGain(p,weekly?D.PASS.weeklyXp:D.PASS.goalXp+(G.bonus&&!weekly&&G.list.every(x=>x.claimed)&&item?D.PASS.bonusXp:0));
      return{xp,credits:cr,item,levelUps,pass};
    },
    passClaim(p,{n,cls}){return passClaim(p,n,cls)},
    // daily login reward: once per calendar day, the day of the cycle continues only from yesterday's claim
    loginClaim(p){
      const L=loginState(p);if(!L.can)fail('Dnešní odměnu už máš. Další bude zítra.');
      const R=D.LOGIN_DAYS[L.day-1];let item=null,crystal=null;
      p.credits+=R.cr|0;p.essence+=R.ess|0;
      if(R.minR){item=D.rollItem(p.level,{minR:R.minR});giveItem(p,item)}
      if(R.crystal){crystal=D.crystalKey(Object.keys(D.CRYSTALS)[Math.floor(Math.random()*Object.keys(D.CRYSTALS).length)],R.crystal);addCrystal(p,crystal)}
      const pass=R.pass?passGain(p,R.pass):null;
      p.login={last:D.dayKey(),streak:L.day};
      return{day:L.day,credits:R.cr|0,essence:R.ess|0,item,crystal,pass};
    },
    // one-time reward for finishing the tutorial (it runs on the client, so the reward is small and given once)
    tutorialDone(p){
      if(p.tutorial)return{already:true};
      p.tutorial=true;p.credits+=300;const item=D.rollItem(p.level,{minR:1,boost:.3});giveItem(p,item);return{credits:300,item};
    },
    // every reached tier except the skin choice, which needs a class
    passClaimAll(p){
      const P=p.pass,got={credits:0,items:[],skins:[],titles:[],n:0};
      for(let n=1;n<=D.passTier(P.xp);n++){if(P.claimed.includes(n)||D.PASS_REWARDS[n-1].skin==='pick')continue;
        if(D.PASS_REWARDS[n-1].minR!=null&&p.inv.length>=D.INV_MAX)break;
        const o=passClaim(p,n);got.credits+=o.credits;if(o.item)got.items.push(o.item);got.skins.push(...o.skins);if(o.title)got.titles.push(o.title);got.n++}
      if(!got.n)fail(p.inv.length>=D.INV_MAX?'Inventář je plný.':'Není co vyzvednout.');return got;
    },
    rerollGoal(p,{id}){
      const G=p.goals;if(G.rerolled)fail('Dnes už jsi cíl jednou vyměnil.');
      const i=G.list.findIndex(x=>x.id===id);if(i<0)fail('Cíl nenalezen.',404);if(G.list[i].claimed)fail('Vyzvednutý cíl už vyměnit nejde.');
      const free=Object.keys(D.GOALS).filter(k=>!G.list.some(x=>x.id===k));G.list[i]={id:free[Math.floor(Math.random()*free.length)],prog:0,claimed:false};G.rerolled=true;
    },
    claimWeekly(p){
      const c=p.campaign;if(c.weekClaimed)fail('Týdenní odměnu kampaně už máš.');if(c.weekWins<D.WEEKLY_CAMPAIGN_WINS)fail(`Potřebuješ ${D.WEEKLY_CAMPAIGN_WINS} výher v kampani tento týden.`);
      c.weekClaimed=true;p.credits+=400;const item=D.rollItem(p.level,{minR:2,boost:.5});giveItem(p,item);return{credits:400,item};
    },
    craftPlan(p,{boss}){
      const B=D.BOSSES[boss];if(!B)fail('Neznámý boss.');const n=p.campaign.shards[boss]|0;if(n<D.SHARDS_FOR_PLAN)fail(`Potřebuješ ${D.SHARDS_FOR_PLAN} střepů.`);
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný.');
      p.campaign.shards[boss]=n-D.SHARDS_FOR_PLAN;const item=D.rollItem(p.level,{minR:4});item.name=`${item.name} · ${B.name}`;p.inv.push(item);return{item};
    },
    claimSeason(p){
      const P=p.rankedPrev;if(!P||P.claimed)fail('Žádná odměna za sezónu nečeká.');
      const W=D.DIVISIONS[P.div]?.reward||D.DIVISIONS[0].reward;let item=null;
      if(W.minR&&p.inv.length>=D.INV_MAX)fail('Inventář je plný. Nejdřív něco prodej.');
      P.claimed=true;p.credits+=W.credits;
      if(W.minR){item=D.rollItem(p.level,{minR:W.minR,boost:.4});item.name=`${item.name} · ${D.DIVISIONS[P.div].name}`;p.inv.push(item)}
      if(W.title&&!p.titles.includes(W.title))p.titles.push(W.title);
      return{credits:W.credits,item,title:W.title||null};
    },
    merchantBuy(p,{i}){
      const o=p.merchant.offers[i|0];if(!o)fail('Nabídka nenalezena.',404);if(o.sold)fail('Tuhle nabídku už jsi koupil.');
      if(p.credits<o.price)fail('Nemáš dost kreditů.');if(p.inv.length>=D.INV_MAX)fail('Inventář je plný.');
      p.credits-=o.price;o.sold=true;p.inv.push(o.item);return{item:o.item};
    },
    merchantReroll(p){
      const M=p.merchant;if(M.rerolled)fail('Obchodník dnes zboží už jednou měnil.');if(p.credits<D.MERCHANT.rerollCost)fail('Nemáš dost kreditů.');
      p.credits-=D.MERCHANT.rerollCost;M.offers=merchantOffers(p);M.rerolled=true;
    },
    // saved builds: class, implants, skill tree, skin and profession slots in one click
    buildSave(p,{name,cls}){
      if(!D.CLASSES[cls])fail('Neznámé povolání.');name=String(name||'').replace(/[<>&"'`\u0000-\u001f]/g,'').trim().slice(0,24);if(!name)fail('Pojmenuj sestavu.');
      const b={id:D.newId(),name,cls,eq:{...p.eq},tree:{...(p.tree[cls]||{})},skin:p.skin?.[cls]||'default',slots:p.prof?.slots?.[cls]?[...p.prof.slots[cls]]:null,tactic:p.tactic||'dodge',at:Date.now()};
      const i=p.builds.findIndex(x=>x.name.toLowerCase()===name.toLowerCase());
      if(i>=0)p.builds[i]=b;else{if(p.builds.length>=D.BUILDS_MAX)fail(`Uložit můžeš nejvýš ${D.BUILDS_MAX} sestav.`);p.builds.push(b)}
      return{build:b};
    },
    buildLoad(p,{id}){
      const b=p.builds.find(x=>x.id===id);if(!b)fail('Sestava nenalezena.',404);const missing=[];
      p.cls=b.cls;p.eq={};for(const [slot,iid] of Object.entries(b.eq)){const it=p.inv.find(x=>x.id===iid);if(it&&it.slot===slot)p.eq[slot]=iid;else missing.push(D.SLOTS[slot]?.name||slot)}
      const t=D.safeTree(b.cls,b.tree,p.level);if(t)p.tree[b.cls]=t;else missing.push('strom');
      if(D.skinOwned(p,b.cls,b.skin)){p.skin??={};p.skin[b.cls]=b.skin}
      if(b.tactic&&D.TACTICS[b.tactic]&&p.level>=D.TACTICS[b.tactic].lvl)p.tactic=b.tactic;
      if(b.slots&&p.prof?.main){const o=D.validateProf(p.level,{...p.prof,slots:{...(p.prof.slots||{}),[b.cls]:b.slots}});if(typeof o!=='string')p.prof=o;else missing.push('sloty profese')}
      return{missing};
    },
    buildDelete(p,{id}){const n=p.builds.length;p.builds=p.builds.filter(x=>x.id!==id);if(n===p.builds.length)fail('Sestava nenalezena.',404)},
    marketBuy(p,{id}){
      const l=listing(id);if(!l)fail('Nabídka už neexistuje.',404);if(l.seller===p.id)fail('Vlastní nabídku nekoupíš, můžeš ji zrušit.');
      if(p.credits<l.price)fail('Nemáš dost kreditů.');if(p.inv.length>=D.INV_MAX)fail('Inventář je plný.');
      delete doc.market[id];p.credits-=l.price;p.inv.push(l.item);
      const s=doc.profiles[l.seller];if(s){s.credits+=Math.floor(l.price*(1-D.MARKET_FEE));s.stats.sold=(s.stats.sold|0)+1}
      return{item:l.item};
    },

    // ---------- guild actions; `notify` lists the players whose guild screen should refresh ----------
    guildCreate(p,{name,tag,desc,open}){
      if(p.guild)fail('Už jsi v klanu.');
      if(p.level<D.GUILD.minLevel)fail(`Klan můžeš založit od úrovně ${D.GUILD.minLevel}.`);
      name=String(name||'').trim().replace(/\s+/g,' ');tag=String(tag||'').trim().toUpperCase();
      if(!D.GUILD_NAME_RE.test(name))fail('Název klanu má 3–24 znaků: písmena, číslice, mezera, tečka, pomlčka nebo podtržítko.');
      if(!D.GUILD_TAG_RE.test(tag))fail('Zkratka klanu má 2–4 velká písmena nebo číslice.');
      const g0=Object.values(doc.guilds);
      if(g0.some(g=>g.name.toLowerCase()===name.toLowerCase()))fail('Klan s tímto názvem už existuje.',409);
      if(g0.some(g=>g.tag===tag))fail('Tuto zkratku už má jiný klan.',409);
      if(p.credits<D.GUILD.cost)fail(`Založení klanu stojí ${D.GUILD.cost} kreditů.`);
      p.credits-=D.GUILD.cost;
      const g={id:D.newId(),name,tag,desc:D.cleanChat(desc).slice(0,160),open:!!open,leader:p.id,members:{},apps:[],level:1,xp:0,created:Date.now(),log:[],week:{key:D.weekKey(),wins:0}};
      doc.guilds[g.id]=g;addMember(g,p,'leader');glog(g,`${p.nick} založil klan.`);
      return{guildId:g.id,notify:[p.id]};
    },
    guildApply(p,{id}){
      const g=guildById(id)||fail('Klan nenalezen.',404);if(p.guild)fail('Už jsi v klanu.');
      if(p.guildInv.includes(g.id)||g.open){joinGuild(g,p);return{joined:true,notify:memberIds(g)}}
      if(g.apps.includes(p.id))fail('Žádost už čeká na vyřízení.');
      if(g.apps.length>=D.GUILD.maxApps)fail('Klan má moc nevyřízených žádostí.');
      g.apps.push(p.id);return{notify:officerIds(g)};
    },
    guildCancelApp(p,{id}){const g=guildById(id);if(g)without(g.apps,p.id);return{notify:g?officerIds(g):[]}},
    guildInvite(p,{nick}){
      const g=myGuild(p),o=profByNick(nick);needRole(g,p,'officer');
      if(!o)fail('Hráč s touto přezdívkou neexistuje.',404);if(o.id===p.id)fail('Sám sebe pozvat nejde.');
      if(o.guild)fail(`${o.nick} už je v klanu.`);
      if(g.apps.includes(o.id)){joinGuild(g,o);return{notify:memberIds(g)}}
      if(o.guildInv.includes(g.id))fail('Pozvánka už čeká.');
      if(!blocks(o,p)){o.guildInv.push(g.id);if(o.guildInv.length>D.GUILD.maxInv)o.guildInv.shift()}
      glog(g,`${p.nick} pozval hráče ${o.nick}.`);return{notify:[...officerIds(g),o.id],noteTo:{pid:o.id,msg:`Klan [${g.tag}] ${g.name} tě zve mezi sebe. Pozvánku najdeš na kartě Klan.`}};
    },
    guildAccept(p,{id}){
      if(!p.guildInv.includes(id))fail('Pozvánka už neplatí.');
      const g=guildById(id);if(!g){without(p.guildInv,id);fail('Klan už neexistuje.',404)}
      if(p.guild)fail('Už jsi v klanu.');joinGuild(g,p);return{notify:memberIds(g)};
    },
    guildDecline(p,{id}){without(p.guildInv,id)},
    guildApp(p,{id,ok}){
      const g=myGuild(p);needRole(g,p,'officer');
      if(!g.apps.includes(id))fail('Žádost už neplatí.');
      const o=profById(id);
      if(ok&&o&&!o.guild)joinGuild(g,o);
      without(g.apps,id);
      return{notify:[...memberIds(g),id]};
    },
    guildLeave(p){
      const g=myGuild(p),n=memberIds(g).length;
      if(g.leader===p.id&&n>1)fail('Nejdřív předej vedení jinému členovi, nebo klan rozpusť.');
      if(n<=1)return actions.guildDisband(p);
      removeMember(g,p.id);glog(g,`${p.nick} opustil klan.`);return{notify:[...memberIds(g),p.id]};
    },
    guildKick(p,{id}){
      const g=myGuild(p);needRole(g,p,'officer');
      if(!isMember(g,id)||id===p.id)fail('Tohoto hráče vyhodit nejde.');
      if(p.id!==g.leader&&g.members[id].role!=='member')fail('Důstojník může vyhodit jen člena.');
      const o=profById(id);removeMember(g,id);glog(g,`${p.nick} vyhodil hráče ${o?.nick||'?'}.`);return{notify:[...memberIds(g),id]};
    },
    guildRole(p,{id,role}){
      const g=myGuild(p);needRole(g,p,'leader');
      if(!isMember(g,id)||id===p.id||!['officer','member'].includes(role))fail('Tuto změnu udělat nejde.');
      g.members[id].role=role;glog(g,`${profById(id)?.nick||'?'} je teď ${D.GUILD_ROLES[role].toLowerCase()}.`);return{notify:memberIds(g)};
    },
    guildLead(p,{id}){
      const g=myGuild(p);needRole(g,p,'leader');
      if(!isMember(g,id)||id===p.id)fail('Vedení jde předat jen jinému členovi klanu.');
      g.members[id].role='leader';g.members[p.id].role='officer';g.leader=id;glog(g,`${p.nick} předal vedení hráči ${profById(id)?.nick||'?'}.`);return{notify:memberIds(g)};
    },
    guildEdit(p,{desc,open}){
      const g=myGuild(p);needRole(g,p,'leader');
      if(desc!==undefined)g.desc=D.cleanChat(desc).slice(0,160);if(open!==undefined)g.open=!!open;return{notify:memberIds(g)};
    },
    guildDisband(p){
      const g=myGuild(p);needRole(g,p,'leader');const ids=memberIds(g);
      for(const id of ids){const o=profById(id);if(o)o.guild=null}
      for(const o of Object.values(doc.profiles))if(o.guildInv?.includes(g.id))without(o.guildInv,g.id);
      delete doc.guilds[g.id];return{notify:ids,disbanded:true};
    },
    achClaim(p,{id}){if(id!==undefined&&!D.achById(id))fail('Neznámý úspěch.',404);return achClaim(p,id===undefined?null:[id])},
    guildClaim(p){
      const g=myGuild(p);rollGuildWeek(g);const m=g.members[p.id],wk=g.week;
      if(wk.wins<D.guildWeekTarget(memberIds(g).length))fail('Týdenní cíl klanu ještě není splněný.');
      if(m.wk<D.GUILD.weekMin)fail(`Odměnu dostane, kdo tento týden odehrál za klan aspoň ${D.GUILD.weekMin} zápasy.`);
      if(p.guildWeek===wk.key)fail('Odměnu za tento týden už máš.');
      const R=D.guildWeekReward(g.level),it=D.rollItem(p.level,{minR:R.minR});
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný. Uvolni místo pro implantát.');
      p.guildWeek=wk.key;p.credits+=R.credits;p.inv.push(it);return{credits:R.credits,item:it};
    }
  };

  // ---------- guilds ----------
  function guildById(id){return typeof id==='string'&&Object.hasOwn(doc.guilds,id)?doc.guilds[id]:null}
  function isMember(g,id){return!!(g&&typeof id==='string'&&Object.hasOwn(g.members,id))}
  const memberIds=g=>Object.keys(g.members);
  const officerIds=g=>memberIds(g).filter(id=>g.members[id].role!=='member');
  const ROLE_RANK={member:0,officer:1,leader:2};
  function myGuild(p){const g=guildById(p.guild);if(!g||!isMember(g,p.id))fail('Nejsi v žádném klanu.');rollGuildWeek(g);return g}
  function needRole(g,p,role){if(ROLE_RANK[g.members[p.id].role]<ROLE_RANK[role])fail(role==='leader'?'Tohle smí jen vůdce klanu.':'Tohle smí jen vůdce nebo důstojník.',403)}
  function glog(g,msg){g.log.unshift({t:Date.now(),msg});g.log.length=Math.min(g.log.length,30)}
  function addMember(g,p,role){g.members[p.id]={role,joined:Date.now(),wk:0,ww:0,xp:0};p.guild=g.id;without(p.guildInv,g.id)}
  function joinGuild(g,p){
    if(memberIds(g).length>=D.guildMaxMembers(g.level))fail('Klan je plný.');
    addMember(g,p,'member');
    for(const x of Object.values(doc.guilds))without(x.apps,p.id);
    glog(g,`${p.nick} vstoupil do klanu.`);
  }
  function removeMember(g,id){delete g.members[id];const o=profById(id);if(o&&o.guild===g.id)o.guild=null}
  function rollGuildWeek(g){const k=D.weekKey();if(g.week.key===k)return;g.week={key:k,wins:0};for(const m of Object.values(g.members)){m.wk=0;m.ww=0}}
  // a member's match: guild XP, the weekly goal and the member bonus; returns what the reward screen shows
  function guildMatch(p,xp,cr,won){
    const g=guildById(p.guild);if(!isMember(g,p.id))return null;rollGuildWeek(g);
    const b=D.guildBonus(g.level)/100,bx=Math.round(xp*b),bc=Math.round(cr*b),gx=Math.max(1,Math.round(xp/3)),m=g.members[p.id];
    g.xp+=gx;m.xp+=gx;m.wk++;if(won){m.ww++;g.week.wins++}
    let up=0;while(g.level<D.GUILD.maxLevel&&g.xp>=D.guildXpFor(g.level)){g.xp-=D.guildXpFor(g.level);g.level++;up=g.level;glog(g,`Klan dosáhl úrovně ${g.level}.`)}
    if(g.level>=D.GUILD.maxLevel)g.xp=0;
    return{tag:g.tag,gx,bx,bc,up};
  }
  const tagOf=pid=>{const p=profById(pid),g=p&&guildById(p.guild);return g?g.tag:null};
  function guildCard(g){return{id:g.id,name:g.name,tag:g.tag,level:g.level,n:memberIds(g).length,max:D.guildMaxMembers(g.level),open:g.open,desc:g.desc}}
  function guildList(q){
    q=String(q||'').trim().toLowerCase().slice(0,24);
    return Object.values(doc.guilds).filter(g=>!q||g.name.toLowerCase().includes(q)||g.tag.toLowerCase().includes(q))
      .sort((a,b)=>b.level-a.level||b.xp-a.xp||memberIds(b).length-memberIds(a).length).slice(0,40).map(guildCard);
  }
  // status(id) comes from the server (online, lobby, match)
  function guildView(p,status){
    migrate(p);
    const g=guildById(p.guild);
    if(!g)return{guild:null,invites:p.guildInv.map(guildById).filter(Boolean).map(guildCard),
      applied:Object.values(doc.guilds).filter(x=>x.apps.includes(p.id)).map(guildCard),cost:D.GUILD.cost,minLevel:D.GUILD.minLevel};
    rollGuildWeek(g);
    const me=g.members[p.id],officer=me.role!=='member',n=memberIds(g).length,target=D.guildWeekTarget(n);
    const card=id=>{const o=profById(id);return o?{id,nick:o.nick,lv:o.level,cls:o.cls}:null};
    const members=memberIds(g).map(id=>{const c=card(id);return c&&{...c,...g.members[id],...status(id)}}).filter(Boolean)
      .sort((a,b)=>ROLE_RANK[b.role]-ROLE_RANK[a.role]||(a.st==='offline')-(b.st==='offline')||b.wk-a.wk||a.nick.localeCompare(b.nick,'cs'));
    return{guild:{...guildCard(g),xp:g.xp,xpNext:g.level>=D.GUILD.maxLevel?0:D.guildXpFor(g.level),bonus:D.guildBonus(g.level),created:g.created,log:g.log,
      week:{key:g.week.key,wins:g.week.wins,target,reward:D.guildWeekReward(g.level),claimed:p.guildWeek===g.week.key,mine:me.wk,can:g.week.wins>=target&&me.wk>=D.GUILD.weekMin&&p.guildWeek!==g.week.key},
      role:me.role,members,apps:officer?g.apps.map(card).filter(Boolean):[]}};
  }
  function act(p,name,body){
    // own keys only: names like "constructor" or "__defineGetter__" would otherwise reach Object.prototype
    const fn=Object.hasOwn(actions,name)?actions[name]:null;if(!fn)fail('Neznámá akce.',404);
    const extra=fn(p,body||{})||{};db.touch();return{...extra,profile:view(p)};
  }
  function expireListings(){
    const cut=Date.now()-LISTING_DAYS*864e5;
    for(const l of Object.values(doc.market))if(l.created<cut){const s=doc.profiles[l.seller];delete doc.market[l.id];if(s)giveItem(s,l.item);db.touch()}
  }
  function market(p,q){
    expireListings();
    let list=Object.values(doc.market);
    if(D.SLOTS[q.slot])list=list.filter(l=>l.item.slot===q.slot);
    if(q.r!==undefined&&q.r!==''&&!isNaN(+q.r))list=list.filter(l=>l.item.r>=+q.r);
    if(q.mine==='1')list=list.filter(l=>l.seller===p.id);
    list.sort(q.sort==='new'?(a,b)=>b.created-a.created:(a,b)=>a.price-b.price);
    return{listings:list.slice(0,60).map(l=>({...l,mine:l.seller===p.id}))};
  }
  function top(){
    const season=D.seasonKey();
    return{players:Object.values(doc.profiles).sort((a,b)=>b.level-a.level||b.xp-a.xp).slice(0,20)
      .map(p=>({nick:p.nick,level:p.level,cls:p.cls,ach:achView(migrate(p)).pts,wins:p.stats.wins,bossKills:p.stats.bossKills,bestWave:p.stats.bestWave,bestEndless:p.stats.bestEndless|0})),
      season,ranked:Object.values(doc.profiles).filter(p=>p.ranked?.season===season&&p.ranked.games>0).sort((a,b)=>b.ranked.rating-a.ranked.rating).slice(0,30)
        .map(p=>({nick:p.nick,cls:p.cls,rating:p.ranked.rating,div:D.divisionOf(p.ranked.rating),games:p.ranked.games,wins:p.ranked.wins,placed:p.ranked.games>=D.PLACEMENT})),
      guilds:guildList('').slice(0,20)};
  }

  // ---------- public player profile ----------
  // what anyone may see about a player: game stats only, no inventory, credits, goals or friend lists
  function publicProfile(q){
    const p=profById(q)||profByNick(q);if(!p)fail('Hráč nenalezen.',404);
    const st=p.stats,rk=p.ranked?.season===D.seasonKey()&&p.ranked.games>0?p.ranked:null,g=guildById(p.guild);
    const top=(o,n)=>Object.entries(o||{}).filter(([,v])=>v&&v.m>0).sort((a,b)=>b[1].m-a[1].m).slice(0,n).map(([k,v])=>({k,m:v.m,w:v.w}));
    return{id:p.id,nick:p.nick,level:p.level,title:p.title,cls:p.cls,created:p.created||0,
      guild:g&&isMember(g,p.id)?{name:g.name,tag:g.tag,level:g.level}:null,
      ranked:rk?{rating:rk.rating,div:D.divisionOf(rk.rating),games:rk.games,wins:rk.wins,placed:rk.games>=D.PLACEMENT}:null,bestDiv:st.bestDiv|0,rankedGames:st.rankedGames|0,
      stats:{matches:st.matches,wins:st.wins,kills:st.kills,mvp:st.mvp|0,bossKills:st.bossKills,bestWave:st.bestWave,bestEndless:st.bestEndless|0,time:st.time|0,bestStreak:st.bestStreak|0,bestMulti:st.bestMulti|0},
      classes:top(st.byCls,4).filter(c=>D.CLASSES[c.k]),modes:top(st.byMode,4),ach:achView(p).pts,
      recent:p.history.slice(0,6).map(h=>({at:h.at,mode:h.mode,mission:h.mission,res:h.res,cls:h.cls,ki:h.ki,de:h.de,score:h.score,mvp:!!h.mvp}))};
  }

  // ---------- friends ----------
  // the friend graph is stored on both sides; every operation updates both profiles and returns the ids whose lists changed
  const profById=id=>typeof id==='string'&&Object.hasOwn(doc.profiles,id)?migrate(doc.profiles[id]):null;
  const profByNick=nick=>{const k=String(nick||'').trim().toLowerCase(),u=Object.hasOwn(doc.users,k)?doc.users[k]:null;return u?profById(u.id):null};
  const without=(a,id)=>{const i=a.indexOf(id);if(i>=0)a.splice(i,1)};
  const isFriend=(a,b)=>!!(a&&b&&migrate(a).social.friends.includes(b.id));
  const blocks=(a,b)=>!!(a&&b&&migrate(a).social.blocked.includes(b.id));
  function friendOp(p,op,arg){
    migrate(p);const S=p.social;
    const o=op==='add'?profByNick(arg):profById(arg);
    if(op==='unblock'){without(S.blocked,arg);db.touch();return[p.id]}
    if(!o)fail(op==='add'?'Hráč s touto přezdívkou neexistuje.':'Hráč nenalezen.',404);
    if(o.id===p.id)fail('Sám sebe si přidat nejde.');
    const T=o.social;
    const unlink=()=>{without(S.friends,o.id);without(T.friends,p.id);without(S.inReq,o.id);without(S.outReq,o.id);without(T.inReq,p.id);without(T.outReq,p.id)};
    switch(op){
      case 'add':
        if(S.friends.includes(o.id))fail(`${o.nick} už je tvůj přítel.`);
        if(S.blocked.includes(o.id))fail('Tohoto hráče máš zablokovaného.');
        if(S.inReq.includes(o.id))return friendOp(p,'accept',o.id);
        if(S.outReq.includes(o.id))fail('Žádost už čeká na odpověď.');
        if(S.friends.length>=D.FRIENDS_MAX)fail(`Přátel můžeš mít nejvýš ${D.FRIENDS_MAX}.`);
        if(S.outReq.length>=30)fail('Máš moc nevyřízených žádostí.');
        // a player who blocked you never sees the request, and you are not told
        if(!T.blocked.includes(p.id)){if(T.inReq.length>=50)fail('Tento hráč má moc nevyřízených žádostí.');T.inReq.push(p.id)}
        S.outReq.push(o.id);break;
      case 'accept':
        if(!S.inReq.includes(o.id))fail('Žádost už neplatí.');
        if(S.friends.length>=D.FRIENDS_MAX||T.friends.length>=D.FRIENDS_MAX)fail(`Přátel může mít každý nejvýš ${D.FRIENDS_MAX}.`);
        unlink();S.friends.push(o.id);T.friends.push(p.id);break;
      case 'decline':case 'remove':unlink();break;
      case 'block':unlink();if(!S.blocked.includes(o.id)){if(S.blocked.length>=200)S.blocked.shift();S.blocked.push(o.id)}break;
      default:fail('Neznámá akce.',404);
    }
    db.touch();return[p.id,o.id];
  }
  // status(id) comes from the server: {st:'offline'|'online'|'lobby'|'match', ...where}
  function friendsView(p,status){
    migrate(p);const S=p.social,card=id=>{const o=profById(id);return o?{id,nick:o.nick,lv:o.level,cls:o.cls,title:o.title||null,tag:tagOf(id)}:null};
    const list=ids=>ids.map(card).filter(Boolean);
    const order={match:0,lobby:1,online:2,offline:3};
    return{friends:list(S.friends).map(f=>({...f,...status(f.id)})).sort((a,b)=>order[a.st]-order[b.st]||a.nick.localeCompare(b.nick,'cs')),
      inReq:list(S.inReq),outReq:list(S.outReq),blocked:list(S.blocked),
      recent:S.recent.filter(r=>!S.blocked.includes(r.id)).map(r=>{const c=card(r.id);return c&&{...c,at:r.at,mode:r.mode,ally:r.ally}}).filter(Boolean)};
  }
  // players with an account who were in the same finished match: newest first, each player once, at most RECENT_KEEP
  const RECENT_KEEP=20;
  function coPlayers(entries,mode){
    const at=Date.now();
    for(const e of entries){const p=profById(e.pid);if(!p)continue;const R=p.social.recent;
      for(const o of entries){if(o.pid===e.pid)continue;const i=R.findIndex(r=>r.id===o.pid);if(i>=0)R.splice(i,1);
        R.unshift({id:o.pid,at,mode,ally:o.team===e.team})}
      R.length=Math.min(R.length,RECENT_KEEP)}
    db.touch();
  }

  // ---------- ranked ----------
  // entries: [{pid,team,present}] of everyone who started the ranked match. Returns {pid:{delta,rating,div,prevDiv,games}},
  // or {none:reason} when the match does not count. A player who left before the end takes a loss.
  function rankedResult(M,entries){
    const list=entries.map(e=>({...e,p:doc.profiles[e.pid]})).filter(e=>e.p);
    for(const e of list){migrate(e.p);rollSeason(e.p)}
    const teams=[0,1].map(t=>list.filter(e=>e.team===t));
    if(!teams[0].length||!teams[1].length)return{none:'Na jedné straně nehrál žádný hráč s účtem, zápas se nehodnotí.'};
    const avg=t=>teams[t].reduce((a,e)=>a+e.p.ranked.rating,0)/teams[t].length,av=[avg(0),avg(1)];
    const out={};
    for(const e of list){
      const R=e.p.ranked,score=!e.present?0:M.winner===e.team?1:M.winner===1-e.team?0:.5;
      const delta=D.eloDelta(R.rating,av[1-e.team],score,R.games),prevDiv=D.divisionOf(R.rating);
      R.rating=Math.max(0,R.rating+delta);R.games++;if(score===1)R.wins++;else if(score===0)R.losses++;R.peak=Math.max(R.peak,R.rating);
      const ps=e.p.stats;ps.rankedGames++;if(score===1)ps.rankedWins++;ps.bestDiv=Math.max(ps.bestDiv,D.divisionOf(R.rating));
      out[e.pid]={delta,rating:R.rating,div:D.divisionOf(R.rating),prevDiv,games:R.games,left:!e.present};
    }
    db.touch();return out;
  }

  // ---------- rewards ----------
  function rewardsFor(M,u,p,loot,mvp=false,rk=null){
    migrate(p);const achBefore=achReachedAll(p);
    // custom rules (shorter target or time): rewards follow how long the match really took, so short matches cannot be farmed
    const custom=M.custom?Math.min(1,M.time/D.CUSTOM_FULL):1;
    const mult=D.DIFF_REWARD[M.diffKey]||1,part=Math.max(.25,Math.min(1,(M.time-(u.joinedAt||0))/Math.max(1,M.time)))*custom;
    let xp=0,cr=0,res='loss',record=0;const items=[...u.bag,...loot];
    const pveWin=!M.D.pvp&&(M.winner===0||M.D.endless&&M.wave>=D.ENDLESS_WIN);
    if(M.time<45&&!pveWin){let sold=0;for(const it of items)if(!giveItem(p,it))sold++;db.touch();return{xp:0,credits:0,items,res:'short',levelUps:[],sold,skin:null}}
    if(M.D.pvp){
      res=M.winner===u.team?'win':M.winner===-1||M.winner===null?'draw':'loss';
      xp={win:140,draw:100,loss:70}[res]+u.kills*8+u.relics*15;cr={win:60,draw:45,loss:30}[res]+u.kills*3;
      if(Math.random()<{win:.6,draw:.45,loss:.3}[res]*custom)items.push(D.rollItem(p.level));
    }else if(M.mode==='boss'){
      res=M.winner===0?'win':'loss';xp=(res==='win'?260:90)+u.npcKills*3;cr=res==='win'?150:40;
      if(res==='win'&&Math.random()<.4)items.push(D.rollItem(p.level,{boost:.4}));
    }else if(M.D.endless){
      // no victory in endless: reaching ENDLESS_WIN counts as a win, rewards keep growing with the wave
      res=M.wave>=D.ENDLESS_WIN?'win':'loss';xp=25*M.wave+u.npcKills*3;cr=12*M.wave;
      if(M.wave>(p.stats.bestEndless|0)&&M.wave>=5){xp+=10*M.wave;cr+=5*M.wave;record=M.wave}
      for(let i=0;i<Math.min(8,Math.floor(M.wave/3));i++)items.push(D.rollItem(p.level,{boost:Math.min(1.2,M.wave*.04)}));
    }else{
      res=M.winner===0?'win':'loss';xp=20*M.wave+u.npcKills*3;cr=10*M.wave;if(res==='win'){xp+=200;cr+=200}
      for(let i=0;i<Math.floor(M.wave/3);i++)items.push(D.rollItem(p.level,{boost:M.wave*.04}));
    }
    if(mvp){xp*=1.15;cr*=1.15}
    xp=Math.round(xp*mult*part);cr=Math.round(cr*mult*part);
    let skin=null;
    if(!M.D.pvp&&M.bossKills&&Math.random()<.04*M.bossKills){
      const cand=D.CLASS_KEYS.map(k=>k+':relic').filter(s=>!p.skins.includes(s));if(cand.length){skin=cand[Math.floor(Math.random()*cand.length)];p.skins.push(skin)}}
    // campaign
    const camp={};
    if(M.mission&&res==='win'){
      const c=p.campaign;c.weekWins++;
      if(M.mission==='echo'){if(!c.echoWon){c.echoWon=true;xp+=600;items.push(D.rollItem(p.level,{minR:3}));camp.echo=true}}
      else{const ms=D.missionById(M.mission),key=ms.boss||ms.waveBoss;
        if(!c.cleared.includes(ms.id)&&missionOpen(p,ms)){
          c.cleared.push(ms.id);camp.first=ms.name;xp+=ms.reward.xp;cr+=ms.reward.credits;items.push(D.rollItem(p.level,{minR:ms.reward.minR}));
          if(ms.reward.title&&!p.titles.includes(ms.reward.title)){p.titles.push(ms.reward.title);camp.title=ms.reward.title;if(!p.title)p.title=ms.reward.title}
          if(ms.reward.skin){const s=u.clsKey+':'+ms.reward.skin;if(!p.skins.includes(s)){p.skins.push(s);skin=s}}
        }else if(key){c.shards[key]=(c.shards[key]|0)+D.SHARDS_PER_WIN;camp.shards={boss:key,n:c.shards[key]}}}
    }
    // goals
    const won=res==='win'&&custom>=D.CUSTOM_GOAL,delta={matches:1,wins:won?1:0,winArena:won&&D.arenaLike(M.mode)?1:0,winControl:won&&M.mode==='control'?1:0,
      kills:M.D.pvp?u.kills:0,npcKills:u.npcKills,bossKills:won&&!M.D.pvp?(M.bossKills||0):0,wave:M.mode==='waves'?M.wave:0,endless:M.D.endless?M.wave:0,relics:u.relics,
      dmg:Math.round(u.dmgDealt),heal:Math.round(u.healDone),campaign:M.mission&&won?1:0};
    const done=[];
    const bump=(g,def)=>{if(!g||!def||g.claimed)return;const before=g.prog;g.prog=def.max?Math.max(g.prog,delta[def.stat]||0):Math.min(def.target,g.prog+(delta[def.stat]||0));
      if(before<def.target&&g.prog>=def.target)done.push(def.name)};
    for(const g of p.goals.list)bump(g,D.GOALS[g.id]);bump(p.goals.weekly,D.WEEKLY_GOALS[p.goals.weekly?.id]);
    // ability mastery: one XP per use (an ultimate counts more), capped per ability and match
    const masteryUps=[];
    for(const [key,n] of Object.entries(u.mcount||{})){
      if(typeof key!=='string'||!(n>0))continue;
      const m=Object.hasOwn(p.mastery,key)?p.mastery[key]:(p.mastery[key]={xp:0,br:[null,null,null,null]});
      const before=D.masteryRank(m.xp).rank;m.xp+=Math.min(D.MASTERY.matchCap,Math.round(n*(key.endsWith(':ult')?D.MASTERY.ultXp:1)));
      const after=D.masteryRank(m.xp).rank;if(after>before)masteryUps.push({key,name:D.masteryName(key),rank:after,milestone:D.MASTERY.tiers.some(t=>t>before&&t<=after)});
    }
    // crystals for sockets: more often after a win and after bosses, tier II possible on hard and against bosses
    const crystals=[];if(Math.random()<(.12+(res==='win'?.1:0)+(res==='win'&&M.bossKills?.15:0))*part)crystals.push(D.rollCrystal(M.diffKey==='hard'||M.bossKills?2:1));
    for(const k of crystals)addCrystal(p,k);
    // guild: XP for the guild, the weekly goal and the member bonus
    const guild=guildMatch(p,xp,cr,won);if(guild){xp+=guild.bx;cr+=guild.bc}
    // apply
    p.credits+=cr;const levelUps=grantXp(p,xp);const pass=passGain(p,xp);
    let sold=0;for(const it of items)if(!giveItem(p,it))sold++;
    const st=p.stats;st.matches++;if(res==='win')st.wins++;else if(res==='loss')st.losses++;
    st.kills+=u.kills;st.npcKills+=u.npcKills;st.bossKills+=res==='win'?(M.bossKills||0):0;if(M.mode==='waves')st.bestWave=Math.max(st.bestWave,M.wave);if(M.D.endless)st.bestEndless=Math.max(st.bestEndless|0,M.wave);
    const won1=res==='win'?1:0,bump2=(o,k)=>{o[k]??={m:0,w:0};o[k].m++;o[k].w+=won1};
    bump2(st.byCls,u.clsKey);bump2(st.byMode,M.mission?'campaign':M.mode);
    if(res==='win')for(const b of M.bossKeys||[])st.byBoss[b]=(st.byBoss[b]|0)+1;
    st.dmg+=Math.round(u.dmgDealt);st.heal+=Math.round(u.healDone);st.time+=Math.round(M.time-(u.joinedAt||0));if(mvp)st.mvp++;
    if(M.D.pvp){st.bestStreak=Math.max(st.bestStreak|0,u.bestStreak|0);st.bestMulti=Math.max(st.bestMulti|0,u.bestMulti|0)}
    st.relics+=u.relics|0;st.legendary+=items.filter(it=>it.r===4).length;
    p.history.unshift({at:Date.now(),mode:M.mode,map:M.mapKey,boss:M.mode==='boss'?M.bossKey:null,mission:M.mission,res,cls:u.clsKey,
      ki:u.kills,de:u.deaths,nk:u.npcKills,dm:Math.round(u.dmgDealt),he:Math.round(u.healDone),wave:M.D.waves?M.wave:0,
      score:M.D.pvp?[M.score[u.team],M.score[1-u.team]]:null,dur:Math.round(M.time),xp,cr,mvp,rk});
    p.history.length=Math.min(p.history.length,D.HISTORY_MAX);
    db.touch();
    return{xp,credits:cr,items,res,levelUps,sold,skin,camp,goalsDone:done,record,mvp,guild,pass,crystals,masteryUps,achNew:achDiff(p,achBefore)};
  }

  // ---------- achievements ----------
  const achCtx=p=>{const g=guildById(p.guild);return{...p,guildLevel:isMember(g,p.id)?g.level:0}};
  function achReachedAll(p){const c=achCtx(p),o={};for(const a of D.ACH)o[a.id]=D.achReached(a,a.v(c));return o}
  // tiers reached since `before`, for the end screen
  function achDiff(p,before){const now=achReachedAll(p),out=[];for(const a of D.ACH)for(let t=before[a.id];t<now[a.id];t++)out.push({id:a.id,name:a.name,tier:t});return out}
  function achView(p){
    const c=achCtx(p);let pts=0,ready=0;
    const list=D.ACH.map(a=>{const val=a.v(c),reached=D.achReached(a,val),claimed=Math.min(p.ach[a.id]|0,reached);
      for(let t=0;t<reached;t++)pts+=D.ACH_TIERS[t].pts;ready+=reached-claimed;return{id:a.id,val,reached,claimed}});
    return{list,pts,ready};
  }
  // claims every reached tier that has not been paid yet; one achievement or all of them
  function achClaim(p,ids){
    const c=achCtx(p);let credits=0;const titles=[],tiers=[];
    for(const a of D.ACH){if(ids&&!ids.includes(a.id))continue;
      const reached=D.achReached(a,a.v(c));
      for(let t=p.ach[a.id]|0;t<reached;t++){credits+=D.ACH_TIERS[t].credits;tiers.push({id:a.id,tier:t});
        if(t===2&&a.title&&!p.titles.includes(a.title)){p.titles.push(a.title);titles.push(a.title)}}
      if(reached>(p.ach[a.id]|0))p.ach[a.id]=reached}
    if(!tiers.length)fail('Není co vyzvednout.');
    p.credits+=credits;return{credits,titles,tiers:tiers.length};
  }

  return{register,login,logout,auth,view,act,market,top,publicProfile,coPlayers,rewardsFor,rankedResult,canStartMission,friendOp,friendsView,isFriend,blocks,profById,
    guildView,guildList,tagOf,report,findPlayer:t=>profById(t)||profByNick(t),modView,modAction,muted,muteText,isAdmin,guildMembers:gid=>{const g=guildById(gid);return g?memberIds(g):[]},loadoutFor:(p,k,cap)=>D.computeLoadout(p,k,cap)};
}
