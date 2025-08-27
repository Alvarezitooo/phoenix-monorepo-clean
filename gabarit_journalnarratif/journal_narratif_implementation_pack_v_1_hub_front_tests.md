# 🌙 Journal Narratif — Implementation Pack v1

> **Objectif :** livrer tout le nécessaire (specs + code prêt à copier) pour que *Claude Code* implémente rapidement le **Journal Narratif** : endpoints Hub (FastAPI), schémas, logique d'agrégation minimale, preview d'énergie, squelette React (Phoenix Website), et tests API.

---

## 0) Arborescence suggérée (monorepo)
```
phoenix-monorepo/
├─ apps/
│  ├─ phoenix-backend-unified/
│  │  ├─ api/routes/journal.py
│  │  ├─ core/narrative_analyzer.py
│  │  ├─ core/energy_preview.py
│  │  ├─ models/journal_dto.py
│  │  ├─ schemas/insights_v2.schema.json
│  │  ├─ schemas/playbook_v1.schema.json
│  │  └─ tests/test_journal_api.py
│  └─ phoenix-website/
│     ├─ app/journal/page.tsx
│     └─ components/journal/
│        ├─ NarrativeProgress.tsx
│        ├─ ChaptersTimeline.tsx
│        ├─ NextSteps.tsx
│        ├─ SocialProofBanner.tsx
│        └─ EthicalAnchor.tsx
└─ ... (existants)
```

---

## 1) OpenAPI (extrait) — nouveaux endpoints

```yaml
openapi: 3.0.3
info:
  title: Phoenix Luna Hub — Journal API
  version: 1.0.0
paths:
  /luna/journal/{user_id}:
    get:
      summary: Aggregated JournalDTO for the Narrative Journal screen
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: user_id
          required: true
          schema: { type: string, format: uuid }
        - in: query
          name: window
          required: false
          schema: { type: string, enum: ["7d","14d","90d"], default: "14d" }
      responses:
        '200':
          description: Journal data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JournalDTO'
  /luna/energy/preview:
    post:
      summary: Preview energy cost and post-action balance for a given action
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EnergyPreviewRequest'
      responses:
        '200':
          description: Energy preview result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EnergyPreviewResponse'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    JournalDTO:
      type: object
      properties:
        user: { $ref: '#/components/schemas/JournalUser' }
        energy: { $ref: '#/components/schemas/JournalEnergy' }
        narrative: { $ref: '#/components/schemas/JournalNarrative' }
        social_proof: { $ref: '#/components/schemas/JournalSocialProof' }
        ethics: { $ref: '#/components/schemas/JournalEthics' }
      required: [user, energy, narrative, ethics]
    JournalUser:
      type: object
      properties:
        id: { type: string, format: uuid }
        first_name: { type: string }
        plan: { type: string, enum: ["standard","unlimited"] }
    JournalEnergy:
      type: object
      properties:
        balance_pct: { type: number }
        last_purchase: { type: string, format: date-time, nullable: true }
    JournalNarrative:
      type: object
      properties:
        chapters:
          type: array
          items:
            type: object
            properties:
              id: { type: string, format: uuid }
              type: { type: string, enum: ["cv","letter","analysis","milestone","other"] }
              title: { type: string }
              gain: { type: array, items: { type: string } }
              ts: { type: string, format: date-time }
        kpis:
          type: object
          properties:
            ats_mean:
              type: object
              properties:
                value: { type: number }
                target: { type: number }
                trend: { type: string, enum: ["up","down","flat"] }
                delta_pct_14d: { type: number }
            letters_count:
              type: object
              properties:
                value: { type: number }
        last_doubt: { type: string, nullable: true }
        next_steps:
          type: array
          items:
            type: object
            properties:
              action: { type: string }
              cost_pct: { type: number }
              expected_gain: { type: string }
    JournalSocialProof:
      type: object
      properties:
        peers_percentage_recommended_step: { type: number }
        recommended_label: { type: string }
    JournalEthics:
      type: object
      properties:
        ownership: { type: boolean }
        export_available: { type: boolean }
    EnergyPreviewRequest:
      type: object
      properties:
        user_id: { type: string, format: uuid }
        action: { type: string }
      required: [user_id, action]
    EnergyPreviewResponse:
      type: object
      properties:
        action: { type: string }
        cost_pct: { type: number }
        balance_before: { type: number }
        balance_after: { type: number }
```

---

