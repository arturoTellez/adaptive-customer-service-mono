'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kavak-navy via-kavak-blue to-kavak-blue-light flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <div className="w-32 h-32 bg-kavak-navy rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-5xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-kavak-navy mb-2">Kavak</h1>
          <p className="text-kavak-gray-600">Centro de Soporte</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-kavak-navy mb-6">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-kavak-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-kavak-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-kavak-blue hover:text-kavak-orange text-sm font-medium transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 bg-kavak-gray-100 rounded-lg p-4 text-center text-sm text-kavak-gray-600">
          <p className="font-semibold mb-1">Credenciales de prueba:</p>
          <p>Email: demo@kavak.com</p>
          <p>Contraseña: cualquiera</p>
        </div>
      </div>
    </div>
  );
}