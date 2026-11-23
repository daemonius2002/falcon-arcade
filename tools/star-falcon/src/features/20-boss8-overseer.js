/* Stage 8 finale boss "The Overseer": a wide mothership command core in 3 forms (gun deck: 4 turret pods
   behind a time-bounded shield; laser lanes: 6 lanes, 3 fire, a safe pair near you, scout trios; exposed
   reactor: spiral / rest+burst, ring with a gap below 15%). Mutes the core boss pattern.
   Wraps mkBoss, updBoss, dmg, setScene, scene, update, startLevel. Stores nothing. FX.overseer={m:()=>state} */
const N=7,S='overseer',MG='#e02a6a',S1='#66727f',S2='#3a434d',SD='#262c33',SK='#14181d',SH='#8a96a3';
const SOCK=[-120,-56,56,120],CAP=48;
let m=null,deb=[];
const fr=()=>FR[save.diff]||1;
const fresh=()=>({in:0,x:W/2,y:124,t:0,u:0,tr:0,ts:0,te:0,np:0,
 pods:[],shOn:1,t1:0,pf:1.2,pi:0,fan:2.4,sb:0,shf:0,
 lz:0,lk:1.4,ls:[0,0,0,0,0,0],lh:0,sc:3.5,
 mode:0,mt:.7,sa:0,sk:0,dir:1,bu:0,bk:0,rg:2.6});
/* ---------- art ---------- */
function plates(g,x0,x1,y0,y1){for(let x=x0;x<x1;x+=32){g.fillStyle=SD;g.fillRect(x,y0,2,y1-y0);g.fillStyle=SH;g.fillRect(x+2,y0,2,y1-y0)}}
const HULL=[-100,-62,100,-62,148,-34,158,28,140,56,90,72,40,86,-40,86,-90,72,-140,56,-158,28,-148,-34];
function tower(g,w){g.fillStyle=SK;g.fillRect(-w-2,-98,w*2+4,50);g.fillStyle=lin(g,-w,0,w,0,'#8a96a3',S1,S2);g.fillRect(-w,-96,w*2,48);
 g.fillStyle=SD;g.fillRect(-w,-72,w*2,2);g.fillStyle='#ffd98a';for(let x=-w+6;x<w-6;x+=10)g.fillRect(x,-88,6,6);
 g.fillStyle=MG;g.fillRect(-w,-64,w*2,4)}
const aSp=()=>sprite('ovs-a',320,200,g=>{
 part(g,HULL,lin(g,0,-62,0,86,'#7e8a97',S1,S2));
 part(g,[-140,56,140,56,90,72,40,86,-40,86,-90,72],'#2c333b');
 g.save();poly(g,HULL);g.clip();plates(g,-150,150,-60,56);g.fillStyle=SD;g.fillRect(-160,-12,320,2);g.fillRect(-160,24,320,2);
 g.fillStyle=SH;g.fillRect(-160,-10,320,2);g.fillRect(-160,26,320,2);
 for(const s of[-1,1])for(let k=0;k<6;k++){const x=s*(64+k*14);part(g,[x,-34,x+s*8,-34,x+s*14,-22,x+s*6,-22],MG)}
 g.fillStyle=MG;g.fillRect(-160,44,320,4);g.restore();
 for(const s of[-1,1]){g.fillStyle=SK;g.fillRect(s*150-8,-20,16,56);g.fillStyle=S2;g.fillRect(s*150-6,-18,12,52);g.fillStyle='#ff4060';g.fillRect(s*150-2,-14,4,4);g.fillStyle='#5fe3d6';g.fillRect(s*150-2,22,4,6)}
 for(const sx of SOCK){ell(g,sx,34,21,19,SK);ell(g,sx,34,17,15,SD);ell(g,sx-3,31,6,4,'#4a5462')}
 for(const s of[-1,1])for(let k=0;k<3;k++){const x=s*(24+k*22)-(s<0?14:0);g.fillStyle=SK;g.fillRect(x,60,14,10);g.fillStyle=k%2?'#ffd98a':'#ff9a2a';g.fillRect(x+2,66,10,2)}
 tower(g,34);
 ell(g,0,4,32,30,SK);ell(g,0,4,27,25,MG);ell(g,0,4,22,20,'#5a0f2c');ell(g,0,4,16,15,SK);
 g.fillStyle='#ffb0c8';g.fillRect(-14,-22,6,4);g.fillStyle='#fff';g.fillRect(-2,-96,4,6)});
