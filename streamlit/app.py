# streamlit_app.py
# ============================================================
# Kavak Agentic Workbench (Streamlit) - Secrets via st.secrets
# - Modelo fijo: gpt-5-nano-2025-08-07
# - API Key desde .streamlit/secrets.toml (openai_kavak_secret o OPENAI_API_KEY)
# ============================================================

import os, io, json, re, uuid, time, math, random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

import streamlit as st
import pandas as pd
from dotenv import load_dotenv  # opcional si también usas .env
from openai import OpenAI

# ---------------- Boot & Config ----------------
st.set_page_config(page_title="Kavak Agentic Workbench", layout="wide")
load_dotenv()  # no estorba si además usas secrets

MODEL = "gpt-5-nano-2025-08-07"  # 🔒 fijo

def _get_api_key_from_secrets() -> str:
    """
    Intenta leer las claves desde st.secrets con estas prioridades:
      1) st.secrets["openai_kavak_secret"]
      2) st.secrets["OPENAI_API_KEY"]
    Si no existen, intenta variables de entorno como último recurso.
    """
    # 1) Streamlit secrets
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

    # 2) Env fallback (opcional)
    env_key = os.getenv("openai_kavak_secret") or os.getenv("OPENAI_API_KEY")
    if env_key:
        return env_key

    raise RuntimeError(
        "No se encontró API key. Agrega openai_kavak_secret o OPENAI_API_KEY en .streamlit/secrets.toml"
    )

@st.cache_resource(show_spinner=False)
def make_openai_client() -> OpenAI:
    api_key = _get_api_key_from_secrets()
    return OpenAI(api_key=api_key)

client = make_openai_client()

# ---------------- UI Sidebar (sin modelo editable) ----------------
st.sidebar.header("⚙️ Configuración")
st.sidebar.text_input("Modelo (fijo)", value=MODEL, disabled=True, help="Bloqueado por requerimiento")
per_context = st.sidebar.slider("Conversaciones a regenerar por contexto", 1, 10, 3)
max_workers = st.sidebar.slider("Paralelismo (threads)", 1, 16, 6)
max_attempts = st.sidebar.slider("Reintentos por conversación", 1, 8, 4)
temperature = st.sidebar.slider("Temperature", 0.0, 1.5, 0.8, 0.1)

st.sidebar.subheader("🎯 Objetivos evaluación")
target_csat = st.sidebar.slider("Target CSAT", 1.0, 5.0, 4.5, 0.1)
target_max_turns = st.sidebar.slider("Máx turnos objetivo", 2, 12, 6)
target_latency = st.sidebar.slider("Latencia objetivo (seg.)", 10, 600, 120)

st.sidebar.subheader("📊 Pesos métricas")
w_csat  = st.sidebar.slider("Peso CSAT", 0.0, 1.0, 0.35, 0.05)
w_res   = st.sidebar.slider("Peso Resolution Rate", 0.0, 1.0, 0.35, 0.05)
w_turns = st.sidebar.slider("Peso Eficiencia (turnos)", 0.0, 1.0, 0.15, 0.05)
w_lat   = st.sidebar.slider("Peso Latencia", 0.0, 1.0, 0.15, 0.05)

# ---------------- Globals ----------------
CONTEXTS = ['buying', 'ask', 'feedback', 'service', 'credit', 'warranty']
TONOS    = ["amable", "empático", "formal", "resolutivo", "apologético", "directo", "entusiasta"]
CANALES  = ["whatsapp", "webchat", "email", "telefono"]
IDIOMAS  = ["es", "es", "es", "es", "en"]

# --------- Session State ---------
if "baseline_convs" not in st.session_state: st.session_state.baseline_convs = []
if "analysis_df" not in st.session_state:    st.session_state.analysis_df = pd.DataFrame()
if "llm_suggestions" not in st.session_state:st.session_state.llm_suggestions = {}
if "applied_prompts" not in st.session_state:st.session_state.applied_prompts = {"system_patch": "", "user_patch": ""}
if "proposed_convs" not in st.session_state: st.session_state.proposed_convs = []

