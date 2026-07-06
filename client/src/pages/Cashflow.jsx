import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORIES_INCOME = ['Pembayaran Project', 'Down Payment', 'Pelunasan', 'Lain-lain'];
const CATEGORIES_EXPENSE = ['Gaji', 'Operasional', 'Software', 'Hardware', 'Marketing', 'Lain-lain'];

const formatThousand = (val) => {
    if (!val && val !== 0) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function Cashflow() {
    const now = new Date();
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netCashflow: 0 });
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [showForm, setShowForm] = useState(false);
    const [prospects, setProspects] = useState([]);
    const [form, setForm] = useState({ type: 'income', category: '', amount: '', description: '', date: '', projectId: '' });
    const [editingRow, setEditingRow] = useState(null);
    const [saldoData, setSaldoData] = useState([]);

    const fetchData = async () => {
        try {
            const [cfRes, sumRes] = await Promise.all([
                axios.get(`/api/cashflow?month=${month}&year=${year}`),
                axios.get(`/api/cashflow/summary?month=${month}&year=${year}`)
            ]);
            setData(cfRes.data);
            setSummary(sumRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchData(); }, [month, year]);

    useEffect(() => {
        axios.get('/api/invoice/prospects').then(r => setProspects(r.data)).catch(() => { });
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            await fetchData();
            try {
                const saldoRes = await axios.get(`/api/saldo?year=${year}`);
                setSaldoData(saldoRes.data.map(s => ({ ...s, name: MONTHS[s.month - 1] })));
            } catch (error) { console.error(error); }
        };
        fetchAll();
    }, [month, year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/cashflow', {
                ...form,
                amount: Number(form.amount) || 0
            });
            toast.success('Cashflow ditambahkan!');
            setShowForm(false);
            setForm({ type: 'income', category: '', amount: '', description: '', date: '', projectId: '' });
            fetchData();
        } catch {
            toast.error('Gagal menambahkan cashflow');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus data ini?')) return;
        try {
            await axios.delete(`/api/cashflow/${id}`);
            toast.success('Dihapus!');
            fetchData();
        } catch {
            toast.error('Gagal menghapus');
        }
    };

    const handleEdit = (row) => {
        setEditingRow(row.id);
        setForm({
            type: row.type,
            category: row.category,
            amount: row.amount,
            description: row.description || '',
            date: row.date?.slice(0, 10),
            projectId: row.projectId || ''
        });
        setShowForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/cashflow/${editingRow}`, {
                ...form,
                amount: Number(form.amount) || 0
            });
            toast.success('Cashflow diperbarui!');
            setShowForm(false);
            setEditingRow(null);
            setForm({ type: 'income', category: '', amount: '', description: '', date: '', projectId: '' });
            fetchData();
        } catch {
            toast.error('Gagal memperbarui cashflow');
        }
    };

    const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Cashflow</h1>
                    <p className="text-slate-500 mt-1">Arus kas masuk dan keluar</p>
                </div>
                <button
                    onClick={() => { setEditingRow(null); setForm({ type: 'income', category: '', amount: '', description: '', date: '', projectId: '' }); setShowForm(!showForm); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-3 flex-wrap">
                <select value={month} onChange={e => setMonth(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Pemasukan</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(summary.totalIncome || 0)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Pengeluaran</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(summary.totalExpense || 0)}</p>
                </div>
                <div className={cn("rounded-2xl p-4 border", summary.netCashflow >= 0 ? "bg-sky-50 border-sky-200" : "bg-amber-50 border-amber-200")}>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", summary.netCashflow >= 0 ? "text-sky-600" : "text-amber-600")}>Net Cashflow</p>
                    <p className={cn("text-2xl font-bold", summary.netCashflow >= 0 ? "text-sky-600" : "text-amber-600")}>{formatRupiah(summary.netCashflow || 0)}</p>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                        {editingRow ? 'Edit Cashflow' : 'Tambah Cashflow'}
                    </h3>
                    <form onSubmit={editingRow ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tipe</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="income">Pemasukan</option>
                                <option value="expense">Pengeluaran</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="">Pilih kategori...</option>
                                {(form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah (Rp)</label>
                            <input
                                type="number"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                            {form.amount && (
                                <span className="text-xs text-slate-400 mt-1 block">
                                    {formatRupiah(Number(form.amount) || 0)}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Project (Opsional)</label>
                            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="">Tidak terkait project</option>
                                {prospects.map(p => <option key={p.no_project} value={p.no_project}>{p.name_project}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Keterangan</label>
                            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Keterangan tambahan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditingRow(null); setForm({ type: 'income', category: '', amount: '', description: '', date: '', projectId: '' }); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Tanggal</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Tipe</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Kategori</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Keterangan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Jumlah</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 && (
                            <tr><td colSpan={6} className="text-center text-slate-400 py-12 italic">Belum ada data cashflow bulan ini</td></tr>
                        )}
                        {data.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(row.date)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn("flex items-center gap-1.5 text-xs font-bold", row.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                                        {row.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {row.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{row.category}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{row.description || '-'}</td>
                                <td className={cn("px-6 py-4 text-sm font-bold text-right", row.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                                    {row.type === 'income' ? '+' : '-'}{formatRupiah(row.amount)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(row)} className="text-slate-300 hover:text-sky-500 transition-colors">
                                            <Pencil size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(row.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ===== LAPORAN SALDO ===== */}
            <div className="mt-10 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Laporan Saldo</h2>
                    <p className="text-slate-500 mt-1">Posisi keuangan kumulatif {year}</p>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Saldo Kumulatif {year}</p>
                    <p className="text-4xl font-bold text-sky-600">{formatRupiah(saldoData.length > 0 ? saldoData[saldoData.length - 1]?.balance || 0 : 0)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-6">Grafik Saldo Kumulatif</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={saldoData}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
                            <Tooltip formatter={v => formatRupiah(v)} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
                            <Area type="monotone" dataKey="balance" name="Saldo" stroke="#0ea5e9" fill="url(#colorBalance)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Bulan</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Pemasukan</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Pengeluaran</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Net</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Saldo Kumulatif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {saldoData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.name} {year}</td>
                                    <td className="px-6 py-4 text-sm text-emerald-600 text-right">{formatRupiah(row.income)}</td>
                                    <td className="px-6 py-4 text-sm text-red-600 text-right">{formatRupiah(row.expense)}</td>
                                    <td className={`px-6 py-4 text-sm font-bold text-right ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(row.net)}</td>
                                    <td className="px-6 py-4 text-sm text-sky-600 font-bold text-right">{formatRupiah(row.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}