const bSp=()=>sprite('ovs-b',320,200,g=>{
 g.lineJoin='miter';poly(g,HULL);g.strokeStyle=SK;g.lineWidth=12;g.stroke();g.strokeStyle=S2;g.lineWidth=6;g.stroke();
 g.fillStyle=SK;g.fillRect(-150,-32,300,10);g.fillRect(-146,40,292,10);g.fillStyle=S1;g.fillRect(-150,-32,300,4);g.fillRect(-146,40,292,4);
 for(const x of[-132,-96,-60,60,96,132]){g.fillStyle=SK;g.fillRect(x-6,-60,12,128-Math.abs(x)*.3);g.fillStyle=S1;g.fillRect(x-4,-58,4,124-Math.abs(x)*.3);g.fillStyle=SD;g.fillRect(x,-58,2,124-Math.abs(x)*.3)}
 const cab=(x0,x1,dy,col)=>{g.strokeStyle=SK;g.lineWidth=8;g.beginPath();g.moveTo(x0,-20);g.quadraticCurveTo((x0+x1)/2,-20+dy,x1,-20);g.stroke();g.strokeStyle=col;g.lineWidth=4;g.stroke()};
 cab(-132,-60,46,MG);cab(-96,-60,24,'#5fe3d6');cab(60,132,46,MG);cab(60,96,24,'#5fe3d6');cab(-60,60,90,'#ff9a2a');
 for(const sx of SOCK){g.fillStyle=SK;g.fillRect(sx-8,40,16,14);g.fillStyle='#ff8a1e';g.fillRect(sx-4,48,8,4)}
 tower(g,28);
 ell(g,0,4,56,54,SK);ell(g,0,4,50,48,MG);ell(g,0,4,44,42,'#5a0f2c');
 for(let k=0;k<12;k++){const a=k/12*TAU;g.save();g.translate(Math.cos(a)*38,4+Math.sin(a)*37);g.rotate(a);g.fillStyle=k%2?'#ffd23c':'#ff8a1e';g.fillRect(-4,-6,8,12);g.restore()}
 ell(g,0,4,30,29,SK);ell(g,0,4,24,23,'#7a1410');ell(g,0,4,16,15,SK);
 g.fillStyle='#fff';g.fillRect(-36,-30,4,4);g.fillRect(30,34,4,4)});
const shSp=f=>sprite('ovs-sh'+f,376,256,g=>{const rx=182,ry=122;
 for(let y=-ry-4;y<ry+4;y+=4)for(let x=-rx-4;x<rx+4;x+=4){const q=Math.hypot((x+2)/rx,(y+2)/ry);
  if(q>1||q<.9)continue;if(q>.975){g.fillStyle='#c8fffa';g.fillRect(x,y,4,4)}else if(((x>>2)+(y>>2)+f)&1){g.fillStyle='#5fe3d6';g.fillRect(x,y,4,4)}}
 for(let k=0;k<20;k++){const a=(k+f*.5)/20*TAU,cx=Math.cos(a)*rx*.9,cy=Math.sin(a)*ry*.9;g.fillStyle='#c8fffa';
  for(let j=0;j<6;j++){const b=j/6*TAU;g.fillRect(r2(cx+Math.cos(b)*10)-2,r2(cy+Math.sin(b)*10)-2,4,4)}}},0);
