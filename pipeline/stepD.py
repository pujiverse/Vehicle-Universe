from ql import *
from roots import *
A=json.load(open('assign.json')); ms=list(A)
roots=' '.join('wd:'+x for x in set(ROOT)|set(EXCL))
anc={}
for i in range(0,len(ms),800):
    vals=' '.join('wd:'+x for x in ms[i:i+800])
    for r in q(f'''SELECT DISTINCT ?m ?r WHERE {{ VALUES ?m {{ {vals} }} VALUES ?r {{ {roots} }} ?m (wdt:P31|wdt:P279)/wdt:P279* ?r }}'''):
        anc.setdefault(ent(r['m']),[]).append(ent(r['r']))
    print(i,len(anc),flush=True)
json.dump(anc,open('anc.json','w'))
