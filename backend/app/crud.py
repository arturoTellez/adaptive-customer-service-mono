from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from .utils import get_password_hash, verify_password
from typing import List, Optional
from uuid import UUID

# User CRUD
def get_user(db: Session, user_id: UUID):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

# Ticket CRUD
def get_tickets(db: Session, user_id: Optional[UUID] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Ticket)
    if user_id:
        query = query.filter(models.Ticket.user_id == user_id)
    return query.order_by(models.Ticket.created_at.desc()).offset(skip).limit(limit).all()

def get_ticket(db: Session, ticket_id: UUID):
    return db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()

def create_ticket(db: Session, ticket: schemas.TicketCreate):
    db_ticket = models.Ticket(**ticket.model_dump())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def update_ticket(db: Session, ticket_id: UUID, ticket_update: schemas.TicketUpdate):
    db_ticket = get_ticket(db, ticket_id)
    if db_ticket:
        update_data = ticket_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ticket, key, value)
        db.commit()
        db.refresh(db_ticket)
    return db_ticket

def get_ticket_stats(db: Session, user_id: Optional[UUID] = None):
    query = db.query(models.Ticket)
    if user_id:
        query = query.filter(models.Ticket.user_id == user_id)
    
    total = query.count()
    open_count = query.filter(models.Ticket.status == "open").count()
    in_progress = query.filter(models.Ticket.status == "in_progress").count()
    resolved = query.filter(models.Ticket.status == "resolved").count()
    closed = query.filter(models.Ticket.status == "closed").count()
    
    return schemas.TicketStats(
        total=total,
        open=open_count,
        in_progress=in_progress,
        resolved=resolved,
        closed=closed
    )

# Message CRUD
def get_messages(db: Session, ticket_id: UUID):
    return db.query(models.Message).filter(
        models.Message.ticket_id == ticket_id
    ).order_by(models.Message.created_at.asc()).all()

def create_message(db: Session, message: schemas.MessageCreate):
    db_message = models.Message(**message.model_dump())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message