(() => {
'use strict';
const Q=window.QUIZ,G=Q,KEY='forum-short-quiz-v1',$=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>({screen:'home',answers:[],index:0,need:Q.needs[0]});
const surveyKeys=['need','needAnswered','surveySkipped','preparation','preparationOther','expertQuestion','surveyToken','surveySaved','surveyPreview'];
let state=fresh(),view='home',requestId=0;
try{
 const stored=JSON.parse(localStorage.getItem(KEY));
 if(stored){for(const key of surveyKeys)if(stored[key]!==undefined)state[key]=stored[key];
  if(Array.isArray(stored.answers)&&stored.answers.length<=5&&stored.answers.every((a,i)=>Number.isInteger(a)&&!!Q.questions[i].answers[a])){state.answers=stored.answers;state.index=Math.max(0,Math.min(Number(stored.index)||0,stored.answers.length,4));if(['home','question','result'].includes(stored.screen))state.screen=stored.screen;if(stored.quizNeed===null||Q.needs.includes(stored.quizNeed))state.quizNeed=stored.quizNeed;}
 }else{
  const previous=JSON.parse(localStorage.getItem('vazhnoe-game-v1'));
  if(previous)for(const key of surveyKeys)if(previous[key]!==undefined)state[key]=previous[key];
 }
 if(!Q.needs.includes(state.need))state.need=Q.needs[0];
}catch{}
if(new URLSearchParams(location.search).get('skip-survey')==='1')state.surveySkipped=true;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
const selectedNeed=()=>surveyComplete()||state.needAnswered||state.preparation!==undefined?state.need:null;
const quizNeed=()=>Object.hasOwn(state,'quizNeed')?state.quizNeed:selectedNeed();
const result=()=>window.quizResult(state.answers,quizNeed());
const surveyComplete=()=>!!state.surveySaved||!!(state.surveyPreview&&!window.FORUM_CONFIG?.analyticsEndpoint);
const entryOpen=()=>surveyComplete()||state.surveySkipped===true;
const main=$('#main');let toastTimer;
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4500);}
function route(where,focus=true){if(where!=='survey'&&!entryOpen())where='survey';if(where==='result'&&!result())where='question';view=where;render();if(focus){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}}
function go(where){state.screen=where;save();route(where);}
function bind(id,action){const el=document.getElementById(id);if(el)el.onclick=action;}
function top(){return '<div class="topline"><button type="button" class="text-button" id="back-home">← На главную</button><span>ВМЕСТЕ О ВАЖНОМ · 2026</span></div>';}
function home(){const completed=!!result(),started=state.answers.length>0;return `<section class="home screen"><div class="home-copy"><div class="eyebrow">Перед встречей на форуме</div><h1>Какой Вы<br><em>педагог?</em></h1><p class="lead">С планом на всё? С карманом идей?<br>Или тот самый человек, рядом с которым всем спокойнее?</p><p>Пять вопросов, немного школьной жизни<br>и Ваш персонаж в конце.</p><div class="pills"><span>2–3 минуты</span><span>5 вопросов</span><span>Картинка на память</span></div><div class="actions"><button class="btn coral" id="start">${completed?'Мой результат':started?'Продолжить тест':'Узнать себя'} <span>→</span></button><button class="btn blue housing-link">Узнать, с кем я живу →</button></div>${started?'<button class="text-button" id="again-home">Пройти тест заново →</button>':''}<p class="small-print">Вопросы можно проходить в своём темпе.</p>${!surveyComplete()?'<button type="button" class="text-button" id="return-survey">Ответить на вопросы организаторов →</button>':''}</div><div class="home-art"><div class="art-blob"></div>${window.mascotSvg('calm',410)}<span class="sticker note-one">Сначала чай.<br>Потом великие дела.</span><span class="sticker note-two">Узнаёте<br>себя? ♡</span></div></section><section class="housing-banner"><div><strong>За размещением — сюда</strong><p>Можно сразу найти себя и своих соседей. Тест проходить необязательно.</p></div><button class="btn blue housing-link">Моё размещение →</button></section>`;}
function question(){const i=state.index,item=Q.questions[i];return `<div class="screen question-screen">${top()}<div class="quiz-progress"><span>Вопрос ${i+1} из ${Q.questions.length}</span><span>${Math.round(i/Q.questions.length*100)}%</span><div class="progress-track"><span style="width:${i/Q.questions.length*100}%"></span></div></div><div class="question-head"><span class="question-number">0${i+1}</span><div><h2>${item.title}</h2><p class="question-note">${item.note}</p></div></div><div class="quiz-answers">${item.answers.map((answer,n)=>`<button class="quiz-answer ${state.answers[i]===n?'selected':''}" data-answer="${n}" aria-pressed="${state.answers[i]===n}"><span class="answer-letter">${['А','Б','В','Г'][n]}</span><span>${answer.text}</span><span class="answer-arrow" aria-hidden="true">→</span></button>`).join('')}</div><div class="question-bottom">${i?'<button class="text-button" id="previous">← Предыдущий вопрос</button>':'<span></span>'}<span class="small-print">Выберите то, что ближе Вам сегодня.</span></div></div>`;}
function wrappedSvg(text,x,y,width,size=28,weight=400,color='#252622'){
 const context=document.createElement('canvas').getContext('2d');context.font=`${weight} ${size}px Arial`;const lines=[];let line='';
 for(const word of String(text).split(/\s+/)){if(context.measureText(line+word).width>width&&line){lines.push(line.trim());line='';}if(context.measureText(word).width>width){for(const letter of word){if(context.measureText(line+letter).width>width){lines.push(line);line='';}line+=letter;}line+=' ';}else line+=word+' ';}if(line.trim())lines.push(line.trim());
 return {height:lines.length*size*1.38,svg:lines.map((line,i)=>`<text x="${x}" y="${y+i*size*1.38}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`).join('')};
}
function resultSvg(){
 const r=result();
 const title=wrappedSvg(r.title,65,112,870,57,700),quoteY=112+title.height+14,quote=wrappedSvg(r.line,65,quoteY,870,26);
 const artY=quoteY+quote.height+12,bodyY=artY+485;
 const text=wrappedSvg(r.text,65,bodyY,870,28);const powerY=bodyY+text.height+32,power=wrappedSvg(r.superpower,90,powerY+67,820,27,700);
 const tipY=powerY+power.height+110,tip=wrappedSvg(r.friendlyTip,65,tipY,870,25);
 const height=tipY+tip.height+93;
 return `<svg xmlns="http://www.w3.org/2000/svg" class="result-svg" viewBox="0 0 1000 ${height}" role="img" aria-label="${esc(r.title)} — Ваша карточка"><rect width="1000" height="${height}" rx="30" fill="#fffaf3"/><path d="M0 30Q0 0 30 0h940q30 0 30 30v${artY+400}H0z" fill="${r.color}"/><text x="65" y="49" font-family="Arial" font-size="15" font-weight="700" letter-spacing="2" fill="#252622">КАКОЙ ВЫ ПЕДАГОГ? / ВМЕСТЕ О ВАЖНОМ</text>${title.svg}${quote.svg}<g transform="translate(265 ${artY})">${window.mascotSvg(r.id,470)}</g>${text.svg}<rect x="65" y="${powerY+5}" width="870" height="${power.height+77}" rx="17" fill="${r.color}"/><text x="90" y="${powerY+36}" font-family="Arial" font-size="15" font-weight="700" fill="#252622">ВАША СУПЕРСИЛА</text>${power.svg}${tip.svg}<path d="M65 ${height-57}h870" stroke="#d8d3ca"/><text x="65" y="${height-25}" font-family="Arial" font-size="16" fill="#65665f">12–15 ноября 2026 · Москва</text></svg>`;
}
function resultScreen(){const r=result(),need=quizNeed();return `<section class="screen result-screen">${top()}<div class="eyebrow result-eyebrow">Кажется, мы Вас узнали</div><div class="result-intro"><h2>${r.title}</h2><p>${r.line}</p></div><div class="result-layout"><div class="card-preview" id="card-preview">${resultSvg()}</div><aside class="result-aside"><span class="result-tag">${r.tag}</span><h3>Это Вы?</h3><p>${r.text}</p><div class="result-tip"><strong>На заметку</strong><p>${r.friendlyTip}</p></div>${Q.needs.includes(need)?`<div class="need-note"><strong>Учли Ваш ответ перед тестом</strong><p>${Q.needAdvice[need]}</p></div>`:''}<button class="btn coral" id="download">Сохранить картинку ↓</button><button class="btn blue housing-link">Узнать, с кем я живу →</button><button class="text-button" id="again">Пройти ещё раз →</button><p class="small-print">Можно пройти тест ещё раз. Возможно, завтра Вы ответите иначе.</p></aside></div></section>`;}
async function download(){const button=$('#download');if(button.disabled)return;button.disabled=true;let url;try{await window.ensureMascot(result().id);url=URL.createObjectURL(new Blob([resultSvg()],{type:'image/svg+xml;charset=utf-8'}));const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=Math.round(1400*image.height/image.width);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('export');const output=URL.createObjectURL(blob),link=document.createElement('a');link.href=output;link.download='Какой-Вы-педагог-'+result().id+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(output),5000);toast('Картинка готова. Можно сохранить или отправить коллегам.');}catch{toast('Картинка не сохранилась. Попробуйте ещё раз.');}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}}
function restartQuiz(){state.answers=[];state.index=0;state.quizNeed=selectedNeed();go('question');}
function housing(){const connected=!!window.FORUM_CONFIG?.housingEndpoint;return `<div class="screen">${top(0)}<section class="housing-page"><div class="eyebrow">Вместе о важном · размещение</div><h1>С кем<br>я живу?</h1><p class="lead">Введите фамилию. Если найдётся несколько человек, выберите свои полные ФИО.</p>${!connected?`<div class="notice pending"><strong>Список размещения скоро появится.</strong><br>Здесь Вы сможете узнать, с кем будете жить.</div>`:''}<form id="housing-form"><label class="field"><span>Ваша фамилия</span><input id="surname" name="surname" autocomplete="family-name" placeholder="Например, Иванова" required minlength="2" maxlength="100" ${!connected?'disabled':''}></label><button class="btn" id="housing-search" ${!connected?'disabled':''}>Найти себя <span>→</span></button></form><div id="housing-results" role="status" aria-live="polite"></div><div class="notice">Если Вы заметили ошибку в ФИО, напишите <strong>Зубковой Ирине Сергеевне в MAX</strong>.${window.FORUM_CONFIG?.contactUrl?`<br><a href="${esc(window.FORUM_CONFIG.contactUrl)}" target="_blank" rel="noopener noreferrer">Написать в MAX →</a>`:''}</div><p class="small-print">Москва · гостиница «Измайлово Бета»<br>12 ноября — заезд ориентировочно с 14:00*.<br>15 ноября — выезд до 10:00.</p><p class="small-print arrival-footnote">*Заезд в ночь с 11 на 12 ноября не предусмотрен.</p><button class="text-button" id="return-game">← К тесту и размещению</button></section></div>`;}
function survey(){return `<div class="screen survey-entry"><div class="page-intro"><div class="eyebrow">Вместе о важном · до встречи в Москве</div><h1>Начнём<br>с Вашего опыта</h1><p class="lead">Три коротких вопроса помогут подготовиться к разговору с экспертами. Можно ответить сейчас или сразу перейти к тесту и размещению.</p><a class="btn blue skip-survey" href="?skip-survey=1">Пропустить опрос →</a></div><section class="survey-panel"><form id="survey-form"><label class="field survey-need"><span>Чего Вам сейчас не хватает?</span><select id="need">${G.needs.map(n=>`<option ${n===state.need?'selected':''}>${n}</option>`).join('')}</select></label><fieldset><legend>Вспомните последнее занятие «Разговоры о важном», которое Вы проводили. Как Вы к нему готовились?</legend><p class="survey-hint">Выберите один вариант, который наиболее точно отражает Вашу практику.</p>${window.SURVEY_PREPARATION.map((text,i)=>`<label class="survey-option"><input type="radio" name="preparation" value="${i}" required ${Number(state.preparation)===i&&state.preparation!==undefined?'checked':''}><span>${text}</span></label>`).join('')}<label class="field preparation-other-field" id="preparation-other-field" ${state.preparation===6?'':'hidden'}><span>Ваш вариант подготовки</span><textarea id="preparation-other" maxlength="1500" ${state.preparation===6?'required':'disabled'} placeholder="Расскажите, как Вы готовились к занятию.">${esc(state.preparationOther||'')}</textarea></label></fieldset><label class="field expert-field"><span>Какой вопрос о проведении «Разговоров о важном» Вы хотели бы задать экспертам, но пока не решались?</span><p class="survey-hint">Это может быть сложная ситуация из практики, сомнение, методическая проблема или вопрос, на который Вы до сих пор не получили ответа.</p><textarea id="expert-question" required maxlength="3000" placeholder="Напишите свой вопрос. Если вопроса пока нет, поставьте прочерк." aria-describedby="survey-privacy">${esc(state.expertQuestion||'')}</textarea></label><p class="small-print" id="survey-privacy">Ответы будут анонимно учтены перед тестом. Пожалуйста, не указывайте имена детей и другие личные данные.</p><div id="survey-status" class="survey-status" role="status" aria-live="polite"></div>${!window.FORUM_CONFIG?.analyticsEndpoint?'<p class="preview-notice">Режим просмотра: ответы сохранятся только на этом устройстве.</p>':''}<button class="btn" type="submit" id="survey-submit">Отправить ответы <span>→</span></button><a class="text-button skip-survey" href="?skip-survey=1" style="display:block;margin-top:16px">Пропустить опрос →</a></form></section></div>`;}
function skipSurvey(){readSurvey();state.surveySkipped=true;save();}
function readSurvey(){
 const choice=document.querySelector('input[name="preparation"]:checked');
 if(choice)state.preparation=Number(choice.value);
 const other=$('#preparation-other');if(other){state.preparationOther=other.value;other.required=state.preparation===6;other.disabled=state.preparation!==6;$('#preparation-other-field').hidden=state.preparation!==6;}
 const question=$('#expert-question');if(question)state.expertQuestion=question.value;save();
}
let sendingSurvey=false;
async function beginJourney(){
 const form=$('#survey-form');if(!form||sendingSurvey)return;
 readSurvey();if(!form.reportValidity())return;
 if(!state.expertQuestion.trim()){$('#expert-question').setCustomValidity('Напишите вопрос или поставьте прочерк.');form.reportValidity();return;}
 if(state.preparation===6&&!state.preparationOther?.trim()){$('#preparation-other').setCustomValidity('Расскажите, как Вы готовились к занятию.');form.reportValidity();return;}
 const answers={need:state.need,preparation:state.preparation,...(state.preparation===6?{preparationOther:state.preparationOther.trim()}:{}),question:state.expertQuestion.trim()};
 const fingerprint=JSON.stringify(answers);
 if(state.surveySaved===fingerprint){route('home');return;}
 if(!state.surveyToken)state.surveyToken=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');save();
 const endpoint=window.FORUM_CONFIG?.analyticsEndpoint;
 const showError=error=>{
  if(view!=='survey')return;
  const code=error?.name==='AbortError'?'timeout':error?.message||'connection';
  const messages={
   unavailable:'Сейчас не получается записать ответы в таблицу. Можно пропустить опрос и отправить их позже.',
   survey_busy:'Сейчас поступает много ответов. Можно повторить отправку или пропустить опрос.',
   survey_workbook:'Сервис не может открыть таблицу ответов. Можно пропустить опрос.',
   survey_sheet:'Не удалось открыть лист для ответов. Можно пропустить опрос.',
   survey_sheet_create:'Не удалось подготовить лист для ответов. Можно пропустить опрос.',
   survey_read:'Не удалось прочитать лист ответов. Можно пропустить опрос.',
   survey_write:'Сервис не смог записать ответы. Можно пропустить опрос.',
   survey_flush:'Сервис не подтвердил запись. Можно повторить отправку или пропустить опрос.',
   survey_columns:'Скрипт не может записать ответы: структура листа для анкет отличается от ожидаемой.',
   invalid_request:'Скрипт не принял формат анкеты. Нужно проверить опубликованную версию скрипта.',
   non_json:'Вместо подтверждения записи Google вернул страницу. Нужно проверить доступ к веб-приложению.',
   timeout:'Сервер Google не успел подтвердить запись. Можно повторить отправку — дубль ответа не появится.',
   connection:'Браузер не получил ответ сервера Google. Нужно проверить доступ к веб-приложению.'
  };
  const diagnostic=Object.hasOwn(messages,code)?code:code.startsWith('http_')?code:'connection';
  state.surveyLastError=diagnostic;save();
  const status=$('#survey-status');if(status)status.textContent='Не удалось отправить ответы. '+(messages[diagnostic]||'Сервер вернул ошибку HTTP '+diagnostic.slice(5)+'.')+' Ответы сохранены на этом устройстве. Код: '+diagnostic+'.';
 };
 if(!endpoint){state.surveyPreview=true;save();route('home');toast('Ответы сохранены на устройстве. Открыт режим просмотра.');return;}
 sendingSurvey=true;const button=$('#survey-submit');button.disabled=true;button.textContent='Сохраняем ответы…';$('#survey-status').textContent='Отправляем Ваши ответы перед тестом…';
 form.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);$('#need').disabled=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'survey',...answers,token:state.surveyToken}),credentials:'omit',keepalive:true,signal:controller.signal});
  if(!response.ok)throw Error('http_'+response.status);let result;try{result=JSON.parse(await response.text());}catch{throw Error('non_json');}if(result.ok!==true)throw Error(result.error||'unavailable');
  state.surveySaved=fingerprint;save();if(view==='survey'){route('home');toast('Ответы записаны. Выберите тест или размещение.');}
 }catch(error){showError(error);}
 finally{clearTimeout(timer);sendingSurvey=false;if(view==='survey'){const form=$('#survey-form');form?.querySelectorAll('input,textarea').forEach(el=>el.disabled=false);if($('#preparation-other'))$('#preparation-other').disabled=state.preparation!==6;if($('#need'))$('#need').disabled=false;const button=$('#survey-submit');if(button){button.disabled=false;button.innerHTML='Отправить ещё раз →';}}}
}