# ---------------- Helpers ----------------
def read_jsonl_bytes(file_bytes: bytes) -> List[Dict[str, Any]]:
    rows = []
    for raw in file_bytes.decode("utf-8", errors="ignore").splitlines():
        line = raw.strip()
        if not line: continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            try:
                line2 = re.sub(r",\s*}", "}", line)
                line2 = re.sub(r",\s*]", "]", line2)
                rows.append(json.loads(line2))
            except Exception:
                pass
    return rows

def save_bytes_download(name: str, content: bytes, mime="text/plain"):
    st.download_button(label=f"Descargar {name}", data=content, file_name=name, mime=mime, use_container_width=True)

def dataset_metrics(convs: List[Dict[str, Any]]):
    n = len(convs)
    if n==0:
        return {"total":0,"resolution_rate":0.0,"avg_csat":None,"avg_turns":0.0,"avg_duration_sec":0.0}
    resolved = sum(1 for c in convs if (c.get("meta",{}) or {}).get("resolved", False))
    csat_vals, turns, durs = [], [], []
    for c in convs:
        outc = c.get("outcomes", {}) or {}
        v = outc.get("csat_estimated_1_5")
        try:
            if v is not None: csat_vals.append(float(v))
        except: pass
        turns.append(len(c.get("transcript",[]) or []))
        durs.append((c.get("meta",{}) or {}).get("duration_sec",0) or 0)
    return {
        "total": n,
        "resolution_rate": round(resolved/n,3),
        "avg_csat": round(sum(csat_vals)/len(csat_vals),3) if csat_vals else None,
        "avg_turns": round(sum(turns)/len(turns),2),
        "avg_duration_sec": round(sum(durs)/len(durs),1),
    }

# --------- Intents & ranking ----------
INTENT_PATTERNS = {
    "offer_24h": [r"oferta.*24", r"offer.*24"],
    "status_eval": [r"evaluaci[oó]n mec[aá]nica", r"status.*(eval|inspection)", r"estado.*inspecci[oó]n"],
    "payment_status": [r"pago(s)?", r"transferencia", r"deposit(o|ó)"],
    "reschedule_inspection": [r"reprogram(ar|aci[oó]n).*(inspecci[oó]n|visita)", r"cambiar.*cita"],
    "credit_prequal": [r"cr[eé]dito", r"tasa(s)?", r"financ(i|)amiento", r"pre(-| )?aprobaci[oó]n"],
    "warranty_claim": [r"garant[ií]a", r"falla el[eé]ctrica"],
    "kyc_docs": [r"document(o|os|aci[oó]n)", r"KYC", r"identificaci[oó]n", r"comprobante"],
    "appointment": [r"(cita|agendar|programar)"],
}
EFFORT_TABLE = {
    "offer_24h": 3, "status_eval": 2, "payment_status": 2, "reschedule_inspection": 1,
    "credit_prequal": 3, "warranty_claim": 3, "kyc_docs": 1, "appointment": 1,
}
INTENT_TO_TOOL = {
    "offer_24h": "OfferIn24 Orchestrator",
    "status_eval": "Inspection/Workshop Status Tracker",
    "payment_status": "Payout Status Tracker",
    "reschedule_inspection": "Inspection Re-Scheduler",
    "credit_prequal": "Credit Pre-Qualification Simulator",
    "warranty_claim": "Warranty Coverage Checker",
    "kyc_docs": "Doc & KYC Collector",
    "appointment": "Scheduling Assistant",
}

def detect_intents(text: str) -> List[str]:
    intents = set()
    for intent, pats in INTENT_PATTERNS.items():
        for p in pats:
            if re.search(p, text, re.IGNORECASE):
                intents.add(intent); break
    return sorted(intents)

def conv_metrics(conv: Dict[str, Any]) -> Dict[str, Any]:
    meta = conv.get("meta", {}) or {}
    outc = conv.get("outcomes", {}) or {}
    resolved = bool(meta.get("resolved", False))
    csat = outc.get("csat_estimated_1_5")
    try:
        csat = float(csat) if csat is not None else None
    except:
        csat = None
    return {"resolved": resolved, "csat": csat}

