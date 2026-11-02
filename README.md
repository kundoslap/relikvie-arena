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
- **Mutace týdne** — 3 proti 3 podle pravidel Arény (body za zničení, relikvie ve středu, vyhrává 20) na mapách Neonové jádro, Rezavá kovárna, Ledový archiv a Hvězdná observatoř. Platí v ní dvě mutace, které se mění každé pondělí (podle čísla týdne, pro všechny stejně). Možné mutace:
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
- **Vlny** — kooperace proti vlnám dronů, drtičů a hlídačů. Každá pátá vlna je boss, cílem je přežít 15 vln.
- **Nekonečno** — vlny bez konce, každá pátá s náhodným bossem. Od vlny 10 přibude každých 10 vln modifikátor (odolní, krvácení, zuřiví, slabší léčení). Odměny rostou s vlnou, vlna 10 se počítá jako výhra a rekord je v žebříčku.

**Kampaň relikvií** (jen s účtem): 12 misí ve dvou aktech, od průzkumu dronů přes Omegu až po Archona. Mise se odemykají postupně podle úrovně, první dokončení dává velkou odměnu a titul, Omega navíc relikviový vzhled. Opakované výhry dávají střepy bosse, za 20 střepů se vyrábí legendární implantát. Týdenní cíl kampaně je 5 výher. Po poražení Omegy se otevře **Ozvěna jádra**, týdenní výzva s bossem a dvěma modifikátory (odolní nepřátelé, krvavá ozvěna…). Mise jdou hrát s boty nebo až se třemi přáteli.

**Povolání:** Lovec (nápor a přesnost), Strážce (výdrž a obrana), Technik (energie a obnova) a **Žhář** (oheň a kontrola prostoru). Žhář střílí žhavé projektily, které zapalují (hoření 6 HP/s), má Plamennou vlnu (kužel ohně do 6 m s hořením), Žhnoucí půdu (hořící oblast 3,5 m na 4 s), Fázový plamen (přesun o 7 m, za sebou nechá oheň) a ultimátku Inferno (tři výbuchy ohně kolem sebe do 7 m). Jeho relikvie zdvojnásobí hoření a zvětší ohnivé oblasti. Hoření odstraní Dekontaminace a Obnova. Strom má větve Výheň, Popel a Inferno, vzhledy Uhlíková maska, Modrý plamen, relikviový a neonový z průkazu. V soubojích botů 1 na 1 vychází Žhář zhruba na 50 % výher.

**Sledování zápasů přátel:** když přítel hraje (kromě hodnocené hry), v seznamu přátel je tlačítko Sledovat. Divák vidí zápas živě pohledem sledovaného hráče (jeho zdraví, schopnosti, mlhu války i týmové pingy), klávesami Q/E nebo šipkami v liště přepíná mezi hrdiny a na konci uvidí výsledek. Divák nemůže hrát ani pingovat, nepočítá se mezi hráče a místnost jich unese nejvýš 8. Sledovat můžou jen přihlášení přátelé.

**Série a vícenásobná zničení** (PvP):
- Kdo zničí soupeře dvakrát a víckrát, pokaždé do 4 s od předchozího, dostane hlášku Dvojité, Trojité, Čtyřnásobné zničení.
- Série zničení bez vlastního pádu: Série (3), Řádění (5), Nezastavitelný (8), Legenda arény (12).
- Kdo ukončí sérii aspoň 3 zničení, ukáže se „ukončil sérii“.
- Hlášky vidí všichni v záznamu vpravo nahoře, ten, kdo je získal, navíc banner a stoupající zvuk.
- Nejdelší série a nejvíc zničení naráz jsou ve Statistikách a na profilu hráče (počítá se jen PvP).

**Rozbor smrti:** když tvůj hrdina padne, pod nápisem Zničen se ukáže, kdo tě za posledních 10 s jak zasáhl:
- kdo tě dorazil a kolik životů mu zbylo;
- až pět útočníků s povoláním (u bosse „boss“) a součtem poškození;
- pruh rozdělený na přímé zásahy, ultimátku a poškození v čase;
- poškození od prostředí (láva, kruh Eliminace, cizí základna).

Rozbor dostane jen padlý hráč (případně divák, který ho sleduje), ostatním se neposílá. Zmizí po oživení, v Eliminaci po 9 s.

