from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from . import models, schemas
from .utils import get_password_hash, verify_password
from typing import List, Optional, Dict, Any  # AGREGAR Dict y Any aquí
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

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Obtener todos los usuarios con estadísticas"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    
    users_with_stats = []
    for user in users:
        total_tickets = db.query(models.Ticket).filter(models.Ticket.user_id == user.id).count()
        open_tickets = db.query(models.Ticket).filter(
            and_(models.Ticket.user_id == user.id, models.Ticket.status.in_(["open", "in_progress"]))
        ).count()
        resolved_tickets = db.query(models.Ticket).filter(
            and_(models.Ticket.user_id == user.id, models.Ticket.status.in_(["resolved", "closed"]))
        ).count()
        
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "created_at": user.created_at,
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_tickets": resolved_tickets
        }
        users_with_stats.append(user_dict)
    
    return users_with_stats

def get_all_tickets_admin(db: Session, skip: int = 0, limit: int = 100):
    """Obtener todos los tickets (para admin)"""
    return db.query(models.Ticket).order_by(models.Ticket.created_at.desc()).offset(skip).limit(limit).all()

def get_user_tickets(db: Session, user_id: UUID):
    """Obtener tickets de un usuario específico"""
    return db.query(models.Ticket).filter(models.Ticket.user_id == user_id).order_by(models.Ticket.created_at.desc()).all()

# Ratings CRUD
def create_message_rating(db: Session, rating: schemas.MessageRatingCreate):
    """Crear evaluación de un mensaje"""
    db_rating = models.MessageRating(**rating.model_dump())
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    
    # Actualizar score de satisfacción del ticket
    if rating.rating:
        update_ticket_satisfaction_score(db, rating.ticket_id)
    
    return db_rating

def get_message_ratings(db: Session, ticket_id: UUID):
    """Obtener evaluaciones de un ticket"""
    return db.query(models.MessageRating).filter(models.MessageRating.ticket_id == ticket_id).all()

def update_ticket_satisfaction_score(db: Session, ticket_id: UUID):
    """Actualizar score promedio de satisfacción de un ticket"""
    ratings = db.query(models.MessageRating).filter(
        and_(models.MessageRating.ticket_id == ticket_id, models.MessageRating.rating.isnot(None))
    ).all()
    
    if ratings:
        avg_score = sum(r.rating for r in ratings) / len(ratings)
        
        metric = db.query(models.ChatbotMetric).filter(models.ChatbotMetric.ticket_id == ticket_id).first()
        if metric:
            metric.user_satisfaction_score = avg_score
            db.commit()

# Metrics CRUD
def get_chatbot_metrics(db: Session, ticket_id: UUID):
    """Obtener métricas de un ticket"""
    return db.query(models.ChatbotMetric).filter(models.ChatbotMetric.ticket_id == ticket_id).first()

def get_admin_dashboard_stats(db: Session) -> Dict[str, Any]:
    """Obtener estadísticas completas para el dashboard de admin"""
    
    # Usuarios totales
    total_users = db.query(models.User).filter(models.User.role == "user").count()
    
    # Tickets totales y por estado
    total_tickets = db.query(models.Ticket).count()
    open_tickets = db.query(models.Ticket).filter(models.Ticket.status.in_(["open", "in_progress"])).count()
    resolved_tickets = db.query(models.Ticket).filter(models.Ticket.status.in_(["resolved", "closed"])).count()
    
    # Mensajes totales
    total_messages = db.query(models.Message).count()
    bot_messages = db.query(models.Message).filter(models.Message.is_bot == True).count()
    
    # Tasa de éxito del chatbot (tickets resueltos sin escalamiento)
    total_resolved = db.query(models.Ticket).filter(models.Ticket.status == "resolved").count()
    escalated = db.query(models.ChatbotMetric).filter(models.ChatbotMetric.was_escalated == True).count()
    chatbot_success_rate = ((total_resolved - escalated) / total_resolved * 100) if total_resolved > 0 else 0
    
    # Tiempo promedio de resolución
    metrics_with_time = db.query(models.ChatbotMetric).filter(
        models.ChatbotMetric.resolution_time_minutes.isnot(None)
    ).all()
    avg_resolution_time = sum(m.resolution_time_minutes for m in metrics_with_time) / len(metrics_with_time) if metrics_with_time else 0
    
    # Satisfacción promedio
    metrics_with_satisfaction = db.query(models.ChatbotMetric).filter(
        models.ChatbotMetric.user_satisfaction_score.isnot(None)
    ).all()
    avg_satisfaction = sum(m.user_satisfaction_score for m in metrics_with_satisfaction) / len(metrics_with_satisfaction) if metrics_with_satisfaction else 0
    
    # Tickets por categoría
    tickets_by_category = {}
    categories = db.query(models.Ticket.category, func.count(models.Ticket.id)).group_by(models.Ticket.category).all()
    for category, count in categories:
        tickets_by_category[category] = count
    
    # Tickets por estado
    tickets_by_status = {
        "open": db.query(models.Ticket).filter(models.Ticket.status == "open").count(),
        "in_progress": db.query(models.Ticket).filter(models.Ticket.status == "in_progress").count(),
        "resolved": db.query(models.Ticket).filter(models.Ticket.status == "resolved").count(),
        "closed": db.query(models.Ticket).filter(models.Ticket.status == "closed").count()
    }
    
    # Actividad reciente (últimos 10 tickets)
    recent_tickets = db.query(models.Ticket).order_by(models.Ticket.created_at.desc()).limit(10).all()
    recent_activity = []
    for ticket in recent_tickets:
        recent_activity.append({
            "ticket_id": str(ticket.id),
            "user_name": ticket.user.name,
            "title": ticket.title,
            "status": ticket.status,
            "category": ticket.category,
            "created_at": ticket.created_at.isoformat()
        })
    
    return {
        "total_users": total_users,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "total_messages": total_messages,
        "bot_messages": bot_messages,
        "chatbot_success_rate": round(chatbot_success_rate, 2),
        "average_resolution_time": round(avg_resolution_time, 2),
        "average_satisfaction_score": round(avg_satisfaction, 2),
        "tickets_by_category": tickets_by_category,
        "tickets_by_status": tickets_by_status,
        "recent_activity": recent_activity
    }