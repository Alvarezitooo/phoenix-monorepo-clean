#!/usr/bin/env python3
"""
🔍 Beta Environment Check Script - Sprint 5
Validation complète de l'environnement Phoenix avant seeding
"""

import os
import sys
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

import requests
import stripe
import structlog
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Setup
console = Console()
logger = structlog.get_logger("beta_env_check")

# Configuration
HUB_URL = os.getenv("LUNA_HUB_URL", "http://localhost:8003")
CV_URL = os.getenv("PHOENIX_CV_URL", "http://localhost:8002")
LETTERS_URL = os.getenv("PHOENIX_LETTERS_URL", "http://localhost:8001")
WEBSITE_URL = os.getenv("PHOENIX_WEBSITE_URL", "http://localhost:3000")
JWT_ADMIN = os.getenv("LUNA_ADMIN_JWT")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

class EnvironmentCheck:
    """Classe pour les vérifications d'environnement"""
    
    def __init__(self):
        self.results: Dict[str, Dict[str, Any]] = {}
    
    def check_environment_variables(self) -> Dict[str, Any]:
        """Vérification des variables d'environnement"""
        required_vars = {
            "LUNA_HUB_URL": HUB_URL,
            "LUNA_ADMIN_JWT": JWT_ADMIN,
            "STRIPE_SECRET_KEY": STRIPE_SECRET_KEY,
        }
        
        optional_vars = {
            "PHOENIX_CV_URL": CV_URL,
            "PHOENIX_LETTERS_URL": LETTERS_URL,
            "PHOENIX_WEBSITE_URL": WEBSITE_URL,
            "SUPABASE_URL": os.getenv("SUPABASE_URL"),
            "SUPABASE_SERVICE_KEY": os.getenv("SUPABASE_SERVICE_KEY"),
        }
        
        results = {
            "status": "healthy",
            "required_missing": [],
            "optional_missing": [],
            "configured": {}
        }
        
        # Check required variables
        for var, value in required_vars.items():
            if not value:
                results["required_missing"].append(var)
                results["status"] = "unhealthy"
            else:
                # Mask sensitive values
                display_value = value
                if var in ["LUNA_ADMIN_JWT", "STRIPE_SECRET_KEY", "SUPABASE_SERVICE_KEY"]:
                    display_value = f"{value[:8]}..." if len(value) > 8 else "***"
                results["configured"][var] = display_value
        
        # Check optional variables
        for var, value in optional_vars.items():
            if not value:
                results["optional_missing"].append(var)
            else:
                display_value = value
                if "KEY" in var or "JWT" in var:
                    display_value = f"{value[:8]}..." if len(value) > 8 else "***"
                results["configured"][var] = display_value
        
        return results
    
    def check_service_health(self, service_name: str, url: str, timeout: int = 10) -> Dict[str, Any]:
        """Vérification de santé d'un service"""
        start_time = time.time()
        
        try:
            response = requests.get(f"{url}/health", timeout=timeout)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json() if response.content else {}
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "http_status": response.status_code,
                    "url": url,
                    "details": data
                }
            else:
                return {
                    "status": "degraded",
                    "response_time_ms": response_time,
                    "http_status": response.status_code,
                    "url": url,
                    "error": f"HTTP {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "status": "unhealthy",
                "response_time_ms": timeout * 1000,
                "url": url,
                "error": "Timeout"
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "unhealthy",
                "response_time_ms": (time.time() - start_time) * 1000,
                "url": url,
                "error": "Connection refused"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": (time.time() - start_time) * 1000,
                "url": url,
                "error": str(e)
            }
    
    def check_stripe_connection(self) -> Dict[str, Any]:
        """Vérification de la connexion Stripe"""
        if not STRIPE_SECRET_KEY:
            return {
                "status": "unhealthy",
                "error": "STRIPE_SECRET_KEY not configured"
            }
        
        try:
            stripe.api_key = STRIPE_SECRET_KEY
            
            # Simple test with account retrieval
            account = stripe.Account.retrieve()
            
            return {
                "status": "healthy",
                "account_id": account.id,
                "country": account.country,
                "currency": account.default_currency,
                "test_mode": STRIPE_SECRET_KEY.startswith("sk_test_")
            }
            
        except stripe.error.AuthenticationError:
            return {
                "status": "unhealthy",
                "error": "Invalid Stripe API key"
            }
        except stripe.error.StripeError as e:
            return {
                "status": "degraded",
                "error": f"Stripe error: {e}"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": f"Unexpected error: {e}"
            }
    
    def check_luna_hub_endpoints(self) -> Dict[str, Any]:
        """Vérification des endpoints critiques Luna Hub"""
        if not JWT_ADMIN:
            return {
                "status": "unhealthy",
                "error": "LUNA_ADMIN_JWT not configured"
            }
        
        headers = {
            "Authorization": f"Bearer {JWT_ADMIN}",
            "Content-Type": "application/json"
        }
        
        endpoints_to_check = [
            "/monitoring/ready",
            "/billing/health",
            "/billing/packs",
            "/luna/energy/can-perform",
            "/refund/check-eligibility",
        ]
        
        results = {
            "status": "healthy",
            "endpoints": {},
            "auth_valid": False
        }
        
        for endpoint in endpoints_to_check:
            try:
                if endpoint == "/luna/energy/can-perform":
                    # POST endpoint with test data
                    response = requests.post(
                        f"{HUB_URL}{endpoint}",
                        headers=headers,
                        json={"user_id": "test-user-id", "action_name": "test_action"},
                        timeout=5
                    )
                elif endpoint == "/refund/check-eligibility":
                    # POST endpoint with test data
                    response = requests.post(
                        f"{HUB_URL}{endpoint}",
                        headers=headers,
                        json={"user_id": "test-user-id", "action_event_id": "test-event-id"},
                        timeout=5
                    )
                else:
                    # GET endpoint
                    response = requests.get(f"{HUB_URL}{endpoint}", headers=headers, timeout=5)
                
                if response.status_code in [200, 400, 422]:  # 400/422 OK for test data
                    results["endpoints"][endpoint] = {
                        "status": "healthy",
                        "http_status": response.status_code
                    }
                    if response.status_code != 401:  # Not auth error
                        results["auth_valid"] = True
                elif response.status_code == 401:
                    results["endpoints"][endpoint] = {
                        "status": "auth_error",
                        "http_status": response.status_code
                    }
                    results["status"] = "degraded"
                else:
                    results["endpoints"][endpoint] = {
                        "status": "degraded",
                        "http_status": response.status_code
                    }
                    
            except Exception as e:
                results["endpoints"][endpoint] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                results["status"] = "degraded"
        
        return results
    
    def run_all_checks(self) -> Dict[str, Dict[str, Any]]:
        """Exécuter toutes les vérifications"""
        checks = [
            ("Environment Variables", self.check_environment_variables),
            ("Luna Hub", lambda: self.check_service_health("Luna Hub", HUB_URL)),
            ("Phoenix CV", lambda: self.check_service_health("Phoenix CV", CV_URL)),
            ("Phoenix Letters", lambda: self.check_service_health("Phoenix Letters", LETTERS_URL)),
            ("Phoenix Website", lambda: self.check_service_health("Phoenix Website", WEBSITE_URL)),
            ("Stripe Connection", self.check_stripe_connection),
            ("Luna Hub Endpoints", self.check_luna_hub_endpoints),
        ]
        
        results = {}
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            
            for check_name, check_func in checks:
                task = progress.add_task(f"Checking {check_name}...", total=1)
                
                try:
                    result = check_func()
                    results[check_name] = result
                    
                    status_emoji = {
                        "healthy": "✅",
                        "degraded": "⚠️",
                        "unhealthy": "❌"
                    }.get(result.get("status", "unknown"), "❓")
                    
                    progress.update(task, description=f"{status_emoji} {check_name}")
                    
                except Exception as e:
                    results[check_name] = {
                        "status": "unhealthy",
                        "error": f"Check failed: {e}"
                    }
                    progress.update(task, description=f"❌ {check_name}")
                
                progress.advance(task)
                time.sleep(0.1)  # Small delay for UX
        
        return results

