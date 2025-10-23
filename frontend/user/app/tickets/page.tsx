'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'resolved';
  createdAt: string;
  lastMessage?: string;
  unreadMessages?: number;
}

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    // Mock data - En producción vendría de tu API
    const mockTickets: Ticket[] = [
      {
        id: '1',
        title: 'Problema con el pago inicial',
        category: 'Financiamiento',
        status: 'active',
        createdAt: '2025-10-20T10:30:00',
        lastMessage: 'Nuestro equipo está revisando tu caso...',
        unreadMessages: 2,
      },
      {
        id: '2',
        title: 'Consulta sobre garantía',
        category: 'Garantías',
        status: 'active',
        createdAt: '2025-10-21T14:20:00',
        lastMessage: 'La garantía cubre...',
        unreadMessages: 0,
      },
      {
        id: '3',
        title: 'Documentación del vehículo',
        category: 'Documentos',
        status: 'resolved',
        createdAt: '2025-10-15T09:15:00',
        lastMessage: 'Ticket resuelto. ¡Gracias!',
        unreadMessages: 0,
      },
      {
        id: '4',
        title: 'Fecha de entrega del auto',
        category: 'Entrega del Vehículo',
        status: 'resolved',
        createdAt: '2025-10-10T16:45:00',
        lastMessage: 'Tu vehículo será entregado el...',
        unreadMessages: 0,
      },
    ];
    setTickets(mockTickets);
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-kavak-orange/10 text-kavak-orange border-kavak-orange';
      case 'resolved':
        return 'bg-green-50 text-green-600 border-green-500';
      default:
        return 'bg-kavak-gray-100 text-kavak-gray-600 border-kavak-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'resolved':
        return 'Resuelto';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-kavak-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-kavak-navy mb-2">Mis Tickets</h1>
            <p className="text-kavak-gray-600">
              Gestiona y revisa todos tus tickets de soporte
            </p>
          </div>
          <Link href="/tickets/new">
            <button className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Ticket
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-kavak-navy text-white'
                  : 'bg-kavak-gray-100 text-kavak-gray-700 hover:bg-kavak-gray-200'
              }`}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'active'
                  ? 'bg-kavak-orange text-white'
                  : 'bg-kavak-gray-100 text-kavak-gray-700 hover:bg-kavak-gray-200'
              }`}
            >
              Activos ({tickets.filter(t => t.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'resolved'
                  ? 'bg-green-500 text-white'
                  : 'bg-kavak-gray-100 text-kavak-gray-700 hover:bg-kavak-gray-200'
              }`}
            >
              Resueltos ({tickets.filter(t => t.status === 'resolved').length})
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-lg">
              <svg className="w-20 h-20 text-kavak-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-kavak-navy mb-2">No hay tickets</h3>
              <p className="text-kavak-gray-600 mb-6">
                No se encontraron tickets con el filtro seleccionado
              </p>
              <Link href="/tickets/new">
                <button className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold py-3 px-6 rounded-lg transition-all">
                  Crear Primer Ticket
                </button>
              </Link>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-transparent hover:border-kavak-orange">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Left Side */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-kavak-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-kavak-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-kavak-navy text-lg truncate">
                              {ticket.title}
                            </h3>
                            {ticket.unreadMessages! > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {ticket.unreadMessages}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                              {getStatusText(ticket.status)}
                            </span>
                            <span className="bg-kavak-gray-100 text-kavak-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                              {ticket.category}
                            </span>
                          </div>

                          {ticket.lastMessage && (
                            <p className="text-kavak-gray-600 text-sm truncate mb-2">
                              {ticket.lastMessage}
                            </p>
                          )}

                          <p className="text-kavak-gray-500 text-xs">
                            Creado el {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Arrow */}
                    <div className="flex items-center justify-end sm:justify-center">
                      <svg className="w-6 h-6 text-kavak-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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