from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # NUEVO CAMPO
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tickets = relationship("Ticket", back_populates="user")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="tickets")
    messages = relationship("Message", back_populates="ticket")
    ratings = relationship("MessageRating", back_populates="ticket")
    metrics = relationship("ChatbotMetric", back_populates="ticket", uselist=False)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    is_bot = Column(Boolean, default=False)
    sender_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="messages")
    rating = relationship("MessageRating", back_populates="message", uselist=False)

class MessageRating(Base):
    __tablename__ = "message_ratings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"))
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"))
    rating = Column(Integer)  # 1-5
    is_helpful = Column(Boolean)
    feedback_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    message = relationship("Message", back_populates="rating")
    ticket = relationship("Ticket", back_populates="ratings")

class ChatbotMetric(Base):
    __tablename__ = "chatbot_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True)
    total_messages = Column(Integer, default=0)
    bot_messages = Column(Integer, default=0)
    user_messages = Column(Integer, default=0)
    resolution_time_minutes = Column(Integer)
    was_escalated = Column(Boolean, default=False)
    average_response_time_seconds = Column(Float)
    user_satisfaction_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="metrics")