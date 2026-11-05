// Generated gouache illustrations; each role loads only its own local image.
window.MASCOT_ASSETS = {
 spark:"assets/mascots/spark.png",
 guide:"assets/mascots/guide.png",
 calm:"assets/mascots/calm.png",
 inventor:"assets/mascots/inventor.png",
 connector:"assets/mascots/connector.png",
 care:"assets/mascots/care.png"
};
(() => {
 const embedded={},pending={};
 window.ensureMascot = async function(id){
  if(!window.MASCOT_ASSETS[id])id='calm';
  const src=window.MASCOT_ASSETS[id];
  if(src.startsWith('data:'))return src;
  if(embedded[id])return embedded[id];
  if(!pending[id])pending[id]=(async()=>{
   const response=await fetch(src);if(!response.ok)throw Error('illustration');
   const blob=await response.blob();
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
   embedded[id]=data;return data;
  })().finally(()=>{delete pending[id];});
  return pending[id];
 };
 window.mascotSvg = function(id,size=340){
  if(!window.MASCOT_ASSETS[id])id='calm';
  const src=embedded[id]||window.MASCOT_ASSETS[id];
  const animal=window.QUIZ.characters.find(c=>c.id===id)?.animal||'педагог';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mascot" width="${size}" height="${size}" viewBox="0 0 600 600" role="img" aria-label="Нарисованный персонаж: ${animal}"><image href="${src}" x="12" y="12" width="576" height="576" preserveAspectRatio="xMidYMid meet"/></svg>`;
 };
})();
