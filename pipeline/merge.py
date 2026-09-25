import json,re,collections,os,urllib.parse
D=json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))
CL=json.load(open('classified.json')); final=CL['final']; fold=CL['fold']
info=json.load(open('info.json')); det=json.load(open('details.json')); BQ=json.load(open('brand_orgs.json'))
W=json.load(open('websites.json')); SUB=json.load(open('subsites.json')); PR=json.load(open('probe.json')) if os.path.exists('probe.json') else {'extra':{},'probe':{}}
LIC=json.load(open('lic.json')) if os.path.exists('lic.json') else {}
TY={t['id']:t for t in D['vehicle_types']}; BR={b['id']:b for b in D['brands']}
def year(s): 
    m=re.match(r'-?(\d{4})',s or ''); return m.group(1) if m else None
def fileof(m): return urllib.parse.unquote(info[m]['img'].rsplit('/',1)[-1]) if 'img' in info.get(m,{}) else None
def fmt(n,unit,dec=0):
    n=float(n); s=f'{n:,.{dec}f}'; return f'{s} {unit}'
def specs(m,t):
    d=det.get(m,{}); pw=[]; perf=[]; cap=[]
    if d.get('P516'): pw.append(', '.join(d['P516'][:3]))
    if d.get('P2109'): kw=float(d['P2109'])/1000; pw.append(f'{kw:,.0f} kW ({kw*1.341:,.0f} hp)')
    if d.get('P2052'): perf.append(f'Top speed {float(d["P2052"])*3.6:,.0f} km/h')
    if d.get('P2073'): perf.append(f'Range {float(d["P2073"])/1000:,.0f} km')
    if d.get('P2043'): cap.append(f'Length {float(d["P2043"]):,.2f} m'.replace('.00 m',' m'))
    if d.get('P2050'): cap.append(f'Wingspan {float(d["P2050"]):,.1f} m')
    if d.get('P2067'): 
        kg=float(d['P2067']); cap.append(f'Mass {kg/1000:,.1f} t' if kg>=10000 else f'Mass {kg:,.0f} kg')
    if d.get('P1083'): cap.append(f'Capacity {float(d["P1083"]):,.0f}')
    if d.get('P1093'): cap.append(f'Gross tonnage {float(d["P1093"]):,.0f}')
    kf=[]
    desc=info[m].get('desc','')
    if desc: kf.append(desc[0].upper()+desc[1:])
    if d.get('P1092'): kf.append(f'{float(d["P1092"]):,.0f} built')
    return {'powertrain':'; '.join(pw) or None,'performance':'; '.join(perf) or None,'capacity_size':'; '.join(cap) or None,'key_features':'; '.join(kf) or None}
AIRSEA={'Air','Water','Space','Rail'}
children=collections.defaultdict(list)
for c,p in fold.items(): children[p].append(c)
def dates(m):
    d=det.get(m,{}); ev=[]
    lab={'P571':'Introduced','P606':'First flight','P729':'Entered service','P580':'Production start','P5204':'Launched on the market','P2754':'Production','P582':'Production end','P730':'Retired from service'}
    for p,l in lab.items():
        y=year(d.get(p))
        if y: ev.append({'year':y,'event':l})
    return ev
def first_year(m):
    d=det.get(m,{}); ys=[year(d.get(p)) for p in ('P606','P571','P580','P5204','P2754','P729')]
    ys=[y for y in ys if y]
    if ys: return min(ys), 'Wikidata'
    mm=re.search(r'\b(built|launched|introduced|produced|from|since|in)\s+(?:in\s+)?(1[89]\d\d|20[0-2]\d)',info[m].get('desc',''),re.I) or re.search(r'\b(1[89]\d\d|20[0-2]\d)\b',info[m].get('desc',''))
    if mm: return mm.group(mm.lastindex), 'description'
    return None,None
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
A_ALL=json.load(open('assign.json'))
products=[]; used_q=set()
# curated first, try to match
byb=collections.defaultdict(dict)
for m,(b,t) in final.items(): byb[(b,t)][norm(info[m]['lab'])]=m
for p in D['products']:
    p=dict(p); p['source']='curated'
    bn=norm(BR[p['brand_id']]['name'].split(' (')[0]); nn=norm(p['name'])
    cands=byb.get((p['brand_id'],p['type_id']),{})
    m=cands.get(nn) or cands.get(bn+nn) or next((q for k,q in cands.items() if k.endswith(nn) and len(nn)>=4),None)
    if not m:
        for q_,bb in A_ALL.items():
            if bb!=p['brand_id'] or q_ in used_q: continue
            lab=info.get(q_,{}).get('lab')
            if lab and norm(lab) in (nn, bn+nn): m=q_; break
    if m and m not in used_q:
        used_q.add(m); p['wikidata']=m; p['wikipedia']=info[m].get('en'); p['image']=fileof(m)
    products.append(p)
