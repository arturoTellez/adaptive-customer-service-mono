# 🎯 Adaptive Customer Service Mono

Sistema de atención al cliente adaptativo e inteligente con capacidades de aprendizaje continuo mediante IA.

## 📋 Descripción

**Adaptive Customer Service Mono** es un monorepo que implementa un sistema completo de servicio al cliente con inteligencia artificial adaptativa. El sistema se compone de tres módulos principales que trabajan en conjunto para proporcionar una experiencia de soporte optimizada y en constante mejora.

### Características Principales

- 🤖 **Agente AI Inteligente**: Chatbot con IA capaz de responder dudas y gestionar tickets automáticamente
- 📊 **Panel de Análisis Adaptativo**: Dashboard de administración con métricas en tiempo real
- 🔄 **Aprendizaje Continuo**: El sistema analiza conversaciones activas y propone mejoras automáticas
- 👥 **Gestión de Usuarios**: Sistema completo de autenticación y gestión de cuentas
- 🎫 **Sistema de Tickets**: Creación, seguimiento y resolución de tickets de soporte
- 💬 **Chat en Tiempo Real**: Comunicación fluida entre clientes y el agente AI
- 📈 **Métricas y Analytics**: Análisis detallado del rendimiento del chatbot

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en cuatro componentes principales:

```
adaptive-customer-service/
├── backend/              # API y lógica de negocio
├── frontend/user/        # Interfaz de usuario para clientes
├── streamlit/            # Panel de administración (Kavak Agentic Workbench)
└── notebook/             # Análisis y experimentación con datos
```

## 🔄 Cómo Funciona el Sistema

### Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO FINAL                           │
│  (Accede vía Frontend Next.js - http://localhost:3000)         │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ 1. Login/Signup
               │ 2. Crea ticket
               │ 3. Inicia chat con AI
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│                   http://localhost:8000                         │
│                                                                 │
│  • Autentica usuarios (JWT)                                     │
│  • CRUD de tickets y mensajes                                   │
│  • Integración con OpenAI para respuestas del chatbot          │
│  • Almacena conversaciones en PostgreSQL                        │
│  • Calcula métricas (CSAT, resolution rate, etc.)              │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ Exporta conversaciones
               │ en formato JSONL
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              STREAMLIT - Agentic Workbench                      │
│                   http://localhost:8501                         │
│                                                                 │
│  FASE 1: Análisis                                               │
│  ├─ Carga JSONL de conversaciones                              │
│  ├─ Calcula métricas baseline                                  │
│  ├─ Detecta intents automáticamente                            │
│  └─ Genera ranking de herramientas necesarias                  │
│                                                                 │
│  FASE 2: Propuestas LLM                                         │
│  ├─ Envía contexto completo a GPT-5-nano                       │
│  ├─ Recibe propuestas estructuradas:                           │
│  │   • Mejoras de prompts                                      │
│  │   • Cambios de código                                       │
│  │   • Tools a desarrollar                                     │
│  │   • Plan de evaluación                                      │
│  │   • Assessment de riesgos                                   │
│  └─ Administrador revisa y edita propuestas                    │
│                                                                 │
│  FASE 3: Evaluación                                             │
│  ├─ Administrador aprueba cambios                              │
│  ├─ Sistema regenera conversaciones con prompts mejorados      │
│  ├─ Generación paralela (ThreadPoolExecutor)                   │
│  ├─ Compara baseline vs proposed                               │
│  └─ Muestra deltas de métricas                                 │
│                                                                 │
│  FASE 4: Implementación                                         │
│  ├─ Descarga resultados (JSONL, CSV, JSON)                     │
│  └─ Implementa mejoras en producción si hay mejora             │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ Implementa mejoras aprobadas
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Actualizado)                          │
│  • Nuevos prompts aplicados                                     │
│  • Código optimizado                                            │
│  • Nuevas herramientas integradas                              │
│  • Mejores respuestas del chatbot                              │
└─────────────────────────────────────────────────────────────────┘
               │
               │ Ciclo continúa...
               ▼
         [Nuevas conversaciones]
```

### Integración Entre Componentes

#### Frontend ↔ Backend
```typescript
// Frontend hace request al backend
fetch('http://localhost:8000/api/tickets', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer JWT_TOKEN' },
  body: JSON.stringify({ title, description })
})

