// Disposable browser QA origin; never shares storage with the play server.
const fs=require('fs'),path=require('path'),http=require('http'),root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 let html=fs.readFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_7_6_CollectionsBattle/index.html'),'utf8');
 html=html.replace('"use strict";','"use strict";\nlet qaNow=1000;const performance={now:()=>qaNow};const requestAnimationFrame=()=>{};');
 const route=new URL(req.url,'http://127.0.0.1:4186').pathname;
 let fixture=fs.readFileSync(path.join(__dirname,route==='/features'?'collection-battle-suite.js':'android/native-fixture.js'),'utf8');
 if(route!=='/features')fixture+=`\ndocument.body.insertAdjacentHTML('beforeend','<aside id="previewButtons" style="position:fixed;left:8px;bottom:8px;z-index:200;display:grid;gap:6px">'+['battle','dex','pc','detail','tutorial'].map(name=>'<button data-preview="'+name+'">Preview '+name+'</button>').join('')+'</aside>');document.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>{nativeQA.setup();nativeQA.preview(b.dataset.preview)});`;
 const end=html.lastIndexOf('\n})();');html=html.slice(0,end)+'\n'+fixture+html.slice(end);
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
}).listen(4186,'127.0.0.1',()=>console.log('Collection/battle review: http://127.0.0.1:4186/'));
