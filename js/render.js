// ORHANGE - Render: lighting selection, the frame renderer, and every model drawn in the world
'use strict';
// ============================================================ lights & render
function gatherLights(cam){
  const out=[];const bl=L.bk,t=L.t,dr=L.dread||0;
  const dims=L.ents.filter(e=>e.type==='ballast'||e.type==='lifeguard'||e.type==='echo').map(e=>[e.x,e.y+(e.type==='ballast'?e.hover:2.5),e.z,e.type==='ballast'?7:e.type==='echo'?6:4]);
  dims.sort((a,b)=>Math.hypot(a[0]-cam.x,a[2]-cam.z)-Math.hypot(b[0]-cam.x,b[2]-cam.z));L.dims=dims.slice(0,4);
  for(const l of L.lights){const d=Math.hypot(l.x-cam.x,l.z-cam.z);if(d>17)continue;
    let on=1;if(l.st===2)on=0;else if(l.st===1)on=(Math.sin(t*23+l.ph*40)>-0.3&&Math.sin(t*3.1+l.ph*17)>-0.6)?1:0;
    if(l.ph<bl)on=0;
    if(frac(l.ph*7.31+Math.floor(t*6)*0.6180339)<dr*0.3)on=0;
    for(let k=0;k<L.dims.length;k++){const D=L.dims[k];if(Math.hypot(l.x-D[0],l.y+0.3-D[1],l.z-D[2])<D[3])on*=frac(t*6.7+l.ph*3.3+k*0.37)>=0.45?1:0;}
    if(on>0)out.push({p:[l.x,l.y,l.z],c:[1.45,1.4,1.28],d});}
  for(const l of L.lamps){const d=Math.hypot(l.x-cam.x,l.z-cam.z);if(d>18||l.ph<bl)continue;const c=pal(l.ph+t*0.08);out.push({p:[l.x,l.y+Math.sin(t+l.ph*9)*0.3,l.z],c:c.map(v=>v*1.5+0.2),d});}
  const dyn=[];const dd=(x,z)=>Math.hypot(x-cam.x,z-cam.z);
  const s=P&&P.arsenal.length?curSlot():null;const d=WDEF[s?s.id:'laser'];
  dyn.push({p:[cam.x,cam.y-0.3,cam.z],c:W&&W.firing?(d.kind==='flame'?[1.2,0.6,0.2]:d.kind==='beam'?[0.3,0.85,0.95]:[0.4,0.4,0.5]):(L.bk>0.9?[0.26,0.3,0.34]:[0.12,0.22,0.24]),d:0});
  if(L.exit){const op=L.stairOpen>0.5;dyn.push({p:[L.exit.x,op?-1.5:0.6,L.exit.z],c:op?[0.6,1.5,1.1]:[0.25,0.5,0.5],d:dd(L.exit.x,L.exit.z)});}
  for(const p of L.pickups)if(p.type==='core')dyn.push({p:[p.x,p.y,p.z],c:[0.4,1.3,1.6],d:dd(p.x,p.z)});
  for(const st of L.stations)dyn.push({p:[st.x,2.2,st.z],c:st.type==='ammo'?[0.3,0.9,1.1]:st.type==='terminal'?[0.4,1.2,0.5]:[1.2,0.7,0.3],d:dd(st.x,st.z)+3});
  for(const o of L.orbs)if(!o.col)dyn.push({p:[o.x,o.y,o.z],c:[1.2,0.45,0.9],d:dd(o.x,o.z)});
  for(const e of L.ents){if(e.type==='halo')dyn.push({p:[e.x,e.y+6.9,e.z],c:[0.9,1,0.95],d:dd(e.x,e.z)});if(e.type==='warden')dyn.push({p:[e.x,e.y+4,e.z+0.4],c:[1,0.3,0.4],d:dd(e.x,e.z)});}
  for(const e of L.ents)if(e.type==='ballast')dyn.push({p:[e.x,e.y+e.hover,e.z],c:Math.sin(L.t*31+e.x)>0?[0.9,1,0.95]:[0.2,0.25,0.25],d:dd(e.x,e.z)});
  for(const b of bolts)dyn.push({p:b.pts[b.pts.length-1],c:[1.2,0.9,1.8],d:0});
  if(tracers.length&&state==='play')dyn.push({p:gunMuzzle(cam),c:[1.4,1.1,0.6],d:0});
  if(pulseDraw&&pulseDraw.segs.length){const sg=pulseDraw.segs[pulseDraw.segs.length-1];dyn.push({p:[sg[3],sg[4],sg[5]],c:[1,2,2.2],d:0});}
  dyn.sort((a,b)=>a.d-b.d);out.sort((a,b)=>a.d-b.d);L.litNow=out;
  const sel=dyn.filter(l=>l.d<16).slice(0,7);for(const l of out){if(sel.length>=MAXL)break;sel.push(l);}
  const LP=new Array(MAXL*3).fill(0),LC=new Array(MAXL*3).fill(0);
  sel.forEach((l,i)=>{LP[i*3]=l.p[0];LP[i*3+1]=l.p[1];LP[i*3+2]=l.p[2];LC[i*3]=l.c[0];LC[i*3+1]=l.c[1];LC[i*3+2]=l.c[2];});
  const DM=new Array(16).fill(0);L.dims.forEach((dm,i)=>{DM[i*4]=dm[0];DM[i*4+1]=dm[1];DM[i*4+2]=dm[2];DM[i*4+3]=dm[3];});
  return {LP,LC,DM};
}
function getCam(){
  if(state==='title'||state==='ending'||(state==='interlude'&&P&&P.x===0&&P.z===0)){const s=L.start;titleCam.yaw+=deltaTime/1000*0.07;const yaw=titleCam.yaw;const b=camBasis(yaw,0.05+Math.sin(T*0.2)*0.05);
    return {x:s[0]*CELL+2,y:1.6,z:s[1]*CELL+2,...b};}
  const sx=(Math.random()-0.5)*shake*0.25,sy=(Math.random()-0.5)*shake*0.25;
  const bob=P.onGround?Math.sin(P.bobT*2)*0.045*Math.min(1,Math.hypot(P.vx,P.vz)/5):0;
  const b=camBasis(P.yaw+sx*0.3,P.pitch+sy*0.3);
  return {x:P.x+b.r[0]*sx,y:P.y+EYE+bob+sy,z:P.z+b.r[2]*sx,...b,bob};
}
function part(geom,mat,xf,col,hit,alpha){
  SH.setUniform('uModel',xf.m);SH.setUniform('uModelN',xf.n);SH.setUniform('uMat',mat);
  SH.setUniform('uCol',col||[1,1,1]);SH.setUniform('uHit',hit||0);SH.setUniform('uAlpha',alpha===undefined?1:alpha);model(geom);
}
function beamXf(a,b,th){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const len=Math.hypot(...d)||0.001;const u=d.map(v=>v/len);
  let x=Math.abs(u[1])<0.9?[u[2],0,-u[0]]:[1,0,0];const xl=Math.hypot(...x);x=x.map(v=>v/xl);const z=[u[1]*x[2]-u[2]*x[1],u[2]*x[0]-u[0]*x[2],u[0]*x[1]-u[1]*x[0]];
  return Xf.basis(x.map(v=>v*th),d,z.map(v=>v*th),[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]);}