def build_ranking(convs: List[Dict[str, Any]]) -> pd.DataFrame:
    from collections import defaultdict, Counter
    stats = defaultdict(lambda: {"count":0, "unresolved":0, "csat_sum":0.0, "csat_n":0, "contexts":Counter()})
    for c in convs:
        transcript = c.get("transcript", []) or []
        blocks = [(t.get("text") or "").lower() for t in transcript if (t.get("text") or "").strip()]
        text = " ".join(blocks)
        intents = detect_intents(text)
        metr = conv_metrics(c)
        ctx = (c.get("meta", {}) or {}).get("context", "unknown").lower()
        for it in intents:
            s = stats[it]
            s["count"] += 1; s["contexts"][ctx] += 1
            if not metr["resolved"]: s["unresolved"] += 1
            if metr["csat"] is not None:
                s["csat_sum"] += metr["csat"]; s["csat_n"] += 1

    rows=[]
    for it, s in stats.items():
        if s["count"]==0: continue
        freq = s["count"]
        unr = s["unresolved"]/max(1, s["count"])
        avg_csat = (s["csat_sum"]/s["csat_n"]) if s["csat_n"]>0 else None
        csat_gap = (target_csat - avg_csat) if avg_csat is not None else 0.5
        effort = EFFORT_TABLE.get(it, 3); eff_inv = 1.0/effort
        tool = INTENT_TO_TOOL.get(it, f"Tool for {it}")
        rows.append({
            "intent": it, "tool_name": tool, "frequency": freq,
            "unresolved_rate": unr, "avg_csat": avg_csat, "csat_gap": csat_gap,
            "effort_est": effort, "effort_inverse": eff_inv,
            "top_contexts": ", ".join([f"{k}:{v}" for k,v in s["contexts"].most_common(3)])
        })
    df = pd.DataFrame(rows)
    if df.empty: return df

    def norm(s):
        s = s.astype(float)
        if s.nunique()==1: return pd.Series([0.5]*len(s), index=s.index)
        mn, mx = s.min(), s.max()
        return (s-mn)/(mx-mn) if mx!=mn else (s - mn)

    df["frequency_norm"]=norm(df["frequency"])
    df["unresolved_norm"]=norm(df["unresolved_rate"])
    df["csat_gap_norm"]=norm(df["csat_gap"])
    df["effort_inv_norm"]=norm(df["effort_inverse"])

    df["score"] = (
        0.35*df["frequency_norm"] +
        0.30*df["unresolved_norm"] +
        0.20*df["csat_gap_norm"] +
        0.15*df["effort_inv_norm"]
    )
    return df.sort_values("score", ascending=False)

