/* Pointer-driven presentation only. Market observations are never animated into invented data. */
(()=>{
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),bound=new WeakSet(),observed=new Set();
 const all=(root,selector)=>[...(root?.querySelectorAll(selector)||[])];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function tilt(el,{hover=true,drag=false,amount=7,onTap=null}={}){
  let x=0,y=0,tx=0,ty=0,raf=0,down=false,startX=0,startY=0,startRX=0,startRY=0,moved=false;
  const write=()=>{el.style.setProperty('--tilt-x',x.toFixed(3)+'deg');el.style.setProperty('--tilt-y',y.toFixed(3)+'deg');el.style.setProperty('--art-x',(y*.55).toFixed(2)+'px');el.style.setProperty('--art-y',(-x*.55).toFixed(2)+'px')};
  const tick=()=>{raf=0;if(!el.isConnected)return;x+=(tx-x)*.13;y+=(ty-y)*.13;write();if(Math.abs(tx-x)+Math.abs(ty-y)>.018)raf=requestAnimationFrame(tick)};
  const run=()=>{if(reduce.matches){x=tx;y=ty;write()}else if(!raf)raf=requestAnimationFrame(tick)};
  el.addEventListener('pointermove',ev=>{
   const r=el.getBoundingClientRect(),px=clamp((ev.clientX-r.left)/r.width,0,1),py=clamp((ev.clientY-r.top)/r.height,0,1);
   el.style.setProperty('--light-x',(px*100)+'%');el.style.setProperty('--light-y',(py*100)+'%');
   if(down){moved=moved||Math.abs(ev.clientX-startX)+Math.abs(ev.clientY-startY)>5;tx=clamp(startRX-(ev.clientY-startY)*.14,-26,26);ty=clamp(startRY+(ev.clientX-startX)*.17,-32,32);run()}
   else if(hover&&!reduce.matches&&ev.pointerType!=='touch'){tx=-(py-.5)*amount;ty=(px-.5)*amount*1.3;run()}
  });
  el.addEventListener('pointerleave',()=>{if(!down){tx=0;ty=0;run()}});
  el.addEventListener('pointerdown',ev=>{if(!drag||ev.target.closest('button,a,input')||ev.button!==0)return;down=true;moved=false;startX=ev.clientX;startY=ev.clientY;startRX=tx;startRY=ty;el.classList.add('dragging');el.setPointerCapture(ev.pointerId);ev.preventDefault()});
  const release=ev=>{if(!down)return;down=false;el.classList.remove('dragging');if(el.hasPointerCapture(ev.pointerId))el.releasePointerCapture(ev.pointerId);if(!moved)onTap?.(ev)};
  el.addEventListener('pointerup',release);el.addEventListener('pointercancel',ev=>{down=false;el.classList.remove('dragging');tx=0;ty=0;run()});
  el.addEventListener('keydown',ev=>{if(ev.target!==el)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.key)){ev.preventDefault();if(ev.key==='ArrowUp')tx-=5;if(ev.key==='ArrowDown')tx+=5;if(ev.key==='ArrowLeft')ty-=5;if(ev.key==='ArrowRight')ty+=5;tx=clamp(tx,-26,26);ty=clamp(ty,-32,32);run()}if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();onTap?.(ev)}});
  return {reset(){tx=0;ty=0;run()},setZoom(n){el.style.setProperty('--viewer-zoom',String(n))}};
 }
 function emberBurst(stage){if(reduce.matches||stage.classList.contains('embers-off'))return;const field=stage.querySelector('.ember-field');if(!field)return;for(let i=0;i<18;i++){const p=document.createElement('i');p.className='ember ember-burst';p.style.setProperty('--burst-x',((i-8.5)*9)+'px');p.style.setProperty('--burst-y',(-75-(i%5)*20)+'px');p.style.setProperty('--burst-r',((i-8)*17)+'deg');p.style.left=(38+(i%6)*5)+'%';p.style.top=(46+(i%4)*7)+'%';field.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true})}stage.classList.remove('ember-flash');void stage.offsetWidth;stage.classList.add('ember-flash')}
 function mountSpawner(stage){
  const field=stage.querySelector('.ember-field');if(field&&!reduce.matches){for(let i=0;i<12;i++){let p=document.createElement('i');p.className='ember ambient-ember';p.style.cssText=`--ember-left:${28+(i*13)%48}%;--ember-delay:-${i*.71}s;--ember-duration:${3+i%4*.7}s;--ember-drift:${(i%2?1:-1)*(8+i*2)}px`;field.append(p)}}
  const controller=tilt(stage,{hover:true,drag:true,amount:14,onTap:()=>emberBurst(stage)});
  stage.querySelector('[data-spawner-reset]')?.addEventListener('click',ev=>{ev.stopPropagation();controller.reset();stage.classList.remove('motion-paused');const p=stage.querySelector('[data-spawner-pause]');p.setAttribute('aria-pressed','false');p.textContent='Ⅱ Pause'});
  stage.querySelector('[data-spawner-pause]')?.addEventListener('click',ev=>{ev.stopPropagation();const pause=stage.classList.toggle('motion-paused');ev.currentTarget.setAttribute('aria-pressed',String(pause));ev.currentTarget.textContent=pause?'▷ Resume':'Ⅱ Pause'});
  stage.querySelector('[data-spawner-embers]')?.addEventListener('click',ev=>{ev.stopPropagation();const off=stage.classList.toggle('embers-off');ev.currentTarget.setAttribute('aria-pressed',String(!off));if(!off)emberBurst(stage)});
 }
 function mountViewer(stage){
  const controller=tilt(stage,{hover:true,drag:true,amount:18}),root=stage.closest('[role="dialog"]'),zoom=root.querySelector('[data-viewer-zoom]'),rotate=root.querySelector('[data-viewer-rotate]');
  const reset=()=>{controller.reset();controller.setZoom(1);zoom.value=100;rangeFill(zoom);stage.classList.remove('viewer-auto');rotate.setAttribute('aria-pressed','false')};
  root.querySelector('[data-viewer-reset]')?.addEventListener('click',reset);
  zoom?.addEventListener('input',ev=>controller.setZoom(+ev.target.value/100));
  rotate?.addEventListener('click',()=>{const yes=stage.classList.toggle('viewer-auto');rotate.setAttribute('aria-pressed',String(yes))});
  stage.addEventListener('wheel',ev=>{ev.preventDefault();zoom.value=clamp(+zoom.value+(ev.deltaY<0?5:-5),70,140);controller.setZoom(+zoom.value/100);rangeFill(zoom)},{passive:false});
  stage.addEventListener('dblclick',reset);
 }
 function burst(button){if(!button?.isConnected||reduce.matches)return;const r=button.getBoundingClientRect(),container=document.createElement('span');container.className='watch-celebration';container.setAttribute('aria-hidden','true');container.style.left=(r.left+r.width/2)+'px';container.style.top=(r.top+r.height/2)+'px';for(let i=0;i<7;i++){const p=document.createElement('i'),a=i/7*Math.PI*2;p.style.setProperty('--burst-x',Math.cos(a)*34+'px');p.style.setProperty('--burst-y',Math.sin(a)*34+'px');container.append(p)}document.body.append(container);setTimeout(()=>container.remove(),700);button.animate?.([{transform:'scale(.7) rotate(-18deg)'},{transform:'scale(1.32) rotate(8deg)'},{transform:'scale(1) rotate(0deg)'}],{duration:480,easing:'cubic-bezier(.2,.8,.2,1)'})}
 let navBound=false;
 function navInk(){const nav=document.querySelector('.desktop-nav');if(!nav)return;let ink=nav.querySelector('.nav-ink');if(!ink){ink=document.createElement('span');ink.className='nav-ink';ink.setAttribute('aria-hidden','true');nav.append(ink);nav.classList.add('motion-nav')}
  const move=a=>{if(!a||nav.offsetWidth===0)return;ink.style.width=a.offsetWidth+'px';ink.style.transform=`translateX(${a.offsetLeft}px)`};move(nav.querySelector('a.active'));
  if(!navBound){navBound=true;nav.querySelectorAll('a').forEach(a=>{a.addEventListener('pointerenter',()=>move(a));a.addEventListener('focus',()=>move(a))});nav.addEventListener('pointerleave',()=>move(nav.querySelector('a.active')));nav.addEventListener('focusout',()=>move(nav.querySelector('a.active')));window.addEventListener('resize',()=>move(nav.querySelector('a.active')),{passive:true})}
 }

 function captureArt(img){if(!img?.isConnected||!img.naturalWidth)return null;const r=img.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return null;return {src:img.currentSrc||img.src,x:r.x,y:r.y,width:r.width,height:r.height}}
 function flight(art,end,{duration=680,small=false}={}){if(!art||reduce.matches)return;const img=document.createElement('img');img.className='flying-item';img.src=art.src;img.alt='';img.setAttribute('aria-hidden','true');Object.assign(img.style,{left:art.x+'px',top:art.y+'px',width:art.width+'px',height:art.height+'px'});document.body.append(img);const dx=end.x-art.x,dy=end.y-art.y,scale=small ? .25 : end.width/art.width;const a=img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-60}px) scale(${(1+scale)/2})`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:small?0:1}],{duration,easing:'cubic-bezier(.25,.7,.25,1)',fill:'forwards'});a.finished.catch(()=>{}).finally(()=>img.remove());return a}
 function saveFlight(art){const target=document.querySelector('.watch-nav');if(!target)return;const r=target.getBoundingClientRect();const a=flight(art,{x:r.x+r.width/2-5,y:r.y+r.height/2-5,width:10},{small:true});a?.finished.then(()=>target.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:320})).catch(()=>{})}
 function flyArt(art,target){if(!target||!art||reduce.matches)return;const r=target.getBoundingClientRect(),drawer=target.closest('.drawer'),m=drawer?new DOMMatrixReadOnly(getComputedStyle(drawer).transform):null;flight(art,{x:r.x-(m?.m41||0),y:r.y,width:r.width},{duration:520})}
 function selection(card){if(!card||reduce.matches)return;card.animate([{scale:'.975'},{scale:'1.015'},{scale:'1'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'})}
 const entranceRuns=new WeakMap();
 function replayInvestments(root){
  if(!root)return;const run=(entranceRuns.get(root)||0)+1;entranceRuns.set(root,run);const button=root.querySelector('[data-action="replay-investments"]'),cards=all(root,'[data-investment-arrival]');
  if(button){button.classList.add('is-replaying');button.setAttribute('aria-busy','true')}
  const tasks=cards.map(async(card,i)=>{
   card.classList.add('visible');const arrival=card.querySelector('.item-arrival'),img=arrival.querySelector('img');arrival.getAnimations().forEach(a=>a.cancel());
   if(reduce.matches)return;try{await img.decode()}catch{}if(!root.isConnected||entranceRuns.get(root)!==run)return;
   const x=[-Math.min(innerWidth*.4,440),-65,Math.min(innerWidth*.4,440),Math.min(innerWidth*.32,340)][i],y=[-150,-235,-165,-245][i],r=[-26,19,29,-32][i];
   const animation=arrival.animate([{transform:`translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(.55)`,opacity:0,filter:'blur(7px)'},{transform:`translate3d(${x*.27}px,${y*.28}px,0) rotate(${r*.25}deg) scale(.86)`,opacity:1,filter:'blur(0)',offset:.56},{transform:'translate3d(0,7px,0) rotate(-2deg) scale(1.04)',opacity:1,offset:.84},{transform:'translate3d(0,0,0) rotate(0deg) scale(1)',opacity:1}],{duration:1150,delay:140+i*155,easing:'cubic-bezier(.18,.72,.22,1)',fill:'backwards'});
   try{await animation.finished;if(entranceRuns.get(root)!==run)return;const ring=document.createElement('span');ring.className='arrival-ring';ring.setAttribute('aria-hidden','true');card.querySelector('.item-stage').append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});card.querySelector('.card-price').animate([{opacity:.5,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:360})}catch{}
  });
  Promise.allSettled(tasks).then(()=>{if(entranceRuns.get(root)===run&&button){button.classList.remove('is-replaying');button.removeAttribute('aria-busy')}});
 }
 function mountInvestment(root){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();requestAnimationFrame(()=>replayInvestments(root))}},{threshold:.12});const first=root.querySelector('[data-investment-arrival]');if(first){io.observe(first);observed.add({node:root,observer:io})}
  root.addEventListener('keydown',ev=>{if(!ev.target.matches('.investment-card')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(ev.key))return;ev.preventDefault();const cards=all(root,'.investment-card'),i=cards.indexOf(ev.target),cols=Math.max(1,Math.round(cards[0].parentElement.clientWidth/cards[0].offsetWidth)),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-cols,ArrowDown:cols}[ev.key];const next=ev.key==='Home'?0:ev.key==='End'?cards.length-1:clamp(i+delta,0,cards.length-1);cards[next]?.focus({preventScroll:false})});
 }
 function captureRows(root){return new Map(all(root,'tr[data-item]').map(row=>[row.dataset.item,row.getBoundingClientRect()]))}
 function rows(root,before){if(reduce.matches)return;all(root,'tr[data-item]').forEach((row,i)=>{const r=row.getBoundingClientRect();if(r.top>innerHeight||r.bottom<0)return;const old=before?.get(row.dataset.item);if(old&&Math.abs(old.y-r.y)>1)row.animate([{transform:`translateY(${clamp(old.y-r.y,-200,200)}px)`,opacity:.6},{transform:'translateY(0)',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});else if(!old)row.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,delay:Math.min(i,10)*18,easing:'ease-out',fill:'backwards'})})}
 function rangeFill(input){const min=+input.min||0,max=+input.max||100;input.style.setProperty('--range-fill',clamp((+input.value-min)/(max-min)*100,0,100)+'%')}
 function chipInk(chips){let ink=chips.querySelector('.chip-ink');if(!ink){ink=document.createElement('span');ink.className='chip-ink';ink.setAttribute('aria-hidden','true');chips.append(ink)}const move=()=>{const active=chips.querySelector('.chip.active');if(!active)return;Object.assign(ink.style,{width:active.offsetWidth+'px',height:active.offsetHeight+'px',transform:`translate(${active.offsetLeft}px,${active.offsetTop}px)`})};move();chips.addEventListener('click',()=>requestAnimationFrame(move));const observer=new ResizeObserver(move);observer.observe(chips);observed.add({node:chips,observer})}
 function accordion(details){let current,expanded=details.open;const summary=details.querySelector('summary');summary?.addEventListener('click',ev=>{if(reduce.matches)return;ev.preventDefault();current?.cancel();const opening=!expanded;expanded=opening;const start=details.getBoundingClientRect().height;details.open=opening;const end=details.getBoundingClientRect().height;details.open=true;details.style.overflow='hidden';const a=details.animate([{height:start+'px'},{height:end+'px'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});current=a;a.finished.then(()=>{if(current===a){details.open=opening;details.style.overflow='';current=null}}).catch(()=>{})})}
 function mount(root=document){
  for(const entry of observed)if(!entry.node.isConnected){entry.observer.disconnect();observed.delete(entry)}
  for(const page of all(root,'[data-investments]'))if(!bound.has(page)){bound.add(page);mountInvestment(page)}
  for(const chips of all(root,'.chips'))if(!bound.has(chips)){bound.add(chips);chipInk(chips)}
  for(const details of all(root,'details.assumptions'))if(!bound.has(details)){bound.add(details);accordion(details)}
  for(const input of all(root,'input[type=range]')){rangeFill(input);if(!bound.has(input)){bound.add(input);input.addEventListener('input',()=>rangeFill(input))}}
  for(const card of all(root,'.motion-card'))if(!bound.has(card)){bound.add(card);tilt(card,{hover:true,amount:7})}
  for(const stage of all(root,'[data-spawner-stage]'))if(!bound.has(stage)){bound.add(stage);mountSpawner(stage)}
  for(const stage of all(root,'[data-inspect-stage]'))if(!bound.has(stage)){bound.add(stage);mountViewer(stage)}
  for(const button of all(root,'.btn,.dashboard-tool'))if(!bound.has(button)){bound.add(button);button.classList.add('magnetic');button.addEventListener('pointermove',ev=>{if(reduce.matches||ev.pointerType==='touch')return;const r=button.getBoundingClientRect();button.style.setProperty('--mag-x',clamp((ev.clientX-r.left-r.width/2)*.035,-3,3)+'px');button.style.setProperty('--mag-y',clamp((ev.clientY-r.top-r.height/2)*.045,-3,3)+'px')});button.addEventListener('pointerleave',()=>{button.style.setProperty('--mag-x','0px');button.style.setProperty('--mag-y','0px')})}
  navInk();
 }
 document.addEventListener('pointerdown',ev=>{if(reduce.matches)return;const b=ev.target.closest('.btn');if(!b)return;const r=b.getBoundingClientRect(),p=document.createElement('span');p.className='button-ripple';p.setAttribute('aria-hidden','true');p.style.left=(ev.clientX-r.left)+'px';p.style.top=(ev.clientY-r.top)+'px';b.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true})});
 document.addEventListener('input',ev=>{if(reduce.matches)return;const root=ev.target.closest('[data-calculator],.trade-plan,.manual-planner');if(root)root.querySelectorAll('[data-out="income"],[data-out="payback"],#plan-profit,#manual-profit').forEach(n=>{n.getAnimations?.().forEach(a=>a.cancel());n.animate?.([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:270,easing:'ease-out'})})});
 window.DonutMotion={mount,burst,captureArt,saveFlight,flyArt,selection,replayInvestments,captureRows,rows,rangeFill};
})();
