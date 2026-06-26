import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';

export default function Neraca() {
    const [data, setData] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        axios.get(`/api/neraca?year=${year}`).then(r => setData(r.data)).catch(console.error);
    }, [year]);

    if (!data) return <div className="text-slate-500 text-center py-20">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Neraca</h1>
                    <p className="text-slate-500 mt-1">Laporan posisi keuangan</p>
                </div>
                <select value={year} onChange={e => setYear(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aset */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-emerald-600 uppercase text-sm tracking-wider mb-4">ASET</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 text-sm">Kas & Setara Kas</span>
                            <span className="text-slate-800 font-medium">{formatRupiah(data.aset.kas)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-500 text-sm">Piutang Usaha</span>
                            <span className="text-slate-800 font-medium">{formatRupiah(data.aset.piutang)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-xl px-3">
                            <span className="text-emerald-600 font-bold text-sm uppercase">Total Aset</span>
                            <span className="text-emerald-600 font-bold">{formatRupiah(data.aset.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Kewajiban & Modal */}
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-bold text-red-600 uppercase text-sm tracking-wider mb-4">KEWAJIBAN</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 text-sm">Total Pengeluaran</span>
                                <span className="text-slate-800 font-medium">{formatRupiah(data.kewajiban.total)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-red-50 rounded-xl px-3">
                                <span className="text-red-600 font-bold text-sm uppercase">Total Kewajiban</span>
                                <span className="text-red-600 font-bold">{formatRupiah(data.kewajiban.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-bold text-sky-600 uppercase text-sm tracking-wider mb-4">MODAL</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 text-sm">Laba Bersih</span>
                                <span className={`font-medium ${data.modal.laba >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(data.modal.laba)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-sky-50 rounded-xl px-3">
                                <span className="text-sky-600 font-bold text-sm uppercase">Total Modal</span>
                                <span className="text-sky-600 font-bold">{formatRupiah(data.modal.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Persamaan neraca */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-wrap justify-around gap-4 text-center shadow-sm">
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Aset</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(data.aset.total)}</p>
                </div>
                <div className="text-3xl text-slate-400 self-center">=</div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Kewajiban</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(data.kewajiban.total)}</p>
                </div>
                <div className="text-3xl text-slate-400 self-center">+</div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Modal</p>
                    <p className="text-2xl font-bold text-sky-600">{formatRupiah(data.modal.total)}</p>
                </div>
            </div>
        </div>
    );
}