# --------- LLM: propuestas (prompts/código/tools) ----------
def build_llm_payload(convs: List[Dict[str, Any]]) -> str:
    m = dataset_metrics(convs)
    def csat_of(c):
        try:
            v=(c.get("outcomes",{}) or {}).get("csat_estimated_1_5")
            return float(v) if v is not None else 999
        except: return 999
    worst = sorted([c for c in convs if (c.get("outcomes",{}) or {}).get("csat_estimated_1_5") is not None], key=csat_of)[:8]
    unresolved = [c for c in convs if not (c.get("meta",{}) or {}).get("resolved", True)][:8]
    long_turns = sorted(convs, key=lambda c: len(c.get("transcript",[]) or []), reverse=True)[:6]

    def compact(c):
        tr = (c.get("transcript",[]) or [])
        ex = tr[:3] if len(tr)>3 else tr
        return {
            "conversation_id": (c.get("meta",{}) or {}).get("conversation_id",""),
            "context": (c.get("meta",{}) or {}).get("context",""),
            "resolved": (c.get("meta",{}) or {}).get("resolved", False),
            "csat": (c.get("outcomes",{}) or {}).get("csat_estimated_1_5"),
            "turns": len(tr),
            "duration_sec": (c.get("meta",{}) or {}).get("duration_sec", 0),
            "excerpt": [{"speaker": t.get("speaker"), "text": t.get("text")} for t in ex]
        }

    schema = {
        "type": "object",
        "required": ["prompt_changes", "code_changes", "tools", "evaluation_plan", "risks"],
        "properties": {
            "prompt_changes": {"type":"object","required":["system_patch","user_patch","rationale"],
                               "properties":{"system_patch":{"type":"string"},"user_patch":{"type":"string"},"rationale":{"type":"string"}}},
            "code_changes": {"type":"array","items":{"type":"object","required":["title","patch","impact","risk"],
                               "properties":{"title":{"type":"string"},"patch":{"type":"string"},"impact":{"type":"string"},"risk":{"type":"string"}}}},
            "tools": {"type":"array","items":{"type":"object","required":["name","why","api_sketch","effort_1_3"],
                               "properties":{"name":{"type":"string"},"why":{"type":"string"},"api_sketch":{"type":"string"},"effort_1_3":{"type":"integer"}}}},
            "evaluation_plan": {"type":"object","required":["metrics","offline_protocol","online_protocol","success_criteria"],
                               "properties":{"metrics":{"type":"array","items":{"type":"string"}},
                                             "offline_protocol":{"type":"string"},
                                             "online_protocol":{"type":"string"},
                                             "success_criteria":{"type":"string"}}},
            "risks":{"type":"array","items":{"type":"string"}}
        }
    }

    payload = {
        "current_aggregates": m,
        "samples": {
            "worst_csat": [compact(x) for x in worst],
            "unresolved": [compact(x) for x in unresolved],
            "long_turns": [compact(x) for x in long_turns],
        },
        "targets": {
            "target_csat": target_csat,
            "max_turns": target_max_turns,
            "latency_secs_max": target_latency,
            "weights": {"csat": w_csat, "resolution_rate": w_res, "turns_efficiency": w_turns, "latency": w_lat},
        },
        "schema": schema,
        "instructions": "Devuelve SOLO JSON que cumpla el esquema. Cambios concretos en PROMPT (system/user) y CÓDIGO (patches)."
    }
    return json.dumps(payload, ensure_ascii=False)

def ask_llm_for_suggestions(convs: List[Dict[str, Any]]) -> Dict[str, Any]:
    sys = ("Eres un arquitecto de conversación y plataforma para Kavak. "
           "Analizas registros de soporte/ventas y propones mejoras en prompt y código. "
           "Cumple KYC/garantías/crédito. Responde SOLO JSON válido.")
    user = build_llm_payload(convs)
    resp = client.chat.completions.create(
        model=MODEL, 
        #temperature=0.7, 
        response_format={"type":"json_object"},
        messages=[{"role":"system","content":sys},{"role":"user","content":user}]
    )
    content = (resp.choices[0].message.content or "").strip()
    if content.startswith("```"):
        content=content.strip("`"); lines=content.splitlines()
        if lines and lines[0].lower().startswith("json"):
            content="\n".join(lines[1:])
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error":"Invalid JSON from model","raw":content}

# --------- Prompts & Generator ----------
def default_system_prompt():
    return ("Eres un generador de conversaciones realistas de atención a clientes para Kavak. "
            "Prioriza claridad, empatía y cumplimiento. No inventes datos sensibles. "
            "Mantén diálogos breves y creíbles, en el idioma indicado.")

def default_user_prompt(contexto, tono, idioma, canal):
    return f"""
Crea una conversación breve entre **agente de Kavak** y **cliente**.
- contexto: {contexto}
- tono: {tono}
- idioma: {"español" if idioma=="es" else "inglés"}
- canal: {canal}

Requisitos:
1) Primer turno del **cliente**.
2) Cumple políticas (documentos, inspección, pagos, garantías, crédito, KYC si aplica).
3) Si no se resuelve, deja claro el siguiente paso (ticket, escalar, cita, docs).
4) Respuestas concisas, naturales (no robóticas).
5) Devuelve **solo un JSON** con claves: meta, transcript, outcomes.
""".strip()

class PromptProvider:
    def __init__(self, sys_patch: str|None=None, user_patch: str|None=None):
        self.sys = (sys_patch or "").strip()
        self.userp = (user_patch or "").strip()

    def system(self) -> str:
        return self.sys or default_system_prompt()

    def user(self, contexto, tono, idioma, canal) -> str:
        if self.userp:
            return self.userp.format(
                contexto=contexto, tono=tono,
                idioma=("español" if idioma=="es" else "inglés"),
                canal=canal
            )
        return default_user_prompt(contexto, tono, idioma, canal)

