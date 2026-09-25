import json,base64
S='/tmp/claude-0/-home-claude/3e5d0190-f1ae-56ea-907f-0e19d9663d06/scratchpad/'
t=json.load(open(S+'ds/project/tokens.json'))
def val(v): return f"var(--{v[1:-1]})" if isinstance(v,str) and v.startswith('{') else v
def block(th):
    o=[]
    for k in t['color']['tokens']:
        v=k['value'] if isinstance(k['value'],str) else k['value'][th]; o.append(f"--{k['name']}:{val(v)};")
    for k in t['shadow']['tokens']: o.append(f"--{k['name']}:{k['value'][th]};")
    return ''.join(o)
static=''.join(f"--{k['name']}:{k['value']};" for f in ['spacing','radius'] for k in t[f]['tokens'])+''.join(f"--font-{k}:{v};" for k,v in t['type']['families'].items())
tokcss=(f":root{{{block('dark')}{static}color-scheme:dark;}}\n"
 f"@media (prefers-color-scheme: light){{:root:not([data-theme=\"dark\"]){{{block('light')}color-scheme:light;}}}}\n"
 f":root[data-theme=\"dark\"]{{{block('dark')}color-scheme:dark;}}\n"
 f":root[data-theme=\"light\"]{{{block('light')}color-scheme:light;}}\n")
bcss=open(S+'ds/project/components/bundle.css').read().split('\n',1)[1]  # drop @import; fonts via link
bjs=open(S+'ds/project/components/bundle.js').read()
b64=lambda f:'data:image/jpeg;base64,'+base64.b64encode(open(S+'site/'+f,'rb').read()).decode()
html=f'''<title>Vehicle Universe</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap">
<style>
/* Pujiverse Transport design system: tokens */
{tokcss}
/* Pujiverse Transport design system: components/bundle.css */
{bcss}
/* Vehicle Universe */
{open(S+'site/app.css').read()}
</style>
<div id="app"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
{bjs}
</script>
<script>
window.VU_LOCKUP = "{b64('lockup.jpg')}";
window.VU_MARK = "{b64('mark.jpg')}";
</script>
<script>
{open(S+'site/app.js').read()}
</script>
<script>
(function () {{
  var app = document.getElementById('app');
  app.innerHTML = '<div class="boot"><div><b>Vehicle Universe</b>Loading the catalogue…</div></div>';
  function j(u) {{ return fetch(u).then(function (r) {{ if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }}); }}
  Promise.all([j('data/core.json'), j('data/tiles.json').catch(function () {{ return {{}}; }})])
    .then(function (a) {{ app.innerHTML = ''; VU_BOOT(a[0], a[1]); }})
    .catch(function (e) {{ app.innerHTML = '<div class="boot"><div><b>Could not load the catalogue</b>Reload the page to try again. (' + e.message + ')</div></div>'; }});
}})();
</script>
'''
open(S+'site/pub/index.html','w').write(html)
print(len(html))
