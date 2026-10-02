const fs=require('fs'),path=require('path'),http=require('http');
const built=path.join(__dirname,'../builds/Kanto_Tetris_Build_1_7_4_CompactUI/index.html');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4183'),route=url.pathname;
 if(['/review-4x3','/review-16x9'].includes(route)){
   const [w,h]=route.endsWith('4x3')?[1280,960]:[1920,1080];
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end(`<!doctype html><html><head><title>Build 1.7.4 QA ${w} × ${h}</title><style>html,body{margin:0;width:${w}px;height:${h}px}iframe{display:block;border:0;width:${w}px;height:${h}px}</style></head><body><iframe title="Actual game at ${w} × ${h}" src="${url.searchParams.get('suite')==='ui'?'/qa-ui':'/review'}"></iframe></body></html>`);return;
 }
 const suites={'/qa-pause':'pause-browser-suite.js','/qa-controls':'controls-browser-suite.js','/qa-backups':'backup-browser-suite.js','/qa-ui':'compact-browser-suite.js','/review':'compact-review-scene.js'};
 if(route!=='/'&&!suites[route]){res.writeHead(404);res.end();return}
 let source=fs.readFileSync(built,'utf8');
 if(suites[route]){
   if(route!=='/review')source=source.replace('"use strict";','"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
   const end=source.lastIndexOf('\n})();');source=source.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,suites[route]),'utf8')+source.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source);
}).listen(4183,'127.0.0.1',()=>console.log('Compact UI game and QA: http://127.0.0.1:4183'));
