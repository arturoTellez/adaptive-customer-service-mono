import pandas as pd
import openai
import os
import json

# Configuración
openai.api_key = os.getenv('OPENAI_API_KEY')

def load_messages_from_csv(csv_file):
    """Carga los mensajes desde un archivo CSV"""
    try:
        df = pd.read_csv('C:/Users/ASUS/Documents/Edson\Hackaton/adaptive-customer-service-mono/backend/app/m.csv')
        print(f"✓ Archivo cargado: {len(df)} mensajes encontrados")
        print(f"Columnas disponibles: {list(df.columns)}\n")
        return df
    except Exception as e:
        print(f"Error al cargar el CSV: {e}")
        return None

def analyze_conversations_for_context(df):
    """
    Analiza conversaciones para extraer información contextual
    que ayudará a refinar el prompt del evaluador
    """
    
    # Agrupar mensajes por ticket_id
    ticket_ids = df['ticket_id'].dropna().unique()
    sample_size = min(15, len(ticket_ids))  # Máximo 15 conversaciones
    sample_tickets = ticket_ids[:sample_size]
    
    conversations_sample = []
    
    for ticket_id in sample_tickets:
        # Obtener mensajes del ticket ordenados por fecha
        ticket_messages = df[df['ticket_id'] == ticket_id].sort_values('created_at')
        
        conversation = []
        for _, row in ticket_messages.iterrows():
            role = "Asistente" if row.get('is_bot', False) else "Cliente"
            sender = row.get('sender_name', 'Desconocido')
            content = row['content']
            timestamp = row.get('created_at', '')
            
            conversation.append(f"[{timestamp}] {role} ({sender}): {content}")
        
        conversations_sample.append("\n".join(conversation))
    
    # Crear prompt para análisis contextual
    conversations_text = "\n\n---NUEVA CONVERSACIÓN---\n\n".join(conversations_sample)
    
    analysis_prompt = f"""Eres un experto en análisis de conversaciones de servicio al cliente. 

Tu tarea es analizar las siguientes conversaciones entre clientes y asistentes de Kavak para extraer información crítica que ayudará a diseñar un sistema de evaluación preciso.

CONVERSACIONES DE MUESTRA (Total: {len(conversations_sample)} conversaciones):
{conversations_text}

Por favor, analiza profundamente estas conversaciones y proporciona un análisis estructurado en formato JSON con las siguientes secciones:

1. **CONTEXTO DEL NEGOCIO**:
   - ¿Qué tipo de negocio es Kavak? (industria, productos/servicios principales)
   - ¿Cuáles son los casos de uso más comunes en estas conversaciones?
   - ¿Qué procesos específicos de Kavak se mencionan frecuentemente?

2. **CARACTERÍSTICAS DEL ASISTENTE**:
   - ¿Qué tono y estilo de comunicación usa el asistente?
   - ¿Qué patrones de respuesta observas? (estructura, longitud, formalidad)
   - ¿Qué tipo de información técnica maneja?
   - ¿Qué fortalezas destacan en las respuestas?
   - ¿Qué debilidades o áreas de mejora identificas?

3. **PERFIL DEL CLIENTE**:
   - ¿Qué tipo de consultas hacen los clientes?
   - ¿Qué nivel de conocimiento técnico demuestran?
   - ¿Qué emociones o urgencias expresan?
   - ¿Qué esperan obtener de la conversación?

4. **PATRONES DE CONVERSACIÓN**:
   - ¿Cuál es la estructura típica? (inicio, desarrollo, cierre)
   - ¿Cuántos turnos suelen durar?
   - ¿Hay temas o problemas recurrentes?
   - ¿Qué información se pide/proporciona frecuentemente?

5. **ASPECTOS DE SEGURIDAD Y COMPLIANCE**:
   - ¿Qué prácticas de seguridad de datos observas?
   - ¿Cómo se maneja la información sensible?
   - ¿Qué procesos de verificación (KYC) se mencionan?

6. **CRITERIOS DE CALIDAD ESPECÍFICOS** (MÁS IMPORTANTE):
   - Basándote en estas conversaciones, identifica 7-10 criterios ESPECÍFICOS para evaluar la calidad del asistente de Kavak
   - Para cada criterio:
     * Nombre descriptivo
     * Definición clara
     * Indicadores concretos de excelencia
     * Indicadores concretos de deficiencia
     * Peso/importancia relativa (1-10)

7. **CASOS EJEMPLARES**:
   - Identifica 3 ejemplos de respuestas EXCELENTES (cita el texto específico y explica por qué)
   - Identifica 3 ejemplos de respuestas DEFICIENTES o que podrían mejorar (cita y explica)

8. **CONTEXTO CULTURAL Y LINGÜÍSTICO**:
   - ¿En qué idioma(s) se comunican?
   - ¿Hay expresiones, modismos o formalismos específicos?
   - ¿Qué nivel de formalidad es apropiado?

9. **RECOMENDACIONES PARA EL PROMPT DE EVALUACIÓN**:
   - ¿Qué información específica DEBE incluirse en el prompt del evaluador?
   - ¿Qué aspectos son CRÍTICOS y cuáles menos relevantes?
   - ¿Qué sesgos o errores comunes debe evitar el evaluador?
   - ¿Qué contexto de Kavak es esencial para evaluar correctamente?

Proporciona tu análisis en formato JSON válido y estructurado."""

    try:
        print("🔍 Analizando conversaciones para extraer contexto...\n")
        
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Eres un experto en análisis conversacional y diseño de sistemas de evaluación. Proporcionas análisis profundos, específicos y accionables en formato JSON."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        analysis = json.loads(response.choices[0].message.content)
        return analysis
    
    except Exception as e:
        print(f"Error al analizar conversaciones: {e}")
        return None

