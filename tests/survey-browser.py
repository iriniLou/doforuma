from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':960},reduced_motion='reduce');page.goto('http://127.0.0.1:8000')
 assert page.locator('#survey-form').is_visible()
 assert page.locator('.header .housing-link').is_hidden()
 assert page.locator('[data-item]').count()==0
 page.locator('.brand').click();assert page.locator('#survey-form').is_visible()
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 calls=[];good=[False]
 def api(route):
  payload=json.loads(route.request.post_data);calls.append(payload)
  route.fulfill(status=200,body=json.dumps({'ok':True} if good[0] else {'error':'unavailable'}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://survey.example/**',api)
 page.locator('#survey-submit').click();assert not calls
 page.locator('[name=preparation][value="4"]').check();page.fill('#expert-question','Как сохранить самостоятельность ребят?');page.select_option('#need','Участия ребят')
 page.screenshot(path='/tmp/survey-first-desktop.png',full_page=True)
 page.locator('#survey-submit').click();page.get_by_text('Не удалось отправить ответы.',exact=False).wait_for()
 assert page.locator('#start').count()==0 and page.locator('.header .housing-link').is_hidden()
 assert page.locator('#survey-submit').is_enabled()
 assert set(calls[0])=={'action','token','need','preparation','question'}
 page.reload();assert page.locator('[name=preparation][value="4"]').is_checked()
 assert page.input_value('#expert-question')=='Как сохранить самостоятельность ребят?'
 good[0]=True;page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('#survey-submit').click();page.locator('#start').wait_for()
 assert page.locator('.header .housing-link').is_visible()
 assert calls[0]['token']==calls[1]['token'] and len(calls)==2
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
 assert page.locator('[data-item]').count()==0
 page.screenshot(path='/tmp/after-survey-menu.png',full_page=True)
 page.locator('.housing-link').first.click();assert page.locator('#housing-form').is_visible()
 page.locator('#back-home').click();page.locator('#start').click()
 assert page.locator('#begin-game').is_disabled()
 assert page.locator('#survey-form').count()==0
 for item in ['lens','thread','pencil']:page.locator(f'[data-item="{item}"]').click()
 page.locator('#begin-game').click();page.locator('.story').wait_for();assert len(calls)==2
 # Preview works immediately after answers, without pretending to write remotely.
 phone=b.new_context(viewport={'width':390,'height':844},is_mobile=True,reduced_motion='reduce').new_page()
 phone.goto('http://127.0.0.1:8000');assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth')
 phone.screenshot(path='/tmp/survey-first-phone.png',full_page=True)
 phone.locator('[name=preparation][value="5"]').check();phone.fill('#expert-question','Пока нет вопроса');phone.locator('#survey-submit').click();phone.locator('#start').wait_for()
 assert not phone.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
 assert phone.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveyPreview")
 phone.reload();phone.locator('#start').wait_for()
 # Connecting a real endpoint requires actual acknowledgement even after preview.
 phone.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'");phone.locator('.brand').click()
 assert phone.locator('#survey-form').is_visible() and phone.locator('.header .housing-link').is_hidden()
 # Old game progress survives the new questionnaire gate.
 page.evaluate("""localStorage.setItem('vazhnoe-game-v1',JSON.stringify({screen:'scene',items:['compass','lens','folder'],need:'Времени и сил',scene:2,asked:{},decisions:[0,1],notes:{},postcard:{},swapped:false}))""")
 page.reload();assert page.locator('#survey-form').is_visible()
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('[name=preparation][value="1"]').check();page.fill('#expert-question','Пока нет вопроса');page.locator('#survey-submit').click();page.locator('#start').click();page.locator('.story').wait_for()
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).scene")==2
 print('PASS: survey first; housing and suitcase gated; required answers; ACK and retry; menu before game; preview without server; preview cannot replace live ACK; existing progress preserved.')
 b.close()
