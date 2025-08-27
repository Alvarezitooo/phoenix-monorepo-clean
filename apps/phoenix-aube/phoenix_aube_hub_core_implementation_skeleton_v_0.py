# Phoenix Aube — Hub Core Implementation Skeleton (v0)
# Monorepo excerpt — primary Hub architecture, minimal runnable skeleton
# Principle guards: Hub Roi • Zéro logique front • API contrat • Event‑sourcing • Sécurité par défaut
# ─────────────────────────────────────────────────────────────────────────────
# HOW TO RUN (dev)
#   uvicorn apps.phoenix_backend_unified.main:app --reload --port 8003
# HEALTH
#   GET http://localhost:8003/monitoring/health
# JOURNAL (stub)
#   GET http://localhost:8003/luna/journal/11111111-1111-1111-1111-111111111111

# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/main.py
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.phoenix_backend_unified.api.routes import journal as journal_routes
from apps.phoenix_backend_unified.api.routes import aube as aube_routes

app = FastAPI(title="Phoenix Luna Hub", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(journal_routes.router)
app.include_router(aube_routes.router)

@app.get("/monitoring/health", tags=["monitoring"])  # minimal health
async def health():
    return {"status": "ok", "app": app.title, "version": app.version}


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/api/deps.py
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional

from apps.phoenix_backend_unified.core.event_store import InMemoryEventStore
from apps.phoenix_backend_unified.core.energy_manager import EnergyManager
from apps.phoenix_backend_unified.core.llm_gateway import LLMGateway, GeminiProvider

_security = HTTPBearer(auto_error=False)
_event_store_singleton = InMemoryEventStore()  # DEV-only; replace by DB-backed repo in prod
_energy_singleton = EnergyManager()
_llm_singleton: Optional[LLMGateway] = GeminiProvider()

async def security_guardian(creds: HTTPAuthorizationCredentials = Depends(_security)):
    if creds is None or not creds.credentials:
        # In DEV we allow missing token for convenience if ENV says so.
        # Raise in prod.
        # raise HTTPException(status_code=401, detail="Unauthorized")
        return {"dev": True}
    # TODO: verify JWT, issuer, audience, expiry
    return {"sub": "dev-user", "scope": "user"}

async def get_events_repo():
    return _event_store_singleton

async def get_energy_manager():
    return _energy_singleton

async def get_llm_gateway():
    return _llm_singleton


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/core/event_store.py
# ─────────────────────────────────────────────────────────────────────────────
from dataclasses import dataclass
from typing import Any, Dict, List
from datetime import datetime, timedelta

@dataclass
class Event:
    type: str
    user_id: str
    ts: str
    data: Dict[str, Any]

class InMemoryEventStore:
    """DEV-only event store; replace with Supabase/DB adapter in prod.
    Guarantees append-only semantics in memory.
    """
    def __init__(self) -> None:
        self._events: List[Event] = []

    def insert_event(self, evt: Dict[str, Any]) -> Event:
        event = Event(
            type=evt["type"],
            user_id=evt["user_id"],
            ts=evt.get("ts") or datetime.utcnow().isoformat() + "Z",
            data=evt.get("data", {}),
        )
        self._events.append(event)
        return event

    def fetch_user_events(self, user_id: str, window: str = "14d") -> List[Event]:
        now = datetime.utcnow()
        delta = timedelta(days=int(window.replace("d", ""))) if window.endswith("d") else timedelta(days=14)
        since = now - delta
        return [e for e in self._events if e.user_id == user_id and _parse_iso(e.ts) >= since]


def _parse_iso(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return datetime.utcnow()


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/core/energy_manager.py
# ─────────────────────────────────────────────────────────────────────────────
from dataclasses import dataclass

@dataclass
class EnergyStatus:
    plan: str = "standard"  # or "unlimited"
    balance_pct: float = 100.0
    last_purchase: str | None = None

class EnergyManager:
    """Minimal energy manager for DEV. Replace with real grid+ledger in prod."""
    def __init__(self):
        self._status_by_user: dict[str, EnergyStatus] = {}

    def get_status(self, user_id: str) -> EnergyStatus:
        return self._status_by_user.setdefault(user_id, EnergyStatus())

    def can_perform(self, user_id: str, action: str, cost_pct: float) -> bool:
        st = self.get_status(user_id)
        return st.plan == "unlimited" or st.balance_pct >= cost_pct

    def consume(self, user_id: str, action: str, cost_pct: float) -> EnergyStatus:
        st = self.get_status(user_id)
        if st.plan == "unlimited":
            return st
        st.balance_pct = max(0.0, st.balance_pct - cost_pct)
        return st


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/core/llm_gateway.py
# ─────────────────────────────────────────────────────────────────────────────
from abc import ABC, abstractmethod
from typing import Any, Dict

class LLMGateway(ABC):
    @abstractmethod
    def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str:
        ...

class GeminiProvider(LLMGateway):
    def __init__(self, model: str = "gemini-pro") -> None:
        self.model = model
        # TODO: wire official SDK/HTTP client via settings

    def generate(self, *, system: str, user: str, context: Dict[str, Any]) -> str:
        # DEV stub — returns a deterministic echo for wiring tests
        return f"[Luna(Gemini stub)]: {user}\n(context keys: {list(context.keys())})"


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/models/journal_dto.py
# ─────────────────────────────────────────────────────────────────────────────
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any

class JournalUser(BaseModel):
    id: str
    first_name: str = "Phoenix"
    plan: Literal["standard", "unlimited"] = "standard"

class JournalEnergy(BaseModel):
    balance_pct: float
    last_purchase: Optional[str] = None

class JournalKpiAts(BaseModel):
    value: float
    target: float
    trend: Literal["up","down","flat"]
    delta_pct_14d: float

class JournalKPIs(BaseModel):
    ats_mean: JournalKpiAts
    letters_count: Optional[Dict[str, Any]] = None

class JournalChapter(BaseModel):
    id: str
    type: Literal["cv","letter","analysis","milestone","other"] = "other"
    title: str
    gain: List[str] = []
    ts: str

class JournalNextStep(BaseModel):
    action: str
    cost_pct: float
    expected_gain: str

class JournalNarrative(BaseModel):
    chapters: List[JournalChapter] = []
    kpis: JournalKPIs
    last_doubt: Optional[str] = None
    next_steps: List[JournalNextStep] = []

class JournalSocialProof(BaseModel):
    peers_percentage_recommended_step: float = 0.0
    recommended_label: Optional[str] = None

class JournalEthics(BaseModel):
    ownership: bool = True
    export_available: bool = True

class JournalDTO(BaseModel):
    user: JournalUser
    energy: JournalEnergy
    narrative: JournalNarrative
    social_proof: Optional[JournalSocialProof] = None
    ethics: JournalEthics


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/core/narrative_analyzer.py
# ─────────────────────────────────────────────────────────────────────────────
from typing import List, Dict, Any
from apps.phoenix_backend_unified.core.event_store import Event

class NarrativeAnalyzer:
    def __init__(self, events_repo):
        self.repo = events_repo

    def compute_kpis(self, events: List[Event]):
        cv_scores = [e.data.get("ats_score") for e in events if e.type == "CVGenerated" and e.data.get("ats_score") is not None]
        if not cv_scores:
            return {
                "ats_mean": {"value": 0, "target": 85, "trend": "flat", "delta_pct_14d": 0},
                "letters_count": {"value": 0},
            }
        mean_now = sum(cv_scores[-5:]) / min(5, len(cv_scores))
        mean_prev = sum(cv_scores[:-5]) / max(1, len(cv_scores[:-5])) if len(cv_scores) > 5 else mean_now
        delta_pct = 0 if mean_prev == 0 else ((mean_now - mean_prev) / mean_prev) * 100
        trend = "up" if mean_now > mean_prev else ("down" if mean_now < mean_prev else "flat")
        letters_count = len([e for e in events if e.type == "LetterGenerated"])
        return {
            "ats_mean": {"value": round(mean_now, 2), "target": 85, "trend": trend, "delta_pct_14d": round(delta_pct, 2)},
            "letters_count": {"value": letters_count},
        }

    def last_doubt(self, events: List[Event]):
        for e in reversed(events):
            if e.type == "UserDoubtExpressed":
                return e.data.get("topic")
        return None

    def next_steps(self, kpis) -> list[dict]:
        steps = []
        ats = kpis["ats_mean"]["value"]
        if ats < 85:
            steps.append({"action": "optimisation_cv", "cost_pct": 12, "expected_gain": "ATS +3"})
        steps.append({"action": "mirror_match", "cost_pct": 30, "expected_gain": "Compatibilité +8"})
        return steps

    def chapters(self, events: List[Event]):
        chapters = []
        for e in events[-12:]:
            title = {
                "CVGenerated": "CV optimisé",
                "LetterGenerated": "Lettre rédigée",
                "EnergyPurchased": "Énergie rechargée",
                "MilestoneReached": "Palier atteint",
                "AubeAssessmentStarted": "Aube — exploration lancée",
                "AubeRecommendationsGenerated": "Aube — pistes proposées",
                "AubeFutureProofScored": "Aube — pérennité évaluée",
            }.get(e.type, e.type)
            gain = []
            if e.type == "CVGenerated" and (ats := e.data.get("ats_score")):
                gain.append(f"ATS {ats}")
            chapters.append({
                "id": e.data.get("id", e.ts),
                "type": "analysis" if e.type.startswith("Aube") else ("cv" if e.type == "CVGenerated" else "other"),
                "title": title,
                "gain": gain,
                "ts": e.ts,
            })
        return chapters

    def build_journal(self, user, energy, social_proof, events: List[Event]):
        kpis = self.compute_kpis(events)
        return {
            "user": user,
            "energy": energy,
            "narrative": {
                "chapters": self.chapters(events),
                "kpis": kpis,
                "last_doubt": self.last_doubt(events),
                "next_steps": self.next_steps(kpis),
            },
            "social_proof": social_proof,
            "ethics": {"ownership": True, "export_available": True},
        }


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/api/routes/journal.py
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends
from apps.phoenix_backend_unified.api.deps import security_guardian, get_energy_manager, get_events_repo
from apps.phoenix_backend_unified.core.narrative_analyzer import NarrativeAnalyzer
from apps.phoenix_backend_unified.models.journal_dto import JournalDTO

router = APIRouter(prefix="/luna", tags=["journal"])

@router.get("/journal/{user_id}", response_model=JournalDTO)
async def get_journal(user_id: str, window: str = "14d",
                     _: dict = Depends(security_guardian),
                     energy_manager = Depends(get_energy_manager),
                     events_repo = Depends(get_events_repo)):
    # Mock user & energy for dev
    status = energy_manager.get_status(user_id)
    user = {"id": user_id, "first_name": "Phoenix", "plan": status.plan}
    energy = {"balance_pct": status.balance_pct, "last_purchase": status.last_purchase}

    events = events_repo.fetch_user_events(user_id=user_id, window=window)

    # Seed a few Aube events in DEV for visibility (idempotent-ish)
    if not any(e.type.startswith("Aube") for e in events):
        events_repo.insert_event({"type": "AubeAssessmentStarted", "user_id": user_id, "data": {}})
        events_repo.insert_event({"type": "AubeRecommendationsGenerated", "user_id": user_id, "data": {"jobs": ["UXD","PO"]}})

    analyzer = NarrativeAnalyzer(events_repo)
    journal = analyzer.build_journal(
        user=user,
        energy=energy,
        social_proof={"peers_percentage_recommended_step": 0.9, "recommended_label": "LinkedIn Power Moves"},
        events=events_repo.fetch_user_events(user_id=user_id, window=window),
    )
    return JournalDTO(**journal)


# ─────────────────────────────────────────────────────────────────────────────
# File: apps/phoenix_backend_unified/api/routes/aube.py
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from apps.phoenix_backend_unified.api.deps import security_guardian, get_events_repo, get_energy_manager

router = APIRouter(prefix="/aube", tags=["aube"])

@router.post("/assessment/start")
async def aube_assessment_start(payload: dict,
                                _: dict = Depends(security_guardian),
                                events=Depends(get_events_repo),
                                energy=Depends(get_energy_manager)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    if not energy.can_perform(user_id, action="assessment.start", cost_pct=0):
        raise HTTPException(status_code=402, detail="Insufficient energy")
    events.insert_event({"type": "AubeAssessmentStarted", "user_id": user_id, "data": {"mode": "UL"}})
    return {"assessment_id": "dev-aid", "user_id": user_id, "status": "in_progress"}

