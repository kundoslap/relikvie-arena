// Sound and music, synthesized with the Web Audio API (no sound files). Effects are layered noise, sub and filtered
// tones with soft transients and a shared room reverb; they fade with distance and pan by side. Music is generative
// in three styles (dark ambient, soft synthwave, dark pulse) that follow the game state, or off.
const store={get(k,d){try{const v=localStorage.getItem('rel.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rel.'+k,JSON.stringify(v))}catch{}}};
export const TRACKS={ambient:'Ambient',synth:'Synthwave',pulse:'Puls',off:'Vypnuto'};
const DEF={master:.8,music:.35,sfx:.6,mute:false,track:'ambient',inMatch:true};
// settings live under a new key, so everyone starts from the calmer defaults of this version
const cfg={...DEF,...(store.get('audio2',{})||{})};
for(const k of ['master','music','sfx'])if(!Number.isFinite(cfg[k])||cfg[k]<0||cfg[k]>1)cfg[k]=DEF[k];
if(!Object.hasOwn(TRACKS,cfg.track))cfg.track=DEF.track;cfg.inMatch=cfg.inMatch!==false;cfg.mute=!!cfg.mute;

let ac=null,out,sfxBus,musBus,uiBus,noise,verb,delay,voices=0;
const last=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);

function init(){
  if(ac)return true;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  try{ac=new AC({latencyHint:'interactive'})}catch{return false}
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=14;comp.ratio.value=3.5;comp.attack.value=.006;comp.release.value=.25;
  out=ac.createGain();out.connect(comp);comp.connect(ac.destination);
  // effects go through a gentle tone shaper: high shelf down and a lowpass, so nothing pierces
  const shelf=ac.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=5000;shelf.gain.value=-6;
  const top=ac.createBiquadFilter();top.type='lowpass';top.frequency.value=10000;top.Q.value=.5;
  sfxBus=ac.createGain();sfxBus.connect(shelf);shelf.connect(top);top.connect(out);
  uiBus=ac.createGain();uiBus.connect(shelf);
  musBus=ac.createGain();musBus.connect(out);
  noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // a generated hall: decaying stereo noise, darker towards the tail
  verb=ac.createConvolver();const len=ac.sampleRate*3,ir=ac.createBuffer(2,len,ac.sampleRate);
  for(let c=0;c<2;c++){const x=ir.getChannelData(c);let lp=0;for(let i=0;i<len;i++){const k=i/len;lp+=(Math.random()*2-1-lp)*(.5-.42*k);x[i]=lp*(1-k)**2.5}}
  verb.buffer=ir;const vg=ac.createGain();vg.gain.value=.5;verb.connect(vg);vg.connect(out);
  delay=ac.createDelay(1.5);delay.delayTime.value=.45;const fb=ac.createGain(),dl=ac.createBiquadFilter(),dg=ac.createGain();fb.gain.value=.35;dl.type='lowpass';dl.frequency.value=1800;dg.gain.value=.3;
  delay.connect(dl);dl.connect(fb);fb.connect(delay);dl.connect(dg);dg.connect(musBus);
  applyVolumes();
  return true;
}
function applyVolumes(){
  if(!ac)return;const t=ac.currentTime,m=cfg.mute?0:cfg.master;
  out.gain.setTargetAtTime(m,t,.03);sfxBus.gain.setTargetAtTime(cfg.sfx*.7,t,.03);uiBus.gain.setTargetAtTime(cfg.sfx*.55,t,.03);musBus.gain.setTargetAtTime(cfg.music*.6,t,.15);
}
function unlock(){if(!init())return;if(ac.state==='suspended'&&!document.hidden)ac.resume().catch(()=>{});startMusic()}
for(const ev of ['pointerdown','keydown','touchend'])addEventListener(ev,unlock,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!ac)return;if(document.hidden)ac.suspend().catch(()=>{});else ac.resume().catch(()=>{})});

