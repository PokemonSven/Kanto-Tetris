const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),adb=path.join(root,'.android-tools/platform-tools/adb.exe');
const label=process.argv[2];if(!['4x3','16x9'].includes(label))throw Error('Expected aspect ratio');
for(const name of ['map-native','preview-map','preview-minimap','preview-maptown']){
 const bytes=execFileSync(adb,['-s','emulator-5556','exec-out','run-as','com.kantotetris.game.qa','cat','files/'+name+'.png'],{maxBuffer:8*1024*1024});
 if(bytes.readUInt32BE(0)!==0x89504e47)throw Error('Not PNG');
 fs.writeFileSync(path.join(root,'android/qa-results/1.8.10',name+'-'+label+'.png'),bytes);
}
console.log('Saved Android '+label+' screenshots.');
