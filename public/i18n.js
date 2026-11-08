// Language: Czech is the source language of the game; English comes from lang-en.js, a map from the Czech text to the
// English one. Instead of wrapping every string in the code, the page is translated where it is shown: a
// MutationObserver rewrites text nodes and a few attributes as soon as they appear. Keys with {} are templates for
// texts with numbers or names inside ("Kolo {}" → "Round {}"); what fills a {} is translated too when it is known.
// Text that players write (chat) sits in translate="no" and stays as it is.
const KEY='rel.lang';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};

function detect(){
  const q=new URLSearchParams(location.search).get('lang');
  if(q==='en'||q==='cs'){write(q);return q}
  const s=read();if(s==='en'||s==='cs')return s;
  const langs=navigator.languages?.length?navigator.languages:[navigator.language||'cs'];
  return langs.some(l=>/^(cs|sk)\b/i.test(l))?'cs':'en';
}
export const lang=detect();
export const isEn=lang==='en';
export function setLang(l){if(l===lang)return;write(l);
  const u=new URL(location.href);u.searchParams.delete('lang');location.replace(u.href)}

const exact=new Map(),templates=[],cache=new Map();
const LETTERS=/[A-Za-zÀ-ž]{2}/,CZ=/[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g;
const norm=s=>s.replace(/\s+/g,' ').trim();
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const nph=s=>(s.match(/\{\d?\}/g)||[]).length;
// English values use {} in order, or {0} {1}… when the order of the parts changes
function fill(en,caps){let i=0;return en.replace(/\{(\d?)\}/g,(_,d)=>{const v=caps[d===''?i++:+d];return v??''})}
function addTpl(cz,en){
  const parts=cz.split('{}'),lit=parts.join('');
  const nl=(lit.match(/[A-Za-zÀ-ž]/g)||[]).length;
  if(nl<1||nl<2&&lit.trim().length<2)return;
  const need=parts.reduce((a,b)=>b.trim().length>a.length?b.trim():a,'');
  templates.push({re:new RegExp('^'+parts.map(escRe).join('(.*?)')+'$','s'),en,need,len:lit.length});
}
if(isEn){
  const dict=(await import('./lang-en.js')).default,seg=new Map();
  for(let [cz,en] of Object.entries(dict)){
    if(!cz.includes('{}')){exact.set(cz,en);if(cz.startsWith('· ')&&en.startsWith('· ')&&!exact.has(cz.slice(2)))exact.set(cz.slice(2),en.slice(2));continue}
    // {}{} next to each other cannot be split reliably, so they count as one part when the English keeps them together
    const c2=cz.replace(/(\{\}){2,}/g,'{}'),e2=en.replace(/(\{\}){2,}/g,'{}');
    if(c2!==cz&&!/\{\d\}/.test(en)&&nph(c2)===nph(e2)){cz=c2;en=e2}
    addTpl(cz,en);
    // the same text when the part before it is a separate element: "{} · nejvíc najednou {}" also as "nejvíc najednou {}"
    let c=cz,e=en;
    if(c.startsWith('{}')&&e.startsWith('{}')&&!/\{\d\}/.test(e)){c=c.slice(2).trimStart();e=e.slice(2).trimStart();addTpl(c,e)}
    if(c.startsWith('· ')&&e.startsWith('· '))addTpl(c.slice(2),e.slice(2));
    if(cz.endsWith('{}')&&en.endsWith('{}')&&!/\{\d\}/.test(en))addTpl(cz.slice(0,-2).trimEnd(),en.slice(0,-2).trimEnd());
    // pieces between the parts, for when a part is an element of its own ("Krystal: <b>…</b> · zasadíš ho…")
    if(!/\{\d\}/.test(en)){const cs=cz.split('{}'),es=en.split('{}');
      // only when the English keeps the same layout (no part moved to the other side of a {}), e.g. not "před {} min" → "{} min ago"
      const has=s=>/[A-Za-zÀ-ž]/.test(s);
      if(cs.length===es.length&&cs.every((p,i)=>has(p)===has(es[i])))cs.forEach((p,i)=>{const a=p.trim(),b=es[i].trim();if((a.match(/[A-Za-zÀ-ž]/g)||[]).length>=4&&LETTERS.test(b)&&!exact.has(a))seg.set(a,b)})}
  }
  for(const [a,b] of seg)if(!exact.has(a))exact.set(a,b);
  templates.sort((a,b)=>b.len-a.len);
  document.documentElement.lang='en';
}
const up=s=>s.charAt(0).toUpperCase()+s.slice(1),low=s=>s.charAt(0).toLowerCase()+s.slice(1);
// a known text, also without its final full stop and with a small first letter ("vzácný" from "Vzácný")
function ex(s){
  let r=exact.get(s);if(r!=null)return r;
  if(s.endsWith('.')){r=exact.get(s.slice(0,-1));if(r!=null)return r+'.'}else{r=exact.get(s+'.');if(r!=null)return r.replace(/\.$/,'')}
  const f=s.charAt(0);if(f!==f.toUpperCase()){r=exact.get(up(s))??exact.get(up(s)+'.');if(r!=null)return low(s.endsWith('.')||!exact.has(up(s)+'.')?r:r.replace(/\.$/,''))}
  return null;
}
// numbers and marks around a known text: "Vlna 5" → "Wave 5", "(Obrana)" → "(Defense)"
const EDGE=/^([\s\d+\-−×.,:/%()#★◆◇·„“"]*)(.*?)([\s\d+\-−×.,:/%()#★◆◇·!?…„“"]*)$/s;
function core(s){const m=EDGE.exec(s);if(!m||!m[2]||m[2]===s)return null;const t=ex(m[2]);return t==null?null:m[1]+t+m[3]}
const SEPS=[' · ',' — ',' – ',' + ',' / ','\n',': ',', '];
function pieces(s,d){
  for(const sep of SEPS){if(!s.includes(sep))continue;
    let changed=false;
    const out=s.split(sep).map(p=>{const v=p.trim();if(!v||!LETTERS.test(v))return p;const t=tx(v,d+1);if(t==null||t===v)return p;changed=true;return p.replace(v,t)});
    return changed?out.join(sep):null}
  return null;
}
function matchTpl(s,d){
  for(const T of templates){
    if(T.need&&!s.includes(T.need))continue;
    const m=T.re.exec(s);if(!m)continue;
    return fill(T.en,m.slice(1).map(c=>{const v=c.trim();if(!v||!LETTERS.test(v))return c;const t=tx(v,d+1);return t==null?c:c.replace(v,t)}));
  }
  return null;
}
const left=s=>(s.match(CZ)||[]).length;
function tx(s,d){
  if(!LETTERS.test(s))return null;
  const r=ex(s)??core(s);if(r!=null)return r;
  if(d>3)return null;
  const a=matchTpl(s,d),b=pieces(s,d);
  if(a==null)return b;if(b==null)return a;
  return left(b)<left(a)?b:a;
}
// the English text for a Czech one, or null when it is not known
export function tr(s){
  if(!isEn||!s)return null;
  const e=exact.get(s);if(e!=null)return e;
  if(cache.has(s))return cache.get(s);
  const r=tx(s,0);
  if(cache.size>4000)cache.clear();
  cache.set(s,r);return r;
}
// for code that builds text outside the page (dialogs): always returns a string
export const t=s=>{if(!isEn||s==null)return s;const v=String(s);if(!LETTERS.test(v))return v;
  return v.split('\n').map(l=>{const n=norm(l);if(!n)return l;return tr(n)??l}).join('\n')};

// ---------- the page ----------
const ATTRS=['title','placeholder','aria-label','alt'];
const done=new WeakMap();
const skip=el=>{for(let e=el;e;e=e.parentElement){const n=e.nodeName;if(n==='SCRIPT'||n==='STYLE'||n==='TEXTAREA')return true;if(e.getAttribute?.('translate')==='no')return true}return false};
function text(node){
  const v=node.nodeValue;if(!v||!LETTERS.test(v)||done.get(node)===v)return;
  if(skip(node.parentElement))return;
  const n=norm(v),r=tr(n);
  if(r==null||r===n){done.set(node,v);return}
  const out=v.match(/^\s*/)[0]+r+v.match(/\s*$/)[0];done.set(node,out);node.nodeValue=out;
}
function attr(el,a){const v=el.getAttribute(a);if(!v||!LETTERS.test(v))return;const r=tr(norm(v));if(r!=null&&r!==v)el.setAttribute(a,r)}
function walk(root){
  if(root.nodeType===3){text(root);return}
  if(root.nodeType!==1)return;
  if(skip(root))return;
  for(const a of ATTRS)if(root.hasAttribute(a))attr(root,a);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:n=>
    n.nodeType===1&&(NOGO.has(n.nodeName)||n.getAttribute('translate')==='no')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  for(let n=w.nextNode();n;n=w.nextNode()){
    if(n.nodeType===3){const v=n.nodeValue;if(v&&LETTERS.test(v)&&done.get(n)!==v)text(n)}
    else for(const a of ATTRS)if(n.hasAttribute(a))attr(n,a);
  }
}
const NOGO=new Set(['SCRIPT','STYLE','TEXTAREA']);
if(isEn){
  const start=()=>{
    walk(document.documentElement);
    new MutationObserver(recs=>{for(const r of recs){
      if(r.type==='characterData')text(r.target);
      else if(r.type==='attributes')attr(r.target,r.attributeName);
      else for(const n of r.addedNodes)walk(n);
    }}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  };
  if(document.body)start();else addEventListener('DOMContentLoaded',start,{once:true});
  for(const f of ['alert','confirm','prompt']){const o=window[f].bind(window);window[f]=(m,...a)=>o(t(m),...a)}
}
