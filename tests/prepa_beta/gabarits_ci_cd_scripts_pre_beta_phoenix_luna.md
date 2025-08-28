# Gabarits CI/CD & Scripts – Pré‑Bêta Phoenix‑Luna

> Ces gabarits respectent les 5 directives : **Hub Roi**, **Zéro logique métier en FE**, **API = contrat**, **Tout est un événement**, **Sécurité by‑default**. À adapter avec tes noms de services et registres.

---

## 1) Makefile (racine du monorepo)
```makefile
SHELL := /bin/bash
.ONESHELL:

# ========= Variables =========
SERVICE_HUB := phoenix-backend-unified
REGISTRY := ghcr.io/your-org
IMAGE_TAG ?= $(shell git describe --tags --always --dirty)
COMPOSE_FILE := docker-compose.ci.yml

# ========= Helpers =========
.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?#' Makefile | sed 's/:.*?#/\t- /' | sort

# ========= Qualité & Sécurité =========
.PHONY: audit
audit: fmt lint sbom sca sast licenses  # Audit complet

.PHONY: fmt
fmt:  # Formatage code
	npx prettier -w . || true

.PHONY: lint
lint:  # Lint TS/JS + Dockerfile + YAML
	npx eslint . --max-warnings=0
	hadolint Dockerfile || true
	yamllint . || true

.PHONY: sbom
sbom:  # Génère SBOM CycloneDX
	npx @cyclonedx/cyclonedx-npm --output-file sbom.json --output-format json

.PHONY: sca
sca:   # Scan vulnérabilités deps
	npx audit-ci --moderate

.PHONY: sast
sast:  # Scan code statique (ex: semgrep)
	semgrep ci --config auto

.PHONY: licenses
licenses:  # Vérifie licences autorisées
	npx license-checker --production --onlyAllow="MIT;Apache-2.0;BSD-3-Clause"

# ========= Tests =========
.PHONY: test-all
test-all: test-unit test-integration test-contract test-e2e  # Suite complète

.PHONY: test-unit
test-unit:
	npx vitest run --coverage

.PHONY: test-integration
test-integration:
	docker compose -f $(COMPOSE_FILE) up -d eventstore db
	npx vitest run --config vitest.integration.config.ts
	docker compose -f $(COMPOSE_FILE) down -v

.PHONY: test-contract
test-contract:  # Provider/consumer
	npx pact-broker can-i-deploy || (echo "Contrats non valides" && exit 1)

.PHONY: test-e2e
test-e2e:
	npx playwright install --with-deps
	npx playwright test --reporter=line

# ========= Performance & Résilience =========
.PHONY: perf
perf:  # Charge & SLA/SLO
	npx k6 run perf/k6-smoke.js

.PHONY: chaos
chaos:
	./scripts/chaos_inject.sh

# ========= API & Événements =========
.PHONY: api-validate
api-validate:  # Schéma OpenAPI must = code
	npx openapi-diff path/to/reference.yaml path/to/generated.yaml --fail-on-changed

.PHONY: event-contracts
event-contracts:  # Valide schémas d'événements (JSON Schema)
	node scripts/validate_events.js

.PHONY: replay
replay:  # Reconstruit projections depuis Event Store
	node scripts/replay_projections.js --from-scratch

# ========= Sécurité dynamique =========
.PHONY: security
security:  # DAST ciblé
	zap-baseline.py -t https://staging.example.com -r zap_report.html || true

# ========= Build & Deploy =========
.PHONY: docker-build
docker-build:
	docker build -t $(REGISTRY)/$(SERVICE_HUB):$(IMAGE_TAG) -f Dockerfile .

.PHONY: docker-push
docker-push:
	docker push $(REGISTRY)/$(SERVICE_HUB):$(IMAGE_TAG)

.PHONY: deploy-beta
deploy-beta: docker-build docker-push  # Canary + vérifs + rollback
	./scripts/deploy_canary.sh $(REGISTRY)/$(SERVICE_HUB):$(IMAGE_TAG)
	./scripts/post_deploy_checks.sh || (./scripts/rollback.sh && exit 1)
```

---

## 2) GitHub Actions – pipeline CI/CD (canary + gates Go/No‑Go)
`.github/workflows/beta.yml`
```yaml
name: beta-pipeline

on:
  push:
    tags:
      - 'v*.*.*-beta*'
  workflow_dispatch: {}

permissions:
  contents: read
  packages: write
  id-token: write

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Cache
        uses: actions/setup-node@v4
        with:
          cache: 'npm'
      - run: npm ci
      - name: Audit
        run: make audit
      - name: Tests
        run: make test-all
      - name: API & Events Contracts
        run: make api-validate event-contracts
      - name: Build Image
        run: make docker-build IMAGE_TAG=${{ github.ref_name }}
      - name: OIDC login to cloud
        uses: your-cloud/login@v1
      - name: Push Image
        run: make docker-push IMAGE_TAG=${{ github.ref_name }}
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: reports
          path: |
            coverage/
            sbom.json
            zap_report.html

  cd-canary:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Canary Deploy
        env:
          IMAGE_TAG: ${{ needs.ci.outputs.image_tag || github.ref_name }}
        run: make deploy-beta IMAGE_TAG=$IMAGE_TAG

  gates:
    needs: cd-canary
    runs-on: ubuntu-latest
    steps:
      - name: Post-deploy checks
        run: |
          ./scripts/check_slo.sh --p99 400 --error-rate 0.5
          ./scripts/check_security_gates.sh --fail-on=critical
```

