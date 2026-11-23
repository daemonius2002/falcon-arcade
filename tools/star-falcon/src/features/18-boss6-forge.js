/* Stage 6 boss "Magma Forge": a basalt furnace ship. Lava lobs with target rings + burning puddles (all phases),
   ember rain (phase 0), lava walls with green gap guides (phase 1+), eruption lanes with a blue SAFE lane and an
   overheat window (x1.5 damage, coins) in phase 2. Mutes the core boss pattern for its own.
   Wraps mkBoss, updBoss, dmg, setScene, scene, update, startLevel. Stores nothing. FX.forge={m:()=>state,hz:()=>hazards} */
const N=5,S='forge',OR='#ff5a1f',YL='#ffd27a',BLU='#3fa8e0',GR='#3fd060',BA='#33221d',BB='#45302a',RIM='#1a0e0b',LW=96,GY=200;
let m=null,lobs=[],pud=[],walls=[],emb=[];
const fresh=()=>({in:0,x:W/2,y:132,mt:0,tr:0,ts:0,te:0,lt:2,rt:3,wt:2,xt:4,es:'',eT:0,e1:0,safe:2,cn:0,pc:0,gc:0,ct:0,sk:0});
const clr=()=>{lobs=[];pud=[];walls=[];emb=[];if(m){m.es='';m.eT=0}};
/* ---- art ---- */
const H0='#80552b',H1='#552b2b',H2='#2b0000',rock=()=>H1; /* flat basalt tones that survive pix() quantising */
function seam(g,p){for(const[w,col]of[[6,'#a02a10'],[4,OR],[1.6,YL]]){g.strokeStyle=col;g.lineWidth=w;g.lineJoin=g.lineCap='square';g.beginPath();for(let k=0;k<p.length;k+=2)g[k?'lineTo':'moveTo'](p[k],p[k+1]);g.stroke()}}
function hull(g){
 for(const s of[-1,1]){const x=s*78; // arms + lava cannons
  part(g,[s*44,-16,s*72,-26,s*72,4,s*44,10],rock(g,s*44,-26,s*72,10));
  g.fillStyle=BLU;g.fillRect(s>0?46:-70,-8,24,4);g.fillStyle='#bfe6ff';g.fillRect(s>0?46:-70,-8,24,1);
  ell(g,x,-8,22,24,RIM);ell(g,x,-9,19,21,H1);ell(g,x+s*5,-2,13,14,H2);ell(g,x-5,-14,9,9,H0);
  g.fillStyle=RIM;g.fillRect(x-12,6,24,34);g.fillStyle=H1;g.fillRect(x-10,6,20,30);g.fillStyle=H0;g.fillRect(x-10,6,5,30);g.fillStyle=H2;g.fillRect(x+5,6,5,30);
  g.fillStyle='#a02a10';g.fillRect(x-10,16,20,3);g.fillRect(x-10,27,20,3);
  g.fillStyle=RIM;g.fillRect(x-13,36,26,10);g.fillStyle=OR;g.fillRect(x-9,38,18,8);g.fillStyle=YL;g.fillRect(x-5,40,10,6);
  seam(g,[x-14,-14,x-4,-8,x+6,-16,x+14,-10]);g.fillStyle='#ffe9c0';g.fillRect(x-10,-24,4,4)}
 for(const s of[-11,11]){ // chimneys, opaque over the core flame spots
  g.fillStyle=RIM;g.fillRect(s-10,-92,20,40);g.fillStyle=H1;g.fillRect(s-8,-88,16,36);g.fillStyle=H0;g.fillRect(s-8,-88,4,36);
  g.fillStyle=OR;g.fillRect(s-8,-92,16,6);g.fillStyle=YL;g.fillRect(s-5,-91,10,3);g.fillStyle=BLU;g.fillRect(s-8,-72,16,3)}
 const hv=[-30,-68,30,-68,60,-40,64,18,42,52,-42,52,-64,18,-60,-40];
 part(g,hv.map((v,i)=>v*(i%2?1.05:1.06)),RIM);part(g,hv,H1);
 part(g,[-64,18,64,18,42,52,-42,52],H2);part(g,[-60,-40,-30,-68,-24,-62,-52,-36,-56,16,-64,18],H0);
 part(g,[-26,-62,26,-62,46,-40,-46,-40],H0);g.fillStyle='#aa8055';g.fillRect(-26,-62,52,3);
 g.fillStyle=RIM;g.fillRect(-46,-40,92,3);
 seam(g,[-58,-30,-40,-22,-46,-4,-30,6]);seam(g,[58,-30,40,-22,46,-4,30,6]);
 seam(g,[-34,40,-20,30,-8,40]);seam(g,[34,40,20,30,8,40]);seam(g,[-16,-36,-8,-26,0,-32,8,-26,16,-36]);
 for(const s of[-1,1]){ // blue coolant pipes = safe colour
  g.fillStyle=RIM;g.fillRect(s*52-4,-34,8,46);g.fillStyle=BLU;g.fillRect(s*52-2,-32,4,42);g.fillStyle='#bfe6ff';g.fillRect(s*52-2,-32,1,42);
  g.fillStyle='#8a94a4';g.fillRect(s*52-4,-20,8,3);g.fillRect(s*52-4,0,8,3)}
 g.fillStyle='#8a6a5a';for(const[x,y]of[[-22,-58],[20,-58],[-50,-38],[48,-38],[-56,14],[54,14],[-36,46],[34,46]])g.fillRect(x,y,3,3);
 ell(g,0,4,25,25,RIM);ell(g,0,4,22,22,OR);ell(g,0,4,19,19,'#a02a10');ell(g,0,4,17,17,'#2a0c08'); // chest grate
 g.fillStyle=H1;for(let x=-15;x<=13;x+=7)g.fillRect(x,-12,3,32);g.fillStyle=H0;for(let x=-15;x<=13;x+=7)g.fillRect(x,-12,1,32);
 for(let x=-36;x<36;x+=12)part(g,[x,50,x+12,50,x+6,58],x/12&1?OR:'#a02a10')} // dripping lava lip
