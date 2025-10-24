# streamlit_app.py
# =====================================================================
# Kavak Tooling Proposals Workbench (Streamlit)
# - Sube CSV de mensajes
# - LLM (gpt-5-nano-2025-08-07) sugiere intents/tools/esfuerzos + prompt/code patches
# - Ranking de herramientas
# - Edición/Aprobación/Descarga de artefactos
# - API key desde st.secrets (openai_kavak_secret o OPENAI_API_KEY)
# =====================================================================

import os, io, re, json, random, base64
from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
import streamlit as st
from openai import OpenAI

# ---------------------- Config fija ----------------------
MODEL = "gpt-5-nano-2025-08-07"  # 🔒 modelo fijo
MODEL = "gpt-5"
st.set_page_config(page_title="Kavak Tooling Proposals", layout="wide")

# ---------------------- Helpers -------------------------
def _get_api_key_from_secrets() -> str:
    # Prioridad: secrets > env
    try:
        if "openai_kavak_secret" in st.secrets and st.secrets["openai_kavak_secret"]:
            return st.secrets["openai_kavak_secret"]
    except Exception:
        pass
    try:
        if "OPENAI_API_KEY" in st.secrets and st.secrets["OPENAI_API_KEY"]:
            return st.secrets["OPENAI_API_KEY"]
    except Exception:
        pass
    # Fallback env si estás desarrollando local
    key = os.getenv("openai_kavak_secret") or os.getenv("OPENAI_API_KEY")
    if key:
        return key
    raise RuntimeError("Falta API key en .streamlit/secrets.toml (openai_kavak_secret o OPENAI_API_KEY).")

# --- DB Utils (SQLAlchemy con NullPool y sslmode=require) ---
import os
import pandas as pd
import streamlit as st
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

def _get_db_url() -> str:
    # Prioriza secrets; fallback a env si estás en local
    try:
        if "DATABASE_URL" in st.secrets and st.secrets["DATABASE_URL"]:
            return st.secrets["DATABASE_URL"]
    except Exception:
        pass
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    raise RuntimeError("Falta DATABASE_URL en .streamlit/secrets.toml o como variable de entorno.")

@st.cache_resource(show_spinner=False)
def make_engine():
    url = _get_db_url()
    return create_engine(
        url,
        poolclass=NullPool,                           # evita agotar el pool del pooler
        connect_args={"sslmode": "require", "connect_timeout": 10},
    )

def fetch_messages_df(
    status: str | None = None,
    category: str | None = None,
    since: str | None = None,   # "YYYY-MM-DD"
    until: str | None = None,   # "YYYY-MM-DD"
    limit_tickets: int = 500,
) -> pd.DataFrame:
    """
    Devuelve DataFrame con columnas: ticket_id, content, created_at, is_bot, sender_name
    Toma los mensajes de tickets recientes (limitados por limit_tickets) y aplica filtros opcionales.
    """
    engine = make_engine()
    sql = text("""
        WITH ticket_scope AS (
          SELECT id
          FROM public.tickets
          WHERE (:status IS NULL OR status = :status)
            AND (:category IS NULL OR category = :category)
          ORDER BY created_at DESC
          LIMIT :limit_tickets
        )
        SELECT m.ticket_id::text AS ticket_id,
               m.content::text    AS content,
               m.created_at       AS created_at,
               m.is_bot           AS is_bot,
               m.sender_name      AS sender_name
        FROM public.messages m
        JOIN ticket_scope s ON s.id = m.ticket_id
        WHERE (:since IS NULL OR m.created_at >= :since)
          AND (:until IS NULL OR m.created_at <  :until)
        ORDER BY m.ticket_id, m.created_at
    """)

    params = {
        "status": status if status else None,
        "category": category if category else None,
        "since": since if since else None,      # e.g. "2025-10-01"
        "until": until if until else None,      # e.g. "2025-11-01"
        "limit_tickets": int(limit_tickets),
    }

    with engine.begin() as conn:
        rows = conn.execute(sql, params).mappings().all()

    if not rows:
        return pd.DataFrame(columns=["ticket_id","content","created_at","is_bot","sender_name"])

    df = pd.DataFrame(rows)
    df["ticket_id"] = df["ticket_id"].astype(str)
    df["content"] = df["content"].fillna("").astype(str)
    if "created_at" in df.columns:
        df["created_at_dt"] = pd.to_datetime(df["created_at"], errors="coerce")
        df = df.sort_values(["ticket_id","created_at_dt"], kind="stable")
    return df

