const https = require('node:https');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {EventEmitter} = require('node:events');
const {DiscoveryDirectory} = require('./discovery.cjs');
const {pipeline} = require('node:stream/promises');
const {Transform} = require('node:stream');
const {safeRelative, uniquePath, walk, finalizeReceived} = require('./files.cjs');
const {userMessage}=require('./errors.cjs');
const uuid = () => crypto.randomUUID();
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id);
async function hashFile(file) { const hash = crypto.createHash('sha256'); for await(const chunk of fs.createReadStream(file)) hash.update(chunk); return hash.digest('hex'); }
async function body(req, max = 1024 * 1024) {
  const chunks = []; let size = 0;
  for await(const chunk of req) { size += chunk.length; if(size > max) throw Error('请求过大'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function request(peer, route, data, method = 'POST', raw = false) {
  return new Promise((resolve, reject) => {
    const payload = data === undefined ? null : raw ? data : Buffer.from(JSON.stringify(data));
    const req = https.request({hostname:peer.host, port:peer.port, path:route, method, agent:false, rejectUnauthorized:false,
      headers:{'content-type':raw?'application/octet-stream':'application/json', ...(payload?{'content-length':payload.length}:{}), ...(peer.token?{'authorization':`Bearer ${peer.token}`}:{})}}, async res => {
      try {
        const fingerprint = res.socket.getPeerCertificate().fingerprint256;
        if(peer.fingerprint && fingerprint !== peer.fingerprint) { res.destroy(); throw Error('设备证书发生变化，请重新配对'); }
        const bytes = await body(res, 2*1024*1024); const result = JSON.parse(bytes.toString());
        if(res.statusCode >= 400) throw Error(result.error || '连接失败');
        resolve({...result, fingerprint});
      } catch(e) { reject(e); }
    });
    // Pin before sending any credentials or body, not merely before reading the response.
    req.on('socket', socket => socket.once('secureConnect', () => {
      if(peer.fingerprint && socket.getPeerCertificate().fingerprint256 !== peer.fingerprint) req.destroy(Error('设备证书发生变化，请重新配对'));
      else req.end(payload);
    }));
    req.setTimeout(peer.timeoutMs||20000, () => req.destroy(Error('连接超时，请检查对方电脑和防火墙')));
    req.on('error',reject);
  });
}
class Engine extends EventEmitter {
  constructor(dir, options={}) {
    super(); this.dir=dir; this.options=options; fs.mkdirSync(dir,{recursive:true});
    this.statePath=path.join(dir,'state.dat');
    try { this.state=JSON.parse(options.decode?options.decode(fs.readFileSync(this.statePath)):fs.readFileSync(this.statePath,'utf8')); }
    catch(e) { if(fs.existsSync(this.statePath)) throw Error('本地数据无法读取，请保留数据文件后联系开发者'); }
    this.state ||= {id:uuid(),name:os.hostname(),peers:[],messages:[],transfers:[],roots:[],settings:{autoReceive:true,downloadDir:options.downloadDir||path.join(os.homedir(),'Lantern','fileManagement'),shortcut:'Alt+Shift+S'}};
    if(options.downloadDir && this.state.settings.downloadDir===path.join(os.homedir(),'Downloads','Lantern')) this.state.settings.downloadDir=options.downloadDir;
    this.discovered=new Map(); this.active=new Map(); this.cancelled=new Set(); this.writing=new Set(); this.rate=new Map();
    this.rotateCode(); this.save();
    for(const t of this.state.transfers) if(['传输中','校验中','准备中'].includes(t.status)) t.status='已中断';
  }
  rotateCode(){this.code=String(crypto.randomInt(100000,1000000));this.codeExpires=Date.now()+5*60*1000;}
  save(){const text=JSON.stringify(this.state); fs.writeFileSync(this.statePath+'.tmp',this.options.encode?this.options.encode(text):text); fs.renameSync(this.statePath+'.tmp',this.statePath);this.emit('change');}
  async start(port=0, discovery=true){
    const certPath=path.join(this.dir,'identity.json'); let identity;
    if(fs.existsSync(certPath)) identity=JSON.parse(fs.readFileSync(certPath));
    else { identity=await require('selfsigned').generate([{name:'commonName',value:'Lantern LAN'}],{keySize:2048,days:3650,algorithm:'sha256'}); fs.writeFileSync(certPath,JSON.stringify(identity),{mode:0o600}); }
    this.fingerprint=new crypto.X509Certificate(identity.cert).fingerprint256;
    this.directory=new DiscoveryDirectory({selfId:this.state.id,selfFingerprint:this.fingerprint,entries:this.discovered,lookup:(host,port)=>request({host,port,timeoutMs:2500},'/hello',undefined,'GET')});
    this.server=https.createServer({key:identity.private,cert:identity.cert},(req,res)=>this.route(req,res));
    this.server.requestTimeout=30000;this.server.headersTimeout=15000;
    await new Promise((resolve,reject)=>{this.server.once('error',reject);this.server.listen(port,'0.0.0.0',resolve);});
    this.port=this.server.address().port;
    this.timer=setInterval(()=>{if(Date.now()>this.codeExpires)this.rotateCode();},1000); this.timer.unref();
    if(discovery){ const {Bonjour}=require('bonjour-service'); this.bonjour=new Bonjour({},e=>{this.options.logError?.(e,'discovery');this.emit('warning','自动发现暂不可用，请使用手动连接添加设备。');});
      this.service=this.bonjour.publish({name:`Lantern-${this.state.id}`,type:'lantern',port:this.port,txt:{id:this.state.id,name:this.state.name,v:'1'}});
      this.browser=this.bonjour.find({type:'lantern'},service=>{this.directory.observe(service);});
      this.browser.on('down',service=>this.directory.remove(service));
      this.browser.on('srv-update',(service,previous)=>{this.directory.remove(previous);this.directory.observe(service);});
      this.browser.on('txt-update',service=>this.directory.observe(service));
      this.discoveryTimer=setInterval(()=>{this.browser.expire();this.browser.update();for(const service of this.browser.services)this.directory.observe(service);this.directory.refresh();},10000);this.discoveryTimer.unref();
    }
    this.presenceTimer=setInterval(()=>this.presence(),5000);this.presenceTimer.unref(); this.presence(); return this;
  }
  publicInfo(){return {id:this.state.id,name:this.state.name,port:this.port,v:1};}
  snapshot(){return {...this.state,messages:this.state.messages.map(item=>({...item,error:item.error?userMessage(item.error):''})),transfers:this.state.transfers.map(item=>({...item,error:item.error?userMessage(item.error):''})),peers:this.state.peers.map(({token,...p})=>p),discovered:this.directory?this.directory.snapshot(this.state.peers):[],port:this.port,code:this.code,codeExpires:this.codeExpires,fingerprint:this.fingerprint,addresses:[...new Set(Object.values(os.networkInterfaces()).flat().filter(a=>a.family==='IPv4'&&!a.internal).map(a=>a.address))]};}
  presence(){if(this.presenceTask)return this.presenceTask;this.presenceTask=Promise.allSettled(this.state.peers.map(async peer=>{const found=[...this.discovered.values()].find(candidate=>candidate.id===peer.id&&candidate.fingerprint===peer.fingerprint);if(found){peer.host=found.host;peer.port=found.port;}try{const info=await request({...peer,timeoutMs:2500},'/ping',undefined,'GET');if(info.id!==peer.id)throw Error('身份不匹配');peer.online=true;}catch{peer.online=false;}})).finally(()=>{this.presenceTask=null;});return this.presenceTask;}
  refreshDevices(){if(this.refreshTask)return this.refreshTask;this.refreshTask=(async()=>{this.browser?.update();if(this.browser)await new Promise(resolve=>setTimeout(resolve,350));let deadline;try{await Promise.race([Promise.allSettled([this.directory?.refresh(),this.presence()]),new Promise(resolve=>{deadline=setTimeout(resolve,4000);})]);}finally{clearTimeout(deadline);}return this.snapshot();})().finally(()=>{this.refreshTask=null;});return this.refreshTask;}

  async route(req,res){
    const reply=(status,data)=>{if(!res.headersSent){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));}};
    try{
      const url=new URL(req.url,'https://localhost');
      if(req.method==='GET'&&url.pathname==='/hello')return reply(200,this.publicInfo());
      if(req.method==='POST'&&url.pathname==='/pair'){
        const addr=req.socket.remoteAddress, count=this.rate.get(addr)||{n:0,time:Date.now()};
        if(Date.now()-count.time>300000){count.n=0;count.time=Date.now();}this.rate.set(addr,count);
        if(++count.n>8)return reply(429,{error:'尝试次数过多，请五分钟后重试'});
        const input=JSON.parse((await body(req,16000)).toString());
        if(input.code!==this.code||Date.now()>this.codeExpires)return reply(403,{error:'配对码错误或已过期'});
        if(!validId(input.id)||input.id===this.state.id||typeof input.name!=='string'||input.name.length>80||!/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(input.fingerprint)||!Number.isInteger(input.port)||input.port<1||input.port>65535)throw Error('设备信息无效');
        const peer={id:input.id,name:input.name,host:addr.replace('::ffff:',''),port:input.port,fingerprint:input.fingerprint,token:crypto.randomBytes(32).toString('hex'),online:true};
        this.state.peers=this.state.peers.filter(p=>p.id!==peer.id);this.state.peers.push(peer); this.rotateCode();this.save();return reply(200,{...this.publicInfo(),token:peer.token});
      }
      const auth=req.headers.authorization; const peer=this.state.peers.find(p=>auth===`Bearer ${p.token}`);
      if(!peer)return reply(401,{error:'设备未配对或已解除信任'});
      peer.online=true;
      if(req.method==='GET'&&url.pathname==='/ping')return reply(200,this.publicInfo());
      if(req.method==='POST'&&url.pathname==='/message'){
        const msg=JSON.parse((await body(req,70000)).toString());if(!validId(msg.id)||typeof msg.text!=='string'||msg.text.length>16000)throw Error('消息无效');
        if(!this.state.messages.some(m=>m.id===msg.id)){this.state.messages.push({id:msg.id,peerId:peer.id,text:msg.text,time:Date.now(),direction:'in',status:'已送达'});this.save();}return reply(200,{ok:true});
      }
      if(req.method==='POST'&&url.pathname==='/offer'){
        const input=JSON.parse((await body(req,16000)).toString());
        if(!validId(input.id)||!Number.isSafeInteger(input.size)||input.size<0||!/^[a-f0-9]{64}$/.test(input.hash))throw Error('文件信息无效');safeRelative(input.name);
        let t=this.state.transfers.find(t=>t.id===input.id);
        if(t&&t.peerId!==peer.id)throw Error('任务不属于此设备');
        if(!t){t={id:input.id,name:input.name,size:input.size,hash:input.hash,peerId:peer.id,direction:'in',offset:0,status:this.state.settings.autoReceive?'准备中':'等待接收',time:Date.now(),root:this.state.settings.downloadDir};this.state.transfers.push(t);this.save();}
        if(t.hash!==input.hash||t.size!==input.size||t.name!==input.name)throw Error('文件已变化，请重新发送');
        const part=path.join(this.dir,t.id+'.part');
        if(!['已完成','已取消','等待接收'].includes(t.status)){t.offset=fs.existsSync(part)?fs.statSync(part).size:0;t.status='准备中';t.error='';}
        return reply(200,{offset:t.offset,status:t.status});
      }
      if(req.method==='PUT'&&url.pathname.startsWith('/chunk/')){
        const id=url.pathname.slice(7),t=this.state.transfers.find(t=>t.id===id&&t.peerId===peer.id&&t.direction==='in');
        if(!t||['已取消','已完成','等待接收'].includes(t.status))throw Error('文件任务不可写入');
        if(this.writing.has(id))throw Error('文件正在写入');this.writing.add(id);
        try{
          const offset=Number(url.searchParams.get('offset'));if(offset!==t.offset)throw Error('断点已变化，请重试');
          const bytes=await body(req,1024*1024);if(t.status==='已取消')throw Error('任务已取消');if(!bytes.length&&t.offset!==t.size||t.offset+bytes.length>t.size)throw Error('文件块大小无效');
          await fsp.appendFile(path.join(this.dir,id+'.part'),bytes);t.offset+=bytes.length;if(t.status==='已取消')throw Error('任务已取消');t.status='传输中';
          if(t.offset===t.size){t.status='校验中';if(await hashFile(path.join(this.dir,id+'.part'))!==t.hash){await fsp.unlink(path.join(this.dir,id+'.part'));t.offset=0;t.status='失败';throw Error('文件校验失败，请重试');}
            if(t.status==='已取消')throw Error('任务已取消');t.path=await finalizeReceived(path.join(this.dir,id+'.part'),t.root,t.name,t,{onCleanupError:error=>this.options.logError?.(error,'receive-cleanup')});t.status='已完成';t.error='';}
          this.save();return reply(200,{offset:t.offset,status:t.status});
        }catch(error){if(t.status!=='已取消'){t.status='失败';t.error=userMessage(error);}this.save();throw error;}finally{this.writing.delete(id);}
      }
      if(req.method==='POST'&&url.pathname.startsWith('/cancel/')){const t=this.state.transfers.find(t=>t.id===url.pathname.slice(8)&&t.peerId===peer.id&&t.direction==='in');if(t&&t.status!=='已完成'){t.status='已取消';this.save();}return reply(200,{ok:true});}
      reply(404,{error:'不支持的请求'});
    }catch(e){this.options.logError?.(e,'request');reply(400,{error:userMessage(e)});}
  }
  async inspect(host,port){if(typeof host!=='string'||!host.trim()||!Number.isInteger(port)||port<1||port>65535)throw Error('请输入有效地址和端口');return request({host,port},'/hello',undefined,'GET');}
  async pair(input){const info=await request(input,'/pair',{...this.publicInfo(),fingerprint:this.fingerprint,code:input.code});
    const peer={...info,host:input.host,port:input.port,online:true};delete peer.v;this.state.peers=this.state.peers.filter(p=>p.id!==peer.id);this.state.peers.push(peer);this.save();return peer.id;}
  peer(id){const p=this.state.peers.find(p=>p.id===id);if(!p)throw Error('请先选择已配对设备');return p;}
  async message(peerId,text){if(typeof text!=='string'||!text.trim()||text.length>16000)throw Error('消息不能为空且不能超过 16000 字');const p=this.peer(peerId),msg={id:uuid(),peerId,text,time:Date.now(),direction:'out',status:'发送中'};this.state.messages.push(msg);this.save();try{await request(p,'/message',msg);msg.status='已送达';}catch(e){msg.status='失败';msg.error=userMessage(e);this.options.logError?.(e,'message');}this.save();}
  async send(peerId,paths){this.peer(peerId);const items=[];for(const p of paths)items.push(...await walk(p));for(const item of items){safeRelative(item.name);const t={...item,id:uuid(),peerId,direction:'out',offset:0,time:Date.now(),status:'准备中'};this.state.transfers.push(t);this.save();this.run(t).catch(e=>this.fail(t,e));}return items.length;}
  fail(t,e){if(t.status!=='已取消'){t.status='失败';t.error=userMessage(e);this.options.logError?.(e,'send');}this.save();}
  async run(t){if(this.active.has(t.id))return;this.cancelled.delete(t.id);while(this.active.size>=3){if(this.cancelled.has(t.id))return;await new Promise(r=>setTimeout(r,150));}if(this.cancelled.has(t.id))return;this.active.set(t.id,true);
    try{const p=this.peer(t.peerId);t.status='校验中';t.error='';this.save();const stat=await fsp.stat(t.path);if(stat.size!==t.size||stat.mtimeMs!==t.modified)throw Error('源文件已变化，请重新选择发送');t.hash=await hashFile(t.path);
      let remote=await request(p,'/offer',{id:t.id,name:t.name,size:t.size,hash:t.hash});
      while(remote.status==='等待接收'){if(this.cancelled.has(t.id))return;t.status='等待接收';this.save();await new Promise(r=>setTimeout(r,1000));remote=await request(p,'/offer',{id:t.id,name:t.name,size:t.size,hash:t.hash});}
      if(remote.status==='已取消')throw Error('对方已拒绝或取消接收');if(remote.status==='已完成'){t.offset=t.size;t.status='已完成';this.save();return;}
      t.offset=remote.offset;t.status='传输中';const started=Date.now(),initial=t.offset;const handle=await fsp.open(t.path,'r');
      try{do{if(this.cancelled.has(t.id))return;const buffer=Buffer.alloc(Math.min(1024*1024,t.size-t.offset));const {bytesRead}=await handle.read(buffer,0,buffer.length,t.offset);if(buffer.length&&bytesRead!==buffer.length)throw Error('源文件读取失败');
        const next=await request(p,`/chunk/${t.id}?offset=${t.offset}`,buffer,'PUT',true);if(this.cancelled.has(t.id))return;t.offset=next.offset;t.speed=(t.offset-initial)/Math.max(1,(Date.now()-started)/1000);t.status=next.status;this.save();
      }while(t.offset<t.size);}finally{await handle.close();}
    }finally{this.active.delete(t.id);}}
  async cancel(id){const t=this.state.transfers.find(t=>t.id===id);if(!t||t.status==='已完成')return;this.cancelled.add(id);t.status='已取消';this.save();if(t.direction==='out')await request(this.peer(t.peerId),'/cancel/'+id,{}).catch(()=>{});}
  retry(id){const t=this.state.transfers.find(t=>t.id===id&&t.direction==='out');if(!t||this.active.has(id))return;if(t.status==='已取消'){t.id=uuid();t.offset=0;}t.status='准备中';this.save();this.run(t).catch(e=>this.fail(t,e));}
  accept(id,accept){const t=this.state.transfers.find(t=>t.id===id&&t.direction==='in'&&t.status==='等待接收');if(t){t.status=accept?'准备中':'已取消';this.save();}}
  async close(){clearInterval(this.timer);clearInterval(this.discoveryTimer);clearInterval(this.presenceTimer);this.directory?.close();this.bonjour?.destroy();for(const id of this.active.keys())this.cancelled.add(id);if(this.server)await new Promise(r=>this.server.close(r));}
}
module.exports={Engine,request,hashFile};
