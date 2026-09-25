from ql import *
C=json.load(open('classified.json')); ms=list(C['final'])+list(C['fold'])
PFX2='PREFIX psn: <http://www.wikidata.org/prop/statement/value-normalized/> '
DATES=['P571','P606','P729','P580','P582','P730','P5204','P2754']
QTY=['P2067','P2043','P2050','P2052','P2109','P2073','P1093']
NUM=['P1083','P1092']
det={}
for i in range(0,len(ms),700):
    vals=' '.join('wd:'+x for x in ms[i:i+700])
    parts=[f'{{ ?m wdt:{p} ?v BIND("{p}" AS ?p) }}' for p in DATES+NUM]
    parts+=[f'{{ ?m p:{p} ?st . ?st psn:{p} ?n . ?n wikibase:quantityAmount ?v BIND("{p}" AS ?p) }}' for p in QTY]
    parts+=['{ ?m wdt:P516 ?e . ?e rdfs:label ?v FILTER(LANG(?v)="en") BIND("P516" AS ?p) }']
    rows=q(PFX2+f'SELECT ?m ?p ?v WHERE {{ VALUES ?m {{ {vals} }} {" UNION ".join(parts)} }}')
    for r in rows:
        m=ent(r['m']); dd=det.setdefault(m,{}); p=r['p']; v=r['v']
        if p in DATES:
            v=v[:10]
            if p in ('P582','P730'): dd[p]=max(dd.get(p,v),v)
            else: dd[p]=min(dd.get(p,v),v)
        elif p=='P516': dd.setdefault(p,[]); (v not in dd[p]) and dd[p].append(v)
        else: dd.setdefault(p,v)
    print(i,len(det),flush=True)
json.dump(det,open('details.json','w'))
