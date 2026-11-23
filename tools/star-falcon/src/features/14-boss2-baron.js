/* Stage 2 boss "Boulder Baron": an asteroid mining rig, 3 phases (orbiting rock shield it throws;
   then cracked hull, drill dash + aimed fan; then faster dashes + a pebble ring with a rotating gap).
   Mutes the core boss pattern. Wraps mkBoss, updBoss, dmg, setScene, scene, startLevel. Stores nothing.
   FX.baron = {m:()=>state} */
const N=1,S='baron',AMB='#e0a020',ORB=82,DY=470;
let m=null;
const fresh=()=>({in:0,x:W/2,y:130,mt:0,tr:0,ts:0,te:0,tt:2.2,fl:null,flt:0,rs:5,dash:0,dt:0,dk:2,tx:W/2,ft:2,rt:2,gap:0});
/* ---- art ---- */
function hull(g,cracked){
 g.fillStyle=DK;g.fillRect(-17,-82,12,26);g.fillRect(5,-82,12,26); // top thrusters under the core flames
 g.fillStyle=M2;g.fillRect(-17,-82,12,4);g.fillRect(5,-82,12,4);g.fillStyle=M1;g.fillRect(-15,-76,2,16);g.fillRect(7,-76,2,16);
 for(const[dx,dy,r,col]of[[0,-2,74,'#663333'],[-3,-6,68,'#996633'],[-12,-16,48,'#cc9966'],[-20,-26,22,'#ffcc99']]){org(g,dx,dy,r,3.3,14);g.fillStyle=col;g.fill()}
 for(const[x,y,r]of[[-42,-30,12],[40,-36,9],[-48,24,10],[46,22,13],[-20,-52,6],[26,-56,6],[-24,46,7],[22,44,5]]){
  ell(g,x+1,y+1,r,r*.8,'#ffcc99');ell(g,x-1,y-1,r*.9,r*.7,'#663333');ell(g,x-2,y-2,r*.5,r*.38,'#330000')}
 for(const s of[-1,1]){ // steel clamps bolted on the sides
  part(g,[s*56,-22,s*80,-16,s*80,18,s*56,24],lin(g,s*56,-22,s*80,18,M0,M1,M2));
  g.fillStyle=DK;g.fillRect(s>0?60:-76,-6,16,4);g.fillStyle=AMB;g.fillRect(s>0?72:-76,6,4,4);
  g.fillStyle=M0;g.fillRect(s>0?60:-62,-16,2,2);g.fillRect(s>0?60:-62,14,2,2)}
 // amber eye-hatch around the socket where the core orb sits
 const oc=[];for(let j=0;j<8;j++){const a=(j+.5)/8*TAU;oc.push(Math.cos(a)*27,4+Math.sin(a)*27)}
 part(g,oc.map((v,i)=>i%2?(v-4)*1.12+4:v*1.12),DK);part(g,oc,'#8a5a10');part(g,oc.map((v,i)=>i%2?(v-4)*.88+4:v*.88),lin(g,-24,-20,24,28,'#ffd060',AMB,'#a06a10'));
 g.fillStyle=DK;for(let j=0;j<8;j++){const a=j/8*TAU;g.fillRect(Math.round(Math.cos(a)*21)-2,4+Math.round(Math.sin(a)*21)-2,4,4)}
 ell(g,0,4,17,17,DK);ell(g,0,4,13,13,'#140c10');
 // drill: collar + steel cone pointing down at (0,70)
 g.fillStyle=M2;g.fillRect(-26,36,52,14);g.fillStyle=M0;g.fillRect(-26,36,52,4);g.fillStyle=DK;g.fillRect(-26,48,52,2);
 g.fillStyle=AMB;for(const x of[-20,-8,4,16])g.fillRect(x,42,4,4);
 g.save();poly(g,[-22,50,22,50,0,98]);g.fillStyle=lin(g,-22,0,22,0,M0,M1,M2,'#3a4352');g.fill();g.clip();
 for(let y=46;y<100;y+=11)part(g,[-26,y,26,y+7,26,y+11,-26,y+4],'#3a4352');g.restore();
 if(!cracked)return;
 g.globalCompositeOperation='source-atop';
 const crack=(p,lamps)=>{const ln=(col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.lineJoin='miter';g.beginPath();for(let k=0;k<p.length;k+=2)g[k?'lineTo':'moveTo'](p[k],p[k+1]);g.stroke()};
  ln('#14101a',13);ln('#3a4352',7);ln('#14101a',2);
  for(const[x,y]of lamps){g.fillStyle='#ff8a1e';g.fillRect(x-2,y-2,4,4);g.fillStyle='#ffe27a';g.fillRect(x-2,y-2,2,2)}};
 crack([-62,-44,-48,-36,-44,-22,-32,-18,-30,-8],[[-46,-30]]);
 crack([70,-6,56,-2,50,10,38,14,32,26],[[52,4],[38,16]]);
 crack([-10,-70,-4,-58,-14,-48,-8,-36],[[-8,-56]]);
 g.fillStyle='#14101a';for(const[x,y]of[[-24,-60],[44,-48],[58,40]])g.fillRect(x,y,4,4); // chipped bits
 g.globalCompositeOperation='source-over'}