**Pingy a rychlé zprávy:** klávesa G položí ping tam, kam míříš: „Sem“, a když míříš na soupeře, „Útok na…“ (značka ho sleduje); Alt+G je varování „Pozor“. Ping vidí jen tvůj tým, v aréně i na minimapě, se zvukem. Klávesa V otevře rychlé zprávy (1–7: Útok!, Ustupte!, Potřebuju pomoc!, Bráním!, Díky!, Dobrá hra!, Haha!), které se ukážou bublinou nad hlavou všem. Ve stejném kolečku jsou **emoty** (fialové): 8 Pozdrav (mávání), 9 Tanec (otočky s poskoky) a 0 Oslava (ruce nahoru). Hrdinu vidí animovat všichni hráči i diváci, s fialovou bublinou nad hlavou. Emote skončí po 2–3 s, nebo jakmile se hrdina pohne či zaútočí. Padlý hrdina emote poslat nemůže a emoty sdílí omezení rychlosti se zprávami. Boti v týmu na pingy reagují: jdou na označené místo, útočí na označeného soupeře a z varování ustoupí. Na mobilu jsou tlačítka Ping a Zprávy, klávesy jdou přemapovat v Nastavení. Nejvýš 6 signálů za 8 s.

**Taktické akce** (klávesa T, pro všechna povolání, volí se v Postavě): Úhyb (skok a krátká nezranitelnost), Dekontaminace (odstraní mor nanitů, krvácení, zpomalení a umlčení, 4 s ochrana), Nouzové přebití (+45 energie), Signální maják (soupeři v oblasti dostávají o 25 % víc a nemůžou se maskovat) a Polní bariéra (štít 22 % HP). Odemykají se na úrovních 1–12, boti je používají taky.

**Denní a týdenní cíle:** každý den tři náhodné cíle (jeden lze vyměnit) a bonus za splnění všech tří, každý týden jeden větší cíl s epickým implantátem.

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

**Mapy:** Neonové jádro, Rezavá kovárna (lávové kanály pálí), Ledový archiv (hustý les sloupů), **Hvězdná observatoř** (kruh obelisků a dva páry teleportních bran), Rudá svatyně (aréna pro bosse), Pevnost relikvií (bludiště jen pro Únos relikvie). Boti hledají cestu po navigační mřížce, takže obejdou i dlouhé zdi. Každá má vlastní vzhled, oblohu, sloupy a částice.

**Hvězdná observatoř** se hraje v Aréně, Ovládnutí, Eliminaci, Lovu bosse, Vlnách i Nekonečnu:
- Dva páry teleportních bran propojují protilehlé rohy mapy: azurový pár severozápad–jihovýchod, růžový pár jihozápad–severovýchod.
- Kdo do brány vstoupí, vyjde z její dvojice 2,6 m dál ve směru, kterým šel; kdo stál, vyjde směrem ke středu. Pak 3 s žádnou bránu použít nemůže.
- Bránou projdou hrdinové, boti i drony a drtiči z vln, bossové ne. Přeskok má záblesk na obou koncích a vlastní zvuk.
- Maskovaný soupeř se teleportem neprozradí.
- Brány jsou vidět i na minimapě a hra skok ukáže jako skok, ne jako sklouznutí přes mapu.

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
- Žebříček hráčů.

**Hra s lidmi:** Rychlá hra tě přidá do otevřené místnosti zvoleného režimu, nebo založí novou, která se sama spustí do 20 s (zbytek doplní boti). Během odpočtu všichni v místnosti **hlasují o mapě**: každý má jeden hlas, který může měnit, u map je vidět počet hlasů a pruh podílu. Při startu vyhraje mapa s nejvíc hlasy, při shodě rozhodne los (aktuální mapa má přednost) a bez hlasů zůstane mapa, kterou místnost dostala. Hlasy hráčů, kteří odešli, se nepočítají. Po zápase se hlasuje znovu o další mapě. Hodnocená hra a režimy s jedinou mapou (Únos relikvie) hlasování nemají. Místnost můžeš založit jako veřejnou, pak ji ostatní vidí v seznamu veřejných místností. Soukromá funguje dál přes kód.

