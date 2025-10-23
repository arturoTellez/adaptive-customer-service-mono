from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL no está definida")

# ✅ Configuración robusta con pooler
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,                     # Reducido para Railway (tiene límites)
    max_overflow=10,
    pool_pre_ping=True,              # ✅ CRÍTICO: Detecta conexiones muertas
    pool_recycle=1800,               # 30 minutos
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

# Verificar conexión al iniciar
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("✅ Conexión a DB verificada")
except Exception as e:
    logger.error(f"❌ Error conectando a DB: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"❌ Error en sesión: {e}")
        db.rollback()
        raise
    finally:
        db.close()