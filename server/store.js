const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const DEFAULTS = {
  companyName: 'PT Personel Alih Daya Tbk',
  tagline: 'Dasbor Korporasi PERSADA',
  accent: '#C9A15A',
  heroAssetId: null,
  heroType: 'none',
  liveLabel: 'Siaran Langsung',
  eventTitle: 'Townhall Meeting Kuartal III 2026',
  eventDesc: 'Pemaparan pencapaian strategis kuartal ketiga, evaluasi kinerja operasional, dan peta jalan ekspansi bisnis menuju akhir tahun.',
  eventDate: 'Jumat, 25 September 2026',
  eventTime: '09.00 WIB',
  eventLocation: 'Auditorium Lt. 12, Kantor Pusat',
  employeeCount: '7.850',
  employeeCaption: '+120 dari kuartal lalu',
  clientCount: '342',
  jobs: [
    { title: '[Nama Posisi]', dept: '[Departemen]', location: '[Lokasi]', status: 'Baru' },
    { title: '[Nama Posisi]', dept: '[Departemen]', location: '[Lokasi]', status: 'Dibuka' },
    { title: '[Nama Posisi]', dept: '[Departemen]', location: '[Lokasi]', status: 'Dibuka' },
    { title: '[Nama Posisi]', dept: '[Departemen]', location: '[Lokasi]', status: 'Dibuka' }
  ],
  jobsContact: 'Info & lamaran: [tautan/kontak karier]',
  runningText: 'Selamat datang di Dasbor Signage PERSADA — [isi teks berjalan lewat CMS]',
  kpis: [
    { label: 'Target Pendapatan', value: 'Rp 1,25', suffix: 'T', highlight: false, ytdPercent: '92', fyPercent: '68' },
    { label: 'Target Margin Bersih', value: '11,8', suffix: '%', highlight: true, ytdPercent: '101', fyPercent: '74' },
    { label: 'Rekor Keselamatan', value: '412', suffix: 'Hari', highlight: false, ytdPercent: '', fyPercent: '' },
    { label: 'Retensi Klien', value: '98,5', suffix: '%', highlight: false, ytdPercent: '99', fyPercent: '72' },
    { label: 'Kepuasan Klien', value: '4,85', suffix: '/ 5,0', highlight: false, ytdPercent: '97', fyPercent: '71' }
  ]
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readConfig() {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch (e) {
    console.error('Gagal membaca config.json, memakai default:', e.message);
    return { ...DEFAULTS };
  }
}

function writeConfig(config) {
  ensureDataDir();
  const merged = { ...DEFAULTS, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

// ---- SSE broadcaster ----
const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcast(config) {
  const payload = `data: ${JSON.stringify(config)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

module.exports = {
  DEFAULTS,
  readConfig,
  writeConfig,
  addClient,
  removeClient,
  broadcast
};
