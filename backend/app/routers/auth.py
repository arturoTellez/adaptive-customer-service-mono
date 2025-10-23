from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup", response_model=schemas.User)  # CAMBIAR de UserResponse a User
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    # Verificar si el email ya existe
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear el usuario
    new_user = crud.create_user(db, user)
    return new_user

@router.post("/login")
def login(user_login: schemas.UserLogin, db: Session = Depends(get_db)) -> Dict:
    """Iniciar sesión"""
    # Autenticar usuario
    user = crud.authenticate_user(db, user_login.email, user_login.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Retornar datos del usuario
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,  # AGREGAR role
        "created_at": user.created_at.isoformat()
    }

@router.get("/me", response_model=schemas.User)  # CAMBIAR de UserResponse a User
def get_current_user(user_id: str, db: Session = Depends(get_db)):
    """Obtener información del usuario actual"""
    from uuid import UUID
    try:
        user = crud.get_user(db, UUID(user_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de usuario inválido"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user