from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/{ticket_id}", response_model=List[schemas.Message])
def get_messages(ticket_id: UUID, db: Session = Depends(get_db)):
    """Obtener mensajes de un ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return crud.get_messages(db, ticket_id)

@router.post("/", response_model=schemas.Message)
def create_message(message: schemas.MessageCreate, db: Session = Depends(get_db)):
    """Crear un nuevo mensaje en un ticket"""
    ticket = crud.get_ticket(db, message.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Crear mensaje del usuario
    user_message = crud.create_message(db, message)
    
    # Aquí puedes agregar lógica para generar respuesta automática del bot
    # Por ejemplo, integrar con OpenAI, Claude, etc.
    
    return user_message