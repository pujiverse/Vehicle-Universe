from ql import *
from roots import R
import json
MISS=['VT16','VT17','VT18','VT19','VT36','VT37','VT38','VT39','VT56','VT57']
roots={k:v.split() for k,v in R}
out=[]
for t in MISS:
    vals=' '.join('wd:'+x for x in roots[t])
    rows=q(f'''SELECT ?m (SAMPLE(?l) AS ?lab) (SAMPLE(?d) AS ?desc) (GROUP_CONCAT(DISTINCT ?mfl;separator=", ") AS ?mfrs) (SAMPLE(?mf) AS ?mf1)
      (MIN(?inc) AS ?i) (MIN(?svc) AS ?s) (MIN(?st) AS ?p) (SAMPLE(?w) AS ?web) WHERE {{
      VALUES ?r {{ {vals} }} ?m (wdt:P31|wdt:P279)/wdt:P279* ?r .
      ?m rdfs:label ?l FILTER(LANG(?l)="en")
      OPTIONAL {{ ?m schema:description ?d FILTER(LANG(?d)="en") }}
      OPTIONAL {{ ?m wdt:P176 ?mf . ?mf rdfs:label ?mfl FILTER(LANG(?mfl)="en") }}
      OPTIONAL {{ ?m wdt:P571 ?inc }} OPTIONAL {{ ?m wdt:P729 ?svc }} OPTIONAL {{ ?m wdt:P580 ?st }} OPTIONAL {{ ?m wdt:P856 ?w }}
    }} GROUP BY ?m''')
    mfs=list({r['mf1'] for r in rows if 'mf1' in r})
    info={}
    for i in range(0,len(mfs),500):
        v=' '.join('wd:'+ent(x) for x in mfs[i:i+500])
        for r in q(f'''SELECT ?mf (SAMPLE(?l) AS ?lab) (GROUP_CONCAT(DISTINCT ?cl;separator=", ") AS ?c) (SAMPLE(?w) AS ?web) WHERE {{ VALUES ?mf {{ {v} }} OPTIONAL {{ ?mf rdfs:label ?l FILTER(LANG(?l)="en") }} OPTIONAL {{ ?mf wdt:P17 ?cc . ?cc rdfs:label ?cl FILTER(LANG(?cl)="en") }} OPTIONAL {{ ?mf wdt:P856 ?w }} }} GROUP BY ?mf'''):
            info[r['mf']]=r
    for r in rows:
        mf=info.get(r.get('mf1'),{})
        yrs=[(k,r[k][:4]) for k,lab in (('s','Service entry'),('i','Inception'),('p','Production start')) if r.get(k)]
        basis={'s':'Service entry','i':'Inception','p':'Production start'}
        y=None;b='Not recorded'
        for k,v in yrs:
            if v.lstrip('-').isdigit(): y=int(v); b=basis[k]; break
        out.append({'type':t,'brand':mf.get('lab') or 'Manufacturer not recorded','country':mf.get('c'),'brand_site':mf.get('web'),'model':r['lab'],'desc':r.get('desc'),'year':y,'basis':b,
          'dates':'; '.join(f"{basis[k]}: {v}" for k,v in yrs) or '-','price':None,'unit':None,'mfrs':r.get('mfrs') or '-','model_site':r.get('web'),'qid':ent(r['m']),'source':'generated'})
    print(t,len(rows),flush=True)
json.dump(out,open('recs_missing.json','w'),ensure_ascii=False)
