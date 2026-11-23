/* Stage 7 boss "The Prism": a faceted green crystal, 3 phases (blink teleport between 5 anchors + curving
   star spiral; mirror decoys on a rotating triangle that take turns firing; 3 rotating beams with a
   warn/solid/off cycle). Mutes the core boss pattern. Wraps mkBoss, updBoss, dmg, setScene, scene, update,
   startLevel. Stores nothing. FX.prism = {m:()=>state} */
const N=6,S='prism',G0='#3fd060',VI='#b030e0';
const GL=lite(G0,.5),GD=dark(G0,.32),GX=dark(G0,.62);
const AN=[[100,130],[240,130],[380,130],[160,200],[320,200]];
let m=null,bx=0,by=0;
const fresh=()=>({in:0,x:W/2,y:130,tr:0,te:0,ts:0,n2:0,
 cur:1,dst:1,bt:2.5,bs:0,bk:0,st:3,sp:0,sk:0,sa:0,
 ra:0,d:[null,null],rr:1,fb:0,fl:0,rs:-1,
 th:0,dir:1,bp:0,bq:0,ol:1.2,rg:0});
/* ---- art ---- */
const HEX=[0,-96,78,-46,78,50,0,96,-78,50,-78,-46];
function hull(g,dec){
 const C=4,I=HEX.map((v,i)=>i%2?C+(v-C)*.46:v*.46);
 const shard=(s,f1,f2)=>{part(g,[s*80,-30,s*96,2,s*80,34,s*70,2],f1);part(g,[s*80,-30,s*84,2,s*80,34,s*74,2],f2)};
 shard(-1,GD,GL);shard(1,GX,G0);
 const ot=[G0,GD,GX,GD,G0,GL],it=[GL,G0,GD,G0,GL,'#c8ffd8'];
 for(let k=0;k<6;k++){const a=k*2,b=(k*2+2)%12;
  part(g,[HEX[a],HEX[a+1],HEX[b],HEX[b+1],I[b],I[b+1],I[a],I[a+1]],ot[k]);
  part(g,[0,C,I[a],I[a+1],I[b],I[b+1]],it[k])}
 g.lineJoin='miter';g.strokeStyle=VI;g.lineWidth=2;
 for(let k=0;k<6;k++){g.beginPath();g.moveTo(HEX[k*2],HEX[k*2+1]);g.lineTo(I[k*2],I[k*2+1]);g.stroke()}
 poly(g,I);g.stroke();poly(g,HEX);g.lineWidth=5;g.stroke();
 g.fillStyle='#ffffff';g.fillRect(-52,-50,4,14);g.fillRect(-48,-58,4,6);g.fillRect(-64,-26,4,4);
 g.fillRect(-20,-28,6,4);g.fillRect(-18,-32,2,10);g.fillRect(40,-56,2,2);g.fillRect(-86,-12,2,8);
 g.fillStyle=lite(VI,.4);g.fillRect(-2,-90,4,6);
 ell(g,0,C,20,20,VI);ell(g,0,C,17,17,'#1a0a24');ell(g,0,C,14,14,'#0a0612');
 if(dec){ell(g,0,C,8,8,'#162a1c');g.fillStyle='#2c4a34';g.fillRect(-4,C-4,2,2)}}
const bodySp=()=>sprite('prism-body',200,200,g=>hull(g,0));
const decoySp=()=>sprite('prism-decoy',120,120,g=>{g.scale(.6,.6);hull(g,1)});
const markG=g=>{poly(g,HEX);g.lineJoin='miter';g.strokeStyle=VI;g.lineWidth=8;g.stroke();g.strokeStyle='#ffffff';g.lineWidth=3;g.stroke();
 g.fillStyle='#ffffff';for(let k=0;k<12;k+=2)g.fillRect(HEX[k]-4,HEX[k+1]-4,8,8)};
