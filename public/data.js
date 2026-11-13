// Relikvie Aréna — shared game data: classes, skill trees, items, skins, maps, modes, NPCs and bosses.
// Imported by the simulation, the server and the client, so every rule has one source.

export const CLASSES={
  striker:{name:'Lovec',hero:'Vex Bleskorez',lore:'Lovkyně relikvií, která udeří dřív, než ji soupeř uvidí.',role:'Nápor a přesnost',color:0xffb347,css:'#ffb347',hp:235,speed:9.2,def:.08,atk:40,tech:12,pref:11,
    talent:'Kombinátor',talentDesc:'Zásah základním útokem zkrátí čekání schopností o 0,35 s.',
    basic:{type:'shot',name:'Pulzní střela',dmg:16,rate:.3,speed:46,range:22,size:1,dot:{kind:'bleed',dps:4,t:4}},
    skills:[{name:'Průrazný výpad',cost:30,cd:6,icon:'slash',desc:'Výpad vpřed a dva seky po 90 % útoku.'},
            {name:'Optické maskování',cost:25,cd:12,icon:'eye',desc:'3,5 s neviditelnost. Další zásah +45 % (Přepad).'},
            {name:'Krvavý šíp',cost:20,cd:5,icon:'arrow',desc:'Průrazný šíp. Krvácení 9 HP/s na 4 s.'}],
    ult:{name:'Bouřový průraz',icon:'bolt',desc:'Tři blesky v linii před tebou, každý 170 % útoku.'},
    relic:'Bouřová relikvie: +25 % poškození na 20 s.',bars:[.45,.9,.25,.95]},
  guardian:{name:'Strážce',hero:'Bor Ocelštít',lore:'Bývalý strážce trezoru relikvií. Kde stojí on, tudy se neprojde.',role:'Výdrž a obrana',color:0x5dffa8,css:'#5dffa8',hp:385,speed:7.9,def:.22,atk:30,tech:16,pref:2.2,
    talent:'Bastion',talentDesc:'Každý zásah na blízko přidá 4 body štítu.',
    basic:{type:'melee',name:'Pancéřový úder',dmg:30,rate:.62,range:3.4,dot:{kind:'poison',dps:4,t:3}},
    skills:[{name:'Kotva',cost:25,cd:8,icon:'anchor',desc:'Štít 70 a zpomalení nepřátel do 5,5 m o 40 %.'},
            {name:'Náraz',cost:30,cd:9,icon:'charge',desc:'Výpad až 8 m, omráčení 0,9 s a odhození.'},
            {name:'Štítová kupole',cost:35,cd:14,icon:'dome',desc:'Spojenci do 7 m získají štít 55, ty sám 28.'}],
    ult:{name:'Titánův val',icon:'slam',desc:'Úder do země do 8 m: 200 % útoku, omráčení 1,4 s, štít 120.'},
    relic:'Titánova relikvie: štít 150 a −20 % přijatého poškození na 20 s.',bars:[1,.6,.35,.55]},
  technician:{name:'Technik',hero:'Ina Signálová',lore:'Inženýrka signálové sítě. Spojence opraví, soupeřům spojení přeruší.',role:'Energie a obnova',color:0x6acbff,css:'#6acbff',hp:245,speed:8.4,def:.1,atk:24,tech:35,pref:12,
    talent:'Inženýr',talentDesc:'Zásah základním útokem vrátí 5 energie.',
    basic:{type:'shot',name:'Výbojový šíp',dmg:25,rate:.48,speed:34,range:20,size:1.5,dot:{kind:'shock',dps:4,t:2}},
    skills:[{name:'Mor nanitů',cost:30,cd:9,icon:'nano',desc:'Zóna 4 m na 5 s, 50 % TECH za sekundu.'},
            {name:'Obnova',cost:30,cd:10,icon:'heal',desc:'Spojenci do 7,5 m léčí 22 HP/s po 3 s a zbaví se krvácení a zpomalení.'},
            {name:'EMP',cost:30,cd:9,icon:'emp',desc:'Výboj v místě: 110 % TECH, −40 energie, umlčení 1,1 s.'}],
    ult:{name:'Řetězový výboj',icon:'chain',desc:'Blesk zasáhne cíl za 160 % TECH a přeskočí až na 3 další, každý za 90 % TECH.'},
    relic:'Relikvie ozvěny: energie ×1,8 a čekání −30 % na 20 s.',bars:[.55,.45,1,.75]},
  pyro:{name:'Žhář',hero:'Dax Popelář',lore:'Topič z Rezavé kovárny, kterému oheň nikdy nestačil.',role:'Oheň a kontrola prostoru',color:0xff6a1a,css:'#ff6a1a',hp:305,speed:8.8,def:.12,atk:28,tech:40,pref:9,
    talent:'Popel',talentDesc:'Základní útok zapálí cíl: hoření 5 HP/s na 3 s. Ohnivé oblasti zapalují každého, kdo v nich stojí.',
    basic:{type:'shot',name:'Žhavý projektil',dmg:18,rate:.4,speed:36,range:19,size:1.6,dot:{kind:'burn',dps:10,t:3}},
    skills:[{name:'Plamenná vlna',cost:30,cd:7,icon:'flame',desc:'Vlna ohně do 6 m před tebou: 110 % TECH a hoření 8 HP/s na 3 s.'},
            {name:'Žhnoucí půda',cost:30,cd:10,icon:'firezone',desc:'Hořící oblast 3,5 m na 4 s: 45 % TECH za sekundu.'},
            {name:'Fázový plamen',cost:25,cd:9,icon:'blink',desc:'Přesun až o 7 m. Na výchozím místě zůstane hořící oblast 2,5 m na 3 s.'}],
    ult:{name:'Inferno',icon:'inferno',desc:'Tři výbuchy ohně kolem tebe do 8,5 m, každý 115 % TECH, a hoření 12 HP/s na 4 s.'},
    relic:'Relikvie výhně: hoření dává dvojnásobné poškození a ohnivé oblasti jsou o polovinu větší na 20 s.',bars:[.6,.55,.85,.7]},
  cryo:{name:'Kryonik',hero:'Sia Mrazivá',lore:'Strážkyně Ledového archivu, která mrazem zastaví každý útok.',role:'Mráz a zastavení',color:0xc3b5ff,css:'#c3b5ff',hp:258,speed:8.6,def:.14,atk:26,tech:30,pref:10,
    talent:'Podchlazení',talentDesc:'Každý třetí zásah základním útokem do stejného soupeře ho zpomalí o 40 % na 1 s.',
    basic:{type:'shot',name:'Ledová střepina',dmg:16,rate:.44,speed:40,range:19,size:1.3,dot:{kind:'shock',dps:4,t:2}},
    skills:[{name:'Mrazivý kužel',cost:30,cd:7,icon:'frostcone',desc:'Kužel mrazu do 7 m před tebou: 100 % TECH a zpomalení o 40 % na 1,5 s.'},
            {name:'Ledový krunýř',cost:30,cd:12,icon:'iceshield',desc:'Štít 70 pro tebe a štít 75 pro spojence do 8 m.'},
            {name:'Kryomina',cost:30,cd:10,icon:'icemine',desc:'Mina dopadne až 14 m daleko a po 0,7 s vybuchne do 3 m: 90 % TECH a zmrazení na 0,7 s.'}],
    ult:{name:'Absolutní nula',icon:'freeze',desc:'Mrazivá bouře v místě až 14 m daleko: po 0,55 s zasáhne vše do 7,5 m za 165 % TECH a zmrazí na 1,2 s.'},
    relic:'Relikvie mrazu: každý zásah základním útokem zpomalí a čekání schopností je o 20 % kratší na 20 s.',bars:[.65,.5,.75,.9]},
  hook:{name:'Hákař',hero:'Kord Řetězník',lore:'Jeřábník z neonového přístavu. Co chytí řetězem, to nepustí.',role:'Přitažení a kontrola',color:0xd4ff4f,css:'#d4ff4f',hp:345,speed:8.7,def:.18,atk:32,tech:16,pref:4.5,
    talent:'Napnutý řetěz',talentDesc:'Soupeř, kterého přitáhneš nebo spoutáš, od tebe 3 s dostává o 20 % víc poškození a má proti tobě jen polovinu obrany. Každé přitažení Hákem nebo škubnutím ti dá štít 22, Vír řetězů 30 za každého soupeře.',
    basic:{type:'melee',name:'Švih řetězem',dmg:31,rate:.52,range:4.5,dot:{kind:'bleed',dps:4,t:3}},
    skills:[{name:'Hák',cost:25,cd:8,icon:'hook',desc:'Hák na 16 m chytí prvního soupeře v dráze a přitáhne ho k tobě: 90 % útoku a zpomalení na 0,5 s.'},
            {name:'Řetězový skok',cost:25,cd:9,icon:'chainleap',desc:'Řetěz tě přitáhne až o 11 m. Po dopadu soupeři do 2,5 m dostanou 80 % útoku a omráčení 0,5 s.'},
            {name:'Spoutání',cost:30,cd:11,icon:'shackle',desc:'Připoutá soupeře do 6,5 m na 2,5 s (60 % útoku). Když uteče dál, řetěz ho škubne zpátky: 50 % útoku a omráčení 0,55 s.'}],
    ult:{name:'Vír řetězů',icon:'vortex',desc:'Stáhne všechny soupeře do 9 m k sobě, pak 150 % útoku a omráčení na 1 s.'},
    relic:'Relikvie řetězů: Hák a Spoutání mají o 40 % kratší čekání na 20 s.',bars:[.75,.7,.3,.7]}
};
// damage over time from basic attacks: each class has its own kind. A new application refreshes the duration and keeps
// the stronger one; they do not stack. Decontamination removes all of them, Restore only bleeding and burning.
export const DOTS={
  bleed:{name:'Krvácení',color:'#ff3355',hex:0xff3355,desc:'krvácení'},
  poison:{name:'Jed',color:'#9dff5d',hex:0x9dff5d,desc:'jed: cíl se navíc léčí o 30 % méně'},
  shock:{name:'Šok',color:'#9fd8ff',hex:0x9fd8ff,desc:'elektrický šok'},
  burn:{name:'Hoření',color:'#ff6a1a',hex:0xff6a1a,desc:'hoření'}
};
export const POISON_HEAL=.7;
// the element is unlocked by basic attack mastery rank 5 (see MASTERY_BASIC_BRANCHES)
export const basicFxText=k=>{const d=CLASSES[k]?.basic?.dot;if(!d)return'';return`Mistrovství základního útoku 5: ${DOTS[d.kind].desc} ${d.dps} HP/s na ${d.t} s při každém zásahu.`};
// burning (from the Žhář): damage over time, removed by Decontamination and Restore like bleeding
export const BURN={talent:{kind:'burn',dps:5,t:3},wave:{dps:10,t:3},ult:{dps:12,t:4}};
export const CLASS_KEYS=Object.keys(CLASSES);
// heroes added lately: the hub shows a NOVÝ badge on them until this date
export const NEW_CLASSES={cryo:'2026-12-15',hook:'2027-01-31'};