def generate_statistics(df):
    """Genera estadísticas básicas del dataset"""
    
    stats = {
        "total_mensajes": len(df),
        "total_tickets": df['ticket_id'].nunique(),
        "mensajes_promedio_por_ticket": len(df) / df['ticket_id'].nunique() if df['ticket_id'].nunique() > 0 else 0,
    }
    
    # Contar mensajes por rol
    if 'is_bot' in df.columns:
        stats['mensajes_bot'] = int(df['is_bot'].sum())
        stats['mensajes_cliente'] = int((~df['is_bot']).sum())
        stats['ratio_bot_cliente'] = stats['mensajes_bot'] / stats['mensajes_cliente'] if stats['mensajes_cliente'] > 0 else 0
    
    # Distribución de longitud de mensajes
    df['content_length'] = df['content'].str.len()
    stats['longitud_promedio_mensaje'] = float(df['content_length'].mean())
    stats['longitud_promedio_bot'] = float(df[df['is_bot'] == True]['content_length'].mean())
    stats['longitud_promedio_cliente'] = float(df[df['is_bot'] == False]['content_length'].mean())
    
    # Análisis temporal
    df['created_at'] = pd.to_datetime(df['created_at'])
    stats['rango_fechas'] = {
        'inicio': str(df['created_at'].min()),
        'fin': str(df['created_at'].max())
    }
    
    return stats

def generate_refined_evaluation_prompt(context_analysis, stats):
    """
    Genera un prompt refinado para el evaluador basado en el análisis contextual
    """
    
    prompt_template = f"""# PROMPT REFINADO PARA EVALUADOR DE CONVERSACIONES DE KAVAK

## CONTEXTO DEL NEGOCIO
{json.dumps(context_analysis.get('CONTEXTO_DEL_NEGOCIO', {}), indent=2, ensure_ascii=False)}

## CARACTERÍSTICAS DEL ASISTENTE IDEAL
{json.dumps(context_analysis.get('CARACTERÍSTICAS_DEL_ASISTENTE', {}), indent=2, ensure_ascii=False)}

## PERFIL TÍPICO DEL CLIENTE
{json.dumps(context_analysis.get('PERFIL_DEL_CLIENTE', {}), indent=2, ensure_ascii=False)}

## PATRONES DE CONVERSACIÓN ESPERADOS
{json.dumps(context_analysis.get('PATRONES_DE_CONVERSACIÓN', {}), indent=2, ensure_ascii=False)}

## ASPECTOS DE SEGURIDAD Y COMPLIANCE
{json.dumps(context_analysis.get('ASPECTOS_DE_SEGURIDAD_Y_COMPLIANCE', {}), indent=2, ensure_ascii=False)}

## ESTADÍSTICAS DEL DATASET
- Total de conversaciones analizadas: {stats['total_tickets']}
- Mensajes promedio por conversación: {stats['mensajes_promedio_por_ticket']:.1f}
- Ratio mensajes Bot/Cliente: {stats.get('ratio_bot_cliente', 'N/A'):.2f}
- Longitud promedio mensaje Bot: {stats.get('longitud_promedio_bot', 0):.0f} caracteres
- Longitud promedio mensaje Cliente: {stats.get('longitud_promedio_cliente', 0):.0f} caracteres

## CRITERIOS DE EVALUACIÓN ESPECÍFICOS PARA KAVAK
{json.dumps(context_analysis.get('CRITERIOS_DE_CALIDAD_ESPECÍFICOS', {}), indent=2, ensure_ascii=False)}

## EJEMPLOS DE EXCELENCIA Y DEFICIENCIAS
{json.dumps(context_analysis.get('CASOS_EJEMPLARES', {}), indent=2, ensure_ascii=False)}

## CONTEXTO CULTURAL Y LINGÜÍSTICO
{json.dumps(context_analysis.get('CONTEXTO_CULTURAL_Y_LINGÜÍSTICO', {}), indent=2, ensure_ascii=False)}

## INSTRUCCIONES CRÍTICAS PARA EL EVALUADOR
{json.dumps(context_analysis.get('RECOMENDACIONES_PARA_EL_PROMPT_DE_EVALUACIÓN', {}), indent=2, ensure_ascii=False)}

---

## PROMPT DE EVALUACIÓN FINAL (LISTO PARA USAR)

Eres un evaluador experto de conversaciones de servicio al cliente de Kavak, empresa especializada en {context_analysis.get('contexto_del_negocio', {}).get('industria', 'compra-venta de autos')}.

**CONTEXTO CRÍTICO DE KAVAK:**
- Los asistentes deben manejar procesos complejos de inspección, documentación, KYC y pagos
- La seguridad de datos es CRÍTICA - nunca deben solicitarse datos sensibles por canales inseguros
- El tono debe ser profesional pero cálido, adaptándose al cliente
- La claridad en tiempos, requisitos y procesos es fundamental

**TU TAREA:**
Analiza la siguiente conversación entre un cliente y un asistente de Kavak.

[INSERTAR CONVERSACIÓN AQUÍ]

**EVALÚA LA CONVERSACIÓN EN LOS SIGUIENTES CRITERIOS:**

{json.dumps(context_analysis.get('criterios_de_calidad_especificos', {}), indent=2, ensure_ascii=False)}

**FORMATO DE RESPUESTA:**
Para cada criterio proporciona:
1. **Puntuación**: 1-10 (donde 10 es excelente)
2. **Justificación**: Explicación específica con ejemplos de la conversación
3. **Evidencia**: Citas textuales que respaldan tu evaluación
4. **Recomendaciones**: 2-3 acciones concretas de mejora

**ESTRUCTURA JSON DE RESPUESTA:**
```json
{{
  "evaluaciones": {{
    "criterio_1": {{
      "puntuacion": X,
      "justificacion": "...",
      "evidencia": ["cita1", "cita2"],
      "recomendaciones": ["accion1", "accion2"]
    }},
    ...
  }},
  "puntuacion_general": X,
  "resumen_ejecutivo": "Resumen de 2-3 líneas",
  "fortalezas_principales": ["fortaleza1", "fortaleza2", "fortaleza3"],
  "areas_criticas_de_mejora": ["mejora1", "mejora2", "mejora3"],
  "riesgo_compliance": "bajo/medio/alto con justificación"
}}
```

**CONSIDERACIONES ESPECIALES:**
- Sé especialmente estricto con seguridad de datos y compliance
- Valora positivamente la empatía sin sacrificar eficiencia
- Penaliza fuertemente solicitudes de datos sensibles por canales inseguros
- Considera el contexto del cliente (urgencia, frustración, conocimiento técnico)
"""
    
    return prompt_template

