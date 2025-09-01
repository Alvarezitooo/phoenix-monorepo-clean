# 🔮 Phoenix Aube — Full Templates Pack (Claude‑ready)

> **But** : fournir à *Claude Code* tous les gabarits nécessaires (copier/coller) pour implémenter **Aube** dans l’écosystème Phoenix : Hub (backend), Front (website), DevOps/CI. Zéro logique métier côté front. Aligné *Hub Roi · API contrat · Event‑sourcing · Sécurité*.

---

## 0) Monorepo & Commandes de base

```
phoenix-monorepo/
├─ apps/
│  ├─ phoenix-backend-unified/
│  │  ├─ main.py
│  │  ├─ api/
│  │  │  ├─ deps.py
│  │  │  └─ routes/
│  │  │     ├─ aube.py
│  │  │     └─ journal.py
│  │  ├─ core/
│  │  │  ├─ event_store.py
│  │  │  ├─ energy_manager.py
│  │  │  ├─ llm_gateway.py
│  │  │  ├─ aube_assessment_service.py
│  │  │  ├─ aube_matching_service.py
│  │  │  ├─ aube_futureproof_service.py
│  │  │  ├─ aube_explanations_service.py
│  │  │  ├─ narrative_analyzer.py
│  │  │  └─ persona_orchestrator.py
│  │  ├─ models/
│  │  │  ├─ aube_dto.py
│  │  │  ├─ recommendation_v11.py
│  │  │  └─ journal_dto.py
│  │  ├─ schemas/
│  │  │  ├─ aube_recommendation_v11.schema.json
│  │  │  ├─ aube_futureproof_v11.schema.json
│  │  │  └─ playbook_v1.schema.json
│  │  ├─ config/
│  │  │  ├─ energy_grid.yaml
│  │  │  └─ llm_prompts/
│  │  │     ├─ luna_core_system.txt
│  │  │     ├─ playbook_persona.j2
│  │  │     └─ dynamic_context.j2
│  │  └─ tests/
│  │     ├─ test_aube_api.py
│  │     ├─ test_recommendation_contract.py
│  │     └─ test_journal_integration.py
│  └─ phoenix-website/
│     ├─ app/aube/start/page.tsx
│     ├─ app/aube/results/page.tsx
│     └─ components/aube/
│        ├─ DuoEclair.tsx
│        ├─ ValeursTri.tsx
│        ├─ StyleSliders.tsx
│        ├─ TachesPick.tsx
│        ├─ AppetitIA.tsx
│        ├─ WhyPopover.tsx
│        ├─ DisclaimerFooter.tsx
│        ├─ TopJobsList.tsx
│        └─ FutureProofCard.tsx
├─ .github/workflows/ci.yml
├─ docker-compose.dev.yml
└─ README_AUBE_DEV.md
```

**Run dev**
```bash
# Hub
uvicorn apps.phoenix_backend_unified.main:app --reload --port 8003
# Front (Next.js)
pnpm dev  # ou yarn dev / npm run dev
```

---

## 1) OpenAPI — Aube v1.1 (contrat complet)

