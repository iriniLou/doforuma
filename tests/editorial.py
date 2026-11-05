from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re
OUT=Path('/tmp/forum-editorial');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':960},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000');calls=[]
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.route('https://survey.example/**',lambda r:(calls.append(json.loads(r.request.post_data)),r.fulfill(status=200,body='{"ok":true}',content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})))
 assert 'подготовиться к разговору с экспертами' in page.locator('main').inner_text()
 assert page.locator('input[name=preparation]').count()==7
 page.locator('[name=preparation][value="6"]').check();assert page.locator('#preparation-other').is_visible()
 page.fill('#expert-question','-');page.locator('#survey-submit').click();assert len(calls)==0
 text='Сначала спросила ребят, что им интересно, затем выбрала материалы.'
 page.fill('#preparation-other',text)
 page.screenshot(path=str(OUT/'survey-custom.png'),full_page=True)
 page.reload();assert page.input_value('#preparation-other')==text
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('[name=preparation][value="0"]').check();assert page.locator('#preparation-other-field').is_hidden();assert page.locator('#preparation-other').is_disabled()
 page.locator('[name=preparation][value="6"]').check();assert page.input_value('#preparation-other')==text
 page.locator('#survey-submit').click();page.locator('#start').wait_for()
 assert calls[0]['preparation']==6 and calls[0]['preparationOther']==text and calls[0]['question']=='-'
 assert page.locator('.header .housing-link').evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(99, 186, 255)'
 assert page.locator('.housing-main-button').is_visible()
 page.screenshot(path=str(OUT/'housing-button.png'),full_page=True)
 page.locator('#start').click()
 assert 'Выбирать из них подходящие.' in page.locator('[data-item="folder"]').inner_text()
 for item in ['compass','pencil','folder']:page.locator(f'[data-item="{item}"]').click()
 page.locator('#begin-game').click();assert 'Ребята, кто какое умение готов показать?' in page.locator('main').inner_text()
 # Static copy formalizes reader address, not participant-entered text.
 for name in ['app.js','content.js','visuals.js','index.html']:
  assert not re.search(r'\b(?:вы|вас|вам|вами|ваш|ваша|ваше|ваши|вашего|вашей|ваших|вашему|вашим|вашу|вашем|вашими)\b',Path(name).read_text()),name
 mobile=b.new_context(viewport={'width':320,'height':700},is_mobile=True,reduced_motion='reduce').new_page()
 mobile.add_init_script("localStorage.setItem('vazhnoe-game-v1',JSON.stringify({screen:'home',items:[],need:'Времени и сил',scene:0,decisions:[],surveySaved:'test',asked:{},notes:{},postcard:{}}))")
 mobile.goto('http://127.0.0.1:8000');assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
 mobile.screenshot(path=str(OUT/'phone-housing-button.png'),full_page=True)
 assert not errors,errors
 print('PASS: custom answer required, draft restored, option switching, exact free text and dash payload, formal static address, softened question, visible housing buttons, 320px layout.')
 b.close()
