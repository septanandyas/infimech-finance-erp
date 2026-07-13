import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function BukuBesar() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await axios.get(`/api/ledger?month=${month}&year=${year}`);
                setEntries(res.data || []);
            } catch (error) {
                console.error(error);
            }
        };
        fetchLedger();
    }, [month, year]);

    const summary = useMemo(() => {
        return entries.reduce((acc, row) => {
            acc.debit += Number(row.debit || 0);
            acc.credit += Number(row.credit || 0);
            return acc;
        }, { debit: 0, credit: 0 });
    }, [entries]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Buku Besar</h1>
                    <p className="text-slate-500 mt-1">Lihat transaksi akuntansi yang terintegrasi dari kas, invoice, dan unearned revenue</p>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Debit</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(summary.debit)}</p>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Kredit</p>
                    <p className="text-2xl font-bold text-sky-600">{formatRupiah(summary.credit)}</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Akun</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ref</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Debit</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Kredit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center text-slate-400 py-12 italic">Belum ada data buku besar untuk periode ini</td>
                            </tr>
                        )}
                        {entries.map((row, index) => (
                            <tr key={`${row.reference}-${index}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-600">{row.date}</td>
                                <td className="px-4 py-3 text-slate-700 font-medium">{row.account}</td>
                                <td className="px-4 py-3 text-slate-600">{row.description}</td>
                                <td className="px-4 py-3 text-slate-500">{row.reference}</td>
                                <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(row.debit || 0)}</td>
                                <td className="px-4 py-3 text-right text-sky-600">{formatRupiah(row.credit || 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
