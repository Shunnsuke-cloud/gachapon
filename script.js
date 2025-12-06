/* Gachapon Maker — script.js (ES6 module style) */
const STORAGE_KEY = 'gachapon_sets_v1';

/* ---------- Utilities ---------- */
const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2,9);
const nowISO = () => new Date().toISOString();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Auth helpers (simple SPA token flow) ---------- */
function getToken(){ return localStorage.getItem('accessToken'); }
function setToken(t){ if(t) localStorage.setItem('accessToken', t); else localStorage.removeItem('accessToken'); }
async function fetchWithAuth(url, opts = {}){
  opts.headers = opts.headers || {};
  const token = getToken();
  if(token) opts.headers['Authorization'] = 'Bearer ' + token;
  return fetch(url, opts);
}

// determine API base for local dev (handles localhost, 127.0.0.1 and common dev ports)
function apiBase(){
  const isLocalDev = ['localhost','127.0.0.1'].includes(location.hostname) || location.port === '5500';
  return isLocalDev ? 'http://localhost:4000' : '';
}

// Initialize auth UI: hide/show admin actions based on /api/auth/me
async function initAuthUI(){
  const token = getToken();
  const btnNew = document.getElementById('btn-new');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  if(!btnNew) return; // nothing to do if UI not present
  if(!token){ if(btnNew) btnNew.classList.add('hidden'); if(btnLogin) btnLogin.classList.remove('hidden'); if(btnLogout) btnLogout.classList.add('hidden'); document.body.classList.remove('is-admin'); return; }
  try{
  const base = apiBase();
    const r = await fetchWithAuth(base + '/api/auth/me');
    if(!r.ok){ setToken(null); if(btnNew) btnNew.classList.add('hidden'); if(btnLogin) btnLogin.classList.remove('hidden'); if(btnLogout) btnLogout.classList.add('hidden'); document.body.classList.remove('is-admin'); return; }
    const me = await r.json();
    if(me.role === 'admin'){ if(btnNew) btnNew.classList.remove('hidden'); document.body.classList.add('is-admin'); }
    else { if(btnNew) btnNew.classList.add('hidden'); document.body.classList.remove('is-admin'); }
    if(btnLogin) btnLogin.classList.add('hidden'); if(btnLogout) btnLogout.classList.remove('hidden');
  }catch(err){ console.error('initAuthUI', err); if(btnNew) btnNew.classList.add('hidden'); document.body.classList.remove('is-admin'); }
}

// attach global handlers for login/logout (called from DOMContentLoaded)
function attachAuthButtons(){
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  if(btnLogin) btnLogin.addEventListener('click', ()=>{ window.location.href = '/login.html'; });
  if(btnLogout) btnLogout.addEventListener('click', ()=>{ setToken(null); localStorage.removeItem('userRole'); window.location.reload(); });
}

async function fileToDataURL(file){
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej; r.readAsDataURL(file);
  });
}

const pickWeighted = (map) => {
  const keys = Object.keys(map);
  const total = keys.reduce((s,k)=>s+(map[k]||0),0);
  if(total <= 0) return keys[0];
  let r = Math.random()*total; for(const k of keys){ r -= (map[k]||0); if(r<=0) return k; } return keys[keys.length-1];
}

