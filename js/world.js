// ORHANGE - World: primitive meshes, level generation for every theme, stairways, paintings and oddities
'use strict';
// ============================================================ geometry
let geoCount=0;
function makeGeom(name){const g=new p5.Geometry(1,1);g.gid=name+'_'+(geoCount++);return g;}
function pv(g,x,y,z,nx,ny,nz,u,v){g.vertices.push(createVector(x,y,z));g.vertexNormals.push(createVector(nx,ny,nz));g.uvs.push(u,v);return g.vertices.length-1;}
function addQuad(g,P,n,u,vs){const i=pv(g,...P[0],...n,u,vs[0]);pv(g,...P[1],...n,u,vs[1]);pv(g,...P[2],...n,u,vs[2]);pv(g,...P[3],...n,u,vs[3]);g.faces.push([i,i+1,i+2],[i,i+2,i+3]);}
let G_BOX,G_SPH,G_CYL,G_TOR,G_CONE,G_QUAD;
function buildPrims(){
  G_QUAD=makeGeom('quad');pv(G_QUAD,-.5,-.5,0,0,0,1,0,0);pv(G_QUAD,.5,-.5,0,0,0,1,1,0);pv(G_QUAD,.5,.5,0,0,0,1,1,1);pv(G_QUAD,-.5,.5,0,0,0,1,0,1);G_QUAD.faces.push([0,1,2],[0,2,3]);
  G_BOX=makeGeom('box');
  for(const n of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
    const t1=n[1]!==0?[1,0,0]:[0,1,0];const t2=[n[1]*t1[2]-n[2]*t1[1],n[2]*t1[0]-n[0]*t1[2],n[0]*t1[1]-n[1]*t1[0]];
    const c=(a,b)=>[n[0]*.5+t1[0]*.5*a+t2[0]*.5*b,n[1]*.5+t1[1]*.5*a+t2[1]*.5*b,n[2]*.5+t1[2]*.5*a+t2[2]*.5*b];
    const i=pv(G_BOX,...c(-1,-1),...n,0,0);pv(G_BOX,...c(1,-1),...n,1,0);pv(G_BOX,...c(1,1),...n,1,1);pv(G_BOX,...c(-1,1),...n,0,1);
    G_BOX.faces.push([i,i+1,i+2],[i,i+2,i+3]);
  }
  G_SPH=makeGeom('sph');const LA=7,LO=10;
  for(let a=0;a<=LA;a++)for(let b=0;b<=LO;b++){const th=a/LA*Math.PI,ph=b/LO*TAU;const x=Math.sin(th)*Math.cos(ph),y=Math.cos(th),z=Math.sin(th)*Math.sin(ph);pv(G_SPH,x*.5,y*.5,z*.5,x,y,z,b/LO,a/LA);}
  for(let a=0;a<LA;a++)for(let b=0;b<LO;b++){const i=a*(LO+1)+b,j=i+LO+1;G_SPH.faces.push([i,j,i+1],[i+1,j,j+1]);}
  G_CYL=makeGeom('cyl');const S=8;
  for(let k=0;k<=S;k++){const a=k/S*TAU,x=Math.cos(a),z=Math.sin(a);pv(G_CYL,x*.5,-.5,z*.5,x,0,z,k/S,0);pv(G_CYL,x*.5,.5,z*.5,x,0,z,k/S,1);}
  for(let k=0;k<S;k++){const i=k*2;G_CYL.faces.push([i,i+1,i+3],[i,i+3,i+2]);}
  for(const y of [-.5,.5]){const c=pv(G_CYL,0,y,0,0,Math.sign(y),0,.5,.5);const s=G_CYL.vertices.length;for(let k=0;k<=S;k++){const a=k/S*TAU;pv(G_CYL,Math.cos(a)*.5,y,Math.sin(a)*.5,0,Math.sign(y),0,.5,.5);}for(let k=0;k<S;k++)G_CYL.faces.push([c,s+k,s+k+1]);}
  G_CONE=makeGeom('cone');
  for(let k=0;k<S;k++){const a=k/S*TAU,b=(k+1)/S*TAU;const i=pv(G_CONE,0,.5,0,Math.cos(a+.39),.5,Math.sin(a+.39),.5,1);pv(G_CONE,Math.cos(a)*.5,-.5,Math.sin(a)*.5,Math.cos(a),.5,Math.sin(a),0,0);pv(G_CONE,Math.cos(b)*.5,-.5,Math.sin(b)*.5,Math.cos(b),.5,Math.sin(b),1,0);G_CONE.faces.push([i,i+1,i+2]);}
  G_TOR=makeGeom('tor');const TS=18,TR=6,R0=.5,r0=.09;
  for(let a=0;a<=TS;a++)for(let b=0;b<=TR;b++){const u=a/TS*TAU,v=b/TR*TAU;const cx=Math.cos(u),cz=Math.sin(u);const nx=Math.cos(v)*cx,ny=Math.sin(v),nz=Math.cos(v)*cz;pv(G_TOR,cx*R0+nx*r0,ny*r0,cz*R0+nz*r0,nx,ny,nz,a/TS,b/TR);}
  for(let a=0;a<TS;a++)for(let b=0;b<TR;b++){const i=a*(TR+1)+b,j=i+TR+1;G_TOR.faces.push([i,j,i+1],[i+1,j,j+1]);}
}

