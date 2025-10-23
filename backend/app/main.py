from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Customer Service API",
    description="API para sistema de tickets y chat con IA",
    version="1.0.0"
)

# CORS - DEBE IR PRIMERO
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://adaptative-customer-service-user.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 🔥 NUEVO: Middleware para capturar errores y siempre devolver CORS
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"❌ Error no capturado: {e}")
        import traceback
        traceback.print_exc()
        
        # Devolver error con headers CORS
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error del servidor: {str(e)}"},
            headers={
                "Access-Control-Allow-Origin": "https://adaptative-customer-service-user.vercel.app",
                "Access-Control-Allow-Credentials": "true",
            }
        )

# Rutas básicas
@app.get("/")
def read_root():
    return {"message": "Server is working!", "cors": "enabled"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {"message": "OK"}

# Importar routers
try:
    logger.info("🔵 Importando database...")
    from .database import engine, Base
    logger.info("✅ Database importado")
    
    logger.info("🔵 Importando auth router...")
    from .routers import auth
    app.include_router(auth.router)
    logger.info("✅ Auth router importado")
    
    logger.info("🔵 Importando tickets router...")
    from .routers import tickets
    app.include_router(tickets.router)
    logger.info("✅ Tickets router importado")
    
    logger.info("🔵 Importando messages router...")
    from .routers import messages
    app.include_router(messages.router)
    logger.info("✅ Messages router importado")
    
    logger.info("🔵 Importando admin router...")
    from .routers import admin
    app.include_router(admin.router)
    logger.info("✅ Admin router importado")
    
except Exception as e:
    logger.error(f"❌ ERROR al importar: {e}")
    import traceback
    traceback.print_exc()

logger.info("🎉 Aplicación lista!")