// Backend responde con datos
response: { ticket_id, status, created_at }
```

#### Backend ↔ Database
```python
# Backend almacena en PostgreSQL
ticket = Ticket(
    user_id=current_user.id,
    title=ticket_data.title,
    description=ticket_data.description,
    status='open'
)
db.add(ticket)
db.commit()
```

#### Backend → Streamlit (Exportación)
```python
# Backend exporta conversaciones
conversations = db.query(Conversation).all()
with open('conversations.jsonl', 'w') as f:
    for conv in conversations:
        f.write(json.dumps(conv.to_dict()) + '\n')
```

#### Streamlit ↔ OpenAI
```python
# Streamlit consulta GPT-5-nano
response = client.chat.completions.create(
    model="gpt-5-nano-2025-08-07",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": analysis_context}
    ],
    temperature=0.8
)
```

### 1. Backend

El backend gestiona toda la lógica de negocio del sistema:

- **Base de datos**: Almacenamiento persistente de usuarios, tickets y mensajes
- **API REST**: Endpoints para gestión de recursos
- **Autenticación**: Sistema de login y gestión de sesiones
- **Integración con IA**: Conexión con modelos de lenguaje para el chatbot
- **Gestión de Tickets**: CRUD completo de tickets de soporte
- **Gestión de Mensajes**: Almacenamiento y recuperación de conversaciones

### 2. Frontend de Usuario (Next.js)

Interfaz web construida con Next.js para que los clientes interactúen con el sistema:

**Características:**
- **Portal de Usuario**: Dashboard personalizado con TypeScript y Tailwind CSS
- **Sistema de Login/Signup**: Autenticación completa de usuarios
- **Vista de Tickets**: Interfaz para visualizar y gestionar tickets
- **Dashboard**: Panel principal con resumen de actividad
- **Chat en Vivo**: Componentes de chat para interactuar con el agente AI
- **Diseño Responsive**: Optimizado para dispositivos móviles y desktop

**Estructura del Frontend:**
```
frontend/user/
├── app/
│   ├── components/      # Componentes React reutilizables
│   ├── dashboard/       # Vista principal del usuario
│   ├── lib/            # Utilidades y helpers
│   ├── login/          # Página de inicio de sesión
│   ├── signup/         # Página de registro
│   ├── tickets/        # Gestión de tickets
│   ├── globals.css     # Estilos globales
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página de inicio
├── public/             # Recursos estáticos
├── .env.local          # Variables de entorno
├── package.json        # Dependencias
├── pnpm-lock.yaml      # Lockfile de pnpm
├── tailwind.config.ts  # Configuración de Tailwind
└── tsconfig.json       # Configuración de TypeScript
```

### 3. Panel de Administración - Kavak Agentic Workbench (Streamlit)

Dashboard avanzado de análisis y optimización continua del chatbot, construido con Streamlit y potenciado por **GPT-5-nano-2025-08-07**.

#### 🎯 Características Principales

**1. Análisis de Conversaciones**
- **Carga de Datos**: Importa conversaciones en formato JSONL
- **Métricas Baseline**: Calcula automáticamente:
  - Resolution Rate (tasa de resolución)
  - CSAT promedio (Customer Satisfaction Score 1-5)
  - Promedio de turnos por conversación
  - Duración promedio de conversaciones
- **Visualización en Tiempo Real**: Dashboard con métricas clave

**2. Sistema de Detección de Intents**
El sistema identifica automáticamente los intents de los usuarios mediante patrones regex:
- `offer_24h`: Ofertas de compra en 24 horas
- `status_eval`: Estado de evaluación mecánica
- `payment_status`: Estatus de pagos y transferencias
- `reschedule_inspection`: Reprogramación de inspecciones
- `credit_prequal`: Pre-calificación de crédito
- `warranty_claim`: Reclamaciones de garantía
- `kyc_docs`: Recolección de documentación KYC
- `appointment`: Agendamiento de citas

**3. Ranking de Herramientas**
El sistema analiza las conversaciones y genera un ranking de herramientas (tools) que deberían implementarse:
- **Esfuerzo estimado**: Clasificación 1-3 según complejidad
- **Frecuencia**: Número de veces que se necesitó cada herramienta
- **Impacto**: Efecto esperado en las métricas
- **Priorización**: Herramientas ordenadas por ROI potencial

Herramientas identificadas incluyen:
- OfferIn24 Orchestrator
- Inspection/Workshop Status Tracker
- Payout Status Tracker
- Inspection Re-Scheduler
- Credit Pre-Qualification Simulator
- Warranty Coverage Checker
- Doc & KYC Collector
- Scheduling Assistant

**4. Motor de Propuestas con LLM**
Al hacer clic en "Generar propuestas con LLM", el sistema:

a) **Analiza el contexto completo** de las conversaciones
b) **Identifica patrones** de éxito y áreas de mejora
c) **Genera propuestas** en 5 categorías:

   **📝 Prompt Changes (Cambios de Prompts)**
   - **System Patch**: Mejoras al prompt del sistema
   - **User Patch**: Plantilla mejorada para mensajes de usuario
     - Soporta placeholders: `{contexto}`, `{tono}`, `{idioma}`, `{canal}`
   - **Rationale**: Explicación detallada de por qué estos cambios mejorarán el sistema
   - **Editable**: Los administradores pueden modificar antes de aprobar

   **💻 Code Changes (Cambios de Código)**
   - Parches de código sugeridos con:
     - Título descriptivo
     - Código del patch
     - Impacto esperado
     - Nivel de riesgo

   **🔧 Proposed Tools (Herramientas Propuestas)**
   - Lista de tools que deberían desarrollarse:
     - Nombre de la herramienta
     - Justificación (por qué es necesaria)
     - Esfuerzo estimado (1-3)
     - Sketch de la API

   **📊 Evaluation Plan (Plan de Evaluación)**
   - **Métricas**: KPIs a monitorear
   - **Protocolo Offline**: Cómo evaluar sin usuarios reales
   - **Protocolo Online**: Plan de A/B testing en producción
   - **Criterios de Éxito**: Umbrales para considerar la mejora exitosa

   **⚠️ Risks (Riesgos)**
   - Lista de riesgos potenciales de implementar los cambios

**5. Sistema de Aprobación y Aplicación**
- **Edición de Prompts**: Modifica las propuestas del LLM antes de aplicarlas
- **Aprobación**: Confirma qué cambios se implementarán
- **Configuración de Evaluación**: Define objetivos y pesos de métricas:
  - Target CSAT objetivo (1.0-5.0)
  - Máximo de turnos objetivo
  - Latencia objetivo en segundos
  - Pesos personalizables para cada métrica:
    - Peso CSAT (0-1)
    - Peso Resolution Rate (0-1)
    - Peso Eficiencia de turnos (0-1)
    - Peso Latencia (0-1)

**6. Regeneración y Evaluación**
Una vez aprobados los prompts:
- **Generación Paralela**: Regenera conversaciones usando ThreadPoolExecutor
  - Paralelismo configurable (1-16 workers)
  - Reintentos automáticos por conversación (1-8 intentos)
  - Control de temperatura del modelo (0.0-1.5)
- **Contextos múltiples**: Genera conversaciones para diferentes escenarios:
  - buying, ask, feedback, service, credit, warranty
- **Variación de parámetros**:
  - Tonos: amable, empático, formal, resolutivo, apologético, directo, entusiasta
  - Canales: WhatsApp, webchat, email, teléfono
  - Idiomas: español, inglés

**7. Comparativa Baseline vs Proposed**
El sistema genera un análisis comparativo detallado:
- **Métricas lado a lado**
- **Deltas calculados**: Muestra mejoras o retrocesos
  - ▲ Mejora
  - ▼ Deterioro
  - ＝ Sin cambio
- **Visualización clara** de qué métricas mejoraron

**8. Exportación de Resultados**
Descarga múltiples formatos para análisis externo:
- `llm_rewrite_response.json`: Propuestas completas del LLM
- `candidate_tools_ranked.csv`: Ranking de herramientas
- `baseline_conversations.jsonl`: Conversaciones originales
- `proposed_conversations.jsonl`: Conversaciones generadas con prompts mejorados
- `baseline_meta.csv`: Metadatos de conversaciones baseline
- `proposed_meta.csv`: Metadatos de conversaciones propuestas

#### ⚙️ Configuración del Panel

**Parámetros Ajustables:**
```
- Conversaciones a regenerar por contexto: 1-10 (default: 3)
- Paralelismo (threads): 1-16 (default: 6)
- Reintentos por conversación: 1-8 (default: 4)
- Temperature: 0.0-1.5 (default: 0.8)
- Target CSAT: 1.0-5.0 (default: 4.5)
- Máx turnos objetivo: 2-12 (default: 6)
- Latencia objetivo: 10-600 seg (default: 120)
- Pesos de métricas: 0.0-1.0 (personalizables)
```

#### 🔐 Autenticación y Seguridad
- **API Key Management**: Lee credenciales desde `st.secrets` o variables de entorno
- **Modelo Fijo**: GPT-5-nano-2025-08-07 bloqueado por seguridad
- **Caché de Cliente**: OpenAI client cacheado con `@st.cache_resource`

#### 📈 Flujo de Trabajo Completo

```mermaid
graph TD
    A[Subir JSONL] --> B[Análisis Automático]
    B --> C[Detección de Intents]
    C --> D[Ranking de Tools]
    D --> E[Generar Propuestas LLM]
    E --> F[Revisar y Editar Prompts]
    F --> G[Aprobar Cambios]
    G --> H[Regenerar Dataset]
    H --> I[Comparar Métricas]
    I --> J{¿Mejora significativa?}
    J -->|Sí| K[Exportar y Aplicar]
    J -->|No| F
    K --> L[Iterar]
    L --> A