// ============================================================ level helpers
function cidx(cx,cy){return (cx<0||cy<0||cx>=L.W||cy>=L.H)?-1:cy*L.W+cx;}
function cidxW(x,z){return cidx(Math.floor(x/CELL),Math.floor(z/CELL));}
function floorOf(i){return L.voidc[i]?-999:L.pool[i]?-POOL_D:0;}
function wallAt(i){return i<0||(L.solid[i]&&!L.voidc[i])||L.lock[i];}
const CORN=[[-1,-1],[1,-1],[1,1],[-1,1]], N4=[[1,0],[-1,0],[0,1],[0,-1]];
function cellGround(i,x,z){if(L.exit&&i===L.exit.cell&&L.stairOpen>0.98){const t=clamp((z-Math.floor(z/CELL)*CELL)/CELL,0,0.999);return -Math.floor(t*9)/8*4.5;}return floorOf(i);}
function groundAt(x,z,r){let g=-99;for(const c of CORN){const px=x+c[0]*r,pz=z+c[1]*r;const i=cidxW(px,pz);if(i>=0&&!L.solid[i])g=Math.max(g,cellGround(i,px,pz));}return g;}
function blocked(x,z,r,feet,ent=true){
  for(const c of CORN){const px=x+c[0]*r,pz=z+c[1]*r;const i=cidxW(px,pz);if(wallAt(i))return true;if(L.voidc[i]){if(ent)return true;continue;}if(cellGround(i,px,pz)>feet+STEP)return true;}
  for(const p of L.props){const dx=x-p.x,dz=z-p.z;if(dx*dx+dz*dz<(r+p.r)*(r+p.r))return true;}
  return false;}
function moveBody(o,dx,dz,r){const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/0.2));dx/=n;dz/=n;let hit=false;
  const ent=o!==P;for(let k=0;k<n;k++){if(!blocked(o.x+dx,o.z,r,o.y,ent))o.x+=dx;else hit=true;if(!blocked(o.x,o.z+dz,r,o.y,ent))o.z+=dz;else hit=true;}return hit;}
function los(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,d=Math.hypot(dx,dz),n=Math.ceil(d/0.5);for(let k=1;k<n;k++){const t=k/n;if(wallAt(cidxW(ax+dx*t,az+dz*t)))return false;}return true;}
function openAt(x,z){return !wallAt(cidxW(x,z));}
function inPoolEnt(e){const i=cidxW(e.x,e.z);return i>=0&&L.pool[i]&&e.y<WATER_Y;}

