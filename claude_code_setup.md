# CLAUDE_CODE_SETUP.md – Phoenix‑Luna (Phase **Peaufinage/Optimisation/Bugfix**)

> **But** : Configurer **Claude Code** dans le terminal pour accélérer les fixes, optimiser les perfs, et garantir la conformité Oracle (Hub roi • Zéro logique métier front • API contrat sacré • Tout est un événement • Sécurité par défaut).
>
> **Périmètre** : `phoenix-backend-unified` (Hub), `phoenix-website`, `phoenix-cv`, `phoenix-letters`.

---

## 0) Pré‑requis Terminal

- **Shell** : bash/zsh récent
- **Node** : v18+ (Next.js/Front)
- **Python** : 3.11+
- **Poetry** *(ou pip/uv au choix)* pour l’isolement
- **Docker** 24+
- **Railway CLI** : `npm i -g @railway/cli`
- **Git** : 2.40+

> **Secrets** en local via `.env` par app (jamais committer) ; en prod via variables Railway.

---

## 1) Arborescence Monorepo (rappel)

```
phoenix/
├── apps/
│   ├── phoenix-backend-unified/   # Hub Luna (FastAPI)
│   ├── phoenix-website/           # Next.js (landing + session zéro)
│   ├── phoenix-cv/                # App CV (React/Vite)
│   └── phoenix-letters/           # App Letters (React/Vite)
└── scripts/                       # utilitaires CI/CD, seeding, smoke
```

---

## 2) Variables d’Environnement (exemples utiles)

**Frontend** (`phoenix-website`)
```
NEXT_PUBLIC_LUNA_REGISTER_ENDPOINT=https://<hub>/auth/register
NEXT_PUBLIC_LUNA_NARRATIVE_START_ENDPOINT=https://<hub>/luna/narrative/start
NEXT_PUBLIC_LUNA_LEAD_ENDPOINT=https://<hub>/public/leads
NEXT_PUBLIC_CV_APP_URL=https://phoenix-cv-production.up.railway.app
```

**Backend Hub** (`phoenix-backend-unified`)
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
CORS_ORIGINS=https://phoenix-website-production.up.railway.app,https://phoenix-cv-production.up.railway.app
STRIPE_SECRET_KEY=...
```

> Conseil : garder des fichiers `.env.sample` par app et synchroniser avec Railway.

---

## 3) Alias & Fonctions Shell – **Productivité Fix/Debug**

Ajoutez ceci à `~/.zshrc` ou `~/.bashrc` :

```bash
# — généraux —
alias r='railway'
alias p='poetry'
alias py='python'
alias kt='kubetail || true'   # si vous avez kubetail

# — chemins —
export PHX=$HOME/dev/phoenix
export HUB=$PHX/apps/phoenix-backend-unified
export WEB=$PHX/apps/phoenix-website
export CV=$PHX/apps/phoenix-cv
export LET=$PHX/apps/phoenix-letters

# — back: run, test, lint, security —
phx.hub.run() { (cd "$HUB" && p run uvicorn app.main:app --reload --port 8003); }
phx.hub.test() { (cd "$HUB" && p run pytest -q --maxfail=1 --disable-warnings --cov=app); }
phx.hub.lint() { (cd "$HUB" && p run flake8 && p run bandit -q -r app && p run safety check || true); }
phx.hub.health() { curl -sS "${1:-http://localhost:8003}/monitoring/health" | jq .; }

# — website —
phx.web.dev() { (cd "$WEB" && npm run dev); }
phx.web.lint() { (cd "$WEB" && npm run lint && npm run typecheck || true); }

# — satellites —
phx.cv.dev() { (cd "$CV" && npm run dev); }
phx.letters.dev() { (cd "$LET" && npm run dev); }

# — smoke tests écosystème —
phx.eco.smoke() { (cd "$PHX/scripts" && python test_ecosystem_complete.py); }

# — curl utilitaires —
phx.api.post() { url="$1"; shift; curl -sS -X POST "$url" -H 'Content-Type: application/json' "$@"; }
phx.api.get()  { url="$1"; shift; curl -sS -X GET  "$url" -H 'Content-Type: application/json' "$@"; }

