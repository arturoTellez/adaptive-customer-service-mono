import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import traceback

class KavakMetricsEvaluator:
    """
    Sistema de evaluación de métricas para agente de soporte Kavak
    Versión corregida con mejor manejo de fechas y diagnóstico mejorado
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

    # -----------------------
    # Helpers / diagnóstico MEJORADO
    # -----------------------
    def obtener_rango_fechas_datos(self):
        """Obtiene el rango real de fechas en la BD"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        MIN(created_at) as fecha_min,
                        MAX(created_at) as fecha_max,
                        COUNT(*) as total_mensajes
                    FROM messages
                """)
                result = cur.fetchone()
                return {
                    'fecha_min': result[0],
                    'fecha_max': result[1],
                    'total_mensajes': result[2]
                }
        except Exception as e:
            print(f"⚠️ Error obteniendo rango de fechas: {e}")
            return None

    def _diagnostico_periodo(self, fecha_inicio: datetime, fecha_fin: datetime):
        """Diagnóstico mejorado con información del rango real de datos"""
        print(f"\n{'='*60}")
        print(f"🔍 DIAGNÓSTICO DEL PERIODO")
        print(f"{'='*60}")
        
        # Mostrar periodo solicitado
        print(f"📅 Periodo solicitado:")
        print(f"   Inicio: {fecha_inicio}")
        print(f"   Fin:    {fecha_fin}")
        
        # Obtener rango real de datos
        rango = self.obtener_rango_fechas_datos()
        if rango:
            print(f"\n📊 Datos disponibles en BD:")
            print(f"   Fecha mínima: {rango['fecha_min']}")
            print(f"   Fecha máxima: {rango['fecha_max']}")
            print(f"   Total mensajes: {rango['total_mensajes']}")
            
            # Verificar si hay overlap
            if rango['fecha_min'] and rango['fecha_max']:
                if fecha_fin < rango['fecha_min'] or fecha_inicio > rango['fecha_max']:
                    print(f"\n⚠️  ADVERTENCIA: El periodo solicitado NO tiene overlap con los datos")
                    print(f"   Sugerencia: Usa fechas entre {rango['fecha_min'].date()} y {rango['fecha_max'].date()}")
        
        # Conteos en el periodo solicitado
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*) FROM messages 
                    WHERE created_at BETWEEN %s AND %s
                """, (fecha_inicio, fecha_fin))
                mensajes_periodo = cur.fetchone()[0]
                
                cur.execute("""
                    SELECT COUNT(DISTINCT ticket_id) FROM messages 
                    WHERE created_at BETWEEN %s AND %s
                """, (fecha_inicio, fecha_fin))
                tickets_con_mensajes = cur.fetchone()[0]
                
                cur.execute("""
                    SELECT COUNT(*) FROM tickets 
                    WHERE created_at BETWEEN %s AND %s
                """, (fecha_inicio, fecha_fin))
                tickets_creados = cur.fetchone()[0]
                
            print(f"\n📈 Resultados en periodo solicitado:")
            print(f"   Mensajes: {mensajes_periodo}")
            print(f"   Tickets con mensajes: {tickets_con_mensajes}")
            print(f"   Tickets creados: {tickets_creados}")
            
            if mensajes_periodo == 0:
                print(f"\n❌ No hay datos en este periodo. Ajusta las fechas.")
            
        except Exception as e:
            print(f"⚠️ Error en diagnóstico: {e}")
        
        print(f"{'='*60}\n")

    # ============================================
    # 1. FIRST CONTACT RESOLUTION (FCR)
    # ============================================
    def calcular_fcr(self, fecha_inicio: datetime, fecha_fin: datetime) -> Dict:
        """
        Calcula FCR: ticket resuelto en primer contacto por el bot
        """
        self._diagnostico_periodo(fecha_inicio, fecha_fin)

        query = """
        WITH ticket_messages AS (
            SELECT
                t.id as ticket_id,
                t.status,
                COUNT(*) FILTER (WHERE m.is_bot = true) as bot_messages,
                COUNT(*) FILTER (WHERE m.is_bot = false) as user_messages,
                MIN(m.created_at) FILTER (WHERE m.is_bot = false) as first_user_msg,
                MIN(m.created_at) FILTER (WHERE m.is_bot = true) as first_bot_msg
            FROM tickets t
            JOIN messages m ON t.id = m.ticket_id
            WHERE m.created_at BETWEEN %s AND %s
            GROUP BY t.id, t.status
        )
        SELECT
            COUNT(*) as total_tickets,
            COUNT(*) FILTER (WHERE status IN ('resolved','closed')) as tickets_resueltos,
            COUNT(*) FILTER (
                WHERE status IN ('resolved','closed')
                AND bot_messages >= 1
                AND user_messages <= 1  -- Solo la pregunta inicial
            ) as fcr_exitosos
        FROM ticket_messages
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin))
            result = cursor.fetchone()

        total = int(result['total_tickets'] or 0)
        resueltos = int(result['tickets_resueltos'] or 0)
        exitosos = int(result['fcr_exitosos'] or 0)
        fcr_percentage = round((exitosos / resueltos * 100) if resueltos > 0 else 0.0, 2)

        return {
            'total_tickets': total,
            'tickets_resueltos': resueltos,
            'fcr_exitosos': exitosos,
            'fcr_percentage': float(fcr_percentage),
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
                COUNT(CASE WHEN m.is_bot = false THEN 1 END) as user_turns,
                json_agg(
                    json_build_object(
                        'content', m.content,
                        'is_bot', m.is_bot,
                        'sender_name', m.sender_name,
                        'created_at', m.created_at
                    ) ORDER BY m.created_at
                ) as messages
            FROM tickets t
            JOIN messages m ON t.id = m.ticket_id
            WHERE m.created_at BETWEEN %s AND %s
                AND t.status IN ('resolved', 'closed')
            GROUP BY t.id, t.status, t.title, t.category
            HAVING COUNT(CASE WHEN m.is_bot = false THEN 1 END) > 1
        )
        SELECT *
        FROM ticket_conversations
        ORDER BY user_turns DESC, bot_turns DESC
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
                'bot_turns': int(r['bot_turns'] or 0),
                'user_turns': int(r['user_turns'] or 0),
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
            m.created_at,
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
            return {'error': 'Ticket no encontrado', 'ticket_id': ticket_id}

        primera_pregunta = None
        respuestas_bot = []
        
        for msg in messages:
            is_bot = msg.get('is_bot')
            if isinstance(is_bot, str):
                is_bot = is_bot.lower() == 'true'
            else:
                is_bot = bool(is_bot)
                
            if is_bot:
                respuestas_bot.append({
                    'content': msg['content'],
                    'created_at': str(msg['created_at'])
                })
            else:
                if primera_pregunta is None:
                    primera_pregunta = msg['content']

        if primera_pregunta is None:
            primera_pregunta = "(sin pregunta de usuario)"

        evaluaciones = []
        for i, respuesta_bot in enumerate(respuestas_bot):
            score = self._evaluar_respuesta_individual(
                pregunta=primera_pregunta,
                respuesta=respuesta_bot['content'],
                contexto={
                    'title': messages[0].get('title', 'N/A'),
                    'category': messages[0].get('category', 'General'),
                    'description': messages[0].get('description', 'N/A')
                }
            )
            evaluaciones.append({
                'respuesta_num': i + 1,
                'score': int(score.get('score', 3)),
                'razon': score.get('razon', ''),
                'mejora_sugerida': score.get('mejora', '')
            })

        avg_score = sum(e['score'] for e in evaluaciones) / len(evaluaciones) if evaluaciones else 0.0

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
        prompt = f"""Eres un evaluador experto de servicio al cliente de Kavak.

