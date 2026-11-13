# Relikvie Aréna — online

Real-time aréna podle Relikvie. Server je autoritativní: počítá celou hru a klienti mu posílají jen vstupy (pohyb, míření, útok, schopnosti).

## Spuštění

Potřebuješ Node.js 18 nebo novější.

```bash
npm install
npm start
```

Hra poběží na http://localhost:8080. Kamarádi ve stejné síti se připojí přes IP adresu tvého počítače, třeba `http://192.168.1.20:8080`.

Proměnné prostředí:

| Proměnná | Výchozí | Význam |
|---|---|---|
| `PORT` | `8080` | Port HTTP i WebSocket serveru |
| `DATABASE_URL` | — | Připojení k Postgresu (např. Neon). Bez něj se data ukládají do `data/db.json`. |
| `ADMIN_NICKS` | — | Přezdívky moderátorů oddělené čárkou. Uvidí kartu Moderace. |
| `MATCH_SECONDS` | `360` | Délka zápasu v sekundách. Hodí se pro testování. |

## Co ve hře je

**Režimy**
- **Aréna** — 3 proti 3, body za zničení a relikvii ve středu, vyhrává 20.
- **Ovládnutí** — 3 proti 3 o body A, B, C. Držený bod přidává skóre, vyhrává 100.
- **Únos relikvie** — 3 proti 3 ve vlastní aréně **Pevnost relikvií**: bludiště zdí se třemi propojenými cestami (sever, střed, jih) bez slepých uliček, zrcadlově souměrné pro oba týmy. Každý tým má relikvii v pevnosti, jejíž zeď míří do středu a brány jsou ze stran a zezadu. Dotykem soupeřovu relikvii sebereš (nositel je o 15 % pomalejší, nemůže se maskovat a je vidět na minimapě); bod dostaneš, když ji doneseš ke své relikvii, která musí být doma. Když nositel padne, relikvie leží a tým, kterému patří, ji dotykem vrátí, jinak se vrátí sama po 15 s. Vyhrávají 3 únosy. Boti kradou, nosí, honí nositele, vracejí relikvii a jeden brání.
- **Mutace týdne** — 3 proti 3 podle pravidel Arény (body za zničení, relikvie ve středu, vyhrává 20) na mapách Neonové jádro, Rezavá kovárna, Ledový archiv, Hvězdná observatoř, Neonová citadela a Bouřková elektrárna. Platí v ní dvě mutace, které se mění každé pondělí (podle čísla týdne, pro všechny stejně). Možné mutace:
  - Rychlé čekání: −25 % čekání;
  - Přebití: +50 % obnovy energie;
  - Zrychlení: +20 % rychlosti;
  - Ultimátní nával: ultimátky se nabíjejí dvakrát rychleji;
  - Skleněná děla: −35 % HP;
  - Upíří krev: přímé zásahy léčí útočníka o 12 % poškození;
  - Rychlý návrat: poloviční oživení;
  - Relikviová horečka: relikvie dvakrát častěji.

  Mutace tohoto týdne jsou vidět na kartě režimu, v místnosti, v banneru po odpočtu a v HUD pod časem relikvie. Výhra se počítá i do cíle „Vyhraj zápas v Aréně“.
- **Eliminace** — 3 proti 3 na kola bez oživení (mapy Neonové jádro, Rezavá kovárna, Ledový archiv). Kolo vyhrává tým, který zůstane stát, oba týmy padlé najednou znamenají remízu kola. Po 40 s se aréna začne zmenšovat (za 45 s až do středu) a mimo kruh hrdinové ztrácejí 8 % maximálního zdraví za sekundu, takže každé kolo skončí. Kruh ukazuje červená stěna v aréně a minimapa, nad skóre je číslo kola, kdo z obou týmů ještě stojí a odpočet do zmenšování. Mezi koly je 4 s pauza (přeživší jsou nezranitelní), pak se všichni vrátí na základny s plnými životy a ultimátka se přenáší. Vyřazený hráč sleduje kamerou spoluhráče, který ještě žije. Vyhrávají 4 kola. Boti se drží uvnitř kruhu. Kdo se připojí místo bota, který už v kole padl, nastoupí až v dalším kole. V testech botů kolo trvá průměrně 23 s, zápas kolem 3 min a strany vyhrávají vyrovnaně.
- **Souboj** — 1 proti 1, vyhrává, kdo první pětkrát zničí soupeře.
- **Lov bosse** — kooperace až 4 hráčů (zbytek doplní boti) proti jednomu z deseti bossů. Tým má společné životy.
- **Vlny** — kooperace proti vlnám dronů, drtičů, hlídačů a od vlny 4 i **Štítonošů**. Štítonoš (azurový, se šestiúhelníkovým rámem) každých 6 s dá sobě a nepřátelům do 7 m štít ve výši 30 % jejich životů, se zábleskem a paprsky ke každému. V každé vlně je jeden, od vlny 10 dva a tak dál (o jednoho víc každých 6 vln). Vyplatí se ho zničit jako prvního; boti to dělají. Štítonoš je i v Nekonečnu. Každá pátá vlna je boss, cílem je přežít 15 vln.
- **Nekonečno** — vlny bez konce, každá pátá s náhodným bossem. Od vlny 10 přibude každých 10 vln modifikátor (odolní, krvácení, zuřiví, slabší léčení). Odměny rostou s vlnou, vlna 10 se počítá jako výhra a rekord je v žebříčku.

**Kampaň relikvií** (jen s účtem): 12 misí ve dvou aktech, od průzkumu dronů přes Omegu až po Archona. Mise se odemykají postupně podle úrovně, první dokončení dává velkou odměnu a titul, Omega navíc relikviový vzhled. Opakované výhry dávají střepy bosse, za 20 střepů se vyrábí legendární implantát. Týdenní cíl kampaně je 5 výher. Po poražení Omegy se otevře **Ozvěna jádra**, týdenní výzva s bossem a dvěma modifikátory (odolní nepřátelé, krvavá ozvěna…). Mise jdou hrát s boty nebo až se třemi přáteli.

**Povolání:** Lovec (nápor a přesnost), Strážce (výdrž a obrana), Technik (energie a obnova), **Žhář** (oheň a kontrola prostoru), **Kryonik** (mráz a zastavení) a **Hákař** (přitažení a kontrola). Žhář střílí žhavé projektily, které zapalují (hoření 6 HP/s), má Plamennou vlnu (kužel ohně do 6 m s hořením), Žhnoucí půdu (hořící oblast 3,5 m na 4 s), Fázový plamen (přesun o 7 m, za sebou nechá oheň) a ultimátku Inferno (tři výbuchy ohně kolem sebe do 8,5 m). Jeho relikvie zdvojnásobí hoření a zvětší ohnivé oblasti. Hoření odstraní Dekontaminace a Obnova. Strom má větve Výheň, Popel a Inferno, vzhledy Uhlíková maska, Modrý plamen, relikviový a neonový z průkazu. V soubojích botů 1 na 1 vychází Žhář zhruba na 50 % výher.

**Kryonik** (pátý hrdina, listopad 2026): 258 HP, rychlost 8,6, TECH 30. Ledová střepina (16, dostřel 19 m); talent Podchlazení: každý třetí zásah do stejného soupeře ho zpomalí o 40 % na 1 s. Q Mrazivý kužel (7 m, 100 % TECH, zpomalení 1,5 s), E Ledový krunýř (štít 70 sobě a 75 spojencům do 8 m), R Kryomina (dopadne až 14 m daleko, po 0,7 s vybuchne do 3 m: 90 % TECH a zmrazení 0,7 s). Ultimátka Absolutní nula: bouře v místě až 14 m daleko, po 0,55 s zasáhne vše do 7,5 m za 165 % TECH a zmrazí na 1,2 s. Zmrazení je omráčení; bossy jen zpomalí. Na obrazovce je zmrazená jednotka uzavřená v průsvitném ledovém krystalu s nápisem ZMRAŽEN (vlastní příznak ve snímku, bit 131072), zpomalené jednotce padá jinovatka a zbroj má modrý nádech. V menu má Kryonik u karty značku NOVÝ (NEW_CLASSES v data.js, do 15. 12. 2026), dokud si ho hráč jednou nevybere (rel.tried v localStorage). Úskok Ledový skluz (6 m, zpomalí soupeře u výchozího místa), relikvie mrazu (každý zásah zpomalí, čekání −20 %), strom Mráz / Led / Nula, úprava ultimátky Věčný led, 5 základních a 3 legendární vzhledy (Zimní vladařka, Sněžný titán, Hvězdný led), bot s taktickou akcí Polní bariéra. První verze s dlouhým zpomalením vyhrávala souboje v 94 % (Strážce byl zpomalený 77 % času). Po úpravě (méně HP, slabší střepina, kratší zpomalení a zmrazení, silnější štít pro spojence a větší ultimátka) vychází v soubojích kolem 47 % (silný proti Strážci a Technikovi, slabý proti Lovci) a v týmech 3 na 3 kolem 43–45 %. Další měření (500 týmových zápasů a 80 soubojů na dvojici) ukázalo spíš 41–42 %. Zkoušeno: bot, který používá ultimátku i na jednoho zdravého soupeře, a bližší boj (beze změny); 265 HP (souboje 57 %, týmy 45 %); TECH 33 (souboje 53 %, týmy 42 %); krunýř, který nabíjí ultimátku (souboje 56 %, týmy 46 %); štít spojencům 80 (beze změny). Ve hře je 258 HP: souboje kolem 52 %, týmy kolem 46 %. Osmé kolo: Technik v týmech dál vyhrával 57,5 % (1 200 zápasů). Kratší umlčení z EMP (1,1 s místo 1,6 s) ho srazilo na 52,8 % a Kryonika zvedlo na 46,8 %; Technikovy souboje beze změny (42–43 %). Slabší skoky Řetězového výboje (75 %) a slabší léčení spojenců z Obnovy (75 %) nic průkazně nezměnily. Deváté kolo: Kryonik byl v týmech nejslabší (43,5 %), Žhář 48 %. Silnější krunýř pro spojence (štít 75 místo 60, dosah 8 m místo 6 m) zvedl Kryonika na 49,5 % (1 200 zápasů) a souboje nemění. Víc HP (275) dalo jen 47 %, víc TECH 46,5 %.

