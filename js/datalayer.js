/* dataLayer + rastreamento de eventos. Não envia dados pessoais (nome, e-mail, texto do desafio). */
window.dataLayer=window.dataLayer||[];
function track(evento,params){
  var o={event:evento}; for(var k in (params||{})){ o[k]=params[k]; }
  window.dataLayer.push(o);
  if(window.__TRACK_DEBUG){ console.info('[dataLayer]',o); }
}
window.track=track;
try{ window.__TRACK_DEBUG=/[?&]debug=1/.test(location.search); }catch(e){}

(function(){
  // Contexto da página, disponível para todas as tags do GTM
  var p=new URLSearchParams(location.search), utm={};
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){ if(p.get(k)){ utm[k]=p.get(k); } });
  window.dataLayer.push({ page_type:'landing_page', page_language:'pt-BR', site_theme:'light' });
  if(Object.keys(utm).length){
    try{ sessionStorage.setItem('utm',JSON.stringify(utm)); }catch(e){}
    window.dataLayer.push(Object.assign({event:'utm_capturado'},utm));
  }

  // Google Tag Manager (só se GTM_ID estiver preenchido)
  if(typeof GTM_ID!=='undefined' && GTM_ID){
    window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(GTM_ID);
    document.head.appendChild(s);
  }
})();

document.addEventListener('DOMContentLoaded',function(){
  function sec(el){ var s=el.closest('section,header,footer,dialog'); return s?(s.id||s.className.split(' ')[0]||s.tagName.toLowerCase()):'pagina'; }
  function txt(el){ return (el.getAttribute('aria-label')||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,60); }

  // Cliques: CTA do formulário, currículo, links externos, âncoras do menu
  document.addEventListener('click',function(e){
    var el=e.target.closest('a,button'); if(!el){ return; }
    var t=txt(el), local=sec(el);
    if(el.hasAttribute('data-open-form')){ track('cta_click',{cta_text:t,cta_location:local,cta_type:'abrir_formulario'}); return; }
    if(el.tagName==='A'){
      var h=el.getAttribute('href')||'';
      if(/\.pdf(\?|$)/i.test(h)){ track('file_download',{file_name:h.split('/').pop(),file_extension:'pdf',link_text:t,cta_location:local}); return; }
      if(/^https?:/i.test(h) && h.indexOf(location.host)<0){
        track('click_outbound',{link_url:h,link_domain:h.replace(/^https?:\/\//,'').split('/')[0],link_text:t,cta_location:local}); return; }
      if(/^mailto:/i.test(h)){ track('click_email',{link_text:t,cta_location:local}); return; }
      if(h.charAt(0)==='#'){ track('nav_click',{link_target:h,link_text:t,cta_location:local}); }
    }
    if(el.id==='themeBtn'){ setTimeout(function(){ var th=document.documentElement.getAttribute('data-theme')||'light'; track('theme_toggle',{theme:th}); window.dataLayer.push({site_theme:th}); },0); }
  });

  // Seções vistas (uma vez cada)
  if('IntersectionObserver' in window){
    var vistos={}, io=new IntersectionObserver(function(es){ es.forEach(function(en){
      if(en.isIntersecting && en.target.id && !vistos[en.target.id]){ vistos[en.target.id]=1; track('section_view',{section_id:en.target.id}); }
    }); },{threshold:.4});
    document.querySelectorAll('main section[id], section[id]').forEach(function(s){ io.observe(s); });
  }

  // Profundidade de rolagem
  var marcos=[25,50,75,90], feitos={};
  window.addEventListener('scroll',function(){
    var h=document.documentElement, max=h.scrollHeight-h.clientHeight; if(max<=0){ return; }
    var pct=Math.round(h.scrollTop/max*100);
    marcos.forEach(function(m){ if(pct>=m && !feitos[m]){ feitos[m]=1; track('scroll_depth',{percent_scrolled:m}); } });
  },{passive:true});

  // FAQ abertas
  document.querySelectorAll('details.faq').forEach(function(d){
    d.addEventListener('toggle',function(){ if(d.open){ track('faq_open',{faq_question:(d.querySelector('summary')||{}).textContent.trim().slice(0,80)}); } });
  });

  // Tempo engajado: 30s e 60s com a aba visível
  [30,60].forEach(function(s){ var vis=0, iv=setInterval(function(){ if(!document.hidden){ vis++; } if(vis>=s){ clearInterval(iv); track('engaged_time',{seconds:s}); } },1000); });

  // Formulário: início do preenchimento e abandono
  var form=document.getElementById('leadForm'), dlg=document.getElementById('leadDialog');
  if(form){
    var comecou=false, enviado=false;
    form.addEventListener('focusin',function(e){ if(!comecou && e.target.name){ comecou=true; track('form_start',{form_id:'lead_avaliacao',first_field:e.target.name}); } });
    form.addEventListener('lead:enviado',function(){ enviado=true; });
    form.addEventListener('focusout',function(e){ var f=e.target; if(f.name && f.value && f.type!=='checkbox'){ track('form_field_filled',{form_id:'lead_avaliacao',field_name:f.name}); } });
    if(dlg){ dlg.addEventListener('close',function(){ if(comecou && !enviado){ track('form_abandon',{form_id:'lead_avaliacao'}); } comecou=false; enviado=false; }); }
  }
});
