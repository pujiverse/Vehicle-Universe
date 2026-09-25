from ql import *
B=json.load(open('brand_orgs.json'))
qs={x:b for b,v in B.items() for x in v}
vals=' '.join('wd:'+x for x in qs)
PROPS={'P856':'site','P2002':'x','P2003':'instagram','P2013':'facebook','P2397':'youtube','P4264':'linkedin','P7085':'tiktok','P1581':'blog','P3267':'flickr','P11245':'youtube_handle','P4033':'mastodon','P12361':'bluesky','P3789':'telegram','P3579':'weibo','P9269':'wechat'}
rows=q(f'''SELECT ?b ?p ?v ?lang ?langlab WHERE {{ VALUES ?b {{ {vals} }} VALUES ?p {{ {' '.join('wdt:'+p for p in PROPS)} }} ?b ?p ?v .
 OPTIONAL {{ ?b p:P856 ?st . ?st ps:P856 ?v ; pq:P407 ?lang . ?lang rdfs:label ?langlab FILTER(LANG(?langlab)="en") }} }}''')
W={}
for r in rows:
    b=qs[ent(r['b'])]; p=ent(r['p']); k=PROPS[p]
    lst=W.setdefault(b,{}).setdefault(k,[])
    e={'v':r['v']}
    if k=='site' and 'langlab' in r: e['lang']=r['langlab']
    if not any(x['v']==e['v'] for x in lst): lst.append(e)
    elif 'lang' in e:
        for x in lst:
            if x['v']==e['v'] and 'lang' not in x: x['lang']=e['lang']
# wikipedia article + parent org sites
rows=q(f'''SELECT ?b ?en WHERE {{ VALUES ?b {{ {vals} }} ?en schema:about ?b ; schema:isPartOf <https://en.wikipedia.org/> }}''')
for r in rows: W.setdefault(qs[ent(r['b'])],{}).setdefault('wikipedia',[]).append({'v':r['en']})
json.dump(W,open('websites.json','w'),indent=0)
import collections
print(len(W),collections.Counter(k for v in W.values() for k in v))
print(json.dumps(W['B026'],indent=0)[:1500])
