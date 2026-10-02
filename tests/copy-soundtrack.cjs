const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..');
module.exports=function(destination){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/assets/soundtrack.json'),'utf8'));
 fs.mkdirSync(path.join(destination,'music'),{recursive:true});
 // Only remove obsolete generated music assets in this exact output folder.
 for(const name of fs.readdirSync(path.join(destination,'music')))if(/^frlg-\d{2}\.(mp3|js)$/.test(name))fs.unlinkSync(path.join(destination,'music',name));
 for(const t of [...manifest.tracks,...manifest.fanfares]){
  const from=path.join(root,'src/assets/music-loop',path.basename(t.file)),data=fs.readFileSync(from);
  if(crypto.createHash('sha256').update(data).digest('hex')!==t.sha256)throw Error('Music asset changed: '+t.file);
  fs.copyFileSync(from,path.join(destination,t.file));
 }
 fs.copyFileSync(path.join(root,'src/assets/soundtrack.json'),path.join(destination,'music/SOURCES.json'));
 return manifest;
};
