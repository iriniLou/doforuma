"""Build a self-contained quiz; survey and housing still require network access."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="quiz.css?v=20261106skip1">','<style>'+(root/'quiz.css').read_text()+'</style>')
for file in ('config.js','quiz-data.js','quiz-art.js','quiz-app.js'):
    source=(root/file).read_text().replace('</script','<\\/script')
    if file=='quiz-art.js':
        for asset in (root/'assets'/'mascots').glob('*.png'):
            data='data:image/png;base64,'+base64.b64encode(asset.read_bytes()).decode('ascii')
            source=source.replace(asset.relative_to(root).as_posix(),data)
    html=html.replace(f'<script src="{file}?v=20261106skip1"></script>','<script>'+source+'</script>')
out=root/'dist';out.mkdir(exist_ok=True)
(out/'Какой-Вы-педагог.html').write_text(html)
print('Built:',out/'Какой-Вы-педагог.html')
