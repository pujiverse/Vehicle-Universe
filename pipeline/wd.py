import json,time,subprocess,urllib.parse
UA='VehicleUniverseBuilder/1.0 (https://github.com/pujiverse/Vehicle-Universe)'
def get(url,params=None,retries=5,data=None):
    if params: url+='?'+urllib.parse.urlencode(params)
    for i in range(retries):
        cmd=['curl','-sS','-m','120','-A',UA,'-w','\n%{http_code}',url]
        if data is not None: cmd=['curl','-sS','-m','120','-A',UA,'-w','\n%{http_code}','--data-urlencode','query@-','-d','format=json',url]
        r=subprocess.run(cmd,capture_output=True,input=data.encode() if data else None)
        body,_,code=r.stdout.rpartition(b'\n')
        if code==b'200': return body
        print('retry',code,url[:70],flush=True); time.sleep(45*(i+1))
    raise RuntimeError('failed '+url[:120])
def sparql(q):
    return json.loads(get('https://query.wikidata.org/sparql',data=q))['results']['bindings']
def api(params):
    params=dict(params,format='json'); return json.loads(get('https://www.wikidata.org/w/api.php',params))
