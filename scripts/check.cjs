const {readdirSync}=require('node:fs'); const {execFileSync}=require('node:child_process');
for(const dir of ['core','electron','ui','scripts','test']) for(const file of readdirSync(dir)) if(/\.(cjs|js)$/.test(file)) execFileSync(process.execPath,['--check',`${dir}/${file}`],{stdio:'inherit'});
console.log('JavaScript syntax OK');