**Vlastní pravidla místnosti:** hostitel založené místnosti (ne rychlé ani hodnocené hry a ne mise kampaně) nastaví v lobby kromě režimu, mapy a obtížnosti i pravidla:
- **Cíl** (PvP): kratší, normální, nebo delší, tedy polovina, plný, nebo jeden a půl násobek bodů na výhru. Aréna 10 / 20 / 30, Ovládnutí 50 / 100 / 150, Únos relikvie 2 / 3 / 5, Eliminace 2 / 4 / 6 kol, Souboj 3 / 5 / 8.
- **Délka** (PvP): dvě třetiny, plná, nebo jeden a půl násobek času. Aréna 4 / 6 / 9 min.
- **Boti:** doplnit volná místa, nebo hrát bez botů. Bez botů musí mít v PvP každý tým aspoň jednoho hráče, takže jde hrát třeba 1 proti 2. Kdo se připojí do běžícího zápasu, obsadí volné místo v menším týmu; v Eliminaci nastoupí až v dalším kole.

PvP zápas s jiným než normálním cílem nebo délkou je **vlastní zápas** (samotné vypnutí botů ne): odměny (zkušenosti, kredity, implantáty, krystaly) se násobí poměrem skutečné délky zápasu ke 4 minutám a výhra se do denních, týdenních a klanových cílů počítá, jen když zápas trval aspoň 2,4 minuty. Zkrácenými zápasy proti botům se tedy odměny nafarmit nedají. Veřejné místnosti s vlastními pravidly mají v seznamu štítek „vlastní pravidla“ a v zápase je u skóre vidět skutečný cíl.

**Návrat po výpadku spojení:** když hráči během zápasu spadne spojení (přepnutí z Wi-Fi na mobilní data, tunel, zavřený nebo znovu načtený panel), server mu drží místo 60 s a za jeho hrdinu mezitím hraje bot (v seznamu jako „(odpojen)“). Hra se sama připojuje znovu a ukazuje lištu „Spojení přerušeno · obnovuji…“. Po návratu ovládá stejného hrdinu se vším, co v zápase získal. Spojení, ze kterého 5 s nic nepřišlo, hra považuje za přerušené, i když to prohlížeč ještě nehlásí. Funguje to i po znovunačtení stránky (klíč pro návrat je jen v daném panelu prohlížeče) a pro hosty. Místo zanikne, když hráč odejde z menu, spustí jinou hru, dostane blokaci, nebo zápas skončí. Kdo se do konce zápasu nevrátí, dostane odměny do účtu stejně, v hodnocené hře se ale počítá jako odchod (prohra). Délku držení mění proměnná prostředí `REJOIN_SECONDS`.

**Hodnocená hra:** Souboj 1 proti 1 nebo Aréna 3 proti 3 o hodnocení Elo (start 1000, prvních 10 umisťovacích zápasů mění hodnocení rychleji). Hledání páruje hráče s podobným hodnocením a týmy rozdělí vyrovnaně podle součtu hodnocení, chybějící místa doplní boti. Zápas se hodnotí, jen když na každé straně hraje aspoň jeden hráč s účtem, takže proti botům se hodnocení nahnat nedá. Kdo odejde před koncem, prohrává. Divize: Bronz, Stříbro (1100), Zlato (1250), Platina (1400), Diamant (1550), Neon (1700). Sezóna trvá kalendářní měsíc: na jejím konci dostaneš odměnu podle nejlepší dosažené divize (kredity, od Zlata implantát, od Diamantu titul) a nová sezóna začne s polovičním odstupem od 1000. Žebříček ukazuje pořadí aktuální sezóny.

**Přátelé a chat** (přátelé jen s účtem): na kartě Přátelé pošleš žádost podle přezdívky, nebo klikneš na jméno hráče v chatu. U přátel vidíš, jestli jsou online, v místnosti nebo ve hře a v jakém režimu, a do otevřené místnosti se k nim připojíš jedním tlačítkem. V lobby můžeš online přátele pozvat, pozvánka se jim ukáže s tlačítkem Připojit. Chat má záložky Svět (všichni přihlášení), Místnost a soukromé zprávy přátelům. V zápase otevře chat Enter: v PvP píšeš týmu, Tab přepne na všechny, Esc zavře (na mobilu tlačítko Chat). Hráče jde zablokovat, pak od něj nevidíš zprávy, žádosti ani pozvánky. Filtr sprostých slov je zapnutý a jde vypnout. Zprávy mají nejvýš 200 znaků a omezení rychlosti; historie chatu se drží jen v paměti serveru, přátelé a blokování se ukládají do účtu.

