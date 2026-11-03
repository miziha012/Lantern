const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const {Engine,request,hashFile}=require('../core/engine.cjs');const {safeRelative,uniquePath}=require('../core/files.cjs');
const until=async(fn,ms=20000)=>{const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error('等待超时');await new Promise(r=>setTimeout(r,40));}};
test('Windows 路径校验与同名文件保护',async()=>{for(const name of ['../escape','C:/escape','a/../../b','a\\..\\b','CON.txt','a/','a.','nul','file:name'])assert.throws(()=>safeRelative(name));assert.equal(safeRelative('照片/图片.png'),path.join('照片','图片.png'));const dir=await fs.mkdtemp(path.join(os.tmpdir(),'lantern-path-'));try{const a=await uniquePath(dir,'a.txt'),b=await uniquePath(dir,'a.txt');assert.notEqual(a,b);}finally{await fs.rm(dir,{recursive:true,force:true});}});
test('两个真实 HTTPS 实例：配对、拒绝未授权、聊天、证书锁定、分块传输、校验和同名保护',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'lantern-test-'));const a=new Engine(path.join(root,'a')),b=new Engine(path.join(root,'b'));b.state.settings.downloadDir=path.join(root,'received');
  try{await a.start(0,false);await b.start(0,false);const target={host:'127.0.0.1',port:b.port,fingerprint:b.fingerprint};
    await assert.rejects(request(target,'/message',{id:crypto.randomUUID(),text:'不该到达'}),/未配对/);
    await assert.rejects(a.pair({...target,code:'000000'}),/配对码/);
    await a.pair({...target,code:b.code});const peer=a.state.peers[0];assert.equal(peer.id,b.state.id);
    await a.message(peer.id,'你好，局域网 <script>安全文本</script>');assert.equal(b.state.messages[0].text,a.state.messages[0].text);assert.equal(a.state.messages[0].status,'已送达');
    await assert.rejects(request({...peer,fingerprint:'BAD'},'/ping',undefined,'GET'),/证书/);
    const source=path.join(root,'测试文件.bin'),bytes=crypto.randomBytes(2*1024*1024+37);await fs.writeFile(source,bytes);await a.send(peer.id,[source]);await until(()=>a.state.transfers[0].status==='已完成');const incoming=b.state.transfers[0];assert.equal(incoming.status,'已完成');assert.deepEqual(await fs.readFile(incoming.path),bytes);
    await a.send(peer.id,[source]);await until(()=>a.state.transfers[1].status==='已完成');assert.notEqual(b.state.transfers[0].path,b.state.transfers[1].path);
    const empty=path.join(root,'empty.txt');await fs.writeFile(empty,'');await a.send(peer.id,[empty]);await until(()=>a.state.transfers[2].status==='已完成');assert.equal((await fs.stat(b.state.transfers[2].path)).size,0);
    await assert.rejects(request(peer,'/offer',{id:crypto.randomUUID(),name:'../outside',size:1,hash:'a'.repeat(64)}),/路径/);
    // Resume a transfer from a persisted partial block, then verify final bytes.
    const id=crypto.randomUUID(),hash=await hashFile(source);await request(peer,'/offer',{id,name:'恢复.bin',size:bytes.length,hash});await request(peer,`/chunk/${id}?offset=0`,bytes.subarray(0,1024*1024),'PUT',true);
    const resumed=await request(peer,'/offer',{id,name:'恢复.bin',size:bytes.length,hash});assert.equal(resumed.offset,1024*1024);
    await request(peer,`/chunk/${id}?offset=${resumed.offset}`,bytes.subarray(resumed.offset,2*1024*1024),'PUT',true);await request(peer,`/chunk/${id}?offset=${2*1024*1024}`,bytes.subarray(2*1024*1024),'PUT',true);assert.deepEqual(await fs.readFile(b.state.transfers.find(t=>t.id===id).path),bytes);
    // Turn off automatic receiving: no bytes can be written until accepted.
    b.state.settings.autoReceive=false;const pending=crypto.randomUUID();const offer=await request(peer,'/offer',{id:pending,name:'确认.txt',size:0,hash:crypto.createHash('sha256').update('').digest('hex')});assert.equal(offer.status,'等待接收');await assert.rejects(request(peer,`/chunk/${pending}?offset=0`,Buffer.alloc(0),'PUT',true),/不可写入/);b.accept(pending,true);await request(peer,`/chunk/${pending}?offset=0`,Buffer.alloc(0),'PUT',true);assert.equal(b.state.transfers.find(t=>t.id===pending).status,'已完成');
  }finally{await a.close();await b.close();await fs.rm(root,{recursive:true,force:true});}
});
