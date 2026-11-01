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
| `MATCH_SECONDS` | `360` | Délka zápasu v sekundách. Hodí se pro testování. |

## Co ve hře je

**Režimy**
- **Aréna** — 3 proti 3, body za zničení a relikvii ve středu, vyhrává 20.
- **Ovládnutí** — 3 proti 3 o body A, B, C. Držený bod přidává skóre, vyhrává 100.
- **Souboj** — 1 proti 1, vyhrává, kdo první pětkrát zničí soupeře.
- **Lov bosse** — kooperace až 4 hráčů (zbytek doplní boti) proti jednomu z deseti bossů. Tým má společné životy.
- **Vlny** — kooperace proti vlnám dronů, drtičů a hlídačů. Každá pátá vlna je boss, cílem je přežít 15 vln.
- **Nekonečno** — vlny bez konce, každá pátá s náhodným bossem. Od vlny 10 přibude každých 10 vln modifikátor (odolní, krvácení, zuřiví, slabší léčení). Odměny rostou s vlnou, vlna 10 se počítá jako výhra a rekord je v žebříčku.

**Kampaň relikvií** (jen s účtem): 12 misí ve dvou aktech, od průzkumu dronů přes Omegu až po Archona. Mise se odemykají postupně podle úrovně, první dokončení dává velkou odměnu a titul, Omega navíc relikviový vzhled. Opakované výhry dávají střepy bosse, za 20 střepů se vyrábí legendární implantát. Týdenní cíl kampaně je 5 výher. Po poražení Omegy se otevře **Ozvěna jádra**, týdenní výzva s bossem a dvěma modifikátory (odolní nepřátelé, krvavá ozvěna…). Mise jdou hrát s boty nebo až se třemi přáteli.

**Taktické akce** (klávesa T, pro všechna povolání, volí se v Postavě): Úhyb (skok a krátká nezranitelnost), Dekontaminace (odstraní mor nanitů, krvácení, zpomalení a umlčení, 4 s ochrana), Nouzové přebití (+45 energie), Signální maják (soupeři v oblasti dostávají o 25 % víc a nemůžou se maskovat) a Polní bariéra (štít 22 % HP). Odemykají se na úrovních 1–12, boti je používají taky.

**Denní a týdenní cíle:** každý den tři náhodné cíle (jeden lze vyměnit) a bonus za splnění všech tří, každý týden jeden větší cíl s epickým implantátem.

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

**Mapy:** Neonové jádro, Rezavá kovárna (lávové kanály pálí), Ledový archiv (hustý les sloupů), Rudá svatyně (aréna pro bosse). Každá má vlastní vzhled, oblohu, sloupy a částice.

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
- Vzhledy: čtyři pro každé povolání. Jeden se odemkne na úrovni 5, jeden se kupuje a relikviový padá jen z bossů.
- Žebříček hráčů.

**Hra s lidmi:** Rychlá hra tě přidá do otevřené místnosti zvoleného režimu, nebo založí novou, která se sama spustí do 20 s (zbytek doplní boti). Místnost můžeš založit jako veřejnou, pak ji ostatní vidí v seznamu veřejných místností. Soukromá funguje dál přes kód.

**Hodnocená hra:** Souboj 1 proti 1 nebo Aréna 3 proti 3 o hodnocení Elo (start 1000, prvních 10 umisťovacích zápasů mění hodnocení rychleji). Hledání páruje hráče s podobným hodnocením a týmy rozdělí vyrovnaně podle součtu hodnocení, chybějící místa doplní boti. Zápas se hodnotí, jen když na každé straně hraje aspoň jeden hráč s účtem, takže proti botům se hodnocení nahnat nedá. Kdo odejde před koncem, prohrává. Divize: Bronz, Stříbro (1100), Zlato (1250), Platina (1400), Diamant (1550), Neon (1700). Sezóna trvá kalendářní měsíc: na jejím konci dostaneš odměnu podle nejlepší dosažené divize (kredity, od Zlata implantát, od Diamantu titul) a nová sezóna začne s polovičním odstupem od 1000. Žebříček ukazuje pořadí aktuální sezóny.

Hosté můžou hrát online bez účtu, jen se jim nic neukládá. Když server neběží (třeba v náhledu jako statická stránka), jde hrát trénink proti botům ve všech režimech.

## Nasazení na internet

Návod krok za krokem pro Render a databázi Neon (obojí zdarma, bez instalace gitu) je v [DEPLOY.md](DEPLOY.md).

## Struktura

- `server.js` — HTTP server, API účtů, místnosti, smyčka 30 Hz, posílání snapshotů, odměny po zápase
- `meta.js` — účty, profily, inventář, strom, obchod, tržiště, výpočet odměn
- `db.js` — úložiště (Postgres nebo soubor)
- `public/data.js` — herní data: povolání, stromy, předměty, vzhledy, mapy, režimy, NPC a bossové
- `public/sim.js` — simulace hry. Používá ji server i klient pro trénink bez serveru.
- `public/models.js` — 3D modely postav, NPC, bossů a prostředí map
- `public/client.js` — vykreslování, efekty, interpolace, predikce pohybu, lobby
- `public/hub.js` — přihlášení a hub: postava, inventář, dovednosti, tržiště, obchod, žebříček

## Síťový model a bezpečnost

- Server simuluje 30× za sekundu a každému hráči posílá vlastní snapshot. Neviditelné soupeře a cizí kořist v něm nevidíš.
- Ostatní jednotky se vykreslují se zpožděním 100 ms a interpolují se. Vlastní pohyb klient předpovídá a srovnává se serverem.
- O zásazích, kořisti, odměnách, cenách a pravidlech stromu rozhoduje jen server. Sestavu během zápasu měnit nejde.
- Kompenzace pingu: ke každému vstupu klient přidá čas světa, který právě vidí. Server si pamatuje polohy jednotek za posledních 0,4 s a základní útoky, střely a Rozpolcení vyhodnocuje proti poloze cíle v okamžiku, kdy na něj hráč mířil. Mířit dopředu tak není potřeba. Kompenzuje se nejvýš 300 ms, při horším spojení zbytek zpoždění zůstává.
- Hesla se ukládají jako otisk scrypt se solí, přihlášení drží náhodný token (v databázi jen jeho hash). Přihlašování a API mají omezení počtu pokusů.
