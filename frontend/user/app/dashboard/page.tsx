'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'resolved';
  createdAt: string;
  satisfaction?: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const mockTickets: Ticket[] = [
      {
        id: '1',
        title: 'Problema con el pago inicial',
        category: 'Financiamiento',
        status: 'active',
        createdAt: '2025-10-20',
      },
      {
        id: '2',
        title: 'Consulta sobre garantía',
        category: 'Garantías',
        status: 'active',
        createdAt: '2025-10-21',
      },
      {
        id: '3',
        title: 'Documentación del vehículo',
        category: 'Documentos',
        status: 'resolved',
        createdAt: '2025-10-15',
        satisfaction: 5,
      },
    ];
    setTickets(mockTickets);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kavak-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.status === 'active');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const avgSatisfaction = resolvedTickets.length > 0
    ? resolvedTickets.reduce((acc, t) => acc + (t.satisfaction || 0), 0) / resolvedTickets.length
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Welcome Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-kavak-navy mb-3">
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-lg text-kavak-gray-600">
            Gestiona tus solicitudes de soporte de forma simple y eficiente
          </p>
        </div>

        {/* Quick Action */}
        <div className="mb-16">
          <Link href="/tickets/new">
            <div className="relative overflow-hidden bg-gradient-to-r from-kavak-navy to-kavak-blue rounded-3xl p-10 shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(0,44,95,0.5)] transition-all duration-500 cursor-pointer group">
              <div className="relative z-10 flex items-center justify-between">
                <div className="max-w-xl">
                  <h2 className="text-3xl font-bold text-white mb-3">¿Necesitas ayuda?</h2>
                  <p className="text-white/90 text-lg mb-6">
                    Crea un ticket y nuestro equipo te responderá en menos de 24 horas
                  </p>
                  <div className="inline-flex items-center text-white font-semibold group-hover:gap-3 gap-2 transition-all">
                    <span className="text-lg">Crear ticket</span>
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-kavak-orange/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-kavak-orange/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-kavak-blue-light/20 rounded-full -ml-24 -mb-24"></div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-kavak-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-kavak-orange to-kavak-orange-light rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-kavak-gray-600 mb-2">Tickets Activos</p>
            <p className="text-5xl font-bold text-kavak-navy">{activeTickets.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-kavak-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-kavak-gray-600 mb-2">Tickets Resueltos</p>
            <p className="text-5xl font-bold text-kavak-navy">{resolvedTickets.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-kavak-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-kavak-gray-600 mb-2">Satisfacción</p>
            <p className="text-5xl font-bold text-kavak-navy">{avgSatisfaction.toFixed(1)}<span className="text-2xl text-kavak-gray-500">/5</span></p>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Active Tickets */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-kavak-navy">Tickets Activos</h2>
              <span className="text-sm text-kavak-gray-500 bg-kavak-gray-100 px-4 py-2 rounded-full">
                {activeTickets.length} {activeTickets.length === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            <div className="space-y-6">
              {activeTickets.length === 0 ? (
                <div className="bg-kavak-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-kavak-gray-200">
                  <svg className="w-16 h-16 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-kavak-gray-600 font-medium">No tienes tickets activos</p>
                </div>
              ) : (
                activeTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-kavak-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-kavak-orange/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-kavak-navy text-lg group-hover:text-kavak-orange transition-colors">
                          {ticket.title}
                        </h3>
                        <span className="bg-kavak-orange/10 text-kavak-orange px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ml-3">
                          Activo
                        </span>
                      </div>
                      <p className="text-kavak-gray-600 text-sm mb-4 font-medium">{ticket.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-kavak-gray-500 text-xs">
                          {new Date(ticket.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <svg className="w-5 h-5 text-kavak-gray-400 group-hover:text-kavak-orange group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Resolved Tickets */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-kavak-navy">Tickets Resueltos</h2>
              <span className="text-sm text-kavak-gray-500 bg-kavak-gray-100 px-4 py-2 rounded-full">
                {resolvedTickets.length} {resolvedTickets.length === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            <div className="space-y-6">
              {resolvedTickets.length === 0 ? (
                <div className="bg-kavak-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-kavak-gray-200">
                  <svg className="w-16 h-16 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-kavak-gray-600 font-medium">No tienes tickets resueltos</p>
                </div>
              ) : (
                resolvedTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-kavak-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-green-500/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-kavak-navy text-lg group-hover:text-green-600 transition-colors">
                          {ticket.title}
                        </h3>
                        <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ml-3">
                          Resuelto
                        </span>
                      </div>
                      <p className="text-kavak-gray-600 text-sm mb-4 font-medium">{ticket.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <p className="text-kavak-gray-500 text-xs">
                            {new Date(ticket.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                          </p>
                          {ticket.satisfaction && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < ticket.satisfaction! ? 'text-yellow-400' : 'text-kavak-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-kavak-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}