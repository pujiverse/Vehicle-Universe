import json,subprocess,urllib.parse
from concurrent.futures import ThreadPoolExecutor
PJ=json.load(open('probe.json')); W=json.load(open('websites.json'))
def fetch(u):
    r=subprocess.run(['curl','-s','-L','-m','15','-o','/dev/null','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','-w','%{http_code} %{url_effective}',u],capture_output=True,text=True)
    p=r.stdout.split(' ',1); return (p[0],p[1] if len(p)>1 else '')
SUB={'newsroom':['newsroom','news','media','press','pressroom'],'investors':['investors','investor','ir'],'careers':['careers','jobs','career']}
def dom(bid):
    s=[x['v'] for x in W.get(bid,{}).get('site',[])] or ([PJ['extra'][bid]] if bid in PJ['extra'] else [])
    if not s: return None
    n=urllib.parse.urlparse(s[0]).netloc.lower().split(':')[0]
    parts=n.split('.'); 
    if parts[0] in ('www','global','english','en'): parts=parts[1:]
    return '.'.join(parts)
def run(bid):
    o=PJ['probe'].get(bid,{}); d=dom(bid); add={}
    if not d: return bid,add
    for k,subs in SUB.items():
        if o.get(k): continue
        for s in subs:
            c,f=fetch(f'https://{s}.{d}/')
            if c=='200' and urllib.parse.urlparse(f).netloc.lower().startswith(s+'.'): add[k]=f; break
    return bid,add
with ThreadPoolExecutor(10) as ex:
    for bid,add in ex.map(run,list(PJ['probe'])):
        PJ['probe'][bid].update(add)
        if add: print(bid,add,flush=True)
json.dump(PJ,open('probe.json','w'),indent=0)
print({k:sum(1 for v in PJ['probe'].values() if v.get(k)) for k in ('newsroom','investors','careers')})