// ---------- voice building blocks ----------
function chain(bus,pan=0,vol=1,dur=1,reverb=0){
  if(!ac||ac.state!=='running'||cfg.mute||voices>32)return null;
  const g=ac.createGain(),p=ac.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.gain.value=vol;g.connect(p);p.connect(bus);
  if(reverb){const s=ac.createGain();s.gain.value=reverb;p.connect(s);s.connect(verb)}
  voices++;setTimeout(()=>{voices--;try{p.disconnect()}catch{}},(dur+.5)*1000);
  return{g,p,t:ac.currentTime,vol};
}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
function filt(src,type,f0,f1,dur,t,q=.7){const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);src.connect(f);return f}
// tone: oscillator with pitch glide, optional filter sweep [type,f0,f1,q]
function tone(c,type,f0,f1,dur,peak,a=.004,fl=null,at=0){
  const t=c.t+at,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const n=fl?filt(o,fl[0],fl[1],fl[2],dur,t,fl[3]):o,g=ac.createGain();n.connect(g);g.connect(c.g);env(g,t,a,peak,dur);o.start(t);o.stop(t+a+dur+.05);return o;
}
// noise: filtered white noise with a frequency sweep
function hiss(c,type,f0,f1,dur,peak,a=.003,q=.8,at=0){
  const t=c.t+at,s=ac.createBufferSource();s.buffer=noise;s.loop=true;const f=filt(s,type,f0,f1,dur,t,q),g=ac.createGain();f.connect(g);g.connect(c.g);env(g,t,a,peak,dur);
  s.start(t,Math.random()*1.5);s.stop(t+a+dur+.05);
}
// sub: a sine thump for weight
const sub=(c,f0,f1,dur,peak,at=0)=>tone(c,'sine',f0,f1,dur,peak,.003,null,at);
// bell: inharmonic partials, the higher ones die first
function bell(c,f,dur,peak,at=0){[[1,1],[2.76,.4],[5.4,.18],[8.93,.07]].forEach(([r,a],i)=>tone(c,'sine',f*r,0,dur/(1+i*.8),peak*a,.002,null,at))}
// pad: two detuned saws per note through a slowly opening lowpass
function pad(c,notes,dur,peak,cut=1400,a=.25,at=0){
  const t=c.t+at;for(const f of notes)for(const det of [-8,8]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;
    const fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=.8;fl.frequency.setValueAtTime(cut*.35,t);fl.frequency.linearRampToValueAtTime(cut,t+a+dur*.3);fl.frequency.linearRampToValueAtTime(cut*.4,t+a+dur);
    const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak/notes.length,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dur);
    o.connect(fl);fl.connect(g);g.connect(c.g);o.start(t);o.stop(t+a+dur+.05)}
}
const hz=n=>440*2**((n-69)/12);

// ---------- effects ----------
const L={x:0,z:0,on:false};
export function listener(x,z,on){L.x=x;L.z=z;L.on=on}
function spatial(p,range=42){
  if(!p||p.x==null)return{v:1,pan:0,far:0};
  const dx=p.x-L.x,dz=p.z-L.z,d=Math.hypot(dx,dz);if(d>range)return null;
  const k=1-d/range;return{v:k*k*.85+.15*k,pan:clamp(dx/24,-.8,.8),far:1-k};
}
function gate(key,gap){if(!ac)return false;const t=ac.currentTime;if(t-(last.get(key)||-1)<gap)return false;last.set(key,t);return true}

