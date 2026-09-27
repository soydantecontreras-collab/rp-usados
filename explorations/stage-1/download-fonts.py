"""Fetch the five OFL font families used only by the Stage 1 comparison."""
from pathlib import Path
import hashlib, json, re, urllib.request

root = Path(__file__).parent / 'fonts'
root.mkdir(parents=True, exist_ok=True)
families = {
    'bricolage': ('Bricolage Grotesque:opsz,wght@12..96,200..800', 'bricolagegrotesque'),
    'manrope': ('Manrope:wght@200..800', 'manrope'),
    'newsreader': ('Newsreader:opsz,wght@6..72,200..800', 'newsreader'),
    'instrument': ('Instrument Sans:wght@400..700', 'instrumentsans'),
    'archivo': ('Archivo:wght@100..900', 'archivo'),
}
manifest = []
for name, (query, directory) in families.items():
    url = 'https://fonts.googleapis.com/css2?family=' + query.replace(' ', '+') + '&display=swap'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'})
    css = urllib.request.urlopen(req).read().decode()
    latin = css.split('/* latin */')[-1]
    source = re.search(r'src:\s*url\(([^)]+)\)', latin).group(1)
    data = urllib.request.urlopen(source).read()
    if data[:4] != b'wOF2':
        raise RuntimeError('Expected WOFF2 from Google Fonts')
    (root / (name + '.woff2')).write_bytes(data)
    license_url = 'https://raw.githubusercontent.com/google/fonts/main/ofl/' + directory + '/OFL.txt'
    (root / (name + '-OFL.txt')).write_bytes(urllib.request.urlopen(license_url).read())
    manifest.append({'family': query, 'file': name + '.woff2', 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'css': url, 'source': source, 'license': license_url, 'subset': 'latin', 'downloaded': '2026-09-23'})
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps([{ 'file': x['file'], 'KiB': round(x['bytes']/1024, 1)} for x in manifest]))
