import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, FileText, Pencil, Eye, Download, CreditCard, History } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/utils';
import { cn } from '../lib/utils';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import InvoicePDF from '../components/InvoicePDF';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'text-slate-500 bg-slate-100 border-slate-300', icon: FileText },
    sent: { label: 'Terkirim', color: 'text-sky-600 bg-sky-50 border-sky-200', icon: Clock },
    acc: { label: 'ACC/Deal', color: 'text-violet-600 bg-violet-50 border-violet-200', icon: CheckCircle },
    partial: { label: 'Sebagian Dibayar', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: CreditCard },
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
    projectId: '', contractId: '', client_name: '', due_date: '', notes: '', payment_terms: '',
    tax_label: 'PPN', tax_rate: 11, tax_key: 'PPN',
    invoice_type: 'termin',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
};

export default function Invoice() {
    const [invoices, setInvoices] = useState([]);
    const [prospects, setProspects] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [paymentModal, setPaymentModal] = useState(null); // invoice yang sedang dibayar
    const [payments, setPayments] = useState([]);
    const [paymentForm, setPaymentForm] = useState({
        amount: '', payment_date: new Date().toISOString().slice(0, 10),
        payment_type: 'dp', notes: ''
    });
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({
        amount: '', payment_date: '', payment_type: 'dp', notes: ''
    });

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`/api/invoice${filterStatus ? `?status=${filterStatus}` : ''}`);
            setInvoices(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchInvoices(); }, [filterStatus]);
    useEffect(() => {
        axios.get('/api/invoice/prospects').then(r => setProspects(r.data)).catch(() => { });
        axios.get('/api/contract').then(r => setContracts(r.data)).catch(() => { });
    }, []);

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
                contractId: data.contractId || '',
                invoice_type: data.invoice_type || 'termin',
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

    const handleStatusChange = async (inv, status) => {
        try {
            // If marking as paid, send the remaining amount as payment to keep cashflow/piutang consistent
            if (status === 'paid') {
                const remaining = Number(inv.total || 0) - Number(inv.paid_amount || 0);
                if (remaining > 0) {
                    const ok = window.confirm(`Tandai lunas dan catat pembayaran sisa ${formatRupiah(remaining)} sebagai Pelunasan?`);
                    if (!ok) {
                        fetchInvoices(); // revert select
                        return;
                    }
                    await axios.patch(`/api/invoice/${inv.id}/status`, {
                        status,
                        paid_date: new Date().toISOString().slice(0, 10),
                        amount: remaining,
                        payment_type: 'pelunasan'
                    });
                    toast.success('Status diperbarui dan pembayaran dicatat!');
                    fetchInvoices();
                    return;
                }
            }

            await axios.patch(`/api/invoice/${inv.id}/status`, {
                status,
                paid_date: status === 'paid' ? new Date().toISOString().slice(0, 10) : null
            });
            toast.success('Status diperbarui!');
            fetchInvoices();
        } catch (err) { toast.error(err.response?.data?.message || 'Gagal update status'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus invoice ini?')) return;
        try {
            await axios.delete(`/api/invoice/${id}`);
            toast.success('Invoice dihapus!');
            fetchInvoices();
        } catch { toast.error('Gagal menghapus'); }
    };

    const openPaymentModal = async (inv) => {
        setPaymentModal(inv);
        try {
            const res = await axios.get(`/api/invoice/${inv.id}/payments`);
            setPayments(res.data);
        } catch { setPayments([]); }
        setPaymentForm({
            amount: '', payment_date: new Date().toISOString().slice(0, 10),
            payment_type: 'dp', notes: ''
        });
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`/api/invoice/${paymentModal.id}/payments`, paymentForm);
            toast.success('Pembayaran dicatat!');
            fetchInvoices();
            // Refresh modal dengan data terbaru
            const paymentsRes = await axios.get(`/api/invoice/${paymentModal.id}/payments`);
            setPayments(paymentsRes.data);
            // Update paymentModal dengan status terbaru
            const invRes = await axios.get(`/api/invoice/${paymentModal.id}`);
            setPaymentModal(invRes.data);
            setPaymentForm({ ...paymentForm, amount: '', notes: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran');
        }
    };

    const handleEditPayment = (p) => {
        setEditingPaymentId(p.id);
        setEditPaymentForm({
            amount: p.amount,
            payment_date: p.payment_date?.slice(0, 10),
            payment_type: p.payment_type,
            notes: p.notes || ''
        });
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/invoice/${paymentModal.id}/payments/${editingPaymentId}`, editPaymentForm);
            toast.success('Pembayaran diperbarui!');
            setEditingPaymentId(null);
            fetchInvoices();
            const paymentsRes = await axios.get(`/api/invoice/${paymentModal.id}/payments`);
            setPayments(paymentsRes.data);
            const invRes = await axios.get(`/api/invoice/${paymentModal.id}`);
            setPaymentModal(invRes.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal memperbarui pembayaran');
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (!confirm('Hapus pembayaran ini?')) return;
        try {
            await axios.delete(`/api/invoice/${paymentModal.id}/payments/${paymentId}`);
            toast.success('Pembayaran dihapus!');
            fetchInvoices();
            const paymentsRes = await axios.get(`/api/invoice/${paymentModal.id}/payments`);
            setPayments(paymentsRes.data);
            const invRes = await axios.get(`/api/invoice/${paymentModal.id}`);
            setPaymentModal(invRes.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus pembayaran');
        }
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
                {['', 'draft', 'sent', 'acc', 'partial', 'paid', 'overdue'].map(s => {
                    const activeColors = {
                        '': 'bg-slate-500 text-white border-slate-500',
                        'draft': 'bg-slate-400 text-white border-slate-400',
                        'sent': 'bg-sky-500 text-white border-sky-500',
                        'acc': 'bg-violet-500 text-white border-violet-500',
                        'partial': 'bg-amber-500 text-white border-amber-500',
                        'paid': 'bg-emerald-500 text-white border-emerald-500',
                        'overdue': 'bg-red-500 text-white border-red-500',
                    };
                    const inactiveColors = {
                        '': 'text-slate-500 border-slate-200 hover:border-slate-400',
                        'draft': 'text-slate-400 border-slate-200 hover:border-slate-400',
                        'sent': 'text-sky-500 border-sky-200 hover:border-sky-400',
                        'acc': 'text-violet-500 border-violet-200 hover:border-violet-400',
                        'partial': 'text-amber-500 border-amber-200 hover:border-amber-400',
                        'paid': 'text-emerald-500 border-emerald-200 hover:border-emerald-400',
                        'overdue': 'text-red-500 border-red-200 hover:border-red-400',
                    };
                    return (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                filterStatus === s ? activeColors[s] : inactiveColors[s]
                            )}>
                            {s === '' ? 'Semua' : STATUS_CONFIG[s]?.label}
                        </button>
                    );
                })}
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
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Kontrak (Opsional)</label>
                                <select value={form.contractId} onChange={e => setForm({ ...form, contractId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                                    <option value="">Pilih kontrak...</option>
                                    {contracts
                                        .filter(c => !form.projectId || c.projectId === form.projectId)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.contract_number ? `${c.contract_number} — ` : ''}{c.projectName} ({formatRupiah(c.contract_value)})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nama Client</label>
                                <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required placeholder="PT. ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tipe Invoice</label>
                                <select
                                    value={form.invoice_type || 'termin'}
                                    onChange={e => setForm({ ...form, invoice_type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                >
                                    <option value="dp">Down Payment (DP)</option>
                                    <option value="termin">Termin</option>
                                    <option value="pelunasan">Pelunasan</option>
                                </select>
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
                                <div className="text-right">
                                    <p className="text-xl font-bold text-sky-600">{formatRupiah(inv.total)}</p>
                                    {inv.paid_amount > 0 && (
                                        <p className="text-xs text-slate-400">
                                            Terbayar: <span className="text-emerald-600 font-medium">{formatRupiah(inv.paid_amount)}</span>
                                            {' · '}Sisa: <span className="text-red-500 font-medium">{formatRupiah(inv.total - inv.paid_amount)}</span>
                                        </p>
                                    )}
                                </div>
                                <select
                                    value={inv.status}
                                    onChange={e => handleStatusChange(inv, e.target.value)}
                                    disabled={['partial', 'paid'].includes(inv.status)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {Object.entries(STATUS_CONFIG)
                                        .filter(([k]) => !['partial', 'paid'].includes(k))
                                        .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                                <button onClick={() => openPaymentModal(inv)} className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                    ['acc', 'partial'].includes(inv.status)
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "text-slate-400 hover:text-violet-500 border border-slate-200"
                                )} title={['acc', 'partial'].includes(inv.status) ? "Catat Pembayaran" : "Riwayat Pembayaran"}>
                                    {['acc', 'partial'].includes(inv.status) ? <><CreditCard size={13} /> Bayar</> : <History size={15} />}
                                </button>
                                <button onClick={() => setPreviewInvoice(inv)} className="text-slate-400 hover:text-sky-500 transition-colors" title="Preview PDF">
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
            {/* Modal Pembayaran */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800">{paymentModal.invoice_number}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{paymentModal.client_name}</p>
                                <div className="flex gap-4 mt-2 text-xs">
                                    <span>Total: <span className="font-bold text-slate-800">{formatRupiah(paymentModal.total)}</span></span>
                                    <span>Terbayar: <span className="font-bold text-emerald-600">{formatRupiah(paymentModal.paid_amount || 0)}</span></span>
                                    <span>Sisa: <span className="font-bold text-red-500">{formatRupiah(paymentModal.total - (paymentModal.paid_amount || 0))}</span></span>
                                </div>
                            </div>
                            <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2">✕</button>
                        </div>

                        {/* Form tambah pembayaran */}
                        {['acc', 'partial'].includes(paymentModal.status) && (
                            <div className="p-5 border-b border-slate-100 bg-slate-50">
                                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Catat Pembayaran Baru</h4>
                                <form onSubmit={handleAddPayment} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tipe</label>
                                            <select
                                                value={paymentForm.payment_type}
                                                onChange={e => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                            >
                                                <option value="dp">Down Payment</option>
                                                <option value="termin">Termin</option>
                                                <option value="pelunasan">Pelunasan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Tanggal</label>
                                            <input
                                                type="date"
                                                value={paymentForm.payment_date}
                                                onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                required
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Jumlah (Rp)</label>
                                        <input
                                            type="number"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            required
                                            placeholder="0"
                                            min="1"
                                            max={paymentModal.total - (paymentModal.paid_amount || 0)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                        />
                                        {paymentForm.amount && (
                                            <span className="text-xs text-slate-400 mt-0.5 block">{formatRupiah(Number(paymentForm.amount))}</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Catatan</label>
                                        <input
                                            value={paymentForm.notes}
                                            onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                            placeholder="Keterangan pembayaran..."
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">
                                            Simpan Pembayaran
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Riwayat pembayaran */}
                        <div className="p-5 max-h-64 overflow-y-auto">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Riwayat Pembayaran</h4>
                            {payments.length === 0 ? (
                                <p className="text-slate-400 text-sm italic text-center py-4">Belum ada pembayaran</p>
                            ) : (
                                <div className="space-y-2">
                                    {payments.map(p => (
                                        <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            {editingPaymentId === p.id ? (
                                                <form onSubmit={handleUpdatePayment} className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <select value={editPaymentForm.payment_type} onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_type: e.target.value })}
                                                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500">
                                                            <option value="dp">Down Payment</option>
                                                            <option value="termin">Termin</option>
                                                            <option value="pelunasan">Pelunasan</option>
                                                        </select>
                                                        <input type="date" value={editPaymentForm.payment_date} onChange={e => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })}
                                                            required className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500" />
                                                    </div>
                                                    <input type="number" value={editPaymentForm.amount} onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                                                        required className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500" />
                                                    <input value={editPaymentForm.notes} onChange={e => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
                                                        placeholder="Catatan..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-sky-500" />
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => setEditingPaymentId(null)} className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800">Batal</button>
                                                        <button type="submit" className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold">Simpan</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {p.payment_type === 'dp' ? 'Down Payment' : p.payment_type === 'termin' ? 'Termin' : 'Pelunasan'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">{formatDate(p.payment_date)} · {p.createdByName}</p>
                                                        {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-emerald-600">{formatRupiah(p.amount)}</span>
                                                        <button onClick={() => handleEditPayment(p)} className="text-slate-300 hover:text-sky-500 transition-colors">
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button onClick={() => handleDeletePayment(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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