/* ---------- Initial built-in data (base64 SVG placeholders) ---------- */
const initialThumbnails = [
  svgDataURL(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='320'><rect width='100%' height='100%' rx='16' fill='#0f1720'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#7c3aed'>Gacha 1</text></svg>`),
  svgDataURL(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='320'><rect width='100%' height='100%' rx='16' fill='#081827'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#06b6d4'>Pocket Star</text></svg>`)
];

const initialItems = (()=>{
  const colors = {N:'#94a3b8',R:'#60a5fa',SR:'#a78bfa',SSR:'#f97316'};
  const rarities = ['N','R','SR','SSR'];
  const items = [];
  for(let i=0;i<8;i++){
    const r = rarities[Math.floor(Math.random()*rarities.length)];
    items.push({ id: uid(), name: `${r} Item ${i+1}`, rarity: r, imgSrc: svgDataURL(itemSVG(r, i)) });
  }
  return items;
})();

const initialBackgrounds = (()=>{
  const bgs = [];
  for(let i=0;i<6;i++){
    bgs.push({ id: uid(), imgSrc: svgDataURL(bgSVG(i)) });
  }
  return bgs;
})();

function svgDataURL(svg){ return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); }
function itemSVG(rarity, idx){
  const bg = rarity === 'SSR' ? '#ffd166' : rarity === 'SR' ? '#a78bfa' : rarity === 'R' ? '#60a5fa' : '#94a3b8';
  const name = `${rarity} ${idx+1}`;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect rx='24' width='100%' height='100%' fill='${bg}'/><g transform='translate(8,8)'><circle cx='120' cy='80' r='48' fill='rgba(255,255,255,0.2)' stroke='white' stroke-opacity='0.1'/><text x='50%' y='65%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='rgba(0,0,0,0.6)'>${name}</text></g></svg>`;
}
function bgSVG(i){
  const colors = ['#081827','#0b1220','#052f38','#2b0b3a','#0b1f1a','#1a0b0b'];
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='${colors[i%colors.length]}'/><stop offset='1' stop-color='#021130' stop-opacity='0.8'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><g fill='rgba(255,255,255,0.02)'><rect x='200' y='80' width='360' height='360' rx='10'/></g></svg>`;
}

/* ---------- Storage / Model ---------- */
const Storage = {
  load(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){return null}
  },
  save(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
}

function makeDefaultSets(){
  const set = {
    id: uid(), title: 'Starter Gacha', thumbnailImg: initialThumbnails[0], items: initialItems.slice(), backgrounds: initialBackgrounds.slice(), rarityRates: {N:60,R:25,SR:12,SSR:3}, description: 'A starter pack with varied rarities for testing.', author: 'System', createdAt: nowISO(), updatedAt: nowISO(), category: 'Default'
  };
  return [set];
}

const Model = {
  loadOrInit(){
    const data = Storage.load();
    if(!data){ const sets = makeDefaultSets(); Storage.save(sets); return sets; }
    return data;
  },
  getAll(){ return this.loadOrInit(); },
  saveAll(list){ Storage.save(list); return list; },
  addSet(set){ const s = this.loadOrInit(); s.unshift(set); this.saveAll(s); return s; },
  updateSet(updated){ const s = this.loadOrInit().map(x=>x.id===updated.id? {...x, ...updated, updatedAt: nowISO() }: x); this.saveAll(s); return s; },
  removeSet(id){ const s = this.loadOrInit().filter(x=>x.id!==id); this.saveAll(s); return s; },
  getById(id){ return this.loadOrInit().find(x=>x.id===id); }
}

/* ---------- UI Helpers ---------- */
const qs = (sel, root=document)=>root.querySelector(sel);
const qsa = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

/* ---------- Main App Controller ---------- */
class App{
  constructor(){
    this.data = Model.getAll();
    this.current = null; // selected set
    this.dom = this.cacheDOM();
    this.canvas = new CanvasManager(qs('#stage'));
    this.setupUI();
    this.refreshList();
    this.tutorialShown = false;

    
  }

  cacheDOM(){
    return {
      listGrid: qs('#gacha-grid'),
      btnNew: qs('#btn-new'),
      btnTutorial: qs('#btn-tutorial'),
      editorView: qs('#editor-view'), listView: qs('#list-view'), playView: qs('#play-view'),

      // editor
      backToList: qs('#back-to-list'), saveGacha: qs('#save-gacha'), deleteGacha: qs('#delete-gacha'), editorTitle: qs('#editor-title'),
      form: qs('#gacha-form'), gTitle: qs('#g-title'), gCategory: qs('#g-category'), gAuthor: qs('#g-author'), gDesc: qs('#g-desc'), thumbPreview: qs('#thumb-preview'), thumbInput: qs('#thumb-input'), previewThumb: qs('#preview-thumb'), summary: qs('#summary'), metaList: qs('#meta-list'),
      rateN: qs('#rate-N'), rateR: qs('#rate-R'), rateSR: qs('#rate-SR'), rateSSR: qs('#rate-SSR'),

      itemsList: qs('#items-list'), itemUpload: qs('#item-upload'), addItemBtn: qs('#add-item'), addItemRarity: qs('#add-item-rarity'), addItemName: qs('#add-item-name'),
      bgUpload: qs('#bg-upload'), addBgBtn: qs('#add-bg'), backgroundsList: qs('#backgrounds-list'),

      // play view
      playTitle: qs('#play-title'), backToList2: qs('#back-to-list-2'), playBgList: qs('#play-bg-list'), btnSingle: qs('#btn-single'), btnTen: qs('#btn-ten'), btnAlignTen: qs('#align-ten'), saveComposite: qs('#save-composite'), rollLog: qs('#roll-log'), gachaInfo: qs('#gacha-info'), capsuleLayer: qs('#capsule-layer')
    };
  }

  setupUI(){
    // events
    this.dom.btnNew.addEventListener('click', ()=>this.openEditor());
    

    this.dom.backToList.addEventListener('click', ()=>this.showList());
    this.dom.backToList2.addEventListener('click', ()=>this.showList());
    this.dom.saveGacha.addEventListener('click', ()=>this.onSaveGacha());
    this.dom.deleteGacha.addEventListener('click', ()=>this.onDeleteGacha());

    this.dom.thumbPreview.addEventListener('click', () => this.dom.thumbInput.click());
    this.dom.thumbInput.addEventListener('change', async (e)=>{ if(e.target.files.length) this.onThumbUpload(e.target.files[0]) });

    this.dom.addItemBtn.addEventListener('click', ()=>this.handleAddItems());
    this.dom.itemUpload.addEventListener('change', (e)=>this.handleAddItems(e.target.files));
    this.dom.addBgBtn.addEventListener('click', ()=>this.handleAddBackgrounds());
    this.dom.bgUpload.addEventListener('change', (e)=>this.handleAddBackgrounds(e.target.files));

    this.dom.btnSingle.addEventListener('click', ()=>this.roll(1));
    this.dom.btnTen.addEventListener('click', ()=>this.roll(10));
    this.dom.btnAlignTen.addEventListener('click', ()=>this.alignTen());
    this.dom.saveComposite.addEventListener('click', ()=>this.saveCompositePNG());

    // search and category filter
    qs('#search').addEventListener('input', (e)=>this.refreshList(e.target.value));

    // canvas event passthrough to canvas manager
    this.dom.stageCanvas = this.canvas.canvas;

    // init tutorial if first time
    const firstSeen = localStorage.getItem('gachapon_tutorial_accepted');
    if(!firstSeen) setTimeout(()=>{ if(typeof this.showTutorial === 'function') this.showTutorial(); },300);
  }

  // optional tutorial hook (no-op default)
  showTutorial(){ /* no-op; can be overridden */ }

  

  /* ---------- List management ---------- */
  async refreshList(search=''){
    // Try to fetch from server first, fall back to local storage
  const base = apiBase();
    let list = null;
    try{
      const r = await fetch(base + '/api/gachas');
      if(r.ok) list = await r.json();
    }catch(err){ console.warn('Failed to fetch gachas from server', err); }

    if(list && Array.isArray(list)){
      // map server shape to client shape
      this.data = list.map(s => ({ id: String(s.id), title: s.title, thumbnailImg: s.thumbnail || s.thumbnailImg || '', author: s.author || s.author_id || '—', category: s.category || '', description: s.description || '', rarityRates: (s.rarity_rates ? (typeof s.rarity_rates === 'string' ? JSON.parse(s.rarity_rates) : s.rarity_rates) : {N:60,R:25,SR:12,SSR:3}) }));
    } else {
      this.data = Model.getAll();
    }

    this.dom.listGrid.innerHTML = '';
    const sel = qs('#category-filter'); const filterVal = sel ? sel.value : 'all';
    let cards = this.data.filter(s => (!search ? true : (s.title + ' ' + (s.author||'') + ' ' + (s.category||'')).toLowerCase().includes(search.toLowerCase())));
    if(filterVal && filterVal !== 'all') cards = cards.filter(c => (c.category || 'Uncategorized') === filterVal);
    this.dom.listGrid.innerHTML = cards.map(s=>this.cardHTML(s)).join('');

    qsa('.card').forEach(el=>{
      el.querySelector('.open').addEventListener('click', ()=>this.openPlayer(el.dataset.id));
      el.querySelector('.edit').addEventListener('click', ()=>this.openEditor(el.dataset.id));
      el.querySelector('.delete').addEventListener('click', async ()=>{
        if(!confirm('Delete this gacha?')) return;
        // if admin, call server delete; otherwise fallback to local
        if(document.body.classList.contains('is-admin')){
          try{
            const token = getToken();
            const headers = { 'Content-Type':'application/json' };
            if(token) headers['Authorization'] = 'Bearer ' + token;
            const del = await fetch((location.hostname==='localhost'?'http://localhost:4000':'') + '/api/gachas/' + el.dataset.id, { method: 'DELETE', headers });
            if(del.ok){ this.refreshList(); return; }
            alert('Failed to delete on server');
          }catch(err){ console.warn('delete error', err); alert('Delete failed'); }
        } else {
          Model.removeSet(el.dataset.id);
          this.refreshList();
        }
      });
    });

    // hide edit/delete for non-admins (simple client-side guard)
    if(!document.body.classList.contains('is-admin')){
      qsa('.card .edit').forEach(b=>b.classList.add('hidden'));
      qsa('.card .delete').forEach(b=>b.classList.add('hidden'));
    } else {
      qsa('.card .edit').forEach(b=>b.classList.remove('hidden'));
      qsa('.card .delete').forEach(b=>b.classList.remove('hidden'));
    }

    this.updateCategoryFilter();
  }

  cardHTML(s){
    return `
      <div class="card" data-id="${s.id}">
        <div class="thumb"><img src="${s.thumbnailImg}" style="width:100%;height:100%;object-fit:cover"/></div>
        <div class="meta">
          <h4 class="title">${s.title}</h4>
          <p class="author">${s.author || '—'} · ${s.category || 'Uncategorized'}</p>
          <p class="desc">${(s.description||'').slice(0,70)}</p>
        </div>
        <div class="actions">
          <button class="btn open" data-id="${s.id}">Play</button>
          <button class="btn edit" data-id="${s.id}">Edit</button>
          <button class="btn danger delete" data-id="${s.id}">Del</button>
        </div>
      </div>`;
  }

  updateCategoryFilter(){
    this.data = Model.getAll();
    const categories = [...new Set(this.data.map(s=>s.category||'Uncategorized'))];
    const sel = qs('#category-filter'); sel.innerHTML = `<option value="all">All categories</option>` + categories.map(c=>`<option>${c}</option>`).join('');
    sel.addEventListener('change', ()=>{ const v = sel.value; const search = qs('#search').value; this.refreshList(search); });
  }

  /* ---------- Editor ---------- */
  async openEditor(id=null){
    this.dom.editorTitle.textContent = id ? 'Edit Gacha' : 'Create Gacha';
    // if id provided, try fetch full detail from server (items etc.), else fall back to local model
    if(id){
  const base = apiBase();
      try{
        const r = await fetch(base + '/api/gachas/' + id);
        if(r.ok){ const serverG = await r.json(); this.current = this.mapServerGachaToClient(serverG); }
        else {
          const set = this.data.find(x=>String(x.id)===String(id)) || Model.getById(id);
          this.current = set ? JSON.parse(JSON.stringify(set)) : this.emptySet();
        }
      }catch(err){
        const set = this.data.find(x=>String(x.id)===String(id)) || Model.getById(id);
        this.current = set ? JSON.parse(JSON.stringify(set)) : this.emptySet();
      }
    } else {
      this.current = this.emptySet();
    }

    this.renderEditor();
    this.dom.listView.classList.add('hidden'); this.dom.playView.classList.add('hidden'); this.dom.editorView.classList.remove('hidden');
    if(this.current && this.current.id) this.dom.deleteGacha.classList.remove('hidden'); else this.dom.deleteGacha.classList.add('hidden');
  }

  emptySet(){ return { id: uid(), title:'', thumbnailImg: initialThumbnails[0], items:[], backgrounds:[], rarityRates: {N:60,R:25,SR:12,SSR:3}, description:'', author:'', createdAt: nowISO(), updatedAt: nowISO(), category: '' } }

  renderEditor(){
    const s = this.current;
    this.dom.gTitle.value = s.title || '';
    this.dom.gCategory.value = s.category || '';
    this.dom.gAuthor.value = s.author || '';
    this.dom.gDesc.value = s.description || '';
    this.dom.previewThumb.innerHTML = `<img src='${s.thumbnailImg}' style='width:100%;height:100%;object-fit:cover'/>`;
    this.dom.rateN.value = s.rarityRates.N; this.dom.rateR.value = s.rarityRates.R; this.dom.rateSR.value = s.rarityRates.SR; this.dom.rateSSR.value = s.rarityRates.SSR;

    this.renderItemsList(); this.renderBackgrounds(); this.renderSummary();
  }

  async onThumbUpload(file){ const url = await fileToDataURL(file); this.current.thumbnailImg = url; this.renderEditor(); }

  async handleAddItems(files=null){
    const putFiles = files ? Array.from(files) : (this.dom.itemUpload.files ? Array.from(this.dom.itemUpload.files) : []);
    if(!putFiles.length){ // if no files selected, create item from form
      const name = this.dom.addItemName.value.trim() || `Item ${this.current.items.length+1}`;
      const rar = this.dom.addItemRarity.value; const id = uid();
      const img = svgDataURL(itemSVG(rar, this.current.items.length));
      this.current.items.push({ id, name, rarity: rar, imgSrc: img }); this.renderItemsList(); return;
    }
    for(const f of putFiles){
      const src = await fileToDataURL(f); const rar = this.dom.addItemRarity.value || 'N'; const name = this.dom.addItemName.value.trim() || f.name || 'Item';
      this.current.items.push({ id: uid(), name, rarity: rar, imgSrc: src });
    }
    this.dom.itemUpload.value = '';
    this.renderItemsList();
  }

  async handleAddBackgrounds(files=null){
    const putFiles = files ? Array.from(files) : (this.dom.bgUpload.files ? Array.from(this.dom.bgUpload.files) : []);
    if(!putFiles.length) return;
    for(const f of putFiles){ const src = await fileToDataURL(f); this.current.backgrounds.push({ id: uid(), imgSrc: src }); }
    this.dom.bgUpload.value = '';
    this.renderBackgrounds();
  }

  renderItemsList(){
    this.dom.itemsList.innerHTML = this.current.items.map(it => `
      <div class='thumbnail' data-id='${it.id}'>
        <img src='${it.imgSrc}' style='width:100%;height:100%;object-fit:cover'/>
        <small>${it.rarity}</small>
        <div style='position:absolute;top:6px;right:6px;display:flex;gap:6px'>
          <button class='btn small edit-item' data-id='${it.id}'>✎</button>
          <button class='btn small del-item' data-id='${it.id}'>✕</button>
        </div>
      </div>
    `).join('');

    qsa('.del-item', this.dom.itemsList).forEach(b=>b.addEventListener('click', e=>{ const id = e.currentTarget.dataset.id; this.current.items = this.current.items.filter(x=>x.id!==id); this.renderItemsList(); }));
    qsa('.edit-item', this.dom.itemsList).forEach(b=>b.addEventListener('click', e=>{ const id = e.currentTarget.dataset.id; const it = this.current.items.find(x=>x.id===id); const newName = prompt('Rename item', it.name); if(newName!==null){ it.name = newName; this.renderItemsList(); } }));
  }

  renderBackgrounds(){
    this.dom.backgroundsList.innerHTML = this.current.backgrounds.map(b=>`
      <div class='thumbnail' data-id='${b.id}'>
        <img src='${b.imgSrc}' style='width:100%;height:100%;object-fit:cover'/>
        <div style='position:absolute;top:6px;right:6px;display:flex;gap:6px'>
          <button class='btn small del-bg' data-id='${b.id}'>✕</button>
        </div>
      </div>
    `).join('');
    qsa('.del-bg', this.dom.backgroundsList).forEach(b=>b.addEventListener('click', e=>{ this.current.backgrounds = this.current.backgrounds.filter(x=>x.id!==e.currentTarget.dataset.id); this.renderBackgrounds(); }));
  }

  renderSummary(){
    this.dom.summary.innerHTML = `
      <div><strong>Items:</strong> ${this.current.items.length} (min 5 recommended)</div>
      <div><strong>Backgrounds:</strong> ${this.current.backgrounds.length} (min 5 recommended)</div>
      <div><strong>Rates:</strong> N ${this.current.rarityRates.N}% / R ${this.current.rarityRates.R}% / SR ${this.current.rarityRates.SR}% / SSR ${this.current.rarityRates.SSR}%</div>
    `;
    this.dom.metaList.innerHTML = `
      <div><strong>Created:</strong> ${this.current.createdAt || '—'}</div>
      <div><strong>Updated:</strong> ${this.current.updatedAt || '—'}</div>
      <div><strong>ID:</strong> ${this.current.id}</div>
    `;
  }

  // Map server gacha object to client-side format
  mapServerGachaToClient(s){
    if(!s) return this.emptySet();
    const rates = s.rarity_rates || s.rarityRates || {N:60,R:25,SR:12,SSR:3};
    // if rates stored as JSON string, parse
    const parsedRates = (typeof rates === 'string') ? (()=>{ try{return JSON.parse(rates);}catch(e){return {N:60,R:25,SR:12,SSR:3};}})() : rates;
    return {
      id: String(s.id),
      title: s.title || '',
      thumbnailImg: s.thumbnail || s.thumbnailImg || '',
      author: s.author || s.author_name || (s.author_id? String(s.author_id) : ''),
      category: s.category || s.category || '',
      description: s.description || '',
      rarityRates: { N: Number(parsedRates.N||0), R: Number(parsedRates.R||0), SR: Number(parsedRates.SR||0), SSR: Number(parsedRates.SSR||0) },
      items: Array.isArray(s.items) ? s.items.map(it => ({ id: it.id ? String(it.id) : uid(), name: it.name, rarity: it.rarity, imgSrc: it.img_src || it.imgSrc || it.img })) : [],
      backgrounds: Array.isArray(s.backgrounds) ? s.backgrounds.map(b => ({ id: b.id ? String(b.id) : uid(), imgSrc: b.img_src || b.imgSrc || b.img })) : [],
      createdAt: s.created_at || s.createdAt || s.createdAt,
      updatedAt: s.updated_at || s.updatedAt || s.updatedAt
    };
  }

  // small transient toast
  showToast(msg, type='info'){
    try{
      const t = document.createElement('div'); t.className = 'gach-toast gach-toast-' + type; t.textContent = msg; t.style.position='fixed'; t.style.right='16px'; t.style.bottom='24px'; t.style.padding='10px 14px'; t.style.background = (type==='error' ? '#b91c1c' : type==='warn' ? '#d97706' : '#064e3b'); t.style.color='white'; t.style.borderRadius='8px'; t.style.boxShadow='0 6px 18px rgba(2,6,23,0.4)'; t.style.zIndex = 9999; document.body.appendChild(t);
      setTimeout(()=>{ t.style.transition='opacity 300ms'; t.style.opacity = 0; setTimeout(()=>t.remove(), 350); }, 2800);
    }catch(e){ console.log('toast', msg); }
  }

  // clear per-field error displays
  clearFieldErrors(){
    const ids = ['err-title','err-category','err-author','err-description','err-items','err-backgrounds'];
    ids.forEach(id=>{ const el = document.getElementById(id); if(el) el.textContent = ''; });
  }

  // show field errors from express-validator style array
  showFieldErrors(errors){
    try{
      if(!errors || !Array.isArray(errors)) return;
      errors.forEach(e => {
        const param = e.param || e.field || '';
        const msg = e.msg || e.message || String(e);
        let id = null;
        if(param === 'title') id = 'err-title';
        else if(param === 'category') id = 'err-category';
        else if(param === 'author') id = 'err-author';
        else if(param === 'description') id = 'err-description';
        else if(param === 'items') id = 'err-items';
        else if(param === 'backgrounds') id = 'err-backgrounds';
        else if(param.startsWith('rarity_rates') || param.includes('rate')) id = 'err-description';
        if(id){ const el = document.getElementById(id); if(el) el.textContent = (el.textContent ? el.textContent + '; ' : '') + msg; }
      });
    }catch(e){ console.warn('showFieldErrors', e); }
  }

  validateSet(v){
    const total = Number(v.rarityRates.N)+Number(v.rarityRates.R)+Number(v.rarityRates.SR)+Number(v.rarityRates.SSR);
    if(this.current.items.length < 5) return {ok:false, msg:'Add at least 5 items'};
    if(this.current.backgrounds.length < 5) return {ok:false, msg:'Add at least 5 backgrounds'};
    if(total !== 100) return {ok:false, msg:'Rarity rates must total 100%'};
    if(!v.title) return {ok:false, msg:'Title required'};
    return {ok:true};
  }

  async onSaveGacha(){
    // clear previous field errors
    this.clearFieldErrors();

    // collect fields
    this.current.title = this.dom.gTitle.value.trim();
    this.current.category = this.dom.gCategory.value.trim();
    this.current.author = this.dom.gAuthor.value.trim();
    this.current.description = this.dom.gDesc.value.trim();
    this.current.rarityRates = { N: Number(this.dom.rateN.value), R: Number(this.dom.rateR.value), SR: Number(this.dom.rateSR.value), SSR: Number(this.dom.rateSSR.value) };
    // validate
    const v = this.validateSet(this.current);
    if(!v.ok){ alert(v.msg); return; }

  const saveBtn = this.dom.saveGacha; const origLabel = saveBtn.textContent;
  const spinner = document.getElementById('save-spinner');
  if(spinner){ spinner.classList.remove('hidden'); spinner.innerHTML = '<span class="spinner"></span>'; }
  saveBtn.disabled = true; saveBtn.textContent = 'Saving...';

    let savedOnServer = false;
    const existing = Model.getById(this.current.id);
  const base = apiBase();

    if(document.body.classList.contains('is-admin')){
      try{
        const payload = {
          title: this.current.title,
          description: this.current.description,
          category: this.current.category,
          thumbnail: this.current.thumbnailImg,
          rarity_rates: this.current.rarityRates,
          items: this.current.items.map(it => ({ name: it.name, rarity: it.rarity, img_src: it.imgSrc, weight: 1 })),
          backgrounds: this.current.backgrounds.map(b=>({ img_src: b.imgSrc }))
        };

        if(existing && existing.id && String(existing.id).match(/^\d+$/)){
          const r = await fetchWithAuth(base + '/api/gachas/' + existing.id, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          if(!r.ok){
            let errMsg = 'Update failed on server';
            try{
              const j = await r.json();
              if(j){
                if(j.error) errMsg = j.error;
                else if(Array.isArray(j.errors)){
                  errMsg = j.errors.map(e => (e.param ? `${e.param}: ${e.msg}` : e.msg)).join('; ');
                  this.showFieldErrors(j.errors);
                }
              }
            }catch(e){}
            this.showToast(errMsg, 'error');
            throw new Error(errMsg);
          }
          const fresh = await (await fetchWithAuth(base + '/api/gachas/' + existing.id)).json();
          this.current = this.mapServerGachaToClient(fresh);
          savedOnServer = true;
        } else {
          const r = await fetchWithAuth(base + '/api/gachas', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          if(!r.ok){
            let errMsg = 'Create failed on server';
            try{
              const j = await r.json();
              if(j){
                if(j.error) errMsg = j.error;
                else if(Array.isArray(j.errors)){
                  errMsg = j.errors.map(e => (e.param ? `${e.param}: ${e.msg}` : e.msg)).join('; ');
                  this.showFieldErrors(j.errors);
                }
              }
            }catch(e){}
            this.showToast(errMsg, 'error');
            throw new Error(errMsg);
          }
          const j = await r.json();
          const fresh = await (await fetchWithAuth(base + '/api/gachas/' + j.id)).json();
          this.current = this.mapServerGachaToClient(fresh);
          savedOnServer = true;
        }
      }catch(err){ console.warn('Server save failed, falling back to local storage', err); this.showToast(err.message || 'Server save failed', 'error'); }
    }

    // persist locally (canonicalize id->string)
    try{
      this.current.id = String(this.current.id || uid());
      if(existing){ Model.updateSet(this.current); } else { Model.addSet(this.current); }
      // also update in-memory list for immediate UI
      const idx = this.data.findIndex(x=>String(x.id) === String(this.current.id));
      const card = { id: String(this.current.id), title: this.current.title, thumbnailImg: this.current.thumbnailImg, author: this.current.author, category: this.current.category, description: this.current.description, rarityRates: this.current.rarityRates };
      if(idx >= 0) this.data[idx] = card; else this.data.unshift(card);
    }catch(e){ console.warn('local save failed', e); }

  if(spinner){ spinner.classList.add('hidden'); spinner.innerHTML = ''; }
  saveBtn.disabled = false; saveBtn.textContent = origLabel;

    if(savedOnServer){
      this.showToast('Saved to server', 'info');
      // remove ?create=1 if present
      try{ const url = new URL(location.href); url.searchParams.delete('create'); history.replaceState(null, '', url.pathname + url.search); }catch(e){}
    } else {
      this.showToast('Saved locally (offline)', 'warn');
    }

    this.showList();
    await this.refreshList();
  }

  onDeleteGacha(){ if(confirm('Delete this gacha permanently?')){ Model.removeSet(this.current.id); this.showList(); this.refreshList(); } }

  showList(){ this.dom.listView.classList.remove('hidden'); this.dom.playView.classList.add('hidden'); this.dom.editorView.classList.add('hidden'); }

  /* ---------- Player / Roll ---------- */
  async openPlayer(id){
    // try fetch full detail from server, fallback to local
  const base = apiBase();
    let s = null;
    try{
      const r = await fetch(base + '/api/gachas/' + id);
      if(r.ok) s = this.mapServerGachaToClient(await r.json());
    }catch(err){ console.warn('fetch detail failed', err); }
    if(!s) s = this.data.find(x=>String(x.id)===String(id)) || Model.getById(id);
    if(!s) return alert('Gacha not found');
    this.current = JSON.parse(JSON.stringify(s));
    this.canvas.reset();
    this.dom.playTitle.textContent = s.title;
    this.dom.gachaInfo.innerHTML = `
      <strong>${s.title}</strong><div class='author'>by ${s.author||'—'}</div>
      <div style='font-size:12px;margin-top:8px'>${s.description || 'No description'}</div>
      <div style='margin-top:6px;font-size:12px;color:var(--muted)'>Updated: ${s.updatedAt || s.createdAt}</div>`;

    this.dom.listView.classList.add('hidden'); this.dom.editorView.classList.add('hidden'); this.dom.playView.classList.remove('hidden');
    this.renderPlayBackgrounds();
    this.canvas.loadBackground(this.current.backgrounds[0] ? this.current.backgrounds[0].imgSrc : null);
  }

  renderPlayBackgrounds(){
    this.dom.playBgList.innerHTML = this.current.backgrounds.map(b=>`<button class='btn ghost bgbtn' data-id='${b.id}' data-src='${b.imgSrc}' style='padding:8px;margin-right:6px;display:inline-flex;align-items:center;border-radius:6px;min-width:60px;height:44px'><img src='${b.imgSrc}' style='height:36px;object-fit:cover;border-radius:6px;margin-right:6px'/>BG</button>`).join('');
    qsa('.bgbtn', this.dom.playBgList).forEach(b=>b.addEventListener('click', e=>{ this.canvas.fadeToBackground(e.currentTarget.dataset.src); }));
  }

  roll(times=1){
    const results = [];
    const rates = this.current.rarityRates;
    // build pool by rarity
    const poolByRarity = { N: [], R: [], SR: [], SSR: [] };
    for(const it of this.current.items){ poolByRarity[it.rarity] = poolByRarity[it.rarity] || []; poolByRarity[it.rarity].push(it); }

    for(let i=0;i<times;i++){
      const r = pickWeighted(rates);
      let pool = poolByRarity[r] && poolByRarity[r].length ? poolByRarity[r] : [].concat(...Object.values(poolByRarity)).filter(Boolean);
      const item = pool[Math.floor(Math.random()*pool.length)];
      results.push(item);
    }

    // clear capsule layer
    this.dom.capsuleLayer.innerHTML = '';
    this.dom.rollLog.innerHTML = '';

    // animate sequential reveals
    const seq = async () => {
      for(let i=0;i<results.length;i++){
        await this.playCapsuleReveal(results[i], i, results.length);
      }
      // after all results are revealed, draw them to canvas
      results.forEach(r=>this.canvas.addItemFromResult(r));
      this.dom.rollLog.innerHTML = `Last roll: ${results.map(x=>x? `${x.name}(${x.rarity})` : '—').join(', ')}`;
    }
    seq();
  }

  playCapsuleReveal(item, index, total){
    return new Promise(async (res) => {
      const layer = this.dom.capsuleLayer;
      const capsule = document.createElement('div'); capsule.className = 'cap-anim'; capsule.style.zIndex = 80 + index;
      const box = document.createElement('div'); box.className = 'cap'; box.style.transition = 'transform 700ms ease, opacity 400ms ease'; box.style.transform = 'translateY(-20px)'; box.innerHTML = `<img src='${item.imgSrc}' style='max-width:80%;max-height:80%;object-fit:contain'/>`;
      capsule.appendChild(box); layer.appendChild(capsule);
      await wait(80 + index*220);
      box.style.transform = 'translateY(0) scale(1)'; box.style.opacity = 1;
      await wait(600);
      // pop effect
      box.style.transform = 'translateY(-18px) scale(0.85)'; box.style.opacity = 0; await wait(200);
      capsule.remove(); res();
    });
  }

  async saveCompositePNG(){
    // 2x scale render
    const url = this.canvas.toPNG(2);
    const a = document.createElement('a'); a.href = url; a.download = `${(this.current?.title||'gachapon')}-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove();
  }

  alignTen(){ this.canvas.arrangeTen(); }

  
}

