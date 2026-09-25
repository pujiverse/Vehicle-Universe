from ql import *
D=json.load(open('vu_full.json'))
qs=[p['wikidata'] for p in D['products'] if p.get('wikidata') and not p.get('image')]
res={}
for i in range(0,len(qs),2000):
    vals=' '.join('wd:'+x for x in qs[i:i+2000])
    for r in q(f'''SELECT ?m (SAMPLE(?img) AS ?i) (SAMPLE(?en) AS ?e) WHERE {{ VALUES ?m {{ {vals} }} OPTIONAL {{ ?m wdt:P18 ?img }} OPTIONAL {{ ?en schema:about ?m ; schema:isPartOf <https://en.wikipedia.org/> }} }} GROUP BY ?m'''):
        res[ent(r['m'])]={'img':r.get('i'),'en':r.get('e')}
json.dump(res,open('p18.json','w'))
print(len(qs),sum(1 for v in res.values() if v['img']),'img',sum(1 for v in res.values() if v['en']),'enwiki')
