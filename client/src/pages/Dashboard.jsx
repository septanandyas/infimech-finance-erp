import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';
import { formatRupiah } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
    const now = new Date();
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netCashflow: 0 });
    const [saldoData, setSaldoData] = useState([]);
    const [invoiceStats, setInvoiceStats] = useState({ paid: 0, outstanding: 0 });
    const [loading, setLoading] = useState(true);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [summaryRes, saldoRes, invoicesRes] = await Promise.all([
                    axios.get(`/api/cashflow/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
                    axios.get(`/api/saldo?year=${now.getFullYear()}`),
                    axios.get('/api/invoice')
                ]);
                setSummary(summaryRes.data);
                setSaldoData(saldoRes.data.map(s => ({ ...s, name: MONTHS[s.month - 1] })));
                const paid = invoicesRes.data.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0);
                const outstanding = invoicesRes.data.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + Number(i.total), 0);
                setInvoiceStats({ paid, outstanding });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return <div className="text-slate-500 text-center py-20">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">Ringkasan keuangan bulan {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pemasukan Bulan Ini', value: formatRupiah(summary.totalIncome), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                    { label: 'Pengeluaran Bulan Ini', value: formatRupiah(summary.totalExpense), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                    { label: 'Invoice Terbayar', value: formatRupiah(invoiceStats.paid), icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
                    { label: 'Invoice Outstanding', value: formatRupiah(invoiceStats.outstanding), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                ].map((card, i) => (
                    <div key={i} className={`p-5 rounded-2xl border ${card.bg}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <card.icon size={20} className={card.color} />
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{card.label}</p>
                        </div>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-800 mb-6">Cashflow Tahunan {now.getFullYear()}</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={saldoData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
                        <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
                        <Legend />
                        <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}