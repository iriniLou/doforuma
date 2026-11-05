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
 {id:'team',title:'Архитектор общего дела',short:'Собираете людей, а не только план',item:'thread',color:'#93e479',text:'Вы оставляли людям пространство для собственных ролей и решений. В вашей истории дело постепенно становилось общим.',question:'Как поддержать самостоятельность и оставаться рядом?'},
 {id:'start',title:'Режиссёр первого шага',short:'Превращаете «когда-нибудь» в пробу',item:'pencil',color:'#ff883e',text:'Вы выбирали конкретный шаг, с которого можно начать. Небольшая проба помогала проверить идею в действии.',question:'Как понять, что первая проба готова вырасти во что-то большее?'},
 {id:'plan',title:'Мастер плана Б',short:'Находите маршрут, когда всё меняется',item:'folder',color:'#63baff',text:'Вы искали работающий формат под реальные условия. Когда первоначальный план менялся, у вас появлялся следующий ход.',question:'Что сохранить в плане, а чему позволить измениться?'},
 {id:'listen',title:'Ловец тихих голосов',short:'Замечаете тех, кто пока молчит',item:'lens',color:'#ff94cc',text:'Вы давали людям время и право участвовать по-разному. За первой репликой старались увидеть обстоятельства человека.',question:'Как услышать тех, кому неудобно говорить при всех?'},
 {id:'meaning',title:'Навигатор смысла',short:'Помните, ради чего всё затевалось',item:'compass',color:'#ffcc5b',text:'Вы возвращались к цели и проверяли, помогает ли ей выбранный формат. Это позволяло отделять главное от красивых дополнений.',question:'Как помочь группе сформулировать свой смысл общего дела?'},
 {id:'care',title:'Хранитель заряда',short:'Оставляете силы на продолжение',item:'thermos',color:'#93e479',text:'Вы выбирали посильную нагрузку и замечали границы. В вашей истории забота о силах становилась частью общего плана.',question:'Как делиться ответственностью, сохраняя интерес к делу?'}
];
window.roleForDecisions = function(decisions) {
 const votes={team:0,start:0,plan:0,listen:0,meaning:0,care:0};
 const map=[['listen','start','meaning','plan'],['team','listen','listen'],['team','plan','plan','start'],['plan','team','care'],['team','plan','start','team','care'],['plan','care','team','meaning']];
 decisions.forEach((choice,i)=>{const id=map[i]?.[choice];if(id)votes[id]+=2;});
 const winner=Object.keys(votes).reduce((best,k)=>votes[k]>votes[best]?k:best,'team');
 return window.GAME_ROLES.find(r=>r.id===winner);
};
