import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, CreditCard, History, ChevronDown } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORIES = ['Hutang Bank', 'Hutang Usaha', 'Hutang Pajak', 'Hutang Gaji', 'Lainnya'];

const emptyForm = {
    name: '', category: 'Hutang Usaha', coa_code: '2100', amount: '',
    start_date: '', due_date: '', term_type: 'short_term', status: 'outstanding',
    notes: '', create_asset: false, asset_name: '', asset_category: 'Peralatan & Mesin',
    asset_useful_life: 4
};

export default function Kewajiban() {
    const [liabilities, setLiabilities] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('');
    const [coas, setCoas] = useState([]);
    const [paymentModal, setPaymentModal] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/liability');
            setLiabilities(res.data);
        } catch { console.error('Gagal fetch kewajiban'); }
    };

    useEffect(() => {
        fetchData();
        axios.get('/api/coa').then(r => setCoas(r.data || [])).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`/api/liability/${editingId}`, { ...form, amount: Number(form.amount) });
                toast.success('Kewajiban diperbarui!');
            } else {
                await axios.post('/api/liability', { ...form, amount: Number(form.amount) });
                toast.success('Kewajiban ditambahkan!');
            }
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            fetchData();
        } catch { toast.error('Gagal menyimpan kewajiban'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus kewajiban ini?')) return;
        try {
            await axios.delete(`/api/liability/${id}`);
            toast.success('Kewajiban dihapus!');
            fetchData();
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setForm({
            name: row.name, category: row.category, amount: row.amount,
            start_date: row.start_date?.slice(0, 10), due_date: row.due_date?.slice(0, 10),
            term_type: row.term_type, status: row.status, notes: row.notes || ''
        });
        setShowForm(true);
    };

    const openPaymentModal = async (l) => {
        setPaymentModal(l);
        setPaymentForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
        try {
            const res = await axios.get(`/api/liability/${l.id}/payments`);
            setPayments(res.data);
        } catch { setPayments([]); }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/liability/${paymentModal.id}/payments`, {
                ...paymentForm, amount: Number(paymentForm.amount)
            });
            toast.success('Cicilan dicatat!');
            fetchData();
            const res = await axios.get(`/api/liability/${paymentModal.id}/payments`);
            setPayments(res.data);
            const updatedRes = await axios.get('/api/liability');
            const updated = updatedRes.data.find(l => l.id === paymentModal.id);
            if (updated) setPaymentModal(updated);
            setPaymentForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mencatat cicilan');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm('Hapus cicilan ini? Data cashflow dan jurnal terkait akan ikut dihapus.')) return;
        try {
            await axios.delete(`/api/liability/${paymentModal.id}/payments/${paymentId}`);
            toast.success('Cicilan dihapus!');
            const res = await axios.get(`/api/liability/${paymentModal.id}/payments`);
            setPayments(res.data);
            const updatedRes = await axios.get('/api/liability');
            const updated = updatedRes.data.find(l => l.id === paymentModal.id);
            if (updated) setPaymentModal(updated);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus cicilan');
        }
    };

    const filtered = filter ? liabilities.filter(l => l.status === filter) : liabilities;
    const totalOutstanding = liabilities.filter(l => l.status === 'outstanding').reduce((s, l) => s + (Number(l.amount) - Number(l.paid_amount || 0)), 0);
    const totalPaid = liabilities.reduce((s, l) => s + Number(l.paid_amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Kewajiban</h1>
                    <p className="text-slate-500 mt-1">Kelola hutang dan kewajiban perusahaan</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah Kewajiban
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Kewajiban Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(totalOutstanding)}</p>
                    <p className="text-xs text-red-400 mt-1">{liabilities.filter(l => l.status === 'outstanding').length} item belum lunas</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Sudah Dilunasi</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalPaid)}</p>
                    <p className="text-xs text-emerald-400 mt-1">{liabilities.filter(l => l.status === 'paid').length} item lunas</p>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                        {editingId ? 'Edit Kewajiban' : 'Tambah Kewajiban Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Kewajiban</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Contoh: Hutang Bank BCA" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah (Rp)</label>
                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            {form.amount && <span className="text-xs text-slate-400 mt-1 block">{formatRupiah(Number(form.amount) || 0)}</span>}
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jenis</label>
                            <select value={form.term_type} onChange={e => setForm({ ...form, term_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="short_term">Jangka Pendek</option>
                                <option value="long_term">Jangka Panjang</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal Mulai</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jatuh Tempo</label>
                            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kode Akun</label>
                            <select value={form.coa_code} onChange={e => setForm({ ...form, coa_code: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="">Pilih akun...</option>
                                {coas.map(c => <option key={c.code} value={c.code}>[{c.code}] {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="outstanding">Outstanding</option>
                                <option value="paid">Lunas</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan</label>
                            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        {!editingId && (
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.create_asset}
                                        onChange={e => setForm({ ...form, create_asset: e.target.checked })}
                                        className="w-4 h-4 accent-sky-500" />
                                    <span className="text-sm text-slate-700 font-medium">Pembelian aset tetap secara kredit</span>
                                </label>
                                {form.create_asset && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Aset</label>
                                            <input value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })}
                                                placeholder="Printer Canon..." required={form.create_asset}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori Aset</label>
                                            <select value={form.asset_category} onChange={e => setForm({ ...form, asset_category: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                                {['Peralatan IT', 'Kendaraan', 'Furniture', 'Bangunan', 'Mesin', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Umur Ekonomis (Thn)</label>
                                            <input type="number" value={form.asset_useful_life} min="1"
                                                onChange={e => setForm({ ...form, asset_useful_life: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
                {[{ val: '', label: 'Semua' }, { val: 'outstanding', label: 'Outstanding' }, { val: 'paid', label: 'Lunas' }].map(f => (
                    <button key={f.val} onClick={() => setFilter(f.val)} className={cn('px-4 py-1.5 rounded-xl text-xs font-bold transition-colors', filter === f.val ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800')}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Nama</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Kategori</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Jenis</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Jatuh Tempo</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Status</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Terbayar</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Sisa</th>
                                <th className="px-3 sm:px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-slate-400 py-12 italic">Belum ada data kewajiban</td></tr>
                            )}
                            {filtered.map(l => {
                                const isOverdue = l.status === 'outstanding' && new Date(l.due_date) < new Date();
                                return (
                                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-slate-700">
                                            {l.name}
                                            {l.asset_name && <p className="text-xs text-sky-500 mt-0.5">🔗 Aset: {l.asset_name}</p>}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">{l.category}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <span className={cn('text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap', l.term_type === 'short_term' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600')}>
                                                {l.term_type === 'short_term' ? 'Jangka Pendek' : 'Jangka Panjang'}
                                            </span>
                                        </td>
                                        <td className={cn('px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap', isOverdue ? 'text-red-600' : 'text-slate-600')}>
                                            {formatDate(l.due_date)} {isOverdue && '⚠️'}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <span className={cn('text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap', l.status === 'outstanding' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>
                                                {l.status === 'outstanding' ? 'Outstanding' : 'Lunas'}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-bold text-slate-700 text-right whitespace-nowrap">{formatRupiah(l.amount)}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-emerald-600 text-right whitespace-nowrap">{formatRupiah(l.paid_amount || 0)}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-bold text-red-600 text-right whitespace-nowrap">{formatRupiah(l.amount - (l.paid_amount || 0))}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-2">
                                                {l.status === 'outstanding' && (
                                                    <button onClick={() => openPaymentModal(l)}
                                                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold transition-colors"
                                                        title="Bayar Cicilan">
                                                        <CreditCard size={12} /> Bayar
                                                    </button>
                                                )}
                                                <button onClick={() => openPaymentModal(l)} className="text-slate-300 hover:text-violet-500 transition-colors" title="Riwayat">
                                                    <History size={15} />
                                                </button>
                                                <button onClick={() => handleEdit(l)} className="text-slate-300 hover:text-sky-500 transition-colors"><Pencil size={15} /></button>
                                                <button onClick={() => handleDelete(l.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal Cicilan */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800">{paymentModal.name}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{paymentModal.category}</p>
                                <div className="flex gap-4 mt-2 text-xs">
                                    <span>Total: <span className="font-bold text-slate-800">{formatRupiah(paymentModal.amount)}</span></span>
                                    <span>Terbayar: <span className="font-bold text-emerald-600">{formatRupiah(paymentModal.paid_amount || 0)}</span></span>
                                    <span>Sisa: <span className="font-bold text-red-500">{formatRupiah(paymentModal.amount - (paymentModal.paid_amount || 0))}</span></span>
                                </div>
                            </div>
                            <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2">✕</button>
                        </div>

                        {/* Form cicilan */}
                        {paymentModal.status === 'outstanding' && (
                            <div className="p-5 border-b border-slate-100 bg-slate-50">
                                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Catat Cicilan</h4>
                                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700 mb-3">
                                    <p className="font-bold">Jurnal otomatis:</p>
                                    <p>Debit [{paymentModal.coa_code || '2100'}] Hutang → Kredit [1100] Kas</p>
                                </div>
                                <form onSubmit={handleAddPayment} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah (Rp)</label>
                                            <input type="number" value={paymentForm.amount}
                                                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                required placeholder="0" min="1"
                                                max={paymentModal.amount - (paymentModal.paid_amount || 0)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                            {paymentForm.amount && (
                                                <span className="text-xs text-slate-400 mt-0.5 block">{formatRupiah(Number(paymentForm.amount))}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal</label>
                                            <input type="date" value={paymentForm.payment_date}
                                                onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                required className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan</label>
                                        <input value={paymentForm.notes}
                                            onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                            placeholder="Cicilan ke-1, transfer BCA, dll..."
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">
                                            Simpan Cicilan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Riwayat */}
                        <div className="p-5 max-h-64 overflow-y-auto">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Riwayat Cicilan</h4>
                            {payments.length === 0 ? (
                                <p className="text-slate-400 text-sm italic text-center py-4">Belum ada cicilan</p>
                            ) : (
                                <div className="space-y-2">
                                    {payments.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-xs text-slate-400">{formatDate(p.payment_date)} · {p.createdByName}</p>
                                                {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-emerald-600">{formatRupiah(p.amount)}</span>
                                                <button onClick={() => handleDeletePayment(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
