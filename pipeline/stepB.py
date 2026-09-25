from ql import *
import re
B=json.load(open('brand_orgs.json')); subs=json.load(open('subs.json'))
d=json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))
BN={b['id']:b['name'] for b in d['brands']}
def short(n): return re.split(r'[ (/-]',n)[0].lower()
orgmap={}  # org qid -> brand id (direct wins)
for bid,qs in B.items():
    for x in qs: orgmap[x]=bid
for bid,qs in B.items():
    s=short(BN[bid])
    for x in qs:
        for o,lab in subs.get(x,{}).items():
            if o not in orgmap and lab and s in lab.lower(): orgmap[o]=bid
brandq={x:bid for bid,qs in B.items() for x in qs}
json.dump(orgmap,open('orgmap.json','w'))
allorgs=list(orgmap)
items={}
for i in range(0,len(allorgs),60):
    vals=' '.join('wd:'+x for x in allorgs[i:i+60])
    rows=q(f'''SELECT ?m ?org ?brand WHERE {{ VALUES ?org {{ {vals} }} {{ ?m wdt:P176 ?org }} UNION {{ ?m wdt:P1716 ?org }} OPTIONAL {{ ?m wdt:P1716 ?brand }} }}''')
    for r in rows:
        m=ent(r['m']); it=items.setdefault(m,{'orgs':set(),'brands':set()})
        it['orgs'].add(ent(r['org']))
        if 'brand' in r: it['brands'].add(ent(r['brand']))
# assign brand
assign={}
for m,it in items.items():
    bs=[brandq[b] for b in it['brands'] if b in brandq]
    if it['brands'] and not bs: continue   # branded as some other brand (e.g., Lexus)
    if bs: assign[m]=bs[0]; continue
    direct=[orgmap[o] for o in it['orgs'] if o in brandq]
    assign[m]=(direct or [orgmap[o] for o in it['orgs']])[0]
json.dump(assign,open('assign.json','w'))
import collections
c=collections.Counter(assign.values())
print(len(items),len(assign)); print(sorted(c.items(),key=lambda x:-x[1])[:40])
