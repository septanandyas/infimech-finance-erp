import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Clock3, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah, formatDate, cn } from '../lib/utils';

const CATEGORIES = ['Down Payment', 'Progress Payment', 'Pelunasan'];

const EMPTY_FORM = {
    invoiceId: '',
    projectId: '',
    amount: '',
    category: 'Advance',
    received_date: '',
    notes: ''
};

export default function UnearnedRevenue() {
    const [entries, setEntries] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [prospects, setProspects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchEntries = async () => {
        try {
            const res = await axios.get('/api/unearned');
            setEntries(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data Unearned Revenue');
        }
    };

    useEffect(() => {
        fetchEntries();
        axios.get('/api/invoice?status=sent').then(res => setInvoices(res.data || [])).catch(() => { });
        axios.get('/api/invoice/prospects').then(res => setProspects(res.data || [])).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/unearned', {
                ...form,
                amount: Number(form.amount) || 0
            });
            toast.success('Data Unearned Revenue ditambahkan!');
            setShowForm(false);
            setForm(EMPTY_FORM);
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Gagal menambahkan data');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data ini?')) return;
        try {
            await axios.delete(`/api/unearned/${id}`);
            toast.success('Data dihapus!');
            fetchEntries();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Gagal menghapus data');
        }
    };

    const totalPending = entries
        .filter(item => item.status !== 'recognized')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Unearned Revenue</h1>
                    <p className="text-slate-500 mt-1">Pantau pembayaran yang belum diakui sebagai pendapatan</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Belum Diakui</p>
                    <p className="text-2xl font-bold text-sky-600">{formatRupiah(totalPending)}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Menunggu</p>
                    <p className="text-2xl font-bold text-amber-600">{entries.filter(item => item.status === 'pending').length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Diakui</p>
                    <p className="text-2xl font-bold text-emerald-600">{entries.filter(item => item.status === 'recognized').length}</p>
                </div>
            </div>

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Tambah Unearned Revenue</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Invoice</label>
                            <select
                                value={form.invoiceId}
                                onChange={(e) => {
                                    const inv = invoices.find(i => String(i.id) === e.target.value);
                                    setForm({ ...form, invoiceId: e.target.value, projectId: inv?.projectId || '' });
                                }}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            >
                                <option value="">Pilih invoice...</option>
                                {invoices.map(item => (
                                    <option key={item.id} value={item.id}>{item.invoice_number || `INV-${item.id}`}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Project</label>
                            <select
                                value={form.projectId}
                                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            >
                                <option value="">Pilih project...</option>
                                {prospects.map(item => (
                                    <option key={item.no_project} value={item.no_project}>{item.name_project}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah (Rp)</label>
                            <input
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                required
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            >
                                {CATEGORIES.map(item => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal Terima</label>
                            <input
                                type="date"
                                value={form.received_date}
                                onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan</label>
                            <input
                                type="text"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Catatan tambahan..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Tanggal</th>
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Invoice</th>
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Project</th>
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Kategori</th>
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Jumlah</th>
                            <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Status</th>
                            <th className="px-3 sm:px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center text-slate-400 py-12 italic">Belum ada data Unearned Revenue</td>
                            </tr>
                        )}
                        {entries.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.received_date)}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">{item.invoice_number || `INV-${item.invoiceId}`}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">{item.projectName || item.projectId}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">{item.category}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-bold text-right text-slate-700 whitespace-nowrap">{formatRupiah(item.amount || 0)}</td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
                                        item.status === 'recognized'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            : 'bg-amber-50 text-amber-600 border-amber-200'
                                    )}>
                                        {item.status === 'recognized' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                                        {item.status === 'recognized' ? 'Diakui' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                        disabled={item.status === 'recognized'}
                                        title={item.status === 'recognized' ? 'Tidak bisa hapus data yang sudah diakui' : 'Hapus'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
