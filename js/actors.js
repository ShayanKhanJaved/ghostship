// ORHANGE - Actors: run flow, weapons, player movement, combat, entities and their AI, pickups, dread and rounds
'use strict';
// ============================================================ runs
function baseRun(mode){
  G={mode,floor:1,round:0,score:0,tokens:0,kills:0,combo:0,comboT:0,upg:{},dealt:0,draws:0,time:0,doorsBought:0,termBought:0,milestone:0,toSpawn:0,toKill:0,inRound:false,breakT:4,dreadSpike:0,grav:22,tscale:1,creepy:null};
  P={x:0,y:0,z:0,vx:0,vz:0,vy:0,yaw:0,pitch:0,hp:100,maxHp:100,sta:100,maxSta:100,speedMul:1,onGround:true,bobT:0,inv:0,
     dash:0,dashCd:0,magnet:2.2,greed:1,sonar:false,wasWater:false,arsenal:[],cur:0};
  W={dmgMul:1,magMul:1,reloadMul:1,ammoMul:1,tune:1,bounces:0,split:0,leech:0,nova:0,pulseDmg:120,pulseCost:25,pulseCd:0,kick:0,firing:false,fireCd:0,reloadT:0,reloadDur:1,swapT:0,dryT:0};
  giveWeapon('laser',true);
}
function newRun(mode,map){baseRun(mode);$('toasts').innerHTML='';$('flash').style.transition='';$('flash').style.opacity=0;G.map=map||'pool';if(mode==='death')startDeath(G.map);else showInterlude(1,startFloor);}
function placePlayerStart(){
  P.x=L.start[0]*CELL+CELL/2;P.z=L.start[1]*CELL+CELL/2;P.y=0;P.vx=P.vz=P.vy=0;
  let best=0,bl=-1;for(let k=0;k<8;k++){const a=k/8*TAU;let d=0;while(d<40&&openAt(P.x+Math.sin(a)*d,P.z-Math.cos(a)*d))d+=0.5;if(d>bl){bl=d;best=a;}}
  P.yaw=best;P.pitch=0;W.reloadT=0;W.swapT=0;if(G){G.grav=22;G.tscale=1;}
}
function sectorTheme(f){if(STORY[f])return STORY[f].th;return ['dream','pool','sky','city'][f%4];}
function startFloor(){
  const f=G.floor;const sth=sectorTheme(f);const th=sth==='arena'?'pool':sth==='end'?'city':sth;
  G.snap=JSON.stringify({P:{...P,safe:null},W:{...W},G:{floor:f,score:G.score,tokens:G.tokens,kills:G.kills,upg:G.upg,milestone:G.milestone}});
  genLevel(f,th,{variant:(f===6||f===7)?1:Math.floor(f/4)%3,arena:sth==='arena',ending:sth==='end'});
  placePlayerStart();if(L.arena||L.ending)P.yaw=0;
  computeFlow();
  if(!L.arena&&!L.ending){const n=Math.min(4+f*2,20);let made=0;for(let k=0;k<n&&made<n;k++)made+=spawnRandom(true)||0;
    if(th==='dream'){for(let k=0;k<Math.min(2+Math.floor(f/3),6);k++){for(let a=0;a<60;a++){const i=pick(L.openCells);if(L.pool[i])continue;const cx=i%L.W,cy=(i/L.W)|0;if(Math.hypot(cx*CELL+2-P.x,cy*CELL+2-P.z)<16)continue;spawnEnt('jack',cx,cy);break;}}}}
  if(L.arena)spawnBoss();
  L.tripT=rnd(18,28);L.phT=rnd(10,20);L.boT=rnd(14,24);L.txtT=rnd(20,35);L.attT=rnd(55,80);
  state='play';showScreen(null);$('flash').style.transition='';$('flash').style.opacity=0;
  const st=STORY[f];
  const SUBS={city:['THE CITY THAT WAITED','NOBODY HAS EVER LIVED HERE','THE SKY IS A SCREENSAVER','IT IS ALWAYS 2:47 PM'],pool:['THE WATER IS WARMER HERE','NO LIFEGUARD ON DUTY','PLEASE WALK, DO NOT RUN','DEEP END','THE TILES REMEMBER YOU'],
    dream:['THE FUNHOUSE REMEMBERS YOU','SMILE','EVERYONE IS SO HAPPY TO SEE YOU','THE COLORS ARE LISTENING','YOU NEVER LEFT THE CARNIVAL'],sky:['ABOVE THE WEATHER','THE GLASS IS HOLDING YOU','DO NOT LOOK DOWN','A SKY WITH NO GROUND','SOMEONE CLEANED THESE WINDOWS']};
  const suf=L.arena?' \u00B7 THE BOTTOM':th==='dream'?' \u00B7 FUNHOUSE':th==='sky'?' \u00B7 SKY':th==='city'?' \u00B7 CITY':'';
  banner(L.ending?'THE SHALLOW END':'SECTOR '+pad2(f)+suf,L.ending?'THE LAST MEMORY':st?st.t.toUpperCase():pick(SUBS[th]));
  $('wpn').classList.toggle('hidden',!!L.ending);$('cross').classList.toggle('hidden',!!L.ending);
  if(f===2||(!st&&th==='sky'))toast('THE SKY','Glass bridges, no railings. If you fall, the clouds send you back, but it hurts.','',8000);
  if(f===4||(!st&&th==='dream'))toast('THE FUNHOUSE','Reality is unstable here. Expect trips. Gift boxes are not gifts.','',8000);
  if(L.arena)toast('THE 21ST LIFEGUARD','Shoot the four halo lights to break its shield, then hit it. Jump over the shockwaves.','',10000);
  if(st)setTimeout(()=>{if(state==='play'&&G.floor===f)attendant(st.att);},3200);
  buildCoreDots();renderSlots();
}
const VOICE={v:null,a:null,seq:0,speaking:false,ok:'speechSynthesis' in window,
 pick(){if(!this.ok)return;const vs=speechSynthesis.getVoices();if(!vs.length)return;const en=vs.filter(v=>/^en/i.test(v.lang));
  const find=names=>{for(const n of names){const f=vs.find(v=>v.name.toLowerCase().includes(n));if(f)return f;}return null;};
  this.v=find(['fred','ralph','microsoft david','google uk english male','daniel','alex'])||en[0]||vs[0];
  this.a=find(['samantha','google us english','microsoft zira','karen','moira','victoria'])||en[1]||this.v;},
 stop(){this.speaking=false;if(this.ok)speechSynthesis.cancel();},
 say(text,who,onstart,onend){
  if(!this.ok||!SET.voice){onstart&&onstart();setTimeout(()=>onend&&onend(),Math.max(1600,text.length*50));return;}
  if(!this.v)this.pick();const u=new SpeechSynthesisUtterance(text);
  if(who==='att'){if(this.a)u.voice=this.a;u.pitch=1.3;u.rate=0.9;}else{if(this.v)u.voice=this.v;u.pitch=0.3;u.rate=0.76;}
  let started=false,ended=false;const begin=()=>{if(started)return;started=true;this.speaking=true;onstart&&onstart();};
  const fin=()=>{if(ended)return;ended=true;clearTimeout(g1);clearTimeout(g2);this.speaking=false;onend&&onend();};
  const g1=setTimeout(begin,1300),g2=setTimeout(fin,Math.max(4500,text.length*140));
  u.onstart=begin;u.onend=fin;u.onerror=fin;speechSynthesis.speak(u);}
};
if(VOICE.ok)speechSynthesis.onvoiceschanged=()=>VOICE.pick();
function narrate(items,els,done){const tok=++VOICE.seq;VOICE.stop();let i=0;
  const next=()=>{if(tok!==VOICE.seq)return;if(i>=items.length){done&&done();return;}const k=i++;AU.play('blip');
    VOICE.say(items[k].t,items[k].who,()=>{if(tok===VOICE.seq)els[k].classList.add('show');},()=>setTimeout(next,380));};
  setTimeout(next,600);}
function showInterlude(f,next){const st=STORY[f];if(!st||G.mode!=='levels'){next();return;}
  state='interlude';mouseL=false;if(document.pointerLockElement)document.exitPointerLock();
  $('memBar').textContent='Memory '+pad2(f)+' of 10';$('memNum').textContent='MEMORY '+pad2(f);$('memTitle').textContent=st.t;
  const box=$('memLines');box.innerHTML='';const els=st.lines.map(l=>{const pe=document.createElement('p');pe.textContent=l;box.appendChild(pe);return pe;});
  const q=document.createElement('div');q.className='attq';q.innerHTML='<span class="face">\u25D5\u203F\u25D5</span><q></q>';q.querySelector('q').textContent=st.att;box.appendChild(q);els.push(q);
  MEMNEXT=next;showScreen('interlude');AU.play('tape');
  narrate([...st.lines.map(t=>({t,who:'me'})),{t:st.att,who:'att'}],els);}
let MEMNEXT=null;
function attendant(txt){toast('THE ATTENDANT',txt,'att',8000);AU.play('chime');if(SET.voice&&VOICE.ok&&!VOICE.speaking&&state==='play')VOICE.say(txt,'att');}
function spawnHalo(b){for(let k=0;k<4;k++){const h=spawnEnt('halo',Math.floor(b.x/CELL),Math.floor(b.z/CELL));h.boss=b;h.idx=k;h.x=b.x;h.z=b.z;}}
function spawnBoss(){const b=spawnEnt('warden',10,8);b.x=10*CELL+2;b.z=7*CELL;b.y=0;b.yaw=0;L.boss=b;spawnHalo(b);AU.play('round');}
function bossDown(e){const c=entCenter(e);for(let k=0;k<4;k++)burst(c[0],c[1]-2+k*1.2,c[2],[1,0.95,0.95],30,9);flashA=1;shake=1;
  banner('THE 21ST LIFEGUARD','IT IS FINALLY RESTING');L.ents.forEach(o=>{if(o!==e&&o.alive)killEnt(o,true);});L.black=0;
  setTimeout(()=>{if(L.boss===e&&state==='play'){attendant('There. Now there is no edge at all.');startEscape();}},2600);}
