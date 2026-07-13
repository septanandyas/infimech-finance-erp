import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORIES = ['Hutang Bank', 'Hutang Usaha', 'Hutang Pajak', 'Hutang Gaji', 'Lainnya'];

const emptyForm = {
    name: '', category: 'Hutang Usaha', amount: '', start_date: '', due_date: '',
    term_type: 'short_term', status: 'outstanding', notes: ''
};

export default function Kewajiban() {
    const [liabilities, setLiabilities] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/liability');
            setLiabilities(res.data);
        } catch { console.error('Gagal fetch kewajiban'); }
    };

    useEffect(() => { fetchData(); }, []);

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

    const filtered = filter ? liabilities.filter(l => l.status === filter) : liabilities;
    const totalOutstanding = liabilities.filter(l => l.status === 'outstanding').reduce((s, l) => s + Number(l.amount), 0);
    const totalPaid = liabilities.filter(l => l.status === 'paid').reduce((s, l) => s + Number(l.amount), 0);

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
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Nama</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Kategori</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Jenis</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Jatuh Tempo</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Jumlah</th>
                            <th className="px-6 py-4"></th>
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
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{l.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{l.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', l.term_type === 'short_term' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600')}>
                                            {l.term_type === 'short_term' ? 'Jangka Pendek' : 'Jangka Panjang'}
                                        </span>
                                    </td>
                                    <td className={cn('px-6 py-4 text-sm font-medium', isOverdue ? 'text-red-600' : 'text-slate-600')}>
                                        {formatDate(l.due_date)} {isOverdue && '⚠️'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', l.status === 'outstanding' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>
                                            {l.status === 'outstanding' ? 'Outstanding' : 'Lunas'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">{formatRupiah(l.amount)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
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
    );
}
