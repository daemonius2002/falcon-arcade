/* Stage 5 boss "Dune Driller": a brass drilling rig that hovers firing sand fans, burrows, tracks the
   player as a dust mound under a blinking column, erupts, then sits dizzy (the big damage window).
   Every phase opens with an early burrow (m.q), later burrows every 9/7 s. Phase 1: wider fans, falling rocks + a second eruption. Phase 2: faster burrows + flipping sandstorm wind.
   Wraps mkBoss, updBoss, dmg, setScene, scene, update, startLevel. Stores nothing. FX.driller={m:()=>state} */
const N=4,S='driller',TL='#1f9aa0',SA='#e09a62',SD='#7a3618',GO='#ffd98a',HY=134;
let m=null;
const fresh=()=>({in:0,x:W/2,y:HY,mt:0,st:'glide',t:.8,g0x:W/2,g0y:120,tr:0,ts:0,te:0,ft:2.4,pod:0,dk:9,q:1,col:W/2,dx:0,dy:0,mx:0,hit1:0,ek:0,
 c2:0,c2t:0,c2x:0,c2h:0,wd:0,wn:0,wt:0,sk:0});
/* ---- art ---- */
const brass=(g,x0,x1)=>lin(g,x0,0,x1,0,'#ffe9a8','#d8a43a','#8a5a1c');
function hull(g){
 for(const s of[-11,11]){g.fillStyle='#3a2a18';g.fillRect(s-8,-90,16,36);g.fillStyle=lin(g,s-6,0,s+6,0,'#ffe9a8','#c8902e','#6a4414');g.fillRect(s-6,-86,12,32);
  g.fillStyle=DK;g.fillRect(s-6,-90,12,6);g.fillStyle='#140c10';g.fillRect(s-4,-88,8,2);g.fillStyle=TL;g.fillRect(s-6,-70,12,4)}
 for(const s of[-1,1]){g.fillStyle='#6a4414';g.fillRect(s>0?46:-66,-10,20,18);g.fillStyle='#ffe9a8';g.fillRect(s>0?46:-66,-10,20,4);
  ell(g,s*70,0,24,29,DK);ell(g,s*70,0,21,26,rad(g,s*70-8,-10,2,30,'#ffe9a8','#d8a43a','#7a4c14'));
  part(g,[s*70-20,-20,s*70+20,-20,s*70+16,-8,s*70-16,-8],lin(g,0,-20,0,-8,lite(TL,.4),TL,dark(TL,.4)));
  g.fillStyle='#3a2a18';for(let k=0;k<3;k++)g.fillRect(s*70-12,-2+k*6,24,3);
  g.fillStyle=DK;g.fillRect(s*70-9,18,18,14);g.fillStyle='#140c10';g.fillRect(s*70-6,22,12,10);g.fillStyle=M1;g.fillRect(s*70-9,18,18,2)}
 const hv=[-30,-64,30,-64,54,-42,58,20,40,44,-40,44,-58,20,-54,-42];
 part(g,hv.map((v,i)=>v*(i%2?1.06:1.05)),DK);part(g,hv,brass(g,-58,58));
 part(g,[-26,-58,26,-58,42,-40,-42,-40],lin(g,0,-58,0,-40,lite(TL,.45),TL,dark(TL,.35)));
 g.fillStyle=dark(TL,.5);g.fillRect(-40,-40,80,2);
 for(const s of[-1,1]){part(g,[s*42,-32,s*52,-36,s*54,14,s*42,20],lin(g,s*42,0,s*54,0,lite(TL,.3),TL,dark(TL,.5)));
  part(g,[s*22,24,s*40,22,s*36,38,s*20,38],lin(g,0,22,0,38,lite(TL,.3),dark(TL,.3)))}
 g.fillStyle=M0;for(const[x,y]of[[-20,-54],[20,-54],[-36,-44],[36,-44],[-48,-28],[48,-28],[-48,10],[48,10]])g.fillRect(x-1,y-1,3,3);
 g.fillStyle='#6a4414';g.fillRect(-36,-30,6,26);g.fillRect(30,-30,6,26);g.fillStyle='#ffe9a8';g.fillRect(-36,-30,2,26);g.fillRect(30,-30,2,26);
 const oc=[];for(let j=0;j<8;j++){const a=(j+.5)/8*TAU;oc.push(Math.cos(a)*27,4+Math.sin(a)*27)}
 part(g,oc,'#145f63');part(g,oc.map((v,i)=>i%2?(v-4)*.85+4:v*.85),lin(g,-22,-20,22,28,lite(TL,.5),TL,dark(TL,.3)));
 ell(g,0,4,18,18,DK);ell(g,0,4,14,14,'#140c10');
 g.save();g.beginPath();g.rect(-26,32,52,8);g.clip();g.fillStyle='#ffd23c';g.fillRect(-26,32,52,8);g.fillStyle='#2a2018';for(let k=-1;k<8;k++)part(g,[-26+k*9,40,-21+k*9,40,-16+k*9,32,-21+k*9,32],'#2a2018');g.restore();
 g.fillStyle=M2;g.fillRect(-24,40,48,10);g.fillStyle=M0;g.fillRect(-24,40,48,2);g.fillStyle=DK;g.fillRect(-24,48,48,2)}