## 2) Pydantic models — `models/journal_dto.py`
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class JournalUser(BaseModel):
    id: str
    first_name: str
    plan: Literal["standard", "unlimited"]

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
    letters_count: Optional[dict] = None

class JournalChapter(BaseModel):
    id: str
    type: Literal["cv","letter","analysis","milestone","other"]
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

class EnergyPreviewRequest(BaseModel):
    user_id: str
    action: str

class EnergyPreviewResponse(BaseModel):
    action: str
    cost_pct: float
    balance_before: float
    balance_after: float
```

---

## 3) Energy preview — `core/energy_preview.py`
```python
from .energy_manager import EnergyManager  # existant dans le Hub

# Grille minimale (doit correspondre à la grille officielle côté Hub)
ENERGY_GRID = {
    # simples 5-10
    "conseil_rapide": 5,
    "correction_ponctuelle": 5,
    "format_lettre": 8,
    # moyennes 10-20
    "lettre_motivation": 15,
    "optimisation_cv": 12,
    "analyse_offre": 10,
    # complexes 20-40
    "analyse_cv_complete": 25,
    "mirror_match": 30,
    "strategie_candidature": 35,
    # premium 35-50
    "audit_complet_profil": 45,
    "plan_reconversion": 50,
    "simulation_entretien": 40,
}

class EnergyPreviewService:
    def __init__(self, energy_manager: EnergyManager):
        self.em = energy_manager

    def preview(self, user_id: str, action: str):
        cost = float(ENERGY_GRID.get(action, 10))  # défaut conservateur 10
        status = self.em.get_status(user_id)  # doit retourner balance_pct, plan
        before = float(status.balance_pct)
        if status.plan == "unlimited":
            return {
                "action": action,
                "cost_pct": 0.0,
                "balance_before": before,
                "balance_after": before,
            }
        after = max(0.0, before - cost)
        return {
            "action": action,
            "cost_pct": cost,
            "balance_before": before,
            "balance_after": after,
        }
```

---

## 4) Narrative analyzer (v1 minimal) — `core/narrative_analyzer.py`
```python
from dataclasses import dataclass
from typing import List, Dict, Any

# TODO: brancher le client Supabase/DB interne du Hub

@dataclass
class Event:
    type: str
    ts: str
    data: Dict[str, Any]
    app: str | None = None

