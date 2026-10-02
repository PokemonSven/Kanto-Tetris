// One-time source migration. Normal builds do not use this tool or historic builds.
// Uses the Acorn parser bundled inside this project's Node runtime, without downloads.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
if(fs.existsSync(path.join(root,'src/game-shell.html')))throw Error('Migration already completed. Refusing to overwrite the maintained source.');
const parserModule={exports:{}};vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],{exports:parserModule.exports,module:parserModule});
const acorn=parserModule.exports;
const groups={
 battle:['startGymBattle','loadGymPokemon','beginGymFight','defeatGymPokemon','completeGymBattle','failGymBattle','teamBlackout','endGame','startEliteBattle','leagueBattleLoss'],
 travel:['routeChainStartAtCursor','routeChainShowTownAtCursor','routeChainContinueFromTownCursor','routeChainAdvance','routeChainTrainFromTownCursor','trainingFlowStartFromTown','routeChainChallengeTownGym','routeChainTownAfterGymLoss','gymReturnToDefeatedTownAfterBadge'],
 saves:['cleanRunSaveObject','runSnapshot','saveRunProgress','loadRunProgress'],
 hazards:['updateGymLeaderSpecials','nextViewerHidden','pullPendingGymSpecialPiece']
};
const names=new Set(Object.values(groups).flat()),definitions={},counts={};
let html=fs.readFileSync(path.join(root,'builds/Kanto_Tetris_Build_1_7_4_CompactUI/index.html'),'utf8');
html=html.replace(/<script>([\s\S]*?)<\/script>/g,(tag,code)=>{
 const ast=acorn.parse(code,{ecmaVersion:'latest'}),edits=[];
 function walk(node){
  if(!node||typeof node!=='object')return;
  let name,fn;
  if(node.type==='FunctionDeclaration'&&names.has(node.id?.name)){name=node.id.name;fn=node;}
  if(node.type==='ExpressionStatement'&&node.expression.type==='AssignmentExpression'&&node.expression.left.type==='Identifier'&&names.has(node.expression.left.name)&&node.expression.right.type==='FunctionExpression'){name=node.expression.left.name;fn=node.expression.right;}
  if(name){(definitions[name]??=[]).push('function '+name+code.slice(fn.start+(node.type==='FunctionDeclaration'?('function '+name).length:'function'.length),fn.end));counts[name]=(counts[name]||0)+1;edits.push([node.start,node.end,'/* campaign owner: '+name+' */']);return;}
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
 }
 walk(ast);for(const [a,b,t] of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+t+code.slice(b);
 return '<script>'+code+'</script>';
});
const assets=[];html=html.replace(/data:(?:image|audio|font|application)\/[\w.+-]+(?:;[^,\s"'`<>]*)?;base64,[A-Za-z0-9+/=]+/g,value=>{const i=assets.length;assets.push(value);return `__KANTO_EMBEDDED_${i}__`});
html=html.replace('"use strict";','"use strict";\n/* CAMPAIGN_MODULES */');
fs.writeFileSync(path.join(root,'src/game-shell.html'),html);
fs.writeFileSync(path.join(root,'src/assets/embedded.json'),JSON.stringify(assets));
fs.writeFileSync(path.join(root,'inspection/campaign-definitions.json'),JSON.stringify(definitions,null,2));
fs.writeFileSync(path.join(root,'src/campaign/ownership.json'),JSON.stringify(groups,null,2)+'\n');
console.log({removedDefinitions:Object.values(counts).reduce((a,b)=>a+b,0),owners:names.size,embeddedAssets:assets.length,counts});