```

**Estructura de Streamlit:**
```
streamlit/
├── app.py              # Aplicación principal (595 líneas)
└── requirements.txt    # Dependencias Python
```

**Tecnologías Utilizadas:**
- **Streamlit**: Framework de la interfaz
- **OpenAI GPT-5-nano**: Motor de propuestas
- **Pandas**: Análisis de datos
- **ThreadPoolExecutor**: Generación paralela
- **Regex**: Detección de intents
- **JSON/JSONL**: Formato de datos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Framework**: FastAPI / Flask
- **Base de Datos**: PostgreSQL
- **ORM**: SQLAlchemy
- **IA**: OpenAI API (GPT-5-nano-2025-08-07)
- **Autenticación**: JWT
- **Archivos**: 
  - `main.py`: Servidor principal
  - `models.py`: Modelos de BD
  - `schemas.py`: Validación con Pydantic
  - `crud.py`: Operaciones de base de datos
  - `database.py`: Configuración de conexión
  - `utils.py`: Utilidades
  - `kavak_metrics.py`: Cálculo de métricas
  - `Metrics.py`: Métricas adicionales
  - `prompt_training_LLMjudge.py`: Entrenamiento de prompts

### Frontend
- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **UI Library**: Tailwind CSS
- **Package Manager**: pnpm
- **Estado**: React Context API / Hooks
- **HTTP Client**: Fetch API / Axios

### Panel de Administración (Streamlit)
- **Framework**: Streamlit
- **LLM**: OpenAI GPT-5-nano-2025-08-07
- **Análisis de Datos**: Pandas, NumPy
- **Procesamiento**: 
  - Threading (ThreadPoolExecutor)
  - Regex para detección de intents
  - JSON/JSONL para manejo de datos
- **Progreso**: stqdm (progress bars)
- **Configuración**: python-dotenv

### Notebook
- **Jupyter Notebooks**: Para análisis y experimentación
- **Bibliotecas**: Pandas, NumPy, Matplotlib/Plotly

## 🚀 Instalación

### Prerequisitos

- Node.js (v18+)
- pnpm (package manager recomendado) o npm
- Python (v3.9+)
- PostgreSQL
- API Key de OpenAI (para GPT-5-nano-2025-08-07)

### Clonar el Repositorio

```bash
git clone https://github.com/franciscodb/adaptive-customer-service-mono.git
cd adaptive-customer-service-mono
```

### Configuración del Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver
```