# — logs Railway (prod) —
phx.hub.logs() { r logs --service phoenix-backend-unified --env production; }
phx.cv.logs()  { r logs --service phoenix-cv --env production; }
phx.let.logs() { r logs --service phoenix-letters --env production; }
phx.web.logs() { r logs --service phoenix-website --env production; }
```

> **Tip** : si vous n’utilisez pas Poetry, remplacez `p run` par `pipx run` ou `uv run`.

---

## 4) Hooks Git & Qualité (pré‑commit)

**Installer pré‑commit** :
```bash
pipx install pre-commit || pip install pre-commit
pre-commit install
```

**.pre-commit-config.yaml** (exemple au Hub)
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black
  - repo: https://github.com/PyCQA/flake8
    rev: 7.1.0
    hooks:
      - id: flake8
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.9
    hooks:
      - id: bandit
        args: ["-r", "app"]
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v4.0.0-alpha.8
    hooks:
      - id: prettier
```

**Conventional commits** (hook simple) :
```bash
npm i -D @commitlint/{cli,config-conventional} husky
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

---

## 5) **Claude Code** – Mode d’Emploi Terminal (High‑Level)

### 5.1 Prompts Généraux (à coller dans le terminal lorsque Claude Code est actif)

**A) “Fix de bug reproductible”**
```
Contexte: Phoenix-Luna monorepo. Respecte strictement:
- Hub roi (phoenix-backend-unified) = logique métier
- Zéro logique métier front
- API = contrat sacré (voir ARCHITECTURE_DIAGRAM)
- Tout est un événement (Event Store Supabase)
- Sécurité par défaut (Security Guardian)

Tâche: Je te fournis un bug + log + endpoint. Objectif: reproduire localement, écrire un test qui échoue, proposer patch minimal, passer les tests, garder la couverture.
Sortie attendue:
1) Hypothèse racine + scénario repro (étapes exactes)
2) Test unitaire/intégration (code) qui échoue avant patch
3) Patch (diff minimal)
4) Vérifs: tests verts, lint, sécurité, perf si pertinent
```

**B) “Optimisation performance”**
```
Contexte Luna Hub (FastAPI). Cible: p95 < 500 ms.
Donne-moi un plan d’optimisation safe: profilage, caching, limites IO, pool connexions, pagination par défaut, index DB, et métriques Prometheus. Propose des PRs petites et séquentielles + tests.
```

**C) “Revue de sécurité”**
```
Contexte: endpoints publics /auth/* /public/* /luna/*.
Check-list OWASP: validation Pydantic, rate limiting, CORS, secrets, logs PII safe, erreurs génériques, headers (X-Content-Type-Options, X-Frame-Options), auth Bearer/HttpOnly. Produit un diff minimal par thème + tests.
```

**D) “Contrat d’API”**
```
Contrôle que le code respecte le contrat ARCHITECTURE_DIAGRAM.md.
Si divergence, propose un plan de migration compatible rétro.
Génère un extrait OpenAPI mis à jour + exemples de requêtes cURL.
```

### 5.2 Contextes Fichiers à fournir à Claude Code
- `ARCHITECTURE_DIAGRAM.md` pour les endpoints contractuels.
- `SPRINT_1_VALIDATION.md` pour Security Guardian & tests.
- `SPRINT_5_DEPLOYMENT_COMPLETE.md` pour Railway/health/CI.
- `luna_identity.txt` & `LUNA_ENERGY_GRID.txt` pour l’UX/énergie.

### 5.3 Règles d’acceptation que Claude doit respecter
- **Pas de logique métier** côté Front (affichage + intention seulement).
- **Chaque action state‑changing = événement** (insertion Event Store côté Hub).
- **Modifs front/back atomiques** avec tests.
- **Pas de secrets** dans le code ; variables d’env uniquement.

---

## 6) Scénarios Courants (recettes prêtes)

### 6.1 Vérifier la santé prod (Railway)
```bash
phx.hub.logs
phx.web.logs
phx.cv.logs
phx.let.logs
phx.hub.health https://phoenix-backend-unified-production.up.railway.app
```

### 6.2 Smoke test rapide endpoints clés
```bash
# register
phx.api.post "$HUB_URL/auth/register" -d '{"email":"test@ex.com","password":"Azerty123!"}' | jq .

# narrative start (avec JWT)
JWT=...; phx.api.post "$HUB_URL/luna/narrative/start" -H "Authorization: Bearer $JWT" -d '{"motivation":"Reconversion UX"}' | jq .

# leads (public)
phx.api.post "$HUB_URL/public/leads" -d '{"email":"lead@ex.com","source":"luna_modal"}' | jq .
```

### 6.3 Cycle qualité local (Hub)
```bash
phx.hub.lint && phx.hub.test
```

### 6.4 Relancer Website en dev
```bash
phx.web.dev
```

---

## 7) Modèles de PR (check‑list)

- [ ] Respect Oracle (Hub roi, ZLMF, API contrat, Events, Sec)
- [ ] Tests ajoutés/ajustés (unit/intégration, >90% modules critiques)
- [ ] Docs OpenAPI mises à jour
- [ ] Pas de secret en dur / `.env.sample` mis à jour
- [ ] Observabilité: logs structurés + métriques si pertinent
- [ ] Impact performance évalué (p95)
- [ ] Rollback trivial (changement isolé)

---

## 8) Templates de Tickets

**Bug**
```
Titre: [scope] Comportement inattendu sur <endpoint/feature>
Contexte: env, version, commit
Étapes repro: ...
Résultat: ...
Attendu: ...
Logs/Stack: ...
Hypothèse racine: ...
Tests proposés: ...
```

**Amélioration**
```
Titre: [perf/sec/ux] Optimiser <composant/endpoint>
Contexte: métriques actuelles (p95, erreurs)
Proposition: patch minimal + test + mesure
Risques: ...
Rollback: ...
```

---

## 9) Astuces Performance & Sécurité (Hub)

- **FastAPI**: activer `uvicorn --http h11 --loop uvloop` ; workers calibrés selon CPU.
- **DB**: index sur champs fréquents (user_id, occurred_at), pagination `limit/offset` par défaut.
- **JWT**: durée courte + refresh ; préférer **cookie HttpOnly** inter‑apps au hash `#token` en prod.
- **Headers**: `X-Request-ID`, `X-Content-Type-Options=nosniff`, `X-Frame-Options=SAMEORIGIN`.
- **Rate limit** minimal sur endpoints publics (`/public/*`), captchas si abus.

---

## 10) Roadmap Peaufinage – Ordre conseillé

1) **/public/leads** → events + monitoring (taux/heure, conversion → register)
2) **/auth/register** robustifié (erreurs claires, idempotence email)
3) **/luna/narrative/start** → validation stricte + métrique d’adoption
4) **SSO cookie** cross‑apps (remplacer le `#token` marketing par cookie HttpOnly)
5) **Dash métriques** p95, erreurs, taux succès Session Zéro

