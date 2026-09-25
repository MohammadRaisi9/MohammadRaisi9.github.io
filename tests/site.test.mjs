import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const load=async path=>JSON.parse(await readFile(path,'utf8'));

test('catalog has valid nonduplicated app metadata',async()=>{
 const a=await load('content/apps/moallemyar.json'),b=await load('content/apps/study-coach.json');
 assert.notEqual(a.id,b.id);
 for(const p of [a,b]){
   assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
   assert.ok(['planned','development','released'].includes(p.status));
   assert.ok(p.title&&p.summary);
 }
});
test('prototype apps must not offer fake APKs',async()=>{
 for(const p of [await load('content/apps/moallemyar.json'),await load('content/apps/study-coach.json')])
   assert.ok(p.status!=='released'&&!p.apk_url&&!p.apk_file);
});
test('Pages CMS config supports media and public site settings',async()=>{
 const cms=await readFile('.pages.yml','utf8');
 for(const field of ['assets/uploads','assets/apks','apk_file','apk_url','screenshots','content/site.json','supabase_publishable_key'])assert.ok(cms.includes(field),field);
});
test('website builds and generates secure public catalog',async()=>{
 const p=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);
 const apps=await load('dist/data/apps.json');
 assert.equal(apps.length,2);
 assert.ok(apps.every(a=>!a.apk_url));
 const cfg=await readFile('dist/site-config.js','utf8');
 assert.match(cfg,/supabasePublishableKey/);
 assert.doesNotMatch(cfg,/service_role\s*[:=]\s*['"][a-z]/);
 assert.doesNotMatch(cfg,/sb_secret_[A-Za-z0-9]/);
});
test('client supports direct local APK file downloads',async()=>{
 const home=await readFile('dist/home.js','utf8'),detail=await readFile('dist/detail.js','utf8');
 assert.match(home,/assets/);
 assert.match(detail,/assets/);
 assert.match(home,/apks/);
 assert.match(detail,/apks/);
});