function render(){
  const cam=getCam();const th=L.theme,city=th==='city',dream=th==='dream',sky=th==='sky';
  const k=L.bk/0.72;const dr=state==='title'?0:(L.dread||0);
  let fog;
  if(city||sky)fog=L.fogBase.map((v,i)=>lerp(v,[0.06,0.04,0.09][i],Math.min(1,k*1.1)));
  else if(dream){const pc=pal(L.t*0.02);fog=pc.map((v,i)=>lerp(v*0.4+0.42,[0.05,0.02,0.06][i],Math.min(1,k*1.1)));}
  else fog=[lerp(L.fogBase[0],0.03,k),lerp(L.fogBase[1],0.05,k),lerp(L.fogBase[2],0.06,k)];
  fog=fog.map(v=>v*(1-dr*(dream?0.2:0.4)));
  background(fog[0]*255,fog[1]*255,fog[2]*255);
  perspective(1.2+(dream?Math.sin(L.t*0.6)*0.06+(L.trip?Math.sin(L.t*3)*0.08:0):0),width/height,0.04,300);
  camera(cam.x,-cam.y,cam.z,cam.x+cam.f[0],-(cam.y+cam.f[1]),cam.z+cam.f[2],0,1,0);
  shader(SH);
  const lt=gatherLights(cam);
  SH.setUniform('uTime',L.t);SH.setUniform('uCam',[cam.x,cam.y,cam.z]);SH.setUniform('uFog',fog);SH.setUniform('uFogD',L.fogD+k*(city?0.02:0.03)+dr*0.012);
  if(city||sky){const a=1-k*0.85;SH.setUniform('uAmbTop',[0.55*a,0.62*a,0.72*a]);SH.setUniform('uAmbBot',[0.32*a,0.38*a,0.36*a]);
    SH.setUniform('uSkyH',L.sky.h);SH.setUniform('uSkyZ',L.sky.z);SH.setUniform('uSunDir',L.sunDir);SH.setUniform('uSunCol',L.sky.sc.map(v=>v*0.85*Math.max(0,1-k*1.3)));}
  else if(dream){const a=1-k*0.8;SH.setUniform('uAmbTop',[0.5*a,0.42*a,0.58*a]);SH.setUniform('uAmbBot',[0.36*a,0.26*a,0.42*a]);
    const sd=[Math.cos(L.t*0.1)*0.5,0.75,Math.sin(L.t*0.1)*0.5],sl=Math.hypot(...sd);SH.setUniform('uSunDir',sd.map(v=>v/sl));SH.setUniform('uSunCol',pal(L.t*0.03+0.5).map(v=>v*0.55*Math.max(0,1-k*1.3)));
    SH.setUniform('uSkyH',[0.9,0.7,0.95]);SH.setUniform('uSkyZ',[0.5,0.4,0.9]);}
  else{const a=1-k*0.8;SH.setUniform('uAmbTop',[0.26*a,0.31*a,0.31*a]);SH.setUniform('uAmbBot',[0.15*a,0.2*a,0.21*a]);SH.setUniform('uSunCol',[0,0,0]);
    SH.setUniform('uSkyH',[0.8,0.9,0.95]);SH.setUniform('uSkyZ',[0.3,0.6,0.9]);SH.setUniform('uSunDir',[0,1,0]);}
  SH.setUniform('uWarp',dream?1+(L.trip?0.8:0):0);SH.setUniform('uDream',dream?1:0);SH.setUniform('uDread',dream?dr*0.4:dr);SH.setUniform('uInvert',L.trip&&L.trip.type==='invert'?1:0);
  SH.setUniform('uLP',lt.LP);SH.setUniform('uLC',lt.LC);SH.setUniform('uDim',lt.DM);SH.setUniform('uBlack',L.bk);
  SH.setUniform('uRes',[width,height]);SH.setUniform('uSnap',SET.snap);
  const mb=beamDraw.find(b=>b.main);
  if(mb&&mb.segs.length){const s=mb.segs[0];SH.setUniform('uBA',[s[0],s[1],s[2]]);SH.setUniform('uBB',[s[3],s[4],s[5]]);SH.setUniform('uBCol',[0.35,1.1,1.2]);}
  else if(flameLight){SH.setUniform('uBA',flameLight[0]);SH.setUniform('uBB',flameLight[1]);SH.setUniform('uBCol',[1.4,0.7,0.25]);}
  else SH.setUniform('uBCol',[0,0,0]);
  if(city)part(G_SPH,M.SKY,Xf.at(cam.x,cam.y,cam.z).s(400));else if(sky)part(G_SPH,M.SKYSEA,Xf.at(cam.x,cam.y,cam.z).s(400));else if(dream)part(G_SPH,M.DSKY,Xf.at(cam.x,cam.y,cam.z).s(400));
  part(L.geom,-1,XI);
  if(city){for(const t of L.trees){const sw=Math.sin(L.t*0.8+t.ph)*0.04;const b=Xf.at(t.x,0,t.z);
      part(G_CYL,M.SKIN,b.t(0,t.h/2,0).s(0.18,t.h,0.18),[0.86,0.86,0.8]);
      const c=b.t(0,t.h,0).rz(sw);part(G_SPH,M.SKIN,c.s(t.s*1.4,t.s*1.1,t.s*1.4),[0.28,0.72,0.3]);part(G_SPH,M.SKIN,c.t(0.35,0.45,0.2).s(t.s),[0.36,0.8,0.32]);part(G_SPH,M.SKIN,c.t(-0.4,0.3,-0.3).s(t.s*0.9),[0.24,0.64,0.28]);}
    for(const d of L.decor){if(!d.chrome)continue;const y=d.y+Math.sin(L.t*0.3+d.ph)*1.5;part(G_SPH,M.CHROME,Xf.at(d.x,y,d.z).ry(L.t*0.05).s(d.r*2),[1,1,1]);}}
  if(dream)drawDream(cam);
  if(sky)drawSkyDecor();
  drawOdd(cam);drawArt(cam);
  if(L.exit)drawExit();drawPickups();drawStations();
  const dbl=L.trip&&L.trip.type==='doubles';
  for(const e of L.ents){drawEnt(e);if(dbl)drawEnt({...e,x:e.x+Math.cos(L.t*1.3+e.anim)*2.2,z:e.z+Math.sin(L.t*1.1+e.anim)*2.2,hitT:0});}
  for(const p of L.phantoms)drawEcho(p,true);
  for(const o of L.orbs){if(o.col){part(G_SPH,M.CORE,Xf.at(o.x,o.y,o.z).ry(o.life*5).s(o.r*2),o.col);continue;}part(G_SPH,M.ORB,Xf.at(o.x,o.y,o.z).s(0.32),[1,0.35,0.8]);part(G_SPH,M.BEAM,Xf.at(o.x,o.y,o.z).s(0.55),[1,0.4,0.85],0,0.18);}
  for(const p of L.parts){const xf=Xf.at(p.x,p.y,p.z).ry(p.life*9).rx(p.life*7).s(p.s);part(G_BOX,p.solid?M.SKIN:M.PART,xf,p.col,0,p.solid?1:Math.min(1,p.life/p.max*1.5)*p.a);}
  if(L.water)part(L.water,M.WATER,XI);
  if(L.glass)part(L.glass,M.GLASSBLD,XI);
  if(L.npc)drawNPC(L.npc);
  for(const w of L.waves)if(w.delay<=0)part(G_TOR,M.GLOW,Xf.at(w.x,0.15,w.z).s(w.r*2,3,w.r*2),[0.6,0.95,1],0,Math.max(0,1-w.r/45));
  if(city)for(const d of L.decor){if(d.chrome)continue;const y=d.y+Math.sin(L.t*0.3+d.ph)*1.5;part(G_SPH,M.BUBBLE,Xf.at(d.x+Math.sin(L.t*0.1+d.ph)*3,y,d.z).s(d.r*2),[1,1,1],0,0.9);}
  for(const e of L.ents)if(e.type==='gleam')drawGleamShell(e);
  drawDoors();
  for(const b of beamDraw)for(const s of b.segs){const a=[s[0],s[1],s[2]],c=[s[3],s[4],s[5]];const fl=0.85+Math.random()*0.3;
    part(G_CYL,M.BEAM,beamXf(a,c,0.035*fl*(b.main?1:0.7)),[0.75,1,1]);part(G_CYL,M.BEAM,beamXf(a,c,0.11*fl),[0.2,0.85,1],0,0.5);}
  for(const t of tracers){part(G_CYL,M.BEAM,beamXf(t.a,t.b,0.018),[1,0.9,0.6],0,t.t/0.07);}
  for(const b of bolts){for(let i=0;i<b.pts.length-1;i++){part(G_CYL,M.BEAM,beamXf(b.pts[i],b.pts[i+1],0.03),[0.95,0.85,1]);part(G_CYL,M.BEAM,beamXf(b.pts[i],b.pts[i+1],0.12),[0.6,0.4,1],0,0.3);}}
  if(pulseDraw){const k2=pulseDraw.t/0.22;for(const s of pulseDraw.segs){const a=[s[0],s[1],s[2]],c=[s[3],s[4],s[5]];part(G_CYL,M.BEAM,beamXf(a,c,0.09*k2+0.02),[1,1,1]);part(G_CYL,M.BEAM,beamXf(a,c,0.3*k2),[0.3,0.9,1],0,0.35*k2);}}
  if((state==='play'||state==='pause'||state==='shop'||state==='dead')&&!L.ending){const gl=drawingContext;gl.clear(gl.DEPTH_BUFFER_BIT);drawGun(cam);}
}
function drawDream(cam){
  for(const d of L.decor){
    if(d.type==='eye'){const y=d.y+Math.sin(L.t*0.4+d.ph*9)*1.2;const dx=cam.x-d.x,dy=cam.y-y,dz=cam.z-d.z;
      const b=Xf.at(d.x,y,d.z).ry(Math.atan2(dx,dz)).rx(-Math.atan2(dy,Math.hypot(dx,dz)));const r=d.r;const blink=Math.sin(L.t*0.7+d.ph*20)>0.985;
      part(G_SPH,M.SKIN,b.s(r*2,blink?r*0.2:r*2,r*2),[0.97,0.95,0.95]);
      if(!blink){part(G_SPH,M.EYE,b.t(0,0,r*0.82).s(r*1.1,r*1.1,r*0.4),pal(d.ph+L.t*0.05));part(G_SPH,M.SKIN,b.t(0,0,r*0.97).s(r*0.5,r*0.5,r*0.12),[0.01,0.01,0.01]);}}
    else if(d.type==='balloon'){const y=(d.y+L.t*0.9)%42+2;const x=d.x+Math.sin(L.t*0.3+d.ph)*2;const b=Xf.at(x,y,d.z);
      part(G_SPH,M.CORE,b.s(d.r*1.6,d.r*1.9,d.r*1.6),d.col);part(G_CYL,M.SKIN,b.t(0,-d.r*2.2,0).s(0.03,d.r*2.4,0.03),[0.9,0.9,0.9]);}
    else if(d.type==='moon'){const dx=cam.x-d.x,dz=cam.z-d.z;const b=Xf.at(d.x,d.y+Math.sin(L.t*0.2)*3,d.z).ry(Math.atan2(dx,dz)).rx(0.35);const r=d.r;
      part(G_SPH,M.SKIN,b.s(r*2),[0.97,0.95,0.92]);part(G_SPH,M.EYE,b.t(0,-r*0.05,r*0.95).s(r*0.45),[1,0.1,0.15]);
      for(const sx of [-1,1]){part(G_SPH,M.SKIN,b.t(sx*r*0.38,r*0.3,r*0.86).s(r*0.3,r*0.42,r*0.12),[0.02,0.02,0.04]);part(G_SPH,M.EYE,b.t(sx*r*0.38+Math.sin(L.t)*r*0.05,r*0.3,r*0.93).s(r*0.08),[1,1,1]);}
      part(G_SPH,M.SKIN,b.t(0,-r*0.42,r*0.8).s(r*1.1,r*0.25,r*0.2),[0.4,0,0.05]);
      for(let k=-6;k<=6;k++){const a=k*0.14;part(G_BOX,M.EYE,b.t(Math.sin(a)*r*0.7,-r*0.45+(1-Math.cos(a))*r*0.9,Math.cos(a)*r*0.86).ry(a).s(r*0.08,r*0.12,r*0.05),[1,1,0.95]);}}
  }
  for(const l of L.lamps){if(l.ph<L.bk)continue;const c=pal(l.ph+L.t*0.08);part(G_SPH,M.GLOW,Xf.at(l.x,l.y+Math.sin(L.t+l.ph*9)*0.3,l.z).s(0.45),c.map(v=>v*1.3+0.3));}
}
function drawSkyDecor(){
  for(const d of L.decor){
    if(d.type==='cloud'){const span=L.W*CELL+120;const x=((d.x+L.t*d.sp+60)%span+span)%span-60;for(const q of d.parts)part(G_SPH,M.SKIN,Xf.at(x+q[0],d.y+q[1],d.z+q[2]).s(q[3]*2,q[3]*1.3,q[3]*2),[1.35,1.4,1.45]);}
    else if(d.type==='shard')part(G_BOX,M.BUBBLE,Xf.at(d.x,d.y+Math.sin(L.t*0.5+d.ph)*1.2,d.z).ry(L.t*0.3+d.ph).rx(0.6).rz(L.t*0.2).s(d.r*0.5,d.r*1.6,d.r*0.5),[1,1,1],0,1);
  }
}
function drawEcho(e,ph){
  if(!ph&&!e.seen&&Math.random()<0.2)return;
  const t=e.anim||L.t;const jit=(e.seen||ph)?(Math.random()-0.5)*0.08:0;
  const base=new Xf(Mat.T(e.x+jit,e.y,e.z)).ry(e.yaw).s(e.sc||1);const sk=[0.008,0.008,0.012];const hit=!ph&&e.hitT>0?0.6:0;const mv=Math.min(1,(e.spd||0)/4);
  for(const sx of [-1,1]){part(G_BOX,M.SKIN,base.t(sx*0.12,0.45,0).rx(Math.sin(t*7+(sx>0?0:3))*0.3*mv).s(0.13,0.9,0.13),sk,hit);
    part(G_BOX,M.SKIN,base.t(sx*0.3,1.22,0).rz(sx*0.1+Math.sin(t*2+sx)*0.05).s(0.09,1.0,0.09),sk,hit);}
  part(G_BOX,M.SKIN,base.t(0,1.28,0).s(0.42,0.78,0.22),sk,hit);
  const hd=base.t(0,1.86,0).rz(Math.sin(t*0.9)*0.3+(e.seen?Math.sin(t*40)*0.2:0));
  part(G_SPH,M.SKIN,hd.s(0.3,0.38,0.3),sk,hit);
  for(const sx of [-1,1])part(G_BOX,M.EYE,hd.t(sx*0.07,0.03,0.145).s(0.045,0.025,0.01),[1,1,1]);
}
function drawAffix(e){if(!e.aff||!e.aff.length)return;const fly=['ballast','gleam','sliver','balloonist'].includes(e.type);const y=fly?entCenter(e)[1]:e.y+0.06+e.hy;
  e.aff.forEach((a,k)=>part(G_TOR,M.GLOW,Xf.at(e.x,y+k*0.14,e.z).ry(e.anim*(k?-2:2)).s(e.r*2.8+k*0.35),AFFIX[a].c,0,0.85));}
