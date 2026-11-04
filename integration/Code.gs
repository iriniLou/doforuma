/**
 * Сервер поиска размещения. Разворачивается как Google Apps Script Web app.
 * Таблица остаётся закрытой: клиент получает только совпадения фамилии и соседей.
 * Почты, телефоны и остальные столбцы никогда не возвращаются.
 */
const HOUSING = {
  spreadsheetId: '1ibR7COnJ6_TAQ7hgpH35j5f2dwG3OaFHUBfTJ6LY5a0',
  sheetName: 'Расселение',
  // Если заголовок нестандартный, впишите точное название в нужное поле.
  columns: { name: '', surname: '', firstName: '', patronymic: '', room: '', building: '', roommate: '', id: '', detail: '' }
};
function doGet(e) {
  try { return json_(lookup_(e && e.parameter || {})); }
  catch (_) { return json_({ error: 'unavailable' }); }
}
function json_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
function norm_(s) { return String(s || '').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim(); }
function clean_(s) { return String(s || '').replace(/\s+/g,' ').trim(); }
function column_(headers, key, aliases) {
  const exact = HOUSING.columns[key];
  if (exact) return headers.findIndex(h => norm_(h) === norm_(exact));
  return headers.findIndex(h => aliases.some(a => norm_(h) === norm_(a)));
}
function parseRows_(values) {
  if (!values.length) throw Error('empty');
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
  const cell=(row,i)=>i>=0?clean_(row[i]):'';
  return values.slice(headerRow+1).map((r,index)=>{
    const name=cell(r,map.name)||[cell(r,map.surname),cell(r,map.firstName),cell(r,map.patronymic)].filter(Boolean).join(' ');
    const surname=cell(r,map.surname)||name.split(' ')[0];
    const room=cell(r,map.room),building=cell(r,map.building),sourceId=cell(r,map.id);
    // Токен привязан к ФИО и строке; изменённые строки при следующем поиске читаются заново.
    const id=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,[sourceId,name,index].join('|'))).slice(0,24);
    return {id,name,surname,group:room?norm_(building)+'|'+norm_(room):'',roommate:map.roommate>=0?String(r[map.roommate]||'').trim():'',detail:cell(r,map.detail)};
  }).filter(p=>p.name&&p.surname);
}
function lookup_(params) {
  const surname=norm_(params.surname);
  if(surname.length<2||surname.length>100)return {error:'invalid_query'};
  const sheet=SpreadsheetApp.openById(HOUSING.spreadsheetId).getSheetByName(HOUSING.sheetName);
  if(!sheet)throw Error('sheet');
  // Без постоянного кэша: изменения строк и новые участники доступны на следующем запросе.
  const rows=parseRows_(sheet.getDataRange().getDisplayValues());
  const matches=rows.filter(p=>norm_(p.surname)===surname);
  if(!params.id)return {status:'matches',matches:matches.map(p=>({id:p.id,name:p.name,...(p.detail?{detail:p.detail}:{})}))};
  const self=matches.find(p=>p.id===params.id);
  if(!self)return {error:'refresh_search'};
  let roommates=[];
  if(self.group) roommates=rows.filter(p=>p.group===self.group&&p.id!==self.id).map(p=>({name:p.name}));
  else if(self.roommate)roommates=self.roommate.split(/[;\n]+/).map(clean_).filter(Boolean).filter(n=>norm_(n)!==norm_(self.name)).map(name=>({name}));
  return {status:'room',self:{name:self.name},roommates,updatedAt:new Date().toISOString()};
}