const markSp=()=>sprite('prism-mark',200,200,markG,0),markSm=()=>sprite('prism-mark-s',120,120,g=>{g.scale(.6,.6);markG(g)},0);
/* phase-2 shot warning: steady outline + crosshair (no white strobe); Screen flash: Soft shows the crosshair only */
const softFl=()=>{try{return !!(FX.settings&&FX.settings.get&&FX.settings.get('flash','full')==='soft')}catch(e){return false}};
const shotSp=()=>sprite('prism-shot',20,20,g=>{part(g,[0,-10,4,-5,9,-3,6,2,7,8,0,6,-7,8,-6,2,-9,-3,-4,-5],VI);
 ell(g,0,0,6,6,VI);part(g,[0,-6,5,0,0,6,-5,0],G0);g.fillStyle='#ffffff';g.fillRect(-2,-2,4,4)},[40,8,60]);
/* ---- helpers ---- */
const busy=()=>eb.length>45,fr=()=>FR[save.diff]||1;
function ring(x,y,n,sp){if(busy())return;const g=Math.atan2(P.y-y,P.x-x)+rnd(-.5,.5);
 for(let k=2;k<n-1;k++)shoot(x,y+4,g+k*TAU/n,sp);beep(1320,.18,'triangle',.05,660)}
function body(j){if(j===0){bx=m.x;by=m.y;return 1}const e=m.d[j-1];if(!e)return 0;bx=e.x;by=e.y;return 1}
function decoys(){const hp=Math.ceil(14*(1+li*.2));
 for(let j=0;j<2;j++){const e={k:'prismDecoy',x:m.x,y:m.y,x0:m.x,hp,r:30,v:40,t:0,ft:99,hit:0,sp:decoySp(),heavy:1};en.push(e);m.d[j]=e}
 beep(990,.25,'triangle',.05,1980)}
function dropDecoys(){for(const e of en)if(e.k==='prismDecoy')explode(e.x,e.y,8,0);en=en.filter(e=>e.k!=='prismDecoy');m.d[0]=m.d[1]=null}
function unhide(b){if(m.bs){m.bs=0;if(m.y<0){m.cur=m.dst;m.x=AN[m.cur][0];m.y=AN[m.cur][1]}}b.hide=0}
function pickTh(){const pb=Math.atan2(P.y-m.y,P.x-m.x),bad=a=>{for(let k=0;k<3;k++){let d=(a+k*TAU/3-pb)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;
  if(Math.abs(d)<.5||Math.abs(d+m.dir*.42)<.5)return 1}return 0};
 for(let i=0;i<16;i++){m.th=R()*TAU;if(!bad(m.th))return}m.th=pb+TAU/6}
function enter(b){const ph=b.ph,f=fr();
 if(ph===1){m.ra=Math.atan2(m.y-180,m.x-240);m.rr=1;m.fl=0;m.fb=0;m.rs=-1;decoys()}
 if(ph===2){dropDecoys();m.bp=0;m.ol=m.bq=1.2*f;m.rg=0;m.dir=R()<.5?1:-1;pickTh()}}
/* ---- phases ---- */
function p0(b,dt,f){
 if(m.bs){m.bk+=dt;
  if(m.bk>=.25&&m.y>-300){m.y=-300;b.hide=1}
  if(m.bk>=.7){m.bs=0;m.cur=m.dst;m.x=AN[m.cur][0];m.y=AN[m.cur][1];b.hide=0;m.bt=4.5*f;ring(m.x,m.y,14,130);flashA=Math.max(flashA,.12)}
  return}
 const k=Math.min(1,dt*4);m.x+=(AN[m.cur][0]-m.x)*k;m.y+=(AN[m.cur][1]-m.y)*k;
 m.bt-=dt;if(m.bt<=0&&m.sp<=0){m.bs=1;m.bk=0;m.dst=(m.cur+ri(1,4))%5;beep(1760,.4,'square',.03,220);return}
 if(m.sp>0){m.sp-=dt;if(m.sp<=2){m.sk-=dt;if(m.sk<=0){m.sk=.16*f;m.sa+=.5;
   if(!busy())for(let a=0;a<2;a++){shoot(m.x,m.y+4,m.sa+a*Math.PI,120);const e=eb[eb.length-1];e.prism=1;e.pa=0}
   beep(1100+(m.sa*40)%400,.04,'triangle',.02)}}}
 else{m.st-=dt;if(m.st<=0&&m.bt>3){m.st=6*f;m.sp=2.7;m.sk=0;beep(520,.6,'triangle',.04,1560)}}}
