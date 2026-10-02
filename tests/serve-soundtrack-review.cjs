const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
const port=Number(process.env.KANTO_PREVIEW_PORT)||4209;
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4209'),suite=u.searchParams.get('suite')||'audio';
 if(u.pathname.startsWith('/music/')){require('./serve-music.cjs')(req,res,path.join(root,'builds/Kanto_Tetris_Build_1_8_12_Soundtrack'),u.pathname);return;}
 let html=fs.readFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_8_12_Soundtrack/index.html'),'utf8');
 if(u.pathname!=='/play'){
 html=html.replace('"use strict";','"use strict";let qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];const setTimeout=(fn,ms,...args)=>{if(ms===850||ms===900){const timer={fn:()=>fn(...args)};qaCampaignTimers.push(timer);return timer;}return window.setTimeout(fn,ms,...args)};const clearTimeout=id=>{if(id&&typeof id==="object")id.cancelled=true;else window.clearTimeout(id)};');
 const files={audio:'soundtrack-browser-suite.js',grid:'grid-browser-suite.js',map:'map-browser-suite.js',tower:'tower-browser-suite.js',slots:'slots-browser-suite.js',speed:'speed-browser-suite.js',keepsakes:'keepsakes-browser-suite.js',rocket:'rocket-browser-suite.js',oak:'oak-browser-suite.js',nova:'nova-fixes-browser-suite.js',ui:'compact-browser-suite.js',milestones:'milestones-browser-suite.js',expansion:'expansion-browser-suite.js',campaign:'campaign-browser-suite.js',practice:'practice-browser-suite.js',tetris:'tetris-browser-suite.js',backups:'backup-browser-suite.js',controls:'controls-browser-suite.js'};
 const source=files[suite];if(!source){res.writeHead(404);res.end();return;}
 const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,source),'utf8')+(suite==='campaign'?'\n'+fs.readFileSync(path.join(__dirname,'campaign-edge-cases.js'),'utf8'):'')+(!['campaign','backups'].includes(suite)?'\nfirstGamepad=()=>qaPad;':'')+html.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(port,'127.0.0.1',()=>console.log(`Soundtrack preview http://127.0.0.1:${port}/play`));
