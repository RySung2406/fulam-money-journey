import { build } from 'esbuild';
await build({entryPoints:['site/app.js'],outfile:'site/app.bundle.js',bundle:true,format:'iife',platform:'browser',target:['es2020'],minify:true,legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'});