### Configuración del Frontend

```bash
cd frontend/user

# Instalar dependencias con pnpm
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL del backend

# Iniciar servidor de desarrollo
pnpm dev

# O con npm si prefieres
npm install
npm run dev
```

### Configuración del Panel de Administración (Streamlit)

```bash
cd streamlit

# Instalar dependencias
pip install -r requirements.txt

# Configurar secrets de Streamlit (recomendado)
mkdir -p .streamlit
# Crear .streamlit/secrets.toml con:
# openai_kavak_secret = "tu-api-key"

# O usar variables de entorno
export OPENAI_API_KEY=tu-api-key

# Iniciar aplicación Streamlit
streamlit run app.py
```

## 📝 Configuración

### Variables de Entorno

#### Backend (.env)
```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/customer_service

# Seguridad
SECRET_KEY=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8501

# Puerto (opcional, para Heroku)
PORT=8000
```

#### Frontend (.env.local)
```env
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# WebSockets (si aplica)
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

#### Panel de Administración Streamlit

**Opción 1: Streamlit Secrets (Recomendado)**

Crear `.streamlit/secrets.toml`:
```toml
openai_kavak_secret = "sk-your-openai-key"

# O alternativamente
OPENAI_API_KEY = "sk-your-openai-key"
```

**Opción 2: Variables de Entorno**
```env
OPENAI_API_KEY=sk-your-openai-key
openai_kavak_secret=sk-your-openai-key
```

> **Nota**: El modelo está fijado a `gpt-5-nano-2025-08-07` y no es configurable por seguridad.

## 💻 Uso

### Para Usuarios (Clientes)

1. **Registro/Login**: Accede al frontend en `http://localhost:3000`
2. **Crear Ticket**: Navega a "Nuevo Ticket" y describe tu problema
3. **Chat con IA**: Inicia una conversación con el agente AI
4. **Seguimiento**: Revisa el estado de tus tickets en el dashboard

