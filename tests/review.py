from playwright.sync_api import sync_playwright
from pathlib import Path
import json
OUT=Path('/tmp/forum-review');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1280,'height':960},color_scheme='dark',reduced_motion='reduce',accept_downloads=True)
 ctx.route('**/config.js*',lambda r:r.fulfill(status=200,body="window.FORUM_CONFIG={housingEndpoint:'',analyticsEndpoint:'',contactUrl:''};",content_type='application/javascript'))
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000')
 calls=[]
 def stats(route):
  payload=json.loads(route.request.post_data);calls.append(payload)
  assert set(payload)=={'action','need','token','preparation','question'}
  route.fulfill(status=200,body='{"ok":true}',headers={'Access-Control-Allow-Origin':'*'},content_type='application/json')
 page.route('https://statistics.example/**',stats)
 page.evaluate("window.FORUM_CONFIG.analyticsEndpoint='https://statistics.example/count'")
 assert page.locator('#stats-consent').count()==0;assert 'Ответы будут анонимно учтены' in page.locator('main').inner_text();page.select_option('#need','Поддержки коллег');page.locator('input[name="preparation"][value="2"]').check();page.fill('#expert-question','Как вовлечь молчащих?');page.locator('#survey-submit').click()
 page.wait_for_function("JSON.parse(localStorage.getItem('vazhnoe-game-v1')).surveySaved")
 page.locator('#start').click()
 for item in ['compass','lens','pencil']:page.locator(f'[data-item="{item}"]').click()
 page.screenshot(path=str(OUT/'items.png'),full_page=True)
 page.locator('#begin-game').click()
 assert len(calls)==1 and calls[0]['need']=='Поддержки коллег'
 for q in page.locator('.question').all():
  assert q.inner_text().strip();assert q.evaluate('(e)=>getComputedStyle(e).color')=='rgb(37, 38, 34)'
 page.screenshot(path=str(OUT/'questions.png'),full_page=True)
 for i in range(6):page.locator('[data-choice="0"]').click();page.locator('#next').click()
 assert 'Архитектор общего дела' in page.locator('.postcard-svg').text_content()
 assert 'Собираете людей, а не только план' in page.locator('.postcard-svg').text_content()
 assert 'Как поддержать самостоятельность и оставаться рядом?' in page.locator('.postcard-svg').text_content()
 assert page.locator('#download-role').count()==0
 for el in page.locator('.swap-item').all():assert el.inner_text().strip()
 page.locator('[data-swap="pencil"]').focus()
 assert page.locator('[data-swap="pencil"] .item-tooltip').is_visible()
 page.select_option('#prompt','5');page.fill('#custom-question','Что помогает говорить честно?')
 page.fill('#share','Идеями маленьких мастерских')
 page.fill('#try','Разделить задачи с ребятами')
 page.screenshot(path=str(OUT/'final.png'),full_page=True)
 with page.expect_download() as d:page.locator('#download').click()
 d.value.save_as(str(OUT/'postcard.png'))
 assert 'Что помогает говорить честно?' in page.locator('.postcard-svg').text_content()
 import re
 assert not re.search(r'(?<![А-Яа-я])РОВ(?![А-Яа-я])',page.locator('main').inner_text()+' '+page.locator('.postcard-svg').text_content())
 assert 'Важное с собой.' not in page.locator('.postcard-svg').text_content()
 # Long text must expand the card rather than overlap the next block.
 page.fill('#custom-question','Длинный вопрос '*35)
 page.fill('#share','Делиться опытом '*15)
 page.fill('#try','Пробовать новое '*15)
 svg=page.locator('.postcard-svg')
 assert float(svg.get_attribute('viewBox').split()[-1])>1200
 with page.expect_download() as d:page.locator('#download').click()
 d.value.save_as(str(OUT/'postcard-long.png'))
 assert len(calls)==1 # no notes, role or postcard are sent
 page.locator('.housing-link').first.click()
 assert page.locator('.arrival-footnote').inner_text().startswith('*Заезд')
 assert 'после подключения таблицы' not in page.locator('main').inner_text()
 page.screenshot(path=str(OUT/'housing.png'),full_page=True)
 # Single-file game is self-contained and keeps item drawings.
 offline=b.new_context(reduced_motion='reduce').new_page();requests=[];offline.route('https://script.google.com/**',lambda r:r.fulfill(status=200,body='{"ok":true}',content_type='application/json',headers={'Access-Control-Allow-Origin':'*'}));offline.on('request',lambda r:requests.append(r.url));offline.goto('http://127.0.0.1:8000/dist/Важное-с-собой.html')
 offline.locator('[name=preparation][value="5"]').check();offline.fill('#expert-question','Пока нет вопроса');offline.locator('#survey-submit').click();offline.locator('#start').click();assert offline.locator('.item-icon svg').count()==6;assert len(requests)==2 and 'script.google.com' in requests[1],requests
 assert not errors,errors
 print('PASS: visible labels in dark system theme; six SVG icons; anonymous POST without checkbox; complete role inside postcard; tooltip focus; matching SVG/PNG postcard; long text layout; arrival footnote; offline build.')
 b.close()
