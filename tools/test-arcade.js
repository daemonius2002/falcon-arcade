#!/usr/bin/env node
// Usage: node tools/test-arcade.js [--games snake-trail,mini-golf] [--port 3411] [--shots dir] [--secs 4]
// Starts server.js, opens the home page and each game, presses START, mashes keys/pointer for a few
// seconds and fails on any JS error, a blank canvas, or a game that never starts.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),{spawn}=require('child_process');
const a=process.argv.slice(2),arg=k=>{const i=a.indexOf(k);return i<0?null:a[i+1]};
(async()=>{
 const root=path.join(__dirname,'..'),port=+(arg('--port')||(3400+process.pid%500)),secs=+(arg('--secs')||4),shots=arg('--shots');
 const all=fs.readdirSync(path.join(root,'public/games')).filter(f=>f.endsWith('.js')).map(f=>f.slice(0,-3)).sort();
 const games=arg('--games')?arg('--games').split(','):all;if(shots)fs.mkdirSync(shots,{recursive:true});
 const srv=spawn('node',[path.join(root,'server.js')],{env:{...process.env,PORT:port},stdio:'ignore'});
 await new Promise(r=>setTimeout(r,700));
 const br=await chromium.launch();let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++};
 try{
  const pg=await br.newPage({viewport:{width:900,height:800}});let errs=[];
  pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::|fonts\./.test(m.text()))errs.push(m.text())});
  await pg.goto(`http://127.0.0.1:${port}/`);await pg.waitForTimeout(500);
  const cards=await pg.evaluate(()=>document.querySelectorAll('.card').length);
  ok(cards>=30&&!errs.length,`home renders ${cards} cards`+(errs.length?' errors: '+errs.join(' | '):''));
  if(shots)await pg.screenshot({path:path.join(shots,'_home.png')});
  for(const id of games){errs=[];
   await pg.goto(`http://127.0.0.1:${port}/#${id}`);await pg.reload();await pg.waitForTimeout(300);
   const has=await pg.$('#gGo');if(!has){ok(false,id+': no START button (game not registered?)');continue}
   await pg.click('#gGo');const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '];const box=await (await pg.$('#gc')).boundingBox();
   const t0=Date.now();let i=0;while(Date.now()-t0<secs*1000){const k=keys[i++%keys.length];await pg.keyboard.down(k);await pg.waitForTimeout(60);await pg.keyboard.up(k);
     if(i%4===0){const x=box.x+box.width*((i*37%100)/100),y=box.y+box.height*((i*53%100)/100);await pg.mouse.move(x,y);await pg.mouse.down();await pg.waitForTimeout(40);await pg.mouse.up()}
     const go=await pg.$('#gO:not([hidden]) #gGo');if(go&&i%10===0){await pg.waitForTimeout(750);await go.click().catch(()=>{})}}
   const info=await pg.evaluate(()=>{const c=document.getElementById('gc'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const s=new Set();for(let i=0;i<d.length;i+=4*7)s.add(d[i]<<16|d[i+1]<<8|d[i+2]);return{colors:s.size,score:document.getElementById('gS').textContent}});
   if(shots)await pg.screenshot({path:path.join(shots,id+'.png')});
   ok(!errs.length&&info.colors>3,`${id}: colors=${info.colors} score=${info.score}`+(errs.length?' errors: '+[...new Set(errs)].slice(0,5).join(' | '):''));}
 }finally{await br.close();srv.kill()}
 console.log(fail?`ARCADE TEST FAILED (${fail})`:'ARCADE TEST OK');process.exit(fail?1:0)})();
