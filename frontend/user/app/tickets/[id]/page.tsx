'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { api, TicketWithMessages, Message } from '@/app/lib/api';
import { useAuth } from '@/app/lib/AuthContext';

export default function TicketChatPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [ticket, setTicket] = useState<TicketWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadTicketAndMessages();
    }
  }, [ticketId, user, authLoading, router]);

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
      sender_name: 'Tú',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const userMessage = await api.sendMessage({
        ticket_id: ticketId,
        content: inputMessage,
        is_bot: false,
        sender_name: user?.name || 'Usuario',
      });

      setMessages((prev) => 
        prev.map(msg => msg.id === tempMessage.id ? userMessage : msg)
      );

      // Simular respuesta del bot
      setTimeout(async () => {
        try {
          const botMessage = await api.sendMessage({
            ticket_id: ticketId,
            content: 'Gracias por tu mensaje. Estoy revisando tu caso y te responderé pronto.',
            is_bot: true,
            sender_name: 'Asistente Kavak',
          });
          setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
          console.error('Error al enviar respuesta del bot:', err);
        } finally {
          setIsTyping(false);
        }
      }, 2000);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
      setIsTyping(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!ticket || !confirm('¿Estás seguro de que quieres marcar este ticket como resuelto?')) {
      return;
    }

    try {
      await api.updateTicket(ticketId, { status: 'resolved' });
      setTicket({ ...ticket, status: 'resolved' });
      alert('Ticket marcado como resuelto');
    } catch (err) {
      console.error('Error al resolver ticket:', err);
      alert('Error al actualizar el ticket');
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

  // Loading del ticket
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Navbar />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kavak-gray-600 text-lg">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Navbar />
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Ticket no encontrado'}</p>
          <button
            onClick={() => router.push('/tickets')}
            className="bg-kavak-orange text-white px-6 py-2 rounded-lg hover:bg-kavak-orange-light"
          >
            Volver a Tickets
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

  const isTicketClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Ticket Header */}
      <div className="bg-white border-b border-kavak-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/tickets')}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-kavak-blue hover:text-kavak-orange hover:bg-kavak-gray-50 rounded-lg transition-all group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-kavak-navy truncate">{ticket.title}</h1>
                  <span
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                      isTicketClosed
                        ? 'bg-green-50 text-green-600'
                        : 'bg-kavak-orange/10 text-kavak-orange'
                    }`}
                  >
                    {getStatusText(ticket.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-kavak-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {ticket.category}
                  </span>
                  <span>•</span>
                  <span>#{ticket.id.substring(0, 8)}</span>
                  <span>•</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>

            {/* Right side */}
            {!isTicketClosed && (
              <button
                onClick={handleResolveTicket}
                className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Marcar como Resuelto</span>
                <span className="sm:hidden">Resuelto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-4">
        {/* Messages Area */}
        <div 
          className="flex-1 bg-kavak-gray-50 rounded-2xl p-6 mb-4 overflow-y-auto" 
          style={{ height: 'calc(100vh - 280px)' }}
        >
          <div className="space-y-4">
            {/* Initial Ticket Message */}
            <div className="bg-white rounded-xl p-4 border-l-4 border-kavak-blue shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-kavak-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs font-bold text-kavak-navy">Descripción del Ticket</p>
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
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-lg ${
                    message.is_bot
                      ? 'bg-white text-kavak-navy rounded-bl-none border border-kavak-gray-100'
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
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.is_bot ? 'text-kavak-gray-500' : 'text-white/80'
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

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none px-5 py-3 border border-kavak-gray-100 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">K</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-kavak-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-kavak-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-kavak-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-xl shadow-lg border border-kavak-gray-100 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-3 border-2 border-kavak-gray-200 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-sm text-kavak-navy placeholder:text-kavak-gray-400"
              disabled={isTicketClosed}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTicketClosed}
              className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          {isTicketClosed && (
            <p className="text-xs text-kavak-gray-500 mt-3 text-center bg-kavak-gray-50 py-2 rounded-lg">
              Este ticket ha sido resuelto
            </p>
          )}
        </div>
      </div>
    </div>
  );
}