function drawNPC(n){const t=L.t;const b=new Xf(Mat.T(n.x,0,n.z)).ry(Math.atan2(P.x-n.x,P.z-n.z));const skin=[0.9,0.78,0.68];
  part(G_BOX,M.SKIN,b.t(0,0.3,-0.1).s(0.42,0.6,0.32),[0.25,0.28,0.38]);
  for(const sx of [-1,1])part(G_BOX,M.SKIN,b.t(sx*0.12,0.22,0.28).s(0.13,0.13,0.6),skin);
  part(G_BOX,M.SKIN,b.t(0,0.92,-0.1).rx(0.12).s(0.46,0.7,0.28),[0.58,0.66,0.86]);
  const hd=b.t(0,1.46,-0.02).rx(0.2+Math.sin(t*0.5)*0.05);
  part(G_SPH,M.SKIN,hd.s(0.3,0.36,0.32),skin);part(G_SPH,M.SKIN,hd.t(0,0.06,-0.05).s(0.34,0.38,0.34),[0.28,0.18,0.12]);part(G_BOX,M.SKIN,hd.t(0,-0.2,-0.12).s(0.3,0.4,0.12),[0.28,0.18,0.12]);
  for(const sx of [-1,1])part(G_BOX,M.SKIN,b.t(sx*0.28,0.82,0.08).rx(-0.7).s(0.09,0.6,0.09),[0.58,0.66,0.86]);
  part(G_SPH,M.GLOW,b.t(0,1.1,0).s(2.6),[1,0.85,0.6],0,0.07+0.03*Math.sin(t*2));}
function beginEnding(){if(L.endT)return;L.endT=1;mouseL=false;AU.laser(false,0);AU.flame(false);const fl=$('flash');fl.style.transition='opacity 2s';
  attendant('You have always been here. Come and sit.');
  setTimeout(()=>{state='ending';fl.style.opacity=1;if(document.pointerLockElement)document.exitPointerLock();
    SAVE.storyDone=true;SAVE.bestFloor=Math.max(SAVE.bestFloor,10);SAVE.bestScore=Math.max(SAVE.bestScore,G.score);persist();
    const lines=['I sit down next to them at the edge of the water.','"You made all of this," they say. "The pools. The sky. The rooms that never end."','"So you would have somewhere to be while you remembered."','I look at them, and they are me. The water is me. The light is me.','There was never anywhere else. We are everything. The lights go out, and nothing is lost.'];
    const b=$('endBody');b.innerHTML='';const box=document.createElement('div');box.className='memLines';
    const els=lines.map(l=>{const pe=document.createElement('p');pe.textContent=l;box.appendChild(pe);return pe;});b.appendChild(box);
    const cr=document.createElement('div');cr.className='credits';
    cr.innerHTML=`<p class="mem">ORHANGE \u00B7 CLOSED FOR THE SEASON</p><p class="big">A game by Cameosky</p><p style="font-weight:700;color:var(--ink-soft)">Thank you for playing.</p><div class="sum" style="justify-content:center"><span class="glass pill">Score ${G.score.toLocaleString()}</span><span class="glass pill">${G.kills} entities laid to rest</span><span class="glass pill">Tapes ${SAVE.tapes.length}/${TAPES.length}</span></div>`;b.appendChild(cr);
    const row=document.createElement('div');row.className='shoprow credits';row.innerHTML='<button class="btn ghost" id="btnEndTitle">Title</button><button class="btn" id="btnEndless">Keep descending \u00B7 Endless</button>';b.appendChild(row);
    $('btnEndTitle').onclick=()=>{VOICE.seq++;VOICE.stop();toTitle();};$('btnEndless').onclick=()=>{VOICE.seq++;VOICE.stop();G.floor=11;startFloor();requestLock();};
    AU.play('core');showScreen('ending');
    narrate(lines.map(t=>({t,who:'me'})),els,()=>{cr.classList.add('show');row.classList.add('show');});},2200);}
function startDeath(map){
  genLevel(1,map,{death:true});placePlayerStart();computeFlow();
  G.round=0;G.inRound=false;G.breakT=5;G.tokens=500;L.tripT=rnd(25,35);L.phT=rnd(15,25);L.boT=rnd(30,45);L.txtT=rnd(25,40);
  state='play';showScreen(null);banner(map==='dream'?'DEATH FUNHOUSE':'DEATH POOL','EARN POINTS \u00B7 OPEN THE GLASS DOORS \u00B7 SURVIVE');
  $('coreDots').innerHTML='';renderSlots();
  toast('DEATH POOL','Kill entities to earn points. Stand by a glass door or kiosk and press E to buy.');
}
function difficulty(){return G.mode==='death'?1+(G.round-1)*0.6:G.floor;}
function chooseType(){
  const cnt=t=>L.ents.filter(e=>e.type===t).length;const lg=cnt('lifeguard'),ec=cnt('echo');const r=Math.random();const th=L.theme;
  const tbl=rows=>{const ok=rows.filter(x=>x[2]!==false);const tot=ok.reduce((s,x)=>s+x[1],0);let acc=0;for(const [t,w] of ok){acc+=w;if(r*tot<acc)return t;}return 'drowner';};
  if(G.mode==='death'){const R=G.round;
    if(R%5===0&&r<0.45)return 'sliver';
    if(th==='dream')return tbl([['drowner',3],['grinner',R>=2?3:0.5],['balloonist',2,R>=3],['sliver',2,R>=3],['jack',1.5,R>=4],['gleam',1.5,R>=4],['echo',0.8,R>=6&&ec<2]]);
    return tbl([['drowner',5],['ballast',2.5,R>=3],['gleam',2,R>=4],['sliver',2,R>=3],['lifeguard',1.2,R>=5&&lg<1+Math.floor(R/5)],['echo',0.8,R>=6&&ec<2]]);}
  const f=G.floor;
  if(th==='dream')return tbl([['grinner',3],['balloonist',2.2],['sliver',1.6],['gleam',1.2],['drowner',1.5],['jack',0.8],['echo',0.9,ec<1+Math.floor(f/6)],['lifeguard',0.6,lg<1]]);
  if(th==='sky')return tbl([['gleam',3],['ballast',2.2],['sliver',1.5,f>=2],['drowner',1.2],['lifeguard',1,lg<1+Math.floor(f/3)],['echo',0.8,f>=4&&ec<2]]);
  if(th==='city')return tbl([['gleam',3.5],['drowner',2.5],['ballast',1.5],['lifeguard',1.5,lg<1+Math.floor(f/3)],['sliver',1.2,f>=4],['echo',0.8,f>=4&&ec<2]]);
  if(f===1)return r<0.85?'drowner':'ballast';
  return tbl([['drowner',4.5],['ballast',2.7],['lifeguard',1.8,lg<1+Math.floor(f/3)],['gleam',1],['sliver',1.5,f>=4],['echo',0.8,f>=4&&ec<2]]);}
