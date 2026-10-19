// SERVICES: edit this array to change available services, descriptions, and prices.
// Each item: { id: string, title: string, desc: [line1, line2], price: string }
// If price is empty string, the UI will display "???? ?? ???????".
const SERVICES = [
  { id: 'ext-wash', title: '?????????? ?????', desc: ['??????? ????? ??????????', '????? ?????? ? ??????? ?????'], price: '' },
  { id: 'deep-interior', title: '????????? ??????? ?? ????????', desc: ['???????? ??????? ?? ??????? ? ??????', '???????????? ????? ? ???????'], price: '' },
  { id: 'paint-polish', title: '???????? ?? ???', desc: ['???????? ????? ??????????', '????? ???????? ???? ?? ??????'], price: '' },
  { id: 'ceramic-coating', title: '????????? ???????', desc: ['??????????? ??????? ?? ?????', '?????????? ? ??????? ?? ?????'], price: '' },
  { id: 'headlight-polish', title: '???????? ?? ??????', desc: ['????? ?? ??????????? ?? ????????', '??????????? ?? ?????????????'], price: '' },
  { id: 'engine-clean', title: '??????? ?? ?????', desc: ['????? ? ???????? ???????', '???????? ?? ??????? ? ??????? ???????'], price: '' }
];

// REVIEWS: edit these reviews as needed. Each item: { name, rating (1-5), text }
const REVIEWS = [
  { name: '???? ??????', rating: 5, text: '??????????? ??????! ????? ?????? ????????? ???? ???. ??????? ? ???? ?????.' },
  { name: '?????? ????????', rating: 5, text: '????? ??? ????????? ?? ?????????? ? ?? ?????????? ?? ??????????.' },
  { name: '?????????? ???????', rating: 5, text: '????????????? ???????, ?? ???????????? ?? ?????? ??? ???? ????? ????.' }
];

// Formspree endpoint: replace YOUR_FORM_ID with your Formspree form ID.
// Example: 'https://formspree.io/f/mnqlpawr' -> replace mnqlpawr with your id.
const FORM_SPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