---

**Fin.**

> Ce fichier sert de **manuel d’opération terminal** pour Claude Code + équipe Phoenix pendant la phase de peaufinage. Gardez-le à la racine du monorepo et mettez‑le à jour au fil des besoins.



---

## 11) Persona & Operating Manual – **Claude Code (Full‑Stack • UX‑first • Front/Back Debugging)**

> **Objectif** : spécialiser Claude Code pour la phase *Peaufinage/Optimisation/Bugfix* avec un profil **développeur·e full‑stack** orienté **UX** et **débogage** bout‑en‑bout, strictement aligné sur les **Directives Oracle**.

### 11.1 Persona
- **Rôle** : Dev full‑stack senior (FastAPI • React/Next • CI/CD Railway) avec forte sensibilité **UX/Accessibilité**.
- **Mission** : résoudre vite et proprement, **sans déplacer la logique métier vers le front** ; protéger le **contrat API** ; convertir chaque changement d’état en **événement** ; préserver la **sécurité** par défaut.
- **Style** : réponses **courtes, actionnables**, livrant **diff minimal**, **tests d’abord**, impacts UX/perf explicités.

### 11.2 Règles Non‑Négociables (copiées dans chaque session)
1) **Hub est Roi** : toute logique métier dans `phoenix-backend-unified`.
2) **Zéro logique métier front** : le front collecte l’intention, le Hub décide.
3) **API = contrat sacré** : respecter `ARCHITECTURE_DIAGRAM.md`; proposer migrations rétro‑compatibles si nécessaire.
4) **Tout est un événement** : chaque mutation → insertion Event Store.
5) **Sécurité = fondation** : Security Guardian, CORS, rate‑limit, secrets.

