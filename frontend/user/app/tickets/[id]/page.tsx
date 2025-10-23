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
    // Mock ticket data
    const mockTicket: Ticket = {
      id: ticketId,
      title: 'Problema con el pago inicial',
      category: 'Financiamiento',
      status: 'active',
      createdAt: '2025-10-20T10:30:00',
      description: 'Necesito ayuda con el proceso de pago inicial de mi vehículo',
    };
    setTicket(mockTicket);

    // Mock chat history
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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
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
      // Aquí llamarías a tu API
      alert('Ticket marcado como resuelto');
      router.push('/dashboard');
    }
  };

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-kavak-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-kavak-gray-600">Cargando ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kavak-gray-50 flex flex-col">
      <Navbar />
      
      {/* Ticket Header */}
      <div className="bg-white shadow-lg border-b-2 border-kavak-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/tickets')}
            className="flex items-center text-kavak-blue hover:text-kavak-orange transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Tickets
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-kavak-navy">{ticket.title}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ticket.status === 'active'
                      ? 'bg-kavak-orange/10 text-kavak-orange'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {ticket.status === 'active' ? 'Activo' : 'Resuelto'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-kavak-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {ticket.category}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(ticket.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span>Ticket #{ticket.id}</span>
              </div>
            </div>

            {ticket.status === 'active' && (
              <button
                onClick={handleResolveTicket}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center"
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
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6 mb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          <div className="space-y-4">
            {/* Initial Ticket Message */}
            <div className="bg-kavak-gray-50 rounded-lg p-4 border-l-4 border-kavak-blue">
              <p className="text-sm font-semibold text-kavak-navy mb-1">Descripción del Ticket</p>
              <p className="text-kavak-gray-700">{ticket.description}</p>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-kavak-orange text-white rounded-br-none'
                      : 'bg-kavak-gray-100 text-kavak-navy rounded-bl-none'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-kavak-navy rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">K</span>
                      </div>
                      <span className="text-xs font-semibold">Asistente Kavak</span>
                    </div>
                  )}
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-kavak-gray-500'
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
                <div className="bg-kavak-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-kavak-navy rounded-full flex items-center justify-center">
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
        <div className="bg-white rounded-xl shadow-lg p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 px-4 py-3 border border-kavak-gray-300 rounded-lg focus:ring-2 focus:ring-kavak-orange focus:border-transparent transition-all"
              disabled={ticket.status === 'resolved'}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || ticket.status === 'resolved'}
              className="bg-kavak-orange hover:bg-kavak-orange-light text-white font-semibold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          {ticket.status === 'resolved' && (
            <p className="text-sm text-kavak-gray-500 mt-2 text-center">
              Este ticket ha sido resuelto. No se pueden enviar más mensajes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}