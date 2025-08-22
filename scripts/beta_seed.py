#!/usr/bin/env python3
"""
🚀 Sprint 5 - Beta Seeding Script
Création cohorte beta + crédit Café Luna via Stripe test
"""

from __future__ import annotations
import csv
import os
import sys
import time
import uuid
import argparse
from typing import Tuple, Dict, Any, List
from datetime import datetime, timezone

import requests
import stripe
import structlog

# Configuration logger
logger = structlog.get_logger("beta_seed")

# === Configuration ===
HUB_URL = os.getenv("LUNA_HUB_URL", "http://localhost:8003")
JWT_ADMIN = os.getenv("LUNA_ADMIN_JWT")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_TEST_CARD = "pm_card_visa"  # Test card Stripe

if not JWT_ADMIN:
    print("❌ Missing LUNA_ADMIN_JWT environment variable")
    sys.exit(1)

if not STRIPE_SECRET_KEY or not STRIPE_SECRET_KEY.startswith("sk_test"):
    print("❌ Missing or invalid STRIPE_SECRET_KEY (must be test key)")
    sys.exit(1)

# Initialize Stripe
stripe.api_key = STRIPE_SECRET_KEY

# Headers for API calls
def get_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {JWT_ADMIN}",
        "Content-Type": "application/json",
        "X-Request-ID": str(uuid.uuid4()),
        "X-Correlation-ID": str(uuid.uuid4())
    }

class BetaSeedError(Exception):
    """Error during beta seeding process"""
    pass

# === User Management ===
def ensure_user(email: str, name: str = None) -> str:
    """
    Ensure user exists in system
    Returns user_id
    """
    logger.info("Creating user", email=email)
    
    # For demo purposes, generate UUID - replace with your auth system
    if os.getenv("DEMO_MODE") == "true":
        # Generate deterministic UUID from email for consistency
        import hashlib
        hash_object = hashlib.md5(email.encode())
        user_uuid = str(uuid.UUID(hash_object.hexdigest()))
        logger.info("Demo user created", user_id=user_uuid, email=email)
        return user_uuid
    
    # Real implementation would call your auth API
    try:
        response = requests.post(
            f"{HUB_URL}/auth/register",
            headers=get_headers(),
            json={
                "email": email,
                "name": name or email.split("@")[0],
                "password": "ChangeMe!123",
                "beta_user": True
            }
        )
        response.raise_for_status()
        
        data = response.json()
        user_id = data.get("user_id") or data.get("id")
        
        if not user_id:
            raise BetaSeedError("Registration did not return user_id")
            
        logger.info("User registered", user_id=user_id, email=email)
        return user_id
        
    except requests.RequestException as e:
        raise BetaSeedError(f"Failed to register user {email}: {e}")

# === Stripe Integration ===
def create_test_payment(user_id: str, pack: str = "cafe_luna") -> Tuple[str, Dict[str, Any]]:
    """
    Create and confirm test Stripe payment
    Returns (intent_id, stripe_response)
    """
    logger.info("Creating Stripe test payment", user_id=user_id, pack=pack)
    
    try:
        # Create PaymentIntent with test card
        intent = stripe.PaymentIntent.create(
            amount=299,  # €2.99 for cafe_luna
            currency="eur",
            payment_method_types=["card"],
            payment_method=STRIPE_TEST_CARD,
            confirm=True,
            metadata={
                "user_id": user_id,
                "pack": pack,
                "energy_units": "100",
                "beta_seeding": "true",
                "created_by": "beta_seed_script"
            },
            description=f"Luna Energy Pack: {pack} (Beta Seeding)",
        )
        
        logger.info("Stripe payment created", 
                   intent_id=intent.id, 
                   status=intent.status,
                   amount=intent.amount)
        
        return intent.id, intent
        
    except stripe.error.StripeError as e:
        raise BetaSeedError(f"Stripe payment failed for user {user_id}: {e}")

