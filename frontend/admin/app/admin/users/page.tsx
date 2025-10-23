'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/app/lib/AuthContext';
import { api, UserWithStats } from '@/app/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        loadUsers();
      }
    }
  }, [user, authLoading, isAdmin, router]);

  const loadUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllUsers(user.id);
      setUsers(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-kavak-gray-600 text-lg">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={loadUsers}
              className="bg-kavak-orange text-white px-6 py-2 rounded-lg hover:bg-kavak-orange-light"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/dashboard">
                <button className="w-10 h-10 flex items-center justify-center text-kavak-blue hover:text-kavak-orange hover:bg-white rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <h1 className="text-4xl font-bold text-kavak-navy">Gestión de Usuarios</h1>
            </div>
            <p className="text-lg text-kavak-gray-600">
              Administra los usuarios del sistema
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-kavak-navy">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Total Usuarios</h3>
              <svg className="w-8 h-8 text-kavak-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-kavak-navy">{users.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Tickets Activos</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-green-500">
              {users.reduce((acc, u) => acc + u.open_tickets, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Tickets Resueltos</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-blue-500">
              {users.reduce((acc, u) => acc + u.resolved_tickets, 0)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 pl-12 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-kavak-navy placeholder:text-kavak-gray-400"
            />
            <svg className="w-5 h-5 text-kavak-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-kavak-navy to-kavak-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Total Tickets</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Activos</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Resueltos</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Fecha Registro</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kavak-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-kavak-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-lg font-semibold">No se encontraron usuarios</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-kavak-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full flex items-center justify-center text-white font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-kavak-navy">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-kavak-gray-700">{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-kavak-gray-100 text-kavak-navy font-bold rounded-full">
                          {u.total_tickets}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 text-orange-600 font-bold rounded-full">
                          {u.open_tickets}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 font-bold rounded-full">
                          {u.resolved_tickets}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-kavak-gray-600">
                        {new Date(u.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/admin/users/${u.id}`}>
                          <button className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold px-4 py-2 rounded-lg transition-all transform hover:scale-105">
                            Ver Tickets
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}