const bodySp=()=>sprite('forge-body',256,200,hull);
const ringSp=f=>sprite('forge-ring'+f,72,72,g=>{const r=f?29:25;for(const[w,col]of[[10,'#2a0c08'],[6,YL],[2,'#fff6c8']]){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,TAU);g.stroke()}
 g.fillStyle=f?YL:OR;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const q=r-6;g.fillRect(a*q-(b?3:6)+(a?-a*2:0),b*q-(a?3:6)+(b?-b*2:0),b?6:12,a?6:12)}g.fillStyle='#fff6c8';g.fillRect(-3,-3,6,6)},[42,12,6]);
const blobSp=()=>sprite('forge-blob',30,30,g=>{ell(g,0,0,12,12,OR);ell(g,-1,-1,8,8,'#ff9a2f');ell(g,-3,-3,4,4,YL);g.fillStyle='#5a1a0a';g.fillRect(4,2,4,4);g.fillRect(-6,5,3,3)},[90,20,8]);
const pelSp=()=>sprite('forge-pel',18,18,g=>{ell(g,0,0,7,7,OR);ell(g,-1,-1,4,4,YL);g.fillStyle='#fff';g.fillRect(-3,-3,2,2)},[100,20,10]);
const chevSp=()=>sprite('forge-chev',24,28,g=>part(g,[-9,-12,-1,-12,9,0,-1,12,-9,12,1,0],GR),[10,60,20]);
const GL={S:[7,4,7,1,7],A:[2,5,7,5,5],F:[7,4,6,4,4],E:[7,4,6,4,7]};
const safeSp=()=>sprite('forge-safe',76,72,g=>{g.fillStyle='#0e3a5a';g.fillRect(-34,-34,68,28);g.fillStyle=BLU;g.fillRect(-32,-32,64,24);g.fillStyle='#bfe6ff';g.fillRect(-32,-32,64,2);
 g.fillStyle='#fff';[...'SAFE'].forEach((ch,i)=>GL[ch].forEach((row,y)=>{for(let x=0;x<3;x++)if(row>>(2-x)&1)g.fillRect(-29+i*15+x*4,-30+y*4,4,4)}));
 part(g,[-8,-4,8,-4,8,10,18,10,0,30,-18,10,-8,10],BLU);g.fillStyle='#bfe6ff';g.fillRect(-8,-4,4,14)},[8,24,40]);
