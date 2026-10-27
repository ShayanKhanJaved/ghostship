// ORHANGE - Audio: sound effects and the ambient piano music engine
'use strict';
// ============================================================ audio
const AU={ctx:null,
 init(){if(this.ctx){this.ctx.resume();MUS.start();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const C=this.ctx=new AC();
  this.master=C.createGain();this.master.gain.value=SET.vol;this.master.connect(C.destination);
  this.verb=C.createConvolver();this.verb.buffer=this.impulse(3.2,2.4);this.wet=C.createGain();this.wet.gain.value=0.5;this.verb.connect(this.wet);this.wet.connect(this.master);
  this.bus=C.createGain();this.bus.connect(this.master);this.bus.connect(this.verb);
  this.nb=C.createBuffer(1,C.sampleRate,C.sampleRate);const nd=this.nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=300;this.humG=C.createGain();this.humG.gain.value=0;
  for(const [f,ty] of [[60,'sawtooth'],[120,'square'],[180.5,'sine']]){const o=C.createOscillator();o.type=ty;o.frequency.value=f;o.connect(lp);o.start();}
  lp.connect(this.humG);this.humG.connect(this.bus);
  const ns=C.createBufferSource();ns.buffer=this.nb;ns.loop=true;const wf=C.createBiquadFilter();wf.type='bandpass';wf.frequency.value=500;wf.Q.value=0.6;const wg=C.createGain();wg.gain.value=0.02;ns.connect(wf);wf.connect(wg);wg.connect(this.bus);ns.start();
  const dr=C.createOscillator();dr.type='sine';dr.frequency.value=48;const dg=C.createGain();dg.gain.value=0;dr.connect(dg);dg.connect(this.master);dr.start();this.drone=dg;
  const pad=C.createGain();pad.gain.value=0;pad.connect(this.bus);this.padG=pad;
  for(const f of [523.25,659.25,783.99,987.77]){const o=C.createOscillator();o.type='sine';o.frequency.value=f;const lf=C.createOscillator();lf.frequency.value=0.1+Math.random()*0.2;const lg=C.createGain();lg.gain.value=3;lf.connect(lg);lg.connect(o.frequency);lf.start();o.connect(pad);o.start();}
  const l1=C.createOscillator(),l2=C.createOscillator();l1.type='sawtooth';l2.type='square';l1.frequency.value=180;l2.frequency.value=271;
  const bp=C.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=2.5;this.lzG=C.createGain();this.lzG.gain.value=0;
  const lfo=C.createOscillator();lfo.frequency.value=31;const lg=C.createGain();lg.gain.value=40;lfo.connect(lg);lg.connect(l1.frequency);lfo.start();
  l1.connect(bp);l2.connect(bp);bp.connect(this.lzG);this.lzG.connect(this.bus);l1.start();l2.start();this.l1=l1;this.l2=l2;this.bp=bp;
  const fs=C.createBufferSource();fs.buffer=this.nb;fs.loop=true;const ff=C.createBiquadFilter();ff.type='bandpass';ff.frequency.value=900;ff.Q.value=0.5;this.flG=C.createGain();this.flG.gain.value=0;fs.connect(ff);ff.connect(this.flG);this.flG.connect(this.bus);fs.start();MUS.start();},
 impulse(sec,dec){const C=this.ctx,n=C.sampleRate*sec,b=C.createBuffer(2,n,C.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,dec);}return b;},
 vol(v){if(this.master)this.master.gain.value=v;},
 tone(f,dur,type,vol,to,pan,delay){const C=this.ctx;if(!C)return;const t=C.currentTime+(delay||0);const o=C.createOscillator(),g=C.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);this.route(g,pan);o.start(t);o.stop(t+dur+0.05);},
 noise(dur,vol,ft,f,q,pan,to,delay){const C=this.ctx;if(!C)return;const t=C.currentTime+(delay||0);const s=C.createBufferSource();s.buffer=this.nb;const fl=C.createBiquadFilter();fl.type=ft;fl.frequency.setValueAtTime(f,t);if(to)fl.frequency.exponentialRampToValueAtTime(to,t+dur);fl.Q.value=q||1;
  const g=C.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);this.route(g,pan);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);},
 route(n,pan){if(pan&&this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=clamp(pan,-1,1);n.connect(p);p.connect(this.bus);}else n.connect(this.bus);},
 at(name,x,z,v){if(!this.ctx||!P)return;const dx=x-P.x,dz=z-P.z,d=Math.hypot(dx,dz);const vol=(v||1)*clamp(1-d/34,0,1);if(vol<0.02)return;
  const rx=Math.cos(P.yaw),rz=Math.sin(P.yaw);const pan=(dx*rx+dz*rz)/(d||1)*0.85;this.play(name,vol,pan);},
 play(name,v=1,pan=0){if(!this.ctx)return;const r=Math.random();switch(name){
  case 'step':this.noise(0.05,0.06+r*0.03,'bandpass',2400+r*800,1.5);break;
  case 'grass':this.noise(0.07,0.05,'highpass',3500+r*1500,0.7);break;
  case 'wade':this.noise(0.22,0.07,'bandpass',700+r*300,0.8);break;
  case 'land':this.noise(0.12,0.12,'lowpass',600);break;
  case 'splash':this.noise(0.45,0.16*v,'bandpass',900,0.7,pan,300);break;
  case 'coin':[1568,2093].forEach((f,i)=>this.tone(f*(1+r*0.02),0.18,'sine',0.07,0,0,i*0.05));break;
  case 'heal':[784,988,1175].forEach((f,i)=>this.tone(f,0.25,'triangle',0.08,0,0,i*0.06));break;
  case 'ammo':this.noise(0.08,0.12,'bandpass',1800,2);this.tone(660,0.1,'square',0.04,0,0,0.06);break;
  case 'core':[1047,1319,1568,2093,2637].forEach((f,i)=>this.tone(f,0.6,'sine',0.09,0,0,i*0.07));this.tone(523,1.2,'triangle',0.06);break;
  case 'tape':this.noise(0.3,0.05,'highpass',3000);[392,494,587].forEach((f,i)=>this.tone(f,0.5,'square',0.03,0,0,0.2+i*0.12));break;
  case 'hurt':this.tone(110,0.3,'square',0.18,40);this.noise(0.25,0.2,'lowpass',500);break;
  case 'kill':this.noise(0.5,0.22*v,'bandpass',3000,2,pan,200);this.tone(700,0.4,'sawtooth',0.06*v,60,pan);break;
  case 'pulse':this.tone(1400,0.4,'sawtooth',0.18,70);this.noise(0.3,0.2,'highpass',1500,1,0,6000);this.tone(55,0.5,'sine',0.35,30);break;
  case 'shot':this.noise(0.35,0.35,'lowpass',2500,0.7,0,200);this.tone(90,0.25,'sine',0.35,40);this.noise(0.06,0.2,'highpass',4000,1,0,0,0.25);break;
  case 'zap':this.tone(1800,0.18,'sawtooth',0.12,200);this.noise(0.15,0.15,'bandpass',5000,3);break;
  case 'reload':this.noise(0.06,0.12,'bandpass',2500,4);this.noise(0.08,0.12,'bandpass',1500,4,0,0,0.25);break;
  case 'ready':this.tone(1320,0.12,'sine',0.06);this.tone(1760,0.15,'sine',0.06,0,0,0.08);break;
  case 'swap':this.noise(0.08,0.08,'bandpass',3000,3);break;
  case 'dry':this.tone(2200,0.04,'square',0.05);break;
  case 'deny':this.tone(180,0.12,'square',0.06);break;
  case 'buy':[880,1320].forEach((f,i)=>this.tone(f,0.2,'sine',0.08,0,0,i*0.08));break;
  case 'door':this.noise(0.9,0.15,'bandpass',600,0.6,0,2400);this.tone(220,0.8,'triangle',0.08,440);break;
  case 'round':this.tone(98,2.5,'sawtooth',0.08,92);this.tone(147,2.5,'sawtooth',0.06,139);this.noise(1.5,0.08,'lowpass',300);break;
  case 'roundEnd':[784,988,1175,1568].forEach((f,i)=>this.tone(f,0.5,'sine',0.07,0,0,i*0.1));break;
  case 'dash':this.noise(0.25,0.12,'bandpass',1200,1,0,4000);break;
  case 'orb':this.tone(400,0.35,'sine',0.12*v,1100,pan);break;
  case 'pop':this.tone(900,0.12,'sine',0.1*v,300,pan);break;
  case 'swell':this.tone(300,0.55,'sine',0.14*v,1200,pan);break;
  case 'burst':this.noise(0.4,0.3*v,'lowpass',3000,1,pan,300);this.tone(1200,0.3,'sine',0.12*v,200,pan);break;
  case 'whistle':for(let k=0;k<2;k++)this.tone(2900+k*40,0.28,'sine',0.13*v,2700,pan,k*0.34);break;
  case 'gurgle':this.tone(140+r*60,0.35,'sawtooth',0.05*v,50,pan);this.noise(0.35,0.08*v,'lowpass',400,3,pan);break;
  case 'slam':this.tone(70,0.4,'sine',0.3*v,35,pan);this.noise(0.2,0.15*v,'lowpass',900,1,pan);break;
  case 'alarm':for(let k=0;k<6;k++)this.tone(k%2?660:880,0.28,'triangle',0.07,0,0,k*0.32);break;
  case 'descend':this.tone(660,1.6,'sine',0.08,110);[1319,1047,784].forEach((f,i)=>this.tone(f,0.6,'sine',0.06,0,0,0.3+i*0.15));break;
  case 'laugh':for(let k=0;k<5;k++){const f0=(320-k*25)*(0.9+r*0.2);this.tone(f0,0.11,'sawtooth',0.07*v,f0*0.8,pan,k*0.14);this.noise(0.08,0.03*v,'bandpass',1400,3,pan,0,k*0.14);}break;
  case 'honk':this.tone(330,0.22,'square',0.08*v,290,pan);this.tone(415,0.22,'square',0.05*v,370,pan);break;
  case 'boing':this.tone(180,0.28,'sine',0.12*v,700,pan);break;
  case 'jackbox':[1047,1175,1319,1568,1319,1175].forEach((f,i)=>this.tone(f,0.12,'triangle',0.06*v,0,pan,i*0.07));this.tone(150,0.4,'sine',0.2*v,900,pan,0.45);break;
  case 'balloonpop':this.noise(0.09,0.35*v,'highpass',1500,0.7,pan);break;
  case 'whee':this.tone(500,0.4,'sine',0.08*v,1300,pan);break;
  case 'swarm':this.noise(1.2,0.12*v,'bandpass',2600,6,pan,1800);break;
  case 'glitch':for(let k=0;k<5;k++)this.tone(200+Math.random()*2000,0.03,'square',0.08*v,0,pan,k*0.035);break;
  case 'whisper':{const p=rnd(-1,1);for(let k=0;k<3;k++)this.noise(0.5,0.05,'bandpass',1200+Math.random()*1500,9,p,2600,k*0.35);}break;
  case 'heart':this.tone(55,0.14,'sine',0.35*v,40);this.tone(50,0.14,'sine',0.28*v,38,0,0.2);break;
  case 'sting':this.tone(1568,0.7,'triangle',0.08,1480);this.tone(1661,0.7,'triangle',0.07,1570);this.tone(60,0.5,'sine',0.3,30);break;
  case 'thunk':this.tone(42,0.5,'sine',0.35,28);this.noise(0.05,0.2,'highpass',3000);break;
  case 'trip':this.tone(80,1.4,'sawtooth',0.1,1800);this.tone(2400,1.4,'sine',0.06,90);this.noise(1.2,0.08,'bandpass',400,2,0,4000);break;
  case 'powerdown':this.tone(240,0.9,'sawtooth',0.1,30);this.noise(0.12,0.3,'lowpass',400);this.tone(50,0.7,'sine',0.3,28);break;
  case 'powerup':this.tone(60,0.5,'sawtooth',0.06,120);this.noise(0.4,0.05,'bandpass',3000,4);[0,0.12,0.22].forEach(d=>this.noise(0.04,0.14,'highpass',4000,1,0,0,d));break;
  case 'whale':this.tone(95,2.6,'sine',0.2*v,55,pan);this.tone(150,2.0,'triangle',0.07*v,200,pan,0.7);this.tone(70,1.8,'sine',0.12*v,90,pan,1.6);break;
  case 'blip':this.tone(1800,0.05,'square',0.025);this.tone(900,0.05,'square',0.02,0,0,0.06);break;
  case 'chime':[1047,1568].forEach((f,i)=>this.tone(f,0.5,'sine',0.06,0,0,i*0.12));break;
  case 'death':this.tone(220,2.2,'sawtooth',0.12,30);this.noise(2,0.12,'lowpass',2000,1,0,80);break;}},
 laser(on,heat){if(!this.ctx)return;const t=this.ctx.currentTime;this.lzG.gain.setTargetAtTime(on?0.06:0,t,0.03);if(on){this.l1.frequency.setTargetAtTime(170+heat*220,t,0.05);this.l2.frequency.setTargetAtTime(260+heat*330,t,0.05);this.bp.frequency.setTargetAtTime(1200+heat*1800,t,0.05);}},
 flame(on){if(!this.ctx)return;this.flG.gain.setTargetAtTime(on?0.22:0,this.ctx.currentTime,0.05);},
 tick(){if(!this.ctx||!L)return;const t=this.ctx.currentTime;const k=(L.bk||0)/0.72,dr=L.dread||0;const city=L.theme==='city'&&state!=='title',openA=L.theme!=='pool'&&state!=='title';
  this.humG.gain.setTargetAtTime(0,t,0.05);this.drone.gain.setTargetAtTime(0,t,0.5);
  this.padG.gain.setTargetAtTime(0,t,0.8);this.wet.gain.setTargetAtTime(city?0.2:0.5,t,0.5);
  if(L.theme==='dream'&&state==='play'){if(!this.nt||this.nt<t)this.nt=t+0.05;
    while(this.nt<t+0.15){this.ni=(this.ni||0)%CALLIOPE.length;const n=CALLIOPE[this.ni++];
      if(n){const det=1+Math.sin(this.nt*0.7)*0.025*(0.4+dr*2)+(Math.random()-0.5)*0.01*dr;const d=this.nt-t;this.tone(n*det,0.26,'triangle',0.035,0,0,d);this.tone(n*det*2.01,0.18,'square',0.012,0,0,d);if(this.ni%3===1)this.tone(n*det/4,0.3,'sine',0.05,0,0,d);}
      this.nt+=0.28*(1+dr*0.25)/Math.max(0.5,(G&&G.tscale)||1);}}}
};

