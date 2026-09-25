from ql import *
B=json.load(open('brand_orgs.json')); subs=json.load(open('subs.json'))
d=json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))
S={}
for bid,qs in B.items():
    for x in qs:
        for o,l in subs.get(x,{}).items(): S[o]=(bid,l)
vals=' '.join('wd:'+x for x in S)
rows=q(f'''SELECT ?o ?site ?cl WHERE {{ VALUES ?o {{ {vals} }} ?o wdt:P856 ?site . OPTIONAL {{ ?o wdt:P17 ?c . ?c rdfs:label ?cl FILTER(LANG(?cl)="en") }} }}''')
R={}
for r in rows:
    bid,l=S[ent(r['o'])]
    R.setdefault(bid,[]).append({'name':l,'url':r['site'],'country':r.get('cl','')})
json.dump(R,open('subsites.json','w'),indent=0)
for bid,v in R.items(): print(bid,len(v),'; '.join(f"{x['name']}={x['url']}" for x in v[:6]))