function applyScreenFx(){
  const cv=document.getElementById('defaultCanvas0');if(!cv||!L)return;
  const playing=state==='play'||state==='pause';const dr=playing?(L.dread||0):0;const dream=L.theme==='dream';
  let filt=dream?`saturate(1.35) hue-rotate(${(Math.sin(T*0.25)*28).toFixed(1)}deg)`:`contrast(${(1+dr*0.25).toFixed(2)}) saturate(${(1-dr*0.3).toFixed(2)})`;
  if(L.trip&&L.trip.type==='doubles')filt+=' blur(0.6px)';
  let tr='';if(L.trip&&L.trip.type==='mirror'&&playing)tr='scaleX(-1)';
  if(dr>0.5&&state==='play'&&Math.random()<0.012*dr)tr+=` translateX(${rnd(-6,6).toFixed(1)}px)`;
  if(cv._f!==filt){cv.style.filter=filt;cv._f=filt;}if(cv._t!==tr){cv.style.transform=tr;cv._t=tr;}
  $('vig').style.opacity=(0.55+dr*0.45).toFixed(2);
}
function drawExit(){
  const e=L.exit,op=L.stairOpen||0,t=L.t;const cx=Math.floor(e.x/CELL)*CELL,cz=Math.floor(e.z/CELL)*CELL;
  const hm=L.theme==='pool'?[0.6,0.66,0.7]:L.theme==='sky'?[0.85,0.95,1]:L.theme==='dream'?[1,0.5,0.8]:[0.92,0.93,0.95];
  part(G_BOX,M.CHROME,Xf.at(cx,0.03,cz+2).rz(-op*1.65).t(1,0,0).s(2,0.08,4),hm);
  part(G_BOX,M.CHROME,Xf.at(cx+4,0.03,cz+2).rz(op*1.65).t(-1,0,0).s(2,0.08,4),hm);
  const glow=L.escape?[0.5,1.5,1.0]:[0.25,0.55,0.6];const pulse=0.6+0.4*Math.sin(t*4);
  for(const [x,z,sx,sz] of [[cx+2,cz+0.03,4,0.06],[cx+2,cz+3.97,4,0.06],[cx+0.03,cz+2,0.06,4],[cx+3.97,cz+2,0.06,4]])part(G_BOX,M.GLOW,Xf.at(x,0.05,z).s(sx,0.04,sz),glow.map(v=>v*pulse));
  if(op<0.05){for(const k of [0,1])part(G_BOX,M.GLOW,Xf.at(cx+2,0.09,cz+1.3+k*0.9).ry(0).s(0.7,0.02,0.1),glow.map(v=>v*pulse));}
  if(op>0.02){part(G_BOX,M.GLOW,Xf.at(cx+2,-3.4,cz+CELL-0.06).s(3.4,2.2,0.04),[0.6,1.4,1.1],0,op);
    if(Math.random()<0.3*op)L.parts.push({x:cx+rnd(0.5,3.5),y:-3,z:cz+rnd(0.5,3.5),vx:0,vy:rnd(1,2.2),vz:0,life:2,max:2,col:[0.6,1,0.9],s:0.04,g:-0.5,a:0.7});}
}
function drawDoors(){
  for(const d of L.doors){if(d.open)continue;for(const i of d.cells){const x=(i%L.W)*CELL+2,z=((i/L.W)|0)*CELL+2,h=L.theme==='pool'?L.ceil[i]:6;
    if(Math.hypot(x-P.x,z-P.z)>60)continue;part(G_BOX,M.DOOR,Xf.at(x,h/2,z).s(3.96,h,3.96),[1,1,1]);}}
}
function drawStations(){
  for(const s of L.stations){const b=new Xf(Mat.T(s.x,0,s.z)).ry(s.yaw);const col=s.type==='ammo'?[0.3,0.9,1]:s.type==='terminal'?[0.4,1,0.5]:[1,0.6,0.25];
    part(G_BOX,M.CHROME,b.t(0,0.85,0).s(0.9,1.7,0.6),[1,1,1]);
    part(G_BOX,M.EYE,b.t(0,1.1,0.31).s(0.66,0.5,0.02),col.map(v=>v*(0.75+0.25*Math.sin(L.t*3))));
    part(G_BOX,M.CHROME,b.t(0,0.45,0.31).s(0.5,0.12,0.04),[0.4,0.5,0.6]);
    part(G_SPH,M.CORE,b.t(0,2.0+Math.sin(L.t*2+s.x)*0.08,0).s(0.42),col);
    part(G_TOR,M.CHROME,b.t(0,2.0,0).ry(L.t).rx(1.2).s(0.65),[1,1,1]);}
}
function drawPickups(){
  for(const p of L.pickups){const b=Math.sin(p.t*2.2)*0.12,x=Xf.at(p.x,p.y+b,p.z);
    if(p.type==='core'){part(G_SPH,M.CORE,x.s(0.55),[0.35,0.95,1.1]);part(G_BOX,M.EYE,x.ry(p.t*1.5).rx(p.t).s(0.2),[1,1,1]);part(G_TOR,M.CHROME,x.rx(p.t*0.9).rz(0.5).s(0.85),[1,1,1]);part(G_TOR,M.CHROME,x.rz(p.t*1.2).rx(1.2).s(0.75),[1,1,1]);}
    else if(p.type==='token'){part(G_SPH,M.CORE,x.s(0.24),[0.35,1,0.75]);part(G_TOR,M.CHROME,x.ry(p.t*3).rx(Math.PI/2).s(0.34),[1,1,1]);}
    else if(p.type==='hp'){part(G_SPH,M.CORE,x.s(0.38),[1,0.4,0.6]);part(G_BOX,M.EYE,x.ry(p.t).s(0.28,0.08,0.08),[1,1,1]);part(G_BOX,M.EYE,x.ry(p.t).s(0.08,0.28,0.08),[1,1,1]);}
    else if(p.type==='ammo'){const xr=x.ry(p.t*1.5);part(G_BOX,M.CHROME,xr.s(0.42,0.28,0.3),[1,0.95,0.85]);part(G_BOX,M.EYE,xr.t(0,0,0.155).s(0.3,0.08,0.01),[1,0.75,0.3]);part(G_BOX,M.EYE,xr.t(0,0,-0.155).s(0.3,0.08,0.01),[1,0.75,0.3]);}
    else if(p.type==='tape'){const xr=x.ry(p.t*1.2);part(G_BOX,M.CHROME,xr.s(0.5,0.32,0.08),[0.9,0.92,0.95]);part(G_BOX,M.EYE,xr.t(0,0.04,0.045).s(0.38,0.1,0.01),[1,0.55,0.2]);
      part(G_CYL,M.SKIN,xr.t(-0.12,-0.06,0.045).rx(Math.PI/2).s(0.08,0.01,0.08),[0.1,0.1,0.1]);part(G_CYL,M.SKIN,xr.t(0.12,-0.06,0.045).rx(Math.PI/2).s(0.08,0.01,0.08),[0.1,0.1,0.1]);}
  }
}
function drawGleamShell(e){const hv=e.hover+Math.sin(e.anim*2)*0.2;const sc=1.1*(1+e.swell*0.7)*(e.sc||1);
  part(G_SPH,M.BUBBLE,Xf.at(e.x,e.y+hv,e.z).ry(e.anim*0.3).s(sc),[1,1,1],0,1);}
