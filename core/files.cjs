const fs = require('node:fs/promises');
const path = require('node:path');
const {constants,createReadStream}=require('node:fs');
const crypto=require('node:crypto');
function safeRelative(name) {
  if (typeof name !== 'string' || !name || name.length > 2000 || /[\x00-\x1f<>:"|?*]/.test(name)) throw Error('文件名无效');
  const parts = name.replaceAll('\\', '/').split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) throw Error('文件路径无效');
  return parts.join(path.sep);
}
async function uniquePath(root, name) {
  const relative = safeRelative(name), target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error('文件路径越界');
  await fs.mkdir(path.dirname(target), { recursive: true });
  const realRoot = await fs.realpath(root), realParent = await fs.realpath(path.dirname(target));
  const parentRelative = path.relative(realRoot, realParent);
  if (parentRelative.startsWith('..') || path.isAbsolute(parentRelative)) throw Error('目标目录包含越界链接');
  const ext = path.extname(target), stem = target.slice(0, target.length - ext.length);
  for (let n = 0; n < 10000; n++) {
    const result = n ? `${stem} (${n})${ext}` : target;
    try { const handle = await fs.open(result, 'wx'); await handle.close(); return result; }
    catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
  throw Error('同名文件过多');
}
async function walk(input, prefix = path.basename(input)) {
  const stat = await fs.lstat(input);
  if (stat.isSymbolicLink()) return [];
  if (!stat.isDirectory()) return [{path: input, name:prefix, size:stat.size, modified:stat.mtimeMs}];
  const children = await fs.readdir(input);
  const result = [];
  for (const child of children) result.push(...await walk(path.join(input, child), `${prefix}/${child}`));
  return result;
}
// Keep the verified incoming partial until a complete destination file is committed.
async function finalizeReceived(part,root,name,expected,{io=fs,onCleanupError=()=>{}}={}){
 const target=await uniquePath(root,name),stage=path.join(path.dirname(target),`.lantern-${crypto.randomUUID()}.receiving`);let committed=false,stageOwned=false;
 try{
  try{await io.rename(part,target);committed=true;return target;}catch(error){if(error.code!=='EXDEV')throw error;}
  try{await io.copyFile(part,stage,constants.COPYFILE_EXCL);stageOwned=true;}catch(error){if(error.code!=='EEXIST')await io.unlink(stage).catch(()=>{});throw error;}
  const stat=await io.stat(stage);if(stat.size!==expected.size)throw Error('文件保存不完整，请重试');const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(stage))hash.update(chunk);if(hash.digest('hex')!==expected.hash)throw Error('文件保存校验失败，请重试');
  const handle=await io.open(stage,'r+');try{await handle.sync();}finally{await handle.close();}
  await io.rename(stage,target);stageOwned=false;committed=true;await io.unlink(part).catch(error=>onCleanupError(error));return target;
 }finally{if(stageOwned)await io.unlink(stage).catch(()=>{});if(!committed)await io.unlink(target).catch(()=>{});}
}
module.exports = {safeRelative, uniquePath, walk,finalizeReceived};
