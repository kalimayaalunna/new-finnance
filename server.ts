import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Seed data
const initialData = {
  transactions: [
    {
      id: "trx-1",
      date: "2026-05-22",
      type: "OUT",
      category: "Operasional",
      description: "Biaya listrik mesin asah & poles workshop Kalimaya Alunna",
      linkedSku: "",
      linkedQty: 0,
      amount: 1200000
    },
    {
      id: "trx-2",
      date: "2026-05-21",
      type: "IN",
      category: "Penjualan Produk Jadi",
      description: "Penjualan 18 pcs Kotak Kayu Alunna Premium (Eceran)",
      linkedSku: "SKU-KK-003",
      linkedQty: 18,
      amount: 1350000
    },
    {
      id: "trx-3",
      date: "2026-05-20",
      type: "OUT",
      category: "Pembelian Kemasan",
      description: "Restock kotak kayu Alun-alun premium 20 buah",
      linkedSku: "SKU-KK-003",
      linkedQty: 20,
      amount: 500000
    },
    {
      id: "trx-4",
      date: "2026-05-19",
      type: "OUT",
      category: "Pembelian Bahan Baku",
      description: "Pembelian tambahan 60 gram Kalimaya Black Opal Rough",
      linkedSku: "SKU-K0-001",
      linkedQty: 60,
      amount: 5100000
    },
    {
      id: "trx-5",
      date: "2026-05-18",
      type: "IN",
      category: "Penjualan Produk Jadi",
      description: "Penjualan 20 pcs Kalimaya Crystal Oval Bead mewah",
      linkedSku: "SKU-C0-002",
      linkedQty: 20,
      amount: 9000000
    }
  ],
  skus: [
    {
      skuCode: "SKU-K0-001",
      name: "Kalimaya Black Opal Rough",
      category: "Bahan Baku",
      quantity: 119,
      unit: "gram",
      costPrice: 85000,
      assetValue: 10115000,
      sellPrice: 0,
      minSafe: 30
    },
    {
      skuCode: "SKU-C0-002",
      name: "Kalimaya Crystal Oval Bead",
      category: "Produk Jadi",
      quantity: 44,
      unit: "pcs",
      costPrice: 150000,
      assetValue: 6600000,
      sellPrice: 450000,
      minSafe: 15
    },
    {
      skuCode: "SKU-KK-003",
      name: "Kotak Kayu Alunna Premium",
      category: "Kemasan",
      quantity: 80,
      unit: "pcs",
      costPrice: 25000,
      assetValue: 2000000,
      sellPrice: 75000,
      minSafe: 20
    },
    {
      skuCode: "SKU-M0-004",
      name: "Minyak Pengilap Batu Alunna",
      category: "Lainnya",
      quantity: 15,
      unit: "botol",
      costPrice: 12000,
      assetValue: 180000,
      sellPrice: 35000,
      minSafe: 10
    },
    {
      skuCode: "SKU-K0-005",
      name: "Kalimaya Black Opal Semi-Polished",
      category: "Bahan Baku",
      quantity: 50,
      unit: "gram",
      costPrice: 70000,
      assetValue: 3500000,
      sellPrice: 120000,
      minSafe: 15
    }
  ],
  reports: [
    {
      id: "rep-1",
      title: "Analisis Performa Awal Kalimaya Alunna",
      date: "22 Mei 2026",
      focusText: "Ringkasan Integrasi Umum",
      content: `### 📈 Analisis Performa Awal Kalimaya Alunna
**PT. KALIMAYA ALUNNA INDONESIA** • Terbit: 22 Mei 2026

#### 🌟 Laporan Analisis Kalimaya Alunna (Simulasi)
Selamat datang di Sistem Pelaporan Otomatis Kalimaya Alunna. Ini adalah draf laporan analisis performa logistik dan keuangan awal Anda.

#### 📊 Rangkuman Keuangan
* **Total Pemasukan:** Rp 10.350.000
* **Total Pengeluaran:** Rp 6.800.000
* **Laba Bersih:** Rp 3.550.000
* **Rasio Laba-Aktivitas:** Sehat (~34.3% margin)

#### 📦 Status Stockis & Gudang
* **Black Opal Rough** terpenuhi dengan kapasitas tinggi (119 gram), mendukung kestabilan asah hingga beberapa bulan ke depan.
* **Minyak Pengilap Batu Alunna** mendekati batas stok minimum (tersisa 15 botol dari batas aman 10 botol). Perlu dipantau untuk pengadaan berikutnya demi kelancaran logistik akhir.

*Laporan ini dihasilkan secara otomatis oleh asisten keuangan terintegrasi Kalimaya Alunna.*`
    }
  ]
};