const beamSp=f=>sprite('ovs-beam'+f,64,48,g=>{g.fillStyle=MG;g.fillRect(-30,-24,60,48);g.fillStyle='#ff7aa8';g.fillRect(-22,-24,44,48);
 g.fillStyle='#fff';g.fillRect(-12,-24,24,48);g.fillStyle='#ffd0e0';for(let k=0;k<2;k++){const y=-24+((k*24+f*12)%48);g.fillRect(-26,y,52,4)}},[90,10,40]);
const arwSp=()=>sprite('ovs-arw',24,24,g=>{part(g,[-10,-4,10,-4,0,10],MG);g.fillStyle=MG;g.fillRect(-4,-12,8,8);g.fillStyle='#fff';g.fillRect(-2,-10,4,8)});
const debSp=v=>sprite('ovs-deb'+v,44,36,g=>{part(g,[[-18,-12,14,-14,18,6,-6,14,-16,4],[-14,-14,18,-8,10,12,-18,10],[-8,-14,18,-2,6,14,-18,6]][v],lin(g,0,-14,0,14,'#7e8a97',S1,S2));
 g.fillStyle=MG;g.fillRect(-12,-2,22,4);g.fillStyle=SH;g.fillRect(-10,-8,14,2)});
/* ---------- helpers ---------- */
const sh=(x,y,a,v)=>{if(eb.length<CAP)shoot(x,y,a,v)};
const ease=(tx,ty,k)=>{m.x+=(tx-m.x)*k;m.y=Math.max(120,m.y+(ty-m.y)*k)};
const live=()=>m.pods.filter(e=>e.hp>0&&en.indexOf(e)>=0);
function pin(){for(const e of m.pods){if(e.hp<=0)continue;e.x=e.x0=m.x+e.sx;e.y=m.y+34;e.ft=1e9}}
function pods(){const hp=Math.ceil(16*(1+li*.2));m.pods=SOCK.map(sx=>{const e=mk('turret',m.x+sx,m.y+34,{pod:1,ovs:1});e.sx=sx;e.hp=hp;e.ft=1e9;e.tw=0;return e})}
function dropShield(b){m.shOn=0;for(const e of live())e.hp=0;flashA=Math.max(flashA,.4);beep(1400,.5,'square',.04,200);
 if(b.ph===0&&b.hp<=b.max*.75+1){b.hp=Math.ceil(b.max*.75);if(!m.tr)m.tr=1.2}}
function enter(b){if(b.ph===1){for(const e of m.pods)e.hp=0;m.lz=0;m.lk=1.2;m.sc=3.5}
 if(b.ph===2){m.mode=0;m.mt=.7;m.dir=1;m.rg=2.6*fr()}}
function lanes(){const p=clamp(Math.floor(P.x/80),0,5),c=[];for(let s=p-2;s<=p+1;s++)if(s>=0&&s<=4)c.push(s);
 const s=c[ri(0,c.length-1)],rest=[0,1,2,3,4,5].filter(l=>l!==s&&l!==s+1);rest.splice(ri(0,3),1);
 m.ls=[0,0,0,0,0,0];for(const l of rest)m.ls[l]=1}
/* ---------- forms ---------- */
function f1(b,dt,f){m.t1+=dt;ease(240+Math.sin(m.t*.6)*60,124,Math.min(1,dt*3));
 const lp=live();if(m.shOn&&(!lp.length||m.t1>=22))dropShield(b);
 for(const e of lp)if(e.tw>0){e.tw-=dt;if(e.tw<=0){sh(e.x,e.y+10,Math.atan2(P.y-e.y,P.x-e.x),175);beep(620,.08,'square',.025)}}
 m.pf-=dt;if(m.pf<=0&&lp.length){m.pf=.6*f;const e=lp[m.pi++%lp.length];if(e.tw<=0)e.tw=.7}
 m.fan-=dt;if(m.fan<=0){m.fan=3*f;for(let i=0;i<5;i++)sh(m.x,m.y+62,Math.PI/2+(i-2)*.24,150);beep(300,.2,'sawtooth',.04,150)}}
