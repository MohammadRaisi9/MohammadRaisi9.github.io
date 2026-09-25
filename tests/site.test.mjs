import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const load=async path=>JSON.parse(await readFile(path,'utf8'));
test('all app metadata has unique valid IDs and statuses',async()=>{
 const a=await load('content/apps/moallemyar.json'),b=await load('content/apps/study-coach.json');
 assert.notEqual(a.id,b.id);for(const p of [a,b]){assert.match(p.id,/^[a-z0-9-]+$/);assert.ok(['planned','development','released'].includes(p.status));assert.ok(p.title&&p.summary)}
});
test('unreleased apps cannot offer APK downloads',async()=>{
 const a=await load('content/apps/moallemyar.json'),b=await load('content/apps/study-coach.json');
 assert.ok([a,b].every(p=>p.status!=='released'&&!p.apk_url));
});
test('build creates valid public catalog',async()=>{
 const cmd=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8'});
 assert.equal(cmd.status,0,cmd.stderr);
 const data=await load('dist/data/apps.json');assert.equal(data.length,2);
 assert.ok(data.every(p=>!p.apk_url));
});
test('public configuration excludes private credentials',async()=>{
 const code=await readFile('site-config.js','utf8');
 assert.match(code,/supabasePublishableKey/);
 assert.doesNotMatch(code,/service_role\s*[:=]\s*['"][a-z]/);
 assert.doesNotMatch(code,/github_pat_[A-Za-z0-9]/);
});