# === Luna Hub Integration ===
def confirm_luna_payment(user_id: str, intent_id: str) -> Dict[str, Any]:
    """
    Confirm payment with Luna Hub to credit energy
    Returns confirmation response
    """
    logger.info("Confirming payment with Luna Hub", 
               user_id=user_id, 
               intent_id=intent_id)
    
    try:
        response = requests.post(
            f"{HUB_URL}/billing/confirm-payment",
            headers=get_headers(),
            json={
                "user_id": user_id,
                "intent_id": intent_id
            }
        )
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get("success"):
            raise BetaSeedError(f"Luna Hub payment confirmation failed: {data}")
            
        logger.info("Payment confirmed", 
                   event_id=data.get("event_id"),
                   energy_credited=data.get("energy_credited"),
                   new_balance=data.get("new_energy_balance"))
        
        return data
        
    except requests.RequestException as e:
        raise BetaSeedError(f"Failed to confirm payment with Luna Hub: {e}")

# === Validation ===
def verify_energy_credited(user_id: str, expected_energy: int = 110) -> bool:
    """
    Verify that energy was properly credited via narrative API
    """
    logger.info("Verifying energy credit", user_id=user_id)
    
    max_retries = 5
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            response = requests.get(
                f"{HUB_URL}/luna/narrative/{user_id}",
                headers=get_headers()
            )
            
            if response.status_code == 200:
                narrative = response.json()
                
                # Look for EnergyPurchased events
                events = narrative.get("events", []) or narrative.get("data", [])
                
                for event in events:
                    event_type = event.get("type") or event.get("event_type")
                    if event_type == "EnergyPurchased":
                        energy_units = event.get("event_data", {}).get("energy_units", 0)
                        if energy_units >= expected_energy:
                            logger.info("Energy credit verified", 
                                       user_id=user_id,
                                       energy_units=energy_units)
                            return True
                            
            if attempt < max_retries - 1:
                logger.info("Energy not yet visible, retrying", 
                           attempt=attempt + 1,
                           max_retries=max_retries)
                time.sleep(retry_delay)
                
        except Exception as e:
            logger.warning("Error verifying energy", error=str(e))
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
    
    logger.error("Energy credit verification failed", user_id=user_id)
    return False

# === Main Functions ===
def seed_single_user(email: str, name: str = None) -> Dict[str, Any]:
    """
    Seed a single beta user
    Returns seeding result
    """
    start_time = datetime.now(timezone.utc)
    
    try:
        # Step 1: Ensure user exists
        user_id = ensure_user(email, name)
        
        # Step 2: Create Stripe payment
        intent_id, stripe_response = create_test_payment(user_id)
        
        # Step 3: Confirm with Luna Hub
        confirmation = confirm_luna_payment(user_id, intent_id)
        
        # Step 4: Verify energy was credited
        energy_verified = verify_energy_credited(user_id)
        
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        result = {
            "email": email,
            "user_id": user_id,
            "intent_id": intent_id,
            "event_id": confirmation.get("event_id"),
            "energy_credited": confirmation.get("energy_credited"),
            "new_balance": confirmation.get("new_energy_balance"),
            "energy_verified": energy_verified,
            "duration_seconds": duration,
            "status": "success" if energy_verified else "partial"
        }
        
        logger.info("User seeding completed", **result)
        return result
        
    except Exception as e:
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        
        result = {
            "email": email,
            "error": str(e),
            "duration_seconds": duration,
            "status": "failed"
        }
        
        logger.error("User seeding failed", **result)
        return result

