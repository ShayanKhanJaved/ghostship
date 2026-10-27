// ORHANGE - Shaders: the PS2-style vertex and fragment shaders for every material
'use strict';
// ============================================================ shaders
const VERT=`
precision highp float;
attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aTexCoord;
uniform mat4 uModelViewMatrix;uniform mat4 uProjectionMatrix;
uniform mat4 uModel;uniform mat4 uModelN;uniform vec2 uRes;uniform float uSnap;
uniform float uMat;uniform float uTime;uniform float uWarp;
varying vec3 vW;varying vec3 vN;varying vec2 vUV;varying float vDepth;
void main(){
  vec4 w=uModel*vec4(aPosition,1.0);
  if(uWarp>0.0&&uMat<-0.5){float h=max(w.y,0.0);w.x+=sin(w.y*0.35+w.z*0.15+uTime*0.9)*uWarp*h*0.07;w.z+=cos(w.y*0.3+w.x*0.15+uTime*0.7)*uWarp*h*0.07;}
  vW=w.xyz;vN=(uModelN*vec4(aNormal,0.0)).xyz;vUV=aTexCoord;
  vec4 v=uModelViewMatrix*vec4(w.x,-w.y,w.z,1.0);
  vDepth=-v.z;
  vec4 p=uProjectionMatrix*v;
  if(uSnap>0.0&&p.w>0.0){vec2 g=uRes*0.5/uSnap;p.xy=floor(p.xy/p.w*g+0.5)/g*p.w;}
  gl_Position=p;
}`;
const FRAG=`
precision highp float;
varying vec3 vW;varying vec3 vN;varying vec2 vUV;varying float vDepth;
uniform float uMat;uniform float uTime;uniform float uHit;uniform float uAlpha;uniform float uBlack;uniform float uFogD;
uniform vec3 uCam;uniform vec3 uCol;uniform vec3 uFog;uniform vec3 uAmbTop;uniform vec3 uAmbBot;
uniform vec3 uBA;uniform vec3 uBB;uniform vec3 uBCol;
uniform vec3 uSkyH;uniform vec3 uSkyZ;uniform vec3 uSunDir;uniform vec3 uSunCol;
uniform float uDread;uniform float uInvert;uniform float uDream;uniform float uVar;
uniform vec3 uLP[16];uniform vec3 uLC[16];uniform vec4 uDim[4];
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}
float bay2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float bayer(vec2 a){return bay2(.5*a)*.25+bay2(a);}
float pnl(vec2 c){return fract(c.x*0.7548776662+c.y*0.5698402910+fract(c.x*c.y*0.1234567));}
float caustic(vec2 uv,float t){
  vec2 p=mod(uv*6.28318,6.28318)-250.0;vec2 i=p;float c=1.0;float inten=0.005;
  for(int n=0;n<4;n++){float tt=t*(1.0-(3.5/float(n+1)));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1.0/length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}
  c/=4.0;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.0),0.0,1.4);
}
float grout(vec2 p,float s,float w){vec2 f=fract(p/s);vec2 e=min(f,1.0-f)*s;return 1.0-smoothstep(w*0.5,w,min(e.x,e.y));}
vec2 tuv(vec3 P,vec3 N){vec3 a=abs(N);return a.y>0.5?P.xz:(a.x>0.5?P.zy:P.xy);}
vec3 sky(vec3 R){
  if(R.y>0.0)return mix(vec3(0.95,0.99,1.0),vec3(0.16,0.5,0.95),smoothstep(0.0,0.7,R.y));
  return mix(vec3(0.85,0.97,0.95),vec3(0.42,0.74,0.6),smoothstep(0.0,-0.6,R.y));
}
vec3 skyc(vec3 d){
  vec3 c=mix(uSkyH,uSkyZ,smoothstep(0.0,0.65,d.y));
  if(d.y<0.0)c=mix(uSkyH,vec3(0.35,0.62,0.4),smoothstep(0.0,-0.35,d.y));
  return mix(c,vec3(0.04,0.03,0.07),min(uBlack*1.1,1.0));
}
void main(){
  float m=uMat<-0.5?floor(vUV.x+0.5):uMat;float aux=vUV.y;
  float t=uTime;
  if(m>27.5&&m<28.5){
    vec3 d=normalize(vW-uCam);vec3 c;float sd=max(dot(d,uSunDir),0.0);
    if(d.y>=0.0){c=mix(uSkyH,uSkyZ,smoothstep(0.0,0.6,d.y));vec2 cp=d.xz/(d.y+0.15)*1.1+vec2(t*0.01,0.0);
      float n=vnoise(cp)*0.55+vnoise(cp*2.3)*0.3+vnoise(cp*5.1)*0.15;c=mix(c,vec3(1.0),smoothstep(0.55,0.8,n)*smoothstep(0.02,0.25,d.y)*0.85);}
    else{vec2 cp=d.xz/(-d.y+0.06)*0.9+vec2(t*0.006,t*0.003);float n=vnoise(cp)*0.5+vnoise(cp*2.1)*0.3+vnoise(cp*4.7)*0.2;
      vec3 sea=mix(vec3(0.7,0.82,0.95),vec3(1.0),smoothstep(0.3,0.75,n));sea=mix(sea,vec3(0.55,0.7,0.9),smoothstep(0.78,1.0,n)*0.3);
      c=mix(uSkyH,sea,smoothstep(0.0,0.12,-d.y));}
    c+=vec3(1.0,0.97,0.9)*(pow(sd,8.0)*0.35+smoothstep(0.996,0.9985,sd))*(1.0-min(uBlack*1.4,1.0));
    c=mix(c,vec3(0.05,0.05,0.1),min(uBlack*1.1,1.0));c=mix(c,c*0.4,uDread*0.5);
    c+=(bayer(gl_FragCoord.xy)-0.5)/26.0;c=floor(c*26.0+0.5)/26.0;
    gl_FragColor=vec4(c,1.0);return;
  }
  if(m>24.5&&m<25.5){
    vec3 d=normalize(vW-uCam);float r=acos(clamp(d.y,-1.0,1.0));float a0=atan(d.z,d.x);
    float seg=6.28318/10.0;float a=abs(mod(a0+t*0.05,seg)-seg*0.5);
    float pat=sin(r*14.0-t*1.5+sin(a*12.0+t)*2.0)+sin(a*30.0+r*6.0-t*2.0)*0.5;
    vec3 c=0.5+0.5*cos(6.28318*(vec3(0.0,0.33,0.67)+pat*0.12+t*0.03+r*0.3));
    float spi=sin(a0*5.0+log(max(r,0.001))*8.0-t*2.0);
    c=mix(c,vec3(1.0),smoothstep(0.9,1.0,spi)*smoothstep(0.7,0.0,r)*0.7);
    c*=0.9;c=mix(c,c*0.12+vec3(0.06,0.0,0.04),min(uBlack*1.2,1.0));c=mix(c,c*0.35,uDread*0.5);
    if(uInvert>0.5)c=1.0-c;
    c+=(bayer(gl_FragCoord.xy)-0.5)/26.0;c=floor(c*26.0+0.5)/26.0;
    gl_FragColor=vec4(c,1.0);return;
  }
  if(m>17.5&&m<18.5){
    vec3 d=normalize(vW-uCam);vec3 c=skyc(d);
    float sd=max(dot(d,uSunDir),0.0);float sun=1.0-min(uBlack*1.4,1.0);
    c+=uSunCol*0.25*pow(sd,6.0)*sun+vec3(1.0,0.98,0.9)*smoothstep(0.9965,0.9985,sd)*sun;
    if(d.y>0.01){vec2 cp=d.xz/(d.y+0.12)*1.3+vec2(t*0.012,t*0.004);
      float n=vnoise(cp)*0.55+vnoise(cp*2.3)*0.3+vnoise(cp*5.1)*0.15;
      float cl=smoothstep(0.52,0.78,n)*smoothstep(0.01,0.2,d.y);
      vec3 cc=mix(vec3(1.0),uSkyH*0.9,0.25+0.4*(0.78-n));cc=mix(cc,vec3(0.1,0.08,0.12),min(uBlack*1.2,1.0));
      c=mix(c,cc,cl*0.92);}
    c+=(bayer(gl_FragCoord.xy)-0.5)/26.0;c=floor(c*26.0+0.5)/26.0;
    gl_FragColor=vec4(c,1.0);return;
  }
  vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.0)N=-N;
  vec3 alb=vec3(0.8);float gs=30.0;float sp=0.2;float alpha=1.0;float caus=0.0;vec3 em=vec3(0.0);
  float fade=clamp(1.0-vDepth/24.0,0.0,1.0);
  if(m<0.5){
    vec2 p=vW.xz;vec2 ti=floor(p/0.5);float id=h21(ti);
    alb=vec3(0.80,0.89,0.88)*(0.93+0.07*id);
    if(mod(ti.x,12.0)<0.5)alb=vec3(0.28,0.64,0.72);
    float g=grout(p,0.5,0.035)*fade;alb=mix(alb,vec3(0.5,0.58,0.58),g);
    gs=90.0;sp=0.6*(1.0-g);
    if(aux>0.02)caus=caustic(p*0.3,t*0.55)*aux*0.5;
  }else if(m<1.5){
    vec2 p=tuv(vW,N);float y=vW.y;vec2 ti=floor(p/0.5);float id=h21(ti);
    alb=vec3(0.84,0.91,0.89)*(0.94+0.06*id);
    if(y>0.95&&y<1.22)alb=vec3(0.15,0.5,0.6)*(0.9+0.12*id);
    else if(y<0.2&&y>-0.05)alb=vec3(0.55,0.66,0.66);
    float g=grout(p,0.5,0.035)*fade;alb=mix(alb,vec3(0.5,0.58,0.58),g);
    gs=60.0;sp=0.45*(1.0-g);
    if(aux>0.02)caus=caustic(p*0.28,t*0.5)*aux*0.45;
  }else if(m<2.5){
    vec2 p=vW.xz;alb=vec3(0.75,0.78,0.76);
    float g=grout(p,1.0,0.05)*fade;alb=mix(alb,vec3(0.42,0.46,0.45),g);
    alb*=0.92+0.08*step(0.6,h21(floor(p*10.0)));
    gs=8.0;sp=0.04;
    if(aux>0.02)caus=caustic(p*0.22,t*0.7)*aux*1.2;
  }else if(m<3.5){
    vec2 cell=floor(vW.xz/4.0);float ph=pnl(cell);float on=1.0;
    if(aux>0.5&&aux<1.5)on=step(-0.3,sin(t*23.0+ph*40.0))*step(-0.6,sin(t*3.1+ph*17.0));
    if(aux>1.5)on=0.0;
    if(ph<uBlack)on=0.0;
    if(fract(ph*7.31+floor(t*6.0)*0.6180339)<uDread*0.3)on=0.0;
    for(int k=0;k<4;k++){float d=length(vW-uDim[k].xyz);if(d<uDim[k].w)on*=step(0.45,fract(t*6.7+ph*3.3+float(k)*0.37));}
    vec2 f=fract(vW.xz/4.0)-0.5;float edge=max(abs(f.x),abs(f.y));
    float lens=0.86+0.14*step(0.5,fract((vW.x+vW.z)*5.0));
    alb=vec3(0.3,0.32,0.32);gs=40.0;sp=0.3;
    if(edge>0.232){alb=vec3(0.62,0.64,0.62);}else{em=vec3(1.0,0.98,0.9)*1.8*on*lens;}
  }else if(m<4.5){
    vec2 p=tuv(vW,N);vec2 ti=floor(p/0.25);float id=h21(ti);
    alb=vec3(0.2,0.58,0.78)*(0.9+0.14*id);
    float g=grout(p,0.25,0.022)*fade;alb=mix(alb,vec3(0.8,0.94,0.96),g*0.8);
    gs=70.0;sp=0.5;
    caus=caustic(vW.xz*0.34+vec2(vW.y*0.15),t*0.8)*1.3;
  }else if(m<5.5){
    vec2 w=vec2(sin(vW.x*1.6+t*1.3)+sin(vW.z*2.1-t*1.1)*0.7,cos(vW.z*1.4+t*0.9)+cos(vW.x*2.3+t*1.7)*0.6);
    N=normalize(vec3(w.x*0.07,1.0,w.y*0.07));
    float fr=pow(1.0-max(dot(N,V),0.0),3.0);
    alb=vec3(0.26,0.68,0.8);gs=180.0;sp=3.0;
    vec3 refl=uSunCol.r>0.01?skyc(reflect(-V,N)):vec3(0.72,0.92,0.96);
    em=refl*fr*0.6+vec3(0.6,0.95,1.0)*caustic(vW.xz*0.2,t*0.4)*0.14;
    alpha=0.5+0.45*fr;
    if(uDream>0.5){em=(0.5+0.5*cos(6.28318*(vec3(0.0,0.33,0.67)+fr*1.5+vW.x*0.05+vW.z*0.03+t*0.2)))*(0.5+0.6*fr);alb=vec3(0.05);alpha=0.8;}
  }else if(m<6.5){em=uCol;alb=vec3(0.05);alpha=uAlpha;}
  else if(m<7.5){float fr=pow(1.0-max(dot(N,V),0.0),2.0);alb=uCol*0.4;em=uCol*(0.85+0.4*sin(t*4.0+vW.y*3.0))+vec3(1.0)*fr*0.9;gs=120.0;sp=1.5;}
  else if(m<10.5){alb=uCol;gs=110.0;sp=0.9;float fr=pow(1.0-max(dot(N,V),0.0),2.5);em=uFog*fr*0.3;}
  else if(m<11.5){em=uCol*1.8;alb=vec3(0.0);}
  else if(m<12.5){em=uCol*2.0;alb=vec3(0.0);alpha=uAlpha;}
  else if(m<13.5){vec3 R=reflect(-V,N);float fr=pow(1.0-max(dot(N,V),0.0),2.0);alb=uCol*0.5;em=sky(R)*(0.42+0.45*fr)*uCol;gs=140.0;sp=1.2;}
  else if(m<14.5){vec3 liq=uCol;vec3 R=reflect(-V,N);float fr=pow(1.0-max(dot(N,V),0.0),2.0);
    alb=liq*0.3;em=liq*(0.75+0.25*sin(t*9.0+vW.x*40.0+vW.z*40.0))+sky(R)*fr*0.7;alpha=0.92;gs=150.0;sp=1.5;}
  else if(m<15.5){em=uCol*1.6;alb=vec3(0.0);alpha=uAlpha;}
  else if(m<16.5){vec2 p=vUV*vec2(3.0,7.0);float g=grout(p,1.0,0.12);alb=mix(uCol,uCol*0.5,g);gs=80.0;sp=0.6;}
  else if(m<17.5){em=uCol*2.0+vec3(0.5);alb=vec3(0.0);alpha=uAlpha;}
  else if(m<19.5){
    float grass=step(1.5,aux);float wet=aux-grass*2.0;vec2 p=vW.xz;
    if(grass>0.5){float n=h21(floor(p*5.0));alb=vec3(0.42,0.7,0.38)*(0.86+0.2*n);
      alb=mix(alb,vec3(0.55,0.8,0.45),step(0.8,vnoise(p*0.6))*0.5);gs=40.0;sp=0.2;}
    else{vec2 ti=floor(p);float id=h21(ti);alb=vec3(0.9,0.92,0.89)*(0.95+0.05*id);
      vec2 q=fract(p/4.0);if(min(q.x,q.y)<0.05)alb=vec3(0.3,0.74,0.84);
      float g=grout(p,1.0,0.04)*fade;alb=mix(alb,vec3(0.62,0.66,0.64),g);gs=60.0;sp=0.35*(1.0-g);}
    if(wet>0.02)caus=caustic(p*0.3,t*0.55)*wet*0.35;
  }else if(m<20.5){
    vec2 p=tuv(vW,N);float y=vW.y;vec2 cp=vec2(p.x/1.3,y/1.7);vec2 f=fract(cp);vec2 id=floor(cp);
    vec3 tint=aux<0.33?vec3(0.78,0.92,0.97):aux<0.66?vec3(0.45,0.86,0.88):vec3(0.62,0.9,0.72);
    vec3 R=reflect(-V,N);float fr=pow(1.0-max(dot(N,V),0.0),2.0);
    float lit=step(0.94,h21(id+vec2(aux*13.0,aux*7.0)));
    alb=tint*0.25;em=skyc(R)*(0.35+0.55*fr)*tint+lit*vec3(0.85,1.0,0.95)*0.35*(1.0-uBlack)+lit*vec3(1.0,0.85,0.5)*uBlack;
    gs=220.0;sp=1.6;
    if(f.x<0.07||f.y<0.09){alb=vec3(0.93,0.96,0.96);em=vec3(0.0);gs=30.0;sp=0.15;}
    if(y<0.7){alb=vec3(0.86,0.89,0.87);em=vec3(0.0);gs=20.0;sp=0.1;}
  }else if(m<21.5){
    float fr=pow(1.0-max(dot(N,V),0.0),1.4);float hue=fr*2.5+vW.y*0.3+t*0.1;
    vec3 ir=0.5+0.5*cos(6.28318*(hue+vec3(0.0,0.33,0.67)));
    alb=vec3(0.0);em=ir*fr*0.9*uCol+vec3(1.0)*pow(fr,6.0)*0.4;gs=220.0;sp=2.5;alpha=uAlpha*(0.2+0.75*fr);
  }else if(m<22.5){
    float fr=pow(1.0-max(dot(N,V),0.0),2.0);float band=step(0.9,fract(vW.y*1.2-t*0.25));
    alb=vec3(0.1,0.35,0.42);em=vec3(0.25,0.8,0.95)*(0.06+0.4*fr)+vec3(0.8,1.0,1.0)*band*0.25;gs=200.0;sp=1.5;alpha=0.16+0.4*fr+band*0.15;
  }else if(m<23.5){
    vec2 p=vW.xz;p+=vec2(sin(p.y*0.35+t*0.8),cos(p.x*0.3+t*0.7))*0.7;
    float chk=mod(floor(p.x/2.0)+floor(p.y/2.0),2.0);
    float ring=sin(length(vW.xz-uCam.xz)*0.9-t*3.0);
    vec3 pc=0.5+0.5*cos(6.28318*(vec3(0.0,0.33,0.67)+t*0.05+ring*0.12+vW.x*0.01));
    alb=mix(vec3(0.95,0.93,0.97),vec3(0.06,0.03,0.09),chk);alb=mix(alb,pc,0.3+0.2*ring);
    gs=90.0;sp=0.7;em=pc*0.07*(1.0+ring);
  }else if(m<24.5){
    vec2 p=tuv(vW,N);float y=vW.y;
    float tw=p.x+sin(y*0.6+t*1.2)*0.7+y*0.35;float st=step(0.5,fract(tw/1.4));
    vec3 c1=0.5+0.5*cos(6.28318*(vec3(0.0,0.33,0.67)+t*0.04+aux));
    vec3 red=mix(vec3(0.92,0.12,0.2),c1,0.45);alb=mix(vec3(0.97,0.95,0.92),red,st);
    vec2 g=fract(vec2(p.x*1.2,y*1.2))-0.5;float pd=1.0-step(0.18,length(g));
    if(mod(floor(y/2.5),3.0)<0.5)alb=mix(alb,vec3(1.0,0.85,0.2),pd);
    gs=120.0;sp=0.8;em=c1*0.06;
  }else if(m<26.5){
    vec2 p=vW.xz;vec2 ti=floor(p);float id=h21(ti);vec3 R=reflect(-V,N);float fr=pow(1.0-max(dot(N,V),0.0),2.0);
    float g=grout(p,1.0,0.05)*fade;
    if(aux>1.5){alb=vec3(0.3,0.6,0.7);em=vec3(0.55,0.92,1.0)*0.85;}
    else if(aux>0.5){alb=vec3(0.55,0.75,0.9);em=skyc(R)*0.35;}
    else{alb=vec3(0.5,0.68,0.82)*(0.92+0.08*id);alb=mix(alb,vec3(0.85,0.95,1.0),g);em=skyc(R)*(0.05+0.32*fr)+vec3(0.6,0.9,1.0)*g*0.25;gs=160.0;sp=0.8;}
  }else if(m<27.5){
    vec2 p=tuv(vW,N);float y=vW.y;vec2 cp=vec2(p.x/1.5,y/2.0);vec2 f=fract(cp);vec3 R=reflect(-V,N);float fr=pow(1.0-max(dot(N,V),0.0),1.6);
    alb=vec3(0.55,0.78,0.92)*0.4;em=skyc(R)*(0.3+0.6*fr)+vec3(0.6,0.85,1.0)*0.12;gs=220.0;sp=1.8;alpha=0.38+0.5*fr;
    if(f.x<0.05||f.y<0.05){alb=vec3(0.95,0.98,1.0);em=vec3(0.25);alpha=0.95;}
  }else{
    vec2 q=vUV;float v=uVar;
    vec3 sk=mix(vec3(0.96,0.78,0.62),vec3(0.36,0.55,0.86),smoothstep(0.3,1.0,q.y));vec3 c=sk;
    if(v<0.5){c=mix(vec3(0.42,0.6,0.33),sk,smoothstep(0.3,0.32,q.y));
      vec2 e=(q-vec2(0.5,0.66))*vec2(1.0,1.9);vec2 pe=e-vec2(sin(t*0.4)*0.05,0.0);
      c=mix(c,vec3(0.96),1.0-smoothstep(0.19,0.2,length(e)));c=mix(c,vec3(0.25,0.55,0.7),1.0-smoothstep(0.09,0.1,length(pe)));c=mix(c,vec3(0.02),1.0-smoothstep(0.04,0.05,length(pe)));}
    else if(v<1.5){c=mix(vec3(0.5,0.66,0.38),sk,smoothstep(0.28,0.3,q.y));
      float d=step(0.42,q.x)*step(q.x,0.58)*step(0.22,q.y)*step(q.y,0.58);c=mix(c,vec3(0.32,0.2,0.12),d);
      float gp=step(0.53,q.x)*step(q.x,0.58)*step(0.24,q.y)*step(q.y,0.56);c=mix(c,vec3(1.0,0.95,0.8),gp);}
    else if(v<2.5){vec2 sv=q-vec2(0.5,0.55);float r=length(sv);c=mix(sk*vec3(1.0,0.85,0.75),vec3(1.0,0.82,0.25),1.0-smoothstep(0.26,0.27,r));
      float ray=step(0.5,fract(atan(sv.y,sv.x)*1.909+t*0.05));c=mix(c,vec3(1.0,0.9,0.5),ray*smoothstep(0.27,0.3,r)*(1.0-smoothstep(0.38,0.4,r))*0.6);
      float ey=max(1.0-smoothstep(0.03,0.035,length(sv-vec2(-0.09,0.07))),1.0-smoothstep(0.03,0.035,length(sv-vec2(0.09,0.07))));c=mix(c,vec3(0.05),ey);
      float mo=(1.0-smoothstep(0.0,0.035,abs(length(sv-vec2(0.0,0.08))-0.17)))*step(sv.y,-0.02);c=mix(c,vec3(0.3,0.0,0.0),mo);
      c=mix(c,vec3(1.0),mo*step(0.5,fract(atan(sv.y-0.08,sv.x)*6.0)));}
    else if(v<3.5){vec2 g=fract(q*10.0);float gr=step(0.92,max(g.x,g.y));
      c=q.y<0.45?mix(vec3(0.3,0.65,0.78),vec3(0.85,0.95,0.97),gr):mix(vec3(0.82,0.88,0.86),vec3(0.6,0.66,0.66),gr);
      float fig=max(step(abs(q.x-0.5),0.025)*step(0.3,q.y)*step(q.y,0.72),1.0-smoothstep(0.03,0.035,length((q-vec2(0.5,0.76))*vec2(1.0,0.8))));c=mix(c,vec3(0.02),fig);}
    else if(v<4.5){c=mix(sk,vec3(1.0),smoothstep(0.55,0.75,vnoise(q*6.0+vec2(t*0.02,0.0)))*0.8);
      for(int k=0;k<8;k++){float fk=float(k);vec2 sp2=vec2(0.18+fk*0.075,0.08+fk*0.085);float inx=step(sp2.x,q.x)*step(q.x,sp2.x+0.12);
        c=mix(c,vec3(0.96),inx*step(sp2.y,q.y)*step(q.y,sp2.y+0.03));c=mix(c,vec3(0.55),inx*step(sp2.y-0.02,q.y)*step(q.y,sp2.y));}}
    else if(v<5.5){c=sk;float wh=1.0-smoothstep(0.98,1.0,length((q-vec2(0.47,0.68))*vec2(3.2,8.0)));
      float tl=step(0.62,q.x)*step(q.x,0.76)*step(abs(q.y-0.68-(q.x-0.62)*0.7),0.025);c=mix(c,vec3(0.18,0.24,0.32),max(wh,tl));
      float hs=step(0.45,q.x)*step(q.x,0.55)*step(0.1,q.y)*step(q.y,0.2);c=mix(c,vec3(0.9,0.88,0.82),hs);
      c=mix(c,vec3(0.55,0.2,0.18),step(abs(q.x-0.5),0.27-q.y)*step(0.2,q.y));c=mix(c,vec3(0.4,0.55,0.3),step(q.y,0.1));}
    else if(v<6.5){vec2 sv=q-0.5;float m2=max(abs(sv.x),abs(sv.y));c=mix(vec3(0.85,0.86,0.8),vec3(0.5,0.52,0.48),smoothstep(0.05,0.5,m2));
      c=mix(c,vec3(0.4,0.42,0.38),step(0.92,fract(m2*12.0)));c=mix(c,vec3(1.0,0.95,0.7)*(1.1+0.3*sin(t*3.0)),step(abs(sv.x),0.035)*step(-0.03,sv.y)*step(sv.y,0.05));}
    else{c=mix(vec3(0.12,0.1,0.09),vec3(0.25,0.2,0.16),q.y);vec2 sv=(q-vec2(0.5,0.58))*vec2(1.0,0.78);
      c=mix(c,vec3(0.86,0.72,0.62),1.0-smoothstep(0.19,0.2,length(sv)));c=mix(c,vec3(0.2,0.24,0.35),step(q.y,0.32)*step(abs(q.x-0.5),0.3-q.y*0.3));}
    c*=0.82+0.18*vnoise(q*vec2(60.0,25.0));c=mix(c,c*vec3(1.0,0.9,0.72),0.28);vec2 vg=q-0.5;c*=1.0-dot(vg,vg)*0.9;
    alb=c;gs=50.0;sp=0.25;em=c*0.15;
  }
  vec3 dif=vec3(0.0);vec3 spc=vec3(0.0);
  for(int i=0;i<16;i++){
    vec3 L=uLP[i]-vW;float d=length(L);L/=max(d,0.001);
    float wf=clamp(1.0-d/15.0,0.0,1.0);float att=wf*wf/(1.0+0.05*d*d);
    vec3 c=uLC[i]*att;
    dif+=c*max(dot(N,L),0.0);
    spc+=c*pow(max(dot(N,normalize(L+V)),0.0),gs);
  }
  if(uSunCol.r+uSunCol.g+uSunCol.b>0.001){
    dif+=uSunCol*max(dot(N,uSunDir),0.0);spc+=uSunCol*pow(max(dot(N,normalize(uSunDir+V)),0.0),gs);
  }
  if(uBCol.r+uBCol.g+uBCol.b>0.001){
    vec3 ab=uBB-uBA;float tt=clamp(dot(vW-uBA,ab)/max(dot(ab,ab),0.0001),0.0,1.0);
    vec3 L=uBA+ab*tt-vW;float d=length(L);L/=max(d,0.001);float att=1.0/(1.0+0.9*d*d);
    dif+=uBCol*att*max(dot(N,L),0.0);spc+=uBCol*att*pow(max(dot(N,normalize(L+V)),0.0),gs);
  }
  vec3 amb=mix(uAmbBot,uAmbTop,N.y*0.5+0.5);
  vec3 col=alb*(amb+dif)+spc*sp+em+caus*vec3(0.7,0.95,1.0)*(0.3+0.55*min(length(dif),1.5));
  col=mix(col,vec3(1.0,0.96,0.96),uHit);
  float f=1.0-exp(-vDepth*uFogD);col=mix(col,uFog,clamp(f,0.0,1.0));
  float lum=dot(col,vec3(0.299,0.587,0.114));col=mix(col,vec3(lum)*vec3(1.06,0.94,0.94),uDread*0.45);col*=1.0-uDread*0.22;
  col+=(h21(gl_FragCoord.xy+vec2(fract(t*7.0)*91.0,fract(t*3.0)*57.0))-0.5)*uDread*0.14;
  if(uInvert>0.5)col=1.0-col;
  col+=(bayer(gl_FragCoord.xy)-0.5)/26.0;col=floor(col*26.0+0.5)/26.0;
  gl_FragColor=vec4(col*alpha,alpha);
}`;