class NarrativeAnalyzer:
    def __init__(self, events_repo):
        self.repo = events_repo

    def _load_events(self, user_id: str, window: str = "14d") -> List[Event]:
        return self.repo.fetch_user_events(user_id=user_id, window=window)

    def compute_kpis(self, events: List[Event]):
        cv_scores = [e.data.get("ats_score") for e in events if e.type == "CVGenerated" and e.data.get("ats_score") is not None]
        if not cv_scores:
            return {
                "ats_mean": {
                    "value": 0,
                    "target": 85,
                    "trend": "flat",
                    "delta_pct_14d": 0,
                },
                "letters_count": {"value": 0},
            }
        mean_now = sum(cv_scores[-5:]) / min(5, len(cv_scores))
        mean_prev = sum(cv_scores[:-5]) / max(1, len(cv_scores[:-5])) if len(cv_scores) > 5 else mean_now
        delta_pct = 0 if mean_prev == 0 else ((mean_now - mean_prev) / mean_prev) * 100
        trend = "up" if mean_now > mean_prev else ("down" if mean_now < mean_prev else "flat")
        letters_count = len([e for e in events if e.type == "LetterGenerated"])
        return {
            "ats_mean": {
                "value": round(mean_now, 2),
                "target": 85,
                "trend": trend,
                "delta_pct_14d": round(delta_pct, 2),
            },
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
            }.get(e.type, e.type)
            gain = []
            if e.type == "CVGenerated" and (ats := e.data.get("ats_score")):
                gain.append(f"ATS {ats}")
            chapters.append({
                "id": e.data.get("id", e.ts),
                "type": "cv" if e.type == "CVGenerated" else "other",
                "title": title,
                "gain": gain,
                "ts": e.ts,
            })
        return chapters

    def build_journal(self, user, energy, social_proof, events: List[Event]):
        kpis = self.compute_kpis(events)
        journal = {
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
        return journal
```

---

## 5) Router FastAPI — `api/routes/journal.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from ..deps import security_guardian, get_energy_manager, get_events_repo, get_user_profile
from ...core.narrative_analyzer import NarrativeAnalyzer
from ...core.energy_preview import EnergyPreviewService
from ...models.journal_dto import (
    JournalDTO, EnergyPreviewRequest, EnergyPreviewResponse
)

router = APIRouter(prefix="/luna", tags=["journal"])

@router.get("/journal/{user_id}", response_model=JournalDTO)
async def get_journal(user_id: str, window: str = "14d",
                     _: dict = Depends(security_guardian),
                     energy_manager = Depends(get_energy_manager),
                     events_repo = Depends(get_events_repo)):
    # user profile & energy status from Hub services
    user = get_user_profile(user_id)
    status = energy_manager.get_status(user_id)
    energy = {"balance_pct": status.balance_pct, "last_purchase": status.last_purchase}

    events = events_repo.fetch_user_events(user_id=user_id, window=window)
    analyzer = NarrativeAnalyzer(events_repo)
    journal = analyzer.build_journal(
        user={"id": user_id, "first_name": user.first_name, "plan": status.plan},
        energy=energy,
        social_proof={"peers_percentage_recommended_step": 0.9, "recommended_label": "LinkedIn Power Moves"},
        events=events,
    )
    return JournalDTO(**journal)

@router.post("/energy/preview", response_model=EnergyPreviewResponse)
async def energy_preview(payload: EnergyPreviewRequest,
                         _: dict = Depends(security_guardian),
                         energy_manager = Depends(get_energy_manager)):
    svc = EnergyPreviewService(energy_manager)
    result = svc.preview(user_id=payload.user_id, action=payload.action)
    return EnergyPreviewResponse(**result)
```

> **Note** : `deps.security_guardian` et les providers `get_energy_manager`, `get_events_repo`, `get_user_profile` doivent déjà exister/être conformes à la base du Hub. Sinon, créer des stubs qui déléguent aux services existants.

---

## 6) Tests API (pytest) — `tests/test_journal_api.py`
```python
from fastapi.testclient import TestClient
from phoenix_backend_unified.main import app

client = TestClient(app)

def test_energy_preview_requires_auth():
    r = client.post("/luna/energy/preview", json={"user_id":"u1","action":"optimisation_cv"})
    assert r.status_code in (401, 403)

# Exemple happy path avec header d'auth simulé
AUTH = {"Authorization": "Bearer testtoken"}

def test_energy_preview_happy():
    r = client.post("/luna/energy/preview", headers=AUTH,
                    json={"user_id": "11111111-1111-1111-1111-111111111111", "action": "optimisation_cv"})
    assert r.status_code == 200
    data = r.json()
    assert data["action"] == "optimisation_cv"
    assert "balance_before" in data

def test_journal_get():
    r = client.get("/luna/journal/11111111-1111-1111-1111-111111111111?window=14d", headers=AUTH)
    assert r.status_code == 200
    j = r.json()
    assert "user" in j and "narrative" in j and "energy" in j
    assert "chapters" in j["narrative"]
```

---

## 7) JSON Schemas (pour validation interne) — `schemas/insights_v2.schema.json`
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://phoenix.luna/schemas/insights_v2.json",
  "title": "Insights v2",
  "type": "object",
  "properties": {
    "meta": {"type": "object"},
    "progression": {"type": "object"},
    "comportement": {"type": "object"},
    "narratif": {"type": "object"},
    "energy": {"type": "object"},
    "rationale": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["progression","comportement","narratif","energy"]
}
```

### `schemas/playbook_v1.schema.json`
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://phoenix.luna/schemas/playbook_v1.json",
  "title": "Playbook v1",
  "type": "object",
  "properties": {
    "tone": {"type": "string"},
    "opening": {"type": "string"},
    "cta": {"type": "array", "items": {"type": "object"}},
    "micro_copy": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["tone","cta"]
}
```

---

## 8) Frontend (Next.js + Tailwind) — `app/journal/page.tsx`
```tsx
'use client';
import { useEffect, useState } from 'react';
import NarrativeProgress from '@/components/journal/NarrativeProgress';
import ChaptersTimeline from '@/components/journal/ChaptersTimeline';
import NextSteps from '@/components/journal/NextSteps';
import SocialProofBanner from '@/components/journal/SocialProofBanner';
import EthicalAnchor from '@/components/journal/EthicalAnchor';

export default function JournalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_LUNA_HUB_URL + '/luna/journal/ME?window=14d', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('jwt') }
        });
        if (!res.ok) throw new Error('Failed to load');
        setData(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Chargement du Journal…</div>;
  if (!data) return <div className="p-6">Erreur de chargement.</div>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Bonjour {data.user.first_name}, prêt à écrire la suite ? 🌙</h1>
        <div className="text-sm opacity-80">Énergie : {Math.round(data.energy.balance_pct)}%</div>
      </header>

      <NarrativeProgress kpis={data.narrative.kpis} />
      <ChaptersTimeline chapters={data.narrative.chapters} />
      <NextSteps steps={data.narrative.next_steps} />
      {data.social_proof && <SocialProofBanner proof={data.social_proof} />}
      <EthicalAnchor />
    </main>
  );
}
```

### `components/journal/NarrativeProgress.tsx`
```tsx
export default function NarrativeProgress({ kpis }: { kpis: any }) {
  const v = kpis.ats_mean;
  const pct = Math.min(100, (v.value / v.target) * 100);
  return (
    <section className="p-4 rounded-2xl shadow bg-white">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Capital narratif — Score ATS moyen</h2>
        <span className="text-sm opacity-70">Objectif {v.target}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded mt-3">
        <div className="h-3 rounded" style={{ width: pct + '%' }} />
      </div>
      <p className="text-sm mt-2">Actuel {v.value} · {v.trend === 'up' ? '+ ' : ''}{v.delta_pct_14d}% / 14j</p>
    </section>
  );
}
```

### `components/journal/ChaptersTimeline.tsx`
```tsx
export default function ChaptersTimeline({ chapters }: { chapters: any[] }) {
  return (
    <section className="p-4 rounded-2xl shadow bg-white">
      <h2 className="font-medium mb-3">Chapitres</h2>
      <ul className="space-y-2">
        {chapters.map((c) => (
          <li key={c.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{c.title}</div>
              <div className="text-sm opacity-70">{c.gain?.join(' · ')}</div>
            </div>
            <div className="text-xs opacity-60">{new Date(c.ts).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### `components/journal/NextSteps.tsx`
```tsx
export default function NextSteps({ steps }: { steps: any[] }) {
  async function preview(action: string) {
    const res = await fetch(process.env.NEXT_PUBLIC_LUNA_HUB_URL + '/luna/energy/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('jwt')
      },
      body: JSON.stringify({ user_id: 'ME', action })
    });
    const data = await res.json();
    alert(`Action ${action}\nCoût: ${data.cost_pct}%\nAprès: ${Math.round(data.balance_after)}%`);
  }

  return (
    <section className="p-4 rounded-2xl shadow bg-white">
      <h2 className="font-medium mb-3">Prochaine étape</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {steps.map((s) => (
          <button key={s.action} onClick={() => preview(s.action)} className="p-3 rounded-xl border hover:shadow">
            <div className="font-medium">{s.action}</div>
            <div className="text-sm opacity-70">Coût estimé {s.cost_pct}% · Gain attendu {s.expected_gain}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
```

### `components/journal/SocialProofBanner.tsx`
```tsx
export default function SocialProofBanner({ proof }: { proof: any }) {
  return (
    <section className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
      <p className="text-sm">
        {Math.round(proof.peers_percentage_recommended_step * 100)}% des utilisateurs comme toi ont exploré
        <span className="font-medium"> {proof.recommended_label}</span>
      </p>
    </section>
  );
}
```

### `components/journal/EthicalAnchor.tsx`
```tsx
export default function EthicalAnchor() {
  return (
    <section className="p-4 rounded-2xl bg-gray-50 border">
      <p className="text-sm">🌙 Ton histoire est sauvegardée. Elle t’appartient. Export possible à tout moment.</p>
      <button className="mt-2 px-3 py-2 rounded-lg border">Exporter mon récit</button>
    </section>
  );
}
```

---

## 9) cURL / Quick Tests
```bash
# Journal agrégé (remplacer TOKEN & USER_ID)
curl -H "Authorization: Bearer TOKEN" \
  "https://<luna-hub>/luna/journal/USER_ID?window=14d" | jq

# Preview énergie
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","action":"optimisation_cv"}' \
  https://<luna-hub>/luna/energy/preview | jq
```

---

## 10) Check-list d’intégration
- [ ] Brancher `events_repo.fetch_user_events` sur Supabase (ou repo interne).
- [ ] Déléguer `get_energy_manager().get_status()` au module énergie existant.
- [ ] Mettre `ME` → user_id réel côté front (depuis JWT profil).
- [ ] Protéger les routes avec `security_guardian` + CORS prod.
- [ ] Ajouter logs structurés pour `JournalRequested`, `EnergyPreviewRequested`.

---

**Fin du pack v1 — prêt pour itérations.**