def ensure_defaults(data: Dict[str, Any], contexto: str, canal: str, tono: str, idioma: str) -> Dict[str, Any]:
    data.setdefault("meta",{}); data.setdefault("transcript",[]); data.setdefault("outcomes",{})
    meta=data["meta"]; tx=data["transcript"]; outc=data["outcomes"]
    meta.setdefault("conversation_id", str(uuid.uuid4()))
    meta["company"]="Kavak"; meta["context"]=contexto
    meta["channel"]=meta.get("channel") or canal
    meta["tone"]=meta.get("tone") or tono
    meta["language"]=meta.get("language") or idioma
    meta.setdefault("customer_issue",""); meta.setdefault("customer_goal",""); meta.setdefault("agent_goal","")
    meta.setdefault("resolved", True); meta.setdefault("num_interactions",0); meta.setdefault("duration_sec",0)

    t0 = datetime.utcnow()
    if not tx:
        tx.extend([
            {"turn":1,"speaker":"cliente","text":"Hola, ¿me pueden apoyar?","timestamp":""},
            {"turn":2,"speaker":"agente","text":"Con gusto, ¿puedes compartirme el folio o placas?","timestamp":""}
        ])
    for i,t in enumerate(tx):
        t["turn"]=i+1
        if t.get("speaker") not in ("cliente","agente"):
            t["speaker"]="cliente" if i%2==0 else "agente"
        t["text"]=t.get("text") or ""
        t["timestamp"]=t.get("timestamp") or (t0+timedelta(seconds=5*i)).isoformat()+"Z"

    meta["num_interactions"]=len(tx)
    est=max((len(tx)-1)*5,45)
    try: given=int(meta.get("duration_sec") or 0)
    except: given=0
    meta["duration_sec"]=max(given, est)

    outc.setdefault("csat_estimated_1_5", 3)
    outc.setdefault("next_action","")
    outc.setdefault("followup_needed", not bool(meta.get("resolved", True)))
    outc.setdefault("summary","")
    return data

def generate_one_conversation(contexto: str, prompts: PromptProvider, seed=None) -> Dict[str, Any]:
    random.seed(seed or random.randint(1,10_000))
    tono=random.choice(TONOS); canal=random.choice(CANALES); idioma=random.choice(IDIOMAS)
    up = prompts.user(contexto, tono, idioma, canal)
    resp = client.chat.completions.create(
        model=MODEL, 
        #temperature=temperature, 
        # response_format={"type":"json_object"},
        messages=[{"role":"system","content":prompts.system()},
                  {"role":"user","content":up}]
    )
    content = (resp.choices[0].message.content or "").strip()
    if content.startswith("```"):
        content=content.strip("`"); lines=content.splitlines()
        if lines and lines[0].lower().startswith("json"):
            content="\n".join(lines[1:])
    try:
        data=json.loads(content)
    except json.JSONDecodeError:
        data={"meta":{},"transcript":[],"outcomes":{}}
    return ensure_defaults(data, contexto, canal, tono, idioma)

def stqdm(iterator, total, desc=""):
    prog = st.progress(0, text=desc)
    for i, item in enumerate(iterator, start=1):
        prog.progress(min(i/total,1.0), text=f"{desc} ({i}/{total})")
        yield item
    prog.empty()

def generate_dataset_parallel(contexts, prompts, per_context=2, seed=123, max_workers=6, max_attempts=4):
    random.seed(seed)
    tasks=[(c, random.randint(1,10_000)) for c in contexts for _ in range(per_context)]
    out=[]
    def task(c,s):
        attempt=0
        while True:
            try:
                return generate_one_conversation(c, prompts, seed=s)
            except Exception as e:
                attempt+=1
                if attempt>=max_attempts:
                    raise
                time.sleep(1.0 + attempt*0.5 + random.random()*0.3)
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futs={ex.submit(task, c, s):(c,s) for (c,s) in tasks}
        for fut in stqdm(as_completed(futs), total=len(futs), desc="Generando"):
            try: out.append(fut.result())
            except Exception as e: st.warning(f"Falló {futs[fut]}: {e}")
    return out

