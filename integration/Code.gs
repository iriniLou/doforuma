/**
 * Сервер поиска размещения. Разворачивается как Google Apps Script Web app.
 * Таблица остаётся закрытой: клиент получает только совпадения фамилии и соседей.
 * Почты, телефоны и остальные столбцы никогда не возвращаются.
 */
const HOUSING = {
  spreadsheetId: '1QFGb1Yl0Uf6su9vzRjUUvvm8SjhClIf0AMxZn3De3Hw',
  sheetName: 'Расселение',
  // Если заголовок нестандартный, впишите точное название в нужное поле.
  columns: { name: '', surname: '', firstName: '', patronymic: '', room: '', building: '', roommate: '', id: '', detail: '' }
};
function doGet(e) {
  try { return json_(lookup_(e && e.parameter || {})); }
  catch (error) {const code={columns:'housing_columns',sheet:'housing_sheet',sheet_not_ready:'housing_source_not_ready'}[error.message]||'unavailable';return json_({error:code});}
}
function json_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
function norm_(s) { return String(s || '').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim(); }
function clean_(s) { return String(s || '').replace(/\s+/g,' ').trim(); }
function column_(headers, key, aliases) {
  const exact = HOUSING.columns[key];
  const headerKey=s=>norm_(s).replace(/ /g,'');
  if (exact) return headers.findIndex(h => headerKey(h) === headerKey(exact));
  return headers.findIndex(h => aliases.some(a => headerKey(h) === headerKey(a)));
}
function parseRows_(values) {
  if (!values.length) throw Error('empty');
  const paired=parsePairedRows_(values);
  if(paired!==null)return paired;
  // Допускаются заголовки в первых десяти строках, например после названия листа.
  let headerRow = -1, map;
  for (let row=0; row<Math.min(10,values.length); row++) {
    const h=values[row];
    const m={
      name: column_(h,'name',['ФИО','Ф.И.О.','ФИО участника','ФИО участника форума','Участник','Фамилия имя отчество']),
      surname: column_(h,'surname',['Фамилия']),
      firstName: column_(h,'firstName',['Имя']),
      patronymic: column_(h,'patronymic',['Отчество','Отчество (при наличии)']),
      room: column_(h,'room',['Номер','Номер комнаты','Комната','Номер номера','№ номера','Группа расселения','ID комнаты','room_id','room']),
      building: column_(h,'building',['Корпус','Гостиница','Отель']),
      roommate: column_(h,'roommate',['Сосед','Соседка','Соседи','ФИО соседа','ФИО соседки','С кем живёт','С кем живет']),
      id: column_(h,'id',['ID','ID участника','participant_id']),
      detail: HOUSING.columns.detail ? column_(h,'detail',[]) : -1
    };
    if ((m.name>=0 || (m.surname>=0&&m.firstName>=0)) && (m.room>=0||m.roommate>=0)) { headerRow=row;map=m;break; }
  }
  if(headerRow<0)throw Error('columns');
  const cell=housingCell_;
  return values.slice(headerRow+1).map((r,index)=>{
    const name=cell(r,map.name)||[cell(r,map.surname),cell(r,map.firstName),cell(r,map.patronymic)].filter(Boolean).join(' ');
    const surname=cell(r,map.surname)||name.split(' ')[0];
    const room=cell(r,map.room),building=cell(r,map.building),sourceId=cell(r,map.id);
    // Токен привязан к ФИО и строке; изменённые строки при следующем поиске читаются заново.
    const id=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,[sourceId,name,index].join('|'))).slice(0,24);
    return {id,name,surname,group:room?norm_(building)+'|'+norm_(room):'',roommate:map.roommate>=0?String(r[map.roommate]||'').trim():'',detail:cell(r,map.detail)};
  }).filter(p=>p.name&&p.surname);
}
function housingCell_(row,index) {
  const value=index>=0?clean_(row[index]):'';
  if(/^#(REF!|N\/A|ERROR!|VALUE!|DIV\/0!|NAME\?|NUM!|SPILL!|LOADING)/i.test(value))throw Error('sheet_not_ready');
  return value;
}
function parsePairedRows_(values) {
  for(let header=0;header<Math.min(10,values.length);header++) {
    const h=values[header],sides=[1,2].map(n=>({
      surname:column_(h,'surname'+n,['Фамилия '+n,'Фамилия участника '+n]),
      firstName:column_(h,'firstName'+n,['Имя '+n,'Имя участника '+n]),
      patronymic:column_(h,'patronymic'+n,['Отчество '+n,'Отчество участника '+n]),
      region:column_(h,'region'+n,['Регион '+n,'Регион участника '+n])
    }));
    if(!sides.every(side=>side.surname>=0&&side.firstName>=0))continue;
    const people=[];
    values.slice(header+1).forEach((row,index)=>sides.forEach((side,position)=>{
      const surname=housingCell_(row,side.surname),firstName=housingCell_(row,side.firstName);
      if(!surname||!firstName)return;
      const name=[surname,firstName,housingCell_(row,side.patronymic)].filter(Boolean).join(' ');
      const id=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,[name,index,position].join('|'))).slice(0,24);
      // Одна строка = одна пара. Номера гостиничных комнат для этого формата не нужны.
      people.push({id,name,surname,group:'pair:'+index,roommate:'',detail:'',region:housingCell_(row,side.region)});
    }));
    // Регион выводится только для полных тёзок, которым одного ФИО недостаточно для выбора.
    const counts={};people.forEach(person=>{const key=norm_(person.name);counts[key]=(counts[key]||0)+1;});
    people.forEach(person=>{if(counts[norm_(person.name)]>1)person.detail=person.region;});
    return people;
  }
  return null;
}
function lookup_(params) {
  const surname=norm_(params.surname);
  if(surname.length<2||surname.length>100)return {error:'invalid_query'};
  const book=SpreadsheetApp.openById(HOUSING.spreadsheetId);
  const sheet=book.getSheetByName(HOUSING.sheetName);
  // Без постоянного кэша: изменения строк и новые участники доступны на следующем запросе.
  // Если в новой книге лист переименован, выбираем единственный лист с подходящими столбцами.
  let rows;
  if(sheet)rows=parseRows_(sheet.getDataRange().getDisplayValues());
  else {
    const candidates=[];
    for(const candidate of book.getSheets()){try{candidates.push(parseRows_(candidate.getDataRange().getDisplayValues()));}catch(_){}}
    if(candidates.length!==1)throw Error('sheet');
    rows=candidates[0];
  }
  const matches=rows.filter(p=>norm_(p.surname)===surname);
  if(!params.id)return {status:'matches',matches:matches.map(p=>({id:p.id,name:p.name,...(p.detail?{detail:p.detail}:{})}))};
  const self=matches.find(p=>p.id===params.id);
  if(!self)return {error:'refresh_search'};
  let roommates=[];
  if(self.group) roommates=rows.filter(p=>p.group===self.group&&p.id!==self.id).map(p=>({name:p.name}));
  else if(self.roommate)roommates=self.roommate.split(/[;\n]+/).map(clean_).filter(Boolean).filter(n=>norm_(n)!==norm_(self.name)).map(name=>({name}));
  return {status:'room',self:{name:self.name},roommates,updatedAt:new Date().toISOString()};
}