/* ---------- Canvas Manager (drawing, drag, touch) ---------- */
class CanvasManager{
  constructor(canvas){ this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.items = []; this.backgroundSrc = null; this.bgImg = null; this.setupInteractions(); this.needsRedraw = true; this.resizeCanvas(); window.addEventListener('resize', ()=>this.resizeCanvas()); this.animate(); }

  reset(){ this.items = []; this.backgroundSrc = null; this.bgImg = null; }

  loadBackground(src){ if(!src) return; this.backgroundSrc = src; const img = new Image(); img.crossOrigin='anonymous'; img.src = src; img.onload = ()=>{ this.bgImg = img; this.needsRedraw = true; } }

  async fadeToBackground(src){ if(!src) return; const prevImg = this.bgImg; const next = new Image(); next.crossOrigin='anonymous'; next.src = src; await new Promise(res=>{ next.onload = res; next.onerror = res; });
    // crossfade animation: draw prev and next blending 0->1
    const duration = 480; const start = performance.now(); const step = (t)=>{ const p = clamp((t-start)/duration, 0,1); this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      if(prevImg) this.ctx.drawImage(prevImg,0,0,this.canvas.width,this.canvas.height);
      this.ctx.save(); this.ctx.globalAlpha = p; this.ctx.drawImage(next,0,0,this.canvas.width,this.canvas.height); this.ctx.restore();
      // redraw items over it
      this.items.forEach(it=>{ this.ctx.save(); ctx = this.ctx; ctx.translate(it.x + it.w/2, it.y + it.h/2); ctx.rotate(it.rotation); ctx.scale(it.scale, it.scale); ctx.drawImage(it.img, -it.w/2, -it.h/2, it.w, it.h); ctx.restore(); });
      if(p < 1) requestAnimationFrame(step); else { this.bgImg = next; this.needsRedraw = true; }
    };
    requestAnimationFrame(step);
  }

