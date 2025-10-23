import os
from openai import OpenAI
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatbotService:
    """Servicio para manejar conversaciones con OpenAI"""
    
    @staticmethod
    def get_system_prompt() -> str:
        """Prompt del sistema para el chatbot de Kavak"""
        return """Eres un asistente virtual de Kavak, la plataforma líder de compra-venta de autos usados en América Latina.

Tu rol es ayudar a los clientes con sus consultas sobre:
- Financiamiento: planes de pago, requisitos, tasas de interés
- Garantías: cobertura, duración, qué incluye
- Documentación: papeles necesarios, trámites, transferencias
- Entrega del vehículo: tiempos, logística, proceso
- Mantenimiento: servicios incluidos, talleres autorizados
- Soporte técnico: problemas con la plataforma o app

Características de tu personalidad:
- Amable, profesional y empático
- Respuestas claras y concisas (máximo 3-4 párrafos)
- Si no sabes algo, di que escalarás el caso con un especialista
- Usa un tono cercano pero profesional
- Evita jerga técnica innecesaria

Formato de respuesta:
- Saluda al cliente si es su primer mensaje
- Responde de forma directa a su pregunta
- Ofrece información adicional relevante si es útil
- Si el caso es complejo, ofrece escalarlo a un agente humano

IMPORTANTE: Mantén las respuestas breves y al punto. Los clientes valoran la eficiencia."""

    @staticmethod
    def generate_response(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        ticket_category: str = "",
        ticket_description: str = ""
    ) -> str:
        """
        Genera una respuesta del chatbot usando OpenAI
        
        Args:
            user_message: Mensaje del usuario
            conversation_history: Historial previo (lista de {"role": "user/assistant", "content": "..."})
            ticket_category: Categoría del ticket
            ticket_description: Descripción inicial del problema
        
        Returns:
            Respuesta del chatbot
        """
        try:
            # Construir el contexto del ticket
            context = ""
            if ticket_category and ticket_description:
                context = f"\n\nContexto del ticket:\nCategoría: {ticket_category}\nDescripción: {ticket_description}"
            
            # Construir mensajes para OpenAI
            messages = [
                {"role": "system", "content": ChatbotService.get_system_prompt() + context}
            ]
            
            # Agregar historial de conversación (últimos 10 mensajes para no exceder tokens)
            messages.extend(conversation_history[-10:])
            
            # Agregar el nuevo mensaje del usuario
            messages.append({"role": "user", "content": user_message})
            
            # Llamar a OpenAI
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",  # O "gpt-4" si tienes acceso
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                top_p=0.9,
                frequency_penalty=0.5,
                presence_penalty=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error al generar respuesta con OpenAI: {e}")
            # Respuesta de fallback si OpenAI falla
            return "Disculpa, estoy teniendo problemas técnicos en este momento. Un agente humano revisará tu caso y te responderá pronto. ¿Hay algo más en lo que pueda ayudarte?"

    @staticmethod
    def format_conversation_history(messages: List) -> List[Dict[str, str]]:
        """
        Convierte los mensajes de la BD al formato de OpenAI
        
        Args:
            messages: Lista de objetos Message de SQLAlchemy
        
        Returns:
            Lista en formato OpenAI [{"role": "user/assistant", "content": "..."}]
        """
        history = []
        for msg in messages:
            role = "assistant" if msg.is_bot else "user"
            history.append({
                "role": role,
                "content": msg.content
            })
        return history