// ============================================================ level generation
const CITYSKY=[
 {h:[0.78,0.92,1.0],z:[0.12,0.45,0.92],sun:[0.45,0.75,0.35],sc:[1.0,0.97,0.88],name:'noon'},
 {h:[1.0,0.78,0.55],z:[0.3,0.42,0.82],sun:[0.7,0.28,0.2],sc:[1.1,0.8,0.55],name:'golden'},
 {h:[1.0,0.84,0.92],z:[0.55,0.62,0.98],sun:[-0.4,0.55,0.5],sc:[1.0,0.9,0.98],name:'pastel'},
];
function genLevel(floor,theme,opts={}){
  if(L&&typeof freeGeometry==='function'){try{if(L.geom)freeGeometry(L.geom);if(L.water)freeGeometry(L.water);if(L.glass)freeGeometry(L.glass);}catch(e){}}
  const big=opts.arena?20:opts.ending?18:opts.death?32:26+Math.min(floor,7)*2;const W=big,H=W;
  L={W,H,floor,theme,death:!!opts.death,solid:new Uint8Array(W*H).fill(1),pool:new Uint8Array(W*H),ceil:new Float32Array(W*H).fill(WALL_H),room:new Int16Array(W*H).fill(-1),
     lock:new Uint8Array(W*H),voidc:new Uint8Array(W*H),stairOpen:0,bh:new Float32Array(W*H),tint:new Float32Array(W*H),grass:new Uint8Array(W*H),
     seen:new Uint8Array(W*H),dist:new Int16Array(W*H),rooms:[],lights:[],ents:[],orbs:[],parts:[],pickups:[],props:[],trees:[],decor:[],doors:[],stations:[],
     t:0,waves:[],attT:60,endT:0,phantoms:[],bk:0,dread:0,trip:null,tripT:30,phT:20,boT:30,txtT:30,bpulse:0,lamps:[],coresNeed:3,coresGot:0,escape:false,escT:0,black:0,spawnT:18,flowT:0,lastPC:-1,ftime:0,exit:null};
  const city=theme==='city',dream=theme==='dream',sky=theme==='sky',open=city||dream||sky;
  const rooms=L.rooms,want=(opts.arena||opts.ending)?0:opts.death?14:9+Math.min(floor,7);L.arena=!!opts.arena;L.ending=!!opts.ending;
  for(let a=0;a<800&&rooms.length<want;a++){
    const w=ri(4,9),h=ri(4,9),x=ri(1,W-w-1),y=ri(1,H-h-1);
    if(rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y))continue;
    const roll=Math.random();
    const r={x,y,w,h,cx:x+(w>>1),cy:y+(h>>1),type:(w>=5&&h>=5&&roll<0.5)?'pool':(w>=6&&h>=6&&roll<0.78)?'hall':'plain'};
    r.grass=city&&(r.type==='hall'||Math.random()<0.45);
    rooms.push(r);const id=rooms.length-1;
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=yy*W+xx;L.solid[i]=0;L.room[i]=id;L.grass[i]=r.grass?1:0;if(r.type==='hall'||(r.type==='pool'&&w*h>=42))L.ceil[i]=HALL_H;}
    if(r.type==='pool'){const ins=(w>=7&&h>=7)?2:1;for(let yy=y+ins;yy<y+h-ins;yy++)for(let xx=x+ins;xx<x+w-ins;xx++)L.pool[yy*W+xx]=1;}
    if(r.type==='hall'&&!city){for(let yy=y+1;yy<y+h-1;yy++)for(let xx=x+1;xx<x+w-1;xx++)if((xx-x)%3===2&&(yy-y)%3===2)L.solid[yy*W+xx]=1;}
  }
  if(opts.arena||opts.ending){const r=opts.arena?{x:3,y:3,w:14,h:14}:{x:5,y:2,w:8,h:14};Object.assign(r,{cx:r.x+(r.w>>1),cy:r.y+(r.h>>1),type:'plain',grass:false});rooms.push(r);
    for(let yy=r.y;yy<r.y+r.h;yy++)for(let xx=r.x;xx<r.x+r.w;xx++){const i=yy*W+xx;L.solid[i]=0;L.room[i]=0;L.ceil[i]=opts.arena?HALL_H:WALL_H;}
    if(opts.arena){for(let yy=7;yy<13;yy++)for(let xx=7;xx<13;xx++)L.pool[yy*W+xx]=1;for(const [px,py] of [[5,5],[14,5],[5,14],[14,14]])L.solid[py*W+px]=1;}
    else{for(let yy=4;yy<13;yy++)for(let xx=7;xx<11;xx++)L.pool[yy*W+xx]=1;}}
  const carve=(x,y)=>{if(x<1||y<1||x>=W-1||y>=H-1)return;L.solid[y*W+x]=0;};
  const corridor=(a,b)=>{let x=a.cx,y=a.cy;const wide=Math.random()<(city?0.65:0.3);const hf=Math.random()<0.5;
    const stepX=()=>{while(x!==b.cx){carve(x,y);if(wide)carve(x,y+1);x+=Math.sign(b.cx-x);}};
    const stepY=()=>{while(y!==b.cy){carve(x,y);if(wide)carve(x+1,y);y+=Math.sign(b.cy-y);}};
    if(hf){stepX();stepY();}else{stepY();stepX();}carve(x,y);};
  for(let i=1;i<rooms.length;i++){let best=0,bd=1e9;for(let j=0;j<i;j++){const d=Math.hypot(rooms[i].cx-rooms[j].cx,rooms[i].cy-rooms[j].cy);if(d<bd){bd=d;best=j;}}corridor(rooms[i],rooms[best]);}
  for(let k=0;k<(city?5:3);k++){const a=pick(rooms),b=pick(rooms);if(a!==b)corridor(a,b);}
  const sr=rooms.find(r=>r.type==='plain')||rooms[0];L.startRoom=rooms.indexOf(sr);
  const openCellIn=(r,nopool)=>{const c=[];for(let yy=r.y;yy<r.y+r.h;yy++)for(let xx=r.x;xx<r.x+r.w;xx++){const i=yy*W+xx;if(!L.solid[i]&&!(nopool&&L.pool[i]))c.push([xx,yy]);}
    c.sort((p,q)=>Math.hypot(p[0]-r.cx,p[1]-r.cy)-Math.hypot(q[0]-r.cx,q[1]-r.cy));return c;};
  L.openCellIn=openCellIn;
  const sc=openCellIn(sr,true)[0]||[sr.cx,sr.cy];L.start=sc;
  const d=new Int16Array(W*H).fill(-1);const q=[sc[1]*W+sc[0]];d[q[0]]=0;
  for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cy=(c/W)|0;for(const o of N4){const n=(cy+o[1])*W+cx+o[0];if(!L.solid[n]&&d[n]<0){d[n]=d[c]+1;q.push(n);}}}
  for(let i=0;i<W*H;i++)if(!L.solid[i]&&d[i]<0)L.solid[i]=1;
  if(open){L.ceil.fill(90);for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;const bx=Math.floor(x/3),by=Math.floor(y/3);
    L.bh[i]=dream?(L.room[i]>=0?ri(5,8):5+Math.floor(pnlHash(bx+floor*7,by)*9)):(L.room[i]>=0?ri(3,5):8+Math.floor(pnlHash(bx+floor*7,by)*26));L.tint[i]=frac(pnlHash(by+3,bx+floor)*3.7);}}
  if(sky){for(let i=0;i<W*H;i++){if(!L.solid[i])continue;const x=i%W,y=(i/W)|0;let adj=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=cidx(x+dx,y+dy);if(j>=0&&!L.solid[j])adj=true;}
    if(L.room[i]>=0)L.bh[i]=ri(6,9);else if(adj&&x>0&&y>0&&x<W-1&&y<H-1&&pnlHash(Math.floor(x/2)+floor*3,Math.floor(y/2))<0.32)L.bh[i]=6+Math.floor(pnlHash(x,y+floor)*18);else L.voidc[i]=1;}}
  const openCells=[];for(let i=0;i<W*H;i++)if(!L.solid[i])openCells.push(i);L.openCells=openCells;
  if(!opts.death){
    let er=sr,ed=-1;for(const r of rooms){const c=openCellIn(r,true)[0];if(!c)continue;const dd=d[c[1]*W+c[0]];if(dd>ed){ed=dd;er=r;}}
    const ec=openCellIn(er,true)[0]||[er.cx,er.cy];
    L.exit={x:ec[0]*CELL+CELL/2,z:ec[1]*CELL+CELL/2,cell:ec[1]*W+ec[0]};
    const cand=rooms.filter(r=>r!==sr&&openCellIn(r).length).sort(()=>Math.random()-0.5);
    cand.sort((a,b)=>(b!==er)-(a!==er));
    L.coresNeed=Math.min(3+(floor>=5?1:0),cand.length);
    for(let k=0;k<L.coresNeed;k++){const cs=openCellIn(cand[k]);const c=cs[Math.min(cs.length-1,ri(0,2))];
      const i=c[1]*W+c[0];L.pickups.push({type:'core',x:c[0]*CELL+CELL/2,z:c[1]*CELL+CELL/2,y:floorOf(i)+1.3,t:rnd(9)});}
    const scatter=(type,n,h)=>{for(let k=0;k<n;k++){const i=pick(openCells);L.pickups.push({type,x:(i%W)*CELL+rnd(0.8,3.2),z:((i/W)|0)*CELL+rnd(0.8,3.2),y:Math.max(floorOf(i),WATER_Y)+h,t:rnd(9)});}};
    scatter('token',10+floor*2,0.6);scatter('hp',2,0.7);scatter('ammo',3,0.6);
    const missing=TAPES.map((_,i)=>i).filter(i=>!SAVE.tapes.includes(i));
    if(missing.length&&Math.random()<0.75){const i=pick(openCells);L.pickups.push({type:'tape',id:pick(missing),x:(i%W)*CELL+2,z:((i/W)|0)*CELL+2,y:floorOf(i)+0.9,t:0});}
  }else setupDeathMap();
  if(opts.arena){L.start=[10,16];L.exit={x:10*CELL+2,z:4*CELL+2,cell:4*W+10};L.coresNeed=0;L.pickups=L.pickups.filter(q=>q.type==='hp'||q.type==='ammo');
    for(let k=0;k<4;k++)L.pickups.push({type:k<2?'ammo':'hp',x:(k%2?15:4)*CELL+2,z:(k<2?6:13)*CELL+2,y:0.7,t:0});}
  if(opts.ending){L.start=[9,14];L.exit=null;L.coresNeed=0;L.pickups=[];L.npc={x:9*CELL+0.5,z:2*CELL+2.5};}
  if(theme==='pool'){
    for(let i=0;i<W*H;i++){if(L.solid[i])continue;const x=i%W,y=(i/W)|0;if((x+y)&1)continue;
      const r=Math.random();const st=r<0.05+0.015*floor?2:r<0.11+0.025*floor?1:0;
      L.lights.push({x:x*CELL+CELL/2,y:L.ceil[i]-0.3,z:y*CELL+CELL/2,st,ph:pnlHash(x,y),cx:x,cy:y});}
    const k=Math.min(1,(floor-1)/7);
    L.fogBase=[lerp(0.56,0.22,k),lerp(0.67,0.3,k),lerp(0.66,0.31,k)];L.fogD=0.028+k*0.02;
  }else if(city){
    L.sky=CITYSKY[(opts.variant||0)%3];const s=L.sky.sun,sl=Math.hypot(...s);L.sunDir=s.map(v=>v/sl);
    L.fogBase=L.sky.h.slice();L.fogD=0.011;
    for(const i of openCells){if(!L.grass[i]||L.pool[i]||Math.random()>0.22)continue;const x=(i%W)*CELL+rnd(0.8,3.2),z=((i/W)|0)*CELL+rnd(0.8,3.2);
      if(Math.hypot(x-(sc[0]*CELL+2),z-(sc[1]*CELL+2))<4)continue;const h=rnd(2,3.4);L.trees.push({x,z,h,s:rnd(1.1,1.7),ph:rnd(TAU)});L.props.push({x,z,r:0.3});}
    for(let k=0;k<16;k++)L.decor.push({x:rnd(W*CELL),z:rnd(H*CELL),y:rnd(12,40),r:rnd(1.5,5),ph:rnd(TAU)});
    L.decor.push({x:W*CELL/2,z:H*CELL/2,y:55,r:16,ph:0,chrome:true});
  }else if(sky){
    L.sky={h:[0.86,0.95,1.0],z:[0.22,0.58,1.0],sun:[0.3,0.85,0.25],sc:[1.05,1.0,0.95]};const sl=Math.hypot(...L.sky.sun);L.sunDir=L.sky.sun.map(v=>v/sl);
    L.fogBase=[0.84,0.93,1.0];L.fogD=0.008;
    for(let k=0;k<30;k++){const cy=k<21?rnd(-26,-8):rnd(18,40);const n=ri(4,6),sz=rnd(3,7);const parts=[];for(let q=0;q<n;q++)parts.push([rnd(-1,1)*sz,rnd(-0.3,0.4)*sz*0.5,rnd(-1,1)*sz*0.6,sz*rnd(0.5,0.9)]);
      L.decor.push({type:'cloud',x:rnd(-20,W*CELL+20),y:cy,z:rnd(-20,H*CELL+20),parts,sp:rnd(0.2,0.6)});}
    for(let k=0;k<14;k++)L.decor.push({type:'shard',x:rnd(W*CELL),z:rnd(H*CELL),y:rnd(3,22),r:rnd(0.6,1.8),ph:rnd(TAU)});
  }else{
    L.fogBase=[0.7,0.55,0.8];L.fogD=0.016;L.lamps=[];
    for(const i of openCells){if(Math.random()>0.1)continue;L.lamps.push({x:(i%W)*CELL+2,y:rnd(2.6,3.6),z:((i/W)|0)*CELL+2,ph:Math.random()});}
    for(let k=0;k<9;k++)L.decor.push({type:'eye',x:rnd(W*CELL),z:rnd(H*CELL),y:rnd(16,36),r:rnd(2.5,5),ph:Math.random()});
    for(let k=0;k<22;k++)L.decor.push({type:'balloon',x:rnd(W*CELL),z:rnd(H*CELL),y:rnd(0,40),r:rnd(0.6,1.2),ph:rnd(TAU),col:pick(BALLCOLS)});
    L.decor.push({type:'moon',x:W*CELL/2,z:H*CELL/2,y:75,r:22});
  }
  placeArt();placeOddities();
  buildLevelGeom();
  return L;
}
function placeArt(){const W=L.W,th=L.theme;L.art=[];const cand=[];
  for(const i of L.openCells){if(L.exit&&i===L.exit.cell)continue;const x=i%W,y=(i/W)|0;
    for(const [ox,oy] of N4){const j=cidx(x+ox,y+oy);if(j<0||!L.solid[j]||L.voidc[j])continue;cand.push([x,y,ox,oy]);}}
  shuffle(cand);const n=Math.min(th==='sky'?6:18,cand.length);
  const frames=[[1,0.82,0.45],[0.95,0.95,0.97],[0.35,0.22,0.12],[0.3,0.75,0.9]];
  for(let k=0;k<n;k++){const [x,y,ox,oy]=cand[k];const w=rnd(1.0,1.6),h=w*rnd(0.72,1.25);const along=rnd(-0.9,0.9);
    L.art.push({x:x*CELL+2+ox*1.94+(oy?along:0),z:y*CELL+2+oy*1.94+(ox?along:0),y:th==='dream'?2.1:1.8,yaw:Math.atan2(-ox,-oy),w,h,v:ri(0,7),frame:pick(frames)});}
  if(th==='sky')for(let k=0;k<6;k++){const i=pick(L.openCells);const w=rnd(1.4,2.4);L.art.push({x:(i%W)*CELL+2,z:((i/W)|0)*CELL+2,y:rnd(3.5,6.5),yaw:rnd(TAU),w,h:w*rnd(0.75,1.2),v:ri(0,7),frame:[0.95,0.95,0.97],float:true});}}