// ---------- progression ----------
export const MAX_LEVEL=50;
export const xpFor=l=>Math.round(100+l*50+l*l*3); // xp needed to go from level l to l+1
export const DIFF_REWARD={easy:.6,normal:1,hard:1.35};
// a match with custom room rules pays in full from this many seconds; wins count for goals from CUSTOM_GOAL of it
export const CUSTOM_FULL=240,CUSTOM_GOAL=.6;
// Evade on Space: every class moves out of harm's way in its own manner; no energy, its own cooldown.
// It goes in the direction you move (standing still: where you face) and a dash ends early at a wall.
export const EVADES={
  striker:{name:'Přískok',cd:4,icon:'dodge',desc:'Bleskový kotoul o 6,5 m s krátkou nezranitelností (0,3 s).'},
  guardian:{name:'Štítový náraz',cd:6.5,icon:'bulwark',desc:'Výpad o 4,5 m za štítem: po dobu 0,8 s dostáváš polovinu poškození a odhodíš soupeře v cestě (60 % útoku).'},
  technician:{name:'Fázový skok',cd:5,icon:'blink',desc:'Okamžitý přesun o 7 m (projde mezi nepřáteli, zastaví se o zeď) s mžikem nezranitelnosti.'},
  pyro:{name:'Ohnivý kotoul',cd:4.5,icon:'firezone',desc:'Kotoul o 5,5 m s nezranitelností 0,25 s. Na výchozím místě vzplane oheň 2,2 m na 2 s.'},
  cryo:{name:'Ledový skluz',cd:4.5,icon:'iceslide',desc:'Skluz o 6 m s nezranitelností 0,25 s. Soupeře do 3 m od výchozího místa zpomalí na 1,5 s.'},
  hook:{name:'Řetězový švih',cd:5,icon:'chainleap',desc:'Švih o 6 m s nezranitelností 0,25 s. Soupeře v cestě zasáhne za 50 % útoku.'}};
// Sekundární útok (right mouse button): every hero's second attack, no energy, a short cooldown
export const SECONDARY={
  striker:{name:'Průrazná střela',cd:7,icon:'arrow',desc:'Rychlá střela na 26 m, která proletí všemi soupeři v řadě: 110 % útoku.'},
  guardian:{name:'Úder štítem',cd:5,icon:'bulwark',desc:'Úder do 3,5 m před tebou: 110 % útoku, odhození o 3,5 m a zpomalení na 1 s. Dá ti štít 20. Na citadele shodí soupeře z okraje.'},
  technician:{name:'Odsávač',cd:7,icon:'pulse',desc:'Výboj na 18 m: 110 % TECH a vyléčí tě o polovinu toho. Zasaženému hrdinovi vezme 20 energie a dá ji tobě.'},
  pyro:{name:'Plamenomet',cd:4,icon:'flame',desc:'Proud ohně do 5,5 m před tebou: 95 % TECH a hoření 10 HP/s na 2 s.'},
  cryo:{name:'Ledový hrot',cd:6,icon:'freeze',desc:'Hrot na 20 m: 60 % TECH a zpomalení na 1,5 s.'},
  hook:{name:'Trhnutí',cd:6,icon:'hook',desc:'Krátký hák na 9 m: 80 % útoku a přitáhne zasaženého soupeře o 3 m k tobě.'}};
