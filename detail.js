import {setupComments} from './comments.js';
const $=id=>document.getElementById(id),slug=new URLSearchParams(location.search).get('id')||'';
const safeImg=v=>typeof v==='string'&&(/^(?:https:\/\/|\/?assets\/uploads\/)/.test(v))?v:'';
const ext=v=>typeof v==='string'&&/^https:\/\/\S+$/.test(v)?v:'';
const apk=v=>ext(v)&&/\.apk(?:\?\S*)?$/i.test(v)?v:'';
function render(p){document.title=p.title+' | محمد رئیسی';$('detail-title').textContent=p.title;$('detail-category').textContent=p.category;$('detail-summary').textContent=p.summary;$('detail-description').textContent=p.description||p.summary;
const icon=safeImg(p.icon);if(icon){const image=document.createElement('img');image.src=icon;image.alt='';$('detail-icon').replaceChildren(image)}else $('detail-icon').textContent=p.title[0];
for(const t of p.tags||[]){const el=document.createElement('span');el.textContent=t;$('detail-tags').append(el)}
const downloads=$('detail-downloads'),direct=p.status==='released'?apk(p.apk_url):'';
if(direct){const a=document.createElement('a');a.className='btn btn-primary';a.href=direct;a.rel='noopener noreferrer';a.textContent='دریافت مستقیم APK ↓';downloads.append(a)}else{const s=document.createElement('span');s.className='btn btn-inactive';s.textContent='فایل APK هنوز منتشر نشده';downloads.append(s)}
for(const [url,name] of [[p.bazaar_url,'کافه‌بازار ↗'],[p.myket_url,'مایکت ↗']])if(ext(url)){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='btn btn-outline btn-alt';a.textContent=name;downloads.append(a)}
const gallery=$('screenshot-gallery'),shots=(p.screenshots||[]).map(safeImg).filter(Boolean);
if(!shots.length){const t=document.createElement('p');t.className='screenshots-empty';t.textContent='هنوز اسکرین‌شاتی منتشر نشده است.';gallery.append(t)}
shots.forEach((s,i)=>{const b=document.createElement('button'),image=document.createElement('img');b.className='screenshot-button';b.type='button';b.setAttribute('aria-label','نمایش تصویر '+(i+1));image.src=s;image.loading='lazy';image.alt='اسکرین‌شات '+(i+1)+' از '+p.title;b.append(image);b.addEventListener('click',()=>{$('dialog-image').src=s;$('dialog-image').alt=image.alt;$('image-dialog').showModal()});gallery.append(b)});
for(const feature of p.features||[]){const li=document.createElement('li');li.textContent=feature;$('feature-list').append(li)}
if(!(p.features||[]).length){const li=document.createElement('li');li.textContent='جزئیات امکانات به‌زودی اضافه می‌شود.';$('feature-list').append(li)}
const status={planned:'در مرحله طراحی',development:'در حال توسعه',released:'منتشرشده'};
for(const [name,value] of [['وضعیت',status[p.status]||'نامشخص'],['توسعه‌دهنده','محمد رئیسی'],['نسخه',p.version||'هنوز منتشر نشده'],['حجم فایل',p.size_mb?p.size_mb+' مگابایت':'—'],['حداقل اندروید',p.min_android||'—'],['آخرین به‌روزرسانی',p.last_updated||'—']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('app-info').append(dt,dd)}
if(p.changelog){const h=document.createElement('h3'),txt=document.createElement('p');h.textContent='تغییرات نسخه';txt.textContent=p.changelog;$('app-info').after(h,txt)}
$('app-loading').hidden=true;$('app-content').hidden=false;setupComments(p.id)}
$('dialog-close')?.addEventListener('click',()=>$('image-dialog').close());
$('image-dialog')?.addEventListener('click',e=>{if(e.target===$('image-dialog'))$('image-dialog').close()});
(async()=>{if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){$('app-loading').textContent='آدرس برنامه نامعتبر است.';return}try{const r=await fetch('data/apps.json',{cache:'no-cache'});if(!r.ok)throw Error('HTTP');const p=(await r.json()).find(x=>x.id===slug);if(!p){$('app-loading').textContent='برنامه موردنظر پیدا نشد.';return}render(p)}catch{$('app-loading').textContent='دریافت اطلاعات برنامه ممکن نشد.'}})();