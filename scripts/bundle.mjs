import { build } from 'esbuild';
await build({entryPoints:['site/app.js'],outfile:'site/app.bundle.js',bundle:true,format:'iife',platform:'browser',target:['es2020'],minify:true,legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'});
await build({entryPoints:['site/game-auth.js'],outfile:'site/game/auth.bundle.js',bundle:true,format:'iife',platform:'browser',target:['es2020'],minify:true,legalComments:'linked',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'});
