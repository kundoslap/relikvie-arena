// "Sdílet výsledek" on the end screen: draws a 1200×630 card (result, mode and map, your hero and numbers, a link to
// the game) and hands it to the phone's share sheet. Where sharing files is not possible (most desktops) the card is
// saved as a JPEG and the text with the link goes to the clipboard. Nothing is uploaded anywhere.
import {CLASSES} from './data.js';
import {t,isEn} from './i18n.js';

const W=1200,H=630;
const FONT_D='"Saira Condensed","Arial Narrow",sans-serif',FONT_B='"Chakra Petch",Arial,sans-serif';

// o: {title, sub, win:true|false|null, name, cls, pve, mvp, st:{ki,de,dm,he,nk}}
export function drawCard(o){
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#04060c');bg.addColorStop(1,'#101a3a');g.fillStyle=bg;g.fillRect(0,0,W,H);
  // perspective grid floor, as on the link preview
  g.strokeStyle='rgba(63,184,255,.22)';g.lineWidth=1.5;const hz=380;
  for(let i=-14;i<=14;i++){g.beginPath();g.moveTo(600+i*18,hz);g.lineTo(600+i*140,H);g.stroke()}
  for(let k=0;k<10;k++){const y=hz+Math.pow(k/9,2)*(H-hz);g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  const hero=CLASSES[o.cls]||CLASSES.striker,col=hero.css||'#3fb8ff';
  // hero glow on the right
  const rg=g.createRadialGradient(930,300,10,930,300,260);rg.addColorStop(0,col+'aa');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(600,0,600,H);
  const glow=(c,b)=>{g.shadowColor=c;g.shadowBlur=b};
  // the relic diamond above the hero
  g.save();glow('#ffc66d',30);g.fillStyle='#ffe2a0';g.beginPath();g.moveTo(930,120);g.lineTo(975,190);g.lineTo(930,260);g.lineTo(885,190);g.closePath();g.fill();g.restore();
  g.save();glow(col,26);g.strokeStyle=col;g.lineWidth=6;g.beginPath();g.ellipse(930,420,170,46,0,0,Math.PI*2);g.stroke();g.restore();
  g.textBaseline='alphabetic';
  // result
  g.font=`800 26px ${FONT_D}`;g.fillStyle='#ffc66d';g.fillText('◇ RELIKVIE · ARÉNA',60,74);
  g.save();g.font=`800 118px ${FONT_D}`;const tc=o.win===true?'#ffc66d':o.win===false?'#ff3f8e':'#eef4ff';glow(tc,28);g.fillStyle=tc;
  g.fillText(fit(g,String(o.title).toUpperCase(),620),56,196);g.restore();
  g.font=`500 30px ${FONT_B}`;g.fillStyle='#9fb2ff';g.fillText(fit(g,o.sub,640),60,244);
  // you
  g.font=`600 40px ${FONT_D}`;g.fillStyle='#eef4ff';g.fillText(fit(g,o.name,520),60,318);
  // the hero's name under its ring on the right
  g.save();g.font=`800 64px ${FONT_D}`;g.textAlign='center';glow(col,24);g.fillStyle=col;g.fillText(t(hero.name).toUpperCase(),930,530);g.restore();
  if(o.mvp){g.save();g.font=`800 28px ${FONT_D}`;const tx=t('MVP zápasu').toUpperCase(),w=g.measureText(tx).width+36;
    g.fillStyle='#ffc66d';round(g,60,338,w,44,6);g.fill();g.fillStyle='#1a1206';g.fillText(tx,78,370);g.restore()}
  // numbers
  const cells=o.pve?[[o.st.nk,'Zničení NPC'],[o.st.de,'Pády'],[o.st.dm,'Poškození'],[o.st.he,'Léčení']]:[[o.st.ki,'Zničení'],[o.st.de,'Pády'],[o.st.dm,'Poškození'],[o.st.he,'Léčení']];
  cells.forEach(([v,l],i)=>{const x=60+i*140,y=o.mvp?400:356;
    g.fillStyle='rgba(10,14,28,.75)';round(g,x,y,128,104,6);g.fill();g.strokeStyle='rgba(159,178,255,.25)';g.lineWidth=1.5;g.stroke();
    g.font=`800 44px ${FONT_D}`;g.fillStyle='#eef4ff';g.fillText(fit(g,num(v),110),x+12,y+54);
    g.font=`500 17px ${FONT_B}`;g.fillStyle='#9fb2ff';g.fillText(fit(g,t(l),110),x+12,y+86)});
  // call to action
  g.fillStyle='#ffc66d';round(g,60,548,420,52,26);g.fill();
  g.font=`800 24px ${FONT_D}`;g.fillStyle='#1a1206';g.fillText(fit(g,t('Hraj zdarma v prohlížeči').toUpperCase(),380),84,582);
  g.font=`500 22px ${FONT_B}`;g.fillStyle='#9fb2ff';g.fillText(location.host,504,582);
  return cv;
}
function fit(g,s,max){s=String(s??'');if(g.measureText(s).width<=max)return s;while(s.length>1&&g.measureText(s+'…').width>max)s=s.slice(0,-1);return s+'…'}
function round(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const num=v=>Math.round(+v||0).toLocaleString(isEn?'en-US':'cs-CZ');

// src=share lets the player counter tell how many visits came from shared cards
export const shareUrl=()=>location.origin+(isEn?'/?lang=en&src=share':'/?src=share');
export function shareText(o){
  const main=o.pve?`${num(o.st.nk)} ${t('zničení NPC')}`:`${num(o.st.ki)} ${t('zničení')}`;
  return `${o.title} · ${o.sub} · ${main}${o.mvp?' · MVP':''}. ${t('Zkus mě porazit:')}`;
}
const counted=()=>{try{fetch('/api/shared',{method:'POST'}).catch(()=>{})}catch{}};
// 'shared' (share sheet used), 'saved' (PNG downloaded, text copied), 'cancel'
export async function shareResult(o){
  await document.fonts?.ready;
  const cv=drawCard(o),blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.9));
  const text=shareText(o),url=shareUrl();
  const file=new File([blob],'relikvie-arena.jpg',{type:'image/jpeg'});
  if(navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],text:text+' '+url,title:'Relikvie Aréna'});counted();return'shared'}
    catch(e){if(e?.name==='AbortError')return'cancel'}
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relikvie-arena.jpg';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
  try{await navigator.clipboard.writeText(text+' '+url)}catch{}
  counted();return'saved';
}
