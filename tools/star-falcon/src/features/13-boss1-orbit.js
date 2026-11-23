/* Stage 1 boss "Orbit Warden": a runaway defence satellite, 2 phases (blink+aimed shots, panel curtain;
   then broken wing, 5-shot fan and a telegraphed sweep beam). Mutes the core boss pattern for its own.
   Wraps mkBoss, updBoss, dmg, setScene, scene, startLevel. Stores nothing. FX.orbit = {m:()=>state} */
const N=0,S='orbit',RED='#d8321e',BLU0='#173a7a',BLU1='#2f6fc8',BLU2='#7fc0f0';
let m=null;
const fresh=()=>({in:0,x:W/2,y:120,mt:0,ct:0,sh:0,cu:0,lb:0,gap:-1,gl:-1,bt:3,bm:0,bk:0,tr:0,te:0,ts:0});
/* ---- art ---- */
function hull(g,broken){
 const oct=[-28,-66,28,-66,46,-48,46,16,28,34,-28,34,-46,16,-46,-48];
 g.fillStyle=DK;g.fillRect(-17,-74,12,10);g.fillRect(5,-74,12,10); // engine nozzles under the core flames
 g.fillStyle=M2;g.fillRect(-17,-74,12,2);g.fillRect(5,-74,12,2);
 for(const s of broken?[1]:[-1,1]){ // struts + solar wing 60x28 at x=+-84
  g.fillStyle=M2;g.fillRect(s>0?46:-56,-8,10,10);g.fillStyle=M1;g.fillRect(s>0?46:-56,-8,10,2);
  const x0=s>0?54:-114;g.fillStyle='#3a4352';g.fillRect(x0,-18,60,28);
  for(let y=-16;y<8;y+=2)for(let x=x0+2;x<x0+58;x+=2){const cx=(x-x0-2)%14,cy=(y+16)%12;
   if(cx>=12||cy>=10){g.fillStyle='#262c38'}else g.fillStyle=cy<2?BLU2:((x+y)/2&1)?BLU1:BLU0;g.fillRect(x,y,2,2)}
  g.fillStyle=RED;g.fillRect(s>0?x0+56:x0,-18,4,28)}
 if(broken){g.fillStyle=M2;g.fillRect(-54,-8,8,10);g.fillStyle=DK;part(g,[-54,-8,-60,-6,-56,-2,-62,2,-54,2],DK)}
 part(g,oct,lin(g,-46,-66,46,34,M0,M1,M2));
 part(g,[-20,-56,20,-56,36,-42,36,10,20,24,-20,24,-36,10,-36,-42],lin(g,-36,-56,36,24,'#c8d0da',M1,'#7a8496'));
 g.fillStyle=RED;g.fillRect(-46,-34,92,6);g.fillStyle='#ff6a4a';g.fillRect(-46,-34,92,2); // red trim band
 g.fillStyle='#8a1e12';g.fillRect(-46,-30,92,2);
 g.fillStyle=M2;for(const x of[-30,-14,14,30])g.fillRect(x-1,-50,2,10);
 g.fillStyle=M0;for(const p of[[-38,-44],[36,-44],[-38,10],[36,10],[-24,-62],[22,-62]])g.fillRect(p[0],p[1],2,2);
 ell(g,0,4,17,17,M2);ell(g,0,4,15,15,DK);ell(g,0,4,12,12,'#120c18'); // socket for the core orb
 g.fillStyle=M2;g.fillRect(-4,30,8,6); // dish arm + radar dish at (0,40)
 ell(g,0,41,16,7,M1);ell(g,0,40,16,5,M0);ell(g,0,42,11,4,M2);ell(g,0,42,8,3,DK);
 g.fillStyle=RED;g.fillRect(-2,44,4,4);
 if(broken){g.globalCompositeOperation='source-atop';
  ell(g,-36,-10,14,20,'rgba(20,12,16,.75)');ell(g,-28,14,9,7,'rgba(20,12,16,.6)');ell(g,-30,-46,7,6,'rgba(20,12,16,.6)');
  g.fillStyle='#262c38';part(g,[-46,-14,-30,-18,-22,-10,-28,-8,-34,-12,-46,-8],'#1a1218');
  g.fillStyle='#ff8a1e';g.fillRect(-40,-12,4,2);g.fillRect(-34,-16,2,2);g.globalCompositeOperation='source-over'}}
const bodySp=()=>sprite('orbit-body',256,200,g=>hull(g,0));
const brokeSp=()=>sprite('orbit-broken',256,200,g=>hull(g,1));
const shardSp=()=>sprite('orbit-shard',24,24,g=>{g.fillStyle='#d8e0ea';g.fillRect(-10,-10,20,20);g.fillStyle=RED;g.fillRect(-10,6,20,4);
 for(let y=-7;y<7;y+=2)for(let x=-7;x<7;x+=2){g.fillStyle=y<-4?BLU2:((x+y)/2&1)?BLU1:BLU0;g.fillRect(x,y,2,2)}
 g.fillStyle='#ffe27a';g.fillRect(-3,-3,6,6);g.fillStyle='#fff';g.fillRect(-3,-3,2,2)},[16,24,60]);
