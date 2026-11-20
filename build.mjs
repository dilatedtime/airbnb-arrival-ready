import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
await fs.mkdir('docs',{recursive:true});
const result=await build({entryPoints:['src/app.jsx'],bundle:true,write:false,minify:true,format:'iife',target:'es2020',define:{'process.env.NODE_ENV':'"production"'},external:['__INTER_REGULAR__','__INTER_BOLD__'],outdir:'docs'});
const js=result.outputFiles.find(x=>x.path.endsWith('.js')).text;
let css=result.outputFiles.find(x=>x.path.endsWith('.css')).text;
for(const [token,file] of [['__INTER_REGULAR__','inter-latin-400-normal.woff2'],['__INTER_BOLD__','inter-latin-700-normal.woff2']]){const font=await fs.readFile(path.join('node_modules/@fontsource/inter/files',file));css=css.replaceAll(token,'data:font/woff2;base64,'+font.toString('base64'));}
await fs.mkdir('docs/assets',{recursive:true});
const assetNames=(await fs.readdir('assets')).filter(n=>n!=='arrival-scene.png');
for(const name of assetNames)await fs.copyFile(path.join('assets',name),path.join('docs/assets',name));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="description" content="Airbnb-style product design prototype with a proposed arrival readiness and recovery flow."><title>Airbnb | Arrival Ready concept</title><link rel="icon" href="./assets/favicon.svg"><style>'+css+'</style></head><body><div id="root"></div><script>'+js.replaceAll('</script','<\\/script')+'</script></body></html>';
await fs.writeFile('docs/index.html',html);
await fs.writeFile('docs/.nojekyll','');
const names=assetNames.map(n=>'./assets/'+n);
const cacheName='airbnb-ready-'+Date.now();
await fs.writeFile('docs/sw.js',`const CACHE=${JSON.stringify(cacheName)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(${JSON.stringify(['./','./index.html',...names])})).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('airbnb-ready-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))});`);
console.log('Built docs/index.html and local assets.');
