const {isIP}=require('node:net');
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id);
const validFingerprint=value=>typeof value==='string'&&/^(?:[a-f0-9]{2}:){31}[a-f0-9]{2}$/i.test(value);
const endpoint=peer=>`${peer.host}:${peer.port}`;
class DiscoveryDirectory {
  constructor({selfId,selfFingerprint,lookup,entries=new Map(),now=Date.now,ttlMs=45000}) {
    this.selfId=selfId;this.selfFingerprint=selfFingerprint;this.lookup=lookup;this.entries=entries;this.now=now;this.ttlMs=ttlMs;
    this.candidates=new Map();this.pending=new Map();this.queue=[];this.active=0;this.refreshing=false;this.closed=false;
  }
  observe(service) {
    if(this.closed)return Promise.resolve(null);
    const host=(service.addresses||[]).find(address=>isIP(address)===4);
    if(!host||!Number.isInteger(service.port)||service.port<1||service.port>65535)return Promise.resolve(null);
    const candidate={host,port:service.port,serviceKey:service.fqdn||service.name||service.txt?.id||'',lastSeen:0,failures:0};
    const key=endpoint(candidate),previous=this.candidates.get(key);
    if(!previous)this.candidates.set(key,candidate);else if(candidate.serviceKey)previous.serviceKey=candidate.serviceKey;
    return this.check(previous||candidate);
  }
  check(candidate) {
    const key=endpoint(candidate);if(this.closed)return Promise.resolve(null);if(this.pending.has(key))return this.pending.get(key);
    if(this.pending.size>=64)return Promise.resolve(null);
    const promise=new Promise(resolve=>{this.queue.push({candidate,resolve});});this.pending.set(key,promise);this.drain();
    promise.finally(()=>this.pending.delete(key));return promise;
  }
  drain() {
    while(!this.closed&&this.active<4&&this.queue.length){const job=this.queue.shift();this.active++;
      Promise.resolve().then(()=>this.lookup(job.candidate.host,job.candidate.port)).then(info=>{
        if(this.closed)return null;
        if(!validId(info.id)||typeof info.name!=='string'||info.name.length>80||!validFingerprint(info.fingerprint))throw Error('Invalid discovery response');
        const fingerprint=info.fingerprint.toUpperCase();
        if(info.id===this.selfId||fingerprint===this.selfFingerprint){this.candidates.delete(endpoint(job.candidate));return null;}
        const peer={id:info.id,name:info.name,host:job.candidate.host,port:job.candidate.port,fingerprint,lastSeen:this.now()};
        job.candidate.lastSeen=peer.lastSeen;job.candidate.failures=0;
        // Trust is never granted by discovery. Certificate identity only groups visible candidates.
        this.entries.set(fingerprint,peer);return peer;
      }).catch(()=>{job.candidate.failures++;return null;}).then(value=>{this.active--;job.resolve(value);this.drain();});
    }
  }
  prune() {
    const now=this.now();for(const [key,peer] of this.entries)if(now-peer.lastSeen>this.ttlMs)this.entries.delete(key);
    for(const [key,peer] of this.candidates)if(peer.failures>=3&&now-peer.lastSeen>this.ttlMs)this.candidates.delete(key);
  }
  snapshot(trusted=[]) {
    this.prune();const fingerprints=new Set(trusted.map(peer=>peer.fingerprint?.toUpperCase()).filter(Boolean));
    return [...this.entries.values()].filter(peer=>!fingerprints.has(peer.fingerprint));
  }
  async refresh() {
    if(this.closed||this.refreshing)return;this.refreshing=true;
    try{await Promise.all([...this.candidates.values()].map(candidate=>this.check(candidate)));this.prune();}finally{this.refreshing=false;}
  }
  remove(service) {
    const serviceKey=service.fqdn||service.name||service.txt?.id||'';
    for(const [key,candidate] of this.candidates){const addresses=service.addresses||[];
      if(candidate.port===service.port&&(addresses.includes(candidate.host)||(!addresses.length&&serviceKey&&candidate.serviceKey===serviceKey))){this.candidates.delete(key);for(const [fingerprint,peer] of this.entries)if(endpoint(peer)===key)this.entries.delete(fingerprint);}
    }
  }
  close(){this.closed=true;for(const job of this.queue)job.resolve(null);this.queue=[];this.candidates.clear();this.entries.clear();}
}
module.exports={DiscoveryDirectory};