CONTEXTO:
- Título: {contexto.get('title', 'N/A')}
- Categoría: {contexto.get('category', 'General')}
- Descripción: {contexto.get('description', 'N/A')}

PREGUNTA DEL USUARIO:
{pregunta}

RESPUESTA DEL AGENTE:
{respuesta}

Evalúa la relevancia en escala 1-5 y responde SOLO en JSON:
{{"score": <1-5>, "razon": "<breve>", "mejora": "<sugerencia o 'ninguna'>"}}
"""
        
        if self.llm:
            try:
                response = self.llm.generate(prompt)
                response_clean = response.strip()
                if response_clean.startswith('```'):
                    response_clean = response_clean.split('```', 2)[1].strip()
                    if response_clean.startswith('json'):
                        response_clean = response_clean[4:].strip()
                        
                evaluation = json.loads(response_clean)
                if 'score' not in evaluation:
                    raise ValueError("Respuesta sin campo 'score'")
                evaluation['score'] = max(1, min(5, int(evaluation['score'])))
                return evaluation
            except Exception as e:
                print(f"⚠️ Error en LLM: {e}")
                return {'score': 3, 'razon': f'Error: {str(e)[:50]}', 'mejora': 'Revisar'}
        
        return {'score': 3, 'razon': 'LLM no configurado', 'mejora': 'Configurar LLM'}

    def evaluar_lote_tickets(self, fecha_inicio: datetime, fecha_fin: datetime, sample_size: int = 100) -> Dict:
        """
        Evalúa un lote de tickets
        """
        query = """
        SELECT DISTINCT t.id
        FROM tickets t
        JOIN messages m ON t.id = m.ticket_id
        WHERE m.created_at BETWEEN %s AND %s
            AND t.status IN ('resolved', 'closed')
        ORDER BY RANDOM()
        LIMIT %s
        """
        
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (fecha_inicio, fecha_fin, sample_size))
            tickets = cursor.fetchall()

        evaluaciones = []
        for t in tickets:
            ticket_id = str(t['id'])
            eval_result = self.evaluar_relevancia_conversacion(ticket_id)
            if 'error' not in eval_result:
                evaluaciones.append(eval_result)

        scores = [e['relevancia_promedio'] for e in evaluaciones]

        if not scores:
            return {
                'total_evaluados': 0,
                'relevancia_promedio_global': 0,
                'mensaje': 'No hay tickets para evaluar'
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
            'tickets_bajo_rendimiento': [e for e in evaluaciones if e['relevancia_promedio'] < 3.5]
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
                AND m.created_at BETWEEN %s AND %s
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
                    'cantidad': int(c['tickets_count']),
                    'temas': c['temas_comunes'][:5] if c['temas_comunes'] else []
                }
                for c in categorias
            ]
        }

    def generar_reporte_mejora(self, run_number: int, fecha_inicio: datetime, fecha_fin: datetime, evaluar_relevancia: bool = True) -> Dict:
        """
        Genera reporte completo para tracking de mejora
        """
        print(f"\n{'='*60}")
        print(f"🚀 GENERANDO REPORTE - RUN {run_number}")
        print(f"{'='*60}\n")

        fcr_metrics = self.calcular_fcr(fecha_inicio, fecha_fin)

        relevancia_metrics = {'relevancia_promedio_global': 0}
        if evaluar_relevancia and self.llm:
            print("📊 Evaluando relevancia...")
            relevancia_metrics = self.evaluar_lote_tickets(fecha_inicio, fecha_fin, sample_size=20)

        patrones = self.identificar_patrones_fallo(fecha_inicio, fecha_fin)

        reporte = {
            'run': run_number,
            'periodo': f"{fecha_inicio.date()} a {fecha_fin.date()}",
            'timestamp': datetime.now().isoformat(),
            'metricas': {
                'fcr': {
                    'porcentaje': fcr_metrics['fcr_percentage'],
                    'objetivo': 80.0,
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

        print("\n✅ Reporte generado")
        return reporte

    def _generar_recomendaciones(self, fcr, relevancia, patrones) -> List[str]:
        recomendaciones = []

        if fcr['fcr_percentage'] < 80:
            cats = ", ".join([c['categoria'] for c in patrones['categorias_problematicas'][:3]])
            recomendaciones.append(
                f"🔴 FCR bajo ({fcr['fcr_percentage']}%). Enriquecer FAQs de: {cats or 'varias categorías'}"
            )

        rel_prom = relevancia.get('relevancia_promedio_global', 0)
        if rel_prom > 0 and rel_prom < 4.5:
            recomendaciones.append(
                f"🟡 Relevancia ({rel_prom}) bajo objetivo. Mejorar respuestas con score < 3.5"
            )

        dist = relevancia.get('distribucion', {})
        if dist.get('deficiente_1_3', 0) > 10:
            recomendaciones.append(
                f"⚠️ {dist['deficiente_1_3']} tickets con relevancia deficiente"
            )

        if not recomendaciones:
            recomendaciones.append("✅ Todas las métricas en objetivo")

        return recomendaciones


# ============================================
# EJEMPLO DE USO CON FECHAS AUTOMÁTICAS
# ============================================
def ejemplo_uso_completo():
    """
    Ejemplo que detecta automáticamente el rango de fechas disponible
    """
    evaluator = KavakMetricsEvaluator(llm_client=None)

    try:
        evaluator.connect()

        # PRIMERO: Obtener rango real de datos
        rango = evaluator.obtener_rango_fechas_datos()
        
        if not rango or not rango['fecha_min']:
            print("❌ No hay datos en la base de datos")
            return None
        
        # USAR EL RANGO COMPLETO DE DATOS DISPONIBLES
        fecha_inicio = rango['fecha_min']
        fecha_fin = rango['fecha_max']

        print("\n" + "="*60)
        print("🎯 EVALUACIÓN DE MÉTRICAS - AGENTE KAVAK")
        print("="*60)
        print(f"📅 Usando todo el rango disponible:")
        print(f"   {fecha_inicio.date()} a {fecha_fin.date()}")
        print(f"   Total mensajes: {rango['total_mensajes']}")

        # FCR
        print("\n" + "-"*60)
        print("📊 MÉTRICA 1: First Contact Resolution")
        print("-"*60)
        fcr_result = evaluator.calcular_fcr(fecha_inicio, fecha_fin)
        print(f"✅ FCR: {fcr_result['fcr_percentage']}% (Objetivo: 80%)")
        print(f"   Tickets totales: {fcr_result['total_tickets']}")
        print(f"   Tickets resueltos: {fcr_result['tickets_resueltos']}")
        print(f"   FCR exitosos: {fcr_result['fcr_exitosos']}")

        # Tickets fallidos
        print("\n" + "-"*60)
        print("🔍 Tickets donde FCR falló")
        print("-"*60)
        tickets_fallidos = evaluator.obtener_tickets_fcr_fallidos(fecha_inicio, fecha_fin, limit=5)
        print(f"Encontrados: {len(tickets_fallidos)} tickets")

        # Patrones
        print("\n" + "-"*60)
        print("📈 Patrones por categoría")
        print("-"*60)
        patrones = evaluator.identificar_patrones_fallo(fecha_inicio, fecha_fin)
        if patrones['categorias_problematicas']:
            for cat in patrones['categorias_problematicas'][:5]:
                print(f"  • {cat['categoria']}: {cat['cantidad']} tickets")

        # Reporte completo
        reporte = evaluator.generar_reporte_mejora(
            run_number=1,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            evaluar_relevancia=False
        )
        
        print("\n🎯 RECOMENDACIONES:")
        for rec in reporte['recomendaciones']:
            print(f"  {rec}")

        print("\n✅ EVALUACIÓN COMPLETADA")
        return reporte

    except Exception as e:
        print(f"\n❌ Error: {e}")
        traceback.print_exc()
    finally:
        evaluator.close()


if __name__ == "__main__":
    ejemplo_uso_completo()