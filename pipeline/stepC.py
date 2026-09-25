from ql import *
A=json.load(open('assign.json')); ms=list(A)
cls={}
for i in range(0,len(ms),1500):
    vals=' '.join('wd:'+x for x in ms[i:i+1500])
    for r in q(f'''SELECT ?m ?p ?c WHERE {{ VALUES ?m {{ {vals} }} {{ ?m wdt:P31 ?c BIND("31" AS ?p) }} UNION {{ ?m wdt:P279 ?c BIND("279" AS ?p) }} }}'''):
        cls.setdefault(ent(r['m']),[]).append((r['p'],ent(r['c'])))
json.dump(cls,open('cls.json','w'))
import collections
cnt=collections.Counter(c for v in cls.values() for p,c in v)
top=[c for c,_ in cnt.most_common(700)]
labs={}
for i in range(0,len(top),300):
    vals=' '.join('wd:'+x for x in top[i:i+300])
    for r in q(f'''SELECT ?c ?l WHERE {{ VALUES ?c {{ {vals} }} ?c rdfs:label ?l FILTER(LANG(?l)="en") }}'''): labs[ent(r['c'])]=r['l']
json.dump({c:[labs.get(c,''),cnt[c]] for c in top},open('topcls.json','w'),indent=0)
print(len(cls),'items with classes; no class:',len(ms)-len(cls))
for c in top[:700]: print(c,cnt[c],labs.get(c,''))