def display_results(results: Dict[str, Dict[str, Any]]):
    """Afficher les résultats de manière lisible"""
    
    # Summary table
    table = Table(title="🔍 Phoenix Environment Check Results")
    table.add_column("Component", style="cyan", no_wrap=True)
    table.add_column("Status", justify="center")
    table.add_column("Details", style="dim")
    
    overall_status = "healthy"
    
    for check_name, result in results.items():
        status = result.get("status", "unknown")
        
        # Update overall status
        if status == "unhealthy":
            overall_status = "unhealthy"
        elif status == "degraded" and overall_status == "healthy":
            overall_status = "degraded"
        
        # Status emoji and color
        status_display = {
            "healthy": "✅ Healthy",
            "degraded": "⚠️ Degraded", 
            "unhealthy": "❌ Unhealthy",
            "unknown": "❓ Unknown"
        }.get(status, f"❓ {status}")
        
        # Details
        details = []
        if "response_time_ms" in result:
            details.append(f"{result['response_time_ms']:.0f}ms")
        if "http_status" in result:
            details.append(f"HTTP {result['http_status']}")
        if "error" in result:
            details.append(f"Error: {result['error']}")
        if "account_id" in result:
            details.append(f"Account: {result['account_id']}")
        if "test_mode" in result:
            details.append("Test Mode" if result["test_mode"] else "Live Mode")
        
        table.add_row(check_name, status_display, " | ".join(details))
    
    console.print()
    console.print(table)
    
    # Overall status panel
    status_color = {
        "healthy": "green",
        "degraded": "yellow", 
        "unhealthy": "red"
    }.get(overall_status, "white")
    
    status_message = {
        "healthy": "🎉 Environment is ready for beta seeding!",
        "degraded": "⚠️ Environment has some issues but may work with limitations",
        "unhealthy": "❌ Environment is not ready. Please fix critical issues."
    }.get(overall_status, "❓ Environment status unclear")
    
    console.print()
    console.print(Panel(status_message, style=status_color, title=f"Overall Status: {overall_status.upper()}"))
    
    # Specific recommendations
    if overall_status != "healthy":
        console.print()
        console.print("[bold]🔧 Recommendations:[/bold]")
        
        for check_name, result in results.items():
            if result.get("status") != "healthy":
                console.print(f"• [red]{check_name}[/red]: {result.get('error', 'Check the details above')}")
        
        if results.get("Environment Variables", {}).get("required_missing"):
            console.print(f"• Set required environment variables: {', '.join(results['Environment Variables']['required_missing'])}")
        
        if results.get("Stripe Connection", {}).get("status") != "healthy":
            console.print("• Verify STRIPE_SECRET_KEY is correct and has proper permissions")
        
        if results.get("Luna Hub Endpoints", {}).get("auth_valid") is False:
            console.print("• Verify LUNA_ADMIN_JWT is valid and has admin permissions")

