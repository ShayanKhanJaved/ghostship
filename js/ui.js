// ORHANGE - UI: HUD, minimap, screens, shop, story interludes, narration voice and the ending
'use strict';
// ============================================================ minimap & hud
const mini=$('mini'),mctx=mini.getContext('2d');
function drawMini(){
  const Wc=mini.width,s=5.5;mctx.clearRect(0,0,Wc,Wc);mctx.save();mctx.beginPath();mctx.arc(Wc/2,Wc/2,Wc/2,0,TAU);mctx.clip();
  mctx.fillStyle='rgba(2,30,40,.55)';mctx.fillRect(0,0,Wc,Wc);
  mctx.translate(Wc/2,Wc/2);mctx.rotate(-P.yaw);
  const px=P.x/CELL,pz=P.z/CELL,R=19,city=L.theme==='city';
  for(let y=Math.floor(pz-R);y<=pz+R;y++)for(let x=Math.floor(px-R);x<=px+R;x++){const i=cidx(x,y);if(i<0||L.solid[i])continue;
    const show=L.seen[i]||(L.death&&(L.dist[i]>=0||L.lock[i]));if(!show)continue;
    mctx.fillStyle=L.lock[i]?'rgba(90,240,255,.9)':L.pool[i]?'rgba(70,200,255,.75)':city&&L.grass[i]?'rgba(120,230,130,.6)':L.theme==='dream'?'rgba(255,170,235,.6)':L.theme==='sky'?'rgba(170,225,255,.75)':'rgba(215,248,255,.55)';mctx.fillRect((x-px)*s,(y-pz)*s,s+0.5,s+0.5);}
  const dot=(wx,wz,c,r)=>{let dx=(wx/CELL-px)*s,dz=(wz/CELL-pz)*s;const dl=Math.hypot(dx,dz),mx=Wc/2-8;if(dl>mx){dx*=mx/dl;dz*=mx/dl;}mctx.fillStyle=c;mctx.beginPath();mctx.arc(dx,dz,r,0,TAU);mctx.fill();};
  for(const p of L.pickups){const i=cidxW(p.x,p.z);if(p.type==='core'&&(P.sonar||L.seen[i]))dot(p.x,p.z,'#7ff2ff',4);if(p.type==='tape'&&(P.sonar||L.seen[i]))dot(p.x,p.z,'#ffb04a',3);}
  for(const st of L.stations)if(L.dist[cidxW(st.x,st.z)]>=0)dot(st.x,st.z,st.type==='ammo'?'#5fe0ff':st.type==='terminal'?'#7dff9a':'#ffa64a',3.5);
  if(L.exit&&(L.escape||P.sonar||L.seen[L.exit.cell]))dot(L.exit.x,L.exit.z,L.escape?(frameN%30<15?'#7dff9a':'#2fd060'):'#5a9a8a',5);
  for(const e of L.ents){const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<16&&e.spd>0.6&&e.type!=='echo')dot(e.x,e.z,`rgba(255,60,90,${0.5+0.5*Math.sin(T*8)})`,3);}
  mctx.restore();
  mctx.save();mctx.translate(Wc/2,Wc/2);mctx.fillStyle='#fff';mctx.beginPath();mctx.moveTo(0,-8);mctx.lineTo(6,6);mctx.lineTo(0,3);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.restore();
  const gr=mctx.createLinearGradient(0,0,0,Wc*0.5);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');mctx.fillStyle=gr;mctx.beginPath();mctx.ellipse(Wc/2,Wc*0.25,Wc*0.38,Wc*0.2,0,0,TAU);mctx.fill();
}
const hudEls={};['hpLiq','hpTxt','stamFill','magFill','relFill','wstate','elem','score','tokens','combo','sector','objTxt','dmg','flash','hitmark','ammoMag','ammoRes','ammoPlus','wName','wSub','eff','prompt'].forEach(k=>hudEls[k]=$(k));
function buildCoreDots(){$('coreDots').innerHTML=Array.from({length:L.coresNeed},(_,i)=>`<span class="cdot ${i<L.coresGot?'on':''}"></span>`).join('');}
function renderSlots(){$('slots').innerHTML=ORDER.map((id,i)=>{const own=P.arsenal.findIndex(s=>s.id===id);const on=own>=0&&own===P.cur;
  return `<span class="slot ${on?'on':''} ${own<0?'lock':''}">${i+1} ${own<0?'\u00B7\u00B7\u00B7':WDEF[id].icon}</span>`;}).join('');}
