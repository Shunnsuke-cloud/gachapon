// scripts/seed-admin.js
// Usage: NODE_ENV=development node scripts/seed-admin.js
require('dotenv').config();
const pool = require('../db');
const bcrypt = require('bcryptjs');

async function main(){
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASS || 'Admin123!';
  const conn = await pool.getConnection();
  try{
    const hash = await bcrypt.hash(adminPass, 12);
    const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if(rows.length){
      await conn.execute('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [hash, 'admin', rows[0].id]);
      console.log('Updated existing user to admin:', adminEmail);
    } else {
      const [r] = await conn.execute('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?,?)', [adminEmail, hash, 'Administrator', 'admin']);
      console.log('Created admin user id=', r.insertId, ' email=', adminEmail);
    }
  }catch(err){ console.error(err); process.exit(1); }
  finally{ conn.release(); process.exit(0); }
}

main();