**Hákař** (šestý hrdina, listopad 2026): 330 HP, rychlost 8,7, obrana 18 %, útok 32. Bojuje zblízka řetězem a přitahuje soupeře k sobě, k týmu, do lávy, do blesků nebo z terasy.
- Švih řetězem: úder do oblouku na 4,5 m, 31 poškození. Na mistrovství 5 krvácení.
- Talent Napnutý řetěz: přitažený nebo spoutaný soupeř od něj 3 s dostává o 25 % víc. Každé přitažení Hákem nebo škubnutím dá Hákaři štít 40, Vír řetězů 30 za každého soupeře.
- Q **Hák**: střela na 16 m chytí prvního soupeře v dráze a přitáhne ho před Hákaře (90 % útoku, zpomalení 0,8 s).
- E **Řetězový skok**: přitáhne Hákaře až o 11 m (zastaví se o zeď). Po dopadu 80 % útoku a omráčení 0,5 s soupeřům do 2,5 m.
- R **Spoutání**: připoutá soupeře do 6,5 m na 2,5 s (60 % útoku). Když uteče dál, řetěz ho škubne zpátky (50 % útoku, omráčení 0,8 s). Dekontaminace pouto přeruší.
- F **Vír řetězů**: stáhne všechny soupeře do 9 m k sobě, po 0,3 s 150 % útoku a omráčení 1 s.
- Úskok Řetězový švih (6 m, nezranitelnost 0,25 s, zasáhne soupeře v cestě), sekundární útok Trhnutí (hák na 9 m, přitáhne o 3 m).
- Relikvie řetězů: Hák a Spoutání mají o 40 % kratší čekání. Úprava ultimátky Mlýnek (+2 m dosah, omráčení +0,4 s).
- Strom: Řetěz (Dlouhý řetěz, Ostnatý hák s krvácením), Železo (výdrž, delší omráčení skoku, štít po skoku), Vír (delší a tvrdší Spoutání, Dvojitý vír). Vzhledy Rezavý přístav, Hlubinný lovec, relikviový a neonový ze sezónního průkazu.
- Bossové se nikdy nepřitahují, jen dostanou poškození. Přitažení je krátký výpad, takže ho zastaví zeď a nikoho neprotáhne skrz sloup.
- Boti: Hák ze střední vzdálenosti (míří s předstihem), Spoutání zblízka, skok na soupeře, nebo od něj, když jsou zranění, Vír na skupinu.
- Ladění: první verze vyhrávala v týmu jen asi 30 % (moc umírala). Pomohlo víc zdraví a silnější švih, štít za přitažení a talent +25 % místo +15 %. Výsledek na 900 zápasech 3 proti 3: Hákař 49 %, Lovec 50 %, Strážce 57 %, Technik 51 %, Žhář 46 %, Kryonik 47 %. V soubojích 1 na 1 boti s Hákařem vyhrávají asi 59 %. Některé dvojice jsou tam hodně jednostranné: proti Kryonikovi, Lovci a Technikovi vyhrává, proti Žhářovi a Strážci prohrává. Lidé se ale háku umí vyhnout líp než boti.
- Test (22 kontrol): přitažení, minutí, talent, skok, spoutání se škubnutím, vír na skupinu, boss se nehne, relikvie, úskok, sekundární útok a 20 zápasů botů bez chyb.

**Jména hrdinů:** každý hrdina má jméno a krátký příběh, které se ukazují na kartě hrdiny v hubu: Lovec **Vex Bleskorez**, Strážce **Bor Ocelštít**, Technik **Ina Signálová**, Žhář **Dax Popelář**, Kryonik **Sia Mrazivá**, Hákař **Kord Řetězník**. Jména se nepřekládají, příběhy ano.

**Vyváženost povolání** (listopad 2026): Strážce jako jediný hrdina na blízko v soubojích 1 na 1 prohrával (kolem 25 % výher) a Lovec vyhrával dvě třetiny. Proto má Strážce 385 HP místo 360 a rychlost 7,9 místo 7,6, Žhář 290 HP místo 275 a Lovec 222 HP místo 230. V soubojích botů na těžkou obtížnost (všechny dvojice, obě strany) teď vycházejí všechna čtyři povolání zhruba mezi 41 a 50 % výher (zbytek tvoří remízy).

Druhé kolo (po zavedení úskoku): boti začali úskok používat i v PvP, Strážce tím doskočí na střelce a v soubojích vyhrával 65 %, zatímco Žhář v týmech 3 na 3 jen 34–36 %. Proto má Štítový náraz čekání 6,5 s místo 5 s a Žhář TECH 40 místo 36, 305 HP místo 290 a základní útok 21 místo 19. V 200 týmových zápasech 3 na 3 (Aréna a Ovládnutí, náhodná složení týmů) teď vychází Lovec 48 %, Strážce 53 %, Technik 56 % a Žhář 43 % výher; souboje 1 na 1 kolísají mezi běhy zhruba o ±7 %.

Třetí kolo: v delší sérii (300–800 týmových zápasů) vycházel Technik 58–61 % a Žhář 37–43 %, v soubojích 1 na 1 naopak Technik jen 30 % a Žhář 63 %. Pokusné vypnutí jednotlivých schopností ukázalo, že Technika v týmech táhne hlavně Řetězový výboj (bez jeho poškození klesne na 45 %), méně Obnova, EMP a Mor nanitů. Proto má Technik TECH 35 místo 40, Řetězový výboj 140 % TECH místo 160 % a Výbojový šíp 25 místo 22 (ten pomáhá hlavně v soubojích). V 800 týmových zápasech teď vychází Lovec 48 %, Strážce 53 %, Technik 57 % a Žhář 42 %, v soubojích Lovec 40 %, Strážce 47 %, Technik 35 % a Žhář 58 %. Žhářovi jsme zkusmo přidali HP (330), v týmech mu to pomohlo jen málo a souboje vyhrával ještě víc (65–73 %), takže zůstává na 305. Žhář je tedy silný 1 na 1 a slabší v týmech, Technik naopak; další ladění by mělo cílit na schopnosti, které se projevují jen v jednom z režimů.

Čtvrté kolo (právě podle toho): Žhář vyhrával souboje hlavně základním útokem, v týmech by mu víc pomohla ultimátka, která zasáhne víc soupeřů. Proto má Žhavý projektil 18 místo 21 a Inferno dosah 8,5 m místo 7 m a 115 % TECH místo 90 % na výbuch. Technikova ultimátka, která působí hlavně v týmech, má 120 % TECH místo 140 %. Ve 750 týmových zápasech vychází Lovec 48 %, Strážce 54 %, Technik 56 % a Žhář 43 %, v soubojích Lovec 40 %, Strážce 50 %, Technik 40 % a Žhář 49 %. Souboje jsou tak poprvé vyrovnané (všichni mezi 40 a 50 %), v týmech zůstává rozptyl zhruba 43–56 %.

Co Žhářovi v týmech nepomohlo (ověřeno po 600 zápasech na variantu, nic z toho ve hře není): opatrnější bot, který Fázovým plamenem skáče jen na osamělý cíl a jen se dvěma třetinami života (padal méně, ale vyhrával ještě méně, 38–39 %); Inferno bot spouští na 8,5 m; Obnova Technika, která by hoření nesmazala nebo jen zkrátila na 1 s (41–45 %, v rámci náhody; později přesto zavedena, viz Sedmé kolo). Rozdíl mezi týmy a souboji tedy nedělá jedna schopnost ani chování bota. Výsledky týmových zápasů se mezi sériemi po 300 zápasech liší zhruba o ±4 %, menší rozdíly nejsou průkazné.

Co pomohlo: počítání ultimátek ukázalo, že bot Žháře používá Inferno asi o čtvrtinu méně než ostatní (8,5 za zápas proti 11–12), protože čekal, až mu soupeř přijde do 6 m, a skupinu soupeřů počítal jen do 7 m, ačkoli Inferno už sahá 8,5 m. Teď bot počítá soupeře v celém dosahu Inferna a se spoluhráčem do 12 m odpálí Inferno i na jediného soupeře v dosahu; sám (v souboji) dál jen zblízka. Inferno používá 11krát za zápas a v 750 týmových zápasech vychází Lovec 48 %, Strážce 51 %, Technik 55 % a Žhář 46 % (dřív 42 %); souboje se nezměnily (Žhář 48–51 %). Neúspěšné pokusy: štít spojencům z Inferna (70 i 120) a doskok Fázovým plamenem do Inferna nic průkazně nezměnily; posunutí hranice pro jednoho soupeře na 7 m zvedlo Žháře v soubojích na 60 %.

Páté kolo: Technik v soubojích dál prohrával (36–43 %, nejvíc s Lovcem), v týmech přitom vyhrával nejčastěji. Řetězový výboj proto zasáhne první cíl silněji (160 % TECH místo 120 %), každý další skok slabě (90 %) a přeskočí nejvýš na 3 další cíle místo 4. V 600 týmových zápasech a 200 soubojích na dvojici vychází Technik v soubojích kolem 50 % (dřív 40 %) a v týmech 55–58 % jako předtím. Zkoušeno a zamítnuto: 265 HP (souboje pomohlo, ale v týmech přidalo) a kratší čekání Obnovy (skoro nic). Nejslabší v soubojích teď zůstává Lovec (kolem 38–40 %).

Šesté kolo: Lovec vyhrával souboje jen ve 36–40 %. Zkoušeno (300 týmových zápasů a 100 soubojů na dvojici): 235 HP zvedlo souboje na ~47–50 % a týmy nechalo na 46–50 %; obrana 0,13 dala v soubojích až 51 %; Bouřový průraz 200 % útoku přidal hlavně v týmech (55 %); Pulzní střela 17 a častější maskování botem nepomohly. Ve hře je 235 HP. Slabší skok Technikova blesku (80 %) v týmech průkazně nic nezměnil, proto zůstává 90 %. Souboje 1 na 1 mají kolem 10–20 % remíz a i při 200 zápasech na dvojici se výsledky liší o ±5 %.

Sedmé kolo: Obnova Technika podle popisu zbavovala spojence jen krvácení, kód ale mazal i hoření a zpomalení. Teď už hoření nemaže (zpomalení dál ruší a popis to uvádí). Při 600 týmových zápasech na variantu vyšlo: Žhář v týmech 47 % místo 43,5 %, Technik 54 % místo 55 %, souboje Technika beze změny (43–44 %). Rozdíl je na hraně náhody (první pokus v Druhém kole ukázal 41–45 %), změna hlavně sjednocuje popis a chování. Varianta, kdy Obnova nemaže ani zpomalení, srazila Technika v soubojích na 36 %. Síťové testy proti testovacímu serveru (přihlášení, návrat do zápasu, přátelé, pravidla, hlasování, profil, sledování, moderace, hodnocená hra, fuzz) prošly; modtest a rankedtest je třeba pouštět na čerstvě spuštěném serveru, jinak narazí na limit registrací.

**Sledování zápasů přátel:** když přítel hraje (kromě hodnocené hry), v seznamu přátel je tlačítko Sledovat. Divák vidí zápas živě pohledem sledovaného hráče (jeho zdraví, schopnosti, mlhu války i týmové pingy), klávesami Q/E nebo šipkami v liště přepíná mezi hrdiny a na konci uvidí výsledek. Divák nemůže hrát ani pingovat, nepočítá se mezi hráče a místnost jich unese nejvýš 8. Sledovat můžou jen přihlášení přátelé.

**Série a vícenásobná zničení** (PvP):
- Kdo zničí soupeře dvakrát a víckrát, pokaždé do 4 s od předchozího, dostane hlášku Dvojité, Trojité, Čtyřnásobné zničení.
- Série zničení bez vlastního pádu: Série (3), Řádění (5), Nezastavitelný (8), Legenda arény (12).
- Kdo ukončí sérii aspoň 3 zničení, ukáže se „ukončil sérii“.
- Hlášky vidí všichni v záznamu vpravo nahoře, ten, kdo je získal, navíc banner a stoupající zvuk. Tento banner ani nápis „Zničen“ nepřekryje oznámení cizí ultimátky (to se v tu chvíli vynechá); varování bosse a události zápasu mají přednost vždy.
- Nejdelší série a nejvíc zničení naráz jsou ve Statistikách a na profilu hráče (počítá se jen PvP).