function spawnRandom(initial){
  const type=chooseType();const hasPools=L.openCells.some(i=>L.pool[i]&&L.dist[i]>=0);
  for(let a=0;a<120;a++){
    const i=pick(L.openCells);if(L.solid[i]||L.lock[i]||L.dist[i]<0)continue;const cx=i%L.W,cy=(i/L.W)|0;
    const x=cx*CELL+CELL/2,z=cy*CELL+CELL/2;const d=Math.hypot(x-P.x,z-P.z);
    if(d<(initial?22:(G.mode==='death'?12:16)))continue;if(!initial&&a<90&&d<34&&los(x,z,P.x,P.z))continue;
    if(type==='drowner'&&!L.pool[i]&&a<60&&hasPools)continue;
    if(type==='sliver'){const n=Math.min(12,ri(5,8)+Math.floor(difficulty()/3));for(let k=0;k<n;k++)spawnEnt('sliver',cx,cy);AU.at('swarm',x,z,1);return n;}
    spawnEnt(type,cx,cy,{rise:type==='drowner'&&L.pool[i]&&!initial,awake:G.mode==='death'});return 1;
  }
  return 0;
}
function spawnEnt(type,cx,cy,o={}){
  const f=difficulty();const i=cidx(cx,cy);
  const e={type,x:cx*CELL+CELL/2+rnd(-0.6,0.6),z:cy*CELL+CELL/2+rnd(-0.6,0.6),y:floorOf(i),yaw:rnd(TAU),anim:rnd(10),alive:true,hitT:0,atkCd:1.2,
    vx:0,vz:0,rise:0,spd:0,fireCd:rnd(1.5,3),whistle:0,seen:false,lunge:0,hover:2.3,burn:0,swell:0,sc:1,hy:0,vy:0,aff:[]};
  e.elite=f>=4&&type!=='warden'&&type!=='halo'&&Math.random()<0.15+f*0.02;
  if(type==='drowner'){e.hp=48+f*9;e.r=0.45;e.c0=0.35;e.c1=0.8;e.dmg=9+f;e.score=100;e.reach=1.35;}
  if(type==='lifeguard'){e.hp=230+f*30;e.r=0.42;e.c0=0.4;e.c1=3.0;e.dmg=24+f*2;e.score=400;e.reach=1.7;}
  if(type==='ballast'){e.hp=110+f*15;e.r=0.75;e.c0=e.hover-0.6;e.c1=e.hover+0.6;e.dmg=12+f;e.score=250;e.reach=0;}
  if(type==='gleam'){e.hover=1.4;e.hp=38+f*6;e.r=0.55;e.c0=e.hover-0.55;e.c1=e.hover+0.55;e.dmg=20+f*2;e.score=150;e.reach=0;}
  if(type==='echo'){e.hp=95+f*14;e.r=0.4;e.c0=0.3;e.c1=1.8;e.dmg=16+f*1.5;e.score=350;e.reach=0;e.seenT=0;}
  if(type==='sliver'){e.hover=rnd(1.0,2.2);e.hp=13+f*2.5;e.r=0.28;e.c0=e.hover-0.2;e.c1=e.hover+0.2;e.dmg=4+f*0.5;e.score=40;e.reach=0;e.ph=rnd(TAU);e.dart=0;e.atkCd=rnd(1,3);e.x+=rnd(-1.2,1.2);e.z+=rnd(-1.2,1.2);}
  if(type==='grinner'){e.hp=180+f*24;e.r=0.45;e.c0=0.4;e.c1=3.4;e.dmg=20+f*2;e.score=380;e.reach=1.6;}
  if(type==='balloonist'){e.hover=3.4;e.hp=115+f*15;e.r=0.85;e.c0=e.hover-0.9;e.c1=e.hover+1.5;e.dmg=15+f*1.5;e.score=300;e.reach=0;e.balloons=5;}
  if(type==='warden'){e.hp=2600;e.r=0.95;e.c0=0.8;e.c1=5.4;e.dmg=28;e.score=5000;e.reach=2.6;e.atkT=4;e.shieldT=0;e.phase=1;e.charge=0;}
  if(type==='halo'){e.hover=6.9;e.hp=140+f*10;e.r=0.75;e.c0=6.5;e.c1=7.3;e.dmg=0;e.score=200;e.reach=0;}
  if(type==='jack'){e.hp=240+f*26;e.r=0.6;e.c0=0.1;e.c1=1.2;e.dmg=20+f*2;e.score=320;e.reach=0;e.open=o.awake?0.01:0;e.hopT=1;}
  e.hp*=1+Math.max(0,f-1)*0.07;e.dmg*=1+Math.max(0,f-1)*0.04;
  if(!o.mini&&type!=='sliver'&&type!=='warden'&&type!=='halo'){const keys=Object.keys(AFFIX);const ch=clamp((f-2.5)*0.11,0,0.55);
    if(Math.random()<ch)e.aff.push(pick(keys));if(f>=6&&Math.random()<0.3)e.aff.push(pick(keys.filter(k=>!e.aff.includes(k))));
    e.aff=[...new Set(e.aff.map(a=>a==='splitter'&&!['drowner','grinner','gleam','lifeguard','echo'].includes(type)?'swift':a))];
    if(hasAff(e,'armored'))e.hp*=1.3;e.score*=1+e.aff.length*0.5;}
  if(o.mini){e.sc=0.6;e.hp*=0.35;e.r*=0.6;if(type==='gleam'){e.c0=e.hover-0.33;e.c1=e.hover+0.33;}else{e.c0*=0.6;e.c1*=0.6;}e.dmg*=0.6;e.score*=0.4;e.elite=false;}
  if(e.elite){e.hp*=1.7;e.score*=2;}
  e.maxhp=e.hp;if(o.rise){e.rise=-1.9;AU.at('splash',e.x,e.z,0.8);}
  L.ents.push(e);return e;
}

// ============================================================ weapons: inventory
function magCap(id){return Math.round(WDEF[id].mag*W.magMul);}
function curSlot(){return P.arsenal[P.cur];}
function owned(id){return P.arsenal.some(s=>s.id===id);}
function giveWeapon(id,quiet){
  if(owned(id)){const s=P.arsenal.find(s=>s.id===id);s.res+=WDEF[id].res;return;}
  const cur=P.arsenal[P.cur];
  P.arsenal.push({id,mag:magCap(id),res:WDEF[id].res});P.arsenal.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));
  if(cur)P.cur=P.arsenal.indexOf(cur);
  if(!quiet){switchTo(P.arsenal.findIndex(s=>s.id===id));const d=WDEF[id];banner('NEW WEAPON',d.name+' \u00B7 '+ELEM[d.elem].n);
    toast('WEAPON ACQUIRED \u00B7 '+d.name,`${d.sub}. ${ELEM[d.elem].n} damage, best against ${BEST[id]}. Press ${ORDER.indexOf(id)+1} to equip.`,'',8000);AU.play('core');flashA=0.3;}
  renderSlots();
}
function unlockNext(){const id=ORDER.find(i=>!owned(i));if(id){giveWeapon(id);return true;}return false;}
function switchTo(i){if(i<0||i>=P.arsenal.length||(i===P.cur&&W.swapT<=0))return;P.cur=i;W.swapT=0.35;W.reloadT=0;W.fireCd=0.2;AU.play('swap');renderSlots();}
function startReload(){const s=curSlot(),cap=magCap(s.id);if(W.reloadT>0||s.mag>=cap-0.01||s.res<=0)return;
  W.reloadDur=W.reloadT=WDEF[s.id].reload*W.reloadMul;AU.play('reload');
  if(W.nova){burst(P.x,P.y+1,P.z,[1,0.85,0.7],30,8);for(const e of L.ents)if(e.alive&&Math.hypot(e.x-P.x,e.z-P.z)<6)damageEnt(e,40*W.nova);}}
function finishReload(){const s=curSlot(),cap=magCap(s.id);const take=Math.min(cap-s.mag,s.res);s.mag+=take;s.res-=take;AU.play('ready');}
function grantAmmo(fracCur,fracOther){let shown=0;P.arsenal.forEach((s,i)=>{const n=Math.ceil(magCap(s.id)*(i===P.cur?fracCur:fracOther)*W.ammoMul);s.res+=n;if(i===P.cur)shown=n;});
  if(shown){$('ammoPlus').textContent='+'+shown;plusA=1.4;}}

// ============================================================ flow field
function computeFlow(){
  const Wd=L.W,d=L.dist;d.fill(-1);const pc=cidxW(P.x,P.z);if(pc<0)return;L.lastPC=pc;
  const q=new Int32Array(Wd*L.H);let h=0,t=0;q[t++]=pc;d[pc]=0;
  while(h<t){const c=q[h++],cx=c%Wd,cy=(c/Wd)|0;for(const o of N4){const n=cidx(cx+o[0],cy+o[1]);if(n<0||L.solid[n]||L.lock[n]||d[n]>=0)continue;d[n]=d[c]+1;q[t++]=n;}}
}

// ============================================================ player
function camBasis(yaw,pitch){const cp=Math.cos(pitch);const f=[Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp];
  const r=[Math.cos(yaw),0,Math.sin(yaw)];const u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];return {f,r,u};}
function updatePlayer(dt){
  if(keys.ArrowLeft)P.yaw-=2.4*dt;if(keys.ArrowRight)P.yaw+=2.4*dt;
  if(keys.ArrowUp)P.pitch=clamp(P.pitch+1.6*dt,-1.45,1.45);if(keys.ArrowDown)P.pitch=clamp(P.pitch-1.6*dt,-1.45,1.45);
  const fx=Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=Math.sin(P.yaw);
  let mx=0,mz=0;if(keys.KeyW){mx+=fx;mz+=fz;}if(keys.KeyS){mx-=fx;mz-=fz;}if(keys.KeyD){mx+=rx;mz+=rz;}if(keys.KeyA){mx-=rx;mz-=rz;}
  const ml=Math.hypot(mx,mz);if(ml>0){mx/=ml;mz/=ml;}
  const ci=cidxW(P.x,P.z);const inWater=ci>=0&&L.pool[ci]&&P.y<WATER_Y;
  const sprint=(keys.ShiftLeft||keys.ShiftRight)&&P.sta>1&&ml>0;
  if(sprint)P.sta=Math.max(0,P.sta-30*dt);else P.sta=Math.min(P.maxSta,P.sta+20*dt);
  const sp=5.0*P.speedMul*(sprint?1.55:1)*(inWater?0.62:1);
  const k=1-Math.exp(-dt*(P.onGround?12:3));
  P.vx=lerp(P.vx,mx*sp,k);P.vz=lerp(P.vz,mz*sp,k);
  P.dashCd-=dt;
  if(keys.KeyQ&&P.dash>0&&P.dashCd<=0){const dx=ml?mx:fx,dz=ml?mz:fz;P.vx=dx*22;P.vz=dz*22;P.dashCd=Math.max(0.6,2.4-P.dash*0.6);AU.play('dash');flashA=Math.max(flashA,0.12);}
  moveBody(P,P.vx*dt,P.vz*dt,0.33);
  const g=groundAt(P.x,P.z,0.3);
  if(keys.Space&&P.onGround){P.vy=inWater?5.5:7.2;P.onGround=false;}
  P.vy-=G.grav*dt;P.y+=P.vy*dt;
  if(P.y<=g){if(!P.onGround&&P.vy<-6){AU.play(inWater?'splash':'land');shake=Math.max(shake,0.1);}P.y=g;P.vy=0;P.onGround=true;}
  else if(g>P.y-0.02&&P.vy<=0){P.y=g;P.onGround=true;}
  else P.onGround=P.y-g<0.05;
  if(g>P.y&&g-P.y<STEP){P.y=Math.min(g,P.y+7*dt);}
  if(P.onGround&&g>-1.5&&CORN.every(c=>{const i=cidxW(P.x+c[0]*0.8,P.z+c[1]*0.8);return i>=0&&!L.solid[i];}))P.safe={x:P.x,z:P.z};
  if(P.y<-22){const sp=P.safe||{x:L.start[0]*CELL+2,z:L.start[1]*CELL+2};P.x=sp.x;P.z=sp.z;P.y=Math.max(0,groundAt(sp.x,sp.z,0.3));P.vy=P.vx=P.vz=0;flashA=0.8;AU.play('thunk');
    P.inv=0;hurt(15);P.inv=1.2;toast('CAUGHT BY THE CLOUDS','The sky sent you back. It cost you 15 health.','',3500);}
  const nowWater=ci>=0&&L.pool[ci]&&P.y<WATER_Y+0.2;
  if(nowWater&&!P.wasWater)AU.play('splash');P.wasWater=nowWater;
  const moving=Math.hypot(P.vx,P.vz);
  if(P.onGround&&moving>0.5){const prev=Math.sin(P.bobT);P.bobT+=dt*moving*1.7;if(prev>0&&Math.sin(P.bobT)<=0||prev<0&&Math.sin(P.bobT)>=0)AU.play(inWater?'wade':(L.theme==='city'&&L.grass[ci]?'grass':'step'));}
  P.inv-=dt;
  const pcx=Math.floor(P.x/CELL),pcy=Math.floor(P.z/CELL),R=L.theme==='city'?3:2;
  for(let y=pcy-R;y<=pcy+R;y++)for(let x=pcx-R;x<=pcx+R;x++){const i=cidx(x,y);if(i>=0&&!L.seen[i]&&(Math.abs(x-pcx)+Math.abs(y-pcy)<=R+1)&&los(P.x,P.z,x*CELL+2,y*CELL+2))L.seen[i]=1;}
}
function hurt(d,src){
  if(P.inv>0||state!=='play')return;
  if(src&&hasAff(src,'vampiric'))src.hp=Math.min(src.maxhp*1.5,src.hp+d*3);
  G.dreadSpike=Math.min(1,(G.dreadSpike||0)+0.25);
  P.hp-=d;P.inv=0.35;dmgA=Math.min(1,dmgA+0.55+d/50);shake=Math.max(shake,0.35);G.combo=0;G.comboT=0;AU.play('hurt');
  if(P.hp<=0){P.hp=0;die();}
}