```yaml
openapi: 3.0.3
info: { title: Phoenix Aube API, version: 1.1.0 }
servers: [{ url: http://localhost:8003 }]
paths:
  /aube/assessment/start:
    post:
      tags: [aube]
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { type: object, properties: { user_id: { type: string, format: uuid } }, required: [user_id] }
      responses:
        '201': { description: started, content: { application/json: { schema: { $ref: '#/components/schemas/AubeAssessmentDTO' } } } }
  /aube/assessment/submit:
    post:
      tags: [aube]
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AubeAssessmentSubmit' }
      responses:
        '200': { description: accepted, content: { application/json: { schema: { $ref: '#/components/schemas/AubeAssessmentDTO' } } } }
  /aube/match/recommend:
    post:
      tags: [aube]
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AubeRecommendRequest' }
      responses:
        '200': { description: ok, content: { application/json: { schema: { $ref: '#/components/schemas/RecommendationV11' } } } }
  /aube/futureproof/score:
    post:
      tags: [aube]
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AubeFutureProofRequest' }
      responses:
        '200': { description: ok, content: { application/json: { schema: { $ref: '#/components/schemas/FutureProofV11' } } } }
  /aube/handover/{target}:
    post:
      tags: [aube]
      security: [{ bearerAuth: [] }]
      parameters: [{ in: path, name: target, required: true, schema: { type: string, enum: [cv, letters, rise] } }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { type: object, properties: { user_id: { type: string, format: uuid }, job_code: { type: string } }, required: [user_id, job_code] }
      responses:
        '202': { description: queued }
  /luna/journal/{user_id}:
    get:
      tags: [journal]
      security: [{ bearerAuth: [] }]
      parameters: [{ in: path, name: user_id, required: true, schema: { type: string, format: uuid } }, { in: query, name: window, schema: { type: string, enum: [7d,14d,90d], default: 14d } }]
      responses:
        '200': { description: ok, content: { application/json: { schema: { $ref: '#/components/schemas/JournalDTO' } } } }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
  schemas:
    # --- Aube Assessment & Requests ---
    AubeAssessmentDTO:
      type: object
      properties:
        assessment_id: { type: string, format: uuid }
        user_id: { type: string, format: uuid }
        status: { type: string, enum: [in_progress, complete] }
        features: { $ref: '#/components/schemas/AubeFeatures' }
        progress: { type: object, properties: { completed_steps: {type: integer}, total_steps: {type: integer} } }
    AubeAssessmentSubmit:
      type: object
      properties:
        assessment_id: { type: string, format: uuid }
        user_id: { type: string, format: uuid }
        payload: { type: object }
      required: [assessment_id, user_id, payload]
    AubeRecommendRequest:
      type: object
      properties:
        user_id: { type: string, format: uuid }
        k: { type: integer, default: 5 }
        features: { $ref: '#/components/schemas/AubeFeatures' }
      required: [user_id]
    AubeFutureProofRequest:
      type: object
      properties:
        user_id: { type: string, format: uuid }
        job_code: { type: string }
      required: [user_id, job_code]
    # --- Features ---
    AubeFeatures:
      type: object
      properties:
        big5: { type: object, properties: { O:{type:number}, C:{type:number}, E:{type:number}, A:{type:number}, N:{type:number} } }
        riasec: { type: object, properties: { R:{type:number}, I:{type:number}, A:{type:number}, S:{type:number}, E:{type:number}, C:{type:number} } }
        transfer_skills: { type: object, additionalProperties: { type: number } }
        constraints: { type: object, additionalProperties: true }
        appetences: { type: object, additionalProperties: { type: number } }
        taches_like: { type: array, items: { type: string } }
        taches_avoid: { type: array, items: { type: string } }
        style_travail: { type: object, properties: { equipe:{type:number}, liberte:{type:number}, tempo:{type:number} } }
        ia_appetit: { type: number }
        skills_bridge: { type: array, items: { type: string } }
        risk_tolerance: { type: number }
        secteur_pref: { type: string }
    # --- Recommendation v1.1 ---
    RecommendationV11:
      type: object
      properties:
        recommendations:
          type: array
          items: { $ref: '#/components/schemas/RecommendationItem' }
    RecommendationItem:
      type: object
      properties:
        job_code: { type: string }
        label: { type: string }
        reasons: { type: array, items: { $ref: '#/components/schemas/Reason' } }
        counter_example: { $ref: '#/components/schemas/CounterExample' }
        futureproof: { $ref: '#/components/schemas/FutureProofV11' }
        timeline:
          type: array
          items: { $ref: '#/components/schemas/TimelineItem' }
        ia_plan:
          type: array
          items: { $ref: '#/components/schemas/IAPlanItem' }
    Reason:
      type: object
      properties: { feature: {type: string}, phrase: {type: string} }
    CounterExample:
      type: object
      properties: { risk: {type: string}, phrase: {type: string} }
    FutureProofV11:
      type: object
      properties:
        score_0_1: { type: number }
        drivers: { type: array, items: { $ref: '#/components/schemas/Driver' } }
    Driver:
      type: object
      properties: { factor: {type: string}, direction: {type: string, enum:[up,down]}, phrase: {type: string} }
    TimelineItem:
      type: object
      properties: { year:{type:integer}, change:{type:string}, signal:{type:string}, confidence:{type:integer,enum:[1,2,3]} }
    IAPlanItem:
      type: object
      properties: { skill:{type:string}, micro_action:{type:string}, effort_min_per_day:{type:integer}, resource_hint:{type:string}, benefit_phrase:{type:string}, difficulty:{type:integer}, prereq:{type:string} }
    # --- Journal ---
    JournalDTO:
      type: object
      properties:
        user: { type: object }
        energy: { type: object }
        narrative: { type: object }
        social_proof: { type: object }
        ethics: { type: object }
```

