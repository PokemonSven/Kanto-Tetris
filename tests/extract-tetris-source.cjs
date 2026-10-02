// One-time move of piece/gravity ownership out of the legacy shell.
const fs=require('fs'),vm=require('vm');
const file='src/game-shell.html',names=['spawn','move','rotate','soft','hard','lock','speed','speedMultiplier'];
if(fs.existsSync('src/tetris/ownership.json'))throw Error('Already extracted');
const m={exports:{}};vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],{module:m,exports:m.exports});
const originals={};let html=fs.readFileSync(file,'utf8');
html=html.replace(/<script>([\s\S]*?)<\/script>/g,(_,code)=>{
 const edits=[];
 function walk(n){if(!n||typeof n!=='object')return;let name;
  if(n.type==='FunctionDeclaration'&&names.includes(n.id?.name))name=n.id.name;
  if(n.type==='ExpressionStatement'&&n.expression.type==='AssignmentExpression'&&names.includes(n.expression.left.name)&&n.expression.right.type==='FunctionExpression')name=n.expression.left.name;
  if(name){(originals[name]??=[]).push(code.slice(n.start,n.end));edits.push([n.start,n.end]);return;}
  for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);
 }walk(m.exports.parse(code,{ecmaVersion:'latest'}));for(const[a,b]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+code.slice(b);return '<script>'+code+'</script>';
});
fs.mkdirSync('src/tetris',{recursive:true});fs.writeFileSync(file,html);fs.writeFileSync('src/tetris/ownership.json',JSON.stringify(names,null,2));fs.writeFileSync('inspection/tetris-definitions.json',JSON.stringify(originals,null,2));
console.log('Extracted '+names.length+' piece/speed entry points.');
