const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),dir=path.join(root,'android/qa-results/1.8.4');
const required=['suite-rocket-4x3','suite-campaign-4x3','suite-controls-4x3','suite-backups-4x3','suite-expansion-4x3','suite-milestones-4x3','suite-tetris-4x3','suite-oak-4x3','suite-practice-4x3','suite-ui-4x3','all-4x3','files-4x3','preview-rocket-4x3','suite-rocket-16x9','suite-ui-16x9','all-16x9'];
const native=required.map(name=>{
 const content=fs.readFileSync(path.join(dir,name+'.txt'),'utf8'),report=content.match(/^INSTRUMENTATION_RESULT: report=(.*)$/m),list=content.match(/^INSTRUMENTATION_RESULT: tests=(.*)$/m);
 const tests=report?JSON.parse(JSON.parse(report[1])).tests:list?JSON.parse(list[1]):[];
 return {file:name+'.txt',passed:tests.filter(t=>t.result==='PASS').length,total:tests.length,result:content.includes('INSTRUMENTATION_RESULT: result=PASS')&&tests.length&&tests.every(t=>t.result==='PASS')?'PASS':'FAIL'};
});
const browser=['1280x960','1920x1080','1280x720'].map(size=>{const r=JSON.parse(fs.readFileSync(path.join(root,'previews/rocket-qa-'+size+'.json'),'utf8'));return {size,passed:r.passed,total:r.tests.length,result:r.passed===35&&!r.failed?'PASS':'FAIL'};});
const release=JSON.parse(fs.readFileSync(path.join(dir,'release-verification.json'),'utf8'));
const summary={version:'1.8.4',native,browser,nativePassed:native.reduce((n,r)=>n+r.passed,0),browserPassed:browser.reduce((n,r)=>n+r.passed,0),release,result:[...native,...browser].every(r=>r.result==='PASS')&&release.installAndLaunch==='PASS'?'PASS':'FAIL',limitation:'Automated browser and Android emulator checks, including native key dispatch. Physical Retroid controller ergonomics/latency and a full human balance playthrough remain untested.'};
fs.writeFileSync(path.join(dir,'qa-summary.json'),JSON.stringify(summary,null,2));fs.copyFileSync(path.join(dir,'qa-summary.json'),path.join(root,'builds/Kanto_Tetris_Build_1_8_4_RocketStory/QA_RESULTS.json'));console.log(JSON.stringify(summary,null,2));if(summary.result!=='PASS')process.exitCode=1;