const SFX={
  // energy rifle: a filtered noise crack falling in pitch, a short muffled body and a sub kick
  shot(c,o){const f=o.f||900;hiss(c,'bandpass',f*2.4,f*.7,.09,.5,.001,2.2);tone(c,'sawtooth',f*.5,f*.22,.07,.16,.002,['lowpass',1600,500]);sub(c,140,60,.08,.35)},
  heavyShot(c,o){const f=o.f||400;hiss(c,'bandpass',f*3,f*.6,.16,.55,.002,1.6);tone(c,'sawtooth',f*.4,f*.15,.14,.2,.003,['lowpass',900,250]);sub(c,95,40,.18,.6)},
  swing(c){hiss(c,'bandpass',500,2200,.15,.35,.03,1.4);hiss(c,'lowpass',900,300,.12,.15,.02)},
  hit(c){sub(c,150,70,.07,.45);hiss(c,'lowpass',1800,500,.06,.35,.001)},
  hitOut(c,o){hiss(c,'bandpass',2600,1400,.035,.45,.001,1.2);sub(c,170,80,.07,.45);if(o.big){sub(c,90,40,.18,.6);hiss(c,'lowpass',1200,200,.15,.3,.002)}},
  hitIn(c){sub(c,110,42,.2,.85);hiss(c,'lowpass',700,150,.18,.55,.002)},
  death(c,o){hiss(c,'lowpass',2200,120,.55,.5,.004,1.2);sub(c,(o.f||460)/5,32,.5,.55);tone(c,'sawtooth',(o.f||460)/4,40,.45,.12,.01,['lowpass',600,150])},
  kill(c){sub(c,130,50,.18,.5);bell(c,1046,.7,.16,.04)},
  // teleport gate: a rising filtered whoosh with a glassy chime on top
  warp(c){hiss(c,'bandpass',400,3200,.35,.4,.02,2.5);tone(c,'sine',220,880,.3,.14,.01);bell(c,1568,.5,.08,.12)},
  died(c){hiss(c,'lowpass',1600,60,1.3,.55,.01);sub(c,80,26,1.3,.8);pad(c,[hz(45),hz(52)],1.2,.18,600,.05)},
  boom(c,o){const s=clamp(o.s||1,.3,3);sub(c,90/Math.sqrt(s)+20,24,.55+.35*s,.95);hiss(c,'lowpass',1800,70,.5+.4*s,.8,.003,.7);hiss(c,'bandpass',900,200,.25,.3,.002,.8)},
  zap(c){const t=c.t,s=ac.createBufferSource();s.buffer=noise;s.loop=true;const f=filt(s,'bandpass',3200,1400,.3,t,5),am=ac.createGain(),g=ac.createGain();
    am.gain.value=0;const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=55;lg.gain.value=.5;l.connect(lg);lg.connect(am.gain);
    f.connect(am);am.connect(g);g.connect(c.g);env(g,t,.005,.5,.3);s.start(t,Math.random());s.stop(t+.4);l.start(t);l.stop(t+.4);sub(c,70,45,.25,.3)},
  bolt(c){for(let i=0;i<3;i++)hiss(c,'bandpass',rnd(1800,3600),700,.05,.45,.001,3,i*.04);sub(c,80,40,.15,.3)},
  cast(c,o){const f=o.f||420;hiss(c,'bandpass',f*1.5,f*5,.28,.3,.06,1.8);tone(c,'sine',f/2,f,.3,.14,.05);sub(c,110,70,.12,.25)},
  ult(c,o){const f=o.f||220;hiss(c,'highpass',400,5000,.6,.3,.25,.7);pad(c,[f,f*1.5],.6,.22,2400,.25);sub(c,60,30,.9,.9,.5);hiss(c,'lowpass',1600,80,.8,.6,.003,.7,.5)},
  tactic(c){hiss(c,'bandpass',700,2400,.18,.45,.015,1.6);sub(c,120,70,.1,.3)},
  heal(c){tone(c,'sine',880,0,.6,.07,.08);tone(c,'sine',1320,0,.5,.05,.12);hiss(c,'highpass',5000,8000,.4,.04,.1)},
  spawn(c){hiss(c,'bandpass',300,3000,.6,.25,.2,1.2);sub(c,50,90,.5,.4,.05);bell(c,784,.8,.06,.4)},
  relicUp(c){pad(c,[hz(57),hz(64),hz(69)],1.8,.3,1800,.5);bell(c,hz(81),1.6,.1,.3);sub(c,55,40,1.2,.5)},
  relicMine(c){pad(c,[hz(57),hz(64),hz(69),hz(73)],1.6,.32,2200,.08);sub(c,70,35,.8,.7);bell(c,hz(85),1.2,.08,.15)},
  relicFoe(c){pad(c,[hz(45),hz(51),hz(56)],1.6,.32,900,.08);sub(c,60,28,1,.8);hiss(c,'lowpass',800,100,.9,.3,.05)},
  warn(c){for(const at of [0,.32]){tone(c,'sawtooth',55,52,.26,.32,.01,['lowpass',500,200,2],at);sub(c,55,50,.26,.4,at)}},
  wave(c,o){const r=o.b?hz(33):hz(36);pad(c,[r,r*1.5,r*2],1.6,.45,o.b?900:1300,.04);sub(c,r,r*.7,1.6,.9);hiss(c,'lowpass',1400,90,1,.4,.004)},
  clear(c){pad(c,[hz(60),hz(64),hz(67),hz(72)],1.8,.25,2000,.35);bell(c,hz(84),1.4,.06,.3)},
  point(c,o){bell(c,o.mine?hz(76):hz(64),1,.13);bell(c,o.mine?hz(83):hz(61),1,.1,.16)},
  loot(c,o){const r=o.r||0;bell(c,hz(84+r*2),.9+r*.2,.08+r*.02);if(r>=3)bell(c,hz(91+r),1.1,.06,.12)},
  click(c){hiss(c,'bandpass',2200,1800,.012,.18,.001,2)},
  msg(c){bell(c,hz(81),.7,.08);bell(c,hz(88),.6,.05,.09)},
  ping(c,o){const f=o.danger?hz(70):hz(84);bell(c,f,.5,.12);bell(c,o.danger?hz(66):f*1.5,.45,.09,.1);if(o.danger)sub(c,90,60,.15,.3)},
  heart(c){sub(c,62,40,.15,.6);sub(c,56,36,.13,.45,.17)},
  win(c){pad(c,[hz(48),hz(55),hz(60),hz(64),hz(67)],3.2,.5,2600,.6);sub(c,65,32,2,.8);bell(c,hz(84),2.4,.08,.7);hiss(c,'highpass',3000,9000,1.6,.06,.6)},
  lose(c){pad(c,[hz(45),hz(52),hz(57),hz(60)],3,.45,900,.5);sub(c,55,30,2.4,.7);tone(c,'sine',hz(64),hz(62),2.2,.05,.6)},
  levelUp(c){pad(c,[hz(60),hz(67),hz(72),hz(76)],2,.3,2800,.15);bell(c,hz(84),1.6,.09,.1);bell(c,hz(91),1.4,.06,.35)}
};
const LONG={died:1.8,relicUp:2.6,relicMine:2.2,relicFoe:2.2,wave:2,clear:2.5,win:4.2,lose:4,levelUp:2.6,ult:1.8,spawn:1.3,boom:1.8};
export function play(name,pos=null,o={}){
  const fn=SFX[name];if(!fn||!ac||cfg.mute)return;
  if(!gate(name+(o.key||''),o.gap??.03))return;
  const sp=o.ui||!L.on?{v:1,pan:0,far:0}:spatial(pos,o.range);if(!sp)return;
  // distant sounds get more room and less level
  const c=chain(o.ui?uiBus:sfxBus,sp.pan,(o.vol??1)*sp.v,LONG[name]||1,(o.verb??.18)+sp.far*.35);if(!c)return;
  try{fn(c,o)}catch(e){console.warn(e)}
}

