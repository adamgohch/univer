import {build} from 'esbuild';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const here=new URL('./',import.meta.url),out=new URL('dist/',here);
await build({entryPoints:[fileURLToPath(new URL('univer-frame.js',here))],bundle:true,format:'esm',outdir:fileURLToPath(new URL('vendor/univer/',out)),minify:true,legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file','.woff':'file','.ttf':'file','.svg':'file','.png':'file'}});
for(const name of ['univer-frame.html','univer-host.js','univer-model.js'])await fs.copyFile(new URL(name,here),new URL(name,out));
console.log('Built dist/. Serve its contents from the host application root.');
