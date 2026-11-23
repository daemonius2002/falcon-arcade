/* Stage 4 boss "Tidebreaker": an orange-and-steel battle-sub, 3 phases (deck turrets + drifting sea mines;
   then dives, tracks the Falcon under water and surfaces with a splash ring + aimed fans; then wave walls with a buoy-marked gap).
   Mutes the core boss pattern. Wraps mkBoss, updBoss, dmg, setScene, scene, update, startLevel. Stores nothing.
   FX.tide = {m:()=>state} */
const N=3,S='tide',OR='#f0641e',SEA='#3fb6cf',SY=300;
let m=null;
const fresh=()=>({in:0,x:W/2,y:130,mt:0,tr:0,ts:0,te:0,ex:0,mn:2.2,st:'glide',t:0,hold:1.2,sx:W/2,dx:0,dy:0,warn:0,ft:1.1,dove:0,wt:1.6,fd:1,side:0,gx:150});
/* ---- art ---- */
function hull(g){
 for(const s of[-1,1]){ // twin snorkel masts (cover the core flame spots)
  g.fillStyle=DK;g.fillRect(s*9-6,-88,12,66);g.fillStyle=M1;g.fillRect(s*9-4,-84,4,60);g.fillStyle=M2;g.fillRect(s*9,-84,2,60);
  g.fillStyle=OR;g.fillRect(s*9-6,-90,12,6);g.fillStyle='#ffb070';g.fillRect(s*9-6,-90,12,2)}
 g.fillStyle=M2;g.fillRect(-16,-58,32,4);g.fillRect(-16,-44,32,4);
 for(const s of[-1,1]){ // stabilizer fins
  part(g,[s*72,-28,s*98,-48,s*110,-46,s*96,-22],OR);part(g,[s*72,30,s*98,50,s*110,48,s*96,24],dark(OR,.35));
  part(g,[s*76,-28,s*98,-44,s*104,-44,s*94,-26],'#ffb070')}
 const hp=sym([0,-32,62,-32,80,-29,92,-20,98,-4,96,12,88,26,72,36,0,38]);
 part(g,hp,lin(g,0,-32,0,38,M0,M1,M2,'#3a4352'));
 poly(g,hp);g.save();g.clip();
 g.fillStyle='#3a4352';g.fillRect(-100,24,200,16);g.fillStyle=OR;g.fillRect(-100,18,200,6);g.fillStyle=dark(OR,.4);g.fillRect(-100,22,200,2);
 g.fillStyle=OR;g.fillRect(-100,-5,200,10);g.fillStyle='#ffb070';g.fillRect(-100,-5,200,2);g.fillStyle=dark(OR,.45);g.fillRect(-100,3,200,2);
 g.fillStyle='#ffffff';g.fillRect(-90,-30,180,2);
 g.fillStyle=DK;for(const x of[-84,-44,40,82])g.fillRect(x,-30,2,48);
 for(let x=-88;x<=88;x+=14){if(Math.abs(x)<36)continue;g.fillStyle=DK;g.fillRect(x-3,26,6,6);g.fillStyle='#5fe3d6';g.fillRect(x-1,28,2,2)}
 g.restore();
 for(const s of[-1,1]){ // turret pads
  ell(g,s*64,-6,20,20,DK);ell(g,s*64,-6,17,17,lin(g,s*64-17,-23,s*64+17,11,M0,M2));ell(g,s*64,-6,12,12,'#1a1f28');
  g.fillStyle=OR;for(const a of[0,1,2,3]){const q=a*TAU/4+TAU/8;g.fillRect(s*64+Math.round(Math.cos(q)*14)-2,-6+Math.round(Math.sin(q)*14)-2,4,4)}
  g.fillStyle='#ffe27a';g.fillRect(s*92-2,-2,4,4)}
 const tw=sym([0,-30,18,-28,30,-16,34,4,30,22,18,32,0,34]); // conning tower
 part(g,tw,DK);part(g,tw.map((v,i)=>i%2?(v-4)*.9+4:v*.9),lin(g,-30,-26,30,30,'#ffffff',M1,M2));
 part(g,tw.map((v,i)=>i%2?(v-4)*.72+4:v*.72),OR);
 ell(g,0,4,18,18,DK);ell(g,0,4,14,14,'#0e1a22');
 g.fillStyle=DK;g.fillRect(-10,30,20,10);g.fillStyle='#5a2a10';g.fillRect(-8,32,16,6);g.fillStyle=OR;g.fillRect(-6,34,4,2);g.fillRect(2,34,4,2)}
