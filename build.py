#!/usr/bin/env python3
"""Assemble site/index.html as a pure-ASCII, self-contained page."""
import json, re, os

def esc_js(s):
    """Escape non-ASCII inside JS source (all of ours sit in string literals)."""
    return "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in s)

def esc_html(s):
    return "".join(c if ord(c) < 128 else "&#x%x;" % ord(c) for c in s)

# --- data: ensure_ascii gives us \uXXXX for free ---
d = json.load(open('elements.json'))
import re as _re
def syl(w, FIX):
    if w in FIX: return FIX[w]
    n = len(_re.findall(r'[aeiouy]+', w.lower()))
    return max(1, n)
FIX = json.load(open('site/syllables.json'))
payload = []
for e in d['elements']:
    payload.append({
        "z":e['atomicNumber'],"sym":e['symbol'],"name":e['name'],
        "zh":e['nameZh'],"py":e['pinyin'],"rare":bool(e.get('nameZhRareGlyph')),
        "rad":e['zhRadical']['radical'],"radM":e['zhRadical']['means'],
        "cat":e['category'],"g":e['group'],"p":e['period'],"blk":e['block'],
        "mass":e['atomicMass'],"state":e['stateAtRoomTemp'],
        "disc":e['discovered'],"means":e['nameMeaning'],
        "ppm":e['crustAbundancePpm'],"ch":e['charges'],
        "desc":e['description'],"facts":e['funFacts'],
        "cmp":[[c['formula'],c['name'],c.get('nameZh',''),c['about']] for c in e.get('compounds',[])],
        "note":e.get('compoundsNote',''),
        "ex":[[c['formula'],c['name'],c['about']] for c in e.get('compoundsExamples',[])],
        "syl":syl(e['name'], FIX),
        "zhNote":e.get('zhCharacterNote',''),"zhB":e.get('zhBuild'),
    })
data = "const ELEMENTS=" + json.dumps(payload, ensure_ascii=True, separators=(',',':')) + ";\n"

css   = esc_html(open('site/app.css').read())      # CSS content chars -> entities is wrong; use \XX
# CSS: escape non-ascii with CSS unicode escapes instead
css   = open('site/app.css').read()
css   = "".join(c if ord(c) < 128 else "\\%x " % ord(c) for c in css)
js    = esc_js(open('site/app.js').read())
shell = esc_html(open('site/shell.html').read())
# hoist <title> and <meta> above the stylesheet: the host scans only the first 8KB for a title
head_lines, body_lines = [], []
for ln in shell.split("\n"):
    (head_lines if ln.startswith(("<title", "<meta")) else body_lines).append(ln)
head = "\n".join(head_lines)
body = "\n".join(body_lines).strip()

out = f"{head}\n<style>\n{css}\n</style>\n{body}\n<script>\n{data}{js}\n</script>\n"
open('site/index.html','w').write(out)

nonascii = [c for c in set(out) if ord(c) > 127]
print(f"index.html = {os.path.getsize('site/index.html')/1024:.0f} KB")
print(f"non-ASCII bytes remaining: {nonascii if nonascii else 'NONE (encoding-proof)'}")
