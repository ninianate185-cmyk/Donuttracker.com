"""Download versioned Minecraft textures for catalog thumbnails (no image modification)."""
import pathlib,json,urllib.request,concurrent.futures
root=pathlib.Path(__file__).resolve().parent.parent
items=json.loads((root/'data/items-26.1.json').read_text());blocks={x['name'] for x in json.loads((root/'data/blocks-26.1.json').read_text())}
out=root/'dist/assets/items';out.mkdir(exist_ok=True)
def get(item):
 n=item['name'];p=out/(n+'.png')
 if p.exists():return 1
 kind='block' if n in blocks else 'item'
 choices=[kind+'/'+n,kind+'/'+n+'_top'] if kind=='block' else [kind+'/'+n]
 for path in choices:
  try:
   with urllib.request.urlopen('https://assets.mcasset.cloud/26.1/assets/minecraft/textures/'+path+'.png',timeout=12) as r:data=r.read()
   if data.startswith(b'\x89PNG'):
    p.write_bytes(data);return 1
  except Exception:pass
 return 0
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 counts=[]
 for i,x in enumerate(pool.map(get,items),1):
  counts.append(x)
  if i%250==0:print(i,'checked;',sum(counts),'downloaded',flush=True)
print('Textures available:',sum(counts),'of',len(items),flush=True)
