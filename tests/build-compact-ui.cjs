const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),base=path.join(root,'builds/Kanto_Tetris_Build_1_7_3_SavePortability'),out=path.join(root,'builds/Kanto_Tetris_Build_1_7_4_CompactUI');
if(!fs.existsSync(out))fs.cpSync(base,out,{recursive:true});
let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
function once(from,to){const i=html.indexOf(from);if(i<0||html.indexOf(from,i+from.length)>=0)throw new Error('Expected unique anchor: '+from.slice(0,100));html=html.slice(0,i)+to+html.slice(i+from.length)}
once('</head>','<style id="compactUIStyles">\n'+fs.readFileSync(path.join(root,'src/compact-ui.css'),'utf8')+'\n</style>\n</head>');
once('initializeControlsUI();initializeSavePortability();initCropEditorEvents();',fs.readFileSync(path.join(root,'src/compact-ui.js'),'utf8')+'\ninitializeControlsUI();initializeSavePortability();initializeCompactUI();initCropEditorEvents();');
html=html.replaceAll('Build 1.7.3','Build 1.7.4').replace("build:'1.7.3'","build:'1.7.4'").replace('build:"1.7.3"','build:"1.7.4"');
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())new vm.Script(m[1],{filename:`game-${i}.js`});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(root,'inspection/source-1.7.4.html'),html.replace(/data:[^;,"'\s]+;base64,[A-Za-z0-9+/=]+/g,'data:ART_OMITTED'));
console.log('Built 1.7.4; JavaScript parsed.');