// ============================================================ combat
function capsuleHit(e,x,y,z){if(Math.abs(x-e.x)>2.2||Math.abs(z-e.z)>2.2)return false;const by=e.y+e.rise+e.hy;
  const cy=clamp(y,by+e.c0,by+e.c1);const dx=x-e.x,dy=y-cy,dz=z-e.z;const r=e.r*(1+e.swell*0.5);return dx*dx+dy*dy+dz*dz<r*r;}
function entCenter(e){return [e.x,e.y+(e.c0+e.c1)/2+e.rise+e.hy,e.z];}
function trace(o,d,bounces,pierce,maxD){
  const segs=[],hits=[],seen=new Set();let x=o[0],y=o[1],z=o[2],dx=d[0],dy=d[1],dz=d[2],rem=maxD,b=bounces;const st=0.1;let end=null,norm=null;
  outer:for(;;){let sx=x,sy=y,sz=z,trav=0;
    while(trav<rem){
      const nx=x+dx*st,ny=y+dy*st,nz=z+dz*st;trav+=st;
      for(const e of L.ents){if(!e.alive||seen.has(e))continue;if(capsuleHit(e,nx,ny,nz)){seen.add(e);hits.push({e,x:nx,y:ny,z:nz});
        if(!pierce){segs.push([sx,sy,sz,nx,ny,nz]);return {segs,hits,end:[nx,ny,nz],norm:null,ent:true};}}}
      for(const ob of L.orbs){if(!ob.dead&&(nx-ob.x)**2+(ny-ob.y)**2+(nz-ob.z)**2<0.2){ob.dead=true;burst(ob.x,ob.y,ob.z,[1,0.5,0.85],10,4);AU.at('pop',ob.x,ob.z,0.6);}}
      const c=cidxW(nx,nz);let hit=null;
      if(wallAt(c)){const cx0=cidxW(nx,z),cz0=cidxW(x,nz);const sxh=wallAt(cx0),szh=wallAt(cz0);
        if(sxh&&!szh)hit=[-Math.sign(dx),0,0];else if(szh&&!sxh)hit=[0,0,-Math.sign(dz)];else hit=[-Math.sign(dx),0,-Math.sign(dz)];}
      else{const f=floorOf(c),cc=L.ceil[c];
        if(ny<=f){if(y>f)hit=[0,1,0];else hit=cidxW(nx,z)!==cidxW(x,z)?[-Math.sign(dx),0,0]:[0,0,-Math.sign(dz)];}
        else if(ny>=cc){if(y<cc)hit=[0,-1,0];else hit=cidxW(nx,z)!==cidxW(x,z)?[-Math.sign(dx),0,0]:[0,0,-Math.sign(dz)];}}
      if(hit){segs.push([sx,sy,sz,x,y,z]);end=[x,y,z];norm=hit;
        if(b>0){b--;rem-=trav;if(hit[0])dx=-dx;if(hit[1])dy=-dy;if(hit[2])dz=-dz;sparks(x,y,z,4);continue outer;}
        return {segs,hits,end,norm};}
      x=nx;y=ny;z=nz;
    }
    segs.push([sx,sy,sz,x,y,z]);return {segs,hits,end:[x,y,z],norm:null};
  }
}
function hitEnt(e,base,elem){
  let m=AFF[elem][e.type];if(elem==='shock'&&e.type==='drowner'&&inPoolEnt(e))m*=1.5;if(m>=1.5)m*=W.tune;
  if(hasAff(e,'armored')&&m<1.5)m*=0.5;
  const closed=e.type==='jack'&&!e.open;if(closed)m*=0.25;
  const shielded=e.type==='warden'&&L.ents.some(o=>o.type==='halo'&&o.alive);if(shielded)m*=0.08;
  damageEnt(e,base*W.dmgMul*m);
  if(shielded)showEff('THE HALO PROTECTS IT \u00B7 SHOOT THE FOUR LIGHTS','#bff4ff');
  else if(closed)showEff('THE LID IS CLOSED \u00B7 GET CLOSER','#ffb4e6');
  else if(m>=1.5)showEff('WEAK POINT \u00D7'+m.toFixed(1),ELEM[elem].c);else if(m<0.8)showEff('RESISTED \u00B7 '+ENAME[e.type].toUpperCase()+(hasAff(e,'armored')?' IS ARMORED':' SHRUGS IT OFF'),'#ff9aa8');
}
function damageEnt(e,d){if(!e.alive)return;e.hp-=d;e.hitT=0.07;G.dealt+=d;hitA=1;
  if(G.mode==='death')G.tokens+=d*0.12;
  if(W.leech)P.hp=Math.min(P.maxHp,P.hp+d/50*W.leech);
  if(e.type==='lifeguard'&&!e.seen)e.stagger=0.15;
  if(e.hp<=0)killEnt(e);}
