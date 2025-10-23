'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-kavak-navy via-kavak-blue to-kavak-blue-light flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo Card */}
       {/*  <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 text-center transform hover:scale-105 transition-transform">
          <div className="w-32 h-32 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <span className="text-white text-6xl font-bold">K</span>
          </div>
          <h1 className="text-4xl font-bold text-kavak-navy mb-2">Kavak</h1>
          <p className="text-kavak-gray-600 text-lg">Centro de Soporte</p>
        </div> */}

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold text-kavak-navy mb-8 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-kavak-navy mb-3">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-kavak-navy placeholder:text-kavak-gray-400"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-kavak-navy mb-3">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-kavak-navy placeholder:text-kavak-gray-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-kavak-orange hover:bg-kavak-orange-light text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl text-lg"
            >
              {isLoading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="#" className="text-kavak-blue hover:text-kavak-orange text-sm font-semibold transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/90 backdrop-blur-lg rounded-2xl p-6 text-center text-sm text-kavak-navy border-2 border-white/50">
          <p className="font-bold mb-2 text-base">🎯 Credenciales de prueba</p>
          <p className="text-kavak-gray-700">Email: <span className="font-semibold">cualquier@email.com</span></p>
          <p className="text-kavak-gray-700">Contraseña: <span className="font-semibold">cualquiera</span></p>
        </div>
      </div>
    </div>
  );
}