const bodySp=()=>sprite('driller-body',240,190,hull);
function drill(g,f,w,h){const a=w/2-3,b=h/2-2;g.save();poly(g,[-a,-b+4,a,-b+4,0,b]);g.fillStyle=lin(g,-a,0,a,0,M0,M1,M2,'#3a4352');g.fill();g.clip();
 for(let y=-b-16+f*6;y<b+6;y+=12)part(g,[-a-6,y,a+6,y+8,a+6,y+12,-a-6,y+4],f?'#c8902e':'#8a5a1c');g.restore();
 g.fillStyle='#6a4414';g.fillRect(-a-2,-b,a*2+4,6);g.fillStyle='#ffe9a8';g.fillRect(-a-2,-b,a*2+4,2);g.fillStyle='#fff';g.fillRect(-2,b-10,2,4)}
const drillSp=f=>sprite('driller-d'+f,48,56,g=>drill(g,f,48,56));
const bigDrillSp=f=>sprite('driller-u'+f,88,80,g=>{g.rotate(Math.PI);drill(g,f,88,80)});
/* sand-fan bullet: shared readable pink/white core, cream rim and a dark outline so it pops off the orange sand */
const pelSp=()=>sprite('driller-sand2',22,22,g=>{ell(g,0,0,8,8,'#fff0d8');ell(g,0,0,6,6,'#ff4fa8');ell(g,0,0,3,3,'#ffffff');g.fillStyle=GO;g.fillRect(-6,-2,2,4)},[42,16,32]);
const starSp=()=>sprite('driller-star',24,24,g=>{g.beginPath();for(let j=0;j<10;j++){const a=j/10*TAU,q=j%2?4.5:11;g.lineTo(Math.sin(a)*q,-Math.cos(a)*q)}g.closePath();g.fillStyle='#ffd23c';g.fill();g.fillStyle='#fff6c8';g.fillRect(-2,-3,3,3)});
const moundSp=()=>sprite('driller-mound',96,56,g=>{ell(g,4,10,42,14,'#4a1c0a');
 for(const[x,y,r,s]of[[-22,4,14,1],[20,4,15,2],[0,-2,20,3],[-8,-12,12,4],[12,-10,10,5]]){org(g,x,y+2,r,s,9);g.fillStyle=SD;g.fill();org(g,x-2,y,r*.9,s,9);g.fillStyle=lin(g,x-r,y-r,x+r,y+r,'#f6c898',SA,'#b5683a');g.fill()}
 g.fillStyle='#f6c898';g.fillRect(-12,-18,6,4);g.fillRect(-4,-8,4,2);g.fillStyle='#4a1c0a';g.fillRect(18,8,4,4);g.fillRect(-28,10,4,2);g.fillRect(4,12,6,2)});
