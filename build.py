"""Build a self-contained quiz; survey and housing still require network access."""
from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="quiz.css?v=20261105quiz1">','<style>'+(root/'quiz.css').read_text()+'</style>')
for file in ('config.js','quiz-data.js','quiz-art.js','quiz-app.js'):
    source=(root/file).read_text().replace('</script','<\\/script')
    html=html.replace(f'<script src="{file}?v=20261105quiz1"></script>','<script>'+source+'</script>')
out=root/'dist';out.mkdir(exist_ok=True)
(out/'Какой-Вы-педагог.html').write_text(html)
print('Built:',out/'Какой-Вы-педагог.html')
