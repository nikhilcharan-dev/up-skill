import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    // Optional: Verify token with backend if needed, for now trusting decoding + expiration check
                    if (decoded.exp * 1000 < Date.now()) {
                        throw new Error('Token expired');
                    }

                    // Fetch fresh profile data if possible, or just set from token
                    try {
                        const { data } = await api.get('/trainee/profile');
                        setUser({ ...decoded, ...data });
                    } catch (err) {
                        console.warn('Failed to fetch profile', err);
                        setUser(decoded);
                    }
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            const decoded = jwtDecode(data.token);
            setUser({ ...decoded, ...data }); // data might contain name, role etc.
            return data;
        } catch (error) {
            throw new Error(error.response?.data?.msg || 'Login failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
