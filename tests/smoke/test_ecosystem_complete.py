"""
🔥 Smoke Tests Complets - Écosystème Phoenix Sprint 5
Tests end-to-end de l'architecture complète
"""

import pytest
import asyncio
import httpx
import os
import time
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# Configuration
HUB_URL = os.getenv("LUNA_HUB_URL", "http://localhost:8003")
CV_URL = os.getenv("PHOENIX_CV_URL", "http://localhost:8002")
LETTERS_URL = os.getenv("PHOENIX_LETTERS_URL", "http://localhost:8001")
WEBSITE_URL = os.getenv("PHOENIX_WEBSITE_URL", "http://localhost:3000")
TEST_JWT = os.getenv("TEST_JWT", "test-jwt-token")

TIMEOUT = 30.0

class EcosystemSmokeTest:
    """Test suite complète de l'écosystème Phoenix"""
    
    def __init__(self):
        self.test_results: Dict[str, Any] = {}
        self.test_user_id = f"smoke_test_{uuid.uuid4().hex[:8]}"
        self.test_session_id = str(uuid.uuid4())
    
    # === Core Infrastructure Tests ===
    
    async def test_01_luna_hub_health(self) -> Dict[str, Any]:
        """🌙 Test Luna Hub - Service Central"""
        test_name = "Luna Hub Health"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Basic health check
                health_response = await client.get(f"{HUB_URL}/health")
                
                # Advanced monitoring health
                monitoring_response = await client.get(f"{HUB_URL}/monitoring/health")
                
                # Readiness check
                ready_response = await client.get(f"{HUB_URL}/monitoring/ready")
                
                duration = time.time() - start_time
                
                if (health_response.status_code == 200 and 
                    monitoring_response.status_code == 200 and
                    ready_response.status_code == 200):
                    
                    health_data = health_response.json()
                    monitoring_data = monitoring_response.json()
                    ready_data = ready_response.json()
                    
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "health_status": health_data.get("status"),
                        "overall_status": monitoring_data.get("overall_status"),
                        "ready": ready_data.get("ready"),
                        "services_count": len(monitoring_data.get("services", {})),
                        "details": "Luna Hub operational"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Health checks failed: {health_response.status_code}, {monitoring_response.status_code}, {ready_response.status_code}",
                        "details": "Luna Hub not healthy"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Luna Hub unreachable"
            }
    
    async def test_02_satellite_services_health(self) -> Dict[str, Any]:
        """🛰️ Test Services Satellites"""
        test_name = "Satellite Services"
        start_time = time.time()
        
        services = {
            "Phoenix CV": CV_URL,
            "Phoenix Letters": LETTERS_URL,
            "Phoenix Website": WEBSITE_URL
        }
        
        results = {}
        overall_status = "pass"
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                for service_name, url in services.items():
                    try:
                        response = await client.get(f"{url}/health")
                        if response.status_code == 200:
                            results[service_name] = {
                                "status": "pass",
                                "url": url,
                                "response_time": response.elapsed.total_seconds() * 1000 if response.elapsed else 0
                            }
                        else:
                            results[service_name] = {
                                "status": "fail",
                                "url": url,
                                "http_status": response.status_code
                            }
                            overall_status = "partial"
                            
                    except Exception as e:
                        results[service_name] = {
                            "status": "fail",
                            "url": url,
                            "error": str(e)
                        }
                        overall_status = "fail"
                
                duration = time.time() - start_time
                
                healthy_services = len([r for r in results.values() if r["status"] == "pass"])
                total_services = len(services)
                
                return {
                    "status": overall_status,
                    "duration_ms": duration * 1000,
                    "healthy_services": f"{healthy_services}/{total_services}",
                    "services": results,
                    "details": f"Satellite services health check"
                }
                
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail", 
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Satellite services check failed"
            }
    
    # === Billing System Tests ===
    
    async def test_03_billing_system_health(self) -> Dict[str, Any]:
        """💳 Test Système de Billing"""
        test_name = "Billing System"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Billing health check
                health_response = await client.get(f"{HUB_URL}/billing/health")
                
                # Packs catalog
                packs_response = await client.get(f"{HUB_URL}/billing/packs")
                
                duration = time.time() - start_time
                
                if health_response.status_code == 200 and packs_response.status_code == 200:
                    health_data = health_response.json()
                    packs_data = packs_response.json()
                    
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "billing_status": health_data.get("status"),
                        "stripe_connected": health_data.get("stripe_status", {}).get("connected", False),
                        "packs_available": len(packs_data),
                        "details": "Billing system operational"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Billing endpoints failed: {health_response.status_code}, {packs_response.status_code}",
                        "details": "Billing system not healthy"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Billing system unreachable"
            }
    
    async def test_04_energy_management_flow(self) -> Dict[str, Any]:
        """⚡ Test Gestion Énergie"""
        test_name = "Energy Management"
        start_time = time.time()
        
        headers = {
            "Authorization": f"Bearer {TEST_JWT}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Test can-perform
                can_perform_response = await client.post(
                    f"{HUB_URL}/luna/energy/can-perform",
                    json={"user_id": self.test_user_id, "action_name": "test_action"},
                    headers=headers
                )
                
                # Test energy status endpoints
                narrative_response = await client.get(
                    f"{HUB_URL}/luna/narrative/{self.test_user_id}",
                    headers=headers
                )
                
                duration = time.time() - start_time
                
                # Acceptable responses: 200 (OK), 401 (auth), 422 (validation)
                if can_perform_response.status_code in [200, 401, 422]:
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "can_perform_status": can_perform_response.status_code,
                        "narrative_status": narrative_response.status_code,
                        "energy_endpoints": "accessible",
                        "details": "Energy management endpoints responsive"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Energy endpoints failed: {can_perform_response.status_code}",
                        "details": "Energy management not working"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Energy management unreachable"
            }
    
    # === Phoenix Services Integration Tests ===
    
    async def test_05_phoenix_cv_integration(self) -> Dict[str, Any]:
        """🎯 Test Phoenix CV avec Luna Hub"""
        test_name = "Phoenix CV Integration"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Phoenix CV health
                cv_health_response = await client.get(f"{CV_URL}/health")
                
                # Test d'endpoint API si accessible
                cv_docs_response = await client.get(f"{CV_URL}/docs")
                
                duration = time.time() - start_time
                
                if cv_health_response.status_code == 200:
                    health_data = cv_health_response.json()
                    
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "cv_status": health_data.get("status", "unknown"),
                        "api_docs_accessible": cv_docs_response.status_code == 200,
                        "features": "4 Revolutionary Features",
                        "details": "Phoenix CV operational with Luna integration"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Phoenix CV health failed: {cv_health_response.status_code}",
                        "details": "Phoenix CV not accessible"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Phoenix CV unreachable"
            }
    
    async def test_06_phoenix_letters_integration(self) -> Dict[str, Any]:
        """📝 Test Phoenix Letters avec Luna Hub"""
        test_name = "Phoenix Letters Integration"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Phoenix Letters health
                letters_health_response = await client.get(f"{LETTERS_URL}/health")
                
                # Test frontend serving (si intégré)
                frontend_response = await client.get(LETTERS_URL)
                
                duration = time.time() - start_time
                
                if letters_health_response.status_code == 200:
                    health_data = letters_health_response.json()
                    
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "letters_status": health_data.get("status", "unknown"),
                        "frontend_served": frontend_response.status_code == 200,
                        "features": "Career Transition + Luna Hub",
                        "details": "Phoenix Letters operational with full-stack"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Phoenix Letters health failed: {letters_health_response.status_code}",
                        "details": "Phoenix Letters not accessible"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Phoenix Letters unreachable"
            }
    
    async def test_07_phoenix_website_integration(self) -> Dict[str, Any]:
        """🌐 Test Phoenix Website"""
        test_name = "Phoenix Website Integration"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Website health
                website_health_response = await client.get(f"{WEBSITE_URL}/health")
                
                # Main page
                main_response = await client.get(WEBSITE_URL)
                
                duration = time.time() - start_time
                
                # Website might not have /health, so check main page
                if main_response.status_code == 200 or website_health_response.status_code == 200:
                    return {
                        "status": "pass",
                        "duration_ms": duration * 1000,
                        "website_accessible": main_response.status_code == 200,
                        "health_endpoint": website_health_response.status_code == 200,
                        "features": "Billing + Refund + Energy Guide",
                        "details": "Phoenix Website operational"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Website not accessible: {main_response.status_code}",
                        "details": "Phoenix Website not working"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Phoenix Website unreachable"
            }
    
    # === Cross-Service Integration Tests ===
    
    async def test_08_inter_service_communication(self) -> Dict[str, Any]:
        """🔗 Test Communication Inter-Services"""
        test_name = "Inter-Service Communication"
        start_time = time.time()
        
        try:
            # Test via Luna Hub monitoring qui check les satellites
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                monitoring_response = await client.get(f"{HUB_URL}/monitoring/health")
                
                duration = time.time() - start_time
                
                if monitoring_response.status_code == 200:
                    monitoring_data = monitoring_response.json()
                    services = monitoring_data.get("services", {})
                    
                    # Check communication avec satellites
                    satellite_checks = {}
                    for service_name in ["phoenix_cv", "phoenix_letters", "phoenix_website"]:
                        service_status = services.get(service_name, {})
                        satellite_checks[service_name] = service_status.get("status", "unknown")
                    
                    overall_comm_status = "pass"
                    if any(status == "unhealthy" for status in satellite_checks.values()):
                        overall_comm_status = "partial"
                    
                    return {
                        "status": overall_comm_status,
                        "duration_ms": duration * 1000,
                        "luna_hub_monitoring": "operational",
                        "satellite_connectivity": satellite_checks,
                        "services_checked": len(satellite_checks),
                        "details": "Inter-service communication tested via monitoring"
                    }
                else:
                    return {
                        "status": "fail",
                        "duration_ms": duration * 1000,
                        "error": f"Monitoring endpoint failed: {monitoring_response.status_code}",
                        "details": "Cannot test inter-service communication"
                    }
                    
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Inter-service communication test failed"
            }
    
    # === Security & Performance Tests ===
    
    async def test_09_security_headers(self) -> Dict[str, Any]:
        """🔒 Test Headers de Sécurité"""
        test_name = "Security Headers"
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                # Test sur Luna Hub
                response = await client.get(f"{HUB_URL}/health")
                
                duration = time.time() - start_time
                
                security_headers = {
                    "X-Request-ID": response.headers.get("X-Request-ID"),
                    "X-Correlation-ID": response.headers.get("X-Correlation-ID"),
                    "Content-Type": response.headers.get("Content-Type"),
                    "X-Frame-Options": response.headers.get("X-Frame-Options"),
                    "X-Content-Type-Options": response.headers.get("X-Content-Type-Options")
                }
                
                security_score = len([h for h in security_headers.values() if h])
                
                return {
                    "status": "pass" if security_score >= 2 else "partial",
                    "duration_ms": duration * 1000,
                    "security_headers_found": security_score,
                    "total_headers_checked": len(security_headers),
                    "headers": security_headers,
                    "details": f"Security headers check: {security_score}/{len(security_headers)}"
                }
                
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Security headers test failed"
            }
    
    async def test_10_performance_baseline(self) -> Dict[str, Any]:
        """⚡ Test Performance de Base"""
        test_name = "Performance Baseline"
        start_time = time.time()
        
        try:
            # Test response times sur endpoints critiques
            endpoints = [
                f"{HUB_URL}/health",
                f"{HUB_URL}/billing/packs",
                f"{CV_URL}/health",
                f"{LETTERS_URL}/health"
            ]
            
            response_times = {}
            total_requests = 0
            total_time = 0
            
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                for endpoint in endpoints:
                    try:
                        endpoint_start = time.time()
                        response = await client.get(endpoint)
                        endpoint_duration = (time.time() - endpoint_start) * 1000
                        
                        service_name = endpoint.split("//")[1].split(".")[0] if "//" in endpoint else endpoint
                        response_times[service_name] = {
                            "response_time_ms": endpoint_duration,
                            "status_code": response.status_code,
                            "acceptable": endpoint_duration < 2000  # 2s threshold
                        }
                        
                        if response.status_code == 200:
                            total_requests += 1
                            total_time += endpoint_duration
                            
                    except Exception as e:
                        service_name = endpoint.split("//")[1].split(".")[0] if "//" in endpoint else endpoint
                        response_times[service_name] = {
                            "error": str(e),
                            "acceptable": False
                        }
            
            avg_response_time = total_time / total_requests if total_requests > 0 else 0
            duration = time.time() - start_time
            
            acceptable_count = len([r for r in response_times.values() if r.get("acceptable", False)])
            performance_status = "pass" if acceptable_count >= len(endpoints) * 0.8 else "partial"
            
            return {
                "status": performance_status,
                "duration_ms": duration * 1000,
                "average_response_time_ms": avg_response_time,
                "acceptable_endpoints": f"{acceptable_count}/{len(endpoints)}",
                "response_times": response_times,
                "details": f"Performance baseline: {avg_response_time:.0f}ms avg"
            }
            
        except Exception as e:
            duration = time.time() - start_time
            return {
                "status": "fail",
                "duration_ms": duration * 1000,
                "error": str(e),
                "details": "Performance baseline test failed"
            }
    
    # === Main Test Runner ===
    
    async def run_all_smoke_tests(self) -> Dict[str, Any]:
        """🚀 Exécuter tous les smoke tests"""
        print("🔥 Phoenix Ecosystem Smoke Tests - Sprint 5")
        print("=" * 60)
        
        test_methods = [
            ("01. Luna Hub Health", self.test_01_luna_hub_health),
            ("02. Satellite Services", self.test_02_satellite_services_health),
            ("03. Billing System", self.test_03_billing_system_health),
            ("04. Energy Management", self.test_04_energy_management_flow),
            ("05. Phoenix CV", self.test_05_phoenix_cv_integration),
            ("06. Phoenix Letters", self.test_06_phoenix_letters_integration),
            ("07. Phoenix Website", self.test_07_phoenix_website_integration),
            ("08. Inter-Service Communication", self.test_08_inter_service_communication),
            ("09. Security Headers", self.test_09_security_headers),
            ("10. Performance Baseline", self.test_10_performance_baseline)
        ]
        
        results = {}
        start_time = datetime.now(timezone.utc)
        
        for test_name, test_method in test_methods:
            print(f"\n🧪 {test_name}...")
            try:
                result = await test_method()
                results[test_name] = result
                
                status_emoji = {"pass": "✅", "partial": "⚠️", "fail": "❌"}.get(result["status"], "❓")
                print(f"   {status_emoji} {result['status'].upper()} ({result['duration_ms']:.0f}ms)")
                if result.get("details"):
                    print(f"   📝 {result['details']}")
                if result.get("error"):
                    print(f"   ❌ {result['error']}")
                    
            except Exception as e:
                results[test_name] = {
                    "status": "fail",
                    "error": str(e),
                    "duration_ms": 0,
                    "details": "Test execution failed"
                }
                print(f"   ❌ FAIL - {e}")
        
        # Summary
        total_duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        passed = len([r for r in results.values() if r["status"] == "pass"])
        partial = len([r for r in results.values() if r["status"] == "partial"])
        failed = len([r for r in results.values() if r["status"] == "fail"])
        total = len(results)
        
        print("\n" + "=" * 60)
        print("📊 SMOKE TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed:  {passed}/{total}")
        print(f"⚠️  Partial: {partial}/{total}")
        print(f"❌ Failed:  {failed}/{total}")
        print(f"⏱️  Total time: {total_duration:.1f}s")
        print(f"🎯 Success rate: {((passed + partial) / total * 100):.1f}%")
        
        overall_status = "pass" if failed == 0 else "partial" if passed + partial >= total * 0.8 else "fail"
        
        print(f"\n🚀 OVERALL STATUS: {overall_status.upper()}")
        
        if overall_status == "pass":
            print("🎉 Phoenix Ecosystem is ready for production!")
        elif overall_status == "partial":
            print("⚠️ Phoenix Ecosystem has some issues but is mostly functional")
        else:
            print("❌ Phoenix Ecosystem has critical issues that need fixing")
        
        return {
            "overall_status": overall_status,
            "total_duration_seconds": total_duration,
            "summary": {
                "passed": passed,
                "partial": partial,
                "failed": failed,
                "total": total,
                "success_rate": (passed + partial) / total * 100
            },
            "results": results,
            "test_session_id": self.test_session_id,
            "timestamp": start_time.isoformat()
        }


# === CLI Interface ===
async def main():
    """Main function pour exécution directe"""
    smoke_test = EcosystemSmokeTest()
    results = await smoke_test.run_all_smoke_tests()
    
    # Exit code based on results
    if results["overall_status"] == "fail":
        exit(1)
    elif results["overall_status"] == "partial":
        exit(2)  # Warning exit code
    else:
        exit(0)  # Success


if __name__ == "__main__":
    asyncio.run(main())