// Utility: safe query
const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', function () {
  // Navigation toggle
  const nav = document.getElementById('primary-navigation');
  const toggle = document.getElementById('navToggle');
  function setExpanded(isOpen){ if(!toggle || !nav) return; toggle.setAttribute('aria-expanded', String(isOpen)); if(isOpen) nav.classList.add('open'); else nav.classList.remove('open'); }
  if(toggle) toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') === 'false'));

  // Close nav on link and Escape
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') setExpanded(false); });
  document.querySelectorAll('#primary-navigation a').forEach(a => a.addEventListener('click', () => setExpanded(false)));

  // Footer year
  const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

  // entrance animation
  document.body.classList.add('is-loaded');

  // Render services and populate select
  function renderServices(){
    const grid = document.getElementById('services-grid');
    const select = document.getElementById('service');
    if(grid){ grid.innerHTML = ''; SERVICES.forEach(s => {
      const card = document.createElement('article');
      card.className = 'service-card reveal';
      card.innerHTML = `
        <div class="service-top">
          <div class="service-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 11l2-3h14l2 3v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h3 class="service-title">${s.title}</h3>
        </div>
        <p class="service-desc">${s.desc.join('<br>')}</p>
        <div class="service-meta">
          <span class="service-price">${s.price || '???? ?? ???????'}</span>
          <button class="btn btn-outline reserve-btn" data-service="${s.id}">??????????</button>
        </div>
      `;
      grid.appendChild(card);
    }); }
    if(select){ select.innerHTML = '<option value="">-- ???????? ?????? --</option>'; SERVICES.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.title; select.appendChild(opt); }); }
  }
  renderServices();

  // Reserve buttons - delegate
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.reserve-btn');
    if(!btn) return;
    const id = btn.getAttribute('data-service');
    const select = document.getElementById('service'); if(select) select.value = id;
    const form = document.getElementById('booking-form'); if(form){ form.scrollIntoView({behavior:'smooth', block:'center'}); const nm = document.getElementById('name'); if(nm) nm.focus(); }
  });

  // Compare sliders
  (function(){
    const sliders = document.querySelectorAll('.compare-slider');
    sliders.forEach(slider => {
      const after = slider.querySelector('.compare-img.after');
      const handle = slider.querySelector('.compare-handle');
      if(!after || !handle) return;
      function setPos(p){ p = Math.max(0, Math.min(100, p)); after.style.width = p + '%'; handle.style.left = p + '%'; handle.setAttribute('aria-valuenow', Math.round(p)); }
      setPos(50);
      let dragging = false;
      function update(clientX){ const r = slider.getBoundingClientRect(); const x = clientX - r.left; const pct = x / r.width * 100; setPos(pct); }
      handle.addEventListener('pointerdown', (e) => { dragging = true; handle.setPointerCapture && handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointermove', (e) => { if(!dragging) return; update(e.clientX); });
      handle.addEventListener('pointerup', (e) => { dragging = false; try{ handle.releasePointerCapture && handle.releasePointerCapture(e.pointerId);}catch{} });
      slider.addEventListener('pointerdown', (e) => { if(e.target === handle) return; update(e.clientX); });
      handle.addEventListener('keydown', (e) => { const cur = parseInt(handle.getAttribute('aria-valuenow')||50,10); if(e.key==='ArrowLeft') setPos(cur-5); if(e.key==='ArrowRight') setPos(cur+5); if(e.key==='Home') setPos(0); if(e.key==='End') setPos(100); });
    });
  })();

  // Photo grid lightbox
  (function(){
    const items = Array.from(document.querySelectorAll('.photo-item'));
    if(items.length === 0) return;
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbCaption = document.getElementById('lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    let current = 0;
    const gallery = items.map(it => { const img = it.querySelector('img'); return { src: img.getAttribute('src'), alt: img.getAttribute('alt') }; });
    function open(idx){ current = (idx + gallery.length) % gallery.length; lbImg.src = gallery[current].src; lbImg.alt = gallery[current].alt || '??????? ?? ?????'; lbCaption.textContent = gallery[current].alt || ''; lightbox.setAttribute('aria-hidden','false'); closeBtn.focus(); document.body.style.overflow='hidden'; }
    function close(){ lightbox.setAttribute('aria-hidden','true'); lbImg.src = ''; lbImg.alt = ''; lbCaption.textContent = ''; document.body.style.overflow = ''; }
    function show(dir){ current = (current + dir + gallery.length) % gallery.length; lbImg.src = gallery[current].src; lbImg.alt = gallery[current].alt || ''; lbCaption.textContent = gallery[current].alt || ''; }
    items.forEach((b,i)=> b.addEventListener('click', ()=> open(i)));
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', ()=> show(-1)); nextBtn.addEventListener('click', ()=> show(1));
    document.addEventListener('keydown', (e)=>{ if(lightbox.getAttribute('aria-hidden')==='false'){ if(e.key==='Escape') close(); if(e.key==='ArrowLeft') show(-1); if(e.key==='ArrowRight') show(1); } });
    const stage = lightbox.querySelector('.lightbox-stage'); let startX=0, down=false;
    stage.addEventListener('pointerdown', (e)=>{ down=true; startX=e.clientX; stage.setPointerCapture && stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointerup', (e)=>{ if(!down) return; down=false; const dx = e.clientX - startX; if(Math.abs(dx)>40) show(dx<0?1:-1); try{ stage.releasePointerCapture && stage.releasePointerCapture(e.pointerId);}catch{} });
    lightbox.addEventListener('click',(e)=>{ if(e.target===lightbox) close(); });
  })();

  // Reviews carousel
  (function(){
    const container = document.getElementById('reviews-carousel');
    if(!container) return;
    let index = 0; let autoplay = true; const interval = 4500; let timer = null;
    function render(){
      container.innerHTML = '';
      REVIEWS.forEach((r,i)=>{
        const slide = document.createElement('div');
        slide.className = 'review-slide';
        slide.setAttribute('data-index', i);
        slide.style.display = (i===index)?'block':'none';
        const stars = '?'.repeat(r.rating) + '?'.repeat(5-r.rating);
        slide.innerHTML = `<div class="review-text">${r.text}</div><div class="review-author">${r.name} <span class="review-stars">${stars}</span></div>`;
        container.appendChild(slide);
      });
    }
    function show(i){ index = (i + REVIEWS.length) % REVIEWS.length; render(); }
    function next(){ show(index+1); }
    render();
    const btnPrev = document.getElementById('rev-prev'); const btnNext = document.getElementById('rev-next');
    if(btnPrev) btnPrev.addEventListener('click', ()=>{ autoplay=false; show(index-1); });
    if(btnNext) btnNext.addEventListener('click', ()=>{ autoplay=false; show(index+1); });
    // autoplay
    function start(){ if(timer) clearInterval(timer); timer = setInterval(()=>{ if(autoplay) next(); }, interval); }
    start();
    // pause on hover/touch
    container.addEventListener('pointerenter', ()=> autoplay=false);
    container.addEventListener('pointerleave', ()=> autoplay=true);
    // swipe
    let sx=0, sw=false;
    container.addEventListener('pointerdown',(e)=>{ sw=true; sx=e.clientX; });
    container.addEventListener('pointerup',(e)=>{ if(!sw) return; sw=false; const dx=e.clientX-sx; if(Math.abs(dx)>40){ if(dx<0) next(); else show(index-1); } });
  })();

  // Counters animation when visible
  (function(){
    const counters = Array.from(document.querySelectorAll('.counter'));
    if(counters.length===0) return;
    function animateCounter(el, target){ const duration=1400; const startTime = performance.now(); function frame(now){ const progress = Math.min(1, (now-startTime)/duration); const val = Math.floor(progress * target); el.textContent = val; if(progress<1) requestAnimationFrame(frame); else el.textContent = target; } requestAnimationFrame(frame); }
    const obs = new IntersectionObserver((entries, o)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ const el = entry.target; const target = parseInt(el.getAttribute('data-target')||'0',10); animateCounter(el, target); o.unobserve(el); } }); }, { threshold: 0.4 });
    counters.forEach(c=> obs.observe(c));
  })();

  // FAQ accordion
  (function(){
    document.querySelectorAll('.accordion .accordion-item').forEach(item=>{
      const btn = item.querySelector('.acc-btn'); const panel = item.querySelector('.acc-panel');
      btn.addEventListener('click', ()=>{
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if(!open){ panel.classList.add('open'); panel.style.maxHeight = panel.scrollHeight + 'px'; } else { panel.classList.remove('open'); panel.style.maxHeight = null; }
      });
    });
  })();

  // Booking form: validation, Formspree submit, WhatsApp
  (function(){
    const form = document.getElementById('booking-form'); if(!form) return;
    const messages = document.getElementById('form-messages');
    const btnWhatsapp = document.getElementById('send-whatsapp');
    const floatWa = document.getElementById('float-wa');

    function clearErrors(){ ['name','phone','email','vehicle','service','date','time'].forEach(id=>{ const el=document.getElementById('error-'+id); if(el) el.textContent=''; }); if(messages) messages.innerHTML=''; }

    function validate(){ clearErrors(); const data = { name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(), vehicle: form.vehicle.value.trim(), service: form.service.value, date: form.date.value, time: form.time.value, message: form.message.value.trim() }; let ok=true; if(!data.name){ document.getElementById('error-name').textContent='??????? ???.'; ok=false;} if(!data.phone || data.phone.length<5){ document.getElementById('error-phone').textContent='??????? ??????? ???????.'; ok=false;} if(data.email){ const re=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; if(!re.test(data.email)){ document.getElementById('error-email').textContent='??????? ??????? ?-????? ??? ???????? ??????.'; ok=false; }} if(!data.vehicle){ document.getElementById('error-vehicle').textContent='??????? ????? ? ????? ?? ????????.'; ok=false;} if(!data.service){ document.getElementById('error-service').textContent='???????? ??????.'; ok=false;} if(!data.date){ document.getElementById('error-date').textContent='???????? ?????.'; ok=false;} if(!data.time){ document.getElementById('error-time').textContent='???????? ?????.'; ok=false;} return { ok, data }; }

    async function submitToFormspree(payload){ try{ const res = await fetch(FORM_SPREE_ENDPOINT, { method:'POST', headers:{ 'Accept':'application/json','Content-Type':'application/json' }, body: JSON.stringify(payload) }); return res; }catch(err){ console.error(err); throw err; } }

    form.addEventListener('submit', async (e)=>{ e.preventDefault(); const submitBtn = form.querySelector('button[type="submit"]'); const { ok, data } = validate(); if(!ok) return; if(messages) messages.innerHTML = '<div class="form-success">?? ???????...</div>'; if(submitBtn) submitBtn.disabled = true; try{ const res = await submitToFormspree(data); if(res.ok){ if(messages) messages.innerHTML = '<div class="form-success">??????????! ?????? ?????? ? ???????. ??? ?? ?? ???????????? ???????.</div>'; form.reset(); } else { const json = await res.json().catch(()=>null); const msg = (json && json.error) ? json.error : '?????? ??? ?????????, ??????? ?? ????????.'; if(messages) messages.innerHTML = `<div class="form-error">${msg}</div>`; } }catch(err){ if(messages) messages.innerHTML = '<div class="form-error">?????? ??? ?????????, ????????? ?? ???????? ???????????.</div>'; }finally{ if(submitBtn) submitBtn.disabled = false; } });

    function buildWhatsappMessage(){ const vals = { name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(), vehicle: form.vehicle.value.trim(), service: (SERVICES.find(s=>s.id===form.service.value)||{}).title||form.service.value||'', date: form.date.value, time: form.time.value, message: form.message.value.trim() }; let text = '?????????? - Car detailing vande%0A'; text += `???: ${vals.name}%0A`; text += `???????: ${vals.phone}%0A`; if(vals.email) text += `?-?????: ${vals.email}%0A`; if(vals.vehicle) text += `??????: ${vals.vehicle}%0A`; if(vals.service) text += `??????: ${vals.service}%0A`; if(vals.date) text += `?????: ${vals.date}%0A`; if(vals.time) text += `?????: ${vals.time}%0A`; if(vals.message) text += `??????: ${vals.message}%0A`; return text; }

    if(btnWhatsapp) btnWhatsapp.addEventListener('click', (e)=>{ e.preventDefault(); const { ok } = validate(); if(!ok) return; const text = buildWhatsappMessage(); window.open('https://wa.me/38975915888?text=' + encodeURIComponent(text), '_blank'); });
    if(floatWa) floatWa.addEventListener('click', (e)=>{ e.preventDefault(); const text = buildWhatsappMessage(); window.open('https://wa.me/38975915888?text=' + encodeURIComponent(text), '_blank'); });

    // Initialize reviews controls (prev/next) to ensure they pause autoplay when used
    const revPrev = document.getElementById('rev-prev');
    const revNext = document.getElementById('rev-next');
    if(revPrev) revPrev.addEventListener('click', () => {});
    if(revNext) revNext.addEventListener('click', () => {});

  })();

  // Scroll reveal: apply .is-revealed to elements with .reveal when visible
  (function(){
    const targets = document.querySelectorAll('.reveal');
    if(targets.length===0) return;
    const obs = new IntersectionObserver((entries, o)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-revealed');
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(t=> obs.observe(t));
  })();

});
