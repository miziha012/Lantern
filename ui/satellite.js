(() => {
  const make=(tag,className)=>{const el=document.createElement(tag);if(className)el.className=className;return el;};
  const slots=[{ring:0,angle:-135},{ring:1,angle:-47},{ring:1,angle:140},{ring:0,angle:45},{ring:1,angle:-140},{ring:0,angle:-45},{ring:1,angle:45},{ring:0,angle:135}];
  const position=index=>slots[index]||{ring:2+Math.floor((index-8)/8),angle:-135+((index-8)%8)*45};
  class SatelliteMap {
    constructor(root,handlers) {
      this.root=root;this.handlers=handlers;this.records=new Map();this.layers=new Map();this.zoom=1;this.pan={x:0,y:0};this.fit=1;this.drag=null;this.hasState=false;this.orbitFrame=0;this.lastOrbitTime=0;this.motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
      this.canvas=make('div','orbit-canvas');this.tracks=make('div','orbit-tracks');this.tracks.setAttribute('aria-hidden','true');this.canvas.append(this.tracks);
      this.self=make('div','satellite-self');this.selfEntry=make('div','self-entry');this.selfNode=make('div','device-node self-device');this.selfNode.id='local-device';this.selfNode.setAttribute('role','img');
      this.selfNode.innerHTML='<span class="node-face"><span class="device-symbol" aria-hidden="true"></span></span><span class="device-copy"><strong>这台电脑</strong><small>本机</small></span>';
      this.selfEntry.addEventListener('animationend',event=>{if(event.target===this.selfEntry)this.selfEntry.style.animation='none';});this.selfEntry.append(this.selfNode);this.self.append(this.selfEntry);this.canvas.append(this.self);root.append(this.canvas);root.classList.add('entrance-pending');this.motionPreference.addEventListener('change',()=>{this.enter();this.updateOrbitPlayback();});
      root.tabIndex=0;root.setAttribute('aria-label','设备卫星图。选择设备进行连接，本机为静态标识。滚轮缩放，拖动空白移动，双击空白或按零复位。');
      root.addEventListener('wheel',event=>{event.preventDefault();const rect=root.getBoundingClientRect(),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2;const previous=this.zoom;this.zoom=Math.max(.6,Math.min(1.8,this.zoom*Math.exp(-event.deltaY*.001)));const ratio=this.zoom/previous;this.pan.x=x-(x-this.pan.x)*ratio;this.pan.y=y-(y-this.pan.y)*ratio;this.applyTransform();},{passive:false});
      root.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button,.self-device'))return;this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,panX:this.pan.x,panY:this.pan.y};root.setPointerCapture(event.pointerId);root.classList.add('is-panning');});
      root.addEventListener('pointermove',event=>{if(!this.drag||event.pointerId!==this.drag.id)return;this.pan.x=this.drag.panX+event.clientX-this.drag.x;this.pan.y=this.drag.panY+event.clientY-this.drag.y;this.applyTransform();});
      const stop=()=>{this.drag=null;root.classList.remove('is-panning');};root.addEventListener('pointerup',stop);root.addEventListener('pointercancel',stop);root.addEventListener('lostpointercapture',stop);
      root.addEventListener('dblclick',event=>{if(!event.target.closest('button,.self-device'))this.reset();});
      root.addEventListener('keydown',event=>{if(event.target!==root||event.isComposing)return;if(event.key==='0'){event.preventDefault();this.reset();}else if(['+','=','-'].includes(event.key)){event.preventDefault();this.zoom=Math.max(.6,Math.min(1.8,this.zoom*(event.key==='-'?.9:1.1)));this.applyTransform();}});
      document.addEventListener('visibilitychange',()=>this.updateOrbitPlayback());
      this.playbackObserver=new MutationObserver(()=>this.updateOrbitPlayback());this.playbackObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
      for(const event of ['pointerover','pointerout','focusin','focusout','pointerdown','pointerup','pointercancel','lostpointercapture'])root.addEventListener(event,()=>queueMicrotask(()=>this.updateOrbitPlayback()));
      this.resizeObserver=new ResizeObserver(()=>this.layout());this.resizeObserver.observe(root);this.ensureLayer(0);this.ensureLayer(1);this.layout();
    }
    ensureLayer(index){if(this.layers.has(index))return this.layers.get(index);const line=make('div','orbit-line'),motion=make('div','orbit-motion'),entry=make('div','orbit-layer-entry');const duration=240+index*80;const direction=index%2?'reverse':'normal';motion.style.animationDuration=duration+'s';motion.style.animationDirection=direction;entry.dataset.ring=index;entry.style.setProperty('--entry-delay',(260+index*300)+'ms');entry.append(line,motion);this.canvas.append(entry);entry.addEventListener('animationend',event=>{if(event.target===entry&&event.animationName==='ring-reveal'){entry.inert=false;entry.style.animation='none';}});const layer={line,motion,entry,duration,direction,angle:0};this.layers.set(index,layer);return layer;}
    enter(){if(!this.hasState)return;this.reset();this.root.classList.remove('entrance-pending','map-entrance');this.selfEntry.style.animation='';for(const layer of this.layers.values()){layer.entry.style.animation='';layer.entry.inert=!this.motionPreference.matches&&!layer.entry.hidden;}void this.root.offsetWidth;this.root.classList.add('map-entrance');this.updateOrbitPlayback();}

    update(state){const firstUpdate=!this.hasState;this.hasState=true;this.selfNode.setAttribute('aria-label',`这台电脑，${state.name}，本机`);this.selfNode.title=state.name;
      const devices=new Map();for(const peer of state.peers||[]){const key=peer.fingerprint||peer.id;if(peer.id!==state.id&&peer.fingerprint!==state.fingerprint)devices.set(key,{...peer,paired:true});}
      for(const peer of state.discovered||[]){const key=peer.fingerprint||peer.id;if(!devices.has(key)&&peer.id!==state.id&&peer.fingerprint!==state.fingerprint)devices.set(key,{...peer,paired:false,online:true});}
      const values=[...devices.values()],online=values.filter(p=>p.paired&&p.online),nearby=values.filter(p=>!p.paired),offline=values.filter(p=>p.paired&&!p.online);
      const ordered=[online.shift(),nearby.shift(),offline.shift(),...online,...nearby,...offline].filter(Boolean);
      for(const peer of ordered){const key=peer.fingerprint||peer.id;let record=this.records.get(key);
        if(!record){const used=new Set([...this.records.values()].map(item=>item.index));let index=0;while(used.has(index))index++;record=this.createRecord(key,peer,index);this.records.set(key,record);}
        if(record.timer){clearTimeout(record.timer);record.timer=null;record.slot.classList.remove('is-leaving');}
        record.peer=peer;record.button.disabled=false;record.button.classList.toggle('paired',peer.paired);record.button.classList.toggle('unpaired',!peer.paired);record.button.classList.toggle('offline',peer.paired&&!peer.online);record.button.classList.toggle('online',peer.paired&&peer.online);
        const kind=peer.deviceType==='laptop'||/laptop|notebook|笔记本/i.test(peer.name)?'laptop':'desktop';record.symbol.classList.toggle('laptop-symbol',kind==='laptop');
        const status=peer.paired?(peer.online?'已配对 · 在线':'已配对 · 离线'):'附近 · 未配对';if(record.name.textContent!==peer.name)record.name.textContent=peer.name;if(record.status.textContent!==status)record.status.textContent=status;
        record.button.setAttribute('aria-label',`${peer.name}，${status}，${peer.paired?'进入聊天':'配对设备'}`);record.button.title=`${peer.name} · ${peer.host||''}${peer.port?':'+peer.port:''}`;
        if(peer.paired){record.button.dataset.satellitePeer=peer.id;delete record.button.dataset.satelliteDiscovered;}else{record.button.dataset.satelliteDiscovered=key;delete record.button.dataset.satellitePeer;}
      }
      for(const [key,record] of this.records){if(devices.has(key)||record.timer)continue;if(record.button===document.activeElement)this.root.focus({preventScroll:true});record.button.disabled=true;record.slot.classList.add('is-leaving');record.timer=setTimeout(()=>{record.slot.remove();this.records.delete(key);this.layout();},200);}
      this.layout();if(firstUpdate)this.enter();
    }
    createRecord(key,peer,index){const config=position(index),layer=this.ensureLayer(config.ring),slot=make('div','satellite-position'),counter=make('div','orbit-counter'),appearance=make('div','node-appearance'),button=make('button','device-node');
      button.type='button';const face=make('span','node-face'),symbol=make('span','device-symbol');symbol.setAttribute('aria-hidden','true');face.append(symbol);const copy=make('span','device-copy'),name=make('strong'),stateLine=make('span','device-state'),dot=make('span','online-dot'),status=make('small');dot.setAttribute('aria-hidden','true');stateLine.append(dot,status);copy.append(name,stateLine);button.append(face,copy);appearance.append(button);counter.append(appearance);slot.append(counter);layer.motion.append(slot);
      counter.style.animationDuration=layer.duration+'s';counter.style.animationDirection=layer.direction==='normal'?'reverse':'normal';const source=layer.motion.getAnimations()[0],inverse=counter.getAnimations()[0];if(source&&inverse)inverse.currentTime=source.currentTime||0;
      const record={key,peer,index,slot,counter,button,name,status,symbol,timer:null};button.addEventListener('click',()=>record.peer.paired?this.handlers.onPaired(record.peer):this.handlers.onUnpaired(record.peer));return record;
    }
    layout(){const width=this.root.clientWidth,height=this.root.clientHeight;if(!width||!height)return;this.radius=Math.max(145,Math.min(width*.36,height*.386,450));const scale=this.radius/410;
      this.root.style.setProperty('--node-size',Math.max(54,88*scale)+'px');this.root.style.setProperty('--self-size',Math.max(104,192*scale)+'px');this.root.style.setProperty('--device-name-size',Math.max(14,20*scale)+'px');this.root.style.setProperty('--device-status-size',Math.max(11,17*scale)+'px');this.root.style.setProperty('--self-name-size',Math.max(17,24*scale)+'px');this.root.style.setProperty('--device-label-width',Math.max(132,190*scale)+'px');
      let maxRing=1;for(const record of this.records.values())maxRing=Math.max(maxRing,position(record.index).ring);
      for(const [index,layer] of this.layers){const radius=this.ringRadius(index);layer.entry.hidden=index>maxRing;layer.line.style.width=radius*2+'px';layer.line.style.height=radius*2+'px';}
      this.positionDevices();
      this.fit=maxRing>1?1/(1+.4*(maxRing-1)):1;this.applyTransform();
    }
    positionDevices(){
      const dpr=devicePixelRatio||1;
      for(const record of this.records.values()){
        const config=position(record.index),phase=this.layers.get(config.ring).angle,angle=(config.angle+phase)*Math.PI/180,radius=this.ringRadius(config.ring);
        // Move the node itself on whole physical pixels; never rotate its text.
        record.slot.style.left=Math.round(Math.cos(angle)*radius*dpr)/dpr+'px';
        record.slot.style.top=Math.round(Math.sin(angle)*radius*dpr)/dpr+'px';
      }
    }
    updateOrbitPlayback(){
      const paused=!this.hasState||this.motionPreference.matches||document.hidden||!document.body.classList.contains('home-mode')||document.body.classList.contains('window-inactive')||this.root.classList.contains('is-panning')||this.root.querySelector('button.device-node:hover,button.device-node:focus-visible');
      if(paused){cancelAnimationFrame(this.orbitFrame);this.orbitFrame=0;this.lastOrbitTime=0;return;}
      if(this.orbitFrame)return;
      const tick=now=>{
        const elapsed=this.lastOrbitTime?Math.min(now-this.lastOrbitTime,100):0;this.lastOrbitTime=now;
        for(const layer of this.layers.values())layer.angle=(layer.angle+elapsed*360/(layer.duration*1000)*(layer.direction==='reverse'?-1:1))%360;
        this.positionDevices();this.orbitFrame=requestAnimationFrame(tick);
      };
      this.orbitFrame=requestAnimationFrame(tick);
    }
    ringRadius(index){return this.radius*(index===0?.65:1+.4*(index-1));}
    applyTransform(){this.pan.x=Math.max(-this.root.clientWidth*.7,Math.min(this.root.clientWidth*.7,this.pan.x));this.pan.y=Math.max(-this.root.clientHeight*.7,Math.min(this.root.clientHeight*.7,this.pan.y));this.canvas.style.transform=this.pan.x===0&&this.pan.y===0&&this.zoom*this.fit===1?'none':`translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom*this.fit})`;this.root.dataset.zoom=this.zoom.toFixed(2);}
    reset(){this.zoom=1;this.pan={x:0,y:0};this.applyTransform();}
  }
  window.LanternSatellite=SatelliteMap;
})();