const segSp=f=>sprite('forge-sg'+f,84,52,g=>{for(let k=0;k<4;k++){const y=-26+k*13,w=30+((k+f)&1?6:0),v=((k+f)%3-1)*3;
 g.fillStyle=OR;g.fillRect(-w+v,y,w*2,13);g.fillStyle='#ff9a2f';g.fillRect(-w+10+v,y,w*2-20,13);g.fillStyle=YL;g.fillRect(-9-v,y,18,13)}
 g.fillStyle='#fff6c8';g.fillRect(f?-6:2,-20,4,10);g.fillRect(f?4:-6,4,4,8)},0);
const crownSp=f=>sprite('forge-cr'+f,92,60,g=>{const tg=(x,h,w,col)=>part(g,[x-w,30,x-w*.7,30-h*.45,x+(f?4:-4),30-h,x+w*.7,30-h*.45,x+w,30],col);
 const T4=f?[[-24,38],[0,56],[24,34]]:[[-24,30],[2,50],[22,42]];g.fillStyle=OR;g.fillRect(-30,20,60,10);
 for(const[x,h]of T4)tg(x,h,15,OR);for(const[x,h]of T4)tg(x,h*.68,9,'#ff9a2f');for(const[x,h]of T4)tg(x,h*.4,5,YL)},[90,20,8]);
/* ---- attacks ---- */
const busy=()=>eb.length>45,tag=()=>{if(eb.length)eb[eb.length-1].frg=1};
const laneOf=x=>clamp(Math.floor(x/LW),0,4);
function lobVolley(b){const n=b.ph>=2?4:3;
 for(let i=0;i<n;i++){const s=i%2?-1:1,tx=i?clamp(P.x+s*rnd(70,130)*(i>2?1.5:1),30,W-30):P.x,ty=clamp(i?P.y+rnd(-70,70):P.y,380,640);
  lobs.push({sx:b.x+(m.cn?78:-78),sy:b.y+44,x:r2(tx),y:r2(ty),t:0});m.cn^=1}
 beep(140,.35,'sawtooth',.05,420)}
function wallRow(b,g){if(busy())return;for(let x=17;x<W;x+=34)if(Math.abs(x-g)>56){shoot(x,b.y+40,Math.PI/2,115);tag()}beep(220,.25,'square',.04,110)}
function enter(b){m.lt=1.6;m.rt=2.5;m.wt=b.ph>=2?4.5:1.5;m.xt=b.ph>=2?0:3;m.es=''} /* phase 2 opens with an eruption */
function hazards(b,dt){const al=P.dead<=0;
 for(const l of lobs){l.t+=dt;if(l.t>=1.1){l.dead=1;boom(.12);for(let k=0;k<6;k++){const a=-Math.PI*rnd(.1,.9),v=rnd(60,160);pt.push({x:l.x,y:l.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.2,.45),c:k&1?OR:YL,s:4})}
  if(al&&Math.hypot(P.x-l.x,P.y-l.y)<34)hurt(15);if(pud.length>=6)pud.shift();pud.push({x:l.x,y:l.y,t:2.5})}}
 lobs=lobs.filter(l=>!l.dead);
 for(const p of pud)p.t-=dt;pud=pud.filter(p=>p.t>0);
 m.pc-=dt;if(al&&m.pc<=0&&pud.some(p=>Math.hypot(P.x-p.x,(P.y-p.y)*1.6)<30)){hurt(6);m.pc=.5}
 for(const e of emb){e.t-=dt;if(e.t<=0){e.dead=1;shoot(e.x,8,Math.PI/2,125);tag()}}emb=emb.filter(e=>!e.dead);
 for(const w of walls){w.t-=dt;if(w.t<=0){w.dead=1;wallRow(b,w.g)}}walls=walls.filter(w=>!w.dead)}
