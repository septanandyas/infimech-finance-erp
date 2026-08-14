import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, TrendingUp, FileText, Package, Building2,
    AlertCircle, ReceiptText, BookOpen, LogOut, Menu, X,
    ChevronDown, ArrowLeftRight, Layers, BarChart3, ScrollText, Landmark
} from 'lucide-react';
import { cn } from '../lib/utils';

const navGroups = [
    {
        type: 'single',
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/',
    },
    {
        type: 'group',
        icon: ArrowLeftRight,
        label: 'Transaksi',
        children: [
            { icon: TrendingUp, label: 'Cashflow', path: '/cashflow' },
            { icon: FileText, label: 'Invoice', path: '/invoice' },
        ]
    },
    {
        type: 'group',
        icon: Layers,
        label: 'Aset',
        children: [
            { icon: Package, label: 'Persediaan', path: '/inventory' },
            { icon: ScrollText, label: 'Kontrak', path: '/kontrak' },
            { icon: Building2, label: 'Aset Tetap', path: '/aset-tetap' },
        ]
    },
    {
        type: 'group',
        icon: AlertCircle,
        label: 'Kewajiban',
        children: [
            { icon: AlertCircle, label: 'Kewajiban', path: '/kewajiban' },
        ]
    },
    {
        type: 'group',
        icon: BarChart3,
        label: 'Laporan',
        children: [
            { icon: BookOpen, label: 'Neraca', path: '/neraca' },
            { icon: BarChart3, label: 'Laba Rugi', path: '/laba-rugi' },
            { icon: BookOpen, label: 'Buku Besar', path: '/buku-besar' },
            { icon: Landmark, label: 'Perubahan Modal', path: '/perubahan-modal' },
        ]
    },
    {
        type: 'single',
        icon: BookOpen,
        label: 'Chart of Accounts',
        path: '/coa',
    },
];

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState({
        'Transaksi': true,
        'Aset': false,
        'Kewajiban': false,
        'Laporan': false,
    });

    const handleLogout = () => { logout(); navigate('/login'); };
    const toggleGroup = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-800">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={cn(
                "w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-xl font-bold text-sky-600">Finance ERP</h1>
                    <p className="text-xs text-slate-500 mt-1">Infimech · {user?.role}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navGroups.map((group) => {
                        if (group.type === 'single') {
                            return (
                                <NavLink
                                    key={group.path}
                                    to={group.path}
                                    end={group.path === '/'}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                        isActive
                                            ? "bg-sky-50 text-sky-600 border border-sky-200"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                    )}
                                >
                                    <group.icon size={18} />
                                    {group.label}
                                </NavLink>
                            );
                        }

                        const isAnyChildActive = group.children.some(child =>
                            window.location.pathname === child.path
                        );

                        return (
                            <div key={group.label}>
                                <button
                                    onClick={() => toggleGroup(group.label)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                        isAnyChildActive
                                            ? "text-sky-600 bg-sky-50"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                    )}
                                >
                                    <group.icon size={18} />
                                    <span className="flex-1 text-left">{group.label}</span>
                                    <ChevronDown
                                        size={16}
                                        className={cn(
                                            "transition-transform duration-200",
                                            openGroups[group.label] && "rotate-180"
                                        )}
                                    />
                                </button>

                                {openGroups[group.label] && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                                        {group.children.map(child => (
                                            <NavLink
                                                key={child.path}
                                                to={child.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={({ isActive }) => cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                                                    isActive
                                                        ? "bg-sky-50 text-sky-600 border border-sky-200"
                                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                                )}
                                            >
                                                <child.icon size={16} />
                                                {child.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-medium"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 z-30">
                <h1 className="text-lg font-bold text-sky-600">Finance ERP</h1>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-800">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <main className="flex-1 overflow-auto pt-16 lg:pt-0">
                <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}