function p1(b,dt,f){m.ra+=.35*dt;const k=Math.min(1,dt*5);
 m.x+=(240+Math.cos(m.ra)*120-m.x)*k;m.y+=(Math.max(120,180+Math.sin(m.ra)*120)-m.y)*k;
 let live=0;for(let j=0;j<2;j++){const e=m.d[j];if(!e)continue;if(e.hp<=0||en.indexOf(e)<0){m.d[j]=null;continue}live++;
  const a=m.ra+(j+1)*TAU/3;e.x+=(240+Math.cos(a)*120-e.x)*k;e.y+=(180+Math.sin(a)*120-e.y)*k;e.x0=e.x}
 if(!live){if(m.rs<0)m.rs=9;m.rs-=dt;if(m.rs<=0){m.rs=-1;decoys()}}
 if(m.fl>0){m.fl-=dt;if(m.fl<=0){if(body(m.fb)&&!busy()){shoot(bx,by+10,Math.atan2(P.y-by,P.x-bx),190);beep(700,.08,'square',.03,350)}}}
 m.rr-=dt;if(m.rr<=0&&m.fl<=0){m.rr=.75*f;for(let i=1;i<=3;i++){const j=(m.fb+i)%3;if(body(j)){m.fb=j;m.fl=.3;break}}}}
function p2(b,dt,f){const k=Math.min(1,dt*3);m.x+=(240-m.x)*k;m.y+=(140-m.y)*k;m.bq-=dt;
 if(m.bp===0){if(!m.rg&&m.ol-m.bq>=.7){m.rg=1;ring(m.x,m.y,12,130)}
  if(m.bq<=0){m.bp=1;m.bq=1;pickTh();beep(440,.9,'sawtooth',.03,880)}}
 else{m.th+=m.dir*.42*dt;
  if(m.bp===1){if(m.bq<=0){m.bp=2;m.bq=2.4;beep(180,.5,'sawtooth',.06,90);shake=Math.max(shake,5)}}
  else{if(P.dead<=0){const dx=P.x-m.x,dy=P.y-m.y;for(let i=0;i<3;i++){const a=m.th+i*TAU/3,c1=Math.cos(a),s1=Math.sin(a);
    if(dx*c1+dy*s1>60&&Math.abs(dy*c1-dx*s1)<12){hurt(12);break}}}
   if(m.bq<=0){m.bp=0;m.ol=m.bq=1.2*f;m.rg=0;if(R()<.5){m.dir=-m.dir;beep(660,.1,'square',.04);m.n2=.12}}}}}
function run(b,dt){const f=fr();
 if(m.n2>0){m.n2-=dt;if(m.n2<=0)beep(990,.12,'square',.04)}
 if(m.tr>0){if(!m.ts){m.ts=1;eb=[];flashA=Math.max(flashA,.3);beep(330,1.1,'square',.05,1320);unhide(b);m.bp=0;m.fl=0;m.sp=0}
  m.te-=dt;if(m.te<=0&&m.ts<6){m.te=.22;m.ts++;explode(b.x+rnd(-50,50),b.y+rnd(-50,50),6,0)}
  m.tr-=dt;if(m.tr<=0){m.tr=0;m.ts=0;b.ph=(b.ph||0)+1;enter(b)}return}
 if(b.dying>0){unhide(b);m.bp=0;m.fl=0;m.sp=0;return}
 const ph=b.ph||0;if(ph===0)p0(b,dt,f);else if(ph===1)p1(b,dt,f);else p2(b,dt,f)}
/* ---- wrappers ---- */
DEF.prismDecoy={hp:14,r:30,v:40};
const own=()=>boss&&boss.own===S&&m;
const _mb=mkBoss;mkBoss=function(){const r=_mb.apply(this,arguments);
 if(li===N&&boss&&!boss.own){boss.own=S;boss.name='THE PRISM';boss.gates=[.65,.3];boss.ph=0;m=fresh()}return r};
