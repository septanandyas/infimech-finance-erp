import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cashflow from './pages/Cashflow';
import Invoice from './pages/Invoice';
import Neraca from './pages/Neraca';
import AsetTetap from './pages/AsetTetap';
import Kontrak from './pages/Kontrak';
import Kewajiban from './pages/Kewajiban';
import LabaRugi from './pages/LabaRugi';
import PerubahanModal from './pages/PerubahanModal';
import UnearnedRevenue from './pages/UnearnedRevenue';
import BukuBesar from './pages/BukuBesar';
import CoA from './pages/CoA';
import Inventory from './pages/Inventory';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function AppRoutes() {
    const { user } = useAuth();
    if (!user) return (
        <Routes>
            <Route path="*" element={<Login />} />
        </Routes>
    );
    return (
        <Routes>
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="cashflow" element={<Cashflow />} />
                <Route path="invoice" element={<Invoice />} />
                <Route path="neraca" element={<Neraca />} />
                <Route path="aset-tetap" element={<AsetTetap />} />
                <Route path="kontrak" element={<Kontrak />} />
                <Route path="kewajiban" element={<Kewajiban />} />
                <Route path="unearned-revenue" element={<UnearnedRevenue />} />
                <Route path="buku-besar" element={<BukuBesar />} />
                <Route path="coa" element={<CoA />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="laba-rugi" element={<LabaRugi />} />
                <Route path="perubahan-modal" element={<PerubahanModal />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <ToastContainer theme="dark" position="top-right" />
            </BrowserRouter>
        </AuthProvider>
    );
}