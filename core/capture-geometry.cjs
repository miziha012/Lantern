// Selection edges are normalized against the displayed screenshot, independent of DPI/window size.
function captureCrop(edges,size){
  if(!edges||!size||![edges.left,edges.top,edges.right,edges.bottom].every(Number.isFinite)||![size.width,size.height].every(n=>Number.isInteger(n)&&n>0))throw Error('截图区域无效');
  if(edges.left<0||edges.top<0||edges.right>1||edges.bottom>1||edges.right<=edges.left||edges.bottom<=edges.top)throw Error('截图区域无效');
  const x=Math.round(edges.left*size.width),y=Math.round(edges.top*size.height),right=Math.round(edges.right*size.width),bottom=Math.round(edges.bottom*size.height);
  if(right<=x||bottom<=y)throw Error('截图区域过小');return {x,y,width:right-x,height:bottom-y};
}
module.exports={captureCrop};
