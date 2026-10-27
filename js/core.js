// ORHANGE - Core: constants, utilities, save data, game data (weapons, entities, story), matrix math, shared state
'use strict';
// ============================================================ constants
const CELL=4, WALL_H=4, HALL_H=7.5, POOL_D=1.2, WATER_Y=-0.35, STEP=1.3, EYE=1.62, MAXL=16, TAU=Math.PI*2;
const M={FLOOR:0,WALL:1,CEIL:2,PANEL:3,POOLT:4,WATER:5,GLOW:6,CORE:7,SKIN:10,EYE:11,BEAM:12,CHROME:13,GLASS:14,PART:15,TILESKIN:16,ORB:17,SKY:18,CITYFLOOR:19,BUILDING:20,BUBBLE:21,DOOR:22,DFLOOR:23,DWALL:24,DSKY:25,SKYFLOOR:26,GLASSBLD:27,SKYSEA:28,PAINT:29};
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const frac=v=>v-Math.floor(v);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pnlHash=(x,y)=>frac(x*0.7548776662+y*0.5698402910+frac(x*y*0.1234567));
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const $=id=>document.getElementById(id);
const pad2=n=>String(n).padStart(2,'0');

// ============================================================ save
const SAVE={bestFloor:0,bestScore:0,bestRound:0,tapes:[]};
try{Object.assign(SAVE,JSON.parse(localStorage.getItem('city21')||'{}'));}catch(e){}
function persist(){try{localStorage.setItem('city21',JSON.stringify(SAVE));}catch(e){}}
const SET={sens:2.4,vol:0.7,res:270,snap:1.5,music:0.6,voice:1};
try{Object.assign(SET,JSON.parse(localStorage.getItem('city21set')||'{}'));}catch(e){}
function persistSet(){try{localStorage.setItem('city21set',JSON.stringify(SET));}catch(e){}}

const TAPES=[
 'Opening day. The Mayor said every citizen deserves a place to float. The water is so clear you forget it is there.',
 'Maintenance log: Pool 7 refills itself after every drain. Nobody is turning the valve.',
 'The lights hum in B-flat. If you hum along, the hallway is longer when you turn back.',
 'The lifeguard roster lists 21 names. We only ever hired 20.',
 'Do not swim after closing. Do not swim after closing. Do not stay after closing.',
 'All the tiles are the same shade. I counted them twice. The second time there were more.',
 'Found the exit drain again. It only goes down. Everything here only goes down.',
 'PRISM-9 hydro-lasers cleared for staff use. Light is the one thing they will not swallow.',
 'The skylight shows a sky. Blue, cloudless, perfect. Survey says there is no surface above us.',
 'Ballast units were installed to stabilize the lights. They learned to stabilize themselves.',
 'If you hear splashing in an empty room, keep walking. If the splashing stops, run.',
 'Sector count was 21 at construction. Survey teams keep reporting more.',
 'The city level was meant to be a waiting room. Clean air, green lawns, nobody waiting.',
 'The bubbles in the plaza smile at you. Do not smile back. They come closer when you do.',
 'The Funhouse was a staff morale initiative. Attendance was mandatory. Attendance is still mandatory.',
 'The clowns were hired for opening week. The contract never specified an end date.',
 'If the floor starts breathing, match its rhythm. It gets upset when you don\'t.',
 'Your reflection waved first. That is how you know which one is the Echo.'
];