def seed_from_csv(csv_file: str, delay: float = 0.5) -> List[Dict[str, Any]]:
    """
    Seed multiple users from CSV file
    CSV format: email,name (name is optional)
    """
    results = []
    
    try:
        with open(csv_file, 'r', newline='') as f:
            reader = csv.DictReader(f)
            
            for i, row in enumerate(reader, 1):
                email = row.get("email", "").strip()
                name = row.get("name", "").strip() or None
                
                if not email:
                    logger.warning("Skipping row with empty email", row_number=i)
                    continue
                
                logger.info("Processing user", 
                           row_number=i,
                           email=email)
                
                result = seed_single_user(email, name)
                results.append(result)
                
                if delay > 0:
                    time.sleep(delay)
                    
        return results
        
    except FileNotFoundError:
        raise BetaSeedError(f"CSV file not found: {csv_file}")
    except Exception as e:
        raise BetaSeedError(f"Error reading CSV file: {e}")

def print_summary(results: List[Dict[str, Any]]):
    """Print seeding summary"""
    total = len(results)
    successful = len([r for r in results if r.get("status") == "success"])
    partial = len([r for r in results if r.get("status") == "partial"])
    failed = len([r for r in results if r.get("status") == "failed"])
    
    total_energy = sum(r.get("energy_credited", 0) for r in results if r.get("energy_credited"))
    avg_duration = sum(r.get("duration_seconds", 0) for r in results) / total if total > 0 else 0
    
    print("\n" + "="*60)
    print("🎉 BETA SEEDING SUMMARY")
    print("="*60)
    print(f"📊 Total users processed: {total}")
    print(f"✅ Successful: {successful}")
    print(f"⚠️  Partial: {partial}")
    print(f"❌ Failed: {failed}")
    print(f"⚡ Total energy credited: {total_energy}")
    print(f"⏱️  Average duration: {avg_duration:.2f}s")
    print("="*60)
    
    if failed > 0:
        print("\n❌ FAILED USERS:")
        for result in results:
            if result.get("status") == "failed":
                print(f"  • {result['email']}: {result.get('error', 'Unknown error')}")
    
    if successful > 0:
        print(f"\n🎉 {successful} users successfully seeded with Café Luna!")
        print("Users can now:")
        print("  • Access Phoenix CV with 110 energy units")
        print("  • Use Phoenix Letters with Luna Hub integration")
        print("  • Experience billing and refund systems")

# === CLI Interface ===
def main():
    parser = argparse.ArgumentParser(description="🚀 Beta Seeding Script for Phoenix Ecosystem")
    parser.add_argument("--csv", help="CSV file with user data (email,name)")
    parser.add_argument("--email", help="Single email to seed")
    parser.add_argument("--name", help="Name for single email (optional)")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between users (seconds)")
    parser.add_argument("--demo", action="store_true", help="Demo mode (generates UUIDs without API calls)")
    
    args = parser.parse_args()
    
    if args.demo:
        os.environ["DEMO_MODE"] = "true"
        print("🚧 Running in DEMO MODE")
    
    print("🚀 Starting Phoenix Beta Seeding...")
    print(f"🔗 Luna Hub: {HUB_URL}")
    print(f"💳 Stripe: {'Test Mode' if STRIPE_SECRET_KEY.startswith('sk_test') else 'Live Mode'}")
    
    results = []
    
    try:
        if args.csv:
            print(f"📄 Processing CSV file: {args.csv}")
            results = seed_from_csv(args.csv, args.delay)
            
        elif args.email:
            print(f"👤 Processing single user: {args.email}")
            result = seed_single_user(args.email, args.name)
            results = [result]
            
        else:
            # Default: create sample CSV
            sample_csv = "beta_users_sample.csv"
            with open(sample_csv, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["email", "name"])
                writer.writerow(["beta1@phoenix.dev", "Beta User 1"])
                writer.writerow(["beta2@phoenix.dev", "Beta User 2"])
                writer.writerow(["beta3@phoenix.dev", "Beta User 3"])
            
            print(f"📝 Created sample CSV: {sample_csv}")
            print("Edit the CSV file and run: python beta_seed.py --csv beta_users_sample.csv")
            return
        
        print_summary(results)
        
    except KeyboardInterrupt:
        print("\n⚠️ Seeding interrupted by user")
    except BetaSeedError as e:
        print(f"\n❌ Seeding failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()