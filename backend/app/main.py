from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import tickets, messages
from .database import engine, Base

# Crear tablas (en producción usa Alembic para migraciones)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Service API",
    description="API para sistema de tickets y chat",
    version="1.0.0"
)

# Configurar CORS para Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Tu frontend de Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(tickets.router)
app.include_router(messages.router)

@app.get("/")
def read_root():
    return {"message": "Customer Service API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}