import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';
import { cn } from '../lib/utils';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function PerubahanModal() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [neraca, setNeraca] = useState(null);
    const [labaRugi, setLabaRugi] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [neracaRes, lrRes] = await Promise.all([
                    axios.get(`/api/neraca?month=${month}&year=${year}`),
                    axios.get(`/api/labarugi?month=${month}&year=${year}`),
                ]);
                setNeraca(neracaRes.data);
                setLabaRugi(lrRes.data);
            } catch { console.error('Gagal fetch data perubahan modal'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [month, year]);

    if (loading) return <div className="text-slate-500 text-center py-20">Loading...</div>;
    if (!neraca || !labaRugi) return <div className="text-slate-500 text-center py-20">Gagal memuat data</div>;

    const modalAwal = Number(neraca.previous.modal.total) || 0;
    const labaRugiBerjalan = Number(labaRugi.current.labaRugiBersih) || 0;
    const modalAkhirHitung = modalAwal + labaRugiBerjalan;
    const modalAkhirNeraca = Number(neraca.current.modal.total) || 0;
    const selisih = modalAkhirNeraca - modalAkhirHitung;
    const isProfit = labaRugiBerjalan >= 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Laporan Perubahan Modal</h1>
                    <p className="text-slate-500 mt-1">Modal awal, laba/rugi berjalan, dan modal akhir periode</p>
                </div>
                <div className="flex gap-3">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                        {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Modal Awal</p>
                    <p className="text-2xl font-bold text-slate-700">{formatRupiah(modalAwal)}</p>
                </div>
                <div className={cn("rounded-2xl p-4 border", isProfit ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200")}>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isProfit ? "text-emerald-600" : "text-amber-600")}>
                        Laba Berjalan
                    </p>
                    <p className={cn("text-2xl font-bold", isProfit ? "text-emerald-600" : "text-amber-600")}>
                        {formatRupiah(labaRugiBerjalan)}
                    </p>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Modal Akhir</p>
                    <p className="text-2xl font-bold text-sky-700">{formatRupiah(modalAkhirHitung)}</p>
                </div>
            </div>

            {/* Tabel Perubahan Modal */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-left w-3/5">Keterangan</th>
                            <th className="px-4 py-4 text-xs font-bold text-sky-600 uppercase text-right">{MONTHS[month - 1]} {year}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-100">
                            <td className="px-4 py-3 text-sm text-slate-600">Modal Awal Periode</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-600">{formatRupiah(modalAwal)}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                            <td className="px-4 py-3 text-sm text-slate-600">
                                Laba Bersih Periode Berjalan
                            </td>
                            <td className={cn("px-4 py-3 text-sm text-right", isProfit ? "text-emerald-600" : "text-red-600")}>
                                {formatRupiah(labaRugiBerjalan)}
                            </td>
                        </tr>
                        <tr className="bg-sky-50">
                            <td className="px-4 py-4 text-sm font-bold uppercase tracking-wide text-sky-800">Modal Akhir Periode</td>
                            <td className="px-4 py-4 text-sm font-bold text-right text-sky-700">{formatRupiah(modalAkhirHitung)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {Math.abs(selisih) > 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                    ⚠ Ada selisih {formatRupiah(Math.abs(selisih))} antara Modal Akhir hasil perhitungan (Modal Awal + Laba/Rugi Berjalan)
                    dengan Modal Akhir dari Neraca (Total Aset − Total Kewajiban) periode ini. Kemungkinan ada transaksi yang
                    memengaruhi neraca tapi tidak melalui Cashflow/Jurnal L-R periode berjalan — perlu dicek lebih lanjut.
                </div>
            )}
        </div>
    );
}