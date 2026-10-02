const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4212');
 if(url.pathname.startsWith('/music/')){
  const file=path.join(root,'android/assets',url.pathname);
  if(!file.startsWith(path.join(root,'android/assets/music'))||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':'audio/mpeg'});fs.createReadStream(file).pipe(res);return;
 }
 let html=fs.readFileSync(path.join(root,'android/assets/index.html'),'utf8');
 html=html.replace('<head>','<head><script>window.KantoHost={display:()=>JSON.stringify({width:1280,height:960,density:1}),faceLayout:()=>"standard",setFaceLayout:()=>{},exit:()=>{}};</script>');
 if(url.pathname!=='/play'){
  html=html.replace('"use strict";','"use strict";\nlet qaNow=1000,qaCampaignFast=false;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];');
  const name=url.pathname==='/grid'?'grid':url.pathname==='/ui'?'compact':'handheld';
  let suite=fs.readFileSync(path.join(__dirname,name+'-browser-suite.js'),'utf8');
  suite=suite.replace('// BASE: grid-browser-suite.js',fs.readFileSync(path.join(__dirname,'grid-browser-suite.js'),'utf8').split("$('qaRun').textContent='Run grid QA'")[0]);
  const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+suite+html.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4212,'127.0.0.1',()=>console.log('Handheld review http://127.0.0.1:4212/'));
