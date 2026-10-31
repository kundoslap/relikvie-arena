# Nasazení Relikvie Arény na internet (Render)

Server poběží zdarma na Renderu. Kód se tam dostane přes GitHub. Git ani jiné programy instalovat nemusíš, všechno se dělá v prohlížeči.

Celé to zabere zhruba 15 minut.

## 1. Účet na GitHubu

1. Otevři https://github.com/signup a založ si účet. Pokud ho máš, přihlas se.

## 2. Repozitář s kódem

1. Otevři https://github.com/new.
2. **Repository name:** `relikvie-arena`.
3. Zvol **Private** (kód uvidíš jen ty) nebo **Public**. Render umí obojí.
4. Nic dalšího nezaškrtávej a klikni na **Create repository**.
5. Na stránce prázdného repozitáře klikni na odkaz **uploading an existing file**.
6. Ve Windows otevři složku `Downloads\relikvie-arena\nahrat-na-github`. Je to čistá kopie projektu bez složek `node_modules` a `data` (ta obsahuje lokální účty z tvého počítače a na GitHub nepatří).
7. Stiskni **Ctrl+A** a všechno přetáhni do okna prohlížeče:
   - `public` (složka se nahraje i s obsahem)
   - `server.js`, `db.js`, `meta.js`, `package.json`, `package-lock.json`
   - `render.yaml`, `Dockerfile`, `.dockerignore`, `.gitignore`
   - `README.md`, `DEPLOY.md`

   Soubory začínající tečkou Windows někdy skrývá. Bez nich to bude fungovat taky.

   Pokud složka `nahrat-na-github` chybí nebo je stará, nahraj obsah `relikvie-online` kromě složek `node_modules` a `data`.
8. Počkej, až se nahraje všechno, a dole klikni na **Commit changes**.
9. Zkontroluj, že v repozitáři vidíš složku `public` a v ní `client.js`, `data.js`, `hub.js`, `index.html`, `models.js` a `sim.js`.

## 3. Databáze pro účty (Neon, zdarma)

Render na plánu zdarma při každém restartu nebo uspání smaže soubory na disku. Účty, inventáře a tržiště proto musí ležet v databázi.

1. Otevři https://neon.tech a založ si účet (jde to přes GitHub).
2. Vytvoř projekt, třeba `relikvie`. Jako region zvol **Frankfurt (AWS eu-central-1)**, ať je databáze blízko serveru.
3. Na úvodní stránce projektu klikni na **Connect** a zkopíruj **Connection string**. Vypadá jako `postgresql://uzivatel:heslo@ep-....eu-central-1.aws.neon.tech/neondb?sslmode=require`.
4. Ten řetězec je heslo k databázi. Neposílej ho nikomu a nevkládej ho do souborů na GitHubu. Použiješ ho jen v dalším kroku v Renderu.

Tabulku si server založí sám při prvním spuštění.

## 4. Účet na Renderu

1. Otevři https://dashboard.render.com/register.
2. Zvol **GitHub** a přihlas se svým GitHub účtem. Render se tak propojí s tvými repozitáři.

## 5. Spuštění serveru

1. V Renderu klikni vpravo nahoře na **New +** a zvol **Blueprint**.
2. Vyber repozitář `relikvie-arena`. Pokud ho nevidíš, klikni na **Configure GitHub** a povol Renderu přístup k tomuto repozitáři.
3. Render najde soubor `render.yaml` a ukáže službu `relikvie-arena` (Node, plán Free).
4. Render se zeptá na hodnotu **DATABASE_URL**. Vlož connection string z Neonu.
5. Klikni na **Apply** (nebo **Deploy Blueprint**).
6. Otevři službu a sleduj záložku **Logs**. Asi po 2–3 minutách se objeví řádky `Úložiště: Postgres` a `Relikvie Aréna běží na http://localhost:10000` a stav se změní na **Live**.

Pokud v logu místo toho stojí `Úložiště: soubor data/db.json`, DATABASE_URL chybí. Doplň ho v **Environment** u služby a dej **Save Changes**.

Platební kartu plán Free nevyžaduje. Kdyby ji Render chtěl, zkontroluj, že je u služby vybrané **Free**.

## 6. Hraní

1. Nahoře na stránce služby je adresa typu `https://relikvie-arena-xxxx.onrender.com`. Otevři ji.
2. Založ si účet (Nový účet). Na Renderu je to nový server, účty z tvého počítače se nepřenášejí.
3. Na záložce Hrát dej **Rychlá hra**, nebo **Založit místnost**. Veřejné místnosti uvidí ostatní v seznamu.
4. U vlastní místnosti klikni na **Kopírovat pozvánku** a pošli odkaz kamarádům. Po otevření se jim kód místnosti vyplní sám.

## Kontrola po nasazení

- `https://tvoje-adresa.onrender.com/healthz` musí vrátit `ok`.
- `https://tvoje-adresa.onrender.com/api/status` musí ukázat `"storage":"Postgres"`. Když tam je `soubor data/db.json`, chybí DATABASE_URL a účty by se po restartu ztratily.
- Založ účet, odehraj krátký zápas s boty, v Renderu dej **Manual Deploy → Restart service** a přihlas se znovu. Když účet a odměny zůstaly, databáze funguje.

## Už máš službu z dřívějška

Stačí aktualizace: v repozitáři na GitHubu **Add file → Upload files**, přetáhni obsah složky `nahrat-na-github` (stejné soubory se přepíšou) a dej **Commit changes**. Render novou verzi nasadí sám. Staré účty zůstanou a nové věci se jim doplní automaticky.

Funguje to v počítači i v mobilu.

## Co je dobré vědět

- **Uspávání:** služba zdarma se po 15 minutách bez návštěvy uspí. První otevření pak trvá asi minutu, než se server probudí. Během hraní se neuspí.
- **Restart ruší zápasy, ne účty:** místnosti a rozehrané zápasy jsou jen v paměti serveru, takže po uspání nebo nové verzi skončí. Účty, inventáře, stromy a tržiště zůstávají v databázi Neon.
- **Aktualizace:** když na GitHub nahraješ změněné soubory (v repozitáři **Add file → Upload files**, přetáhnout a **Commit changes**), Render novou verzi nasadí sám během pár minut.
- **Ping:** `render.yaml` zakládá službu v datacentru ve Frankfurtu, nejblíž hráčům z Česka. Region se později změnit nedá. Kdybys chtěl jiný, uprav ho v `render.yaml` dřív, než Blueprint spustíš.

## Android aplikace

Aplikace Relikvie je WebView, které načte adresu uloženou jako `GAME_URL`. Když v ní tuto adresu nahradíš adresou z Renderu a aplikaci znovu sestavíš, aréna poběží i v ní.

## Jiný hosting

- **Railway, Fly.io, Koyeb nebo vlastní server:** použij přiložený `Dockerfile`. Server čte port z proměnné `PORT`, kontrola stavu je na `/healthz`.
- **Hosting musí podporovat WebSockety.** Statické hostingy jako GitHub Pages nebo Netlify nestačí, protože hra potřebuje běžící server.
