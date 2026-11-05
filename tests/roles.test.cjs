const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('content.js','utf8'),c);vm.runInContext(fs.readFileSync('visuals.js','utf8'),c);
const G=c.window.GAME,roles=c.window.GAME_ROLES,found=new Set();let paths=0;
function visit(items,choices){const n=choices.length;if(n===6){const r=c.window.roleForDecisions(choices);assert(roles.includes(r));assert.equal(r.id,c.window.roleForDecisions(choices).id);found.add(r.id);paths++;return;}
 G.scenes[n].choices.forEach((v,i)=>{if(!v.item||items.includes(v.item))visit(items,[...choices,i]);});}
for(let a=0;a<4;a++)for(let b=a+1;b<5;b++)for(let d=b+1;d<6;d++)visit([G.items[a].id,G.items[b].id,G.items[d].id],[]);
assert.equal(found.size,6,'Every role must be reachable with actual item restrictions');
console.log(`PASS: ${paths} valid journeys; six reachable deterministic roles; all item combinations.`);