async function searchHousing(surname,id){const current=++requestId,box=$('#housing-results'),btn=$('#housing-search');if(!box)return;btn.disabled=true;box.textContent='Проверяем актуальное размещение…';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const url=new URL(window.FORUM_CONFIG.housingEndpoint);url.searchParams.set('surname',surname);if(id)url.searchParams.set('id',id);url.searchParams.set('_',Date.now());const res=await fetch(url,{signal:controller.signal,cache:'no-store',credentials:'omit'});if(!res.ok)throw Error('http_'+res.status);let d;try{d=JSON.parse(await res.text());}catch{throw Error('non_json');}if(current!==requestId||view!=='housing')return;if(d.error)throw Error(String(d.error));if(d.status==='matches'&&Array.isArray(d.matches)){if(!d.matches.length){box.innerHTML='<div class="notice pending">Такой фамилии пока нет в списке. Проверьте написание. Если Вы видите ошибку, напишите Ирине Сергеевне в MAX.</div>';return;}box.innerHTML='<p style="margin-top:24px">Выберите свои ФИО:</p>';for(const person of d.matches){if(typeof person.id!=='string'||typeof person.name!=='string')continue;const b=document.createElement('button');b.type='button';b.className='person';const strong=document.createElement('strong');strong.textContent=person.name;b.append(strong);if(person.detail){const small=document.createElement('small');small.textContent=person.detail;b.append(small);}b.addEventListener('click',()=>searchHousing(surname,person.id));box.append(b);}}else if(d.status==='room'&&d.self&&Array.isArray(d.roommates)){box.innerHTML='';const card=document.createElement('div');card.className='result-card';const heading=document.createElement('h3');heading.textContent='Ваше размещение';card.append(heading);for(const [label,names] of [['Вы',[d.self.name]],['С Вами живут',d.roommates.map(p=>p.name)]]){const p=document.createElement('p');const strong=document.createElement('strong');strong.textContent=label+': ';p.append(strong,document.createTextNode(names.filter(Boolean).join(', ')||(label==='С Вами живут'?'Соседи пока не указаны':'ФИО уточняются')));card.append(p);}const p=document.createElement('p');p.className='small-print';p.textContent='Данные получены из актуальной таблицы. Если список изменится, повторите поиск.';card.append(p);box.append(card);}else throw Error('schema');}catch(e){if(current===requestId&&view==='housing'){
 const messages={unavailable:'Скрипт Google не смог прочитать таблицу расселения.',housing_columns:'Не распознаны столбцы таблицы расселения.',housing_sheet:'Не найдена вкладка с расселением.',housing_source_not_ready:'Данные из исходной таблицы ещё не загрузились.',invalid_query:'Проверьте написание фамилии.',refresh_search:'Размещение обновилось. Повторите поиск.',non_json:'Google вернул страницу вместо данных. Нужно проверить доступ к скрипту.',schema:'Формат ответа сервера не совпал с форматом поиска.',timeout:'Сервер Google не успел ответить.',connection:'Не удалось связаться с сервером Google.'};
 const reason=e.name==='AbortError'?'timeout':String(e.message||'connection');const code=Object.hasOwn(messages,reason)||/^http_\d{3}$/.test(reason)?reason:'connection';
 box.innerHTML='<div class="notice pending"></div>';box.firstElementChild.textContent='Сейчас не удалось получить данные. '+(messages[code]||'Сервер вернул ошибку HTTP '+code.slice(5)+'.')+' Код: '+code+'.';
 }}finally{clearTimeout(timer);if(view==='housing'&&current===requestId){const b=$('#housing-search');if(b)b.disabled=false;}}}
