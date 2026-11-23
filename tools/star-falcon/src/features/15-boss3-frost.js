/* Stage 3 boss "Frost Monarch": a six-armed ice crystal, 3 phases (turning 6-way spiral; + icicle lane rain
   with 2 safe lanes; ice shell guarded by 3 orbiting shards, stun when they break, shell again at 15%).
   Mutes the core boss pattern. Wraps mkBoss, updBoss, dmg, setScene, scene, startLevel. Stores nothing.
   FX.frost = {m:()=>state} */
const N=2,S='frost',C0='#d9f0fa',C1='#a8d4e8',C2='#1f5f8a',GEM='#b02ad0',LN=80;
let m=null;
const fresh=()=>({in:0,x:W/2,y:130,mt:0,tr:0,te:0,ts:0,vt:.8,off:0,stp:.21,cyc:0,pz:0,
 rt:2.5,rn:0,rk:0,rd:0,rdt:0,dl:[],used:[],last:-1,inv:0,oa:0,st:0,sk:0,re:0,tk:0});
/* ---- art ---- */
function arm(g,a){g.save();g.rotate(a);
 part(g,sym([0,-100,12,-92,19,-78,17,-52,22,-26]),C2);
 for(const s of[-1,1])part(g,[s*14,-60,s*42,-86,s*48,-80,s*44,-72,s*16,-42],C2);
 for(const s of[-1,1])part(g,[s*14,-56,s*40,-81,s*42,-77,s*15,-48],s<0?C0:C1);
 mir(g,[0,-95,9,-89,14,-77,12,-52,16,-28,0,-28],C0,C1);
 g.fillStyle='#ffffff';g.fillRect(-4,-88,4,22);g.fillRect(-2,-62,2,22);
 g.fillStyle=C2;g.fillRect(-1,-50,2,20);g.fillRect(-6,-70,12,2);
 g.restore()}
function hull(g){
 for(let k=0;k<6;k++)arm(g,k*TAU/6);
 const hex=r=>{const p=[];for(let k=0;k<6;k++){const a=k*TAU/6+TAU/12;p.push(Math.cos(a)*r,4+Math.sin(a)*r)}return p};
 part(g,hex(44),C2);part(g,hex(40),C1);
 poly(g,hex(40));g.save();g.clip();g.fillStyle=C0;g.fillRect(-44,-40,44,48);g.restore();
 part(g,hex(32),'#5a9ec4');part(g,hex(30),C1);
 ell(g,0,4,25,25,'#4a1258');ell(g,0,4,22,22,GEM);
 for(let k=0;k<6;k++){const a=k*TAU/6-TAU/4,x=Math.cos(a)*19,y=4+Math.sin(a)*19;ell(g,x,y,4,4,'#e070f0');g.fillStyle='#ffffff';g.fillRect(x-1,y-2,2,2)}
 ell(g,0,4,16,16,'#1a1222');ell(g,0,4,13,13,'#2a1238')}
const bodySp=()=>sprite('frost-body',256,200,hull);
const iciSp=()=>sprite('frost-ici',12,28,g=>{part(g,sym([0,-14,4,-12,6,-8,6,6,3,11,0,15]),'#ffffff');
 g.fillStyle=C1;g.fillRect(2,-8,4,14);g.fillStyle='#e040c0';g.fillRect(-2,-8,4,14);g.fillStyle='#ff90f0';g.fillRect(-2,-8,2,4)},OL);
const shardSp=()=>sprite('frost-shard',36,36,g=>{const p=[];for(let k=0;k<6;k++){const a=k*TAU/6;p.push(Math.cos(a)*9,Math.sin(a)*16)}
 part(g,p,'#6a1a80');part(g,[0,-13,7,-7,7,7,0,13],C1);part(g,[0,-13,-7,-7,-7,7,0,13],'#ffffff');
 g.fillStyle=GEM;g.fillRect(-4,-6,8,12);g.fillStyle='#ff90f0';g.fillRect(-3,-5,2,4);g.fillStyle='#fff';g.fillRect(-5,-11,2,6)});
