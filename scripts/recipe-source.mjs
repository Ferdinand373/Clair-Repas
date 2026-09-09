import vm from 'node:vm';

// Read the assembled catalogue without running storage, networking or UI bootstrap.
export function recipeSource(html){
  const candidates=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([,attrs,body])=>!attrs.includes('src=')&&body.includes('const recipeLibrary='));
  if(candidates.length!==1)throw new Error('Expected one recipe library script');
  const code=candidates[0][2];
  const boundary=code.indexOf("$('libraryCount').textContent=");
  const start=code.indexOf('function recipeText('),end=code.indexOf('function inferFamily(',start);
  if(boundary<0||start<0||end<start)throw new Error('Recipe source boundaries changed');
  const context={window:{}};
  vm.runInNewContext(code.slice(0,boundary)+'\n'+code.slice(start,end)+
    '\n;this.catalog=recipeLibrary;this.editorial=typeof RECIPE_EDITORIAL==="undefined"?{}:RECIPE_EDITORIAL;',context,{timeout:15000});
  return {code,recipes:JSON.parse(JSON.stringify(context.catalog)),editorial:JSON.parse(JSON.stringify(context.editorial))};
}
