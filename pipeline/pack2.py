import json,os,io,base64,collections,glob
from PIL import Image
S='/tmp/claude-0/-home-claude/3e5d0190-f1ae-56ea-907f-0e19d9663d06/scratchpad/'
WD=S+'wd/'; OUT=S+'site/pub/'
for d in ('data','data/p','img'): os.makedirs(OUT+d,exist_ok=True)
D=json.load(open(S+'xl/vu_full.json')); LIC=json.load(open(WD+'lic.json')) if os.path.exists(WD+'lic.json') else {}
cache_dir=S+'site/enc/'; os.makedirs(cache_dir,exist_ok=True)
def enc(path,box,q):
    im=Image.open(path); im.thumbnail(box); b=io.BytesIO(); im.save(b,'WEBP',quality=q,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
def encc(qid):
    c=cache_dir+qid+'.txt'
    if os.path.exists(c): return open(c).read()
    v=enc(WD+f'imgs/{qid}.webp',(360,270),55); open(c,'w').write(v); return v
bytype=collections.defaultdict(list)
for p in D['products']:
    p.pop('img_chunk',None)
    if p.get('image'):
        l=LIC.get(p['image']); p['image_credit']={'artist':l['artist'],'license':l['license'],'license_url':l['url']} if l else None
    q=p.get('wikidata')
    if q and os.path.exists(WD+f'imgs/{q}.webp'): bytype[p['type_id']].append(p)
REG=S+'site/chunkreg.json'
reg=json.load(open(REG)) if os.path.exists(REG) else {'batch':0,'map':{}}
reg['batch']+=1; bn=reg['batch']
for t,ps in bytype.items():
    fresh=[p for p in ps if p['id'] not in reg['map']]
    cur={}; cursize=0; idx=1
    for p in fresh:
        v=encc(p['wikidata'])
        if cursize+len(v)>3_500_000 and cur:
            json.dump(cur,open(OUT+f'img/{t}-b{bn}-{idx}.json','w')); idx+=1; cur={}; cursize=0
        cur[p['id']]=v; cursize+=len(v); reg['map'][p['id']]=f'{t}-b{bn}-{idx}'
    if cur: json.dump(cur,open(OUT+f'img/{t}-b{bn}-{idx}.json','w'))
    for p in ps: p['img_chunk']=reg['map'][p['id']]
json.dump(reg,open(REG,'w'))
# per-type product files + stats
ORIG={t['id']:set(t['brand_ids']) for t in json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))['vehicle_types']}
import re
def sk(p):
    y=re.sub(r'\D','',p.get('first_launched') or '')[:4] or '9999'
    return (p['source']!='curated', not p.get('img_chunk'), not p.get('wikipedia'), y, p['name'])
byT=collections.defaultdict(list)
for p in D['products']: byT[p['type_id']].append(p)
search=[]; tiles={}
old_tiles=json.load(open(OUT+'data/tiles.json')) if os.path.exists(OUT+'data/tiles.json') else {}
for t in D['vehicle_types']:
    ps=sorted(byT[t['id']],key=lambda p:(p['brand_id'],)+sk(p))
    for p in ps: p.pop('model_3d',None) if False else None
    json.dump(ps,open(OUT+f"data/p/{t['id']}.json",'w'),separators=(',',':'),ensure_ascii=False)
    refs=[p['reference_price_usd'] for p in ps if p.get('reference_price_usd') is not None]
    bc=collections.Counter(p['brand_id'] for p in ps)
    t['stats']={'brands':len(t['brand_ids']),'products':len(ps),'min':min(refs) if refs else None,'max':max(refs) if refs else None,
      'onSale':sum(1 for p in ps if p.get('available_new_today') is True),'unknown':sum(1 for p in ps if p.get('market_status') is None),
      'photos':sum(1 for p in ps if p.get('img_chunk')),'brand_counts':dict(bc)}
    for p in ps: search.append([p['id'],p['name'],p['brand_id'],p['type_id']])
    if t['id'] in old_tiles: tiles[t['id']]=old_tiles[t['id']]
    else:
        c=[p for p in ps if p.get('img_chunk')]
        c.sort(key=lambda p:(p['source']!='curated',p['brand_id'] not in ORIG[t['id']],not p.get('wikipedia')))
        if c: p=c[0]; tiles[t['id']]={'src':enc(WD+f"imgs/{p['wikidata']}.webp",(320,200),55),'product':p['id'],'name':p['name']}
core={'meta':D['meta'],'vehicle_types':D['vehicle_types'],'brands':D['brands']}
json.dump(core,open(OUT+'data/core.json','w'),separators=(',',':'),ensure_ascii=False)
json.dump(search,open(OUT+'data/search.json','w'),separators=(',',':'),ensure_ascii=False)
json.dump(tiles,open(OUT+'data/tiles.json','w'))
if os.path.exists(OUT+'data/vu_data.json'): os.remove(OUT+'data/vu_data.json')
sz=lambda f:round(os.path.getsize(OUT+f)/1e6,1)
big=max(os.listdir(OUT+'data/p'),key=lambda f:os.path.getsize(OUT+'data/p/'+f))
print('core',sz('data/core.json'),'MB search',sz('data/search.json'),'MB biggest type file',big,sz('data/p/'+big),'MB; photos',sum(len(v) for v in bytype.values()),'tiles',len(tiles))
