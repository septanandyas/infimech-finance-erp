import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Saldo() {
    const [data, setData] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    useEffect(() => {
        axios.get(`/api/saldo?year=${year}`)
            .then(r => setData(r.data.map(s => ({ ...s, name: MONTHS[s.month - 1] }))))
            .catch(console.error);
    }, [year]);

    const currentBalance = data.length > 0 ? data[data.length - 1]?.balance || 0 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Laporan Saldo</h1>
                    <p className="text-slate-500 mt-1">Posisi keuangan per bulan</p>
                </div>
                <select value={year} onChange={e => setYear(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6">
                <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Saldo Kumulatif {year}</p>
                <p className="text-4xl font-bold text-sky-600">{formatRupiah(currentBalance)}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 mb-6">Grafik Saldo Kumulatif</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
                        <Tooltip formatter={v => formatRupiah(v)} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="balance" name="Saldo" stroke="#0ea5e9" fill="url(#colorBalance)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">Bulan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Pemasukan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Pengeluaran</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Net</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Saldo Kumulatif</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">{row.name} {year}</td>
                                <td className="px-6 py-4 text-sm text-emerald-600 text-right">{formatRupiah(row.income)}</td>
                                <td className="px-6 py-4 text-sm text-red-600 text-right">{formatRupiah(row.expense)}</td>
                                <td className={`px-6 py-4 text-sm font-bold text-right ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(row.net)}</td>
                                <td className="px-6 py-4 text-sm text-sky-600 font-bold text-right">{formatRupiah(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}