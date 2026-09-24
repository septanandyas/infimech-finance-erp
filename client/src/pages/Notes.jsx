import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    StickyNote, Plus, Search, X, Edit2, Trash2,
    AlertCircle, Lightbulb, Eye, Tag, Clock, User, Save, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KATEGORI_LIST = ['Semua', 'Masalah', 'Temuan', 'Ide', 'Lainnya'];

const KATEGORI_CONFIG = {
    Masalah: {
        badge: 'bg-red-100 text-red-700',
        border: 'border-red-200',
        bg: 'bg-red-50',
        icon: AlertCircle,
    },
    Temuan: {
        badge: 'bg-amber-100 text-amber-700',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        icon: Eye,
    },
    Ide: {
        badge: 'bg-sky-100 text-sky-700',
        border: 'border-sky-200',
        bg: 'bg-sky-50',
        icon: Lightbulb,
    },
    Lainnya: {
        badge: 'bg-slate-100 text-slate-600',
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        icon: Tag,
    },
};

function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Modal Tambah / Edit ─── */
function NoteModal({ open, onClose, onSaved, existing }) {
    const [judul, setJudul] = useState('');
    const [isi, setIsi] = useState('');
    const [kategori, setKategori] = useState('Lainnya');
    const [saving, setSaving] = useState(false);
    const judulRef = useRef(null);

    useEffect(() => {
        if (open) {
            setJudul(existing?.judul || '');
            setIsi(existing?.isi || '');
            setKategori(existing?.kategori || 'Lainnya');
            setTimeout(() => judulRef.current?.focus(), 80);
        }
    }, [open, existing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!judul.trim() || !isi.trim()) { toast.error('Judul dan isi wajib diisi'); return; }
        setSaving(true);
        try {
            if (existing) {
                await axios.put(`/api/notes/${existing.id}`, { judul, isi, kategori });
                toast.success('Catatan berhasil diperbarui');
            } else {
                await axios.post('/api/notes', { judul, isi, kategori });
                toast.success('Catatan berhasil disimpan');
            }
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan catatan');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <StickyNote size={18} className="text-sky-600" />
                        <h2 className="font-bold text-slate-800 text-base">
                            {existing ? 'Edit Catatan' : 'Catatan Baru'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-lg p-1 hover:bg-slate-200">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Judul */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Judul <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={judulRef}
                            value={judul}
                            onChange={e => setJudul(e.target.value)}
                            placeholder="Judul catatan..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition placeholder-slate-400"
                        />
                    </div>

                    {/* Kategori pills */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Kategori</label>
                        <div className="flex flex-wrap gap-2">
                            {['Masalah', 'Temuan', 'Ide', 'Lainnya'].map(k => {
                                const cfg = KATEGORI_CONFIG[k];
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setKategori(k)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                            kategori === k
                                                ? `${cfg.badge} ${cfg.border} shadow-sm scale-105`
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        <Icon size={12} />
                                        {k}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Isi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Isi Catatan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={isi}
                            onChange={e => setIsi(e.target.value)}
                            placeholder="Tulis catatan Anda di sini..."
                            rows={6}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition resize-none placeholder-slate-400"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition disabled:opacity-60">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            {saving ? 'Menyimpan...' : (existing ? 'Perbarui' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Modal Detail ─── */
function NoteDetailModal({ note, onClose, onEdit, onDelete, currentUser }) {
    if (!note) return null;
    const cfg = KATEGORI_CONFIG[note.kategori] || KATEGORI_CONFIG.Lainnya;
    const Icon = cfg.icon;
    const isOwner = currentUser?.username === note.penulisName || currentUser?.role === 'Superadmin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
                <div className={`px-6 py-4 border-b ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge} mb-2`}>
                                <Icon size={11} />{note.kategori}
                            </span>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">{note.judul}</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition rounded-lg p-1 hover:bg-white/60">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{note.isi}</p>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <User size={12} />
                            <strong className="text-slate-600">{note.penulisName}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatTanggal(note.createdAt)}
                        </span>
                    </div>

                    {isOwner && (
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => { onClose(); onEdit(note); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-sky-200 text-sky-600 hover:bg-sky-50 transition">
                                <Edit2 size={14} /> Edit
                            </button>
                            <button
                                onClick={() => onDelete(note)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition">
                                <Trash2 size={14} /> Hapus
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Kartu Catatan ─── */
function NoteCard({ note, onClick }) {
    const cfg = KATEGORI_CONFIG[note.kategori] || KATEGORI_CONFIG.Lainnya;
    const Icon = cfg.icon;
    return (
        <div
            onClick={() => onClick(note)}
            className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
        >
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge} mb-3`}>
                <Icon size={11} />{note.kategori}
            </span>
            <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-sky-700 transition-colors">
                {note.judul}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">{note.isi}</p>
            <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-700">{note.penulisName}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock size={10} />{formatTanggal(note.createdAt)}
                </p>
            </div>
        </div>
    );
}

/* ─── Halaman Utama ─── */
export default function Notes() {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('Semua');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [detailNote, setDetailNote] = useState(null);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const params = {};
            if (kategoriFilter !== 'Semua') params.kategori = kategoriFilter;
            if (search.trim()) params.search = search.trim();
            const res = await axios.get('/api/notes', { params });
            setNotes(res.data);
        } catch (err) {
            toast.error('Gagal memuat catatan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotes(); }, [kategoriFilter]); // eslint-disable-line

    // Debounce search
    useEffect(() => {
        const t = setTimeout(fetchNotes, 400);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line

    const handleDelete = async (note) => {
        if (!window.confirm(`Hapus catatan "${note.judul}"?`)) return;
        try {
            await axios.delete(`/api/notes/${note.id}`);
            toast.success('Catatan dihapus');
            setDetailNote(null);
            fetchNotes();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Catatan</h1>
                    <p className="text-slate-500 mt-1 text-sm">Catat masalah, temuan, ide, dan informasi penting lainnya</p>
                </div>
                <button
                    id="btn-catatan-baru"
                    onClick={() => { setEditingNote(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                >
                    <Plus size={16} /> Catatan Baru
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari judul, isi, atau penulis..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition placeholder-slate-400 bg-white"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
                    {KATEGORI_LIST.map(k => (
                        <button key={k} onClick={() => setKategoriFilter(k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                kategoriFilter === k
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}>
                            {k}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-sky-500" />
                </div>
            ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <StickyNote size={48} className="mb-4 text-slate-200" />
                    <p className="font-semibold text-slate-500">Belum ada catatan</p>
                    <p className="text-sm mt-1">Klik "Catatan Baru" untuk mulai mencatat</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {notes.map(note => (
                        <NoteCard key={note.id} note={note} onClick={setDetailNote} />
                    ))}
                </div>
            )}

            {!loading && notes.length > 0 && (
                <p className="text-xs text-slate-400 text-right">Menampilkan {notes.length} catatan</p>
            )}

            <NoteModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingNote(null); }}
                onSaved={() => { setModalOpen(false); setEditingNote(null); fetchNotes(); }}
                existing={editingNote}
            />
            <NoteDetailModal
                note={detailNote}
                onClose={() => setDetailNote(null)}
                onEdit={note => { setEditingNote(note); setModalOpen(true); }}
                onDelete={handleDelete}
                currentUser={user}
            />
        </div>
    );
}