@st.cache_resource(show_spinner=False)
def make_client() -> OpenAI:
    return OpenAI(api_key=_get_api_key_from_secrets())

client = make_client()



def read_messages_csv(file_bytes: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(file_bytes))
    if "ticket_id" not in df.columns or "content" not in df.columns:
        raise ValueError("El CSV debe contener las columnas: 'ticket_id' y 'content'.")
    if "created_at" in df.columns:
        df["created_at_dt"] = pd.to_datetime(df["created_at"], errors="coerce")
        df = df.sort_values(["ticket_id","created_at_dt"], kind="stable")
    df["content"] = df["content"].fillna("").astype(str)
    df["ticket_id"] = df["ticket_id"].astype(str)
    return df

def group_ticket_text(df: pd.DataFrame) -> Dict[str, str]:
    return df.groupby("ticket_id")["content"].apply(lambda s: " ".join(s.tolist())).to_dict()

def _safe_regex_list(lst):
    out=[]
    for pat in lst:
        try:
            re.compile(pat)
            out.append(pat)
        except re.error:
            pass
    return out

def merge_llm_config(base_cfg: Dict[str, Any], llm_cfg: Dict[str, Any]) -> Dict[str, Any]:
    merged = {
        "intent_patterns": dict(base_cfg.get("intent_patterns", {})),
        "intent_to_tool": dict(base_cfg.get("intent_to_tool", {})),
        "effort_defaults": dict(base_cfg.get("effort_defaults", {})),
        "tool_sketch": dict(base_cfg.get("tool_sketch", {})),
    }
    for k, v in (llm_cfg.get("intent_patterns") or {}).items():
        if isinstance(k, str) and isinstance(v, list):
            cleaned = _safe_regex_list([str(x) for x in v])
            if cleaned:
                merged["intent_patterns"][k] = cleaned
    for k, v in (llm_cfg.get("intent_to_tool") or {}).items():
        if isinstance(k, str) and isinstance(v, str) and v.strip():
            merged["intent_to_tool"][k] = v.strip()
    for k, v in (llm_cfg.get("effort_defaults") or {}).items():
        try:
            iv = int(v)
            if iv in (1,2,3):
                merged["effort_defaults"][k] = iv
        except Exception:
            pass
    for tool_name, meta in (llm_cfg.get("tool_sketch") or {}).items():
        if not isinstance(tool_name, str) or not isinstance(meta, dict):
            continue
        pitch = str(meta.get("pitch","")).strip()
        endpoints = meta.get("endpoints") or []
        endpoints = [str(x) for x in endpoints if isinstance(x, (str,int,float))]
        merged["tool_sketch"][tool_name] = {"pitch": pitch, "endpoints": endpoints}
    return merged