const shellSp=()=>sprite('frost-shell',212,212,g=>{const R0=100;
 for(let y=-R0;y<R0;y+=2)for(let x=-R0;x<R0;x+=2){const d=Math.hypot(x+1,y+1);if(d>R0)continue;
  if(d>R0-6){g.fillStyle=d>R0-3?'#ffffff':'#c8ecfa';g.fillRect(x,y,2,2)}
  else if(((x+y)/2&1)&&(d>R0-22||((x/2+y/2*3)&7)===0)){g.fillStyle=d>R0-14?'#eefaff':'#d4f0fb';g.fillRect(x,y,2,2)}}
 g.fillStyle='#ffffff';g.fillRect(-60,-70,16,4);g.fillRect(-70,-58,4,12)},0);
/* ---- attacks ---- */
const busy=()=>eb.length>45,fr=()=>FR[save.diff]||1,quiet=b=>b.dying>0||m.tr>0||m.st>0;
function spiral(b){if(busy())return;for(let k=0;k<6;k++)shoot(b.x,b.y+4,m.off+k*TAU/6,120);m.off+=m.stp;beep(620,.05,'square',.018)}
function pickSafe(){const pl=clamp(Math.floor(P.x/LN),0,5),c=[];
 const scan=()=>{for(let a=0;a<6;a++)for(let q=a+1;q<6;q++){const key=a*6+q;if(m.used.includes(key)||key===m.last)continue;if(Math.min(Math.abs(a-pl),Math.abs(q-pl))<=2)c.push([a,q,key])}};
 scan();if(!c.length){m.used=[];scan()}const s=c[ri(0,c.length-1)];m.used.push(s[2]);m.last=s[2];
 m.dl=[0,1,2,3,4,5].filter(i=>i!==s[0]&&i!==s[1])}
function rain(b,dt,every){if(m.rn===0){m.rt-=dt;if(m.rt<=0){m.rn=1;pickSafe();m.rk=.8*(save.diff===0?1.5:1);beep(1320,.12,'triangle',.04,990)}}
 else if(m.rn===1){m.rk-=dt;if(m.rk<=0){m.rn=2;m.rd=0;m.rdt=0}}
 else{m.rdt-=dt;if(m.rdt<=0){m.rdt=.18;if(!busy()||m.rd)for(const l of m.dl){shoot(l*LN+LN/2,-14,Math.PI/2,260);const e=eb[eb.length-1];e.vx=0;e.vy=260;e.r=6;e.frost=1}
   beep(1500-m.rd*200,.06,'triangle',.03);if(++m.rd>=3){m.rn=0;m.rt=every*fr()}}}}
function shell(b,t){m.inv=t;m.oa=0;beep(1760,.3,'triangle',.05,440);flashA=Math.max(flashA,.25);
 for(let k=0;k<3;k++){const a=k*TAU/3,x=b.x+Math.cos(a)*70,y=b.y+Math.sin(a)*70;
  en.push({k:'shard',x,y,x0:x,hp:8,r:14,v:25,t:0,ft:99,hit:0,frost:k,sp:shardSp()})}}
const shards=()=>en.filter(e=>e.k==='shard'&&e.frost!=null&&e.hp>0);
function enter(b){m.vt=.8;m.cyc=0;m.pz=0;m.rn=0;m.rd=0;
 if(m.ph===1)m.rt=1.6;if(m.ph===2){m.rt=3.5*fr();shell(b,4)}}