/* ---- attacks ---- */
const busy=()=>eb.length>45;
function volley(b){if(busy())return;const a=aim(b),n=m.ph?5:3;
 for(let i=0;i<n;i++)shoot(b.x,b.y+44,a+(i-(n-1)/2)*.18,180);beep(520,.09,'square',.03)}
function curtain(b){if(busy())return;for(let i=0;i<7;i++){if(i===m.gap||i===m.gap+1)continue;
 shoot(b.x-132+i*44,b.y+40,Math.PI/2,130);eb[eb.length-1].orb=1}beep(340,.12,'triangle',.04,220)}
function pickGap(){let g;do g=ri(0,5);while(g===m.gl);m.gl=m.gap=g}
function enter(b){if(m.ph===1){BS=brokeSp();explode(b.x-84,b.y,10);m.ct=0;m.sh=m.cu=0;m.bt=2.6}}
function run(b,dt){const fr=FR[save.diff],ph=b.ph||0;m.ph=ph;
 if(m.tr>0){ // phase transition: no attacks, sparks
  if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(300,.4,'square',.05,900);m.bm=0}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.22;m.ts++;explode(b.x+rnd(-60,60),b.y+rnd(-40,30),6,0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=m.ph=ph+1;enter(b)}return}
 const dying=b.dying>0;
 if(m.bm){ // sweep beam (phase 1)
  m.bk-=dt;
  if(m.bm===1){if(m.bk<=0){m.bm=2;m.bk=1.2;beep(140,1.1,'sawtooth',.05,90)}}
  else{const d=P.x-m.x;m.x+=clamp(d,-40*dt,40*dt);
   if(!dying&&P.dead<=0&&Math.abs(P.x-b.x)<19&&P.y>b.y)hurt(12);
   if(m.bk<=0){m.bm=0;m.bt=6*fr}}
  if(dying)m.bm=0;return}
 m.mt+=dt;const amp=ph?150:120,tx=W/2+Math.sin(m.mt*(ph?.9:.6))*amp;
 m.x+=(tx-m.x)*Math.min(1,dt*3);m.y=134+Math.sin(m.mt*1.1)*14;
 if(dying)return;
 if(ph){m.bt-=dt;if(m.bt<=0&&m.ct>.75){m.bm=1;m.bk=1;beep(220,.6,'square',.04,520);return}}
 m.ct+=dt;const L=4.2*fr,cT=2.2*fr;
 if(m.ct<.7){const on=Math.floor(m.ct*10)%2===0;if(on&&!m.lb)beep(660,.05);m.lb=on}
 if(!m.sh&&m.ct>=.7){m.sh=1;volley(b)}
 if(m.gap<0&&!m.cu&&m.ct>=cT-.7)pickGap();
 if(!m.cu&&m.ct>=cT){m.cu=1;curtain(b);m.gap=-1}
 if(m.ct>=L){m.ct=0;m.sh=m.cu=0;m.lb=0}}
/* ---- wrappers ---- */
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='ORBIT WARDEN';boss.gates=[.5];boss.ph=0;boss.max=boss.hp=Math.round(boss.hp*1.25);m=fresh();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y}
 if(m.in){run(b,dt);b.x=m.x+(m.tr>0?r2(rnd(-3,3)):0);b.y=Math.max(120,m.y)}return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
function hatch(x,y,w,h,ph){for(let j=0;j<h;j+=2)for(let i=0;i<w;i+=2)if(((i+j)/2+ph&7)<4)px(x+i,y+j,2,2,'#ffd23c');else px(x+i,y+j,2,2,'#1a1222')}
const _sc=scene;scene=function(){const r=_sc.apply(this,arguments);
 for(const b of eb)if(b.orb)put(shardSp(),b.x,b.y,{rot:Math.floor(T*8)%4*TAU/16});
 if(!own()||!m.in)return r;const b=boss,x=r2(b.x),y=r2(b.y),fk=Math.floor(T*20)%2;
 if(m.tr<=0&&!m.bm&&!(b.dying>0)){
  if(m.ct<.7&&Math.floor(m.ct*10)%2===0)px(x-3,y+38,6,6,'#ffe27a');
  if(m.gap>=0)for(let i=0;i<7;i++)if(i!==m.gap&&i!==m.gap+1&&Math.floor(T*8)%2){const q=x-132+i*44;px(q-4,y+50,8,4,'#ffd23c');px(q-2,y+54,4,4,'#ffd23c')}}
 if(m.bm===1){const on=Math.floor(T*8)%2;
  for(const s of[-14,14])for(let yy=y+50;yy<H;yy+=16)px(x+s-1,yy,2,8,on?'#ffffff':'#5fe3d6');
  if(on)hatch(x-20,y+46,40,8,Math.floor(T*16))}
 else if(m.bm===2){const t=y+50,h=H-t,e=fk?6:4;
  px(x-10,t,20,h,'#5fe3d6');px(x-10+e,t,20-e*2,h,'#bff6f0');px(x-4,t,8,h,'#ffffff');
  px(x-12,t-4,24,6,'#ffffff');if(fk)px(x-14,t-2,28,2,'#5fe3d6')}
 return r};
FX.orbit={m:()=>m};
