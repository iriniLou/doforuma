from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for error in ['unavailable','housing_columns','housing_sheet','housing_source_not_ready','refresh_search']:
  page=b.new_context(reduced_motion='reduce').new_page()
  page.add_init_script("localStorage.setItem('vazhnoe-game-v1',JSON.stringify({screen:'home',items:[],need:'Времени и сил',scene:0,decisions:[],surveySaved:'test',asked:{},notes:{},postcard:{}}))")
  page.goto('http://127.0.0.1:8000');page.evaluate("window.FORUM_CONFIG.housingEndpoint='https://housing.example/error'")
  page.route('https://housing.example/**',lambda r:r.fulfill(status=200,body=json.dumps({'error':error}),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'}))
  page.locator('.housing-link').first.click();page.fill('#surname','Проверка');page.locator('#housing-search').click()
  page.get_by_text('Код: '+error+'.',exact=False).wait_for()
  assert page.locator('#housing-search').is_enabled()
  assert page.locator('#housing-results .result-card').count()==0
  page.close()
 print('PASS: housing response codes remain distinguishable; retry enabled and no invented roommate data.')
 b.close()
