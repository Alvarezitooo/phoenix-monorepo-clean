#!/usr/bin/env python3
"""
🔐 Générateur JWT Admin pour Beta Seeding
Créé un token admin pour les scripts beta_seed.py
"""

import os
import jwt
import sys
from datetime import datetime, timezone, timedelta

# Configuration JWT (même que Luna Hub)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

if not JWT_SECRET_KEY:
    print("❌ Missing JWT_SECRET_KEY environment variable")
    print("💡 Get it from Railway Luna Hub variables")
    sys.exit(1)

def generate_admin_jwt(duration_hours: int = 24) -> str:
    """Génère un JWT admin avec permissions étendues"""
    
    payload = {
        "sub": "admin-founder",
        "email": "admin@phoenix.ai", 
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=duration_hours),
        "type": "admin_token",
        "permissions": [
            "admin:all",
            "billing:admin", 
            "users:admin",
            "energy:admin",
            "beta:seeding"
        ],
        "luna_energy": -1,  # Unlimited
        "is_admin": True,
        "is_founder": True,
        "scope": "admin beta_seeding"
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

if __name__ == "__main__":
    print("🔐 Generating LUNA_ADMIN_JWT...")
    
    try:
        admin_token = generate_admin_jwt(duration_hours=48)  # 2 jours
        
        print("\n✅ JWT Admin généré avec succès!")
        print(f"\n📋 Export this:")
        print(f"export LUNA_ADMIN_JWT=\"{admin_token}\"")
        print(f"\n🔒 Token valide 48h")
        print(f"🎯 Permissions: admin:all, billing:admin, beta:seeding")
        
    except Exception as e:
        print(f"❌ Erreur génération JWT: {e}")
        sys.exit(1)