const bodySp=()=>sprite('tide-body',256,200,hull);
const mineSp=k=>sprite('tide-mine'+k,24,24,g=>{for(let j=0;j<8;j++){const a=j/8*TAU;g.fillStyle=k?'#ffffff':'#ffd23c';g.fillRect(Math.round(Math.cos(a)*9)-2,Math.round(Math.sin(a)*9)-2,4,4)}
 ell(g,0,0,8,8,k?'#e8231e':OR);ell(g,-2,-2,4.5,4.5,k?'#ff9a6a':'#ffb070');g.fillStyle=k?'#ffe27a':'#7a1e08';g.fillRect(-2,-2,4,4);g.fillStyle='#fff';g.fillRect(-4,-4,2,2)},[40,10,8]);
const shotSp=()=>sprite('tide-shot',18,18,g=>{ell(g,0,0,8,8,'#7a1e08');ell(g,0,0,6.5,6.5,OR);ell(g,-1,-1,3.6,3.6,'#ffd27a');g.fillStyle='#fff';g.fillRect(-3,-3,2,2)},[40,10,8]);
const waveSp=()=>sprite('tide-wave',20,12,g=>{part(g,[-10,-6,10,-6,10,2,0,8,-10,2],'#2f8ad8');part(g,[-10,-6,10,-6,10,-2,-10,-2],'#ffffff');
 part(g,[-7,0,0,4,7,0,7,2,0,6,-7,2],'#9fe4ff')},[8,24,60]);
const buoySp=()=>sprite('tide-buoy',28,40,g=>{g.fillStyle=DK;g.fillRect(-1,-18,2,10);g.fillStyle='#ffe27a';g.fillRect(-3,-20,6,4);
 ell(g,0,4,11,12,OR);g.fillStyle='#ffffff';g.fillRect(-11,0,22,4);g.fillStyle='#ffb070';g.fillRect(-6,-6,4,4);ell(g,0,14,13,4,'#9fe4ff')});
/* ---- attacks ---- */
const busy=()=>eb.length>45;
const tag=k=>{const q=eb[eb.length-1];if(q){q.tide=1;q.tk=k||0}return q};
function fan(b){if(busy())return;const o={x:b.x,y:b.y+30},a=aim(o);for(let i=-1;i<=1;i++){shoot(o.x,o.y,a+i*.22,180);tag()}beep(520,.09,'square',.03)}
const mines=()=>eb.filter(q=>q.tide&&q.tk===1).length;
function mine(b){if(busy()||mines()>=3)return;shoot(b.x,b.y+40,aim({x:b.x,y:b.y+40})+rnd(-.5,.5),90);const q=tag(1);if(q){q.r=9;q.age=0}beep(240,.15,'triangle',.05,160)}
function splash(x,y){boom(.25);shake=Math.max(shake,8);for(let i=0;i<14;i++){const a=R()*TAU,v=rnd(60,180);pt.push({x:x+rnd(-30,30),y:y+rnd(-14,14),vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:rnd(.3,.6),c:R()<.5?'#ffffff':SEA,s:4})}
 if(busy())return;const ga=Math.atan2(y-H/2,x-W/2),k0=Math.round(ga/(TAU/12));
 for(let i=0;i<12;i++){const d=((i-k0)%12+12)%12;if(d===0||d===1||d===11)continue;shoot(x+Math.cos(i*TAU/12)*56,y+Math.sin(i*TAU/12)*44,i*TAU/12,135);tag()}}