for m,(b,t) in final.items():
    if m in used_q: continue
    ty=TY[t]; fy,src=first_year(m); d=det.get(m,{})
    ended=year(d.get('P582')) or year(d.get('P730'))
    status=('Retired' if ty['domain'] in AIRSEA else 'Discontinued') if ended else None
    tl=dates(m)
    for c in children.get(m,[]):
        cy,_=first_year(c); tl.append({'year':cy or 'Year n/a','event':info[c]['lab']})
    tl=sorted({(e['year'],e['event']):e for e in tl}.values(),key=lambda e:e['year'])
    gens=[info[c]['lab'] for c in children.get(m,[])]
    products.append({'id':m,'type_id':t,'brand_id':b,'brand':BR[b]['name'],'name':info[m]['lab'],'first_launched':fy,'first_launched_source':src,
      'latest_generation':gens[-1] if gens else None,'market_status':status,'available_new_today':None,
      'launch_price_usd':None,'launch_price_note':'Launch price not in dataset','current_price_usd':None,'current_price_note':'Current price not in dataset',
      'reference_price_usd':None,'specs':specs(m,t),'timeline':tl,'data_confidence':'Medium','source':'wikidata',
      'wikidata':m,'wikipedia':info[m].get('en'),'image':fileof(m),'model_3d':{'archetype':ty['model_3d_archetype'],'body_color':None,'glb_url':None}})
# sort products within brand/type: curated first then by year
def sk(p): 
    y=p.get('first_launched') or '9999'; y=re.sub(r'\D','',y)[:4] or '9999'
    return (p['source']!='curated', y, p['name'])
products.sort(key=lambda p:(p['type_id'],p['brand_id'])+sk(p))
# brand-type membership
bt=collections.defaultdict(collections.Counter)
for p in products: bt[p['type_id']][p['brand_id']]+=1
types=[]
for t in D['vehicle_types']:
    t=dict(t); orig=[b for b in t['brand_ids']]
    extra=[b for b,_ in bt[t['id']].most_common() if b not in orig]
    t['brand_ids']=orig+extra; types.append(t)
brands=[]
for b in D['brands']:
    b=dict(b); b['vehicle_type_ids']=[t['id'] for t in types if b['id'] in t['brand_ids']]
    w=W.get(b['id'],{}); pr=PR['probe'].get(b['id'],{})
    sites=[{'url':s['v'],'lang':s.get('lang')} for s in w.get('site',[])]
    if not sites and b['id'] in PR['extra']: sites=[{'url':PR['extra'][b['id']],'lang':None,'note':'Added manually; not listed on Wikidata'}]
    subs=[]; seen=set()
    for s in SUB.get(b['id'],[]):
        dom=urllib.parse.urlparse(s['url']).netloc.lower().replace('www.','')
        key=(s['name'],dom)
        if key in seen or not s['name']: continue
        seen.add(key); subs.append(s)
    soc={}
    tmpl={'x':'https://x.com/{}','instagram':'https://www.instagram.com/{}/','facebook':'https://www.facebook.com/{}','youtube':'https://www.youtube.com/channel/{}','youtube_handle':'https://www.youtube.com/@{}','linkedin':'https://www.linkedin.com/company/{}/','tiktok':'https://www.tiktok.com/@{}','weibo':'https://weibo.com/{}','flickr':'https://www.flickr.com/photos/{}/','telegram':'https://t.me/{}','blog':'{}','mastodon':'{}'}
    for k,t_ in tmpl.items():
        for s in w.get(k,[]): soc.setdefault(k,[]).append(t_.format(s['v']) if not s['v'].startswith('http') else s['v'])
    b['websites']={'official':sites,'newsroom':pr.get('newsroom'),'investors':pr.get('investors'),'careers':pr.get('careers'),
        'social':soc,'wikipedia':(w.get('wikipedia') or [{}])[0].get('v'),'group_sites':subs[:40],'group_sites_total':len(subs),'wikidata':(BQ.get(b['id']) or [None])[0]}
    brands.append(b)
meta=dict(D['meta']); meta['counts']={'domains':5,'vehicle_types':len(types),'brands':len(brands),'products':len(products)}
meta['sources']={'curated':'Original Vehicle Universe dataset (prices, status, specs)','wikidata':'Wikidata (CC0), via QLever mirror, Sept 2026','images':'Wikimedia Commons (free licences, credited per image)'}
out={'meta':meta,'vehicle_types':types,'brands':brands,'products':products}
json.dump(out,open('vu_data.json','w'),separators=(',',':'),ensure_ascii=False)
print(len(products),'products;',sum(1 for p in products if p.get('image')),'with image file;',os.path.getsize('vu_data.json')//1024,'KB')
print('curated matched',sum(1 for p in products if p['source']=='curated' and p.get('wikidata')))
print('no year',sum(1 for p in products if not p.get('first_launched')))