**Nedávní spoluhráči** (karta Přátelé, jen s účtem): posledních 20 hráčů s účtem, se kterými jsi dohrál zápas (místnost, rychlá hra, hodnocená hra i kampaň s přáteli). U každého je vidět, jestli byl spoluhráč, nebo soupeř, režim a před kolika minutami, hodinami nebo dny se hrálo, úroveň a povolání. Jméno otevře profil, dál jde poslat žádost o přátelství (nebo přijmout čekající) a nahlásit. Hosté bez účtu se do seznamu nedostanou a zablokovaný hráč z něj zmizí. Seznam se ukládá do účtu a aktualizuje se živě po konci zápasu.

**Profil hráče:** kliknutím na jméno hráče v žebříčku, v seznamu přátel, v místnosti nebo v chatu (tlačítko Profil) se otevře jeho karta. Ukazuje klan, titul, úroveň, povolání, datum založení účtu, počet zápasů a výher, zničení, MVP, body úspěchů a hodiny ve hře. Dál divizi a hodnocení v aktuální sezóně a nejlepší dosaženou divizi, rekordy (bossové, vlny, Nekonečno), čtyři nejhranější povolání a režimy s úspěšností a posledních šest zápasů. Přihlášený hráč odtud může poslat žádost o přátelství nebo soukromou zprávu, nahlásit, nebo zablokovat. Profil vidí i hosté. Karta ukazuje jen herní údaje, nikdy inventář, kredity, cíle ani seznam přátel (`/api/player?id=` nebo `?nick=`).

**Klany** (karta Klan, jen s účtem): klan založíš od úrovně 5 za 1000 kreditů (název, zkratka 2–4 znaky, popis, otevřený vstup nebo na žádost). Do klanu se vstupuje pozvánkou, žádostí, nebo rovnou, když je otevřený. Role: vůdce (nastavení, povyšování, předání vedení, rozpuštění), důstojník (zve, schvaluje žádosti, vyhazuje členy) a člen. Každý zápas člena dá klanu třetinu získaných zkušeností; úrovně 1–10 přidávají dvě místa (20 až 38 členů) a všem členům +1 % zkušeností a kreditů za úroveň. Týdenní cíl klanu je společný počet výher (4 na člena, aspoň 15); kdo za klan odehrál tento týden aspoň 3 zápasy, vyzvedne kredity a implantát. Klan má vlastní chat a zkratka se ukazuje u jmen v chatu a v lobby. Žebříček ukazuje nejlepší klany.

**Mistrovství schopností** (karta Mistrovství, z původní Relikvie): každá schopnost povolání, schopnost profese a ultimátka má úroveň 0–20, která roste používáním v zápasech s účtem (1 bod za použití, ultimátka 8, nejvýš 80 bodů na schopnost za zápas; úroveň 20 je asi 1380 použití). Každá úroveň zlevní energii a zkrátí čekání o 0,5 %, u ultimátky zrychlí nabíjení o 1 %. Na úrovních 5, 10, 15 a 20 se odemkne milník se dvěma větvemi (úspora energie / kratší čekání, štít / zrychlení, léčení / vrácení energie, ozvěna bez čekání / levnější další schopnost; ultimátka má vlastní silnější varianty). Větve jde měnit zdarma mimo zápas. V hodnocené hře se počítá nejvýš úroveň 5 a jen první milník, jako kalibrované mistrovství v originále.

**Mistrovství základního útoku (živly):** základní útok má vlastní mistrovství 0–20 (1 bod za 4 zásahy, +0,5 % poškození za úroveň). Úroveň 5 odemkne živel povolání, který působí při každém zásahu: Lovec **krvácení** 4 HP/s, Strážce **jed** 4 HP/s (cíl se navíc léčí o 30 % méně), Technik **elektrický šok** 4 HP/s, Žhář silnější **hoření** 10 HP/s (jeho talent zapaluje slabším ohněm 5 HP/s už od začátku). Milníky: Síla živlu (+50 %) / Trvalost (+2 s), Jiskra (každý 5. zásah přeskočí na dalšího soupeře) / Rozklad (cíle pod tvým živlem dostávají o 6 % víc), Vysátí (léčí 15 % poškození živlu) / Šíření (při pádu cíle živel přeskočí na soupeře do 4 m), Exploze (každý 8. zásah odpálí zbytek živlu) / Dvojí živel (přidá druhý živel). Efekty se nesčítají, nový zásah obnoví trvání. Dekontaminace odstraní všechny, Obnova krvácení a hoření. V hodnocené hře platí úroveň 5, takže živel má každý; vyváženost je ověřená souboji botů na úrovni 0 i 5.

