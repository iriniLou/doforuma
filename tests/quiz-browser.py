from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json
OUT=Path('/tmp/short-quiz');OUT.mkdir(exist_ok=True)
ENDPOINT='https://script.google.com/macros/s/AKfycbxNGq9SWzwoeUNqfc85fI3fDM_j8yF7TnglrKHhq_aIbCRZWAoMj0KhuL8hKbLFxq8X/exec'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce')
 page=ctx.new_page();errors=[];calls=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def api(route):
  calls.append(route.request)
  if route.request.method=='POST':
   data=json.loads(route.request.post_data);assert set(data)=={'action','token','need','preparation','preparationOther','question'}
   assert data['preparation']==6 and data['question']=='-';body={'ok':True}
  elif 'id=' in route.request.url:body={'status':'room','self':{'name':'Тестовая Анна'},'roommates':[{'name':'Тестовая Вера'}]}
  else:body={'status':'matches','matches':[{'id':'a','name':'Тестовая Анна'},{'id':'b','name':'Тестовая Мария'}]}
  route.fulfill(status=200,body=json.dumps(body),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
 page.route(ENDPOINT+'*',api)
 page.goto('http://127.0.0.1:8000');assert page.locator('#survey-form').is_visible();assert page.locator('.header .housing-link').is_hidden()
 page.select_option('#need','Времени и сил');page.locator('[name=preparation][value="6"]').check();page.fill('#preparation-other','Обсудила тему с ребятами');page.fill('#expert-question','-');page.locator('#survey-submit').click();page.locator('#start').wait_for()
 assert len(calls)==1
 assert 'чемодан' not in page.locator('main').inner_text().lower()
 assert 'Без оценок, честно' not in page.locator('main').inner_text()
 page.screenshot(path=str(OUT/'01-home.png'),full_page=True)
 page.locator('.housing-link').first.click();page.fill('#surname','Тестовая');page.locator('#housing-search').click();page.get_by_role('button',name='Тестовая Анна').click();page.get_by_text('Тестовая Вера',exact=False).wait_for()
 page.locator('#return-game').click();page.locator('#start').click()
 for i,answer in enumerate([0,0,0,1,0]):
  if i==2:
   page.reload();page.locator('#start').click();assert 'Вопрос 3 из 5' in page.locator('main').inner_text()
  if i==3:page.screenshot(path=str(OUT/'02-question.png'),full_page=True)
  page.locator(f'[data-answer="{answer}"]').click()
 assert 'Педагог-подзарядка' in page.locator('.result-intro').inner_text()
 card_text=page.locator('.result-svg').text_content()
 for removed in ['С ЧЕМ ЕДЕМ НА ФОРУМ','В первом опросе','Времени и сил','Шуточный тест','irinilou.github.io']:
  assert removed not in card_text,removed
 with page.expect_download() as d:page.locator('#download').click()
 d.value.save_as(str(OUT/'03-card.png'));assert (OUT/'03-card.png').stat().st_size>20000
 page.screenshot(path=str(OUT/'04-result.png'),full_page=True)
 page.locator('#again').click();assert 'Вопрос 1 из 5' in page.locator('main').inner_text()
 for answer in [0,0,2,1,3]:page.locator(f'[data-answer="{answer}"]').click()
 assert 'Педагог-навигатор' in page.locator('.result-intro').inner_text()
 assert len([c for c in calls if c.method=='POST'])==1
 # Migration copies only questionnaire fields and leaves the full old save intact.
 legacy={'screen':'final','items':['lens','folder','thermos'],'need':'Свежего подхода','decisions':[1,1,1,1,1,1],'surveySaved':'already-saved','surveyToken':'old-token','preparation':5,'expertQuestion':'-'}
 migration=b.new_context(viewport={'width':390,'height':844},is_mobile=True,reduced_motion='reduce',accept_downloads=True)
 migration.add_init_script("if(!localStorage.getItem('vazhnoe-game-v1'))localStorage.setItem('vazhnoe-game-v1',"+json.dumps(json.dumps(legacy))+')')
 mobile=migration.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.goto('http://127.0.0.1:8000');assert mobile.locator('#survey-form').count()==0
 assert mobile.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).decisions.length")==6
 assert mobile.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1')).answers.length")==0
 mobile.screenshot(path=str(OUT/'05-phone-home.png'),full_page=True);mobile.locator('#start').click()
 for answer in [0,0,0,3,0]:
  assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
  mobile.locator(f'[data-answer="{answer}"]').click()
 assert 'Педагог-искра' in mobile.locator('.result-intro').inner_text()
 mobile.screenshot(path=str(OUT/'06-phone-result.png'),full_page=True)
 mobile.set_viewport_size({'width':320,'height':700});assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Old published assets and pages are removed, not just hidden by a menu switch.
 for path in ['app.js','content.js','visuals.js','style.css','dist/Важное-с-собой.html']:
  assert page.request.get('http://127.0.0.1:8000/'+path).status==404,path
 assert not errors,errors
 print('PASS: preserved survey and housing; five-question journey; clean card text; illustrated PNG export; two runs with different cards; no duplicate survey; safe legacy migration; phone/320px layout; old game URLs return 404.')
 b.close()