// Ensure database file exists
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
      return initialData;
    }
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database:", error);
    return initialData;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Initialize Gemini Client server-side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API Routes
app.get('/api/data', (_req, res) => {
  const data = readDb();
  res.json(data);
});

app.post('/api/transactions', (req, res) => {
  const { date, type, category, description, linkedSku, linkedQty, amount } = req.body;
  const db = readDb();

  const newTrx = {
    id: 'trx-' + Date.now(),
    date: date || new Date().toISOString().split('T')[0],
    type,
    category,
    description,
    linkedSku: linkedSku || "",
    linkedQty: Number(linkedQty) || 0,
    amount: Number(amount) || 0
  };

  db.transactions.unshift(newTrx);

  // Auto update SKU quantity if linked
  if (linkedSku && Number(linkedQty) > 0) {
    const sku = db.skus.find((s: any) => s.skuCode === linkedSku);
    if (sku) {
      if (type === 'IN') {
        // Cash In flow typically means selling finished product, reducing warehouse catalog
        sku.quantity = Math.max(0, sku.quantity - Number(linkedQty));
      } else if (type === 'OUT') {
        // Cash Out flow typically means purchasing components/packaging, increasing warehouse catalog
        sku.quantity = sku.quantity + Number(linkedQty);
      }
      sku.assetValue = sku.quantity * sku.costPrice;
    }
  }

  writeDb(db);
  res.json(db);
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.transactions = db.transactions.filter((t: any) => t.id !== id);
  writeDb(db);
  res.json(db);
});

app.post('/api/skus', (req, res) => {
  const { skuCode, name, category, quantity, unit, costPrice, sellPrice, minSafe } = req.body;
  const db = readDb();

  const exists = db.skus.find((s: any) => s.skuCode.toUpperCase() === skuCode.toUpperCase());
  if (exists) {
    return res.status(400).json({ error: 'SKU Code already exists' });
  }

  const qtyVal = Number(quantity) || 0;
  const costVal = Number(costPrice) || 0;

  const newSku = {
    skuCode: skuCode.toUpperCase(),
    name,
    category,
    quantity: qtyVal,
    unit: unit || 'pcs',
    costPrice: costVal,
    assetValue: qtyVal * costVal,
    sellPrice: Number(sellPrice) || 0,
    minSafe: Number(minSafe) || 0
  };

  db.skus.push(newSku);
  writeDb(db);
  res.json(db);
});

app.put('/api/skus/:skuCode', (req, res) => {
  const { skuCode } = req.params;
  const { quantity, costPrice, sellPrice, name, category, minSafe, unit } = req.body;
  const db = readDb();

  const sku = db.skus.find((s: any) => s.skuCode.toUpperCase() === skuCode.toUpperCase());
  if (!sku) {
    return res.status(404).json({ error: 'SKU not found' });
  }

  if (quantity !== undefined) sku.quantity = Number(quantity);
  if (costPrice !== undefined) sku.costPrice = Number(costPrice);
  if (sellPrice !== undefined) sku.sellPrice = Number(sellPrice);
  if (name !== undefined) sku.name = name;
  if (category !== undefined) sku.category = category;
  if (minSafe !== undefined) sku.minSafe = Number(minSafe);
  if (unit !== undefined) sku.unit = unit;

  sku.assetValue = sku.quantity * sku.costPrice;

  writeDb(db);
  res.json(db);
});

app.delete('/api/skus/:skuCode', (req, res) => {
  const { skuCode } = req.params;
  const db = readDb();
  db.skus = db.skus.filter((s: any) => s.skuCode.toUpperCase() !== skuCode.toUpperCase());
  writeDb(db);
  res.json(db);
});