**Rozbor smrti:** když tvůj hrdina padne, pod nápisem Zničen se ukáže, kdo tě za posledních 10 s jak zasáhl:
- kdo tě dorazil a kolik životů mu zbylo;
- až pět útočníků s povoláním (u bosse „boss“) a součtem poškození;
- pruh rozdělený na přímé zásahy, ultimátku a poškození v čase;
- poškození od prostředí (láva, kruh Eliminace, cizí základna).

Rozbor dostane jen padlý hráč (případně divák, který ho sleduje), ostatním se neposílá. Zmizí po oživení, v Eliminaci po 9 s.

**Pingy a rychlé zprávy:** klávesa G položí ping tam, kam míříš: „Sem“, a když míříš na soupeře, „Útok na…“ (značka ho sleduje); Alt+G je varování „Pozor“. Ping vidí jen tvůj tým, v aréně i na minimapě, se zvukem. Klávesa V otevře rychlé zprávy (1–7: Útok!, Ustupte!, Potřebuju pomoc!, Bráním!, Díky!, Dobrá hra!, Haha!), které se ukážou bublinou nad hlavou všem. Ve stejném kolečku jsou **emoty** (fialové): 8 Pozdrav (mávání), 9 Tanec (otočky s poskoky) a 0 Oslava (ruce nahoru). Hrdinu vidí animovat všichni hráči i diváci, s fialovou bublinou nad hlavou. Emote skončí po 2–3 s, nebo jakmile se hrdina pohne či zaútočí. Padlý hrdina emote poslat nemůže a emoty sdílí omezení rychlosti se zprávami. Boti v týmu na pingy reagují: jdou na označené místo, útočí na označeného soupeře a z varování ustoupí. Na mobilu jsou tlačítka Ping a Zprávy, klávesy jdou přemapovat v Nastavení. Nejvýš 6 signálů za 8 s.

**Úskok** (mezerník, jako evade v Diablu): každé povolání má vlastní úskok ve směru pohybu (když stojíš, tak tam, kam se díváš), bez energie a s krátkým čekáním. Je to šestý slot v HUD s odpočtem.

| Povolání | Úskok | Čekání | Co dělá |
|---|---|---|---|
| Lovec | Přískok | 4 s | kotoul o 6,5 m, 0,3 s nezranitelnost |
| Strážce | Štítový náraz | 6,5 s | výpad o 4,5 m za štítem: 0,8 s poloviční poškození, soupeře v cestě zasáhne (60 % útoku) a odhodí |
| Technik | Fázový skok | 5 s | okamžitý přesun o 7 m, projde mezi nepřáteli, zastaví se o zeď, mžik nezranitelnosti |
| Žhář | Ohnivý kotoul | 4,5 s | kotoul o 5,5 m s 0,25 s nezranitelností, na výchozím místě vzplane oheň 2,2 m na 2 s |

Úskok nejde použít v omráčení, zeď ho zastaví a teleportní brány se během něj nepoužijí. Boti uskakují z varovaných oblastí (útoky bossů, výbuchy), na těžké obtížnosti spolehlivěji. V PvP boji s málem životů uskočí od blízkého soupeře a bot Strážce Štítovým nárazem doskočí na střelce, který je mimo dosah jeho útoku. Klávesa jde změnit v Nastavení → Ovládání. Starší uložené ovládání, které už mezerník používá pro jinou akci, nechá úskok bez klávesy, aby se akce nepletly. Ultimátka je jen na F (dřív na ni fungoval i mezerník).

**Sekundární útok** (pravé tlačítko myši, nebo klávesa C, která jde změnit v Nastavení → Ovládání): každé povolání má druhý útok bez energie s krátkým čekáním. Je to sedmý slot v HUD (popisek PTM) a na mobilu se dá klepnout. Umlčení ho zablokuje, omráčení taky.

| Povolání | Sekundární útok | Čekání | Co dělá |
|---|---|---|---|
| Lovec | Průrazná střela | 7 s | rychlá střela na 26 m, proletí všemi soupeři v řadě, 110 % útoku |
| Strážce | Úder štítem | 5 s | kužel do 3,5 m: 110 % útoku, odhození o 3,5 m, zpomalení 1 s, sobě štít 30; na citadele shazuje z okraje |
| Technik | Odsávač | 7 s | výboj na 18 m: 110 % TECH, vyléčí tě o polovinu, zasaženému hrdinovi vezme 20 energie a dá ji tobě |
| Žhář | Plamenomet | 4 s | kužel do 5,5 m: 95 % TECH a hoření 10 HP/s na 2 s |
| Kryonik | Ledový hrot | 6 s | hrot na 20 m: 60 % TECH a zpomalení 1,5 s |
| Hákař | Trhnutí | 6 s | hák na 9 m: 80 % útoku a přitáhne zasaženého soupeře o 3 m |

Boti ho použijí, když mají cíl na dohled a v dosahu. Server propouští ze vstupu akce 0–6 (6 = sekundární útok). Ladění: první verze byla moc silná. Kryonikův hrot zmrazil každého už zpomaleného soupeře a Kryonik vyhrával souboje 64 %, Technika i Strážce porážel 10 : 1. Lovec s průraznou střelou za 140 % měl 58 %. Po čtyřech kolech úprav (bez zmrazení, slabší Lovec, silnější Strážce, Technik a Žhář) jsou týmy 3 na 3 na 1 800 zápasech: Lovec 51 %, Strážce 52 %, Technik 54 %, Žhář 44 %, Kryonik 50 %. Souboje: Strážce 54 %, Lovec 48 %, Kryonik 46 %, Žhář 42 %, Technik 36 % (Technik byl v soubojích slabý už předtím).

**Taktické akce** (klávesa T, pro všechna povolání, volí se v Postavě): Úhyb (skok a krátká nezranitelnost), Dekontaminace (odstraní mor nanitů, krvácení, zpomalení a umlčení, 4 s ochrana), Nouzové přebití (+45 energie), Signální maják (soupeři v oblasti dostávají o 25 % víc a nemůžou se maskovat) a Polní bariéra (štít 22 % HP). Odemykají se na úrovních 1–12, boti je používají taky.

**Denní a týdenní cíle:** každý den tři náhodné cíle (jeden lze vyměnit) a bonus za splnění všech tří, každý týden jeden větší cíl s epickým implantátem.

**První výhra dne** (jen s účtem): první výhra každý kalendářní den (půlnoc v Praze) dá navíc 200 zkušeností a 120 kreditů, v jakémkoli režimu včetně kooperace a kampaně. Bonus se nenásobí obtížností ani MVP a počítá se i do sezónního průkazu. Na kartě Hrát je vidět, jestli bonus ještě čeká, a v souhrnu odměn po zápase řádek „První výhra dne“. Krátká výhra s vlastními pravidly, která se nepočítá do cílů, ho nedá.

**Denní odměna za přihlášení** (jen s účtem, karta Cíle a dokud není vyzvednutá, i nahoře na kartě Hrát): jednou za kalendářní den (půlnoc v Praze) sedmidenní řada, která s každým dnem roste:
1. 100 kreditů;
2. 150 kreditů a 5 esence;
3. 200 kreditů a krystal I;
4. 250 kreditů a 10 esence;
5. 300 kreditů a vzácný implantát;
6. 400 kreditů a 20 esence;
7. 600 kreditů, epický implantát, krystal II a 200 bodů průkazu.

Po sedmém dni řada začne znovu. Když hráč den vynechá, začíná znovu od prvního dne a hra mu to připomene. Nevyzvednutá dnešní odměna má na kartě Cíle značku.

**Profese** (od úrovně 10, platí pro všechna povolání): Úder, Stín, Technika, Ochrana. Každá má vlastní schopnosti (Stín a Technika čtyři), které jdou dát do slotů Q/E/R místo schopností povolání. Stín má **Dvojúder** (dva seky z opačných stran do stejného cíle), Technika **Mor nanitů** (nákaza, která tiká každou sekundu a přeskakuje na soupeře stojící blízko). Postupně se odemykají:
- talent (úroveň 10);
- schopnosti a větev +15 % (15);
- druhá pasivka (20);
- vedlejší profese s jednou půjčenou schopností (30);
- protokol (35): jedna aktivní úprava schopnosti hlavní profese, každá schopnost má dva protokoly na výběr;
- třetí pasivka (40);
- úprava ultimátky (45);
- vrchol profese (50).

**Bossové** (každý s vlastními mechanikami a varováním na zemi)
- **Sběratel** — označí hráče a vrhne se po něm, přivolává drony.
- **Pancéřník** — údery do země a střepy pod nohama. Na 66 % a 33 % HP si nasadí štít: prolomte ho do 8 s, jinak se schovejte za sloup.
- **Hlas** — rozpínavé vlny a rotující paprsky, před oběma chrání sloupy.
- **Matrona roje** — přivolává roje a opraváře, kteří ji léčí. V polovině je nezranitelná, dokud žije roj.
- **Archivář** — Zrcadlový kolaps: zničte zlatý pravý střep do 9 s. Falešný vybuchne, a když nestihnete ani jeden, zasáhne všechny.
- **Omega** — tři fáze, které spojují údery do země, paprsky, výpady a roj.
- **Nositel** — naloží hráči břemeno, které po 6 s vybuchne. Kdo ho nese, musí utéct od týmu.
- **Mantikora** — skoky na nejvzdálenějšího hráče, jedové žihadlo a mlha. Pod 30 % HP zuří.
- **Serafín** — kopí světla v liniích. Na 70 % a 35 % vzlétne a z nebe padá světlo.
- **Archon** — Rozsudek spálí polovinu arény, gravitace přitáhne tým k úderu. V polovině povolá hlídače.

**Mapy:** Neonové jádro, Rezavá kovárna (lávové kanály pálí), Ledový archiv (hustý les sloupů), **Hvězdná observatoř** (kruh obelisků a dva páry teleportních bran), Rudá svatyně (aréna pro bosse), Pevnost relikvií (bludiště jen pro Únos relikvie), **Neonová citadela** (terasy na dvou patrech), **Bouřková elektrárna** (ohlášené blesky). Boti hledají cestu po navigační mřížce, takže obejdou i dlouhé zdi. Každá má vlastní vzhled, oblohu, sloupy a částice.

**Hvězdná observatoř** se hraje v Aréně, Ovládnutí, Eliminaci, Lovu bosse, Vlnách i Nekonečnu:
- Dva páry teleportních bran propojují protilehlé rohy mapy: azurový pár severozápad–jihovýchod, růžový pár jihozápad–severovýchod.
- Kdo do brány vstoupí, vyjde z její dvojice 2,6 m dál ve směru, kterým šel; kdo stál, vyjde směrem ke středu. Pak 3 s žádnou bránu použít nemůže.
- Bránou projdou hrdinové, boti i drony a drtiči z vln, bossové ne. Přeskok má záblesk na obou koncích a vlastní zvuk.
- Maskovaný soupeř se teleportem neprozradí.
- Brány jsou vidět i na minimapě a hra skok ukáže jako skok, ne jako sklouznutí přes mapu.

