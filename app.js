import {createCollectionController} from './collection-state.js?v=1';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileCarouselQuery=window.matchMedia('(max-width: 760px)');
import productData from './product-data.js?v=5';
import {buildRecommendations} from './recommend.js?v=4';
function makeArrow(){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('ui-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M6 18 18 6M6 6h12v12');svg.append(path);return svg}
const menuButton=document.querySelector('.menu-toggle');
const menu=document.querySelector('#mobile-menu');
menuButton.addEventListener('click',event=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');menu.hidden=!open;if(open&&event.detail&&!reducedMotion.matches)trackAnimation(menu,[{opacity:.8,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280})});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню')}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');menuButton.focus()}});
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{const dialog=document.getElementById(button.dataset.open);dialog.showModal();if(dialog.id==='search')document.querySelector('#search-input').focus()}));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close-dialog').addEventListener('click',event=>closeDialog(dialog,event.detail>0));dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog(dialog,e.detail>0)}})});
const catalogEntries=[...document.querySelectorAll('.category')].map(a=>({name:a.querySelector('h3').textContent.trim(),url:a.href}));
catalogEntries.push(...[...document.querySelectorAll('.more-categories a')].map(a=>({name:a.textContent.trim(),url:a.href})),...productData.products.map(p=>({name:p.name+' — '+p.category,url:p.url,keywords:p.description})));
const normalize=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
const compact=s=>normalize(s).replace(/[^a-zа-я0-9]/g,'');
const searchInput=document.querySelector('#search-input');
const searchResults=document.querySelector('#search-results');
function renderSearch(){
 const q=normalize(searchInput.value.trim());
 const words=q.replace(/([a-z]+)[ -]+(?=\d)/g,'$1').split(/\s+/).filter(Boolean);
 const matches=(q&&!/[a-zа-я0-9]/.test(q))?[]:catalogEntries.filter(c=>words.every(word=>{const stem=word.replace(/(ые|ой|ая|ый|ов|ами|ом|ы|а|и|у)$/,'');return normalize(c.name+' '+(c.keywords||'')).includes(stem)||(compact(word)&&compact(c.name).includes(compact(word)))}));
 searchResults.replaceChildren();
 document.querySelector('#search-count').textContent=q?'Найдено: '+matches.length:'Категории и модели';
 if(!matches.length){const p=document.createElement('p');p.textContent='В нашей подборке нет совпадений. Измените запрос или откройте полный каталог выше.';searchResults.append(p);return}
 matches.forEach(c=>{const a=document.createElement('a');a.href=c.url;a.target='_blank';a.rel='noopener';a.textContent=c.name;a.append(makeArrow());searchResults.append(a)});
}
searchInput.addEventListener('input',renderSearch);renderSearch();
const series={expressive:{title:'Выразительность<br>В чистом виде',description:'Две рамки. Один круг. Скульптурная геометрия серии Expressive превращает технику в самостоятельный элемент архитектуры.',image:'assets/architecture-1280.webp',alt:'Коллекция Expressive в архитектурном интерьере',url:'https://gaggenau.su/catalog/dukhovye-shkafy/filter/seria-is-expressive/apply/',counter:'01 / 02'},minimalistic:{title:'Минимум линий<br>Максимум характера',description:'Серия Minimalistic интегрируется заподлицо с фасадами. Сдержанная геометрия сохраняет цельность интерьера и оставляет пространство для вашего замысла.',image:'assets/minimalistic.webp',alt:'Духовой шкаф GAGGENAU серии Minimalistic',url:'https://gaggenau.su/catalog/dukhovye-shkafy/filter/seria-is-minimalistic/apply/',counter:'02 / 02'}};
const tabs=Array.from(document.querySelectorAll('[data-series]'));
const collectionImage=document.querySelector('#collection-image');
const collectionPanel=document.querySelector('#collection-panel');
const collectionStatus=document.querySelector('#collection-status');
const collectionRetry=document.querySelector('#collection-retry');
const collectionPhotos=new Map();
let shownSeries='expressive';
let failedSeries='';
let loadingNotice=0;
let collectionAnimation;
let collectionTextAnimations=[];
function loadCollectionPhoto(key){
 if(collectionPhotos.has(key))return collectionPhotos.get(key);
 const promise=new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';
  const timeout=setTimeout(()=>finish(new Error('Image load timed out')),12000);
  let settled=false;
  function finish(error){if(settled)return;settled=true;clearTimeout(timeout);image.onload=null;image.onerror=null;if(error)reject(error);else resolve(image)}
  image.onerror=()=>finish(new Error('Image unavailable'));
  image.onload=async()=>{try{if(typeof image.decode==='function')await image.decode();finish()}catch(error){finish(error)}};
  image.src=new URL(series[key].image,document.baseURI).href;
 });
 collectionPhotos.set(key,promise);
 promise.catch(()=>{if(collectionPhotos.get(key)===promise)collectionPhotos.delete(key)});
 return promise;
}
const selectCollection=createCollectionController({
 load:loadCollectionPhoto,
 pending(loading){
  clearTimeout(loadingNotice);collectionRetry.hidden=true;collectionStatus.textContent='';
  collectionPanel.setAttribute('aria-busy',String(loading));
  if(loading)loadingNotice=setTimeout(()=>{collectionStatus.textContent='Загружаем фото коллекции…'},250);
 },
 show(key,image,{animate=true}={}){
  const s=series[key];const previous=shownSeries;shownSeries=key;
  collectionAnimation?.cancel();collectionTextAnimations.forEach(animation=>animation.cancel());collectionTextAnimations=[];
  // Remove responsive candidates together so a previous srcset cannot win selection.
  collectionImage.removeAttribute('srcset');collectionImage.removeAttribute('sizes');
  collectionImage.loading='eager';collectionImage.src=image.src;collectionImage.alt=s.alt;
  tabs.forEach(button=>{const selected=button.dataset.series===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1});
  collectionPanel.setAttribute('aria-labelledby',tabs.find(button=>button.dataset.series===key).id);
  document.querySelector('#collection-title').innerHTML=s.title;
  document.querySelector('#collection-description').textContent=s.description;
  document.querySelector('#collection-link').href=s.url;
  if(previous!==key&&animate&&!reducedMotion.matches){
   collectionAnimation=trackAnimation(collectionImage,[{opacity:.65,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:620});
   collectionTextAnimations=[...collectionPanel.querySelectorAll('h2,#collection-description,#collection-link')].map((node,i)=>trackAnimation(node,[{opacity:.65,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:560,delay:i*65}));
  }
 },
 failed(key){failedSeries=key;collectionStatus.textContent='Фото коллекции не загрузилось. Попробуйте ещё раз.';collectionRetry.hidden=false}
});
tabs.forEach((button,i)=>{
 button.addEventListener('click',event=>selectCollection(button.dataset.series,{animate:event.detail>0}));
 button.addEventListener('keydown',event=>{let n;if(event.key==='ArrowRight')n=(i+1)%tabs.length;if(event.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;if(event.key==='Home')n=0;if(event.key==='End')n=tabs.length-1;if(n!==undefined){event.preventDefault();tabs[n].focus();selectCollection(tabs[n].dataset.series,{animate:false})}});
});
collectionRetry.addEventListener('click',event=>selectCollection(failedSeries,{animate:event.detail>0}));
// Decode the small set once; switching remains atomic even if the user clicks rapidly.
if('IntersectionObserver' in window){
 const preloadObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){preloadObserver.disconnect();Object.keys(series).forEach(key=>loadCollectionPhoto(key).catch(()=>{}))}},{rootMargin:'700px'});
 preloadObserver.observe(document.querySelector('#collections'));
}else{Object.keys(series).forEach(key=>loadCollectionPhoto(key).catch(()=>{}))}
const selectionForm=document.querySelector('#selection-form');
const result=document.querySelector('#selection-result');
const copyButton=document.querySelector('#copy-selection');
const seriesSelect=document.querySelector('#series-preference');
const widthSelect=document.querySelector('#width-preference');
const boxes=[...selectionForm.querySelectorAll('input[name="appliance"]')];
const storageKey='mobiliere-project-v1';
let chosen=[];let recommendationText='';
const categoryLinks=new Map(catalogEntries.slice(0,12).map(c=>[c.name,c.url]));
function answers(){return{categories:boxes.filter(b=>b.checked).map(b=>b.value),series:seriesSelect.value,width:widthSelect.value}}
function saveDraft(stage='form'){try{localStorage.setItem(storageKey,JSON.stringify({...answers(),stage}))}catch{ /* Selection remains usable without storage. */ }}
function updateCount(){const count=boxes.filter(b=>b.checked).length;document.querySelector('#selection-count').textContent=count?'Выбрано категорий: '+count:'Категории не выбраны';const n=boxes.slice(6).filter(b=>b.checked).length;document.querySelector('#extra-count').textContent=n?' · выбрано '+n:'';if(count)document.querySelector('#selection-error').textContent='';saveDraft()}
selectionForm.addEventListener('change',updateCount);
function renderRecommendations(moveFocus=true){
 const a=answers();chosen=buildRecommendations(productData.products,a);
 const wrap=document.querySelector('#recommendations');wrap.replaceChildren();
 let modelCount=0;
 recommendationText='Здравствуйте! Хочу обсудить комплект GAGGENAU.\n';
 recommendationText+='Коллекция: '+seriesSelect.selectedOptions[0].textContent+'. Ширина духовки/пароварки: '+widthSelect.selectedOptions[0].textContent+'.\n\n';
 chosen.forEach(group=>{
  const section=document.createElement('section');section.className='recommendation-group';
  const h=document.createElement('h4');h.textContent=group.category;section.append(h);
  if(group.products.length){
   group.products.forEach(p=>{modelCount++;const row=document.createElement('div');row.className='recommendation-row';const link=document.createElement('a');link.href=p.url;link.target='_blank';link.rel='noopener';link.className='recommendation-model';link.textContent=p.name;link.append(makeArrow());const desc=document.createElement('p');desc.textContent=p.description;const reason=document.createElement('p');reason.className='recommendation-reason';reason.textContent=p.reason;row.append(link,desc,reason);section.append(row);recommendationText+=p.category+': '+p.name+'\n'+p.url+'\n'})
  }else{const p=document.createElement('p');p.textContent=group.note;section.append(p);recommendationText+=group.category+': '+group.note+'\n'}
  wrap.append(section);
 });
 recommendationText+='\nПрошу подтвердить совместимость, монтажные размеры, цены и наличие.';
 document.querySelector('#recommendation-summary').textContent='Подобрано вариантов: '+modelCount+'. Где есть два решения, сравните их перед обсуждением с консультантом.';
 document.querySelector('#manual-copy textarea').value=recommendationText;
 document.querySelector('#manual-copy').hidden=true;
 document.querySelector('#copy-status').textContent='Скопируйте подборку и отправьте её консультанту в Telegram.';
 selectionForm.hidden=true;result.hidden=false;saveDraft('result');
 if(moveFocus){document.querySelector('#recommendation-title').focus();result.querySelector('.selection-scroll').scrollTop=0}
}
selectionForm.addEventListener('submit',e=>{e.preventDefault();if(!answers().categories.length){document.querySelector('#selection-error').textContent='Выберите хотя бы одну категорию.';boxes[0].focus();return}renderRecommendations()});
copyButton.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(recommendationText);document.querySelector('#copy-status').textContent='Подборка скопирована. Откройте Telegram и вставьте её в сообщение.'}catch{const fallback=document.querySelector('#manual-copy');fallback.hidden=false;fallback.open=true;const area=fallback.querySelector('textarea');area.focus();area.select();document.querySelector('#copy-status').textContent='Автоматическое копирование недоступно. Скопируйте выделенный текст вручную.'}});
document.querySelector('#edit-selection').addEventListener('click',()=>{selectionForm.hidden=false;result.hidden=true;saveDraft();boxes[0].focus()});
try{const draft=JSON.parse(localStorage.getItem(storageKey));if(draft&&Array.isArray(draft.categories)){boxes.forEach(b=>b.checked=draft.categories.includes(b.value));if(['any','expressive','minimalistic'].includes(draft.series))seriesSelect.value=draft.series;if(['any','60','76'].includes(draft.width))widthSelect.value=draft.width;updateCount();if(draft.stage==='result'&&answers().categories.length)renderRecommendations(false)}}catch{ /* An invalid or unavailable draft never blocks the form. */ }



