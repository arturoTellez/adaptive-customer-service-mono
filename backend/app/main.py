from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import tickets, messages, auth
from .database import engine, Base
import os
from dotenv import load_dotenv

load_dotenv()

# Verificar que existe la API key de OpenAI
if not os.getenv("OPENAI_API_KEY"):
    print("⚠️  WARNING: OPENAI_API_KEY no está configurada en .env")
else:
    print("✅ OpenAI API Key configurada correctamente")

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Service API",
    description="API para sistema de tickets y chat con IA",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {
        "message": "Customer Service API with AI",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}