"""Fetch native Minecraft inventory renders, pinned to a public source commit."""
import pathlib,json,urllib.request,concurrent.futures
root=pathlib.Path(__file__).resolve().parent.parent
repo='https://api.github.com/repos/Owen1212055/mc-assets'
commit=json.load(urllib.request.urlopen(repo+'/commits/main',timeout=25))['sha']
tree=json.load(urllib.request.urlopen(repo+'/git/trees/'+commit+'?recursive=1',timeout=25))['tree']
known={x['path'].split('/')[-1]:x for x in tree if x['path'].startswith('item-assets/') and x['path'].endswith('.png')}
items=json.loads((root/'data/items-26.1.json').read_text());out=root/'dist/assets/renders';out.mkdir(exist_ok=True)
source={'repository':'https://github.com/Owen1212055/mc-assets','commit':commit,'description':'256 × 256 Minecraft inventory item images, rendered natively by mc-assets.','items':[]}
requests=[x for x in items if x['name'].upper()+'.png' in known]
def get(item):
 name=item['name'];url='https://raw.githubusercontent.com/Owen1212055/mc-assets/'+commit+'/item-assets/'+name.upper()+'.png';p=out/(name+'.png')
 try:
  with urllib.request.urlopen(url,timeout=20) as r:data=r.read()
  if not data.startswith(b'\x89PNG'):return None
  p.write_bytes(data);return name
 except Exception:return None
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for i,x in enumerate(pool.map(get,requests),1):
  if x:source['items'].append(x)
  if i%250==0:print(i,'checked;',len(source['items']),'renders saved',flush=True)
(root/'data/native-render-source.json').write_text(json.dumps(source,indent=2)+'\n')
print('Native renders saved:',len(source['items']),'of',len(items),'registry entries. Source commit:',commit,flush=True)