def _default_base_cfg():
    return {
        "intent_patterns": {
            "offer_24h": [r"\boferta\b.*24", r"\boffer\b.*24"],
            "status_eval": [r"evaluaci[oó]n mec[aá]nica", r"estado.*(eval|inspecci[oó]n)", r"status.*(eval|inspect)"],
            "payment_status": [r"\bpago(s)?\b", r"transferencia", r"dep[oó]sit"],
            "reschedule_inspection": [r"reprogram(ar|aci[oó]n).*(inspecci[oó]n|visita)", r"cambi(ar|o).*cita", r"reagendar"],
            "credit_prequal": [r"cr[eé]dito", r"tasa(s)?", r"financ", r"pre.?aprobaci[oó]n"],
            "warranty_claim": [r"garant[ií]a", r"falla el[eé]ctrica", r"cobertura"],
            "kyc_docs": [r"document(o|os|aci[oó]n)", r"\bKYC\b", r"identificaci[oó]n", r"comprobante"],
            "appointment": [r"\bcita\b", r"agendar", r"programar"],
            "tradein": [r"tomar.*a.*cuenta", r"trade-?in", r"cambio.*auto"],
            "refund": [r"reembolso", r"devoluci[oó]n"],
            "delivery_tracking": [r"entrega", r"rastreo", r"tracking", r"fecha.*entrega"],
            "price_negotiation": [r"mejorar.*precio", r"negociar", r"descuento"],
        },
        "intent_to_tool": {
            "offer_24h": "OfferIn24 Orchestrator",
            "status_eval": "Inspection/Workshop Status Tracker",
            "payment_status": "Payout Status Tracker",
            "reschedule_inspection": "Inspection Re-Scheduler",
            "credit_prequal": "Credit Pre-Qualification Simulator",
            "warranty_claim": "Warranty Coverage Checker",
            "kyc_docs": "Doc & KYC Collector",
            "appointment": "Scheduling Assistant",
            "tradein": "Trade-in Estimator",
            "refund": "Refund Request Wizard",
            "delivery_tracking": "Vehicle Delivery Tracker",
            "price_negotiation": "Smart Offer/Counteroffer Assistant",
        },
        "effort_defaults": {
            "offer_24h":3, "status_eval":2, "payment_status":2, "reschedule_inspection":1,
            "credit_prequal":3, "warranty_claim":3, "kyc_docs":1, "appointment":1,
            "tradein":2, "refund":2, "delivery_tracking":2, "price_negotiation":2
        },
        "tool_sketch": {
            "OfferIn24 Orchestrator": {
                "pitch": "Orquesta tasación <24h: fotos, docs, agenda inspección y oferta final.",
                "endpoints": [
                    "POST /offers/rapid-intake {vehicle, owner_id, photos[]} -> intake_id",
                    "POST /offers/{intake_id}/schedule-inspection {slot_id} -> inspection_id",
                    "GET  /offers/{intake_id}/status -> {stage, eta_hours}",
                    "POST /offers/{intake_id}/finalize -> {offer_amount, validity}"
                ]
            },
            "Inspection/Workshop Status Tracker": {
                "pitch": "Consulta estado de evaluación con ETA y próximos pasos.",
                "endpoints": [
                    "GET /inspections/{vin|ticket_id}/status -> {stage, eta_hours, findings}",
                    "POST /inspections/{id}/notify {channel, template_id}"
                ]
            },
            "Payout Status Tracker": {
                "pitch": "Transparencia del pago con hitos y evidencia bancaria.",
                "endpoints": [
                    "GET /payouts/{ticket_id}/status -> {stage, bank_ref, eta_hours}",
                    "POST /payouts/{ticket_id}/upload-proof {file}"
                ]
            }
        }
    }

def build_llm_update_payload(sample_texts: List[str], base_cfg: Dict[str, Any]) -> Dict[str, Any]:
    examples = []
    for t in random.sample(sample_texts, k=min(12, len(sample_texts))):
        examples.append(t[:800])
    return {
        "examples": examples,
        "current_config": base_cfg,
        "return_schema": {
            "type":"object",
            "required":["intent_patterns","intent_to_tool","effort_defaults","tool_sketch","prompt_patch","code_patches"],
            "properties":{
                "intent_patterns":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}},
                "intent_to_tool":{"type":"object","additionalProperties":{"type":"string"}},
                "effort_defaults":{"type":"object","additionalProperties":{"type":"integer"}},
                "tool_sketch":{"type":"object","additionalProperties":{
                    "type":"object",
                    "properties":{"pitch":{"type":"string"},"endpoints":{"type":"array","items":{"type":"string"}}}
                }},
                "prompt_patch":{"type":"object","properties":{
                    "system_patch":{"type":"string"},
                    "user_patch":{"type":"string"},
                    "rationale":{"type":"string"}
                }},
                "code_patches":{"type":"array","items":{
                    "type":"object","properties":{
                        "title":{"type":"string"},
                        "patch":{"type":"string"},
                        "impact":{"type":"string"},
                        "risk":{"type":"string"}
                    }
                }}
            }
        },
        "instructions":"Devuelve SOLO JSON; no uses markdown ni fences."
    }