// ---------- music ----------
// a chord per bar in A minor; bosses get a darker progression. Each style is a set of layers with its own tempo.
const PROG={calm:[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]],match:[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]],
  boss:[[45,52,57,60],[46,53,58,62],[41,48,53,56],[40,47,52,56]]};
const STYLE={
  ambient:{bpm:{calm:56,match:72,boss:80},lv:{calm:{pad:1,arp:.6,bass:.5,drums:0},match:{pad:.9,arp:.6,bass:.9,drums:.6},boss:{pad:.9,arp:.4,bass:1,drums:.9}}},
  synth:{bpm:{calm:84,match:100,boss:112},lv:{calm:{pad:.9,arp:.6,bass:.3,drums:0},match:{pad:.7,arp:.7,bass:.9,drums:.75},boss:{pad:.7,arp:.8,bass:1,drums:.9}}},
  pulse:{bpm:{calm:96,match:118,boss:126},lv:{calm:{pad:.8,arp:.2,bass:.6,drums:.25},match:{pad:.5,arp:.3,bass:1,drums:.85},boss:{pad:.6,arp:.4,bass:1,drums:1}}}
};
const MU={on:false,state:'calm',want:'calm',step:0,next:0,timer:0,layers:null};
function startMusic(){
  if(MU.on||!ac)return;MU.on=true;
  const mk=()=>{const g=ac.createGain();g.gain.value=0;g.connect(musBus);return g};
  MU.layers={pad:mk(),arp:mk(),bass:mk(),drums:mk()};
  const pv=ac.createGain();pv.gain.value=.6;MU.layers.pad.connect(pv);pv.connect(verb);
  const av=ac.createGain();av.gain.value=.5;MU.layers.arp.connect(av);av.connect(verb);MU.layers.arp.connect(delay);
  MU.next=ac.currentTime+.1;applyMood(true);
  MU.timer=setInterval(schedule,25);
}
// mood: 'calm' (hub, lobby), 'match', 'boss', 'off' (end screen, before the stinger)
export function mood(m){MU.want=m;if(MU.on)applyMood()}
function applyMood(now){
  let m=MU.want;if((m==='match'||m==='boss')&&!cfg.inMatch)m='off';if(cfg.track==='off')m='off';
  const st=STYLE[cfg.track]||STYLE.ambient,lv=m==='off'?{pad:0,arp:0,bass:0,drums:0}:st.lv[m],t=ac.currentTime;
  for(const k in MU.layers)MU.layers[k].gain.setTargetAtTime(lv[k],t,now?.01:1.5);
  if(m!=='off')MU.state=m;MU.silent=m==='off';
}
function schedule(){
  if(!ac||ac.state!=='running'||cfg.mute||cfg.music<=0||cfg.track==='off'){if(ac)MU.next=ac.currentTime+.05;return}
  const st=STYLE[cfg.track]||STYLE.ambient;
  while(MU.next<ac.currentTime+.2){if(!MU.silent)step16(cfg.track,MU.step,MU.next);MU.next+=60/st.bpm[MU.state]/4;MU.step=(MU.step+1)%512}
}
function v(layer,t,type,f,dur,peak,a,cut,cut2,q=.7,det=0){
  const o=ac.createOscillator(),fl=ac.createBiquadFilter(),g=ac.createGain();o.type=type;o.frequency.value=f;o.detune.value=det;fl.type='lowpass';fl.Q.value=q;
  fl.frequency.setValueAtTime(cut,t);if(cut2)fl.frequency.exponentialRampToValueAtTime(cut2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dur);
  o.connect(fl);fl.connect(g);g.connect(MU.layers[layer]);o.start(t);o.stop(t+a+dur+.05);
}
function drum(t,type,f,dur,peak,q=.7){const s=ac.createBufferSource();s.buffer=noise;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();
  g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(MU.layers.drums);s.start(t,Math.random());s.stop(t+dur+.02)}
