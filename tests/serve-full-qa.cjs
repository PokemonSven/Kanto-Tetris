// Disposable origin: fixtures never share storage with the user's play preview.
const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
const files={title:'title-browser-suite.js',audio:'music-polish-browser-suite.js',grid:'grid-browser-suite.js',map:'map-browser-suite.js',tower:'tower-browser-suite.js',slots:'slots-browser-suite.js',speed:'speed-browser-suite.js',keepsakes:'keepsakes-browser-suite.js',rocket:'rocket-browser-suite.js',oak:'oak-browser-suite.js',nova:'nova-fixes-browser-suite.js',ui:'compact-browser-suite.js',milestones:'milestones-browser-suite.js',expansion:'expansion-browser-suite.js',campaign:'campaign-browser-suite.js',practice:'practice-browser-suite.js',tetris:'tetris-browser-suite.js',backups:'backup-browser-suite.js',controls:'controls-browser-suite.js',pause:'pause-browser-suite.js',brock:'brock-browser-suite.js',features:'collection-battle-suite.js'};
files.audit='full-audit-browser-suite.js';
const base=path.join(root,process.env.KANTO_QA_BUILD||'builds/Kanto_Tetris_Build_1_8_16_QA_Fixes');
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4214'),name=u.searchParams.get('suite')||'controls';
 if(u.pathname.startsWith('/music/'))return require('./serve-music.cjs')(req,res,base,u.pathname);
 if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>Kanto Tetris — isolated full QA</h1>'+Object.keys(files).map(s=>'<p><a href="/test?suite='+s+'">'+s+'</a></p>').join('')+'<p><a href="/play">Uninstrumented game</a></p>');return;}
 let html=fs.readFileSync(path.join(u.searchParams.has('android')?path.join(root,'android/assets'):base,'index.html'),'utf8');
 if(u.searchParams.has('android'))html=html.replace('<head>','<head><script>window.KantoHost={display:()=>JSON.stringify({width:innerWidth,height:innerHeight,density:1}),faceLayout:()=>"standard",setFaceLayout:()=>{},exit:()=>{}};</script>');
 if(u.pathname!=='/play'){
  if(!files[name]){res.writeHead(404);res.end();return;}
  const fast=['map','tower','slots','speed','keepsakes','rocket','campaign','practice','expansion','nova'].includes(name);
  html=html.replace('"use strict";','"use strict";let qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];const setTimeout=(fn,ms,...args)=>{if('+fast+'&&(ms===850||ms===900)){const timer={fn:()=>fn(...args)};qaCampaignTimers.push(timer);return timer;}return window.setTimeout(fn,ms,...args)};const clearTimeout=id=>{if(id&&typeof id==="object")id.cancelled=true;else window.clearTimeout(id)};');
  let suite=fs.readFileSync(path.join(__dirname,files[name]),'utf8');
  if(name==='title'||name==='audit')suite=suite.replace('// BASE: grid-browser-suite.js',fs.readFileSync(path.join(__dirname,'grid-browser-suite.js'),'utf8').split("$('qaRun').textContent='Run grid QA'")[0]);
  if(name==='campaign')suite+='\n'+fs.readFileSync(path.join(__dirname,'campaign-edge-cases.js'),'utf8');
  if(!['campaign','backups','pause'].includes(name))suite+='\nfirstGamepad=()=>qaPad;';
  const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+suite+html.slice(end);
 }
 const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'};
 if(u.searchParams.has('offline'))headers['Content-Security-Policy']="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:";
 res.writeHead(200,headers);res.end(html);
}).listen(4214,'127.0.0.1',()=>console.log('Full QA: http://127.0.0.1:4214/'));