function killEnt(e,noReward){
  if(!e.alive)return;e.alive=false;if(e.type==='warden')bossDown(e);
  const col=e.type==='ballast'?[1,0.55,0.75]:e.type==='lifeguard'?[0.95,1,1]:e.type==='gleam'?[0.9,0.95,1]:[0.4,1,0.9];
  const [cx,cy,cz]=entCenter(e);
  burst(cx,cy,cz,col,26,7);if(e.type!=='gleam')burst(cx,cy,cz,[0.06,0.1,0.11],14,4,true);
  AU.at(e.type==='gleam'?'pop':'kill',e.x,e.z,1);shake=Math.max(shake,0.15);
  if(hasAff(e,'volatile')){burst(cx,cy,cz,[1,0.6,0.2],30,9);AU.at('burst',e.x,e.z,1);if(Math.hypot(P.x-e.x,P.z-e.z)<3.2)hurt(14+difficulty()*1.5);
    for(const o of L.ents)if(o!==e&&o.alive&&Math.hypot(o.x-e.x,o.z-e.z)<3.2)damageEnt(o,40);}
  if(hasAff(e,'splitter')&&e.sc>=1){for(let k=0;k<2;k++){const m=spawnEnt(e.type,Math.floor(e.x/CELL),Math.floor(e.z/CELL),{mini:true,awake:true});m.x=e.x+rnd(-0.7,0.7);m.z=e.z+rnd(-0.7,0.7);m.y=e.y;}if(G.mode==='death')G.toKill+=2;}
  if(G.mode==='death')G.toKill=Math.max(0,G.toKill-1);
  if(noReward)return;
  G.kills++;G.combo=G.comboT>0?G.combo+1:1;G.comboT=4.5;
  const mult=1+Math.min(G.combo-1,12)*0.25;G.score+=Math.round(e.score*mult);
  grantAmmo(0.18,0.07);
  if(G.mode==='death'){G.tokens+=Math.round((50+(e.elite?50:0))*P.greed);}
  else{const n=Math.round(ri(1,3)*P.greed*(e.elite?2:1)+(e.type==='lifeguard'||e.type==='ballast'?2:0));
    for(let k=0;k<n;k++)L.pickups.push({type:'token',x:e.x+rnd(-0.8,0.8),z:e.z+rnd(-0.8,0.8),y:Math.max(e.y,WATER_Y)+0.6,t:rnd(9),vy:rnd(2,5)});}
  if(Math.random()<0.16)L.pickups.push({type:'hp',x:e.x,z:e.z,y:Math.max(e.y,WATER_Y)+0.7,t:0});
  if(Math.random()<0.22)L.pickups.push({type:'ammo',x:e.x+0.4,z:e.z,y:Math.max(e.y,WATER_Y)+0.6,t:0,vy:3});
  const MS=[15,40,80];if(G.milestone<MS.length&&G.kills>=MS[G.milestone]){G.milestone++;if(unlockNext())toast('KILL MILESTONE',`${G.kills} entities dissolved. A new weapon surfaced.`);}
}
function updateWeapon(dt,cam){
  W.pulseCd-=dt;W.fireCd-=dt;W.dryT-=dt;W.kick=Math.max(0,W.kick-dt*4);W.swapT=Math.max(0,W.swapT-dt);beamDraw=[];flameLight=null;
  tracers=tracers.filter(t=>(t.t-=dt)>0);bolts=bolts.filter(b=>(b.t-=dt)>0);
  const s=curSlot(),d=WDEF[s.id];
  if(W.reloadT>0){W.reloadT-=dt;if(W.reloadT<=0){W.reloadT=0;finishReload();}}
  const ready=W.reloadT<=0&&W.swapT<=0;
  W.firing=false;
  const muzzle=gunMuzzle(cam);
  if(mouseL&&ready){
    if(s.mag<=0.01){if(s.res>0)startReload();else if(W.dryT<=0){AU.play('dry');W.dryT=0.4;showEff('OUT OF AMMO \u00B7 SWITCH WEAPONS','#ffb4b4');}}
    else if(d.kind==='beam'){
      W.firing=true;s.mag=Math.max(0,s.mag-d.use*dt);
      const dirs=[cam.f];
      for(let k=0;k<W.split;k++){for(const sg of [-1,1]){const a=sg*(0.07+k*0.05);const c=Math.cos(a),si=Math.sin(a);dirs.push([cam.f[0]*c+cam.r[0]*si,cam.f[1],cam.f[2]*c+cam.r[2]*si]);}}
      dirs.forEach((dir,k)=>{
        const tr=trace([cam.x,cam.y,cam.z],dir,W.bounces,false,60);
        if(tr.segs.length){tr.segs[0][0]=muzzle[0];tr.segs[0][1]=muzzle[1];tr.segs[0][2]=muzzle[2];}
        beamDraw.push({segs:tr.segs,main:k===0});
        for(const h of tr.hits)hitEnt(h.e,d.dps*dt*(k===0?1:0.35),'light');
        if(tr.end&&Math.random()<0.6)sparks(...tr.end,tr.ent?2:1,tr.ent?[0.5,1,0.9]:null);
      });
    }else if(d.kind==='flame'){
      W.firing=true;s.mag=Math.max(0,s.mag-d.use*dt);
      for(let k=0;k<4;k++){if(L.parts.length>170)L.parts.shift();const sp=rnd(9,13);const jx=rnd(-0.12,0.12),jy=rnd(-0.08,0.12);
        const v=[cam.f[0]+cam.r[0]*jx+cam.u[0]*jy,cam.f[1]+cam.u[1]*jy,cam.f[2]+cam.r[2]*jx+cam.u[2]*jy];
        L.parts.push({x:muzzle[0],y:muzzle[1],z:muzzle[2],vx:v[0]*sp+P.vx,vy:v[1]*sp,vz:v[2]*sp+P.vz,life:rnd(0.35,0.55),max:0.55,col:pick([[1,0.55,0.15],[1,0.8,0.3],[1,0.35,0.1]]),s:0.04,g:-3,a:0.85,grow:3.5,fire:true});}
      const tip=[cam.x+cam.f[0]*d.range,cam.y+cam.f[1]*d.range,cam.z+cam.f[2]*d.range];flameLight=[muzzle,tip];
      for(const e of L.ents){if(!e.alive)continue;const c=entCenter(e);const vx=c[0]-cam.x,vy=c[1]-cam.y,vz=c[2]-cam.z,dl=Math.hypot(vx,vy,vz);
        if(dl>d.range+e.r)continue;const dot=(vx*cam.f[0]+vy*cam.f[1]+vz*cam.f[2])/(dl||1);if(dot<0.86&&dl>1.5)continue;if(!los(cam.x,cam.z,e.x,e.z))continue;
        hitEnt(e,d.dps*dt,'fire');e.burn=2.5;}
    }else if(d.kind==='shot'&&W.fireCd<=0){
      s.mag-=1;W.fireCd=d.rate;W.kick=1;shake=Math.max(shake,0.18);AU.play('shot');flashA=Math.max(flashA,0.05);
      for(let k=0;k<d.pellets;k++){const a=rnd(TAU),r=Math.sqrt(Math.random())*d.spread;const jx=Math.cos(a)*r,jy=Math.sin(a)*r;
        const dir=[cam.f[0]+cam.r[0]*jx+cam.u[0]*jy,cam.f[1]+cam.u[1]*jy,cam.f[2]+cam.r[2]*jx+cam.u[2]*jy];const dl=Math.hypot(...dir);dir[0]/=dl;dir[1]/=dl;dir[2]/=dl;
        const tr=trace([cam.x,cam.y,cam.z],dir,W.bounces,false,40);
        tr.segs.forEach((sg,j)=>tracers.push({a:j===0?muzzle:[sg[0],sg[1],sg[2]],b:[sg[3],sg[4],sg[5]],t:0.07}));
        for(const h of tr.hits){hitEnt(h.e,d.dmg,'kinetic');const kx=h.e.x-P.x,kz=h.e.z-P.z,kl=Math.hypot(kx,kz)||1;h.e.vx+=kx/kl*1.2;h.e.vz+=kz/kl*1.2;}
        if(tr.end)sparks(...tr.end,2,tr.ent?[1,1,1]:[1,0.85,0.5]);}
    }else if(d.kind==='bolt'&&W.fireCd<=0){
      s.mag-=1;W.fireCd=d.rate;W.kick=0.6;AU.play('zap');flashA=Math.max(flashA,0.08);
      const tr=trace([cam.x,cam.y,cam.z],cam.f,0,false,45);
      let from=muzzle,target=tr.hits[0]?tr.hits[0].e:null;
      if(!target){bolts.push({pts:jag(muzzle,tr.end,0.25),t:0.12});sparks(...tr.end,6,[0.8,0.7,1]);}
      const hitSet=new Set();let dmg=d.dmg;
      for(let k=0;target&&k<=d.chains;k++){hitSet.add(target);const c=entCenter(target);bolts.push({pts:jag(from,c,0.3),t:0.14});hitEnt(target,dmg,'shock');sparks(...c,6,[0.85,0.7,1]);
        from=c;dmg*=0.75;let nb=null,nd=7;for(const e of L.ents){if(!e.alive||hitSet.has(e))continue;const dd=Math.hypot(e.x-c[0],e.z-c[2]);if(dd<nd&&los(c[0],c[2],e.x,e.z)){nd=dd;nb=e;}}target=nb;}
    }
  }
  if(s.mag<=0.01&&s.res>0&&W.reloadT<=0&&W.swapT<=0)startReload();
  AU.laser(W.firing&&d.kind==='beam',1-s.mag/magCap(s.id));AU.flame(W.firing&&d.kind==='flame');
  if(pulseDraw){pulseDraw.t-=dt;if(pulseDraw.t<=0)pulseDraw=null;}
}
function jag(a,b,amp){const pts=[a];const n=7;for(let k=1;k<n;k++){const t=k/n;pts.push([lerp(a[0],b[0],t)+rnd(-amp,amp),lerp(a[1],b[1],t)+rnd(-amp,amp),lerp(a[2],b[2],t)+rnd(-amp,amp)]);}pts.push(b);return pts;}
function firePulse(){
  if(state!=='play'||W.pulseCd>0||W.reloadT>0||W.swapT>0)return;const s=curSlot();
  if(s.id!=='laser'){showEff('PULSE NEEDS THE PRISM-9 \u00B7 PRESS 1','#cfefff');return;}
  if(s.mag<W.pulseCost){AU.play('deny');showEff('NOT ENOUGH CHARGE','#ffb4b4');return;}
  const cam=getCam();s.mag-=W.pulseCost;W.pulseCd=0.55;W.kick=1;
  const tr=trace([cam.x,cam.y,cam.z],cam.f,W.bounces,true,80);
  const mz=gunMuzzle(cam);if(tr.segs.length){tr.segs[0][0]=mz[0];tr.segs[0][1]=mz[1];tr.segs[0][2]=mz[2];}
  pulseDraw={segs:tr.segs,t:0.22};
  for(const h of tr.hits){hitEnt(h.e,W.pulseDmg,'light');const dx=h.e.x-P.x,dz=h.e.z-P.z,dl=Math.hypot(dx,dz)||1;h.e.vx+=dx/dl*9;h.e.vz+=dz/dl*9;}
  if(tr.end)burst(...tr.end,[0.7,1,1],18,6);
  shake=Math.max(shake,0.3);flashA=Math.max(flashA,0.18);AU.play('pulse');
}