function kick(t,peak,dec=.35){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(38,t+.14);
  g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(g);g.connect(MU.layers.drums);o.start(t);o.stop(t+dec+.02)}
function step16(style,step,t){
  const P=PROG[MU.state],bars=style==='ambient'?2:1,bar=Math.floor(step/(16*bars))%4,s=step%(16*bars),ch=P[bar].map(hz),root=ch[0];
  const beat=60/(STYLE[style].bpm[MU.state])/4,barDur=beat*16*bars,boss=MU.state==='boss';
  if(style==='ambient'){
    // long evolving pads, a sub drone, sparse glassy notes; in a match a soft heartbeat kick and a breathing hat
    if(s===0){for(const f of ch)for(const det of [-6,6])v('pad',t,'sawtooth',f,barDur,.022,barDur*.35,500,900,.6,det);v('bass',t,'sine',root/2,barDur,.16,1.2,400)}
    if(s%2===0&&Math.random()<.16){const n=ch[1+Math.floor(Math.random()*3)]*2;v('arp',t,'sine',n,1.6,.035,.01,3000);v('arp',t,'sine',n*2.76,.5,.006,.01,4000)}
    if(s%8===0)kick(t,boss?.32:.22,.5);
    if(s%8===4)drum(t,'bandpass',boss?900:600,.5,.05,1.2);
    if(boss&&s%2===1)v('bass',t,'sawtooth',root/2,beat*.9,.05,.005,300,120,3);
  }else if(style==='synth'){
    // softer synthwave: pads, a triangle arpeggio through a lowpass, sidechain-feel bass, soft drums
    if(s===0)for(const f of ch.slice(1))for(const det of [-7,7])v('pad',t,'sawtooth',f,barDur,.02,.5,900,1300,.6,det);
    if(s%2===0||boss){const seq=[1,2,3,2,1,3,2,3],n=ch[seq[(s>>(boss?0:1))%8]]*2;v('arp',t,'triangle',n,.22,.04,.004,1800,600)}
    if(s%2===0)v('bass',t,'sawtooth',root/2*(s%4===2?2:1),beat*1.6,.07,.004,700,160,3);
    if(s%4===0)kick(t,.4);
    if(s===4||s===12)drum(t,'bandpass',1400,.2,.09,.9);
    if(s%2===0)drum(t,'highpass',8000,.04,s%4===2?.03:.018,.7);
  }else{
    // dark pulse: four on the floor, an off-beat sub bass, a filtered stab every other bar, ticking hats
    if(s===0&&bar%2===0)for(const f of ch.slice(1))v('pad',t,'sawtooth',f,barDur*2,.016,1.5,500,800,.6);
    if(s%4===0)kick(t,.5,.3);
    if(s%4===2)v('bass',t,'sawtooth',root/2,beat*1.5,.09,.003,420,120,4);
    if(s%2===1||boss)drum(t,'highpass',9000,.03,.02,.7);
    if(s===12&&bar%2===1)v('arp',t,'square',ch[2]*2,.3,.025,.004,1100,300,2);
    if(boss&&s%8===6)drum(t,'bandpass',300,.25,.08,2);
  }
}

