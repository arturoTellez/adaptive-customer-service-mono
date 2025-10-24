# 🎯 Adaptive Customer Service Mono

### Sistema de Atención al Cliente con IA Adaptativa y Aprendizaje Continuo

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-Latest-red.svg)](https://streamlit.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5--nano-orange.svg)](https://openai.com/)

---

## 🚀 Demo en Producción

**Prueba el sistema ahora:**

🔗 **URL**: [https://adaptative-customer-service-user.vercel.app/](https://adaptative-customer-service-user.vercel.app/)

**Credenciales de Demo:**
```
Usuario: demo-agent@gmail.com
Password: Demo001
```

> 💡 **Tip**: Inicia sesión para acceder al dashboard, crear tickets y chatear con el agente AI.

---

## 📋 Descripción

Sistema de atención al cliente con **inteligencia artificial adaptativa** que aprende y mejora continuamente mediante análisis automático de conversaciones. Diseñado específicamente para entornos de alta demanda como el sector automotriz.

### ¿Qué hace diferente a este sistema?

✅ **Analiza** conversaciones reales automáticamente  
✅ **Detecta** intents y prioriza herramientas necesarias  
✅ **Genera** propuestas de mejora con GPT-5-nano  
✅ **Evalúa** cambios antes de deployar  
✅ **Mejora** continuamente en días (no semanas)

---

## 🏗️ Arquitectura

El proyecto se divide en 3 componentes:

```
adaptive-customer-service/
├── backend/              # FastAPI + PostgreSQL + OpenAI
├── frontend/user/        # Next.js + TypeScript + Tailwind
└── streamlit/            # Kavak Agentic Workbench
```

### 1. 🖥️ Backend (FastAPI)
- API REST para gestión de usuarios, tickets y mensajes
- Integración con OpenAI GPT-5-nano para chatbot
- Base de datos PostgreSQL
- Autenticación JWT

**Archivos principales:**
- `app/main.py` - Servidor FastAPI
- `app/models.py` - Modelos de BD
- `app/crud.py` - Operaciones CRUD
- `app/kavak_metrics.py` - Cálculo de métricas

### 2. 💻 Frontend (Next.js)
- Portal de usuarios con dashboard personalizado
- Sistema de tickets
- Chat en tiempo real con IA
- Diseño responsive con Tailwind CSS

**Estructura:**
```
frontend/user/app/
├── components/     # Componentes React
├── dashboard/      # Dashboard principal
├── login/          # Autenticación
├── signup/         # Registro
└── tickets/        # Gestión de tickets
```

### 3. 📊 Panel Admin (Streamlit) - **KAVAK AGENTIC WORKBENCH**

El corazón del sistema de aprendizaje continuo.

#### Funcionalidades Principales:

**1️⃣ Análisis Automático**
- Carga conversaciones en formato JSONL
- Calcula métricas: CSAT, Resolution Rate, turnos, latencia
- Detecta 8 intents automáticamente:
  - `offer_24h` - Ofertas en 24 horas
  - `status_eval` - Estado de evaluación
  - `payment_status` - Estatus de pagos
  - `reschedule_inspection` - Reprogramación
  - `credit_prequal` - Pre-calificación de crédito
  - `warranty_claim` - Garantías
  - `kyc_docs` - Documentación
  - `appointment` - Agendamiento

**2️⃣ Ranking de Herramientas**
Prioriza tools según:
- Frecuencia de uso
- Esfuerzo de implementación (1-3)
- Impacto esperado

Herramientas identificadas:
- OfferIn24 Orchestrator
- Inspection/Workshop Status Tracker
- Payout Status Tracker
- Credit Pre-Qualification Simulator
- Warranty Coverage Checker
- Y más...

**3️⃣ Motor de Propuestas LLM**
GPT-5-nano analiza todo el contexto y genera propuestas en 5 categorías:

- **📝 Prompt Changes**: Mejoras al system prompt y user template
- **💻 Code Changes**: Parches de código sugeridos
- **🔧 Proposed Tools**: Herramientas a desarrollar con API sketch
- **📊 Evaluation Plan**: Métricas, protocolos offline/online
- **⚠️ Risks**: Identificación de riesgos

**4️⃣ Sistema de Aprobación**
- Edita propuestas antes de aplicar
- Configura pesos de métricas
- Define objetivos (CSAT target, turnos, latencia)

**5️⃣ Regeneración y Evaluación**
- Genera conversaciones con prompts mejorados
- Procesamiento paralelo (ThreadPoolExecutor)
- Compara Baseline vs Proposed
- Exporta resultados en múltiples formatos

#### Parámetros Configurables:
```
- Conversaciones por contexto: 1-10
- Threads paralelos: 1-16
- Reintentos: 1-8
- Temperature: 0.0-1.5
- Target CSAT: 1.0-5.0
- Max turnos: 2-12
- Latencia objetivo: 10-600 seg
- Pesos de métricas: personalizables
```

---

## 🚀 Instalación Rápida

### Prerequisitos
- Node.js 18+
- Python 3.9+
- PostgreSQL
- pnpm (recomendado)
- OpenAI API Key

### Setup

```bash
# Clonar
git clone https://github.com/franciscodb/adaptive-customer-service-mono.git
cd adaptive-customer-service-mono

# 1. Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Configurar .env (ver sección Configuración)
python app/main.py

# 2. Frontend (nueva terminal)
cd frontend/user
pnpm install
# Configurar .env.local
pnpm dev

# 3. Streamlit (nueva terminal)
cd streamlit
pip install -r requirements.txt
# Configurar .streamlit/secrets.toml
streamlit run app.py
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin Panel: http://localhost:8501

---

## ⚙️ Configuración

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/customer_service
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
CORS_ORIGINS=http://localhost:3000,http://localhost:8501
PORT=8000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Streamlit `.streamlit/secrets.toml`
```toml
openai_kavak_secret = "sk-your-openai-key"
```

> **Nota**: El modelo está fijado a `gpt-5-nano-2025-08-07` por seguridad.

---

## 📖 Uso

### Para Usuarios
1. Accede a https://adaptative-customer-service-user.vercel.app/
2. Login con credenciales de demo
3. Crea tickets
4. Chatea con el agente AI

### Para Administradores (Streamlit)

**Flujo completo de mejora:**

```
1. Cargar JSONL
   ↓
2. Revisar métricas baseline
   ↓
3. Ver ranking de tools
   ↓
4. Generar propuestas LLM
   ↓
5. Editar y aprobar prompts
   ↓
6. Regenerar dataset
   ↓
7. Comparar resultados
   ↓
8. Exportar e implementar
   ↓
9. Repetir ciclo
```

**Archivos exportados:**
- `llm_rewrite_response.json` - Propuestas completas
- `candidate_tools_ranked.csv` - Ranking de herramientas
- `baseline_conversations.jsonl` - Conversaciones originales
- `proposed_conversations.jsonl` - Conversaciones mejoradas
- `baseline_meta.csv` / `proposed_meta.csv` - Metadatos

---

## 📄 Formato de Datos JSONL

```json
{
  "conversation_id": "conv_12345",
  "meta": {
    "context": "buying",
    "tono": "empático",
    "canal": "whatsapp",
    "idioma": "es",
    "resolved": true,
    "num_interactions": 8,
    "duration_sec": 245
  },
  "transcript": [
    {
      "role": "user",
      "content": "Hola, quiero información sobre la oferta de 24 horas"
    },
    {
      "role": "assistant",
      "content": "¡Hola! Claro que sí, con gusto te ayudo..."
    }
  ],
  "outcomes": {
    "csat_estimated_1_5": 4.5,
    "summary": "Cliente consultó sobre oferta 24h",
    "intent_detected": ["offer_24h"],
    "tools_needed": ["OfferIn24 Orchestrator"]
  }
}
```

---

## 🛠️ Stack Tecnológico

**Backend:**
- FastAPI
- PostgreSQL + SQLAlchemy
- OpenAI GPT-5-nano
- JWT Authentication

**Frontend:**
- Next.js 14+
- TypeScript
- Tailwind CSS
- pnpm

**Admin Panel:**
- Streamlit
- Pandas
- ThreadPoolExecutor
- OpenAI API

---

## 📊 Estructura del Proyecto

```
adaptive-customer-service/
│
├── backend/
│   ├── app/
│   │   ├── routers/              # Endpoints
│   │   ├── services/             # Lógica de negocio
│   │   ├── crud.py               # CRUD operations
│   │   ├── database.py           # DB config
│   │   ├── kavak_metrics.py      # Métricas
│   │   ├── main.py               # FastAPI app
│   │   ├── models.py             # SQLAlchemy models
│   │   └── schemas.py            # Pydantic schemas
│   ├── .env
│   ├── requirements.txt
│   └── Procfile
│
├── frontend/user/
│   ├── app/
│   │   ├── components/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── tickets/
│   │   └── layout.tsx
│   ├── package.json
│   └── tailwind.config.ts
│
├── streamlit/
│   ├── app.py                    # 595 líneas
│   └── requirements.txt
│
└── notebook/                     # Análisis
```

---

## 💡 Casos de Uso

### Caso 1: Detectar Nueva Herramienta Necesaria
**Problema**: Clientes preguntan frecuentemente por estado de evaluación  
**Solución**: Sistema detecta intent `status_eval`, propone "Inspection Status Tracker"  
**Resultado**: -40% tickets sobre estado de inspección

### Caso 2: Mejorar CSAT
**Problema**: CSAT bajo (3.2/5.0)  
**Solución**: LLM propone tono más empático, regenera conversaciones  
**Resultado**: CSAT sube a 4.4/5.0

### Caso 3: Reducir Turnos
**Problema**: 12 turnos promedio por conversación  
**Solución**: LLM identifica redundancias, propone mejoras  
**Resultado**: Baja a 7 turnos (42% mejora)

---

## 🗺️ Roadmap

**En desarrollo:**
- [ ] Implementar las 8 herramientas prioritarias
- [ ] A/B Testing Framework
- [ ] Auto-aplicación de mejoras aprobadas

**Futuro:**
- [ ] Soporte multiidioma
- [ ] Integración WhatsApp Business API
- [ ] Transcripción de llamadas
- [ ] API pública

---

## 🤝 Contribución

```bash
1. Fork el proyecto
2. Crea tu rama (git checkout -b feature/AmazingFeature)
3. Commit cambios (git commit -m 'Add AmazingFeature')
4. Push (git push origin feature/AmazingFeature)
5. Abre Pull Request
```

---

## 📄 Licencia

MIT License - ver archivo `LICENSE`

---

## 👥 Autor

**Francisco DB** - [@franciscodb](https://github.com/franciscodb)

---

## 📞 Soporte

- 🐛 Issues: [GitHub Issues](https://github.com/franciscodb/adaptive-customer-service-mono/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/franciscodb/adaptive-customer-service-mono/discussions)

---

⭐ **¿Te resultó útil? Dale una estrella en GitHub!**

**Demo**: [https://adaptative-customer-service-user.vercel.app/](https://adaptative-customer-service-user.vercel.app/)
