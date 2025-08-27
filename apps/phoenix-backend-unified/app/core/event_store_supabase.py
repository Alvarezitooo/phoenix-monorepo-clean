from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Any, Dict, List
from datetime import datetime, timedelta

try:
    from supabase import create_client, Client  # pip install supabase
except Exception:  # pragma: no cover
    Client = object
    def create_client(*a, **kw):
        raise RuntimeError("Supabase SDK not installed")

@dataclass
class Event:
    type: str
    user_id: str
    ts: str
    data: Dict[str, Any]

class SupabaseEventStore:
    def __init__(self, url: str | None = None, key: str | None = None, table: str = "events"):
        self.url = url or os.getenv("SUPABASE_URL")
        self.key = key or os.getenv("SUPABASE_ANON_KEY")
        if not self.url or not self.key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_ANON_KEY manquants")
        self.client: Client = create_client(self.url, self.key)
        self.table = table

    def insert_event(self, evt: Dict[str, Any]) -> Event:
        # PII masking minimal — à renforcer selon vos champs
        data = evt.get("data", {})
        masked = _mask_pii_dict(data)
        payload = {
            "type": evt["type"],
            "user_id": evt["user_id"],
            "ts": evt.get("ts") or datetime.utcnow().isoformat() + "Z",
            "data": masked,
        }
        self.client.table(self.table).insert(payload).execute()
        return Event(**payload)

    def fetch_user_events(self, user_id: str, window: str = "14d") -> List[Event]:
        now = datetime.utcnow()
        delta = timedelta(days=int(window.replace("d",""))) if window.endswith("d") else timedelta(days=14)
        since = (now - delta).isoformat() + "Z"
        res = self.client.table(self.table).select("type,user_id,ts,data").eq("user_id", user_id).gte("ts", since).order("ts").execute()
        rows = res.data or []
        return [Event(**r) for r in rows]

def _mask_pii_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    MASK_KEYS = {"email", "phone", "address", "name"}
    out = {}
    for k, v in d.items():
        if k in MASK_KEYS and isinstance(v, str):
            out[k] = v[:2] + "***"  # masque simple
        else:
            out[k] = v
    return out