// ---------- settings ----------
export const settings=()=>({...cfg});
const subs=new Set();export const onChange=f=>subs.add(f);
export function set(k,val){
  if(k==='mute')cfg.mute=!!val;else if(k==='inMatch')cfg.inMatch=!!val;else if(k==='track'){if(Object.hasOwn(TRACKS,val))cfg.track=val}
  else if(k in DEF)cfg[k]=clamp(+val||0,0,1);
  store.set('audio2',cfg);applyVolumes();if(MU.on)applyMood();
  if(!cfg.mute&&ac?.state==='suspended'&&!document.hidden)ac.resume().catch(()=>{});
  for(const f of subs)f();
}
export const toggleMute=()=>set('mute',!cfg.mute);
export function panelHTML(){
  const sl=(k,n)=>`<label class="vol"><span>${n}</span><input type="range" min="0" max="100" step="5" data-vol="${k}" value="${Math.round(cfg[k]*100)}"><b>${Math.round(cfg[k]*100)}</b></label>`;
  return`<div class="sndp">${sl('master','Celkem')}${sl('sfx','Efekty')}${sl('music','Hudba')}
    <div class="vol"><span>Styl</span><div class="seg" data-track>${Object.entries(TRACKS).map(([k,n])=>`<button type="button" data-tr="${k}" aria-pressed="${cfg.track===k}">${n}</button>`).join('')}</div></div>
    <label class="chk"><input type="checkbox" data-inmatch ${cfg.inMatch?'checked':''}> Hudba i během zápasu</label>
    <button type="button" class="ghost sm" data-mute aria-pressed="${cfg.mute}">${cfg.mute?'Zvuk vypnutý · zapnout':'Vypnout veškerý zvuk'}</button><small class="help">Klávesa M zvuk rychle vypne a zapne.</small></div>`;
}
export function bindPanel(root){
  root.querySelectorAll('[data-vol]').forEach(i=>i.oninput=()=>{set(i.dataset.vol,i.value/100);i.nextElementSibling.textContent=i.value});
  root.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{set('track',b.dataset.tr);root.querySelectorAll('[data-tr]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.tr===cfg.track))});
  const im=root.querySelector('[data-inmatch]');if(im)im.onchange=()=>set('inMatch',im.checked);
  const m=root.querySelector('[data-mute]');if(m)m.onclick=()=>{toggleMute();m.setAttribute('aria-pressed',cfg.mute);m.textContent=cfg.mute?'Zvuk vypnutý · zapnout':'Vypnout veškerý zvuk'};
}
