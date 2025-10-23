from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from uuid import UUID

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    role: str  # NUEVO CAMPO
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserWithStats(User):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int

# Ticket Schemas
class TicketBase(BaseModel):
    title: str
    category: str
    description: str

class TicketCreate(TicketBase):
    user_id: UUID

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Ticket(TicketBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str
    is_bot: bool = False
    sender_name: Optional[str] = None

class MessageCreate(MessageBase):
    ticket_id: UUID

class Message(MessageBase):
    id: UUID
    ticket_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# TicketWithMessages
class TicketWithMessages(Ticket):
    messages: List[Message] = []
    
    class Config:
        from_attributes = True

# Stats Schema
class TicketStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int


class MessageRatingCreate(BaseModel):
    message_id: UUID
    ticket_id: UUID
    rating: Optional[int] = None
    is_helpful: Optional[bool] = None
    feedback_text: Optional[str] = None

class MessageRating(MessageRatingCreate):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Metrics Schemas
class ChatbotMetric(BaseModel):
    id: UUID
    ticket_id: UUID
    total_messages: int
    bot_messages: int
    user_messages: int
    resolution_time_minutes: Optional[int]
    was_escalated: bool
    average_response_time_seconds: Optional[float]
    user_satisfaction_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Stats
class AdminDashboardStats(BaseModel):
    total_users: int
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    total_messages: int
    bot_messages: int
    chatbot_success_rate: float
    average_resolution_time: float
    average_satisfaction_score: float
    tickets_by_category: dict
    tickets_by_status: dict
    recent_activity: List[dict]