// "Novinky" in the hub, newest first; id marks what a player has already seen
export const CHANGELOG=[
  {id:'2026-12n',title:'Nový režim: Konvoj relikvie',items:[
    'Ve středu arény čeká vznášející se vůz s relikvií. Když má u něj tvůj tým víc hrdinů, jede k soupeřově základně, čím víc vás je, tím rychleji.',
    'Na 25, 50 a 75 % je kontrolní bod: vůz tam 6 s stojí, aby se obránci stihli vrátit. Kdo vůz dotlačí na konec, vyhrává, jinak po vypršení času vyhrává strana, na které vůz stojí.',
    'Hraje se 3 proti 3 na Neonovém jádru, v Rezavé kovárně, Ledovém archivu, Hvězdné observatoři a v Bouřkové elektrárně. Nový denní cíl: vyhraj zápas v Konvoji.']},
  {id:'2026-12m',title:'Strážce bez nekonečných štítů',items:[
    'Strážce v soubojích vyhrával skoro tři ze čtyř, protože se pořád obnovoval štíty.',
    'Kotva dává štít 70 místo 90, Štítová kupole dá Strážci samotnému 28 (spojencům dál 55), talent Bastion 4 body za zásah místo 6 a Úder štítem štít 20 místo 30.']},
  {id:'2026-12l',title:'Vyváženější Hákař',items:[
    'Hák zpomalí na 0,5 s místo 0,8 s a škubnutí Spoutání omráčí na 0,55 s místo 0,8 s, takže Kryonik a Technik mají víc šancí utéct.',
    'Štít za přitažení je 22 místo 40 a talent přidává 20 % poškození místo 25 %.',
    'Zato označený soupeř má proti Hákaři jen polovinu obrany, takže Hákař víc zraní Strážce. Hákař má 345 zdraví místo 330.']},
  {id:'2026-12k',title:'Přehlednější hra na telefonu',items:[
    'Na telefonu na šířku je kamera dál a rozhraní menší: zdraví je vlevo nahoře u minimapy, tlačítka jsou menší a velké nápisy se ukazují nahoře, ne přes hrdiny.']},
  {id:'2026-12j',title:'Pozvi kamaráda',items:[
    'Na kartě Přátelé najdeš svůj odkaz pro kamarády. Když si přes něj kamarád založí účet a dohraje do 5. úrovně, dostanete oba 500 kreditů a vzácný implantát.',
    'Odměnu dostaneš až za 10 pozvaných kamarádů.']},
  {id:'2026-12i',title:'Vibrace na mobilu',items:[
    'Na telefonu hra krátce zavibruje při silném zásahu, pádu, zničení soupeře, nabité ultimátce a výhře. Vypnout jde v Nastavení → Rozhraní → Vibrace.']},
  {id:'2026-12h',title:'Hvězdy týdne',items:[
    'Nový týdenní žebříček: za každý zápas s účtem dostaneš body (výhra 3, remíza 2, prohra 1, MVP +2).',
    'V pondělí dostane nejlepší desítka odměnu: vítěz 1 500 kreditů, legendární implantát a titul Hvězda týdne, další místa kredity a implantát. Žebříček najdeš na kartě Žebříček.',
    'Opraveno: ve Firefoxu se hra po minulé aktualizaci nenačetla (černá obrazovka).']},
  {id:'2026-12g',title:'Nový hrdina: Hákař',items:[
    'Kord Řetězník, jeřábník z neonového přístavu. Bojuje zblízka řetězem: Hák přitáhne soupeře k tobě, Řetězový skok přitáhne tebe k nim, Spoutání soupeře škubne zpátky, když uteče, a Vír řetězů stáhne celou skupinu na jedno místo.',
    'Přitáhni soupeře k týmu, do lávy v Kovárně, pod blesk v Elektrárně nebo dolů z terasy na Citadele. Za každé přitažení dostaneš štít.',
    'Všichni hrdinové mají jméno a krátký příběh: Vex Bleskorez, Bor Ocelštít, Ina Signálová, Dax Popelář, Sia Mrazivá a Kord Řetězník.']},
  {id:'2026-12f',title:'Režim dne',items:[
    'Každý den má jeden režim bonus +30 % zkušeností a kreditů, o víkendu dokonce +50 %. Najdeš ho nahoře na kartě Hrát, režimy se denně střídají.']},
  {id:'2026-12e',title:'Nová mapa: Bouřková elektrárna',items:[
    'Do arény bijí blesky. Každý se chvíli předem ohlásí červeným kruhem: uteč z něj, nebo zásah přežij a dostaneš +15 % ultimátky.',
    'Hraje se v Aréně, Ovládnutí, Mutaci týdne a Eliminaci.']},
  {id:'2026-12d',title:'Odkud hráči chodí',items:[
    'Počítadlo návštěv anonymně sčítá, odkud lidé přišli (sdílená karta, pozvánka, jiný web) a kolikrát hráči sdíleli výsledek. Stále bez cookies a bez ukládání adres.']},
  {id:'2026-12c',title:'Sdílej svůj výsledek',items:[
    'Po zápase je tlačítko Sdílet výsledek. Udělá obrázek s tvým výsledkem, hrdinou a čísly ze zápasu a na mobilu ho rovnou pošleš přes WhatsApp, Messenger nebo Discord. Na počítači se obrázek uloží a odkaz zkopíruje.']},
  {id:'2026-12b',title:'Vše z jednoho místa',items:[
    'Grafika i písma se teď stahují přímo ze serveru hry, ne z cizích služeb. Hra tak funguje i tam, kde jsou tyto služby zablokované, a tvoje adresa nejde nikomu dalšímu.']},
  {id:'2026-12a',title:'Postup hosta se neztratí',items:[
    'I bez účtu teď za zápasy získáváš zkušenosti, kredity a implantáty. Hra ti je podrží 7 dní od posledního zápasu.',
    'Když si založíš účet, všechno získané za hosta se do něj přenese. Po zápase i na kartě Hrát uvidíš, co na tebe čeká.']},
  {id:'2026-11z',title:'Hrát hned',items:[
    'Na úvodní obrazovce je velké tlačítko Hrát hned: bez registrace tě pošle do krátkého výcviku a po něm do prvního zápasu s boty. Když už výcvik máš, jdeš rovnou do zápasu.',
    'Kdo přijde přes pozvánku, připojí se jedním kliknutím rovnou do místnosti.',
    'Na konci výcviku je tlačítko První zápas s boty.']},
  {id:'2026-11y',title:'Rychlejší načítání',items:[
    'Hra se stahuje komprimovaná, takže první načtení je asi třikrát menší. Při dalším otevření se stáhne jen to, co se od minula změnilo.']},
  {id:'2026-11x',title:'Citadela bez středu',items:[
    'Neonová citadela už nemá centrální plošinu ani vrchol. Střed je otevřená plocha s relikvií a čtyřmi novými sloupy, terasy na severu a jihu zůstaly i s rampami a skokovými plošinami.']},
  {id:'2026-11w',title:'Anglická verze',items:[
    'Hra umí anglicky. Hráči z ciziny ji dostanou v angličtině automaticky podle jazyka prohlížeče, přepnout jde v Nastavení → Rozhraní → Jazyk · Language.',
    'Odkaz s ?lang=en otevře hru rovnou anglicky a při sdílení má anglický náhled.',
    'Zprávy v chatu se nepřekládají, zůstávají tak, jak je hráč napsal.']},
  {id:'2026-11v',title:'Sdílení a oprava',items:[
    'Odkaz na hru má při sdílení na Discordu, Facebooku nebo v Messengeru náhledový obrázek a popis.',
    'Hra anonymně počítá, kolik lidí ji denně hraje. Neukládá žádné adresy, cookies ani identifikátory, jen souhrnná čísla za den.',
    'Opraveno: po zápase na Neonové citadele mohl přechod na jinou mapu zaseknout obraz.'
  ]},
  {id:'2026-11u',title:'Pravé tlačítko: sekundární útok',items:[
    'Každý hrdina má sekundární útok na pravém tlačítku myši (nebo na klávese C, dá se přenastavit). Nestojí energii a má krátké čekání. Najdeš ho jako poslední slot v liště.',
    'Lovec: Průrazná střela na 26 m proletí všemi soupeři v řadě (110 % útoku).',
    'Strážce: Úder štítem zblízka odhodí soupeře o 3,5 m, zpomalí ho a dá ti štít 30. Na citadele s ním shodíš soupeře z okraje.',
    'Technik: Odsávač zraní, vyléčí tě a ukradne zasaženému hrdinovi 20 energie.',
    'Žhář: Plamenomet zapálí všechny v kuželu do 5,5 m.',
    'Kryonik: Ledový hrot na 20 m zpomalí cíl.',
    'Boti sekundární útoky používají taky.'
  ]},
  {id:'2026-11t',title:'Citadela pro všechny',items:[
    'Na centrální plošinu citadely vedou čtyři nové skokové plošiny, takže nahoru se dá dostat i mimo úzké rampy. Žhář a Strážce už nejsou tak snadný terč při výstupu.',
    'Boti na citadele nepadají při úhybech z okraje. Dolů seskočí, jen když tam chtějí.'
  ]},
  {id:'2026-11s',title:'Nová mapa: Neonová citadela',items:[
    'První mapa s patry: přízemí, centrální plošina s terasami (3 m) a vrchol uprostřed (6 m). Hraje se v Aréně, Ovládnutí, Mutaci týdne a Eliminaci.',
    'Nahoru vedou rampy se šipkami. Ze země tě na terasy vystřelí skokové plošiny. Seskočit můžeš z jakéhokoli okraje.',
    'Výhoda výšky: střely shora dávají o 10 % víc poškození a letí o 2 m dál.',
    'Kryt hranou: zdola zasáhneš jen toho, kdo stojí do 2,5 m od okraje. Kdo je hlouběji na plošině, je zespodu v bezpečí, ani schopnosti ho nezasáhnou.',
    'Oblasti jako oheň nebo jed působí jen v patře, kde leží.',
    'Kdo tě shodí z okraje (odhozením nebo přitažením), ten tě po dopadu na chvíli zpomalí. Seskok z vrcholu až na zem udeří do všech pod tebou.',
    'Vrchol nabíjí ultimátku o 3 % za sekundu. Každých 30 s ale přijde ohlášené přetížení, které všechny nahoře zraní a shodí dolů.'
  ]},
  {id:'2026-11r',title:'Kryonik chrání tým',items:[
    'Ledový krunýř dává spojencům štít 75 místo 60 a dosáhne na ně do 8 m místo 6 m. Kryonik tak víc pomáhá v týmových bitvách, v duelech se nic nemění.'
  ]},
  {id:'2026-11q',title:'Viditelný mráz',items:[
    'Kryonik má v menu u své karty značku NOVÝ, dokud ho jednou nevybereš.',
    'Zmrazeného hrdinu obalí průsvitný ledový krystal a nad jménem má nápis ZMRAŽEN.',
    'Zpomalenému hrdinovi padá jinovatka a jeho zbroj dostane chladný modrý nádech.']},
  {id:'2026-11p',title:'Kratší umlčení z EMP',items:[
    'Technik: EMP umlčí na 1,1 s místo 1,6 s. V týmových bitvách vyhrával Technik nejčastěji (57 %), teď kolem 53 %. Souboje 1 na 1 se nemění.']},
  {id:'2026-11o',title:'Odolnější Kryonik',items:[
    'Kryonik: 258 HP místo 250. V soubojích i týmových bitvách vyhrával o něco méně než ostatní.']},
  {id:'2026-11n',title:'Nový hrdina: Kryonik',items:[
    'Pátý hrdina Kryonik ovládá mráz: zpomaluje soupeře a zmrazí je na místě.',
    'Q Mrazivý kužel zpomalí všechny před tebou. E Ledový krunýř dá štít tobě i spojencům. R Kryomina po chvilce vybuchne a zmrazí.',
    'Ultimátka Absolutní nula: mrazivá bouře na místě, kam míříš, zmrazí všechny soupeře v okruhu 7,5 m. Kdo uvidí kruh, má 0,55 s na útěk.',
    'Talent Podchlazení: každý třetí zásah do stejného soupeře ho zpomalí. Na mezerníku je Ledový skluz.',
    'Kryonik má vlastní strom dovedností, úpravu ultimátky Věčný led a 8 vzhledů včetně tří legendárních.']},
  {id:'2026-11m',title:'Obnova a hoření',items:[
    'Technik: Obnova už neuhasí hoření. Dál léčí, zbaví spojence krvácení a nově je v popisu i to, že ruší zpomalení.',
    'Hoření Žháře tak platí stejně proti všem. Souboje se nemění, v týmech Žhář o něco málo posílí.']},
  {id:'2026-11l',title:'Míření na dotyku',items:[
    'Automatické míření na dotykovém ovládání míří s předstihem podle pohybu soupeře, jako to dělají boti. Uhýbajícího soupeře trefíš zhruba třikrát častěji.',
    'Automatické míření hledá cíl v celém dostřelu útoku (Lovec 22 m, dřív jen 20 m).']},
  {id:'2026-11k',title:'Hraní na mobilu',items:[
    'Na telefonu drženém na výšku je kamera dál, takže vidíš asi 11 m do stran místo 9 m a dřív si všimneš soupeře, který střílí z boku.',
    'Při prvních třech zápasech na výšku hra poradí otočit telefon na šířku, kde je vidět nejvíc.',
    'Velký nápis uprostřed obrazovky (série, ultimátky, varování) je na nízkých obrazovkách menší a nezakrývá tvého hrdinu.']},
  {id:'2026-11j',title:'Odolnější Lovec',items:[
    'Lovec: 235 HP místo 222. V soubojích 1 na 1 vyhrával nejméně ze všech, v týmech se tím skoro nic nemění.',
    'Nápis o tvé sérii nebo o tom, že tě někdo zničil, už nepřekryje oznámení cizí ultimátky. Varování bosse má dál přednost.',
    'Opravena čeština: „5 soupeřů rychle po sobě“.']},
  {id:'2026-11i',title:'Řetězový výboj',items:[
    'Technik: Řetězový výboj zasáhne první cíl za 160 % TECH (dřív 120 %), další skoky za 90 % a přeskočí nejvýš na 3 další cíle místo 4.',
    'Technik tak lépe obstojí v soubojích 1 na 1 a v týmových bitvách zůstává stejně silný.']},
  {id:'2026-11h',title:'Chytřejší boti Žháře',items:[
    'Boti Žháře lépe používají Inferno: počítají s jeho dosahem 8,5 m a se spoluhráčem poblíž ho odpálí i na jednoho soupeře.',
    'Bublina rychlé zprávy nebo emotu je nad jménem hrdiny a nezakrývá jeho životy.']},
  {id:'2026-11g',title:'Vyváženost Žháře',items:[
    'Žhář: Žhavý projektil 18 místo 21 (souboje 1 na 1 vyhrával moc často).',
    'Inferno: dosah 8,5 m místo 7 m a 115 % TECH místo 90 % na výbuch, aby Žhář víc pomohl v týmových bitvách.',
    'Technik: Řetězový výboj 120 % TECH místo 140 %.']},
  {id:'2026-11f',title:'Vyváženost Technika',items:[
    'Technik: TECH 35 místo 40 a Řetězový výboj 140 % TECH místo 160 % (v týmových zápasech vyhrával nejčastěji).',
    'Výbojový šíp Technika dává 25 místo 22, aby neprohrával souboje 1 na 1.']},
  {id:'2026-11e',title:'Ladění povolání a botů',items:[
    'Boti používají úskok i v PvP: s málem životů uskočí a Strážce doskočí Štítovým nárazem na střelce.',
    'Žhář: TECH 40, 305 HP, základní útok 21 (byl v týmových zápasech nejslabší).',
    'Štítový náraz Strážce má čekání 6,5 s místo 5 s.']},
  {id:'2026-11d',title:'Mistrovství až do 100',items:[
    'Mistrovství schopností, ultimátek i základního útoku teď roste až do úrovně 100.',
    'Nové milníky na mistrovství 30, 40, 50, 60, 70, 80, 90 a 100, každý s výběrem ze dvou větví (24 nových voleb na každou schopnost).',
    'Mezi nimi Legenda (každé 4. použití bez čekání), Poslední vzdor (jednou za zápas přežiješ na 1 HP) nebo Bouře (výboj do tří soupeřů).',
    'Značka M u milníku je úroveň mistrovství schopnosti, ne úroveň postavy. Bonus za úroveň roste do 20, výš sílí jen milníky.',
    'Úspornější vykreslování neonových částí hrdinů a efektů (méně práce pro procesor každý snímek).']},
  {id:'2026-11c',title:'Úskok na mezerníku',items:[
    'Každé povolání má na mezerníku vlastní úskok ve směru pohybu, bez energie a s krátkým čekáním.',
    'Lovec: Přískok (kotoul 6,5 m s nezranitelností). Strážce: Štítový náraz (výpad 4,5 m za štítem, odhodí soupeře).',
    'Technik: Fázový skok (okamžitý přesun 7 m). Žhář: Ohnivý kotoul (5,5 m, za sebou nechá oheň).',
    'Klávesu jde změnit v Nastavení → Ovládání, na mobilu je úskok šesté tlačítko. Ultimátka zůstává na F.',
    'Vyváženost: Strážce 385 HP a vyšší rychlost, Žhář 290 HP, Lovec 222 HP.',
    'Menší zátěž procesoru: limit 60 FPS (Nastavení → Grafika), lehčí pozadí menu, které jde vypnout, a úspornější efekty.']},
  {id:'2026-11b',title:'Výzvy, štíty a bonusy',items:[
    'První výhra dne: +200 zkušeností a +120 kreditů jednou denně.',
    'Nový nepřítel ve Vlnách a Nekonečnu: Štítonoš (od vlny 4) dává okolním nepřátelům štít.',
    'Výzva na souboj: tlačítko Souboj u přítele založí místnost 1 proti 1 a pošle pozvánku.',
    'Barvy týmů pro barvoslepé v Nastavení → Rozhraní.',
    'Pět nových úspěchů: série, vícenásobná zničení, Eliminace, Mutace týdne, věrnost.',
    'Rychlá hra: hlasování o mapě během odpočtu.',
    'Žebříček: klany tohoto týdne podle výher a nejdelší série v PvP.',
    'Emoty v kolečku zpráv (V): 8 Pozdrav, 9 Tanec, 0 Oslava.']},
  {id:'2026-11a',title:'Nové režimy, mapa a cvičiště',items:[
    'Mutace týdne: Aréna se dvěma pravidly, která se mění každé pondělí.',
    'Eliminace: 3 proti 3 na kola bez oživení se zmenšující se arénou.',
    'Hvězdná observatoř: nová mapa s teleportními branami.',
    'Střelnice: terče s měřičem poškození, vyzkoušej svou sestavu.',
    'Série a vícenásobná zničení s hláškami, rozbor smrti po pádu.',
    'Vlastní pravidla místnosti: cíl, délka zápasu, hra bez botů.',
    'Profil hráče, nedávní spoluhráči, denní odměna za přihlášení.',
    'Plynulejší online hra a návrat do zápasu po výpadku spojení.']}
];
// bonus for the first win of each calendar day (any mode; short custom matches do not count as a win here)
export const FIRST_WIN={xp:200,cr:120};
// Pozvi kamaráda: a player who signs up through someone's link and reaches `level` gets a reward, and so does the one
// who invited them (for at most `max` friends)
export const REFERRAL={level:5,credits:500,minR:2,max:10};
export const REF_RE=/^[a-z0-9]{8,14}$/;
// Hvězdy týdne: points for every match with an account (win 3, draw 2, loss 1, MVP +2; short custom matches give
// nothing). On Monday the best of the past week (at least minPts) get a reward that waits in their profile.
export const WEEKLY={win:3,draw:2,loss:1,mvp:2,minPts:10,rewards:[{rank:1,credits:1500,minR:4,title:'Hvězda týdne'},{rank:3,credits:900,minR:3},{rank:10,credits:400,minR:2}]};
export const weeklyReward=rank=>rank>0?WEEKLY.rewards.find(r=>rank<=r.rank)||null:null;
// how long the server keeps what a guest earned (it moves into the account when that browser signs up)
export const GUEST_DAYS=7;

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
    {k:'pass',name:'Neonový obvod',armor:0x0c1222,glow:0x8f7dff,acc:'antenna',req:{pass:true}}],
  pyro:[
    {k:'default',name:'Základní',armor:0x3a2a24,glow:0xff6a1a,acc:null},
    {k:'ember',name:'Uhlíková maska',armor:0x1c1416,glow:0xff3355,acc:'horns',req:{level:5}},
    {k:'blue',name:'Modrý plamen',armor:0x1e2a40,glow:0x4fb4ff,acc:'hood',req:{credits:900}},
    {k:'relic',name:'Relikviový žhář',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonová výheň',armor:0x0c1222,glow:0xffe14f,acc:'crest',req:{pass:true}}],
  cryo:[
    {k:'default',name:'Základní',armor:0x2c2a4a,glow:0xc3b5ff,acc:null},
    {k:'glacier',name:'Ledovec',armor:0xb8d4e8,glow:0x6ad8ff,acc:'hood',req:{level:5}},
    {k:'aurora',name:'Polární záře',armor:0x14283a,glow:0x5dffa8,acc:'antenna',req:{credits:900}},
    {k:'relic',name:'Relikviový kryonik',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonový mráz',armor:0x0c1222,glow:0xff7de9,acc:'crest',req:{pass:true}}],
  hook:[
    {k:'default',name:'Základní',armor:0x2e3226,glow:0xd4ff4f,acc:null},
    {k:'rust',name:'Rezavý přístav',armor:0x5a3420,glow:0xffa64d,acc:'hood',req:{level:5}},
    {k:'abyss',name:'Hlubinný lovec',armor:0x0e2230,glow:0x3fffd2,acc:'helm',req:{credits:900}},
    {k:'relic',name:'Relikviový hákař',armor:0x2a2410,glow:0xffe08a,acc:'crown',req:{drop:true}},
    {k:'pass',name:'Neonový řetěz',armor:0x0c1222,glow:0xff7de9,acc:'antenna',req:{pass:true}}]
};
// Legendary skins: hero archetypes from comics and films with our own names and emblems. Several accessories each,
// a metal finish, a suit (dark) and second armour colour (accent), a cape colour and a particle trail (fx).
// Unlocked with credits in the Shop, by level, or by an achievement tier (ach + tier, 0 bronze, 1 silver, 2 gold).
const LEGEND_SKINS={
  striker:[
    {k:'vigilante',name:'Noční mstitel',desc:'Temný strážce ulic s pláštěm a ušatou kápí.',armor:0x1c1d24,glow:0xffd23f,dark:0x07080c,accent:0x2a2c36,cape:0x0b0c12,acc:['cape','ears','mask','emblem','belt'],emblem:'wing',fx:'shadow',req:{credits:2500}},
    {k:'acrobat',name:'Rudý akrobat',desc:'Hbitý skokan v rudomodrém obleku s velkýma očima.',armor:0xc4142c,glow:0xe9f4ff,dark:0x1636a0,accent:0x1636a0,acc:['mask','emblem','belt'],emblem:'eye',fx:'sparks',req:{credits:2200}},
    {k:'emerald',name:'Smaragdový lučištník',desc:'Lučištník v kápi s toulcem plným zářících šípů.',armor:0x1f6b2e,glow:0xb6ff5d,dark:0x0c2412,accent:0x2e8a3c,acc:['hood','quiver','mask'],fx:'leaves',req:{credits:1600}},
    {k:'speedster',name:'Rudý blesk',desc:'Nejrychlejší muž arény. Za ním zůstává blesková stopa.',armor:0xb3121f,glow:0xffd23f,dark:0x5a0a10,accent:0xffc21a,acc:['helm','emblem','ears'],emblem:'bolt',metal:.4,fx:'lightning',req:{ach:'wins',tier:1}},
    {k:'starlord',name:'Hvězdný tulák',desc:'Vesmírný dobrodruh v koženém kabátě s rudou maskou.',armor:0x5a2c1c,glow:0xff4f4f,dark:0x24120c,accent:0x8a8f99,cape:0x3a1d12,acc:['helm','cape','belt'],metal:.3,fx:'stars',req:{level:30}}],
  guardian:[
    {k:'ironclad',name:'Železný titán',desc:'Leštěná rudozlatá zbroj s reaktorem na hrudi.',armor:0xa8121c,glow:0x9fe8ff,dark:0x3a0a0e,accent:0xe0b030,acc:['helm','reactor','shoulders'],metal:1,fx:'sparks',req:{credits:3000}},
    {k:'starshield',name:'Hvězdný štít',desc:'Voják v modrém s bílou hvězdou na hrudi.',armor:0x1c3a8a,glow:0xffffff,dark:0x0e1c44,accent:0xc4142c,acc:['helm','emblem','belt'],emblem:'star',metal:.3,fx:null,req:{credits:2500}},
    {k:'colossus',name:'Smaragdový kolos',desc:'Zelený obr v roztrhaných fialových kalhotách.',armor:0x3f9a3a,glow:0xb6ff5d,dark:0x3b1a5c,accent:0x2f7a2c,acc:['shoulders','belt'],fx:'quake',req:{level:25}},
    {k:'thunder',name:'Syn bouře',desc:'Bůh hromu s okřídlenou přilbou a rudým pláštěm.',armor:0x8a93a6,glow:0x9fd8ff,dark:0x1c2233,accent:0xc4c9d6,cape:0x9e1420,acc:['wingedHelm','cape','shoulders'],metal:.8,fx:'lightning',req:{ach:'bosses',tier:1}},
    {k:'kryptonian',name:'Muž z oceli',desc:'Nezranitelný hrdina v modrém s rudým pláštěm a znakem.',armor:0x1d4fbf,glow:0xffd23f,dark:0x0e2a6b,accent:0xc4142c,cape:0xc4142c,acc:['cape','emblem','belt'],emblem:'diamond',metal:.2,fx:'stars',req:{credits:3500}}],
  technician:[
    {k:'mystic',name:'Mistr mystiky',desc:'Čaroděj s rudým pláštěm, amuletem a runovou svatozáří.',armor:0x1c3a6b,glow:0x5dffa8,dark:0x10162a,accent:0xc49a3a,cape:0xa0141c,acc:['cape','amulet','halo','belt'],fx:'runes',req:{credits:2500}},
    {k:'scarlet',name:'Šarlatová čarodějka',desc:'Mocná čarodějka v karmínové s čelenkou a rudou magií.',armor:0x8a0f2c,glow:0xff3f6c,dark:0x3a0614,accent:0xb3123a,cape:0x6b0a1e,acc:['tiara','cape'],fx:'hex',req:{credits:2500}},
    {k:'cyborg',name:'Kyborg',desc:'Napůl stroj s rudým okem a leštěnými pláty.',armor:0xb7bfcc,glow:0xff2a2a,dark:0x2a2f3a,accent:0x5c6372,acc:['mask','reactor','shoulders'],metal:1,fx:'sparks',req:{level:30}},
    {k:'lantern',name:'Smaragdový strážce',desc:'Strážce vesmíru se zářícím prstenem a maskou.',armor:0x24342a,glow:0x3dff6a,dark:0x0a0d10,accent:0x23c454,acc:['mask','emblem','halo','belt'],emblem:'eye',fx:'leaves',req:{ach:'trophies',tier:1}},
    {k:'panther',name:'Vibraniový panter',desc:'Král v černém obleku s fialovou energií a kočičíma ušima.',armor:0x2c2c3a,glow:0xc9a0ff,dark:0x101018,accent:0x4a4660,acc:['ears','mask','necklace','emblem'],emblem:'diamond',metal:.7,fx:'shadow',req:{credits:3000}}],
  pyro:[
    {k:'torch',name:'Živá pochodeň',desc:'Hrdina z čistého plamene.',armor:0xff6a1a,glow:0xffe14f,dark:0xa8300a,accent:0xffa02a,acc:['emblem'],emblem:'flame',fx:'embers',req:{credits:2500}},
    {k:'rider',name:'Pekelný jezdec',desc:'Hořící lebka, řetězy a kožená bunda.',armor:0x24201c,glow:0xff7a1a,dark:0x0c0a08,accent:0xe8e0cc,acc:['skull','shoulders','belt'],metal:.4,fx:'embers',req:{level:35}},
    {k:'phoenix',name:'Fénix',desc:'Zrozená z ohně, s ohnivými křídly.',armor:0xd4401c,glow:0xffd23f,dark:0x5a1408,accent:0xff8a2a,acc:['wings','emblem','tiara'],emblem:'wing',fx:'embers',req:{ach:'endless',tier:1}},
    {k:'frost',name:'Mrazivý doktor',desc:'Ohnivý žhář naruby: brnění z ledu a mrazivá stopa.',armor:0x8fd6ff,glow:0xe9f8ff,dark:0x1c3a5a,accent:0x5ab0e0,acc:['helm','reactor'],metal:.9,fx:'frost',req:{credits:2000}},
    {k:'demon',name:'Démon výhně',desc:'Obr z lávy s rohy a ohnivými křídly.',armor:0x2a0e0a,glow:0xff3a1a,dark:0x120604,accent:0x5a1a10,acc:['horns','wings','shoulders'],fx:'embers',req:{credits:1800}}],
  cryo:[
    {k:'winterqueen',name:'Zimní vladařka',desc:'Vládkyně věčné zimy s ledovou čelenkou a třpytivým pláštěm.',armor:0xa8d8f0,glow:0xe9f8ff,dark:0x1c3a5a,accent:0x6ab8e0,cape:0x2a5a8a,acc:['tiara','cape','amulet'],metal:.6,fx:'frost',req:{credits:2500}},
    {k:'titan',name:'Sněžný titán',desc:'Obr z ledovcových plátů s rohy z rampouchů.',armor:0xdfeefa,glow:0x9ffcff,dark:0x3a4a5a,accent:0x8fb4d0,acc:['horns','shoulders','belt'],metal:.3,fx:'frost',req:{level:30}},
    {k:'void',name:'Hvězdný led',desc:'Poutník z mrazivé prázdnoty vesmíru, kolem něj se třpytí hvězdy.',armor:0x1a1838,glow:0xc3b5ff,dark:0x08081a,accent:0x4a3a8a,cape:0x14123a,acc:['helm','cape','halo'],metal:.5,fx:'stars',req:{ach:'wins',tier:1}}]
};
for(const [k,list] of Object.entries(LEGEND_SKINS))SKINS[k].push(...list.map(s=>({...s,legend:true})));
export const SKIN_FX={shadow:0x6a3aff,sparks:0xffd23f,leaves:0x7dff6a,lightning:0xffe14f,stars:0xe9f4ff,quake:0x9dff5d,runes:0xffc66d,hex:0xff3f6c,embers:0xff7a1a,frost:0xbfeaff};
export const skinOf=(k,s)=>SKINS[k]?.find(x=>x.k===s)||SKINS[k]?.[0];
export function skinOwned(p,k,s){const d=skinOf(k,s);if(!d||d.k!==s)return false;if(!d.req)return true;
  if(d.req.level)return p.level>=d.req.level;
  if(d.req.ach){const A=achById(d.req.ach);return!!A&&achReached(A,A.v(p))>d.req.tier}
  return (p.skins||[]).includes(k+':'+s)}
export const skinReqText=r=>!r?'':r.level?`Od úrovně ${r.level}`:r.credits?`${r.credits.toLocaleString('cs-CZ')} kreditů v Obchodě`:r.pass?'Ze sezónního průkazu':r.ach?`Úspěch „${achById(r.ach)?.name}“ · ${ACH_TIERS[r.tier].name.toLowerCase()}`:'Padá z bossů';

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
  ],
  pyro:[
    {k:'blaze',name:'Výheň',desc:'Hoření a plamenná vlna.',nodes:[
      {id:'f1',name:'Žár',max:3,fx:{tech:3},desc:'+3 % TECH.'},
      {id:'f2',name:'Spalování',max:3,fx:{burnDps:15},desc:'Hoření dává o 15 % víc poškození.'},
      {id:'f3',name:'Dlouhý žár',max:3,fx:{burnT:.5},desc:'Hoření trvá o 0,5 s déle.'},
      {id:'f4',name:'Široká vlna',max:3,fx:{waveR:.7},desc:'Plamenná vlna dosáhne o 0,7 m dál.'},
      {id:'f5',name:'Spáleniště',max:1,fx:{waveZone:1},desc:'Plamenná vlna nechá na konci hořící oblast 2,5 m na 3 s.'}]},
    {k:'ash',name:'Popel',desc:'Výdrž a pohyb.',nodes:[
      {id:'h1',name:'Žáruvzdorná vrstva',max:3,fx:{hp:4},desc:'+4 % maximálního HP.'},
      {id:'h2',name:'Tavená zbroj',max:3,fx:{def:1.5},desc:'+1,5 bodu obrany.'},
      {id:'h3',name:'Pohlcení',max:3,fx:{leech:2},desc:'Vysaješ 2 % způsobeného poškození.'},
      {id:'h4',name:'Plamenný štít',max:3,fx:{blinkSh:20},desc:'Fázový plamen ti dá štít 20 za úroveň.'},
      {id:'h5',name:'Fénixův krok',max:1,fx:{blinkCd:1},desc:'Fázový plamen má čekání o 3 s kratší a doletí o 2 m dál.'}]},
    {k:'inferno',name:'Inferno',desc:'Oblasti a ultimátka.',nodes:[
      {id:'i1',name:'Rozžhavení',max:3,fx:{atk:3,tech:2},desc:'+3 % útok a +2 % TECH.'},
      {id:'i2',name:'Velká výheň',max:3,fx:{fireR:.4},desc:'Ohnivé oblasti jsou o 0,4 m větší.'},
      {id:'i3',name:'Palivo',max:3,fx:{fireDps:15},desc:'Ohnivé oblasti dávají o 15 % víc poškození.'},
      {id:'i4',name:'Rozdmýchání',max:3,fx:{ult:7},desc:'Ultimátka se nabíjí o 7 % rychleji.'},
      {id:'i5',name:'Ohnivá smršť',max:1,fx:{infernoPull:1},desc:'Inferno si první výbuch přitáhne soupeře o 2 m k sobě.'}]}
  ],
  cryo:[
    {k:'frost',name:'Mráz',desc:'Kužel a zpomalení.',nodes:[
      {id:'k1',name:'Chladná mysl',max:3,fx:{tech:3},desc:'+3 % TECH.'},
      {id:'k2',name:'Široký kužel',max:3,fx:{coneR:.7},desc:'Mrazivý kužel dosáhne o 0,7 m dál.'},
      {id:'k3',name:'Rychlé chlazení',max:3,fx:{cdr:3},desc:'Čekání schopností −3 %.'},
      {id:'k4',name:'Zimní dech',max:3,fx:{ult:6},desc:'Ultimátka se nabíjí o 6 % rychleji.'},
      {id:'k5',name:'Ledové sevření',max:1,fx:{coneFreeze:1},desc:'Mrazivý kužel zasažené na 0,6 s zmrazí.'}]},
    {k:'ice',name:'Led',desc:'Krunýř a výdrž.',nodes:[
      {id:'l1',name:'Ledová kůže',max:3,fx:{hp:4},desc:'+4 % maximálního HP.'},
      {id:'l2',name:'Tvrdý led',max:3,fx:{def:1.5},desc:'+1,5 bodu obrany.'},
      {id:'l3',name:'Silný krunýř',max:3,fx:{shellSh:15},desc:'Ledový krunýř dá tobě o 15 štítu víc a spojencům o 7,5 víc.'},
      {id:'l4',name:'Klid zimy',max:3,fx:{regen:5},desc:'Energie se obnovuje o 5 % rychleji.'},
      {id:'l5',name:'Hojivý led',max:1,fx:{shellHeal:1},desc:'Ledový krunýř tě také vyléčí o 10 % HP.'}]},
    {k:'zero',name:'Nula',desc:'Miny a ultimátka.',nodes:[
      {id:'z1',name:'Tříštivý led',max:3,fx:{atk:3,tech:2},desc:'+3 % útok a +2 % TECH.'},
      {id:'z2',name:'Velká mina',max:3,fx:{mineR:.4},desc:'Kryomina vybuchne o 0,4 m dál.'},
      {id:'z3',name:'Hluboký mráz',max:3,fx:{freezeT:.15},desc:'Tvá zmrazení trvají o 0,15 s déle.'},
      {id:'z4',name:'Krystalizace',max:3,fx:{ult:7},desc:'Ultimátka se nabíjí o 7 % rychleji.'},
      {id:'z5',name:'Dvojitá mina',max:1,fx:{mineDouble:1},desc:'Kryomina po 1,5 s vybuchne podruhé (60 % TECH a zpomalení).'}]}
  ],
  hook:[
    {k:'chain',name:'Řetěz',desc:'Hák a útok.',nodes:[
      {id:'h1',name:'Ocelové oko',max:3,fx:{atk:3},desc:'+3 % útok.'},
      {id:'h2',name:'Dlouhý řetěz',max:3,fx:{hookR:1.5},desc:'Hák doletí o 1,5 m dál.'},
      {id:'h3',name:'Rychlé navíjení',max:3,fx:{cdr:3},desc:'Čekání schopností −3 %.'},
      {id:'h4',name:'Napětí',max:3,fx:{ult:6},desc:'Ultimátka se nabíjí o 6 % rychleji.'},
      {id:'h5',name:'Ostnatý hák',max:1,fx:{hookBleed:1},desc:'Přitažený soupeř krvácí 10 HP/s na 3 s.'}]},
    {k:'iron',name:'Železo',desc:'Výdrž a skok.',nodes:[
      {id:'i1',name:'Kroužková zbroj',max:3,fx:{hp:4},desc:'+4 % maximálního HP.'},
      {id:'i2',name:'Tvrdé články',max:3,fx:{def:1.5},desc:'+1,5 bodu obrany.'},
      {id:'i3',name:'Kotevní náraz',max:3,fx:{leapStun:.2},desc:'Řetězový skok omráčí o 0,2 s déle.'},
      {id:'i4',name:'Vytrvalost',max:3,fx:{regen:5},desc:'Energie se obnovuje o 5 % rychleji.'},
      {id:'i5',name:'Pevný úchop',max:1,fx:{leapShield:1},desc:'Po Řetězovém skoku získáš štít 60.'}]},
    {k:'vortex',name:'Vír',desc:'Spoutání a ultimátka.',nodes:[
      {id:'v1',name:'Švih',max:3,fx:{atk:2,rate:3},desc:'+2 % útok a +3 % rychlost útoku.'},
      {id:'v2',name:'Dlouhé pouto',max:3,fx:{tetherT:.5},desc:'Spoutání trvá o 0,5 s déle.'},
      {id:'v3',name:'Tvrdé škubnutí',max:3,fx:{tetherStun:.2},desc:'Škubnutí Spoutání omráčí o 0,2 s déle.'},
      {id:'v4',name:'Hladový vír',max:3,fx:{ult:7},desc:'Ultimátka se nabíjí o 7 % rychleji.'},
      {id:'v5',name:'Dvojitý vír',max:1,fx:{vortexDouble:1},desc:'Vír řetězů po 1 s stáhne soupeře znovu a zasáhne je za 70 % síly.'}]}
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
  if(um)add('ult',Math.min(um.r,MASTERY.bonusCap)*MASTERY.ultPerRank+(um.b[0]===0?10:0)+(um.b[4]===0?10:0)+(um.b[11]===0?15:0));
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
  technician:{name:'Statický řetěz',desc:'Každý zásah Řetězového výboje umlčí cíl na 1 s.'},
  pyro:{name:'Spalující jádro',desc:'Inferno má o 2 m větší dosah a vybuchne čtyřikrát.'},
  cryo:{name:'Věčný led',desc:'Absolutní nula má o 1,5 m větší dosah a zmrazí o 0,5 s déle.'},
  hook:{name:'Mlýnek',desc:'Vír řetězů má o 2 m větší dosah a omráčí o 0,4 s déle.'}
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
export const BOT_TACTIC={striker:'dodge',guardian:'barrier',technician:'decon',pyro:'dodge',cryo:'barrier',hook:'barrier'};
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

// Mutace týdne: an Aréna with two extra rules picked from the week number, the same for everyone.
// swift and surge mean the same as in Ozvěna jádra; the rest are PvP rules for all heroes.
export const MUTATORS={
  swift:{name:'Rychlé čekání',desc:'Schopnosti mají o 25 % kratší čekání.'},
  surge:{name:'Přebití',desc:'Energie se obnovuje o 50 % rychleji.'},
  haste:{name:'Zrychlení',desc:'Všichni se pohybují o 20 % rychleji.'},
  ultra:{name:'Ultimátní nával',desc:'Ultimátky se nabíjejí dvakrát rychleji.'},
  glass:{name:'Skleněná děla',desc:'Hrdinové mají o 35 % méně HP.'},
  vamp:{name:'Upíří krev',desc:'Přímé zásahy léčí útočníka o 12 % způsobeného poškození.'},
  rapid:{name:'Rychlý návrat',desc:'Oživení trvá polovinu času.'},
  relic:{name:'Relikviová horečka',desc:'Relikvie se objevuje dvakrát častěji.'}
};
export function mutatorsOfWeek(wk=weekKey()){
  const n=parseInt(String(wk).replace(/\D/g,''),10)||0,keys=Object.keys(MUTATORS),a=keys[n%keys.length];
  let b=keys[(n*5+3)%keys.length];if(b===a)b=keys[(n+1)%keys.length];return[a,b];
}
// modes that play by the Aréna rules: relic in the middle, a point for each kill
export const arenaLike=k=>k==='arena'||k==='mutant';

// ---------- daily and weekly goals ----------
// stat keys are filled in by the server from each finished match
export const GOALS={
  play3:{name:'Odehraj 3 zápasy',stat:'matches',target:3,xp:150,cr:60},
  win2:{name:'Vyhraj 2 zápasy',stat:'wins',target:2,xp:220,cr:90},
  arena1:{name:'Vyhraj zápas v Aréně',stat:'winArena',target:1,xp:200,cr:80},
  control1:{name:'Vyhraj zápas v Ovládnutí',stat:'winControl',target:1,xp:200,cr:80},
  convoy1:{name:'Vyhraj zápas v Konvoji relikvie',stat:'winConvoy',target:1,xp:200,cr:80},
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
// Režim dne: one mode a day gives more experience and credits (more on Saturday and Sunday), so the few players online
// tend to meet in the same mode. The order is fixed and the same for everyone (Prague days); campaign missions do not count.
export const FEATURED_MODES=['arena','control','boss','elim','ctf','waves','mutant','duel','endless','convoy'];
export const FEATURED={bonus:.3,weekend:.5};
export function featuredOfDay(t=Date.now()){
  const d=new Date(dayKey(t)+'T00:00:00Z'),wd=d.getUTCDay(),weekend=wd===0||wd===6;
  return{mode:FEATURED_MODES[Math.floor(d.getTime()/864e5)%FEATURED_MODES.length],weekend,bonus:weekend?FEATURED.weekend:FEATURED.bonus};
}

// ---------- maps ----------
// pillars: [x,z,r]; hazards hurt anyone inside; points are capture zones for Ovládnutí.
// Pevnost relikvií: walls are rows of overlapping pillars. The layout is mirrored left/right (the two teams) and
// top/bottom, so neither side has a shorter way. Three lanes (north, middle, south) are linked by gaps; no dead ends.
function bastionPillars(){
  const out=[],wall=(x1,z1,x2,z2,r=1.15)=>{const L=Math.hypot(x2-x1,z2-z1),n=Math.max(1,Math.round(L/1.7));
    for(let i=0;i<=n;i++)out.push([Math.round((x1+(x2-x1)*i/n)*10)/10,Math.round((z1+(z2-z1)*i/n)*10)/10,r])};
  for(const sx of [-1,1]){
    // fortress around the relic stand (±30, 0): solid towards the middle, gates north, south and to the back
    for(let a=0;a<360;a+=20){if(a>=60&&a<=120||a>=240&&a<=300)continue;const back=sx<0?(a>=150&&a<=210):(a<=30||a>=330);if(back)continue;
      out.push([Math.round((sx*30+Math.cos(a*Math.PI/180)*8.5)*10)/10,Math.round(Math.sin(a*Math.PI/180)*8.5*10)/10,1.35])}
    for(const sz of [-1,1]){
      wall(sx*10,sz*4,sx*10,sz*11);           // the middle lane: walls split it into two corridors
      wall(sx*5,sz*14,sx*15,sz*14);           // between the middle and the side lanes, with gaps at x 0 and x ±17
      wall(sx*19,sz*9,sx*19,sz*17);           // guards the fortress gates from the side lanes
      wall(sx*7,sz*22,sx*13,sz*30);           // side lane bends
      wall(sx*22,sz*22,sx*27,sz*27);
      wall(sx*2,sz*30,sx*2,sz*37);            // splits the far side lane near the centre line
    }
  }
  out.push([0,0,2.6],[0,-22,2],[0,22,2]);
  return out;
}
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
    theme:{floor:0x14070c,gridA:[1,.2,.35],gridB:[.7,.2,1],accent:0xff527e,fog:0x0a0306,sky:[0x0a0306,0x2c0818],pillar:'obelisk',amb:'motes',ambColor:0xff6a8a,rim:0xff527e,skyline:[0xff527e,0xac8dff,0xff9c5b,0x5a1030]}},
  // two pairs of teleport gates cross the map diagonally: north-west to south-east and south-west to north-east
  observ:{name:'Hvězdná observatoř',desc:'Kruh obelisků a dva páry teleportních bran, které propojují protilehlé rohy.',r:34,
    pillars:[...Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2;return[Math.round(Math.cos(a)*13*10)/10,Math.round(Math.sin(a)*13*10)/10,1.7]}),
      [0,-25,2.2],[0,25,2.2],[-21,-9,1.5],[-21,9,1.5],[21,-9,1.5],[21,9,1.5]],
    portals:[[{x:-12,z:-22},{x:12,z:22}],[{x:-12,z:22},{x:12,z:-22}]],
    hazards:[],bases:[{x:-28,z:0},{x:28,z:0}],points:[{x:0,z:0},{x:0,z:-17},{x:0,z:17}],bossAt:{x:9,z:5},
    theme:{floor:0x0a0818,gridA:[.6,.4,1],gridB:[.2,.9,.95],accent:0x7df9ff,fog:0x05040c,sky:[0x05040c,0x1a0f3a],pillar:'obelisk',amb:'motes',ambColor:0xb69cff,rim:0x7df9ff,skyline:[0x7df9ff,0xb69cff,0xff7de9,0x3f6bff]}},
  // Únos relikvie only: a long, mirrored arena. Each relic stands in a fortress whose wall faces the middle;
  // the gates are on the north and south sides and at the back towards the base.
  bastion:{name:'Pevnost relikvií',desc:'Bludiště zdí se třemi propojenými cestami a dvě pevnosti s relikviemi. Jen pro Únos relikvie.',r:44,ctfOnly:true,
    pillars:bastionPillars(),
    hazards:[],bases:[{x:-40,z:0},{x:40,z:0}],flags:[{x:-30,z:0},{x:30,z:0}],points:[{x:0,z:0},{x:0,z:-20},{x:0,z:20}],bossAt:{x:0,z:0},
    theme:{floor:0x0c0a18,gridA:[.35,.5,1],gridB:[1,.3,.6],accent:0xc9a0ff,fog:0x06040e,sky:[0x06040e,0x1c0f3a],pillar:'wall',amb:'motes',ambColor:0xc9a0ff,rim:0xc9a0ff,skyline:[0x3fb8ff,0xff3f8e,0xc9a0ff,0xffc66d]}},
  // Bouřková elektrárna: warned lightning strikes (STORM below); four generators around the centre, open flanks
  storm:{name:'Bouřková elektrárna',desc:'Do arény bijí ohlášené blesky. Uhni, nebo zásah přežij a nabij si ultimátku.',r:34,storm:true,
    pillars:[[-8,-8,2],[8,8,2],[-8,8,2],[8,-8,2],[-18,0,2.2],[18,0,2.2],[0,-19,1.8],[0,19,1.8],[-22,-15,1.5],[22,15,1.5],[-22,15,1.5],[22,-15,1.5]],
    hazards:[],bases:[{x:-27,z:0},{x:27,z:0}],points:[{x:0,z:0},{x:0,z:-25},{x:0,z:25}],bossAt:{x:12,z:5},
    theme:{floor:0x0b0c16,gridA:[1,.85,.3],gridB:[.35,.6,1],accent:0xffe27a,fog:0x05050a,sky:[0x05050a,0x1a1c3a],pillar:'box',amb:'motes',ambColor:0xffe27a,rim:0xffe27a,skyline:[0xffe27a,0x6acbff,0xffb347,0x9a7dff]}},
  // Neonová citadela: two heights, the ground and a terrace on the north and the south side; the centre is open ground.
  // `levels` are flat tops, a circle c:[x,z,r] or a box b:[x0,z0,x1,z1], with height h (a level with peak:true would be a
  // summit that charges ultimates and throws everyone off every 30 s; no map has one now);
  // `ramps` are boxes whose height runs along one axis (a) from h0 at the lower coordinate to h1 at the higher one;
  // `pads` throw whoever steps on them up to `to`.
  citadel:{name:'Neonová citadela',desc:'Dvě patra: přízemí a terasy na severu a jihu. Rampy, skokové plošiny a výhoda výšky.',r:36,
    levels:[{b:[-9,-30,9,-19],h:3},{b:[-9,19,9,30],h:3}],
    ramps:[{b:[-16.5,-27,-8.6,-23.5],a:'x',h0:0,h1:3},{b:[8.6,-27,16.5,-23.5],a:'x',h0:3,h1:0},
      {b:[-16.5,23.5,-8.6,27],a:'x',h0:0,h1:3},{b:[8.6,23.5,16.5,27],a:'x',h0:3,h1:0}],
    pads:[{x:0,z:-14.5,r:1.3,to:{x:0,z:-23.5}},{x:0,z:14.5,r:1.3,to:{x:0,z:23.5}}],
    pillars:[[-22,-9,1.6],[-22,9,1.6],[22,-9,1.6],[22,9,1.6],[-26,-19,1.4],[-26,19,1.4],[26,-19,1.4],[26,19,1.4],[-13,-13,1.2],[13,13,1.2],[-13,13,1.2],[13,-13,1.2],[-7,-5,1.3],[7,5,1.3],[-7,5,1.3],[7,-5,1.3]],
    hazards:[],bases:[{x:-30,z:0},{x:30,z:0}],points:[{x:0,z:0},{x:0,z:-25},{x:0,z:25}],bossAt:{x:0,z:16},
    theme:{floor:0x090c18,gridA:[.25,.75,1],gridB:[1,.3,.7],accent:0x5dffd8,fog:0x04060c,sky:[0x04060c,0x0c1a36],pillar:'hex',amb:'motes',ambColor:0x7fffe0,rim:0x5dffd8,skyline:[0x5dffd8,0x3fb8ff,0xff3f8e,0xffc66d]}}
};
export const MAP_KEYS=Object.keys(MAPS);
// ---------- heights (maps with levels) ----------
// Everything stays on the 2D plane; a point's height comes from the map. A unit cannot step up more than LEVEL_STEP
// at once (cliffs are walls, ramps are fine) but can drop down anywhere. From below you reach a unit on a higher
// level only within LEVEL_EDGE of its edge; shooting down gives LEVEL_DMG damage and LEVEL_RANGE more range.
// Bouřková elektrárna: from `start` s into the match, every `every` s come `n` lightning strikes, each warned `warn` s
// ahead by a circle of radius `r`; whoever stands in it loses `dmg` × max HP and is slowed, a hero who survives gets
// `ult` % ultimate.
// Two strikes aim near random heroes, the rest anywhere in the arena; never at the bases.
export const STORM={start:15,every:7,warn:1.3,n:3,r:3,dmg:.12,slow:.6,ult:15};
export const LEVEL_STEP=.8,LEVEL_EDGE=2.5,LEVEL_DMG=1.1,LEVEL_RANGE=2;
export const PEAK={every:30,warn:2.5,ult:3,dmg:.08};
const inBox=(b,x,z)=>x>=b[0]&&x<=b[2]&&z>=b[1]&&z<=b[3];
const onLevel=(L,x,z)=>L.c?Math.hypot(x-L.c[0],z-L.c[1])<=L.c[2]:inBox(L.b,x,z);
export function heightAt(map,x,z){
  if(!map.levels)return 0;let h=0;
  for(const L of map.levels)if(L.h>h&&onLevel(L,x,z))h=L.h;
  for(const R of map.ramps){if(!inBox(R.b,x,z))continue;const b=R.b,k=R.a==='x'?(x-b[0])/(b[2]-b[0]):(z-b[1])/(b[3]-b[1]),v=R.h0+(R.h1-R.h0)*k;if(v>h)h=v}
  return h;
}
// how deep inside its flat top a point stands (0 on the ground and on ramps)
export function depthAt(map,x,z){
  if(!map.levels)return 0;const h=heightAt(map,x,z);if(h<=0)return 0;
  for(const R of map.ramps)if(inBox(R.b,x,z))return 0;
  let d=0;for(const L of map.levels){if(L.h!==h||!onLevel(L,x,z))continue;const v=L.c?L.c[2]-Math.hypot(x-L.c[0],z-L.c[1]):Math.min(x-L.b[0],L.b[2]-x,z-L.b[1],L.b[3]-z);if(v>d)d=v}
  return d;
}
// a higher level's top, deep enough to hide a unit, stands between a point at height h and (x,z)
export const cliffAt=(map,h,x,z)=>heightAt(map,x,z)>h+1&&depthAt(map,x,z)>LEVEL_EDGE;
export const onPeak=(map,u)=>{const P=map.levels?.find(L=>L.peak);return!!P&&heightAt(map,u.x,u.z)>=P.h-.01&&onLevel(P,u.x,u.z)};

