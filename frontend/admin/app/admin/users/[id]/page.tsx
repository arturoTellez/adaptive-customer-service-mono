'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/app/lib/AuthContext';
import { api, Ticket } from '@/app/lib/api';

export default function AdminUserTicketsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        loadUserTickets();
      }
    }
  }, [user, authLoading, isAdmin, router, userId]);

  const loadUserTickets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserTickets(user.id, userId);
      setTickets(data);
      
      // Obtener nombre del usuario del primer ticket
      if (data.length > 0) {
        // Aquí podrías hacer una llamada adicional para obtener el usuario
        // Por ahora usamos el user_id
        setUserName(`Usuario ${userId.substring(0, 8)}`);
      }
    } catch (err) {
      console.error('Error al cargar tickets:', err);
      setError('Error al cargar tickets del usuario');
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
            <p className="text-kavak-gray-600 text-lg">Cargando tickets...</p>
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
              onClick={loadUserTickets}
              className="bg-kavak-orange text-white px-6 py-2 rounded-lg hover:bg-kavak-orange-light"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'all') return true;
    if (filter === 'open') return ticket.status === 'open' || ticket.status === 'in_progress';
    if (filter === 'resolved') return ticket.status === 'resolved' || ticket.status === 'closed';
    return true;
  });

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
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/users">
              <button className="w-10 h-10 flex items-center justify-center text-kavak-blue hover:text-kavak-orange hover:bg-white rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </Link>
            <h1 className="text-4xl font-bold text-kavak-navy">Tickets de {userName}</h1>
          </div>
          <p className="text-lg text-kavak-gray-600 ml-13">
            Gestiona los tickets de este usuario
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-kavak-gray-600 mb-2">Total</h3>
            <p className="text-3xl font-bold text-kavak-navy">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-kavak-gray-600 mb-2">Activos</h3>
            <p className="text-3xl font-bold text-kavak-orange">
              {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-kavak-gray-600 mb-2">Resueltos</h3>
            <p className="text-3xl font-bold text-green-500">
              {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-kavak-gray-100 p-2 mb-8 inline-flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              filter === 'all'
                ? 'bg-kavak-navy text-white shadow-lg'
                : 'text-kavak-gray-700 hover:bg-kavak-gray-50'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              filter === 'open'
                ? 'bg-kavak-orange text-white shadow-lg'
                : 'text-kavak-gray-700 hover:bg-kavak-gray-50'
            }`}
          >
            Activos ({tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              filter === 'resolved'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-kavak-gray-700 hover:bg-kavak-gray-50'
            }`}
          >
            Resueltos ({tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length})
          </button>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-kavak-gray-200">
              <svg className="w-20 h-20 text-kavak-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-kavak-navy mb-3">No hay tickets</h3>
              <p className="text-kavak-gray-600">
                Este usuario no tiene tickets con el filtro seleccionado
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-kavak-gray-100 hover:shadow-xl hover:border-kavak-orange/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-kavak-navy text-xl group-hover:text-kavak-orange transition-colors">
                          {ticket.title}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className="bg-kavak-gray-100 text-kavak-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold">
                          {ticket.category}
                        </span>
                      </div>

                      <p className="text-kavak-gray-600 text-sm mb-3 line-clamp-2">
                        {ticket.description}
                      </p>

                      <p className="text-kavak-gray-500 text-xs">
                        {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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
      </main>
    </div>
  );
}