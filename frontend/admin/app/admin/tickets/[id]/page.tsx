'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { api, TicketWithMessages, Message } from '@/app/lib/api';
import { useAuth } from '@/app/lib/AuthContext';

export default function AdminTicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;
    const { user, loading: authLoading, isAdmin } = useAuth();

    const [ticket, setTicket] = useState<TicketWithMessages | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!isAdmin) {
                router.push('/dashboard');
            } else {
                loadTicketAndMessages();
            }
        }
    }, [ticketId, user, authLoading, isAdmin, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadTicketAndMessages = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getTicket(ticketId);
            setTicket(data);
            setMessages(data.messages || []);
        } catch (err) {
            console.error('Error al cargar ticket:', err);
            setError('Error al cargar el ticket');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !ticket) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            ticket_id: ticketId,
            content: inputMessage,
            is_bot: false,
            sender_name: 'Administrador',
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMessage]);
        setInputMessage('');

        try {
            const adminMessage = await api.sendMessage({
                ticket_id: ticketId,
                content: inputMessage,
                is_bot: false,
                sender_name: `Admin: ${user?.name}`,
            });

            setMessages((prev) =>
                prev.map(msg => msg.id === tempMessage.id ? adminMessage : msg)
            );
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
            setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
            alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
        }
    };

    const handleUpdateStatus = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
        if (!ticket) return;

        try {
            await api.updateTicket(ticketId, { status: newStatus });
            setTicket({ ...ticket, status: newStatus });
            alert(`Ticket actualizado a: ${getStatusText(newStatus)}`);
        } catch (err) {
            console.error('Error al actualizar ticket:', err);
            alert('Error al actualizar el ticket');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-kavak-gray-600 text-lg">Cargando ticket...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) return null;

    if (error || !ticket) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Navbar />
                <div className="text-center">
                    <p className="text-red-600 text-lg mb-4">{error || 'Ticket no encontrado'}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-kavak-orange text-white px-6 py-2 rounded-lg hover:bg-kavak-orange-light"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            open: 'Abierto',
            in_progress: 'En Progreso',
            resolved: 'Resuelto',
            closed: 'Cerrado',
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-red-100 text-red-700';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-700';
            case 'resolved':
            case 'closed':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const isTicketClosed = ticket.status === 'resolved' || ticket.status === 'closed';

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-kavak-navy to-kavak-blue text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left side */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <button
                                onClick={() => router.back()}
                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
                                        ADMIN VIEW
                                    </span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(ticket.status)}`}>
                                        {getStatusText(ticket.status)}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        {ticket.category}
                                    </span>
                                    <span>•</span>
                                    <span>#{ticket.id.substring(0, 8)}</span>
                                    <span>•</span>
                                    <span>{new Date(ticket.created_at).toLocaleDateString('es-MX', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Status Actions */}
                        <div className="flex-shrink-0">
                            <div className="flex gap-2">
                                {ticket.status !== 'in_progress' && (
                                    <button
                                        onClick={() => handleUpdateStatus('in_progress')}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Marcar En Progreso
                                    </button>
                                )}
                                {ticket.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus('resolved')}
                                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Marcar Resuelto
                                    </button>
                                )}
                                {ticket.status !== 'closed' && (
                                    <button
                                        onClick={() => handleUpdateStatus('closed')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                                    >
                                        Cerrar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
                {/* Messages Area */}
                <div
                    className="flex-1 bg-gray-50 rounded-2xl p-6 mb-4 overflow-y-auto"
                    style={{ height: 'calc(100vh - 350px)' }}
                >
                    <div className="space-y-4">
                        {/* Initial Ticket Message */}
                        <div className="bg-white rounded-xl p-5 border-l-4 border-kavak-blue shadow-md">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-kavak-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm font-bold text-kavak-navy">Descripción del Ticket</p>
                            </div>
                            <p className="text-sm text-kavak-gray-700 leading-relaxed">{ticket.description}</p>
                        </div>

                        {/* Messages */}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-lg ${message.is_bot
                                            ? 'bg-white text-kavak-navy rounded-bl-none border border-kavak-gray-100'
                                            : message.sender_name?.startsWith('Admin')
                                                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none'
                                                : 'bg-gradient-to-br from-kavak-orange to-kavak-orange-light text-white rounded-br-none'
                                        }`}
                                >
                                    {message.is_bot && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full flex items-center justify-center shadow-lg">
                                                <span className="text-white text-xs font-bold">K</span>
                                            </div>
                                            <span className="text-xs font-bold text-kavak-navy">Asistente Kavak</span>
                                        </div>
                                    )}
                                    {!message.is_bot && message.sender_name?.startsWith('Admin') && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-white/90">{message.sender_name}</span>
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${message.is_bot ? 'text-kavak-gray-500' : 'text-white/80'
                                            }`}
                                    >
                                        {new Date(message.created_at).toLocaleTimeString('es-MX', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-xl shadow-lg border border-kavak-gray-200 p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Escribe un mensaje como administrador..."
                            className="flex-1 px-4 py-3 border-2 border-kavak-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm text-kavak-navy placeholder:text-kavak-gray-400"
                            disabled={isTicketClosed}
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || isTicketClosed}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                    {isTicketClosed && (
                        <p className="text-xs text-kavak-gray-500 mt-3 text-center bg-kavak-gray-50 py-2 rounded-lg">
                            Este ticket ha sido cerrado
                        </p>
                    )}
                    <p className="text-xs text-purple-600 mt-2 text-center font-medium">
                        💼 Respondiendo como Administrador
                    </p>
                </div>
            </div>
        </div>
    );
}