### Para Administradores (Kavak Agentic Workbench)

1. **Acceder al Panel**: Abre `http://localhost:8501`

2. **Configurar Parámetros**: En el sidebar, ajusta:
   - Conversaciones por contexto (1-10)
   - Paralelismo de threads (1-16)
   - Reintentos por conversación (1-8)
   - Temperature del modelo (0.0-1.5)
   - Objetivos de evaluación (CSAT, turnos, latencia)
   - Pesos de métricas

3. **Cargar Conversaciones**:
   - Haz clic en "Sube el JSONL de conversaciones"
   - Selecciona tu archivo `.jsonl` con conversaciones históricas
   - El sistema cargará y analizará automáticamente

4. **Revisar Métricas Baseline**:
   - Ve las métricas actuales del sistema:
     - Total de conversaciones
     - Resolution rate
     - CSAT promedio
     - Promedio de turnos
     - Duración promedio

5. **Analizar Intents y Ranking**:
   - Revisa los intents detectados automáticamente
   - Observa el ranking de herramientas sugeridas
   - Descarga `candidate_tools_ranked.csv` si deseas

6. **Generar Propuestas con LLM**:
   - Haz clic en "Generar propuestas con LLM"
   - Espera mientras GPT-5-nano analiza las conversaciones
   - Revisa las 5 categorías de propuestas:
     - **Prompt changes**: Mejoras a los prompts del sistema
     - **Code changes**: Parches de código sugeridos
     - **Proposed tools**: Herramientas a desarrollar
     - **Evaluation plan**: Plan de evaluación detallado
     - **Risks**: Riesgos potenciales

7. **Editar y Aprobar Prompts**:
   - Modifica el `system_patch` si es necesario
   - Ajusta el `user_patch` (soporta placeholders)
   - Haz clic en "✅ Aprobar estos prompts"

8. **Regenerar Dataset**:
   - Clic en "Regenerar dataset con prompts aprobados"
   - El sistema generará conversaciones nuevas usando los prompts mejorados
   - Proceso paralelo con múltiples workers

9. **Comparar Resultados**:
   - Revisa el comparativo Baseline vs Proposed
   - Observa los deltas (▲ mejoras, ▼ retrocesos)
   - Analiza si las métricas clave mejoraron:
     - Resolution rate
     - CSAT promedio
     - Eficiencia (turnos)
     - Duración

10. **Exportar Resultados**:
    - Descarga los archivos generados:
      - `llm_rewrite_response.json`: Propuestas completas
      - `baseline_conversations.jsonl`: Conversaciones originales
      - `proposed_conversations.jsonl`: Conversaciones mejoradas
      - `baseline_meta.csv` y `proposed_meta.csv`: Metadatos

11. **Iterar**:
    - Si los resultados son buenos: implementa los cambios en producción
    - Si no son satisfactorios: ajusta parámetros y repite desde el paso 6

### Flujo de Mejora Continua