---

## 3) Scripts (répertoire `scripts/`)

### `deploy_canary.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
IMAGE="$1"
# Ex: kubectl set image deploy/hub hub=$IMAGE --record
kubectl -n phoenix set image deploy/hub hub=$IMAGE --record
kubectl -n phoenix rollout status deploy/hub --timeout=120s
# Route 5% du trafic vers le canary (service mesh/ingress)
# istioctl or ingress annotations ici
```

### `post_deploy_checks.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
# Health, migrations, readiness, projections sync
curl -fsS https://beta.example.com/healthz
node scripts/wait_for_projections.js --timeout 60
```

### `rollback.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
kubectl -n phoenix rollout undo deploy/hub
```

### `check_slo.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
P99=${1:-400}
ERR=${2:-0.5}
# Exemple : interrogation Prometheus pour p99 & taux d'erreur
# Fail si seuils dépassés
if ./scripts/query_prom.sh p99 > $P99; then exit 1; fi
if ./scripts/query_prom.sh error_rate > $ERR; then exit 1; fi
```

### `validate_events.js`
```js
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true, strict: true });
const schemas = JSON.parse(readFileSync('events/schema/index.json', 'utf-8'));
const samples = JSON.parse(readFileSync('events/samples.json', 'utf-8'));
for (const e of samples) {
  const key = `${e.name}@v${e.version}`;
  const validate = ajv.compile(schemas[key]);
  const ok = validate(e.payload);
  if (!ok) {
    console.error('Invalid event', key, validate.errors);
    process.exit(1);
  }
}
console.log('All event payloads valid.');
```

### `replay_projections.js`
```js
import { createClient } from './lib/eventstore.js';
import { rebuildAll } from './projections/index.js';
const es = await createClient(process.env.EVENTSTORE_CONN);
await rebuildAll(es, { fromScratch: true });
console.log('Projections rebuilt.');
```

### `wait_for_projections.js`
```js
import fetch from 'node-fetch';
const deadline = Date.now() + (Number(process.argv[2]?.split('=')[1]||60) * 1000);
async function ready(){
  const res = await fetch('https://beta.example.com/ops/projections');
  const j = await res.json();
  return j?.status === 'green';
}
while(Date.now() < deadline){
  if (await ready()) process.exit(0);
  await new Promise(r=>setTimeout(r,2000));
}
process.exit(1);
```

---

## 4) Gates de sécurité (sécurité by‑default)

### `check_security_gates.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
# échoue si des vulnérabilités critiques existent
jq -e '.vulnerabilities[] | select(.severity=="critical")' < reports/sca.json >/dev/null && {
  echo 'Critical vulns found'; exit 1; }
# CSP/HSTS headers smoke via zap_report.html (extraction simple)
grep -q 'Content-Security-Policy' zap_report.html || { echo 'CSP missing'; exit 1; }
grep -q 'Strict-Transport-Security' zap_report.html || { echo 'HSTS missing'; exit 1; }
```

---

## 5) Convention d’artefacts & contrats
- `openapi/reference.yaml` (source de vérité, signé et versionné)
- `openapi/generated.yaml` (build)
- `events/schema/*.json` (par `eventName@vX`)
- `events/samples.json` (échantillons validés en CI)
- `reports/` (coverage, sbom, zap, sca)

---

## 6) Secrets/Config (à stocker dans KMS/Vault)
- `EVENTSTORE_CONN`, `DB_URL`, `JWT_SIGNING_KEY` (rotation), `WAF_BYPASS=false`
- `RATE_LIMIT_*`, `CORS_ALLOWED_ORIGINS` minimal, `FEATURE_FLAGS`

---

## 7) Points d’intégration Frontend (sans logique métier)
- Actions = intentions uniquement (`/api/*`) ; validations métier **serveur**
- E2E couvre : signup/login, flows critiques, erreurs serveur, feature flags

---

## 8) Runbooks express
- **Rollback**: `make deploy-beta` → échec checks → `rollback.sh` auto
- **Replay projections**: `make replay`
- **Incident**: geler feature flags, basculer trafic canary à 0%, notifier on‑call
```

