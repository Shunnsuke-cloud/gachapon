require('dotenv').config();
const BASE = process.env.API_BASE || 'http://localhost:4000';
(async ()=>{
  try{
    const res = await fetch(BASE + '/api/gachas');
    console.log('status', res.status);
    const t = await res.text();
    console.log('body', t);
  }catch(e){ console.error('err', e); }
})();