function drawEnt(e){
  const t=e.anim,hit=e.hitT>0?(W&&W.firing?0.3:0.8):0;
  if(e.type==='drowner'){
    const sp=Math.min(1,e.spd/4)+(e.lunge*0.5);const sk=e.elite?[0.17,0.07,0.17]:[0.07,0.13,0.14];const glow=e.elite?[1,0.3,0.6]:[0.45,1,0.88];
    const base=new Xf(Mat.T(e.x,e.y+e.rise,e.z)).ry(e.yaw).s(e.sc).t(0,0,e.lunge*0.5);
    const by=0.55+Math.sin(t*2)*0.04+Math.abs(Math.sin(t*9*Math.max(sp,0.2)))*0.06;
    const body=base.t(0,by,0).rx(-0.12);
    part(G_SPH,M.SKIN,body.s(0.58,0.4,1.05),sk,hit);
    for(let i=0;i<5;i++)part(G_BOX,M.SKIN,body.t(0,0.19,-0.4+i*0.19).rx(0.7).s(0.06,0.14,0.06),sk,hit);
    const hb=body.t(0,0.02,0.5).rx(0.55+Math.sin(t*7)*0.18*sp).rz(Math.sin(t*1.3)*0.35+Math.sin(t*17)*0.05);
    part(G_SPH,M.SKIN,hb.t(0,-0.05,0.2).s(0.32,0.38,0.36),sk,hit);
    part(G_BOX,M.EYE,hb.t(0,-0.08,0.37).s(0.05,0.24,0.02),glow);
    part(G_BOX,M.EYE,hb.t(0.07,0.02,0.36).s(0.025,0.025,0.02),glow);part(G_BOX,M.EYE,hb.t(-0.07,0.02,0.36).s(0.025,0.025,0.02),glow);
    for(const [sx,sz,ph] of [[1,1,0],[-1,1,Math.PI],[1,-1,Math.PI],[-1,-1,0]]){
      const sw=Math.sin(t*9*Math.max(sp,0.15)+ph)*0.55*Math.max(sp,0.15);
      const sh=base.t(0.22*sx,by,0.33*sz).ry(sw*sx).rz(sx*2.0);
      part(G_BOX,M.SKIN,sh.t(0,-0.3,0).s(0.08,0.6,0.08),sk,hit);
      const el=sh.t(0,-0.6,0).rz(-sx*1.75);
      part(G_BOX,M.SKIN,el.t(0,-0.43,0).s(0.06,0.86,0.06),sk,hit);
      for(let f=-1;f<=1;f++)part(G_BOX,M.SKIN,el.t(0,-0.86,0).rx(f*0.5).rz(sx*0.4).t(0,-0.1,0).s(0.025,0.2,0.025),sk,hit);
    }
  }else if(e.type==='lifeguard'){
    const mv=Math.min(1,e.spd/5);const tw=e.seen?(Math.random()-0.5)*0.12:0;const sk=e.elite?[0.85,0.75,0.95]:[0.9,0.94,0.93];
    const base=new Xf(Mat.T(e.x,e.y,e.z)).ry(e.yaw).s(e.sc);const w=t*6;
    for(const sx of [1,-1]){const leg=base.t(0.15*sx,1.5,0).rx(Math.sin(w+(sx>0?0:Math.PI))*0.45*mv);
      part(G_CYL,M.TILESKIN,leg.t(0,-0.42,0).s(0.14,0.84,0.14),sk,hit);const kn=leg.t(0,-0.84,0).rx(-0.25-Math.max(0,Math.sin(w+(sx>0?0:Math.PI)))*0.5*mv);
      part(G_CYL,M.TILESKIN,kn.t(0,-0.36,0).s(0.1,0.72,0.1),sk,hit);part(G_BOX,M.TILESKIN,kn.t(0,-0.72,0.08).s(0.12,0.05,0.3),sk,hit);}
    const tor=base.t(0,1.5,0).rz(tw).rx(0.14+(e.seen?0.2:0));
    part(G_BOX,M.TILESKIN,tor.t(0,0.55,0).s(0.48,1.1,0.24),sk,hit);
    part(G_CYL,M.SKIN,tor.t(0,0.55,0.15).rz(0.75).s(0.13,1.15,0.13),[0.72,0.08,0.08],hit);
    part(G_CYL,M.CHROME,tor.t(0.05,0.85,0.14).rx(Math.PI/2).s(0.05,0.12,0.05),[1,1,1]);
    for(const sx of [1,-1]){const sw=Math.sin(w+(sx>0?Math.PI:0))*0.35*mv+Math.sin(t*0.9+sx)*0.08;
      const sh=tor.t(0.31*sx,1.05,0).rz(sx*0.1).rx(sw);
      part(G_CYL,M.TILESKIN,sh.t(0,-0.52,0).s(0.09,1.04,0.09),sk,hit);
      const fo=sh.t(0,-1.04,0).rx(-0.15-(e.seen?0:0.3)*mv);part(G_CYL,M.TILESKIN,fo.t(0,-0.5,0).s(0.075,1.0,0.075),sk,hit);
      for(let f=-1;f<=1;f++)part(G_BOX,M.TILESKIN,fo.t(0,-1.0,0).rz(f*0.18).t(0,-0.18,0).s(0.025,0.36,0.025),sk,hit);}
    const nk=tor.t(0,1.1,0);part(G_CYL,M.TILESKIN,nk.t(0,0.28,0).s(0.07,0.56,0.07),sk,hit);
    const hd=nk.t(0,0.75,0).rz(e.seen?0.35+tw*2:Math.sin(t*0.7)*0.2).rx(e.seen?-0.15:0.2);
    part(G_SPH,M.TILESKIN,hd.s(0.36,0.54,0.38),sk,hit);
    part(G_BOX,M.SKIN,hd.t(0,0.02,0.18).s(0.035,0.34,0.02),[0.01,0.01,0.01]);
    if(e.elite)part(G_BOX,M.EYE,hd.t(0,0.05,0.185).s(0.012,0.2,0.01),[1,0.2,0.3]);
  }else if(e.type==='ballast'){
    const hv=e.hover+Math.sin(t*1.6)*0.18;const base=new Xf(Mat.T(e.x,e.y+hv,e.z)).ry(t*0.5).rx(Math.sin(t*0.8)*0.3);
    const pulse=1+Math.sin(t*5)*0.06;const flesh=e.elite?[0.35,0.15,0.45]:[0.58,0.26,0.3];
    part(G_SPH,M.SKIN,base.s(0.72*pulse,0.66*pulse,0.72*pulse),flesh,hit);
    for(let k=0;k<5;k++){const a=k/5*TAU;part(G_SPH,M.EYE,base.ry(a).rx(0.4+k*0.2).t(0,0,0.33).s(0.1),e.elite?[1,0.3,0.9]:[1,0.75,0.45]);}
    const halo=base.ry(t*0.9);
    for(let k=0;k<4;k++){const tb=halo.ry(k*Math.PI/2).t(0.62,0,0);const on=Math.sin(t*(17+k*5)+k)>-0.4?[0.92,1,0.96]:[0.25,0.3,0.3];
      part(G_CYL,M.EYE,tb.rx(Math.PI/2).s(0.1,1.3,0.1),on);
      part(G_BOX,M.CHROME,tb.t(0,0,0.7).s(0.18,0.18,0.12),[0.6,0.62,0.65]);part(G_BOX,M.CHROME,tb.t(0,0,-0.7).s(0.18,0.18,0.12),[0.6,0.62,0.65]);}
    for(let k=0;k<3;k++){const a=k/3*TAU+0.4;const wv=new Xf(Mat.T(e.x,e.y+hv-0.4,e.z)).ry(a).t(0.25,0,0).rx(Math.sin(t*2+k)*0.3).rz(Math.cos(t*1.7+k)*0.2);
      part(G_BOX,M.SKIN,wv.t(0,-0.6,0).s(0.035,1.2,0.035),[0.08,0.08,0.09],hit);}
  }else if(e.type==='gleam'){
    const hv=e.hover+Math.sin(t*2)*0.2;const sc=1+e.swell*0.7;const base=new Xf(Mat.T(e.x,e.y+hv,e.z)).ry(e.yaw).s(sc*e.sc);
    const ink=e.elite?[0.5,0,0.1]:[0.02,0.02,0.03];const h=hit>0?0.6:0;
    part(G_SPH,M.CORE,base.s(0.55),e.elite?[1,0.6,0.85]:[0.7,0.95,1],h);
    part(G_SPH,M.SKIN,base.t(0.16,0.12,0.5).s(0.08,0.16,0.04),ink);part(G_SPH,M.SKIN,base.t(-0.16,0.12,0.5).s(0.08,0.16,0.04),ink);
    for(let k=-3;k<=3;k++){const a=k*0.22;part(G_BOX,M.SKIN,base.t(Math.sin(a)*0.3,-0.08-Math.cos(a)*0.12+0.12,0.5-Math.abs(k)*0.02).rz(a).s(0.09,0.035,0.03),ink);}
  }else if(e.type==='warden'){
    drawEnt({...e,type:'lifeguard',sc:1.9,elite:false,seen:false,aff:[]});
    const base=new Xf(Mat.T(e.x,e.y,e.z)).ry(e.yaw).s(1.9);const sh=L.ents.some(o=>o.type==='halo'&&o.alive);
    part(G_SPH,M.EYE,base.t(0,2.15,0.17).s(0.22),sh?[0.35,0.55,0.65]:[1,0.25,0.4]);
    part(G_TOR,M.CHROME,base.t(0,3.62,0).s(1.4),[0.9,0.92,0.95]);
    if(sh)part(G_SPH,M.BUBBLE,base.t(0,1.8,0).s(2.3,3.9,2.3),[1,1,1],0,0.55);
  }else if(e.type==='halo'){
    const a=e.boss?e.boss.anim*0.9+e.idx*TAU/4:0;const b=new Xf(Mat.T(e.x,e.y+6.9,e.z)).ry(-a);
    part(G_CYL,M.EYE,b.rx(Math.PI/2).s(0.15,1.3,0.15),Math.sin(e.anim*20+e.idx)>-0.6?[0.95,1,0.97]:[0.3,0.35,0.35],e.hitT>0?0.6:0);
    part(G_BOX,M.CHROME,b.t(0,0,0.68).s(0.25,0.25,0.14),[0.6,0.62,0.65]);part(G_BOX,M.CHROME,b.t(0,0,-0.68).s(0.25,0.25,0.14),[0.6,0.62,0.65]);
  }else if(e.type==='echo'){drawEcho(e,false);
  }else if(e.type==='sliver'){
    const hv=e.hover+Math.sin(t*4+e.ph)*0.25;const base=new Xf(Mat.T(e.x,e.y+hv,e.z)).ry(Math.atan2(e.vx,e.vz)).s(e.sc);const sk=[0.05,0.09,0.11];
    part(G_SPH,M.SKIN,base.s(0.2,0.17,0.62),sk,hit);
    part(G_BOX,M.SKIN,base.t(0,0,-0.38).ry(Math.sin(t*16+e.ph)*0.7).s(0.02,0.16,0.24),sk,hit);
    part(G_BOX,M.EYE,base.t(0,0.03,0.27).s(0.13,0.03,0.03),e.dart>0?[1,0.3,0.3]:[1,0.9,0.45]);
  }else if(e.type==='grinner'){
    const mv=Math.min(1,e.spd/4),w=t*5;const base=new Xf(Mat.T(e.x,e.y,e.z)).ry(e.yaw).s(e.sc);
    for(const sx of [1,-1]){const leg=base.t(0.16*sx,1.6,0).rx(Math.sin(w+(sx>0?0:Math.PI))*0.4*mv);
      for(let k=0;k<4;k++)part(G_CYL,M.SKIN,leg.t(0,-0.2-k*0.4,0).s(0.09,0.4,0.09),k%2?[0.9,0.1,0.15]:[0.96,0.96,0.96],hit);
      part(G_BOX,M.SKIN,leg.t(0,-1.6,0.12).s(0.16,0.08,0.42),[0.9,0.1,0.15],hit);}
    part(G_CONE,M.SKIN,base.t(0,1.85,0).s(0.8,0.55,0.6),[0.2,0.35,0.95],hit);
    const tor=base.t(0,2.35,0).rz(Math.sin(t*1.3)*0.08);
    part(G_SPH,M.SKIN,tor.s(0.62,0.8,0.46),[0.98,0.82,0.15],hit);
    for(let k=0;k<5;k++)part(G_SPH,M.EYE,tor.t(Math.sin(k*2.4)*0.18,Math.cos(k*1.7)*0.22,0.22).s(0.08,0.08,0.03),BALLCOLS[k]);
    part(G_TOR,M.SKIN,tor.t(0,0.38,0).s(0.95,2.2,0.95),[0.98,0.98,0.98]);
    const hd=tor.t(0,0.72,0).rz(Math.sin(t*1.7)*0.25+(e.raged?Math.sin(t*22)*0.15:0)).rx(-0.08);
    part(G_SPH,M.SKIN,hd.s(0.52,0.58,0.5),[0.97,0.96,0.94],hit);
    part(G_SPH,M.EYE,hd.t(0,0,0.27).s(0.14),[1,0.08,0.1]);
    for(const sx of [-1,1]){part(G_BOX,M.SKIN,hd.t(sx*0.11,0.11,0.22).rz(Math.PI/4).s(0.08,0.08,0.03),[0.03,0.02,0.05]);
      part(G_SPH,M.EYE,hd.t(sx*0.11,0.11,0.235).s(0.03),e.raged?[1,0.1,0.1]:[1,1,1]);
      part(G_SPH,M.SKIN,hd.t(sx*0.29,0.06,-0.02).s(0.26),[1,0.35,0.08]);}
    part(G_BOX,M.SKIN,hd.t(0,-0.13,0.2).s(0.36,0.11,0.06),[0.45,0,0.06]);
    for(let k=-4;k<=4;k++){const a=k*0.2;part(G_BOX,M.EYE,hd.t(Math.sin(a)*0.18,-0.14+(1-Math.cos(a))*0.22,0.235-Math.abs(k)*0.008).rz(a).s(0.032,0.05,0.02),[1,1,0.94]);}
    part(G_CONE,M.SKIN,hd.t(0.03,0.4,0).rz(0.25).s(0.22,0.42,0.22),[0.45,0.15,0.85]);part(G_SPH,M.EYE,hd.t(0.1,0.62,0).s(0.09),[1,1,0.4]);
    for(const sx of [1,-1]){const sh=tor.t(0.34*sx,0.25,0).rz(sx*(2.5+Math.sin(t*6+(sx>0?0:1.5))*0.3));
      part(G_CYL,M.SKIN,sh.t(0,-0.35,0).s(0.09,0.7,0.09),[0.98,0.82,0.15],hit);part(G_SPH,M.SKIN,sh.t(0,-0.74,0).s(0.16),[1,1,1],hit);}
    for(let k=0;k<3;k++){const a=t*4+k*TAU/3;part(G_SPH,M.CORE,base.t(Math.cos(a)*0.5,4.0+Math.sin(a)*0.4,0.15).s(0.2),BALLCOLS[k]);}
  }else if(e.type==='balloonist'){
    const hv=e.hover+Math.sin(t*1.2)*0.3;const base=new Xf(Mat.T(e.x,e.y+hv,e.z)).ry(e.yaw).rz(Math.sin(t*0.9)*0.12).s(e.sc);
    const hand=Mat.apply(base.m,0,0.3,0);
    for(let k=0;k<e.balloons;k++){const a=k/5*TAU+0.3;const bp=base.t(Math.cos(a)*0.5,1.15+(k%2)*0.4+Math.sin(t*2+k)*0.05,Math.sin(a)*0.5);
      part(G_SPH,M.CORE,bp.s(0.6,0.72,0.6),BALLCOLS[k%BALLCOLS.length]);part(G_CYL,M.SKIN,beamXf(Mat.apply(bp.m,0,-0.36,0),hand,0.012),[0.95,0.95,0.95]);}
    part(G_SPH,M.SKIN,base.t(0,-0.1,0).s(0.42,0.52,0.36),[0.3,0.8,0.45],hit);
    part(G_TOR,M.SKIN,base.t(0,0.16,0).s(0.6,1.6,0.6),[1,1,1]);
    const hd=base.t(0,0.42,0).rz(Math.sin(t*2.3)*0.3);
    part(G_SPH,M.SKIN,hd.s(0.34),[0.97,0.96,0.94],hit);part(G_SPH,M.EYE,hd.t(0,0,0.17).s(0.09),[1,0.08,0.1]);
    for(const sx of [-1,1])part(G_BOX,M.SKIN,hd.t(sx*0.07,0.07,0.15).rz(Math.PI/4).s(0.05,0.05,0.02),[0.03,0.02,0.05]);
    for(let k=-3;k<=3;k++){const a=k*0.22;part(G_BOX,M.EYE,hd.t(Math.sin(a)*0.11,-0.08+(1-Math.cos(a))*0.14,0.155).rz(a).s(0.022,0.032,0.015),[1,1,0.94]);}
    for(const sx of [-1,1]){const lg=base.t(sx*0.12,-0.35,0).rx(Math.sin(t*3+sx)*0.4);part(G_CYL,M.SKIN,lg.t(0,-0.3,0).s(0.06,0.6,0.06),[0.96,0.96,0.96],hit);part(G_SPH,M.SKIN,lg.t(0,-0.62,0.06).s(0.16,0.1,0.26),[1,0.15,0.2],hit);}
  }else if(e.type==='jack'){
    const op=e.open||0;const base=new Xf(Mat.T(e.x,e.y+e.hy,e.z)).ry(e.yaw).s(e.sc);const rattle=op?0:(Math.sin(t*30)>0.97?0.06:0);
    const bx=base.rz(rattle);const pink=[1,0.42,0.62];
    part(G_BOX,M.CHROME,bx.t(0,0.5,0).s(1,1,1),pink,hit);
    part(G_BOX,M.EYE,bx.t(0,0.5,0).s(1.02,1.02,0.14),[1,0.88,0.3]);part(G_BOX,M.EYE,bx.t(0,0.5,0).s(0.14,1.02,1.02),[1,0.88,0.3]);
    if(!op){part(G_BOX,M.CHROME,bx.t(0,1.03,0).s(1.06,0.08,1.06),pink);part(G_TOR,M.EYE,bx.t(0,1.12,0).rz(Math.PI/2).s(0.4),[1,0.88,0.3]);}
    else{part(G_BOX,M.CHROME,bx.t(0,1.0,-0.5).rx(-1.9*op).t(0,0.04,0.5).s(1.06,0.08,1.06),pink);
      const ext=1.7*op;
      for(let k=0;k<7;k++)part(G_TOR,M.CHROME,bx.t(Math.sin(t*6+k)*0.06*op,1.05+k/6*ext,e.lunge*1.1*k/6).s(0.45),[0.85,0.85,0.9]);
      const hd=bx.t(Math.sin(t*5)*0.12*op,1.15+ext,e.lunge*1.2).rz(Math.sin(t*3)*0.4).rx(-0.15);
      part(G_SPH,M.SKIN,hd.s(0.62),[0.97,0.96,0.94],hit);part(G_SPH,M.EYE,hd.t(0,-0.02,0.31).s(0.15),[1,0.08,0.1]);
      for(const sx of [-1,1])part(G_TOR,M.EYE,hd.t(sx*0.14,0.1,0.27).rx(Math.PI/2).rz(t*8*sx).s(0.16),pal(t*0.3+sx*0.2));
      part(G_BOX,M.SKIN,hd.t(0,-0.16,0.24).s(0.42,0.12,0.05),[0.45,0,0.06]);
      for(let k=-4;k<=4;k++){const a=k*0.2;part(G_BOX,M.EYE,hd.t(Math.sin(a)*0.21,-0.17+(1-Math.cos(a))*0.25,0.275-Math.abs(k)*0.01).rz(a).s(0.035,0.055,0.02),[1,1,0.94]);}
      for(const sx of [-1,1]){const hh=hd.t(sx*0.2,0.3,0).rz(-sx*0.9);part(G_CONE,M.SKIN,hh.t(0,0.22,0).s(0.18,0.45,0.18),sx>0?[0.6,0.1,0.9]:[0.1,0.7,0.4]);part(G_SPH,M.EYE,hh.t(0,0.48,0).s(0.08),[1,0.9,0.3]);}}
  }
  drawAffix(e);
}
function gunMuzzle(cam){const g=gunBase(cam);const s=curSlot();return Mat.apply(g.m,0,0,s?WDEF[s.id].mz:-0.36);}
function gunBase(cam){
  const mv=P?Math.min(1,Math.hypot(P.vx,P.vz)/5):0;const bt=P?P.bobT:0;
  const rk=W&&W.reloadT>0?Math.sin(Math.PI*(1-W.reloadT/W.reloadDur)):0;const sk=W&&W.swapT>0?W.swapT/0.35:0;
  const ox=0.25+Math.sin(bt)*0.012*mv,oy=-0.24+Math.abs(Math.cos(bt))*0.012*mv-rk*0.1-sk*0.4,oz=-0.5+(W?W.kick*0.08+(W.firing?Math.random()*0.006:0):0);
  const b=[-cam.f[0],-cam.f[1],-cam.f[2]];
  return Xf.basis(cam.r,cam.u,b,[cam.x,cam.y,cam.z]).t(ox,oy,oz).rx(-rk*0.6+(W?W.kick*0.15:0)).rz(rk*0.5);
}
function drawGun(cam){
  const g=gunBase(cam);const s=curSlot(),d=WDEF[s.id];const fill=s.mag/magCap(s.id);const liq=d.glass.map(v=>v*(0.35+0.65*fill));
  if(s.id==='laser'){
    part(G_BOX,M.CHROME,g.s(0.11,0.12,0.5),[1,1,1]);
    part(G_BOX,M.CHROME,g.t(0,-0.065,0.04).s(0.09,0.05,0.42),[0.55,0.75,0.95]);
    part(G_SPH,M.CHROME,g.t(0,0,0.25).s(0.13,0.13,0.1),[1,1,1]);
    part(G_CYL,M.CHROME,g.t(0,0,-0.29).rx(Math.PI/2).s(0.075,0.12,0.075),[0.85,0.9,0.95]);
    part(G_TOR,M.EYE,g.t(0,0,-0.33).rx(Math.PI/2).s(0.16),W.firing?[0.8,1,1]:[0.25,0.75,0.9]);
    part(G_BOX,M.CHROME,g.t(0,-0.15,0.15).rx(0.32).s(0.07,0.2,0.09),[0.35,0.4,0.45]);
    for(let k=0;k<3;k++)part(G_BOX,M.CHROME,g.t(0.06,0.0,-0.12+k*0.08).s(0.03,0.09,0.025),[0.7,0.85,1]);
    part(G_CYL,M.CHROME,g.t(0,0.1,0.2).rx(Math.PI/2).s(0.085,0.05,0.085),[1,1,1]);
    part(G_CYL,M.CHROME,g.t(0,0.1,-0.22).rx(Math.PI/2).s(0.085,0.05,0.085),[1,1,1]);
    part(G_CYL,M.GLASS,g.t(0,0.1,-0.01).rx(Math.PI/2).s(0.07,0.4,0.07),liq);
  }else if(s.id==='tile'){
    const pk=W.fireCd>0?Math.max(0,W.fireCd/d.rate-0.5)*0.12:0;
    part(G_BOX,M.CHROME,g.t(0,0,0.02).s(0.13,0.13,0.4),[1,0.97,0.92]);
    for(const sx of [-0.035,0.035])part(G_CYL,M.CHROME,g.t(sx,0.03,-0.33).rx(Math.PI/2).s(0.06,0.42,0.06),[1,0.62,0.3]);
    part(G_BOX,M.CHROME,g.t(0,-0.06,-0.24+pk).s(0.1,0.06,0.2),[0.35,0.42,0.5]);
    part(G_BOX,M.CHROME,g.t(0,-0.02,0.3).rx(-0.15).s(0.09,0.12,0.26),[0.9,0.85,0.78]);
    part(G_BOX,M.CHROME,g.t(0,-0.15,0.12).rx(0.32).s(0.07,0.2,0.09),[0.35,0.4,0.45]);
    for(let k=0;k<6;k++){const on=k<s.mag;part(G_BOX,on?M.EYE:M.SKIN,g.t(0.068,0.03,-0.1+k*0.045).s(0.012,0.04,0.03),on?[1,0.7,0.3]:[0.1,0.1,0.1]);}
    for(let k=0;k<3;k++)part(G_BOX,M.TILESKIN,g.t(-0.068,0.0,-0.08+k*0.09).s(0.01,0.08,0.08),[0.4,0.75,0.9]);
  }else if(s.id==='sauna'){
    part(G_CYL,M.CHROME,g.t(0,-0.02,-0.1).rx(Math.PI/2).s(0.1,0.5,0.1),[1,0.98,0.95]);
    part(G_CONE,M.CHROME,g.t(0,-0.02,-0.4).rx(-Math.PI/2).s(0.12,0.1,0.12),[0.8,0.5,0.3]);
    part(G_TOR,M.EYE,g.t(0,-0.02,-0.38).rx(Math.PI/2).s(0.14),[1,0.55,0.2]);
    part(G_BOX,M.CHROME,g.t(0,-0.15,0.1).rx(0.32).s(0.07,0.2,0.09),[0.35,0.4,0.45]);
    part(G_CYL,M.CHROME,g.t(0,0.08,-0.15).s(0.03,0.14,0.03),[0.7,0.7,0.75]);
    const fl=0.7+Math.random()*0.3;part(G_SPH,M.PART,g.t(0,-0.02,-0.45).s(0.03*fl,0.03*fl,0.05*fl),[1,0.6,0.2],0,0.9);
    part(G_SPH,M.GLASS,g.t(0,0.1,0.14).s(0.12,0.1,0.14),liq);
    part(G_TOR,M.CHROME,g.t(0,0.1,0.14).s(0.14),[1,1,1]);
  }else if(s.id==='eel'){
    part(G_BOX,M.CHROME,g.s(0.1,0.11,0.46),[0.82,0.78,1]);
    part(G_BOX,M.CHROME,g.t(0,-0.15,0.15).rx(0.32).s(0.07,0.2,0.09),[0.3,0.3,0.4]);
    for(let k=0;k<4;k++){const p=0.7+0.3*Math.sin(L.t*12+k);part(G_TOR,M.EYE,g.t(0,0,-0.22-k*0.055).rx(Math.PI/2).s(0.15),[0.75*p,0.55*p,1*p]);}
    for(const sx of [-0.035,0.035])part(G_BOX,M.CHROME,g.t(sx,0,-0.44).s(0.015,0.015,0.1),[1,0.95,0.6]);
    part(G_CYL,M.GLASS,g.t(0,0.09,0.05).rx(Math.PI/2).s(0.06,0.32,0.06),liq);
    if(Math.random()<0.3){const a=Mat.apply(g.m,-0.035,0,-0.48),b=Mat.apply(g.m,0.035,0,-0.48);part(G_CYL,M.BEAM,beamXf(a,b,0.006),[0.9,0.85,1]);}
  }
}
