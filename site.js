/* Stirling Club concept pass 2: our code. Motion ignores prefers-reduced-motion by design;
   the single Pause/Play control stops every film loop (WCAG 2.2.2). */
(function(){
  var root=document.documentElement,paused=false,seen=new Set();
  var vids=[].slice.call(document.querySelectorAll('video.loop'));
  vids.forEach(function(v){v.muted=true;v.defaultMuted=true;v.playsInline=true;});
  /* hero film: full-bleed cover of the film window (no side letterbox). Type card stays below. */
  (function(){
    var hv=document.querySelector('.hero-film video');
    var box=document.querySelector('.hero-film');
    if(!hv||!box)return;
    function fitHero(){
      hv.style.removeProperty('--hero-max-w');
      hv.style.removeProperty('--hero-max-h');
      hv.style.setProperty('--hero-fit-w','100%');
      hv.style.setProperty('--hero-fit-h','100%');
      hv.style.width='100%';
      hv.style.height='100%';
      hv.style.maxWidth='none';
      hv.style.maxHeight='none';
      hv.style.objectFit='cover';
      hv.style.objectPosition='center center';
      box.style.alignItems='stretch';
      box.style.justifyContent='stretch';
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
  });
  document.addEventListener('visibilitychange',function(){if(!document.hidden)seen.forEach(play);});

  /* Stretch "Your Forever" until visible glyph ink right edge matches "DESERVES STIRLING."
     (layout boxes can match while italic ink still falls short of the period). */
  (function(){
    var title=document.querySelector('.hero-card .disp em.title');
    var caps=document.querySelector('.hero-card .disp .caps.gold');
    if(!title||!caps)return;
    var canvas=document.createElement('canvas');
    var ctx=canvas.getContext('2d',{willReadFrequently:true});

    function visibleText(el){
      var cs=getComputedStyle(el),t=el.textContent||'';
      var tt=(cs.textTransform||'').toLowerCase();
      if(tt==='uppercase')t=t.toUpperCase();
      else if(tt==='lowercase')t=t.toLowerCase();
      return t;
    }
    /* Rightmost opaque ink of the rendered glyphs (not the layout box). */
    function inkRight(el){
      var cs=getComputedStyle(el);
      var text=visibleText(el);
      var fontSize=parseFloat(cs.fontSize)||16;
      var ls=cs.letterSpacing;
      var box=el.getBoundingClientRect();
      var w=Math.max(64, Math.ceil(box.width+96));
      var h=Math.max(32, Math.ceil(fontSize*2.6));
      if(canvas.width!==w)canvas.width=w;
      if(canvas.height!==h)canvas.height=h;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,w,h);
      ctx.font=(cs.fontStyle||'normal')+' '+(cs.fontWeight||'400')+' '+cs.fontSize+' '+cs.fontFamily;
      if(ctx.letterSpacing!==undefined)ctx.letterSpacing=ls;
      ctx.fillStyle='#fff';
      ctx.textBaseline='alphabetic';
      var x0=24;
      ctx.fillText(text,x0,fontSize*1.4);
      var data=ctx.getImageData(0,0,w,h).data;
      var maxX=0;
      for(var px=0;px<w;px++){
        for(var py=0;py<h;py++){
          var i4=(py*w+px)*4;
          if(data[i4+3]>40&&data[i4]>40)maxX=px;
        }
      }
      return box.left+(maxX-x0);
    }

    function matchWidth(){
      title.style.letterSpacing='0px';
      var target=inkRight(caps);
      var natural=inkRight(title);
      if(!(target>0)||!(natural>0))return;
      if(natural>=target-0.5){title.style.letterSpacing='0px';return;}
      var lo=0,hi=Math.max(12,(target-natural)*1.6),best=0;
      for(var i=0;i<32;i++){
        var mid=(lo+hi)/2;
        title.style.letterSpacing=mid+'px';
        var r=inkRight(title);
        if(r<target){lo=mid;best=mid;}else{hi=mid;best=mid;}
      }
      title.style.letterSpacing=best.toFixed(3)+'px';
      var r2=inkRight(title),diff=target-r2;
      if(Math.abs(diff)>0.5){
        var gaps=Math.max(1,(title.textContent||'').length-1);
        title.style.letterSpacing=(best+diff/gaps).toFixed(3)+'px';
      }
    }
    function run(){matchWidth();requestAnimationFrame(matchWidth);}
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run);else run();
    addEventListener('resize',run);
    setTimeout(run,200);setTimeout(run,600);setTimeout(run,1400);
  })();

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
  /* opening: headline rows rise; film stays cover full-bleed in its window */
  g.from('.hero-card .ln>*',{yPercent:110,duration:1.4,ease:quart,stagger:0.1,delay:0.2});
  g.from('.hero-foot',{y:24,opacity:0,duration:1.2,ease:quart,delay:0.55});
  /* split scroll: media drift inside its frame; headline rows rise when the copy arrives */
  g.utils.toArray('.m').forEach(function(f){
    var el=f.querySelector('img,video');
    g.fromTo(el,{'--py':'-8%','--ms':1.06},{'--py':'0%','--ms':1,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}});
  });
  g.utils.toArray('.split, .club').forEach(function(s){
    var rows=s.querySelectorAll('.disp .ln>*');
    g.from(rows,{yPercent:110,duration:1.2,ease:quart,stagger:0.09,scrollTrigger:{trigger:s,start:'top 70%'}});
    g.from(s.querySelectorAll('.split-in>p, .acts, .club-head p, .rooms p'),{y:28,opacity:0,duration:1.1,ease:quart,stagger:0.08,scrollTrigger:{trigger:s,start:'top 60%'}});
  });
  g.utils.toArray('.strip img').forEach(function(im){
    g.fromTo(im,{'--ms':1.14},{'--ms':1,ease:'none',scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:true}});
  });
  g.from('.word',{yPercent:60,opacity:0,duration:1.4,ease:quart,scrollTrigger:{trigger:'.foot',start:'top 85%'}});
})();
