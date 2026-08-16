"use strict";
const CACHE='clair-repas-v74-tables-de-france-20260816';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

async function cacheCore(){
  const cache=await caches.open(CACHE);
  for(const path of ASSETS){
    try{
      const response=await fetch(new Request(path,{cache:'reload'}));
      if(response.ok)await cache.put(path,response.clone());
    }catch(e){}
  }
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{await cacheCore();await self.skipWaiting()})());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('clair-repas-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          const copy=response.clone();
          event.waitUntil((async()=>{
            const cache=await caches.open(CACHE);
            await cache.put('./index.html',copy);
          })());
        }
        return response;
      }catch(e){
        return(await caches.match(request))||(await caches.match('./index.html'))||(await caches.match('./'))||Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok){
      const copy=response.clone();
      event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.put(request,copy)})());
    }
    return response;
  })());
});
