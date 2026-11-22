#!/usr/bin/env node
// Usage: node tools/star-falcon/smoke.js <built.html> [--stages 0,3] [--shot out.png]
// Plays every stage headlessly (invincible, max upgrades, 60fps fixed-step simulation) and
// fails on any JS error or if a stage cannot be cleared. Also clicks through the menu screens.
const {chromium}=require('playwright'),path=require('path');
const a=process.argv.slice(2),arg=k=>{const i=a.indexOf(k);return i<0?null:a[i+1]};
(async()=>{
 const file=path.resolve(a[0]||path.join(__dirname,'../../public/games/star-falcon/index.html'));
 const stages=(arg('--stages')||'0,1,2,3,4,5,6,7').split(',').map(Number);
 const br=await chromium.launch(),pg=await br.newPage({viewport:{width:480,height:820}});
 const errs=[];pg.on('pageerror',e=>errs.push('pageerror: '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::/.test(m.text()))errs.push('console.error: '+m.text())});
 await pg.goto('file://'+file);await pg.waitForTimeout(600);
 let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
 ok(await pg.evaluate(()=>!!window.__sf&&__sf.s.state==='menu'),'boots to menu');
 ok(await pg.evaluate(()=>!document.getElementById('ov').hidden&&document.querySelectorAll('#ov button').length>3),'menu overlay rendered');
 // menu -> hangar -> back
 await pg.click('#ov button[data-a="shop"]');await pg.waitForTimeout(100);
 ok(await pg.evaluate(()=>document.querySelectorAll('#ov .it').length>=6),'hangar opens');
 await pg.click('#ov button.big');await pg.waitForTimeout(100);
 for(const i of stages){
  const r=await pg.evaluate(i=>{const sf=window.__sf;try{
    Object.assign(sf.s.save.up,{gun:5,twin:3,mis:3,las:3,arm:4,bomb:5});
    sf.startLevel(i);let n=0,sawBoss=false,maxEn=0;
    for(;n<30000;n++){const s=sf.s;if(s.state!=='play')break;if(s.paused)return{err:'game paused itself at step '+n};
      if(s.P)s.P.inv=1e9;if(s.boss)sawBoss=true;maxEn=Math.max(maxEn,s.en.length);
      if(s.P&&s.P.dead<=0){s.P.x=240+Math.sin(n/90)*170;s.P.y=600}
      sf.update(1/60);if(n%7===0)sf.draw()}
    const s=sf.s;return{state:s.state,steps:n,sawBoss,maxEn,wave:s.wave,waves:s.waves}}catch(e){return{err:String(e&&e.stack||e)}}},i);
  ok(!r.err&&r.state==='clear'&&r.sawBoss,'stage '+(i+1)+' clears: '+JSON.stringify(r));
  await pg.evaluate(()=>window.__sf.menu());
 }
 // real-time run for a second with the rAF loop + pointer input, mortal player -> must reach game over without errors
 const go=await pg.evaluate(()=>{const sf=window.__sf;try{sf.startLevel(0);let n=0;for(;n<40000&&sf.s.state==='play';n++){const s=sf.s;if(s.P&&s.P.dead<=0){s.P.x=240;s.P.y=80}sf.update(1/60);if(n%11===0)sf.draw()}return{state:sf.s.state,n}}catch(e){return{err:String(e&&e.stack||e)}}});
 ok(!go.err&&(go.state==='over'||go.state==='clear'),'mortal run ends cleanly: '+JSON.stringify(go));
 await pg.evaluate(()=>window.__sf.menu());await pg.waitForTimeout(300);
 if(arg('--shot')){await pg.evaluate(()=>{window.__sf.startLevel(2);for(let n=0;n<900;n++){window.__sf.s.P.inv=1e9;window.__sf.update(1/60)}window.__sf.draw()});await pg.screenshot({path:arg('--shot')})}
 ok(errs.length===0,'no JS errors'+(errs.length?': '+errs.slice(0,8).join(' | '):''));
 await br.close();console.log(fail?'SMOKE FAILED ('+fail+')':'SMOKE OK');process.exit(fail?1:0)})();
