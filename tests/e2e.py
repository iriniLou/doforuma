"""Browser checks: full journey, persistence, responsive layout and live housing API."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
BASE='http://127.0.0.1:8000'
OUT=Path('/tmp/forum-checks');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True,reduced_motion='reduce')
 page=context.new_page();errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(BASE)
 page.route('https://survey.example/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"ok":true}',headers={'Access-Control-Allow-Origin':'*'}))
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('[name=preparation][value="0"]').check();page.fill('#expert-question','Как поддержать инициативу?');page.select_option('#need','Времени и сил');page.locator('#survey-submit').click();page.locator('#start').wait_for()
 page.screenshot(path=str(OUT/'01-desktop.png'),full_page=True)
 page.locator('#start').click()
 assert page.locator('#begin-game').is_disabled()
 for item in ['lens','thread','pencil']:page.locator(f'[data-item="{item}"]').click()
 assert page.locator('.item.selected').count()==3
 page.locator('[data-item="compass"]').click()
 assert page.locator('.item.selected').count()==3
 page.screenshot(path=str(OUT/'02-pack.png'),full_page=True)
 page.locator('#begin-game').click()
 # Lens changes the information budget; a fourth question remains unavailable.
 for n in range(3):page.locator(f'[data-question="{n}"]').click()
 assert page.locator('[data-question="3"]').is_disabled()
 assert page.locator('.answer').count()==3
 page.reload();page.locator('#start').click()
 assert page.locator('.answer').count()==3
 for scene in range(6):
  if scene==2:assert page.locator('[data-choice="3"]').count()==1 # pencil option
  if scene==4:assert page.locator('[data-choice="3"]').count()==1 # thread option
  if scene:page.locator('[data-question="1"]').click()
  page.locator('[data-choice="0"]').click()
  assert page.locator('.result-card').is_visible()
  if scene==1:assert 'личного опроса' in page.locator('main').inner_text()
  page.locator('#reflection-note').fill(f'Мысль из эпизода {scene+1}')
  if scene==2:page.screenshot(path=str(OUT/'03-story.png'),full_page=True)
  page.locator('#next').click()
 assert page.locator('.postcard-preview').is_visible()
 assert page.locator('#custom-question-field').is_hidden()
 page.select_option('#prompt','5');assert page.locator('#custom-question-field').is_visible()
 page.fill('#custom-question','Как дать тихим ребятам время?')
 page.fill('#share','Мастерской с маленькими ролями')
 page.fill('#try','Спросить, прежде чем предлагать')
 with page.expect_download() as info:page.locator('#download').click()
 download=info.value;download.save_as(str(OUT/'postcard.png'))
 assert (OUT/'postcard.png').stat().st_size>10000
 page.screenshot(path=str(OUT/'04-final.png'),full_page=True)
 page.locator('[data-swap="pencil"]').click();page.locator('[data-swap="thermos"]').click()
 assert page.locator('.swap-item.selected').count()==3
 page.reload();page.locator('#start').click()
 assert page.input_value('#custom-question')=='Как дать тихим ребятам время?'
 assert page.input_value('#share')=='Мастерской с маленькими ролями'
 # Unconfigured housing must not invent participants.
 page.locator('.housing-link').first.click()
 assert page.locator('#housing-search').is_disabled()
 assert 'Список размещения скоро появится' in page.locator('main').inner_text()
 # Connected endpoint: only matches, choosing exact name, renewed request, no local PII.
 page.evaluate("window.FORUM_CONFIG.housingEndpoint='https://housing.example/lookup'")
 page.locator('#back-home').click();page.locator('.housing-link').first.click()
 revision=[0];calls=[]
 def api(route):
  from urllib.parse import urlparse,parse_qs
  q=parse_qs(urlparse(route.request.url).query);calls.append(q)
  if 'id' not in q: body={'status':'matches','matches':[{'id':'a','name':'Тестова Анна Первая'},{'id':'b','name':'Тестова Анна Вторая'}]}
  else: body={'status':'room','self':{'name':'Тестова Анна Вторая'},'roommates':[{'name':'Новая Соседка' if revision[0] else 'Первая Соседка'}]}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body,ensure_ascii=False),headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://housing.example/**',api)
 page.fill('#surname','Тестова');page.locator('#housing-search').click()
 page.get_by_role('button',name='Тестова Анна Вторая',exact=True).click()
 page.get_by_text('Первая Соседка',exact=False).wait_for()
 revision[0]=1;page.locator('#housing-search').click()
 page.get_by_role('button',name='Тестова Анна Вторая',exact=True).click()
 page.get_by_text('Новая Соседка',exact=False).wait_for()
 assert 'Тестова' not in page.evaluate('JSON.stringify(localStorage)')
 assert len(calls)==4
 page.unroute('https://housing.example/**')
 page.route('https://housing.example/**',lambda route:route.fulfill(status=503))
 page.locator('#housing-search').click()
 page.get_by_text('Сейчас не удалось получить данные.',exact=False).wait_for()
 assert page.locator('#housing-search').is_enabled()
 # Small phone screens: no horizontal overflow, game and card remain usable.
 phone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
 mobile=phone.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.goto(BASE)
 mobile.screenshot(path=str(OUT/'05-mobile-home.png'),full_page=True)
 def no_overflow():assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),mobile.evaluate('document.documentElement.scrollWidth')
 no_overflow();mobile.locator('[name=preparation][value="5"]').check();mobile.fill('#expert-question','Пока нет вопроса');mobile.locator('#survey-submit').click();mobile.locator('#start').click()
 for item in ['compass','thermos','folder']:mobile.locator(f'[data-item="{item}"]').click()
 no_overflow();mobile.screenshot(path=str(OUT/'06-mobile-pack.png'),full_page=True)
 mobile.locator('#begin-game').click();mobile.locator('.story').wait_for();assert mobile.locator('[data-choice="3"]').count()==1
 no_overflow();mobile.screenshot(path=str(OUT/'07-mobile-story.png'),full_page=True)
 for i in range(6):
  choice=mobile.locator('[data-choice]').last
  choice.click();no_overflow();mobile.locator('#next').click()
 no_overflow();mobile.screenshot(path=str(OUT/'08-mobile-final.png'),full_page=True)
 mobile.set_viewport_size({'width':320,'height':700});no_overflow()
 assert not errors,errors
 print('PASS: desktop and phone; 12 scene decisions, 3-question budget, bonus choices, persistence, PNG export, one-item swap, duplicate surnames, fresh data, unavailable API, no housing data in localStorage, 320px overflow check; no browser exceptions.')
 browser.close()