const crackSp=()=>sprite('driller-crack',96,36,g=>{ell(g,0,4,44,13,'#5a2610');g.strokeStyle='#2c1006';g.lineWidth=5;g.lineJoin='miter';
 for(const p of[[-4,2,-18,-4,-30,2,-40,-2],[4,2,16,-6,28,0,40,-4],[0,4,-6,12,4,16],[0,0,2,-12,-4,-16]]){g.beginPath();for(let k=0;k<p.length;k+=2)g[k?'lineTo':'moveTo'](p[k],p[k+1]);g.stroke()}
 ell(g,0,2,8,5,'#2c1006')},0);
/* ---- attacks ---- */
const busy=()=>eb.length>45,tag=()=>{if(eb.length)eb[eb.length-1].drl=1};
const hxf=()=>W/2+Math.sin(m.mt*.6)*130,hyf=()=>HY+Math.sin(m.mt*1.4)*14;
function fan(b){if(busy())return;const n=b.ph>=1?7:5,x=m.x+(m.pod?70:-70),y=m.y+30;
 for(let i=0;i<n;i++){shoot(x,y,Math.PI/2+(i-(n-1)/2)*.22,150);tag()}m.pod^=1;beep(260,.18,'square',.03,140)}
function sand(x,y,n,up){for(let i=0;i<n;i++){const a=up?-Math.PI/2+rnd(-1,1):R()*TAU,v=rnd(60,170);pt.push({x:x+rnd(-20,20),y:y+rnd(-10,10),vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.3,.6),c:R()<.5?SA:SD,s:4})}}
function erupt(x,full){shake=Math.max(shake,10);boom(.3);beep(120,.4,'sawtooth',.06,500);sand(x,H-30,8,1)}
function enter(b){m.q=1;if(b.ph===2){m.wd=0;m.wn=P.x<W/2?1:-1;m.wt=1;beep(500,.2,'square',.03)}}
function run(b,dt){const fr=FR[save.diff],ph=b.ph||0;m.mt+=dt;
 if(b.dying>0){m.wd=m.wn=0;m.c2=0;if(m.y<0||m.st==='dive'||m.st==='track'||m.st==='erupt'){m.st='hover';m.x=hxf();m.y=hyf()}return}
 if(m.tr>0){if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(200,1.1,'square',.05,900);m.c2=0;if(m.y<0||m.st==='dive'){m.x=hxf();m.y=hyf()}m.st='trans'}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.24;m.ts++;explode(m.x+rnd(-60,60),m.y+rnd(-44,40),6,0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=ph+1;enter(b);m.st='glide';m.t=.8;m.g0x=m.x;m.g0y=m.y}return}
 if(m.c2){m.c2t-=dt;if(m.c2t<=0){if(m.c2===1){m.c2=2;m.c2t=.8;m.c2x=clamp(P.x,60,W-60);beep(180,.8,'square',.035,360)}
   else if(m.c2===2){m.c2=3;m.c2t=.5;m.c2h=0;erupt(m.c2x)}else m.c2=0}
  if(m.c2===3){const ty=H+40-(H+80)*(1-m.c2t/.5);if(!m.c2h&&P.dead<=0&&Math.abs(P.x-m.c2x)<44&&ty<P.y+20){m.c2h=1;hurt(22)}}}
 if(ph===2){m.wt-=dt;if(m.wt<1&&m.wt+dt>=1)beep(440,.15,'square',.03);if(m.wt<=0){m.wd=m.wn;m.wn=-m.wd;m.wt=5;beep(300,.3,'sawtooth',.03,150)}
  if(m.wd){let n=0;for(const p of pt)if(p.drl)n++;m.sk+=dt*40;while(m.sk>=1&&n<40){m.sk--;n++;pt.push({x:rnd(0,W),y:rnd(0,H),vx:m.wd*rnd(380,460),vy:rnd(-10,10),l:rnd(.25,.4),c:'#f0c090',s:2,drl:1})}m.sk=Math.min(m.sk,1)}}
 if(m.st==='hover'){m.x=hxf();m.y=hyf();
  m.ft-=dt;if(m.ft<=0){m.ft=2.4*fr;fan(b)}
  m.dk-=dt;if(m.dk<=0&&m.ft>.7){m.st='dive';m.t=.8;m.col=clamp(P.x,60,W-60);m.dx=m.x;m.dy=m.y;m.y=-300;sand(m.dx,m.dy+40,10,0);beep(420,.8,'sawtooth',.05,80)}}
 else if(m.st==='dive'){m.t-=dt;if(m.t<=0){m.st='track';m.t=1.1;m.mx=m.dx;beep(180,1.1,'square',.04,360)}}
 else if(m.st==='track'){m.t-=dt;const k=1-clamp(m.t/1.1,0,1);m.mx=m.dx+(m.col-m.dx)*Math.min(1,k*1.6);if(R()<dt*20)sand(m.mx,H-44,1,1);
  if(m.t<=0){m.st='erupt';m.t=.5;m.hit1=0;m.ek=0;erupt(m.col);
   if(ph>=1){for(const s of[-1,1])mk('rock',m.col+s*60,-30,{vx:s*30,vy:100,rot:1.5});m.c2=1;m.c2t=.6}}}
 else if(m.st==='erupt'){m.t-=dt;const ty=H+40-(H+40-300)*(1-m.t/.5);
  if(!m.hit1&&P.dead<=0&&Math.abs(P.x-m.col)<44&&ty<P.y+20){m.hit1=1;hurt(22)}
  if(m.ek<3&&ty<H-60-m.ek*130){explode(m.col+rnd(-14,14),ty+20,6,0);m.ek++}
  if(m.t<=0){m.st='dizzy';m.t=3.2;m.x=clamp(m.col,90,390);m.y=300;beep(900,.3,'triangle',.04,300)}}
 else if(m.st==='dizzy'){m.t-=dt;if(Math.floor(m.t*3)!==Math.floor((m.t+dt)*3))beep(1200,.06,'triangle',.02,1600);
  if(m.t<=0){m.st='glide';m.t=.8;m.g0x=m.x;m.g0y=m.y}}
 else if(m.st==='glide'){m.t-=dt;const k=1-clamp(m.t/.8,0,1),e=k*k*(3-2*k);m.x=m.g0x+(hxf()-m.g0x)*e;m.y=m.g0y+(hyf()-m.g0y)*e;
  if(m.t<=0){m.st='hover';m.dk=m.q?2.5:(ph===2?7:9)*fr;m.q=0;m.ft=Math.max(m.ft,1.2)}}}
