from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

print("🔵 Iniciando aplicación...")

app = FastAPI(
    title="Customer Service API",
    description="API para sistema de tickets y chat con IA",
    version="1.0.0"
)

print("🔵 FastAPI creado...")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔵 CORS configurado...")

@app.get("/")
def read_root():
    return {"message": "Server is working!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

print("🔵 Rutas básicas configuradas...")

# COMENTAR TEMPORALMENTE LA CONEXIÓN A LA BD
try:
    print("🔵 Importando database...")
    from .database import engine, Base
    print("✅ Database importado")
    
    # COMENTAR ESTO TEMPORALMENTE
    # print("🔵 Creando tablas...")
    # Base.metadata.create_all(bind=engine)
    # print("✅ Tablas creadas")
    
    print("🔵 Importando auth router...")
    from .routers import auth
    app.include_router(auth.router)
    print("✅ Auth router importado")
    
    print("🔵 Importando tickets router...")
    from .routers import tickets
    app.include_router(tickets.router)
    print("✅ Tickets router importado")
    
    print("🔵 Importando messages router...")
    from .routers import messages
    app.include_router(messages.router)
    print("✅ Messages router importado")
    
    print("🔵 Importando admin router...")
    from .routers import admin
    app.include_router(admin.router)
    print("✅ Admin router importado")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("🔵 Aplicación lista!")

if not os.getenv("OPENAI_API_KEY"):
    print("⚠️  WARNING: OPENAI_API_KEY no está configurada en .env")
else:
    print("✅ OpenAI API Key configurada correctamente")