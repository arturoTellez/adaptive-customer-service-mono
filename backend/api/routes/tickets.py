from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("/stats", response_model=schemas.TicketStats)
def get_stats(user_id: UUID = None, db: Session = Depends(get_db)):
    """Obtener estadísticas de tickets"""
    return crud.get_ticket_stats(db, user_id)

@router.get("/", response_model=List[schemas.Ticket])
def get_tickets(user_id: UUID = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de tickets"""
    return crud.get_tickets(db, user_id, skip, limit)

@router.get("/{ticket_id}", response_model=schemas.TicketWithMessages)
def get_ticket(ticket_id: UUID, db: Session = Depends(get_db)):
    """Obtener un ticket específico con sus mensajes"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket

@router.post("/", response_model=schemas.Ticket)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    """Crear un nuevo ticket"""
    return crud.create_ticket(db, ticket)

@router.patch("/{ticket_id}", response_model=schemas.Ticket)
def update_ticket(ticket_id: UUID, ticket_update: schemas.TicketUpdate, db: Session = Depends(get_db)):
    """Actualizar un ticket"""
    ticket = crud.update_ticket(db, ticket_id, ticket_update)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket