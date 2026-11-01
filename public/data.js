// Relikvie Aréna — shared game data: classes, skill trees, items, skins, maps, modes, NPCs and bosses.
// Imported by the simulation, the server and the client, so every rule has one source.

export const CLASSES={
  striker:{name:'Lovec',role:'Nápor a přesnost',color:0xffb347,css:'#ffb347',hp:230,speed:9.2,def:.08,atk:40,tech:12,pref:11,
    talent:'Kombinátor',talentDesc:'Zásah základním útokem zkrátí čekání schopností o 0,35 s.',
    basic:{type:'shot',name:'Pulzní střela',dmg:16,rate:.3,speed:46,range:22,size:1},
    skills:[{name:'Průrazný výpad',cost:30,cd:6,icon:'slash',desc:'Výpad vpřed a dva seky po 90 % útoku.'},
            {name:'Optické maskování',cost:25,cd:12,icon:'eye',desc:'3,5 s neviditelnost. Další zásah +45 % (Přepad).'},
            {name:'Krvavý šíp',cost:20,cd:5,icon:'arrow',desc:'Průrazný šíp. Krvácení 9 HP/s na 4 s.'}],
    ult:{name:'Bouřový průraz',icon:'bolt',desc:'Tři blesky v linii před tebou, každý 170 % útoku.'},
    relic:'Bouřová relikvie: +25 % poškození na 20 s.',bars:[.45,.9,.25,.95]},
  guardian:{name:'Strážce',role:'Výdrž a obrana',color:0x5dffa8,css:'#5dffa8',hp:360,speed:7.6,def:.22,atk:30,tech:16,pref:2.2,
    talent:'Bastion',talentDesc:'Každý zásah na blízko přidá 6 bodů štítu.',
    basic:{type:'melee',name:'Pancéřový úder',dmg:30,rate:.62,range:3.4},
    skills:[{name:'Kotva',cost:25,cd:8,icon:'anchor',desc:'Štít 90 a zpomalení nepřátel do 5,5 m o 40 %.'},
            {name:'Náraz',cost:30,cd:9,icon:'charge',desc:'Výpad až 8 m, omráčení 0,9 s a odhození.'},
            {name:'Štítová kupole',cost:35,cd:14,icon:'dome',desc:'Ty a spojenci do 7 m získáte štít 55.'}],
    ult:{name:'Titánův val',icon:'slam',desc:'Úder do země do 8 m: 200 % útoku, omráčení 1,4 s, štít 120.'},
    relic:'Titánova relikvie: štít 150 a −20 % přijatého poškození na 20 s.',bars:[1,.6,.35,.55]},
  technician:{name:'Technik',role:'Energie a obnova',color:0x6acbff,css:'#6acbff',hp:245,speed:8.4,def:.1,atk:24,tech:40,pref:12,
    talent:'Inženýr',talentDesc:'Zásah základním útokem vrátí 5 energie.',
    basic:{type:'shot',name:'Výbojový šíp',dmg:22,rate:.48,speed:34,range:20,size:1.5},
    skills:[{name:'Mor nanitů',cost:30,cd:9,icon:'nano',desc:'Zóna 4 m na 5 s, 50 % TECH za sekundu.'},
            {name:'Obnova',cost:30,cd:10,icon:'heal',desc:'Spojenci do 7,5 m léčí 22 HP/s po 3 s a zbaví se krvácení.'},
            {name:'EMP',cost:30,cd:9,icon:'emp',desc:'Výboj v místě: 110 % TECH, −40 energie, umlčení 1,6 s.'}],
    ult:{name:'Řetězový výboj',icon:'chain',desc:'Blesk přeskočí až na 5 cílů, každý zásah 160 % TECH.'},
    relic:'Relikvie ozvěny: energie ×1,8 a čekání −30 % na 20 s.',bars:[.55,.45,1,.75]}
};
export const CLASS_KEYS=Object.keys(CLASSES);

// ---------- progression ----------
export const MAX_LEVEL=50;
export const xpFor=l=>Math.round(100+l*50+l*l*3); // xp needed to go from level l to l+1
export const DIFF_REWARD={easy:.6,normal:1,hard:1.35};

// ---------- stats (items and skill tree feed the same modifiers) ----------
export const STATS={
  hp:{name:'Max. HP',unit:'%'},atk:{name:'Útok',unit:'%'},tech:{name:'TECH',unit:'%'},def:{name:'Obrana',unit:' b.'},
  speed:{name:'Rychlost',unit:'%'},regen:{name:'Obnova energie',unit:'%'},cdr:{name:'Zkrácení čekání',unit:'%'},
  shield:{name:'Síla štítů',unit:'%'},heal:{name:'Síla léčení',unit:'%'},leech:{name:'Vysávání',unit:'%'},
  ult:{name:'Nabíjení ultimátky',unit:'%'},start:{name:'Energie na startu',unit:''},ultDmg:{name:'Poškození ultimátkou',unit:'%'},rate:{name:'Rychlost útoku',unit:'%'}
};
export const fmtStat=(k,v)=>`${STATS[k]?.name||k} +${Math.round(v*10)/10}${STATS[k]?.unit??''}`;

// ---------- items ----------
export const SLOTS={core:{name:'Jádro',desc:'Útok, technika, vysávání'},dermal:{name:'Derma',desc:'Výdrž, obrana, štíty'},neural:{name:'Neurál',desc:'Energie, čekání, rychlost'}};
export const SLOT_KEYS=Object.keys(SLOTS);
export const RARITIES=[
  {name:'Běžný',color:'#a9b3c9',hex:0xa9b3c9,affixes:1,mult:1,weight:58},
  {name:'Neobvyklý',color:'#5dffa8',hex:0x5dffa8,affixes:2,mult:1.08,weight:26},
  {name:'Vzácný',color:'#4fb4ff',hex:0x4fb4ff,affixes:3,mult:1.18,weight:11},
  {name:'Epický',color:'#c08bff',hex:0xc08bff,affixes:3,mult:1.38,weight:4},
  {name:'Legendární',color:'#ffc66d',hex:0xffc66d,affixes:4,mult:1.55,weight:1}
];
const AFFIX_BASE={atk:4,tech:4,leech:1.6,ultDmg:5,hp:5,def:2.4,shield:6,heal:5,cdr:2.6,regen:5,speed:2.2,start:8,ult:5,rate:3};
const AFFIX_POOLS={core:['atk','tech','leech','ultDmg','rate'],dermal:['hp','def','shield','heal'],neural:['cdr','regen','speed','start','ult']};
const BASE_NAMES={core:['Fraktální jádro','Reaktorové jádro','Pulzní jádro','Žhnoucí jádro'],dermal:['Pancéřová derma','Titanová vrstva','Bastionová kůže','Vrstvená derma'],neural:['Neurální čip','Synaptický most','Ozvěnový uzel','Signální čip']};
export const UNIQUES={
  phoenix:{slot:'core',name:'Fénixovo jádro',desc:'Jednou za zápas tě po smrtelném zásahu oživí se 40 % HP.'},
  reactor:{slot:'core',name:'Přetížený reaktor',desc:'Ultimátka způsobí o 30 % víc poškození.'},
  thorns:{slot:'dermal',name:'Trnitá derma',desc:'Vrací 15 % přímého poškození útočníkovi.'},
  bastion:{slot:'dermal',name:'Živý val',desc:'Pod 30 % HP získáš štít 120. Nejvýš jednou za 30 s.'},
  mirror:{slot:'neural',name:'Zrcadlový neurál',desc:'Schopnost s 25% šancí nespustí čekání.'},
  capacitor:{slot:'neural',name:'Prázdný kondenzátor',desc:'Začínáš i oživuješ s plnou energií.'}
};
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
export const newId=()=>(globalThis.crypto?.randomUUID?.()||String(Math.random()).slice(2)+Date.now()).replace(/-/g,'').slice(0,14);
export function rollRarity(boost=0){
  const w=RARITIES.map((r,i)=>r.weight*Math.pow(1+boost,i));let x=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<w.length;i++){x-=w[i];if(x<=0)return i}return 0;
}
export function rollItem(level=1,o={}){
  const slot=o.slot||pick(SLOT_KEYS);let r=rollRarity(o.boost||0);if(o.minR)r=Math.max(r,o.minR);if(o.maxR!=null)r=Math.min(r,o.maxR);
  const R=RARITIES[r],pool=[...AFFIX_POOLS[slot]],aff=[];
  for(let i=0;i<R.affixes&&pool.length;i++){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    aff.push({k,v:Math.round(AFFIX_BASE[k]*(1+level*.045)*R.mult*rnd(.7,1)*10)/10})}
  let u=null,name=pick(BASE_NAMES[slot]);
  if(r===4){u=pick(Object.keys(UNIQUES).filter(k=>UNIQUES[k].slot===slot));name=UNIQUES[u].name}
  return{id:newId(),slot,r,lvl:level,aff,u,name};
}
export const itemValue=it=>Math.round([6,18,50,150,500][it.r]*(1+it.lvl*.08));
export const rollAffix=(k,level,r)=>Math.round(AFFIX_BASE[k]*(1+level*.045)*RARITIES[r].mult*rnd(.7,1)*10)/10;
export const affixPool=slot=>AFFIX_POOLS[slot]||[];

// ---------- forge (from the original Relikvie: essence, upgrades +1..+5, re-tuning) and sockets with crystals ----------
export const ESSENCE=[1,3,8,22,40],FRAGMENTS=[0,0,0,0,3];
// upgrade n -> n+1: minimum level, credits and essence; each rank adds 6 % to every affix of the item
export const UPGRADES=[{level:5,credits:40,essence:3},{level:10,credits:80,essence:6},{level:15,credits:140,essence:10},{level:20,credits:220,essence:16},{level:25,credits:320,essence:25}];
export const UPGRADE_STEP=.06,UPGRADE_MAX=UPGRADES.length;
export const upgradeCost=(it,n=it.up|0)=>{const U=UPGRADES[n];if(!U)return null;const k=[1,1,1.3,1.6,2][it.r];return{level:U.level,credits:Math.round(U.credits*k),essence:Math.round(U.essence*k)}};
export const retuneCost=it=>({level:10,credits:[30,40,60,80,100][it.r],essence:[2,3,5,8,12][it.r]});
export const upgradeMult=it=>1+UPGRADE_STEP*Math.min(UPGRADE_MAX,it.up|0);
// sockets: how many a rarity can have and what opening the next one costs
export const SOCKETS_MAX=[0,1,1,2,3];
export const SOCKET_COST=[{credits:100,essence:10},{credits:300,essence:25},{credits:700,essence:50}];
export const CRYSTALS={
  ruby:{name:'Rubín',stat:'atk',color:'#ff4f6d',v:[1.5,2.5,4,6,9]},
  emerald:{name:'Smaragd',stat:'hp',color:'#5dffa8',v:[2,3.5,5,7.5,11]},
  sapphire:{name:'Safír',stat:'tech',color:'#4fb4ff',v:[1.5,2.5,4,6,9]},
  topaz:{name:'Topas',stat:'cdr',color:'#ffc66d',v:[1,1.6,2.4,3.5,5]},
  onyx:{name:'Onyx',stat:'def',color:'#c9d1e6',v:[1,1.6,2.4,3.5,5]},
  amethyst:{name:'Ametyst',stat:'ult',color:'#c08bff',v:[2,3,4.5,6.5,9]}
};
export const CRYSTAL_TIERS=['I','II','III','IV','V'];
export const CRYSTAL_COMBINE=[20,50,120,300]; // credits to merge three of tier n into one of n+1
export const crystalKey=(type,tier)=>`${type}:${tier}`;
export function parseCrystal(key){const [type,t]=String(key).split(':'),tier=+t;return Object.hasOwn(CRYSTALS,type)&&Number.isInteger(tier)&&tier>=1&&tier<=5?{type,tier,C:CRYSTALS[type],v:CRYSTALS[type].v[tier-1]}:null}
export const crystalName=key=>{const c=parseCrystal(key);return c?`${c.C.name} ${CRYSTAL_TIERS[c.tier-1]}`:'?'};
export const rollCrystal=(maxTier=1)=>crystalKey(pick(Object.keys(CRYSTALS)),1+Math.floor(Math.random()*maxTier));
export const DISTILL={essence:40}; // a random tier I crystal for essence
export const CRAFT={epic:{essence:150,credits:300,minR:3},legendary:{fragments:30,credits:1000,minR:4}};
// the effective affixes of an item: upgrades scale the rolled ones, crystals add their own
export function itemStats(it){
  const m=upgradeMult(it),out=it.aff.map(a=>({k:a.k,v:Math.round(a.v*m*10)/10}));
  for(const s of it.sock||[]){const c=s&&parseCrystal(s);if(c)out.push({k:c.C.stat,v:c.v,crystal:s})}
  return out;
}
export const INV_MAX=80;
export const CRATES={
  basic:{name:'Zásobník',desc:'Náhodný implantát tvé úrovně.',price:150,boost:0,minR:0},
  rare:{name:'Vzácný zásobník',desc:'Nejméně vzácný implantát, vyšší šance na epický a legendární.',price:650,boost:.6,minR:2}
};
export const MARKET_FEE=.05;

