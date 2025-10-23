from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from .. import crud, schemas
from ..database import get_db
from ..services.chatbot import ChatbotService

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
    
    # Si el mensaje NO es del bot, generar respuesta automática
    if not message.is_bot:
        try:
            # Obtener historial de mensajes del ticket
            all_messages = crud.get_messages(db, message.ticket_id)
            
            # Convertir a formato OpenAI (excluyendo el mensaje que acabamos de crear)
            conversation_history = ChatbotService.format_conversation_history(
                [msg for msg in all_messages if msg.id != user_message.id]
            )
            
            # Generar respuesta con OpenAI
            bot_response = ChatbotService.generate_response(
                user_message=message.content,
                conversation_history=conversation_history,
                ticket_category=ticket.category,
                ticket_description=ticket.description
            )
            
            # Guardar respuesta del bot
            bot_message = schemas.MessageCreate(
                ticket_id=message.ticket_id,
                content=bot_response,
                is_bot=True,
                sender_name="Asistente Kavak"
            )
            crud.create_message(db, bot_message)
            
        except Exception as e:
            print(f"Error al generar respuesta del bot: {e}")
            # Si falla OpenAI, no hacemos nada - el usuario puede intentar de nuevo
    
    return user_message

@router.post("/bot-response", response_model=schemas.Message)
def generate_bot_response(ticket_id: UUID, db: Session = Depends(get_db)):
    """Endpoint alternativo para generar respuesta del bot manualmente"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Obtener todos los mensajes
    all_messages = crud.get_messages(db, ticket_id)
    
    if not all_messages:
        raise HTTPException(status_code=400, detail="No hay mensajes en el ticket")
    
    # Obtener el último mensaje del usuario
    last_user_message = None
    for msg in reversed(all_messages):
        if not msg.is_bot:
            last_user_message = msg
            break
    
    if not last_user_message:
        raise HTTPException(status_code=400, detail="No hay mensajes del usuario")
    
    # Generar respuesta
    conversation_history = ChatbotService.format_conversation_history(all_messages)
    
    bot_response = ChatbotService.generate_response(
        user_message=last_user_message.content,
        conversation_history=conversation_history,
        ticket_category=ticket.category,
        ticket_description=ticket.description
    )
    
    # Guardar respuesta del bot
    bot_message = schemas.MessageCreate(
        ticket_id=ticket_id,
        content=bot_response,
        is_bot=True,
        sender_name="Asistente Kavak"
    )
    
    return crud.create_message(db, bot_message)