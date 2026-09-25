import {readFile,readdir,mkdir,cp,writeFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');
const validId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,validStatus=new Set(['planned','development','released']);
const list=v=>Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean):[];
const image=v=>typeof v==='string'&&!v.includes('..')&&(/^(?:\/?assets\/uploads\/[\w./-]+\.(?:webp|png|jpe?g))$/i.test(v)||/^https:\/\/\S+\.(?:webp|png|jpe?g)(?:\?\S*)?$/i.test(v))?v:'';
const https=v=>typeof v==='string'&&/^https:\/\/\S+$/.test(v)?v:'';
const releaseApk=v=>{
  if(!https(v))return '';
  try{
    const u=new URL(v);
    if(!/\/[^/]+\.apk$/i.test(u.pathname))return '';
    if(u.hostname==='github.com'&&!/^\/[^/]+\/[^/]+\/releases\/(?:download\/[^/]+|latest\/download)\/[^/]+\.apk$/i.test(u.pathname))return '';
    return v;
  }catch{return ''}
};
const uploadedApk=v=>typeof v==='string'&&/^\/?assets\/apks\/[\w.-]+\.apk$/i.test(v)&&!v.includes('..')?v.replace(/^\//,''):'';
const folder=path.join(root,'content','apps'),names=(await readdir(folder)).filter(x=>x.endsWith('.json')).sort(),ids=new Set(),apps=[];
for(const name of names){
  const p=JSON.parse(await readFile(path.join(folder,name),'utf8'));
  if(!validId.test(p.id??'')||name!==p.id+'.json'||ids.has(p.id)||!p.title?.trim()||!p.summary?.trim()||!validStatus.has(p.status))throw Error('Invalid app metadata: '+name);
  ids.add(p.id);
  const upload=uploadedApk(p.apk_file),direct=releaseApk(p.apk_url);
  if(p.apk_file&&!upload)throw Error('Unsafe local APK path in '+name);
  if(upload){
    const file=path.join(root,upload),info=await stat(file).catch(()=>null);
    if(!info?.isFile()||info.size<2048)throw Error('Missing or empty signed APK for '+name+': '+upload);
    if(info.size>=50*1024*1024)throw Error('APK exceeds the recommended 50 MB media limit; publish it as a public GitHub Release instead: '+name);
  }
  const apk=p.status==='released'?(upload?'/'+upload:direct):'';
  if(p.status==='released'&&!apk)throw Error('Released app lacks a valid APK: '+name);
  apps.push({id:p.id,title:p.title.trim(),category:p.category||'اپلیکیشن اندروید',summary:p.summary.trim(),description:p.description||p.summary.trim(),status:p.status,featured:!!p.featured,icon:image(p.icon),screenshots:list(p.screenshots).map(image).filter(Boolean).slice(0,12),tags:list(p.tags),features:list(p.features),version:p.version||'',size_mb:p.size_mb||'',min_android:p.min_android||'',last_updated:p.last_updated||'',changelog:p.changelog||'',apk_url:apk,bazaar_url:https(p.bazaar_url),myket_url:https(p.myket_url)});
}
const site=JSON.parse(await readFile(path.join(root,'content','site.json'),'utf8'));
const url=site.supabase_url||'',key=site.supabase_publishable_key||'';
if(url||key){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw Error('Configure only the Supabase project URL and sb_publishable_ key; never commit secret keys.');
}
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'data'),{recursive:true});
for(const name of ['index.html','app.html','styles.css','market.css','home.js','detail.js','comments.js'])await cp(path.join(root,name),path.join(dist,name));
await cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
await writeFile(path.join(dist,'site-config.js'),'window.SITE_CONFIG = '+JSON.stringify({supabaseUrl:url,supabasePublishableKey:key})+';\n');
await writeFile(path.join(dist,'.nojekyll'),'');
await writeFile(path.join(dist,'data','apps.json'),JSON.stringify(apps.sort((a,b)=>Number(b.featured)-Number(a.featured)),null,2)+'\n');
console.log('Built '+apps.length+' app pages successfully');
