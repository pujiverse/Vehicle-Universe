import json,re,collections,hashlib,colorsys
W='../wd/'
D=json.load(open(W+'vu_data.json'))
R=json.load(open('recs.json'))+json.load(open('recs_missing.json'))
titles=json.load(open(W+'titles.json')); subs=json.load(open(W+'subs.json')); BQ=json.load(open(W+'brand_orgs.json')); orgmap=json.load(open(W+'orgmap.json'))
norm=lambda s:re.sub(r'[^a-z0-9]','',(s or '').lower())
B={b['id']:b for b in D['brands']}; T={t['id']:t for t in D['vehicle_types']}
name2b={}
for b in D['brands']:
    for n in [b['name'],b['name'].split(' (')[0],titles.get(b['id'],'').split(' (')[0],titles.get(b['id'],'')]:
        if n: name2b.setdefault(norm(n),b['id'])
for bid,qs in BQ.items():
    for x in qs:
        for o,l in subs.get(x,{}).items():
            if o in orgmap and l: name2b.setdefault(norm(l),orgmap[o])
name2b.update({norm('Kawasaki Motors'):'B021',norm('Yamaha Motor Company'):'B014',norm('Hyundai Motor Company'):'B030',norm('BYD Auto'):'B031',norm('Mercedes-Benz Group'):'B028',norm('Daimler Truck'):'B028',norm('Ford Motor Company'):'B035',norm('General Motors'):'B041'})
prods={p.get('wikidata') or p['id']:p for p in D['products']}
byq=collections.OrderedDict()
for r in R: byq.setdefault(r['qid'],[]).append(r)
stats=collections.Counter(); newbrands={}
def color(name):
    h=int(hashlib.md5(name.encode()).hexdigest()[:4],16)%360; return f'hsl({h}, 55%, 42%)'
def mono(name):
    w=[x for x in re.split(r'[^A-Za-z0-9]+',name) if x]
    return ((w[0][0]+w[1][0]) if len(w)>1 else (w[0][:2] if w else '?')).upper()
def brand_for(r):
    k=norm(r['brand'])
    if k in name2b: return name2b[k]
    if r['brand']=='Manufacturer not recorded': k='__unknown__'
    if k not in newbrands:
        nid='B%04d'%(1000+len(newbrands))
        nm=r['brand'] if k!='__unknown__' else 'Manufacturer not recorded'
        site=r.get('brand_site'); site=site if site and site.startswith('http') else None
        newbrands[k]={'id':nid,'slug':k,'name':nm,'parent_company':None,'founded_year':None,'founded_detail':None,'founders':None,
          'headquarters':(r.get('country') if r.get('country') and r.get('country')!='-' else None),'first_vehicle_or_product':None,'evolution_milestones':[],
          'availability_by_region':{},'key_markets_note':None,'company_status':None,'vehicle_type_ids':[],
          'logo':{'image_url':None,'monogram':'?' if k=='__unknown__' else mono(nm),'monogram_color':'hsl(250, 10%, 40%)' if k=='__unknown__' else color(nm)},
          'websites':{'official':[{'url':site,'lang':None}] if site else [],'newsroom':None,'investors':None,'careers':None,'social':{},'wikipedia':None,'group_sites':[],'group_sites_total':0,'wikidata':None},
          'source':'spreadsheet' if k!='__unknown__' else 'placeholder'}
    return newbrands[k]['id']
def timeline_from(dates):
    ev=[]
    for part in (dates or '').split(';'):
        if ':' in part:
            lab,v=part.split(':',1); v=v.strip()
            for y in re.findall(r'-?\d{4}',v)[:1]: ev.append({'year':y,'event':lab.strip()})
    return ev