// The header becomes opaque continuously across the intro, rather than at a threshold.
const siteHeader=document.querySelector('.header');
const intro=document.querySelector('.hero');
const introPhoto=intro.querySelector('img');
const desktopMotion=window.matchMedia('(min-width: 901px) and (pointer: fine)');
let headerFrame=0;
let introTravel=1;
function measureIntro(){introTravel=Math.max(1,intro.offsetHeight-siteHeader.offsetHeight);scheduleHeader()}
function updateHeader(){
 const progress=Math.min(1,Math.max(0,window.scrollY/introTravel));
 const eased=progress*progress*(3-2*progress);
 siteHeader.style.setProperty('--header-fill',eased.toFixed(4));
 siteHeader.classList.toggle('is-scrolled',progress>0);
 introPhoto.style.transform=desktopMotion.matches&&!reducedMotion.matches?'translateY('+(progress*16).toFixed(2)+'px) scale(1.05)':'';
 headerFrame=0;
}
function scheduleHeader(){if(!headerFrame)headerFrame=requestAnimationFrame(updateHeader)}
window.addEventListener('scroll',scheduleHeader,{passive:true});
window.addEventListener('resize',measureIntro,{passive:true});
if('ResizeObserver' in window){const introResize=new ResizeObserver(measureIntro);introResize.observe(intro);introResize.observe(siteHeader)}
measureIntro();updateHeader();