function f2(b,dt,f){ease(240,124,Math.min(1,dt*2));m.lk-=dt;
 if(m.lz===0&&m.lk<=0){lanes();m.lz=1;m.lk=1;beep(880,.9,'square',.03,1760)}
 else if(m.lz===1&&m.lk<=0){m.lz=2;m.lk=1.1;m.lh=0;beep(140,.9,'sawtooth',.07,70);shake=Math.max(shake,6)}
 else if(m.lz===2){m.lh-=dt;const l=clamp(Math.floor(P.x/80),0,5);
  if(P.dead<=0&&m.lh<=0&&m.ls[l]&&Math.abs(P.x-(l*80+40))<38){hurt(16);m.lh=.5}
  if(m.lk<=0){m.lz=0;m.lk=Math.max(1,4.2*f-2.1)}}
 m.sc-=dt;if(m.sc<=0&&m.lz!==2){m.sc=7*f;if(en.filter(e=>e.ovs===2&&e.hp>0).length<=3){for(const dx of[-50,0,50])mk('scout',m.x+dx,m.y+30,{ovs:2});beep(500,.2,'square',.03,900)}}}
function f3(b,dt,f){m.u+=dt;ease(240+Math.sin(m.u*.55)*90,138+Math.sin(m.u*1.1)*18,Math.min(1,dt*3));m.mt-=dt;
 if(m.mode===0){if(m.mt<=0){m.mode=1;m.mt=4;m.sk=0;beep(520,.3,'triangle',.04,1040)}}
 else if(m.mode===1){m.sk-=dt;if(m.sk<=0){m.sk=.2*f;if(eb.length+4<=CAP)for(let k=0;k<4;k++)shoot(m.x,m.y+4,m.sa+k*Math.PI/2,118);m.sa+=.32*m.dir;beep(900+(m.sa*60)%300,.03,'triangle',.015)}
  if(m.mt<=0){m.mode=2;m.mt=2.5;m.bu=0;m.bk=.7;m.dir=-m.dir}}
 else{if(m.bu<3){m.bk-=dt;if(m.bk<=0){m.bu++;m.bk=.12;sh(m.x,m.y+20,Math.atan2(P.y-m.y-20,P.x-m.x),190);beep(760,.06,'square',.03)}}
  if(m.mt<=0){m.mode=0;m.mt=.7}}
 if(b.hp<b.max*.15){m.rg-=dt;if(m.rg<=0){m.rg=2.6*f;const g=Math.atan2(P.y-m.y,P.x-m.x)+rnd(-.4,.4);
  for(let i=2;i<15;i++)sh(m.x,m.y+4,g+(i-1)*TAU/16,130);beep(1320,.2,'triangle',.05,660)}}}
function run(b,dt){const f=fr();m.t+=dt;if(m.sb>0)m.sb-=dt;if(m.shf>0)m.shf-=dt;
 if(m.tr>0){const big=b.ph===1;
  if(!m.ts){m.ts=1;m.te=0;m.np=0;eb=[];flashA=Math.max(flashA,.3);beep(220,m.tr,'square',.05,1320);m.lz=0;for(const e of m.pods)e.tw=0;
   if(big){BS=bSp();for(let i=0;i<6;i++){const a=-Math.PI/2+rnd(-1.3,1.3);deb.push({x:m.x+rnd(-120,120),y:m.y+rnd(-40,40),vx:Math.cos(a)*rnd(90,200),vy:Math.sin(a)*rnd(80,200),rot:rnd(-4,4),r:0,v:i%3})}}}
  m.te-=dt;if(m.te<=0&&m.np<(big?8:4)){m.te=big?.17:.26;m.np++;explode(m.x+rnd(-130,130),m.y+rnd(-50,60),8,big&&m.np%3===0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=(b.ph||0)+1;enter(b)}return}
 if(b.dying>0){m.lz=0;m.mode=0;m.mt=.7;for(const e of m.pods)e.tw=0;return}
 const ph=b.ph||0;if(ph===0)f1(b,dt,f);else if(ph===1)f2(b,dt,f);else f3(b,dt,f)}
/* ---------- wrappers ---------- */
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='THE OVERSEER';boss.gates=[.75,.4];boss.ph=0;m=fresh();BS=aSp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y;pods()}
 if(m.in){run(b,dt);pin();b.x=m.x;b.y=m.y}return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){
  if((e.ph||0)===0&&m.shOn){const lo=Math.ceil(e.max*.75+1);if(e.hp<lo){e.hp=lo;m.shf=.1;if(m.sb<=0){m.sb=1/6;beep(1500,.03,'square',.03)}}}
  const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=e.ph===1?1.5:1.2}}
 return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=aSp();return r};