# Ejecución principal
if __name__ == "__main__":
    print("="*80)
    print("EXTRACTOR DE CONTEXTO PARA REFINAMIENTO DE EVALUADOR LLM - KAVAK")
    print("="*80 + "\n")
    
    # 1. Cargar CSV
    csv_file = 'messages.csv'  # Cambia por la ruta de tu archivo
    df = load_messages_from_csv(csv_file)
    
    if df is None:
        print("❌ No se pudo cargar el archivo")
        exit()
    
    # 2. Generar estadísticas básicas
    print("📊 Generando estadísticas del dataset...\n")
    stats = generate_statistics(df)
    print(json.dumps(stats, indent=2, ensure_ascii=False, default=str))
    print("\n")
    
    # 3. Analizar conversaciones para extraer contexto
    context_analysis = analyze_conversations_for_context(df)
    
    if context_analysis is None:
        print("❌ No se pudo completar el análisis")
        exit()
    
    # 4. Guardar análisis contextual completo
    output_file = 'contexto_para_evaluador_kavak.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'estadisticas': stats,
            'analisis_contextual': context_analysis
        }, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n✓ Análisis contextual guardado en '{output_file}'")
    
    # 5. Generar prompt refinado
    refined_prompt = generate_refined_evaluation_prompt(context_analysis, stats)
    
    prompt_file = 'prompt_evaluador_kavak_refinado.txt'
    with open(prompt_file, 'w', encoding='utf-8') as f:
        f.write(refined_prompt)
    
    print(f"✓ Prompt refinado guardado en '{prompt_file}'")
    
    # 6. Mostrar resumen
    print("\n" + "="*80)
    print("RESUMEN DEL ANÁLISIS")
    print("="*80)
    print(json.dumps(context_analysis, indent=2, ensure_ascii=False))
    
    print("\n" + "="*80)
    print("✅ PROCESO COMPLETADO")
    print("="*80)
    print("\nArchivos generados:")
    print(f"  1. {output_file} - Análisis contextual completo de Kavak")
    print(f"  2. {prompt_file} - Prompt refinado listo para evaluar conversaciones")
    print("\n📋 SIGUIENTE PASO:")
    print("  Usa el prompt refinado para evaluar nuevas conversaciones de Kavak")
    print("  con criterios específicos extraídos de tus datos reales.")