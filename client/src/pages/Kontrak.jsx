import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const STATUS_CONFIG = {
    active: { label: 'Aktif', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    completed: { label: 'Selesai', color: 'bg-sky-50 text-sky-600 border-sky-200' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-50 text-red-600 border-red-200' },
};

const EMPTY_FORM = {
    projectId: '', contract_number: '', contract_value: '',
    contract_date: '', status: 'active', notes: ''
};

export default function Kontrak() {
    const [data, setData] = useState([]);
    const [prospects, setProspects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterProject, setFilterProject] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchData = async () => {
        try {
            const res = await axios.get(`/api/contract${filterProject ? `?projectId=${filterProject}` : ''}`);
            setData(res.data);
        } catch { console.error('Gagal fetch kontrak'); }
    };

    useEffect(() => { fetchData(); }, [filterProject]);
    useEffect(() => {
        axios.get('/api/invoice/prospects').then(r => setProspects(r.data)).catch(() => { });
    }, []);

    const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

    const handleEdit = (row) => {
        setForm({
            projectId: row.projectId,
            contract_number: row.contract_number || '',
            contract_value: row.contract_value,
            contract_date: row.contract_date?.slice(0, 10),
            status: row.status,
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
                await axios.put(`/api/contract/${editingId}`, form);
                toast.success('Kontrak diperbarui!');
            } else {
                await axios.post('/api/contract', form);
                toast.success('Kontrak ditambahkan!');
            }
            resetForm();
            fetchData();
        } catch { toast.error('Gagal menyimpan kontrak'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus kontrak ini?')) return;
        try {
            await axios.delete(`/api/contract/${id}`);
            toast.success('Kontrak dihapus!');
            fetchData();
        } catch { toast.error('Gagal menghapus'); }
    };

    const totalNilaiKontrak = data.filter(d => d.status === 'active').reduce((s, d) => s + Number(d.contract_value), 0);
    const totalTerbayar = data.filter(d => d.status === 'active').reduce((s, d) => s + Number(d.total_paid || 0), 0);
    const totalOutstanding = data.filter(d => d.status === 'active').reduce((s, d) => s + Number(d.outstanding || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Kontrak</h1>
                    <p className="text-slate-500 mt-1">Kelola nilai kontrak per project</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah Kontrak
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Nilai Kontrak Aktif</p>
                    <p className="text-2xl font-bold text-sky-600">{formatRupiah(totalNilaiKontrak)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Terbayar</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(totalTerbayar)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Piutang</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(totalOutstanding)}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    <option value="">Semua Project</option>
                    {prospects.map(p => <option key={p.no_project} value={p.no_project}>{p.name_project}</option>)}
                </select>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider mb-4">
                        {editingId ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Project</label>
                            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="">Pilih project...</option>
                                {prospects.map(p => <option key={p.no_project} value={p.no_project}>{p.name_project}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nomor Kontrak (Opsional)</label>
                            <input value={form.contract_number} onChange={e => setForm({ ...form, contract_number: e.target.value })}
                                placeholder="SPK-2026-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nilai Kontrak (Rp)</label>
                            <input type="number" value={form.contract_value} onChange={e => setForm({ ...form, contract_value: e.target.value })}
                                required placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal Kontrak</label>
                            <input type="date" value={form.contract_date} onChange={e => setForm({ ...form, contract_date: e.target.value })}
                                required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                <option value="active">Aktif</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan (Opsional)</label>
                            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Keterangan tambahan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>
                        <select value={form.revenue_coa_code} onChange={e => setForm({ ...form, revenue_coa_code: e.target.value })}>
                            <option value="4100">Simulasi CFD</option>
                            <option value="4200">Simulasi FEA</option>
                            <option value="4300">Konsultasi & Training</option>
                        </select>
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
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[768px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Project</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">No. Kontrak</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Tgl Kontrak</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Nilai Kontrak</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Terbayar</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Piutang</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Status</th>
                                <th className="px-3 sm:px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 && (
                                <tr><td colSpan={8} className="text-center text-slate-400 py-12 italic">Belum ada data kontrak</td></tr>
                            )}
                            {data.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <p className="text-sm font-medium text-slate-800">{row.projectName}</p>
                                        <p className="text-xs text-slate-400">{row.client_name}</p>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600">{row.contract_number || '-'}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(row.contract_date)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-bold text-slate-800 text-right whitespace-nowrap">{formatRupiah(row.contract_value)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-emerald-600 font-medium text-right whitespace-nowrap">{formatRupiah(row.total_paid || 0)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-red-600 font-medium text-right whitespace-nowrap">{formatRupiah(row.outstanding || 0)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className={cn("text-xs px-2 py-1 rounded-lg font-medium border whitespace-nowrap", STATUS_CONFIG[row.status]?.color)}>
                                            {STATUS_CONFIG[row.status]?.label}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
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
        </div>
    );
}