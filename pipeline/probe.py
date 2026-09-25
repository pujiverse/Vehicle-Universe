import json,subprocess,urllib.parse
from concurrent.futures import ThreadPoolExecutor
W=json.load(open('websites.json'))
EXTRA={'B008':'https://pedicab.com/','B037':'https://www.landrover.com/','B066':'https://www.hagie.com/','B086':'https://www.progressrail.com/','B089':'https://www.hobie.com/','B092':'https://star-board.com/','B094':'https://www.searay.com/','B117':'https://flyozone.com/'}
PATHS={'newsroom':['newsroom','news','press','media','en/newsroom','en/news','en/media','en/press','en/newsroom/','company/news','media-center','press-releases'],
'investors':['investors','investor-relations','en/investors','en/investor-relations','ir','en/ir','investor','corporate/investors'],
'careers':['careers','en/careers','jobs','career','en/career','company/careers','about/careers']}
def fetch(u):
    r=subprocess.run(['curl','-s','-L','-m','20','-o','/dev/null','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','-w','%{http_code} %{url_effective}',u],capture_output=True,text=True)
    p=r.stdout.split(' ',1); return (p[0],p[1] if len(p)>1 else '')
def probe(bid):
    sites=[s['v'] for s in W.get(bid,{}).get('site',[])] or ([EXTRA[bid]] if bid in EXTRA else [])
    if not sites: return bid,{}
    base=sites[0]; pu=urllib.parse.urlparse(base); root=f'{pu.scheme}://{pu.netloc}/'
    code,home=fetch(root); out={'_home':home if code=='200' else None,'_code':code}
    homep=urllib.parse.urlparse(home).path.rstrip('/')
    for k,ps in PATHS.items():
        for p in ps:
            c,f=fetch(root+p)
            fp=urllib.parse.urlparse(f).path.rstrip('/').lower()
            if c=='200' and fp and fp!=homep and any(w in fp for w in (p.split('/')[-1].rstrip('/'),k[:5],'news','press','media','invest','career','job')):
                out[k]=f; break
    return bid,out
d=json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))
res={}
with ThreadPoolExecutor(8) as ex:
    for bid,o in ex.map(probe,[b['id'] for b in d['brands']]):
        res[bid]=o; print(bid,o,flush=True)
json.dump({'extra':EXTRA,'probe':res},open('probe.json','w'),indent=0)
print('DONE')