# ---------------------- UI ----------------------
st.title("Kavak Agentic Workbench")
st.caption("Sube conversaciones, recibe propuestas del LLM, apruébalas y evalúa. (Modelo fijo: gpt-5-nano-2025-08-07)")

uploaded = st.file_uploader("Sube el JSONL de conversaciones", type=["jsonl"])
if uploaded:
    st.session_state.baseline_convs = read_jsonl_bytes(uploaded.getvalue())
    st.success(f"Leídas {len(st.session_state.baseline_convs)} conversaciones.")

if st.session_state.baseline_convs:
    mb = dataset_metrics(st.session_state.baseline_convs)
    c1,c2,c3,c4,c5 = st.columns(5)
    c1.metric("Conversaciones", mb["total"])
    c2.metric("Resolution rate", mb["resolution_rate"])
    c3.metric("Avg CSAT", mb["avg_csat"])
    c4.metric("Avg turns", mb["avg_turns"])
    c5.metric("Avg duración (s)", mb["avg_duration_sec"])

    # Ranking
    st.subheader("🔎 Intents & ranking de herramientas")
    df_rank = build_ranking(st.session_state.baseline_convs)
    st.session_state.analysis_df = df_rank
    if df_rank.empty:
        st.info("No se detectaron intents con los patrones actuales. Ajusta INTENT_PATTERNS.")
    else:
        st.dataframe(df_rank, use_container_width=True)
        buf = io.StringIO(); df_rank.to_csv(buf, index=False)
        save_bytes_download("candidate_tools_ranked.csv", buf.getvalue().encode("utf-8"), "text/csv")

st.markdown("---")
st.subheader("🤖 Propuestas del LLM (prompts, código y tools)")

if st.button("Generar propuestas con LLM", use_container_width=True, type="primary", disabled=not st.session_state.baseline_convs):
    with st.spinner("Consultando LLM..."):
        st.session_state.llm_suggestions = ask_llm_for_suggestions(st.session_state.baseline_convs)
    st.success("Propuestas generadas.")

if st.session_state.llm_suggestions:
    sug = st.session_state.llm_suggestions
    if "error" in sug:
        st.error("El modelo no devolvió JSON válido. Reintenta.")
    else:
        tabs = st.tabs(["Prompt changes", "Code changes", "Proposed tools", "Evaluation Plan", "Riesgos"])
        with tabs[0]:
            pc = sug.get("prompt_changes", {})
            sys_txt = st.text_area("**System patch (editable):**", value=pc.get("system_patch",""), height=160)
            usr_txt = st.text_area("**User patch (editable):**", value=pc.get("user_patch",""), height=220,
                                   help="Placeholders: {contexto}, {tono}, {idioma}, {canal}")
            st.write("**Rationale:**")
            st.write(pc.get("rationale",""))
            if st.button("✅ Aprobar estos prompts", use_container_width=True):
                st.session_state.applied_prompts = {"system_patch": sys_txt, "user_patch": usr_txt}
                st.success("Prompts aprobados.")

        with tabs[1]:
            for i,ch in enumerate(sug.get("code_changes", []), start=1):
                with st.expander(f"{i}. {ch.get('title')}"):
                    st.code(ch.get("patch",""), language="text")
                    st.markdown(f"**Impact:** {ch.get('impact','')}")
                    st.markdown(f"**Risk:** {ch.get('risk','')}")

        with tabs[2]:
            for i,t in enumerate(sug.get("tools", []), start=1):
                with st.expander(f"{i}. {t.get('name')} (Effort {t.get('effort_1_3')})"):
                    st.write(t.get("why",""))
                    st.code(t.get("api_sketch",""), language="text")

        with tabs[3]:
            ep = sug.get("evaluation_plan", {})
            st.markdown("**Metrics:** " + ", ".join(ep.get("metrics", [])))
            st.markdown("**Offline:**")
            st.code(ep.get("offline_protocol",""), language="text")
            st.markdown("**Online:**")
            st.code(ep.get("online_protocol",""), language="text")
            st.markdown("**Success criteria:**")
            st.write(ep.get("success_criteria",""))

        with tabs[4]:
            for r in sug.get("risks", []):
                st.write("- " + r)

        raw_json = json.dumps(st.session_state.llm_suggestions, ensure_ascii=False, indent=2)
        save_bytes_download("llm_rewrite_response.json", raw_json.encode("utf-8"), "application/json")