function render(){main.innerHTML=({survey,home,question,result:resultScreen,housing}[view]||home)();$('.header .housing-link').hidden=!entryOpen();$('#restart').hidden=!entryOpen()||state.answers.length===0;
 document.querySelectorAll('.housing-link').forEach(button=>button.onclick=()=>{requestId++;route('housing');});
 document.querySelectorAll('.skip-survey').forEach(button=>button.onclick=skipSurvey);bind('return-survey',()=>route('survey'));
 bind('back-home',()=>route('home'));bind('return-game',()=>route('home'));bind('download',download);bind('again',restartQuiz);bind('again-home',restartQuiz);
 bind('start',()=>{if(result())go('result');else if(state.answers.length){state.index=Math.min(state.answers.length,4);go('question');}else restartQuiz();});
 bind('previous',()=>{state.index=Math.max(0,state.index-1);save();route('question');});
 document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{const i=state.index;state.answers=state.answers.slice(0,i);state.answers[i]=Number(button.dataset.answer);if(i+1===Q.questions.length)go('result');else{state.index=i+1;go('question');}});
 if($('#need'))$('#need').onchange=e=>{state.need=e.target.value;state.needAnswered=true;save();};
 const form=$('#survey-form');if(form){form.onsubmit=e=>{e.preventDefault();beginJourney();};form.oninput=()=>{for(const id of ['expert-question','preparation-other'])document.getElementById(id)?.setCustomValidity('');readSurvey();};}
 const search=$('#housing-form');if(search)search.onsubmit=e=>{e.preventDefault();const surname=$('#surname').value.trim();if(surname.length<2){toast('Введите фамилию целиком.');return;}searchHousing(surname);};
}
$('.brand').onclick=e=>{e.preventDefault();requestId++;route('home');};$('#restart').onclick=restartQuiz;window.addEventListener('pagehide',()=>{requestId++;});save();route('home',false);
})();