function showEff(txt,col){const e=hudEls.eff;if(e.textContent!==txt)e.textContent=txt;e.style.color=col;effA=1;}
let lastPrompt='';
function updateHUD(dt){
  const h=hudEls,hp=P.hp/P.maxHp;
  h.hpLiq.style.height=(hp*100)+'%';h.hpLiq.style.filter=hp<0.35?'hue-rotate(-120deg) saturate(1.6)':'none';h.hpTxt.textContent=Math.ceil(P.hp);
  h.stamFill.style.height=(P.sta/P.maxSta*100)+'%';
  const s=curSlot(),d=WDEF[s.id],cap=magCap(s.id),fr=s.mag/cap;
  h.wName.textContent=d.name;h.wSub.textContent=d.sub;
  h.ammoMag.textContent=Math.ceil(s.mag-0.001);h.ammoMag.classList.toggle('low',fr<0.25);h.ammoRes.textContent=Math.floor(s.res);
  h.magFill.style.width=(fr*100)+'%';h.magFill.style.background=`linear-gradient(180deg,#fff,${ELEM[d.elem].c} 55%,${ELEM[d.elem].c})`;
  h.relFill.style.width=W.reloadT>0?((1-W.reloadT/W.reloadDur)*100)+'%':'0';
  h.wstate.textContent=W.reloadT>0?'RELOADING\u2026':s.mag<=0.01&&s.res<=0?'EMPTY':fr<0.25&&s.res>0?'RELOAD [R]':W.firing?'FIRING':'READY';
  h.elem.textContent=ELEM[d.elem].n+' \u00B7 best vs '+BEST[s.id];
  plusA=Math.max(0,plusA-dt);h.ammoPlus.style.opacity=Math.min(1,plusA);
  h.score.textContent=G.score.toLocaleString();h.tokens.textContent=Math.floor(G.tokens).toLocaleString()+(G.mode==='death'?' pts':'');
  if(G.combo>1){h.combo.classList.remove('hidden');h.combo.textContent='\u00D7'+(1+Math.min(G.combo-1,12)*0.25).toFixed(2)+' \u00B7 '+G.combo+' chain';}else h.combo.classList.add('hidden');
  if(G.mode==='death'){h.sector.textContent=(L.theme==='dream'?'DEATH FUNHOUSE':'DEATH POOL')+' \u00B7 ROUND '+G.round;h.objTxt.textContent=G.inRound?`${G.toKill} entities remain`:`Next round in ${Math.ceil(G.breakT)}s`;}
  else{h.sector.textContent=L.ending?'THE SHALLOW END':'SECTOR '+pad2(G.floor)+(L.theme==='city'?' \u00B7 CITY':L.theme==='dream'?' \u00B7 FUNHOUSE':L.theme==='sky'?' \u00B7 SKY':'');h.objTxt.textContent=L.ending?'Walk to the end of the pool':L.escape?'Take the stairway down':L.arena?'Silence the 21st Lifeguard':'Recover the Lumen Cores';}
  if(G.creepy){h.objTxt.textContent=G.creepy.txt;h.objTxt.classList.add('creepy');}else h.objTxt.classList.remove('creepy');
  const nb=Math.round((L.dread||0)*5);if(h._nb!==nb){h._nb=nb;$('dreadBars').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<nb?'on':''}"></i>`).join('');}
  const it=findInteract();
  if(it){const txt=it.label+' \u00B7 '+it.cost.toLocaleString()+' pts';if(txt!==lastPrompt){lastPrompt=txt;h.prompt.innerHTML='';h.prompt.append(Object.assign(document.createElement('kbd'),{textContent:'E'}),' '+txt);}
    h.prompt.classList.remove('hidden');h.prompt.classList.toggle('poor',G.tokens<it.cost);}
  else{h.prompt.classList.add('hidden');lastPrompt='';}
  const bb=$('bossbar');if(L.boss&&L.boss.alive){bb.classList.remove('hidden');$('bossFill').style.width=(Math.max(0,L.boss.hp)/L.boss.maxhp*100)+'%';const hal=L.ents.filter(o=>o.type==='halo'&&o.alive).length;
    $('bossShield').textContent=hal?`HALO INTACT \u00B7 ${hal} LIGHT${hal>1?'S':''} LEFT`:`HALO BROKEN \u00B7 ${Math.max(0,Math.ceil(L.boss.shieldT))}s`;}else bb.classList.add('hidden');
  dmgA=Math.max(0,dmgA-dt*1.6);flashA=Math.max(0,flashA-dt*2.5);hitA=Math.max(0,hitA-dt*6);shake=Math.max(0,shake-dt*1.8);effA=Math.max(0,effA-dt*1.2);
  h.dmg.style.opacity=Math.max(dmgA,hp<0.3?0.25+0.15*Math.sin(T*6):0);h.flash.style.opacity=flashA;h.hitmark.style.opacity=hitA;h.eff.style.opacity=Math.min(1,effA*1.5);
  if(frameN%2===0)drawMini();
}
let bannerT=0;
function banner(a,b){$('bigTxt').textContent=a;$('subTxt').textContent=b;$('banner').style.opacity=1;clearTimeout(bannerT);bannerT=setTimeout(()=>$('banner').style.opacity=0,3000);}
function toast(title,body,kind,ms){const d=document.createElement('div');d.className='glass toast '+(kind||'');d.innerHTML=`<h4></h4><div></div>`;d.querySelector('h4').textContent=title;d.querySelector('div').textContent=body;
  $('toasts').appendChild(d);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>d.remove(),ms||5500);}