/** Анонимные счётчики: только категория и число ответов, без отдельных строк людей. */
// Статистика остаётся в исходной таблице, не изменяя синхронизируемый лист расселения.
const STATISTICS_SPREADSHEET_ID = '1ibR7COnJ6_TAQ7hgpH35j5f2dwG3OaFHUBfTJ6LY5a0';
const NEED_CATEGORIES = ['Свежего подхода','Времени и сил','Участия ребят','Уверенности в разговорах','Поддержки коллег'];
function doPost(e) {
  let lock;
  try {
    const raw=e&&e.postData&&e.postData.contents||'';
    if(raw.length>20000)return json_({error:'invalid_request'});
    const data=JSON.parse(raw);
    if(data.action==='survey')return recordSurvey_(data);
    if(data.action!=='need'||!NEED_CATEGORIES.includes(data.need)||!/^[-a-zA-Z0-9]{20,64}$/.test(data.token||''))return json_({error:'invalid_request'});
    lock=LockService.getScriptLock();lock.waitLock(10000);
    const cache=CacheService.getScriptCache(),key='need-v1-'+data.token;
    if(cache.get(key))return json_({ok:true});
    const book=SpreadsheetApp.openById(STATISTICS_SPREADSHEET_ID);
    let sheet=book.getSheetByName('Статистика игры');
    if(!sheet){sheet=book.insertSheet('Статистика игры');sheet.getRange(1,1,6,2).setValues([['Запрос','Количество ответов'],...NEED_CATEGORIES.map(n=>[n,0])]);}
    const values=sheet.getDataRange().getValues();
    let index=values.findIndex(row=>row[0]===data.need);
    if(index<0){sheet.appendRow([data.need,1]);}else{sheet.getRange(index+1,2).setValue((Number(values[index][1])||0)+1);}
    cache.put(key,'counted',21600);
    return json_({ok:true});
  } catch (_) { return json_({error:'unavailable'}); }
  finally {if(lock)lock.releaseLock();}
}