/* ---- wrappers ---- */
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='DUNE DRILLER';boss.gates=[.6,.3];boss.ph=0;m=fresh();BS=bodySp()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y;m.g0x=b.x;m.g0y=b.y;m.st='glide';m.t=.8}
 if(m.in){run(b,dt);b.hide=m.y<0?1:0;b.x=m.x+(m.st==='dizzy'?Math.round(Math.sin(m.mt*9))*4:m.st==='trans'?r2(rnd(-2,2)):0);b.y=m.y}
 return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
const _up=update;update=function(dt){if(own()&&m.in&&m.wd&&boss.ph===2&&!(boss.dying>0)&&P&&P.dead<=0)P.x+=m.wd*55*dt;return _up.apply(this,arguments)};
function column(x,on){x=r2(x);for(const e of[x-48,x+44]){px(e,0,4,H,on?GO:SD)}if(!on)return;for(let y=0,j=0;y<H;y+=16,j++)for(let xx=x-40+(j&1?8:0);xx<x+40;xx+=16)px(xx,y,8,8,GO)}
function blast(x,ty){x=r2(x);const f=Math.floor(T*20);for(let y=r2(ty)+16,j=0;y<H;y+=8,j++){const w=64+((j*7+f*3)%5)*4,o=((j*5+f)%3-1)*2;
 px(x+o-w/2-4,y,w+8,8,SD);px(x+o-w/2,y,w,8,(j+f)%3?SA:'#f0b480');px(x+o-14+((j+f)%3)*4,y,8,8,(j+f)%2?GO:'#fff0d0');px(x+o+8-((j+f)%2)*6,y,6,8,'#f6c898')}}
