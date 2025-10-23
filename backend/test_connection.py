from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print("✅ Conexión exitosa!")
        print(f"PostgreSQL version: {result.fetchone()[0]}")
except Exception as e:
    print(f"❌ Error de conexión: {e}")