from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':960},reduced_motion='reduce');errors=[];calls=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda dialog:dialog.accept())
 saved={'screen':'home','items':[],'need':'Времени и сил','scene':0,'decisions':[],'surveySaved':'already-recorded','surveyToken':'test-token','preparation':5,'expertQuestion':'-','asked':{},'notes':{},'postcard':{}}
 page.add_init_script('if(!localStorage.getItem("vazhnoe-game-v1"))localStorage.setItem("vazhnoe-game-v1",'+json.dumps(json.dumps(saved))+')')
 page.route('https://script.google.com/**',lambda r:(calls.append(r.request.url),r.abort()))
 page.goto('http://127.0.0.1:8000');page.locator('#start').click()
 def pack():
  for item in ['compass','lens','thermos']:page.locator(f'[data-item="{item}"]').click()
  page.locator('#begin-game').click()
 def play(path):
  for i,choice in enumerate(path):
   page.locator('[data-question="0"]').click();page.locator(f'[data-choice="{choice}"]').click()
   page.fill('#reflection-note','Заметка '+str(i));page.locator('#next').click()
 pack();play([0,0,0,0,0,0]);assert 'Архитектор общего дела' in page.locator('.postcard-svg').text_content()
 page.locator('.play-again').click()
 state=page.evaluate("JSON.parse(localStorage.getItem('vazhnoe-game-v1'))")
 assert state['decisions']==[] and state['asked']=={} and state['notes']=={} and state['postcard']=={}
 assert state['surveySaved']=='already-recorded' and state['expertQuestion']=='-'
 pack();play([0,1,0,0,1,2]);assert 'Ловец тихих голосов' in page.locator('.postcard-svg').text_content()
 assert 'Архитектор общего дела' not in page.locator('.postcard-svg').text_content()
 page.screenshot(path='/tmp/replayed-role.png',full_page=True)
 # End-of-game item exchange must not turn the role into an item quiz.
 page.locator('[data-swap="thermos"]').click();page.locator('[data-swap="folder"]').click()
 assert 'Ловец тихих голосов' in page.locator('.postcard-svg').text_content()
 page.locator('#back-home').click();assert page.locator('#start').inner_text().startswith('Моя открытка')
 assert page.locator('.play-again').is_visible()
 assert calls==[],calls
 assert errors==[],errors
 print('PASS: two real UI journeys yield different roles; replay clears decisions/notes; questionnaire retained; no duplicate survey request; item swap leaves role unchanged; explicit replay and postcard buttons.')
 b.close()
