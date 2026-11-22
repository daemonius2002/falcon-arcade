#!/usr/bin/env node
// Usage: node build.js [--only 03-foo.js,07-bar.js | --none] [--out path]  (default: public/games/star-falcon/index.html)
// Concatenates src/core.html + src/features/*.js (sorted by filename) into one HTML file.
const fs=require('fs'),path=require('path');
const a=process.argv.slice(2),arg=k=>{const i=a.indexOf(k);return i<0?null:a[i+1]};
const root=__dirname,fdir=path.join(root,'src/features');
let files=fs.readdirSync(fdir).filter(f=>f.endsWith('.js')).sort();
if(a.includes('--none'))files=[];
const only=arg('--only');if(only){const w=only.split(',').map(s=>path.basename(s.trim()));files=files.filter(f=>w.includes(f));for(const x of w)if(!files.includes(x)){console.error('missing feature '+x);process.exit(1)}}
const skipF=path.join(root,'src/disabled.txt');
if(!only&&fs.existsSync(skipF)){const sk=fs.readFileSync(skipF,'utf8').split('\n').map(s=>s.trim()).filter(Boolean);files=files.filter(f=>!sk.includes(f))}
const core=fs.readFileSync(path.join(root,'src/core.html'),'utf8');
if(!core.includes('/*__FEATURES__*/'))throw new Error('marker missing');
const body=files.map(f=>{const src=fs.readFileSync(path.join(fdir,f),'utf8');
  if(src.includes('</script'))throw new Error(f+' contains </script');
  try{new Function(src)}catch(e){if(!/not defined/.test(e.message)){console.error('SYNTAX ERROR in '+f+': '+e.message);process.exit(1)}}
  return '/* ==== feature: '+f+' ==== */\n{\n'+src.trim()+'\n}'}).join('\n');
const out=path.resolve(arg('--out')||path.join(root,'../../public/games/star-falcon/index.html'));
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,core.replace('/*__FEATURES__*/',()=>body));
console.log('built '+out+' ('+fs.statSync(out).size+' bytes, '+files.length+' features)');
