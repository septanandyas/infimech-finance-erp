import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, FileText, Pencil, Eye, Download } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import InvoicePDF from '../components/InvoicePDF';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'text-slate-500 bg-slate-100 border-slate-300', icon: FileText },
    sent: { label: 'Terkirim', color: 'text-sky-600 bg-sky-50 border-sky-200', icon: Clock },
    paid: { label: 'Lunas', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle },
    overdue: { label: 'Jatuh Tempo', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle },
};

const TAX_OPTIONS = [
    { label: 'Tanpa Pajak', rate: 0, key: 'none' },
    { label: 'PPN 11%', rate: 11, key: 'PPN' },
    { label: 'PPh 2%', rate: 2, key: 'PPh' },
    { label: 'Custom', rate: null, key: 'custom' },
];

const EMPTY_FORM = {
    doc_type: 'INV', rev_number: '1', rev_version: 'A',
    projectId: '', client_name: '', due_date: '', notes: '', payment_terms: '',
    tax_label: 'PPN', tax_rate: 11, tax_key: 'PPN',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
};

export default function Invoice() {
    const [invoices, setInvoices] = useState([]);
    const [prospects, setProspects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`/api/invoice${filterStatus ? `?status=${filterStatus}` : ''}`);
            setInvoices(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchInvoices(); }, [filterStatus]);
    useEffect(() => { axios.get('/api/invoice/prospects').then(r => setProspects(r.data)).catch(() => { }); }, []);

    const updateItem = (index, field, value) => {
        const items = [...form.items];
        items[index][field] = value;
        if (field === 'quantity' || field === 'unit_price') {
            items[index].total = items[index].quantity * items[index].unit_price;
        }
        setForm({ ...form, items });
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0, total: 0 }] });
    const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

    const handleTaxChange = (key) => {
        const opt = TAX_OPTIONS.find(o => o.key === key);
        if (key === 'none') setForm({ ...form, tax_key: key, tax_label: '', tax_rate: 0 });
        else if (key === 'custom') setForm({ ...form, tax_key: key, tax_label: 'Pajak', tax_rate: 0 });
        else setForm({ ...form, tax_key: key, tax_label: opt.label.split(' ')[0], tax_rate: opt.rate });
    };

    const subtotal = form.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (form.tax_rate / 100);
    // Total = Subtotal + Pajak (harga final yang harus dibayar client)
    const total = subtotal + taxAmount;

    const resetForm = () => {
        setForm({ ...EMPTY_FORM, invoice_number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = async (inv) => {
        try {
            const res = await axios.get(`/api/invoice/${inv.id}`);
            const data = res.data;
            const taxKey = data.tax_rate == 11 ? 'PPN' : data.tax_rate == 2 ? 'PPh' : data.tax_rate == 0 ? 'none' : 'custom';
            setForm({
                invoice_number: data.invoice_number,
                projectId: data.projectId || '',
                client_name: data.client_name,
                due_date: data.due_date?.slice(0, 10) || '',
                notes: data.notes || '',
                payment_terms: data.payment_terms || '',
                tax_label: data.tax_label || 'PPN',
                tax_rate: data.tax_rate ?? 11,
                tax_key: taxKey,
                items: data.items?.length > 0 ? data.items : [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
            });
            setEditingId(inv.id);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch { toast.error('Gagal memuat data invoice'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, amount: subtotal, tax: taxAmount, total };
            if (editingId) {
                await axios.put(`/api/invoice/${editingId}`, payload);
                toast.success('Invoice diperbarui!');
            } else {
                await axios.post('/api/invoice', payload);
                toast.success('Invoice dibuat!');
            }
            resetForm();
            fetchInvoices();
        } catch { toast.error(editingId ? 'Gagal memperbarui invoice' : 'Gagal membuat invoice'); }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await axios.patch(`/api/invoice/${id}/status`, {
                status,
                paid_date: status === 'paid' ? new Date().toISOString().slice(0, 10) : null
            });
            toast.success('Status diperbarui!');
            fetchInvoices();
        } catch { toast.error('Gagal update status'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus invoice ini?')) return;
        try {
            await axios.delete(`/api/invoice/${id}`);
            toast.success('Invoice dihapus!');
            fetchInvoices();
        } catch { toast.error('Gagal menghapus'); }
    };

    return (
        <div className="space-y-6">
            {/* Preview Modal */}
            {previewInvoice && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200">
                            <span className="font-bold text-slate-800">{previewInvoice.invoice_number}</span>
                            <div className="flex items-center gap-3">
                                <PDFDownloadLink
                                    document={<InvoicePDF invoice={previewInvoice} />}
                                    fileName={`${previewInvoice.invoice_number}.pdf`}
                                >
                                    {({ loading }) => (
                                        <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                            <Download size={15} /> {loading ? 'Menyiapkan...' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                                <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold px-2">✕</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PDFViewer width="100%" height="100%" showToolbar={false}>
                                <InvoicePDF invoice={previewInvoice} />
                            </PDFViewer>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Invoice</h1>
                    <p className="text-slate-500 mt-1">Kelola tagihan ke client</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
                >
                    <Plus size={18} /> Buat Invoice
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {['', 'draft', 'sent', 'paid', 'overdue'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                            filterStatus === s ? "bg-sky-500 text-white border-sky-500" : "text-slate-500 border-slate-200 hover:border-sky-400"
                        )}>
                        {s === '' ? 'Semua' : STATUS_CONFIG[s].label}
                    </button>
                ))}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                        {editingId ? 'Edit Invoice' : 'Buat Invoice Baru'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3 grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kode Dok</label>
                                    <input value={form.doc_type} onChange={e => setForm({ ...form, doc_type: e.target.value })} placeholder="INV" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                    <p className="text-xs text-slate-400 mt-1">Contoh: INV, PROFORMA</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">No. Revisi</label>
                                    <input value={form.rev_number} onChange={e => setForm({ ...form, rev_number: e.target.value })} placeholder="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Versi Revisi</label>
                                    <input value={form.rev_version} onChange={e => setForm({ ...form, rev_version: e.target.value })} placeholder="A" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                    <p className="text-xs text-slate-400 mt-1">A = pertama, B = koreksi, dst</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Project (Opsional)</label>
                                <select value={form.projectId} onChange={e => {
                                    const p = prospects.find(p => p.no_project === e.target.value);
                                    setForm({ ...form, projectId: e.target.value, client_name: p ? p.client_name : form.client_name });
                                }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                    <option value="">Pilih project...</option>
                                    {prospects.map(p => <option key={p.no_project} value={p.no_project}>{p.name_project}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Client</label>
                                <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required placeholder="PT. ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jatuh Tempo</label>
                                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Keterangan Pembayaran</label>
                                <input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="Contoh: Transfer ke BCA 1234567890 a/n PT Infimech" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan (Opsional)</label>
                            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan untuk client..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                        </div>

                        {/* Items */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Item Pekerjaan</label>
                            <div className="space-y-2">
                                {form.items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Deskripsi pekerjaan" className="col-span-5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} placeholder="Harga satuan" className="col-span-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                        <div className="col-span-1 text-xs text-slate-500 text-right">{formatRupiah(item.total)}</div>
                                        <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-slate-300 hover:text-red-500 transition-colors text-center"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addItem} className="mt-2 text-sm text-sky-600 hover:text-sky-500 flex items-center gap-1"><Plus size={14} /> Tambah Item</button>
                        </div>

                        {/* Pajak */}
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Pajak</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {TAX_OPTIONS.map(opt => (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => handleTaxChange(opt.key)}
                                        className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                                            form.tax_key === opt.key ? "bg-sky-500 text-white border-sky-500" : "text-slate-500 border-slate-200 hover:border-sky-400"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {form.tax_key === 'custom' && (
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Label Pajak</label>
                                        <input value={form.tax_label} onChange={e => setForm({ ...form, tax_label: e.target.value })} placeholder="Contoh: PPnBM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Persentase (%)</label>
                                        <input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} min="0" max="100" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Total */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-800 font-bold text-base">
                                <span>Total</span>
                                <span className="text-sky-600">{formatRupiah(total)}</span>
                            </div>
                            {form.tax_rate > 0 && (
                                <p className="text-xs text-slate-400 italic pt-1">
                                    *Harga sudah termasuk {form.tax_label} {form.tax_rate}%
                                    {taxAmount > 0 && ` (Rp ${taxAmount.toLocaleString('id-ID')})`}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800">Batal</button>
                            <button type="submit" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold">
                                {editingId ? 'Perbarui Invoice' : 'Simpan Invoice'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {invoices.length === 0 && <div className="text-center text-slate-400 py-16 italic">Belum ada invoice</div>}
                {invoices.map(inv => {
                    const statusCfg = STATUS_CONFIG[inv.status];
                    return (
                        <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-sm">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-slate-800">{inv.invoice_number}</span>
                                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-bold flex items-center gap-1", statusCfg.color)}>
                                        <statusCfg.icon size={11} /> {statusCfg.label}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">{inv.client_name} {inv.projectName && `· ${inv.projectName}`}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Jatuh tempo: {formatDate(inv.due_date)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-xl font-bold text-sky-600">{formatRupiah(inv.total)}</p>
                                <select
                                    value={inv.status}
                                    onChange={e => handleStatusChange(inv.id, e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500"
                                >
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                                <button onClick={() => setPreviewInvoice(inv)} className="text-slate-400 hover:text-sky-500 transition-colors" title="Preview & Download PDF">
                                    <Eye size={16} />
                                </button>
                                <button onClick={() => handleEdit(inv)} className="text-slate-400 hover:text-sky-500 transition-colors" title="Edit">
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => handleDelete(inv.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Hapus">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}