const _sl=startLevel;startLevel=function(){m=null;deb=[];return _sl.apply(this,arguments)};
const _up=update;update=function(dt){const r=_up.apply(this,arguments);
 if(deb.length){for(const d of deb){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=260*dt;d.r+=d.rot*dt}deb=deb.filter(d=>d.y<H+40&&d.x>-40&&d.x<W+40)}return r};
const _sc=scene;scene=function(){const o=own()&&m.in,b=boss,bl=Math.floor(T*12)%2;
 if(o&&m.lz)for(let l=0;l<6;l++){if(!m.ls[l])continue;const x=l*80+40;
  if(m.lz===2){const f=Math.floor(T*20)%2;for(let y=240;y<H+24;y+=48)put(beamSp(f),x,y)}
  else for(let y=222,i=0;y<H;y+=16,i++)if((i+Math.floor(T*14))%3){px(x-36,y,4,10,MG);px(x+32,y,4,10,MG)}}
 const r=_sc.apply(this,arguments);
 for(const d of deb)put(debSp(d.v),d.x,d.y,{rot:Math.round(d.r/(TAU/16))*TAU/16});
 if(!o)return r;
 for(const e of m.pods){if(e.hp<=0||en.indexOf(e)<0)continue;const w=e.tw>0&&bl;put(e.sp,e.x,e.y,{fl:e.hit>0||w});put(TB,e.x,e.y,{rot:aim(e),fl:e.hit>0});
  if(e.tw>0){px(e.x-2,e.y-2,4,4,'#ffffff');if(bl)for(const s of[-1,1])for(const t of[-1,1])px(e.x+s*24-2,e.y+t*24-2,4,4,MG)}}
 if(b.dying>0||m.tr>0)return r;
 const ph=b.ph||0;
 if(ph===0){if(m.shOn)put(shSp(Math.floor(T*6)%2),b.x,b.y,m.shf>0?{fl:1}:null);
  if(m.fan<.7&&bl)for(let i=0;i<5;i++){const a=Math.PI/2+(i-2)*.24,d=18+m.fan*30;px(b.x+Math.cos(a)*d-2,b.y+62+Math.sin(a)*d-2,4,4,i%2?MG:'#ffffff')}}
 else if(ph===1){px(0,206,W,10,SK);px(0,206,W,2,'#4a5462');
  for(let l=0;l<6;l++){const x=l*80+40,hot=m.ls[l]&&m.lz;px(x-14,202,28,18,SK);px(x-10,206,20,10,hot?(m.lz===2||bl?'#ffffff':MG):S2);
   if(m.lz===1&&m.ls[l])for(const y of[250,400,550])put(arwSp(),x,y+(Math.floor(T*8)%3)*6,{fl:bl})}}
 else{const w=(m.mode===0||(m.mode===2&&m.bu===0))||(b.hp<b.max*.15&&m.rg<.7);
  if(w&&bl){put(BL.core(1),b.x,b.y+4,{fl:1});px(b.x-2,b.y-22,4,52,'#ffffff');px(b.x-26,b.y+2,52,4,'#ffffff')}}
 return r};
FX.overseer={m:()=>m};