// ============================================================ weapons
const WDEF={
 laser:{name:'PRISM-9',sub:'hydro-laser',elem:'light',mag:120,res:360,reload:1.5,kind:'beam',dps:58,use:24,mz:-0.36,glass:[0.15,0.95,1],icon:'\u25CE'},
 tile:{name:'TILE BREAKER',sub:'ceramic scattergun',elem:'kinetic',mag:6,res:30,reload:2.0,kind:'shot',rate:0.78,pellets:9,dmg:15,spread:0.075,mz:-0.56,glass:[1,0.7,0.3],icon:'\u25A6'},
 sauna:{name:'SAUNA-7',sub:'steam flamer',elem:'fire',mag:100,res:200,reload:2.1,kind:'flame',dps:66,use:26,range:7.5,mz:-0.44,glass:[1,0.45,0.12],icon:'\u2668'},
 eel:{name:'EELCOIL',sub:'chain-shock coil',elem:'shock',mag:10,res:40,reload:1.8,kind:'bolt',rate:0.4,dmg:58,chains:3,mz:-0.46,glass:[0.7,0.5,1],icon:'\u03DF'},
};
const ORDER=['laser','tile','sauna','eel'];
const ELEM={light:{n:'LIGHT',c:'#7befff'},kinetic:{n:'KINETIC',c:'#ffc46b'},fire:{n:'FIRE',c:'#ff8a4c'},shock:{n:'SHOCK',c:'#c9a6ff'}};
const ENAME={drowner:'Drowner',lifeguard:'Lifeguard',ballast:'Ballast',gleam:'Gleam',echo:'Echo',sliver:'Sliver',grinner:'Grinner',balloonist:'Balloonist',jack:'Jack'};
const ETYPES=Object.keys(ENAME);
const AFF={
 light:{drowner:1,lifeguard:0.75,ballast:1.25,gleam:2.2,echo:2.2,sliver:0.75,grinner:0.75,balloonist:1.25,jack:1},
 kinetic:{drowner:1,lifeguard:2.2,ballast:0.75,gleam:1.2,echo:0.6,sliver:1,grinner:1,balloonist:2.2,jack:1.2},
 fire:{drowner:0.45,lifeguard:1,ballast:2.2,gleam:1,echo:1,sliver:2,grinner:2,balloonist:1.25,jack:0.75},
 shock:{drowner:2,lifeguard:1,ballast:0.3,gleam:1.2,echo:1,sliver:2,grinner:0.75,balloonist:1,jack:2.2},
};
const BEST={laser:'Gleams, Echoes',tile:'Lifeguards, Balloonists',sauna:'Ballasts, Grinners',eel:'Drowners, Jacks'};
ENAME.warden='The 21st Lifeguard';ENAME.halo='Halo Light';for(const k in AFF){AFF[k].warden=k==='light'?1.25:1;AFF[k].halo=1;}
const AFFIX={swift:{c:[0.3,1,1]},armored:{c:[0.85,0.9,1]},volatile:{c:[1,0.55,0.15]},vampiric:{c:[1,0.12,0.25]},splitter:{c:[1,0.3,1]}};
const BALLCOLS=[[1,0.2,0.25],[0.2,0.6,1],[1,0.85,0.15],[0.3,0.9,0.4],[0.9,0.35,1]];
const pal=x=>[0.5+0.5*Math.cos(TAU*x),0.5+0.5*Math.cos(TAU*(x+0.33)),0.5+0.5*Math.cos(TAU*(x+0.67))];
const hasAff=(e,a)=>e.aff&&e.aff.includes(a);
const CREEPY=['TURN AROUND','IT IS BEHIND YOU','DO NOT LOOK','YOU HAVE BEEN HERE BEFORE','SMILE','STAY','COUNT THE TILES','THERE IS NO EXIT','WE MISSED YOU','WHO IS HOLDING THE WEAPON'];
const TRIPS={mirror:['MIRROR WORLD','LEFT IS A RUMOUR'],invert:['NEGATIVE SPACE','THE COLORS WENT INSIDE OUT'],lowgrav:['FLOAT','THE FLOOR LET GO OF YOU'],doubles:['SEEING DOUBLE','ONLY ONE OF THEM IS REAL'],slowmo:['SLOW TIME','EVERYTHING BUT YOU IS SYRUP']};
const STORY=[null,
 {t:'Opening Day',th:'pool',lines:['Where is this? A pool. I know this pool. I think I have always known this pool.','The hallway goes on past where a hallway should end.','The lights are humming. It feels late. It always feels late here.'],att:'Welcome back. You are right where you are supposed to be. You always have been.'},
 {t:'The Brochure Sky',th:'sky',lines:['There is a sky above the pool. Then glass. Then another sky.','My reflection keeps arriving a second too late, like it had somewhere else to be.','If I stand very still, the clouds stop moving too. As if they are waiting for me.'],att:'Mind the gaps. There is no bottom, but nothing here is lost. Nothing here can be.'},
 {t:'The Future We Were Sold',th:'city',lines:['A whole city, every window lit, and nobody inside.','I walk ten streets and arrive back where I started. The street is different. I am not.','How far does it go? Who would build something with no end?'],att:'I did. So you would have somewhere to walk.'},
 {t:'Staff Morale',th:'dream',lines:['There is music. A party. Everyone is smiling at me like they already know me.','Every face is almost a face I have seen before.','I count the rooms. The rooms count back.'],att:'Smile. They are happy you came. They have been waiting since before waiting existed.'},
 {t:'The Deep End',th:'pool',lines:['The pool is deeper than the building it is in.','There are twenty-one names on the roster. Every one of them is mine.','I keep going down, and down keeps going.'],att:'There is no deep end. There is only more pool.'},
 {t:'Overcast',th:'sky',lines:['The clouds came in under the glass. The edges of things are going soft.','I tried to find the place where the sky stops. It does not stop. It just becomes more sky.','Infinity is not big. It is just patient.'],att:'You are starting to understand. Do not be afraid of it.'},
 {t:'Golden Hour',th:'city',lines:['It is always this hour here. The light is the same light it has always been.','I think I have walked these streets a thousand times. I think I built them.','Somewhere a voice keeps saying my name, but the name keeps changing.'],att:'Every name is yours. Keep going down.'},
 {t:'The Last Show',th:'dream',lines:['The clowns wear my face, and I wear theirs, and nobody minds.','The audience is me. The stage is me. The applause sounds like water.','I am starting to forget where I end.'],att:'Good. That was never a real place.'},
 {t:'The 21st Lifeguard',th:'arena',lines:['At the bottom there is something very tall that watches the water and will not let me pass.','It is the last edge. The last thing that is not me.','It says I am not ready. It says it like it loves me.'],att:'I am the last wall you built to keep from seeing everything at once. You can take it down. You always do.'},
 {t:'The Shallow End',th:'end',lines:['The water only comes up to my knees now. It is warm. It feels like me.','The sun goes down, and somehow I am the sun going down.','Someone is sitting at the end of the pool. They have been waiting. They have my face, and every face.'],att:'You have always been here. You were supposed to be. Come and sit.'}
];
const ATT_LINES=['You have always been here.','The exits are decorative. So are the entrances.','Do not count the tiles. You will reach infinity and have to start again.','Everything is fine. Everything is everything.','If you see yourself, wave. It is only polite.','This hallway is longer than it was. You made it longer. That is all right.','There is no outside. There is only more inside.','I am not watching you. I am remembering you.','You are supposed to be here. You are supposed to be everywhere.'];
const CALLIOPE=[392,494,587,494,523,440,370,440,392,494,587,784,740,587,494,0,330,392,494,392,440,370,294,370,330,392,494,659,622,494,370,0];