// ============================================================ entities
function updateEnts(dt,cam){
  if(L.lastPC!==cidxW(P.x,P.z)||(L.flowT-=dt)<0){computeFlow();L.flowT=0.5;}
  const f=difficulty();
  for(const e of L.ents){
    if(!e.alive)continue;
    if(e.type==='halo'){const b=e.boss;e.anim+=dt;e.hitT-=dt;if(!b||!b.alive){killEnt(e,true);continue;}const a=b.anim*0.9+e.idx*TAU/4;e.x=b.x+Math.cos(a)*2.9;e.z=b.z+Math.sin(a)*2.9;e.y=b.y;e.spd=0;continue;}
    e.anim+=dt;e.hitT-=dt;e.atkCd-=dt;e.lunge=Math.max(0,e.lunge-dt*3);
    if(e.burn>0){e.burn-=dt;damageEnt(e,10*dt*W.dmgMul*AFF.fire[e.type]);if(Math.random()<dt*14){const c=entCenter(e);L.parts.push({x:c[0]+rnd(-0.3,0.3),y:c[1]+rnd(-0.3,0.3),z:c[2]+rnd(-0.3,0.3),vx:0,vy:2,vz:0,life:0.4,max:0.4,col:[1,0.5,0.15],s:0.08,g:-2,a:0.9,grow:1.5});}if(!e.alive)continue;}
    if(e.rise<0){e.rise=Math.min(0,e.rise+dt*1.3);continue;}
    const dx=P.x-e.x,dz=P.z-e.z,dist=Math.hypot(dx,dz);
    const canSee=dist<32&&los(e.x,e.z,P.x,P.z);
    let tx=P.x,tz=P.z;
    if(!canSee){const c=cidxW(e.x,e.z);let bd=L.dist[c]>=0?L.dist[c]:9999,bi=-1;const cx=c%L.W,cy=(c/L.W)|0;
      for(const o of N4){const n=cidx(cx+o[0],cy+o[1]);if(n>=0&&!wallAt(n)&&L.dist[n]>=0&&L.dist[n]<bd){bd=L.dist[n];bi=n;}}
      if(bi>=0){tx=(bi%L.W)*CELL+CELL/2;tz=((bi/L.W)|0)*CELL+CELL/2;}}
    let ddx=tx-e.x,ddz=tz-e.z;const dl=Math.hypot(ddx,ddz)||1;ddx/=dl;ddz/=dl;
    let speed=0;const ci=cidxW(e.x,e.z);const inPool=ci>=0&&L.pool[ci];
    if(e.type==='drowner'){
      speed=(inPool?6.2:4.5)+f*0.12;if(L.escape)speed*=1.2;
      const wig=Math.sin(e.anim*3+e.x)*0.5;const ox=-ddz*wig,oz=ddx*wig;ddx+=ox;ddz+=oz;
      if(dist<4&&canSee&&e.atkCd<0.2)speed*=1.6;
    }else if(e.type==='lifeguard'){
      const ex=e.x-cam.x,ey=e.y+2.2-cam.y,ez=e.z-cam.z,el=Math.hypot(ex,ey,ez)||1;
      const dot=(ex*cam.f[0]+ey*cam.f[1]+ez*cam.f[2])/el;
      const wasSeen=e.seen;e.seen=canSee&&dot>0.62;
      speed=e.seen?0.35:(dist<40?7.0+f*0.15:3);
      if(wasSeen&&!e.seen&&dist<30&&e.whistle<=0){AU.at('whistle',e.x,e.z,1);e.whistle=7;}
      e.whistle-=dt;if(e.stagger>0){e.stagger-=dt;speed*=0.2;}
    }else if(e.type==='ballast'){
      if(canSee&&dist<26){const side=Math.sin(e.anim*0.7)>0?1:-1;
        if(dist<7){ddx=-ddx;ddz=-ddz;}else if(dist<=12){const t2=ddx;ddx=-ddz*side;ddz=t2*side;}
        speed=3.0;e.fireCd-=dt;
        if(e.fireCd<=0){e.fireCd=Math.max(1.0,2.5-f*0.12)*(e.elite?0.6:1);const sy=e.y+e.hover;const ty=P.y+1.2;
          const vx=P.x-e.x,vy=ty-sy,vz=P.z-e.z,vl=Math.hypot(vx,vy,vz)||1;const s=9+f*0.4;
          L.orbs.push({x:e.x,y:sy,z:e.z,vx:vx/vl*s,vy:vy/vl*s,vz:vz/vl*s,life:5,dmg:e.dmg});AU.at('orb',e.x,e.z,0.9);}
      }else speed=2.4;
    }else if(e.type==='gleam'){
      if(e.swell>0){e.swell+=dt*1.8;speed=0;if(e.swell>=1){gleamPop(e);continue;}}
      else{speed=canSee&&dist<12?(Math.sin(e.anim*2.5)>0?8:3.5):3.2;if(dist<1.9&&canSee){e.swell=0.01;AU.at('swell',e.x,e.z,1);}}
    }else if(e.type==='echo'){
      const c=entCenter(e);const ex=c[0]-cam.x,ey=c[1]-cam.y,ez=c[2]-cam.z,el=Math.hypot(ex,ey,ez)||1;const dot=(ex*cam.f[0]+ey*cam.f[1]+ez*cam.f[2])/el;
      e.seen=canSee&&dot>0.8&&dist<26;
      if(e.seen){e.seenT+=dt;speed=0;if(e.seenT>1.3)echoBlink(e);}
      else{e.seenT=Math.max(0,e.seenT-dt);speed=5.2+f*0.15;}
      if(dist<1.1&&e.atkCd<=0){hurt(e.dmg,e);G.dreadSpike=1;e.atkCd=1.5;echoBlink(e);}
    }else if(e.type==='sliver'){
      e.dart-=dt;
      if(e.dart>0)speed=9.5;
      else if(canSee&&dist<8){const a=e.ph+e.anim*1.6;const ox=P.x+Math.cos(a)*3.2-e.x,oz=P.z+Math.sin(a)*3.2-e.z,ol=Math.hypot(ox,oz)||1;ddx=ox/ol;ddz=oz/ol;speed=6.5;
        if(e.atkCd<=0&&Math.random()<dt*0.9){e.dart=0.7;e.atkCd=2.2;}}
      else speed=6;
      if(e.dart>0&&dist<0.9&&Math.abs(P.y+1-(e.y+e.hover))<1.5){hurt(e.dmg,e);e.dart=0;}
    }else if(e.type==='grinner'){
      const rage=e.hp<e.maxhp*0.4;speed=(rage?6.2:3.6)+f*0.1;
      if(rage&&!e.raged){e.raged=true;AU.at('laugh',e.x,e.z,1);}
      e.fireCd-=dt;
      if(canSee&&dist<22&&dist>3&&e.fireCd<=0){e.fireCd=rage?1.3:2.6;const sy=e.y+3.8;const tt=Math.max(0.4,dist/10);
        L.orbs.push({x:e.x,y:sy,z:e.z,vx:(P.x-e.x)/tt,vy:(P.y+1-sy)/tt+0.5*14*tt,vz:(P.z-e.z)/tt,life:6,dmg:e.dmg*0.7,g:14,bounce:2,col:pick(BALLCOLS),r:0.3});AU.at('honk',e.x,e.z,0.8);}
      if(Math.random()<dt*0.07&&dist<25)AU.at('laugh',e.x,e.z,0.6);
    }else if(e.type==='balloonist'){
      if(dist>4)speed=3.2;else{speed=1.4;const t2=ddx;ddx=-ddz;ddz=t2;}
      e.fireCd-=dt;
      if(canSee&&dist<9&&e.fireCd<=0){e.fireCd=Math.max(1.1,2.4-f*0.08);L.orbs.push({x:e.x,y:e.y+e.hover-0.6,z:e.z,vx:(P.x-e.x)/0.8,vy:1,vz:(P.z-e.z)/0.8,life:5,dmg:e.dmg,g:12,bomb:true,col:pick(BALLCOLS),r:0.28});AU.at('whee',e.x,e.z,0.7);}
      const nb=Math.max(1,Math.ceil(e.hp/e.maxhp*5));if(nb<e.balloons){e.balloons=nb;const c=entCenter(e);burst(c[0],c[1]+1,c[2],pick(BALLCOLS),16,6);AU.at('balloonpop',e.x,e.z,1);}
    }else if(e.type==='jack'){
      if(!e.open){if((dist<7&&canSee)||e.hp<e.maxhp){e.open=0.01;AU.at('jackbox',e.x,e.z,1);G.dreadSpike=Math.min(1,G.dreadSpike+0.4);}}
      else{e.open=Math.min(1,e.open+dt*3);e.c1=1.2+e.open*1.6;e.hopT-=dt;
        if(e.hopT<=0&&dist>2.4&&e.hy<=0){e.hopT=1.1;e.vy=5;e.vx=ddx*4.5;e.vz=ddz*4.5;AU.at('boing',e.x,e.z,0.7);}
        if(dist<3.2&&e.atkCd<=0&&canSee){hurt(e.dmg,e);e.atkCd=1.4;e.lunge=1;AU.at('slam',e.x,e.z,1);}}
      e.hy=Math.max(0,e.hy+e.vy*dt);e.vy-=14*dt;if(e.hy<=0){e.hy=0;e.vy=Math.max(0,e.vy);}
    }
    else if(e.type==='warden'){
      const hpf=e.hp/e.maxhp;const ph=hpf<0.35?3:hpf<0.7?2:1;
      if(ph!==e.phase){e.phase=ph;banner(ph===2?'IT REMEMBERS':'IT WILL NOT LET GO',ph===2?'THE WATER STIRS':'THE LIGHTS GIVE OUT');AU.play('alarm');G.dreadSpike=1;
        attendant(ph===2?'Not yet. You are not ready to be all of it.':'If I fall, there will be nothing left that is not you.');}
      if(ph===3)L.black=Math.max(L.black,0.45);
      const hal=L.ents.filter(o=>o.type==='halo'&&o.alive).length;
      if(hal===0){if(!e.broken){e.broken=true;e.shieldT=10;banner('THE HALO IS BROKEN','HIT IT NOW');AU.play('core');}e.shieldT-=dt;if(e.shieldT<=0){e.broken=false;spawnHalo(e);AU.play('pulse');showEff('THE HALO RETURNS','#bff4ff');}}
      e.charge=Math.max(0,e.charge-dt);speed=(ph===3?3.4:2.1)+(e.charge>0?11:0);
      e.atkT-=dt;
      if(e.atkT<=0){const ops=['stomp','volley','whistle'];if(ph===3)ops.push('charge','stomp');const a=pick(ops);e.atkT=ph===1?4.2:ph===2?3.3:2.6;
        if(a==='stomp'){e.lunge=1;shake=Math.max(shake,0.5);AU.at('slam',e.x,e.z,1.5);for(let k=0;k<(ph>=2?2:1);k++)L.waves.push({x:e.x,z:e.z,r:1,spd:10,delay:k*0.55,dmg:e.dmg*0.8,hit:false});}
        else if(a==='volley'){const n=ph+4,s2=11,sy=e.y+5,dd2=Math.hypot(P.x-e.x,P.z-e.z)||1;for(let k=0;k<n;k++){const ang=Math.atan2(P.x-e.x,P.z-e.z)+(k-(n-1)/2)*0.16;L.orbs.push({x:e.x,y:sy,z:e.z,vx:Math.sin(ang)*s2,vy:((P.y+1)-sy)/(dd2/s2),vz:Math.cos(ang)*s2,life:5,dmg:e.dmg*0.5});}AU.at('orb',e.x,e.z,1);}
        else if(a==='whistle'){AU.at('whistle',e.x,e.z,1.6);const pc=L.openCells.filter(i=>L.pool[i]);for(let k=0;k<Math.min(2+ph,16-L.ents.length);k++){const i=pick(pc);spawnEnt(ph>=2&&k%2?'sliver':'drowner',i%L.W,(i/L.W)|0,{rise:true,awake:true});}}
        else{e.charge=1.1;AU.at('whistle',e.x,e.z,1.2);}}
    }
    if(hasAff(e,'swift'))speed*=1.4;
    if(e.type==='jack'){if(e.hy<=0){const fr=Math.exp(-dt*8);e.vx*=fr;e.vz*=fr;}}
    else{const k=1-Math.exp(-dt*6);e.vx=lerp(e.vx,ddx*speed,k);e.vz=lerp(e.vz,ddz*speed,k);}
    moveBody(e,e.vx*dt,e.vz*dt,Math.min(e.r,0.4));
    e.spd=Math.hypot(e.vx,e.vz);
    const ty=(canSee||e.type==='echo')?Math.atan2(dx,dz):Math.atan2(e.vx,e.vz);e.yaw+=angDiff(e.yaw,ty)*Math.min(1,dt*(e.type==='lifeguard'&&e.seen?1:8));
    const gy=groundAt(e.x,e.z,0.2);e.y=lerp(e.y,(e.type==='gleam'||e.type==='sliver'||e.type==='balloonist')?Math.max(gy,WATER_Y):gy,Math.min(1,dt*8));
    if(e.reach&&dist<e.reach&&Math.abs(P.y-e.y)<2.2&&e.atkCd<=0&&!(e.type==='lifeguard'&&e.seen&&dist>1.1)){
      hurt(e.dmg*(e.elite?1.4:1),e);e.atkCd=e.type==='lifeguard'||e.type==='warden'?1.3:0.85;e.lunge=1;
      P.vx+=dx/(dist||1)*6;P.vz+=dz/(dist||1)*6;AU.at(e.type==='drowner'?'gurgle':'slam',e.x,e.z,1);}
    if(e.type==='drowner'&&Math.random()<dt*0.15&&dist<20)AU.at('gurgle',e.x,e.z,0.5);
  }
  const A=L.ents;for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const a=A[i],b=A[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=a.r+b.r;
    if(d<m&&d>0.001){const p=(m-d)*0.5/d;if(!blocked(a.x-dx*p,a.z-dz*p,0.35,a.y)){a.x-=dx*p;a.z-=dz*p;}if(!blocked(b.x+dx*p,b.z+dz*p,0.35,b.y)){b.x+=dx*p;b.z+=dz*p;}}}
  L.ents=L.ents.filter(e=>e.alive);
}
function echoBlink(e){
  for(let a=0;a<40;a++){const ang=P.yaw+Math.PI+rnd(-1.1,1.1),r=rnd(9,15);const x=P.x+Math.sin(ang)*r,z=P.z-Math.cos(ang)*r;const i=cidxW(x,z);if(i<0||wallAt(i)||L.dist[i]<0)continue;
    burst(...entCenter(e),[0.02,0.02,0.04],12,4,true);e.x=x;e.z=z;e.y=floorOf(i);e.seenT=0;e.vx=e.vz=0;AU.at('glitch',x,z,0.9);return;}
}
function gleamPop(e){const c=entCenter(e);burst(...c,[1,0.9,1],30,9);burst(...c,[0.6,0.95,1],20,6);AU.at('burst',e.x,e.z,1);
  if(Math.hypot(P.x-e.x,P.z-e.z)<3.4)hurt(e.dmg*(e.elite?1.4:1));killEnt(e,true);}
