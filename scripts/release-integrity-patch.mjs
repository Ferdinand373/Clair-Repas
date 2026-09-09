// Emit a narrowly scoped patch after reviewing index.html. Does not write files.
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const raw=p=>readFileSync(resolve(root,p));
const read=p=>raw(p).toString('utf8').replace(/\r\n?/g,'\n');
const index=read('index.html'),sw=read('sw.js'),shopping=read('scripts/validate-shopping-v2.mjs');
const assets=JSON.parse(sw.match(/const CORE_FILES = (\[[\s\S]*?\]);/)[1]);
const hash=createHash('sha256');
for(const asset of assets){
  const path=asset.slice(2)||'index.html';
  const content=/\.(html|js|json|webmanifest|txt|text)$/i.test(path)?Buffer.from(read(path)):raw(path);
  hash.update(asset).update('\0').update(content).update('\0');
}
const start=shopping.indexOf('function replaceSingle('),end=shopping.indexOf('function extractRealRecipeLibrary(',start);
assert.ok(start>=0&&end>start);
const context={assert,index};
vm.runInNewContext(shopping.slice(start,end)+'\nresult=sanitizeQr1Index(index);',context);
const digest=createHash('sha256').update(index).digest('hex');
const blob=createHash('sha1').update(`blob ${Buffer.byteLength(index)}\0`).update(index).digest('hex');
const sanitized=createHash('sha256').update(context.result).digest('hex');
const edits=[
  ['sw.js',/const CORE_REVISION = "[^"]+";/,`const CORE_REVISION = "sha256:${hash.digest('hex')}";`],
  ['sw.js',/  "\.\/": "sha256:[^"]+",/,`  "./": "sha256:${digest}",`],
  ['sw.js',/  "\.\/index.html": "sha256:[^"]+",/,`  "./index.html": "sha256:${digest}",`],
  ['scripts/validate-static-app.mjs',/const PRODUCTION_V75_INDEX_BLOB = "[^"]+";/,`const PRODUCTION_V75_INDEX_BLOB = "${blob}";`],
  ['scripts/validate-shopping-v2.mjs',/const EXPECTED_SANITIZED_INDEX_SHA256 = "[^"]+";/,`const EXPECTED_SANITIZED_INDEX_SHA256 = "${sanitized}";`]
];
const chunks=new Map();
for(const [path,pattern,replacement] of edits){
  const match=read(path).match(pattern);assert.ok(match,path);
  if(match[0]!==replacement){
    if(!chunks.has(path))chunks.set(path,[]);
    chunks.get(path).push(`@@\n-${match[0]}\n+${replacement}`);
  }
}
console.log('*** Begin Patch\n'+[...chunks].map(([path,hunks])=>`*** Update File: ${resolve(root,path).replaceAll('\\','/')}\n${hunks.join('\n')}`).join('\n')+'\n*** End Patch');
