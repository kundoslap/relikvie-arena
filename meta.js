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

export function createMeta(db){
  const doc=db.doc;
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
    p.social??={friends:[],inReq:[],outReq:[],blocked:[]};
    // repairs saves damaged by the old "constructor" lookups (NaN credits, empty items, unknown class)
    if(!Number.isFinite(p.credits))p.credits=0;if(p.inv.some(i=>!i||!i.id))p.inv=p.inv.filter(i=>i&&i.id);if(!D.CLASSES[p.cls])p.cls='striker';
    const st=p.stats;st.bestEndless??=0;st.byCls??={};st.byMode??={};st.byBoss??={};st.dmg??=0;st.heal??=0;st.time??=0;st.mvp??=0;
    return p;
  }
  function rollGoals(p){
    const G=p.goals,day=D.dayKey(),wk=D.weekKey();
    if(G.day!==day){const keys=Object.keys(D.GOALS).sort(()=>Math.random()-.5).slice(0,D.DAILY_COUNT);G.day=day;G.list=keys.map(id=>({id,prog:0,claimed:false}));G.rerolled=false;G.bonus=false}
    if(G.week!==wk){const keys=Object.keys(D.WEEKLY_GOALS);G.week=wk;G.weekly={id:keys[Math.floor(Math.random()*keys.length)],prog:0,claimed:false}}
    const c=p.campaign;if(c.week!==wk){c.week=wk;c.weekWins=0;c.weekClaimed=false;c.echoWon=false}
    if(p.merchant.day!==day){p.merchant={day,offers:merchantOffers(p),rerolled:false}}
    rollSeason(p);
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
    return{token:issueToken(user),profile:view(doc.profiles[user.id])};
  }
  function logout(token){const h=sha(token),id=tokenIndex.get(h);if(!id)return;tokenIndex.delete(h);
    const u=Object.values(doc.users).find(x=>x.id===id);if(u)u.tokens=(u.tokens||[]).filter(t=>t!==h);db.touch()}
  function auth(token){if(!token)return null;const id=tokenIndex.get(sha(token));const p=id?doc.profiles[id]||null:null;if(p){migrate(p);rollGoals(p)}return p}

  function view(p){
    migrate(p);rollGoals(p);
    return{...p,xpNext:p.level>=D.MAX_LEVEL?0:D.xpFor(p.level),echo:D.echoOfWeek(D.weekKey()),
      campaignView:D.MISSIONS.map(m=>({id:m.id,open:missionOpen(p,m),cleared:p.campaign.cleared.includes(m.id)})),echoOpen:echoOpen(p),
      skinState:Object.fromEntries(D.CLASS_KEYS.map(k=>[k,D.SKINS[k].map(s=>({k:s.k,owned:D.skinOwned(p,k,s.k)}))])),
      listings:Object.values(doc.market).filter(l=>l.seller===p.id).length};
  }
  const item=(p,id)=>p.inv.find(i=>i.id===id)||fail('Předmět nenalezen.',404);
  // own keys only: an id like "constructor" must not resolve to Object.prototype.constructor
  const listing=id=>typeof id==='string'&&Object.hasOwn(doc.market,id)?doc.market[id]:null;
  function unequip(p,id){for(const s of D.SLOT_KEYS)if(p.eq[s]===id)delete p.eq[s]}
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
      if(!Array.isArray(ids)||!ids.length)fail('Vyber předměty k prodeji.');let got=0;
      for(const id of ids.slice(0,80)){const it=p.inv.find(i=>i.id===id);if(!it)continue;unequip(p,id);p.inv=p.inv.filter(i=>i!==it);got+=D.itemValue(it)}
      p.credits+=got;return{credits:got};
    },
    crate(p,{type}){
      const c=D.CRATES[type];if(!c)fail('Neznámý zásobník.');if(p.credits<c.price)fail('Nemáš dost kreditů.');
      if(p.inv.length>=D.INV_MAX)fail('Inventář je plný. Nejdřív něco prodej.');
      p.credits-=c.price;const it=D.rollItem(p.level,{boost:c.boost,minR:c.minR});p.inv.push(it);return{item:it};
    },
    marketList(p,{itemId,price}){
      price=Math.round(+price);if(!(price>=10&&price<=1e6))fail('Cena musí být 10 až 1 000 000 kreditů.');
      if(Object.values(doc.market).filter(l=>l.seller===p.id).length>=10)fail('Najednou můžeš prodávat nejvýš 10 předmětů.');
      const it=item(p,itemId);unequip(p,it.id);p.inv=p.inv.filter(i=>i!==it);
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
      p.credits+=cr;const levelUps=grantXp(p,xp);return{xp,credits:cr,item,levelUps};
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
      const s=doc.profiles[l.seller];if(s)s.credits+=Math.floor(l.price*(1-D.MARKET_FEE));
      return{item:l.item};
    }
  };
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
      .map(p=>({nick:p.nick,level:p.level,cls:p.cls,wins:p.stats.wins,bossKills:p.stats.bossKills,bestWave:p.stats.bestWave,bestEndless:p.stats.bestEndless|0})),
      season,ranked:Object.values(doc.profiles).filter(p=>p.ranked?.season===season&&p.ranked.games>0).sort((a,b)=>b.ranked.rating-a.ranked.rating).slice(0,30)
        .map(p=>({nick:p.nick,cls:p.cls,rating:p.ranked.rating,div:D.divisionOf(p.ranked.rating),games:p.ranked.games,wins:p.ranked.wins,placed:p.ranked.games>=D.PLACEMENT}))};
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
    migrate(p);const S=p.social,card=id=>{const o=profById(id);return o?{id,nick:o.nick,lv:o.level,cls:o.cls,title:o.title||null}:null};
    const list=ids=>ids.map(card).filter(Boolean);
    const order={match:0,lobby:1,online:2,offline:3};
    return{friends:list(S.friends).map(f=>({...f,...status(f.id)})).sort((a,b)=>order[a.st]-order[b.st]||a.nick.localeCompare(b.nick,'cs')),
      inReq:list(S.inReq),outReq:list(S.outReq),blocked:list(S.blocked)};
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
      out[e.pid]={delta,rating:R.rating,div:D.divisionOf(R.rating),prevDiv,games:R.games,left:!e.present};
    }
    db.touch();return out;
  }

  // ---------- rewards ----------
  function rewardsFor(M,u,p,loot,mvp=false,rk=null){
    const mult=D.DIFF_REWARD[M.diffKey]||1,part=Math.max(.25,Math.min(1,(M.time-(u.joinedAt||0))/Math.max(1,M.time)));
    let xp=0,cr=0,res='loss',record=0;const items=[...u.bag,...loot];
    const pveWin=!M.D.pvp&&(M.winner===0||M.D.endless&&M.wave>=D.ENDLESS_WIN);
    if(M.time<45&&!pveWin){let sold=0;for(const it of items)if(!giveItem(p,it))sold++;db.touch();return{xp:0,credits:0,items,res:'short',levelUps:[],sold,skin:null}}
    if(M.D.pvp){
      res=M.winner===u.team?'win':M.winner===-1||M.winner===null?'draw':'loss';
      xp={win:140,draw:100,loss:70}[res]+u.kills*8+u.relics*15;cr={win:60,draw:45,loss:30}[res]+u.kills*3;
      if(Math.random()<{win:.6,draw:.45,loss:.3}[res])items.push(D.rollItem(p.level));
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
    const won=res==='win',delta={matches:1,wins:won?1:0,winArena:won&&M.mode==='arena'?1:0,winControl:won&&M.mode==='control'?1:0,
      kills:M.D.pvp?u.kills:0,npcKills:u.npcKills,bossKills:won&&!M.D.pvp?(M.bossKills||0):0,wave:M.mode==='waves'?M.wave:0,endless:M.D.endless?M.wave:0,relics:u.relics,
      dmg:Math.round(u.dmgDealt),heal:Math.round(u.healDone),campaign:M.mission&&won?1:0};
    const done=[];
    const bump=(g,def)=>{if(!g||!def||g.claimed)return;const before=g.prog;g.prog=def.max?Math.max(g.prog,delta[def.stat]||0):Math.min(def.target,g.prog+(delta[def.stat]||0));
      if(before<def.target&&g.prog>=def.target)done.push(def.name)};
    for(const g of p.goals.list)bump(g,D.GOALS[g.id]);bump(p.goals.weekly,D.WEEKLY_GOALS[p.goals.weekly?.id]);
    // apply
    p.credits+=cr;const levelUps=grantXp(p,xp);
    let sold=0;for(const it of items)if(!giveItem(p,it))sold++;
    const st=p.stats;st.matches++;if(res==='win')st.wins++;else if(res==='loss')st.losses++;
    st.kills+=u.kills;st.npcKills+=u.npcKills;st.bossKills+=res==='win'?(M.bossKills||0):0;if(M.mode==='waves')st.bestWave=Math.max(st.bestWave,M.wave);if(M.D.endless)st.bestEndless=Math.max(st.bestEndless|0,M.wave);
    const won1=res==='win'?1:0,bump2=(o,k)=>{o[k]??={m:0,w:0};o[k].m++;o[k].w+=won1};
    bump2(st.byCls,u.clsKey);bump2(st.byMode,M.mission?'campaign':M.mode);
    if(res==='win')for(const b of M.bossKeys||[])st.byBoss[b]=(st.byBoss[b]|0)+1;
    st.dmg+=Math.round(u.dmgDealt);st.heal+=Math.round(u.healDone);st.time+=Math.round(M.time-(u.joinedAt||0));if(mvp)st.mvp++;
    p.history.unshift({at:Date.now(),mode:M.mode,map:M.mapKey,boss:M.mode==='boss'?M.bossKey:null,mission:M.mission,res,cls:u.clsKey,
      ki:u.kills,de:u.deaths,nk:u.npcKills,dm:Math.round(u.dmgDealt),he:Math.round(u.healDone),wave:M.D.waves?M.wave:0,
      score:M.D.pvp?[M.score[u.team],M.score[1-u.team]]:null,dur:Math.round(M.time),xp,cr,mvp,rk});
    p.history.length=Math.min(p.history.length,D.HISTORY_MAX);
    db.touch();
    return{xp,credits:cr,items,res,levelUps,sold,skin,camp,goalsDone:done,record,mvp};
  }

  return{register,login,logout,auth,view,act,market,top,rewardsFor,rankedResult,canStartMission,friendOp,friendsView,isFriend,blocks,profById,loadoutFor:(p,k)=>D.computeLoadout(p,k)};
}
