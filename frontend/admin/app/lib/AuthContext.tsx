'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true); // ⬅️ AGREGAR ESTO
    try {
      const userData = await api.login(email, password);
      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
      };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      // Redirigir según el rol
      if (userObj.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setLoading(false); // ⬅️ AGREGAR ESTO
      throw new Error(error.message || 'Error al iniciar sesión');
    }
    // NO pongas setLoading(false) aquí, deja que la página destino maneje el loading
  };

  const signup = async (email: string, name: string, password: string) => {
    setLoading(true); // ⬅️ AGREGAR ESTO
    try {
      const userData = await api.signup({ email, name, password });
      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
      };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      router.push('/dashboard');
    } catch (error: any) {
      setLoading(false); // ⬅️ AGREGAR ESTO
      throw new Error(error.message || 'Error al registrar usuario');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}