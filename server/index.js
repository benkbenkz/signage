require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const store = require('./store');

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-ganti-ini';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Tidak terautentikasi' });
}

// ---------- Auth ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(String(password || ''), ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
});

// ---------- Config ----------
app.get('/api/config', (req, res) => {
  res.json(store.readConfig());
});

app.put('/api/config', requireAuth, (req, res) => {
  const updated = store.writeConfig(req.body || {});
  store.broadcast(updated);
  res.json(updated);
});

// Server-Sent Events for live updates on the display page
app.get('/api/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(store.readConfig())}\n\n`);
  store.addClient(res);
  req.on('close', () => store.removeClient(res));
});

// ---------- Upload ----------
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm'
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, crypto.randomUUID() + ext);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Tipe berkas tidak didukung'));
    }
    cb(null, true);
  }
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada berkas diunggah' });
    res.json({
      id: req.file.filename,
      contentType: req.file.mimetype,
      url: '/uploads/' + req.file.filename
    });
  });
});

// ---------- Static files ----------
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use('/', express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Signage server berjalan di http://localhost:${PORT}`);
  console.log(`CMS admin di http://localhost:${PORT}/admin`);
});