function erupt(b,dt){const fr=FR[save.diff];m.eT-=dt;
 if(m.es==='slide'){if(m.eT<=0){m.es='charge';m.eT=1.5;const L=laneOf(P.x);m.safe=L<2?L+1:L>2?L-1:(P.x<W/2?1:3);beep(90,1.5,'sawtooth',.05,300)}}
 else if(m.es==='charge'){shake=Math.max(shake,6*(1-m.eT/1.5));if(R()<dt*30)pt.push({x:m.x+rnd(-70,70),y:m.y+rnd(20,50),vx:0,vy:rnd(-120,-60),l:.3,c:R()<.5?OR:YL,s:2});
  if(m.eT<=0){m.es='warn';m.eT=1.3;beep(500,.12,'square',.04)}}
 else if(m.es==='warn'){if(Math.floor(m.eT*5)!==Math.floor((m.eT+dt)*5))beep(700,.05,'square',.025);if(m.eT<=0){m.es='gey';m.eT=1.2;m.gc=0;boom(.3);shake=Math.max(shake,8);beep(110,1.2,'sawtooth',.05,60)}}
 else if(m.es==='gey'){m.gc-=dt;if(P.dead<=0&&m.gc<=0&&laneOf(P.x)!==m.safe&&P.y>GY-10){hurt(18);m.gc=.5}
  if(m.eT<=0){m.es='cool';m.e1=1;m.eT=4;m.ct=.5;beep(900,.6,'triangle',.04,200)}}
 else if(m.es==='cool'){let n=0;for(const p of pt)if(p.frg)n++;m.sk+=dt*30;while(m.sk>=1&&n<30){m.sk--;n++;const s=R()<.5?-1:1,ch=R()<.4;pt.push({x:ch?m.x+s*11:m.x+s*rnd(48,80),y:ch?m.y-90:m.y+rnd(-30,10),vx:s*rnd(10,40),vy:rnd(-100,-50),l:rnd(.6,1),c:R()<.6?'#f2f5f8':'#aab4c2',s:ri(3,4)*2,frg:1})}m.sk=Math.min(m.sk,1);
  m.ct-=dt;if(m.ct<=0){m.ct=1;pk.push({k:'coin',x:m.x+rnd(-40,40),y:m.y+50,t:0})}
  if(m.eT<=0){m.es='';m.xt=14*fr}}}
function run(b,dt){const fr=FR[save.diff],ph=b.ph||0;m.mt+=dt;
 const tx=m.es?W/2:W/2+Math.sin(m.mt*.5)*110,ty=m.es==='cool'?176:132+Math.sin(m.mt*1.1)*12,k=Math.min(1,dt*3);m.x+=(tx-m.x)*k;m.y+=(ty-m.y)*k;
 if(b.dying>0){clr();return}
 if(m.tr>0){if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(200,1.1,'square',.05,900);lobs=[];walls=[];emb=[];m.es=''}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.24;m.ts++;explode(m.x+rnd(-70,70),m.y+rnd(-50,44),6,0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=ph+1;enter(b)}hazards(b,dt);return}
 hazards(b,dt);
 if(m.es){erupt(b,dt);return}
 const hold=ph>=2&&m.xt<=0;
 if(!hold){m.lt-=dt;if(m.lt<=0){m.lt=3.6*fr;lobVolley(b)}}
 if(ph===0){m.rt-=dt;if(m.rt<=0){m.rt=4.5*fr;if(!busy()){for(let i=0;i<6;i++)emb.push({x:r2(20+(i+R()*.8)*(W-40)/6),t:.7});beep(1300,.3,'triangle',.03,700)}}}
 if(ph>=1&&!hold){m.wt-=dt;if(m.wt<=0){m.wt=8*fr;let g=clamp(P.x+rnd(-90,90),80,400);
  for(let i=0;i<3;i++){walls.push({g:r2(g),t:.9+i*1.5});let d=R()<.5?-110:110;if(g+d<80||g+d>400)d=-d;g=clamp(g+d,80,400)}}}
 if(ph>=2){m.xt-=dt;if(m.xt<=0&&!walls.length&&!lobs.length&&!eb.some(q=>q.frg)){m.es='slide';m.eT=m.e1?1:.6}}}
/* ---- wrappers ---- */
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='MAGMA FORGE';boss.gates=[.66,.33];boss.ph=0;m=fresh();clr();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y}
 if(m.in){run(b,dt);b.x=m.x+(m.es==='cool'?Math.round(Math.sin(m.mt*30))*2:m.ts?r2(rnd(-2,2)):0);b.y=m.y}
 return r};
const _dmg=dmg;dmg=function(e,d){const a=Array.prototype.slice.call(arguments);
 if(e&&e===boss&&e.own===S&&m&&m.es==='cool'&&typeof d==='number'&&d>0)a[1]=d*1.5;
 const r=_dmg.apply(this,a);
 if(e&&e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}
  else if(e.ph>=2&&!m.e1)e.hp=Math.max(e.hp,Math.ceil(e.max*.08))} /* everyone sees one SAFE-lane eruption + overheat before the kill */
 return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;lobs=[];pud=[];walls=[];emb=[];return _sl.apply(this,arguments)};