**Hvězdy týdne** (`WEEKLY` v `data.js`, `rollWeekly` / `weekRanking` / `claimWeekly` v `meta.js`): týdenní žebříček s odměnami.
- Každý zápas s účtem dává body: výhra 3, remíza 2, prohra 1, MVP +2. Krátké zápasy podle vlastních pravidel nedávají nic, stejně jako u cílů. Body sbírá i host a po registraci mu zůstanou, do pořadí ale host nepatří.
- Týden začíná v pondělí (pražský čas, stejně jako týdenní cíle). Pořadí minulého týdne se zafixuje, když ho poprvé někdo potřebuje: když se první hráč toho týdne vrátí v novém týdnu, nebo když se otevře žebříček. Uloží se prvních deset (`doc.weeklyRanks`, posledních 6 týdnů). Do pořadí se počítá jen hráč s aspoň 10 body, aby při malém počtu hráčů nedostal odměnu každý za jeden zápas.
- Odměny: 1. místo 1 500 kreditů, legendární implantát a titul „Hvězda týdne“. 2.–3. místo 900 kreditů a epický nebo lepší implantát. 4.–10. místo 400 kreditů a vzácný nebo lepší implantát. Odměna počká v profilu a na kartě Hrát je panel s tlačítkem Vyzvednout. Vyzvednout jde jen jednou a s plným inventářem nejde.
- Žebříček má nahoře tabulku „Hvězdy týdne“ (body, výhry, MVP, prvních 20) s pravidly a jmény vítězů minulého týdne. Po zápase se v odměnách ukáže „Hvězdy týdne: +3 body · celkem 27 · 4. místo“.
- Test (17 kontrol): body za výsledky a MVP, krátký zápas, pořadí, přechod na nový týden, minimum bodů, uložené pořadí, vítěz v žebříčku, vyzvednutí (kredity, implantát, titul), druhé vyzvednutí nejde, místa a odměny, host.

**Režim dne** (`featuredOfDay` v `data.js`, bonus v `rewardsFor` v `meta.js`): každý den má jeden režim bonus +30 % zkušeností a kreditů, v sobotu a neděli +50 %.
- Režimy se střídají pevně v pořadí Aréna, Ovládnutí, Lov bosse, Eliminace, Únos relikvie, Vlny, Mutace týdne, Souboj, Nekonečno. Den se počítá podle Prahy, pro všechny stejně. Devět režimů se střídá se sedmi dny v týdnu, takže na víkend vychází pokaždé jiný režim.
- Smysl: dokud je hráčů málo, rozptýlí se po devíti režimech a potkají hlavně boty. Režim dne je stáhne na jedno místo.
- Na kartě Hrát je nahoře panel „Režim dne“ s tlačítkem Vybrat a karta režimu má štítek „REŽIM DNE +30 %“. Po zápase se v odměnách ukáže řádek „Režim dne · +30 % (už v odměně)“. Platí i pro hosty, neplatí pro mise kampaně.
- Test: bez bonusu mimo režim dne, s bonusem v něm (180 → 234 zkušeností), všechny režimy v rotaci existují, za 9 dní se vystřídají všechny, sobota má víkendový bonus.

**Bouřková elektrárna** (Aréna, Ovládnutí, Mutace týdne, Eliminace): čtyři generátory kolem středu a otevřené boky. Mechanika je v `updStorm` v `sim.js`, čísla v `STORM` v `data.js`.
- Od 15. sekundy bijí každých 7 s tři blesky. Každý se 1,3 s předem ohlásí červeným kruhem (poloměr 3 m), pak udeří.
- Dva blesky míří poblíž náhodných hrdinů, třetí kamkoli do arény. Na základny nikdy.
- Kdo v kruhu zůstane, ztratí 12 % maximálního zdraví a na 0,6 s se zpomalí. Když hrdina zásah přežije, dostane +15 % ultimátky („Nabito!“). Hráč tak volí mezi úhybem a nabitím ultimátky.
- Boti ohlášené kruhy opouštějí stejně jako u bossů. Na 300 zápasech je zasáhly jen asi 2 % blesků, takže blesky hlavně nutí k pohybu a pro boty nejsou past.
- Ověřeno na 300 zápasech botů (Aréna, Ovládnutí, Eliminace): všechny skončily, bez chyb. Vyhrávání podobné jako na Neonovém jádru (Lovec 47 %, Strážce 51 %, Technik 55 %, Žhář 45 %, Kryonik 52 %), zápasy trvají stejně dlouho.
- Nad mapou se pomalu točí prstenec bouřkových mraků, které občas probleskne.
**Neonová citadela** je mapa s patry. Hraje se v Aréně, Ovládnutí, Mutaci týdne a Eliminaci:
- Dvě výšky: přízemí a dvě terasy na severu a jihu (3 m). Střed je otevřená plocha s relikvií a bodem B, kryjí ho čtyři sloupy kolem středu a čtyři dál. Body A a C leží na terasách.
- Na terasy vedou rampy z obou boků a ze země u terasy tě na ni vystřelí skoková plošina. Dolů se dá seskočit odkudkoli.
- Simulace zůstává ve 2D: výška bodu se počítá z mapy (`heightAt`). Schod vyšší než 0,8 m je zeď (jednotka po ní sklouzne), rampa je v pořádku a pád dolů je vždy možný.
- **Kryt hranou:** zdola zasáhneš jen toho, kdo stojí do 2,5 m od okraje svého patra. Hlouběji je v bezpečí před střelami (zastaví se o hranu) i před schopnostmi zdola. Hra to řeší jednotně přes viditelnost (`blocked`) a seznam dosažitelných soupeřů (`foes`).
- **Výhoda výšky:** přímý zásah z vyššího patra dává o 10 % víc poškození a střely shora letí o 2 m dál.
- Oblasti (oheň, jed, mráz) působí jen ve svém patře.
- Kdo tě odhodí nebo přitáhne přes okraj, ten tě po dopadu na 1,2 s zpomalí („Shozen“).
- **Bez středu (listopad 2026):** původně měla citadela uprostřed ještě centrální plošinu (3 m) a na ní vrchol (6 m), který dobíjel ultimátku a každých 30 s všechny shodil. Na přání jsem střed zrušil. Kód pro vrchol (`peak:true`) zůstal a žádná mapa ho teď nepoužívá. Na volném středu Žhář vyhrával jen 42 %, proto přibyly čtyři sloupy kolem středu (±7, ±5). Výsledek na 900 zápasech: Lovec 46 %, Strážce 53 %, Technik 56 %, Žhář 46 %, Kryonik 49 %, podobně jako na ostatních mapách.
- Boti mají navigační mřížku s výškou: z buňky do sousední vedou jen hrany, po kterých se dá projít bez šplhání po útesu, a skoková plošina vede rovnou na terasu. Soupeře v krytu nahoře vidí jako cíl a vyjdou za ním.
- Ve hře se plošiny kreslí jako pevné bloky se zářícími hranami, rampy mají šipky nahoru a skokové plošiny stoupající kroužky. Hrdinové, střely, efekty i ukazatele leží ve správné výšce, pád má gravitaci a myš míří přímo na povrch pater. Minimapa ukazuje patra, rampy i plošiny.
- Původní ladění se středem (240 + 450 zápasů botů): Lovec 52,6 %, Technik 51,2 %, Kryonik 51,8 %, Žhář 49,8 %, Strážce 45,6 %.

**Postup (jen s účtem)**
- Úroveň 1–50. Zkušenosti a kredity za zápasy, víc za vyšší obtížnost.
- Strom dovedností: tři větve pro každé povolání, 5 řádků, poslední schopnost mění chování dovednosti. Každá úroveň dává bod do stromu každého povolání.
- Implantáty do slotů Jádro, Derma a Neurál v pěti vzácnostech. Legendární mají unikátní efekt (Fénix, Trny, Zrcadlení…).
- Kořist: padá z NPC (paprsek v barvě vzácnosti, sebereš ho vlastní postavou), z bossů a po zápasech.
- Obchod: zásobníky s náhodným implantátem a vzhledy za kredity.
- Obchodník: každý den čtyři vybrané implantáty (vzácný nebo lepší do každého slotu a jeden epický či legendární), každý jde koupit jednou, zboží jde jednou denně vyměnit.
- Sestavy: až 6 uložených kombinací povolání, implantátů, stromu, vzhledu a slotů profese, načtení jedním kliknutím.
- Statistiky: souhrn, úspěšnost podle povolání a režimu, poražení bossové a historie posledních 15 zápasů.
- Rozbor zápasu na konci: MVP (dostane +15 % odměn), tvůj podíl na poškození, léčení, zničení, zachycených ranách a cílech týmu a časová osa klíčových okamžiků.
- Tržiště: hráči si prodávají implantáty, poplatek 5 %.
- Vzhledy: deset pro každé povolání. Pět základních (úroveň 5, obchod, relikviový z bossů, neonový ze sezónního průkazu) a pět **legendárních** (★) inspirovaných archetypy hrdinů z komiksů a filmů, s vlastními jmény a znaky: Noční mstitel, Rudý akrobat, Smaragdový lučištník, Rudý blesk, Hvězdný tulák (Lovec); Železný titán, Hvězdný štít, Smaragdový kolos, Syn bouře, Muž z oceli (Strážce); Mistr mystiky, Šarlatová čarodějka, Kyborg, Smaragdový strážce, Vibraniový panter (Technik); Živá pochodeň, Pekelný jezdec, Fénix, Mrazivý doktor, Démon výhně (Žhář). Legendární vzhledy mají víc doplňků (helmy, masky, uši, reaktor, znak na hrudi, křídla, nárameníky, svatozář, toulec, lebka, čelenka, okřídlená přilba, amulet, opasek), kovový lesk, vlastní barvu pláště a stopu částic za postavou (jiskry, uhlíky, mráz, stín, hvězdy, blesky, runy). Kupují se v Obchodě (1600–3500 kreditů), odemykají úrovní (25, 30, 35) nebo stříbrným stupněm úspěchu. V Postavě jde každý zamčený vzhled prohlédnout na modelu.
- Žebříček: hodnocená sezóna, nejvyšší úrovně, klany podle úrovně, **klany tohoto týdne** (výhry členů od pondělí a počet aktivních členů; jen klany, které tento týden vyhrály) a **nejdelší série v PvP** (nejvíc zničení bez pádu v jednom zápase, od 3, při shodě rozhoduje víc zničení naráz). Prázdné tabulky se neukazují.

**Hra s lidmi:** Rychlá hra tě přidá do otevřené místnosti zvoleného režimu, nebo založí novou, která se sama spustí do 20 s (zbytek doplní boti). Během odpočtu všichni v místnosti **hlasují o mapě**: každý má jeden hlas, který může měnit, u map je vidět počet hlasů a pruh podílu. Při startu vyhraje mapa s nejvíc hlasy, při shodě rozhodne los (aktuální mapa má přednost) a bez hlasů zůstane mapa, kterou místnost dostala. Hlasy hráčů, kteří odešli, se nepočítají. Po zápase se hlasuje znovu o další mapě. Hodnocená hra a režimy s jedinou mapou (Únos relikvie) hlasování nemají. Místnost můžeš založit jako veřejnou, pak ji ostatní vidí v seznamu veřejných místností. Soukromá funguje dál přes kód.