function wall(){if(busy())return;for(let i=0;i<9;i++){const x=24+i*54;if(Math.abs(x-m.gx)<55)continue;shoot(x,176,Math.PI/2,115);const q=tag(2);if(q)q.r=6}beep(180,.3,'sawtooth',.04,320)}
const turrets=()=>en.filter(e=>e.tide&&e.deck&&e.hp>0);
function enter(b){m.st='glide';m.hold=b.ph===1?1.2:0;m.t=0;m.ft=1.1;if(b.ph===2){m.wt=1.6;m.fd=1;m.gx=rnd(90,210);m.side=0}}
function run(b,dt){const fr=FR[save.diff],ph=b.ph||0,dying=b.dying>0;m.mt+=dt;
 const hx=W/2+Math.sin(m.mt*.45)*110,home=k=>{m.x+=(hx-m.x)*Math.min(1,dt*k);m.y+=clamp(130-m.y,-190*dt,190*dt)};
 if(m.tr>0){ // phase transition: no attacks, hull pops, back to the surface line
  if(!m.ts){m.ts=1;m.ex=0;m.te=0;eb=[];flashA=Math.max(flashA,.3);beep(200,1.1,'square',.05,900);if(m.st==='sink'||m.st==='sub'){m.x=m.st==='sub'?m.sx:m.dx;m.y=130;m.st='glide'}}
  m.te-=dt;if(m.te<=0&&m.ex<5){m.te=.22;m.ex++;explode(m.x+rnd(-80,80),m.y+rnd(-24,30),6,0)}
  m.y+=clamp(130-m.y,-140*dt,140*dt);m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=ph+1;enter(b)}return}
 if(ph===0){m.x=hx;m.y+=(130-m.y)*Math.min(1,dt*3);if(dying)return;m.mn-=dt;if(m.mn<=0){m.mn=3.5*fr;mine(b)}return}
 if(ph===2){home(2);if(dying)return;m.wt-=dt;
  if(!m.fd&&m.wt<=1.5*fr){m.fd=1;fan(b)}
  if(m.wt<=0){wall();m.wt=3*fr;m.fd=0;m.side^=1;m.gx=m.side?rnd(270,390):rnd(90,210)}return}
 // phase 1: 7 s dive cycle
 if(dying&&(m.st==='sink'||m.st==='sub')){m.x=m.st==='sub'?m.sx:m.dx;m.y=130;m.st='glide'}
 if(m.st==='glide'){home(2);m.hold-=dt;if(dying)return;if(Math.abs(m.y-130)<1&&m.hold<=0){m.st='sink';m.t=.8;m.dx=m.x;m.dy=130;m.sx=clamp(m.x,80,W-80);m.y=-300;
   if(!m.dove){m.dove=1;for(const e of turrets())e.hp=0}beep(420,.8,'triangle',.05,110);
   for(let i=0;i<10;i++)pt.push({x:m.dx+rnd(-90,90),y:m.dy+rnd(-20,30),vx:rnd(-30,30),vy:rnd(-40,10),l:rnd(.3,.6),c:R()<.5?'#ffffff':SEA,s:4})}return}
 if(m.st==='sink'){m.t-=dt;m.dy+=12*dt;m.y=-300;if(m.t<=0){m.st='sub';m.t=2.6;m.warn=0}return}
 if(m.st==='sub'){m.t-=dt;m.y=-300;
  if(m.t>.9)m.sx+=clamp(clamp(P.x,80,W-80)-m.sx,-140*dt,140*dt);else if(!m.warn){m.warn=1;beep(300,.9,'triangle',.05,1000)}
  for(let i=0;i<2;i++)if(R()<.6)pt.push({x:m.sx+rnd(-20,20),y:SY+rnd(-8,8),vx:rnd(-6,6),vy:-rnd(12,36),l:rnd(.25,.45),c:R()<.5?'#ffffff':SEA,s:2});
  if(m.t<=0){m.x=m.sx;m.y=SY;m.st='stay';m.t=2.7;m.ft=1.1*fr;splash(m.x,m.y)}return}
 if(m.st==='stay'){m.t-=dt;m.ft-=dt;if(m.ft<=0){m.ft=1.1*fr;fan(b)}if(m.t<=0){m.st='glide';m.hold=0}}}
/* ---- wrappers ---- */
const own=()=>boss&&boss.own===S&&m;
const hidden=()=>m&&(m.st==='sink'||m.st==='sub')&&m.tr<=0;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='TIDEBREAKER';boss.gates=[.6,.3];boss.ph=0;m=fresh();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y;for(const s of[-1,1]){const e=mk('turret',b.x+s*64,b.y-6,{deck:1});if(e){e.hp=16;e.tide=1;e.side=s;e.ft=1.2+(s+1)*.6}}}
 if(m.in){run(b,dt);b.x=m.x+(m.tr>0?r2(rnd(-2,2)):0);b.y=m.y;b.hide=hidden()?1:0;
  for(const e of en)if(e.tide&&e.deck){e.x=b.x+e.side*64;e.y=b.y-6;if(m.tr>0||b.dying>0)e.ft=Math.max(e.ft,b.dying>0?1e9:.5)}}
 return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