**Dílna a krystaly** (z původní Relikvie: esence, vylepšování, přeladění, zamykání a výroba; zdířky s krystaly jsou nové):
- **Rozložení** implantátu dá esenci (běžný 1, neobvyklý 3, vzácný 8, epický 22, legendární 40 a 3 legendární fragmenty), epické a legendární občas krystal. Vylepšený implantát vrátí polovinu esence za vylepšení, krystaly ze zdířek se vrací do zásoby. Hromadně jde rozložit nevybavené, nezamčené a neupravené implantáty do vzácných včetně.
- **Vylepšení +1 až +5** za kredity a esenci (od úrovní 5, 10, 15, 20, 25), každý stupeň +6 % ke všem vlastnostem implantátu.
- **Přeladění** (od úrovně 10): vybraná vlastnost dostane nabídku náhodné jiné vlastnosti ze slotu a hráč rozhodne, jestli ji vezme, nebo nechá původní.
- **Zdířky**: neobvyklý a vzácný implantát 1, epický 2, legendární 3; otevření stojí kredity a esenci. **Krystaly** Rubín (útok), Smaragd (HP), Safír (TECH), Topas (zkrácení čekání), Onyx (obrana) a Ametyst (nabíjení ultimátky) v pěti stupních; stejný druh jen jednou na implantát, tři stejné se spojí do vyššího stupně, vyjmutí stojí malý poplatek. Padají ze zápasů (častěji po výhře a po bossech, na těžké obtížnosti i stupeň II), z rozkladu a jdou destilovat z esence.
- **Výroba** epického implantátu (150 esence + 300 kreditů) nebo legendárního (30 fragmentů + 1000 kreditů) do zvoleného slotu.
- **Zamčené** implantáty nejde prodat, rozložit ani nabídnout na tržišti. Vylepšení a krystaly se na tržišti prodávají s implantátem.

**Moderace:** hráče jde nahlásit z chatu (klik na jméno) nebo ze seznamu přátel s důvodem (urážky, spam, podvádění, nevhodné jméno, jiné). Server k nahlášení sám přiloží posledních až 15 zpráv hráče (svět, místnost, klan, soukromé zprávy nahlašujícímu). Kdo dostane během hodiny nahlášení od tří různých hráčů, má automaticky na hodinu zákaz chatu, než se na to podívá moderátor. Moderátoři (proměnná `ADMIN_NICKS`) mají kartu Moderace: nevyřízená nahlášení s kontextem, vyhledání hráče, varování, zákaz chatu (1 h, 24 h, 7 dní), zablokování účtu (7 dní, 30 dní, natrvalo) s poznámkou pro hráče, zrušení trestů a záznam všech zásahů. Zablokovaný hráč je okamžitě odpojen a při přihlášení uvidí důvod. Jeden hráč může denně nahlásit nejvýš 10 lidí.

**Aplikace:** hra je instalovatelná (PWA): tlačítko Nainstalovat v hubu (Chrome, Edge, Android), na iPhonu Sdílet → Přidat na plochu. Běží přes celou obrazovku s vlastní ikonou. Service worker bere kód hry vždy nejdřív ze sítě, takže nové verze dorazí hned; bez internetu se hra spustí z uložené kopie a nabídne trénink proti botům. API a WebSocket nikdy nejdou přes mezipaměť.

**Nastavení** (tlačítko Nastavení v hubu a v menu zápasu): Ovládání (přemapování všech kláves: pohyb, schopnosti, ultimátka, taktická akce, skóre, vypnutí zvuku; obsazená klávesa se prohodí, šipky fungují vždy), Grafika (kvalita, rozlišení vykreslování 50–100 %, záře, množství částic, otřesy kamery, záblesky obrazovky), Rozhraní (čísla poškození, jména nad postavami, oddálení kamery, počítadlo FPS) a Zvuk. Ukládá se v prohlížeči a kromě kvality platí hned.