const _sc=scene;scene=function(){const r=_sc.apply(this,arguments);
 for(const b of eb)if(b.drl)put(pelSp(),b.x,b.y);
 for(const p of pt)if(p.drl){px(p.x-12,p.y+2,24,2,SD);px(p.x-12,p.y,24,2,'#fff0d8')}
 if(!own()||!m.in)return r;const b=boss,on=Math.floor(T*8)%2,fk=Math.floor(T*12)%2;
 if(m.st==='track'){column(m.col,on);put(crackSp(),m.col,H-28);put(moundSp(),m.mx,H-40)}
 if(m.st==='erupt'){const ty=H+40-(H+40-300)*(1-m.t/.5);put(crackSp(),m.col,H-28);blast(m.col,ty);put(bigDrillSp(fk),m.col,ty)}
 if(m.c2===2){column(m.c2x,on);put(crackSp(),m.c2x,H-28)}
 if(m.c2===3){const ty=H+40-(H+80)*(1-m.c2t/.5);put(crackSp(),m.c2x,H-28);blast(m.c2x,ty);put(bigDrillSp(fk),m.c2x,ty)}
 if(m.st==='dive'){const s=Math.max(.2,Math.ceil(m.t/.8*5)/5),sp=bodySp(),d=drillSp(fk),w=r2(sp.w*s),h=r2(sp.h*s);
  c.drawImage(sp.n,r2(m.dx)-w/2,r2(m.dy)-h/2,w,h);c.drawImage(d.n,r2(m.dx)-r2(d.w*s)/2,r2(m.dy+70*s)-r2(d.h*s)/2,r2(d.w*s),r2(d.h*s));
  const o=BL.core(fk);c.drawImage(o.n,r2(m.dx)-r2(o.w*s)/2,r2(m.dy+4*s)-r2(o.h*s)/2,r2(o.w*s),r2(o.h*s))}
 if(!b.hide&&m.st!=='dive'){put(drillSp(m.st==='dizzy'?0:fk),b.x,b.y+70,{fl:b.hit>0});
  if(m.st==='hover'&&m.ft<.7&&on&&!(b.dying>0)){const x=b.x+(m.pod?70:-70);put(pelSp(),x,b.y+36,{fl:1});px(x-12,b.y+30,24,4,'#fff6c8')}
  if(m.st==='dizzy')for(let k=0;k<3;k++){const a=m.mt*4+k*TAU/3;put(starSp(),b.x+Math.cos(a)*60,b.y-70+Math.sin(a)*16)}}
 if(b.ph===2&&m.wt<1&&m.wn&&on)for(let k=-1;k<=1;k++){const x=W/2+k*110,d=m.wn,y=H/2;
  px(x-26,y-8,52,16,DK);for(let j=0;j<6;j++)px(x+d*(22-j*4)-4,y-8-j*6,8,16+j*12,DK);
  px(x-24,y-6,48,12,GO);for(let j=0;j<5;j++)px(x+d*(22-j*4)-2,y-6-j*6,4,12+j*12,j?GO:'#fff6c8');px(x-d*14-6,y-6,12,4,'#fff6c8')}
 return r};
FX.driller={m:()=>m};
