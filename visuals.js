// Рисованные SVG: одинаково отображаются без зависимости от шрифта.
window.itemDrawing = function(id, size=88) {
 const paths={
 compass:`<circle cx="50" cy="54" r="33" fill="#93e479"/><circle cx="48" cy="52" r="31"/><circle cx="48" cy="52" r="24" stroke-dasharray="2 6"/><path d="m59 32-6 25-24 13 11-24z" fill="#ff553e"/><path d="m59 32-19 14 13 11z" fill="#fff9ed"/><path d="M48 20v-8m-5 0h10M18 51h7m47 0h7M48 75v7"/>`,
 lens:`<path d="m59 62 21 22q5 7 11 1t-2-11L67 56" fill="#ffcc5b"/><circle cx="42" cy="40" r="29" fill="#63baff"/><circle cx="40" cy="38" r="28"/><circle cx="40" cy="38" r="20" fill="#eef9ff"/><path d="M27 35q2-11 14-11m18 39 7-7"/>`,
 thermos:`<path d="M29 26q20-6 42 0l-3 57q-19 9-36 0z" fill="#ff94cc"/><path d="M30 26q20-6 40 0l-3 55q-18 8-34 0z"/><path d="M30 23v-9q20-5 40 0v9M31 34q19 7 38 0M35 67q13 5 28 0"/><path d="m43 45 8 9 8-11" stroke="#fff9ed" stroke-width="5"/>`,
 thread:`<path d="M20 31q20-22 49-7 22 13 7 37-16 24-43 8Q8 54 20 31" fill="#ffcc5b"/><path d="M19 29q20-22 49-7 22 13 7 37-16 24-43 8Q7 52 19 29zm8-5q-4 23 28 39M19 37q24-2 49 16M33 19q-5 20 36 31M19 48q20-2 37 19M69 27q-29 8-33 41M78 44q-27 2-37 24M70 66q-1 18 13 15 16-3 7-14"/>`,
 pencil:`<g transform="rotate(32 50 50)"><path d="M39 18h22v57L50 93 39 75z" fill="#ffcc5b"/><path d="M39 18h22v57L50 93 39 75z"/><path d="M39 18v-8q11-8 22 0v8" fill="#ff94cc"/><path d="M39 24h22M46 27v44m8-44v44M39 75h22m-15 12h9"/></g><path d="M15 84q12-9 22 0t22 0" stroke="#63baff"/>`,
 folder:`<path d="M12 27V16h29l10 11h36v54H12z" fill="#ff553e"/><path d="M15 26V15h27l10 11h34v52H15z"/><path d="m14 36 73-4-5 49-69 1z" fill="#ff883e"/><path d="m14 36 73-4-5 49-69 1zM24 47l28-1m-28 8 43-2"/>
 `};
 return `<svg class="drawn-icon" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" stroke="#252622" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||paths.folder}</svg>`;
};
window.GAME_ROLES = [
 {id:'team',title:'Архитектор общего дела',short:'Помогаете ребятам договориться',item:'thread',color:'#93e479',text:'Вы предлагали ребятам самим выбирать задачи и договариваться друг с другом. К концу встречи часть вопросов они уже решали без Вас.',question:'Как поддержать самостоятельность и оставаться рядом?'},
 {id:'start',title:'Режиссёр первого шага',short:'Предлагаете сначала попробовать',item:'pencil',color:'#ff883e',text:'Вы начинали с небольшой пробы: одной станции, короткой встречи или задания для нескольких человек. Так было проще понять, что стоит доработать.',question:'Как понять, что первая проба готова вырасти во что-то большее?'},
 {id:'plan',title:'Мастер плана Б',short:'Знаете, как перестроить встречу',item:'folder',color:'#63baff',text:'Вы учитывали время, помещение и материалы. Если что-то не складывалось, выбирали другой порядок действий и объясняли его участникам.',question:'Что сохранить в плане, а чему позволить измениться?'},
 {id:'listen',title:'Ловец тихих голосов',short:'Замечаете тех, кто пока молчит',item:'lens',color:'#ff94cc',text:'Вы уточняли, что человеку удобно, и давали время подумать. Благодаря этим разговорам удалось услышать тех, кто обычно молчит в общем чате.',question:'Как услышать тех, кому неудобно говорить при всех?'},
 {id:'meaning',title:'Навигатор смысла',short:'Помогаете понять, зачем всё это',item:'compass',color:'#ffcc5b',text:'Вы спрашивали, чего ребята ждут от встречи. Когда предложений становилось слишком много, этот ответ помогал выбрать, что оставить.',question:'Как помочь группе сформулировать свой смысл общего дела?'},
 {id:'care',title:'Хранитель заряда',short:'Замечаете, когда пора остановиться',item:'thermos',color:'#93e479',text:'Вы сокращали лишнюю подготовку, предлагали небольшие задачи и оставляли людям возможность отказаться. Так у участников и у Вас оставались силы на саму встречу.',question:'Как делиться ответственностью, сохраняя интерес к делу?'}
];
// У ролей разное число подходящих действий. Сравниваем долю набранных баллов
// от возможных для каждой роли, а не количество совпавших номеров кнопок.
window.roleForDecisions = function(decisions) {
 const scenes=window.GAME.scenes;
 if(!Array.isArray(decisions)||decisions.length!==scenes.length||!decisions.every((choice,i)=>Number.isInteger(choice)&&!!scenes[i].choices[choice]))return null;
 const ids=window.GAME_ROLES.map(role=>role.id),scores={},maximum={},strong={};
 for(const id of ids){scores[id]=0;maximum[id]=0;strong[id]=0;}
 scenes.forEach((scene,i)=>{
  const selected=scene.choices[decisions[i]].profile||{};
  for(const id of ids){
   const value=selected[id]||0;scores[id]+=value;if(value>=3)strong[id]++;
   maximum[id]+=Math.max(0,...scene.choices.map(choice=>choice.profile?.[id]||0));
  }
 });
 function compare(a,b){
  const ratio=scores[a]*maximum[b]-scores[b]*maximum[a];
  if(ratio)return ratio;
  if(strong[a]!==strong[b])return strong[a]-strong[b];
  // При равном результате учитываем конкретные последние решения.
  for(let i=scenes.length-1;i>=0;i--){const profile=scenes[i].choices[decisions[i]].profile||{};const difference=(profile[a]||0)-(profile[b]||0);if(difference)return difference;}
  return a.localeCompare(b);
 }
 const winner=ids.reduce((best,id)=>compare(id,best)>0?id:best);
 return window.GAME_ROLES.find(role=>role.id===winner);
};