const bodySp=()=>sprite('baron-body',256,200,g=>hull(g,0));
const crackSp=()=>sprite('baron-crack',256,200,g=>hull(g,1));
const pebSp=()=>sprite('baron-peb',24,24,g=>{const p=[-9,-6,-3,-10,6,-9,10,-2,8,7,1,10,-8,8,-10,1];
 part(g,p.map(v=>v*1.2),'#ff5a1f');part(g,p,lin(g,-10,-10,10,10,'#cc9966','#996633','#663333'));part(g,[-6,-6,-2,-8,3,-7,-1,-3,-6,-2],'#ffcc99');
 g.fillStyle='#ffe27a';g.fillRect(2,1,4,4);g.fillRect(-4,4,2,2)},[120,20,10]);
/* ---- attacks ---- */
const busy=()=>eb.length>45;
const tag=()=>{if(eb.length)eb[eb.length-1].baron=1};
function fan(b){if(busy())return;const a=aim({x:b.x,y:b.y+50});for(let i=-1;i<=1;i++)shoot(b.x,b.y+50,a+i*.22,180);beep(520,.09,'square',.03)}
function pebRing(x,y,n,sp,skip){if(busy())return;for(let i=0;i<n;i++){if(skip&&skip(i))continue;shoot(x,y,Math.PI/2+(i-.5)*TAU/n,sp);tag()}}
function ring(b){const g=m.gap;pebRing(b.x,b.y,10,125,i=>i===g||i===(g+1)%10);m.gap=(m.gap+2)%10;beep(300,.14,'triangle',.04,180)}
const shield=()=>en.filter(e=>e.baron&&!e.thrown&&e.hp>0);
function addRock(b,i){const a=m.mt*1.4+i*TAU/3,e=mk('rock',b.x+Math.cos(a)*ORB,b.y+Math.sin(a)*ORB,{vx:0,vy:0,rot:1.5,orb:i});
 if(!e)return;e.baron=1;if(e.vr!==2){e.hp+=(2-e.vr)*2;e.vr=2;e.r=27;e.sp=eSp('rock',li,2)}pt.push({x:e.x,y:e.y,vx:0,vy:-30,l:.3,c:'#c4b4a0',s:4})}
function enter(b){if(b.ph===1){BS=crackSp();for(const e of shield()){e.hp=0;explode(e.x,e.y,6)}m.fl=null;m.dk=1.6;m.ft=2}
 else{m.dk=1.6;m.rt=1.4}m.dash=0}
function run(b,dt){const fr=FR[save.diff],ph=b.ph||0,dying=b.dying>0;m.mt+=dt;
 if(m.tr>0){ // phase transition: no attacks, hull pops, rises back home
  if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(200,1.1,'square',.05,900);m.dash=0;m.fl=null}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.2;m.ts++;explode(b.x+rnd(-56,56),b.y+rnd(-50,40),6,0)}
  m.y=Math.max(130,m.y-170*dt);m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=ph+1;enter(b)}return}
 const hx=W/2+Math.sin(m.mt*.5)*110;
 if(ph===0){m.x=hx;m.y=130;if(dying)return;const sh=shield();
  if(m.fl){const e=m.fl;if(e.hp<=0||!en.includes(e)||e.thrown)m.fl=null;else{m.flt-=dt;if(Math.floor(m.flt*12)%2===0)e.hit=.07;
   if(m.flt<=0){e.thrown=1;e.vx=clamp((P.x-e.x)*.6,-90,90);e.vy=230;m.fl=null;beep(180,.25,'sawtooth',.04,90)}}}
  else{m.tt-=dt;if(m.tt<=0&&sh.length){m.tt=3.2*fr;let lo=sh[0];for(const e of sh)if(e.y>lo.y)lo=e;m.fl=lo;m.flt=.7;beep(300,.12,'square',.04)}}
  if(sh.length<3){m.rs-=dt;if(m.rs<=0){m.rs=5;for(let i=0;i<3;i++)if(!sh.some(e=>e.orb===i)){addRock(b,i);break}}}else m.rs=5;return}
 if(m.dash===0){m.x+=(hx-m.x)*Math.min(1,dt*1.5);m.y=Math.max(130,m.y-170*dt);if(dying)return;
  m.dk-=dt;if(m.dk<=0){m.dash=1;m.dt=.9;m.tx=clamp(P.x,80,W-80);m.ft=Math.max(m.ft,.8);m.rt=Math.max(m.rt,.8);beep(440,.6,'square',.04,220);return}
  if(ph===1){m.ft-=dt;if(m.ft<=0){m.ft=2*fr;fan(b)}}else{m.rt-=dt;if(m.rt<=0){m.rt=2.5*fr;ring(b)}}return}
 if(dying&&m.dash<3)m.dash=3;
 if(m.dash===1){m.dt-=dt;m.x+=clamp(m.tx-m.x,-420*dt,420*dt);if(m.dt<=0){m.dash=2;m.x=m.tx;beep(160,.4,'sawtooth',.06,60)}}
 else if(m.dash===2){m.y=Math.min(DY,m.y+520*dt);
  if(P.dead<=0&&Math.abs(P.x-m.x)<24&&P.y>m.y+40&&P.y<m.y+104)hurt(15);
  if(m.y>=DY){m.dash=3;boom(.25);shake=Math.max(shake,8);pebRing(m.x,m.y+70,6,120);
   for(let i=0;i<12;i++){const a=Math.PI+R()*Math.PI;pt.push({x:m.x+rnd(-20,20),y:m.y+80,vx:Math.cos(a)*rnd(60,160),vy:Math.sin(a)*rnd(40,120),l:rnd(.3,.6),c:R()<.5?'#c4b4a0':'#7a6a5c',s:4})}}}
 else{m.y-=170*dt;if(m.y<=130){m.y=130;m.dash=0;m.dk=(ph===1?5.5:4)*fr}}}
