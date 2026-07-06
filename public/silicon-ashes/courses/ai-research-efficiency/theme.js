(function(){
  const key='ai-teacher-course-theme';
  const root=document.documentElement;
  function apply(value){
    if(value==='dark') root.setAttribute('data-theme','dark');
    else root.removeAttribute('data-theme');
  }
  window.cycleTheme=function(){
    const current=localStorage.getItem(key)||'light';
    const next=current==='dark'?'light':'dark';
    localStorage.setItem(key,next);
    apply(next);
  };
  apply(localStorage.getItem(key)||'light');
})();