// ---------- skins ----------
// acc: decorative piece built by the client (cape, hood, horns, crest, crown, antenna)
export const SKINS={
  striker:[
    {k:'default',name:'Základní',armor:0x3d3226,glow:0xffb347,acc:null},
    {k:'night',name:'Noční lovec',armor:0x1a1d2b,glow:0xb388ff,acc:'cape',req:{level:5}},
    {k:'desert',name:'Pouštní stopař',armor:0x8a6a3a,glow:0xff7b3a,acc:'hood',req:{credits:900}},
    {k:'relic',name:'Relikviový lovec',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonový průkopník',armor:0x0c1222,glow:0x3fffd2,acc:'hood',req:{pass:true}}],
  guardian:[
    {k:'default',name:'Základní',armor:0x2b3d3a,glow:0x5dffa8,acc:null},
    {k:'obsidian',name:'Obsidián',armor:0x15161c,glow:0xff5d6c,acc:'horns',req:{level:5}},
    {k:'cobalt',name:'Kobaltová stráž',armor:0x24406e,glow:0x6acbff,acc:'crest',req:{credits:900}},
    {k:'relic',name:'Relikviový strážce',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonová hradba',armor:0x0c1222,glow:0xff3fb4,acc:'crest',req:{pass:true}}],
  technician:[
    {k:'default',name:'Základní',armor:0x28304e,glow:0x6acbff,acc:null},
    {k:'violet',name:'Fialový obvod',armor:0x2b2045,glow:0xe27dff,acc:'antenna',req:{level:5}},
    {k:'frost',name:'Mrazivý archivář',armor:0x8fa8bf,glow:0x9ffcff,acc:'cape',req:{credits:900}},
    {k:'relic',name:'Relikviový technik',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonový obvod',armor:0x0c1222,glow:0x8f7dff,acc:'antenna',req:{pass:true}}]
};
export const skinOf=(k,s)=>SKINS[k]?.find(x=>x.k===s)||SKINS[k]?.[0];
export function skinOwned(p,k,s){const d=skinOf(k,s);if(!d||d.k!==s)return false;if(!d.req)return true;
  if(d.req.level)return p.level>=d.req.level;return (p.skins||[]).includes(k+':'+s)}

// ---------- skill trees ----------
// Branch tier t (0-4) needs t*3 points spent in that branch. Every class tree gets level-1 points.
export const TREES={
  striker:[
    {k:'shadow',name:'Stín',desc:'Maskování, krvácení a přepady.',nodes:[
      {id:'s1',name:'Tichý krok',max:3,fx:{speed:2},desc:'+2 % rychlost pohybu za úroveň.'},
      {id:'s2',name:'Delší maskování',max:3,fx:{cloakT:.5},desc:'Maskování trvá o 0,5 s déle.'},
      {id:'s3',name:'Hluboké rány',max:3,fx:{bleed:20},desc:'Krvácení dává o 20 % víc poškození.'},
      {id:'s4',name:'Přepadový instinkt',max:3,fx:{ambush:10},desc:'Přepad zesílí o dalších 10 %.'},
      {id:'s5',name:'Fantom',max:1,fx:{cloakHeal:1},desc:'Maskování obnoví 15 % HP a zastaví krvácení.'}]},
    {k:'storm',name:'Bouře',desc:'Poškození a ultimátka.',nodes:[
      {id:'b1',name:'Ostré čepele',max:3,fx:{atk:3},desc:'+3 % útok.'},
      {id:'b2',name:'Statický náboj',max:3,fx:{ult:8},desc:'Ultimátka se nabíjí o 8 % rychleji.'},
      {id:'b3',name:'Průrazné blesky',max:3,fx:{ultDmg:8},desc:'Ultimátka způsobí o 8 % víc.'},
      {id:'b4',name:'Kombinátor II',max:3,fx:{comboCdr:.15},desc:'Zásah zkrátí čekání o dalších 0,15 s.'},
      {id:'b5',name:'Čtvrtý blesk',max:1,fx:{stormN:1},desc:'Bouřový průraz udeří čtyřikrát.'}]},
    {k:'hunt',name:'Lov',desc:'Výdrž, rychlost útoku a výpady.',nodes:[
      {id:'h1',name:'Houževnatost',max:3,fx:{hp:4},desc:'+4 % maximálního HP.'},
      {id:'h2',name:'Rychlá spoušť',max:3,fx:{rate:5},desc:'+5 % rychlost útoku.'},
      {id:'h3',name:'Dlouhý výpad',max:3,fx:{dashLen:1},desc:'Průrazný výpad doletí o 1 m dál.'},
      {id:'h4',name:'Krvežíznivost',max:3,fx:{leech:2},desc:'Vysaješ 2 % způsobeného poškození.'},
      {id:'h5',name:'Trojúder',max:1,fx:{triple:1},desc:'Průrazný výpad sekne potřetí.'}]}
  ],
  guardian:[
    {k:'bastion',name:'Bastion',desc:'Výdrž, obrana a štíty.',nodes:[
      {id:'g1',name:'Pevná postava',max:3,fx:{hp:5},desc:'+5 % maximálního HP.'},
      {id:'g2',name:'Kalené pláty',max:3,fx:{def:2},desc:'+2 body obrany.'},
      {id:'g3',name:'Silné štíty',max:3,fx:{shield:8},desc:'Tvé štíty jsou o 8 % silnější.'},
      {id:'g4',name:'Těžká kotva',max:3,fx:{anchorSh:20},desc:'Kotva přidá o 20 štítu víc.'},
      {id:'g5',name:'Nezlomný',max:1,fx:{lowDR:1},desc:'Pod 30 % HP přijímáš o 25 % méně poškození.'}]},
    {k:'impact',name:'Náraz',desc:'Omráčení a ultimátka.',nodes:[
      {id:'i1',name:'Drtivá síla',max:3,fx:{atk:3},desc:'+3 % útok.'},
      {id:'i2',name:'Otřes',max:3,fx:{stunT:.2},desc:'Náraz omráčí o 0,2 s déle.'},
      {id:'i3',name:'Rozběh',max:3,fx:{chargeLen:1},desc:'Náraz doletí o 1 m dál.'},
      {id:'i4',name:'Široký val',max:3,fx:{slamR:.7},desc:'Titánův val zasáhne o 0,7 m dál.'},
      {id:'i5',name:'Zemětřesení',max:1,fx:{quake:1},desc:'Titánův val zpomalí o 40 % na 3 s a omráčí o 0,5 s déle.'}]},
    {k:'ward',name:'Ochrana',desc:'Podpora týmu.',nodes:[
      {id:'w1',name:'Klidná mysl',max:3,fx:{regen:5},desc:'Energie se obnovuje o 5 % rychleji.'},
      {id:'w2',name:'Pevná kupole',max:3,fx:{domeSh:15},desc:'Kupole dá o 15 štítu víc.'},
      {id:'w3',name:'Disciplína',max:3,fx:{cdr:3},desc:'Čekání schopností −3 %.'},
      {id:'w4',name:'Odolná kůže',max:3,fx:{hp:3,def:1},desc:'+3 % HP a +1 bod obrany.'},
      {id:'w5',name:'Kupole života',max:1,fx:{domeHeal:1},desc:'Kupole také léčí 20 HP/s po 3 s.'}]}
  ],
  technician:[
    {k:'nano',name:'Nanity',desc:'Zóny a poškození v čase.',nodes:[
      {id:'n1',name:'Kalibrace',max:3,fx:{tech:3},desc:'+3 % TECH.'},
      {id:'n2',name:'Široký mor',max:3,fx:{zoneR:.5},desc:'Zóna nanitů je o 0,5 m větší.'},
      {id:'n3',name:'Agresivní nanity',max:3,fx:{zoneDps:15},desc:'Zóna dává o 15 % víc poškození.'},
      {id:'n4',name:'Rychlá výroba',max:3,fx:{cdr:3},desc:'Čekání schopností −3 %.'},
      {id:'n5',name:'Trvalá nákaza',max:1,fx:{zoneLong:1},desc:'Zóna vydrží o 3 s déle a zpomaluje.'}]},
    {k:'mend',name:'Obnova',desc:'Léčení a ochrana spojenců.',nodes:[
      {id:'m1',name:'Zdravotní protokol',max:3,fx:{heal:8},desc:'Léčení je o 8 % silnější.'},
      {id:'m2',name:'Silná obnova',max:3,fx:{restore:4},desc:'Obnova léčí o 4 HP/s víc.'},
      {id:'m3',name:'Úsporný režim',max:3,fx:{regen:6},desc:'Energie se obnovuje o 6 % rychleji.'},
      {id:'m4',name:'Ochranné pole',max:3,fx:{restoreSh:10},desc:'Obnova dá spojencům i 10 štítu.'},
      {id:'m5',name:'Rychlá obnova',max:1,fx:{restoreCd:1},desc:'Obnova má čekání o 4 s kratší.'}]},
    {k:'arc',name:'Výboj',desc:'EMP a řetězový výboj.',nodes:[
      {id:'a1',name:'Přepětí',max:3,fx:{tech:3},desc:'+3 % TECH.'},
      {id:'a2',name:'Široký výboj',max:3,fx:{empR:.5},desc:'EMP zasáhne o 0,5 m dál.'},
      {id:'a3',name:'Delší řetěz',max:3,fx:{chain:1},desc:'Řetězový výboj přeskočí na jeden cíl navíc.'},
      {id:'a4',name:'Přetaktování',max:3,fx:{ult:6},desc:'Ultimátka se nabíjí o 6 % rychleji.'},
      {id:'a5',name:'Přetížení',max:1,fx:{overload:1},desc:'EMP umlčí o 1 s déle a způsobí o 40 % víc.'}]}
  ]
};
export function treeSpent(alloc){return Object.values(alloc||{}).reduce((a,b)=>a+(b|0),0)}
// Returns a cleaned allocation or null when it breaks the rules.
export function validateTree(k,alloc,level){
  const T=TREES[k];if(!T||!alloc||typeof alloc!=='object')return null;
  const out={};let total=0;
  for(const br of T){let spent=0;
    br.nodes.forEach((n,t)=>{const r=Math.max(0,Math.min(n.max,alloc[n.id]|0));if(!r)return;if(spent<t*3)throw 0;out[n.id]=r;spent+=r});
    total+=spent}
  if(total>Math.max(0,level-1))return null;
  return out;
}
export function safeTree(k,alloc,level){try{return validateTree(k,alloc,level)}catch{return null}}

// Sums items, the class tree and the profession into one loadout for the simulation.
export function computeLoadout(p,k,cap=MASTERY.max){
  const mods={},uniq=[];const add=(key,v)=>mods[key]=(mods[key]||0)+v;
  for(const s of SLOT_KEYS){const id=p?.eq?.[s];const it=id&&p.inv?.find(i=>i.id===id);if(!it)continue;for(const a of itemStats(it))add(a.k,a.v);if(it.u)uniq.push(it.u)}
  const alloc=p?.tree?.[k]||{};
  for(const br of TREES[k]||[])for(const n of br.nodes){const r=alloc[n.id]|0;if(r)for(const [fk,fv] of Object.entries(n.fx))add(fk,fv*r)}
  const skin=p&&skinOwned(p,k,p.skin?.[k])?p.skin[k]:'default';
  const prof=profLoadout(p,k);
  for(const id of prof.pass)for(const [fk,fv] of Object.entries(PASSIVES[id].fx||{}))add(fk,fv);
  if(prof.cap)for(const [fk,fv] of Object.entries(SCHOOLS[prof.cap].cap.fx))add(fk,fv);
  const tactic=TACTICS[p?.tactic]&&(p.level||1)>=TACTICS[p.tactic].lvl?p.tactic:'dodge';
  // ultimate mastery charges the ultimate faster: +1 % per rank, +10 % with the Rychlé nabití branch
  const mastery=masteryLoadout(p,cap),um=mastery[k+':ult'];
  if(um)add('ult',um.r*MASTERY.ultPerRank+(um.b[0]===0?10:0));
  return{mods,uniq,skin,level:p?.level||1,prof,title:p?.title||null,tactic,mastery};
}

// ---------- professions ----------
// Unlock levels follow the original Relikvie order, squeezed into levels 10-50.
export const PROF_LV={main:10,skills:15,pass2:20,second:30,mod:35,pass3:40,ult:45,cap:50};
export const SCHOOLS={
  strike:{name:'Úder',desc:'Přímé poškození, krvácení a průrazné útoky.',color:'#ff7b5a',skills:['cleave','rend','drive'],
    cap:{name:'Mistr úderu',desc:'+8 % útok a TECH.',fx:{atk:8,tech:8}}},
  shadow:{name:'Stín',desc:'Přepady, úhyby a rychlé údery z nečekaných směrů.',color:'#b388ff',skills:['ambush','feint','scatter','double'],
    cap:{name:'Mistr stínu',desc:'+8 % rychlost pohybu a +6 % rychlost útoku.',fx:{speed:8,rate:6}}},
  tech:{name:'Technika',desc:'Energie, výboje a kontrola soupeřů.',color:'#6acbff',skills:['arc','leak','pulse','nanites'],
    cap:{name:'Mistr techniky',desc:'−10 % čekání schopností.',fx:{cdr:10}}},
  guard:{name:'Ochrana',desc:'Štíty, léčení a ochrana spojenců.',color:'#5dffa8',skills:['bulwark','patch','intercept'],
    cap:{name:'Mistr ochrany',desc:'+8 % maximálního HP a +2 body obrany.',fx:{hp:8,def:2}}}
};
export const SCHOOL_KEYS=Object.keys(SCHOOLS);
export const PROF_SKILLS={
  cleave:{school:'strike',name:'Rozpolcení',cost:25,cd:7,icon:'cleave',desc:'Široký sek do 5 m před tebou, 130 % síly.',mod:{name:'Široký řez',desc:'Dosah sekání +50 %.'},proto:{name:'Krvavý oblouk',desc:'Zasažení krvácejí 8 HP/s po 3 s.'}},
  rend:{school:'strike',name:'Roztržení',cost:25,cd:8,icon:'rend',desc:'Výpad 5 m, 80 % síly a krvácení 12 HP/s na 4 s všem zasaženým.',mod:{name:'Hluboké roztržení',desc:'Krvácení je dvakrát silnější.'},proto:{name:'Rychlý výpad',desc:'Výpad až 8 m a čekání o 2 s kratší.'}},
  drive:{school:'strike',name:'Průnik',cost:20,cd:10,icon:'drive',desc:'Další 3 základní útoky dávají +40 % a prorážejí cíle.',mod:{name:'Neúnavný průnik',desc:'Posílí 5 útoků místo 3.'},proto:{name:'Drtivý průnik',desc:'Jen 2 útoky, ale +80 % místo +40 %.'}},
  ambush:{school:'shadow',name:'Přepadení',cost:30,cd:11,icon:'ambush',desc:'Přeneseš se za soupeře do 10 m. Další zásah má Přepad +45 %.',mod:{name:'Smrtící přepad',desc:'Přepad z této schopnosti dává +75 %.'},proto:{name:'Stínový únik',desc:'Po přenesení se na 1,5 s maskuješ.'}},
  feint:{school:'shadow',name:'Klam',cost:25,cd:12,icon:'feint',desc:'1,5 s nezranitelnost a +40 % rychlost na 2 s.',mod:{name:'Dvojí klam',desc:'Čekání o 4 s kratší.'},proto:{name:'Zrcadlový klam',desc:'Klam tě vyléčí o 12 % HP.'}},
  scatter:{school:'shadow',name:'Rozptyl',cost:25,cd:7,icon:'scatter',desc:'Vějíř 5 střel, každá 55 % síly.',mod:{name:'Hustý rozptyl',desc:'8 střel místo 5.'},proto:{name:'Ostnatý rozptyl',desc:'Zasažení jsou 2 s zpomalení.'}},
  arc:{school:'tech',name:'Oblouk',cost:25,cd:6,icon:'arcs',desc:'Výboj v přímce 14 m, 120 % síly všem na trase.',mod:{name:'Řetězový oblouk',desc:'Na konci přeskočí na další cíl.'},proto:{name:'Přetížený oblouk',desc:'Zasažené umlčí na 1 s.'}},
  leak:{school:'tech',name:'Únik energie',cost:15,cd:9,icon:'leak',desc:'Oblast 4 m: soupeři ztratí 30 energie, ty ji získáš, 50 % síly.',mod:{name:'Krádež',desc:'Každý ukradený bod energie tě vyléčí o 1 HP.'},proto:{name:'Vysátí',desc:'Zasažení jsou 2 s zpomalení.'}},
  pulse:{school:'tech',name:'Puls',cost:30,cd:11,icon:'pulse',desc:'Spojenci do 6 m získají štít 40, soupeře do 5 m to odhodí.',mod:{name:'Silný puls',desc:'Štít pulsu +30.'},proto:{name:'Odpudivý puls',desc:'Odhodí soupeře o 6 m a omráčí je na 0,6 s.'}},
  bulwark:{school:'guard',name:'Hradba',cost:25,cd:12,icon:'bulwark',desc:'Na 3 s přijímáš o 50 % méně poškození a získáš štít 60.',mod:{name:'Odraz',desc:'Během Hradby vracíš 30 % poškození.'},proto:{name:'Pevná hradba',desc:'Hradba trvá 5 s místo 3.'}},
  patch:{school:'guard',name:'Záplata',cost:30,cd:12,icon:'patch',desc:'Ty a nejzraněnější spojenec do 10 m se vyléčíte o 25 % HP během 2 s.',mod:{name:'Silná záplata',desc:'Léčení +50 %.'},proto:{name:'Okamžitá záplata',desc:'Vyléčí všechno naráz místo za 2 s.'}},
  intercept:{school:'guard',name:'Zachycení',cost:25,cd:10,icon:'intercept',desc:'Skok ke spojenci do 10 m, oba získáte štít 70.',mod:{name:'Strážný anděl',desc:'Štít +40 a spojenec se zbaví krvácení.'},proto:{name:'Výpad ochránce',desc:'Po dopadu omráčí soupeře do 3 m na 1 s.'}},
  double:{school:'shadow',name:'Dvojúder',cost:25,cd:8,icon:'double',desc:'Dva oddělené seky z opačných stran do stejného cíle do 8 m, každý 75 % síly.',mod:{name:'Třetí sek',desc:'Přidá třetí sek zepředu.'},proto:{name:'Návrat do stínu',desc:'Po druhém seku se vrátíš na místo, odkud jsi vyrazil.'}},
  nanites:{school:'tech',name:'Mor nanitů',cost:30,cd:10,icon:'nano',desc:'Nakazí cíl do 14 m: 6 zásahů po 35 % síly, jeden za sekundu. Nákaza přeskakuje na soupeře do 3,5 m.',mod:{name:'Virulentní kmen',desc:'Nákaza přeskakuje do 5 m a má 8 zásahů.'},proto:{name:'Rozklad',desc:'Nakažení dostávají o 10 % víc poškození.'}}
};
export const PASSIVES={
  fury:{school:'strike',name:'Zuřivost',desc:'Pod 50 % HP způsobuješ o 10 % víc poškození.'},
  executioner:{school:'strike',name:'Popravčí',desc:'Cílům pod 30 % HP způsobuješ o 20 % víc.'},
  razor:{school:'strike',name:'Krvavý břit',desc:'Základní útok má 15% šanci způsobit krvácení 6 HP/s na 3 s.'},
  shadowstep:{school:'shadow',name:'Stínový krok',desc:'Po použití schopnosti +20 % rychlost na 2 s.'},
  echo:{school:'shadow',name:'Ozvěna',desc:'Zničení soupeře vynuluje schopnost s nejdelším čekáním.'},
  reflex:{school:'shadow',name:'Rychlé reflexy',desc:'10% šance úplně se vyhnout přímému zásahu.'},
  battery:{school:'tech',name:'Baterie',desc:'Energie se obnovuje o 15 % rychleji.',fx:{regen:15}},
  overcharge:{school:'tech',name:'Přebití',desc:'Schopnosti stojí o 10 % méně energie.'},
  resonator:{school:'tech',name:'Rezonátor',desc:'Ultimátka se nabíjí o 15 % rychleji.',fx:{ult:15}},
  reserve:{school:'guard',name:'Ochranná rezerva',desc:'Každý život začínáš se štítem 60.'},
  plating:{school:'guard',name:'Zesílené pláty',desc:'+3 body obrany.',fx:{def:3}},
  recovery:{school:'guard',name:'Regenerace',desc:'Po 4 s bez zásahu obnovuješ 1,5 % HP za sekundu.'}
};
export const ULT_MODS={
  striker:{name:'Bouřkové oko',desc:'Blesky Bouřového průrazu zpomalí zasažené o 40 % na 2 s.'},
  guardian:{name:'Otřesová vlna',desc:'Titánův val si před omráčením přitáhne soupeře o 2 m blíž a má dosah +1 m.'},
  technician:{name:'Statický řetěz',desc:'Každý zásah Řetězového výboje umlčí cíl na 1 s.'}
};
// Taktické akce: one universal action on T for every class, chosen in the profile
export const TACTICS={
  dodge:{name:'Úhyb',lvl:1,cd:12,icon:'dodge',desc:'Rychlý skok o 6 m ve směru pohybu a 0,4 s nezranitelnost.'},
  decon:{name:'Dekontaminace',lvl:3,cd:20,icon:'decon',desc:'Odstraní mor nanitů, krvácení, zpomalení a umlčení. Na 4 s tě chrání před nákazou a krvácením.'},
  overload:{name:'Nouzové přebití',lvl:6,cd:28,icon:'bolt',desc:'Okamžitě +45 energie.'},
  beacon:{name:'Signální maják',lvl:9,cd:22,icon:'beacon',desc:'Označí soupeře do 6 m od místa míření: 4 s dostávají o 25 % víc poškození a nemůžou se maskovat.'},
  barrier:{name:'Polní bariéra',lvl:12,cd:26,icon:'bulwark',desc:'Štít ve výši 22 % tvého maximálního HP.'}
};
export const TACTIC_KEYS=Object.keys(TACTICS);
export const BOT_TACTIC={striker:'dodge',guardian:'barrier',technician:'decon'};
const classSkillIds=['c0','c1','c2'];
// All skills a player may slot for a class at a given profession state.
export function availableSkills(p,k){
  const pr=p?.prof||{},lv=p?.level||1,out=[...classSkillIds];
  if(pr.main&&lv>=PROF_LV.skills)out.push(...SCHOOLS[pr.main].skills);
  if(pr.second&&pr.secondSkill&&lv>=PROF_LV.second&&SCHOOLS[pr.second]?.skills.includes(pr.secondSkill))out.push(pr.secondSkill);
  return out;
}
export function skillDef(k,id){if(id&&id[0]==='c'&&id.length===2)return{...CLASSES[k].skills[+id[1]],id};const s=PROF_SKILLS[id];return s?{...s,id}:null}
export function profLoadout(p,k){
  const pr=p?.prof||{},lv=p?.level||1,avail=availableSkills(p,k);
  let slots=(pr.slots?.[k]||classSkillIds).filter(id=>avail.includes(id));
  if(new Set(slots).size!==3)slots=[...classSkillIds];
  const pass=[];
  if(pr.main&&lv>=PROF_LV.main&&PASSIVES[pr.p1]?.school===pr.main)pass.push(pr.p1);
  if(pr.main&&lv>=PROF_LV.pass2&&PASSIVES[pr.p2]?.school===pr.main&&pr.p2!==pr.p1)pass.push(pr.p2);
  if(pr.main&&lv>=PROF_LV.pass3&&PASSIVES[pr.p3]?.school===pr.main&&!pass.includes(pr.p3))pass.push(pr.p3);
  return{skills:slots,pass,
    branch:pr.main&&lv>=PROF_LV.skills&&SCHOOLS[pr.main].skills.includes(pr.branch)?pr.branch:null,
    mod:pr.main&&lv>=PROF_LV.mod&&SCHOOLS[pr.main].skills.includes(pr.mod)?pr.mod:null,proto:pr.proto==='b'?'b':'a',
    ultMod:lv>=PROF_LV.ult&&!!pr.ultMod,cap:pr.main&&lv>=PROF_LV.cap?pr.main:null};
}
// Validates a profession draft against the player's level; returns a cleaned copy or an error string.
export function validateProf(level,d){
  const o={};if(!d||typeof d!=='object')return'Neplatná data.';
  if(d.main){if(!SCHOOLS[d.main])return'Neznámá profese.';if(level<PROF_LV.main)return`Profesi zvolíš od úrovně ${PROF_LV.main}.`;o.main=d.main}
  const passOk=(id,lv)=>!id||(o.main&&PASSIVES[id]?.school===o.main&&level>=lv);
  for(const [k,lv] of [['p1',PROF_LV.main],['p2',PROF_LV.pass2],['p3',PROF_LV.pass3]]){if(!passOk(d[k],lv))return'Pasivku teď nelze zvolit.';if(d[k])o[k]=d[k]}
  if(new Set([o.p1,o.p2,o.p3].filter(Boolean)).size!==[o.p1,o.p2,o.p3].filter(Boolean).length)return'Každá pasivka může být vybraná jen jednou.';
  if(d.branch){if(!o.main||level<PROF_LV.skills||!SCHOOLS[o.main].skills.includes(d.branch))return'Větev musí být schopnost hlavní profese.';o.branch=d.branch}
  if(d.second){if(level<PROF_LV.second||!SCHOOLS[d.second]||d.second===o.main)return'Vedlejší profese musí být jiná než hlavní.';o.second=d.second;
    if(d.secondSkill){if(!SCHOOLS[d.second].skills.includes(d.secondSkill))return'Půjčená schopnost nepatří vedlejší profesi.';o.secondSkill=d.secondSkill}}
  if(d.mod){if(!o.main||level<PROF_LV.mod||!SCHOOLS[o.main].skills.includes(d.mod))return'Protokol musí patřit schopnosti hlavní profese.';o.mod=d.mod;if(d.proto==='b')o.proto='b'}
  if(d.ultMod){if(level<PROF_LV.ult)return`Úpravu ultimátky odemkneš na úrovni ${PROF_LV.ult}.`;o.ultMod=true}
  o.slots={};
  for(const k of CLASS_KEYS){const s=d.slots?.[k];if(!s)continue;if(!Array.isArray(s)||s.length!==3||new Set(s).size!==3)return'Každé povolání potřebuje tři různé schopnosti.';
    const avail=availableSkills({level,prof:o},k);if(!s.every(id=>avail.includes(id)))return'Tuhle schopnost ještě nemáš odemčenou.';o.slots[k]=[...s]}
  return o;
}

// ---------- campaign ----------
export const MISSIONS=[
  {id:'m1',name:'Signál v jádru',desc:'Tři vlny průzkumných dronů v Neonovém jádru.',mode:'waves',map:'core',waves:3,level:1,reward:{xp:300,credits:150,minR:1,title:'Nositel signálu'}},
  {id:'m2',name:'Sběratel',desc:'První strážce relikvie loví signály. Pozor na označení a výpad.',mode:'boss',map:'core',boss:'collector',level:3,reward:{xp:500,credits:250,minR:1,title:'Lovec sběratelů'}},
  {id:'m3',name:'Žár kovárny',desc:'Pět vln mezi lávovými kanály. Na konci čeká Pancéřník.',mode:'waves',map:'forge',waves:5,waveBoss:'armor',level:6,reward:{xp:700,credits:300,minR:2,title:'Kovář přežití'}},
  {id:'m4',name:'Strážce trezoru',desc:'Pancéřník v plné síle. Prolomte jeho štít, nebo se schovejte.',mode:'boss',map:'forge',boss:'armor',level:9,reward:{xp:900,credits:400,minR:2,title:'Lamač pancířů'}},
  {id:'m5',name:'Mrazivý archiv',desc:'Archivář skrývá pravý střep mezi falešnými. Zničte ten správný.',mode:'boss',map:'archive',boss:'archivist',level:12,reward:{xp:1100,credits:450,minR:2,title:'Čtenář střepů'}},
  {id:'m6',name:'Hlas prázdnoty',desc:'Vlny a rotující paprsky ve svatyni. Sloupy jsou jediný úkryt.',mode:'boss',map:'sanctum',boss:'voice',level:15,reward:{xp:1300,credits:500,minR:3,title:'Umlčovatel'}},
  {id:'m7',name:'Královna roje',desc:'Matrona a její opraváři. Bez zničení roje ji nezraníte.',mode:'boss',map:'archive',boss:'matrona',level:18,reward:{xp:1500,credits:600,minR:3,title:'Ničitel roje'}},
  {id:'m8',name:'Omega',desc:'Poslední strážce spojuje mechaniky všech ostatních. Tři fáze.',mode:'boss',map:'sanctum',boss:'omega',level:22,reward:{xp:2500,credits:1000,minR:4,title:'Nositel relikvie',skin:'relic'}},
  {id:'m9',act:2,name:'Pán břemene',desc:'Nositel rozdává břemena. Kdo ho nese, musí od týmu utéct.',mode:'boss',map:'forge',boss:'carrier',level:25,reward:{xp:2600,credits:900,minR:3,title:'Nosič břemen'}},
  {id:'m10',act:2,name:'Jedová stopa',desc:'Mantikora skáče, bodá a zamořuje archiv jedem. Pod 30 % zuří.',mode:'boss',map:'archive',boss:'manticore',level:28,reward:{xp:2900,credits:1000,minR:3,title:'Krotitel mantikory'}},
  {id:'m11',act:2,name:'Šest křídel',desc:'Serafín vzlétá nad svatyni a sesílá kopí světla.',mode:'boss',map:'sanctum',boss:'seraph',level:31,reward:{xp:3200,credits:1100,minR:4,title:'Lovec andělů'}},
  {id:'m12',act:2,name:'Rozsudek',desc:'Archon soudí relikvie. Jeho rozsudek spálí polovinu arény.',mode:'boss',map:'core',boss:'archon',level:35,reward:{xp:4000,credits:1500,minR:4,title:'Soudce Archonu'}}
];
export const ACTS={1:'Akt I · Strážci relikvie',2:'Akt II · Soud relikvií'};
export const missionById=id=>MISSIONS.find(m=>m.id===id);
export const SHARDS_FOR_PLAN=20,SHARDS_PER_WIN=4,WEEKLY_CAMPAIGN_WINS=5;
export const ECHO_MODS={
  tough:{name:'Odolní nepřátelé',desc:'Nepřátelé mají o 35 % víc HP.'},
  fierce:{name:'Zuřiví nepřátelé',desc:'Nepřátelé způsobují o 25 % víc poškození.'},
  swift:{name:'Rychlé čekání',desc:'Tvoje schopnosti mají o 25 % kratší čekání.'},
  bleed:{name:'Krvavá ozvěna',desc:'Zásahy nepřátel způsobují krvácení.'},
  noheal:{name:'Suchá ozvěna',desc:'Léčení je o 50 % slabší.'},
  surge:{name:'Přebití',desc:'Energie se obnovuje o 50 % rychleji.'}
};
// Weekly "Ozvěna jádra": a boss and two modifiers picked from the week number, the same for everyone.
export function echoOfWeek(wk){
  const n=parseInt(String(wk).replace(/\D/g,''),10)||0,bosses=['collector','armor','archivist','voice','matrona','omega','carrier','manticore','seraph','archon'],keys=Object.keys(ECHO_MODS);
  const boss=bosses[n%bosses.length],a=keys[n%keys.length],b=keys[(n*7+3)%keys.length]===a?keys[(n+1)%keys.length]:keys[(n*7+3)%keys.length];
  return{boss,map:{collector:'core',armor:'forge',archivist:'archive',voice:'sanctum',matrona:'archive',omega:'sanctum',carrier:'forge',manticore:'archive',seraph:'sanctum',archon:'core'}[boss],mods:[a,b]};
}

// ---------- daily and weekly goals ----------
// stat keys are filled in by the server from each finished match
export const GOALS={
  play3:{name:'Odehraj 3 zápasy',stat:'matches',target:3,xp:150,cr:60},
  win2:{name:'Vyhraj 2 zápasy',stat:'wins',target:2,xp:220,cr:90},
  arena1:{name:'Vyhraj zápas v Aréně',stat:'winArena',target:1,xp:200,cr:80},
  control1:{name:'Vyhraj zápas v Ovládnutí',stat:'winControl',target:1,xp:200,cr:80},
  kills12:{name:'Znič 12 soupeřů v PvP',stat:'kills',target:12,xp:220,cr:90},
  npc40:{name:'Znič 40 NPC',stat:'npcKills',target:40,xp:200,cr:80},
  boss1:{name:'Poraz bosse',stat:'bossKills',target:1,xp:260,cr:110},
  wave6:{name:'Dosáhni ve Vlnách alespoň vlny 6',stat:'wave',target:6,max:true,xp:240,cr:100},
  relic2:{name:'Seber 2 relikvie',stat:'relics',target:2,xp:180,cr:70},
  dmg15k:{name:'Způsob 15 000 poškození',stat:'dmg',target:15000,xp:200,cr:80},
  heal3k:{name:'Vyléč 3 000 HP',stat:'heal',target:3000,xp:200,cr:80},
  camp1:{name:'Dokonči misi kampaně',stat:'campaign',target:1,xp:260,cr:110},
  endless10:{name:'Dosáhni v Nekonečnu vlny 10',stat:'endless',target:10,max:true,xp:280,cr:120}
};
export const WEEKLY_GOALS={
  w_win10:{name:'Vyhraj 10 zápasů',stat:'wins',target:10,xp:1200,cr:500},
  w_boss5:{name:'Poraz 5 bossů',stat:'bossKills',target:5,xp:1300,cr:550},
  w_npc250:{name:'Znič 250 NPC',stat:'npcKills',target:250,xp:1100,cr:450},
  w_kills60:{name:'Znič 60 soupeřů v PvP',stat:'kills',target:60,xp:1200,cr:500}
};
export const DAILY_COUNT=3,DAILY_BONUS={xp:300,cr:150,boost:.4};
const TZ='Europe/Prague';
export function dayKey(t=Date.now()){return new Intl.DateTimeFormat('sv-SE',{timeZone:TZ}).format(t)}
export function weekKey(t=Date.now()){
  const d=new Date(dayKey(t)+'T00:00:00Z'),wd=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-wd+3);
  const y=d.getUTCFullYear(),w1=new Date(Date.UTC(y,0,4));return y+'-W'+String(1+Math.round(((d-w1)/864e5-3+((w1.getUTCDay()+6)%7))/7)).padStart(2,'0');
}

// ---------- maps ----------
// pillars: [x,z,r]; hazards hurt anyone inside; points are capture zones for Ovládnutí.
export const MAPS={
  core:{name:'Neonové jádro',desc:'Symetrická aréna se sloupy a relikvií ve středu.',r:34,
    pillars:[[-10,-9,2.2],[-10,9,2.2],[10,-9,2.2],[10,9,2.2],[0,-17,2.6],[0,17,2.6],[-19,-17,1.8],[-19,17,1.8],[19,-17,1.8],[19,17,1.8],[-16,0,1.6],[16,0,1.6]],
    hazards:[],bases:[{x:-27,z:0},{x:27,z:0}],points:[{x:0,z:0},{x:0,z:-25},{x:0,z:25}],bossAt:{x:12,z:0},
    theme:{floor:0x0a0f1c,gridA:[.15,.55,1],gridB:[1,.2,.55],accent:0xffc66d,fog:0x04060c,sky:[0x04060c,0x0d1838],pillar:'hex',amb:'motes',ambColor:0x9fb2ff,rim:0x8fa6ff,skyline:[0x3fb8ff,0xff3f8e,0x9a7dff,0xffc66d]}},
  forge:{name:'Rezavá kovárna',desc:'Industriální hala s lávovými kanály, které pálí.',r:34,
    pillars:[[-12,0,2.4],[12,0,2.4],[0,-11,2],[0,11,2],[-20,-14,2],[-20,14,2],[20,-14,2],[20,14,2],[-8,-22,1.6],[8,-22,1.6],[-8,22,1.6],[8,22,1.6]],
    hazards:[{x:-6,z:-16,r:2.6,dps:30},{x:6,z:16,r:2.6,dps:30},{x:-21,z:5,r:2.2,dps:30},{x:21,z:-5,r:2.2,dps:30}],
    bases:[{x:-27,z:0},{x:27,z:0}],points:[{x:0,z:0},{x:0,z:-27},{x:0,z:27}],bossAt:{x:14,z:6},
    theme:{floor:0x150c08,gridA:[1,.5,.15],gridB:[1,.28,.1],accent:0xff8a3d,fog:0x0b0503,sky:[0x0b0503,0x2c0f05],pillar:'box',amb:'embers',ambColor:0xff7a2a,rim:0xff8a3d,skyline:[0xff7a2a,0xffb347,0xff3d1f,0x6b2a12]}},
  archive:{name:'Ledový archiv',desc:'Mrazivá knihovna dat s hustým lesem sloupů.',r:32,
    pillars:[...Array.from({length:8},(_,i)=>{const a=(i+.5)/8*Math.PI*2;return[Math.round(Math.cos(a)*11*10)/10,Math.round(Math.sin(a)*11*10)/10,1.3]}),
      ...Array.from({length:4},(_,i)=>{const a=(i+.5)/4*Math.PI*2;return[Math.round(Math.cos(a)*21*10)/10,Math.round(Math.sin(a)*21*10)/10,2]}),[-17,0,1.2],[17,0,1.2]],
    hazards:[],bases:[{x:-25,z:0},{x:25,z:0}],points:[{x:0,z:0},{x:0,z:-20},{x:0,z:20}],bossAt:{x:10,z:-4},
    theme:{floor:0x0b1218,gridA:[.5,.9,1],gridB:[.75,.85,1],accent:0x9ffcff,fog:0x060a10,sky:[0x060a10,0x12304a],pillar:'crystal',amb:'snow',ambColor:0xdff6ff,rim:0x9ffcff,skyline:[0x9ffcff,0x6acbff,0xdff6ff,0x3f7fbf]}},
  sanctum:{name:'Rudá svatyně',desc:'Otevřený kruh pro lov bossů se čtyřmi úkryty.',r:30,
    pillars:[[-12,-12,2.2],[12,-12,2.2],[-12,12,2.2],[12,12,2.2]],
    hazards:[],bases:[{x:-24,z:0},{x:24,z:0}],points:[{x:0,z:0},{x:-14,z:0},{x:14,z:0}],bossAt:{x:8,z:0},
    theme:{floor:0x14070c,gridA:[1,.2,.35],gridB:[.7,.2,1],accent:0xff527e,fog:0x0a0306,sky:[0x0a0306,0x2c0818],pillar:'obelisk',amb:'motes',ambColor:0xff6a8a,rim:0xff527e,skyline:[0xff527e,0xac8dff,0xff9c5b,0x5a1030]}}
};
export const MAP_KEYS=Object.keys(MAPS);

// ---------- modes ----------
export const MODES={
  arena:{name:'Aréna',desc:'3 proti 3. Body za zničení soupeřů a za relikvii ve středu. Vyhrává 20 bodů.',pvp:true,maps:['core','forge','archive'],max:6,win:20},
  control:{name:'Ovládnutí',desc:'3 proti 3 o tři body. Každý držený bod přidává skóre, vyhrává 100.',pvp:true,maps:['core','forge','archive'],max:6,win:100},
  duel:{name:'Souboj',desc:'1 proti 1 bez relikvie a bodů. Vyhrává, kdo první pětkrát zničí soupeře.',pvp:true,team:1,maps:['archive','core','sanctum'],max:2,win:5},
  boss:{name:'Lov bosse',desc:'Až 4 hráči proti bossovi s mechanikami. Tým má společné životy.',pvp:false,maps:['sanctum','core','forge','archive'],max:4,lives:8},
  waves:{name:'Vlny',desc:'Až 4 hráči proti vlnám dronů. Každá pátá vlna je boss, cílem je přežít 15 vln.',pvp:false,waves:true,maps:['sanctum','forge','archive','core'],max:4,lives:6,last:15},
  endless:{name:'Nekonečno',desc:'Vlny bez konce. Každá pátá je boss, od vlny 10 přibývá každých 10 vln nový modifikátor. Kam až se dostanete?',pvp:false,waves:true,endless:true,maps:['core','forge','archive','sanctum'],max:4,lives:5,last:0}
};
export const teamSize=mode=>MODES[mode]?.team||(MODES[mode]?.pvp?3:4);
// MVP of a match: one number that weighs kills, objectives, damage, healing and tanking
export function mvpScore(s,pvp){
  return pvp?s.ki*100-s.de*40+s.dm*.05+s.he*.06+(s.re||0)*120+(s.cp||0)*80+(s.tk||0)*.02
    :s.nk*15-s.de*60+s.dm*.05+s.he*.06+(s.tk||0)*.03;
}
// Obchodník: a daily shop of four hand-picked implants, the same for the whole day
export const MERCHANT={count:4,rerollCost:120,markup:8};
export const BUILDS_MAX=6,HISTORY_MAX=15;
// Endless adds one hostile modifier at waves 10, 20, 30 and 40, in this order.
export const ENDLESS_MODS=['tough','bleed','fierce','noheal'];
export const ENDLESS_WIN=10;
export const MODE_KEYS=Object.keys(MODES);

// ---------- ranked PvP ----------
// Elo rating per monthly season. A match counts only with a ranked player on each side, so bots cannot be farmed.
export const RANKED_MODES=['duel','arena'];
export const RATING_START=1000,PLACEMENT=10;
export const DIVISIONS=[
  {key:'bronze',name:'Bronz',min:0,color:'#d08a5a',reward:{credits:150}},
  {key:'silver',name:'Stříbro',min:1100,color:'#c8d4e0',reward:{credits:300}},
  {key:'gold',name:'Zlato',min:1250,color:'#ffc66d',reward:{credits:500,minR:2}},
  {key:'plat',name:'Platina',min:1400,color:'#6affd8',reward:{credits:800,minR:3}},
  {key:'diamond',name:'Diamant',min:1550,color:'#6acbff',reward:{credits:1200,minR:3,title:'Diamantový šampion'}},
  {key:'neon',name:'Neon',min:1700,color:'#ff3f8e',reward:{credits:2000,minR:4,title:'Neonová legenda'}}
];
export function divisionOf(rating){let i=0;for(let k=0;k<DIVISIONS.length;k++)if(rating>=DIVISIONS[k].min)i=k;return i}
export function seasonKey(t=Date.now()){const d=new Date(t);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')}
export function seasonEnd(key){const [y,m]=key.split('-').map(Number);return Date.UTC(y,m,1)}
const MONTHS=['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'];
export const seasonName=key=>{const [y,m]=String(key).split('-');return`${MONTHS[(+m||1)-1]} ${y}`};
// rating change for one player: score 1 win, .5 draw, 0 loss; placement matches move the rating faster
export function eloDelta(my,opp,score,games){const K=games<PLACEMENT?48:28;return Math.round(K*(score-1/(1+10**((opp-my)/400))))}
// a new season keeps half of the distance from the starting rating
export const softReset=r=>Math.round(RATING_START+(r-RATING_START)/2);

// ---------- guilds ----------
// A guild levels up from its members' matches (a third of their match XP). Each level adds two member slots and
// 1 % XP and credits for every member. Every week the guild has a shared goal of wins with a reward for each member who played.
export const GUILD={cost:1000,minLevel:5,maxLevel:10,baseMembers:20,perLevel:2,maxApps:30,maxInv:10,weekMin:3};
export const GUILD_ROLES={leader:'Vůdce',officer:'Důstojník',member:'Člen'};
export const GUILD_NAME_RE=/^[\p{L}\p{N} _.\-]{3,24}$/u,GUILD_TAG_RE=/^[A-Z0-9]{2,4}$/;
export const guildXpFor=l=>2500*l;
export const guildMaxMembers=l=>GUILD.baseMembers+GUILD.perLevel*(l-1);
export const guildBonus=l=>Math.min(10,l-1);
export const guildWeekTarget=n=>Math.max(15,n*4);
export const guildWeekReward=l=>({credits:250+30*l,minR:l>=6?3:2});

// ---------- ability mastery (from the original Relikvie) ----------
// Every class skill, profession skill and ultimate has a mastery rank 0–20 earned by using it in matches.
// Each rank: −0.5 % energy cost and −0.5 % cooldown (ultimate: +1 % charge). Ranks 5, 10, 15 and 20 unlock a milestone
// with a choice of two branches. Ranked matches cap the rank at 5 (the original's calibrated mastery).
export const MASTERY={max:20,tiers:[5,10,15,20],perRank:.005,ultPerRank:1,rankedCap:5,ultXp:8,matchCap:80};
export const masteryXpFor=n=>12+6*n; // XP from rank n to n+1, one XP per use
export const masteryRank=xp=>{let n=0;while(n<MASTERY.max&&xp>=masteryXpFor(n)){xp-=masteryXpFor(n);n++}return{rank:n,into:xp,need:n<MASTERY.max?masteryXpFor(n):0}};
export const MASTERY_BRANCHES=[
  [{k:'thrift',name:'Úspora',desc:'Stojí o 10 % méně energie.'},{k:'tempo',name:'Spád',desc:'Čekání je o 8 % kratší.'}],
  [{k:'ward',name:'Ochranný impuls',desc:'Použití ti dá štít 4 % max. HP.'},{k:'surge',name:'Nápor',desc:'Po použití máš na 2 s o 15 % rychlejší pohyb.'}],
  [{k:'mend',name:'Záchranný impuls',desc:'Použití tě vyléčí o 3 % max. HP.'},{k:'battery',name:'Zpětný tok',desc:'Použití vrátí 5 energie.'}],
  [{k:'echo',name:'Ozvěna',desc:'15% šance, že se nespustí čekání.'},{k:'focus',name:'Soustředění',desc:'Další jiná schopnost do 3 s stojí o 20 % méně energie.'}]
];
export const MASTERY_ULT_BRANCHES=[
  [{k:'charge',name:'Rychlé nabití',desc:'Ultimátka se nabíjí o 10 % rychleji.'},{k:'start',name:'Připravenost',desc:'Zápas začínáš s ultimátkou nabitou na 25 %.'}],
  [{k:'ward',name:'Ochranný impuls',desc:'Ultimátka ti dá štít 8 % max. HP.'},{k:'surge',name:'Nápor',desc:'Po ultimátce máš na 3 s o 20 % rychlejší pohyb.'}],
  [{k:'mend',name:'Záchranný impuls',desc:'Ultimátka tě vyléčí o 6 % max. HP.'},{k:'battery',name:'Zpětný tok',desc:'Ultimátka vrátí 20 energie.'}],
  [{k:'echo',name:'Ozvěna',desc:'Po ultimátce zůstane 25 % jejího nabití.'},{k:'focus',name:'Soustředění',desc:'Ultimátka zkrátí čekání všech schopností o 2 s.'}]
];
// mastery keys: "striker:c0" for class skills, "striker:ult" for ultimates, the plain id for profession skills
export const masteryKey=(cls,id)=>id==='ult'?cls+':ult':id&&id[0]==='c'&&id.length===2?cls+':'+id:id;
export function masteryName(key){
  const [a,b]=String(key).split(':');
  if(b==='ult')return CLASSES[a]?.ult.name||key;if(b)return CLASSES[a]?.skills[+b[1]]?.name||key;return PROF_SKILLS[a]?.name||key;
}
// the abilities a player can master with a class: three class skills, the ultimate and profession skills they can slot
export function masteryKeys(p,k){return[...[0,1,2].map(i=>k+':c'+i),k+':ult',...availableSkills(p,k).filter(id=>!(id[0]==='c'&&id.length===2))]}
// what goes into a match: rank and chosen branches per ability (ranks capped for ranked matches)
export function masteryLoadout(p,cap=MASTERY.max){
  const out={};for(const [key,m] of Object.entries(p?.mastery||{})){const r=Math.min(cap,masteryRank(m.xp|0).rank);if(!r)continue;
    out[key]={r,b:(m.br||[]).map((v,i)=>r>=MASTERY.tiers[i]&&(v===0||v===1)?v:null)}}
  return out;
}

// ---------- season pass ----------
// Free for every account, one per ranked season (calendar month). Pass XP comes from match XP and claimed goals.
export const PASS={tiers:30,xp:500,goalXp:100,weeklyXp:400,bonusXp:150};
export const passTier=xp=>Math.min(PASS.tiers,Math.floor(Math.max(0,xp)/PASS.xp));
// reward of tier n (1–30): credits, an implant of a minimum rarity, a title, a pass skin of a chosen class, or all of them
export const PASS_REWARDS=Array.from({length:PASS.tiers},(_,i)=>{const n=i+1;
  if(n===30)return{credits:1000,skin:'all',title:'Šampion sezóny'};
  if(n===15)return{skin:'pick'};
  if(n===10)return{minR:2,title:'Průkopník sezóny'};
  if(n===25)return{minR:4};
  if(n%5===0)return{minR:n<10?2:3};
  if(n%3===0)return{minR:1,credits:50};
  return{credits:80+n*10}});
export function passRewardText(R){
  const a=[];if(R.credits)a.push(`${R.credits} kreditů`);if(R.minR!=null)a.push(`implantát ${RARITIES[R.minR].name.toLowerCase()}${R.minR<4?' nebo lepší':''}`);
  if(R.skin==='pick')a.push('neonový vzhled pro povolání podle volby');if(R.skin==='all')a.push('zbylé neonové vzhledy');if(R.title)a.push(`titul „${R.title}“`);return a.join(' · ');
}

// ---------- achievements ----------
// Three tiers each (bronze, silver, gold). Progress is read from the profile, so nothing is tracked twice.
// Every tier pays credits and achievement points; gold also grants a title.
export const ACH_TIERS=[{name:'Bronz',color:'#d08a5a',credits:150,pts:10},{name:'Stříbro',color:'#c8d4e0',credits:500,pts:25},{name:'Zlato',color:'#ffc66d',credits:1500,pts:50}];
export const ACH_CATS={fight:'Boj',coop:'Kooperace',prog:'Postup',ranked:'Hodnocená hra',social:'Společnost'};
const st=p=>p.stats||{};
export const ACH=[
  {id:'matches',cat:'fight',name:'Veterán arény',desc:'Odehraj zápasy.',t:[10,100,500],v:p=>st(p).matches|0,title:'Veterán arény'},
  {id:'wins',cat:'fight',name:'Vítěz',desc:'Vyhraj zápasy.',t:[10,100,500],v:p=>st(p).wins|0,title:'Neporazitelný'},
  {id:'kills',cat:'fight',name:'Lovec hlav',desc:'Znič soupeřovy hrdiny v PvP.',t:[25,250,1500],v:p=>st(p).kills|0,title:'Lovec hlav'},
  {id:'mvp',cat:'fight',name:'Nejlepší hráč',desc:'Staň se MVP zápasu.',t:[5,25,100],v:p=>st(p).mvp|0,title:'Hvězda arény'},
  {id:'relics',cat:'fight',name:'Strážce relikvie',desc:'Seber relikvii v Aréně.',t:[10,50,200],v:p=>st(p).relics|0,title:'Nositel relikvie'},
  {id:'dmg',cat:'fight',name:'Ničitel',desc:'Způsob celkové poškození.',t:[50000,500000,3000000],v:p=>st(p).dmg|0,title:'Ničitel'},
  {id:'heal',cat:'fight',name:'Záchranář',desc:'Vyleč spojence i sebe.',t:[10000,100000,500000],v:p=>st(p).heal|0,title:'Anděl strážný'},
  {id:'classes',cat:'fight',name:'Všestranný',desc:'Získej 10 výher s různými povoláními.',t:[1,2,3],v:p=>Object.values(st(p).byCls||{}).filter(x=>x.w>=10).length,title:'Mistr všech zbraní'},
  {id:'modes',cat:'fight',name:'Všude doma',desc:'Vyhraj v různých režimech.',t:[2,4,6],v:p=>Object.entries(st(p).byMode||{}).filter(([k,x])=>k!=='campaign'&&x.w>0).length,title:'Všudybyl'},
  {id:'npc',cat:'coop',name:'Vyhlazovač',desc:'Znič nepřátelská NPC.',t:[200,2000,10000],v:p=>st(p).npcKills|0,title:'Vyhlazovač'},
  {id:'bosses',cat:'coop',name:'Přemožitel',desc:'Poraz bosse.',t:[5,50,250],v:p=>st(p).bossKills|0,title:'Přemožitel bossů'},
  {id:'trophies',cat:'coop',name:'Sběratel trofejí',desc:'Poraz různé bosse.',t:[3,6,10],v:p=>Object.keys(st(p).byBoss||{}).length,title:'Sběratel trofejí'},
  {id:'waves',cat:'coop',name:'Obránce',desc:'Dosáhni vlny v režimu Vlny.',t:[5,10,15],v:p=>st(p).bestWave|0,title:'Neprolomený'},
  {id:'endless',cat:'coop',name:'Bez konce',desc:'Dosáhni vlny v Nekonečnu.',t:[10,20,30],v:p=>st(p).bestEndless|0,title:'Nekonečný'},
  {id:'campaign',cat:'coop',name:'Kampaň relikvií',desc:'Dokonči mise kampaně.',t:[4,8,12],v:p=>p.campaign?.cleared?.length|0,title:'Zachránce jádra'},
  {id:'level',cat:'prog',name:'Vzestup',desc:'Dosáhni úrovně.',t:[10,25,50],v:p=>p.level|0,title:'Legenda signálu'},
  {id:'time',cat:'prog',name:'Oddanost',desc:'Stráv hodiny v aréně.',t:[1,10,50],v:p=>Math.floor((st(p).time|0)/3600),title:'Oddaný'},
  {id:'legendary',cat:'prog',name:'Legendární nález',desc:'Získej legendární implantáty ze zápasů.',t:[1,5,20],v:p=>st(p).legendary|0,title:'Vyvolený'},
  {id:'skins',cat:'prog',name:'Módní ikona',desc:'Získej vzhledy.',t:[1,5,10],v:p=>p.skins?.length|0,title:'Módní ikona'},
  {id:'titles',cat:'prog',name:'Sběratel titulů',desc:'Získej tituly.',t:[1,4,8],v:p=>p.titles?.length|0,title:'Titulovaný'},
  {id:'sold',cat:'prog',name:'Obchodník',desc:'Prodej implantáty na tržišti.',t:[1,10,50],v:p=>st(p).sold|0,title:'Magnát'},
  {id:'rgames',cat:'ranked',name:'Soutěživý',desc:'Odehraj hodnocené zápasy (napříč sezónami).',t:[10,50,200],v:p=>st(p).rankedGames|0,title:'Soutěživý'},
  {id:'rwins',cat:'ranked',name:'Šplhání žebříčkem',desc:'Vyhraj hodnocené zápasy.',t:[5,30,120],v:p=>st(p).rankedWins|0,title:'Šplhač'},
  {id:'rdiv',cat:'ranked',name:'Elita',desc:'Dosáhni divize Zlato, Diamant a Neon.',t:[2,4,5],v:p=>st(p).bestDiv|0,title:'Elita'},
  {id:'friends',cat:'social',name:'Parta',desc:'Měj přátele.',t:[1,5,20],v:p=>p.social?.friends?.length|0,title:'Duše party'},
  {id:'guild',cat:'social',name:'Klanová krev',desc:'Buď v klanu a pomoz mu na úroveň 5 a 10.',t:[1,5,10],v:p=>p.guildLevel|0,title:'Klanový veterán'}
];
export const achById=id=>ACH.find(a=>a.id===id);
// tiers reached by a progress value
export const achReached=(a,val)=>a.t.filter(x=>val>=x).length;

// ---------- moderation ----------
export const REPORT_REASONS={abuse:'Urážky a obtěžování',spam:'Spam',cheat:'Podvádění',name:'Nevhodná přezdívka nebo název klanu',other:'Jiné'};
export const MOD={reportsPerDay:10,autoReporters:3,autoWindow:60,autoMute:60};

// ---------- friends and chat ----------
export const FRIENDS_MAX=100,CHAT_LEN=200;
// chat text: no control characters, collapsed whitespace, limited length
export const cleanChat=s=>String(s??'').replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g,'').replace(/\s+/g,' ').trim().slice(0,CHAT_LEN);
// optional client-side filter: masks common Czech and English swear words (diacritics-insensitive)
const SWEAR=['kurv','pica','pico','picu','pici','kokot','curak','zmrd','mrdat','mrdk','debil','kreten','hovad','prdel','fuck','shit','bitch','cunt','nigg'];
// per character, so match positions stay the same in the original text
const fold=s=>s.replace(/[\s\S]/g,c=>{const d=c.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();return d.length===1?d:c});
const SWEAR_RE=new RegExp('\\p{L}*(?:'+[...new Set(SWEAR.map(fold))].join('|')+')\\p{L}*','giu');
export const maskSwears=s=>{const f=fold(s);let out='',i=0;for(const m of f.matchAll(SWEAR_RE)){out+=s.slice(i,m.index)+'*'.repeat(m[0].length);i=m.index+m[0].length}return out+s.slice(i)};

// ---------- NPCs and bosses ----------
export const NPCS={
  drone:{name:'Dron',hp:80,speed:7.5,def:0,atk:10,tech:0,pref:10,color:0xff5d6c,radius:.6,basic:{type:'shot',dmg:9,rate:.9,speed:26,range:16,size:1}},
  brute:{name:'Drtič',hp:230,speed:6,def:.15,atk:22,tech:0,pref:2,color:0xff8a3d,radius:1,basic:{type:'melee',dmg:24,rate:1.1,range:2.8}},
  sentinel:{name:'Hlídač',hp:150,speed:5.5,def:.05,atk:14,tech:0,pref:15,color:0xc08bff,radius:.8,basic:{type:'shot',dmg:15,rate:1.1,speed:30,range:21,size:1.3}},
  repair:{name:'Opravář',hp:110,speed:6.5,def:0,atk:0,tech:0,pref:4,color:0x74ffb4,radius:.6,basic:null},
  shard:{name:'Pravý střep',hp:300,speed:0,def:0,atk:0,tech:0,pref:0,color:0xffd16d,radius:.9,basic:null},
  fshard:{name:'Falešný střep',hp:300,speed:0,def:0,atk:0,tech:0,pref:0,color:0xc08bff,radius:.9,basic:null}
};
export const BOSSES={
  collector:{name:'Sběratel',title:'Lovec signálů',hp:6500,speed:6.8,def:.2,atk:40,tech:0,pref:2.5,color:0xffd16d,radius:1.6,
    basic:{type:'melee',dmg:38,rate:1.2,range:3.8},desc:'Označí hráče a vrhne se po něm. Přivolává drony.'},
  armor:{name:'Pancéřník',title:'Strážce trezoru',hp:8800,speed:5,def:.32,atk:45,tech:0,pref:3,color:0xff9c5b,radius:2,
    basic:{type:'melee',dmg:44,rate:1.4,range:4.2},desc:'Drtivé údery do země. Když si nasadí štít, prolomte ho, jinak se schovejte za sloup.'},
  voice:{name:'Hlas',title:'Frekvence prázdnoty',hp:6800,speed:5.8,def:.1,atk:18,tech:0,pref:11,color:0x6acbff,radius:1.4,
    basic:{type:'shot',dmg:17,rate:1,speed:28,range:24,size:1.6},desc:'Rozpínavé vlny a rotující paprsky. Kryjte se za sloupy.'},
  matrona:{name:'Matrona roje',title:'Královna dronů',hp:7400,speed:4.6,def:.15,atk:22,tech:0,pref:8,color:0x74ffb4,radius:1.8,
    basic:{type:'shot',dmg:21,rate:1.2,speed:24,range:19,size:1.8},desc:'Přivolává roje a opraváře. V polovině je nezranitelná, dokud žije roj.'},
  archivist:{name:'Archivář',title:'Strážce zrcadel',hp:7000,speed:5.4,def:.15,atk:20,tech:0,pref:10,color:0xe7b2ff,radius:1.5,
    basic:{type:'shot',dmg:19,rate:1.1,speed:26,range:22,size:1.6},desc:'Zrcadlový kolaps: zničte pravý zlatý střep. Falešný vybuchne, a když nestihnete ani jeden, zasáhne všechny.'},
  omega:{name:'Omega',title:'Poslední strážce',hp:9800,speed:5.6,def:.25,atk:42,tech:0,pref:4,color:0xff78e6,radius:2,
    basic:{type:'melee',dmg:42,rate:1.3,range:4.4},desc:'Tři fáze, které spojují mechaniky ostatních bossů: údery do země, paprsky a nakonec výpady s rojem.'},
  carrier:{name:'Nositel',title:'Pán břemene',hp:8400,speed:5.2,def:.25,atk:40,tech:0,pref:3,color:0xffa94d,radius:1.9,
    basic:{type:'melee',dmg:40,rate:1.3,range:4},desc:'Naloží hráči břemeno, které po 6 s vybuchne. Nositel břemene musí utéct od ostatních.'},
  manticore:{name:'Mantikora',title:'Jedový lovec',hp:7800,speed:7.2,def:.18,atk:34,tech:0,pref:2.5,color:0xb6ff3d,radius:1.7,
    basic:{type:'melee',dmg:32,rate:.95,range:3.6,poison:true},desc:'Rychlé skoky, jedové žihadlo a mlha. Pod 30 % HP zuří a zrychlí se.'},
  seraph:{name:'Serafín',title:'Šestikřídlý',hp:7400,speed:5.6,def:.12,atk:20,tech:0,pref:11,color:0xfff1a8,radius:1.5,
    basic:{type:'shot',dmg:19,rate:1,speed:28,range:24,size:1.6},desc:'Kopí světla v liniích. Dvakrát vzlétne, je nedotknutelný a z nebe padá světlo.',invTxt:'Ve vzduchu · uhýbejte dopadům světla'},
  archon:{name:'Archon',title:'Soudce relikvií',hp:10800,speed:5,def:.28,atk:46,tech:0,pref:4,color:0xff4d6d,radius:2.1,
    basic:{type:'melee',dmg:46,rate:1.4,range:4.6},desc:'Rozsudek spálí polovinu arény, gravitace přitáhne tým k úderu. V polovině HP povolá soudní hlídače.'}
};
export const BOSS_KEYS=Object.keys(BOSSES);

// Lookup tables are indexed by names that come from players (class, mode, crate, slot…). Without a prototype,
// keys like "constructor" or "toString" are simply missing instead of resolving to built-in functions.
for(const T of [CLASSES,DIFF_REWARD,STATS,SLOTS,AFFIX_BASE,AFFIX_POOLS,BASE_NAMES,UNIQUES,CRATES,SKINS,TREES,SCHOOLS,PROF_SKILLS,PASSIVES,ULT_MODS,
  TACTICS,BOT_TACTIC,ACTS,ECHO_MODS,GOALS,WEEKLY_GOALS,MAPS,MODES,NPCS,BOSSES])Object.setPrototypeOf(T,null);
