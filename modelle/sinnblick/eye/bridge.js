/* Shared navigation contract. Only this app's parent may activate a module. */
window.SenseBridge=(()=>{
 const embedded=window.parent!==window;let paused=embedded,locked=true,last=0,until=0,callbacks=null;
 const send=action=>{if(embedded)parent.postMessage({type:'sinnblick',action},'*');};
 function barrier(){locked=true;last=performance.now();until=last+420;}
 function allowed(){if(!embedded)return true;const now=performance.now(),gap=now-last;last=now;if(paused)return false;if(locked&&now>=until&&gap>280)locked=false;return !locked;}
 window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='sinnblick'||!callbacks)return;
 if(e.data.action==='activate'){paused=false;barrier();callbacks.activate();}
 if(e.data.action==='pause'){paused=true;callbacks.pause();}
 });
 return {get paused(){return paused;},allowed,barrier,leave(){if(!embedded)return false;paused=true;callbacks?.pause();send('leave');return true;},ready(cb){callbacks=cb;send('ready');}};
})();
