const fs=require('fs'),path=require('path'),http=require('http');
const built=path.join(__dirname,'../builds/Kanto_Tetris_Build_1_7_3_SavePortability/index.html');
http.createServer((req,res)=>{
 const suites={'/qa-pause':'pause-browser-suite.js','/qa-controls':'controls-browser-suite.js','/qa-backups':'backup-browser-suite.js'};
 if(req.url!=='/'&&!suites[req.url]){res.writeHead(404);res.end();return}
 let source=fs.readFileSync(built,'utf8');
 if(suites[req.url]){
   source=source.replace('"use strict";','"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
   const end=source.lastIndexOf('\n})();');source=source.slice(0,end)+'\n'+fs.readFileSync(path.join(__dirname,suites[req.url]),'utf8')+source.slice(end);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(source);
}).listen(4180,'127.0.0.1',()=>console.log('Save portability review: http://127.0.0.1:4180'));
