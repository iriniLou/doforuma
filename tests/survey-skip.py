"""Skipping must not validate, send, or claim that the survey was saved."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

URL='http://127.0.0.1:8000'
ENDPOINT='https://script.google.com/macros/s/AKfycbxNGq9SWzwoeUNqfc85fI3fDM_j8yF7TnglrKHhq_aIbCRZWAoMj0KhuL8hKbLFxq8X/exec'
OUT=Path('/tmp/short-quiz');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':390,'height':844},accept_downloads=True)
 page=ctx.new_page();calls=[];errors=[];mode={'error':False}
 page.on('pageerror',lambda e:errors.append(str(e)))
 def api(route):
  calls.append(route.request)
  response=({'error':'unavailable'} if mode['error'] else {'ok':True}) if route.request.method=='POST' else {'status':'matches','matches':[]}
  route.fulfill(status=200,body=json.dumps(response),content_type='application/json',headers={'Access-Control-Allow-Origin':'*'})
 ctx.route(ENDPOINT+'*',api)
 page.goto(URL);page.screenshot(path=str(OUT/'07-survey-skip.png'),full_page=True)
 page.locator('.skip-survey').first.click();page.locator('#start').wait_for()
 state=page.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1'))")
 assert state['surveySkipped'] and not state.get('surveySaved') and not state.get('surveyToken')
 assert len(calls)==0
 page.locator('.housing-link').first.click();page.fill('#surname','Проверочная');page.locator('#housing-search').click();page.get_by_text('Такой фамилии пока нет в списке.',exact=False).wait_for()
 assert len(calls)==1 and calls[0].method=='GET'
 page.locator('#return-game').click();page.locator('#start').click()
 assert page.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1')).quizNeed") is None
 for answer in [0,0,0,1,0]:page.locator('[data-answer="'+str(answer)+'"]').click()
 assert page.locator('.result-intro').is_visible() and page.locator('.need-note').count()==0
 with page.expect_download() as download:page.locator('#download').click()
 download.value.save_as(str(OUT/'skipped-survey.png'))
 page.reload();page.locator('#start').wait_for();assert page.locator('#survey-form').count()==0
 page.locator('#return-survey').click()
 assert not page.locator('[name=preparation]:checked').count()
 page.select_option('#need','Времени и сил');page.locator('[name=preparation][value="2"]').check();page.fill('#expert-question','-')
 mode['error']=True;page.locator('#survey-submit').click();page.get_by_text('Код: unavailable.',exact=False).wait_for()
 failed=page.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1'))")
 assert not failed.get('surveySaved') and failed['expertQuestion']=='-'
 page.locator('.skip-survey').last.click();page.locator('#start').wait_for()
 assert len([c for c in calls if c.method=='POST'])==1
 page.reload();page.locator('#return-survey').click()
 assert page.locator('#expert-question').input_value()=='-'
 assert page.locator('[name=preparation]:checked').input_value()=='2'
 mode['error']=False;page.locator('#survey-submit').click();page.locator('#start').wait_for()
 saved=page.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1'))")
 assert saved['surveySaved'] and saved['surveyToken']==failed['surveyToken']
 posts=[json.loads(c.post_data) for c in calls if c.method=='POST']
 assert len(posts)==2 and posts[0]['token']==posts[1]['token']
 assert page.locator('#return-survey').count()==0
 page.locator('#again-home').click()
 assert page.evaluate("JSON.parse(localStorage.getItem('forum-short-quiz-v1')).quizNeed")=='Времени и сил'
 assert not errors,errors
 b.close()
print('PASS: empty survey skip without POST; housing/quiz/PNG access; neutral result without invented need; persisted skip; failed survey draft retained; later retry uses same token; initial need counted when answered.')