const PREPARATION_OPTIONS = [
 'Заранее изучил(а) материалы, адаптировал(а) сценарий под особенности и интересы своего класса.',
 'Заранее ознакомился(лась) со сценарием и провёл(а) занятие практически без изменений.',
 'Просмотрел(а) материалы в день проведения занятия и выбрал(а) необходимое.',
 'Ознакомился(лась) с материалами непосредственно перед началом занятия или уже в процессе его проведения.',
 'Подготовил(а) собственный вариант занятия, практически не используя предложенный сценарий.',
 'В настоящее время лично не провожу занятия «Разговоры о важном».',
 'Свой вариант'
];
const SURVEY_HEADERS = ['Код ответа','Чего не хватает','Подготовка к занятию','Вопрос экспертам'];
function recordSurvey_(data) {
  if(!NEED_CATEGORIES.includes(data.need)||!Number.isInteger(data.preparation)||data.preparation<0||data.preparation>=PREPARATION_OPTIONS.length||typeof data.question!=='string'||!data.question.trim()||data.question.length>3000||!/^[-a-zA-Z0-9]{20,64}$/.test(data.token||''))return json_({error:'invalid_request'});
  if(data.preparation===6&&(typeof data.preparationOther!=='string'||!data.preparationOther.trim()||data.preparationOther.length>1500))return json_({error:'invalid_request'});
  let lock,held=false,stage='survey_busy';
  try {
    lock=LockService.getScriptLock();lock.waitLock(10000);held=true;
    stage='survey_workbook';
    const book=SpreadsheetApp.openById(STATISTICS_SPREADSHEET_ID);
    stage='survey_sheet';
    let sheet=book.getSheetByName('Ответы перед форумом');
    if(!sheet){stage='survey_sheet_create';sheet=book.insertSheet('Ответы перед форумом');}
    stage='survey_read';
    let rows=sheet.getDataRange().getValues();
    // Инициализируем только полностью пустой лист; существующие заголовки не переписываем.
    if(rows.every(row=>row.every(value=>value===''||value===null))){
      stage='survey_write';sheet.getRange(1,1,1,4).setValues([SURVEY_HEADERS]);rows=[SURVEY_HEADERS];
    }
    // Существующие названия столбцов не меняем. Несовпадение — ошибка, а не перезапись.
    if(!rows[0]||!SURVEY_HEADERS.every((name,i)=>rows[0][i]===name))return json_({error:'survey_columns'});
    const question=data.question.trim();
    const safeQuestion=/^\s*[=+@-]/.test(question)?"'"+question:question;
    const preparation=data.preparation===6?'Свой вариант: '+data.preparationOther.trim():PREPARATION_OPTIONS[data.preparation];
    const row=[data.token,data.need,preparation,safeQuestion];
    const index=rows.findIndex((r,i)=>i>0&&String(r[0])===data.token);
    stage='survey_write';
    if(index>0)sheet.getRange(index+1,1,1,4).setValues([row]);
    else sheet.appendRow(row);
    stage='survey_flush';SpreadsheetApp.flush();
    return json_({ok:true});
  } catch (error) {
    // Подробности Google видны только владельцу проекта в журнале, без тела анкеты.
    console.error('Survey failure at '+stage+': '+String(error && error.message || error));
    return json_({error:stage});
  }
  finally {if(held)lock.releaseLock();}
}

/** Запустите вручную из редактора Apps Script, чтобы проверить доступ и подготовить пустой лист.
 * Анкеты и тестовые ответы не добавляются; существующие заголовки и строки не меняются.
 */
function prepareSurvey() {
  const book=SpreadsheetApp.openById(STATISTICS_SPREADSHEET_ID);
  let sheet=book.getSheetByName('Ответы перед форумом');
  if(!sheet)sheet=book.insertSheet('Ответы перед форумом');
  const rows=sheet.getDataRange().getValues();
  if(rows.every(row=>row.every(value=>value===''||value===null))) {
    sheet.getRange(1,1,1,4).setValues([SURVEY_HEADERS]);SpreadsheetApp.flush();
  } else if(!rows[0]||!SURVEY_HEADERS.every((name,i)=>rows[0][i]===name)) {
    throw Error('В листе «Ответы перед форумом» другие заголовки. Они не изменены. Проверьте выбранную таблицу.');
  }
  if(!sheet.getRange(2,1,1,4).canEdit()) {
    throw Error('У аккаунта, выполняющего скрипт, нет права записи в A2:D2 листа «Ответы перед форумом». Проверьте права редактора и защиту листа.');
  }
  console.log('Проверка завершена: таблица открывается, заголовки верны, A2:D2 доступны для записи. Тестовые анкеты не добавлены. Опубликуйте новую версию существующего веб-приложения с выполнением от Вашего имени и доступом «Все».');
}
