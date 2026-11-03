const {contextBridge,ipcRenderer,webUtils}=require('electron');
const methods=['snapshot','inspect','pair','message','send','pick','roots','list','fileAction','settings','forget','cancel','retry','accept','capture','captureData','captureFinish','captureCancel','pasteImage'];
const api={};for(const method of methods)api[method]=(...args)=>ipcRenderer.invoke('lantern:'+method,...args);
api.filePath=file=>webUtils.getPathForFile(file);
contextBridge.exposeInMainWorld('lantern',api);
