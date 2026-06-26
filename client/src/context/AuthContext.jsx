import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('finance_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const savedUser = localStorage.getItem('finance_user');
            if (savedUser) setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        const res = await axios.post('/api/auth/login', { username, password });
        const { token: newToken, user: newUser } = res.data;

        // Tolak kalau bukan Superadmin atau Manajemen
        if (!['Superadmin', 'Manajemen'].includes(newUser.role)) {
            throw new Error('Akses ditolak');
        }
        localStorage.setItem('finance_token', newToken);
        localStorage.setItem('finance_user', JSON.stringify(newUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(newUser);
        return newUser;
    };

    const logout = () => {
        localStorage.removeItem('finance_token');
        localStorage.removeItem('finance_user');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
