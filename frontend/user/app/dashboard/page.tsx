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
    // Mock data - En producción esto vendría de tu API
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kavak-gray-600">Cargando...</p>
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
    <div className="min-h-screen bg-kavak-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-kavak-navy mb-2">
            ¡Bienvenido, {user?.name}!
          </h1>
          <p className="text-kavak-gray-600">
            Gestiona tus tickets de soporte y mantente al día con tus solicitudes
          </p>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          <Link href="/tickets/new">
            <div className="bg-gradient-to-r from-kavak-orange to-kavak-orange-light rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">¿Necesitas ayuda?</h2>
                  <p className="text-white/90">Crea un nuevo ticket de soporte</p>
                </div>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-kavak-orange">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kavak-gray-600 text-sm font-medium mb-1">Tickets Activos</p>
                <p className="text-4xl font-bold text-kavak-navy">{activeTickets.length}</p>
              </div>
              <div className="w-14 h-14 bg-kavak-orange/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-kavak-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kavak-gray-600 text-sm font-medium mb-1">Tickets Resueltos</p>
                <p className="text-4xl font-bold text-kavak-navy">{resolvedTickets.length}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kavak-gray-600 text-sm font-medium mb-1">Satisfacción Promedio</p>
                <p className="text-4xl font-bold text-kavak-navy">{avgSatisfaction.toFixed(1)}/5</p>
              </div>
              <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Tickets */}
          <div>
            <h2 className="text-2xl font-bold text-kavak-navy mb-4">Tickets Activos</h2>
            <div className="space-y-4">
              {activeTickets.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                  <svg className="w-16 h-16 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-kavak-gray-500">No tienes tickets activos</p>
                </div>
              ) : (
                activeTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-kavak-orange">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-kavak-navy text-lg">{ticket.title}</h3>
                        <span className="bg-kavak-orange/10 text-kavak-orange px-3 py-1 rounded-full text-xs font-semibold">
                          Activo
                        </span>
                      </div>
                      <p className="text-kavak-gray-600 text-sm mb-2">{ticket.category}</p>
                      <p className="text-kavak-gray-500 text-xs">
                        Creado el {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Resolved Tickets */}
          <div>
            <h2 className="text-2xl font-bold text-kavak-navy mb-4">Tickets Resueltos</h2>
            <div className="space-y-4">
              {resolvedTickets.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                  <svg className="w-16 h-16 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-kavak-gray-500">No tienes tickets resueltos</p>
                </div>
              ) : (
                resolvedTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-kavak-navy text-lg">{ticket.title}</h3>
                        <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                          Resuelto
                        </span>
                      </div>
                      <p className="text-kavak-gray-600 text-sm mb-2">{ticket.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-kavak-gray-500 text-xs">
                          {new Date(ticket.createdAt).toLocaleDateString('es-MX')}
                        </p>
                        {ticket.satisfaction && (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < ticket.satisfaction! ? 'text-yellow-400' : 'text-kavak-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        )}
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