function placeOddities(){const W=L.W,th=L.theme;L.odd=[];
  const pools=L.openCells.filter(i=>L.pool[i]);
  if(pools.length&&(th==='pool'||L.ending||Math.random()<0.6)){const i=pick(pools);L.odd.push({type:'whale',x:(i%W)*CELL+2,z:((i/W)|0)*CELL+2,y:-0.35,s:L.ending?0.85:0.72,yaw:rnd(TAU),ph:rnd(TAU),still:true});}
  if(th!=='pool'){for(let k=0;k<(th==='sky'?3:2);k++)L.odd.push({type:'whale',cx:rnd(W*CELL),cz:rnd(L.H*CELL),y:th==='sky'?rnd(-4,14):rnd(26,46),s:rnd(1,1.8),ph:rnd(TAU),orbit:rnd(22,42)});
    for(let k=0;k<(th==='sky'?3:1);k++)L.odd.push({type:'house',x:rnd(W*CELL),z:rnd(L.H*CELL),y:th==='sky'?rnd(-6,12):rnd(18,34),s:rnd(0.8,1.4),yaw:rnd(TAU),ph:rnd(TAU),flip:th==='dream'});}
  else{const tall=L.openCells.filter(i=>L.ceil[i]>5&&!L.pool[i]);if(tall.length){const i=pick(tall);L.odd.push({type:'house',x:(i%W)*CELL+2,z:((i/W)|0)*CELL+2,y:4.4,s:0.3,yaw:rnd(TAU),ph:rnd(TAU)});}
    for(let k=0;k<2;k++){const c2=pick(L.openCells);L.odd.push({type:'chair',x:(c2%W)*CELL+2,z:((c2/W)|0)*CELL+2,y:k?1.5:0,s:0.55,yaw:rnd(TAU),ph:rnd(TAU),tilt:k?0.4:0});}}}