app.post('/api/reports/generate', async (req, res) => {
  const { focus, focusText } = req.body;
  const db = readDb();

  const ledgerSummary = db.transactions.map((t: any) => 
    `- [${t.date}] ${t.type === 'IN' ? 'Uang Masuk' : 'Uang Keluar'} | ${t.category} | ${t.description} | Rp ${t.amount.toLocaleString('id-ID')}`
  ).join('\n');
  
  const stockSummary = db.skus.map((s: any) => 
    `- [${s.skuCode}] ${s.name} (${s.category}) | Stok: ${s.quantity} ${s.unit} | Biaya Rp ${s.costPrice.toLocaleString('id-ID')} | Nilai Aset: Rp ${s.assetValue.toLocaleString('id-ID')}`
  ).join('\n');

  const prompt = `Anda adalah asisten keuangan AI senior yang diintegrasikan secara khusus untuk mendampingi pemilik PT. KALIMAYA ALUNNA INDONESIA (Enterprise Edition).
Tugas Anda adalah menulis laporan analisis bisnis korporat yang profesional, ringkas, mendalam, dan bernilai tinggi berdasarkan data riil dari sistem kas ledger dan stockis gudang terlampir.

Fokus Analisis Laporan yang dipilih pengguna:
"${focusText}" (Kode Fokus: ${focus})

DATA RIIL LEDGER KAS TERBARU:
${ledgerSummary}

DATA RIIL STOCKIS GUDANG TERBARU:
${stockSummary}

PEDOMAN PENULISAN LAPORAN:
1. Tulis laporan sepenuhnya dalam Bahasa Indonesia yang formal namun taktis.
2. Gunakan format Markdown yang sangat elegan (bullet points, tabel kecil jika relevan, subheadings).
3. Berikan tajuk utama: "### Analisis Performa ... Kalimaya Alunna" dilanjutkan dengan "PT. KALIMAYA ALUNNA INDONESIA • TERBIT [TANGGAL HARI INI berdasarkan Tahun 2026]"
4. Bagian pertama: Rekomendasi/Rangkuman Eksekutif Keuangan & Logistik secara sinergis.
5. Bagian kedua: Analisis mendalam sesuai Fokus terpilih:
   - "general": Hubungan silang total kas vs total sediaan gudang.
   - "finance": Analisis detail efisiensi arus kas, margin laba kotor, dan ketersediaan modal.
   - "warehouse": Analisis sediaan mana yang harus diproduksi/restock, potensi overstock, reorder point sediaan kritis.
   - "cross": Identifikasi risiko atau selisih potensial antara kas keluar untuk sediaan vs kuitansi pergudangan.
6. Bagian ketiga: Status Stockis & Gudang (Analisis sediaan kritis, misalnya Minyak Pengilap tersisa sedikit, dll.).
7. Rekomendasi Taktis & Langkah Selanjutnya yang konkret dan realistis.

Silakan hasilkan laporannya secara profesional dalam Markdown murni. Jangan menambahkan kata pembuka sandi atau penutup (seperti "Berikut adalah laporan..."). Langsung keluarkan judul laporannya sebagai judul Markdown tingkat 3 (###).`;

  try {
    let reportText = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      reportText = response.text || "Gagal menghasilkan analisis laporan.";
    } else {
      // Fallback
      reportText = `### 📊 Analisis Performa ${focusText} (Simulasi Internal)
**PT. KALIMAYA ALUNNA INDONESIA** • Terbit: 31 Mei 2026 (Simulasi)

*Arus data terintegrasi berhasil ditarik otomatis dari sistem ledger dan database sediaan JSON.*

#### 📈 Rangkuman Keuangan Utama
- **Total Pemasukan:** Rp 10.350.000
- **Total Pengeluaran:** Rp 6.800.000
- **Saldo Laba Bersih:** Rp 3.550.000 (Rasio Surplus Operasional: 34.30%)
- **Estimasi Nilai Barang Gudang:** Rp 22.395.000

#### 📦 Analisis Sinergi Gudang & Keuangan
- Pengeluaran terbesar tercatat untuk **Pembelian Bahan Baku** (SKU-K0-001) senilai Rp 5.100.000 (tambahan persediaan Rough Opal sebanyak 60 gram). Logistik ini menopang ketahanan bahan baku hingga 397% di atas ambang batas aman.
- Penjualan **Kalimaya Crystal Oval Bead** senilai Rp 9.000.000 (20 pcs) merupakan pendorong likuiditas utama kas perusahaan selama siklus ini berjalan.

#### ⚠️ Peringatan Kritis Logistik
- **Minyak Pengilap Batu Alunna** (SKU-M0-004) saat ini bersisa 15 botol. Dengan ambang batas aman di angka 10 botol (150% tingkat keamanan), disarankan mengalokasikan anggaran kas sisa sebesar Rp 180.000 untuk pengadaan 15 botol baru mumpung modal kerja sedang surplus.

*Laporan logistik dan keuangan ini disinkronisasikan otomatis oleh sistem kecerdasan terintegrasi Kalimaya Alunna.*`;
    }

    const newReport = {
      id: "rep-" + Date.now(),
      title: `Analisis Performa ${focusText}`,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      focusText: focusText,
      content: reportText
    };

    db.reports.unshift(newReport);
    writeDb(db);

    res.json(newReport);
  } catch (error: any) {
    console.error("Gemini reporting failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate report" });
  }
});

app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.reports = db.reports.filter((r: any) => r.id !== id);
  writeDb(db);
  res.json(db);
});

// Configure Vite integration
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Production static server
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PT. Kalimaya Alunna server listening on port ${PORT}`);
});
