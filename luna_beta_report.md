# Phoenix Luna – Rapport de Validation Terrain

- Date (UTC): 2025-08-27T19:55:35Z
- HUB: https://luna-hub-backend-unified-production.up.railway.app
- USER_ID: 8828da30-8e8a-458f-8888-846aac2f17bd

Ce rapport synthétise les résultats des tests de santé, parcours énergie, GDPR, rate limiting et observabilité.

---

\n## 0) Découverte OpenAPI
- ✅ openapi.json accessible
Top endpoints liés (energy/events/monitoring/cache):
/luna/energy/analytics/{user_id}
/luna/energy/can-perform
/luna/energy/check
/luna/energy/consume
/luna/energy/costs
/luna/energy/preview
/luna/energy/purchase
/luna/energy/refund
/luna/energy/refund-eligibility/{user_id}/{action_event_id}
/luna/energy/refund-history/{user_id}
/luna/energy/refund-policy
/luna/energy/transactions/{user_id}
/luna/events
/luna/events/{user_id}
/monitoring/alerts
/monitoring/health
/monitoring/health/v2
/monitoring/metrics
/monitoring/metrics/current
/monitoring/metrics/prometheus/v2
/monitoring/performance
/monitoring/ready
/monitoring/system-info
/monitoring/version

---

\n## 1) Smoke tests
- ✅ /monitoring/health OK
- ✅ /monitoring/health/v2 OK
- ✅ /monitoring/ready OK
- ✅ Métriques trouvées sur /monitoring/metrics/current
- ⚠️  Endpoint cache health non trouvé/404

---

\n## 2) Parcours énergie
- ❌ can-perform KO (422)
- ❌ consume KO (422)
- ⚠️  Impossible de déterminer la structure des events

---

\n## 3) Rate limiting
\n```
 120 200
```
- ⚠️  Pas de 429 observé (peut être normal selon conf)

---

\n## 4) Observabilité
p95=, p99=, error_rate=
- ⚠️  latency_p95 indisponible
- ⚠️  latency_p99 indisponible
- ⚠️  error_rate indisponible

---

\n## Résumé
- ✅ OK: 5
- ⚠️  WARN: 6
- ❌ FAIL: 2

### Règles Go/No-Go
- **Go** si : smoke OK, au moins un  et un  en 200, métriques accessibles, et events lisibles.
- **No-Go** si : endpoints vitaux down, / échouent, aucune métrique exposée.

> Partage ce fichier **luna_beta_report.md** et le dossier **/tmp/luna_beta_77490** (logs) pour générer le plan de correction.
