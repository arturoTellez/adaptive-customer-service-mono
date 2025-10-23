'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/app/lib/AuthContext';
import { api, AdminDashboardStats } from '@/app/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        loadDashboardData();
      }
    }
  }, [user, authLoading, isAdmin, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminDashboard(user.id);
      setStats(data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar el dashboard');
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
            <p className="text-kavak-gray-600 text-lg">Cargando...</p>
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
              onClick={loadDashboardData}
              className="bg-kavak-orange text-white px-6 py-2 rounded-lg hover:bg-kavak-orange-light"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-kavak-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h1 className="text-4xl font-bold text-kavak-navy">Panel de Administración</h1>
          </div>
          <p className="text-lg text-kavak-gray-600">
            Métricas y análisis del sistema de Customer Service con IA
          </p>
        </div>

        {/* Métricas Principales del Chatbot */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-kavak-navy mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-kavak-orange rounded-full"></span>
            Rendimiento del Chatbot IA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tasa de Éxito */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold opacity-90 mb-1">Tasa de Éxito</h3>
                  <p className="text-xs opacity-75">Resoluciones automáticas</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.chatbot_success_rate}%</p>
              <p className="text-sm opacity-90">
                {stats.resolved_tickets} de {stats.total_tickets} tickets resueltos
              </p>
            </div>

            {/* Satisfacción */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold opacity-90 mb-1">Satisfacción</h3>
                  <p className="text-xs opacity-75">Promedio de evaluaciones</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.average_satisfaction_score.toFixed(1)}</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(stats.average_satisfaction_score) ? 'text-white' : 'text-white/30'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Tiempo de Resolución */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold opacity-90 mb-1">Mensajes Promedio</h3>
                  <p className="text-xs opacity-75">Resolución de tickets</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.average_resolution_time.toFixed(0)}</p>
              <p className="text-sm opacity-90">mensajes</p>
            </div>
          </div>
        </div>

        {/* Stats Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-kavak-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Usuarios</h3>
              <svg className="w-6 h-6 text-kavak-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-kavak-navy">{stats.total_users}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-kavak-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Total Tickets</h3>
              <svg className="w-6 h-6 text-kavak-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-kavak-navy">{stats.total_tickets}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-kavak-orange">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Abiertos</h3>
              <svg className="w-6 h-6 text-kavak-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-kavak-orange">{stats.open_tickets}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-kavak-gray-600">Resueltos</h3>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-green-500">{stats.resolved_tickets}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/admin/users">
            <div className="bg-gradient-to-br from-kavak-navy to-kavak-blue hover:from-kavak-blue hover:to-kavak-navy rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Gestionar Usuarios</h3>
                  <p className="text-white/80 text-sm">Ver todos los usuarios y sus tickets</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/tickets">
            <div className="bg-gradient-to-br from-kavak-orange to-kavak-orange-light hover:from-kavak-orange-light hover:to-kavak-orange rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Ver Todos los Tickets</h3>
                  <p className="text-white/80 text-sm">Administrar tickets del sistema</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tickets por Categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-kavak-navy mb-4">Tickets por Categoría</h3>
            <div className="space-y-3">
              {Object.entries(stats.tickets_by_category).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-kavak-gray-700">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-kavak-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-kavak-orange rounded-full"
                        style={{ width: `${(count / stats.total_tickets) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-kavak-navy font-bold w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-kavak-navy mb-4">Tickets por Estado</h3>
            <div className="space-y-3">
              {Object.entries(stats.tickets_by_status).map(([status, count]) => {
                const statusColors: Record<string, string> = {
                  open: 'bg-red-500',
                  in_progress: 'bg-yellow-500',
                  resolved: 'bg-green-500',
                  closed: 'bg-gray-500',
                };
                const statusLabels: Record<string, string> = {
                  open: 'Abiertos',
                  in_progress: 'En Progreso',
                  resolved: 'Resueltos',
                  closed: 'Cerrados',
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-kavak-gray-700">{statusLabels[status]}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-kavak-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusColors[status]} rounded-full`}
                          style={{ width: `${(count / stats.total_tickets) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-kavak-navy font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-kavak-navy">Actividad Reciente</h3>
            <Link href="/admin/tickets" className="text-kavak-orange hover:text-kavak-orange-light font-semibold text-sm">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recent_activity.map((activity) => (
              <Link key={activity.ticket_id} href={`/admin/tickets/${activity.ticket_id}`}>
                <div className="flex items-center justify-between p-4 hover:bg-kavak-gray-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-kavak-orange/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-kavak-navy">{activity.user_name}</span>
                      <span className="text-xs text-kavak-gray-500">#{activity.ticket_id.substring(0, 8)}</span>
                    </div>
                    <p className="text-sm text-kavak-gray-700">{activity.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-kavak-gray-100 px-3 py-1 rounded-full text-kavak-gray-700">
                      {activity.category}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      activity.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}