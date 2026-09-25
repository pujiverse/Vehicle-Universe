import json,subprocess,time
UA='VehicleUniverseBuilder/1.0 (https://github.com/pujiverse/Vehicle-Universe)'
PFX='''PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX schema: <http://schema.org/> PREFIX wikibase: <http://wikiba.se/ontology#> PREFIX p: <http://www.wikidata.org/prop/> PREFIX ps: <http://www.wikidata.org/prop/statement/> PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
'''
def q(query,tries=4):
    for i in range(tries):
        r=subprocess.run(['curl','-sS','-m','300','-A',UA,'-H','Accept: application/sparql-results+json','--data-urlencode','query@-','https://qlever.dev/api/wikidata'],input=(PFX+query).encode(),capture_output=True)
        try:
            j=json.loads(r.stdout); return [{k:v['value'] for k,v in b.items()} for b in j['results']['bindings']]
        except Exception as e:
            print('qlever err',r.stdout[:300],flush=True); time.sleep(5*(i+1))
    raise RuntimeError('qlever failed')
ent=lambda v:v.rsplit('/',1)[-1]
