const fs=require('fs'),path=require('path');
module.exports=(req,res,root,url)=>{
 if(!/^\/music\/frlg-\d{2}\.(mp3|js)$/.test(url)){res.writeHead(403);res.end();return;}
 const file=path.join(root,url.slice(1));if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 const size=fs.statSync(file).size,range=req.headers.range;let start=0,end=size-1;
 const headers={'Content-Type':url.endsWith('.js')?'application/javascript; charset=utf-8':'audio/mpeg','Accept-Ranges':'bytes','Cache-Control':'no-store'};
 if(range){
  const m=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(m){if(!m[1]){start=Math.max(0,size-Number(m[2]));if(!Number(m[2]))start=size;}else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}}
  if(!m||start> end||start>=size){res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});res.end();return;}
  headers['Content-Range']=`bytes ${start}-${end}/${size}`;
 }
 headers['Content-Length']=end-start+1;res.writeHead(range?206:200,headers);
 if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).pipe(res);
};
