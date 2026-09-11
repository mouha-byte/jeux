import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['lib/chess-worker.ts'],outfile:'public/chess-worker.js',bundle:true,minify:true,format:'iife',platform:'browser',target:'es2020',legalComments:'eof'});
