const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 if(req.url.startsWith('/favicon')){res.writeHead(404);res.end();return;}
 let html=fs.readFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_7_9_ComfortPractice/index.html'),'utf8');
 if(!req.url.startsWith('/play')){
  html=html.replace('"use strict";','"use strict";let qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];const setTimeout=(fn,ms,...args)=>{if(ms===850||ms===900){const timer={fn:()=>fn(...args)};qaCampaignTimers.push(timer);return timer;}return window.setTimeout(fn,ms,...args)};const clearTimeout=id=>{if(id&&typeof id==="object")id.cancelled=true;else window.clearTimeout(id)};');
  const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,'practice-browser-suite.js'),'utf8')+'\nfirstGamepad=()=>qaPad;'+html.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4189,'127.0.0.1',()=>console.log('Comfort/Practice QA: http://127.0.0.1:4189/'));
