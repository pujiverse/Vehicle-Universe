import json,subprocess,urllib.parse,os,io,sys,time
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
C=json.load(open('classified.json'))['final']; info=json.load(open('info.json'))
import sys
if len(sys.argv)>1:
    EX=json.load(open(sys.argv[1])); C={m:('X','X') for m,_ in EX}; info={m:{'img':'x/'+u,'en':1} for m,u in EX}
os.makedirs('imgs',exist_ok=True)
todo=[(m,info[m]['img']) for m in C if 'img' in info.get(m,{}) and not os.path.exists(f'imgs/{m}.webp')]
# priority: first 3 items with enwiki per (brand,type), then enwiki items, then rest
import collections
seen=collections.Counter(); pr={}
for m,u in sorted(todo,key=lambda x:('en' not in info[x[0]], x[0])):
    k=tuple(C[m]); seen[k]+=1; pr[m]=(0 if seen[k]<=3 else 1 if 'en' in info[m] else 2)
todo.sort(key=lambda x:pr[x[0]]) if len(sys.argv)<=1 else None
print('todo',len(todo),flush=True)
UA='VehicleUniverseBuilder/1.0 (https://github.com/pujiverse/Vehicle-Universe)'
fails=[]
def one(a):
    m,u=a; fn=urllib.parse.unquote(u.rsplit('/',1)[-1])
    if fn.lower().endswith(('.svg','.tif','.tiff','.webm','.ogv','.pdf','.djvu')) and not fn.lower().endswith('.svg'): pass
    import hashlib
    fn=fn.replace(' ','_'); h=hashlib.md5(fn.encode()).hexdigest()
    ext='.png' if fn.lower().endswith(('.svg','.tif','.tiff')) else ''
    url=f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{urllib.parse.quote(fn)}/330px-{urllib.parse.quote(fn)}{ext}'
    for i in range(8):
        r=subprocess.run(['curl','-sL','-m','60','-A',UA,'-w','\n%{http_code}',url],capture_output=True)
        body,_,code=r.stdout.rpartition(b'\n')
        if code==b'200':
            try:
                im=Image.open(io.BytesIO(body)); im=im.convert('RGB'); im.thumbnail((480,360))
                im.save(f'imgs/{m}.webp','WEBP',quality=60,method=6); return
            except Exception as e: fails.append((m,'decode')); return
        if code in (b'429',b'503'): time.sleep(11+5*i)
        else: fails.append((m,code.decode())); return
    fails.append((m,'retries'))
n=0
with ThreadPoolExecutor(2) as ex:
    for _ in ex.map(one,todo):
        n+=1
        if n%200==0: print(n,len(fails),flush=True)
json.dump(fails,open('imgfails.json','w')); print('DONE',len(fails))
