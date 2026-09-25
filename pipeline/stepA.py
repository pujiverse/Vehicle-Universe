from ql import *
B=json.load(open('brand_orgs.json'))
allq={q for v in B.values() for q in v}
vals=' '.join('wd:'+x for x in allq)
rows=q(f'''SELECT ?b ?org ?orgLab WHERE {{ VALUES ?b {{ {vals} }} {{ ?org wdt:P749 ?b }} UNION {{ ?b wdt:P355 ?org }} OPTIONAL {{ ?org rdfs:label ?orgLab FILTER(LANG(?orgLab)="en") }} }}''')
subs={}
for r in rows: subs.setdefault(ent(r['b']),{})[ent(r['org'])]=r.get('orgLab','')
json.dump(subs,open('subs.json','w'),indent=0)
for bid,qs in B.items():
    s={}
    for x in qs: s.update(subs.get(x,{}))
    print(bid,qs,len(s),'; '.join(list(s.values())[:12]))
