"""
🏗️ Luna Infrastructure - Microservices Communication
Phoenix Production

Infrastructure pour communication inter-services Luna.
Réutilise Redis/Supabase existants pour éviter nouvelle complexité.
"""

__all__ = [
    'MessageBroker',
    'ServiceDiscovery', 
    'InterServiceAuth'
]