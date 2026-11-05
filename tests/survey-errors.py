from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for body,content_type,status,expected in [('{"error":"unavailable"}','application/json',200,'unavailable'),('{"error":"survey_columns"}','application/json',200,'survey_columns'),('<html>Sign in</html>','text/html',200,'non_json'),('denied','text/plain',403,'http_403')]:
  page=b.new_context(reduced_motion='reduce').new_page();page.goto('http://127.0.0.1:8000')
  page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://error.example/submit'")
  page.route('https://error.example/**',lambda r:r.fulfill(status=status,body=body,content_type=content_type,headers={'Access-Control-Allow-Origin':'*'}))
  page.locator('[name=preparation][value="0"]').check();page.fill('#expert-question','Тестовый вопрос');page.locator('#survey-submit').click()
  page.get_by_text('Код: '+expected+'.',exact=False).wait_for()
  assert page.locator('#start').count()==0
  assert page.input_value('#expert-question')=='Тестовый вопрос'
  assert not page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
  page.close()
 print('PASS: distinguish server write refusal, headers, non-JSON Google page and HTTP rejection; answers retained and no false success.')
 b.close()
