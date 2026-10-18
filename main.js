(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* dil */
  var btn=document.getElementById('langBtn');
  var onLang=[];
  function setLang(l){
    root.setAttribute('data-lang',l); root.lang=l;
    if(btn) btn.textContent=l==='tr'?'EN':'TR';
    try{localStorage.setItem('lang',l)}catch(e){}
    onLang.forEach(function(f){f(l)});
  }
  var saved=null; try{saved=localStorage.getItem('lang')}catch(e){}
  var startLang=saved||((navigator.language||'tr').slice(0,2)==='tr'?'tr':'en');
  if(btn) btn.addEventListener('click',function(){setLang(root.getAttribute('data-lang')==='tr'?'en':'tr')});

  /* isim ve unvanlar: yazılıp silinir */
  var typed=document.getElementById('typed');
  if(typed){
    var words={
      tr:['İlkim Eren','Simülasyon Geliştiricisi','Gömülü Sistem Geliştiricisi','Proje Yöneticisi','Oyun Tasarımcısı','Oyun Programcısı','Web Geliştiricisi'],
      en:['İlkim Eren','Simulation Developer','Embedded Systems Developer','Project Manager','Game Designer','Game Programmer','Web Developer']
    };
    var timer=null;
    function type(l){
      clearTimeout(timer);
      var list=words[l], wi=0, ci=list[0].length, del=false;
      typed.textContent=list[0];
      if(reduce) return;
      timer=setTimeout(function step(){
        var w=list[wi];
        ci+=del?-1:1;
        typed.textContent=w.slice(0,ci);
        var wait=del?40:85;
        if(!del&&ci===w.length){del=true;wait=wi===0?2600:1700}
        else if(del&&ci===0){del=false;wi=(wi+1)%list.length;wait=350}
        timer=setTimeout(step,wait);
      },2600);
      del=true;
    }
    onLang.push(type);
  }
  setLang(startLang);

  /* yıldızlı arka plan */
  var c=document.getElementById('stars');
  if(c){
    var ctx=c.getContext('2d'), stars=[], dpr=Math.min(window.devicePixelRatio||1,2);
    function size(){
      c.width=innerWidth*dpr; c.height=innerHeight*dpr;
      c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px';
      var n=Math.round(innerWidth*innerHeight/9000);
      stars=[];
      for(var i=0;i<n;i++) stars.push({x:Math.random()*c.width,y:Math.random()*c.height,r:(Math.random()*1.2+.3)*dpr,
        p:Math.random()*Math.PI*2,s:.4+Math.random()*1.2,b:Math.random()<.12});
    }
    function draw(t){
      ctx.clearRect(0,0,c.width,c.height);
      for(var i=0;i<stars.length;i++){
        var s=stars[i], a=reduce?.6:.35+.45*Math.sin(t/1000*s.s+s.p);
        ctx.fillStyle=s.b?'rgba(110,150,255,'+a+')':'rgba(255,255,255,'+a+')';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,6.283); ctx.fill();
      }
      if(!reduce) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize',size); requestAnimationFrame(draw);
  }

  /* mouse ışığı */
  var glow=document.querySelector('.glow'), dot=document.querySelector('.glow-dot');
  if(glow&&dot&&window.matchMedia('(pointer: fine)').matches){
    var mx=innerWidth/2,my=innerHeight/2,gx=mx,gy=my,dx=mx,dy=my;
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;document.body.classList.add('has-mouse')});
    document.addEventListener('mouseleave',function(){document.body.classList.remove('has-mouse')});
    (function loop(){
      var k=reduce?1:.12, kd=reduce?1:.35;
      gx+=(mx-gx)*k; gy+=(my-gy)*k; dx+=(mx-dx)*kd; dy+=(my-dy)*kd;
      glow.style.transform='translate('+gx+'px,'+gy+'px)';
      dot.style.transform='translate('+dx+'px,'+dy+'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* kaydırınca beliren kartlar */
  var items=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
    items.forEach(function(el){io.observe(el)});
  } else items.forEach(function(el){el.classList.add('in')});
})();