// ============================================================ flow: screens
function showScreen(id){for(const s of ['title','pause','shop','dead','interlude','ending','mapScreen'])$(s).classList.toggle('hidden',s!==id);
  $('hud').classList.toggle('hidden',!(state==='play'||state==='pause'));$('bubbles').classList.toggle('hidden',id!=='title');$('lockMsg').classList.add('hidden');}
function renderTitleStats(){$('titleStats').innerHTML=(SAVE.storyDone?'<span class="glass pill">Story complete \u2713</span>':'')+`<span class="glass pill">Deepest sector \u00B7 ${SAVE.bestFloor||'\u2014'}</span><span class="glass pill">Best Death Pool round \u00B7 ${SAVE.bestRound||'\u2014'}</span><span class="glass pill">Best score \u00B7 ${(SAVE.bestScore||0).toLocaleString()}</span><span class="glass pill">Memory tapes \u00B7 ${SAVE.tapes.length}/${TAPES.length}</span>`;}
function renderChart(){const types=ETYPES;let h='<span></span>'+types.map(t=>`<b>${ENAME[t].toUpperCase()}</b>`).join('');
  for(const id of ORDER){const el=WDEF[id].elem;h+=`<b>${WDEF[id].name}${owned(id)?'':' \uD83D\uDD12'}</b>`+types.map(t=>{const m=AFF[el][t];return `<span class="${m>=1.5?'g':m<0.8?'r':'n'}">${m>=1.5?'WEAK ':m<0.8?'RESIST ':''}\u00D7${m}</span>`;}).join('');}
  $('chart').innerHTML=h;}
function requestLock(){try{const r=document.documentElement.requestPointerLock();if(r&&r.catch)r.catch(()=>onLockFail());}catch(e){onLockFail();}}
function onLockFail(){lockFails++;if(lockFails>=2){fallbackLook=true;document.body.style.cursor='none';$('lockMsg').classList.add('hidden');}}
document.addEventListener('pointerlockerror',onLockFail);
document.addEventListener('pointerlockchange',()=>{const locked=!!document.pointerLockElement;if(locked){lockFails=0;$('lockMsg').classList.add('hidden');}
  else if(state==='play'&&!fallbackLook)pauseGame();});
