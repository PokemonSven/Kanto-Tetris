// Uninstrumented release on a separate origin from all QA fixtures.
const fs=require('fs'),path=require('path'),http=require('http');
const file=path.join(__dirname,'../builds/Kanto_Tetris_Build_1_8_8_BattleTower/index.html');
http.createServer((req,res)=>{
 if(!['/','/index.html'].includes(new URL(req.url,'http://127.0.0.1:4184').pathname)){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(4184,'127.0.0.1',()=>console.log('Kanto Tetris 1.8.8: http://127.0.0.1:4184/'));
