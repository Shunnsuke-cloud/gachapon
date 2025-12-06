// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gachaRoutes = require('./routes/gachas');

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5500';
// allow comma-separated list of origins in CLIENT_ORIGIN
const CLIENT_ORIGINS = CLIENT_ORIGIN.split(',').map(s=>s.trim()).filter(Boolean);

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl, server-to-server)
    if(!origin) return callback(null, true);
    // exact match
    if(CLIENT_ORIGINS.includes(origin)) return callback(null, true);
    // if configured origin contains 'localhost' accept 127.0.0.1 variants and vice versa
    const normalized = origin.replace('http://','').replace('https://','');
    if(CLIENT_ORIGINS.some(o => o.includes('localhost')) && normalized.startsWith('127.0.0.1')) return callback(null, true);
    if(CLIENT_ORIGINS.some(o => o.includes('127.0.0.1')) && normalized.startsWith('localhost')) return callback(null, true);
    // otherwise reject
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.get('/', (req, res) => res.json({ ok: true, version: 'gachapon-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/gachas', gachaRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