// ---------- modes ----------
export const MODES={
  arena:{name:'Aréna',desc:'3 proti 3. Body za zničení soupeřů a za relikvii ve středu. Vyhrává 20 bodů.',pvp:true,maps:['core','forge','archive','observ','citadel','storm'],max:6,win:20},
  control:{name:'Ovládnutí',desc:'3 proti 3 o tři body. Každý držený bod přidává skóre, vyhrává 100.',pvp:true,maps:['core','forge','archive','observ','citadel','storm'],max:6,win:100},
  convoy:{name:'Konvoj relikvie',desc:'3 proti 3 o vznášející se vůz s relikvií ve středu. Vůz jede k soupeřově základně, když má u něj tvůj tým víc hrdinů. Vyhrává, kdo ho dotlačí na konec, jinak ten, na čí straně stojí, když dojde čas.',pvp:true,maps:['core','forge','archive','observ','storm'],max:6,win:100,fixedWin:true},
  ctf:{name:'Únos relikvie',desc:'3 proti 3 v Pevnosti relikvií. Ukradni soupeřovu relikvii a dones ji ke své, která musí být doma. Vyhrávají 3 únosy.',pvp:true,maps:['bastion'],max:6,win:3},
  mutant:{name:'Mutace týdne',desc:'3 proti 3 podle pravidel Arény, ale s dvěma mutacemi, které se mění každé pondělí. Vyhrává 20 bodů.',pvp:true,mutators:true,maps:['core','forge','archive','observ','citadel','storm'],max:6,win:20},
  elim:{name:'Eliminace',desc:'3 proti 3 na kola bez oživení. Kolo vyhrává tým, který zůstane stát. Po 40 s se aréna začne zmenšovat a mimo kruh to pálí. Vyhrávají 4 kola.',pvp:true,rounds:true,maps:['core','forge','archive','observ','citadel','storm'],max:6,win:4,time:900},
  duel:{name:'Souboj',desc:'1 proti 1 bez relikvie a bodů. Vyhrává, kdo první pětkrát zničí soupeře.',pvp:true,team:1,maps:['archive','core','sanctum'],max:2,win:5},
  boss:{name:'Lov bosse',desc:'Až 4 hráči proti bossovi s mechanikami. Tým má společné životy.',pvp:false,maps:['sanctum','core','forge','archive','observ'],max:4,lives:8},
  waves:{name:'Vlny',desc:'Až 4 hráči proti vlnám dronů. Každá pátá vlna je boss, cílem je přežít 15 vln.',pvp:false,waves:true,maps:['sanctum','forge','archive','core','observ'],max:4,lives:6,last:15},
  endless:{name:'Nekonečno',desc:'Vlny bez konce. Každá pátá je boss, od vlny 10 přibývá každých 10 vln nový modifikátor. Kam až se dostanete?',pvp:false,waves:true,endless:true,maps:['core','forge','archive','sanctum','observ'],max:4,lives:5,last:0}
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
// Every class skill, profession skill and ultimate has a mastery rank 0–100 earned by using it in matches.
// Each rank up to bonusCap (20): −0.5 % energy cost and −0.5 % cooldown (ultimate: +1 % charge, basic attack +0.5 %
// damage); above it only the milestones add power. Ranks 5, 10, 15, 20 and then every 10 up to 100 unlock a milestone
// with a choice of two branches. Ranked matches cap the rank at 5 (the original's calibrated mastery).
export const MASTERY={max:100,bonusCap:20,tiers:[5,10,15,20,30,40,50,60,70,80,90,100],perRank:.005,ultPerRank:1,rankedCap:5,ultXp:8,matchCap:80};
// XP from rank n to n+1, one XP per use: the first 20 ranks as before, then a flat 120 per rank
export const masteryXpFor=n=>n<20?12+6*n:120;
export const masteryRank=xp=>{let n=0;while(n<MASTERY.max&&xp>=masteryXpFor(n)){xp-=masteryXpFor(n);n++}return{rank:n,into:xp,need:n<MASTERY.max?masteryXpFor(n):0}};
export const MASTERY_BRANCHES=[
  [{k:'thrift',name:'Úspora',desc:'Stojí o 10 % méně energie.'},{k:'tempo',name:'Spád',desc:'Čekání je o 8 % kratší.'}],
  [{k:'ward',name:'Ochranný impuls',desc:'Použití ti dá štít 4 % max. HP.'},{k:'surge',name:'Nápor',desc:'Po použití máš na 2 s o 15 % rychlejší pohyb.'}],
  [{k:'mend',name:'Záchranný impuls',desc:'Použití tě vyléčí o 3 % max. HP.'},{k:'battery',name:'Zpětný tok',desc:'Použití vrátí 5 energie.'}],
  [{k:'echo',name:'Ozvěna',desc:'15% šance, že se nespustí čekání.'},{k:'focus',name:'Soustředění',desc:'Další jiná schopnost do 3 s stojí o 20 % méně energie.'}],
  // ranks 30–100
  [{k:'empower',name:'Zesílení',desc:'Po použití způsobuješ 3 s o 8 % víc poškození.'},{k:'tempo2',name:'Rychlá ruka',desc:'Čekání je o dalších 8 % kratší.'}],
  [{k:'guard',name:'Odolnost',desc:'Po použití dostáváš 3 s o 12 % méně poškození.'},{k:'thrift2',name:'Hospodárnost',desc:'Stojí o dalších 10 % méně energie.'}],
  [{k:'echo2',name:'Silná ozvěna',desc:'Dalších 10% šance, že se nespustí čekání.'},{k:'ultfeed',name:'Nabíječ',desc:'Použití nabije ultimátku o 4 %.'}],
  [{k:'leech',name:'Vysávání',desc:'3 s po použití tě léčí 8 % poškození, které způsobíš.'},{k:'cleanse',name:'Očista',desc:'Použití odstraní zpomalení, krvácení, hoření, jed a šok.'}],
  [{k:'ward2',name:'Bariéra',desc:'Použití ti dá štít 6 % max. HP.'},{k:'mend2',name:'Druhý dech',desc:'Použití tě vyléčí o 4 % max. HP.'}],
  [{k:'chain',name:'Řetězení',desc:'Použití zkrátí čekání ostatních schopností o 1 s.'},{k:'battery2',name:'Úsporný tok',desc:'Použití vrátí 8 energie.'}],
  [{k:'execute',name:'Popravčí',desc:'3 s po použití dáváš soupeřům pod 35 % HP o 15 % víc.'},{k:'gale',name:'Vítr',desc:'Po použití máš na 3 s o 20 % rychlejší pohyb.'}],
  [{k:'master',name:'Mistr',desc:'Stojí o 10 % méně energie a má o 10 % kratší čekání.'},{k:'legend',name:'Legenda',desc:'Každé 4. použití nespustí čekání.'}]
];
export const MASTERY_ULT_BRANCHES=[
  [{k:'charge',name:'Rychlé nabití',desc:'Ultimátka se nabíjí o 10 % rychleji.'},{k:'start',name:'Připravenost',desc:'Zápas začínáš s ultimátkou nabitou na 25 %.'}],
  [{k:'ward',name:'Ochranný impuls',desc:'Ultimátka ti dá štít 8 % max. HP.'},{k:'surge',name:'Nápor',desc:'Po ultimátce máš na 3 s o 20 % rychlejší pohyb.'}],
  [{k:'mend',name:'Záchranný impuls',desc:'Ultimátka tě vyléčí o 6 % max. HP.'},{k:'battery',name:'Zpětný tok',desc:'Ultimátka vrátí 20 energie.'}],
  [{k:'echo',name:'Ozvěna',desc:'Po ultimátce zůstane 25 % jejího nabití.'},{k:'focus',name:'Soustředění',desc:'Ultimátka zkrátí čekání všech schopností o 2 s.'}],
  // ranks 30–100
  [{k:'charge2',name:'Bouřlivé nabití',desc:'Ultimátka se nabíjí o dalších 10 % rychleji.'},{k:'start2',name:'Náskok',desc:'Po každém oživení máš ultimátku nabitou aspoň na 15 %.'}],
  [{k:'ward2',name:'Velký štít',desc:'Ultimátka ti dá štít 12 % max. HP.'},{k:'mend2',name:'Velké léčení',desc:'Ultimátka tě vyléčí o 10 % max. HP.'}],
  [{k:'empower',name:'Zesílení',desc:'Po ultimátce způsobuješ 5 s o 12 % víc poškození.'},{k:'guard',name:'Odolnost',desc:'Po ultimátce dostáváš 4 s o 20 % méně poškození.'}],
  [{k:'killcharge',name:'Lovec duší',desc:'Zničení soupeřova hrdiny nabije ultimátku o dalších 10 %.'},{k:'team',name:'Ochránce',desc:'Ultimátka dá spojencům do 8 m štít 6 % jejich max. HP.'}],
  [{k:'battery2',name:'Velký tok',desc:'Ultimátka vrátí 30 energie.'},{k:'focus2',name:'Velké soustředění',desc:'Ultimátka zkrátí čekání všech schopností o 3 s.'}],
  [{k:'echo2',name:'Silná ozvěna',desc:'Po ultimátce zůstane 35 % jejího nabití.'},{k:'gale',name:'Vichr',desc:'Po ultimátce máš 4 s o 25 % rychlejší pohyb a zmizí zpomalení.'}],
  [{k:'leech',name:'Vysávání',desc:'5 s po ultimátce tě léčí 12 % poškození, které způsobíš.'},{k:'cleanse',name:'Očista',desc:'Ultimátka odstraní omráčení, umlčení, zpomalení a všechna poškození v čase.'}],
  [{k:'apex',name:'Vrchol',desc:'Ultimátka se nabíjí o 15 % rychleji a po ní způsobuješ 5 s o 10 % víc.'},{k:'lastStand',name:'Poslední vzdor',desc:'Jednou za zápas: smrtelný zásah tě nechá na 1 HP s 2 s nezranitelností, když máš ultimátku nabitou aspoň na 50 % (spotřebuje ji).'}]
];
// basic attack mastery: rank 5 unlocks the class element (Lovec bleed, Strážce poison, Technik shock, Žhář a stronger
// burn); every rank adds 0.5 % basic attack damage; one XP per four hits
export const MASTERY_BASIC={dmgPerRank:.005,hitsPerXp:4,elementRank:5,second:{striker:'shock',guardian:'burn',technician:'burn',pyro:'shock',cryo:'poison',hook:'shock'}};
export const MASTERY_BASIC_BRANCHES=[
  [{k:'potent',name:'Síla živlu',desc:'Efekt živlu dává o 50 % víc poškození.'},{k:'lasting',name:'Trvalost',desc:'Efekt živlu trvá o 2 s déle.'}],
  [{k:'spark',name:'Jiskra',desc:'Každý 5. zásah přeskočí na dalšího soupeře do 6 m (25 % síly) a přenese živel.'},{k:'expose',name:'Rozklad',desc:'Soupeři pod tvým živlem dostávají od tebe o 6 % víc.'}],
  [{k:'siphon',name:'Vysátí',desc:'Vyléčíš se o 15 % poškození, které způsobí tvůj živel.'},{k:'spread',name:'Šíření',desc:'Když soupeř pod tvým živlem padne, živel přeskočí na soupeře do 4 m.'}],
  [{k:'detonate',name:'Exploze',desc:'Každý 8. zásah okamžitě vybuchne zbytek živlu na cíli.'},{k:'dual',name:'Dvojí živel',desc:'Zásahy přidají i druhý živel (3 HP/s na 2 s).'}],
  // ranks 30–100
  [{k:'potent2',name:'Hustý živel',desc:'Efekt živlu dává o dalších 25 % víc poškození.'},{k:'lasting2',name:'Vytrvalý živel',desc:'Efekt živlu trvá o 1 s déle.'}],
  [{k:'crit',name:'Kritický zásah',desc:'Každý 4. základní útok dává o 40 % víc poškození.'},{k:'heavy',name:'Těžká ruka',desc:'Základní útok dává o 6 % víc poškození.'}],
  [{k:'chain',name:'Přeskok',desc:'Každý 6. zásah přeskočí na dalšího soupeře do 6 m (25 % síly) a přenese živel.'},{k:'expose2',name:'Hluboký rozklad',desc:'Soupeři pod tvým živlem dostávají od tebe o dalších 5 % víc.'}],
  [{k:'siphon2',name:'Pijavice',desc:'Každý zásah tě vyléčí o 0,4 % max. HP.'},{k:'spark2',name:'Jiskření',desc:'Každý zásah vrátí 1 energii.'}],
  [{k:'chill',name:'Mráz',desc:'Každý 5. zásah zpomalí cíl o 40 % na 1,5 s.'},{k:'weaken',name:'Oslabení',desc:'Každý 5. zásah: cíl 2 s způsobuje o 10 % méně poškození.'}],
  [{k:'rapid',name:'Rychlá palba',desc:'Útočíš o 6 % rychleji.'},{k:'heavy2',name:'Drtivá ruka',desc:'Základní útok dává o dalších 8 % víc poškození.'}],
  [{k:'detonate2',name:'Řetězová exploze',desc:'Každý 6. zásah vybuchne zbytek živlu na cíli.'},{k:'dual2',name:'Silný druhý živel',desc:'Zásahy přidají druhý živel 6 HP/s na 3 s.'}],
  [{k:'master',name:'Mistr zbraně',desc:'Základní útok dává o 10 % víc a živel o 25 % víc poškození.'},{k:'storm',name:'Bouře',desc:'Každý 10. zásah vyšle výboj do 3 soupeřů do 6 m od cíle (50 % poškození útoku).'}]
];
// mastery keys: "striker:c0" for class skills, "striker:ult" for ultimates, the plain id for profession skills
export const masteryKey=(cls,id)=>id==='ult'||id==='basic'?cls+':'+id:id&&id[0]==='c'&&id.length===2?cls+':'+id:id;
export function masteryName(key){
  const [a,b]=String(key).split(':');
  if(b==='ult')return CLASSES[a]?.ult.name||key;if(b==='basic')return CLASSES[a]?.basic.name||key;if(b)return CLASSES[a]?.skills[+b[1]]?.name||key;return PROF_SKILLS[a]?.name||key;
}
// the abilities a player can master with a class: three class skills, the ultimate and profession skills they can slot
export function masteryKeys(p,k){return[k+':basic',...[0,1,2].map(i=>k+':c'+i),k+':ult',...availableSkills(p,k).filter(id=>!(id[0]==='c'&&id.length===2))]}
// what goes into a match: rank and chosen branches per ability (ranks capped for ranked matches)
export function masteryLoadout(p,cap=MASTERY.max){
  const out={};for(const [key,m] of Object.entries(p?.mastery||{})){const r=Math.min(cap,masteryRank(m.xp|0).rank);if(!r)continue;
    out[key]={r,b:(m.br||[]).map((v,i)=>r>=MASTERY.tiers[i]&&(v===0||v===1)?v:null)}}
  return out;
}

// ---------- season pass ----------
// Free for every account, one per ranked season (calendar month). Pass XP comes from match XP and claimed goals.
export const PASS={tiers:30,xp:500,goalXp:100,weeklyXp:400,bonusXp:150};
// daily login reward: a seven-day cycle that grows each day; a missed day starts it again from day 1.
// minR is the minimum implant rarity (2 rare, 3 epic), crystal the crystal tier, pass extra season pass points
export const LOGIN_DAYS=[
  {cr:100},{cr:150,ess:5},{cr:200,crystal:1},{cr:250,ess:10},{cr:300,minR:2},{cr:400,ess:20},{cr:600,minR:3,crystal:2,pass:200}];
export function loginRewardText(R){
  return[R.cr&&`${R.cr} kreditů`,R.ess&&`${R.ess} esence`,R.minR&&(R.minR>=3?'epický implantát':'vzácný implantát'),R.crystal&&`krystal ${CRYSTAL_TIERS[R.crystal-1]}`,R.pass&&`${R.pass} bodů průkazu`].filter(Boolean).join(' + ');
}
// the calendar day before a "YYYY-MM-DD" key
export const prevDay=key=>new Date(Date.parse(key+'T12:00:00Z')-864e5).toISOString().slice(0,10);
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
  {id:'streak',cat:'fight',name:'Nezastavitelný',desc:'Dosáhni série zničení bez vlastního pádu v PvP.',t:[3,5,8],v:p=>st(p).bestStreak|0,title:'Nezastavitelný'},
  {id:'multi',cat:'fight',name:'Smršť',desc:'Znič víc soupeřů rychle po sobě: dvojité, trojité a čtyřnásobné zničení.',t:[2,3,4],v:p=>st(p).bestMulti|0,title:'Smršť'},
  {id:'elim',cat:'fight',name:'Poslední stojící',desc:'Vyhraj zápasy v Eliminaci.',t:[3,15,50],v:p=>st(p).byMode?.elim?.w|0,title:'Poslední stojící'},
  {id:'mutant',cat:'fight',name:'Mutant',desc:'Vyhraj zápasy v Mutaci týdne.',t:[3,15,50],v:p=>st(p).byMode?.mutant?.w|0,title:'Mutant'},
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
  {id:'loyal',cat:'prog',name:'Věrnost',desc:'Dokonči celou sedmidenní řadu denních odměn.',t:[1,4,12],v:p=>st(p).loginWeeks|0,title:'Věrný'},
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
  // shields the enemies around it every few seconds; a priority target from wave 4
  warden:{name:'Štítonoš',hp:260,speed:4.8,def:.2,atk:12,tech:0,pref:8,color:0x6ad8ff,radius:.9,basic:{type:'shot',dmg:8,rate:1.4,speed:24,range:12,size:1},
    shield:{every:6,r:7,frac:.3}},
  repair:{name:'Opravář',hp:110,speed:6.5,def:0,atk:0,tech:0,pref:4,color:0x74ffb4,radius:.6,basic:null},
  shard:{name:'Pravý střep',hp:300,speed:0,def:0,atk:0,tech:0,pref:0,color:0xffd16d,radius:.9,basic:null},
  // Střelnice: a target that never moves or attacks; the client keeps its health topped up
  dummy:{name:'Terč',hp:2000,speed:0,def:0,atk:0,tech:0,pref:0,color:0xffc66d,radius:1,basic:null},
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
  TACTICS,BOT_TACTIC,ACTS,ECHO_MODS,MUTATORS,GOALS,WEEKLY_GOALS,MAPS,MODES,NPCS,BOSSES])Object.setPrototypeOf(T,null);
