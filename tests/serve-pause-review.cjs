const fs=require('fs');
const path=require('path');
const http=require('http');
const root=path.join(__dirname,'..');
const built=path.join(root,'builds/Kanto_Tetris_Build_1_7_1_AutoPause/index.html');
const baseline=path.join(root,'inspection/Kanto_Tetris_Build_1_7_Agatha/index.html');
http.createServer((req,res)=>{
 if(!['/','/qa','/qa-baseline'].includes(req.url)){res.writeHead(404);res.end();return}
 let source=fs.readFileSync(req.url==='/qa-baseline'?baseline:built,'utf8');
 if(req.url!=='/'){
   source=source.replace('"use strict";', '"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
   const end=source.lastIndexOf('\n})();');
   source=source.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,'pause-browser-suite.js'),'utf8')+source.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source);
}).listen(4178,'127.0.0.1',()=>console.log('Pause review at http://127.0.0.1:4178; /qa runs deterministic browser regressions.'));