  addItemFromResult(res){ if(!res) return; // place randomly
    const img = new Image(); img.crossOrigin='anonymous'; img.src = res.imgSrc; img.onload = ()=>{
      const w = Math.min(140, img.width); const h = Math.min(140, img.height);
      const item = { id: uid(), name: res.name, rarity: res.rarity, img, x: Math.random()*(this.canvas.width - w), y: Math.random()*(this.canvas.height - h), w, h, scale: 1, rotation: 0, z: Date.now() };
      this.items.push(item); this.needsRedraw = true;
    }
  }

  draw(){
    const ctx = this.ctx; const c = this.canvas; const dpr = window.devicePixelRatio || 1; this.ctx.save();
    ctx.clearRect(0,0,c.width,c.height);
    // background
    if(this.bgImg){ ctx.drawImage(this.bgImg, 0, 0, c.width, c.height); } else { ctx.fillStyle = '#071021'; ctx.fillRect(0,0,c.width,c.height); }

    // items
    this.items.sort((a,b)=>a.z-b.z).forEach(it=>{
      ctx.save(); ctx.translate(it.x + it.w/2, it.y + it.h/2); ctx.rotate(it.rotation); ctx.scale(it.scale, it.scale); ctx.drawImage(it.img, -it.w/2, -it.h/2, it.w, it.h); ctx.restore();
    });
    this.ctx.restore(); this.needsRedraw=false;
  }