// ============================================================ theme music (original composition, synthesized live)
const mtof=m=>440*Math.pow(2,(m-69)/12);
const SONGS={
 title:{bpm:88,oct:0,av:0.5,arp:[0,2,1,3,2,5,4,6],chords:[[53,57,60,64],[52,55,59,62],[50,53,57,64],[48,57,59,64]],
   mel:[[[0,76,2],[2,77,2],[4,72,4]],[[0,74,3],[3,71,1],[4,74,4]],[[0,77,2],[2,76,2],[4,74,2],[6,72,2]],[[0,71,4],[4,69,4]]]},
 pool:{bpm:60,oct:0,av:0.42,dark:true,arp:[0,null,2,null,3,null,1,null],chords:[[50,57,62,64],[46,53,57,62],[43,50,55,58],[45,50,52,57]],
   mel:[[[0,74,8]],[[2,72,6]],[[0,70,3],[4,69,4]],[[0,69,8]]]},
 city:{bpm:96,oct:1,av:0.36,arp:[0,1,2,3,2,1,2,3],chords:[[48,55,59,66],[50,57,62,66],[45,52,57,64],[47,54,59,62]],
   mel:[[[0,83,2],[2,81,2],[4,79,4]],[[0,78,4],[4,81,4]],[[0,79,2],[2,76,2],[4,72,4]],[[0,74,6],[6,78,2]]]},
 arena:{bpm:104,oct:0,av:0.55,dark:true,arp:[0,1,0,2,0,1,0,3],chords:[[50,53,57,62],[46,50,53,58],[48,52,55,60],[45,49,52,57]],
   mel:[[[0,74,2],[2,77,2],[4,76,4]],[[0,74,4],[4,70,4]],[[0,72,2],[2,76,2],[4,79,4]],[[0,81,4],[4,73,4]]]},
 end:{bpm:66,oct:0,av:0.42,arp:[0,2,3,4,null,3,2,null],chords:[[48,55,59,64],[45,52,55,60],[41,48,52,57],[43,50,55,62]],
   mel:[[[0,76,4],[4,79,4]],[[0,81,6]],[[0,77,2],[2,76,2],[4,72,4]],[[0,74,8]]]},
 sky:{bpm:72,oct:1,av:0.34,arp:[0,null,3,null,5,4,null,6],chords:[[51,58,62,65],[46,53,60,62],[48,55,58,62],[44,51,55,62]],
   mel:[[[0,79,4]],[[0,77,2],[2,74,6]],[[0,79,3],[3,82,5]],[[0,80,8]]]}
};
// ambient piano engine: one synthesized piano, long reverb, ping-pong echo
const MUS={on:false,step:0,next:0,song:null,fadeT:0,
 start(){const C=AU.ctx;if(!C||this.on||!AU.nb)return;this.on=true;$('soundHint').classList.add('hidden');
  this.out=C.createGain();this.out.gain.value=0;const comp=C.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
  this.out.connect(comp);comp.connect(AU.master);
  this.L={piano:C.createGain()};this.L.piano.connect(this.out);
  this.verb=C.createConvolver();this.verb.buffer=AU.impulse(5.5,2.2);const send=C.createGain();send.gain.value=0.6;const wet=C.createGain();wet.gain.value=0.75;
  this.L.piano.connect(send);send.connect(this.verb);this.verb.connect(wet);wet.connect(this.out);
  this.dL=C.createDelay(2);this.dR=C.createDelay(2);const ds=C.createGain();ds.gain.value=0.22;const fb=C.createGain();fb.gain.value=0.38;
  const pan=v=>{if(!C.createStereoPanner)return C.createGain();const p=C.createStereoPanner();p.pan.value=v;return p;};const pl=pan(-0.6),pr=pan(0.6);
  this.L.piano.connect(ds);ds.connect(this.dL);this.dL.connect(pl);pl.connect(this.out);this.dL.connect(this.dR);this.dR.connect(pr);pr.connect(this.out);this.dR.connect(fb);fb.connect(this.dL);pl.connect(this.verb);
  this.timer=setInterval(()=>this.tick(),25);},
 tick(){const C=AU.ctx;if(!C||C.state!=='running')return;const sg=SONGS[this.song];if(!sg){this.next=C.currentTime+0.1;return;}const sd=60/sg.bpm/2;
  if(this.next<C.currentTime-0.3)this.next=C.currentTime+0.05;
  while(this.next<C.currentTime+0.15){try{this.play(this.step,this.next,sg);}catch(e){}this.next+=sd*(this.step%2===0?1.04:0.96);this.step++;}},
 noise(t,dur,ft,f,q,vol,dest){const C=AU.ctx;const s=C.createBufferSource();s.buffer=AU.nb;const fl=C.createBiquadFilter();fl.type=ft;fl.frequency.value=f;fl.Q.value=q;const g=C.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random()*0.5);s.stop(t+dur+0.02);},
 piano(t,m,v,sus){const C=AU.ctx;const f=mtof(m);const out=C.createGain();out.gain.value=v;out.connect(this.L.piano);
  const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(7000,f*(6+v*6)),t);lp.frequency.exponentialRampToValueAtTime(Math.max(450,f*2.2),t+1.1);lp.connect(out);
  const T60=clamp(3.0*Math.pow(261/f,0.45),0.8,5)*(sus||1);
  for(let n=1;n<=7;n++){const fn=f*n*Math.sqrt(1+0.00045*n*n);if(fn>11000)break;const a=(n===1?1:n===2?0.55:0.9/Math.pow(n,1.5))*0.2;const dec=Math.max(0.12,T60/Math.pow(n,0.75));
    const g=C.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(a,t+0.004);g.gain.exponentialRampToValueAtTime(a*0.4,t+0.1);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);
    const o=C.createOscillator();o.type='sine';o.frequency.value=fn;o.detune.value=(n===1?0:(Math.random()-0.5)*5);o.connect(g);g.connect(lp);o.start(t);o.stop(t+dec+0.05);
    if(n===1){const o2=C.createOscillator();o2.type='sine';o2.frequency.value=fn;o2.detune.value=2.5;const g2=C.createGain();g2.gain.setValueAtTime(0.0001,t);g2.gain.exponentialRampToValueAtTime(a*0.6,t+0.004);g2.gain.exponentialRampToValueAtTime(0.0001,t+dec*1.1);o2.connect(g2);g2.connect(lp);o2.start(t);o2.stop(t+dec*1.1+0.05);}}
  this.noise(t,0.03,'bandpass',Math.min(4500,f*5),1.2,0.035,out);},
 play(step,t,sg){const n=sg.chords.length;const bar=Math.floor(step/8)%(n*4),s=step%8,ci=bar%n,cyc=Math.floor(bar/n);const ch=sg.chords[ci];const ext=[...ch,...ch.map(m=>m+12)];
  const h=()=>t+Math.random()*0.014;
  if(s===0){this.piano(h(),ch[0]-12,0.5,1.7);if(cyc>0)this.piano(h(),ch[0]-24,0.25,2);}
  const ai=sg.arp[s];
  if(ai!==null&&(cyc!==3||s%4===0))this.piano(h(),ext[ai%ext.length]+12*sg.oct,sg.av*(s===0?1.05:0.75+Math.random()*0.25),0.9);
  if(cyc===1||cyc===2)for(const [st,m] of sg.mel[ci])if(st===s)this.piano(h(),m+(cyc===2&&sg.oct===0?12:0),0.72,1.4);
  if(cyc===3&&s===4)this.piano(h(),ch[ch.length-1]+12,0.35,1.6);
  const dr=(state==='play'&&L&&L.dread)||0;
  if(sg.dark&&(s===3||s===7)&&Math.random()<dr*0.5)this.piano(h(),ch[1]+13,0.25+dr*0.3,1);},
 mix(){if(!this.on||!AU.ctx)return;const t=AU.ctx.currentTime;
  const want=(state==='play'||state==='pause')&&L?(L.arena?'arena':L.ending?'end':L.theme==='dream'?null:L.theme):state==='ending'?'end':'title';
  if(want!==this.song){if(!this.fadeT){this.fadeT=t;this.out.gain.setTargetAtTime(0,t,0.3);}
    if(t-this.fadeT>1.3||!this.song){this.song=want;this.step=0;this.next=t+0.1;this.fadeT=0;const sg=SONGS[want];if(sg){const d=60/sg.bpm/2*3;this.dL.delayTime.setValueAtTime(d,t);this.dR.delayTime.setValueAtTime(d,t);}}
    return;}
  let vol=!this.song?0:state==='title'?1:state==='pause'?0.5:state==='play'?0.8:0.9;if(VOICE.speaking)vol*=0.35;
  this.out.gain.setTargetAtTime(vol*SET.music,t,0.5);}
};
