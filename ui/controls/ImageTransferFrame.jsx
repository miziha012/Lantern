import {useState} from 'react';
import RefineFrame from './RefineFrame.jsx';
const TERMINAL=new Set(['失败','已取消','已中断']);
export default function ImageTransferFrame({transfer:t,onPreview,onRetry}){
 const canRead=!!t.path&&(t.direction==='out'||t.status==='已完成');
 const [reload,setReload]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[dimensions,setDimensions]=useState(null);
 const src=canRead?`lantern-image://transfer/${encodeURIComponent(t.id)}?v=${reload}`:undefined;
 const terminal=TERMINAL.has(t.status),done=t.status==='已完成',canPreview=done&&loaded&&!failed;
 const progress=t.size?Math.max(0,Math.min(100,Math.round(t.offset/t.size*100))):0;
 const verb=t.direction==='out'?'发送':'接收';
 const activeText=t.status==='传输中'?`${verb}中${t.size?' · '+progress+'%':''}`:t.status==='校验中'?'正在校验':t.status==='等待接收'?'等待接收':`准备${verb}`;
 const phase=terminal||failed?'error':done?(loaded?'complete':'refining'):['准备中','等待接收'].includes(t.status)?'queued':'refining';
 const errorText=terminal?t.status:'图片加载失败';
 const labels={queued:activeText,generating:activeText,refining:done?'正在加载图片':activeText,complete:t.direction==='out'?'已发送':'已接收',error:errorText};
 const width=dimensions?Math.max(1,Math.min(340,dimensions.width,420*dimensions.width/dimensions.height)):300;
 const ratio=dimensions?`${dimensions.width} / ${dimensions.height}`:'4 / 3';
 const retry=failed&&!terminal?()=>{setFailed(false);setLoaded(false);setReload(value=>value+1);}:terminal&&t.direction==='out'?()=>onRetry(t.id):undefined;
 return <div className="image-frame-content" style={{width}}><RefineFrame key={src||'pending'} status={phase} ariaLabel={`${t.name}，${labels[phase]}`} width={width} aspectRatio={ratio} radius={8} background="#f0f2f5" color="#394555" stageDuration={90} hideAfter={900} showStatus={width>=150} labels={labels} retryLabel={terminal?'重试发送':'重新加载'} onRetry={width>=150?retry:undefined} className="chat-refine-frame">
  {src?<button type="button" className="image-open" data-preview={canPreview?t.id:undefined} disabled={!canPreview} aria-label={`查看图片 ${t.name}`} onClick={()=>onPreview(t.id)}><img key={src} className="chat-image" src={src} alt={t.name} loading="lazy" onLoad={event=>{const image=event.currentTarget;setDimensions({width:image.naturalWidth,height:image.naturalHeight});setLoaded(true);setFailed(false);}} onError={()=>{setFailed(true);setLoaded(false);}}/></button>:<div className="image-pending"><span className="rf-empty-icon"/></div>}
 </RefineFrame>{retry&&width<150?<button type="button" className="link image-frame-retry" onClick={retry}>{terminal?'重试发送':'重新加载'}</button>:null}</div>;
}
