'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'resolved';
  createdAt: string;
  description: string;
}

export default function TicketChatPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockTicket: Ticket = {
      id: ticketId,
      title: 'Problema con el pago inicial',
      category: 'Financiamiento',
      status: 'active',
      createdAt: '2025-10-20T10:30:00',
      description: 'Necesito ayuda con el proceso de pago inicial de mi vehículo',
    };
    setTicket(mockTicket);

    const mockMessages: Message[] = [
      {
        id: '1',
        text: '¡Hola! Gracias por contactar a Soporte Kavak. He revisado tu ticket sobre "Problema con el pago inicial". ¿En qué puedo ayudarte específicamente?',
        sender: 'bot',
        timestamp: '2025-10-20T10:31:00',
      },
      {
        id: '2',
        text: 'Hola, estoy tratando de hacer el pago inicial pero la plataforma me marca error',
        sender: 'user',
        timestamp: '2025-10-20T10:32:00',
      },
      {
        id: '3',
        text: 'Entiendo tu situación. ¿Podrías decirme qué mensaje de error específico estás viendo en la pantalla?',
        sender: 'bot',
        timestamp: '2025-10-20T10:32:30',
      },
      {
        id: '4',
        text: 'Dice "Error al procesar el pago. Intenta nuevamente"',
        sender: 'user',
        timestamp: '2025-10-20T10:33:00',
      },
    ];
    setMessages(mockMessages);
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Gracias por la información. Estoy revisando tu caso con nuestro equipo de pagos. Te actualizaré en breve con una solución.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleResolveTicket = () => {
    if (confirm('¿Estás seguro de que quieres marcar este ticket como resuelto?')) {
      alert('Ticket marcado como resuelto');
      router.push('/dashboard');
    }
  };

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kavak-gray-600 text-lg">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Ticket Header */}
      <div className="bg-white border-b-2 border-kavak-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <button
            onClick={() => router.push('/tickets')}
            className="flex items-center text-kavak-blue hover:text-kavak-orange transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Volver a Tickets</span>
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-kavak-navy">{ticket.title}</h1>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    ticket.status === 'active'
                      ? 'bg-kavak-orange/10 text-kavak-orange'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {ticket.status === 'active' ? 'Activo' : 'Resuelto'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-kavak-gray-600">
                <span className="flex items-center gap-2 bg-kavak-gray-50 px-4 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {ticket.category}
                </span>
                <span className="flex items-center gap-2 bg-kavak-gray-50 px-4 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="bg-kavak-gray-50 px-4 py-2 rounded-lg font-medium">
                  Ticket #{ticket.id}
                </span>
              </div>
            </div>

            {ticket.status === 'active' && (
              <button
                onClick={handleResolveTicket}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-8 rounded-xl transition-all flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como Resuelto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-8 flex flex-col">
        {/* Messages Area */}
        <div 
          className="flex-1 bg-kavak-gray-50 rounded-3xl p-8 mb-6 overflow-y-auto shadow-inner" 
          style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}
        >
          <div className="space-y-6">
            {/* Initial Ticket Message */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-kavak-blue shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-kavak-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-bold text-kavak-navy">Descripción del Ticket</p>
              </div>
              <p className="text-kavak-gray-700 leading-relaxed">{ticket.description}</p>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-kavak-orange to-kavak-orange-light text-white rounded-br-none'
                      : 'bg-white text-kavak-navy rounded-bl-none border border-kavak-gray-100'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">K</span>
                      </div>
                      <span className="text-xs font-bold text-kavak-navy">Asistente Kavak</span>
                    </div>
                  )}
                  <p className="text-[15px] leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-white/80' : 'text-kavak-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('es-MX', {
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
                <div className="bg-white rounded-2xl rounded-bl-none px-6 py-4 border border-kavak-gray-100 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-kavak-navy to-kavak-blue rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">K</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 bg-kavak-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-kavak-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2.5 h-2.5 bg-kavak-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-kavak-gray-100 p-6">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 px-6 py-4 border-2 border-kavak-gray-200 rounded-xl focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all text-kavak-navy placeholder:text-kavak-gray-400"
              disabled={ticket.status === 'resolved'}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || ticket.status === 'resolved'}
              className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          {ticket.status === 'resolved' && (
            <p className="text-sm text-kavak-gray-500 mt-4 text-center bg-kavak-gray-50 py-3 rounded-lg">
              Este ticket ha sido resuelto. No se pueden enviar más mensajes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}