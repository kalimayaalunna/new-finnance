import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  BookOpen, 
  Package, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Layers, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  PlusCircle, 
  MinusCircle, 
  Calendar, 
  FileText, 
  Printer, 
  Loader2, 
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  CheckCircle2,
  Info
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  linkedSku: string;
  linkedQty: number;
  amount: number;
}

interface SkuItem {
  skuCode: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  assetValue: number;
  sellPrice: number;
  minSafe: number;
}

interface Report {
  id: string;
  title: string;
  date: string;
  focusText: string;
  content: string;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'analytics' | 'finance' | 'warehouse' | 'ai'>('analytics');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic WIB Clock
  const [currentTime, setCurrentTime] = useState('');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');

  // Modals & New entries state
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState<string>('rep-1');
  
  // Loading flags for actions
  const [isSubmittingTrx, setIsSubmittingTrx] = useState(false);
  const [isSubmittingSku, setIsSubmittingSku] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // New Transaction Form State
  const [newTrx, setNewTrx] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'IN' as 'IN' | 'OUT',
    category: 'Penjualan Produk Jadi',
    description: '',
    linkedSku: '',
    linkedQty: 1,
    amount: 0
  });

  // New SKU Form State
  const [newSku, setNewSku] = useState({
    skuCode: '',
    name: '',
    category: 'Bahan Baku',
    quantity: 0,
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    minSafe: 10
  });

  // AI Focus Selection
  const [selectedFocus, setSelectedFocus] = useState('general');
  const [focusText, setFocusText] = useState('Ringkasan Integrasi Umum');

  // Load backend data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSkus(data.skus || []);
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Setup clock interval
    const updateTime = () => {
      // Calculate WIB time (UTC+7)
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wib = new Date(utc + (3600000 * 7));
      
      const hours = String(wib.getHours()).padStart(2, '0');
      const minutes = String(wib.getMinutes()).padStart(2, '0');
      const seconds = String(wib.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}.${minutes}.${seconds} WIB`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync focus code to human text
  const selectFocusType = (focus: string, titleText: string) => {
    setSelectedFocus(focus);
    setFocusText(titleText);
  };

  // KPI Calculations
  const totalPemasukan = transactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoKasBersih = totalPemasukan - totalPengeluaran;

  const estimasiNilaiBarang = skus.reduce((sum, s) => sum + s.assetValue, 0);

  // Quick Action: Correct Stock level up/down
  const handleStockCorrection = async (skuCode: string, newQty: number) => {
    if (newQty < 0) return;
    try {
      // Optimistic update
      setSkus(prev => prev.map(s => s.skuCode === skuCode ? { ...s, quantity: newQty, assetValue: newQty * s.costPrice } : s));
      
      const res = await fetch(`/api/skus/${skuCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) {
        const data = await res.json();
        setSkus(data.skus);
      } else {
        fetchData(); // Rollback if error
      }
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  // Submit new transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrx(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrx)
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setSkus(data.skus);
        setIsTrxModalOpen(false);
        // Reset state
        setNewTrx({
          date: new Date().toISOString().split('T')[0],
          type: 'IN',
          category: 'Penjualan Produk Jadi',
          description: '',
          linkedSku: '',
          linkedQty: 1,
          amount: 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTrx(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if(!confirm("Hapus pencatatan transaksi ini dari ledger?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Register new SKU
  const handleAddSku = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSku(true);
    try {
      const res = await fetch('/api/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSku)
      });
      if (res.ok) {
        const data = await res.json();
        setSkus(data.skus);
        setIsSkuModalOpen(false);
        setNewSku({
          skuCode: '',
          name: '',
          category: 'Bahan Baku',
          quantity: 0,
          unit: 'pcs',
          costPrice: 0,
          sellPrice: 0,
          minSafe: 10
        });
      } else {
        const errData = await res.json();
        alert(errData.error || "Gagal meregistrasikan SKU baru.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSku(false);
    }
  };

  // Delete SKU/Stock item
  const handleDeleteSku = async (skuCode: string) => {
    if(!confirm(`Hapus sediaan ${skuCode} dari stockis gudang?`)) return;
    try {
      const res = await fetch(`/api/skus/${skuCode}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setSkus(data.skus);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger automated AI evaluation
  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus: selectedFocus,
          focusText: focusText
        })
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports(prev => [newReport, ...prev]);
        setActiveReportId(newReport.id);
        // Autoselected tab/scroll or alert
      }
    } catch (e) {
      console.error(e);
      alert("Gagal merancang laporan otomatis. Periksa jaringan Anda.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Delete a generated report
  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Hapus rekaman laporan analisis ini?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        if (activeReportId === id && data.reports.length > 0) {
          setActiveReportId(data.reports[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Custom PDF/Print view
  const handlePrint = () => {
    const reportContent = reports.find(r => r.id === activeReportId)?.content || '';
    const reportTitle = reports.find(r => r.id === activeReportId)?.title || '';
    const reportDate = reports.find(r => r.id === activeReportId)?.date || '';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
              h3 { font-size: 24px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 8px; }
              h4 { font-size: 18px; color: #1e293b; margin-top: 24px; margin-bottom: 8px; font-weight: bold; }
              ul { margin-top: 8px; margin-bottom: 16px; padding-left: 20px; }
              li { margin-bottom: 6px; }
              p { margin-bottom: 16px; }
              .meta { font-size: 12px; color: #64748b; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
              .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <h3>${reportTitle}</h3>
            <div class="meta">PT. KALIMAYA ALUNNA INDONESIA &bull; TERBIT ${reportDate}</div>
            <div>
              ${reportContent
                .replace(/^### (.*$)/gim, '<h4>$1</h4>')
                .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
                .replace(/^\* (.*$)/gim, '<li>$1</li>')
                .replace(/^- (.*$)/gim, '<li>$1</li>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .split('\n').map(line => line.trim().startsWith('<li>') ? line : `<p>${line}</p>`).join('')
              }
            </div>
            <div class="footer">&copy; 2026 PT. Kalimaya Alunna Indonesia. All rights reserved. Generated dynamically via Gemini 3.5 Flash.</div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Simple custom Markdown formatter helper
  const renderMarkdown = (md: string) => {
    return md.split('\n').map((line, i) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-3 first:mt-0 tracking-tight border-b border-slate-100 pb-2">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h4 key={i} className="text-lg font-semibold text-slate-800 mt-5 mb-2">{trimmed.slice(5)}</h4>;
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        // Parse bold elements in bullet points
        const textStr = trimmed.slice(2);
        return (
          <li key={i} className="ml-5 list-disc text-slate-600 mb-1.5 leading-relaxed">
            {parseBoldText(textStr)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={i} className="h-3" />;
      }
      
      return <p key={i} className="text-slate-600 mb-2 leading-relaxed">{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900">{part}</strong>;
      }
      return part;
    });
  };

  // Filter processes for SKUs
  const filteredSkus = skus.filter(sku => {
    const matchesSearch = sku.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sku.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua Kategori' || sku.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate Finance Analytics for category chart
  // Group profits by categories
  // "Penjualan Produk Jadi", "Pembelian Bahan Baku", "Pembelian Kemasan", "Operasional"
  const getCategoryProfit = (cat: string) => {
    const trxs = transactions.filter(t => t.category === cat);
    const positive = trxs.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const negative = trxs.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return positive - negative;
  };

  const categoriesChartData = [
    { name: 'Penjualan Produk Jadi', value: getCategoryProfit('Penjualan Produk Jadi') },
    { name: 'Pembelian Bahan Baku', value: getCategoryProfit('Pembelian Bahan Baku') },
    { name: 'Pembelian Kemasan', value: getCategoryProfit('Pembelian Kemasan') },
    { name: 'Operasional', value: getCategoryProfit('Operasional') },
  ];

  // Calculate Warehouse Asset Values for Donut chart
  const getSkuCategoryValue = (cat: string) => {
    return skus.filter(s => s.category === cat).reduce((sum, s) => sum + s.assetValue, 0);
  };

  const stockCategoryValues = {
    'Bahan Baku': getSkuCategoryValue('Bahan Baku'),
    'Produk Jadi': getSkuCategoryValue('Produk Jadi'),
    'Kemasan': getSkuCategoryValue('Kemasan'),
    'Lainnya': getSkuCategoryValue('Lainnya')
  };

  const totalStockAssets = Object.values(stockCategoryValues).reduce((a, b) => a + b, 0);

  // Format currency helpers
  const formatRp = (num: number) => {
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" id="loading-view">
        <Loader2 className="w-12 h-12 text-[#0f172a] animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat Ledger & Inventori Korporat...</p>
        <p className="text-slate-400 text-xs mt-1">PT. Kalimaya Alunna Indonesia</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased" id="main-panel">
      
      {/* ENTERPRISE TOP HEADER BAR */}
      <header className="bg-[#0e172a] text-white py-4 px-6 shadow-md flex flex-wrap justify-between items-center transition-all" id="app-header">
        <div className="flex items-center space-x-3">
          <div className="bg-[#f59e0b] text-[#0e172a] px-3 py-1.5 rounded-lg font-black tracking-tighter text-xl shadow-inner flex items-center justify-center" id="logo-ka">
            KA
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase">
                ENTERPRISE EDITION
              </span>
            </div>
            <h1 className="text-lg font-extrabold tracking-tight uppercase mt-0.5" id="company-title">
              PT. KALIMAYA ALUNNA INDONESIA
            </h1>
          </div>
        </div>

        {/* Dynamic WIB Live Clock indicator */}
        <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/80 rounded-lg px-4 py-1.5 text-sm my-1 md:my-0 shadow-sm" id="clock-container">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-mono tracking-wider text-amber-300 font-semibold">{currentTime || '22.03.27 WIB'}</span>
        </div>
      </header>
      
      {/* EMAIL / CREDENTIALS SUBSECTION */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap justify-between items-center text-xs text-slate-500 shadow-sm" id="credentials-banner">
        <div className="flex items-center space-x-1">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>Email Korporat:</span>
          <span className="font-semibold text-slate-700 select-all">kalimayaalunnaindonesia@gmail.com</span>
        </div>
        <div className="text-slate-400 flex items-center space-x-2">
          <span>Stabilitas Sistem:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            AKTIF
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS RAIL */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex space-x-2 overflow-x-auto scrollbar-none sticky top-0 z-10" id="tabs-navigation">
        <button
          id="btn-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center py-2 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#0f172a] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <BarChart2 className="w-4 h-4 mr-2" />
          Dasbor Analitik
        </button>
        <button
          id="btn-tab-finance"
          onClick={() => setActiveTab('finance')}
          className={`flex items-center py-2 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'finance'
              ? 'bg-[#0f172a] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Buku Kas (Finance)
        </button>
        <button
          id="btn-tab-warehouse"
          onClick={() => setActiveTab('warehouse')}
          className={`flex items-center py-2 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'warehouse'
              ? 'bg-[#0f172a] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Stockis Gudang
        </button>
        <button
          id="btn-tab-ai"
          onClick={() => setActiveTab('ai')}
          className={`flex items-center py-2 px-4 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-[#0f172a] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Automasi AI Laporan
        </button>
      </div>

      {/* CORE WORKSPACE VIEWPORT */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full transition-all" id="viewport-workspace">
        
        {/* VIEW 1: ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-6" id="view-dashboard">
            
            {/* ROW 1: 4 KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-kpi-row">
              {/* CARD 1: TOTAL PEMASUKAN */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start" id="kpi-pemasukan">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    TOTAL PEMASUKAN
                  </span>
                  <div className="text-2xl font-black text-emerald-600 tracking-tight" id="kpi-pemasukan-val">
                    {formatRp(totalPemasukan)}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    ↗ Aliran Masuk
                  </span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500 border border-emerald-100 shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* CARD 2: TOTAL PENGELUARAN */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start" id="kpi-pengeluaran">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    TOTAL PENGELUARAN
                  </span>
                  <div className="text-2xl font-black text-rose-600 tracking-tight" id="kpi-pengeluaran-val">
                    {formatRp(totalPengeluaran)}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    ↘ Aliran Keluar
                  </span>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl text-rose-500 border border-rose-100 shadow-sm">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              {/* CARD 3: SALDO KAS BERSIH */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start" id="kpi-saldo-bersih">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    SALDO KAS BERSIH
                  </span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight" id="kpi-saldo-bersih-val">
                    {formatRp(saldoKasBersih)}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    $ Neraca Buku
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-slate-600 border border-slate-200/60 shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
              </div>

              {/* CARD 4: ESTIMASI NILAI BARANG */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-start" id="kpi-estimasi-barang">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    ESTIMASI NILAI BARANG
                  </span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight" id="kpi-estimasi-val">
                    {formatRp(estimasiNilaiBarang)}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    🗳️ {skus.length} Jenis Produk
                  </span>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600 border border-orange-100 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* ROW 2: BAR CHART (FINANCING BY CATEGORIES) + DONUT CHART (WAREHOUSE PROPORTION) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-charts-row">
              
              {/* Financial Performance Bar Chart (Colspan 7) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between" id="chart-performance">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Performa Keuangan Per Kategori</h2>
                  <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-tight">
                    Nilai bersih transaksi kas masuk/keluar terkelompok
                  </p>
                </div>

                {/* SVG Vector Bar Chart */}
                <div className="h-64 mt-6 relative flex flex-col justify-end" id="svg-bar-chart-container">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-300">
                    <div className="border-b border-dashed border-slate-100 w-full pt-1">16,500k</div>
                    <div className="border-b border-dashed border-slate-100 w-full pt-1">11,000k</div>
                    <div className="border-b border-dashed border-slate-100 w-full pt-1">5,500k</div>
                    <div className="border-b border-slate-200 w-full pt-1 z-10 text-slate-400 font-bold">0k</div>
                    <div className="border-b border-dashed border-slate-100 w-full pt-1">-5,500k</div>
                  </div>

                  {/* Render Columns */}
                  <div className="relative z-10 grid grid-cols-4 gap-4 h-full items-center pt-6 px-12">
                    {categoriesChartData.map((data, index) => {
                      const maxAbs = 16500000; // max scale unit limit
                      const value = data.value;
                      const percentage = Math.min(100, (Math.abs(value) / maxAbs) * 50); // relative size to half chart height
                      
                      const isPositive = value >= 0;
                      const backgroundClass = isPositive ? 'bg-emerald-500' : 'bg-rose-500';
                      
                      return (
                        <div key={index} className="flex flex-col items-center h-full justify-center relative">
                          {/* Value bubble on hover */}
                          <div className="absolute -top-3 text-[10px] font-bold bg-[#0f172a] text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                            {formatRp(value)}
                          </div>
                          
                          <div className="w-full flex flex-col items-center h-full relative group">
                            {/* Positive element bar (upper half) */}
                            <div className="w-full absolute bottom-1/2 left-0 right-0 flex flex-col justify-end items-center" style={{ height: '50%' }}>
                              {isPositive && (
                                <div 
                                  className={`${backgroundClass} w-full rounded-t-lg shadow-sm transition-all duration-700 hover:brightness-105`} 
                                  style={{ height: `${percentage * 2}%` }}
                                ></div>
                              )}
                            </div>
                            
                            {/* Negative element bar (lower half) */}
                            <div className="w-full absolute top-1/2 left-0 right-0 flex flex-col justify-start items-center" style={{ height: '50%' }}>
                              {!isPositive && (
                                <div 
                                  className={`${backgroundClass} w-full rounded-b-lg shadow-sm transition-all duration-700 hover:brightness-105`} 
                                  style={{ height: `${percentage * 2}%` }}
                                ></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-Axis labels */}
                <div className="grid grid-cols-4 gap-4 px-12 pt-4 text-center border-t border-slate-100 text-[10px] font-mono text-slate-400">
                  <div>Penjualan Produk Jadi</div>
                  <div>Pembelian Bahan Baku</div>
                  <div>Pembelian Kemasan</div>
                  <div>Operasional</div>
                </div>
              </div>

              {/* Warehouse Assets Donut Chart (Colspan 5) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between" id="chart-donut-warehouse">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Proporsi Aset Stok Pergudangan</h2>
                  <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-tight">
                    Persentase total valuasi rupiah barang per tipe kategori
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center p-4 space-y-6 sm:space-y-0 sm:space-x-8" id="warehouse-donut-body">
                  
                  {/* SVG Donut Circle */}
                  <div className="relative w-40 h-40 flex items-center justify-center" id="donut-circle">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      {(() => {
                        let accumulatedPercent = 0;
                        const colors = {
                          'Bahan Baku': '#f97316', // Orange
                          'Produk Jadi': '#0f766e', // Teal-ish green
                          'Kemasan': '#2563eb', // Blue-ish
                          'Lainnya': '#64748b' // Slate gray
                        };

                        return Object.entries(stockCategoryValues).map(([cat, val], i) => {
                          const percent = totalStockAssets > 0 ? (val / totalStockAssets) * 100 : 0;
                          if (percent === 0) return null;
                          
                          const strokeDasharray = `${percent} ${100 - percent}`;
                          // Circumference is 2 * PI * R = 2 * 3.14159 * 40 = 251.3
                          const circumference = 251.2;
                          const dashOffset = circumference - (accumulatedPercent / 100) * circumference;
                          
                          accumulatedPercent += percent;
                          
                          return (
                            <circle
                              key={i}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={colors[cat as keyof typeof colors] || '#ccc'}
                              strokeWidth="12"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                              className="transition-all duration-1000"
                              style={{
                                strokeDasharray: `${(percent / 100) * circumference} ${circumference}`
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Simple Inner Text summary */}
                    <div className="absolute flex flex-col items-center text-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Val</span>
                      <span className="text-sm font-black text-slate-800 shrink-0">
                        {Math.round(totalStockAssets / 1000000)}M IDR
                      </span>
                    </div>
                  </div>

                  {/* Donut Legend Info */}
                  <div className="space-y-3 font-sans text-xs w-full sm:w-auto" id="donut-legend-info">
                    {/* Segment 1: Bahan Baku */}
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-orange-500 shrink-0"></div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Bahan Baku</span>
                        <span className="font-mono text-slate-400 text-[11px]">{formatRp(stockCategoryValues['Bahan Baku'])}</span>
                      </div>
                    </div>
                    {/* Segment 2: Produk Jadi */}
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-[#0f766e] shrink-0"></div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Produk Jadi</span>
                        <span className="font-mono text-slate-400 text-[11px]">{formatRp(stockCategoryValues['Produk Jadi'])}</span>
                      </div>
                    </div>
                    {/* Segment 3: Kemasan */}
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-blue-600 shrink-0"></div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Kemasan</span>
                        <span className="font-mono text-slate-400 text-[11px]">{formatRp(stockCategoryValues['Kemasan'])}</span>
                      </div>
                    </div>
                    {/* Segment 4: Lainnya */}
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-slate-500 shrink-0"></div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Lainnya</span>
                        <span className="font-mono text-slate-400 text-[11px]">{formatRp(stockCategoryValues['Lainnya'])}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: WATCHLIST TINGKAT KEAMANAN PASOKAN + AKTIVITAS ALIRAN KAS TERKINI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-tables-row">
              
              {/* Watchlist Pasokan */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col" id="watchlist-pasokan-container">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900">Watchlist Tingkat Keamanan Pasokan</h2>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        <th className="py-2.5 pb-3">KODE SKU</th>
                        <th className="py-2.5 pb-3">NAMA SEDIAAN</th>
                        <th className="py-2.5 pb-3">JUMLAH SEDIAAN</th>
                        <th className="py-2.5 pb-3">MINIMUM SAFE</th>
                        <th className="py-2.5 pb-3 text-right">AMBANG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {skus.map((sku, index) => {
                        const safetyMargin = sku.minSafe > 0 ? Math.round((sku.quantity / sku.minSafe) * 100) : 100;
                        const isUnderAlert = safetyMargin <= 150;
                        const pillColor = isUnderAlert 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100';
                        
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 font-mono font-semibold text-slate-900">{sku.skuCode}</td>
                            <td className="py-3 font-semibold text-slate-800">{sku.name}</td>
                            <td className="py-3 font-black text-slate-900">{sku.quantity} {sku.unit}</td>
                            <td className="py-3 font-mono text-slate-400">{sku.minSafe} {sku.unit}</td>
                            <td className="py-3 text-right">
                              <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded border ${pillColor}`}>
                                {safetyMargin}% {isUnderAlert ? '(Kritis)' : '(Aman)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Transaction flow list */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col" id="recent-transactions-container">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Aktivitas Aliran Transaksi Terkini</h2>
                </div>

                <div className="space-y-3.5 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin">
                  {transactions.slice(0, 5).map((trx, index) => {
                    const isIn = trx.type === 'IN';
                    return (
                      <div key={index} className="bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between transition-all">
                        <div className="flex items-center space-x-4">
                          {/* Badge circular OUT/IN */}
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isIn 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {trx.type}
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-xs md:text-sm text-slate-900 line-clamp-1">
                              {trx.description}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 font-mono uppercase">
                              <span className="font-semibold text-slate-500">{trx.category}</span>
                              <span>•</span>
                              <span>{trx.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`font-mono font-black text-xs md:text-sm whitespace-nowrap pl-2 ${
                          isIn ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isIn ? '+' : '-'} {formatRp(trx.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: FINANCE / CASH BOOK / LEDGER */}
        {activeTab === 'finance' && (
          <div className="space-y-6" id="view-finance-ledger">
            
            {/* Header section card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="ledger-header-box">
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase">
                  SISTEM PEMBUKUAN KAS
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Catatan Keluar-Masuk &amp; Hubungan Inventori
                </h2>
              </div>
              <button
                id="btn-catat-transaksi-baru"
                onClick={() => setIsTrxModalOpen(true)}
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Catat Transaksi Baru
              </button>
            </div>

            {/* LEDGER DATABASE TABLE CARD */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="ledger-table-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                      <th className="py-3 px-6 h-12">TANGGAL KERJA</th>
                      <th className="py-3 px-4">ARAH KAS</th>
                      <th className="py-3 px-4">KLASIFIKASI KATEGORI</th>
                      <th className="py-3 px-4 max-w-sm">DESKRIPSI / KETERANGAN</th>
                      <th className="py-3 px-4">STATUS GUDANG</th>
                      <th className="py-3 px-4 text-right">NOMINAL ARUS (RP)</th>
                      <th className="py-3 px-6 text-center">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((trx, index) => {
                      const isIn = trx.type === 'IN';
                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                          <td className="py-4 px-6 font-mono text-slate-500 whitespace-nowrap">{trx.date}</td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] rounded-full border font-bold uppercase tracking-wider ${
                              isIn 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {isIn ? '↗ Uang Masuk' : '↘ Uang Keluar'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">{trx.category}</td>
                          <td className="py-4 px-4 max-w-sm text-slate-600 leading-relaxed font-medium">
                            {trx.description}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {trx.linkedSku ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-600 border border-indigo-100 hover:brightness-105 transition-all">
                                <span className="mr-1">🔗</span> {trx.linkedSku} ({trx.linkedQty})
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono font-medium">-</span>
                            )}
                          </td>
                          <td className={`py-4 px-4 text-right font-mono font-extrabold whitespace-nowrap text-sm ${
                            isIn ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIn ? '+' : '-'} {formatRp(trx.amount)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(trx.id)}
                              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="Hapus rekaman"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* LEDGER FOOTER COUNTER TOTALS */}
              <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4.5 flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm font-semibold gap-4" id="ledger-table-totals pb-6">
                <div className="text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  TERDAPAT {transactions.length} REKAMAN TRANSAKSI DALAM SISTEM LEDGER
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">TOTAL MASUK:</span>
                    <span className="text-emerald-600 font-black font-mono">+{formatRp(totalPemasukan)}</span>
                  </div>
                  <div className="hidden sm:block text-slate-300">|</div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">TOTAL KELUAR:</span>
                    <span className="text-rose-600 font-black font-mono">-{formatRp(totalPengeluaran)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: STOCKIS GUDANG / WAREHOUSE STOCK */}
        {activeTab === 'warehouse' && (
          <div className="space-y-6" id="view-warehouse-stock">
            
            {/* SEARCH AND FILTERS BAR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm" id="search-filter-card">
              
              {/* Search label and input */}
              <div className="relative md:col-span-6" id="search-field">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari SKU atau Nama Sediaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs md:text-sm text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800 transition-all font-medium"
                />
              </div>

              {/* Category classification Dropdown filter */}
              <div className="relative md:col-span-3 flex items-center space-x-2" id="filter-field">
                <Filter className="w-4 h-4 text-slate-450 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs text-slate-600 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800 transition-all font-semibold bg-white cursor-pointer"
                >
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Produk Jadi">Produk Jadi</option>
                  <option value="Kemasan">Kemasan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Right aligned action btn registers new SKU */}
              <div className="md:col-span-3 flex justify-end" id="registrasi-field">
                <button
                  id="btn-registrasi-sku-baru"
                  onClick={() => setIsSkuModalOpen(true)}
                  className="w-full bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Registrasi SKU Baru
                </button>
              </div>
            </div>

            {/* WAREHOUSE CATALOG TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="warehouse-table-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                      <th className="py-3 px-6 h-12">INFO SKU</th>
                      <th className="py-3 px-4">NAMA SEDIAAN</th>
                      <th className="py-3 px-4">KLASIFIKASI</th>
                      <th className="py-3 px-4 text-center">STATUS SISA</th>
                      <th className="py-3 px-4 text-right">BIAYA POKOK (RP)</th>
                      <th className="py-3 px-4 text-right">POTENSI JUAL (RP)</th>
                      <th className="py-3 px-4 text-center">KOREKSI STOK</th>
                      <th className="py-3 px-6 text-center">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSkus.map((sku, index) => {
                      const isBahanBaku = sku.category === 'Bahan Baku';
                      const isProdukJadi = sku.category === 'Produk Jadi';
                      const isKemasan = sku.category === 'Kemasan';
                      
                      const pillStyle = isBahanBaku 
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60' 
                        : isProdukJadi 
                          ? 'bg-teal-50 text-teal-750 border-teal-200/60'
                          : isKemasan
                            ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60'
                            : 'bg-slate-50 text-slate-600 border-slate-200';

                      return (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                          {/* SKU CODE & ASSET VALUE */}
                          <td className="py-4 px-6 font-mono whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 block">{sku.skuCode}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Asset Val: {formatRp(sku.assetValue)}</span>
                          </td>

                          {/* NAME */}
                          <td className="py-4 px-4 font-semibold text-slate-800 text-xs md:text-sm">
                            {sku.name}
                          </td>

                          {/* CLASSIFICATION BADGE */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] rounded border font-bold uppercase tracking-wider ${pillStyle}`}>
                              {sku.category}
                            </span>
                          </td>

                          {/* RAW QUANTITY UNIT */}
                          <td className="py-4 px-4 text-center font-black text-slate-800 text-sm whitespace-nowrap">
                            {sku.quantity} <span className="text-slate-400 font-medium text-xs">{sku.unit}</span>
                          </td>

                          {/* UNIT COST */}
                          <td className="py-4 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                            {formatRp(sku.costPrice)}
                          </td>

                          {/* SELLING PRICE */}
                          <td className="py-4 px-4 text-right font-mono text-slate-600 font-semibold whitespace-nowrap">
                            {sku.sellPrice > 0 ? formatRp(sku.sellPrice) : <span className="text-slate-350">-</span>}
                          </td>

                          {/* PLUS AND MINUS HAND SYSTEM */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleStockCorrection(sku.skuCode, sku.quantity - 1)}
                                className="text-slate-450 hover:text-slate-950 transition-colors cursor-pointer"
                                title="Kurangi 1 unit"
                              >
                                <MinusCircle className="w-5 h-5" />
                              </button>
                              <span className="font-mono text-xs font-bold text-slate-700 w-8 text-center bg-slate-50 border border-slate-200/70 p-1 rounded">
                                {sku.quantity}
                              </span>
                              <button
                                onClick={() => handleStockCorrection(sku.skuCode, sku.quantity + 1)}
                                className="text-slate-450 hover:text-slate-950 transition-colors cursor-pointer"
                                title="Tambah 1 unit"
                              >
                                <PlusCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </td>

                          {/* ACTIONS */}
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleDeleteSku(sku.skuCode)}
                              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="Hapus SKU"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: AUTOMATION AI REPORTING */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fade-in" id="view-ai-reporting">
            
            {/* AUTOMATIC REPORT TRIGGER PANEL */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden" id="ai-generator-panel">
              
              <div className="absolute top-0 left-0 bg-[#0f172a] text-white text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded-br-2xl font-bold">
                PEMICU LAPORAN AI
              </div>

              <div className="pt-8 space-y-6">
                
                <div className="space-y-3">
                  <span className="text-xs font-bold font-mono text-slate-450 tracking-wider uppercase block">
                    Pilih Fokus Analisis Korporat
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ringkasan Integrasi Umum */}
                    <label 
                      onClick={() => selectFocusType('general', 'Ringkasan Integrasi Umum')}
                      className={`border p-4.5 rounded-2xl flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedFocus === 'general' 
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm' 
                          : 'bg-white border-slate-150 hover:bg-slate-50/40'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="ai_focus" 
                        checked={selectedFocus === 'general'} 
                        onChange={() => {}} // Switched via parent click
                        className="mt-1 accent-slate-950 cursor-pointer" 
                      />
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-sm block">Ringkasan Integrasi Umum</span>
                        <span className="text-xs text-slate-500 block leading-relaxed">
                          Analisis performa silang gabungan dana kas &amp; barang gudang.
                        </span>
                      </div>
                    </label>

                    {/* Audit Aliran Kas Saja */}
                    <label 
                      onClick={() => selectFocusType('finance', 'Audit Aliran Kas Saja')}
                      className={`border p-4.5 rounded-2xl flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedFocus === 'finance' 
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm' 
                          : 'bg-white border-slate-150 hover:bg-slate-50/40'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="ai_focus" 
                        checked={selectedFocus === 'finance'} 
                        onChange={() => {}}
                        className="mt-1 accent-slate-950 cursor-pointer" 
                      />
                      <div className="space-y-1">
                        <span className="font-bold text-[#16a34a] text-sm block flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Audit Aliran Kas Saja
                        </span>
                        <span className="text-xs text-slate-500 block leading-relaxed">
                          Fokus mendalam analisis margin, laba, efisiensi modal keluar masuk.
                        </span>
                      </div>
                    </label>

                    {/* Audit & Logistik Gudang */}
                    <label 
                      onClick={() => selectFocusType('warehouse', 'Audit & Logistik Gudang')}
                      className={`border p-4.5 rounded-2xl flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedFocus === 'warehouse' 
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm' 
                          : 'bg-white border-slate-150 hover:bg-slate-50/40'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="ai_focus" 
                        checked={selectedFocus === 'warehouse'} 
                        onChange={() => {}}
                        className="mt-1 accent-slate-950 cursor-pointer" 
                      />
                      <div className="space-y-1">
                        <span className="font-bold text-blue-700 text-sm block flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" /> Audit &amp; Logistik Gudang
                        </span>
                        <span className="text-xs text-slate-500 block leading-relaxed">
                          Fokus sediaan produk jadi, ketersediaan bahan baku, reorder point.
                        </span>
                      </div>
                    </label>

                    {/* Audit Silang & Selisih */}
                    <label 
                      onClick={() => selectFocusType('cross', 'Audit Silang & Selisih')}
                      className={`border p-4.5 rounded-2xl flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedFocus === 'cross' 
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm' 
                          : 'bg-white border-slate-150 hover:bg-slate-50/40'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="ai_focus" 
                        checked={selectedFocus === 'cross'} 
                        onChange={() => {}}
                        className="mt-1 accent-slate-950 cursor-pointer" 
                      />
                      <div className="space-y-1">
                        <span className="font-bold text-rose-600 text-sm block flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Audit Silang &amp; Selisih
                        </span>
                        <span className="text-xs text-slate-500 block leading-relaxed">
                          Mengidentifikasi anomali logistik, kebocoran stockis vs kuitansi kas.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Info Callout Card banner */}
                <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed shadow-sm">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Laporan ini dirancang langsung secara hibrid oleh kecerdasan buatan <span className="font-bold text-slate-900">Gemini 3.5 Flash</span> dengan menyerap total nilai keuangan dan logs fisik terupdate.
                  </p>
                </div>

                {/* Master analytical trigger button */}
                <button
                  id="btn-rancang-laporan"
                  onClick={handleGenerateAIReport}
                  disabled={isGeneratingReport}
                  className="w-full bg-white hover:bg-slate-55 border border-slate-900 text-slate-900 hover:text-slate-950 text-xs font-black py-3 rounded-xl flex items-center justify-center shadow-sm select-none uppercase tracking-wide cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-800" />
                      Sedang Menyusun Laporan Korporat via Gemini 3.5...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                      Rancang Laporan Otomatis
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TWO BOX SUBDIVISION GRID: REPORTS HISTORY & EXPANDED REPORT VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="reports-bottom-section">
              
              {/* Box A: History Archive list (Colspan 4) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col max-h-[600px] overflow-hidden" id="analytics-archive-list">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                    Arsip Laporan Korporat ({reports.length})
                  </h3>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
                  {reports.map((rep) => {
                    const isActive = rep.id === activeReportId;
                    return (
                      <div
                        key={rep.id}
                        onClick={() => setActiveReportId(rep.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                          isActive 
                            ? 'bg-amber-50/50 border-amber-500/70 shadow-sm' 
                            : 'bg-white border-slate-150 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-1.5 pr-6">
                          <span className="font-bold text-xs md:text-sm text-slate-900 block leading-tight">
                            {rep.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-350" /> {rep.date}
                          </span>
                        </div>

                        {/* Delete button archive element */}
                        <button
                          onClick={(e) => handleDeleteReport(rep.id, e)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus laporan dari arsip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {reports.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Belum ada laporan dirancang.
                    </div>
                  )}
                </div>
              </div>

              {/* Box B: Full report display (Colspan 8) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col max-h-[600px] overflow-hidden" id="analytics-report-details">
                {(() => {
                  const activeReport = reports.find(r => r.id === activeReportId);
                  
                  if (!activeReport) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        Pilih laporan dari arsip sebelah kiri untuk didokumentasikan di sini.
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Sub-header inside detail block with PRINT action */}
                      <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200/60 flex justify-between items-center whitespace-normal gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-[#0f172a] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                            GENERAL AI REPORT
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">ID: {activeReport.id}</span>
                        </div>
                        <button
                          onClick={handlePrint}
                          className="border border-slate-200 hover:border-slate-800 bg-white text-slate-700 hover:text-slate-900 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center shadow-xs transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Cetak / PDF
                        </button>
                      </div>

                      {/* Paper Document Canvas Sheet */}
                      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white" id="paper-document-sheet">
                        <article className="prose prose-slate max-w-none text-xs md:text-sm" id="report-md-content">
                          {renderMarkdown(activeReport.content)}
                        </article>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center font-mono text-[9px] tracking-widest text-slate-400 uppercase">
                          LAPORAN ANALITIS INI DIHASILKAN SECARA DINAMIS OLEH INTEGRATIVE AI REASONING
                          <div className="mt-1 text-[8px] tracking-normal font-sans text-slate-400 capitalize">
                            &copy; 2026 PT. Kalimaya Alunna Indonesia. All rights reserved.
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER ENTERPRISE BRAND MARKINGS */}
      <footer className="bg-[#0b0f19] text-slate-400/80 py-4.5 px-6 border-t border-slate-900 flex flex-wrap justify-between items-center text-[10px] md:text-xs font-mono space-y-2 md:space-y-0 shadow-inner" id="app-footer">
        <div>
          &copy; 2026 PT. KALIMAYA ALUNNA INDONESIA. INTEGRATED SYSTEMS VERSION 4.1-STABLE.
        </div>
        <div className="flex items-center space-x-3 text-[10px]" id="meta-footer">
          <span className="uppercase text-slate-500">DATABASE:</span>
          <span className="text-amber-400/95 font-bold">PERSISTENT JSON</span>
          <span className="text-slate-755">•</span>
          <span className="uppercase text-slate-500">AI:</span>
          <span className="text-[#38bdf8] font-bold">GEMINI 3.5 FLASH</span>
        </div>
      </footer>

      {/* MODAL 1: ADD TRANSACTION */}
      {isTrxModalOpen && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-add-transaction">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight uppercase">Catat Transaksi Ledgery Baru</h3>
              <button 
                onClick={() => setIsTrxModalOpen(false)} 
                className="text-slate-400 hover:text-white font-extrabold text-sm opacity-80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              
              {/* Grid 2 Columns for Date & flow option */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Working Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Kerja</label>
                  <input
                    type="date"
                    required
                    value={newTrx.date}
                    onChange={(e) => setNewTrx(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold"
                  />
                </div>

                {/* Cash Flow Direction IN or OUT toggle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Arah Arus Kas</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-200/50 p-1.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setNewTrx(prev => ({ ...prev, type: 'IN', category: 'Penjualan Produk Jadi' }))}
                      className={`text-[10px] font-bold py-1 px-2.5 rounded-md cursor-pointer transition-all uppercase ${
                        newTrx.type === 'IN' 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Uang Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTrx(prev => ({ ...prev, type: 'OUT', category: 'Pembelian Bahan Baku' }))}
                      className={`text-[10px] font-bold py-1 px-2.5 rounded-md cursor-pointer transition-all uppercase ${
                        newTrx.type === 'OUT' 
                          ? 'bg-rose-500 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Uang Keluar
                    </button>
                  </div>
                </div>

              </div>

              {/* Classification dropdown category dependent on direction */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Klasifikasi Kategori</label>
                <select
                  value={newTrx.category}
                  onChange={(e) => setNewTrx(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold cursor-pointer"
                >
                  {newTrx.type === 'IN' ? (
                    <>
                      <option value="Penjualan Produk Jadi">Penjualan Produk Jadi</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Pembelian Bahan Baku">Pembelian Bahan Baku</option>
                      <option value="Pembelian Kemasan">Pembelian Kemasan</option>
                      <option value="Operasional">Operasional</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Input: Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Deskripsi / Keterangan</label>
                <textarea
                  required
                  placeholder="e.g. Pembelian tambahan 60 gram Kalimaya Black Opal Rough"
                  value={newTrx.description}
                  onChange={(e) => setNewTrx(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-medium leading-relaxed"
                />
              </div>

              {/* Grid 3 Columns: Connect SKU? connected SKU dropdown, connected QTY */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5">
                
                {/* Connect SKU selector */}
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-[9px] font-bold text-indigo-500 uppercase block">Hubungkan Ke Sediaan Gudang?</label>
                  <select
                    value={newTrx.linkedSku}
                    onChange={(e) => setNewTrx(prev => ({ ...prev, linkedSku: e.target.value }))}
                    className="w-full text-[11px] p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 transition-all bg-white text-slate-750 font-semibold cursor-pointer"
                  >
                    <option value="">-- Tidak Hubungkan ke Gudang --</option>
                    {skus.map((s) => (
                      <option key={s.skuCode} value={s.skuCode}>
                        [{s.skuCode}] {s.name} ({s.quantity} {s.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked quantity to update inventory dynamically */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[9px] font-bold text-indigo-500 uppercase block">Jumlah Item</label>
                  <input
                    type="number"
                    min="1"
                    disabled={!newTrx.linkedSku}
                    value={newTrx.linkedQty}
                    onChange={(e) => setNewTrx(prev => ({ ...prev, linkedQty: Math.max(1, Number(e.target.value) || 1) }))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-500 transition-all bg-white text-slate-750 font-semibold disabled:bg-slate-100"
                  />
                </div>

              </div>

              {/* Cash amount inputs */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Nominal Rupiah (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-450">Rp</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTrx.amount || ''}
                    onChange={(e) => setNewTrx(prev => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                    placeholder="e.g. 1350000"
                    className="w-full text-xs p-2.5 pl-10 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-extrabold pr-4"
                  />
                </div>
              </div>

              {/* Actions submit cancel */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTrxModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrx}
                  className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmittingTrx ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : 'Simpan Transaksi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER SKU BARU */}
      {isSkuModalOpen && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-add-sku">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-up border border-slate-100">
            <div className="bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight uppercase">Registrasikan SKU Sediaan Baru</h3>
              <button 
                onClick={() => setIsSkuModalOpen(false)} 
                className="text-slate-400 hover:text-white font-extrabold text-sm opacity-80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSku} className="p-6 space-y-4">
              
              {/* SKU CODE & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Kode SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-K0-006"
                    value={newSku.skuCode}
                    onChange={(e) => setNewSku(prev => ({ ...prev, skuCode: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-extrabold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Nama Sediaan</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kotak Kayu Eksotis Cendana"
                    value={newSku.name}
                    onChange={(e) => setNewSku(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold"
                  />
                </div>

              </div>

              {/* Classification dropdown and units */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Klasifikasi Kategori</label>
                  <select
                    value={newSku.category}
                    onChange={(e) => setNewSku(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold cursor-pointer"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Produk Jadi">Produk Jadi</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Satuan Ukur</label>
                  <select
                    value={newSku.unit}
                    onChange={(e) => setNewSku(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold cursor-pointer"
                  >
                    <option value="pcs">pcs (buah)</option>
                    <option value="gram">gram (g)</option>
                    <option value="botol">botol</option>
                    <option value="unit">unit</option>
                  </select>
                </div>

              </div>

              {/* Initial QTY & Minimum safe safeguard limit */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Awal Sediaan</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newSku.quantity || ''}
                    onChange={(e) => setNewSku(prev => ({ ...prev, quantity: Math.max(0, Number(e.target.value) || 0) }))}
                    placeholder="e.g. 50"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Batas Minimum Aman</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSku.minSafe || ''}
                    onChange={(e) => setNewSku(prev => ({ ...prev, minSafe: Math.max(1, Number(e.target.value) || 10) }))}
                    placeholder="e.g. 15"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-semibold"
                  />
                </div>

              </div>

              {/* Unit Cost and Potential Retail Prices */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Biaya Pokok (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newSku.costPrice || ''}
                    onChange={(e) => setNewSku(prev => ({ ...prev, costPrice: Math.max(0, Number(e.target.value) || 0) }))}
                    placeholder="e.g. 25000"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Potensi Nilai Jual (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSku.sellPrice || ''}
                    onChange={(e) => setNewSku(prev => ({ ...prev, sellPrice: Math.max(0, Number(e.target.value) || 0) }))}
                    placeholder="e.g. 75000 (jika ada)"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none focus:border-slate-800 transition-all bg-white text-slate-750 font-bold"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSkuModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSku}
                  className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmittingSku ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : 'Simpan SKU Baru'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