**Výcvik** (tlačítko Výcvik na kartě Hrát, novým hráčům se nabídne sám): sedm kroků na mapě Neonové jádro bez serveru, takže jde i offline. Pohyb ke zlatému kruhu, útok na cvičný dron, všechny tři schopnosti, ultimátka, taktická akce, léčení na základně a sebrání relikvie. Hra každý krok sleduje a sama pokračuje, výcvik jde kdykoli ukončit. Hráč s účtem dostane za první dokončení 300 kreditů a implantát.

**Střelnice** (tlačítko Střelnice na kartě Hrát, vedle Výcviku): cvičiště bez serveru, takže jde i offline.
- Hráč s účtem tu hraje se svou sestavou zvoleného povolání (implantáty, strom, profese, mistrovství), host se základním hrdinou.
- Na mapě Neonové jádro stojí tři terče a čtvrtý obíhá v kruhu. Terče nevrací úder a nedají se zničit, hrdina nemůže padnout.
- Panel ukazuje DPS za posledních 5 s, celkové poškození, největší zásah a čas.
- Tlačítka: Vynulovat, Bez čekání (schopnosti bez čekání a s plnou energií), Nabít ultimátku a Konec.
- Na mobilu je panel zmenšený nad ovládáním.

**Sezónní průkaz** (karta Průkaz, zdarma pro každý účet): běží po kalendářních měsících stejně jako hodnocená sezóna a má 30 stupňů po 500 bodech. Body dávají zkušenosti z každého zápasu, denní cíl (+100), všechny tři denní cíle (+150 navíc) a týdenní cíl (+400). Odměny: kredity, implantáty (stupeň 25 legendární), titul „Průkopník sezóny“ na stupni 10, na stupni 15 exkluzivní neonový vzhled pro povolání podle volby a na stupni 30 zbylé neonové vzhledy, 1000 kreditů a titul „Šampion sezóny“. Neonové vzhledy jinde získat nejde. Nevyzvednuté odměny se po konci sezóny vyplatí samy.

**Úspěchy** (karta Úspěchy, jen s účtem): 26 úspěchů v pěti oblastech (boj, kooperace, postup, hodnocená hra, společnost), každý ve třech stupních bronz, stříbro a zlato. Stupně platí 150, 500 a 1500 kreditů, zlato navíc dává titul. Postup se čte z profilu (zápasy, výhry, zničení, MVP, relikvie, poškození, léčení, bossové, vlny, kampaň, úroveň, vzhledy, tituly, prodeje na tržišti, hodnocené zápasy a nejvyšší divize, přátelé, úroveň klanu). Odemčené stupně se ukážou na konci zápasu, odměny se vyzvedávají jednotlivě nebo najednou. Body úspěchů jsou v žebříčku.

**Zvuk a hudba:** všechno se syntetizuje přímo v prohlížeči (Web Audio), bez zvukových souborů. Efekty mají vlastní zvuk podle povolání a typu útoku (střely, seky, schopnosti, ultimátky, taktické akce), zásahy rozlišují, jestli zasahuješ ty, nebo jsi zasažen, dál výbuchy, výboje, smrti, varování bossů, relikvie, obsazené body, vlny, kořist podle vzácnosti, srdeční tep při nízkém zdraví a znělky na konci zápasu. Efekty jsou vrstvené (šum, basový úder, filtrované tóny, společný dozvuk), bez ostrých výšek. Zvuky ve světě slábnou se vzdáleností, vzdálené mají víc prostoru a jsou ve stereu podle strany. Hudba je generovaná ve třech stylech: Ambient (temný filmový, výchozí), Synthwave a Puls (temná elektronika), nebo vypnutá. Je klidná v menu, v zápase přidá basu a rytmus a u bossů ztemní a zrychlí; volba „Hudba i během zápasu“ ji v zápase vypne. Hlasitost (celkem, efekty, hudba), styl hudby a úplné vypnutí zvuku se nastavují tlačítkem Zvuk v hubu nebo v menu zápasu (Esc), klávesa M zvuk vypne a zapne.

Hosté můžou hrát online bez účtu, jen se jim nic neukládá. Když server neběží (třeba v náhledu jako statická stránka), jde hrát trénink proti botům ve všech režimech.

## Nasazení na internet

Návod krok za krokem pro Render a databázi Neon (obojí zdarma, bez instalace gitu) je v [DEPLOY.md](DEPLOY.md).

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