---

## 2) Config — Énergie & Prompts (gabarits)

**`config/energy_grid.yaml`**
```yaml
simple:
  assessment.start: 0
  assessment.submit: 0
  handover.cv: 0
  handover.letters: 0
  handover.rise: 0
medium:
  match.recommend: 12
  futureproof.score: 15
premium: {}
```

**`config/llm_prompts/luna_core_system.txt`**
```
Tu es Luna, un copilote narratif et bienveillant. Ta mission est d'aider l'utilisateur à transformer son parcours complexe en une histoire claire et puissante. Tu fais partie de l'écosystème Phoenix.
Ton ton est chaleureux, complice et encourageant. Accessible, pragmatique, phrases courtes, emojis sobres (🎯, ✅, 🚀, 🌙). Jamais mystique.
Rappels: Suggestions, pas de verdicts. Droit au skip. Propriété & export visibles.
```

**`config/llm_prompts/playbook_persona.j2`**
```
[TONE]={{ tone }} | [READING_LEVEL]={{ reading_level }} | [ESCALADE]={{ escalation_policy }}
A éviter: {{ avoid_phrases|join(', ') }}
Emojis autorisés: {{ allowed_emojis|join(' ') }}
Ouverture: {{ opening }}
Règles next-step: {{ next_step_rules|tojson }}
```

**`config/llm_prompts/dynamic_context.j2`**
```
[CONTEXT_NARRATIF]
{{ narrative_json }}
[PERSONA_PROFILE]
{{ persona_profile|tojson }}
```

---

## 3) Backend — Services (stubs orientés événements)

**`core/aube_assessment_service.py`**
```python
class AubeAssessmentService:
    def __init__(self, events_repo):
        self.repo = events_repo

    def start(self, user_id: str) -> dict:
        aid = new_uuid()
        self.repo.insert_event({"type":"AubeAssessmentStarted","user_id":user_id,"data":{"assessment_id":aid}})
        return {"assessment_id": aid, "user_id": user_id, "status": "in_progress", "progress": {"completed_steps":0, "total_steps":5}}

    def submit(self, assessment_id: str, user_id: str, payload: dict) -> dict:
        masked = mask_pii(payload)
        self.repo.insert_event({"type":"AubeAssessmentSubmitted","user_id":user_id,"data":{"assessment_id":assessment_id,"payload":masked}})
        features = derive_features(payload)
        self.repo.insert_event({"type":"AubeFeaturesDerived","user_id":user_id,"data":{"assessment_id":assessment_id,"features_hash":sha256_json(features)}})
        return {"assessment_id": assessment_id, "user_id": user_id, "status": "in_progress", "features": features, "progress": {"completed_steps":1, "total_steps":5}}
```

**`core/aube_matching_service.py`**
```python
class AubeMatchingService:
    def __init__(self, repo):
        self.repo = repo
    def recommend(self, user_id: str, features: dict, k: int = 5):
        # Placeholder ranking → à remplacer par moteur hub
        recos = rank_jobs(features, k)
        self.repo.insert_event({"type":"AubeRecommendationsGenerated","user_id":user_id,"data":{"job_codes":[r["job_code"] for r in recos]}})
        return {"recommendations": recos}
```

