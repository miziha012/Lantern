import React from 'react';
import {createRoot} from 'react-dom/client';
import GlideSelect from './GlideSelect.jsx';
import SquishSwitch from './SquishSwitch.jsx';
import ImageTransferFrame from './ImageTransferFrame.jsx';
import './theme.css';
const controls=new Map(),images=new Map();
function draw(native){
 const item=controls.get(native);if(!item)return;
 if(native.tagName==='SELECT'){
  const options=Array.from(native.options).map(option=>({value:option.value,label:option.textContent}));
  const label=item.label;
  item.root.render(<GlideSelect triggerId={native.id+'-trigger'} options={options} placeholder={options.length?'请选择':'暂无在线设备'} value={native.value} ariaLabel={label} disabled={native.disabled||!options.length} accentColor="#0868cf" surfaceColor="#ffffff" highlightColor="#edf0f4" textColor="#202733" radius={12} menuWidth={180} size="md" onChange={value=>{native.value=value;native.dispatchEvent(new Event('change',{bubbles:true}));draw(native);}}/>);
 }else{
  const label=native.closest('label')?.querySelector('strong')?.textContent||'自动接收文件';
  item.root.render(<SquishSwitch id={native.id+'-switch'} checked={native.checked} disabled={native.disabled} ariaLabel={label} width={52} height={28} radius={14} stretch={60} trackColor="#cdd3dc" trackOnColor="#0868cf" thumbColor="#ffffff" thumbOnColor="#ffffff" onChange={checked=>{native.checked=checked;native.dispatchEvent(new Event('change',{bubbles:true}));draw(native);}}/>);
 }
}
function enhance(native){
 if(controls.has(native))return;
 const host=document.createElement('span');host.className=native.tagName==='SELECT'?'glide-select-host':'squish-switch-host';
 native.before(host);native.hidden=true;native.tabIndex=-1;native.setAttribute('aria-hidden','true');native.dataset.rbNative='';
 const label=native.getAttribute('aria-label')||native.labels?.[0]?.textContent||'选择接收设备';for(const associated of Array.from(native.labels||[])){if(associated.htmlFor===native.id)associated.htmlFor=native.id+'-trigger';}const item={host,root:createRoot(host),label};controls.set(native,item);native.addEventListener('change',()=>draw(native));draw(native);
}
function scan(node=document){if(node.nodeType===1&&node.matches('select,input[role="switch"]'))enhance(node);node.querySelectorAll?.('select,input[role="switch"]').forEach(enhance);}
function cleanup(){for(const [host,root] of images){if(!host.isConnected){root.unmount();images.delete(host);}}for(const [native,item] of controls){if(!native.isConnected){item.root.unmount();item.host.remove();controls.delete(native);}}}
const observer=new MutationObserver(records=>{for(const mutation of records){if(mutation.type==='attributes'&&controls.has(mutation.target))draw(mutation.target);if(mutation.target.nodeType===1&&mutation.target.closest('select[data-rb-native]'))draw(mutation.target.closest('select[data-rb-native]'));for(const node of mutation.addedNodes)scan(node);}cleanup();});
scan();observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
window.LanternControls={image(host,props){let root=images.get(host);if(!root){root=createRoot(host);images.set(host,root);}root.render(<ImageTransferFrame {...props}/>);},sync(native){if(native){if(!controls.has(native))enhance(native);draw(native);}else{scan();for(const native of controls.keys())draw(native);cleanup();}}};