**Vlastní pravidla místnosti:** hostitel založené místnosti (ne rychlé ani hodnocené hry a ne mise kampaně) nastaví v lobby kromě režimu, mapy a obtížnosti i pravidla:
- **Cíl** (PvP): kratší, normální, nebo delší, tedy polovina, plný, nebo jeden a půl násobek bodů na výhru. Aréna 10 / 20 / 30, Ovládnutí 50 / 100 / 150, Únos relikvie 2 / 3 / 5, Eliminace 2 / 4 / 6 kol, Souboj 3 / 5 / 8.
- **Délka** (PvP): dvě třetiny, plná, nebo jeden a půl násobek času. Aréna 4 / 6 / 9 min.
- **Boti:** doplnit volná místa, nebo hrát bez botů. Bez botů musí mít v PvP každý tým aspoň jednoho hráče, takže jde hrát třeba 1 proti 2. Kdo se připojí do běžícího zápasu, obsadí volné místo v menším týmu; v Eliminaci nastoupí až v dalším kole.

PvP zápas s jiným než normálním cílem nebo délkou je **vlastní zápas** (samotné vypnutí botů ne): odměny (zkušenosti, kredity, implantáty, krystaly) se násobí poměrem skutečné délky zápasu ke 4 minutám a výhra se do denních, týdenních a klanových cílů počítá, jen když zápas trval aspoň 2,4 minuty. Zkrácenými zápasy proti botům se tedy odměny nafarmit nedají. Veřejné místnosti s vlastními pravidly mají v seznamu štítek „vlastní pravidla“ a v zápase je u skóre vidět skutečný cíl.

**Návrat po výpadku spojení:** když hráči během zápasu spadne spojení (přepnutí z Wi-Fi na mobilní data, tunel, zavřený nebo znovu načtený panel), server mu drží místo 60 s a za jeho hrdinu mezitím hraje bot (v seznamu jako „(odpojen)“). Hra se sama připojuje znovu a ukazuje lištu „Spojení přerušeno · obnovuji…“. Po návratu ovládá stejného hrdinu se vším, co v zápase získal. Spojení, ze kterého 5 s nic nepřišlo, hra považuje za přerušené, i když to prohlížeč ještě nehlásí. Funguje to i po znovunačtení stránky (klíč pro návrat je jen v daném panelu prohlížeče) a pro hosty. Místo zanikne, když hráč odejde z menu, spustí jinou hru, dostane blokaci, nebo zápas skončí. Kdo se do konce zápasu nevrátí, dostane odměny do účtu stejně, v hodnocené hře se ale počítá jako odchod (prohra). Délku držení mění proměnná prostředí `REJOIN_SECONDS`.

**Mobil na výšku:** při svislém displeji je kamera dál podle poměru stran (až ×2), aby bylo vidět asi 11 m do stran (bez úpravy jen 9 m, přitom útoky dostřelí 19–22 m). Při prvních třech zápasech na výšku hra poradí otočit telefon na šířku. Velký nápis uprostřed obrazovky se na nízkých obrazovkách zmenšuje podle výšky okna.

**Automatické míření na dotyku:** míří na nejbližšího soupeře v dostřelu základního útoku (nejméně 20 m) a s předstihem podle jeho pohybu (čas letu střely, nejvýš 0,8 s), stejně jako boti. Proti soupeři, který uhýbá ze strany na stranu na 9 m, trefí Lovec 49 z 60 střel místo 14, Technik 30 ze 40 místo 7 a Žhář 34 ze 47 místo 3 (dřív se mířilo na jeho aktuální polohu). Na stojící cíl se nic nemění.

**Hodnocená hra:** Souboj 1 proti 1 nebo Aréna 3 proti 3 o hodnocení Elo (start 1000, prvních 10 umisťovacích zápasů mění hodnocení rychleji). Hledání páruje hráče s podobným hodnocením a týmy rozdělí vyrovnaně podle součtu hodnocení, chybějící místa doplní boti. Zápas se hodnotí, jen když na každé straně hraje aspoň jeden hráč s účtem, takže proti botům se hodnocení nahnat nedá. Kdo odejde před koncem, prohrává. Divize: Bronz, Stříbro (1100), Zlato (1250), Platina (1400), Diamant (1550), Neon (1700). Sezóna trvá kalendářní měsíc: na jejím konci dostaneš odměnu podle nejlepší dosažené divize (kredity, od Zlata implantát, od Diamantu titul) a nová sezóna začne s polovičním odstupem od 1000. Žebříček ukazuje pořadí aktuální sezóny.

**Přátelé a chat** (přátelé jen s účtem): na kartě Přátelé pošleš žádost podle přezdívky, nebo klikneš na jméno hráče v chatu. U přátel vidíš, jestli jsou online, v místnosti nebo ve hře a v jakém režimu, a do otevřené místnosti se k nim připojíš jedním tlačítkem. V lobby můžeš online přátele pozvat, pozvánka se jim ukáže s tlačítkem Připojit. Chat má záložky Svět (všichni přihlášení), Místnost a soukromé zprávy přátelům. V zápase otevře chat Enter: v PvP píšeš týmu, Tab přepne na všechny, Esc zavře (na mobilu tlačítko Chat). Hráče jde zablokovat, pak od něj nevidíš zprávy, žádosti ani pozvánky. Filtr sprostých slov je zapnutý a jde vypnout. Zprávy mají nejvýš 200 znaků a omezení rychlosti; historie chatu se drží jen v paměti serveru, přátelé a blokování se ukládají do účtu.

**Výzva na souboj:** u přítele, který je online v hubu nebo v místnosti, je na kartě Přátelé tlačítko Souboj. Jedním klikem založí soukromou místnost Souboj 1 proti 1 (Ledový archiv, bez botů) a příteli pošle pozvánku „vyzývá tě na souboj“ s tlačítkem Připojit. Přítel nastoupí za Rudé. Mapu, cíl, délku a obtížnost můžeš v místnosti změnit jako u každé jiné. Zápas jde spustit, až když jsou ve hře oba.

**Nedávní spoluhráči** (karta Přátelé, jen s účtem): posledních 20 hráčů s účtem, se kterými jsi dohrál zápas (místnost, rychlá hra, hodnocená hra i kampaň s přáteli). U každého je vidět, jestli byl spoluhráč, nebo soupeř, režim a před kolika minutami, hodinami nebo dny se hrálo, úroveň a povolání. Jméno otevře profil, dál jde poslat žádost o přátelství (nebo přijmout čekající) a nahlásit. Hosté bez účtu se do seznamu nedostanou a zablokovaný hráč z něj zmizí. Seznam se ukládá do účtu a aktualizuje se živě po konci zápasu.

**Profil hráče:** kliknutím na jméno hráče v žebříčku, v seznamu přátel, v místnosti nebo v chatu (tlačítko Profil) se otevře jeho karta. Ukazuje klan, titul, úroveň, povolání, datum založení účtu, počet zápasů a výher, zničení, MVP, body úspěchů a hodiny ve hře. Dál divizi a hodnocení v aktuální sezóně a nejlepší dosaženou divizi, rekordy (bossové, vlny, Nekonečno), čtyři nejhranější povolání a režimy s úspěšností a posledních šest zápasů. Přihlášený hráč odtud může poslat žádost o přátelství nebo soukromou zprávu, nahlásit, nebo zablokovat. Profil vidí i hosté. Karta ukazuje jen herní údaje, nikdy inventář, kredity, cíle ani seznam přátel (`/api/player?id=` nebo `?nick=`).

**Klany** (karta Klan, jen s účtem): klan založíš od úrovně 5 za 1000 kreditů (název, zkratka 2–4 znaky, popis, otevřený vstup nebo na žádost). Do klanu se vstupuje pozvánkou, žádostí, nebo rovnou, když je otevřený. Role: vůdce (nastavení, povyšování, předání vedení, rozpuštění), důstojník (zve, schvaluje žádosti, vyhazuje členy) a člen. Každý zápas člena dá klanu třetinu získaných zkušeností; úrovně 1–10 přidávají dvě místa (20 až 38 členů) a všem členům +1 % zkušeností a kreditů za úroveň. Týdenní cíl klanu je společný počet výher (4 na člena, aspoň 15); kdo za klan odehrál tento týden aspoň 3 zápasy, vyzvedne kredity a implantát. Klan má vlastní chat a zkratka se ukazuje u jmen v chatu a v lobby. Žebříček ukazuje nejlepší klany.

**Mistrovství schopností** (karta Mistrovství, z původní Relikvie): každá schopnost povolání, schopnost profese a ultimátka má úroveň 0–20, která roste používáním v zápasech s účtem (1 bod za použití, ultimátka 8, nejvýš 80 bodů na schopnost za zápas; úroveň 20 je asi 1380 použití). Každá úroveň zlevní energii a zkrátí čekání o 0,5 %, u ultimátky zrychlí nabíjení o 1 %. Na úrovních 5, 10, 15 a 20 se odemkne milník se dvěma větvemi (úspora energie / kratší čekání, štít / zrychlení, léčení / vrácení energie, ozvěna bez čekání / levnější další schopnost; ultimátka má vlastní silnější varianty). Větve jde měnit zdarma mimo zápas. V hodnocené hře se počítá nejvýš úroveň 5 a jen první milník, jako kalibrované mistrovství v originále.

**Pokročilé mistrovství 21–100:** mistrovství pokračuje až do úrovně 100 (každá úroveň nad 20 stojí 120 bodů, úroveň 100 je asi 11 000 použití). Bonus za úroveň (energie, čekání, nabíjení, poškození základního útoku) roste jen do úrovně 20, aby schopnosti nezlevnily na polovinu. Nad 20 přidávají sílu nové milníky na mistrovství 30, 40, 50, 60, 70, 80, 90 a 100, každý s výběrem ze dvou větví. Na kartě je milník označený M (M30 = mistrovství 30 této schopnosti, ne úroveň postavy).

| Mistrovství | Schopnosti | Ultimátka | Základní útok |
|---|---|---|---|
| 30 | Zesílení (3 s +8 % poškození) / Rychlá ruka (−8 % čekání) | Bouřlivé nabití (+10 %) / Náskok (po oživení aspoň 15 %) | Hustý živel (+25 %) / Vytrvalý živel (+1 s) |
| 40 | Odolnost (3 s −12 % přijatého) / Hospodárnost (−10 % energie) | Velký štít (12 % HP) / Velké léčení (10 % HP) | Kritický zásah (každý 4. +40 %) / Těžká ruka (+6 %) |
| 50 | Silná ozvěna (+10 % šance bez čekání) / Nabíječ (+4 % ultimátky) | Zesílení (5 s +12 %) / Odolnost (4 s −20 %) | Přeskok (každý 6. zásah) / Hluboký rozklad (+5 % pod živlem) |
| 60 | Vysávání (3 s léčí 8 % poškození) / Očista (zpomalení a poškození v čase) | Lovec duší (+10 % za zničení) / Ochránce (štít spojencům do 8 m) | Pijavice (0,4 % HP za zásah) / Jiskření (+1 energie) |
| 70 | Bariéra (štít 6 % HP) / Druhý dech (léčení 4 % HP) | Velký tok (+30 energie) / Velké soustředění (−3 s čekání) | Mráz (každý 5. zpomalí) / Oslabení (každý 5.: cíl −10 %) |
| 80 | Řetězení (ostatní −1 s) / Úsporný tok (+8 energie) | Silná ozvěna (zůstane 35 %) / Vichr (4 s +25 % rychlost) | Rychlá palba (+6 % rychlost útoku) / Drtivá ruka (+8 %) |
| 90 | Popravčí (3 s +15 % na cíle pod 35 % HP) / Vítr (3 s +20 % rychlost) | Vysávání (5 s léčí 12 %) / Očista (všechny negativní efekty) | Řetězová exploze (každý 6.) / Silný druhý živel (6 HP/s) |
| 100 | Mistr (−10 % energie a čekání) / Legenda (každé 4. použití bez čekání) | Vrchol (+15 % nabíjení, 5 s +10 %) / Poslední vzdor (jednou za zápas přežiješ na 1 HP) | Mistr zbraně (+10 % útok, +25 % živel) / Bouře (každý 10. zásah výboj do 3 soupeřů) |

