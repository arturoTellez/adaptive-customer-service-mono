from openai import OpenAI
import psycopg2
from psycopg2 import Error

# String de conexión
DATABASE_URL = "postgresql://postgres.nqfzagaxtsckofbuylra:HackathonKavak01!@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

try:
    # Conectar a la base de datos
    connection = psycopg2.connect(DATABASE_URL)
    cursor = connection.cursor()
    
    # Ejemplo 1: Obtener versión de PostgreSQL
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print("Conectado a PostgreSQL:")
    print(record[0])
    
    # Obtener todos los mensajes
    print("\n" + "="*80)
    print("MENSAJES ALMACENADOS")
    print("="*80)
    
    cursor.execute("""
        SELECT id, ticket_id, content, is_bot, sender_name, created_at 
        FROM messages 
        ORDER BY created_at DESC
    """)
    
    messages = cursor.fetchall()
    
    if messages:
        print(f"\nTotal de mensajes: {len(messages)}\n")
        
        for msg in messages:
            msg_id, ticket_id, content, is_bot, sender_name, created_at = msg
            
            print(f"ID: {msg_id}")
            print(f"Ticket ID: {ticket_id}")
            print(f"Remitente: {sender_name}")
            print(f"Es bot: {'Sí' if is_bot else 'No'}")
            print(f"Fecha: {created_at}")
            print(f"Contenido: {content}")
            print("-" * 80)
    else:
        print("\nNo hay mensajes almacenados en la tabla.")
    
except (Exception, Error) as error:
    print("Error al conectar a PostgreSQL:", error)

finally:
    # Cerrar conexión
    if connection:
        cursor.close()
        connection.close()
        print("\nConexión cerrada")

client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)