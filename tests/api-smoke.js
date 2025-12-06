/* Simple smoke test for Gachapon API
   Usage: node tests/api-smoke.js
   Requires .env at repo root with ADMIN_EMAIL and ADMIN_PASS (or set env vars).
*/
require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const BASE = process.env.API_BASE || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_ || 'admin@example.com';
const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_PASS_ || 'adminpass';

async function ok(res){ if(!res.ok){ const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t}`); } return res; }

(async ()=>{
  console.log('Base:', BASE);
  try{
    // health
    const h = await fetch(BASE + '/');
    await ok(h);
    console.log('OK: GET /');

    // login
    const lr = await fetch(BASE + '/api/auth/login', { method: 'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }) });
    if(lr.status === 401) throw new Error('Login failed: invalid admin credentials. Run seed-admin or set ADMIN_EMAIL/ADMIN_PASS in .env');
    await ok(lr);
    const lj = await lr.json();
    const token = lj.accessToken;
    console.log('OK: POST /api/auth/login');

    // me
    const me = await (await ok(await fetch(BASE + '/api/auth/me', { headers:{ Authorization: 'Bearer ' + token } }))).json();
    console.log('OK: GET /api/auth/me ->', me.email, me.role);

    // create gacha
    const payload = { title:'smoke test ' + Date.now(), description:'smoke', category:'test', thumbnail:'', rarity_rates:{N:60,R:25,SR:12,SSR:3}, items:[{name:'i1',rarity:'N',img_src:''},{name:'i2',rarity:'R',img_src:''},{name:'i3',rarity:'SR',img_src:''},{name:'i4',rarity:'SSR',img_src:''},{name:'i5',rarity:'N',img_src:''}], backgrounds:[] };
    const cr = await (await ok(await fetch(BASE + '/api/gachas', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) }))).json();
    console.log('OK: POST /api/gachas -> id', cr.id);

    // get list
    const list = await (await ok(await fetch(BASE + '/api/gachas'))).json();
    console.log('OK: GET /api/gachas -> count', list.length);

    // get detail
    const detail = await (await ok(await fetch(BASE + '/api/gachas/' + cr.id))).json();
    console.log('OK: GET /api/gachas/:id ->', detail.title);

    // delete
    await ok(await fetch(BASE + '/api/gachas/' + cr.id, { method:'DELETE', headers:{ Authorization: 'Bearer ' + token } }));
    console.log('OK: DELETE /api/gachas/:id');

    console.log('\nSMOKE TEST PASSED');
  }catch(err){
    console.error('\nSMOKE TEST FAILED:', err.message);
    process.exitCode = 2;
  }
})();
