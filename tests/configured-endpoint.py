"""Exercise real production configuration with intercepted network, never write test data to Google."""
from playwright.sync_api import sync_playwright
import json
from pathlib import Path
ENDPOINT='https://script.google.com/macros/s/AKfycbxNGq9SWzwoeUNqfc85fI3fDM_j8yF7TnglrKHhq_aIbCRZWAoMj0KhuL8hKbLFxq8X/exec'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':900},reduced_motion='reduce')
 calls=[]
 def api(route):
  calls.append(route.request)
  if route.request.method=='POST':
   data=json.loads(route.request.post_data);assert data['action']=='survey';assert data['preparation']==5
   body={'ok':True}
  elif 'id=' in route.request.url:body={'status':'room','self':{'name':'Тестовая Анна'},'roommates':[{'name':'Тестовая Вера'}]}
  else:body={'status':'matches','matches':[{'id':'test-id','name':'Тестовая Анна'}]}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers={'Access-Control-Allow-Origin':'*'})
 page.route(ENDPOINT+'*',api)
 page.goto('http://127.0.0.1:8000')
 assert page.evaluate('window.FORUM_CONFIG.analyticsEndpoint')==ENDPOINT
 assert page.evaluate('window.FORUM_CONFIG.housingEndpoint')==ENDPOINT
 assert page.locator('.preview-notice').count()==0
 page.locator('[name=preparation][value="5"]').check();page.fill('#expert-question','Пока нет вопроса');page.locator('#survey-submit').click()
 page.locator('#start').wait_for();assert len(calls)==1
 page.locator('.housing-link').first.click();assert page.locator('#housing-search').is_enabled()
 assert 'Список размещения скоро появится' not in page.locator('main').inner_text()
 page.fill('#surname','Тестовая');page.locator('#housing-search').click()
 page.get_by_role('button',name='Тестовая Анна').click()
 page.get_by_text('Тестовая Вера',exact=False).wait_for()
 assert len(calls)==3 and all(r.url.startswith(ENDPOINT) for r in calls)
 print('PASS: user-provided production URL for survey and housing; no preview mode; POST acknowledgement unlocks housing; GET matches and roommates; all test requests intercepted.')
 b.close()