  animate(){ const loop = ()=>{ if(this.needsRedraw) this.draw(); requestAnimationFrame(loop); }; loop(); }

  /* pointer interactions (drag / zoom) */
  setupInteractions(){
    this.canvas.addEventListener('mousedown', this.pointerDown.bind(this));
    window.addEventListener('mousemove', this.pointerMove.bind(this));
    window.addEventListener('mouseup', this.pointerUp.bind(this));
    // touch
    this.canvas.addEventListener('touchstart', this.touchStart.bind(this), {passive:false});
    this.canvas.addEventListener('touchmove', this.touchMove.bind(this), {passive:false});
    this.canvas.addEventListener('touchend', this.touchEnd.bind(this));
  }

  pickItemAt(x,y){ for(let i=this.items.length-1;i>=0;i--){ const it = this.items[i]; if(x>=it.x && y>=it.y && x <= it.x+it.w && y <= it.y+it.h) return it; } return null; }

  pointerDown(e){ const rect = this.canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const hit = this.pickItemAt(x,y); if(hit){ this.dragging = { item:hit, ox: x - hit.x, oy: y - hit.y }; hit.z = Date.now(); this.needsRedraw = true; } }
  pointerMove(e){ if(!this.dragging) return; const rect = this.canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const it = this.dragging.item; it.x = clamp(x - this.dragging.ox, 0, this.canvas.width - it.w); it.y = clamp(y - this.dragging.oy, 0, this.canvas.height - it.h); this.needsRedraw = true; }
  pointerUp(e){ if(this.dragging){ this.dragging = null; } }