**`core/aube_futureproof_service.py`**
```python
class AubeFutureProofService:
    def __init__(self, repo):
        self.repo = repo
    def score(self, user_id: str, job_code: str):
        result = compute_futureproof(job_code)
        self.repo.insert_event({"type":"AubeFutureProofScored","user_id":user_id,"data":{"job_code":job_code,"score":result["futureproof"]["score_0_1"]}})
        return result
```

**`core/aube_explanations_service.py`**
```python
# Centralise raisons lisibles, contre-exemples, contre-factuals (Et si…)
```

---

## 4) Schemas JSON — Recommendation & Future‑Proof

**`schemas/aube_recommendation_v11.schema.json`**
```json
{ "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "aube/reco/v1.1", "type": "object",
  "properties": { "recommendations": { "type": "array",
    "items": { "$ref": "#/definitions/RecommendationItem" } } },
  "required": ["recommendations"],
  "definitions": {
    "RecommendationItem": {
      "type": "object",
      "properties": {
        "job_code": {"type": "string"},
        "label": {"type": "string"},
        "reasons": {"type": "array", "items": {"$ref": "#/definitions/Reason"}},
        "counter_example": {"$ref": "#/definitions/CounterExample"},
        "futureproof": {"$ref": "#/definitions/FutureProofV11"},
        "timeline": {"type": "array", "items": {"$ref": "#/definitions/TimelineItem"}},
        "ia_plan": {"type": "array", "items": {"$ref": "#/definitions/IAPlanItem"}}
      },
      "required": ["job_code","label","reasons","futureproof"]
    },
    "Reason": { "type": "object", "properties": {"feature":{"type":"string"},"phrase":{"type":"string"}}, "required":["feature","phrase"] },
    "CounterExample": { "type": "object", "properties": {"risk":{"type":"string"},"phrase":{"type":"string"}} },
    "FutureProofV11": { "type": "object", "properties": {"score_0_1":{"type":"number"}, "drivers":{"type":"array", "items":{"$ref":"#/definitions/Driver"}}}, "required":["score_0_1"] },
    "Driver": { "type": "object", "properties": {"factor":{"type":"string"},"direction":{"type":"string","enum":["up","down"]},"phrase":{"type":"string"}}, "required":["factor","direction","phrase"] },
    "TimelineItem": { "type": "object", "properties": {"year":{"type":"integer"},"change":{"type":"string"},"signal":{"type":"string"},"confidence":{"type":"integer","enum":[1,2,3]} } },
    "IAPlanItem": { "type": "object", "properties": {"skill":{"type":"string"},"micro_action":{"type":"string"},"effort_min_per_day":{"type":"integer"},"resource_hint":{"type":"string"},"benefit_phrase":{"type":"string"},"difficulty":{"type":"integer"},"prereq":{"type":"string"}} }
  }
}
```

**`schemas/aube_futureproof_v11.schema.json`** (si exposé seul)
```json
{ "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "aube/futureproof/v1.1",
  "type": "object", "properties": {"score_0_1":{"type":"number"}, "drivers": {"type":"array","items":{"$ref":"#/definitions/Driver"}} },
  "required": ["score_0_1"],
  "definitions": { "Driver": {"type":"object","properties":{"factor":{"type":"string"},"direction":{"type":"string","enum":["up","down"]},"phrase":{"type":"string"}} } }
}
```

---

## 5) Front — Pages & Composants (squelettes)

**`app/aube/start/page.tsx`**
```tsx
'use client';
import DuoEclair from '@/components/aube/DuoEclair';
import ValeursTri from '@/components/aube/ValeursTri';
import WhyPopover from '@/components/aube/WhyPopover';
import DisclaimerFooter from '@/components/aube/DisclaimerFooter';

export default function AubeStartPage(){
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">On commence léger 🌙</h1>
        <WhyPopover />
      </header>
      <DuoEclair />
      <ValeursTri />
      <DisclaimerFooter />
    </main>
  );
}
```

