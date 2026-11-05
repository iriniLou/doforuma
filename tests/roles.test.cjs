const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{}};vm.createContext(c);['content.js','visuals.js'].forEach(file=>vm.runInContext(fs.readFileSync(file,'utf8'),c));
const G=c.window.GAME,roles=c.window.GAME_ROLES,counts=Object.fromEntries(roles.map(r=>[r.id,0]));let paths=0;
for(const scene of G.scenes)for(const choice of scene.choices){assert(choice.profile);for(const [id,weight]of Object.entries(choice.profile)){assert(id in counts);assert(Number.isInteger(weight)&&weight>0);}}
function visit(items,decisions){if(decisions.length===6){const r=c.window.roleForDecisions(decisions);assert(roles.includes(r));assert.equal(r.id,c.window.roleForDecisions([...decisions]).id);counts[r.id]++;paths++;return;}
 G.scenes[decisions.length].choices.forEach((choice,i)=>{if(!choice.item||items.includes(choice.item))visit(items,[...decisions,i]);});}
for(let a=0;a<4;a++)for(let b=a+1;b<5;b++)for(let d=b+1;d<6;d++)visit([G.items[a].id,G.items[b].id,G.items[d].id],[]);
// These are uniform valid-choice paths, not a prediction of participant personalities.
// A broad sanity bound catches the old 83% dominance by two roles.
for(const id in counts){assert(counts[id]/paths>.05,`${id} is nearly unreachable`);assert(counts[id]/paths<.30,`${id} dominates valid paths`);}
const examples={team:[0,0,0,0,0,0],plan:[0,0,0,0,1,0],meaning:[0,0,0,0,1,1],start:[0,0,0,0,2,0],care:[0,0,0,0,2,1],listen:[0,1,0,0,1,2]};
for(const [id,path] of Object.entries(examples))assert.equal(c.window.roleForDecisions(path).id,id);
assert.equal(c.window.roleForDecisions([]),null);assert.equal(c.window.roleForDecisions([0,0]),null);assert.equal(c.window.roleForDecisions([0,0,0,0,0,99]),null);
// Profile metadata follows the action when button order changes.
const path=[0,0,0,0,2,1],before=c.window.roleForDecisions(path).id;[G.scenes[0].choices[0],G.scenes[0].choices[1]]=[G.scenes[0].choices[1],G.scenes[0].choices[0]];assert.equal(c.window.roleForDecisions([1,...path.slice(1)]).id,before);
console.log('PASS:',paths,'valid journeys; all six distinct examples; normalized balance; deterministic ties; incomplete paths rejected; roles follow actions, not button positions.');console.log(counts);
