from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':960},reduced_motion='reduce');page.goto('http://127.0.0.1:8000');page.locator('#start').click()
 for item in ['compass','lens','folder']:page.locator(f'[data-item="{item}"]').click()
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 calls=[];good=[False]
 def api(route):
  payload=json.loads(route.request.post_data);calls.append(payload)
  route.fulfill(status=200,body=json.dumps({'ok':True} if good[0] else {'error':'unavailable'}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://survey.example/**',api)
 page.locator('#begin').click();assert not calls # native required validation
 page.locator('[name=preparation][value="4"]').check();page.fill('#expert-question','Как сохранить самостоятельность ребят?')
 page.select_option('#need','Участия ребят')
 page.screenshot(path='/tmp/survey-desktop.png',full_page=True)
 page.locator('#begin').click();page.get_by_text('Не удалось отправить ответы.',exact=False).wait_for()
 assert page.locator('.story').count()==0
 assert page.locator('#begin').is_enabled()
 assert page.input_value('#expert-question')=='Как сохранить самостоятельность ребят?'
 assert set(calls[0])=={'action','token','need','preparation','question'}
 page.reload();page.locator('#start').click()
 assert page.locator('[name=preparation][value="4"]').is_checked()
 assert page.input_value('#expert-question')=='Как сохранить самостоятельность ребят?'
 good[0]=True;page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('#begin').click();page.locator('.story').wait_for()
 assert calls[0]['token']==calls[1]['token'];assert len(calls)==2
 assert calls[1]['preparation']==4 and calls[1]['question']=='Как сохранить самостоятельность ребят?'
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
 # The server received all answers before even the first game decision.
 assert page.locator('[data-choice]').count()>0
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).decisions.length")==0
 phone=b.new_context(viewport={'width':390,'height':844},is_mobile=True,reduced_motion='reduce').new_page()
 phone.goto('http://127.0.0.1:8000');phone.locator('#start').click()
 assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth')
 phone.screenshot(path='/tmp/survey-phone.png',full_page=True)
 for item in ['pencil','thread','thermos']:phone.locator(f'[data-item="{item}"]').click()
 phone.locator('[name=preparation][value="5"]').check();phone.fill('#expert-question','Пока нет вопроса')
 phone.locator('#begin').click();phone.locator('#preview-without-sending').wait_for(state='visible')
 assert phone.locator('.story').count()==0
 assert not phone.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
 # Existing game progress is preserved while collecting the newly added survey first.
 page.evaluate("""localStorage.setItem('vazhnoe-game-v1',JSON.stringify({screen:'scene',items:['compass','lens','folder'],need:'Времени и сил',scene:2,asked:{},decisions:[0,1],notes:{},postcard:{},swapped:false}))""")
 page.reload();page.locator('#start').click();assert page.locator('#survey-form').is_visible()
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://survey.example/submit'")
 page.locator('[name=preparation][value="1"]').check();page.fill('#expert-question','Пока нет вопроса');page.locator('#begin').click();page.locator('.story').wait_for()
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).scene")==2
 assert page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).decisions.length")==2
 print('PASS: required answers, immediate complete submission, no story on server failure, persisted draft, retry with same token, ACK before first decision, phone layout, no fake success without endpoint.')
 b.close()
