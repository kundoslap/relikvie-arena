// Počítadlo hráčů: anonymous day totals for the moderators' overview (Moderace → Návštěvnost).
// Nothing that identifies a person is stored. Within one day a visitor is told apart by a hash of the address and
// the browser name mixed with a random salt that exists only in memory and is replaced every day, so nobody can be
// followed from one day to the next and the totals cannot be traced back to anyone. The browser only remembers the
// day of its last visit (to say "new" or "returning"); it gets no identifier either.
import {createHash,randomBytes} from 'node:crypto';
import {dayKey} from './public/data.js';

export const STATS_DAYS=90;
const blank=()=>({v:0,nw:0,ret:0,acc:0,mob:0,m:0,hm:0,modes:{},peak:0,src:{},sh:0});
// where a visit came from: the ?src= of a promotion link, the referring site's name, "pozvánka" (room invite) or
// "aplikace" (installed app); nothing for a direct visit. Only short plain names are kept, at most 40 per day.
const SRC_RE=/^[\p{L}\p{N}.-]{1,40}$/u,SRC_MAX=40;

export function createStats(db){
  const doc=db.doc;doc.stats??={days:{}};const days=doc.stats.days;
  let saltDay=dayKey(),salt=randomBytes(16),seen=new Set();
  const prune=()=>{const keys=Object.keys(days).sort();while(keys.length>STATS_DAYS)delete days[keys.shift()]};
  function today(){
    const k=dayKey();
    if(k!==saltDay){saltDay=k;salt=randomBytes(16);seen=new Set();prune()}
    return days[k]??=blank();
  }
  return{
    // a page load: r 0 = first visit in this browser, 1 = it was here on an earlier day; acc = signed in; mob = touch device
    visit(ip,ua,o={}){
      const d=today(),h=createHash('sha256').update(salt).update(String(ip)).update('\n').update(String(ua||'').slice(0,300)).digest('base64').slice(0,18);
      if(seen.has(h))return false;
      if(seen.size>=100000)return false;
      seen.add(h);d.v++;if(o.r===1)d.ret++;else d.nw++;if(o.acc)d.acc++;if(o.mob)d.mob++;
      const s=typeof o.src==='string'?o.src.toLowerCase():'';
      if(s&&SRC_RE.test(s)){d.src??={};const k=Object.hasOwn(d.src,s)||Object.keys(d.src).length<SRC_MAX?s:'jiné';d.src[k]=(d.src[k]||0)+1}
      db.touch();return true;
    },
    // an online match started: its mode and how many people (not bots) play it
    match(mode,humans){const d=today();d.m++;d.hm+=humans;d.modes[mode]=(d.modes[mode]||0)+1;db.touch()},
    // a player shared a match result card (share sheet used or the card saved)
    shared(){const d=today();d.sh=(d.sh||0)+1;db.touch()},
    // the most people connected at once today
    online(n){const d=today();if(n>d.peak){d.peak=n;db.touch()}},
    view(online){today();return{online,days:Object.keys(days).sort().reverse().slice(0,30).map(k=>({day:k,...days[k]}))}}
  };
}