function updateOrbs(dt){
  for(const o of L.orbs){if(o.dead)continue;if(o.g)o.vy-=o.g*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt;o.life-=dt;
    const c=cidxW(o.x,o.z);const col=o.col||[1,0.5,0.85];
    if(o.life<=0||wallAt(c)||o.y>L.ceil[c]){o.dead=true;if(o.bomb)orbBoom(o);else burst(o.x,o.y,o.z,col,8,3);continue;}
    const fl=floorOf(c)+(o.r||0.15);
    if(o.y<fl){if(o.bomb){o.dead=true;orbBoom(o);continue;}if(o.bounce>0){o.y=fl;o.vy=Math.abs(o.vy)*0.68;o.bounce--;AU.at('boing',o.x,o.z,0.5);}else{o.dead=true;burst(o.x,o.y,o.z,col,8,3);continue;}}
    if(Math.hypot(o.x-P.x,o.y-(P.y+1.1),o.z-P.z)<0.75+(o.r||0)){o.dead=true;if(o.bomb)orbBoom(o);else{hurt(o.dmg);burst(o.x,o.y,o.z,col,12,4);}}}
  L.orbs=L.orbs.filter(o=>!o.dead);
  for(const w of L.waves){if(w.delay>0){w.delay-=dt;continue;}w.r+=w.spd*dt;const d=Math.hypot(P.x-w.x,P.z-w.z);if(!w.hit&&Math.abs(d-w.r)<0.7&&P.onGround){w.hit=true;hurt(w.dmg);P.vy=4;P.onGround=false;}}
  L.waves=L.waves.filter(w=>w.r<45);
}
function orbBoom(o){for(const c of BALLCOLS)burst(o.x,o.y,o.z,c,6,6);AU.at('balloonpop',o.x,o.z,1);if(Math.hypot(o.x-P.x,o.z-P.z)<2.6&&Math.abs(o.y-P.y)<2.5)hurt(o.dmg);}

// ============================================================ particles & pickups
function burst(x,y,z,col,n,sp,heavy){for(let k=0;k<n;k++){if(L.parts.length>170)L.parts.shift();const a=rnd(TAU),b=rnd(-1,1),s=rnd(0.3,1)*sp;
  L.parts.push({x,y,z,vx:Math.cos(a)*Math.sqrt(1-b*b)*s,vy:b*s+2,vz:Math.sin(a)*Math.sqrt(1-b*b)*s,life:rnd(0.4,1.1),max:1.1,col,s:heavy?rnd(0.08,0.16):rnd(0.04,0.09),g:heavy?14:7,a:1,solid:heavy});}}
function sparks(x,y,z,n,col){for(let k=0;k<n;k++){if(L.parts.length>170)L.parts.shift();L.parts.push({x,y,z,vx:rnd(-3,3),vy:rnd(0,4),vz:rnd(-3,3),life:rnd(0.15,0.4),max:0.4,col:col||[0.6,1,1],s:0.035,g:9,a:1});}}
function updateParts(dt){for(const p of L.parts){p.life-=dt;p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.grow)p.s+=p.grow*dt*0.2;
    if(p.fire){p.vx*=0.94;p.vy*=0.94;p.vz*=0.94;}
    const c=cidxW(p.x,p.z);if(c>=0&&!L.solid[c]&&p.y<floorOf(c)){p.y=floorOf(c);p.vy*=-0.3;p.vx*=0.6;p.vz*=0.6;}
    if(p.fire&&wallAt(c))p.life=Math.min(p.life,0.05);}
  L.parts=L.parts.filter(p=>p.life>0);}
function updatePickups(dt){
  for(const p of L.pickups){p.t+=dt;if(p.vy!==undefined){p.vy-=12*dt;p.y+=p.vy*dt;const fl=Math.max(floorOf(cidxW(p.x,p.z)),WATER_Y)+0.5;if(p.y<fl){p.y=fl;p.vy=0;}}
    const dx=P.x-p.x,dz=P.z-p.z,dy=P.y+1-p.y,d=Math.hypot(dx,dy,dz);
    if((p.type==='token'||p.type==='hp'||p.type==='ammo')&&d<P.magnet&&d>0.01){const s=Math.min(1,dt*9);p.x+=dx*s;p.z+=dz*s;p.y+=dy*s;}
    if(d<1.3){p.got=true;collect(p);}}
  L.pickups=L.pickups.filter(p=>!p.got);
}
function collect(p){
  if(p.type==='token'){const mult=1+Math.min(G.combo,12)*0.1;G.tokens+=1;G.score+=Math.round(10*mult);AU.play('coin');}
  else if(p.type==='hp'){P.hp=Math.min(P.maxHp,P.hp+25);AU.play('heal');}
  else if(p.type==='ammo'){grantAmmo(0.6,0.3);AU.play('ammo');}
  else if(p.type==='core'){L.coresGot++;G.score+=500;AU.play('core');flashA=0.35;buildCoreDots();
    if(L.coresGot>=L.coresNeed)startEscape();else toast('LUMEN CORE',`${L.coresGot} of ${L.coresNeed} recovered. The ${L.theme==='city'?'city':'water'} noticed.`);}
  else if(p.type==='tape'){if(!SAVE.tapes.includes(p.id)){SAVE.tapes.push(p.id);persist();}G.score+=300;AU.play('tape');
    toast(`MEMORY TAPE ${pad2(p.id+1)} / ${TAPES.length}`,'"'+TAPES[p.id]+'"','tape',11000);}
}
function startEscape(){L.escape=true;L.escT=0;L.spawnT=3;AU.play('alarm');AU.play('door');if(G.mode==='levels'&&G.floor<=10&&!L.arena)setTimeout(()=>attendant(pick(['The stairs are open. Everything leads down.','Down is the only way in.','Keep going. You are almost everywhere.'])),1800);
  banner('THE STAIRWAY OPENED',L.theme==='city'?'THE SUN IS GOING OUT \u00B7 GO DOWN':L.theme==='sky'?'THE SKY IS CLOSING \u00B7 GO DOWN':'THE LIGHTS ARE GOING OUT \u00B7 GO DOWN');toast('ALL CORES RECOVERED','A stairway opened in the floor. It is marked on your map. Go down before the dark finds you.');}
