const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
const suites={brock:'brock-browser-suite.js',controls:'controls-browser-suite.js',pause:'pause-browser-suite.js',backups:'backup-browser-suite.js',ui:'compact-browser-suite.js',android:'android-browser-suite.js'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4185'),route=url.pathname;
 if(route==='/frame'){
  const w=Number(url.searchParams.get('w'))||1280,h=Number(url.searchParams.get('h'))||960,suite=url.searchParams.get('suite')||'ui';
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><style>html,body{margin:0;width:${w}px;height:${h}px}iframe{border:0;display:block;width:${w}px;height:${h}px}</style></head><body><iframe title="Android layout ${w} x ${h}" src="/${suite}"></iframe></body></html>`);return;
 }
 let html=fs.readFileSync(path.join(root,'android/assets/index.html'),'utf8'),suite=suites[route.slice(1)];
 if(suite){
  html=html.replace('"use strict";','"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
  if(route==='/android')html=html.replace('<head>','<head><script>window.KantoHost={display:()=>JSON.stringify({width:1280,height:960,density:1}),faceLayout:()=>"standard",setFaceLayout:v=>{window.qaFaceLayout=v},exportBackup:(json,name)=>{window.qaExport={json,name}},exit:()=>{window.qaExit=true}};</script>');
  const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,suite),'utf8')+html.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4185,'127.0.0.1',()=>console.log('Android QA http://127.0.0.1:4185'));