// Once-only motion follows the content hierarchy; default DOM is always visible.
const activeEntrances=new Set();
const nodeMotion=new WeakMap();
const revealed=new WeakSet();
let entranceObserver;
const pendingEntrances=new Map();
let preparation=null;
function trackAnimation(node,frames,options){
 if(!node||reducedMotion.matches||!Element.prototype.animate)return null;
 nodeMotion.get(node)?.cancel();
 const prepared=preparation!==null;
 const animation=node.animate(frames,{easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards',...options,...(prepared?{fill:'both'}:{})});
 if(prepared){animation.pause();animation.currentTime=0;preparation.push(animation);animation.finished.then(()=>animation.cancel()).catch(()=>{})}
 nodeMotion.set(node,animation);activeEntrances.add(animation);animation.finished.catch(()=>{}).finally(()=>{activeEntrances.delete(animation);if(nodeMotion.get(node)===animation)nodeMotion.delete(node)});return animation;
}
function lift(node,delay=0,distance=24,duration=1300){return trackAnimation(node,[{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration,delay,easing:'cubic-bezier(.22,.61,.36,1)'})}
function revealPhoto(frame,delay=0){
 if(!frame)return;
 trackAnimation(frame,[{opacity:0},{opacity:1}],{duration:1800,delay,easing:'cubic-bezier(.22,.61,.36,1)'});
 const photo=frame.querySelector('img');
 trackAnimation(photo,[{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:1800,delay,easing:'cubic-bezier(.22,.61,.36,1)'});
}
function revealCopy(container,delay=0){
 if(!container)return;
 const parts=[...container.children];
 parts.forEach((child,i)=>lift(child,delay+Math.min(i*160,420)));
}
function revealContent(node){
 if(reducedMotion.matches)return;
 if(node.matches('[data-mobile-carousel]')){if(mobileCarouselQuery.matches)lift(node,0,18,1500);return}
 if(node.matches('.showroom-visual,.kit-visual,.collection-image,.project-photo,.journal-preview')){
  revealPhoto(node);
 }else if(node.matches('.showroom-intro,.collection-copy,.project-caption')){
  if(node.matches('.collection-copy')){
   const parts=[node.querySelector('.tabs'),node.querySelector('h2'),node.querySelector('#collection-description'),node.querySelector('#collection-link')];
   parts.forEach((part,i)=>lift(part,i*160));
  }else revealCopy(node);
 }else if(node.matches('.project-cta-copy')){
  revealCopy(node.querySelector('.kit-copy-text'));
  lift(node.querySelector('.kit-round-button'),320,16,1200);
 }else if(node.matches('.category,.model-card')){
  const siblings=[...node.parentElement.children];const i=siblings.indexOf(node);
  const cols=getComputedStyle(node.parentElement).gridTemplateColumns.split(' ').length;
  const delay=Math.min((i%cols)*110,240);
  lift(node,delay,26,1400);
 }else if(node.matches('.selection-steps li')){
  const i=[...node.parentElement.children].indexOf(node);
  const columns=getComputedStyle(node.parentElement).gridTemplateColumns.split(' ').length;
  const delay=columns>1?(i%columns)*110:0;
  trackAnimation(node.querySelector('span'),[{opacity:0},{opacity:1}],{duration:1500,delay});
  const copy=node.querySelector('div');[...copy.children].forEach((child,n)=>lift(child,delay+160+n*140,22));

 }else if(node.matches('.journal-grid>a>h3,.journal-grid>a>p,.journal-arrow')){
  lift(node);
 }else{
  revealCopy(node);
 }
}
function showPending(node,instant=false){
 const animations=pendingEntrances.get(node);if(!animations)return;
 pendingEntrances.delete(node);revealed.add(node);entranceObserver?.unobserve(node);
 animations.forEach(animation=>instant?animation.cancel():animation.play());
}
function setupEntrances(){
 if(reducedMotion.matches||!('IntersectionObserver' in window)||!Element.prototype.animate){document.documentElement.classList.remove('motion-boot');return}
 entranceObserver?.disconnect();
 entranceObserver=new IntersectionObserver(entries=>{for(const entry of entries){
  if(entry.isIntersecting)showPending(entry.target);
 }},{threshold:.15,rootMargin:`0px 0px -${Math.round(window.innerHeight*.24)}px 0px`});
 try{
  document.querySelectorAll('.section-heading,.category,.model-card,.collection-image,.collection-copy,.selection-lead,.selection-steps li,.showroom-visual,.showroom-intro,.project-photo,.project-caption,.journal-preview,.journal-grid>a>h3,.journal-grid>a>p,.journal-arrow,.kit-visual,.project-cta-copy,[data-mobile-carousel]').forEach(node=>{
   if(node.matches('[data-mobile-carousel]')&&!mobileCarouselQuery.matches){showPending(node,true);return}
   // A swipe must never uncover a card still paused at opacity zero.
   if(mobileCarouselQuery.matches&&!node.matches('[data-mobile-carousel]')&&node.closest('[data-mobile-carousel]')){showPending(node,true);revealed.add(node);return}
   if(revealed.has(node))return;
   if(!pendingEntrances.has(node)){
    // A reload, history restoration or hash landing must not rewind visible content.
    if(node.getBoundingClientRect().top<window.innerHeight*.76){revealed.add(node);return}
    preparation=[];revealContent(node);pendingEntrances.set(node,preparation);preparation=null;
   }
   entranceObserver.observe(node);
  });
 }catch(error){
  preparation?.forEach(animation=>animation.cancel());preparation=null;
  pendingEntrances.forEach(animations=>animations.forEach(animation=>animation.cancel()));pendingEntrances.clear();entranceObserver.disconnect();
 }finally{document.documentElement.classList.remove('motion-boot')}
}
// The intro plays on load, independently of the scroll observer.
if(!reducedMotion.matches&&Element.prototype.animate&&window.scrollY<80){
 preparation=[];
 revealCopy(document.querySelector('.hero-copy'));
 trackAnimation(document.querySelector('.hero-image'),[{opacity:0},{opacity:1}],{duration:1800,easing:'cubic-bezier(.22,.61,.36,1)'});
 const introAnimations=preparation;preparation=null;introAnimations.forEach(animation=>animation.play());
}
setupEntrances();
let entranceResizeTimer;window.addEventListener('resize',()=>{clearTimeout(entranceResizeTimer);entranceResizeTimer=setTimeout(setupEntrances,150)},{passive:true});
document.addEventListener('focusin',event=>{for(const node of pendingEntrances.keys())if(node.contains(event.target))showPending(node,true)});
reducedMotion.addEventListener('change',event=>{
 if(event.matches){entranceObserver?.disconnect();activeEntrances.forEach(animation=>animation.cancel());activeEntrances.clear();pendingEntrances.clear();document.documentElement.classList.remove('motion-boot');collectionAnimation?.cancel()}
 else setupEntrances();
 scheduleHeader();
});
desktopMotion.addEventListener('change',scheduleHeader);
// Pointer open/close is gentle; Escape and keyboard controls remain immediate.
const dialogExits=new WeakMap();
function closeDialog(dialog,animate=false){
 if(dialogExits.has(dialog))return;
 if(!animate||reducedMotion.matches){dialog.close();return}
 const animation=trackAnimation(dialog,[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(4px) scale(.995)'}],{duration:160,fill:'forwards'});
 if(!animation){dialog.close();return}
 dialogExits.set(dialog,animation);
 animation.finished.catch(()=>{}).finally(()=>{dialogExits.delete(dialog);dialog.close();animation.cancel()});
}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.addEventListener('cancel',()=>{dialogExits.get(dialog)?.cancel()});
 dialog.addEventListener('close',()=>{dialog.getAnimations?.().forEach(animation=>animation.cancel())});
});
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',event=>{
 if(!event.detail||reducedMotion.matches)return;
 const dialog=document.getElementById(button.dataset.open);
 trackAnimation(dialog,[{opacity:.8,transform:'translateY(6px) scale(.99)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:260});
}));

// Native scrolling owns touch gestures and cancellation; controls are an
// alternative to swiping. No cloned cards, autoplay or pointer interception.
document.querySelectorAll('[data-mobile-carousel]').forEach((track,group)=>{
 const cards=[...track.children];
 const title=track.closest('section').querySelector('h2').textContent.trim();
 track.id=`mobile-carousel-${group+1}`;
 const controls=document.createElement('div');controls.className='carousel-controls';
 const count=document.createElement('span');count.className='carousel-count';
 count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
 function control(direction,label){const button=document.createElement('button');button.type='button';button.className='icon-button carousel-control';button.setAttribute('aria-label',`${label}: ${title}`);button.setAttribute('aria-controls',track.id);const svg=makeArrow();svg.querySelector('path').setAttribute('d',direction<0?'M19 12H5m6-6-6 6 6 6':'M5 12h14m-6-6 6 6-6 6');button.append(svg);return button}
 const prev=control(-1,'Предыдущая карточка'),next=control(1,'Следующая карточка');
 const actions=document.createElement('div');actions.className='carousel-actions';actions.append(prev,next);controls.append(count,actions);track.before(controls);
 let index=-1,offsets=[],frame=0;
 function update(){frame=0;if(!mobileCarouselQuery.matches)return;let nearest=0;offsets.forEach((offset,i)=>{if(Math.abs(offset-track.scrollLeft)<Math.abs(offsets[nearest]-track.scrollLeft))nearest=i});if(nearest===index)return;index=nearest;count.textContent=`${String(index+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;prev.disabled=index===0;next.disabled=index===cards.length-1;}
 function measure(){offsets=cards.map(card=>card.offsetLeft-cards[0].offsetLeft);index=-1;update()}
 function ready(){showPending(track,true);const animation=nodeMotion.get(track);if(animation?.playState==='running')animation.finish()}
 function move(step,keyboard){ready();const nearest=Math.max(0,Math.min(cards.length-1,index+step));track.scrollTo({left:offsets[nearest],behavior:keyboard||reducedMotion.matches?'instant':'smooth'})}
 track.addEventListener('pointerdown',ready,{passive:true});
 prev.addEventListener('click',event=>move(-1,event.detail===0));next.addEventListener('click',event=>move(1,event.detail===0));
 track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});
 track.addEventListener('keydown',event=>{if(event.target!==track||!mobileCarouselQuery.matches)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1,true)}});
 function mode(){controls.hidden=!mobileCarouselQuery.matches;if(mobileCarouselQuery.matches){track.setAttribute('role','region');track.setAttribute('aria-roledescription','карусель');track.setAttribute('aria-label',title);track.tabIndex=0;measure()}else{showPending(track,true);nodeMotion.get(track)?.cancel();track.removeAttribute('role');track.removeAttribute('aria-roledescription');track.removeAttribute('aria-label');track.removeAttribute('tabindex');track.scrollLeft=0;}}
 mobileCarouselQuery.addEventListener('change',mode);new ResizeObserver(measure).observe(track);mode();
});