function drawArt(cam){for(const a of L.art){const dx=a.x-cam.x,dz=a.z-cam.z;if(dx*dx+dz*dz>1800)continue;
    if((dx*cam.f[0]+dz*cam.f[2])<0&&Math.random()<0.0006)a.v=ri(0,7);
    const b=Xf.at(a.x,a.y+(a.float?Math.sin(L.t*0.5+a.v)*0.4:0),a.z).ry(a.yaw+(a.float?L.t*0.15:0));
    SH.setUniform('uVar',a.v);part(G_QUAD,M.PAINT,b.s(a.w,a.h,1),[1,1,1]);
    const fw=0.09,fc=a.frame;part(G_BOX,M.CHROME,b.t(0,a.h/2+fw/2,0).s(a.w+fw*2,fw,0.07),fc);part(G_BOX,M.CHROME,b.t(0,-a.h/2-fw/2,0).s(a.w+fw*2,fw,0.07),fc);
    part(G_BOX,M.CHROME,b.t(a.w/2+fw/2,0,0).s(fw,a.h,0.07),fc);part(G_BOX,M.CHROME,b.t(-a.w/2-fw/2,0,0).s(fw,a.h,0.07),fc);}}
function drawOdd(cam){for(const o of L.odd){let x=o.x,z=o.z,yaw=o.yaw||0;
    if(o.orbit){const a=L.t*0.035+o.ph;x=o.cx+Math.cos(a)*o.orbit;z=o.cz+Math.sin(a)*o.orbit;yaw=Math.atan2(-Math.sin(a),Math.cos(a));}
    if(Math.hypot(x-cam.x,z-cam.z)>170)continue;
    const y=o.y+Math.sin(L.t*0.5+o.ph)*(o.still?0.05:0.9);const t=L.t+o.ph;
    if(o.type==='whale'){const b=new Xf(Mat.T(x,y,z)).ry(yaw).s(o.s);const sw=o.still?Math.sin(t*0.6)*0.06:Math.sin(t*1.1)*0.3;const dk=[0.2,0.27,0.36],bl=[0.74,0.78,0.8];
      part(G_SPH,M.SKIN,b.s(2.2,1.7,6),dk);part(G_SPH,M.SKIN,b.t(0,-0.45,0.4).s(1.8,1.0,5.2),bl);
      const tl=b.t(0,0.1,-2.7).ry(sw);part(G_SPH,M.SKIN,tl.t(0,0,-0.6).s(0.9,0.7,1.9),dk);
      for(const sx of [-1,1]){part(G_BOX,M.SKIN,tl.t(sx*0.8,0,-1.5).ry(sx*0.5).s(1.6,0.12,0.7),dk);part(G_BOX,M.SKIN,b.t(sx*1.1,-0.5,1.2).rz(sx*0.5).rx(Math.sin(t)*0.2).s(1.4,0.1,0.6),dk);
        part(G_SPH,M.EYE,b.t(sx*1.0,-0.1,2.2).s(0.17),[0.9,0.85,0.7]);}
      part(G_BOX,M.SKIN,b.t(0,-0.35,2.6).s(1.6,0.05,0.8),[0.04,0.04,0.06]);}
    else if(o.type==='house'){const b=new Xf(Mat.T(x,y,z)).ry(yaw+L.t*0.03).rx(o.flip?Math.PI:Math.sin(t*0.3)*0.06).s(o.s);const lit=Math.sin(t*7)>-0.7;
      part(G_BOX,M.SKIN,b.t(0,1,0).s(3,2,2.4),[0.93,0.9,0.84]);part(G_BOX,M.SKIN,b.t(0,2.0,0).rz(Math.PI/4).s(1.5,1.5,2.6),[0.55,0.2,0.18]);
      part(G_BOX,M.SKIN,b.t(0.5,0.6,1.21).s(0.5,1.1,0.04),[0.25,0.35,0.6]);part(G_BOX,M.EYE,b.t(-0.8,1.2,1.21).s(0.6,0.5,0.03),lit?[1,0.85,0.45]:[0.05,0.05,0.05]);
      part(G_BOX,M.EYE,b.t(1.51,1.2,0).s(0.03,0.5,0.6),lit?[1,0.85,0.45]:[0.05,0.05,0.05]);part(G_BOX,M.SKIN,b.t(-0.9,2.9,0.4).s(0.35,0.9,0.35),[0.45,0.3,0.25]);
      part(G_CONE,M.SKIN,b.t(0,-0.9,0).rx(Math.PI).s(3.2,1.8,2.6),[0.35,0.28,0.2]);}
    else if(o.type==='chair'){const b=new Xf(Mat.T(x,y,z)).ry(yaw+L.t*0.05).rz(o.tilt).s(o.s);const wc=[0.96,0.96,0.94];
      for(const [lx,lz] of [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]])part(G_BOX,M.SKIN,b.t(lx,1.5,lz).s(0.1,3,0.1),wc);
      part(G_BOX,M.SKIN,b.t(0,3.0,0).s(1.4,0.12,1.3),wc);part(G_BOX,M.SKIN,b.t(0,3.6,-0.6).s(1.4,1.1,0.1),wc);
      for(let k=0;k<5;k++)part(G_BOX,M.SKIN,b.t(0,0.5+k*0.5,0.62).s(1.2,0.07,0.07),wc);
      part(G_TOR,M.SKIN,b.t(0.75,3.2,0.2).rz(Math.PI/2).s(0.9),[0.85,0.12,0.12]);}}}