const _ub=updBoss;updBoss=function(b,dt){if(!(b&&b.own===S&&m))return _ub.apply(this,arguments);
 b.a=b.f=b.s=b.k2=1e9;const r=_ub.apply(this,arguments);
 if(!m.in&&b.y>=120){m.in=1;m.x=b.x;m.y=b.y}
 if(m.in){run(b,dt);b.x=m.x;b.y=m.y}return r};
const _dmg=dmg;dmg=function(e){const r=_dmg.apply(this,arguments);
 if(e===boss&&e.own===S&&m){const g=e.gates[e.ph];if(g!=null&&e.hp<e.max*g){e.hp=Math.ceil(e.max*g);if(!m.tr)m.tr=1.2}}return r};
const _ss=setScene;setScene=function(i){const r=_ss.apply(this,arguments);if(i===N)BS=bodySp();return r};
const _sl=startLevel;startLevel=function(){m=null;return _sl.apply(this,arguments)};
const _up=update;update=function(dt){
 if(m&&dt>0){const ca=Math.cos(.5*dt),sa=Math.sin(.5*dt);
  for(const e of eb)if(e.prism&&e.pa<1.5){e.pa+=dt;const vx=e.vx;e.vx=vx*ca-e.vy*sa;e.vy=vx*sa+e.vy*ca}}
 return _up.apply(this,arguments)};
function beam(a,warn){const c1=Math.cos(a),s1=Math.sin(a),x0=m.x,y0=m.y+4;
 if(warn){const o=Math.floor(T*12)%2;for(let d=60,i=0;d<=760;d+=16,i++){const x=x0+c1*d,y=y0+s1*d;if(x<-8||x>W+8||y<-8||y>H+8)break;px(x-2,y-2,4,4,(i+o)%2?VI:'#ffffff')}return}
 const o=Math.floor(T*30)%4;
 for(let d=60;d<=760;d+=8){const x=x0+c1*d,y=y0+s1*d;if(x<-10||x>W+10||y<-10||y>H+10)break;px(x-5,y-5,10,10,G0)}
 for(let d=60,i=0;d<=760;d+=8,i++){const x=x0+c1*d,y=y0+s1*d;if(x<-10||x>W+10||y<-10||y>H+10)break;if((i+o)%4)px(x-2,y-2,4,4,'#ffffff');else px(x-4,y-4,8,8,'#ffffff')}}
const _sc=scene;scene=function(){const o=own(),b=boss;let sy=0,hid=0;
 if(o&&m.in&&m.bs&&m.bk<.25&&Math.floor(T*16)%2){hid=1;sy=b.y;b.y=-999}
 const r=_sc.apply(this,arguments);if(hid)b.y=sy;
 for(const e of eb)if(e.prism)put(shotSp(),e.x,e.y);
 if(!o||!m.in||b.dying>0||m.tr>0)return r;
 const ph=b.ph||0,bl=Math.floor(T*8)%2;
 if(ph===0){if(m.bs&&bl)put(markSp(),AN[m.dst][0],AN[m.dst][1]);
  if(m.sp>2&&bl)for(let k=0;k<6;k++){const a=k*TAU/6+T*3;px(m.x+Math.cos(a)*28-2,m.y+4+Math.sin(a)*28-2,4,4,'#ffffff')}}
 else if(ph===1){if(m.fl>0&&body(m.fb)){if(!softFl())put(m.fb?markSm():markSp(),bx,by);px(bx-2,by-14,4,28,'#ffffff');px(bx-14,by-2,28,4,'#ffffff')}}
 else{for(let k=0;k<3;k++){const a=m.th+k*TAU/3;
   if(m.bp===2)beam(a,0);else if(m.bp===1)beam(a,1);
   else{const c1=Math.cos(a),s1=Math.sin(a),nx=-s1*m.dir,ny=c1*m.dir;
    for(let d=104;d<=152;d+=8)px(m.x+c1*d-3,m.y+4+s1*d-3,6,6,(d>>3)%2?VI:'#ffffff');
    for(let i=1;i<=3;i++){const d=136+i*4;px(m.x+c1*d+nx*i*6-3,m.y+4+s1*d+ny*i*6-3,6,6,'#ffffff')}}}}
 return r};
FX.prism={m:()=>m};
