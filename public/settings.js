// Player settings: key bindings, graphics, interface. Stored per browser; the client reads them through get() and
// reacts to changes through onChange(). The settings screen is an overlay reachable from the hub and the pause menu.
import * as Snd from './audio.js';

const store={get(k,d){try{const v=localStorage.getItem('rel.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rel.'+k,JSON.stringify(v))}catch{}}};
export const ACTIONS=[['up','Pohyb nahoru'],['down','Pohyb dolů'],['left','Pohyb doleva'],['right','Pohyb doprava'],['q','Schopnost 1'],['e','Schopnost 2'],['r','Schopnost 3'],
  ['ult','Ultimátka'],['tac','Taktická akce'],['ping','Ping (s Alt varování)'],['wheel','Rychlé zprávy'],['score','Skóre (držet)'],['mute','Vypnout zvuk']];
const DEF_KEYS={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',q:'KeyQ',e:'KeyE',r:'KeyR',ult:'KeyF',tac:'KeyT',ping:'KeyG',wheel:'KeyV',score:'Tab',mute:'KeyM'};
const DEF={scale:1,bloom:true,particles:1,shake:true,flash:true,dmgNums:true,names:true,zoom:1,fps:false};
// keys the game keeps for itself: menu, chat, typing
const RESERVED=new Set(['Escape','Enter','NumpadEnter','Backspace','MetaLeft','MetaRight','ContextMenu']);

const S={...DEF,...(store.get('settings',{})||{})};
S.keys={...DEF_KEYS,...(S.keys&&typeof S.keys==='object'?S.keys:{})};
for(const k of Object.keys(S.keys))if(!(k in DEF_KEYS)||typeof S.keys[k]!=='string')delete S.keys[k];
const num=(v,a,b,d)=>Number.isFinite(+v)?Math.max(a,Math.min(b,+v)):d;
S.scale=num(S.scale,.5,1,1);S.particles=num(S.particles,.25,1,1);S.zoom=num(S.zoom,.8,1.3,1);
for(const k of ['bloom','shake','flash','dmgNums','names','fps'])S[k]=typeof S[k]==='boolean'?S[k]:DEF[k];

const subs=new Set();
export const onChange=f=>subs.add(f);
export const get=k=>S[k];
export const key=a=>S.keys[a];
export const quality=()=>store.get('q',matchMedia('(pointer: coarse)').matches?'low':'high');
function save(){store.set('settings',S);for(const f of subs)try{f()}catch(e){console.warn(e)}}
export function set(k,v){S[k]=v;save()}
// binding a key that another action uses swaps the two
export function bind(action,code){
  if(!(action in DEF_KEYS)||RESERVED.has(code))return false;
  const other=Object.keys(S.keys).find(a=>S.keys[a]===code&&a!==action);if(other)S.keys[other]=S.keys[action];
  S.keys[action]=code;save();return true;
}
export function keyLabel(code){
  if(!code)return'—';
  const M={Space:'Mezerník',Tab:'Tab',ShiftLeft:'Shift',ShiftRight:'P. Shift',ControlLeft:'Ctrl',ControlRight:'P. Ctrl',AltLeft:'Alt',AltRight:'AltGr',CapsLock:'Caps',
    ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Backslash:'\\',Comma:',',Period:'.',Slash:'/'};
  if(M[code])return M[code];if(code.startsWith('Key'))return code.slice(3);if(code.startsWith('Digit'))return code.slice(5);if(code.startsWith('Numpad'))return'Num '+code.slice(6);
  return code;
}

// ---------- screen ----------
const $=s=>document.querySelector(s);
let tab='controls',capture=null;
export function open(t){if(t)tab=t;$('#settings').hidden=false;render()}
export function close(){$('#settings').hidden=true;capture=null}
export const isOpen=()=>!$('#settings').hidden;
const tog=(k,label,help='')=>`<label class="setrow"><span>${label}${help?`<small>${help}</small>`:''}</span><input type="checkbox" data-tog="${k}" ${S[k]?'checked':''}></label>`;
const rng=(k,label,min,max,step,fmt,help='')=>`<label class="setrow"><span>${label}${help?`<small>${help}</small>`:''}</span><span class="rng"><input type="range" data-rng="${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}"><b>${fmt(S[k])}</b></span></label>`;
const pct=v=>Math.round(v*100)+' %';
function render(){
  const el=$('#setBody');if(!el)return;
  const tabs=[['controls','Ovládání'],['graphics','Grafika'],['ui','Rozhraní'],['sound','Zvuk']];
  $('#setTabs').innerHTML=tabs.map(([k,n])=>`<button type="button" data-st="${k}" aria-pressed="${k===tab}">${n}</button>`).join('');
  $('#setTabs').querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{tab=b.dataset.st;capture=null;render()});
  if(tab==='controls')el.innerHTML=`<p class="help">Klikni na klávesu a stiskni novou. Když ji už používá jiná akce, prohodí se. Šipky fungují pro pohyb vždy, Esc otevírá menu a Enter chat. Na dotykových zařízeních se klávesy nepoužívají.</p>
    <div class="keys">${ACTIONS.map(([a,n])=>`<div class="setrow"><span>${n}</span><button type="button" class="kb${capture===a?' cap':''}" data-bind="${a}">${capture===a?'Stiskni klávesu…':keyLabel(S.keys[a])}</button></div>`).join('')}</div>
    <div class="btns"><button class="ghost sm" type="button" id="keysReset">Výchozí klávesy</button></div>`;
  if(tab==='graphics'){const q=quality();el.innerHTML=`
    <div class="setrow"><span>Kvalita<small>Stíny, detailnější mapy a víc částic. Projeví se po obnovení stránky.</small></span><div class="seg" id="setQ"><button type="button" data-q="high" aria-pressed="${q==='high'}">Vysoká</button><button type="button" data-q="low" aria-pressed="${q==='low'}">Nízká</button></div></div>
    ${rng('scale','Rozlišení vykreslování',.5,1,.05,pct,'Nižší hodnota pomůže slabším zařízením.')}
    ${tog('bloom','Záře (bloom)','Neonové zářivé efekty. Vypnutí ušetří výkon.')}
    ${rng('particles','Množství částic',.25,1,.25,pct)}
    ${tog('shake','Otřesy kamery','Při výbuších a zásazích.')}
    ${tog('flash','Záblesky obrazovky','Červený záblesk při silném zásahu. Vypni, pokud ti vadí blikání.')}`;
    el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{store.set('q',b.dataset.q);render();toastSet('Kvalita se změní po obnovení stránky.')})}
  if(tab==='ui')el.innerHTML=`${tog('dmgNums','Čísla poškození','Létající čísla poškození nad zasaženými.')}
    ${tog('names','Jména nad postavami')}
    ${rng('zoom','Oddálení kamery',.8,1.3,.05,pct,'Vyšší hodnota ukáže víc z arény.')}
    ${tog('fps','Počítadlo snímků (FPS)')}`;
  if(tab==='sound'){el.innerHTML=Snd.panelHTML();Snd.bindPanel(el)}
  el.querySelectorAll('[data-tog]').forEach(i=>i.onchange=()=>set(i.dataset.tog,i.checked));
  el.querySelectorAll('[data-rng]').forEach(i=>i.oninput=()=>{set(i.dataset.rng,+i.value);i.nextElementSibling.textContent=pct(+i.value)});
  el.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{capture=capture===b.dataset.bind?null:b.dataset.bind;render()});
  $('#keysReset')&&($('#keysReset').onclick=()=>{S.keys={...DEF_KEYS};capture=null;save();render()});
}
function toastSet(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.className='';t.hidden=false;setTimeout(()=>t.hidden=true,3000)}
// while waiting for a key, the next key press is the new binding and goes nowhere else
addEventListener('keydown',e=>{
  if(!isOpen())return;
  if(capture){e.preventDefault();e.stopImmediatePropagation();
    if(e.code==='Escape'){capture=null;render();return}
    if(RESERVED.has(e.code)){toastSet('Tuto klávesu si hra drží pro sebe.');return}
    bind(capture,e.code);capture=null;render();return}
  if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}
},true);
export function setup(){
  $('#setClose').onclick=close;
  $('#setReset').onclick=()=>{Object.assign(S,DEF,{keys:{...DEF_KEYS}});capture=null;save();render()};
  $('#settings').addEventListener('pointerdown',e=>{if(e.target.id==='settings'||e.target.classList.contains('center'))close()});
}
