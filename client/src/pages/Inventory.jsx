import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Package, History } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

const CATEGORIES = ['ATK', 'Perlengkapan Kantor', 'Peralatan', 'Elektronik', 'Lainnya'];
const UNITS = ['pcs', 'rim', 'box', 'lusin', 'unit', 'lembar', 'botol', 'pak'];

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const [form, setForm] = useState({ name: '', category: '', quantity: '', unit: '', unit_price: '', entry_type: 'purchase', log_date: new Date().toISOString().slice(0, 10) });
    const [logForm, setLogForm] = useState({ type: 'in', quantity: '', note: '', entry_type: 'purchase', log_date: new Date().toISOString().slice(0, 10) });

    const fetchItems = async () => {
        try {
            const res = await axios.get('/api/inventory');
            setItems(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLog = async (id) => {
        try {
            const res = await axios.get(`/api/inventory/${id}/log`);
            setLogs(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Konfirmasi kalau pembelian baru
        if (!editingId && form.entry_type === 'purchase') {
            const totalCost = Number(form.quantity) * Number(form.unit_price);
            const confirmed = confirm(
                `Pembelian ${form.name} sebanyak ${form.quantity} ${form.unit} senilai ${formatRupiah(totalCost)} akan dicatat sebagai pengeluaran kas di Cashflow. Lanjutkan?`
            );
            if (!confirmed) return;
        }

        try {
            if (editingId) {
                await axios.put(`/api/inventory/${editingId}`, form);
                toast.success('Item diperbarui!');
            } else {
                // Buat item dulu
                const res = await axios.post('/api/inventory', form);
                // Catat log awal dengan entry_type
                await axios.post('/api/inventory/log', {
                    inventoryId: res.data.id,
                    type: 'in',
                    quantity: Number(form.quantity),
                    note: form.entry_type === 'opening_balance' ? 'Saldo awal persediaan' : 'Pembelian awal',
                    entry_type: form.entry_type,
                    log_date: form.log_date
                });
                toast.success('Item ditambahkan!');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ name: '', category: '', quantity: '', unit: '', unit_price: '', entry_type: 'purchase', log_date: new Date().toISOString().slice(0, 10) });
            fetchItems();
        } catch {
            toast.error('Gagal menyimpan item');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            category: item.category || '',
            quantity: item.quantity,
            unit: item.unit || '',
            unit_price: item.unit_price
        });
        setShowForm(true);
        setSelectedItem(null);
        setShowLogModal(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus item ini?')) return;
        try {
            await axios.delete(`/api/inventory/${id}`);
            toast.success('Item dihapus!');
            fetchItems();
        } catch {
            toast.error('Gagal menghapus');
        }
    };

    const openLog = async (item) => {
        setSelectedItem(item);
        await fetchLog(item.id);
        setShowLogModal(true);
        setShowLogForm(false);
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();

        // Konfirmasi kalau barang masuk pembelian baru
        if (logForm.type === 'in' && logForm.entry_type === 'purchase') {
            const totalCost = Number(logForm.quantity) * Number(selectedItem.unit_price);
            const confirmed = confirm(
                `Penambahan ${logForm.quantity} ${selectedItem.unit} ${selectedItem.name} senilai ${formatRupiah(totalCost)} akan dicatat sebagai pengeluaran kas di Cashflow. Lanjutkan?`
            );
            if (!confirmed) return;
        }

        try {
            await axios.post('/api/inventory/log', {
                inventoryId: selectedItem.id,
                ...logForm,
                quantity: Number(logForm.quantity)
            });
            toast.success(logForm.type === 'in' ? 'Barang masuk dicatat!' : 'Barang keluar dicatat!');
            setLogForm({ type: 'in', quantity: '', note: '', entry_type: 'purchase', log_date: new Date().toISOString().slice(0, 10) });
            setShowLogForm(false);
            await fetchLog(selectedItem.id);
            fetchItems();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mencatat');
        }
    };

    const totalValue = items.reduce((sum, i) => sum + Number(i.total_value), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Persediaan</h1>
                    <p className="text-slate-500 mt-1">Kelola stok ATK dan perlengkapan kantor</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setForm({ name: '', category: '', quantity: '', unit: '', unit_price: '' }); setShowForm(!showForm); setShowLogModal(false); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Tambah Item
                </button>
            </div>

            {/* Total Value Card */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
                <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Nilai Persediaan</p>
                <p className="text-4xl font-bold text-sky-600">{formatRupiah(totalValue)}</p>
                <p className="text-xs text-sky-500 mt-1">{items.length} jenis barang</p>
            </div>

            {/* Form Tambah/Edit */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                        {editingId ? 'Edit Item' : 'Tambah Item Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Barang</label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Contoh: Spidol Whiteboard"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kategori</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            >
                                <option value="">Pilih kategori...</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {!editingId && (
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah Awal</label>
                                <input
                                    type="number"
                                    value={form.quantity}
                                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                                    required
                                    placeholder="0"
                                    min="0"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Satuan</label>
                            <select
                                value={form.unit}
                                onChange={e => setForm({ ...form, unit: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            >
                                <option value="">Pilih satuan...</option>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Harga Satuan (Rp)</label>
                            <input
                                type="number"
                                value={form.unit_price}
                                onChange={e => setForm({ ...form, unit_price: e.target.value })}
                                required
                                placeholder="0"
                                min="0"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                            />
                            {form.unit_price && (
                                <span className="text-xs text-slate-400 mt-1 block">{formatRupiah(Number(form.unit_price))}</span>
                            )}
                        </div>
                        {!editingId && (
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Tipe Input</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" value="purchase" checked={form.entry_type === 'purchase'}
                                            onChange={() => setForm({ ...form, entry_type: 'purchase' })}
                                            className="accent-sky-500" />
                                        <span className="text-sm text-slate-700 font-medium">Pembelian Baru</span>
                                        <span className="text-xs text-slate-400">(ada uang keluar, masuk cashflow)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" value="opening_balance" checked={form.entry_type === 'opening_balance'}
                                            onChange={() => setForm({ ...form, entry_type: 'opening_balance' })}
                                            className="accent-sky-500" />
                                        <span className="text-sm text-slate-700 font-medium">Saldo Awal</span>
                                        <span className="text-xs text-slate-400">(barang sudah ada sebelumnya)</span>
                                    </label>
                                </div>
                                {form.entry_type === 'purchase' && (
                                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                                        ⚠️ Akan muncul konfirmasi sebelum dicatat ke cashflow sebagai pengeluaran {formatRupiah(Number(form.quantity) * Number(form.unit_price) || 0)}
                                    </div>
                                )}
                                {form.entry_type === 'opening_balance' && (
                                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
                                        ℹ️ Tidak masuk cashflow. Nilai persediaan tetap tercatat di neraca.
                                    </div>
                                )}
                            </div>
                        )}

                        {!editingId && form.entry_type === 'purchase' && (
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal Pembelian</label>
                                <input type="date" value={form.log_date}
                                    onChange={e => setForm({ ...form, log_date: e.target.value })}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>
                        )}
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold">Simpan</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabel Inventory */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Nama Barang</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Kategori</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Stok</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Harga Satuan</th>
                                <th className="px-3 sm:px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total Nilai</th>
                                <th className="px-3 sm:px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.length === 0 && (
                                <tr><td colSpan={6} className="text-center text-slate-400 py-12 italic">Belum ada item persediaan</td></tr>
                            )}
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-sky-400" />
                                            <span className="text-sm font-medium text-slate-800">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                            {item.category || '-'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                        <span className={cn(
                                            "text-sm font-bold whitespace-nowrap",
                                            Number(item.quantity) <= 5 ? "text-red-600" :
                                                Number(item.quantity) <= 10 ? "text-amber-600" : "text-slate-800"
                                        )}>
                                            {item.quantity} {item.unit}
                                        </span>
                                        {Number(item.quantity) <= 5 && (
                                            <span className="block text-[10px] text-red-500 mt-0.5">⚠️ Stok menipis</span>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 text-right whitespace-nowrap">{formatRupiah(item.unit_price)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-bold text-sky-600 text-right whitespace-nowrap">{formatRupiah(item.total_value)}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => openLog(item)}
                                                className="text-slate-450 hover:text-sky-500 transition-colors"
                                                title="Riwayat & Keluar Masuk"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button onClick={() => handleEdit(item)} className="text-slate-450 hover:text-sky-500 transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-slate-450 hover:text-red-500 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Riwayat & Input Keluar Masuk */}
            {showLogModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl z-10 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{selectedItem.name}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Stok saat ini: <span className="font-bold text-slate-800">{selectedItem.quantity} {selectedItem.unit}</span></p>
                            </div>
                            <button
                                onClick={() => setShowLogForm(!showLogForm)}
                                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                                <Plus size={14} /> Catat Keluar/Masuk
                            </button>
                        </div>

                        {/* Form log */}
                        {showLogForm && (
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <form onSubmit={handleLogSubmit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tipe</label>
                                            <select
                                                value={logForm.type}
                                                onChange={e => setLogForm({ ...logForm, type: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                            >
                                                <option value="in">Barang Masuk</option>
                                                <option value="out">Barang Keluar</option>
                                            </select>
                                        </div>
                                        {/* Hanya tampil kalau barang masuk */}
                                        {logForm.type === 'in' && (
                                            <>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Tipe Penambahan</label>
                                                    <div className="flex gap-3">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="radio" value="purchase" checked={logForm.entry_type === 'purchase'}
                                                                onChange={() => setLogForm({ ...logForm, entry_type: 'purchase' })}
                                                                className="accent-sky-500" />
                                                            <span className="text-sm text-slate-700">Pembelian Baru</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="radio" value="opening_balance" checked={logForm.entry_type === 'opening_balance'}
                                                                onChange={() => setLogForm({ ...logForm, entry_type: 'opening_balance' })}
                                                                className="accent-sky-500" />
                                                            <span className="text-sm text-slate-700">Saldo Awal</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal</label>
                                                    <input type="date" value={logForm.log_date}
                                                        onChange={e => setLogForm({ ...logForm, log_date: e.target.value })}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah</label>
                                            <input
                                                type="number"
                                                value={logForm.quantity}
                                                onChange={e => setLogForm({ ...logForm, quantity: e.target.value })}
                                                required
                                                min="1"
                                                placeholder="0"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan</label>
                                        <input
                                            value={logForm.note}
                                            onChange={e => setLogForm({ ...logForm, note: e.target.value })}
                                            placeholder="Keterangan tambahan..."
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowLogForm(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800">Batal</button>
                                        <button type="submit" className={cn("px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors", logForm.type === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600")}>
                                            {logForm.type === 'in' ? '+ Barang Masuk' : '- Barang Keluar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Log list */}
                        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                            {logs.length === 0 && (
                                <p className="text-center text-slate-400 py-8 italic text-sm">Belum ada riwayat</p>
                            )}
                            {logs.map(log => (
                                <div key={log.id} className={cn("flex items-center justify-between p-3 rounded-xl border", log.type === 'in' ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                                    <div className="flex items-center gap-2">
                                        {log.type === 'in' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-600" />}
                                        <div>
                                            <p className={cn("text-xs font-bold", log.type === 'in' ? "text-emerald-700" : "text-red-700")}>
                                                {log.type === 'in' ? '+ Masuk' : '- Keluar'} {log.quantity} {selectedItem.unit}
                                            </p>
                                            <p className="text-xs text-slate-500">{log.note || '-'} · {log.createdByName}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100">
                            <button onClick={() => setShowLogModal(false)} className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}