function setupDeathMap(){
  const W=L.W;
  const NM=L.theme==='dream'?CIRCUSNAMES:ROOMNAMES;L.rooms.forEach((r,id)=>{r.name=NM[id%NM.length];});
  for(let id=0;id<L.rooms.length;id++){if(id===L.startRoom)continue;const r=L.rooms[id];const cells=[];
    for(let yy=r.y;yy<r.y+r.h;yy++)for(let xx=r.x;xx<r.x+r.w;xx++){const i=yy*W+xx;if(L.solid[i])continue;
      for(const o of N4){const n=cidx(xx+o[0],yy+o[1]);if(n<0||L.solid[n]||L.room[n]>=0||L.lock[n])continue;
        let nearStart=false;for(const o2 of N4){const m=cidx((n%W)+o2[0],((n/W)|0)+o2[1]);if(m>=0&&L.room[m]===L.startRoom)nearStart=true;}
        if(nearStart)continue;L.lock[n]=id+1;cells.push(n);}}
    if(cells.length)L.doors.push({room:id,name:r.name,cells,open:false});}
  const types=shuffle(['terminal','weapon','ammo','terminal','weapon','ammo','terminal','weapon','ammo','terminal','weapon','ammo','terminal']);
  L.rooms.forEach((r,id)=>{const cs=L.openCellIn(r,true);if(!cs.length)return;const c=id===L.startRoom?(cs[2]||cs[cs.length-1]):cs[0];
    const type=id===L.startRoom?'ammo':types.pop()||'ammo';const x=c[0]*CELL+CELL/2+rnd(-0.6,0.6),z=c[1]*CELL+CELL/2+rnd(-0.6,0.6);
    L.stations.push({type,x,z,room:id,yaw:rnd(TAU)});L.props.push({x,z,r:0.55});});
}

