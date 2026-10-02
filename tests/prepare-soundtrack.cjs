const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'src/assets/music');
const tracks=JSON.parse(fs.readFileSync(path.join(root,'inspection/soundtrack-downloads.json'),'utf8')).map(t=>{
 const number=Number(t.url.match(/\/1-(\d+)/)[1]),file=`frlg-${String(number).padStart(2,'0')}.mp3`,data=fs.readFileSync(path.join(folder,file));
 if(data.length<100000||!(data.subarray(0,3).toString()==='ID3'||data[0]===255))throw Error('Invalid MP3: '+file);
 return {id:`frlg-${number}`,number,name:t.name,file:'music/'+file,source:t.url,download:t.download,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};
}).sort((a,b)=>a.number-b.number);
const manifest={album:'Pokémon FireRed & Pokémon LeafGreen: Super Music Collection (2004)',source:'https://downloads.khinsider.com/game-soundtracks/album/pokemon-firered-leafgreen-music-super-complete',permission:'Project owner stated they have permission to use this soundtrack in this fan project (2026-10-01).',tracks};
fs.writeFileSync(path.join(root,'src/assets/soundtrack.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`${tracks.length} MP3 files verified; ${(tracks.reduce((n,t)=>n+t.bytes,0)/1048576).toFixed(1)} MiB.`);
