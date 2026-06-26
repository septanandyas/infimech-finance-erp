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
import Saldo from './pages/Saldo';
import Neraca from './pages/Neraca';

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
                <Route path="saldo" element={<Saldo />} />
                <Route path="neraca" element={<Neraca />} />
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