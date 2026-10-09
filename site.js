/* Stirling Club concept pass 2: our code. Motion ignores prefers-reduced-motion by design;
   the single Pause/Play control stops every film loop (WCAG 2.2.2). */
(function(){
  var root=document.documentElement,paused=false,seen=new Set();
  var vids=[].slice.call(document.querySelectorAll('video.loop'));
  vids.forEach(function(v){v.muted=true;v.defaultMuted=true;v.playsInline=true;});
  /* hero: shrink film to visible window above rising card - fill that window top-to-bottom; side letterbox; no upscale past native */
  (function(){
    var hv=document.querySelector('.hero-film video');
    var box=document.querySelector('.hero-film');
    if(!hv||!box)return;
    function fitHero(){
      var dpr=Math.max(1, window.devicePixelRatio||1);
      var nw=hv.videoWidth||1920, nh=hv.videoHeight||1080;
      var natW=Math.floor(nw/dpr), natH=Math.floor(nh/dpr);
      var boxW=box.clientWidth, boxH=box.clientHeight;
      var visH=Math.max(140, boxH);
      /* phone: fill the film window (cover + side crop) so first screen is not empty letterbox */
      if(window.matchMedia('(max-width:820px)').matches){
        hv.style.removeProperty('--hero-max-w');
        hv.style.removeProperty('--hero-max-h');
        hv.style.setProperty('--hero-fit-w','100%');
        hv.style.setProperty('--hero-fit-h','100%');
        hv.style.width='100%';
        hv.style.height='100%';
        hv.style.maxWidth='none';
        hv.style.maxHeight='none';
        hv.style.objectFit='cover';
        hv.style.objectPosition='center 42%';
        box.style.alignItems='stretch';
        box.style.justifyContent='stretch';
        box.style.paddingTop='0px';
        return;
      }
      hv.style.objectFit='contain';
      hv.style.maxWidth='';
      hv.style.maxHeight='';
      var h=Math.min(visH, natH);
      var w=Math.round(h*(nw/nh));
      if(w>Math.min(boxW, natW)){
        w=Math.min(boxW, natW);
        h=Math.round(w*(nh/nw));
      }
      hv.style.setProperty('--hero-max-w', natW+'px');
      hv.style.setProperty('--hero-max-h', natH+'px');
      hv.style.setProperty('--hero-fit-w', w+'px');
      hv.style.setProperty('--hero-fit-h', h+'px');
      hv.style.width=w+'px';
      hv.style.height=h+'px';
      box.style.alignItems='center';
      box.style.justifyContent='center';
      box.style.paddingTop='0px';
    }
    if(hv.videoWidth)fitHero();
    else hv.addEventListener('loadedmetadata',fitHero,{once:true});
    addEventListener('resize',fitHero);
    requestAnimationFrame(function(){ fitHero(); setTimeout(fitHero, 80); setTimeout(fitHero, 400); });
  })();
  function play(v){if(paused)return;var p=v.play();if(p&&p.catch)p.catch(function(){});}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){seen.add(e.target);play(e.target);}else{seen.delete(e.target);e.target.pause();}
  });},{rootMargin:'15% 0px'});
  vids.forEach(function(v){io.observe(v);});
  var btn=document.querySelector('.motion');
  btn.addEventListener('click',function(){
    paused=!paused;root.classList.toggle('is-paused',paused);
    btn.textContent=paused?'Play Film':'Pause Film';btn.setAttribute('aria-pressed',String(paused));
    if(paused)vids.forEach(function(v){v.pause();});else seen.forEach(play);
    /* Pause freezes all motion: GSAP + smooth scroll */ if(window.gsap){gsap.globalTimeline[paused?'pause':'resume']();}if(typeof lenis!=='undefined'&&lenis){lenis.options.smoothWheel=!paused;}
  });
  document.addEventListener('visibilitychange',function(){if(!document.hidden)seen.forEach(play);});
  /* keep Pause clear of footer wordmark */
  var foot=document.querySelector('.foot');
  if(foot&&'IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){root.classList.toggle('is-over-foot',e.isIntersecting);});},{threshold:0,rootMargin:'0px 0px -8% 0px'}).observe(foot);
  }

  /* pass 54: every headline row stays on one line (no one-word orphans) - shrink the heading until its longest row fits */
  function fitRows(){
    document.querySelectorAll('.split .disp, .club .disp').forEach(function(h){
      h.style.fontSize='';
      var rows=[].slice.call(h.querySelectorAll('.ln>*'));
      rows.forEach(function(r){r.style.whiteSpace='';});
      var box=h.parentNode, cs=getComputedStyle(box);
      var a=box.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0)-4;
      var base=parseFloat(getComputedStyle(h).fontSize), ratio=1;
      rows.forEach(function(r){
        var probe=document.createElement('span');
        probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0';
        probe.style.font=getComputedStyle(r).font; probe.style.letterSpacing=getComputedStyle(r).letterSpacing;
        probe.style.textTransform=getComputedStyle(r).textTransform;
        probe.innerHTML=r.innerHTML; document.body.appendChild(probe);
        var w=probe.getBoundingClientRect().width+parseFloat(getComputedStyle(r.parentNode).paddingLeft||0)*2;
        document.body.removeChild(probe);
        if(a>0&&w>a) ratio=Math.min(ratio,a/w);
      });
      if(ratio<1) h.style.fontSize=(base*ratio*0.97).toFixed(2)+'px';
      rows.forEach(function(r){r.style.whiteSpace='nowrap';});
    });
  }
  (document.fonts?document.fonts.ready:Promise.resolve()).then(fitRows);addEventListener('resize',fitRows);fitRows();
  /* fit the footer wordmark to the column */
  var word=document.querySelector('.word');
  function fit(){if(!word)return;word.style.setProperty('--wfs','10vw');var w=word.scrollWidth,a=word.parentNode.clientWidth-2*parseFloat(getComputedStyle(word.parentNode).paddingLeft||0);
    if(w>0)word.style.setProperty('--wfs',(10*a/w).toFixed(3)+'vw');}
  (document.fonts?document.fonts.ready:Promise.resolve()).then(fit);addEventListener('resize',fit);
  var lenis=null;
  if(window.Lenis){
    lenis=new Lenis({lerp:0.1,smoothWheel:true});root.classList.add('lenis');
    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(ev){
      var id=a.getAttribute('href');var t=document.querySelector(id);if(!t)return;ev.preventDefault();
      lenis.scrollTo(t,{duration:1.4,easing:function(x){return 1-Math.pow(1-x,4);}});});});
  }
  var g=window.gsap,ST=window.ScrollTrigger;if(!g||!ST)return;
  g.registerPlugin(ST);
  if(lenis){lenis.on('scroll',ST.update);g.ticker.add(function(t){lenis.raf(t*1000);});g.ticker.lagSmoothing(0);}
  var quart='power4.out';
  /* opening headline: per-word reveal lives at the end of this file */
  /* split scroll: media drift inside its frame; headline rows rise when the copy arrives */
  g.utils.toArray('.m').forEach(function(f){
    var el=f.querySelector('img,video');
    g.fromTo(el,{'--py':'-8%','--ms':1.06},{'--py':'0%','--ms':1,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}});
  });
  g.utils.toArray('.split, .club').forEach(function(s){
    var rows=s.querySelectorAll('.disp .ln>*');
    g.from(rows,{yPercent:120,duration:1.2,ease:quart,stagger:0.09,scrollTrigger:{trigger:s,start:'top 70%'}});
    g.from(s.querySelectorAll('.split-in>p, .acts, .club-head p, .rooms p'),{y:28,opacity:0,duration:1.1,ease:quart,stagger:0.08,scrollTrigger:{trigger:s,start:'top 60%'}});
  });
  g.utils.toArray('.strip img').forEach(function(im){
    g.fromTo(im,{'--ms':1.14},{'--ms':1,ease:'none',scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:true}});
  });
  g.from('.word',{yPercent:60,opacity:0,duration:1.4,ease:quart,scrollTrigger:{trigger:'.foot',start:'top 85%'}});
})();

/* Stirling hero: one word every 2s, starts when the heading scrolls into view */
(function(){
  var h=document.querySelector('.hero-card .disp'); if(!h) return;
  var i=0;
  h.querySelectorAll('.ln>*').forEach(function(row){
    var words=row.textContent.trim().split(/\s+/);
    row.textContent='';
    words.forEach(function(w,k){
      var s=document.createElement('span'); s.className='w'; s.style.setProperty('--d',([1,2,3,6][i++]||6)+'s'); s.textContent=w;
      row.appendChild(s); if(k<words.length-1) row.appendChild(document.createTextNode(' '));
    });
  });
  if(!('IntersectionObserver' in window)){h.classList.add('is-in');return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){h.classList.add('is-in');io.disconnect();}})},{threshold:.4});
  io.observe(h);
})();