function pauseGame(){if(state!=='play')return;state='pause';mouseL=false;AU.laser(false,0);AU.flame(false);renderChart();showScreen('pause');}
function resumeGame(){state='play';showScreen(null);if(!fallbackLook)requestLock();}
function completeFloor(){
  state='shop';mouseL=false;AU.laser(false,0);AU.flame(false);AU.play('descend');
  const tb=Math.max(0,Math.round((240-L.ftime)*8));const bonus=500*G.floor+tb;G.score+=bonus;
  if(document.pointerLockElement)document.exitPointerLock();
  SAVE.bestFloor=Math.max(SAVE.bestFloor,G.floor+1);persist();
  const newW=ORDER.find(i=>!owned(i));
  $('shopTitle').textContent=`Hydro Terminal \u2014 Sector ${pad2(G.floor)} cleared`;
  $('shopSum').innerHTML=`<span class="glass pill">Clear bonus +${(500*G.floor).toLocaleString()}</span><span class="glass pill">Speed bonus +${tb.toLocaleString()}</span><span class="glass pill">Score ${G.score.toLocaleString()}</span><span class="glass pill" id="tokPill">\u25C9 ${G.tokens} tokens</span>`;
  G.draws=0;G.freePick=true;$('shopMsg').textContent='';
  if(newW){giveWeapon(newW,true);P.cur=P.arsenal.findIndex(s=>s.id===newW);renderSlots();const d=WDEF[newW];
    $('shopMsg').textContent=`> Sector reward: ${d.name} (${ELEM[d.elem].n}, best vs ${BEST[newW]}). Now pick one augmentation.`;}
  dealCards();showScreen('shop');
}
const UPG=[
 {id:'lens',ic:'\u25CE',n:'Focused Lens',d:'+25% damage with every weapon.',f:()=>W.dmgMul*=1.25},
 {id:'loader',ic:'\u21BB',n:'Speed Loader',d:'Reload 30% faster.',max:3,f:()=>W.reloadMul*=0.7},
 {id:'res',ic:'\u25AE',n:'Deep Magazines',d:'+35% magazine size on every weapon.',max:3,f:()=>{W.magMul*=1.35;P.arsenal.forEach(s=>s.mag=magCap(s.id));}},
 {id:'bounce',ic:'\u21AF',n:'Wet Tile Theory',d:'Laser beams and scattergun pellets ricochet off tiles once more.',max:3,f:()=>W.bounces++},
 {id:'split',ic:'\u22D4',n:'Prism Split',d:'The PRISM-9 fires two extra side-beams at 35% damage.',max:2,f:()=>W.split++},
 {id:'tune',ic:'\u2726',n:'Elemental Tuning',d:'Weak-point hits deal 40% more damage.',max:3,f:()=>W.tune*=1.4},
 {id:'hp',ic:'\u271A',n:'Lifeguard Certification',d:'+25 max health and a full heal.',f:()=>{P.maxHp+=25;P.hp=P.maxHp;}},
 {id:'lungs',ic:'\u2248',n:'Chlorine Lungs',d:'+12% move speed, +40% stamina.',max:4,f:()=>{P.speedMul*=1.12;P.maxSta*=1.4;}},
 {id:'leech',ic:'\u2665',n:'Osmosis',d:'Heal 1 HP for every 50 damage you deal.',max:3,f:()=>W.leech++},
 {id:'cap',ic:'\u03DF',n:'Capacitor Bank',d:'Laser pulse deals 50% more and costs 20% less charge.',max:3,f:()=>{W.pulseDmg*=1.5;W.pulseCost*=0.8;}},
 {id:'sonar',ic:'\u25C9',n:'Sonar Ping',d:'Cores, tapes and the drain always show on your map.',max:1,levels:true,f:()=>P.sonar=true},
 {id:'dash',ic:'\u27A4',n:'Riptide Dash',d:'Press Q to dash. Each level shortens the recharge.',max:3,f:()=>P.dash++},
 {id:'nova',ic:'\u273A',n:'Steam Vent',d:'Reloading scalds everything within 6 m.',max:2,f:()=>W.nova++},
 {id:'mag',ic:'\u229B',n:'Undertow',d:'Pickups drift to you from farther away.',max:2,f:()=>P.magnet*=2},
 {id:'greed',ic:'\u25C8',n:'Lost & Found',d:'+50% tokens, points and ammo from kills.',max:3,f:()=>{P.greed+=0.5;W.ammoMul+=0.5;}},
];
function upgPool(){return UPG.filter(u=>!(u.max&&(G.upg[u.id]||0)>=u.max)&&!(u.levels&&G.mode==='death'));}
function dealCards(){
  const avail=shuffle(upgPool()).slice(0,3);
  const c=$('cards');c.innerHTML='';
  for(const u of avail){const b=document.createElement('button');b.className='glass card';const lv=G.upg[u.id]||0;
    b.innerHTML=`<span class="ic"></span><span class="lv"></span><h3></h3><p></p>`;b.querySelector('.ic').textContent=u.ic;b.querySelector('.lv').textContent=lv?`LEVEL ${lv} \u2192 ${lv+1}`:'NEW';
    b.querySelector('h3').textContent=u.n;b.querySelector('p').textContent=u.d;
    b.onclick=()=>{if(!G.freePick)return;G.freePick=false;u.f();G.upg[u.id]=lv+1;AU.play('core');[...c.children].forEach(x=>x.classList.add('taken'));b.classList.remove('taken');b.style.outline='3px solid #fff';
      $('shopMsg').textContent='> Augmentation installed: '+u.n+'.';refreshShop();};
    c.appendChild(b);}
  if(!$('shopMsg').textContent.includes('Sector reward'))$('shopMsg').textContent='> Select one augmentation. Additional draws cost tokens.';refreshShop();
}
function drawCost(){return 12+G.draws*8;}
function refreshShop(){$('btnReroll').textContent=`Draw again \u00B7 ${drawCost()} \u25C9`;$('btnReroll').disabled=G.freePick||G.tokens<drawCost();$('btnHeal').disabled=G.tokens<8||P.hp>=P.maxHp;
  $('btnHeal').textContent=`Medkit +40 HP \u00B7 8 \u25C9 (${Math.ceil(P.hp)}/${P.maxHp})`;$('btnAmmo').textContent='Ammo crate \u00B7 6 \u25C9';$('btnAmmo').disabled=G.tokens<6;
  const tp=$('tokPill');if(tp)tp.textContent=`\u25C9 ${G.tokens} tokens`;}