def llm_update_config(ticket_text: Dict[str,str], base_cfg: Dict[str,Any]) -> Dict[str,Any]:
    sys = (
        "Eres un arquitecto de conversación y producto para Kavak. "
        "Analizas conversaciones reales y propones: (1) patrones de intención (regex), "
        "(2) mapeo intención→herramienta, (3) esfuerzo 1..3, (4) bosquejos de herramientas "
        "(pitch + endpoints), y (5) parches de prompts y (6) sugerencias de cambios de código. "
        "Debes devolver SOLO JSON válido con el esquema solicitado."
    )
    sample_texts = list(ticket_text.values())
    if not sample_texts:
        return {
            "intent_patterns": base_cfg["intent_patterns"],
            "intent_to_tool": base_cfg["intent_to_tool"],
            "effort_defaults": base_cfg["effort_defaults"],
            "tool_sketch": base_cfg["tool_sketch"],
            "prompt_patch": {
                "system_patch": "Eres un agente de Kavak. Mantén claridad, empatía y cumplimiento (KYC/garantía/crédito).",
                "user_patch": "Contexto: {contexto}. Tono: {tono}. Idioma: {idioma}. Canal: {canal}.",
                "rationale": "Sin datos, se mantienen defaults."
            },
            "code_patches": []
        }
    user_payload = build_llm_update_payload(sample_texts, base_cfg)
    resp = client.chat.completions.create(
        model=MODEL,
        response_format={"type":"json_object"},
        messages=[
            {"role":"system","content":sys},
            {"role":"user","content":json.dumps(user_payload, ensure_ascii=False)}
        ]
    )
    raw = (resp.choices[0].message.content or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        lines = raw.splitlines()
        if lines and lines[0].lower().startswith("json"):
            raw = "\n".join(lines[1:])
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {}

    merged = merge_llm_config(base_cfg, data)
    prompt_patch = data.get("prompt_patch") or {}
    if not prompt_patch:
        prompt_patch = {
            "system_patch": "Eres un agente de Kavak. Mantén claridad, empatía y cumplimiento (KYC/garantía/crédito).",
            "user_patch": "Contexto: {contexto}. Tono: {tono}. Idioma: {idioma}. Canal: {canal}.",
            "rationale": "Fallback: LLM no devolvió patch."
        }
    code_patches = data.get("code_patches") or []
    return {**merged, "prompt_patch": prompt_patch, "code_patches": code_patches}

def detect_intents_with_cfg(text: str, intent_patterns: Dict[str, List[str]]) -> List[str]:
    intents=set()
    for k, pats in intent_patterns.items():
        for p in pats:
            if re.search(p, text, re.IGNORECASE):
                intents.add(k); break
    return sorted(intents)

def rank_tools(ticket_text: Dict[str,str], cfg: Dict[str,Any]) -> pd.DataFrame:
    from collections import defaultdict, Counter
    stats = defaultdict(lambda: {"count":0, "tickets":set(), "examples":Counter()})
    for tid, txt in ticket_text.items():
        intents = detect_intents_with_cfg(txt, cfg["intent_patterns"])
        for it in intents:
            stats[it]["count"] += 1
            stats[it]["tickets"].add(tid)
            snippet = " ".join(txt.split()[:12])
            if snippet:
                stats[it]["examples"][snippet] += 1

    rows=[]
    total = len(ticket_text) or 1
    for it, s in stats.items():
        if s["count"] == 0: 
            continue
        coverage = s["count"]/total
        effort = int(cfg["effort_defaults"].get(it, 2))
        score = 0.7*coverage + 0.3*(1.0/max(1, effort))
        rows.append({
            "intent": it,
            "tool_name": cfg["intent_to_tool"].get(it, f"Tool:{it}"),
            "tickets": len(s["tickets"]),
            "coverage": round(coverage,4),
            "effort_est_1_3": effort,
            "score": round(score,4),
            "example_snippet": (s["examples"].most_common(1)[0][0] if s["examples"] else "")
        })
    df = pd.DataFrame(rows).sort_values(["score","coverage"], ascending=False).reset_index(drop=True)
    return df

def build_tool_proposals(df_rank: pd.DataFrame, cfg: Dict[str,Any], top_k=8) -> List[Dict[str,Any]]:
    tools=[]
    for _, row in df_rank.head(top_k).iterrows():
        name = row["tool_name"]
        sketch = cfg["tool_sketch"].get(name, {"pitch":"", "endpoints":[]})
        tools.append({
            "tool_name": name,
            "intent": row["intent"],
            "tickets": int(row["tickets"]),
            "coverage": float(row["coverage"]),
            "effort_est_1_3": int(row["effort_est_1_3"]),
            "score": float(row["score"]),
            "pitch": sketch.get("pitch",""),
            "api_endpoints": sketch.get("endpoints",[]),
        })
    return tools

def to_download_button(label: str, data_bytes: bytes, file_name: str, mime: str = "application/octet-stream"):
    st.download_button(label, data=data_bytes, file_name=file_name, mime=mime, use_container_width=True)

# ---------------------- UI -------------------------
st.title("Kavak Tooling Proposals")
st.caption("Fuente: DB o CSV → LLM actualiza intents/tools/prompts/código → revisa, edita y descarga.")

with st.sidebar:
    st.subheader("⚙️ Modelo")
    st.text_input("Modelo (fijo)", value=MODEL, disabled=True)
    st.info("Keys desde st.secrets (OpenAI y DATABASE_URL).", icon="🔐")
    source = st.radio("Fuente de datos", ["Base de datos", "CSV"], horizontal=True)
    st.divider()
    if source == "Base de datos":
        st.markdown("**Filtros (opcional):**")
        status = st.selectbox("Status", ["(todos)","open","in_progress","resolved","closed"], index=0)
        category = st.text_input("Category (ej. buying/ask/credit/...)", value="")
        col_s, col_u = st.columns(2)
        with col_s:
            since = st.text_input("Desde (YYYY-MM-DD)", value="")
        with col_u:
            until = st.text_input("Hasta (YYYY-MM-DD)", value="")
        limit_tickets = st.number_input("Máx. tickets", min_value=50, max_value=5000, value=500, step=50)

uploaded = None
if source == "CSV":
    uploaded = st.file_uploader("Sube el CSV de mensajes (columns: ticket_id, content[, created_at])", type=["csv"])

# Estado
if "state" not in st.session_state:
    st.session_state.state = {
        "df": None,
        "ticket_text": {},
        "cfg": _default_base_cfg(),
        "updated": None,
        "rank_df": pd.DataFrame(),
        "tools": [],
        "prompt_patch": {"system_patch":"", "user_patch":"", "rationale":""},
        "code_patches": []
    }

# Carga de datos
if source == "CSV" and uploaded:
    try:
        df = read_messages_csv(uploaded.getvalue())
        st.session_state.state["df"] = df
        st.session_state.state["ticket_text"] = group_ticket_text(df)
        st.success(f"CSV cargado: {len(df)} mensajes • {len(st.session_state.state['ticket_text'])} tickets")
        st.dataframe(df.head(20), use_container_width=True)
    except Exception as e:
        st.error(f"Error leyendo CSV: {e}")

if source == "Base de datos":
    if st.button("Cargar desde DB", type="primary"):
        try:
            st.info("Consultando base de datos…")
            filt_status = None if 'status' not in locals() or status == "(todos)" else status
            filt_category = None if 'category' not in locals() or not category.strip() else category.strip()
            filt_since = None if 'since' not in locals() or not since.strip() else since.strip()
            filt_until = None if 'until' not in locals() or not until.strip() else until.strip()
            lim = limit_tickets if 'limit_tickets' in locals() else 500

            df = fetch_messages_df(
                status=filt_status,
                category=filt_category,
                since=filt_since,
                until=filt_until,
                limit_tickets=lim,
            )
            if df.empty:
                st.warning("No se encontraron mensajes con los filtros seleccionados.")
            else:
                st.session_state.state["df"] = df
                st.session_state.state["ticket_text"] = group_ticket_text(df)
                st.success(f"DB cargada: {len(df)} mensajes • {len(st.session_state.state['ticket_text'])} tickets")
                st.dataframe(df.head(20), use_container_width=True)
        except Exception as e:
            st.error(f"Error consultando DB: {e}")

#with st.sidebar:
#    st.subheader("⚙️ Modelo")
#    st.text_input("Modelo (fijo)", value=MODEL, disabled=True)
#    st.info("La API key se lee desde st.secrets", icon="🔐")

uploaded = st.file_uploader("Sube el CSV de mensajes (columns: ticket_id, content[, created_at])", type=["csv"])

if "state" not in st.session_state:
    st.session_state.state = {
        "df": None,
        "ticket_text": {},
        "cfg": _default_base_cfg(),
        "updated": None,
        "rank_df": pd.DataFrame(),
        "tools": [],
        "prompt_patch": {"system_patch":"", "user_patch":"", "rationale":""},
        "code_patches": []
    }

if uploaded:
    try:
        df = read_messages_csv(uploaded.getvalue())
        st.session_state.state["df"] = df
        st.session_state.state["ticket_text"] = group_ticket_text(df)
        st.success(f"CSV cargado: {len(df)} mensajes • {len(st.session_state.state['ticket_text'])} tickets")
        st.dataframe(df.head(20), use_container_width=True)
    except Exception as e:
        st.error(f"Error leyendo CSV: {e}")

st.markdown("---")
colA, colB = st.columns([1,1])
with colA:
    st.subheader("🔁 1) Actualizar config con el LLM")
    st.caption("El LLM propone nuevos intents/tools/efforts/tool-sketch y parches de prompts/código.")
with colB:
    st.write("")

do_run = st.button("Analizar y Proponer", type="primary", disabled=st.session_state.state["df"] is None)
if do_run:
    with st.spinner("Consultando LLM y construyendo ranking..."):
        base_cfg = st.session_state.state["cfg"]
        ticket_text = st.session_state.state["ticket_text"]
        updated = llm_update_config(ticket_text, base_cfg)
        rank_df = rank_tools(ticket_text, updated)
        tools = build_tool_proposals(rank_df, updated, top_k=8)
        st.session_state.state["updated"] = updated
        st.session_state.state["rank_df"] = rank_df
        st.session_state.state["tools"] = tools
        st.session_state.state["prompt_patch"] = updated.get("prompt_patch", {})
        st.session_state.state["code_patches"] = updated.get("code_patches", [])
    st.success("Propuestas listas.")

if st.session_state.state["updated"]:
    upd = st.session_state.state["updated"]

    st.subheader("📊 Ranking de Herramientas")
    st.dataframe(st.session_state.state["rank_df"], use_container_width=True)
    csv_buf = io.StringIO()
    st.session_state.state["rank_df"].to_csv(csv_buf, index=False)
    to_download_button("Descargar ranking (CSV)", csv_buf.getvalue().encode("utf-8"), "intent_tool_ranking.csv", "text/csv")

    st.markdown("---")
    st.subheader("🧰 Propuestas de Herramientas")
    for t in st.session_state.state["tools"]:
        with st.expander(f"{t['tool_name']}  •  intent: {t['intent']}  •  score: {t['score']:.3f}  •  coverage: {t['coverage']:.2%}"):
            st.markdown(f"**Pitch:** {t['pitch'] or '_(sin pitch)_' }")
            st.markdown("**Endpoints sugeridos:**")
            if t["api_endpoints"]:
                st.code("\n".join([str(x) for x in t["api_endpoints"]]), language="text")
            else:
                st.write("_(sin endpoints)_")

    st.markdown("---")
    st.subheader("📝 Parches de Prompts (editables)")
    pp = st.session_state.state["prompt_patch"]
    sys_patch = st.text_area("System patch", value=pp.get("system_patch",""), height=160)
    usr_patch = st.text_area("User patch", value=pp.get("user_patch",""), height=180, help="Placeholders: {contexto}, {tono}, {idioma}, {canal}")
    rationale = st.text_area("Rationale", value=pp.get("rationale",""), height=100)
    if st.button("Guardar parches de prompts"):
        st.session_state.state["prompt_patch"] = {"system_patch": sys_patch, "user_patch": usr_patch, "rationale": rationale}
        st.success("Parches de prompts actualizados en memoria.")

    pp_bytes = json.dumps(st.session_state.state["prompt_patch"], ensure_ascii=False, indent=2).encode("utf-8")
    to_download_button("Descargar prompt_patch.json", pp_bytes, "prompt_patch.json", "application/json")

    st.markdown("---")
    st.subheader("💡 Sugerencias de Cambios de Código")
    cps = st.session_state.state["code_patches"]
    if not cps:
        st.info("El LLM no propuso cambios de código (o fueron filtrados).")
    for i, ch in enumerate(cps, start=1):
        with st.expander(f"{i}. {ch.get('title','(sin título)')}"):
            if ch.get("patch"):
                st.code(ch["patch"], language="diff")
            st.markdown(f"**Impacto:** {ch.get('impact','')}")
            st.markdown(f"**Riesgo:** {ch.get('risk','')}")

    cp_bytes = json.dumps(cps, ensure_ascii=False, indent=2).encode("utf-8")
    to_download_button("Descargar code_patches.json", cp_bytes, "code_patches.json", "application/json")

st.markdown("---")
st.caption("© Kavak — Tooling Proposals Workbench (Streamlit) · Modelo fijo: gpt-5-nano-2025-08-07 · Secrets via st.secrets")