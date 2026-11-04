const {app,BrowserWindow,ipcMain,dialog,shell,safeStorage,globalShortcut,desktopCapturer,screen,clipboard,nativeImage,Menu,protocol,net}=require('electron');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs/promises');const path=require('node:path');const crypto=require('node:crypto');
const {userMessage}=require('../core/errors.cjs');
const {captureCrop}=require('../core/capture-geometry.cjs');
const {Engine}=require('../core/engine.cjs');const {safeRelative,uniquePath}=require('../core/files.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'lantern-image',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
if(process.env.LANTERN_DATA_DIR)app.setPath('userData',path.resolve(process.env.LANTERN_DATA_DIR));
if(!app.requestSingleInstanceLock())app.quit();
let main,engine,captures=[],captureFrames=new Map(),captureBusy=false;
app.on('second-instance',()=>{if(main){if(main.isMinimized())main.restore();main.show();main.focus();}});
const ui=path.join(__dirname,'../ui');
function windowOptions(extra={}){return {webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true},...extra};}
function secure(win){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
function logError(error,scope='application'){const entry=new Date().toISOString()+' '+scope+' '+(error.stack||String(error))+'\n';fs.mkdir(app.getPath('userData'),{recursive:true}).then(()=>fs.appendFile(path.join(app.getPath('userData'),'diagnostics.log'),entry)).catch(()=>{});}
function bind(name,fn,captureOnly=false){ipcMain.handle('lantern:'+name,async(event,...args)=>{const allowed=captureOnly?captures.some(w=>w.webContents===event.sender):main?.webContents===event.sender;if(!allowed)throw Error('非法窗口请求');try{return await fn(...args);}catch(error){logError(error,name);throw Error(userMessage(error));}});}
async function allowedPath(input){if(typeof input!=='string')throw Error('无效路径');const real=await fs.realpath(input);const roots=[...engine.state.roots,engine.state.settings.downloadDir];
  const recorded=engine.state.transfers.some(t=>t.path&&path.resolve(t.path)===real);if(recorded)return real;
  for(const root of roots){try{const base=await fs.realpath(root);const rel=path.relative(base,real);if(rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel)))return real;}catch{}}
  throw Error('请先添加该文件所在目录');}