```
┌─────────────────────────────────────────────────┐
│ 1. Subir conversaciones históricas (JSONL)     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Sistema analiza métricas y detecta intents  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. LLM genera propuestas de mejora             │
│    - Prompts optimizados                       │
│    - Código sugerido                           │
│    - Tools necesarias                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. Admin revisa, edita y aprueba cambios       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. Sistema regenera conversaciones con mejoras │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. Comparar Baseline vs Proposed               │
│    ¿Mejoraron las métricas?                    │
└────────┬────────────────────────────┬───────────┘
         │ SÍ                         │ NO
         ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│ 7a. Implementar      │    │ 7b. Ajustar          │
│     en producción    │    │     parámetros       │
└──────────────────────┘    └──────┬───────────────┘
                                   │
                                   └──► Repetir desde paso 3
```

## 📊 Estructura del Proyecto

```
adaptive-customer-service/
│
├── backend/
│   ├── app/
│   │   ├── routers/              # Endpoints organizados por recurso
│   │   ├── services/             # Lógica de negocio
│   │   ├── __pycache__/          # Cache de Python
│   │   ├── crud.py               # Operaciones CRUD
│   │   ├── database.py           # Configuración de BD
│   │   ├── kavak_metrics.py      # Métricas de Kavak
│   │   ├── main.py               # Punto de entrada FastAPI
│   │   ├── Metrics.py            # Cálculo de métricas
│   │   ├── models.py             # Modelos SQLAlchemy
│   │   ├── prompt_training_LLMjudge.py  # Entrenamiento de prompts
│   │   ├── schemas.py            # Esquemas Pydantic
│   │   ├── utils.py              # Utilidades
│   │   ├── conversations_meta (4).csv   # Dataset de conversaciones
│   │   └── m.csv                 # Datos adicionales
│   ├── venv/                     # Entorno virtual Python
│   ├── .env                      # Variables de entorno
│   ├── .gitignore
│   ├── Procfile                  # Configuración para Heroku
│   ├── requirements.txt          # Dependencias Python
│   ├── runtime.txt               # Versión de Python
│   └── test_connection.py        # Test de conexión a BD
│
├── frontend/
│   └── user/
│       ├── app/
│       │   ├── components/       # Componentes React reutilizables
│       │   ├── dashboard/        # Vista del dashboard
│       │   ├── lib/              # Librerías y utilidades
│       │   ├── login/            # Página de login
│       │   ├── signup/           # Página de registro
│       │   ├── tickets/          # Gestión de tickets
│       │   ├── favicon.ico       # Favicon
│       │   ├── globals.css       # Estilos globales
│       │   ├── layout.tsx        # Layout principal
│       │   └── page.tsx          # Página de inicio
│       ├── .next/                # Build de Next.js
│       ├── .vercel/              # Configuración de Vercel
│       ├── node_modules/         # Dependencias Node
│       ├── public/               # Archivos estáticos
│       ├── .env.local            # Variables de entorno locales
│       ├── .gitignore
│       ├── eslint.config.mjs     # Configuración ESLint
│       ├── next-env.d.ts         # Tipos de Next.js
│       ├── next.config.ts        # Configuración de Next.js
│       ├── package.json          # Dependencias del proyecto
│       ├── pnpm-lock.yaml        # Lockfile de pnpm
│       ├── postcss.config.mjs    # Configuración PostCSS
│       ├── README.md             # Documentación del frontend
│       ├── tailwind.config.ts    # Configuración de Tailwind
│       └── tsconfig.json         # Configuración TypeScript
│
├── streamlit/
│   ├── app.py                    # Kavak Agentic Workbench (595 líneas)
│   └── requirements.txt          # Dependencias: streamlit, openai, pandas, etc.
│
└── notebook/                     # Jupyter notebooks para análisis
    └── [análisis y experimentación]
```

## 📄 Formato de Datos JSONL

El panel de Streamlit trabaja con conversaciones en formato JSONL (JSON Lines). Cada línea representa una conversación completa con la siguiente estructura:

### Estructura de una Conversación