const _up=update;update=function(dt){ // sea mines: drift, stop, blink, burst
 if(eb.length){let bu=null;for(const q of eb)if(q.tide&&q.tk===1&&!q.dead){q.age=(q.age||0)+dt;if(q.age>1.3)q.vx=q.vy=0;if(q.age>=2){q.dead=1;(bu||(bu=[])).push(q)}}
  if(bu)for(const q of bu){for(let i=0;i<6;i++)pt.push({x:q.x,y:q.y,vx:rnd(-90,90),vy:rnd(-90,90),l:.3,c:R()<.5?'#ffffff':'#ffd23c',s:2});
   if(!busy()){const o=R()*TAU;for(let i=0;i<6;i++){shoot(q.x,q.y,o+i*TAU/6,130);tag()}}beep(700,.08,'square',.03,300)}}
 return _up.apply(this,arguments)};
const dots=(x,y,rr,n,col)=>{for(let j=0;j<n;j++){const a=j/n*TAU,qx=x+Math.cos(a)*rr,qy=y+Math.sin(a)*rr;px(qx-4,qy-4,8,8,DK);px(qx-2,qy-2,4,4,col)}};
const _sc=scene;scene=function(){const r=_sc.apply(this,arguments),on=Math.floor(T*8)%2;
 for(const q of eb)if(q.tide){if(q.tk===1){const bl=q.age>1.3;put(mineSp(bl&&on?1:0),q.x,q.y);if(bl&&on)dots(q.x,q.y,34,16,'#ffe27a')}
  else if(q.tk===2)put(waveSp(),q.x,q.y+Math.round(Math.sin(T*8+q.x*.05))*2);else put(shotSp(),q.x,q.y)}
 if(!own()||!m.in)return r;const b=boss,x=r2(b.x),y=r2(b.y),dying=b.dying>0;
 for(const e of en)if(e.tide&&e.deck&&e.hp>0){put(e.sp,e.x,e.y,{fl:e.hit>0});put(TB,e.x,e.y,{rot:aim(e),fl:e.hit>0})}
 if(m.tr<=0&&m.st==='sink'){put(bodySp(),m.dx,m.dy,{a:m.t>.4?.7:.35});const rr=1-m.t/.8;for(let k=0;k<16;k++){const a=k/16*TAU;px(m.dx+Math.cos(a)*(96+rr*24),m.dy+8+Math.sin(a)*(40+rr*12),k%2?6:10,2,k%2?SEA:'#ffffff')}}
 if(m.tr<=0&&m.st==='sub'){const sx=r2(m.sx),ph=Math.floor(T*10)%3;put(BS,sx,SY,{img:BS.s,a:.18});
  for(let k=0;k<3;k++){const o=((k+ph)%3)*6;px(sx-16+o,SY-4+o*2,32-o*2,4,k%2?SEA:'#ffffff');px(sx-34-o*2,SY+8+o*2,14,2,'#ffffff');px(sx+20+o*2,SY+8+o*2,14,2,SEA)}
  if(m.t<=.9)dots(sx,SY,70,16,on?'#ffffff':OR)}
 if(m.tr>0||dying)return r;
 const ph=b.ph||0,fr=FR[save.diff];
 if(ph===0&&m.mn<.7&&mines()<3&&on){px(x-8,y+32,16,6,'#e8231e');px(x-4,y+32,8,2,'#ffe27a')}
 const tele=(ph===1&&m.st==='stay'&&m.ft<.7)||(ph===2&&!m.fd&&m.wt-1.5*fr<.7);
 if(tele&&on)dots(x,y+4,30,8,'#fff6c8');
 if(ph===2&&m.wt<.7){const gx=r2(m.gx),by=170+Math.round(Math.sin(T*6))*2;put(buoySp(),gx,by);
  if(on)for(let i=0;i<9;i++){const wx=24+i*54;if(Math.abs(wx-m.gx)<55)continue;px(wx-6,180,12,2,'#9fe4ff')}}
 return r};
FX.tide={m:()=>m};
