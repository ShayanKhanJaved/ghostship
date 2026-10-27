// ORHANGE - Main: input, settings, title-screen wiring and the p5 setup/draw loop
'use strict';
// ============================================================ input
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(state!=='play')return;
  if(e.code==='KeyP'||(e.code==='Escape'&&fallbackLook))pauseGame();
  if(e.code==='KeyR')startReload();
  if(e.code==='KeyE')interact();
  const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(e.code);if(n>=0){const i=P.arsenal.findIndex(s=>s.id===ORDER[n]);if(i>=0)switchTo(i);else showEff(WDEF[ORDER[n]].name+' NOT FOUND YET','#cfefff');}});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseL=false;});
window.addEventListener('wheel',e=>{if(state!=='play'||P.arsenal.length<2)return;const n=P.arsenal.length;switchTo((P.cur+(e.deltaY>0?1:-1)+n)%n);},{passive:true});
document.addEventListener('mousemove',e=>{if(state!=='play')return;if(!document.pointerLockElement&&!fallbackLook)return;
  const s=SET.sens*0.001;P.yaw+=e.movementX*s;P.pitch=clamp(P.pitch-e.movementY*s,-1.45,1.45);});
document.addEventListener('mousedown',e=>{if(state!=='play')return;if(!document.pointerLockElement&&!fallbackLook){requestLock();return;}
  if(e.button===0)mouseL=true;if(e.button===2)firePulse();});
document.addEventListener('mouseup',e=>{if(e.button===0)mouseL=false;});
document.addEventListener('contextmenu',e=>e.preventDefault());
$('btnLevels').onclick=()=>{AU.init();newRun('levels');};
const THNAME={pool:'Pool halls',sky:'Glass sky',city:'Aero city',dream:'Funhouse',arena:'Boss arena',end:'Finale'};
function renderMap(){const g=$('mapGrid');g.innerHTML='';
  const add=(cls,b,sp,sm,fn)=>{const c=document.createElement('button');c.className='mcard';c.innerHTML=`<div class="mthumb ${cls}"></div><div class="minfo"><b></b><span></span><small></small></div>`;
    c.querySelector('b').textContent=b;c.querySelector('span').textContent=sp;c.querySelector('small').textContent=sm;c.onclick=fn;g.appendChild(c);};
  for(let n=1;n<=10;n++){const st=STORY[n];add('th-'+st.th,'SECTOR '+pad2(n)+' \u00B7 MEMORY '+pad2(n),st.t,THNAME[st.th]+(SAVE.bestFloor>=n?' \u00B7 reached':''),()=>{AU.init();startAt(n);});}
  add('th-endless','SECTOR 11+','Endless descent','All four worlds, rotating',()=>{AU.init();startAt(11);});
  add('th-death','DEATH MODE','Death Pool','Rounds \u00B7 buy doors \u00B7 survive',()=>{AU.init();newRun('death','pool');requestLock();});
  add('th-fun','DEATH MODE','Death Funhouse','Rounds in the Funhouse',()=>{AU.init();newRun('death','dream');requestLock();});}
function startAt(n){baseRun('levels');$('toasts').innerHTML='';$('flash').style.transition='';$('flash').style.opacity=0;G.map='pool';G.floor=n;
  const give=['tile','sauna','eel'].slice(0,Math.max(0,Math.min(3,n-1)));give.forEach(id=>giveWeapon(id,true));G.milestone=give.length;G.tokens=(n-1)*10;
  P.maxHp=100+Math.min(n-1,8)*8;P.hp=P.maxHp;renderSlots();
  if(STORY[n])showInterlude(n,startFloor);else{startFloor();requestLock();}}