Kdo už měl schopnost na úrovni 20 a hrál dál, má nasbírané body započítané, takže může začít rovnou výš.

**Mistrovství základního útoku (živly):** základní útok má vlastní mistrovství 0–20 (1 bod za 4 zásahy, +0,5 % poškození za úroveň). Úroveň 5 odemkne živel povolání, který působí při každém zásahu: Lovec **krvácení** 4 HP/s, Strážce **jed** 4 HP/s (cíl se navíc léčí o 30 % méně), Technik **elektrický šok** 4 HP/s, Žhář silnější **hoření** 10 HP/s (jeho talent zapaluje slabším ohněm 5 HP/s už od začátku). Milníky: Síla živlu (+50 %) / Trvalost (+2 s), Jiskra (každý 5. zásah přeskočí na dalšího soupeře) / Rozklad (cíle pod tvým živlem dostávají o 6 % víc), Vysátí (léčí 15 % poškození živlu) / Šíření (při pádu cíle živel přeskočí na soupeře do 4 m), Exploze (každý 8. zásah odpálí zbytek živlu) / Dvojí živel (přidá druhý živel). Efekty se nesčítají, nový zásah obnoví trvání. Dekontaminace odstraní všechny, Obnova jen krvácení. V hodnocené hře platí úroveň 5, takže živel má každý; vyváženost je ověřená souboji botů na úrovni 0 i 5.

**Dílna a krystaly** (z původní Relikvie: esence, vylepšování, přeladění, zamykání a výroba; zdířky s krystaly jsou nové):
- **Rozložení** implantátu dá esenci (běžný 1, neobvyklý 3, vzácný 8, epický 22, legendární 40 a 3 legendární fragmenty), epické a legendární občas krystal. Vylepšený implantát vrátí polovinu esence za vylepšení, krystaly ze zdířek se vrací do zásoby. Hromadně jde rozložit nevybavené, nezamčené a neupravené implantáty do vzácných včetně.
- **Vylepšení +1 až +5** za kredity a esenci (od úrovní 5, 10, 15, 20, 25), každý stupeň +6 % ke všem vlastnostem implantátu.
- **Přeladění** (od úrovně 10): vybraná vlastnost dostane nabídku náhodné jiné vlastnosti ze slotu a hráč rozhodne, jestli ji vezme, nebo nechá původní.
- **Zdířky**: neobvyklý a vzácný implantát 1, epický 2, legendární 3; otevření stojí kredity a esenci. **Krystaly** Rubín (útok), Smaragd (HP), Safír (TECH), Topas (zkrácení čekání), Onyx (obrana) a Ametyst (nabíjení ultimátky) v pěti stupních; stejný druh jen jednou na implantát, tři stejné se spojí do vyššího stupně, vyjmutí stojí malý poplatek. Padají ze zápasů (častěji po výhře a po bossech, na těžké obtížnosti i stupeň II), z rozkladu a jdou destilovat z esence.
- **Výroba** epického implantátu (150 esence + 300 kreditů) nebo legendárního (30 fragmentů + 1000 kreditů) do zvoleného slotu.
- **Zamčené** implantáty nejde prodat, rozložit ani nabídnout na tržišti. Vylepšení a krystaly se na tržišti prodávají s implantátem.

**Moderace:** hráče jde nahlásit z chatu (klik na jméno) nebo ze seznamu přátel s důvodem (urážky, spam, podvádění, nevhodné jméno, jiné). Server k nahlášení sám přiloží posledních až 15 zpráv hráče (svět, místnost, klan, soukromé zprávy nahlašujícímu). Kdo dostane během hodiny nahlášení od tří různých hráčů, má automaticky na hodinu zákaz chatu, než se na to podívá moderátor. Moderátoři (proměnná `ADMIN_NICKS`) mají kartu Moderace: nevyřízená nahlášení s kontextem, vyhledání hráče, varování, zákaz chatu (1 h, 24 h, 7 dní), zablokování účtu (7 dní, 30 dní, natrvalo) s poznámkou pro hráče, zrušení trestů a záznam všech zásahů. Zablokovaný hráč je okamžitě odpojen a při přihlášení uvidí důvod. Jeden hráč může denně nahlásit nejvýš 10 lidí.

**Novinky:** tlačítko Novinky v záhlaví hubu ukáže přehled posledních změn (seznam `CHANGELOG` v `public/data.js`, nejnovější nahoře). Dokud hráč nejnovější záznam neviděl, svítí u tlačítka zlatá tečka. Kdo už hrál, tomu se přehled po nahrání nové verze jednou sám otevře. Všechny záznamy přibylé od jeho poslední návštěvy mají štítek NOVÉ (i když se nahrálo víc aktualizací najednou), nahoře je jejich počet a starší záznamy jsou pod čarou „Starší“ ztlumené. Úplně nový hráč ho automaticky nedostane, začíná Výcvikem. Při další verzi stačí přidat do `CHANGELOG` nový záznam s novým `id` na začátek.

**Aplikace:** hra je instalovatelná (PWA): tlačítko Nainstalovat v hubu (Chrome, Edge, Android), na iPhonu Sdílet → Přidat na plochu. Běží přes celou obrazovku s vlastní ikonou. Service worker bere kód hry vždy nejdřív ze sítě, takže nové verze dorazí hned; bez internetu se hra spustí z uložené kopie a nabídne trénink proti botům. API a WebSocket nikdy nejdou přes mezipaměť.

**Výkon (zátěž procesoru):**
- **Limit snímků:** hra kreslí nejvýš 60 snímků za sekundu (Nastavení → Grafika → Limit snímků: 30, 60, bez omezení). Dřív na monitoru se 144 Hz kreslila 144×.
- **Menu:** ukázkový zápas za hubem a místností se kreslí jen 30× za sekundu. Volba „Živé pozadí menu“ ho úplně zastaví (obraz se pak obnoví jednou za sekundu).
- **Záře (bloom)** se počítá v polovičním rozlišení.
- **Střely** sdílejí jednu geometrii a materiál podle barvy a krátké efekty (kruhy, záblesky, paprsky) vracejí materiály do zásobníku, místo aby se pro každý zásah tvořily nové.
- **Automatické snížení rozlišení** se nespouští, když hra jen drží limit 30 FPS.
- **Průhledné oboustranné materiály** (neonové části hrdinů, záře, efekty) se kreslí jedním průchodem (`forceSinglePass`). Three.js je jinak kreslí dvakrát za snímek, zadní a přední stranu zvlášť, a pokaždé znovu ověřuje jejich shader; v profilu to byla největší jednotlivá položka.

Změřeno v Edge bez okna (softwarové vykreslování, procesorové sekundy za 10 s):
- hub z 11,5 na zhruba 7, s vypnutým pozadím na 0,75;
- zápas na 60 FPS kolem 11, s limitem 30 FPS kolem 6.

Kdo má slabší počítač nebo notebook, ať nastaví limit 30 FPS a vypne živé pozadí menu. Pokud se trhají jen ostatní hráči a FPS je v pořádku, jde o síť nebo server: `/api/status` ukazuje vytížení serveru (`load.lateMs` nad zhruba 50 ms znamená, že server nestíhá).

**Nastavení** (tlačítko Nastavení v hubu a v menu zápasu): Ovládání (přemapování všech kláves: pohyb, schopnosti, ultimátka, taktická akce, skóre, vypnutí zvuku; obsazená klávesa se prohodí, šipky fungují vždy), Grafika (kvalita, rozlišení vykreslování 50–100 %, záře, množství částic, otřesy kamery, záblesky obrazovky), Rozhraní (čísla poškození, jména nad postavami, oddálení kamery, počítadlo FPS, **barvy týmů**) a Zvuk. Barvy týmů mají tři palety: modrá a růžová (výchozí), modrá a oranžová (pro protanopii a deuteranopii) a tyrkysová a červená (pro tritanopii). Paleta platí hned pro postavy, základny, sloupy, body Ovládnutí, relikvie Únosu, minimapu, skóre, záznam, chat i lobby. Ukládá se v prohlížeči a kromě kvality platí hned.

**Výcvik** (tlačítko Výcvik na kartě Hrát, novým hráčům se nabídne sám): sedm kroků na mapě Neonové jádro bez serveru, takže jde i offline. Pohyb ke zlatému kruhu, útok na cvičný dron, všechny tři schopnosti, ultimátka, taktická akce, léčení na základně a sebrání relikvie. Hra každý krok sleduje a sama pokračuje, výcvik jde kdykoli ukončit. Hráč s účtem dostane za první dokončení 300 kreditů a implantát. Na konci výcviku je tlačítko **První zápas s boty**: rovnou spustí Arénu na Neonovém jádru s lehkými boty.

**Hrát hned** (velké tlačítko nahoře na přihlašovací obrazovce): cesta do hry bez registrace, hlavně pro hráče z odkazů a herních portálů.
- Hráč hraje jako host. Přezdívka se vezme z políčka, nebo z minula, nebo se vymyslí (třeba `Pilot4821`).
- Kdo v tomhle prohlížeči ještě nedokončil výcvik, jde do výcviku. Po něm hraje první zápas s boty.
- Kdo výcvik už má, jde rovnou do Arény s lehkými boty, bez čekání v místnosti.
- Kdo přišel přes pozvánku (`?room=ABCD`), tomu tlačítko nabídne „Připojit se do místnosti ABCD“ a pošle ho rovnou tam.
- Do hubu se dostane kdykoli přes menu zápasu. Přihlášení a založení účtu zůstávají pod tlačítkem jako dřív.

**Postup hosta:** host za online zápasy získává zkušenosti, kredity a implantáty stejně jako hráč s účtem a po registraci mu zůstanou.
- Prohlížeč hosta si vytvoří náhodný klíč (`gk`, 24 znaků) a posílá ho jen našemu serveru. Klíč nikoho neidentifikuje a v prohlížeči je uložený jako ostatní nastavení.
- Server pro každý klíč drží profil hosta (`doc.guests`). Po každém zápase do něj připíše odměny stejnou funkcí jako u účtu (`rewardsFor`).
- Hostovy implantáty se v zápasech nepoužívají: host hraje se základním hrdinou. Sestava se mu odemkne až s účtem, což je další důvod se registrovat.
- Profil hosta vydrží 7 dní od posledního zápasu (`GUEST_DAYS` v `data.js`). Server jich drží nejvýš 400; když je jich víc, nejdřív zmizí ten, kdo nejdéle nehrál. Databáze tak neroste donekonečna.
- Po zápase host vidí, co získal, a pole „Tvůj postup hosta“ (úroveň, kredity, implantáty, zápasy) s tlačítkem **Založit účet**. Stejné pole má i nahoře na kartě Hrát.
- Při založení účtu se profil hosta stane profilem nového účtu, dostane nové jméno a id a ze seznamu hostů zmizí. Hráč uvidí hlášku, že všechno, co získal jako host, je v účtu. Přihlášení do existujícího účtu postup hosta nepřebírá.
- Hodnocená hra a kampaň jsou dál jen pro účty. Zápasy kratší než 45 s nic nedávají, stejně jako u účtu.
- Ověřuje to test: odměny hosta a jejich souhrn, neplatný klíč nic nedrží, druhý zápas se přičte, registrace převezme kredity, úroveň i implantáty, stejný klíč podruhé nic nepřevezme, bez klíče vznikne běžný nový účet.

