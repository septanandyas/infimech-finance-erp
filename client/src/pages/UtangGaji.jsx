import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Plus, Pencil, Trash2, CheckCircle2, ChevronDown, ChevronUp,
    Banknote, Users, ClipboardList, Info, X, Calendar, Search
} from 'lucide-react';
import { formatRupiah } from '../lib/utils';
import { cn } from '../lib/utils';

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

const STATUS_COLORS = {
    'Dibayar': 'bg-emerald-100 text-emerald-700',
    'Belum Dibayar': 'bg-amber-100 text-amber-700',
    'Pending': 'bg-slate-100 text-slate-600',
};

const emptyForm = {
    karyawan_id: '',
    bulan: String(new Date().getMonth() + 1),
    tahun: String(new Date().getFullYear()),
    gaji_pokok: '',
    tunjangan: '',
    bonus: '',
    potongan: '',
    status_pembayaran: 'Belum Dibayar',
    pph21_type: 'tanpa_pajak',
    pph21: '',
    tanggal_dibayar: new Date().toISOString().slice(0, 10),
    catatan: ''
};

// ─── Komponen Preview Jurnal ──────────────────────────────────────────────────
const JournalPreview = ({ gajiKotor, takeHomePay, pph21, status }) => {
    const isPaid = ['Dibayar', 'Sudah Dibayar'].includes(status);
    return (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm space-y-3">
            <p className="font-bold text-sky-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Info size={13} /> Preview Jurnal Otomatis
            </p>
            {/* Jurnal 1 */}
            <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">① Pengakuan Beban Gaji (selalu dibuat)</p>
                <div className="space-y-0.5 font-mono text-xs bg-white rounded-lg p-2 border border-sky-100">
                    <div className="flex justify-between">
                        <span className="text-slate-600">[5100] Gaji Karyawan</span>
                        <span className="text-blue-600 font-bold">D {formatRupiah(gajiKotor)}</span>
                    </div>
                    <div className="flex justify-between pl-4">
                        <span className="text-slate-600">[2600] Utang Gaji</span>
                        <span className="text-rose-600 font-bold">K {formatRupiah(takeHomePay)}</span>
                    </div>
                    {pph21 > 0 && (
                        <div className="flex justify-between pl-4">
                            <span className="text-slate-600">[2300] Utang PPh 21</span>
                            <span className="text-rose-600 font-bold">K {formatRupiah(pph21)}</span>
                        </div>
                    )}
                </div>
            </div>
            {/* Jurnal 2 & 3 */}
            {isPaid ? (
                <>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">② Pelunasan ke Karyawan</p>
                        <div className="space-y-0.5 font-mono text-xs bg-white rounded-lg p-2 border border-emerald-100">
                            <div className="flex justify-between">
                                <span className="text-slate-600">[2600] Utang Gaji</span>
                                <span className="text-blue-600 font-bold">D {formatRupiah(takeHomePay)}</span>
                            </div>
                            <div className="flex justify-between pl-4">
                                <span className="text-slate-600">[1100] Kas</span>
                                <span className="text-rose-600 font-bold">K {formatRupiah(takeHomePay)}</span>
                            </div>
                        </div>
                    </div>
                    {pph21 > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">③ Setor PPh 21</p>
                            <div className="space-y-0.5 font-mono text-xs bg-white rounded-lg p-2 border border-purple-100">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">[2300] Utang PPh 21</span>
                                    <span className="text-blue-600 font-bold">D {formatRupiah(pph21)}</span>
                                </div>
                                <div className="flex justify-between pl-4">
                                    <span className="text-slate-600">[1100] Kas</span>
                                    <span className="text-rose-600 font-bold">K {formatRupiah(pph21)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-xs text-slate-400 italic">
                    Jurnal ② dan ③ akan otomatis dibuat saat status diubah ke "Dibayar" atau tombol Lunasi diklik.
                </p>
            )}
        </div>
    );
};

// ─── Modal Settle ─────────────────────────────────────────────────────────────
const SettleModal = ({ payroll, onClose, onSuccess }) => {
    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    if (!payroll) return null;
    const { bebanGaji, takeHomePay, pph21 } = {
        bebanGaji: Number(payroll.gaji_kotor || 0),
        takeHomePay: Number(payroll.gaji_bersih || 0),
        pph21: Number(payroll.pph21_amount || 0)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`/api/payroll/${payroll.id}/settle`, { tanggal_dibayar: tanggal });
            toast.success('Utang gaji berhasil dilunasi! Jurnal pelunasan & PPh 21 telah dibuat.');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal melunasi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">Lunasi Utang Gaji</h3>
                            <p className="text-emerald-100 text-sm mt-0.5">{payroll.nama_karyawan} — {payroll.bulan_nama} {payroll.tahun}</p>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 text-sm">
                        <div>
                            <p className="text-xs text-slate-400">Gaji Kotor (Beban 5100)</p>
                            <p className="font-bold text-slate-800">{formatRupiah(bebanGaji)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Take Home Pay (Kredit 2600)</p>
                            <p className="font-bold text-emerald-600">{formatRupiah(takeHomePay)}</p>
                        </div>
                        {pph21 > 0 && (
                            <div>
                                <p className="text-xs text-slate-400">PPh 21 (Kredit 2300)</p>
                                <p className="font-bold text-purple-600">{formatRupiah(pph21)}</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1.5">
                        <p className="font-bold text-emerald-700">Jurnal yang akan dibuat:</p>
                        <p className="font-mono text-slate-600">Debit  [2600] Utang Gaji → {formatRupiah(takeHomePay)}</p>
                        <p className="font-mono text-slate-600">Kredit [1100] Kas         → {formatRupiah(takeHomePay)}</p>
                        {pph21 > 0 && (
                            <>
                                <p className="font-mono text-slate-600 mt-1">Debit  [2300] Utang PPh 21 → {formatRupiah(pph21)}</p>
                                <p className="font-mono text-slate-600">Kredit [1100] Kas           → {formatRupiah(pph21)}</p>
                            </>
                        )}
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">
                            <Calendar size={11} className="inline mr-1" />Tanggal Pelunasan
                        </label>
                        <input
                            type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            {loading ? 'Memproses...' : 'Lunasi Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Halaman Utama ────────────────────────────────────────────────────────────
export default function UtangGaji() {
    const now = new Date();
    const [payrolls, setPayrolls] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
    const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [settleModal, setSettleModal] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Live calculation
    const gajiKotor = Math.max(0,
        Number(form.gaji_pokok || 0) + Number(form.tunjangan || 0) +
        Number(form.bonus || 0) - Number(form.potongan || 0)
    );
    const pph21Val = form.pph21_type === 'custom' ? Number(form.pph21 || 0) : 0;
    const takeHomePay = Math.max(0, gajiKotor - pph21Val);

    const fetchPayrolls = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterMonth) params.append('month', filterMonth);
            if (filterYear) params.append('year', filterYear);
            if (search) params.append('search', search);
            const res = await axios.get(`/api/payroll?${params}`);
            setPayrolls(res.data);
        } catch {
            toast.error('Gagal memuat data gaji');
        } finally {
            setLoading(false);
        }
    }, [filterMonth, filterYear, search]);

    useEffect(() => {
        fetchPayrolls();
        axios.get('/api/payroll/employees').then(r => setEmployees(r.data)).catch(() => { });
    }, [fetchPayrolls]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                gaji_pokok: Number(form.gaji_pokok || 0),
                tunjangan: Number(form.tunjangan || 0),
                bonus: Number(form.bonus || 0),
                potongan: Number(form.potongan || 0),
                pph21: pph21Val,
            };
            if (editingId) {
                await axios.put(`/api/payroll/${editingId}`, payload);
                toast.success('Slip gaji berhasil diperbarui!');
            } else {
                await axios.post('/api/payroll', payload);
                toast.success('Slip gaji & jurnal pengakuan berhasil dibuat!');
            }
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            fetchPayrolls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan');
        }
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setForm({
            karyawan_id: row.karyawan_id,
            bulan: String(row.bulan || ''),
            tahun: String(row.tahun || ''),
            gaji_pokok: row.gaji_pokok || '',
            tunjangan: row.tunjangan || '',
            bonus: row.bonus || '',
            potongan: row.potongan || '',
            status_pembayaran: row.status_pembayaran || 'Belum Dibayar',
            pph21_type: row.pph21_type || 'tanpa_pajak',
            pph21: row.pph21 || '',
            tanggal_dibayar: row.tanggal_dibayar?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            catatan: row.catatan || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus slip gaji ini? Semua jurnal terkait (pengakuan, pelunasan, PPh 21) akan ikut dihapus.')) return;
        try {
            await axios.delete(`/api/payroll/${id}`);
            toast.success('Slip gaji dan jurnal terkait berhasil dihapus');
            fetchPayrolls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    const filtered = payrolls.filter(p => {
        if (filterStatus && p.status_pembayaran !== filterStatus) return false;
        return true;
    });

    const totalBeban = filtered.reduce((s, p) => s + Number(p.gaji_kotor || 0), 0);
    const totalUtangGaji = filtered.filter(p => !['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran))
        .reduce((s, p) => s + Number(p.gaji_bersih || 0), 0);
    const totalSudahDibayar = filtered.filter(p => ['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran))
        .reduce((s, p) => s + Number(p.gaji_bersih || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Utang Gaji</h1>
                    <p className="text-slate-500 mt-1">Pengakuan & pelunasan beban gaji karyawan — akun 2600</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); setShowPreview(false); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus size={18} /> Tambah Slip Gaji
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <ClipboardList size={12} /> Total Beban Gaji
                    </p>
                    <p className="text-2xl font-bold text-sky-700">{formatRupiah(totalBeban)}</p>
                    <p className="text-xs text-sky-400 mt-1">{filtered.length} slip gaji</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Banknote size={12} /> Utang Gaji (Belum Dilunasi)
                    </p>
                    <p className="text-2xl font-bold text-amber-700">{formatRupiah(totalUtangGaji)}</p>
                    <p className="text-xs text-amber-400 mt-1">
                        {filtered.filter(p => !['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran)).length} slip belum dibayar
                    </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Sudah Dilunasi
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">{formatRupiah(totalSudahDibayar)}</p>
                    <p className="text-xs text-emerald-400 mt-1">
                        {filtered.filter(p => ['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran)).length} slip lunas
                    </p>
                </div>
            </div>

            {/* Form Tambah / Edit */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase text-sm tracking-wider">
                            {editingId ? 'Edit Slip Gaji' : 'Tambah Slip Gaji Baru'}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                            className="text-white/70 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Karyawan & Periode */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">
                                        <Users size={11} className="inline mr-1" />Karyawan *
                                    </label>
                                    <select value={form.karyawan_id}
                                        onChange={e => setForm({ ...form, karyawan_id: e.target.value })}
                                        required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200">
                                        <option value="">Pilih karyawan...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nama} — {emp.jabatan}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">Bulan *</label>
                                    <select value={form.bulan} onChange={e => setForm({ ...form, bulan: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                        {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">Tahun *</label>
                                    <select value={form.tahun} onChange={e => setForm({ ...form, tahun: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Komponen Gaji */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { key: 'gaji_pokok', label: 'Gaji Pokok', placeholder: '0' },
                                    { key: 'tunjangan', label: 'Tunjangan', placeholder: '0' },
                                    { key: 'bonus', label: 'Bonus', placeholder: '0' },
                                    { key: 'potongan', label: 'Potongan', placeholder: '0' },
                                ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">{label}</label>
                                        <input type="number" min="0" value={form[key]}
                                            onChange={e => setForm({ ...form, [key]: e.target.value })}
                                            placeholder={placeholder}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        {form[key] > 0 && (
                                            <span className="text-xs text-slate-400 mt-0.5 block">{formatRupiah(Number(form[key]))}</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* PPh 21 & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">PPh 21</label>
                                    <select value={form.pph21_type}
                                        onChange={e => setForm({ ...form, pph21_type: e.target.value, pph21: '' })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                        <option value="tanpa_pajak">Tanpa PPh 21</option>
                                        <option value="custom">Input Manual (Rp)</option>
                                    </select>
                                </div>
                                {form.pph21_type === 'custom' && (
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">Nominal PPh 21 (Rp)</label>
                                        <input type="number" min="0" value={form.pph21}
                                            onChange={e => setForm({ ...form, pph21: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        {pph21Val > 0 && <span className="text-xs text-slate-400 mt-0.5 block">{formatRupiah(pph21Val)}</span>}
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">Status Pembayaran</label>
                                    <select value={form.status_pembayaran}
                                        onChange={e => setForm({ ...form, status_pembayaran: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                        <option value="Belum Dibayar">Belum Dibayar</option>
                                        <option value="Dibayar">Dibayar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">
                                        <Calendar size={11} className="inline mr-1" />Tanggal Dibayar
                                    </label>
                                    <input type="date" value={form.tanggal_dibayar}
                                        onChange={e => setForm({ ...form, tanggal_dibayar: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                </div>
                            </div>

                            {/* Catatan */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1.5">Catatan</label>
                                <input type="text" value={form.catatan}
                                    onChange={e => setForm({ ...form, catatan: e.target.value })}
                                    placeholder="Catatan tambahan..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>

                            {/* Ringkasan & Preview Jurnal */}
                            {gajiKotor > 0 && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm font-bold text-slate-700">Ringkasan</p>
                                        <button type="button"
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors">
                                            {showPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                            {showPreview ? 'Sembunyikan Jurnal' : 'Lihat Preview Jurnal'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Gaji Kotor / Beban (5100)</p>
                                            <p className="font-bold text-slate-800">{formatRupiah(gajiKotor)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Take Home Pay (2600)</p>
                                            <p className="font-bold text-emerald-600">{formatRupiah(takeHomePay)}</p>
                                        </div>
                                        {pph21Val > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-400">PPh 21 (2300)</p>
                                                <p className="font-bold text-purple-600">{formatRupiah(pph21Val)}</p>
                                            </div>
                                        )}
                                    </div>
                                    {showPreview && (
                                        <div className="mt-4">
                                            <JournalPreview
                                                gajiKotor={gajiKotor}
                                                takeHomePay={takeHomePay}
                                                pph21={pph21Val}
                                                status={form.status_pembayaran}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                                    className="px-5 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                                    Batal
                                </button>
                                <button type="submit"
                                    className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                                    {editingId ? 'Perbarui' : 'Simpan & Jurnal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <Search size={14} className="text-slate-400" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Cari karyawan..."
                        className="text-sm text-slate-700 focus:outline-none w-36"
                    />
                </div>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    <option value="">Semua Bulan</option>
                    {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                </select>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    <option value="">Semua Tahun</option>
                    {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <div className="flex gap-2">
                    {['', 'Belum Dibayar', 'Dibayar'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                                filterStatus === s ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800')}>
                            {s || 'Semua Status'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabel */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-left">Karyawan</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-left">Periode</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">Beban Gaji (5100)</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">Take Home (2600)</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">PPh 21 (2300)</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center text-slate-400 py-16 italic text-sm">Memuat data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-slate-400 py-16 italic text-sm">Belum ada data slip gaji</td></tr>
                            ) : filtered.map(p => {
                                const isPaid = ['Dibayar', 'Sudah Dibayar'].includes(p.status_pembayaran);
                                const isExpanded = expandedId === p.id;
                                return (
                                    <React.Fragment key={p.id}>
                                        <tr className={cn('hover:bg-slate-50 transition-colors', isPaid ? '' : 'bg-amber-50/30')}>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-slate-800 text-sm">{p.nama_karyawan}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{p.jabatan} {p.departemen ? `· ${p.departemen}` : ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                                                {p.bulan_nama} {p.tahun}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-bold text-slate-800 text-right whitespace-nowrap">
                                                {formatRupiah(p.gaji_kotor)}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-bold text-sky-600 text-right whitespace-nowrap">
                                                {formatRupiah(p.gaji_bersih)}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-purple-600 text-right whitespace-nowrap">
                                                {p.pph21_amount > 0 ? formatRupiah(p.pph21_amount) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap',
                                                    STATUS_COLORS[p.status_pembayaran] || 'bg-slate-100 text-slate-600')}>
                                                    {p.status_pembayaran}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {!isPaid && (
                                                        <button
                                                            onClick={() => setSettleModal(p)}
                                                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                                                            title="Lunasi — buat jurnal pelunasan Utang Gaji">
                                                            <CheckCircle2 size={12} /> Lunasi
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                                        className="text-slate-300 hover:text-sky-500 transition-colors p-1"
                                                        title="Lihat detail jurnal">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                    <button onClick={() => handleEdit(p)}
                                                        className="text-slate-300 hover:text-sky-500 transition-colors p-1"
                                                        title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                        title="Hapus">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded — Preview Jurnal */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-6 pb-4 pt-2 bg-slate-50 border-b border-slate-100">
                                                    <div className="max-w-2xl">
                                                        <JournalPreview
                                                            gajiKotor={Number(p.gaji_kotor)}
                                                            takeHomePay={Number(p.gaji_bersih)}
                                                            pph21={Number(p.pph21_amount || 0)}
                                                            status={p.status_pembayaran}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        {filtered.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50">
                                    <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                                        Total ({filtered.length} slip)
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">
                                        {formatRupiah(totalBeban)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-sky-600 text-right">
                                        {formatRupiah(filtered.reduce((s, p) => s + Number(p.gaji_bersih || 0), 0))}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right">
                                        {formatRupiah(filtered.reduce((s, p) => s + Number(p.pph21_amount || 0), 0))}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Catatan alur akuntansi */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600 space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-2"><Info size={14} /> Alur Akuntansi Utang Gaji</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="font-bold text-sky-600 mb-1">① Pengakuan (otomatis)</p>
                        <p className="font-mono text-slate-500">D [5100] Gaji Karyawan</p>
                        <p className="font-mono text-slate-500 pl-2">K [2600] Utang Gaji</p>
                        <p className="font-mono text-slate-500 pl-2">K [2300] Utang PPh 21</p>
                        <p className="text-slate-400 mt-1.5">Beban masuk HPP, utang muncul di Neraca</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="font-bold text-emerald-600 mb-1">② Pelunasan (klik Lunasi)</p>
                        <p className="font-mono text-slate-500">D [2600] Utang Gaji</p>
                        <p className="font-mono text-slate-500 pl-2">K [1100] Kas</p>
                        <p className="text-slate-400 mt-1.5">Utang Gaji di Neraca berkurang, Kas keluar</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="font-bold text-purple-600 mb-1">③ Setor PPh 21 (otomatis)</p>
                        <p className="font-mono text-slate-500">D [2300] Utang PPh 21</p>
                        <p className="font-mono text-slate-500 pl-2">K [1100] Kas</p>
                        <p className="text-slate-400 mt-1.5">Dibuat bersamaan dengan pelunasan</p>
                    </div>
                </div>
            </div>

            {/* Modal Settle */}
            {settleModal && (
                <SettleModal
                    payroll={settleModal}
                    onClose={() => setSettleModal(null)}
                    onSuccess={fetchPayrolls}
                />
            )}
        </div>
    );
}
