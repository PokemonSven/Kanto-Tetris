const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
const timerFixture='let qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];const setTimeout=(fn,ms,...args)=>{if(ms===850||ms===900){const timer={fn:()=>fn(...args)};qaCampaignTimers.push(timer);return timer;}return window.setTimeout(fn,ms,...args)};const clearTimeout=id=>{if(id&&typeof id==="object")id.cancelled=true;else window.clearTimeout(id)};';
http.createServer((req,res)=>{
 if(req.url.startsWith('/favicon')){res.writeHead(404);res.end();return;}
 const baseline=req.url.includes('baseline'),build=baseline?'Kanto_Tetris_Build_1_7_6_CollectionsBattle':'Kanto_Tetris_Build_1_7_7_Campaign';
 let html=fs.readFileSync(path.join(root,'builds',build,'index.html'),'utf8').replace('"use strict";','"use strict";\n'+timerFixture);
 const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,'campaign-browser-suite.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'campaign-edge-cases.js'),'utf8')+html.slice(end);
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4187,'127.0.0.1',()=>console.log('Campaign QA: http://127.0.0.1:4187/'));
