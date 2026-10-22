/* Pointer-driven presentation only. Market observations are never animated into invented data. */
(()=>{
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),bound=new WeakSet();
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
 function mountViewer(stage){const controller=tilt(stage,{hover:true,drag:true,amount:18});const root=stage.closest('[role="dialog"]');root.querySelector('[data-viewer-reset]')?.addEventListener('click',()=>{controller.reset();controller.setZoom(1);root.querySelector('[data-viewer-zoom]').value=100});root.querySelector('[data-viewer-zoom]')?.addEventListener('input',ev=>controller.setZoom(+ev.target.value/100))}
 function burst(button){if(!button?.isConnected||reduce.matches)return;const r=button.getBoundingClientRect(),container=document.createElement('span');container.className='watch-celebration';container.setAttribute('aria-hidden','true');container.style.left=(r.left+r.width/2)+'px';container.style.top=(r.top+r.height/2)+'px';for(let i=0;i<7;i++){const p=document.createElement('i'),a=i/7*Math.PI*2;p.style.setProperty('--burst-x',Math.cos(a)*34+'px');p.style.setProperty('--burst-y',Math.sin(a)*34+'px');container.append(p)}document.body.append(container);setTimeout(()=>container.remove(),700);button.animate?.([{transform:'scale(.7) rotate(-18deg)'},{transform:'scale(1.32) rotate(8deg)'},{transform:'scale(1) rotate(0deg)'}],{duration:480,easing:'cubic-bezier(.2,.8,.2,1)'})}
 let navBound=false;
 function navInk(){const nav=document.querySelector('.desktop-nav');if(!nav)return;let ink=nav.querySelector('.nav-ink');if(!ink){ink=document.createElement('span');ink.className='nav-ink';ink.setAttribute('aria-hidden','true');nav.append(ink);nav.classList.add('motion-nav')}
  const move=a=>{if(!a||nav.offsetWidth===0)return;ink.style.width=a.offsetWidth+'px';ink.style.transform=`translateX(${a.offsetLeft}px)`};move(nav.querySelector('a.active'));
  if(!navBound){navBound=true;nav.querySelectorAll('a').forEach(a=>{a.addEventListener('pointerenter',()=>move(a));a.addEventListener('focus',()=>move(a))});nav.addEventListener('pointerleave',()=>move(nav.querySelector('a.active')));nav.addEventListener('focusout',()=>move(nav.querySelector('a.active')));window.addEventListener('resize',()=>move(nav.querySelector('a.active')),{passive:true})}
 }
 function mount(root=document){
  for(const card of all(root,'.motion-card'))if(!bound.has(card)){bound.add(card);tilt(card,{hover:true,amount:7})}
  for(const stage of all(root,'[data-spawner-stage]'))if(!bound.has(stage)){bound.add(stage);mountSpawner(stage)}
  for(const stage of all(root,'[data-inspect-stage]'))if(!bound.has(stage)){bound.add(stage);mountViewer(stage)}
  for(const button of all(root,'.btn,.dashboard-tool'))if(!bound.has(button)){bound.add(button);button.classList.add('magnetic');button.addEventListener('pointermove',ev=>{if(reduce.matches||ev.pointerType==='touch')return;const r=button.getBoundingClientRect();button.style.setProperty('--mag-x',clamp((ev.clientX-r.left-r.width/2)*.035,-3,3)+'px');button.style.setProperty('--mag-y',clamp((ev.clientY-r.top-r.height/2)*.045,-3,3)+'px')});button.addEventListener('pointerleave',()=>{button.style.setProperty('--mag-x','0px');button.style.setProperty('--mag-y','0px')})}
  navInk();
 }
 document.addEventListener('pointerdown',ev=>{if(reduce.matches)return;const b=ev.target.closest('.btn');if(!b)return;const r=b.getBoundingClientRect(),p=document.createElement('span');p.className='button-ripple';p.setAttribute('aria-hidden','true');p.style.left=(ev.clientX-r.left)+'px';p.style.top=(ev.clientY-r.top)+'px';b.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true})});
 document.addEventListener('input',ev=>{if(reduce.matches)return;const root=ev.target.closest('[data-calculator],.trade-plan,.manual-planner');if(root)root.querySelectorAll('[data-out="income"],[data-out="payback"],#plan-profit,#manual-profit').forEach(n=>{n.getAnimations?.().forEach(a=>a.cancel());n.animate?.([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:270,easing:'ease-out'})})});
 window.DonutMotion={mount,burst};
})();
