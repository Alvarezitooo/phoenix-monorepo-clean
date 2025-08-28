#!/usr/bin/env bash
# Phoenix-Luna – Validation Terrain & Rapport Markdown
# Usage:
#   chmod +x luna_beta_validate.sh
#   HUB="https://luna-hub-backend-unified-production.up.railway.app" \
#   USER_ID="8828da30-8e8a-458f-8888-846aac2f17bd" \
#   WEBSITE="https://phoenix-website-production.up.railway.app" \
#   LETTERS="https://phoenix-letters-production.up.railway.app" \
#   CV="https://phoenix-cv-production.up.railway.app" \
#   ./luna_beta_validate.sh

set -u
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
REPORT_MD="luna_beta_report.md"
TMP_DIR="/tmp/luna_beta_$$"
mkdir -p "$TMP_DIR"

: "${HUB:?HUB is required (ex: https://your-hub)}"
: "${USER_ID:?USER_ID is required (uuid)}"

ok=0; warn=0; fail=0
pass() { echo "✅ $1"; ok=$((ok+1)); echo "- ✅ $1" >> "$REPORT_MD"; }
warn() { echo "⚠️  $1"; warn=$((warn+1)); echo "- ⚠️  $1" >> "$REPORT_MD"; }
fail() { echo "❌ $1"; fail=$((fail+1)); echo "- ❌ $1" >> "$REPORT_MD"; }
hr() { echo "" >> "$REPORT_MD"; echo "---" >> "$REPORT_MD"; echo "" >> "$REPORT_MD"; }

note() { echo "$1" >> "$REPORT_MD"; }
heading() { echo "# $1" >> "$REPORT_MD"; }
sub() { echo "\n## $1" >> "$REPORT_MD"; }
codeblock() { echo '\n```'"$1" >> "$REPORT_MD"; cat >> "$REPORT_MD"; echo '```' >> "$REPORT_MD"; }

# Header report
cat > "$REPORT_MD" <<EOF
# Phoenix Luna – Rapport de Validation Terrain

- Date (UTC): $TS
- HUB: $HUB
- USER_ID: $USER_ID

Ce rapport synthétise les résultats des tests de santé, parcours énergie, GDPR, rate limiting et observabilité.
EOF
hr

sub "0) Découverte OpenAPI"
OA="$TMP_DIR/openapi.json"
if curl -fsS "$HUB/openapi.json" -o "$OA"; then
  pass "openapi.json accessible"
  echo "Top endpoints liés (energy/events/monitoring/cache):" >> "$REPORT_MD"
  jq -r '.paths | keys[] | select(test("energy|event|monitoring|cache"; "i"))' "$OA" >> "$REPORT_MD" || true
else
  fail "openapi.json introuvable"
fi
hr

sub "1) Smoke tests"
if curl -fsS "$HUB/monitoring/health" -o "$TMP_DIR/health.json"; then pass "/monitoring/health OK"; else fail "/monitoring/health KO"; fi
if curl -fsS "$HUB/monitoring/health/v2" -o "$TMP_DIR/healthv2.json"; then pass "/monitoring/health/v2 OK"; else warn "/monitoring/health/v2 indispo"; fi
if curl -fsS "$HUB/monitoring/ready" -o "$TMP_DIR/ready.json"; then pass "/monitoring/ready OK"; else warn "/monitoring/ready indispo"; fi

# Metrics discovery
METRICS_PATH=""
for p in \
  "/monitoring/metrics/current" \
  "/monitoring/metrics/prometheus/v2" \
  "/monitoring/metrics" \
  "/metrics"; do
  if curl -fsS "$HUB$p" -o "$TMP_DIR/metrics.out"; then METRICS_PATH="$p"; break; fi
done
if [ -n "$METRICS_PATH" ]; then pass "Métriques trouvées sur $METRICS_PATH"; else warn "Aucune route métriques détectée"; fi

# Cache health (discover via OpenAPI)
CACHE_HEALTH=""
if [ -f "$OA" ]; then
  CAND=$(jq -r '.paths | keys[] | select(test("cache.*health"; "i"))' "$OA" | head -n1)
  [ -n "$CAND" ] && CACHE_HEALTH="$CAND"
fi
if [ -n "$CACHE_HEALTH" ] && curl -fsS "$HUB$CACHE_HEALTH" -o "$TMP_DIR/cache_health.json"; then
  pass "Cache health OK ($CACHE_HEALTH)"
else
  warn "Endpoint cache health non trouvé/404"
fi
hr

sub "2) Parcours énergie"
# Try variant A: kebab-case path
CAN_PERFORM_PATH="/luna/energy/can-perform"
CONSUME_PATH="/luna/energy/consume"

# If openapi shows snake_case, prefer it
if [ -f "$OA" ] && jq -e '.paths["/luna/energy/can_perform"]' "$OA" >/dev/null 2>&1; then
  CAN_PERFORM_PATH="/luna/energy/can_perform"
