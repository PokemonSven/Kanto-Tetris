const fs=require('fs'),path=require('path'),http=require('http');
const built=path.join(__dirname,'../builds/Kanto_Tetris_Build_1_7_2_Controls/index.html');
http.createServer((req,res)=>{
 if(!['/','/qa-pause','/qa-controls'].includes(req.url)){res.writeHead(404);res.end();return}
 let source=fs.readFileSync(built,'utf8');
 if(req.url!=='/'){
   source=source.replace('"use strict";','"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
   const end=source.lastIndexOf('\n})();');
   source=source.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,req.url==='/qa-pause'?'pause-browser-suite.js':'controls-browser-suite.js'),'utf8')+source.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source);
}).listen(4179,'127.0.0.1',()=>console.log('Controls review: http://127.0.0.1:4179'));
