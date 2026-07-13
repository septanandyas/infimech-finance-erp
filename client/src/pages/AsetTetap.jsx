import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORIES = ['Peralatan IT', 'Kendaraan', 'Furniture', 'Bangunan', 'Mesin', 'Lainnya'];

const EMPTY_FORM = {
    name: '', category: 'Peralatan IT', acquisition_value: '',
    acquisition_date: '', useful_life_years: 4, notes: ''
};

export default function AsetTetap() {
    const [data, setData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/fixedasset');
            setData(res.data);
        } catch { console.error('Gagal fetch aset tetap'); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

    const handleEdit = (row) => {
        setForm({
            name: row.name,
            category: row.category,
            acquisition_value: row.acquisition_value,
            acquisition_date: row.acquisition_date?.slice(0, 10),
            useful_life_years: row.useful_life_years,
            notes: row.notes || ''
        });
        setEditingId(row.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`/api/fixedasset/${editingId}`, form);
                toast.success('Aset diperbarui!');
            } else {
                await axios.post('/api/fixedasset', form);
                toast.success('Aset ditambahkan!');
            }
            resetForm();
            fetchData();
        } catch { toast.error('Gagal menyimpan aset'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus aset ini?')) return;
        try {
            await axios.delete(`/api/fixedasset/${id}`);
            toast.success('Aset dihapus!');
            fetchData();
        } catch { toast.error('Gagal menghapus'); }
    };

    const totalNilaiBuku = data.reduce((sum, a) => sum + Number(a.book_value || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Aset Tetap</h1>
                    <p className="text-slate-500 mt-1">Kelola inventaris aset tetap perusahaan</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah Aset
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Aset</p>
                    <p className="text-2xl font-bold text-sky-600">{data.length} item</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Nilai Perolehan</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(data.reduce((s, a) => s + Number(a.acquisition_value), 0))}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Total Nilai Buku</p>
                    <p className="text-2xl font-bold text-amber-600">{formatRupiah(totalNilaiBuku)}</p>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider mb-4">
                        {editingId ? 'Edit Aset' : 'Tambah Aset Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Aset</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Laptop Dell XPS 15" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nilai Perolehan (Rp)</label>
                            <input type="number" value={form.acquisition_value} onChange={e => setForm({ ...form, acquisition_value: e.target.value })} required placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal Perolehan</label>
                            <input type="date" value={form.acquisition_date} onChange={e => setForm({ ...form, acquisition_date: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Umur Ekonomis (Tahun)</label>
                            <input type="number" value={form.useful_life_years} onChange={e => setForm({ ...form, useful_life_years: e.target.value })} required min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan (Opsional)</label>
                            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Serial number, lokasi, dll..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors">
                                {editingId ? 'Perbarui' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Nama Aset</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Kategori</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Nilai Perolehan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Akm. Penyusutan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Nilai Buku</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Tgl Perolehan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Umur</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 && (
                            <tr><td colSpan={8} className="text-center text-slate-400 py-12 italic">Belum ada aset tetap</td></tr>
                        )}
                        {data.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                    {row.name}
                                    {row.notes && <p className="text-xs text-slate-400 mt-0.5">{row.notes}</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">{row.category}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-right">{formatRupiah(row.acquisition_value)}</td>
                                <td className="px-6 py-4 text-sm text-red-500 text-right">{formatRupiah(row.accumulated_depreciation)}</td>
                                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{formatRupiah(row.book_value)}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(row.acquisition_date)}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 text-center">{row.useful_life_years} thn</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(row)} className="text-slate-300 hover:text-sky-500 transition-colors"><Pencil size={15} /></button>
                                        <button onClick={() => handleDelete(row.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}