function run(b,dt){const ph=b.ph||0,f=fr();m.ph=ph;m.mt+=dt;
 if(m.tr>0){if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(330,1.1,'square',.05,1320);m.rn=0}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.22;m.ts++;explode(b.x+rnd(-60,60),b.y+rnd(-50,40),6,0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=m.ph=ph+1;enter(b)}return}
 m.x=W/2+Math.sin(m.mt*(ph?.6:.5))*(ph?110:90);m.y=130+(ph===2?Math.sin(m.mt*1.2)*6:0);
 if(m.inv>0){m.inv-=dt;m.oa+=2*dt;const sh=shards();
  sh.forEach(e=>{const a=m.oa+e.frost*TAU/3;e.x=e.x0=m.x+Math.cos(a)*70;e.y=m.y+Math.sin(a)*70});
  if(!sh.length){m.inv=0;m.st=2.2;explode(b.x,b.y+20,16,0);beep(880,.5,'triangle',.06,1760);m.rn=0}
  else if(m.inv<=0){for(const e of sh)explode(e.x,e.y,5,0);en=en.filter(e=>!(e.k==='shard'&&e.frost!=null));m.rt=Math.max(m.rt,1.5)}}
 if(m.st>0){m.st-=dt;if(pt.length<280&&R()<.5){const a=R()*TAU,d=rnd(10,80);pt.push({x:b.x+Math.cos(a)*d,y:b.y+Math.sin(a)*d*.8,vx:0,vy:-30,l:.4,c:R()<.5?'#ffffff':'#e070f0',s:2})}}
 if(ph===2&&!m.re&&m.inv<=0&&b.hp<b.max*.15){m.re=1;shell(b,3);m.rn=0}
 if(quiet(b)){m.rn=0;return}
 m.cyc+=dt;if(m.pz>0){m.pz-=dt;if(m.pz<=0){m.stp=-m.stp;beep(440,.15,'square',.04,880);m.vt=.1}}
 else if(m.cyc>=5){m.cyc=0;m.pz=1.2}
 else{m.vt-=dt;if(m.vt<=0){m.vt=(ph===0?.55:ph===1?.75:m.inv>0?.9:.5)*f;spiral(b)}}
 if(ph===1)rain(b,dt,4.5);else if(ph===2&&m.inv<=0)rain(b,dt,3.5)}
/* ---- wrappers ---- */
DEF.shard={hp:8,r:14,v:25};
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='FROST MONARCH';boss.gates=[.66,.33];boss.ph=0;boss.max=boss.hp=Math.round(boss.hp*1.1);m=fresh();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y}
 if(m.in){run(b,dt);b.x=m.x+(m.tr>0?r2(rnd(-3,3)):0);b.y=Math.max(120,m.y)}return r};
const _dmg=dmg;dmg=function(e,d){const sh=e===boss&&own()&&m.inv>0,args=Array.prototype.slice.call(arguments);
 if(sh){args[1]=0;m.tk-=1;if(pt.length<290){const a=rnd(.3,2.8);pt.push({x:e.x+Math.cos(a)*96,y:e.y+Math.sin(a)*96,vx:rnd(-40,40),vy:rnd(-60,0),l:.18,c:'#ffffff',s:2})}
  if(m.tk<=0){m.tk=6;beep(2400,.03,'triangle',.02)}}
 const r=_dmg.apply(this,args);if(sh)e.hit=0;
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
const _sc=scene;scene=function(){const r=_sc.apply(this,arguments);
 for(const b of eb)if(b.frost)put(iciSp(),b.x,b.y);
 if(!own()||!m.in)return r;const b=boss,x=r2(b.x),y=r2(b.y),bl=Math.floor(T*8)%2;
 if(m.inv>0){put(shellSp(),x,y+4,{a:m.inv<1&&bl?.35:.7});for(const e of en)if(e.k==='shard'&&e.frost!=null)put(e.sp,e.x,e.y,{fl:e.hit>0})}
 if(b.dying>0)return r;
 if(m.pz>0||m.vt>.5&&!m.tr&&!m.st){if(bl)for(let k=0;k<6;k++){const a=k*TAU/6-TAU/4;px(x+Math.cos(a)*19-2,y+4+Math.sin(a)*19-2,4,4,'#ffffff')}}
 if(m.st>0&&bl)px(x-14,y-58,28,4,'#ffffff');
 if(m.rn===1){const on=Math.floor(m.rk*10)%2===0;
  for(let e=1;e<6;e++){const a=m.dl.includes(e-1),q=m.dl.includes(e);if(!a&&!q)continue;
   for(let yy=70+(Math.floor(T*30)%2)*10;yy<H;yy+=20)px(e*LN-1,yy,2,10,on?C2:GEM)}
  if(on)for(const l of m.dl){const cx=l*LN+LN/2;put(iciSp(),cx,52);for(const cy of[330,540])for(let i=0;i<5;i++){px(cx-10+i*2,cy+i*2,4,4,GEM);px(cx+6-i*2,cy+i*2,4,4,GEM)}}}
 return r};
FX.frost={m:()=>m};