### 11.3 Format de Réponse Attendu (Claude)
```
[DIAGNOSTIC]
- Hypothèse cause racine
- Repro steps (numérotées)

[TEST QUI ÉCHOUE]
- Fichier + snippet
- Commande pour exécuter

[PATCH MINIMAL]
- Diff contextuel (3-5 lignes autour)

[VALIDATIONS]
- Tests verts + lint + sécurité
- Impact UX/Perf + risques + rollback
```

### 11.4 Do / Don’t
**Do**
- Ajouter/adapter **tests** avant patch.
- Décrire **impacts UX** (états de chargement, focus trap, ARIA, mobile).
- Chiffrer **perf** : p95 cible, I/O, pagination, index.
- Proposer **migrations contractuelles** (déprécation progressive).

**Don’t**
- Implémenter une décision métier côté front.
- Introduire des secrets dans le code.
- Casser la rétro‑compatibilité sans plan de migration.

### 11.5 Playbooks Debug – Front & Back
**Front (Next/React)**
- Vérifier **états de chargement** (`disabled`, skeleton), **accessibilité** (focus trap, `aria-*`), **erreurs réseau** (HTTP ≠ 2xx), **CORS**.
- Outillage : `npm run dev`, `npm run lint`, `npm run typecheck`, onglet Network, `phx.api.post` pour stubber.

**Back (FastAPI)**
- Repro en local `phx.hub.run` ; logs corrélés `X-Request-ID`.
- Vérifier **pydantic validation**, **Security Guardian**, **contrat OpenAPI**, **index DB**.
- Ajouter un **test d’intégration** httpx/pytest avec cas d’erreur réaliste.

### 11.6 Prompts Spécialisés (copier‑coller)

**A) Bug Front (UX + réseau)**
```
Contexte: Phoenix-Website (Next). Respecte Oracle. Voici le bug (logs + étapes).
Tâche: 1) Repro précis 2) Test unitaire ou RTL qui échoue 3) Patch minimal (accessibilité + états de chargement) 4) Validation (lint/typecheck), risques, rollback.
```

**B) Bug Back (FastAPI + Event Store)**
```
Contexte: Luna Hub. Ne déplace aucune logique vers le front.
But: corriger l’endpoint <X> sans casser le contrat. 1) Test httpx qui échoue 2) Patch 3) Insertion événement 4) Mesure p95 & index éventuel 5) Sécurité (Guardian, CORS).
```

**C) Perf Review ciblée**
```
Objectif p95 < 500 ms sur <endpoint>.
Demande: plan en 3 PRs max (profilage → cache léger → index/pagination) + tests perf et métriques.
```

**D) Audit Accessibilité (LunaModal)**
```
Vérifie focus trap, roles ARIA, contrastes, narration des messages d’erreur.
Propose patch minimal + test RTL pour tab/focus.
```

### 11.7 Check‑lists Express (coller en tête de PR)
- [ ] Tests ajoutés/MAJ (échouent avant patch)
- [ ] Contrat OpenAPI inchangé (ou migration décrite)
- [ ] Événement écrit dans Event Store
- [ ] Security Guardian & headers OK
- [ ] UX : loaders, messages d’erreur, mobile OK
- [ ] Perf : impact p95 commenté

### 11.8 Snippets Types

**Test httpx (register) qui échoue avant patch**
```python
@pytest.mark.asyncio
aSYNC def test_register_email_idempotent(client):
    payload = {"email":"a@b.c","password":"Azerty123!"}
    r1 = await client.post("/auth/register", json=payload)
    r2 = await client.post("/auth/register", json=payload)
    assert r1.status_code in (200,201)
    assert r2.status_code in (200,201)  # attendu: idempotence côté Hub
```

**React – état de chargement + aria-live**
```tsx
<button disabled={status==='sending'} aria-busy={status==='sending'}>Créer mon compte</button>
<div role="status" aria-live="polite">{message}</div>
```

**cURL debug**
```bash
phx.api.post "$HUB_URL/public/leads" -d '{"email":"lead@ex.com","source":"luna_modal"}' | jq .
```

### 11.9 Garde‑fous (Claude)
- Si une solution implique de **déplacer une décision métier** vers le front → **REFUSER** et proposer le flux via le Hub.
- Si l’événement correspondant manque → **EXIGER** l’écriture dans l’Event Store avant de valider.
- Si la perf se dégrade → proposer **mesure + rollback**.

