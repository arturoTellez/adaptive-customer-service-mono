import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

from openai import OpenAI

client = OpenAI(api_key="tu-api-key")

class SimpleLLM:
    def generate(self, prompt):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        return response.choices[0].message.content

class KavakMetricsEvaluator:
    """
    Sistema de evaluación de métricas para agente de soporte Kavak
    Adaptado para PostgreSQL/Supabase con psycopg2
    """
    
    def __init__(self, llm_client=None):
        self.db_config = {
            'host': 'aws-1-us-east-1.pooler.supabase.com',
            'port': 5432,
            'database': 'postgres',
            'user': 'postgres.nqfzagaxtsckofbuylra',
            'password': 'HackathonKavak01!'
        }
        self.conn = None
        self.llm = llm_client
        
    def connect(self):
        """Conectar a la base de datos PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✅ Conexión exitosa a Supabase")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            raise
        
    def close(self):
        """Cerrar conexión"""
        if self.conn:
            self.conn.close()
            print("🔌 Conexión cerrada")
    
    # ============================================
    # 1. FIRST CONTACT RESOLUTION (FCR)
    # ============================================
    
    def calcular_fcr(self, fecha_inicio: datetime, fecha_fin: datetime) -> Dict:
        """
        Calcula FCR: ¿Se resolvió en la primera respuesta del bot?
        """
        
        query = """
        WITH ticket_stats AS (
            SELECT 
                t.id as ticket_id,
                t.status,
                COUNT(CASE WHEN m.is_bot = true THEN 1 END) as bot_responses
            FROM tickets t
            LEFT JOIN messages m ON t.id = m.ticket_id
            WHERE t.created_at BETWEEN %s AND %s
            GROUP BY t.id, t.status
        )
        SELECT 
            COUNT(*) as total_tickets,
            COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as tickets_resueltos,
            COUNT(CASE WHEN status IN ('resolved', 'closed') AND bot_responses = 1 THEN 1 END) as fcr_exitosos,
            ROUND(
                COUNT(CASE WHEN status IN ('resolved', 'closed') AND bot_responses = 1 THEN 1 END)::numeric / 
                NULLIF(COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END), 0) * 100, 
                2
            ) as fcr_percentage
        FROM ticket_stats
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin))
            result = cursor.fetchone()
        
        return {
            'total_tickets': result['total_tickets'],
            'tickets_resueltos': result['tickets_resueltos'],
            'fcr_exitosos': result['fcr_exitosos'],
            'fcr_percentage': float(result['fcr_percentage'] or 0),
            'periodo': f"{fecha_inicio.date()} a {fecha_fin.date()}"
        }
    
    def obtener_tickets_fcr_fallidos(self, fecha_inicio: datetime, fecha_fin: datetime, limit: int = 50) -> List[Dict]:
        """
        Obtiene tickets donde FCR falló para análisis
        """
        
        query = """
        WITH ticket_conversations AS (
            SELECT 
                t.id as ticket_id,
                t.status,
                t.title,
                t.category,
                COUNT(CASE WHEN m.is_bot = true THEN 1 END) as bot_turns,
                json_agg(
                    json_build_object(
                        'content', m.content,
                        'is_bot', m.is_bot,
                        'sender_name', m.sender_name,
                        'created_at', m.created_at
                    ) ORDER BY m.created_at
                ) as messages
            FROM tickets t
            LEFT JOIN messages m ON t.id = m.ticket_id
            WHERE t.created_at BETWEEN %s AND %s
                AND t.status IN ('resolved', 'closed')
            GROUP BY t.id, t.status, t.title, t.category
        )
        SELECT *
        FROM ticket_conversations
        WHERE bot_turns > 1
        ORDER BY bot_turns DESC
        LIMIT %s
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin, limit))
            results = cursor.fetchall()
        
        return [
            {
                'ticket_id': str(r['ticket_id']),
                'title': r['title'],
                'category': r['category'],
                'bot_turns': r['bot_turns'],
                'messages': r['messages'],
                'fcr_failed': True
            }
            for r in results
        ]
    
    # ============================================
    # 2. RELEVANCIA (LLM-as-Judge)
    # ============================================
    
    def evaluar_relevancia_conversacion(self, ticket_id: str) -> Dict:
        """
        Evalúa la relevancia de las respuestas del bot en un ticket
        """
        
        query = """
        SELECT 
            m.content,
            m.is_bot,
            m.sender_name,
            m.created_at::text,
            t.title,
            t.category,
            t.description
        FROM messages m
        JOIN tickets t ON m.ticket_id = t.id
        WHERE m.ticket_id::text = %s
        ORDER BY m.created_at ASC
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (ticket_id,))
            messages = cursor.fetchall()
        
        if not messages:
            return {'error': 'Ticket no encontrado'}
        
        # Preparar conversación
        pregunta_usuario = None
        respuestas_bot = []
        
        for msg in messages:
            if msg['is_bot']:
                respuestas_bot.append({
                    'content': msg['content'],
                    'created_at': msg['created_at']
                })
            else:
                if pregunta_usuario is None:
                    pregunta_usuario = msg['content']
        
        # Evaluar cada respuesta del bot
        evaluaciones = []
        for i, respuesta_bot in enumerate(respuestas_bot):
            score = self._evaluar_respuesta_individual(
                pregunta=pregunta_usuario,
                respuesta=respuesta_bot['content'],
                contexto={
                    'title': messages[0]['title'],
                    'category': messages[0]['category'],
                    'description': messages[0]['description']
                }
            )
            evaluaciones.append({
                'respuesta_num': i + 1,
                'score': score['score'],
                'razon': score['razon'],
                'mejora_sugerida': score['mejora']
            })
        
        # Calcular promedio
        avg_score = sum(e['score'] for e in evaluaciones) / len(evaluaciones) if evaluaciones else 0
        
        return {
            'ticket_id': ticket_id,
            'relevancia_promedio': round(avg_score, 2),
            'evaluaciones_individuales': evaluaciones,
            'total_respuestas_bot': len(respuestas_bot)
        }
    
    def _evaluar_respuesta_individual(self, pregunta: str, respuesta: str, contexto: Dict) -> Dict:
        """
        Usa LLM como juez para evaluar una respuesta individual
        """
        
        prompt = f"""Eres un evaluador experto de servicio al cliente de Kavak (compra-venta de autos seminuevos).

CONTEXTO DEL TICKET:
- Título: {contexto.get('title', 'N/A')}
- Categoría: {contexto.get('category', 'General')}
- Descripción: {contexto.get('description', 'N/A')}

PREGUNTA DEL USUARIO:
{pregunta}

RESPUESTA DEL AGENTE:
{respuesta}

Evalúa la relevancia en escala 1-5:

5 = Excelente: Responde completamente, información precisa de Kavak, tono profesional y empático
4 = Buena: Responde adecuadamente, falta algún detalle menor
3 = Aceptable: Responde pero de forma genérica o incompleta
2 = Deficiente: Respuesta vaga, incorrecta o confusa
1 = Mala: No responde la pregunta o información errónea

IMPORTANTE: Considera aspectos específicos de Kavak:
- Garantía de 7 días o 500km
- Inspección de 240 puntos
- Financiamiento disponible
- Trámites incluidos
- Entrega a domicilio

CONSIDERACIONES ESPECIALES:
- Sé especialmente estricto con seguridad de datos y compliance
- Valora positivamente la empatía sin sacrificar eficiencia
- Penaliza fuertemente solicitudes de datos sensibles por canales inseguros
- Considera el contexto del cliente (urgencia, frustración, conocimiento técnico)

CONTEXTO CRÍTICO DE KAVAK:
- Los asistentes deben manejar procesos complejos de inspección, documentación, KYC y pagos
- La seguridad de datos es CRÍTICA - nunca deben solicitarse datos sensibles por canales inseguros
- El tono debe ser profesional pero cálido, adaptándose al cliente
- La claridad en tiempos, requisitos y procesos es fundamental

Responde SOLO en formato JSON:
{{
  "score": [número 1-5],
  "razon": "[explicación breve]",
  "mejora": "[cómo mejorar la respuesta, o 'ninguna' si score >= 4]"
}}"""

        # Si tienes LLM configurado, úsalo
        if self.llm:
            try:
                response = self.llm.generate(prompt)
                evaluation = json.loads(response)
                return evaluation
            except Exception as e:
                print(f"⚠️ Error en LLM-as-judge: {e}")
        
        # Fallback: evaluación manual o simulada
        return {
            'score': 3,
            'razon': 'Evaluación automática no disponible - configurar LLM',
            'mejora': 'Configurar cliente LLM para evaluación automática'
        }
    
    def evaluar_lote_tickets(self, fecha_inicio: datetime, fecha_fin: datetime, sample_size: int = 100) -> Dict:
        """
        Evalúa un lote de tickets y calcula métricas agregadas
        """
        
        query = """
        SELECT id 
        FROM tickets 
        WHERE created_at BETWEEN %s AND %s
            AND status IN ('resolved', 'closed')
        ORDER BY RANDOM()
        LIMIT %s
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin, sample_size))
            tickets = cursor.fetchall()
        
        evaluaciones = []
        for ticket in tickets:
            eval_result = self.evaluar_relevancia_conversacion(str(ticket['id']))
            if 'error' not in eval_result:
                evaluaciones.append(eval_result)
        
        # Calcular estadísticas
        scores = [e['relevancia_promedio'] for e in evaluaciones]
        
        if not scores:
            return {
                'total_evaluados': 0,
                'relevancia_promedio_global': 0,
                'mensaje': 'No hay tickets para evaluar en el periodo'
            }
        
        return {
            'total_evaluados': len(evaluaciones),
            'relevancia_promedio_global': round(sum(scores) / len(scores), 2),
            'relevancia_min': min(scores),
            'relevancia_max': max(scores),
            'distribucion': {
                'excelente_4_5': len([s for s in scores if s >= 4]),
                'buena_3_4': len([s for s in scores if 3 <= s < 4]),
                'deficiente_1_3': len([s for s in scores if s < 3])
            },
            'tickets_bajo_rendimiento': [
                e for e in evaluaciones if e['relevancia_promedio'] < 3.5
            ]
        }
    
    # ============================================
    # 3. ANÁLISIS PARA AUTOMEJORACIÓN
    # ============================================
    
    def identificar_patrones_fallo(self, fecha_inicio: datetime, fecha_fin: datetime) -> Dict:
        """
        Identifica patrones comunes en conversaciones con bajo rendimiento
        """
        
        query = """
        WITH first_user_messages AS (
            SELECT DISTINCT ON (m.ticket_id)
                m.ticket_id,
                m.content as primera_pregunta,
                t.title,
                t.category
            FROM messages m
            JOIN tickets t ON m.ticket_id = t.id
            WHERE m.is_bot = false
                AND t.created_at BETWEEN %s AND %s
            ORDER BY m.ticket_id, m.created_at ASC
        )
        SELECT 
            category,
            COUNT(*) as tickets_count,
            array_agg(DISTINCT title) as temas_comunes
        FROM first_user_messages
        GROUP BY category
        ORDER BY tickets_count DESC
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin))
            categorias = cursor.fetchall()
        
        return {
            'categorias_problematicas': [
                {
                    'categoria': c['category'],
                    'cantidad': c['tickets_count'],
                    'temas': c['temas_comunes'][:5] if c['temas_comunes'] else []
                }
                for c in categorias
            ]
        }
    
    def generar_reporte_mejora(self, run_number: int, fecha_inicio: datetime, fecha_fin: datetime, evaluar_relevancia: bool = True) -> Dict:
        """
        Genera reporte completo para tracking de mejora entre runs
        """
        
        print(f"\n{'='*60}")
        print(f"🚀 GENERANDO REPORTE - RUN {run_number}")
        print(f"{'='*60}\n")
        
        # Calcular FCR
        print("📊 Calculando FCR...")
        fcr_metrics = self.calcular_fcr(fecha_inicio, fecha_fin)
        
        # Calcular relevancia (opcional, puede tomar tiempo)
        relevancia_metrics = {'relevancia_promedio_global': 0}
        if evaluar_relevancia and self.llm:
            print("📊 Evaluando relevancia (esto puede tardar)...")
            relevancia_metrics = self.evaluar_lote_tickets(fecha_inicio, fecha_fin, sample_size=20)
        
        # Identificar patrones
        print("🔍 Identificando patrones...")
        patrones = self.identificar_patrones_fallo(fecha_inicio, fecha_fin)
        
        reporte = {
            'run': run_number,
            'periodo': f"{fecha_inicio.date()} a {fecha_fin.date()}",
            'timestamp': datetime.now().isoformat(),
            'metricas': {
                'fcr': {
                    'porcentaje': fcr_metrics['fcr_percentage'],
                    'objetivo': 40.0,
                    'alcanzado': fcr_metrics['fcr_percentage'] >= 80.0
                },
                'relevancia': {
                    'promedio': relevancia_metrics.get('relevancia_promedio_global', 0),
                    'objetivo': 4.5,
                    'alcanzado': relevancia_metrics.get('relevancia_promedio_global', 0) >= 4.5
                }
            },
            'analisis': {
                'tickets_totales': fcr_metrics['total_tickets'],
                'fcr_exitosos': fcr_metrics['fcr_exitosos'],
                'tickets_bajo_rendimiento': len(relevancia_metrics.get('tickets_bajo_rendimiento', [])),
                'categorias_problematicas': patrones['categorias_problematicas']
            },
            'recomendaciones': self._generar_recomendaciones(fcr_metrics, relevancia_metrics, patrones)
        }
        
        print("\n✅ Reporte generado exitosamente")
        return reporte
    
    def _generar_recomendaciones(self, fcr, relevancia, patrones) -> List[str]:
        """Genera recomendaciones basadas en métricas"""
        recomendaciones = []
        
        if fcr['fcr_percentage'] < 80:
            cats = ", ".join([c['categoria'] for c in patrones['categorias_problematicas'][:3]])
            recomendaciones.append(
                f"🔴 FCR bajo ({fcr['fcr_percentage']}%). Enriquecer contexto del agente con FAQs de: {cats}"
            )
        
        rel_prom = relevancia.get('relevancia_promedio_global', 0)
        if rel_prom > 0 and rel_prom < 4.5:
            recomendaciones.append(
                f"🟡 Relevancia promedio ({rel_prom}) por debajo de objetivo. "
                "Revisar y mejorar respuestas de tickets con score < 3.5"
            )
        
        dist = relevancia.get('distribucion', {})
        if dist.get('deficiente_1_3', 0) > 10:
            recomendaciones.append(
                f"⚠️ {dist['deficiente_1_3']} tickets con relevancia deficiente. "
                "Regenerar respuestas usando ejemplos mejorados."
            )
        
        if not recomendaciones:
            recomendaciones.append("✅ Todas las métricas en objetivo")
        
        return recomendaciones