fi
if [ -f "$OA" ] && jq -e '.paths["/luna/energy/consume"]' "$OA" >/dev/null 2>&1; then
  : # keep default
fi

REQ_A='{ "user_id": "'$USER_ID'", "action": "analyse_cv_complete" }'
HTTP=$(curl -sS -o "$TMP_DIR/can_perform_a.json" -w "%{http_code}" -X POST "$HUB$CAN_PERFORM_PATH" -H 'Content-Type: application/json' -d "$REQ_A")
if [ "$HTTP" = "200" ]; then
  pass "can-perform (A) 200"
else
  # Try variant B: add idempotency/correlation
  REQ_B='{ "user_id": "'$USER_ID'", "action": "analyse_cv_complete", "idempotency_key":"check-'$TS'", "correlation_id":"'$USER_ID'" }'
  HTTP=$(curl -sS -o "$TMP_DIR/can_perform_b.json" -w "%{http_code}" -X POST "$HUB$CAN_PERFORM_PATH" -H 'Content-Type: application/json' -d "$REQ_B")
  if [ "$HTTP" = "200" ]; then pass "can-perform (B) 200"; else fail "can-perform KO ($HTTP)"; fi
fi

HTTP=$(curl -sS -o "$TMP_DIR/consume.json" -w "%{http_code}" -X POST "$HUB$CONSUME_PATH" -H 'Content-Type: application/json' -d "$REQ_A")
if [ "$HTTP" = "200" ]; then pass "consume 200"; else fail "consume KO ($HTTP)"; fi

# Events last item – discover path
EVENTS_PATH=""
if [ -f "$OA" ]; then
  EVENTS_PATH=$(jq -r '.paths | keys[] | select(test("/events/"))' "$OA" | head -n1)
fi
[ -z "$EVENTS_PATH" ] && EVENTS_PATH="/luna/events/$USER_ID"

BODY=$(curl -sS "$HUB$EVENTS_PATH") || BODY=""
if echo "$BODY" | jq -e 'type=="array"' >/dev/null 2>&1; then
  echo "$BODY" | jq '.[-1]' > "$TMP_DIR/last_event.json" && pass "Dernier événement extrait (array)"
elif echo "$BODY" | jq -e 'has("events")' >/dev/null 2>&1; then
  echo "$BODY" | jq '.events[-1]' > "$TMP_DIR/last_event.json" && pass "Dernier événement extrait (events)"
else
  warn "Impossible de déterminer la structure des events"
fi
hr

sub "3) Rate limiting"
CODES=$(mktemp)
for i in $(seq 1 120); do curl -s -o /dev/null -w "%{http_code}\n" "$HUB/monitoring/version"; done | sort | uniq -c > "$CODES"
codeblock "" < "$CODES"
if grep -q "429" "$CODES"; then pass "Rate-limit actif (429 présent)"; else warn "Pas de 429 observé (peut être normal selon conf)"; fi
hr

sub "4) Observabilité"
if [ -n "$METRICS_PATH" ]; then
  # Try to parse a JSON snapshot if it's JSON
  if jq . "$TMP_DIR/metrics.out" >/dev/null 2>&1; then
    P95=$(jq -r '.latency_p95 // empty' "$TMP_DIR/metrics.out")
    P99=$(jq -r '.latency_p99 // empty' "$TMP_DIR/metrics.out")
    ERR=$(jq -r '.error_rate // empty' "$TMP_DIR/metrics.out")
    echo "p95=$P95, p99=$P99, error_rate=$ERR" >> "$REPORT_MD"
    [ -n "$P95" ] && pass "latency_p95 collectée" || warn "latency_p95 indisponible"
    [ -n "$P99" ] && pass "latency_p99 collectée" || warn "latency_p99 indisponible"
    [ -n "$ERR" ] && pass "error_rate collecté" || warn "error_rate indisponible"
  else
    # probably Prometheus text format
    head -n 30 "$TMP_DIR/metrics.out" | sed 's/^/    /' >> "$REPORT_MD"
    pass "Métriques Prometheus disponibles ($METRICS_PATH)"
  fi
else
  warn "Aucune métrique collectée"
fi
hr

sub "Résumé"
echo "- ✅ OK: $ok" >> "$REPORT_MD"
echo "- ⚠️  WARN: $warn" >> "$REPORT_MD"
echo "- ❌ FAIL: $fail" >> "$REPORT_MD"

cat <<EON >> "$REPORT_MD"

### Règles Go/No-Go
- **Go** si : smoke OK, au moins un `can-perform` et un `consume` en 200, métriques accessibles, et events lisibles.
- **No-Go** si : endpoints vitaux down, `can-perform`/`consume` échouent, aucune métrique exposée.

> Partage ce fichier **$REPORT_MD** et le dossier **$TMP_DIR** (logs) pour générer le plan de correction.
EON

# Console tail
echo
echo "======================"
echo " Rapport: $REPORT_MD"
echo " Logs:    $TMP_DIR"
echo "======================"
