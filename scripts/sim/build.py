#!/usr/bin/env python3
"""Rakit simulator merge sort menjadi satu file HTML mandiri (offline)."""
import base64, os, re, shutil, sys, urllib.request

SIM = '/home/z/my-project/scripts/sim'
VENDOR = os.path.join(SIM, 'vendor')
OUT = '/home/z/my-project/download/merge-sort-simulator.html'
PUBLIC = '/home/z/my-project/public/simulator.html'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'}

def read(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def parse_faces(css_text, only_latin=True):
    """Ekstrak blok @font-face; kembalikan list of dict(family, weight, url, unicode_range)."""
    faces = []
    # pisahkan per blok komentar subset + @font-face
    pattern = re.compile(r'/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})|(@font-face\s*\{[^}]*\})')
    for m in pattern.finditer(css_text):
        subset, block = m.group(1), m.group(2) or m.group(3)
        if only_latin and subset and subset != 'latin':
            continue
        fam = re.search(r"font-family:\s*'([^']+)'", block)
        wgt = re.search(r'font-weight:\s*(\d+)', block)
        url = re.search(r'url\((https://[^)]+)\)', block)
        if not (fam and wgt and url):
            continue
        faces.append({'family': fam.group(1), 'weight': wgt.group(1), 'url': url.group(1)})
    return faces

def build_fonts_css():
    parts = []
    ok = True
    try:
        for css_file, extra_range in [('sg.css', None), ('jbm.css', None), ('jbm-sym.css', 'U+2264, U+2192')]:
            faces = parse_faces(read(os.path.join(VENDOR, css_file)))
            if css_file == 'jbm-sym.css':
                faces = faces[:1]
            for f in faces:
                data = fetch(f['url'])
                if data[:4] != b'wOF2':
                    raise RuntimeError('Bukan woff2: ' + f['url'])
                b64 = base64.b64encode(data).decode('ascii')
                ur = extra_range or 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
                parts.append(
                    "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;"
                    "src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s;}"
                    % (f['family'], f['weight'], b64, ur))
                print('  font: %s %s (%d B)' % (f['family'], f['weight'], len(data)))
    except Exception as e:
        print('  PERINGATAN: font gagal di-inline (%s) — memakai font sistem' % e)
        ok = False
    return '\n'.join(parts), ok

def main():
    print('[1/3] Font...')
    fonts_css, fonts_ok = build_fonts_css()

    print('[2/3] Rakit HTML...')
    html = read(os.path.join(SIM, 'template.html'))
    deps = '\n;\n'.join(read(os.path.join(VENDOR, f)) for f in [
        'gsap.min.js', 'CustomEase.min.js', 'MotionPathPlugin.min.js',
        'SplitText.min.js', 'ScrambleTextPlugin.min.js'])
    for token, content in [
        ('/*@FONT*/', fonts_css),
        ('/*@CSS*/', read(os.path.join(SIM, 'style.css'))),
        ('/*@GSAP*/', deps),
        ('/*@SHADER*/', read(os.path.join(SIM, 'shader.js'))),
        ('/*@ENGINE*/', read(os.path.join(SIM, 'engine.js'))),
        ('/*@ANIM*/', read(os.path.join(SIM, 'anim.js'))),
        ('/*@UI*/', read(os.path.join(SIM, 'ui.js'))),
    ]:
        assert token in html, 'token hilang: ' + token
        html = html.replace(token, content)

    print('[3/3] Tulis output...')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(html)
    os.makedirs(os.path.dirname(PUBLIC), exist_ok=True)
    shutil.copy(OUT, PUBLIC)
    print('OK: %s (%.1f KB) — font inline: %s' % (OUT, len(html) / 1024, fonts_ok))
    print('OK: %s' % PUBLIC)

if __name__ == '__main__':
    main()
