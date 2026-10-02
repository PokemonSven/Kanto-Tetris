const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:4213'),android=u.searchParams.has('android');
 const base=path.join(root,android?'android/assets':'builds/Kanto_Tetris_Build_1_8_15_Title_Art');
 if(u.pathname.startsWith('/music/')){require('./serve-music.cjs')(req,res,base,u.pathname);return;}
 let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 if(android)html=html.replace('<head>','<head><script>window.KantoHost={display:()=>JSON.stringify({width:screen.width,height:screen.height,density:1}),faceLayout:()=>"standard",setFaceLayout:()=>{},exit:()=>{}};</script>');
 html=html.replace('"use strict";','"use strict";let qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};const qaCampaignTimers=[];');
 const suite=fs.readFileSync(path.join(__dirname,'title-browser-suite.js'),'utf8').replace('// BASE: grid-browser-suite.js',fs.readFileSync(path.join(__dirname,'grid-browser-suite.js'),'utf8').split("$('qaRun').textContent='Run grid QA'")[0]);
 const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+suite+html.slice(end);
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4213,'127.0.0.1',()=>console.log('Title review http://127.0.0.1:4213/'));
