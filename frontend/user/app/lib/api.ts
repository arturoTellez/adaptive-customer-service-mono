const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Tipos
export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  ticket_id: string;
  content: string;
  is_bot: boolean;
  sender_name?: string;
  created_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

// API Functions
export const api = {
  // Tickets
  async getTickets(userId?: string): Promise<Ticket[]> {
    const url = userId ? `${API_URL}/tickets/?user_id=${userId}` : `${API_URL}/tickets/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener tickets');
    return response.json();
  },

  async getTicket(ticketId: string): Promise<Ticket & { messages: Message[] }> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`);
    if (!response.ok) throw new Error('Error al obtener ticket');
    return response.json();
  },

  async createTicket(ticket: {
    user_id: string;
    title: string;
    category: string;
    description: string;
  }): Promise<Ticket> {
    const response = await fetch(`${API_URL}/tickets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!response.ok) throw new Error('Error al crear ticket');
    return response.json();
  },

  async updateTicket(ticketId: string, data: Partial<Ticket>): Promise<Ticket> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar ticket');
    return response.json();
  },

  async getTicketStats(userId?: string): Promise<TicketStats> {
    const url = userId ? `${API_URL}/tickets/stats?user_id=${userId}` : `${API_URL}/tickets/stats`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  // Messages
  async getMessages(ticketId: string): Promise<Message[]> {
    const response = await fetch(`${API_URL}/messages/${ticketId}`);
    if (!response.ok) throw new Error('Error al obtener mensajes');
    return response.json();
  },

  async sendMessage(message: {
    ticket_id: string;
    content: string;
    is_bot?: boolean;
    sender_name?: string;
  }): Promise<Message> {
    const response = await fetch(`${API_URL}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Error al enviar mensaje');
    return response.json();
  },
};