**Střelnice** (tlačítko Střelnice na kartě Hrát, vedle Výcviku): cvičiště bez serveru, takže jde i offline.
- Hráč s účtem tu hraje se svou sestavou zvoleného povolání (implantáty, strom, profese, mistrovství), host se základním hrdinou.
- Na mapě Neonové jádro stojí tři terče a čtvrtý obíhá v kruhu. Terče nevrací úder a nedají se zničit, hrdina nemůže padnout.
- Panel ukazuje DPS za posledních 5 s, celkové poškození, největší zásah a čas.
- Tlačítka: Vynulovat, Bez čekání (schopnosti bez čekání a s plnou energií), Nabít ultimátku a Konec.
- Na mobilu je panel zmenšený nad ovládáním.

**Sezónní průkaz** (karta Průkaz, zdarma pro každý účet): běží po kalendářních měsících stejně jako hodnocená sezóna a má 30 stupňů po 500 bodech. Body dávají zkušenosti z každého zápasu, denní cíl (+100), všechny tři denní cíle (+150 navíc) a týdenní cíl (+400). Odměny: kredity, implantáty (stupeň 25 legendární), titul „Průkopník sezóny“ na stupni 10, na stupni 15 exkluzivní neonový vzhled pro povolání podle volby a na stupni 30 zbylé neonové vzhledy, 1000 kreditů a titul „Šampion sezóny“. Neonové vzhledy jinde získat nejde. Nevyzvednuté odměny se po konci sezóny vyplatí samy.

**Úspěchy** (karta Úspěchy, jen s účtem): 31 úspěchů v pěti oblastech (boj, kooperace, postup, hodnocená hra, společnost), každý ve třech stupních bronz, stříbro a zlato. Stupně platí 150, 500 a 1500 kreditů, zlato navíc dává titul. Mezi novějšími jsou:
- Nezastavitelný: série 3, 5 a 8 zničení bez pádu;
- Smršť: dvojité, trojité a čtyřnásobné zničení;
- Poslední stojící: 3, 15 a 50 výher v Eliminaci;
- Mutant: 3, 15 a 50 výher v Mutaci týdne;
- Věrnost: 1, 4 a 12 dokončených sedmidenních řad denních odměn. Postup se čte z profilu (zápasy, výhry, zničení, MVP, relikvie, poškození, léčení, bossové, vlny, kampaň, úroveň, vzhledy, tituly, prodeje na tržišti, hodnocené zápasy a nejvyšší divize, přátelé, úroveň klanu). Odemčené stupně se ukážou na konci zápasu, odměny se vyzvedávají jednotlivě nebo najednou. Body úspěchů jsou v žebříčku.

**Zvuk a hudba:** všechno se syntetizuje přímo v prohlížeči (Web Audio), bez zvukových souborů. Efekty mají vlastní zvuk podle povolání a typu útoku (střely, seky, schopnosti, ultimátky, taktické akce), zásahy rozlišují, jestli zasahuješ ty, nebo jsi zasažen, dál výbuchy, výboje, smrti, varování bossů, relikvie, obsazené body, vlny, kořist podle vzácnosti, srdeční tep při nízkém zdraví a znělky na konci zápasu. Efekty jsou vrstvené (šum, basový úder, filtrované tóny, společný dozvuk), bez ostrých výšek. Zvuky ve světě slábnou se vzdáleností, vzdálené mají víc prostoru a jsou ve stereu podle strany. Hudba je generovaná ve třech stylech: Ambient (temný filmový, výchozí), Synthwave a Puls (temná elektronika), nebo vypnutá. Je klidná v menu, v zápase přidá basu a rytmus a u bossů ztemní a zrychlí; volba „Hudba i během zápasu“ ji v zápase vypne. Hlasitost (celkem, efekty, hudba), styl hudby a úplné vypnutí zvuku se nastavují tlačítkem Zvuk v hubu nebo v menu zápasu (Esc), klávesa M zvuk vypne a zapne.

Hosté můžou hrát online bez účtu, jen se jim nic neukládá. Když server neběží (třeba v náhledu jako statická stránka), jde hrát trénink proti botům ve všech režimech.

## Nasazení na internet

Návod krok za krokem pro Render a databázi Neon (obojí zdarma, bez instalace gitu) je v [DEPLOY.md](DEPLOY.md).

**Rychlé načítání:** server posílá soubory hry komprimované (brotli, nebo gzip pro starší prohlížeče) a s ETagem.
- Kód hry má asi 750 KB a stáhne se z něj asi 220 KB.
- Při další návštěvě se prohlížeč jen zeptá, jestli se něco změnilo, a dostane prázdnou odpověď 304: místo půl megabajtu se přenesou asi 3 KB.
- Nová verze po nasazení se projeví hned, protože prohlížeč se ptá při každém otevření (`Cache-Control: no-cache`).
- Komprimuje se jednou po startu serveru mimo hlavní vlákno, takže běžící zápasy to nezpomalí. Výsledek zůstává v paměti, dokud se soubor nezmění.
- Ověřuje to test: brotli i gzip vrací přesně původní soubor, 304 při stejném ETagu, obrázky beze změny, český i anglický náhled `index.html`, změna souboru se projeví.

**Žádné cizí servery:** three.js (0.160.0) a písma Chakra Petch a Saira Condensed jsou balíčky z npm (`three`, `@fontsource/*`, přesné verze v `package.json`) a posílá je náš server na adrese `/vendor/…`. Hra tedy nestahuje nic z unpkg ani z Google Fonts.
- Nevypadne, když CDN nefunguje nebo je zablokovaná (školní sítě, herní portály s přísnými pravidly).
- Adresa hráče nejde žádné třetí straně.
- Verze je v adrese (`/vendor/three@0.160.0/…`), takže prohlížeč si tyto soubory drží rok a znovu je nestahuje.
- `/vendor/fonts.css` server poskládá při startu z použitých řezů písma. Každý řez se stáhne jen pro znaky, které stránka opravdu použije (latinka a čeština).
- Server pustí ven jen soubory `.js`, `.css`, `.woff2` a `.woff` z těchto tří balíčků, nic jiného z `node_modules`.
- Soubory, které potřebuje prohlížeč, jsou přibalené přímo ve složce `public/vendor`: three.js (`build/three.module.js` a použité doplňky s tím, co importují) a písma jen pro latinku a češtinu (12 souborů woff2 a `fonts.css`). Server je posílá odtud a z `node_modules` jen tehdy, když tam chybí. Hra se tak načte, i když se na serveru nenainstalovaly balíčky nebo se nenahrál nový `server.js`. Kopii vytváří skript (`vendor.mjs` ve scratchpadu): po změně verze three.js se musí spustit znovu.
- **Pojistka proti černé obrazovce:** když se kód hry do 15 s nespustí, `index.html` místo černé obrazovky ukáže hlášku „Hru se nepodařilo načíst“ s tlačítkem Obnovit. Hláška vypíše chybu z prohlížeče a sama zkontroluje, které soubory hry server nemá („Na serveru chybí: share.js“). Když se hra na pomalém připojení nakonec spustí, hláška zmizí.

## Propagace

**Náhled odkazu:** `index.html` má značky Open Graph a Twitter Card. Discord, Facebook, Messenger, X a další z nich při sdílení vykreslí obrázek `public/og.png` (1200 × 630, neonová aréna s relikvií a výzvou „Hraj zdarma v prohlížeči“) s názvem a popisem. Tyhle služby chtějí plnou adresu obrázku. Server proto v `index.html` nahradí `%ORIGIN%` adresou webu: vezme proměnnou prostředí `PUBLIC_URL` (třeba `https://relikvie.onrender.com`, jen když se má použít jiná adresa), jinak adresu, na kterou přišel požadavek (na Renderu s https). Obrázek se dá kdykoli vyměnit za jiný se stejným názvem a rozměry (anglická varianta je `public/og-en.png`, viz Anglická verze níže). Po změně si Discord a Facebook drží starý náhled ještě nějakou dobu v mezipaměti.

**Počítadlo hráčů** (Moderace → Návštěvnost, vidí ho jen nicky z `ADMIN_NICKS`): tabulka posledních 14 dní a počet lidí online právě teď. Pro každý den ukazuje:
- **Návštěvy:** různí návštěvníci za den.
- **Noví a vracející se:** noví jsou tu poprvé, vracející se tu byli už dřív. Podíl vracejících se je nejdůležitější číslo: ukazuje, jestli se lidem hra líbí.
- **S účtem a mobil:** kolik návštěvníků bylo přihlášených a kolik hrálo na dotykovém zařízení.
- **Zápasy:** počet online zápasů a jejich rozdělení podle režimů.
- **Hráči v zápasech:** součet lidí (bez botů) ve všech zápasech dne.
- **Max online:** nejvíc lidí připojených najednou.
- **Sdílení:** kolikrát hráči sdíleli kartu s výsledkem zápasu.
- **Odkud přišli** (řádek pod tabulkou, součet za 14 dní): podle zdroje návštěvy, největší první. Zdroj se určí takto:
  - `?src=` na konci adresy, když je v ní;
  - jinak název webu, ze kterého hráč klikl (třeba `discord.com` nebo `reddit.com`; jen název, nikdy celá adresa);
  - jinak „pozvánka“ (odkaz do místnosti) nebo „aplikace“ (nainstalovaná hra);
  - ostatní jsou „přímo“. Karty sdílené ze hry mají v odkazu `?src=share` a v přehledu se ukážou jako „sdílená karta“.

  **Při propagaci dávej do každého odkazu vlastní `?src=`**, třeba `https://…/?src=reddit`, `?src=itchio`, `?src=discord` nebo `?src=tiktok` (s angličtinou `?lang=en&src=reddit`). Po pár dnech uvidíš, odkud chodí nejvíc hráčů. Zdroj smí mít 1–20 malých písmen, číslic nebo pomlček. Za den se ukládá nejvýš 40 různých zdrojů, zbytek se sečte jako „jiné“.

Jak to funguje (`stats.js`):
- Prohlížeč jednou denně pošle `POST /api/hello`. Uloží si jen datum poslední návštěvy, podle kterého pozná „nový“ nebo „vracející se“; žádné ID ani cookie.
- Server rozliší návštěvníky v rámci dne podle otisku adresy a názvu prohlížeče smíchaného s náhodnou solí. Sůl je jen v paměti a každý den se vymění, takže nikoho nejde sledovat mezi dny a do dat se neukládá nic, co by šlo spojit s člověkem.
- Ukládají se jen souhrnná čísla za den (`doc.stats.days`, posledních 90 dní) ve stejné databázi jako účty.
- Na jednu adresu se započítá nejvýš 6 hlášení za hodinu. Trénink bez serveru a trailerový režim se nepočítají.
- Ověřuje to test (návštěvy, noví a vracející se, zápas, max online, přístup jen pro správce, žádné identifikátory v datech).