def main():
    """Main function"""
    console.print(Panel("🚀 Phoenix Beta Environment Check", style="bold blue"))
    console.print()
    console.print(f"[bold]Configuration:[/bold]")
    console.print(f"• Luna Hub: [cyan]{HUB_URL}[/cyan]")
    console.print(f"• Phoenix CV: [cyan]{CV_URL}[/cyan]")
    console.print(f"• Phoenix Letters: [cyan]{LETTERS_URL}[/cyan]")
    console.print(f"• Phoenix Website: [cyan]{WEBSITE_URL}[/cyan]")
    console.print()
    
    checker = EnvironmentCheck()
    results = checker.run_all_checks()
    
    display_results(results)
    
    # Exit code based on overall status
    overall_healthy = all(r.get("status") in ["healthy", "degraded"] for r in results.values())
    if not overall_healthy:
        console.print()
        console.print("[red bold]❌ Environment check failed. Fix issues before running beta seeding.[/red bold]")
        sys.exit(1)
    else:
        console.print()
        console.print("[green bold]✅ Environment check passed. Ready for beta seeding![/green bold]")
        console.print()
        console.print("[bold]Next steps:[/bold]")
        console.print("1. Run: [cyan]python scripts/beta_seed.py --csv your_users.csv[/cyan]")
        console.print("2. Or create single user: [cyan]python scripts/beta_seed.py --email beta@example.com[/cyan]")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n⚠️ Check interrupted by user")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)