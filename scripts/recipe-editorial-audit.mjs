import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {recipeSource} from './recipe-source.mjs';
import {inspectRecipe} from './validate-recipe-editorial.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {recipes,editorial}=recipeSource(readFileSync(resolve(root,'index.html'),'utf8'));
const inventory=JSON.parse(readFileSync(resolve(root,'docs/recipe-editorial-inventory.json'),'utf8'));
const pending=new Set(inventory.recipes.filter(r=>r.status==='pending').map(r=>r.id));
const args=process.argv.slice(2);
const selected=args[0]==='--pending'?recipes.filter(r=>pending.has(r.id)).slice(Number(args[1]||0),Number(args[1]||0)+Number(args[2]||30)):recipes.filter(r=>args.includes(r.id));
for(const r of selected){
  console.log(JSON.stringify({id:r.id,n:r.n,m:r.m,t:r.t,servings:r.servings||2,role:r.role,technique:r.technique,i:r.i,p:r.p,editorial:editorial[r.id],warnings:inspectRecipe(r,editorial[r.id]).map(i=>i.code)}));
}
