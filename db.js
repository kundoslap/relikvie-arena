// Persistent storage. The whole game state is one JSON document kept in memory and saved shortly after each change.
// With DATABASE_URL it lives in Postgres (e.g. a free Neon database); otherwise in data/db.json.
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const EMPTY=()=>({users:{},profiles:{},market:{},guilds:{},version:1});

export async function openDB(){
  const store=process.env.DATABASE_URL?await pgStore(process.env.DATABASE_URL):fileStore();
  const doc=Object.assign(EMPTY(),await store.load());
  let timer=null,saving=Promise.resolve();
  const flush=()=>{clearTimeout(timer);timer=null;saving=saving.then(()=>store.save(doc)).catch(e=>console.error('Uložení selhalo:',e.message));return saving};
  return{
    doc,kind:store.kind,
    touch(){if(!timer)timer=setTimeout(flush,1500)},
    flush
  };
}

function fileStore(){
  const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'data'),file=path.join(dir,'db.json');
  return{kind:'soubor data/db.json',
    async load(){try{return JSON.parse(await readFile(file,'utf8'))}catch{return EMPTY()}},
    async save(doc){await mkdir(dir,{recursive:true});const tmp=file+'.tmp';await writeFile(tmp,JSON.stringify(doc));await rename(tmp,file)}};
}

async function pgStore(url){
  const {default:pg}=await import('pg');
  const pool=new pg.Pool({connectionString:url,ssl:/sslmode=disable/.test(url)?false:{rejectUnauthorized:false},max:2,idleTimeoutMillis:30000});
  // Neon suspends an idle database and drops its connections; without this handler the error would crash the server
  pool.on('error',e=>console.error('Databáze odpojila nečinné spojení:',e.message));
  await pool.query('create table if not exists relikvie_state (id int primary key, doc jsonb not null, updated timestamptz default now())');
  return{kind:'Postgres',
    async load(){const r=await pool.query('select doc from relikvie_state where id=1');return r.rows[0]?.doc||EMPTY()},
    async save(doc){await pool.query('insert into relikvie_state (id,doc,updated) values (1,$1,now()) on conflict (id) do update set doc=excluded.doc, updated=now()',[JSON.stringify(doc)])}};
}
