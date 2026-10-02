const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),dir=path.join(root,'android/qa-results/1.8.3');
const native=[];
for(const file of fs.readdirSync(dir).filter(n=>/^(suite-|all-|files-).*\.txt$/.test(n))){
 const text=fs.readFileSync(path.join(dir,file),'utf8');let tests=[];
 const report=text.match(/^INSTRUMENTATION_RESULT: report=(.*)$/m),list=text.match(/^INSTRUMENTATION_RESULT: tests=(.*)$/m);
 if(report)tests=JSON.parse(JSON.parse(report[1])).tests;else if(list)tests=JSON.parse(list[1]);
 const pass=text.includes('INSTRUMENTATION_RESULT: result=PASS')&&tests.length&&tests.every(t=>t.result==='PASS');
 native.push({file,passed:tests.filter(t=>t.result==='PASS').length,total:tests.length,result:pass?'PASS':'FAIL'});
}
const browser=[];for(const size of ['1280x960','1920x1080','1280x720']){const r=JSON.parse(fs.readFileSync(path.join(root,'previews/oak-qa-'+size+'.json'),'utf8'));browser.push({size,passed:r.passed,total:r.tests.length,result:r.tests.every(t=>t.result==='PASS')?'PASS':'FAIL'});}
const summary={version:'1.8.3',native,browser,nativePassed:native.reduce((n,r)=>n+r.passed,0),browserPassed:browser.reduce((n,r)=>n+r.passed,0),result:[...native,...browser].every(r=>r.result==='PASS')?'PASS':'FAIL',limitation:'Emulator/native dispatch and browser checks; physical Retroid controller ergonomics and latency still need a human test.'};
fs.writeFileSync(path.join(dir,'qa-summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(summary.result!=='PASS')process.exitCode=1;