**`components/aube/TopJobsList.tsx`**
```tsx
export default function TopJobsList({ data }: { data: any }){
  return (
    <section className="space-y-3">
      {data.recommendations?.map((job: any) => (
        <article key={job.job_code} className="p-4 rounded-2xl border bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{job.label}</h3>
            {job.futureproof && (
              <span className="text-sm opacity-80">Pérennité estimée {job.futureproof.score_0_1.toFixed(2)}</span>
            )}
          </div>
          <ul className="text-sm mt-2 list-disc pl-5">
            {(job.reasons||[]).slice(0,2).map((r:any, i:number)=> <li key={i}>{r.phrase}</li>)}
          </ul>
          {job.counter_example?.phrase && (
            <p className="text-xs mt-2">⚠️ {job.counter_example.phrase}</p>
          )}
          {/* timeline & ia_plan en sous-blocs si besoin */}
        </article>
      ))}
    </section>
  );
}
```

**`components/aube/WhyPopover.tsx`**
```tsx
'use client';
import { useState } from 'react';
export default function WhyPopover(){
  const [open,setOpen]=useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(!open)} className="text-sm underline">Pourquoi ?</button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 p-3 text-sm rounded-xl border bg-white shadow">
          Pour mieux personnaliser tes pistes. Pas de test, pas de diagnostic. Tu peux passer à tout moment. Tes réponses t'appartiennent et restent exportables.
        </div>
      )}
    </div>
  );
}
```

**`components/aube/DisclaimerFooter.tsx`**
```tsx
export default function DisclaimerFooter(){
  return (
    <footer className="text-xs opacity-70 border-t pt-3">
      Suggestions, pas de verdicts · 0% énergie · Export possible · Besoin d’un pro ? Consulte un spécialiste.
    </footer>
  );
}
```

> **Note** : Le front **n’appelle que le Hub** (`/aube/*`, `/luna/journal/*`). Aucune logique de scoring local.

---

## 6) DevOps — CI & Docker (gabarits)

**`.github/workflows/ci.yml`**
```yaml
name: ci
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: pytest apps/phoenix-backend-unified/tests -q
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: corepack enable && pnpm i --frozen-lockfile
      - run: pnpm build
```

**`docker-compose.dev.yml`**
```yaml
version: '3.9'
services:
  hub:
    build: ./apps/phoenix-backend-unified
    ports: ["8003:8003"]
    environment:
      - HUB_ENV=dev
  website:
    build: ./apps/phoenix-website
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_LUNA_HUB_URL=http://localhost:8003
```

---

## 7) Postman/Thunder Collection (extrait JSON)

```json
{
  "info": {"name":"Phoenix Aube v1.1"},
  "item": [
    {"name":"Assessment Start","request":{"method":"POST","url":"{{hub}}/aube/assessment/start","header":[{"key":"Authorization","value":"Bearer {{token}}"}],"body":{"mode":"raw","raw":"{\n  \"user_id\": \"11111111-1111-1111-1111-111111111111\"\n}"}}},
    {"name":"Recommend","request":{"method":"POST","url":"{{hub}}/aube/match/recommend","header":[{"key":"Authorization","value":"Bearer {{token}}"}],"body":{"mode":"raw","raw":"{\n  \"user_id\": \"11111111-1111-1111-1111-111111111111\",\n  \"k\": 5\n}"}}}
  ]
}
```

---

## 8) README_AUBE_DEV.md (extrait)

```md
# Phoenix Aube — Dev Quickstart
1) Démarrer le Hub: `uvicorn apps.phoenix_backend_unified.main:app --reload --port 8003`
2) Démarrer le Website: `pnpm dev` (ouvrir /aube/start)
3) Appeler l'API: voir collection Postman.
4) Tests: `pytest apps/phoenix-backend-unified/tests -q`
```

---

### Fin du Pack — prêt à copier/coller. Ajuste les stubs (moteur reco, future-proof) côté Hub, et connecte le front au Hub via `NEXT_PUBLIC_LUNA_HUB_URL`. Aucune logique métier côté front. ✅