async function pick(kind){const r=await dialog.showOpenDialog(main,{properties:kind==='directory'?['openDirectory']:['openFile','multiSelections']});return r.canceled?[]:r.filePaths;}
function closeCapture(){for(const win of captures)if(!win.isDestroyed())win.close();captures=[];captureFrames.clear();captureBusy=false;}
async function capture(){if(captureBusy)return;captureBusy=true;try{
  const displays=screen.getAllDisplays();const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:Math.max(...displays.map(d=>Math.ceil(d.size.width*d.scaleFactor))),height:Math.max(...displays.map(d=>Math.ceil(d.size.height*d.scaleFactor)))}});
  for(const display of displays){const source=sources.find(s=>s.display_id===String(display.id))||(displays.length===1&&sources.length===1&&!sources[0].display_id?sources[0]:undefined);if(!source||source.thumbnail.isEmpty())throw Error('暂时无法读取屏幕，请稍后重试；若仍失败，请重新打开 Lantern。');
    const image=nativeImage.createFromBuffer(source.thumbnail.toPNG()); const win=new BrowserWindow(windowOptions({x:display.bounds.x,y:display.bounds.y,width:display.bounds.width,height:display.bounds.height,frame:false,thickFrame:false,resizable:false,movable:false,fullscreenable:true,alwaysOnTop:true,skipTaskbar:true,show:false,backgroundColor:'#000000'}));
    secure(win);captures.push(win);captureFrames.set(String(display.id),{image,width:display.bounds.width,height:display.bounds.height});
    win.setMenuBarVisibility(false);await win.loadFile(path.join(ui,'capture.html'),{query:{display:String(display.id)}});win.setFullScreen(true);win.show();win.focus();
  }
}catch(e){closeCapture();throw e;}}
app.whenReady().then(async()=>{
  if(!safeStorage.isEncryptionAvailable())throw Error('Windows 凭据加密不可用');
  const receiveRoot=process.env.LANTERN_DATA_DIR?app.getPath('userData'):(app.isPackaged?path.dirname(app.getPath('exe')):app.getAppPath());
  engine=new Engine(app.getPath('userData'),{logError,downloadDir:path.join(receiveRoot,'fileManagement'),encode:s=>safeStorage.encryptString(s),decode:b=>safeStorage.decryptString(b)});await engine.start(Number(process.env.LANTERN_PORT)||0,process.env.LANTERN_DISCOVERY!=='0');
  protocol.handle('lantern-image',async request=>{
    try{const url=new URL(request.url);if(url.hostname!=='transfer')return new Response('Not found',{status:404});
      const id=decodeURIComponent(url.pathname.slice(1));const t=engine.state.transfers.find(t=>t.id===id&&t.path&&(t.status==='已完成'||t.direction==='out')&&/\.(png|jpe?g|gif|webp|bmp)$/i.test(t.name));
      if(!t)return new Response('Not found',{status:404});
      const file=await allowedPath(t.path);const response=await net.fetch(pathToFileURL(file).toString());
      return new Response(response.body,{status:response.status,headers:{'Content-Type':({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.bmp':'image/bmp'})[path.extname(t.name).toLowerCase()],'Content-Security-Policy':"default-src 'none'",'X-Content-Type-Options':'nosniff'}});
    }catch{return new Response('Image unavailable',{status:404});}
  });
  main=new BrowserWindow(windowOptions({width:1220,height:820,minWidth:780,minHeight:580,title:'Lantern',icon:path.join(__dirname,'../assets/icon.ico'),backgroundColor:'#f5f6f8',show:false}));secure(main);Menu.setApplicationMenu(null);
  const register=shortcut=>{if(!globalShortcut.register(shortcut,()=>capture().catch(e=>(logError(e,'capture'),dialog.showErrorBox('截图失败',userMessage(e))))))throw Error('截图快捷键已被占用，请换一个组合键');};
  bind('snapshot',()=>engine.snapshot());
  bind('copyPairingCode',async()=>{const code=engine.snapshot().code;for(let attempt=0;attempt<3;attempt++){clipboard.writeText(code);if(clipboard.readText()===code)return code;await new Promise(resolve=>setTimeout(resolve,60));}throw Error('剪贴板暂时不可用，请稍后重试复制配对码。');});bind('refreshDevices',()=>engine.refreshDevices());bind('inspect',(host,port)=>engine.inspect(host,port));bind('pair',input=>engine.pair(input));bind('message',(id,text)=>engine.message(id,text));
  bind('pick',kind=>pick(kind));bind('send',async(id,paths)=>{for(const p of paths){if(typeof p!=='string')throw Error('文件路径无效');}return engine.send(id,paths);});
  bind('cancel',id=>engine.cancel(id));bind('retry',id=>engine.retry(id));bind('accept',(id,value)=>engine.accept(id,value));
  bind('forget',id=>{engine.state.peers=engine.state.peers.filter(p=>p.id!==id);engine.save();});
  bind('roots',async(action,root)=>{if(action==='add'){const dirs=await pick('directory');for(const dir of dirs)if(!engine.state.roots.includes(dir))engine.state.roots.push(dir);}else if(action==='remove')engine.state.roots=engine.state.roots.filter(r=>r!==root);engine.save();});
  bind('list',async(root)=>{root=await allowedPath(root);const entries=await fs.readdir(root,{withFileTypes:true});const result=[];for(const e of entries){if(e.isSymbolicLink())continue;const file=path.join(root,e.name);try{const stat=await fs.stat(file);result.push({path:file,name:e.name,size:stat.size,modified:stat.mtimeMs,isDirectory:e.isDirectory()});}catch{}}return result;});
  bind('fileAction',async(action,paths,name)=>{if(!Array.isArray(paths)||!paths.length)throw Error('请先选择文件');const sources=[];for(const p of paths)sources.push(await allowedPath(p));
    if(action==='open'){const ext=path.extname(sources[0]).toLowerCase();if(['.exe','.com','.bat','.cmd','.ps1','.vbs','.js','.msi','.scr','.lnk','.url','.hta','.reg'].includes(ext))throw Error('请在资源管理器中检查后打开此类文件');const error=await shell.openPath(sources[0]);if(error)throw Error(error);return;}
    if(action==='reveal'){shell.showItemInFolder(sources[0]);return;}
    if(action==='rename'){if(sources.length!==1)throw Error('一次只能重命名一个文件');safeRelative(name);if(/[\\/]/.test(name))throw Error('名称不能包含目录');const dest=path.join(path.dirname(sources[0]),name);try{await fs.access(dest);throw Error('同名文件已存在');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.rename(sources[0],dest);for(const t of engine.state.transfers)if(t.path===sources[0])t.path=dest;engine.save();return;}
    if(!['trash','copy','move'].includes(action))throw Error('不支持的操作');
    let destination;if(action!=='trash'){[destination]=await pick('directory');if(!destination)return {cancelled:true};}
    const failures=[];let succeeded=0;for(const source of sources){try{if(action==='trash')await shell.trashItem(source);else{const target=path.join(destination,path.basename(source));const rel=path.relative(source,target);if(rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel)))throw Error('不能复制到自身或子目录');await fs.cp(source,target,{recursive:true,errorOnExist:true,force:false});if(action==='move')await fs.rm(source,{recursive:true});}succeeded++;}catch(e){failures.push({name:path.basename(source),error:userMessage(e)});}}
    return {succeeded,failures};});
  bind('settings',async changes=>{if(changes.chooseDir){const [dir]=await pick('directory');if(dir)engine.state.settings.downloadDir=dir;}
    if(typeof changes.autoReceive==='boolean')engine.state.settings.autoReceive=changes.autoReceive;
    if(typeof changes.name==='string'&&changes.name.trim()){if(changes.name.length>80)throw Error('设备名称过长');engine.state.name=changes.name.trim();}
    if(changes.shortcut&&changes.shortcut!==engine.state.settings.shortcut){const old=engine.state.settings.shortcut;globalShortcut.unregister(old);try{register(changes.shortcut);engine.state.settings.shortcut=changes.shortcut;}catch(e){register(old);throw e;}}
    engine.save();return engine.snapshot();});
  bind('capture',capture);bind('captureData',id=>{const f=captureFrames.get(id);if(!f)throw Error('截图已结束');return {url:f.image.toDataURL(),width:f.width,height:f.height};},true);
  bind('captureCancel',closeCapture,true);bind('captureFinish',async(id,edges)=>{const f=captureFrames.get(id);if(!f)throw Error('截图已结束');const crop=captureCrop(edges,f.image.getSize()),image=f.image.crop(crop),expected=image.getSize();for(let attempt=0;attempt<5;attempt++){clipboard.writeImage(image);const actual=clipboard.readImage().getSize();if(actual.width===expected.width&&actual.height===expected.height){closeCapture();return;}await new Promise(resolve=>setTimeout(resolve,60));}throw Error('剪贴板暂时不可用，请关闭占用剪贴板的程序后再次点击复制。');},true);
  bind('pasteImage',async()=>{const image=clipboard.readImage();if(image.isEmpty())return null;const dir=path.join(app.getPath('userData'),'PastedImages');await fs.mkdir(dir,{recursive:true});const filename=path.join(dir,`截图-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.png`);await fs.writeFile(filename,image.toPNG());return {path:filename,url:image.resize({width:400}).toDataURL(),name:path.basename(filename)};});
  try{register(engine.state.settings.shortcut);}catch(e){engine.state.shortcutError=userMessage(e);}
  await main.loadFile(path.join(ui,'index.html'));main.show();
}).catch(e=>{(logError(e,'startup'),dialog.showErrorBox('Lantern 启动失败',userMessage(e)));app.quit();});
app.on('window-all-closed',()=>app.quit());app.on('will-quit',()=>{globalShortcut.unregisterAll();engine?.close();});
