from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, schemas
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/admin", tags=["admin"])

def verify_admin(user_id: str, db: Session = Depends(get_db)):
    """Middleware para verificar que el usuario es admin"""
    try:
        user = crud.get_user(db, UUID(user_id))
        if not user or user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos de administrador"
            )
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido"
        )

@router.get("/dashboard", response_model=schemas.AdminDashboardStats)
def get_admin_dashboard(user_id: str, db: Session = Depends(get_db)):
    """Obtener estadísticas del dashboard de admin"""
    verify_admin(user_id, db)
    return crud.get_admin_dashboard_stats(db)

@router.get("/users")
def get_all_users(user_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener todos los usuarios"""
    verify_admin(user_id, db)
    return crud.get_all_users(db, skip, limit)

@router.get("/users/{target_user_id}/tickets", response_model=List[schemas.Ticket])
def get_user_tickets(target_user_id: UUID, user_id: str, db: Session = Depends(get_db)):
    """Obtener tickets de un usuario específico"""
    verify_admin(user_id, db)
    return crud.get_user_tickets(db, target_user_id)

@router.get("/tickets", response_model=List[schemas.Ticket])
def get_all_tickets(user_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener todos los tickets"""
    verify_admin(user_id, db)
    return crud.get_all_tickets_admin(db, skip, limit)

@router.post("/ratings", response_model=schemas.MessageRating)
def rate_message(rating: schemas.MessageRatingCreate, user_id: str, db: Session = Depends(get_db)):
    """Evaluar un mensaje del bot"""
    verify_admin(user_id, db)
    return crud.create_message_rating(db, rating)

@router.get("/tickets/{ticket_id}/metrics", response_model=schemas.ChatbotMetric)
def get_ticket_metrics(ticket_id: UUID, user_id: str, db: Session = Depends(get_db)):
    """Obtener métricas de un ticket"""
    verify_admin(user_id, db)
    metric = crud.get_chatbot_metrics(db, ticket_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Métricas no encontradas")
    return metric