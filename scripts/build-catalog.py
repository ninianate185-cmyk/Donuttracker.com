"""Build a versioned public item/quote snapshot. No API keys are used."""
import pathlib,json,re,collections,datetime,struct
ROOT=pathlib.Path(__file__).resolve().parent.parent
research=ROOT/'data'; dest=ROOT/'dist'
items=json.loads((research/'items-26.1.json').read_text())
blocks={b['name'] for b in json.loads((research/'blocks-26.1.json').read_text())}
quotes=json.loads((research/'quotes-2026-10-21.json').read_text())
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
byname=collections.defaultdict(list)
for q in quotes:byname[norm(q['name'])].append(q)
icons={'observer':('observer.png',True),'hopper':('hopper.png',False),'firework_rocket':('rocket.png',False),'netherite_ingot':('netherite.png',False),'elytra':('elytra.png',False),'enchanted_golden_apple':('apple.png',False),'diamond':('diamond.png',False),'gold_ingot':('gold.png',False),'crafting_table':('crafting.png',True)}
native_required={'dragon_head','piglin_head','player_head','zombie_head','creeper_head','skeleton_skull','wither_skeleton_skull','bone_block'}
for name in native_required:
 if not (dest/'assets/renders'/(name+'.png')).exists():raise RuntimeError('Missing authentic Minecraft render: '+name)
def category(n):
 if n in {'dragon_head','piglin_head','dragon_egg'} or 'pottery_sherd' in n or 'smithing_template' in n:return 'Collectibles'
 if any(x in n for x in ['redstone','hopper','observer','piston','repeater','comparator','daylight_detector','target','tripwire']):return 'Redstone'
 if any(x in n for x in ['sword','pickaxe','shovel','helmet','chestplate','leggings','boots','elytra','trident','shield','bow','mace','spear','_axe','fishing_rod']):return 'Equipment'
 if n in blocks:return 'Blocks'
 if any(x in n for x in ['potion','apple','bread','beef','porkchop','stew','soup','carrot','potato','cookie','melon_slice','firework','chicken','mutton','rabbit','honey_bottle','chorus_fruit']):return 'Consumables'
 return 'Materials'
rows=[];matched=set();idx={i['id']:i['name'] for i in items}
for i in items:
 name=i['name'];qs=byname.get(norm(i['displayName']),[])
 # Duplicate source labels do not establish the exact variant; don't merge their values.
 q=qs[0] if len(qs)==1 else None
 if q:matched.add(q['ref'])
 ico,cube=icons.get(name,(None,False))
 if not ico and (dest/'assets/items'/(name+'.png')).exists():ico='items/'+name+'.png';cube=name in blocks
 rendered=False
 if (dest/'assets/renders'/(name+'.png')).exists():ico='renders/'+name+'.png';cube=False;rendered=True
 animated=False
 if ico and ico.endswith('.png'):
  header=(dest/'assets'/ico).read_bytes()[:24];w,h=struct.unpack('>II',header[16:24]);animated=h>w*2
 rows.append({'id':name,'name':i['displayName'],'category':category(name),'stack':i['stackSize'],'icon':ico,'cube':cube,'animated':animated,'rendered':rendered,'price':q['price'] if q else None,'change':q['change'] if q else None,'monthlyAverage':None,'source':q['source'] if q else None,'sourceTime':q['sourceTime'] if q else None,'sourceGrade':q['grade'] if q else None,'rounded':bool(q),'variantNote':'Multiple source variants; price not merged' if len(qs)>1 else None})
for q in quotes:
 if q['ref'] in matched:continue
 slug=re.sub(r'[^a-z0-9]+','_',q['name'].lower()).strip('_')
 rows.append({'id':'tracked_'+slug+'_'+q['ref'],'name':q['name'],'category':'Server variants','stack':None,'icon':None,'price':q['price'],'change':q['change'],'monthlyAverage':None,'source':q['source'],'sourceTime':q['sourceTime'],'sourceGrade':q['grade'],'rounded':True,'variantNote':'Source variant; match exact item in game'})
for n in ['Skeleton Spawner','Shard Axe','Shard Pickaxe','Shard Potion of Haste','Shard Shovel']:
 if any(x['name']==n for x in rows):continue
 rows.append({'id':'donut_'+re.sub('[^a-z0-9]+','_',n.lower()),'name':n,'category':'DonutSMP','stack':None,'icon':None,'price':None,'change':None,'monthlyAverage':None,'source':'https://donutsmpterminal.com/donutsmp-skeleton-spawner-grinder' if n=='Skeleton Spawner' else 'https://donutsmpterminal.com/all_items','sourceTime':None,'variantNote':'Price not verified'})
recipes={}
for target,options in json.loads((research/'recipes-26.1.json').read_text()).items():
 name=idx.get(int(target));valid=[]
 if not name:continue
 for recipe in options:
  result=recipe.get('result',{});count=result.get('count',1) if isinstance(result,dict) else 1
  raw=[x for row in recipe['inShape'] for x in row] if 'inShape' in recipe else recipe.get('ingredients',[])
  ingredients=[];bad=False
  for cell in raw:
   if cell is None:continue
   itemid=cell if isinstance(cell,int) else cell.get('id') if isinstance(cell,dict) else None
   if itemid not in idx:bad=True;break
   ingredients.append(idx[itemid])
  if ingredients and not bad:valid.append({'yield':count,'ingredients':dict(collections.Counter(ingredients))})
 if valid:recipes[name]=valid
# Public Donut.Auction displayed values are retained as separately attributed observations.
alternates=json.loads((research/'auction-observations-2026-10-21.json').read_text())
meta={'catalogVersion':'Minecraft Java 26.1','catalogCount':len(items),'source':'https://donutsmpterminal.com/all_items','sourceTime':'2026-10-21T17:49:00Z','retrievedOn':'2026-10-21','priceCount':sum(x['price'] is not None for x in rows),'monthlyCoverage':0,'notes':'Public rounded quoted prices. No verified month-to-date transaction history is included. Missing prices are null, never zero. Custom server items are only those identified in public source material.'}
(dest/'catalog.js').write_text('window.DT_DATA='+json.dumps({'meta':meta,'items':rows,'recipes':recipes,'alternates':alternates},separators=(',',':'))+';\n')
print(json.dumps({'catalog':len(items),'combined':len(rows),'prices':meta['priceCount'],'recipes':len(recipes),'alternateQuotes':len(alternates),'monthlyAverages':0}))