/* ---- wrappers ---- */
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='BOULDER BARON';boss.gates=[.6,.25];boss.ph=0;boss.max=boss.hp=Math.round(boss.hp*1.15);m=fresh();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=130;for(let i=0;i<3;i++)addRock(b,i)}
 if(m.in){run(b,dt);b.x=m.x+(m.tr>0||m.dash===1?r2(rnd(-2,2)):0);b.y=Math.max(120,m.y);
  for(const e of en)if(e.baron&&!e.thrown){const a=m.mt*1.4+e.orb*TAU/3;e.x=m.x+Math.cos(a)*ORB;e.y=m.y+Math.sin(a)*ORB}}
 return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
const _sc=scene;scene=function(){const r=_sc.apply(this,arguments);
 for(const b of eb)if(b.baron)put(pebSp(),b.x,b.y,{rot:(Math.floor(T*6+b.x*.1)&3)*TAU/4});
 if(!own()||!m.in)return r;const b=boss,x=r2(b.x),y=r2(b.y),fk=Math.floor(T*20)%2,on=Math.floor(T*8)%2;
 for(const e of en)if(e.baron&&!e.thrown&&e.hp>0)put(e.sp,e.x,e.y,{rot:Math.floor(e.t*e.rot*4)*TAU/16,fl:e.hit>0}); // shield in front of hull
 if(m.fl&&on){const e=m.fl;for(let k=0;k<3;k++)px(e.x-6+k*2,e.y+30+k*2,12-k*4,2,AMB)}
 if(m.tr>0||b.dying>0)return r;
 const tele=(m.dash===0)&&((b.ph===1&&m.ft<.7)||(b.ph===2&&m.rt<.7));
 if(tele&&on)for(let j=0;j<8;j++){const a=j/8*TAU,qx=x+Math.cos(a)*34,qy=y+4+Math.sin(a)*34;px(qx-4,qy-4,8,8,DK);px(qx-2,qy-2,4,4,'#fff6c8')}
 if(tele&&b.ph===2)for(let i=0;i<10;i++){if(i===m.gap||i===(m.gap+1)%10)continue;const a=Math.PI/2+(i-.5)*TAU/10;
  put(pebSp(),x+Math.cos(a)*92,y+Math.sin(a)*92,{a:on?.7:.35})}
 if(m.dash===1){const tx=r2(m.tx),ph=Math.floor(T*24)%16;
  for(const s of[-52,52])for(let yy=y+44+ph;yy<H;yy+=16)px(tx+s-1,yy,2,8,on?'#ffffff':AMB);
  for(let yy=y+120+Math.floor(T*60)%40;yy<H-20;yy+=80)for(let k=0;k<4;k++){px(tx-10+k*2,yy+k*2,2,2,AMB);px(tx+8-k*2,yy+k*2,2,2,AMB)}}
 else if(m.dash===2){for(const s of[-40,-20,20,40])px(x+s,y-90-fk*8,2,30+(s&2)*4,'#e6e0d4');if(fk)for(let k=0;k<4;k++)px(x-14+k*7,y+56+k*8,4,2,'#ffffff')}
 return r};
FX.baron={m:()=>m};
