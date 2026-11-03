const {test}=require('node:test');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
const {DiscoveryDirectory}=require('../core/discovery.cjs');
const fingerprint=byte=>Array(32).fill(byte).join(':');
const service=(port=9000,host='192.168.1.20',id=randomUUID())=>({addresses:[host],port,name:`Lantern-${id}`,txt:{id,name:'Unverified advertised name'}});
const info=(id=randomUUID(),fp=fingerprint('AA'),name='电脑')=>({id,fingerprint:fp,name});
function directory(lookup,extra={}){return new DiscoveryDirectory({selfId:randomUUID(),selfFingerprint:fingerprint('FF'),lookup,...extra});}

test('重复广播、不同宣称 ID 及多网卡，同一证书只显示一项；不信任广播名称',async()=>{
 const actual=info(),d=directory(async()=>actual);
 await d.observe(service());await d.observe(service());await d.observe(service(9000,'192.168.1.21'));
 assert.equal(d.snapshot().length,1);assert.equal(d.snapshot()[0].id,actual.id);assert.equal(d.snapshot()[0].name,'电脑');assert.equal(d.snapshot()[0].host,'192.168.1.21');
 assert.equal(d.snapshot([{id:actual.id,fingerprint:actual.fingerprint}]).length,0,'已配对证书不在附近列表重复显示');
});

test('同名同 IP 但证书不同的真实实例不会被误合并',async()=>{
 const a=info(randomUUID(),fingerprint('AA')),b=info(randomUUID(),fingerprint('BB'));const d=directory(async(_host,port)=>port===9000?a:b);
 await d.observe(service(9000));await d.observe(service(9001));assert.equal(d.snapshot().length,2);
});

test('离线记录过期隐藏，候选恢复在线后能重新验证显示',async()=>{
 let now=1000000,online=true;const actual=info();const d=directory(async()=>{if(!online)throw Error('offline');return actual;},{now:()=>now,ttlMs:45000});
 await d.observe(service());assert.equal(d.snapshot().length,1);online=false;now+=45001;await d.refresh();assert.equal(d.snapshot().length,0);
 online=true;await d.refresh();assert.equal(d.snapshot().length,1);now+=40000;await d.refresh();assert.equal(d.snapshot().length,1,'在线探测刷新有效期');
});

test('本机、无效响应与无法连接的旧广播不进入附近列表',async()=>{
 const id=randomUUID();const self=directory(async()=>info(id),{selfId:id});await self.observe(service());assert.equal(self.snapshot().length,0);
 const sameCert=directory(async()=>info(randomUUID(),fingerprint('FF')));await sameCert.observe(service());assert.equal(sameCert.snapshot().length,0);
 const invalid=directory(async()=>({id:'wrong',name:'device',fingerprint:'bad'}));await invalid.observe(service());assert.equal(invalid.snapshot().length,0);
 const dead=directory(async()=>{throw Error('refused');});await dead.observe(service());assert.equal(dead.snapshot().length,0);
});

test('旧网卡的下线通知不会删除新网卡上的同一证书记录',async()=>{
 const actual=info(),d=directory(async()=>actual);const old=service(9000,'192.168.1.20'),current=service(9001,'192.168.1.21');
 await d.observe(old);await d.observe(current);d.remove(old);assert.equal(d.snapshot().length,1);d.remove(current);assert.equal(d.snapshot().length,0);
});

test('同一端点并发发现合并探测，并发连接不超过四个；关闭后不再出现记录',async()=>{
 let calls=0,active=0,max=0;const actual=info();const d=directory(async()=>{calls++;active++;max=Math.max(max,active);await new Promise(resolve=>setImmediate(resolve));active--;return actual;});
 await Promise.all(Array.from({length:8},()=>d.observe(service())));assert.equal(calls,1);
 await Promise.all(Array.from({length:12},(_,i)=>d.observe(service(9100+i))));assert.ok(max<=4);assert.equal(d.snapshot().length,1);d.close();await d.observe(service());assert.equal(d.snapshot().length,0);
});
