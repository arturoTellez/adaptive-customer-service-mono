'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/app/lib/AuthContext';
import { api, Ticket, TicketStats } from '@/app/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const [statsData, ticketsData] = await Promise.all([
        api.getTicketStats(user.id),
        api.getTickets(user.id),
      ]);

      setStats(statsData);
      setRecentTickets(ticketsData.slice(0, 5)); // Solo los 5 más recientes
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Loading de autenticación
  if (authLoading) {
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

  if (!user) return null;

  // Loading de datos
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-kavak-gray-600 text-lg">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return 'bg-kavak-orange/10 text-kavak-orange border-kavak-orange/30';
      case 'resolved':
      case 'closed':
        return 'bg-green-50 text-green-600 border-green-500/30';
      default:
        return 'bg-kavak-gray-100 text-kavak-gray-600 border-kavak-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'in_progress':
        return 'En Progreso';
      case 'resolved':
        return 'Resuelto';
      case 'closed':
        return 'Cerrado';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-kavak-navy mb-2">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="text-lg text-kavak-gray-600">
            Aquí está el resumen de tus tickets de soporte
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Tickets */}
            <div className="bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">Total Tickets</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{stats.total}</p>
            </div>

            {/* Open Tickets */}
            <div className="bg-gradient-to-br from-kavak-orange to-kavak-orange-light rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">Abiertos</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{stats.open}</p>
            </div>

            {/* In Progress */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">En Progreso</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{stats.in_progress}</p>
            </div>

            {/* Resolved */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold opacity-90">Resueltos</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold">{stats.resolved}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/tickets/new">
            <div className="bg-kavak-orange hover:bg-kavak-orange-light rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Crear Nuevo Ticket</h3>
                  <p className="text-white/80 text-sm">¿Necesitas ayuda? Crea un ticket ahora</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/tickets">
            <div className="bg-kavak-navy hover:bg-kavak-blue rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Ver Todos los Tickets</h3>
                  <p className="text-white/80 text-sm">Administra tus tickets de soporte</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Tickets */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-kavak-navy">Tickets Recientes</h2>
            <Link href="/tickets" className="text-kavak-orange hover:text-kavak-orange-light font-semibold">
              Ver todos →
            </Link>
          </div>

          <div className="space-y-4">
            {recentTickets.length === 0 ? (
              <div className="bg-kavak-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-kavak-gray-200">
                <svg className="w-16 h-16 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-kavak-navy mb-2">No tienes tickets aún</h3>
                <p className="text-kavak-gray-600 mb-6">Crea tu primer ticket para comenzar</p>
                <Link href="/tickets/new">
                  <button className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg">
                    Crear Ticket
                  </button>
                </Link>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                  <div className="bg-white rounded-xl p-6 shadow-md border border-kavak-gray-100 hover:shadow-lg hover:border-kavak-orange/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-kavak-navy text-lg mb-2 group-hover:text-kavak-orange transition-colors">
                          {ticket.title}
                        </h3>
                        <p className="text-kavak-gray-600 text-sm mb-3 line-clamp-1">
                          {ticket.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                            {getStatusText(ticket.status)}
                          </span>
                          <span className="bg-kavak-gray-100 text-kavak-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {ticket.category}
                          </span>
                          <span className="text-kavak-gray-500 text-xs px-3 py-1">
                            {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-kavak-gray-400 group-hover:text-kavak-orange group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}