const {test}=require('node:test');const assert=require('node:assert/strict');const {captureCrop}=require('../core/capture-geometry.cjs');
test('截图像素映射：125%/150%/200% 与任务栏压缩窗口均使用实际图片比例',()=>{
 for(const [viewport,pixels] of [[{width:1536,height:864},{width:1920,height:1080}],[{width:1536,height:816},{width:1920,height:1080}],[{width:1280,height:720},{width:1920,height:1080}],[{width:1920,height:1080},{width:3840,height:2160}]]){
  const edges={left:80/viewport.width,top:80/viewport.height,right:280/viewport.width,bottom:200/viewport.height};const crop=captureCrop(edges,pixels);assert.equal(crop.y,Math.round(80*pixels.height/viewport.height));assert.equal(crop.width,Math.round(280*pixels.width/viewport.width)-crop.x);assert.equal(crop.height,Math.round(200*pixels.height/viewport.height)-crop.y);
 }
 assert.deepEqual(captureCrop({left:0,top:0,right:1,bottom:1},{width:1920,height:1080}),{x:0,y:0,width:1920,height:1080});
 assert.deepEqual(captureCrop({left:.999,top:.999,right:1,bottom:1},{width:1920,height:1080}),{x:1918,y:1079,width:2,height:1});
});
test('截图拒绝空选区、越界与非数字，避免错误写入剪贴板',()=>{for(const edges of [null,{}, {left:0,top:0,right:NaN,bottom:1},{left:-.1,top:0,right:1,bottom:1},{left:0,top:0,right:1.1,bottom:1},{left:.5,top:.5,right:.4,bottom:1},{left:0,top:0,right:0,bottom:1},{left:0,top:0,right:.000001,bottom:.000001}])assert.throws(()=>captureCrop(edges,{width:1920,height:1080}));});