**Telefon na šířku** (`@media (max-height:520px)` pro `body.touch` v `index.html`, `phoneZoom` v `client.js`): obrazovka telefonu otočeného na šířku je nízká, proto má vlastní rozvržení.
- Kamera je o 22 % dál, aby se boj kolem hrdiny vešel.
- Zdraví a energie jsou v malém panelu vlevo nahoře vedle minimapy (72 px), už ne přes půl obrazovky.
- Menší je skóre, ukazatel bosse, tlačítka schopností (44 px), Útok, joystick, jména nad hrdiny a tlačítka Ping, Zprávy a pauza. Údaj o pingu se na telefonu skrývá.
- Velké nápisy (vlna, ultimátky, relikvie) jsou menší a v horní části obrazovky, ne přes hrdiny. Stejně tak hláška po pádu.
- Počítač, tablet a telefon na výšku zůstávají beze změny. Ověřeno v emulaci telefonu 740 × 360 v režimu Vlny.

**Pozvi kamaráda** (`REFERRAL` v `data.js`, `payReferral` v `meta.js`, panel nahoře na kartě Přátelé): každý hráč s účtem má vlastní odkaz `https://…/?ref=<id účtu>&src=pozvi`.
- Prohlížeč, který přijde přes odkaz, si kód pamatuje 30 dní. Když v něm vznikne účet, server si uloží, kdo pozval, a novému hráči hra ukáže „Pozval tě …“.
- Když pozvaný poprvé dosáhne 5. úrovně, dostanou oba 500 kreditů a vzácný implantát (označený „Pozvánka“). Zvoucí dostane odměnu nejvýš za 10 kamarádů, pozvaný vždy.
- Host, který už 5. úroveň má, dostane bonus hned při registraci (postup hosta se přenáší).
- Na kartě Přátelé je odkaz s tlačítky Kopírovat odkaz a Sdílet (na mobilu nabídka sdílení) a počítadlo: kolik lidí se přes odkaz zaregistrovalo, kolik odměn už přišlo a jména posledních. Po zápase, ve kterém pozvaný dosáhne 5. úrovně, uvidí řádek „Bonus za pozvání“.
- V počítadle návštěv se tyto návštěvy ukážou jako zdroj „pozvi“. Neplatný nebo neexistující kód se ignoruje a sám sebe pozvat nejde.
- Test (11 kontrol): registrace přes odkaz, bonus pro oba na 5. úrovni, jen jednou, označený implantát, limit 10, neplatné kódy, host s úrovní 5, vlastní počítadlo nového účtu.

**Vibrace** (`buzz` v `client.js`, přepínač Nastavení → Rozhraní → Vibrace, výchozí zapnuto): na dotykovém zařízení telefon krátce zavibruje.
- Silný zásah (40 a víc): 25 ms, nejvýš jednou za 250 ms, aby série zásahů byla jedna vibrace.
- Vlastní pád: delší vzor (90–50–140 ms).
- Zničení soupeře: 35 ms.
- Nabitá ultimátka: dvojité ťuknutí.
- Výhra: pět pulzů.
- Na počítači se nevibruje nikdy. Prohlížeče na iPhonu vibrace nepodporují, tam se nic nestane. Ověřeno v mobilní emulaci se záznamem vibrací (zásahy, pády, ultimátka), vypínač je zastaví.

**Sdílení výsledku** (tlačítko „Sdílet výsledek“ na obrazovce po zápase, `public/share.js`): hra nakreslí kartu 1200 × 630 (JPEG, asi 100 KB) s výsledkem, režimem a mapou, jménem hráče, hrdinou, čtyřmi čísly (zničení nebo zničení NPC, pády, poškození, léčení), odznakem MVP a výzvou „Hraj zdarma v prohlížeči“ s adresou webu.
- Na mobilu se otevře systémová nabídka sdílení (WhatsApp, Messenger, Discord…) s obrázkem a textem typu „Vítězství · Modří 20 : 14 Rudí · Neonové jádro · 12 zničení · MVP. Zkus mě porazit: https://…“.
- Kde sdílet soubory nejde (většina počítačů), obrázek se uloží a text s odkazem se zkopíruje do schránky.
- V angličtině je karta i text anglicky a odkaz vede na `?lang=en`.
- Nic se nikam nenahrává, všechno se kreslí v prohlížeči. Tlačítko se nezobrazí, když hráč v zápase nebyl (sledování).

**Trailerový režim** pro natáčení videí: otevři hru s `?trailer` na konci adresy (třeba `https://…/?trailer`). Hra pustí zápas botů na těžkou obtížnost bez jakéhokoli rozhraní (žádné menu, HUD, jména ani čísla poškození) a kamera střihá mezi záběry jako ve filmu: sledování hrdiny tam, kde se bojuje (vybere toho, kolem kterého je nejvíc dalších), nízký dramatický oblet a celkový pohled na arénu. Záběr trvá 5–8 s, a když sledovaný hrdina padne, střihne se hned. Po konci zápasu začne další na další mapě (citadela, jádro, observatoř, kovárna, archiv).
- `?trailer&map=citadel` drží jednu arénu, `&mode=control` přepne na Ovládnutí.
- Klávesy: **mezerník** další záběr, **N** další aréna, **P** pauza, **Esc** zpět do normální hry.
- Nápověda se ukáže na 6 s a zmizí. Zvuk je v trailerovém režimu vypnutý (jako u zápasu za menu), hudbu nebo komentář přidáš ve střihu.
- Nahrávat jde bez dalších programů přes Herní panel Windows (Win+G, nebo Win+Alt+R pro start a stop nahrávání), případně v OBS. Na video se hodí okno prohlížeče přes celou obrazovku (F11).

**Anglická verze:** hra má češtinu i angličtinu.
- Kdo má prohlížeč v češtině nebo slovenštině, dostane češtinu, všichni ostatní angličtinu. Volba se pamatuje a jde změnit v Nastavení → Rozhraní → Jazyk · Language (stránka se obnoví).
- Odkaz s `?lang=en` (třeba `https://…/?lang=en`) otevře hru anglicky a uloží to. Server pro takový odkaz pošle anglický náhled: anglický titulek a popis a obrázek `public/og-en.png` („Play free in your browser“). Do zahraničních komunit tedy sdílej adresu s `?lang=en`, do českých bez ní. `?lang=cs` vrátí češtinu.
- Jak to funguje (`public/i18n.js`): čeština zůstává ve zdrojovém kódu a překlad se dělá až na stránce. Modul sleduje stránku (MutationObserver) a každý text, který se objeví, přepíše podle slovníku `public/lang-en.js` (český text → anglický, asi 2 300 položek). Texty s čísly nebo jmény jsou šablony s `{}` („Kolo {}“ → „Round {}“) a doplněná slova se přeloží také. Složené texty (oddělené „ · “, „ + “, dvojtečkou apod.) se překládají po částech, malé počáteční písmeno a tečka na konci se dohledají. Česká verze slovník vůbec nestahuje.
- Chat, nahlášené zprávy a novinky (changelog) jsou v prvcích s `translate="no"` a nepřekládají se: zprávy hráčů zůstávají, jak je napsali, a novinky jsou česky (v angličtině je u nich poznámka). Název hry „Relikvie Aréna“ zůstává česky jako značka.
- Nový text ve hře: když ho do slovníku nepřidáš, ukáže se anglickým hráčům česky. Přidáš ho do `public/lang-en.js` jako `"český text":"English text"`, čísla a jména nahraď `{}`. Pořadí částí se dá v angličtině změnit přes `{0}`, `{1}`.

## Struktura

- `server.js` — HTTP server, API účtů, místnosti, smyčka 30 Hz, posílání snapshotů, odměny po zápase
- `meta.js` — účty, profily, inventář, strom, obchod, tržiště, přátelé, klany, výpočet odměn
- `db.js` — úložiště (Postgres nebo soubor)
- `public/data.js` — herní data: povolání, stromy, předměty, vzhledy, mapy, režimy, NPC a bossové
- `public/sim.js` — simulace hry. Používá ji server i klient pro trénink bez serveru.
- `public/models.js` — 3D modely postav, NPC, bossů a prostředí map
- `public/client.js` — vykreslování, efekty, interpolace, predikce pohybu, lobby
- `public/hub.js` — přihlášení a hub: postava, inventář, dovednosti, tržiště, obchod, přátelé, klan, žebříček
- `public/social.js` — chat, pozvánky a stav přátel přes vlastní WebSocket spojení hubu
- `public/sw.js`, `public/manifest.webmanifest`, `public/icon-*.png` — instalovatelná aplikace: service worker, manifest a ikony
- `public/settings.js` — nastavení hráče (klávesy, grafika, rozhraní) a jeho obrazovka
- `public/audio.js` — syntetizované zvukové efekty, generovaná hudba a nastavení hlasitosti
- `public/i18n.js`, `public/lang-en.js` — volba jazyka a překlad stránky do angličtiny (slovník český text → anglický)

## Síťový model a bezpečnost

- Server simuluje 30× za sekundu a každému hráči posílá vlastní snapshot 15× za sekundu (proměnná prostředí `SNAP_EVERY`, výchozí 2 = každý druhý krok). Události mezi snapshoty se nasbírají a pošlou s dalším. Neviditelné soupeře a cizí kořist v něm nevidíš.
- Spojení je komprimované (permessage-deflate), jeden hráč tak potřebuje kolem 16 kB/s místo dřívějších 30 kB/s.
- Ostatní jednotky se interpolují podle času serveru, ne podle okamžiku, kdy zpráva dorazila. Klient průběžně odhaduje posun hodin a kolísání sítě a podle něj volí zpoždění vykreslování (90–320 ms). Výkyvy sítě se tak neprojeví jako cukání. V náhledu sítě je vidět ping i výkyvy. Vlastní pohyb klient předpovídá a srovnává se serverem.
- Návrat po výpadku: každý hráč dostane v místnosti náhodný klíč pro návrat (jen pro sebe). S ním se nové spojení vrátí na původní místo; staré, napůl mrtvé spojení server zavře, aniž by místo uvolnil. Bez klíče se do cizího místa dostat nejde.
- Automatická kvalita: když hra běží pod 30 snímků za sekundu déle než 6 s, sníží se rozlišení vykreslování.
- `/api/status` ukazuje i zatížení serveru: `load.tickMs` (průměrný čas výpočtu kroku), `load.lateMs` (zpoždění smyčky) a `load.snapHz`. Když server nestíhá, zapíše do logu varování „Server nestíhá…“.
- O zásazích, kořisti, odměnách, cenách a pravidlech stromu rozhoduje jen server. Sestavu během zápasu měnit nejde.
- Kompenzace pingu: ke každému vstupu klient přidá čas světa, který právě vidí. Server si pamatuje polohy jednotek za posledních 0,4 s a základní útoky, střely a Rozpolcení vyhodnocuje proti poloze cíle v okamžiku, kdy na něj hráč mířil. Mířit dopředu tak není potřeba. Kompenzuje se nejvýš 300 ms, při horším spojení zbytek zpoždění zůstává.
- Chat: server text čistí (řídicí a neviditelné znaky, délka), omezuje rychlost a doručuje podle blokování. Týmové zprávy dostane jen vlastní tým. Příliš velká zpráva jen zavře spojení odesílatele.
- Hesla se ukládají jako otisk scrypt se solí, přihlášení drží náhodný token (v databázi jen jeho hash). Přihlašování a API mají omezení počtu pokusů.
