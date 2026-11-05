const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let rows=[['ФИО','Комната','Гостиница','Почта'],['Тестова Анна Первая','101','Бета','never-return@example.test'],['Тестова Анна Вторая','102','Бета','never-return@example.test'],['Соседова Вера Третья','102','Бета','never-return@example.test'],['Другая Вера Четвёртая','102','Гамма','never-return@example.test']];
const context={Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url')},SpreadsheetApp:{openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>rows})})})}};
vm.createContext(context);vm.runInContext(fs.readFileSync('integration/Code.gs','utf8'),context);
let result=context.lookup_({surname:'Тестова'});assert.equal(result.matches.length,2);
let id=result.matches[1].id;result=context.lookup_({surname:'Тестова',id});assert.deepEqual(JSON.parse(JSON.stringify(result.roommates)),[{name:'Соседова Вера Третья'}]);assert(!JSON.stringify(result).includes('@'));
rows[3][0]='Обновлённая Вера Третья';result=context.lookup_({surname:'Тестова',id});assert.equal(result.roommates[0].name,'Обновлённая Вера Третья');
rows.push(['Новая Анна Пятая','102','Бета','hidden@example.test']);assert.equal(context.lookup_({surname:'Тестова',id}).roommates.length,2);
assert.equal(context.lookup_({surname:'Тестова',id:'invalid'}).error,'refresh_search');
assert.equal(context.lookup_({surname:'Неттакой'}).matches.length,0);
assert.equal(context.lookup_({surname:''}).error,'invalid_query');
rows=[['Фамилия','Имя','Отчество','Соседи','Почта'],['Тёстова','Анна','Первая','Соседова Вера\nДругая Анна','hidden@example.test']];
result=context.lookup_({surname:'тестова'});assert.equal(result.matches[0].name,'Тёстова Анна Первая');id=result.matches[0].id;
assert.equal(context.lookup_({surname:'ТЁСТОВА',id}).roommates.length,2);
rows=[['Без заголовков']];assert.throws(()=>context.lookup_({surname:'Тестова'}));
console.log('PASS: exact surname, ё/е, duplicates, separate hotels, fresh edits and appended rows, split names, multiline roommate names, no email leakage, invalid ID and missing schema.');

rows=[['ФИО','Комната'],['#REF!','101']];assert.throws(()=>context.lookup_({surname:'Тестова'}),'Formula errors must not appear as people');

rows=[['ФИО','Комната'],['Тестова Анна','101'],['Соседова Вера','101']];
let source;
context.SpreadsheetApp.openById=id=>{source=id;return {getSheetByName:()=>null,getSheets:()=>[{getDataRange:()=>({getDisplayValues:()=>rows})}]}};
assert.equal(context.lookup_({surname:'Тестова'}).matches.length,1);
assert.equal(source,'1QFGb1Yl0Uf6su9vzRjUUvvm8SjhClIf0AMxZn3De3Hw');
context.SpreadsheetApp.openById=()=>({getSheetByName:()=>null,getSheets:()=>[1,2].map(()=>({getDataRange:()=>({getDisplayValues:()=>rows})}))});
assert.throws(()=>context.lookup_({surname:'Тестова'}),'Ambiguous sheet choice must fail');
console.log('PASS: new spreadsheet ID, renamed sheet discovery, ambiguous-sheet rejection and formula errors.');
// Actual organizer schema: each row holds two people, no separate room number.
rows=[['Фамилия 1','Имя 1','Отчество 1','Регион 1','Фамилия 2','Имя 2','Отчество 2','Регион 2'],
 ['Проверкова','Анна','Ивановна','Регион А','Соседова','Вера','Петровна','Регион Б'],
 ['Проверкова','Елена','Сергеевна','Регион В','Другая','Мария','','Регион Г'],
 ['Одна','Ольга','','Регион А','','','','']];
context.SpreadsheetApp.openById=()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>rows})})});
let matches=context.lookup_({surname:'Проверкова'}).matches;assert.equal(matches.length,2);
let first=context.lookup_({surname:'Проверкова',id:matches[0].id});assert.equal(first.roommates[0].name,'Соседова Вера Петровна');
let second=context.lookup_({surname:'Соседова'}).matches[0];assert.equal(context.lookup_({surname:'Соседова',id:second.id}).roommates[0].name,'Проверкова Анна Ивановна');
let solo=context.lookup_({surname:'Одна'}).matches[0];assert.equal(context.lookup_({surname:'Одна',id:solo.id}).roommates.length,0);
rows[1][4]='Изменённая';assert.equal(context.lookup_({surname:'Проверкова',id:matches[0].id}).roommates[0].name,'Изменённая Вера Петровна');
rows.push(['Новая','Нина','','Регион А','Проверкова','Анна','Ивановна','Регион Б']);
matches=context.lookup_({surname:'Проверкова'}).matches;assert.equal(matches.length,3);assert.equal(matches[0].detail,'Регион А');assert.equal(matches[2].detail,'Регион Б');
rows[0][0]='Фамилия1';rows[0][1]='Имя\u00a01';assert.equal(context.lookup_({surname:'Проверкова'}).matches.length,3);
console.log('PASS: actual paired columns, both surname positions, same-surname selection, solo occupancy, changed rows, appended participants, regions only for exact namesakes.');
