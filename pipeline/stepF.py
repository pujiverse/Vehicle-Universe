from ql import *
A=json.load(open('assign.json')); ms=list(A); info={}
for i in range(0,len(ms),1000):
    vals=' '.join('wd:'+x for x in ms[i:i+1000])
    for r in q(f'''SELECT ?m ?lab ?desc ?en ?img WHERE {{ VALUES ?m {{ {vals} }} OPTIONAL {{ ?m rdfs:label ?lab FILTER(LANG(?lab)="en") }} OPTIONAL {{ ?m schema:description ?desc FILTER(LANG(?desc)="en") }} OPTIONAL {{ ?en schema:about ?m ; schema:isPartOf <https://en.wikipedia.org/> }} OPTIONAL {{ ?m wdt:P18 ?img }} }}'''):
        m=ent(r['m']); it=info.setdefault(m,{})
        for k in ('lab','desc','en','img'):
            if k in r and k not in it: it[k]=r[k]
json.dump(info,open('info.json','w'))
print(len(info), sum(1 for v in info.values() if 'img' in v),'with image', sum(1 for v in info.values() if 'en' in v),'with enwiki')
