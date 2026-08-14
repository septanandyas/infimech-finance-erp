import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatRupiah } from '../lib/utils';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const DiffCell = ({ current = 0, previous = 0 }) => {
    const diff = Number(current || 0) - Number(previous || 0);
    const isPositive = diff >= 0;
    return (
        <td className={cn("px-4 py-3 text-sm font-medium text-right", isPositive ? "text-emerald-600" : "text-red-600")}>
            {isPositive ? '+' : ''}{formatRupiah(diff)}
        </td>
    );
};

const NeracaRow = ({ label, current = 0, previous = 0, bold, indent }) => (
    <tr className={cn("border-b border-slate-100", bold ? "bg-slate-50" : "")}>
        <td className={cn("px-4 py-3 text-sm text-slate-600", bold ? "font-bold text-slate-800" : "", indent ? "pl-8" : "")}>{label}</td>
        <td className={cn("px-4 py-3 text-sm text-right", bold ? "font-bold text-slate-800" : "text-slate-600")}>{formatRupiah(current)}</td>
        <td className={cn("px-4 py-3 text-sm text-right", bold ? "font-bold text-slate-800" : "text-slate-600")}>{formatRupiah(previous)}</td>
        <DiffCell current={current} previous={previous} />
    </tr>
);

export default function Neraca() {
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
                const res = await axios.get(`/api/neraca?month=${month}&year=${year}`);
                setData(res.data);
            } catch { console.error('Gagal fetch neraca'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [month, year]);

    if (loading) return <div className="text-slate-500 text-center py-20">Loading...</div>;
    if (!data) return <div className="text-slate-500 text-center py-20">Gagal memuat data</div>;

    const { current, previous } = data;

    const handleExportExcel = () => {
        const rows = [
            ['NERACA - PT INFIMECH'],
            [`Periode: ${MONTHS[month - 1]} ${year}`],
            [],
            ['Keterangan', `${MONTHS[month - 1]} ${year}`, `${MONTHS[prevMonth - 1]} ${prevYear}`, 'Selisih'],
            ['ASET', '', '', ''],
            ['Aset Lancar', '', '', ''],
            ['Kas & Setara Kas', current.aset.lancar.kas, previous.aset.lancar.kas, current.aset.lancar.kas - previous.aset.lancar.kas],
            ['Piutang Usaha', current.aset.lancar.piutang, previous.aset.lancar.piutang, current.aset.lancar.piutang - previous.aset.lancar.piutang],
            ['Total Aset Lancar', current.aset.lancar.total, previous.aset.lancar.total, current.aset.lancar.total - previous.aset.lancar.total],
            ['Aset Tetap', '', '', ''],
            ...current.aset.tetap.categories.map(cat => [
                cat.category,
                cat.book_value,
                previous.aset.tetap.categories.find(c => c.category === cat.category)?.book_value || 0,
                cat.book_value - (previous.aset.tetap.categories.find(c => c.category === cat.category)?.book_value || 0)
            ]),
            ['Total Aset Tetap', current.aset.tetap.total, previous.aset.tetap.total, current.aset.tetap.total - previous.aset.tetap.total],
            ['TOTAL ASET', current.aset.total, previous.aset.total, current.aset.total - previous.aset.total],
            [],
            ['KEWAJIBAN', '', '', ''],
            ...current.kewajiban.jangka_pendek.categories.map(cat => [
                cat.category,
                cat.total,
                previous.kewajiban.jangka_pendek.categories.find(c => c.category === cat.category)?.total || 0,
                cat.total - (previous.kewajiban.jangka_pendek.categories.find(c => c.category === cat.category)?.total || 0)
            ]),
            ['Total Jangka Pendek', current.kewajiban.jangka_pendek.total, previous.kewajiban.jangka_pendek.total, current.kewajiban.jangka_pendek.total - previous.kewajiban.jangka_pendek.total],
            ['TOTAL KEWAJIBAN', current.kewajiban.total, previous.kewajiban.total, current.kewajiban.total - previous.kewajiban.total],
            [],
            ['MODAL', '', '', ''],
            ['Modal Bersih', current.modal.total, previous.modal.total, current.modal.total - previous.modal.total],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Neraca');
        XLSX.writeFile(wb, `Neraca_${MONTHS[month - 1]}_${year}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('NERACA - PT INFIMECH', 14, 15);
        doc.setFontSize(11);
        doc.text(`Periode: ${MONTHS[month - 1]} ${year}`, 14, 23);

        autoTable(doc, {
            startY: 30,
            head: [['Keterangan', `${MONTHS[month - 1]} ${year}`, `${MONTHS[prevMonth - 1]} ${prevYear}`, 'Selisih']],
            body: [
                ['ASET', '', '', ''],
                ['Kas & Setara Kas', formatRupiah(current.aset.lancar.kas), formatRupiah(previous.aset.lancar.kas), formatRupiah(current.aset.lancar.kas - previous.aset.lancar.kas)],
                ['Piutang Usaha', formatRupiah(current.aset.lancar.piutang), formatRupiah(previous.aset.lancar.piutang), formatRupiah(current.aset.lancar.piutang - previous.aset.lancar.piutang)],
                ['Total Aset Lancar', formatRupiah(current.aset.lancar.total), formatRupiah(previous.aset.lancar.total), formatRupiah(current.aset.lancar.total - previous.aset.lancar.total)],
                ['Total Aset Tetap', formatRupiah(current.aset.tetap.total), formatRupiah(previous.aset.tetap.total), formatRupiah(current.aset.tetap.total - previous.aset.tetap.total)],
                ['TOTAL ASET', formatRupiah(current.aset.total), formatRupiah(previous.aset.total), formatRupiah(current.aset.total - previous.aset.total)],
                ['KEWAJIBAN', '', '', ''],
                ['Total Jangka Pendek', formatRupiah(current.kewajiban.jangka_pendek.total), formatRupiah(previous.kewajiban.jangka_pendek.total), formatRupiah(current.kewajiban.jangka_pendek.total - previous.kewajiban.jangka_pendek.total)],
                ['Total Jangka Panjang', formatRupiah(current.kewajiban.jangka_panjang.total), formatRupiah(previous.kewajiban.jangka_panjang.total), formatRupiah(current.kewajiban.jangka_panjang.total - previous.kewajiban.jangka_panjang.total)],
                ['TOTAL KEWAJIBAN', formatRupiah(current.kewajiban.total), formatRupiah(previous.kewajiban.total), formatRupiah(current.kewajiban.total - previous.kewajiban.total)],
                ['MODAL', '', '', ''],
                ['Modal Bersih', formatRupiah(current.modal.total), formatRupiah(previous.modal.total), formatRupiah(current.modal.total - previous.modal.total)],
            ],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [14, 165, 233] },
            didParseCell: (data) => {
                if (['ASET', 'KEWAJIBAN', 'MODAL', 'TOTAL ASET', 'TOTAL KEWAJIBAN'].includes(data.cell.text[0])) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [241, 245, 249];
                }
            }
        });

        doc.save(`Neraca_${MONTHS[month - 1]}_${year}.pdf`);
    };

    const handlePrint = () => window.print();

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Neraca</h1>
                    <p className="text-slate-500 mt-1">Laporan posisi keuangan</p>
                </div>
                <div className="flex gap-3">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-sm focus:outline-none focus:border-sky-500">
                        {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                    title="Export Excel"
                >
                    <FileSpreadsheet size={15} /> Excel
                </button>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                    title="Export PDF"
                >
                    <Download size={15} /> PDF
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                    title="Print"
                >
                    <Printer size={15} /> Print
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Aset</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatRupiah(current.aset.total)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Kewajiban</p>
                    <p className="text-2xl font-bold text-red-600">{formatRupiah(current.kewajiban.total)}</p>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
                    <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Modal Bersih</p>
                    <p className="text-2xl font-bold text-sky-600">{formatRupiah(current.modal.total)}</p>
                </div>
            </div>

            {/* Tabel Neraca */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-3 sm:px-4 py-4 text-xs font-bold text-slate-500 uppercase text-left w-2/5">Keterangan</th>
                            <th className="px-3 sm:px-4 py-4 text-xs font-bold text-sky-600 uppercase text-right">{MONTHS[month - 1]} {year}</th>
                            <th className="px-3 sm:px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">{MONTHS[prevMonth - 1]} {prevYear}</th>
                            <th className="px-3 sm:px-4 py-4 text-xs font-bold text-slate-500 uppercase text-right">Selisih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* ASET */}
                        <tr className="bg-sky-50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-bold text-sky-700 uppercase tracking-wider">ASET</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6">Aset Lancar</td>
                        </tr>
                        <NeracaRow label="Kas & Setara Kas" current={current.aset.lancar.kas} previous={previous.aset.lancar.kas} indent />
                        <NeracaRow label="Piutang Usaha" current={current.aset.lancar.piutang} previous={previous.aset.lancar.piutang} indent />
                        <NeracaRow label="Persediaan" current={current.aset.lancar.persediaan} previous={previous.aset.lancar.persediaan} indent />
                        <NeracaRow label="Total Aset Lancar" current={current.aset.lancar.total} previous={previous.aset.lancar.total} bold />

                        <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6">Aset Tetap</td>
                        </tr>
                        {current.aset.tetap.categories.length === 0 ? (
                            <NeracaRow label="Belum ada aset tetap" current={0} previous={0} indent />
                        ) : current.aset.tetap.categories.map((cat, i) => (
                            <NeracaRow
                                key={i}
                                label={cat.category}
                                current={cat.book_value}
                                previous={previous.aset.tetap.categories.find(c => c.category === cat.category)?.book_value || 0}
                                indent
                            />
                        ))}
                        <NeracaRow label="Total Aset Tetap" current={current.aset.tetap.total} previous={previous.aset.tetap.total} bold />
                        <NeracaRow label="TOTAL ASET" current={current.aset.total} previous={previous.aset.total} bold />

                        {/* KEWAJIBAN */}
                        <tr className="bg-red-50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-bold text-red-700 uppercase tracking-wider">KEWAJIBAN</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6">Jangka Pendek</td>
                        </tr>
                        {current.kewajiban.jangka_pendek.categories.map((cat, i) => (
                            <NeracaRow
                                key={i}
                                label={cat.category}
                                current={cat.total}
                                previous={previous.kewajiban.jangka_pendek.categories.find(c => c.category === cat.category)?.total || 0}
                                indent
                            />
                        ))}
                        <NeracaRow label="Total Jangka Pendek" current={current.kewajiban.jangka_pendek.total} previous={previous.kewajiban.jangka_pendek.total} bold />

                        <tr className="bg-slate-50/50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6">Jangka Panjang</td>
                        </tr>
                        {current.kewajiban.jangka_panjang.categories.map((cat, i) => (
                            <NeracaRow
                                key={i}
                                label={cat.category}
                                current={cat.total}
                                previous={previous.kewajiban.jangka_panjang.categories.find(c => c.category === cat.category)?.total || 0}
                                indent
                            />
                        ))}
                        <NeracaRow label="Total Jangka Panjang" current={current.kewajiban.jangka_panjang.total} previous={previous.kewajiban.jangka_panjang.total} bold />
                        <NeracaRow label="TOTAL KEWAJIBAN" current={current.kewajiban.total} previous={previous.kewajiban.total} bold />

                        {/* MODAL */}
                        <tr className="bg-sky-50">
                            <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-bold text-sky-700 uppercase tracking-wider">MODAL</td>
                        </tr>
                        <NeracaRow label="Modal Bersih (Aset - Kewajiban)" current={current.modal.total} previous={previous.modal.total} bold />
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}