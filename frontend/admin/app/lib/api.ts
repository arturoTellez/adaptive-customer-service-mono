const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Tipos
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface UserWithStats extends User {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
}

export interface AdminDashboardStats {
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  total_messages: number;
  bot_messages: number;
  chatbot_success_rate: number;
  average_resolution_time: number;
  average_satisfaction_score: number;
  tickets_by_category: Record<string, number>;
  tickets_by_status: Record<string, number>;
  recent_activity: Array<{
    ticket_id: string;
    user_name: string;
    title: string;
    status: string;
    category: string;
    created_at: string;
  }>;
}

export interface MessageRating {
  message_id: string;
  ticket_id: string;
  rating?: number;
  is_helpful?: boolean;
  feedback_text?: string;
}


export interface LoginResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
  role: string;
}

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

export interface TicketWithMessages extends Ticket {
  messages: Message[];
}

// API Functions
export const api = {
  // Auth
  async signup(data: { email: string; name: string; password: string }): Promise<User> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al registrar usuario');
    }
    return response.json();
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al iniciar sesión');
    }
    return response.json();
  },

  async getCurrentUser(userId: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me?user_id=${userId}`);
    if (!response.ok) throw new Error('Error al obtener usuario');
    return response.json();
  },

  // Tickets
  async getTickets(userId?: string): Promise<Ticket[]> {
    const url = userId ? `${API_URL}/tickets/?user_id=${userId}` : `${API_URL}/tickets/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al obtener tickets');
    return response.json();
  },

  async getTicket(ticketId: string): Promise<TicketWithMessages> {
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
  // Admin Functions
  async getAdminDashboard(adminUserId: string): Promise<AdminDashboardStats> {
    const response = await fetch(`${API_URL}/admin/dashboard?user_id=${adminUserId}`);
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  async getAllUsers(adminUserId: string): Promise<UserWithStats[]> {
    const response = await fetch(`${API_URL}/admin/users?user_id=${adminUserId}`);
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return response.json();
  },

  async getUserTickets(adminUserId: string, targetUserId: string): Promise<Ticket[]> {
    const response = await fetch(`${API_URL}/admin/users/${targetUserId}/tickets?user_id=${adminUserId}`);
    if (!response.ok) throw new Error('Error al obtener tickets del usuario');
    return response.json();
  },

  async getAllTicketsAdmin(adminUserId: string): Promise<Ticket[]> {
    const response = await fetch(`${API_URL}/admin/tickets?user_id=${adminUserId}`);
    if (!response.ok) throw new Error('Error al obtener tickets');
    return response.json();
  },

  async rateMessage(adminUserId: string, rating: MessageRating): Promise<any> {
    const response = await fetch(`${API_URL}/admin/ratings?user_id=${adminUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rating),
    });
    if (!response.ok) throw new Error('Error al evaluar mensaje');
    return response.json();
  },
};