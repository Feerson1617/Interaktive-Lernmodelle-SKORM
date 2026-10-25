 // SCORM-only lifecycle integration; model settings remain in their own frames.
 let sessionFinished=false;
 function syncSession(){
  const paused=sessionFinished||document.hidden;
  if(paused){if(frame)cancelAnimationFrame(frame);frame=0;for(const id of frames.keys())post(id,'pause');}
  else if(active==='head'){resize();drawSoon();}
  else post(active,'resume');
 }
 window.addEventListener('scorm:session',e=>{sessionFinished=e.detail.phase==='finished';syncSession();});
 document.addEventListener('visibilitychange',syncSession);
 // The toolbar can wrap when the LMS frame is narrow or text is enlarged.
 const toolbar=document.getElementById('scorm-session');
 if(toolbar){const measure=()=>document.documentElement.style.setProperty('--scorm-height',toolbar.getBoundingClientRect().height+'px');new ResizeObserver(measure).observe(toolbar);measure();}