function updateLevel(dt){
  L.t+=dt;L.ftime+=dt;G.time+=dt;
  if(G.comboT>0){G.comboT-=dt;if(G.comboT<=0)G.combo=0;}
  updateDread(dt);
  if(G.mode==='death'){updateRounds(dt);return;}
  if(L.escape){L.escT+=dt;L.black=Math.min(0.72,L.escT/28);}
  L.spawnT-=dt;const cap=Math.min(6+G.floor*2,24)+(L.escape?6:0);
  if(L.spawnT<=0&&!L.arena&&!L.ending){L.spawnT=L.escape?5:Math.max(7,22-G.floor*1.3);if(L.ents.length<cap)spawnRandom(false);}
  if(L.escape)L.stairOpen=Math.min(1,L.stairOpen+dt*0.6);
  if(L.stairOpen>0.98&&cidxW(P.x,P.z)===L.exit.cell&&P.y<-3.0){flashA=1;completeFloor();}
  if(G.floor<=10&&!L.ending){L.attT-=dt;if(L.attT<=0){L.attT=rnd(60,95);attendant(pick(ATT_LINES));}}
  if(L.ending&&L.npc&&Math.hypot(P.x-L.npc.x,P.z-L.npc.z)<2.6)beginEnding();
}
function updateDread(dt){
  const base=L.ending?0:L.arena?0.3:G.mode==='death'?Math.min(0.85,(G.round-1)*0.07):Math.min(0.75,(G.floor-1)*0.09+L.ftime/240*0.25);
  G.dreadSpike=Math.max(0,G.dreadSpike-dt*0.3);
  L.dread=clamp(base+(L.escape?0.25:0)+G.dreadSpike*0.35,0,1);
  const dr=L.dread;
  L.phT-=dt;if(dr>0.25&&L.phT<=0){L.phT=rnd(12,26)*(1.4-dr);spawnPhantom();}
  for(const p of L.phantoms){p.life-=dt;const ex=p.x-P.x,ez=p.z-P.z,el=Math.hypot(ex,ez)||1;const dot=(ex*Math.sin(P.yaw)-ez*Math.cos(P.yaw))/el;
    if(dot>0.94&&los(P.x,P.z,p.x,p.z)){p.life=0;burst(p.x,1,p.z,[0.02,0.02,0.03],16,3,true);AU.play('sting');G.dreadSpike=Math.min(1,G.dreadSpike+0.3);}}
  L.phantoms=L.phantoms.filter(p=>p.life>0);
  const poolish=L.theme==='pool'&&!L.ending;
  L.boT-=dt;if((poolish||dr>0.4)&&L.boT<=0){L.boT=poolish?rnd(20,36):rnd(18,35)*(1.3-dr);L.bpulse=poolish?rnd(1.8,3.4):rnd(0.5,1.1);AU.play('powerdown');}
  const wasB=L.bpulse>0;L.bpulse=Math.max(0,L.bpulse-dt);if(wasB&&L.bpulse<=0)AU.play('powerup');
  const flick=L.bpulse>0&&L.bpulse<0.7&&Math.random()<0.45;
  L.bk=L.bpulse>0&&!flick?Math.max(L.black,0.98):L.black;
  L.whT=(L.whT===undefined?rnd(8,16):L.whT)-dt;if(L.whT<=0){L.whT=rnd(20,34);if(L.odd&&L.odd.some(o=>o.type==='whale'))AU.play('whale',0.8,rnd(-0.8,0.8));}
  L.txtT-=dt;if(dr>0.35&&L.txtT<=0){L.txtT=rnd(20,40);G.creepy={txt:pick(CREEPY),t:1.3};AU.play('whisper');}
  if(G.creepy){G.creepy.t-=dt;if(G.creepy.t<=0)G.creepy=null;}
  if(dr>0.3&&Math.random()<dt*0.05*dr)AU.play('whisper');
  let near=99;for(const e of L.ents){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<near)near=d;}
  L.hbT=(L.hbT||0)-dt;if(near<12&&dr>0.2&&L.hbT<=0){L.hbT=1.0-dr*0.45-(12-near)*0.02;AU.play('heart',0.4+dr*0.6);}
  if(dr>0.5&&Math.random()<dt*0.04){const a=P.yaw+Math.PI+rnd(-0.6,0.6);for(let k=0;k<3;k++)setTimeout(()=>AU.at('step',P.x+Math.sin(a)*4,P.z-Math.cos(a)*4,1.4),k*420);}
  if(L.theme==='dream'){
    if(L.trip){L.trip.t-=dt;if(L.trip.t<=0){L.trip=null;G.grav=22;G.tscale=1;}}
    else{L.tripT-=dt*(1+dr);if(L.tripT<=0){L.tripT=rnd(20,32);const ty=pick(Object.keys(TRIPS));L.trip={type:ty,t:ty==='mirror'||ty==='invert'?5:7};
      G.grav=ty==='lowgrav'?7:22;G.tscale=ty==='slowmo'?0.45:1;banner('TRIP: '+TRIPS[ty][0],TRIPS[ty][1]);AU.play('trip');if(Math.random()<0.6)AU.play('laugh',0.6);}}
    if(Math.random()<dt*0.03)AU.play('laugh',0.25+dr*0.4,rnd(-1,1));
  }
}
function spawnPhantom(){
  for(let a=0;a<30;a++){const side=Math.random()<0.5?-1:1;const ang=P.yaw+side*rnd(0.55,1.0);const r=rnd(11,19);const x=P.x+Math.sin(ang)*r,z=P.z-Math.cos(ang)*r;const i=cidxW(x,z);
    if(i<0||wallAt(i)||!los(P.x,P.z,x,z))continue;L.phantoms.push({x,z,y:floorOf(i),life:rnd(3,6),yaw:Math.atan2(P.x-x,P.z-z),anim:0});return;}
}
function updateRounds(dt){
  const R=G.round;
  if(!G.inRound){G.breakT-=dt;L.black=Math.max(0,L.black-dt*0.2);
    if(G.breakT<=0){G.round++;G.inRound=true;G.toSpawn=5+G.round*3;G.toKill=G.toSpawn;L.spawnT=1.5;
      banner('ROUND '+G.round,G.round===1?(L.theme==='dream'?'THE SHOW IS ABOUT TO BEGIN':'THEY COME UP FROM THE WATER'):G.round%5===0?'SWARM ROUND \u00B7 THEY COME IN SCHOOLS':pick(['THE LIGHTS FLICKER','SOMETHING IS SWIMMING','DO NOT STAY AFTER CLOSING','THE DEEP END IS DEEPER']));AU.play('round');}
    return;}
  L.black=Math.min(0.45,0.05+R*0.03)*(0.6+0.4*Math.sin(L.t*0.3));
  L.spawnT-=dt;const cap=Math.min(6+R*2,24);
  if(G.toSpawn>0&&L.spawnT<=0&&L.ents.length<cap){const n=spawnRandom(false);if(n){G.toSpawn--;G.toKill+=n-1;}L.spawnT=Math.max(0.5,2.4-R*0.12);}
  if(G.toSpawn<=0&&L.ents.length===0){G.inRound=false;G.breakT=10;G.score+=250*R;AU.play('roundEnd');toast('ROUND '+R+' SURVIVED',`+${250*R} score. Next round in 10 seconds.`);
    SAVE.bestRound=Math.max(SAVE.bestRound||0,R);persist();}
}

// ============================================================ death mode interaction
function stationInfo(s){
  if(s.type==='ammo')return {label:'Ammo Vending \u00B7 refill all weapons',cost:350};
  if(s.type==='terminal')return {label:'Hydro Terminal \u00B7 random augmentation',cost:1500+G.termBought*500};
  const id=ORDER.find(i=>!owned(i));
  return id?{label:`Weapon Locker \u00B7 ${WDEF[id].name} (${ELEM[WDEF[id].elem].n})`,cost:1000,id}:{label:'Weapon Locker \u00B7 refill all weapons',cost:350};
}
function findInteract(){
  if(G.mode!=='death')return null;
  for(const d of L.doors){if(d.open)continue;for(const i of d.cells){const cx=(i%L.W)*CELL+2,cz=((i/L.W)|0)*CELL+2;
    const ox=Math.max(0,Math.abs(P.x-cx)-2),oz=Math.max(0,Math.abs(P.z-cz)-2);if(Math.hypot(ox,oz)<1.1)return {kind:'door',d,label:'Open '+d.name,cost:750+G.doorsBought*250};}}
  for(const s of L.stations){if(Math.hypot(P.x-s.x,P.z-s.z)<2.1){const inf=stationInfo(s);return {kind:'station',s,...inf};}}
  return null;
}
function interact(){
  const it=findInteract();if(!it)return;
  if(G.tokens<it.cost){AU.play('deny');showEff('NOT ENOUGH POINTS','#ffb4b4');return;}
  G.tokens-=it.cost;AU.play('buy');
  if(it.kind==='door'){it.d.open=true;G.doorsBought++;for(const i of it.d.cells){L.lock[i]=0;const x=(i%L.W)*CELL+2,z=((i/L.W)|0)*CELL+2;burst(x,1.5,z,[0.6,1,1],20,5);}
    computeFlow();flashA=0.25;toast('DOOR OPENED',it.d.name+' is now part of the Death Pool.');AU.play('door');}
  else{const s=it.s;
    if(s.type==='ammo'||(!it.id&&s.type==='weapon')){P.arsenal.forEach(w=>{w.res=Math.max(w.res,WDEF[w.id].res);w.mag=magCap(w.id);});toast('AMMO REFILLED','All weapons topped up.');}
    else if(s.type==='weapon')giveWeapon(it.id);
    else{G.termBought++;const u=pick(upgPool());u.f();G.upg[u.id]=(G.upg[u.id]||0)+1;toast('AUGMENTATION \u00B7 '+u.n,u.d,'',7000);flashA=0.25;}}
}
