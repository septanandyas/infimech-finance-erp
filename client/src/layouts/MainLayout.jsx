import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, TrendingUp, FileText, Wallet, BookOpen, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: TrendingUp, label: 'Cashflow', path: '/cashflow' },
    { icon: FileText, label: 'Invoice', path: '/invoice' },
    { icon: BookOpen, label: 'Neraca', path: '/neraca' },
];

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-800">
            {/* Overlay mobile */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-xl font-bold text-sky-600">Finance ERP</h1>
                    <p className="text-xs text-slate-500 mt-1">Infimech · {user?.role}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                isActive
                                    ? "bg-sky-50 text-sky-600 border border-sky-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            )}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
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

            {/* Main content */}
            <main className="flex-1 overflow-auto pt-16 lg:pt-0">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}