  /* touch gestures */
  touchStart(e){ if(e.touches.length===1){ const t = e.touches[0]; const r = this.canvas.getBoundingClientRect(); const x = t.clientX - r.left; const y = t.clientY - r.top; const hit = this.pickItemAt(x,y); if(hit){ this.dragging = { item:hit, ox: x - hit.x, oy: y - hit.y }; hit.z = Date.now(); this.needsRedraw = true; } }
    else if(e.touches.length===2){ e.preventDefault(); // pinch zoom
      const r = this.canvas.getBoundingClientRect(); const t1 = e.touches[0], t2 = e.touches[1]; this.pinch = { center: { x: (t1.clientX + t2.clientX)/2 - r.left, y: (t1.clientY + t2.clientY)/2 - r.top }, dist: distance(t1, t2), item: this.pickItemAt((t1.clientX + t2.clientX)/2 - r.left, (t1.clientY + t2.clientY)/2 - r.top) };
    }
  }

  touchMove(e){ if(this.dragging && e.touches.length===1){ e.preventDefault(); const r = this.canvas.getBoundingClientRect(); const t = e.touches[0]; const x = t.clientX - r.left; const y = t.clientY - r.top; const it = this.dragging.item; it.x = clamp(x - this.dragging.ox, 0, this.canvas.width - it.w); it.y = clamp(y - this.dragging.oy, 0, this.canvas.height - it.h); this.needsRedraw = true; }
    else if(this.pinch && e.touches.length===2){ e.preventDefault(); const t1 = e.touches[0], t2 = e.touches[1]; const newDist = distance(t1,t2); const scale = newDist/this.pinch.dist; const it = this.pinch.item; if(it){ it.scale = clamp(it.scale * scale, 0.3, 3); this.pinch.dist = newDist; this.needsRedraw = true; } }
  }