for q,rs in byq.items():
    r0=rs[0]
    site=next((r['model_site'] for r in rs if r.get('model_site') and str(r['model_site']).startswith('http')),None)
    yr=next((r['year'] for r in rs if isinstance(r['year'],int)),None)
    basis=next((r['basis'] for r in rs if isinstance(r['year'],int)),None)
    pr=next((r for r in rs if r.get('price') is not None),None)
    if q in prods:
        p=prods[q]; stats['matched']+=1
        if site and not p.get('model_website'): p['model_website']=site; stats['fill_site']+=1
        if yr and not p.get('first_launched'): p['first_launched']=str(yr); p['first_launched_source']=basis; stats['fill_year']+=1
        tl=timeline_from(r0['dates']); have={(e['year'],e['event']) for e in p.get('timeline') or []}
        add=[e for e in tl if (e['year'],e['event']) not in have and not any(x['year']==e['year'] for x in p.get('timeline') or [])]
        if add: p['timeline']=sorted((p.get('timeline') or [])+add,key=lambda e:e['year']); stats['fill_timeline']+=1
        if pr and p.get('launch_price_usd') is None and p.get('current_price_usd') is None:
            p['recorded_price']={'amount':pr['price'],'unit':pr['unit']}; stats['fill_price']+=1
        if r0.get('mfrs') and r0['mfrs']!='-' and not p.get('manufacturers'): p['manufacturers']=r0['mfrs']
        if r0['type']!=p['type_id']: stats['type_differs']+=1
        continue
    bid=brand_for(r0); t=r0['type']
    desc=r0.get('desc') or None
    p={'id':q,'type_id':t,'brand_id':bid,'brand':(B.get(bid) or next(v for v in newbrands.values() if v['id']==bid))['name'],'name':r0['model'],
       'first_launched':str(yr) if yr else None,'first_launched_source':basis,'latest_generation':None,'market_status':None,'available_new_today':None,
       'launch_price_usd':None,'launch_price_note':'Launch price not in dataset','current_price_usd':None,'current_price_note':'Current price not in dataset','reference_price_usd':None,
       'specs':{'powertrain':None,'performance':None,'capacity_size':None,'key_features':(desc[0].upper()+desc[1:]) if desc else None},
       'timeline':timeline_from(r0['dates']),'data_confidence':'Medium','source':r0.get('source','spreadsheet'),'wikidata':q,'wikipedia':None,'image':None,
       'model_website':site,'manufacturers':r0['mfrs'] if r0.get('mfrs') not in (None,'-') else None,
       'model_3d':{'archetype':T[t]['model_3d_archetype'],'body_color':None,'glb_url':None}}
    if pr:
        if pr['unit']=='United States dollar': p['launch_price_usd']=pr['price']; p['launch_price_note']='Recorded price in Wikidata (date not stated)'
        else: p['recorded_price']={'amount':pr['price'],'unit':pr['unit']}
    prods[q]=p; stats['new']+=1
products=list(prods.values())
brands=D['brands']+list(newbrands.values())
bt=collections.defaultdict(collections.Counter)
for p in products: bt[p['type_id']][p['brand_id']]+=1
orig={t['id']:t['brand_ids'] for t in D['vehicle_types']}
for t in D['vehicle_types']:
    o=[b for b in orig[t['id']] if bt[t['id']][b]]  # keep order
    o+= [b for b in orig[t['id']] if b not in o]
    t['brand_ids']=o+[b for b,_ in bt[t['id']].most_common() if b not in o]
for b in brands: b['vehicle_type_ids']=[t['id'] for t in D['vehicle_types'] if b['id'] in t['brand_ids']]
D['products']=products; D['brands']=brands
D['meta']['counts']={'domains':5,'vehicle_types':57,'brands':len(brands),'products':len(products)}
D['meta']['sources']['spreadsheets']='Vehicle Brands & Models spreadsheets (Wikidata export, Sept 2026) supplied by the site owner'
json.dump(D,open('vu_full.json','w'),separators=(',',':'),ensure_ascii=False)
print(stats,'brands',len(brands),'new brands',len(newbrands),'products',len(products))
import os;print(os.path.getsize('vu_full.json')//1e6,'MB')
