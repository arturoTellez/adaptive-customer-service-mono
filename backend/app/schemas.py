from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from uuid import UUID

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

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

class TicketWithMessages(Ticket):
    messages: List['Message'] = []

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

# Stats Schema
class TicketStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int