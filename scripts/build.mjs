import {readFile,readdir,mkdir,cp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');
const validId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,validStatus=new Set(['planned','development','released']);
const isHttps=s=>typeof s==='string'&&/^https:\/\/\S+$/.test(s);
const image=s=>typeof s==='string'&&(/^(?:\/?assets\/uploads\/[\w./-]+\.(?:webp|png|jpe?g))$/i.test(s)||/^https:\/\/\S+\.(?:webp|png|jpe?g)(?:\?\S*)?$/i.test(s))&&!s.includes('..')?s:'';
const list=a=>Array.isArray(a)?a.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean):[];
const folder=path.join(root,'content','apps'),names=(await readdir(folder)).filter(x=>x.endsWith('.json')).sort(),ids=new Set(),apps=[];
for(const name of names){
 const p=JSON.parse(await readFile(path.join(folder,name),'utf8'));
 if(!validId.test(p.id??'')||name!==p.id+'.json'||ids.has(p.id)||!p.title?.trim()||!p.summary?.trim()||!validStatus.has(p.status))throw Error('Invalid app: '+name);
 ids.add(p.id);
 const apk=p.status==='released'&&isHttps(p.apk_url)&&/\.apk(?:\?\S*)?$/i.test(p.apk_url)?p.apk_url:'';
 apps.push({id:p.id,title:p.title.trim(),category:p.category||'اپلیکیشن اندروید',summary:p.summary.trim(),description:p.description||p.summary.trim(),status:p.status,featured:!!p.featured,icon:image(p.icon),screenshots:list(p.screenshots).map(image).filter(Boolean).slice(0,12),tags:list(p.tags),features:list(p.features),version:p.version||'',size_mb:p.size_mb||'',min_android:p.min_android||'',last_updated:p.last_updated||'',changelog:p.changelog||'',apk_url:apk,bazaar_url:isHttps(p.bazaar_url)?p.bazaar_url:'',myket_url:isHttps(p.myket_url)?p.myket_url:''});
}
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'data'),{recursive:true});
for(const name of ['index.html','app.html','styles.css','market.css','home.js','detail.js','comments.js','site-config.js'])await cp(path.join(root,name),path.join(dist,name));
await cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
await writeFile(path.join(dist,'.nojekyll'),'');
await writeFile(path.join(dist,'data','apps.json'),JSON.stringify(apps.sort((a,b)=>Number(b.featured)-Number(a.featured)),null,2)+'\n');
console.log('Built '+apps.length+' apps in '+dist);