st.markdown("---")
st.subheader("🧪 Aplicar prompts aprobados y evaluar")

can_generate = bool(st.session_state.applied_prompts["system_patch"] or st.session_state.applied_prompts["user_patch"])
if st.button("Regenerar dataset con prompts aprobados", use_container_width=True, type="primary", disabled=not (st.session_state.baseline_convs and can_generate)):
    prompts = PromptProvider(sys_patch=st.session_state.applied_prompts["system_patch"],
                             user_patch=st.session_state.applied_prompts["user_patch"])
    with st.spinner("Generando conversaciones propuestas..."):
        proposed = generate_dataset_parallel(
            CONTEXTS, prompts,
            per_context=per_context, seed=123,
            max_workers=max_workers, max_attempts=max_attempts
        )
        st.session_state.proposed_convs = proposed
    st.success(f"Generadas {len(st.session_state.proposed_convs)} conversaciones propuestas.")

if st.session_state.baseline_convs and st.session_state.proposed_convs:
    st.markdown("### 📈 Comparativo")
    mb = dataset_metrics(st.session_state.baseline_convs)
    mp = dataset_metrics(st.session_state.proposed_convs)

    c1,c2 = st.columns(2)
    with c1:
        st.markdown("**Baseline**"); st.json(mb)
    with c2:
        st.markdown("**Proposed**"); st.json(mp)

    def dstr(a,b):
        if a is None or b is None: return "n/a"
        d = b - a
        sym = "▲" if d>0 else ("▼" if d<0 else "＝")
        return f"{b} ({sym} {d:+.3f})" if isinstance(b,float) else f"{b} ({sym} {d})"

    st.markdown("**Deltas (Proposed - Baseline)**")
    st.write({
        "resolution_rate": dstr(mb["resolution_rate"], mp["resolution_rate"]),
        "avg_csat": dstr(mb["avg_csat"], mp["avg_csat"]),
        "avg_turns": dstr(mb["avg_turns"], mp["avg_turns"]),
        "avg_duration_sec": dstr(mb["avg_duration_sec"], mp["avg_duration_sec"]),
    })

    # Descargas
    def to_jsonl(convs):
        buf = io.StringIO()
        for r in convs: buf.write(json.dumps(r, ensure_ascii=False)+"\n")
        return buf.getvalue().encode("utf-8")

    save_bytes_download("baseline_conversations.jsonl", to_jsonl(st.session_state.baseline_convs), "application/jsonl")
    save_bytes_download("proposed_conversations.jsonl", to_jsonl(st.session_state.proposed_convs), "application/jsonl")

    def meta_rows(convs):
        rows=[]
        for r in convs:
            meta=r.get("meta",{}); outc=r.get("outcomes",{})
            rows.append({
                "conversation_id": meta.get("conversation_id",""),
                "context": meta.get("context",""),
                "resolved": meta.get("resolved", True),
                "num_interactions": meta.get("num_interactions",0),
                "duration_sec": meta.get("duration_sec",0),
                "csat_estimated_1_5": outc.get("csat_estimated_1_5"),
                "summary": outc.get("summary",""),
            })
        return pd.DataFrame(rows)

    base_csv = io.StringIO(); meta_rows(st.session_state.baseline_convs).to_csv(base_csv, index=False)
    prop_csv = io.StringIO(); meta_rows(st.session_state.proposed_convs).to_csv(prop_csv, index=False)
    save_bytes_download("baseline_meta.csv", base_csv.getvalue().encode("utf-8"), "text/csv")
    save_bytes_download("proposed_meta.csv", prop_csv.getvalue().encode("utf-8"), "text/csv")

st.markdown("---")
st.caption("© Kavak — Agentic CX Workbench (Secrets via st.secrets, Modelo fijo: gpt-5-nano-2025-08-07)")