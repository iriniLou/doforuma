const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('quiz-data.js','utf8'),c);const Q=c.window.QUIZ;
const counts=Object.fromEntries(Q.characters.map(r=>[r.id,0]));let paths=0,affected=0;const needChanges=Object.fromEntries(Q.needs.map(n=>[n,false]));
function walk(a){if(a.length===5){const winners=[];for(const need of Q.needs){const r=c.window.quizResult(a,need);assert(r&&r.id in counts);assert.equal(r.id,c.window.quizResult([...a],need).id);counts[r.id]++;paths++;winners.push(r.id);}if(new Set(winners).size>1){affected++;winners.forEach((id,i)=>{if(winners.some(other=>other!==id))needChanges[Q.needs[i]]=true;});}return;}for(let i=0;i<4;i++)walk([...a,i]);}
walk([]);assert.equal(paths,5120);for(const id in counts){assert(counts[id]/paths>.08);assert(counts[id]/paths<.30);}assert(affected>0);assert(Object.values(needChanges).every(Boolean));
assert.equal(c.window.quizResult([],'Времени и сил'),null);assert.equal(c.window.quizResult([0,0,0,0,9],'Времени и сил'),null);
assert.notEqual(c.window.quizResult([0,0,0,1,0],'Времени и сил').id,c.window.quizResult([0,0,0,1,0],'Участия ребят').id);
console.log('PASS:',paths,'answer/need combinations; all six results; each need can affect outcome; no dominant card; deterministic results; incomplete test rejected.');console.log(counts);