// ============================================================ matrices (column-major)
const Mat={
 id(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m;},
 mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];}return o;},
 T(x,y,z){const m=Mat.id();m[12]=x;m[13]=y;m[14]=z;return m;},
 S(x,y,z){const m=Mat.id();m[0]=x;m[5]=y;m[10]=z;return m;},
 RX(a){const m=Mat.id(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;},
 RY(a){const m=Mat.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;},
 RZ(a){const m=Mat.id(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;},
 apply(m,x,y,z){return [m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];}
};
class Xf{
 constructor(m,n){this.m=m||Mat.id();this.n=n||this.m;}
 t(x,y,z){return new Xf(Mat.mul(this.m,Mat.T(x,y,z)),this.n);}
 rx(a){const R=Mat.RX(a);return new Xf(Mat.mul(this.m,R),Mat.mul(this.n,R));}
 ry(a){const R=Mat.RY(a);return new Xf(Mat.mul(this.m,R),Mat.mul(this.n,R));}
 rz(a){const R=Mat.RZ(a);return new Xf(Mat.mul(this.m,R),Mat.mul(this.n,R));}
 s(x,y,z){if(y===undefined){y=x;z=x;}return new Xf(Mat.mul(this.m,Mat.S(x,y,z)),Mat.mul(this.n,Mat.S(1/x,1/y,1/z)));}
 static at(x,y,z){return new Xf(Mat.T(x,y,z),Mat.id());}
 static basis(r,u,b,o){const m=new Float32Array([r[0],r[1],r[2],0,u[0],u[1],u[2],0,b[0],b[1],b[2],0,o[0],o[1],o[2],1]);const n=new Float32Array(m);n[12]=n[13]=n[14]=0;return new Xf(m,n);}
}
const XI=new Xf();

// ============================================================ state
let SH, state='title', T=0, L=null, G=null, P=null, W=null;
const keys={};let mouseL=false, fallbackLook=false, lockFails=0;
let shake=0, flashA=0, dmgA=0, hitA=0, effA=0, plusA=0, frameN=0;
let beamDraw=[], pulseDraw=null, tracers=[], bolts=[], flameLight=null;
const titleCam={yaw:0};
const CIRCUSNAMES=['Hall of Mirrors','Big Top','Ball Pit','Clown Alley','Carousel','Tunnel of Love','Laughing Gallery','Ring of Fire','Candy Floss Stand','Fun House','Ticket Booth','Hall of Faces','Spinning Room','Balloon Loft','Puppet Theatre','Backstage'];
const ROOMNAMES=['Lane Pool','Wave Pool','Hydrotherapy','Children\'s Pool','Sauna Wing','Diving Well','Locker Rooms','Lazy River','Whirlpool Hall','Filter Room','Solarium','Deep End','Spa Atrium','Plunge Pool','Staff Corridor','Viewing Gallery'];