```json
{
  "conversation_id": "conv_12345",
  "meta": {
    "conversation_id": "conv_12345",
    "context": "buying",
    "tono": "empático",
    "canal": "whatsapp",
    "idioma": "es",
    "resolved": true,
    "num_interactions": 8,
    "duration_sec": 245,
    "timestamp": "2025-10-23T14:30:00Z"
  },
  "transcript": [
    {
      "role": "user",
      "content": "Hola, quiero información sobre la oferta de 24 horas",
      "timestamp": "2025-10-23T14:30:00Z"
    },
    {
      "role": "assistant",
      "content": "¡Hola! Claro que sí, con gusto te ayudo...",
      "timestamp": "2025-10-23T14:30:15Z"
    }
  ],
  "outcomes": {
    "csat_estimated_1_5": 4.5,
    "summary": "Cliente consultó sobre oferta 24h y recibió información completa",
    "intent_detected": ["offer_24h"],
    "tools_needed": ["OfferIn24 Orchestrator"],
    "resolution_reason": "Cliente satisfecho con la información proporcionada"
  }
}
```

### Campos Principales

#### `meta` (Metadatos)
- **conversation_id**: Identificador único de la conversación
- **context**: Contexto de la conversación (`buying`, `ask`, `feedback`, `service`, `credit`, `warranty`)
- **tono**: Tono usado (`amable`, `empático`, `formal`, `resolutivo`, `apologético`, `directo`, `entusiasta`)
- **canal**: Canal de comunicación (`whatsapp`, `webchat`, `email`, `telefono`)
- **idioma**: Idioma de la conversación (`es`, `en`)
- **resolved**: Boolean indicando si el problema se resolvió
- **num_interactions**: Número total de mensajes en la conversación
- **duration_sec**: Duración en segundos

#### `transcript` (Transcripción)
Array de mensajes con:
- **role**: `user` o `assistant`
- **content**: Contenido del mensaje
- **timestamp**: Marca de tiempo del mensaje

#### `outcomes` (Resultados)
- **csat_estimated_1_5**: CSAT estimado (1-5)
- **summary**: Resumen de la conversación
- **intent_detected**: Lista de intents detectados
- **tools_needed**: Herramientas que hubieran sido útiles
- **resolution_reason**: Razón de la resolución o no resolución

### Ejemplo de Archivo JSONL

```jsonl
{"conversation_id": "conv_001", "meta": {...}, "transcript": [...], "outcomes": {...}}
{"conversation_id": "conv_002", "meta": {...}, "transcript": [...], "outcomes": {...}}
{"conversation_id": "conv_003", "meta": {...}, "transcript": [...], "outcomes": {...}}
```

> **Nota**: Cada línea del archivo JSONL es un JSON válido independiente.

## 🔑 Características Destacadas

### Sistema de Aprendizaje Adaptativo Impulsado por LLM

El verdadero diferenciador del sistema es su **motor de optimización continua basado en GPT-5-nano**:

#### 🧠 Análisis Inteligente de Conversaciones
- **Detección Automática de Intents**: Identifica 8 categorías de intents mediante regex patterns
- **Scoring Compuesto**: Calcula puntuaciones ponderadas basadas en:
  - CSAT (Customer Satisfaction Score)
  - Resolution Rate
  - Eficiencia de turnos
  - Latencia de respuesta
- **Ranking Dinámico**: Prioriza herramientas según frecuencia, esfuerzo e impacto

#### 🤖 Generación de Propuestas con LLM
El sistema envía el contexto completo al LLM y recibe propuestas estructuradas en 5 dimensiones:

1. **Prompt Engineering**
   - Mejoras al system prompt
   - Templates optimizados con placeholders dinámicos
   - Rationale detallado de cada cambio

2. **Code Optimization**
   - Parches de código sugeridos
   - Análisis de impacto y riesgo
   - Mejoras de rendimiento

3. **Tool Discovery**
   - Identifica herramientas necesarias
   - API sketches para implementación
   - Estimación de esfuerzo (1-3)

4. **Evaluation Framework**
   - Métricas a monitorear
   - Protocolos offline y online
   - Criterios de éxito cuantificables

5. **Risk Assessment**
   - Identificación de riesgos potenciales
   - Estrategias de mitigación

#### 🔄 Ciclo de Mejora Continua
```
Conversaciones → Análisis LLM → Propuestas → Aprobación → 
Regeneración → Evaluación → ¿Mejora? → Implementación/Iteración
```

