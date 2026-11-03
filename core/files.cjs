const fs = require('node:fs/promises');
const path = require('node:path');
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
module.exports = {safeRelative, uniquePath, walk};