function die(){
  state='dead';mouseL=false;AU.laser(false,0);AU.flame(false);AU.play('death');if(document.pointerLockElement)document.exitPointerLock();
  SAVE.bestScore=Math.max(SAVE.bestScore,G.score);if(G.mode==='death')SAVE.bestRound=Math.max(SAVE.bestRound||0,G.round);else SAVE.bestFloor=Math.max(SAVE.bestFloor,G.floor);persist();
  $('deadMsg').textContent=pick(['> You were absorbed into the water.','> The tiles have one more pattern now.','> Lifeguard roster updated: 22 names.','> Please walk. Do not run. Do not stay.']);
  $('deadSum').innerHTML=(G.mode==='death'?`<span class="glass pill">Death Pool \u00B7 round ${G.round}</span><span class="glass pill">Best round ${SAVE.bestRound}</span>`:`<span class="glass pill">Sector ${G.floor}</span>`)+
    `<span class="glass pill">Score ${G.score.toLocaleString()}</span><span class="glass pill">${G.kills} entities dissolved</span><span class="glass pill">Weapons ${P.arsenal.length}/4</span>`;
  $('btnCheckpoint').classList.toggle('hidden',G.mode!=='levels');$('btnCheckpoint').textContent='Retry Sector '+pad2(G.floor);
  setTimeout(()=>{if(state==='dead')showScreen('dead');},700);
}
function toTitle(){state='title';$('flash').style.transition='';$('flash').style.opacity=0;genLevel(1,pick(['pool','dream']));L.black=0;renderTitleStats();showScreen('title');if(document.pointerLockElement)document.exitPointerLock();}