#### ⚡ Generación Paralela Optimizada
- **ThreadPoolExecutor**: Procesa múltiples conversaciones simultáneamente
- **Reintentos Inteligentes**: Manejo robusto de errores con backoff exponencial
- **Seeds Reproducibles**: Generación determinista para comparaciones justas
- **Progress Tracking**: Barras de progreso con stqdm

### Métricas Disponibles en el Sistema

#### Métricas de Rendimiento
- **CSAT (Customer Satisfaction Score)**: Estimación 1-5 basada en análisis del LLM
- **Resolution Rate**: Porcentaje de problemas resueltos exitosamente
- **Average Turns**: Número promedio de interacciones por conversación
- **Average Duration**: Duración promedio en segundos
- **Latency**: Tiempo de respuesta del sistema

#### Métricas de Intents
- **Frecuencia por Intent**: Conteo de cada intent detectado
- **Tools Needed**: Herramientas requeridas por intent
- **Effort Score**: Complejidad estimada de implementación
- **Priority Score**: Ranking basado en impacto vs esfuerzo

#### Métricas Compuestas
- **Composite Score**: Puntuación ponderada global
  - Formula: `(CSAT_norm × w_csat) + (res_rate × w_res) + (turn_eff × w_turns) + (lat_eff × w_lat)`
- **Improvement Delta**: Diferencia entre baseline y proposed
- **ROI Estimado**: Retorno esperado de implementar mejoras

### Configurabilidad Total

**Pesos de Métricas Personalizables:**
- CSAT Weight: 0.0 - 1.0 (default: 0.35)
- Resolution Rate Weight: 0.0 - 1.0 (default: 0.35)
- Efficiency Weight: 0.0 - 1.0 (default: 0.15)
- Latency Weight: 0.0 - 1.0 (default: 0.15)

**Objetivos Ajustables:**
- Target CSAT: 1.0 - 5.0
- Max Turns Target: 2 - 12
- Latency Target: 10 - 600 segundos

**Parámetros de Generación:**
- Conversations per Context: 1 - 10
- Thread Parallelism: 1 - 16
- Max Retry Attempts: 1 - 8
- Temperature: 0.0 - 1.5

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Admin panel tests
cd admin-panel
pytest tests/
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código del proyecto
- Escribe tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Asegúrate de que todos los tests pasen antes de hacer PR

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Francisco DB** - *Trabajo Inicial* - [@franciscodb](https://github.com/franciscodb)

## 🙏 Agradecimientos

- Comunidad de OpenAI/Anthropic por las APIs de IA
- Streamlit por facilitar la creación de dashboards interactivos
- Todos los contribuidores que han participado en este proyecto

## 📞 Soporte

Si tienes alguna pregunta o problema:

- 📧 Email: soporte@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/franciscodb/adaptive-customer-service-mono/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/franciscodb/adaptive-customer-service-mono/discussions)

## 🗺️ Roadmap

### En Desarrollo
- [ ] Implementación de las 8 herramientas prioritarias detectadas
  - [ ] OfferIn24 Orchestrator
  - [ ] Inspection/Workshop Status Tracker
  - [ ] Payout Status Tracker
  - [ ] Credit Pre-Qualification Simulator
  - [ ] Warranty Coverage Checker
  - [ ] Inspection Re-Scheduler
  - [ ] Doc & KYC Collector
  - [ ] Scheduling Assistant

### Próximas Mejoras
- [ ] A/B Testing Framework integrado
- [ ] Monitoreo de conversaciones en tiempo real
- [ ] Auto-aplicación de mejoras aprobadas
- [ ] Detección de nuevos intents automáticamente
- [ ] Exportación de métricas a BI tools (Power BI, Tableau)
- [ ] Integración con múltiples modelos LLM (Claude, Gemini)
- [ ] Sistema de rollback automático si las métricas empeoran

### Futuras Funcionalidades
- [ ] Soporte multiidioma (inglés, portugués)
- [ ] Integración con WhatsApp Business API
- [ ] Integración con Telegram
- [ ] Sistema de transcripción de llamadas telefónicas
- [ ] Dashboard ejecutivo con reportes automáticos
- [ ] API pública para integraciones externas
- [ ] Modo offline para el chatbot
- [ ] Sistema de versionado de prompts
- [ ] Auditoría completa de cambios
- [ ] Simulador de conversaciones antes de deployar

---

⭐️ Si este proyecto te ha sido útil, por favor considera darle una estrella en GitHub
