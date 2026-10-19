(function(){
  var dlg=document.getElementById('leadDialog'), form=document.getElementById('leadForm'),
      ok=document.getElementById('leadOk'), err=document.getElementById('leadErr'), sendBtn=document.getElementById('leadSend');
  // Cole aqui a URL que recebe os leads (ex.: Formspree ou uma rota da API ligada ao Supabase).
  // Vazio = modo preview: o formulário valida e mostra a confirmação, mas não envia nada.
  
  function openForm(){ form.hidden=false; ok.hidden=true; err.hidden=true; dlg.showModal(); }
  document.querySelectorAll('[data-open-form]').forEach(function(b){ b.addEventListener('click',openForm); });
  document.querySelectorAll('[data-close-form]').forEach(function(b){ b.addEventListener('click',function(){ dlg.close(); }); });
  dlg.addEventListener('click',function(e){ if(e.target===dlg){ dlg.close(); } });
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var data={}; new FormData(form).forEach(function(v,k){ data[k]=v; });
    data.origem='landing-page'; data.consentimento=form.elements.consentimento.checked;
    function done(){ form.hidden=true; ok.hidden=false; form.reset(); }
    if(!LEADS_ENDPOINT){ console.info('Lead (preview, nao enviado):',data); done(); return; }
    sendBtn.disabled=true; err.hidden=true;
    fetch(LEADS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){ if(!r.ok){ throw new Error(r.status); } return r.json(); })
      .then(function(j){ if(!j||!j.ok){ throw new Error('x'); } done(); })
      .catch(function(){ err.hidden=false; })
      .then(function(){ sendBtn.disabled=false; });
  });
})();

(function(){
  var root=document.documentElement, btn=document.getElementById('themeBtn');
  function apply(t){
    root.setAttribute('data-theme',t);
    btn.setAttribute('aria-label',t==='dark'?'Mudar para o tema claro':'Mudar para o tema escuro');
  }
  btn.addEventListener('click',function(){
    var next=root.getAttribute('data-theme')==='dark'?'light':'dark';
    apply(next);
    try{localStorage.setItem('theme',next)}catch(e){}
  });
  try{var s=localStorage.getItem('theme'); if(s==='dark'||s==='light'){apply(s)}}catch(e){}
})();

(function(){
  var b=document.getElementById('burger'), nav=document.getElementById('mainNav');
  var ham=b.querySelector('.ic-ham'), x=b.querySelector('.ic-x');
  function set(o){nav.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Fechar menu':'Abrir menu');ham.style.display=o?'none':'';x.style.display=o?'':'none'}
  b.addEventListener('click',function(){set(!nav.classList.contains('open'))});
  nav.addEventListener('click',function(e){if(e.target.closest('a,button'))set(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  window.addEventListener('resize',function(){if(window.innerWidth>860)set(false)});
})();
