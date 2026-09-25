import json,os,hashlib,sys
P='/tmp/claude-0/-home-claude/3e5d0190-f1ae-56ea-907f-0e19d9663d06/scratchpad/site/pub/'
st='/tmp/claude-0/-home-claude/3e5d0190-f1ae-56ea-907f-0e19d9663d06/scratchpad/site/published.json'
old=json.load(open(st)) if os.path.exists(st) else {}
cur={}
for d in ('data','data/p','img'):
    for f in os.listdir(P+d):
        if os.path.isfile(P+d+'/'+f): cur[f'{d}/{f}']=hashlib.md5(open(P+d+'/'+f,'rb').read()).hexdigest()
ch={k:k for k,v in cur.items() if old.get(k)!=v}
for k in old:
    if k not in cur: ch[k]=None
if len(sys.argv)>1 and sys.argv[1]=='commit': json.dump(cur,open(st,'w')); print('committed',len(cur))
else: print(json.dumps(ch)); print(len(ch), round(sum(os.path.getsize(P+k) for k,v in ch.items() if v)/1e6,1),'MB',file=sys.stderr)