$('btnMap').onclick=()=>{AU.init();renderMap();showScreen('mapScreen');};
$('btnMapBack').onclick=()=>showScreen('title');
$('btnMem').onclick=()=>{VOICE.seq++;VOICE.stop();const n=MEMNEXT;MEMNEXT=null;if(n){n();requestLock();}};
$('btnDeath').onclick=()=>{AU.init();newRun('death','pool');requestLock();};
$('btnFun').onclick=()=>{AU.init();newRun('death','dream');requestLock();};
$('btnResume').onclick=()=>resumeGame();
$('btnQuit').onclick=()=>toTitle();
$('btnRetry').onclick=()=>{const m=G.mode,mp=G.map;newRun(m,mp);if(m==='death')requestLock();};
$('btnCheckpoint').onclick=()=>{if(!G||!G.snap)return;const sn=JSON.parse(G.snap);Object.assign(P,sn.P);Object.assign(W,sn.W);Object.assign(G,sn.G);P.hp=P.maxHp;P.arsenal.forEach(w=>{w.mag=magCap(w.id);});G.combo=0;G.comboT=0;startFloor();requestLock();};
$('btnTitle').onclick=()=>toTitle();
$('lockMsg').onclick=()=>requestLock();
$('btnDescend').onclick=()=>{if(G.freePick){$('shopMsg').textContent='> Choose an augmentation first.';return;}G.floor++;if(STORY[G.floor])showInterlude(G.floor,startFloor);else{startFloor();requestLock();}};
$('btnHeal').onclick=()=>{if(G.tokens<8)return;G.tokens-=8;P.hp=Math.min(P.maxHp,P.hp+40);AU.play('heal');refreshShop();};
$('btnAmmo').onclick=()=>{if(G.tokens<6)return;G.tokens-=6;P.arsenal.forEach(s=>s.res+=Math.ceil(magCap(s.id)*1.5));AU.play('ammo');refreshShop();$('shopMsg').textContent='> Ammo crate loaded into every weapon.';};
$('btnReroll').onclick=()=>{const c=drawCost();if(G.tokens<c||G.freePick)return;G.tokens-=c;G.draws++;G.freePick=true;dealCards();};
const sens=$('sens'),vol=$('vol'),res=$('res'),wob=$('wob'),mus=$('mus'),voiceSel=$('voiceSel');
voiceSel.value=SET.voice?'1':'0';voiceSel.onchange=()=>{SET.voice=+voiceSel.value;if(!SET.voice)VOICE.stop();persistSet();};
mus.value=SET.music;$('musO').textContent=Math.round(SET.music*100)+'%';
mus.oninput=()=>{SET.music=+mus.value;$('musO').textContent=Math.round(SET.music*100)+'%';persistSet();};
$('soundHint').onclick=()=>AU.init();
$('splash').onclick=()=>$('splash').classList.add('gone');setTimeout(()=>$('splash').classList.add('gone'),4500);
document.addEventListener('pointerdown',()=>{if(!MUS.on)AU.init();},true);
sens.value=SET.sens;$('sensO').textContent=SET.sens;vol.value=SET.vol;$('volO').textContent=Math.round(SET.vol*100)+'%';res.value=SET.res;wob.value=SET.snap;
sens.oninput=()=>{SET.sens=+sens.value;$('sensO').textContent=SET.sens.toFixed(1);persistSet();};
vol.oninput=()=>{SET.vol=+vol.value;$('volO').textContent=Math.round(SET.vol*100)+'%';AU.vol(SET.vol);persistSet();};
res.onchange=()=>{SET.res=+res.value;persistSet();fitCanvas();};
wob.onchange=()=>{SET.snap=+wob.value;persistSet();};
(function(){const b=$('bubbles');for(let i=0;i<18;i++){const e=document.createElement('i');const s=rnd(12,60);e.style.cssText=`left:${rnd(100)}%;width:${s}px;height:${s}px;animation-duration:${rnd(9,22)}s;animation-delay:${-rnd(20)}s`;b.appendChild(e);}})();

// ============================================================ p5 hooks
function fitCanvas(){const h=SET.res,w=Math.round(h*window.innerWidth/window.innerHeight);resizeCanvas(w,h);}
function setup(){
  pixelDensity(1);
  const h=SET.res,w=Math.round(h*window.innerWidth/window.innerHeight);
  const c=createCanvas(w,h,WEBGL);c.parent('game');
  setAttributes({antialias:false,alpha:false,depth:true});const cv=document.getElementById('defaultCanvas0');if(cv&&cv.parentNode!==$('game'))$('game').appendChild(cv);
  noStroke();
  document.getElementById('defaultCanvas0').addEventListener('webglcontextlost',e=>{e.preventDefault();if(state==='play')pauseGame();toast('GRAPHICS RESET','The GPU dropped the scene. Reload the page to continue.','',20000);});
  SH=createShader(VERT,FRAG);
  buildPrims();
  genLevel(1,pick(['pool','dream']));renderTitleStats();showScreen('title');
  window.__c21={get L(){return L},get P(){return P},get G(){return G},get W(){return W},get state(){return state},newRun,startFloor,completeFloor,firePulse,giveWeapon,switchTo,interact,setFire:v=>mouseL=v};
}
function windowResized(){fitCanvas();}
function draw(){
  const dt=Math.min(deltaTime/1000,0.05);T+=dt;frameN++;
  if(state==='play'){
    const ts=G.tscale||1;updatePlayer(dt);const cam=getCam();updateWeapon(dt,cam);updateEnts(dt*ts,cam);updateOrbs(dt*ts);updatePickups(dt);updateParts(dt*ts);updateLevel(dt);
  }else if(state==='title'){L.t+=dt;}
  render();
  if(state==='play')updateHUD(dt);
  AU.tick();MUS.mix();applyScreenFx();
}
