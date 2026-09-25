import json,collections,re
from roots import *
A=json.load(open('assign.json')); anc=json.load(open('anc.json')); cls=json.load(open('cls.json')); info=json.load(open('info.json'))
d=json.load(open('/root/.claude/uploads/3e5d0190-f1ae-56ea-907f-0e19d9663d06/531e8e55-vehicle_universe_data.json'))
BT=collections.defaultdict(list)
for t in d['vehicle_types']:
    for b in t['brand_ids']: BT[b].append(t['id'])
S=set(A)
KW=[('VT42',r'\bsubmarine'),('VT41',r'aircraft carrier|supercarrier'),('VT40',r'cruise ship|ocean liner'),('VT37',r'container ship|containership|container vessel|container carrier'),
('VT38',r'tanker|lng carrier|lpg carrier|gas carrier'),('VT39',r'trawler|fishing vessel'),('VT35',r'\btug(boat)?\b'),('VT36',r'\bferry|ro-pax|ropax|hovercraft|passenger ship|high-speed craft|catamaran'),
('VT34',r'speedboat|motorboat|motor yacht|powerboat|bowrider|center console'),('VT33',r'personal watercraft|jet ski|waverunner|sea-doo'),('VT32',r'sailboat|sailing yacht|dinghy|windsurf'),('VT31',r'canoe|kayak'),
('VT30',r'high-speed train|high speed train|shinkansen|bullet train'),('VT27',r'metro|subway|rapid transit'),('VT28',r'\btram|light rail|streetcar'),('VT29',r'locomotive'),
('VT45',r'helicopter'),('VT46',r'\bdrone|unmanned aerial|quadcopter|\buav\b'),('VT48',r'business jet|private jet'),('VT49',r'airliner|passenger aircraft|passenger jet'),('VT50',r'cargo aircraft|transport aircraft|freighter'),('VT51',r'fighter'),('VT52',r'bomber|early warning|awacs|aew&c'),
('VT44',r'glider|paraglider|sailplane'),('VT43',r'balloon|airship|blimp|zeppelin'),('VT47',r'light aircraft|light airplane|general aviation|single-engine|trainer aircraft|utility aircraft'),
('VT54',r'launch vehicle|orbital rocket'),('VT53',r'sounding rocket|suborbital'),('VT57',r'capsule|crewed spacecraft|cargo spacecraft'),('VT56',r'\brover'),('VT55',r'spaceplane'),
('VT25',r'main battle tank|\btank\b'),('VT26',r'armou?red|infantry fighting|personnel carrier'),('VT18',r'combine harvester|\bcombine\b'),('VT19',r'forage harvester'),('VT20',r'sprayer'),('VT17',r'tractor'),
('VT21',r'excavator|backhoe'),('VT22',r'bulldozer|wheel loader|\bloader\b|crawler dozer'),('VT23',r'road roller|compactor|\bgrader'),('VT24',r'forklift|telehandler|lift truck'),
('VT14',r'dump truck|haul truck|tipper|tank truck'),('VT13',r'semi-trailer|semi truck|tractor unit|heavy truck|\btruck\b'),('VT16',r'\bcoach\b|intercity bus'),('VT15',r'\bbus\b|trolleybus'),
('VT07',r'snowmobile'),('VT06',r'all-terrain|\batv\b|quad bike|side-by-side|utv'),('VT05',r'motorcycle|motorbike|scooter|moped|superbike'),('VT01',r'bicycle|\bbike\b'),
('VT11',r'pickup'),('VT10',r'minivan|\bmpv\b|people carrier|multi-purpose vehicle|multi purpose vehicle'),('VT12',r'panel van|cargo van|\bvan\b|light commercial'),('VT09',r'\bsuv\b|sport utility|crossover|off-road vehicle|off-roader|4x4'),
('VT08',r'\bcar\b|sedan|saloon|hatchback|coupe|coupé|automobile|convertible|roadster|station wagon|estate car|supercar|sports car')]
CARBODY=['VT09','VT11','VT10','VT12']
def kw(text,only=None):
    for t,rx in KW:
        if only and t not in only: continue
        if re.search(rx,text,re.I): return t
res={}; why=collections.Counter(); child={}
for m,b in A.items():
    it=info.get(m,{}); lab=it.get('lab')
    if not lab or re.fullmatch(r'Q\d+',lab): why['nolabel']+=1; continue
    a=set(anc.get(m,[]))
    if a & set(EXCL): why['excluded']+=1; continue
    desc=it.get('desc',''); txt=lab+' | '+desc
    if re.search(r'autohaus|c/n \d|^list of|launch vehicles$',lab,re.I): why['excl-lab']+=1; continue
    if re.search(r'autohaus|dealer|c/n|\bmsn\b|^list of|concept|prototype|engine\b|satellite|missile|booster|test article|racing|race car|formula one|rally car|gimbal|camera|smartphone',desc,re.I): why['excl-desc']+=1; continue
    p31=[c for p,c in cls.get(m,[]) if p=='31']; p279=[c for p,c in cls.get(m,[]) if p=='279']
    if any(c in S for c in p31): why['individual']+=1; continue
    keys={ROOT[x] for x in a if x in ROOT}
    t=next((k for k in ORDER if k in keys),None)
    if t=='CAR':
        t=kw(desc,CARBODY) or kw(lab,CARBODY)
        if not t:
            t={'B036':'VT09','B037':'VT09','B042':'VT11','B043':'VT09'}.get(b,'VT08')
    elif t=='TRUCK': t=kw(desc,['VT14','VT15','VT16','VT12','VT11']) or TRUCK_DEFAULT.get(b,'VT13')
    elif t=='AIR':
        t=kw(desc,['VT45','VT46','VT48','VT49','VT50','VT51','VT52','VT44','VT43','VT47']) or AIR_DEFAULT.get(b)
    elif t is None:
        t=kw(desc)
        if t: why['by-desc']+=1
    if not t: why['nomatch']+=1; continue
    parents=[c for c in p279 if c in S and A.get(c)==b]
    if parents: child[m]=parents[0]
    res[m]=(b,t)
fold={m:p for m,p in child.items() if p in res}
final={m:v for m,v in res.items() if m not in fold}
labs={(v[0],info[m]['lab'].lower()):m for m,v in final.items()}
for m,v in list(final.items()):
    mm=re.match(r'^(.*\S)\s+\d+$',info[m]['lab'])
    if mm and v[1] in ('VT54','VT57','VT53','VT55') and (v[0],mm.group(1).lower()) in labs:
        fold[m]=labs[(v[0],mm.group(1).lower())]; del final[m]
json.dump({'final':final,'fold':fold},open('classified.json','w'))
print(why,'final',len(final),'folded',len(fold))
c=collections.Counter(t for b,t in final.values()); print(sorted(c.items()))
