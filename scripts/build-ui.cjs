require('./build-icons.cjs');
const {buildSync}=require('esbuild');const path=require('node:path');
buildSync({entryPoints:[path.resolve(__dirname,'../ui/controls/index.jsx')],outfile:path.resolve(__dirname,'../ui/controls.bundle.js'),bundle:true,minify:true,format:'iife',platform:'browser',target:'chrome140',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},external:['../assets/*'],legalComments:'linked',logLevel:'info'});

buildSync({entryPoints:[path.resolve(__dirname,'../core/errors.cjs')],outfile:path.resolve(__dirname,'../ui/errors.bundle.js'),bundle:true,minify:true,format:'iife',globalName:'LanternErrors',platform:'browser',target:'chrome140'});
