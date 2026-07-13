import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CoA() {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const fetchCoA = async () => {
            try {
                const res = await axios.get('/api/coa');
                setAccounts(res.data || []);
            } catch (error) {
                console.error(error);
            }
        };
        fetchCoA();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Chart of Accounts</h1>
                <p className="text-slate-500 mt-1">Struktur akun yang menyesuaikan kebutuhan akuntansi PT Infimech</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Akun</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Grup</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subgrup</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {accounts.map((account) => (
                            <tr key={`${account.code}-${account.name}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-700 font-semibold">{account.code}</td>
                                <td className="px-4 py-3 text-slate-700">{account.name}</td>
                                <td className="px-4 py-3 text-slate-600">{account.group}</td>
                                <td className="px-4 py-3 text-slate-600">{account.subgroup}</td>
                                <td className="px-4 py-3 text-slate-500">{account.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