const _up=update;update=function(dt){const r=_up.apply(this,arguments);if(!boss&&(lobs.length||pud.length||walls.length||emb.length))clr();return r};
function puddle(p){const on=Math.floor(T*10+p.x)%2,s=p.t<.5?.7:1;if(p.t<.5&&Math.floor(T*12)%2)return;
 for(let j=-3;j<3;j++){const q=(j+.5)/3.2,w=r2(32*s*Math.sqrt(Math.max(0,1-q*q))),y=p.y+j*4;px(p.x-w-2,y,w*2+4,4,'#6a1a0a');px(p.x-w+2,y,w*2-4,4,Math.abs(j+.5)<1.5?'#ff9a2f':OR)}
 px(p.x-12+(on?4:0),p.y-4,6,4,YL);px(p.x+6-(on?6:0),p.y,6,4,YL);px(p.x-2,p.y-8+(on?2:0),4,2,'#fff0d0')}
function dangerLane(L,on){const x0=L*LW+4,w=LW-8;px(x0,GY,4,H-GY,on?YL:OR);px(x0+w-4,GY,4,H-GY,on?YL:OR);
 for(let y=GY,j=0;y<H;y+=8,j++)for(let x=x0+8+(j&1?8:0);x<x0+w-8;x+=16)px(x,y,8,8,on?(j&2?'#ff9a2f':OR):'#7a1a0a')}
const _sc=scene;scene=function(){const o=own()&&m.in,on=Math.floor(T*8)%2,fk=Math.floor(T*12)%2;
 if(o){for(const p of pud)puddle(p);
  if(m.es==='warn')for(let L=0;L<5;L++)if(L!==m.safe)dangerLane(L,on)}
 const r=_sc.apply(this,arguments);
 for(const b of eb)if(b.frg)put(pelSp(),b.x,b.y);
 if(!o)return r;const b=boss;
 for(const l of lobs)put(ringSp(fk),l.x,l.y);
 for(let i=0;i<lobs.length&&i<4;i++){const l=lobs[i],q=Math.min(1,l.t/1.1);put(blobSp(),l.sx+(l.x-l.sx)*q,l.sy+(l.y-l.sy)*q-Math.sin(q*Math.PI)*170)}
 for(const e of emb){const s=fk?10:6;px(e.x-s/2,8-s/2,s,s,OR);px(e.x-2,6,4,4,'#fff6c8');px(e.x-1,0,2,18,YL);px(e.x-8,7,16,2,YL);for(let y=24;y<56;y+=12)if(on||y<40)px(e.x-2,y+(fk?4:0),4,6,y>40?OR:YL)}
 for(const w of walls)if(w.t<=.9){const q=1-w.t/.9;if(on){put(chevSp(),w.g-48,44);put(chevSp(),w.g+48,44,{rot:Math.PI})}
  for(let y=44;y<44+(H-44)*q;y+=16){px(w.g-4,y-2,8,8,'#0a2a12');px(w.g-2,y,4,4,GR)}}
 if(m.es==='charge'||m.es==='warn'||m.es==='gey'){const sx=m.safe*LW+LW/2;put(safeSp(),sx,GY+60+(on?4:0));
  if(m.es==='charge')for(let L=1;L<5;L++)for(let y=GY;y<H;y+=24)px(L*LW-2,y,4,8,on?OR:'#a02a10')}
 if(m.es==='gey'){const q=Math.min(1,(1.2-m.eT)/.2),top=H-(H-GY)*q;
  const sc=r2((T*300)%48);for(let L=0;L<5;L++)if(L!==m.safe){const x=L*LW+LW/2;for(let y=H+24-sc,j=0;y>top+20;y-=48,j++)put(segSp((j+L+fk)&1),x,y);put(crownSp((L+fk)&1),x,top)}}
 if(m.es==='cool'&&on)for(const s of[-52,52])px(b.x+s-4,b.y-36,8,4,'#bfe6ff');
 return r};
FX.forge={m:()=>m,hz:()=>({lobs,pud,walls,emb})};
