import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';
import { cn } from '../lib/utils';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const DiffCell = ({ current, previous, isExpense }) => {
    const diff = current - previous;
    const isPositive = isExpense ? diff <= 0 : diff >= 0;
    return (
        <td className={cn("px-4 py-3 text-sm font-medium text-right", isPositive ? "text-emerald-600" : "text-red-600")}>
            {diff >= 0 ? '+' : ''}{formatRupiah(diff)}
        </td>
    );
};

const LRRow = ({ label, current, previous, bold, indent, isExpense, isTotal }) => (
    <tr className={cn("border-b border-slate-100", bold || isTotal ? "bg-slate-50" : "")}>
        <td className={cn(
            "px-4 py-3 text-sm text-slate-600",
            bold || isTotal ? "font-bold text-slate-800" : "",
            indent ? "pl-8" : "",
            isTotal ? "uppercase tracking-wide" : ""
        )}>{label}</td>
        <td className={cn("px-4 py-3 text-sm text-right", bold || isTotal ? "font-bold text-slate-800" : "text-slate-600")}>{formatRupiah(current)}</td>
        <td className={cn("px-4 py-3 text-sm text-right", bold || isTotal ? "font-bold text-slate-800" : "text-slate-600")}>{formatRupiah(previous)}</td>
        <DiffCell current={current} previous={previous} isExpense={isExpense} />
    </tr>
);

export default function LabaRugi() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/labarugi?month=${month}&year=${year}`);
                setData(res.data);
            } catch { console.error('Gagal fetch laba rugi'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [month, year]);

    if (loading) return <div className="text-slate-500 text-center py-20">Loading...</div>;
    if (!data) return <div className="text-slate-500 text-center py-20">Gagal memuat data</div>;

    const { current, previous } = data;
    const isProfit = Number(current.labaRugiBersih) >= 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Laporan Laba Rugi</h1>
                    <p className="text-slate-500 mt-1">Pendapatan dan beban periode berjalan</p>
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(current.totalPendapatan)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Beban</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(current.totalHpp + current.totalBeban)}</p>
                </div>
                <div className={cn("rounded-2xl p-4 border", isProfit ? "bg-sky-50 border-sky-200" : "bg-amber-50 border-amber-200")}>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isProfit ? "text-sky-600" : "text-amber-600")}>
                        Laba Bersih
                    </p>
                    <p className={cn("text-2xl font-bold", isProfit ? "text-sky-600" : "text-amber-600")}>
                        {formatRupiah(current.labaRugiBersih)}
                    </p>
                </div>
            </div>

            {/* Tabel L/R */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-left w-2/5">Keterangan</th>
                            <th className="px-4 py-4 text-xs font-bold text-sky-600 uppercase text-right">{MONTHS[month - 1]} {year}</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">{MONTHS[prevMonth - 1]} {prevYear}</th>
                            <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">Selisih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* PENDAPATAN */}
                        <tr className="bg-emerald-50">
                            <td colSpan={4} className="px-4 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">PENDAPATAN</td>
                        </tr>
                        {current.pendapatan.map((p, i) => (
                            <LRRow key={i} label={p.name} current={p.amount}
                                previous={previous.pendapatan[i]?.amount || 0} indent />
                        ))}
                        <LRRow label="TOTAL PENDAPATAN" current={current.totalPendapatan} previous={previous.totalPendapatan} bold isTotal />

                        {/* HPP */}
                        <tr className="bg-orange-50">
                            <td colSpan={4} className="px-4 py-2 text-xs font-bold text-orange-700 uppercase tracking-wider">HARGA POKOK JASA</td>
                        </tr>
                        {current.hpp.map((h, i) => (
                            <LRRow key={i} label={h.name} current={h.amount}
                                previous={previous.hpp[i]?.amount || 0} indent isExpense />
                        ))}
                        <LRRow label="TOTAL HPP" current={current.totalHpp} previous={previous.totalHpp} bold isTotal isExpense />

                        {/* LABA KOTOR */}
                        <tr className="bg-sky-50">
                            <td className="px-4 py-3 text-sm font-bold text-sky-800 uppercase tracking-wide">
                                LABA KOTOR
                                <span className="text-xs font-normal text-slate-500 ml-2">(Pendapatan - Harga Pokok Jasa)</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-sky-700 text-right">{formatRupiah(current.labaKotor)}</td>
                            <td className="px-4 py-3 text-sm font-bold text-sky-700 text-right">{formatRupiah(previous.labaKotor)}</td>
                            <DiffCell current={current.labaKotor} previous={previous.labaKotor} />
                        </tr>

                        {/* BEBAN OPERASIONAL */}
                        <tr className="bg-red-50">
                            <td colSpan={4} className="px-4 py-2 text-xs font-bold text-red-700 uppercase tracking-wider">BEBAN OPERASIONAL</td>
                        </tr>
                        {current.beban.map((b, i) => (
                            <LRRow key={i} label={b.name} current={b.amount}
                                previous={previous.beban[i]?.amount || 0} indent isExpense />
                        ))}
                        <LRRow label="TOTAL BEBAN OPERASIONAL" current={current.totalBeban} previous={previous.totalBeban} bold isTotal isExpense />

                        {/* LAIN-LAIN */}
                        {current.lainLain && (
                            <>
                                <tr className="bg-slate-50">
                                    <td colSpan={4} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">PENDAPATAN/BEBAN LAIN-LAIN</td>
                                </tr>
                                {current.lainLain.map((l, i) => (
                                    <LRRow key={i} label={l.name} current={l.amount}
                                        previous={previous.lainLain?.[i]?.amount || 0} indent />
                                ))}
                                <LRRow label="TOTAL LAIN-LAIN" current={current.totalLainLain} previous={previous.totalLainLain} bold isTotal />
                            </>
                        )}

                        {/* LABA BERSIH */}
                        <tr className={cn(current.labaRugiBersih >= 0 ? "bg-emerald-50" : "bg-amber-50")}>
                            <td className="px-4 py-4 text-sm font-bold uppercase tracking-wide text-slate-800">
                                LABA BERSIH
                            </td>
                            <td className={cn("px-4 py-4 text-sm font-bold text-right", current.labaRugiBersih >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {formatRupiah(current.labaRugiBersih)}
                            </td>
                            <td className={cn("px-4 py-4 text-sm font-bold text-right", previous.labaRugiBersih >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {formatRupiah(previous.labaRugiBersih)}
                            </td>
                            <DiffCell current={current.labaRugiBersih} previous={previous.labaRugiBersih} />
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}