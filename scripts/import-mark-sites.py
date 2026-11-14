#!/usr/bin/env python3
"""Import Mark Sites content from live WordPress lodge microsites on markmastermasons.com.

Fetches each curated page URL over HTTPS, extracts the main Visual Composer
column (vc_col-sm-9), rewrites images into public/sites/<slug>/media/, and
writes content/sites/<slug>.json plus manifest.json / site-meta.json.

Run from repo root:
  python3 scripts/import-mark-sites.py

District / country sites share the same URL pattern
(https://www.markmastermasons.com/{slug}/) and the same WP REST + HTML theme,
so this scraper can be extended with a province page map (see content/sites/WP-IMPORT.md).

Recovered from the original Cloud Agent migration that produced the committed
content/sites JSON (commit 2d9c248); the repo previously kept only a stub.
"""

import re, os, json, hashlib, time, urllib.request, urllib.error, ssl, html as htmllib
from urllib.parse import urljoin, urlparse
from pathlib import Path

ctx = ssl.create_default_context()
UA={'User-Agent':'Mozilla/5.0 (compatible; MarkPortalMigrator/1.0)'}
ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'content'/'sites'
PUBLIC=ROOT/'public'/'sites'
CONTENT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

SITES={
  'gallipoli': {
    'base':'https://markmastermasons.com/gallipoli/',
    'pages':[
      ('home','', 'Home'),
      ('history/oration','the-oration','The Oration'),
      ('history/banner','the-banner-of-the-lodge','The Lodge Banner'),
      ('history/overview','history','History'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','foundingmembers','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-gallipoli','Join Gallipoli'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('masters-charities/almoner','mark-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','mark-charities',"Master's Charities"),
      ('contact','contact-us','Contact Us'),
      ('posts/gallipoli-founders-lord-mayors-show','lord-mayors-show-11th-november-2017.html','Gallipoli founders at Lord Mayor’s Show'),
      ('posts/run-for-peace-gallipoli-marathon','run-for-peace-gallipoli-marathon-turkey.html','Run for Peace – Gallipoli Marathon – Turkey'),
      ('posts/primus-master-lord-mayors-show-2016','primus-master-at-lord-mayors-show-2016.html','Primus Master at Lord Mayor’s Show – 2016'),
    ]
  },
  'namik-kemal': {
    'base':'https://www.markmastermasons.com/namikkemal/',
    'pages':[
      ('home','', 'Home'),
      ('history/oration','the-oration','The Oration'),
      ('history/overview','history','History'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','foundingmembers','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-namik-kemal','Join Namik Kemal'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('masters-charities/almoner','mark-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','mark-charities',"Master's Charities"),
      ('contact','contact','Contact Us'),
    ]
  },
  'anadolu': {
    'base':'https://markmastermasons.com/anadolu/',
    'pages':[
      ('home','', 'Home'),
      ('history/oration','the-oration','The Oration'),
      ('history/banner','the-banner-of-the-lodge','The Lodge Banner'),
      ('history/overview','history','History'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','foundingmembers','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-anadolu','Join Anadolu'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('masters-charities/almoner','mark-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','mark-charities',"Master's Charities"),
      ('contact','contact-us','Contact Us'),
    ]
  },
  'freemasons-without-borders': {
    'base':'https://markmastermasons.com/fwb/',
    'pages':[
      ('home','', 'Home'),
      ('history/oration','the-oration','The Oration'),
      ('history/overview','history','History'),
      ('history/consecration-photos','consecrationphotos','Consecration Photos'),
      ('history/consecration-videos','consecration-videos','Consecration Videos'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','foundingmembers','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-us-now','Join Us Now'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('meetings/summons-archive','summons-minutes-archieve','Summons & Minutes Archive'),
      ('masters-charities/almoner','mark-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','mark-charities',"Master's Charities"),
      ('contact','contact','Contact Us'),
    ] + [(f'meetings/{n}-regular-meeting', f'{n}-regular-meeting', f'{n} Regular Meeting') for n in ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']]
  },
  'ata': {
    'base':'https://markmastermasons.com/ata/',
    'pages':[
      ('home','', 'Home'),
      ('history/overview','history','History'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','foundingmembers','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-us','Join Us'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('masters-charities/almoner','mark-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','mark-charities',"Master's Charities"),
      ('contact','contact-us','Contact Us'),
    ]
  },
  'khalsa': {
    'base':'https://www.markmastermasons.com/khalsa/',
    'pages':[
      ('home','', 'Home'),
      ('history/oration','the-oration','The Oration'),
      ('history/overview','history','History'),
      ('history/consecration-photos','consecration-photos','Consecration Photos'),
      ('members/honorary-members','hononary-members','Honorary Members'),
      ('members/past-masters','past-masters','Past Masters'),
      ('members/founding-members','founding-members','Founding Members'),
      ('members/secretaries-treasurers','secretaries-treasurers','Secretaries & Treasurers'),
      ('members/office-bearers','office-bearers','Office Bearers'),
      ('members/promised-journey','the-promised-journey','The Promised Journey'),
      ('members/join','join-us-now','Join Us Now'),
      ('meetings/regular-meetings','meetings','Meetings'),
      ('masters-charities/almoner','masters-charities/almoner','Almoner'),
      ('masters-charities/mcf','masonic-charitable-foundation','Masonic Charitable Foundation'),
      ('masters-charities/overview','masters-charities',"Master's Charities"),
      ('members/ram','ram','RAM'),
      ('contact','contact-us','Contact Us'),
    ]
  },
}

def fetch(url, max_redirects=8):
  current=url
  for _ in range(max_redirects):
    req=urllib.request.Request(current, headers=UA)
    try:
      with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return r.geturl(), r.status, r.read()
    except urllib.error.HTTPError as e:
      loc=e.headers.get('Location') if e.headers else None
      if e.code in (301,302,303,307,308) and loc:
        current=urljoin(current, loc); continue
      return current, e.code, (e.read() if e.fp else b'')
    except Exception as e:
      return current, 0, str(e).encode()
  return current, 0, b''

def decode(data):
  for enc in ('utf-8','latin-1'):
    try: return data.decode(enc)
    except: pass
  return data.decode('utf-8','ignore')

def extract_title(html):
  for pat in [
    r'(?is)<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>(.*?)</h1>',
    r'(?is)<div[^>]+class="[^"]*titlebar[^"]*"[^>]*>.*?<h1[^>]*>(.*?)</h1>',
    r'(?is)<h1[^>]*>(.*?)</h1>',
    r'(?is)<title[^>]*>(.*?)</title>',
  ]:
    m=re.search(pat, html)
    if m:
      t=re.sub(r'<[^>]+>','',m.group(1))
      t=htmllib.unescape(t.replace('&#8211;','–').replace('&#038;','&')).strip()
      # title often "X – Site"
      t=re.split(r'\s+[–-]\s+', t)[0].strip()
      if t: return t
  return ''

def balanced_div_extract(html, start_idx):
  # start_idx points at '<div'
  i=start_idx
  if not html[i:i+4].lower()=='<div': return None
  depth=0
  j=i
  while j < len(html):
    next_open=html.lower().find('<div', j)
    next_close=html.lower().find('</div>', j)
    if next_close<0: return None
    if next_open>=0 and next_open < next_close:
      depth += 1
      j = next_open + 4
    else:
      depth -= 1
      j = next_close + 6
      if depth==0:
        return html[i:j]
  return None

def extract_main(html):
  # Prefer main content column vc_col-sm-9
  candidates=[]
  for m in re.finditer(r'(?is)<div[^>]+class="[^"]*vc_col-sm-9[^"]*"[^>]*>', html):
    block=balanced_div_extract(html, m.start())
    if block: candidates.append(block)
  if not candidates:
    for m in re.finditer(r'(?is)<div[^>]+class="[^"]*wpb_text_column[^"]*"[^>]*>', html):
      block=balanced_div_extract(html, m.start())
      if block: candidates.append(block)
  if not candidates:
    for m in re.finditer(r'(?is)<div[^>]+class="[^"]*vc_col-sm-8[^"]*"[^>]*>', html):
      block=balanced_div_extract(html, m.start())
      if block: candidates.append(block)
  if not candidates:
    m=re.search(r'(?is)<div[^>]+class="[^"]*content[^"]*"[^>]*>', html)
    if m:
      block=balanced_div_extract(html, m.start())
      if block: candidates.append(block)
  if not candidates:
    return ''
  # choose largest by text length
  def textlen(b):
    t=re.sub(r'(?is)<script.*?>.*?</script>','',b)
    t=re.sub(r'(?is)<style.*?>.*?</style>','',t)
    t=re.sub(r'<[^>]+>','',t)
    return len(re.sub(r'\s+',' ',t).strip())
  candidates.sort(key=textlen, reverse=True)
  return candidates[0]

def download_asset(url, slug):
  try:
    parsed=urlparse(url)
    if not parsed.scheme.startswith('http'): return None
    path=parsed.path
    ext=os.path.splitext(path)[1].lower()
    if ext not in ['.jpg','.jpeg','.png','.gif','.webp','.svg']:
      return None
    name=hashlib.sha1(url.encode()).hexdigest()[:16]+ext
    dest_dir=PUBLIC/slug/'media'
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest=dest_dir/name
    if not dest.exists():
      final,code,data=fetch(url)
      if code!=200 or len(data)<80: return None
      dest.write_bytes(data)
      time.sleep(0.03)
    return f'/sites/{slug}/media/{name}'
  except Exception:
    return None

SKIP_LINK_PREFIXES=('/wp-admin','/my-account','/cart','/checkout','mailto:','tel:','javascript:')

def rewrite_links(fragment, page_url, slug, link_map):
  def a_repl(m):
    full=m.group(0)
    href_m=re.search(r'\shref=["\']([^"\']+)["\']', full, re.I)
    if not href_m: return full
    href=urljoin(page_url, href_m.group(1))
    low=href.lower()
    if any(x in low for x in SKIP_LINK_PREFIXES):
      return full
    mapped=None
    # normalize
    for src, dest in link_map.items():
      if href.rstrip('/') == src.rstrip('/') or href.rstrip('/')+'/' == src:
        mapped=dest; break
    text=re.sub(r'(?is)^<a\b[^>]*>|</a>$','',full)
    if mapped:
      return f'<a href="{mapped}">{text}</a>'
    # keep external absolute
    if 'markmastermasons.com' in urlparse(href).netloc:
      # unmapped internal -> keep as absolute for now
      return f'<a href="{href}">{text}</a>'
    return f'<a href="{href}" target="_blank" rel="noreferrer">{text}</a>'
  return re.sub(r'(?is)<a\b[^>]*>.*?</a>', a_repl, fragment)

def clean_html(fragment, page_url, slug, link_map):
  fragment=re.sub(r'(?is)<script.*?>.*?</script>','',fragment)
  fragment=re.sub(r'(?is)<style.*?>.*?</style>','',fragment)
  fragment=re.sub(r'(?is)<!--.*?-->','',fragment)
  # remove sidebar-like nested menus if accidentally included
  fragment=re.sub(r'(?is)<ul[^>]+class="[^"]*menu[^"]*"[^>]*>.*?</ul>','',fragment)
  # images
  def img_repl(m):
    tag=m.group(0)
    src_m=re.search(r'\ssrc=["\']([^"\']+)["\']', tag, re.I)
    if not src_m:
      # data-src lazy
      src_m=re.search(r'\s(?:data-src|data-lazy-src)=["\']([^"\']+)["\']', tag, re.I)
    if not src_m: return ''
    src=urljoin(page_url, src_m.group(1))
    local=download_asset(src, slug)
    if not local: return f'<!-- missing image {src} -->'
    alt_m=re.search(r'\salt=["\']([^"\']*)["\']', tag, re.I)
    alt=alt_m.group(1) if alt_m else ''
    return f'<img src="{local}" alt="{htmllib.escape(alt)}" loading="lazy" />'
  fragment=re.sub(r'(?is)<img\b[^>]*>', img_repl, fragment)
  fragment=rewrite_links(fragment, page_url, slug, link_map)
  # unwrap noisy vc wrappers but keep inner
  # keep as-is for fidelity; just normalize whitespace a bit
  fragment=re.sub(r'\n{3,}','\n\n', fragment)
  return fragment.strip()

def extract_home_meta(html, page_url, slug):
  countdown=''
  m=re.search(r'(?is)Countdown to our next[^<]{0,160}', html)
  if m: countdown=re.sub(r'\s+',' ', m.group(0)).strip()
  posts=[]
  # blog card pattern from earlier screenshot
  for m in re.finditer(r'(?is)<h5[^>]*>\s*<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>\s*</h5>.*?(?:<p[^>]*>\s*)?(?:in\s+)?(?:<a[^>]*>)?([^<]{2,80})', html):
    href,title,cat=m.groups()
    title=htmllib.unescape(re.sub(r'<[^>]+>','',title)).strip()
    cat=htmllib.unescape(re.sub(r'<[^>]+>','',cat)).strip()
    # find nearest image after match
    window=html[m.end():m.end()+1200]
    im=re.search(r'(?is)<img[^>]+src=["\']([^"\']+)["\']', window)
    img='/images/hero.jpg'
    if im:
      img=download_asset(urljoin(page_url, im.group(1)), slug) or img
    posts.append({'title':title,'category':cat,'image':img,'source':urljoin(page_url,href)})
    if len(posts)>=6: break
  phone=''
  pm=re.search(r'(?:WhatsApp|Telegram)[^\d+]{0,30}([\d+\-\s()]{8,})', html, re.I)
  if pm: phone=pm.group(1).strip()
  address=[]
  for line in re.findall(r'(?is)(?:C/O[^\n<]+|68 Stoke[^\n<]+|London N16[^\n<]+)', html):
    clean=re.sub(r'<[^>]+>','',line).strip()
    if clean and clean not in address: address.append(clean)
  return {'countdown_label':countdown,'posts':posts,'phone':phone,'address_lines':address[:4]}

def build_link_map(slug, pages, base):
  m={}
  for key, path, _ in pages:
    src = base if not path else urljoin(base, path.strip('/') + ('/' if not path.endswith('.html') else ''))
    if path.endswith('.html'):
      src=urljoin(base, path)
    if key=='home':
      dest=f'/sites/{slug}'
    elif key=='contact':
      dest=f'/sites/{slug}/contact'
    elif key.startswith('posts/'):
      dest=f'/sites/{slug}/posts/{key.split("/",1)[1]}'
    else:
      section,page=key.split('/',1)
      dest=f'/sites/{slug}/{section}/{page}'
    m[src.rstrip('/')]=dest
    m[src.rstrip('/')+'/']=dest
    # also www variants
    m[src.replace('https://markmastermasons.com','https://www.markmastermasons.com').rstrip('/')]=dest
    m[src.replace('https://www.markmastermasons.com','https://markmastermasons.com').rstrip('/')]=dest
  return m

summary=[]
results={}
for slug, cfg in SITES.items():
  pages={}
  base=cfg['base']
  link_map=build_link_map(slug, cfg['pages'], base)
  print('SITE', slug)
  for key, path, default_title in cfg['pages']:
    if path.endswith('.html'):
      url=urljoin(base, path)
    elif not path:
      url=base
    else:
      url=urljoin(base, path.strip('/')+'/')
    final,code,data=fetch(url)
    html=decode(data)
    title=extract_title(html) or default_title
    raw=extract_main(html) if key!='home' else ''
    body=''
    meta={}
    if key=='home':
      meta=extract_home_meta(html, final, slug)
      # still try extract for completeness
      raw=extract_main(html)
      body=clean_html(raw, final, slug, link_map) if raw else ''
    else:
      body=clean_html(raw, final, slug, link_map) if raw else ''
    text=re.sub(r'<[^>]+>','',body)
    text=re.sub(r'\s+',' ',text).strip()
    pages[key]={
      'title': title,
      'source': final,
      'status': code,
      'html': body,
      'text_chars': len(text),
      'meta': meta,
    }
    print(f'  {key}: {code} chars={len(text)} title={title[:40]!r}')
    summary.append({'slug':slug,'key':key,'status':code,'chars':len(text),'source':final})
    time.sleep(0.12)
  (CONTENT/f'{slug}.json').write_text(json.dumps({'slug':slug,'base':base,'pages':pages}, ensure_ascii=False, indent=2), encoding='utf-8')
  results[slug]={'pages':len(pages),'with_content':sum(1 for p in pages.values() if p['text_chars']>40)}

(CONTENT/'manifest.json').write_text(json.dumps({'sites':results,'pages':summary}, ensure_ascii=False, indent=2), encoding='utf-8')

meta = {}
for slug in SITES:
  site = json.loads((CONTENT / f'{slug}.json').read_text())
  home = site.get('pages', {}).get('home', {})
  m = home.get('meta') or {}
  meta[slug] = {
    'fullName': home.get('title') or slug,
    'phone': m.get('phone') or '',
    'address_lines': m.get('address_lines') or [],
    'countdown_label': m.get('countdown_label') or '',
    'posts': m.get('posts') or [],
    'page_keys': sorted(site.get('pages', {}).keys()),
  }
(CONTENT / 'site-meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')

print('RESULTS', json.dumps(results, indent=2))
print('media', sum(1 for p in PUBLIC.rglob('*') if p.is_file()))
oration = json.loads((CONTENT / 'gallipoli.json').read_text())['pages']['history/oration']
print('ORATION chars', oration['text_chars'])