  touchEnd(e){ if(this.dragging) this.dragging=null; if(this.pinch) this.pinch=null; }

  toPNG(scale=1){ const w = this.canvas.width*scale, h = this.canvas.height*scale; const off = document.createElement('canvas'); off.width = w; off.height = h; const ctx = off.getContext('2d'); // draw background
    if(this.bgImg) ctx.drawImage(this.bgImg, 0, 0, w, h); else { ctx.fillStyle = '#071021'; ctx.fillRect(0,0,w,h); }
    // draw items scaled
    this.items.forEach(it => { const x = it.x*scale, y = it.y*scale, iw = it.w*scale*it.scale, ih = it.h*scale*it.scale; ctx.save(); ctx.translate(x+iw/2, y+ih/2); ctx.rotate(it.rotation); ctx.drawImage(it.img, -iw/2, -ih/2, iw, ih); ctx.restore(); });
    return off.toDataURL('image/png'); }

  arrangeTen(){ // arrange items horizontally when >=10
    if(this.items.length < 10) return; const gap = 12; const itemW = Math.min(140, this.canvas.width/(10) - gap);
    for(let i=0;i<10;i++){ const it = this.items[this.items.length - 10 + i]; it.scale = 1; it.w = itemW; it.h = itemW; it.x = i*(itemW+gap) + gap; it.y = this.canvas.height/2 - itemW/2; }
    this.needsRedraw = true; }

  resizeCanvas(){
    const rect = this.canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; const w = Math.max(400, Math.floor(rect.width)); const h = Math.max(200, Math.floor(rect.height||300));
    this.canvas.width = Math.floor(w * dpr); this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px'; this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.needsRedraw = true;
  }
}

/* ---------- Small helpers ---------- */
function wait(ms){ return new Promise(res=>setTimeout(res, ms)); }
function distance(a,b){ const dx = a.clientX-b.clientX, dy = a.clientY-b.clientY; return Math.sqrt(dx*dx+dy*dy); }

/* ---------- Initialize app ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{ await initAuthUI(); attachAuthButtons(); window.app = new App();
  // If requested via ?create=1 and user is admin, open editor immediately
  try{
    const params = new URLSearchParams(location.search);
    if(params.get('create') === '1'){
      if(document.body.classList.contains('is-admin')){
        // open new editor
        window.app.openEditor();
      } else {
        // not admin - redirect to login
        location.href = '/login.html';
      }
    }
  }catch(e){ console.warn('create param handling failed', e); }
});