# ============================================
# EJEMPLO DE USO PRÁCTICO
# ============================================

def ejemplo_uso_completo():
    """
    Ejemplo completo de evaluación para el hackathon
    """
    
    # Inicializar evaluador
    evaluator = KavakMetricsEvaluator(llm_client=SimpleLLM())
    
    try:
        # Conectar
        evaluator.connect()
        
        # Definir periodo (últimos 7 días)
        fecha_fin = datetime.now()
        fecha_inicio = fecha_fin - timedelta(days=7)
        
        # print("\n" + "="*60)
        # print("🎯 EVALUACIÓN DE MÉTRICAS - AGENTE KAVAK")
        # print("="*60)
        # print(f"📅 Periodo: {fecha_inicio.date()} a {fecha_fin.date()}")
        # print(f"👤 Usuario: demo-agent@gmail.com")
        
        # # 1. Calcular FCR
        # print("\n" + "-"*60)
        # print("📊 MÉTRICA 1: First Contact Resolution (FCR)")
        # print("-"*60)
        fcr_result = evaluator.calcular_fcr(fecha_inicio, fecha_fin)
        # print(f"FCR: {fcr_result['fcr_percentage']}% (Objetivo: 80%)")
        # print(f"Tickets totales: {fcr_result['total_tickets']}")
        # print(f"Tickets resueltos: {fcr_result['tickets_resueltos']}")
        # print(f"FCR exitosos: {fcr_result['fcr_exitosos']}")
        
        if fcr_result['fcr_percentage'] >= 80:
            print("✅ ¡Objetivo alcanzado!")
        else:
            print(f"❌ Falta {80 - fcr_result['fcr_percentage']:.1f}% para alcanzar objetivo")
        
        # 2. Analizar tickets fallidos
        print("\n" + "-"*60)
        print("🔍 ANÁLISIS: Tickets donde FCR falló")
        print("-"*60)
        tickets_fallidos = evaluator.obtener_tickets_fcr_fallidos(fecha_inicio, fecha_fin, limit=5)
        
        if tickets_fallidos:
            print(f"Se encontraron {len(tickets_fallidos)} tickets con FCR fallido")
            for i, ticket in enumerate(tickets_fallidos[:3], 1):
                print(f"\n  Ticket {i}:")
                print(f"    ID: {ticket['ticket_id']}")
                print(f"    Título: {ticket['title']}")
                print(f"    Categoría: {ticket['category']}")
                print(f"    Respuestas del bot: {ticket['bot_turns']}")
        else:
            print("✅ No hay tickets con FCR fallido en este periodo")
        
        # 3. Identificar patrones
        print("\n" + "-"*60)
        print("📈 ANÁLISIS: Patrones por categoría")
        print("-"*60)
        patrones = evaluator.identificar_patrones_fallo(fecha_inicio, fecha_fin)
        
        if patrones['categorias_problematicas']:
            for cat in patrones['categorias_problematicas'][:5]:
                print(f"  • {cat['categoria']}: {cat['cantidad']} tickets")
        else:
            print("  No hay datos suficientes para análisis de patrones")
        
        # 4. Generar reporte completo
        print("\n" + "-"*60)
        print("📝 REPORTE COMPLETO")
        print("-"*60)
        reporte = evaluator.generar_reporte_mejora(
            run_number=1, 
            fecha_inicio=fecha_inicio, 
            fecha_fin=fecha_fin,
            evaluar_relevancia=True  # Cambiar a True si configuras LLM
        )
        
        print("\n🎯 RECOMENDACIONES:")
        for rec in reporte['recomendaciones']:
            print(f"  {rec}")
        
        print("\n" + "="*60)
        print("✅ EVALUACIÓN COMPLETADA")
        print("="*60)
        
        return reporte
        
    except Exception as e:
        print(f"\n❌ Error durante la evaluación: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        evaluator.close()


# Para ejecutar el ejemplo:
if __name__ == "__main__":
    ejemplo_uso_completo()