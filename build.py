"""Build a single-file copy for offline viewing. No dependencies or network needed."""
from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="style.css?v=20261105e">','<style>'+(root/'style.css').read_text()+'</style>')
for file in ('config.js','content.js','visuals.js','app.js'):
    # Protect the script boundary, including future text edits.
    source=(root/file).read_text().replace('</script','<\\/script')
    html=html.replace(f'<script src="{file}?v=20261105e"></script>','<script>'+source+'</script>')
out=root/'dist';out.mkdir(exist_ok=True)
(out/'Важное-с-собой.html').write_text(html)
print('Built:',out/'Важное-с-собой.html')
