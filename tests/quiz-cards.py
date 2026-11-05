"""Export every result; check the single-file build with no real API calls."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json

OUT = Path('/tmp/short-quiz/cards')
OUT.mkdir(parents=True, exist_ok=True)
EXAMPLES = {
    'inventor': ([0, 0, 0, 0, 0], 'Свежего подхода'),
    'care': ([0, 0, 0, 1, 0], 'Времени и сил'),
    'connector': ([0, 0, 0, 1, 0], 'Участия ребят'),
    'calm': ([0, 0, 0, 1, 0], 'Уверенности в разговорах'),
    'spark': ([0, 0, 0, 3, 0], 'Свежего подхода'),
    'guide': ([0, 0, 2, 1, 3], 'Времени и сил'),
}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    ctx = browser.new_context(viewport={'width':1440,'height':1000}, accept_downloads=True)
    ctx.route('https://**', lambda route: route.abort())
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8000')
    for role, (answers, need) in EXAMPLES.items():
        state = {'screen':'home', 'answers':answers, 'index':4, 'need':need,
                 'quizNeed':need, 'surveySaved':'already-confirmed'}
        page.evaluate('(s)=>localStorage.setItem("forum-short-quiz-v1",JSON.stringify(s))',state)
        page.reload()
        page.locator('#start').click()
        assert page.evaluate('quizResult('+json.dumps(answers)+','+json.dumps(need)+').id') == role
        assert page.locator('.result-svg').is_visible()
        card=page.locator('.result-svg')
        for removed in ['С ЧЕМ ЕДЕМ НА ФОРУМ','В первом опросе','Шуточный тест','irinilou.github.io']:
            assert removed not in card.text_content(),removed
        assert card.locator('image').count()==1
        with page.expect_download() as download:
            page.locator('#download').click()
        target=OUT / (role+'.png')
        download.value.save_as(str(target))
        assert target.stat().st_size>100000
        assert page.evaluate('ensureMascot('+json.dumps(role)+').then(src=>src.startsWith("data:image/png;base64,"))')
        assert target.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
    # Standalone build embeds art, styles, logic and content; no asset HTTP requests.
    standalone=ctx.new_page()
    standalone.goto('http://127.0.0.1:8000/dist/Какой-Вы-педагог.html')
    assert standalone.locator('script[src],link[rel=stylesheet]').count()==0
    standalone.evaluate('localStorage.setItem("forum-short-quiz-v1",JSON.stringify({surveySaved:"confirmed",answers:[],index:0,need:"Времени и сил"}))')
    standalone.reload()
    standalone.locator('#start').click()
    for answer in [0,0,0,1,0]:
        standalone.locator('[data-answer="'+str(answer)+'"]').click()
    assert 'Педагог-подзарядка' in standalone.locator('.result-intro').inner_text()
    assert standalone.locator('.result-svg image').get_attribute('href').startswith('data:image/png;base64,')
    with standalone.expect_download() as download:
        standalone.locator('#download').click()
    download.value.save_as(str(OUT/'standalone.png'))
    assert (OUT/'standalone.png').stat().st_size>100000
    # Visual contact sheet for inspection of all six original illustrations.
    art=page.evaluate('QUIZ.characters.map(r=>({title:r.title,color:r.color,svg:mascotSvg(r.id,320)}))')
    gallery=ctx.new_page()
    gallery.set_content('<style>body{margin:0;background:#f8f7f3;font-family:Arial}main{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:24px}article{text-align:center;border-radius:25px;padding:10px}h2{font-size:24px}</style><main>'+''.join('<article style="background:'+r['color']+'"><h2>'+r['title']+'</h2>'+r['svg']+'</article>' for r in art)+'</main>')
    gallery.screenshot(path=str(OUT/'all-characters.png'),full_page=True)
    assert not errors,errors
    browser.close()
print('PASS: six distinct PNG exports; original mascot gallery; standalone HTML full journey without external assets.')