function buildLevelGeom(){
  const g=makeGeom('map'),w=makeGeom('water'),gg=makeGeom('glass'),Wd=L.W,city=L.theme==='city',dream=L.theme==='dream',sky=L.theme==='sky',open=city||dream||sky;
  const WM=dream?M.DWALL:M.BUILDING,FM=dream?M.DFLOOR:sky?M.SKYFLOOR:M.CITYFLOOR,PT=dream?M.DWALL:M.POOLT;
  const isPool=(x,y)=>{const i=cidx(x,y);return i>=0&&!L.solid[i]&&L.pool[i];};
  const wetC={};
  const wet=(cx,cz)=>{const k=cx+','+cz;if(wetC[k]!==undefined)return wetC[k];let s=0;for(let y=cz-2;y<=cz+1;y++)for(let x=cx-2;x<=cx+1;x++)s+=isPool(x,y)?1:0;return wetC[k]=Math.min(1,s/16*1.8);};
  const wv=pts=>pts.map(p=>wet(Math.round(p[0]/CELL),Math.round(p[2]/CELL)));
  const wall=(p,q,yb,yt,n,mat,vs)=>{if(yt-yb<0.01)return;const P=[[p[0],yb,p[1]],[q[0],yb,q[1]],[q[0],yt,q[1]],[p[0],yt,p[1]]];addQuad(g,P,n,mat,vs||wv(P));};
  for(let y=0;y<L.H;y++)for(let x=0;x<Wd;x++){
    const i=y*Wd+x,x0=x*CELL,x1=x0+CELL,z0=y*CELL,z1=z0+CELL;
    const edges=[[1,0,[x1,z0],[x1,z1],[-1,0,0]],[-1,0,[x0,z1],[x0,z0],[1,0,0]],[0,1,[x1,z1],[x0,z1],[0,0,-1]],[0,-1,[x0,z0],[x1,z0],[0,0,1]]];
    if(L.solid[i]){
      if(sky){if(L.voidc[i])continue;const bh=L.bh[i];
        addQuad(gg,[[x0,bh,z0],[x1,bh,z0],[x1,bh,z1],[x0,bh,z1]],[0,1,0],M.GLASSBLD,[0,0,0,0]);addQuad(gg,[[x0,-8,z0],[x1,-8,z0],[x1,-8,z1],[x0,-8,z1]],[0,-1,0],M.GLASSBLD,[0,0,0,0]);
        for(const [ox,oy,p,q,n] of edges){const j=cidx(x+ox,y+oy);if(j<0||!L.solid[j]||L.voidc[j]||L.bh[j]<bh)addQuad(gg,[[q[0],-8,q[1]],[p[0],-8,p[1]],[p[0],bh,p[1]],[q[0],bh,q[1]]],n.map(v=>-v),M.GLASSBLD,[0,0,0,0]);}
        continue;}
      if(!open)continue;const bh=L.bh[i],t=L.tint[i];
      addQuad(g,[[x0,bh,z0],[x1,bh,z0],[x1,bh,z1],[x0,bh,z1]],[0,1,0],FM,[0,0,0,0]);
      for(const [ox,oy,p,q,n] of edges){const j=cidx(x+ox,y+oy);if(j>=0&&L.solid[j]&&L.bh[j]<bh)wall(q,p,L.bh[j],bh,n.map(v=>-v),WM,[t,t,t,t]);}
      continue;}
    const fy=floorOf(i),cy=L.ceil[i];
    let P=[[x0,fy,z0],[x1,fy,z0],[x1,fy,z1],[x0,fy,z1]];
    const isExit=L.exit&&i===L.exit.cell;
    if(isExit)buildStairs(g,x0,x1,z0,z1);
    else if(L.pool[i])addQuad(g,P,[0,1,0],dream?M.DFLOOR:M.POOLT,wv(P));
    else if(sky)addQuad(g,P,[0,1,0],M.SKYFLOOR,[0,0,0,0]);
    else if(city)addQuad(g,P,[0,1,0],M.CITYFLOOR,wv(P).map(v=>v+(L.grass[i]?2:0)));
    else if(dream)addQuad(g,P,[0,1,0],M.DFLOOR,wv(P));
    else addQuad(g,P,[0,1,0],M.FLOOR,wv(P));
    if(!open){P=[[x0,cy,z0],[x1,cy,z0],[x1,cy,z1],[x0,cy,z1]];addQuad(g,P,[0,-1,0],M.CEIL,wv(P));}
    if(sky&&!isExit){const ub=fy-0.6;addQuad(g,[[x0,ub,z0],[x1,ub,z0],[x1,ub,z1],[x0,ub,z1]],[0,-1,0],M.SKYFLOOR,[1,1,1,1]);}
    if(L.pool[i])addQuad(w,[[x0,WATER_Y,z0],[x1,WATER_Y,z0],[x1,WATER_Y,z1],[x0,WATER_Y,z1]],[0,1,0],M.WATER,[0,0,0,0]);
    for(const [ox,oy,p,q,n] of edges){
      const j=cidx(x+ox,y+oy);
      if(j<0||L.solid[j]){
        if(fy<0)wall(p,q,fy,0,n,PT);
        if(sky){if(!isExit)wall(p,q,fy-0.6,fy,n,M.SKYFLOOR,[2,2,2,2]);}
        else if(open){const t=j<0?0.5:L.tint[j];wall(p,q,0,j<0?(dream?10:30):L.bh[j],n,WM,[t,t,t,t]);}
        else wall(p,q,0,cy,n,M.WALL);
      }else{const nf=floorOf(j);if(nf>fy)wall(p,q,fy,nf,n,PT);if(!open){const nc=L.ceil[j];if(nc<cy)wall(p,q,nc,cy,n,M.WALL);}}
    }
  }
  for(const l of L.lights){const c=l.y+0.27,h=1.0;addQuad(g,[[l.x-h,c,l.z-h],[l.x+h,c,l.z-h],[l.x+h,c,l.z+h],[l.x-h,c,l.z+h]],[0,-1,0],M.PANEL,[l.st,l.st,l.st,l.st]);}
  L.geom=g;L.water=w.vertices.length?w:null;L.glass=gg.vertices.length?gg:null;
}
function buildStairs(g,x0,x1,z0,z1){
  const th=L.theme,D=4.5,N=9;
  const FM=th==='pool'?M.FLOOR:th==='city'?M.CITYFLOOR:th==='dream'?M.DFLOOR:M.SKYFLOOR;
  const WMt=th==='pool'?M.WALL:th==='city'?M.CITYFLOOR:th==='dream'?M.DWALL:M.SKYFLOOR;const wa=th==='sky'?1:0;
  const hz=k=>z0+(z1-z0)*k/N,hy=k=>-Math.min(k,N-1)/(N-1)*D;
  for(let k=0;k<N;k++){const y=hy(k);addQuad(g,[[x0,y,hz(k)],[x1,y,hz(k)],[x1,y,hz(k+1)],[x0,y,hz(k+1)]],[0,1,0],FM,[0,0,0,0]);
    if(k>0)addQuad(g,[[x0,hy(k),hz(k)],[x1,hy(k),hz(k)],[x1,hy(k-1),hz(k)],[x0,hy(k-1),hz(k)]],[0,0,-1],FM,[0,0,0,0]);}
  const yb=-D-0.1;
  addQuad(g,[[x0,yb,z0],[x0,yb,z1],[x0,0,z1],[x0,0,z0]],[1,0,0],WMt,[wa,wa,wa,wa]);
  addQuad(g,[[x1,yb,z1],[x1,yb,z0],[x1,0,z0],[x1,0,z1]],[-1,0,0],WMt,[wa,wa,wa,wa]);
  addQuad(g,[[x1,yb,z1],[x0,yb,z1],[x0,0,z1],[x1,0,z1]],[0,0,-1],WMt,[wa,wa,wa,wa]);
}
