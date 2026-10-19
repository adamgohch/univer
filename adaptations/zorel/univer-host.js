const frames=new Map();
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 for(const [frame,hooks]of frames){if(!frame.isConnected){frames.delete(frame);continue;}if(event.source!==frame.contentWindow)continue;
  const msg=event.data;if(msg?.channel!=='zorel-univer'||msg.token!==frame.dataset.token)return;
  try{if(msg.type==='ready')send(frame,{type:'snapshot',data:hooks.snapshot()});
   if(msg.type==='select')hooks.select(msg.key);
   if(msg.type==='preview')send(frame,{type:'snapshot',data:hooks.preview(msg)});
   if(msg.type==='accept'){hooks.accept(msg);}
   if(msg.type==='reject')send(frame,{type:'snapshot',data:hooks.reject()});
  }catch(error){send(frame,{type:'error',message:error.message});}
 }
});
function send(frame,message){frame.contentWindow?.postMessage({...message,channel:'zorel-univer',token:frame.dataset.token},location.origin);}
export function mountUniverInScheme(host,hooks){
 for(const frame of frames.keys())if(!frame.isConnected)frames.delete(frame);
 for(const frame of host.querySelectorAll('iframe[data-zorel-univer]')){frames.set(frame,hooks);frame.dataset.token=crypto.randomUUID();frame.src='/univer-frame.html#'+frame.dataset.token;}
}
