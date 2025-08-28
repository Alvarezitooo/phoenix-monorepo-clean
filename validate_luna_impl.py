#!/usr/bin/env python3
"""
Phoenix‑Luna – Validation des implémentations Hub (script pour Claude Code)

But:
  - Exécuter des tests automatisés (santé, énergie, événements, metrics, rate‑limit)
  - Découvrir automatiquement les schémas depuis openapi.json
  - Produire un rapport Markdown actionnable (claude_impl_validation.md)

Entrées (env ou args):
  HUB         = base URL du Hub (ex: https://luna-hub...railway.app)
  USER_ID     = UUID de test
  AUTH        = (optionnel) header Authorization complet, ex: "Bearer ey..."
  ACTION_NAME = (optionnel) par défaut: analyse_cv_complete

Usage:
  python3 validate_luna_impl.py \
    --hub "$HUB" --user-id "$USER_ID" \
    [--auth "$AUTH"] [--action-name analyse_cv_complete]

Sorties:
  - claude_impl_validation.md  (rapport lisible)
  - code de sortie ≠0 si échecs critiques
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import time
import uuid
from typing import Any, Dict, Optional, Tuple, List
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# -------------- Utils HTTP --------------

def http(method: str, url: str, headers: Dict[str, str] | None = None, data: Any | None = None, timeout: float = 20.0) -> Tuple[int, Dict[str, str], bytes]:
    req = Request(url, method=method.upper())
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data is not None:
        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        elif isinstance(data, (bytes, bytearray)):
            body = data
        else:
            body = str(data).encode("utf-8")
        return _do(req, body, timeout)
    return _do(req, None, timeout)

def _do(req: Request, body: Optional[bytes], timeout: float):
    try:
        with urlopen(req, body, timeout=timeout) as r:
            status = r.status
            headers = {k.lower(): v for k, v in r.headers.items()}
            payload = r.read()
            return status, headers, payload
    except HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()} if e.headers else {}, e.read() or b""
    except URLError as e:
        return 0, {}, str(e).encode("utf-8")

# -------------- Reporter --------------

class Reporter:
    def __init__(self, path: str):
        self.path = path
        self.ok = 0
        self.warn = 0
        self.fail = 0
        self.lines: List[str] = []

    def h1(self, t: str):
        self.lines += [f"# {t}\n"]

    def h2(self, t: str):
        self.lines += [f"\n## {t}\n"]

    def kv(self, k: str, v: str):
        self.lines += [f"- **{k}**: {v}\n"]

    def code(self, lang: str, content: str):
        self.lines += [f"\n```{lang}\n{content}\n```\n"]

    def pass_(self, msg: str):
        self.ok += 1
        self.lines += [f"- ✅ {msg}\n"]

    def warn_(self, msg: str):
        self.warn += 1
        self.lines += [f"- ⚠️  {msg}\n"]

    def fail_(self, msg: str):
        self.fail += 1
        self.lines += [f"- ❌ {msg}\n"]

    def hr(self):
        self.lines += ["\n---\n\n"]

    def write(self):
        self.h2("Résumé")
        self.lines += [f"\n- ✅ OK: {self.ok}\n- ⚠️  WARN: {self.warn}\n- ❌ FAIL: {self.fail}\n"]
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("".join(self.lines))

# -------------- OpenAPI helpers --------------

def get_openapi(hub: str, rep: Reporter) -> Optional[dict]:
    s, _, b = http("GET", urljoin(hub, "/openapi.json"))
    if s == 200:
        try:
            doc = json.loads(b.decode("utf-8"))
            rep.pass_("openapi.json accessible")
            return doc
        except Exception as e:
            rep.fail_(f"openapi.json invalide: {e}")
            rep.code("json", b.decode("utf-8", "ignore"))
            return None
    rep.fail_(f"openapi.json HTTP {s}")
    rep.code("text", b.decode("utf-8", "ignore"))
    return None

def discover_paths(doc: dict, regex_terms: List[str]) -> List[str]:
    paths = doc.get("paths", {})
    out = []
    for p in paths.keys():
        if any(term.lower() in p.lower() for term in regex_terms):
            out.append(p)
    return out

def get_request_schema(doc: dict, path: str, method: str = "post") -> Optional[dict]:
    node = (doc.get("paths", {}).get(path, {}) or {}).get(method.lower())
    if not node:
        return None
    rb = (node.get("requestBody", {}) or {}).get("content", {}).get("application/json", {})
    schema = rb.get("schema")
    if not schema:
        return None
    if "$ref" in schema:
        ref = schema["$ref"]
        if ref.startswith("#/components/schemas/"):
            name = ref.split("/")[-1]
            return (doc.get("components", {}).get("schemas", {}) or {}).get(name)
    return schema

# -------------- Main checks --------------

DEFAULTS = {
    "ACTION_NAME": "analyse_cv_complete",
}

SCHEMA_SNAKE = {"user_id": str, "action_name": str}
SCHEMA_EXTRA = {"idempotency_key": str, "correlation_id": str, "source_app": str}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hub", default=os.environ.get("HUB"), help="Base URL Hub")
    ap.add_argument("--user-id", default=os.environ.get("USER_ID"), help="UUID test user")
    ap.add_argument("--auth", default=os.environ.get("AUTH"), help="Authorization header value (optional)")
    ap.add_argument("--action-name", default=os.environ.get("ACTION_NAME", DEFAULTS["ACTION_NAME"]))
    args = ap.parse_args()

    if not args.hub or not args.user_id:
        print("HUB et USER_ID requis", file=sys.stderr)
        sys.exit(2)

    rep = Reporter("claude_impl_validation.md")
    rep.h1("Phoenix Luna – Validation Implémentations (Claude)")
    rep.kv("Hub", args.hub)
    rep.kv("UserId", args.user_id)
    rep.kv("Action", args.action_name)
    rep.hr()

    headers = {"accept": "application/json"}
    if args.auth:
        headers["authorization"] = args.auth

    # 1) OpenAPI
    doc = get_openapi(args.hub, rep)
    if doc:
        paths = discover_paths(doc, ["energy", "event", "monitor", "cache"])
        rep.h2("Endpoints découverts (energy/events/monitor/cache)")
        rep.code("json", json.dumps(paths, indent=2, ensure_ascii=False))
    else:
        rep.write(); sys.exit(1)

    # 2) Smoke: health/ready/metrics
    def check_get(p: str, label: str):
        s, _, b = http("GET", urljoin(args.hub, p), headers)
        if s == 200:
            rep.pass_(f"{label} OK ({p})")
            return True, b
        elif s == 404:
            rep.warn_(f"{label} indisponible (404: {p})")
            return False, b
        else:
            rep.fail_(f"{label} HTTP {s} ({p})")
            rep.code("text", b.decode("utf-8", "ignore"))
            return False, b

    check_get("/monitoring/health", "Health")
    check_get("/monitoring/health/v2", "Health v2")
    check_get("/monitoring/ready", "Ready")

    metrics_candidates = [
        "/monitoring/metrics/current",
        "/monitoring/metrics/prometheus/v2",
        "/monitoring/metrics",
        "/metrics",
    ]
    metrics_hit = None
    metrics_sample = ""
    for p in metrics_candidates:
        ok, b = check_get(p, f"Metrics {p}")
        if ok and b:
            metrics_hit = p
            try:
                js = json.loads(b.decode("utf-8"))
                rep.code("json", json.dumps(js, indent=2))
                if any(k in js for k in ("latency_p95", "latency_p99", "error_rate")):
                    rep.pass_("Snapshot JSON contient des clés de latence/erreur")
                else:
                    rep.warn_("Snapshot JSON sans clés p95/p99/error_rate – utiliser Prometheus comme source")
            except Exception:
                # Probable exposition Prometheus texte
                metrics_sample = b.decode("utf-8", "ignore").splitlines()
                rep.code("text", "\n".join(metrics_sample[:30]))
            break

    if not metrics_hit:
        rep.warn_("Aucune route metrics accessible")

    rep.hr()

    # 3) Energy – can-perform & consume
    can_path = "/luna/energy/can-perform"
    schema = get_request_schema(doc, can_path, "post")
    rep.h2("Energy – can-perform & consume")
    if schema:
        rep.code("json", json.dumps(schema, indent=2, ensure_ascii=False))
    else:
        rep.warn_("Schéma requestBody non trouvé pour /luna/energy/can-perform")

    def post_json(path: str, payload: dict, label: str):
        s, h, b = http("POST", urljoin(args.hub, path), headers, payload)
        try:
            txt = b.decode("utf-8")
        except Exception:
            txt = str(b)
        rep.code("http", f"POST {path}\nstatus: {s}\n{txt}")
        return s, h, txt

    payload_min = {"user_id": args.user_id, "action_name": args.action_name}
    s, _, _ = post_json(can_path, payload_min, "can-perform (min)")
    if s == 200:
        rep.pass_("can-perform OK (snake_case)")
    elif s == 422:
        rep.fail_("can-perform 422 – vérifier noms de champs/required (ex: user_id, action_name)")
    elif s == 401:
        rep.warn_("can-perform 401 – besoin d'Authorization ? fournis --auth si nécessaire")
    else:
        rep.warn_(f"can-perform HTTP {s}")

    payload_full = {
        **payload_min,
        "idempotency_key": f"check-{int(time.time())}",
        "correlation_id": args.user_id,
        "source_app": "cv",
    }
    # consume
    s, _, _ = post_json("/luna/energy/consume", payload_full, "consume")
    if s == 200:
        rep.pass_("consume OK (snake_case)")
    elif s == 422:
        rep.fail_("consume 422 – vérifier champs snake_case et required")
    elif s == 401:
        rep.warn_("consume 401 – besoin d'Authorization ?")
    else:
        rep.warn_(f"consume HTTP {s}")

    # 4) Events – lire dernier
    rep.h2("Events – lecture dernier événement")
    s, _, b = http("GET", urljoin(args.hub, f"/luna/events/{args.user_id}"), headers)
    body = b.decode("utf-8", "ignore")
    try:
        js = json.loads(body)
        if isinstance(js, list) and js:
            rep.pass_("/luna/events renvoie un array – extraction dernier OK")
            rep.code("json", json.dumps(js[-1], indent=2, ensure_ascii=False))
        elif isinstance(js, dict) and "events" in js and isinstance(js["events"], list) and js["events"]:
            rep.pass_("/luna/events renvoie {events:[...]} – extraction dernier OK")
            rep.code("json", json.dumps(js["events"][-1], indent=2, ensure_ascii=False))
        else:
            rep.warn_("Structure d'événements non standard (ni array, ni {events:[]})")
            rep.code("json", json.dumps(js, indent=2, ensure_ascii=False))
    except Exception:
        rep.fail_("/luna/events réponse non‑JSON")
        rep.code("text", body)

    rep.hr()

    # 5) Rate Limiting – sur can-perform (route applicative)
    rep.h2("Rate Limiting – test rapide")
    codes: Dict[str, int] = {}
    for _ in range(80):
        s, _, _ = http("POST", urljoin(args.hub, can_path), headers, {
            **payload_min,
            "idempotency_key": f"rl-{uuid.uuid4()}"
        })
        codes[str(s)] = codes.get(str(s), 0) + 1
    rep.code("json", json.dumps(codes, indent=2))
    if codes.get("429", 0) > 0:
        rep.pass_("Rate limit actif (429 observés)")
    else:
        rep.warn_("Aucun 429 observé – soit seuils élevés, soit RL non appliqué à cette route")

    rep.hr()

    # Recommandations contractuelles (si besoin)
    rep.h2("Recommandations Contrat API (si écarts)")
    rep.lines += [
        "- Documenter explicitement le schéma snake_case {user_id, action_name, idempotency_key?, correlation_id?, source_app?} dans OpenAPI.\n",
        "- Normaliser la réponse /luna/events en array trié, ou exposer /luna/events/{user_id}/latest.\n",
        "- Si /monitoring/metrics/current ne contient pas p95/p99/error_rate, ajouter un endpoint JSON snapshot, tout en gardant Prometheus comme source.\n",
        "- (Optionnel) Mapper camelCase en interne pour backward‑compat, mais conserver snake_case comme contrat.\n",
    ]

    rep.write()
    # Exit code policy: fail>0 => non‑zero
    sys.exit(1 if rep.fail > 0 else 0)


if __name__ == "__main__":
    main()