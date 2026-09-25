import json,urllib.parse,time,os,re,html
from wd import get
C=json.load(open('classified.json'))['final']; info=json.load(open('info.json'))
files=sorted({urllib.parse.unquote(info[m]['img'].rsplit('/',1)[-1]) for m in C if 'img' in info.get(m,{})})
L=json.load(open('lic.json')) if os.path.exists('lic.json') else {}
files=[f for f in files if f not in L]
print('todo',len(files),flush=True)
def clean(s): return html.unescape(re.sub('<[^>]+>','',s or '')).strip()
for i in range(0,len(files),50):
    ch=files[i:i+50]
    try:
        r=json.loads(get('https://commons.wikimedia.org/w/api.php',{'action':'query','titles':'|'.join('File:'+f for f in ch),'prop':'imageinfo','iiprop':'extmetadata','iiextmetadatafilter':'Artist|LicenseShortName|LicenseUrl|Credit|AttributionRequired','format':'json','formatversion':2}))
    except Exception as e:
        print('fail',i,e,flush=True); time.sleep(60); continue
    norm={n['to']:n['from'] for n in r['query'].get('normalized',[])}
    for p in r['query']['pages']:
        t=p['title']; orig=norm.get(t,t)[5:]
        md=(p.get('imageinfo') or [{}])[0].get('extmetadata',{})
        L[orig]={'artist':clean(md.get('Artist',{}).get('value'))[:160],'license':md.get('LicenseShortName',{}).get('value',''),'url':md.get('LicenseUrl',{}).get('value','')}
    json.dump(L,open('lic.json','w'))
    print(i,flush=True); time.sleep(15)
print('DONE')
