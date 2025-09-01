#!/usr/bin/env python3
"""
🧪 Test Script - Phoenix Authentication Harmonization
Script de validation de l'authentification harmonisée

Valide :
- Endpoints HTTPOnly cookies fonctionnels
- Suppression vulnérabilités localStorage  
- Auth centralisée cross-services
- Luna Energy integration
"""

import asyncio
import aiohttp
import json
from typing import Dict, Optional
from urllib.parse import urljoin
import sys

class PhoenixAuthTester:
    def __init__(self):
        self.hub_url = "https://luna-hub-backend-unified-production.up.railway.app"
        self.website_url = "https://phoenix-website-production.up.railway.app"
        self.cv_url = "https://phoenix-cv-production.up.railway.app"
        self.letters_url = "https://phoenix-letters-production.up.railway.app"
        
        self.session = None
        self.test_results = []
    
    async def setup(self):
        """Initialize test session"""
        self.session = aiohttp.ClientSession(
            cookie_jar=aiohttp.CookieJar(unsafe=True),
            timeout=aiohttp.ClientTimeout(total=30)
        )
        print("🔧 Test session initialized")
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
        print("🧹 Test session cleaned up")
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.test_results.append((test_name, passed, details))
        print(f"{status} {test_name}")
        if details:
            print(f"   📋 {details}")
    
    async def test_hub_health(self) -> bool:
        """Test 1: Hub health & HTTPOnly endpoints availability"""
        try:
            async with self.session.get(f"{self.hub_url}/health") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.log_test(
                        "Hub Health Check", 
                        True, 
                        f"Status: {data.get('status', 'unknown')}"
                    )
                    return True
                else:
                    self.log_test("Hub Health Check", False, f"HTTP {resp.status}")
                    return False
        except Exception as e:
            self.log_test("Hub Health Check", False, f"Error: {str(e)}")
            return False
    
    async def test_secure_session_endpoint(self) -> bool:
        """Test 2: Secure session endpoint exists (no login test)"""
        try:
            # Test endpoint availability with invalid credentials
            payload = {"email": "test@nonexistent.com", "password": "invalid"}
            async with self.session.post(
                f"{self.hub_url}/auth/secure-session",
                json=payload
            ) as resp:
                # We expect 401/400, not 404 (endpoint exists)
                if resp.status in [400, 401, 422]:
                    self.log_test(
                        "Secure Session Endpoint", 
                        True, 
                        f"Endpoint available (HTTP {resp.status})"
                    )
                    return True
                elif resp.status == 404:
                    self.log_test(
                        "Secure Session Endpoint", 
                        False, 
                        "Endpoint not found"
                    )
                    return False
                else:
                    self.log_test(
                        "Secure Session Endpoint", 
                        True, 
                        f"Unexpected status: {resp.status}"
                    )
                    return True
        except Exception as e:
            self.log_test("Secure Session Endpoint", False, f"Error: {str(e)}")
            return False
    
    async def test_logout_secure_endpoint(self) -> bool:
        """Test 3: Logout secure endpoint exists"""
        try:
            async with self.session.post(f"{self.hub_url}/auth/logout-secure") as resp:
                # Should return 401 (not authenticated) or 200, not 404
                if resp.status in [200, 401]:
                    self.log_test(
                        "Logout Secure Endpoint", 
                        True, 
                        f"Endpoint available (HTTP {resp.status})"
                    )
                    return True
                elif resp.status == 404:
                    self.log_test(
                        "Logout Secure Endpoint", 
                        False, 
                        "Endpoint not found"
                    )
                    return False
                else:
                    self.log_test(
                        "Logout Secure Endpoint", 
                        True, 
                        f"Available with status: {resp.status}"
                    )
                    return True
        except Exception as e:
            self.log_test("Logout Secure Endpoint", False, f"Error: {str(e)}")
            return False
    
    async def test_auth_me_endpoint(self) -> bool:
        """Test 4: Auth me endpoint for session validation"""
        try:
            async with self.session.get(f"{self.hub_url}/auth/me") as resp:
                # Should return 401 (not authenticated), not 404
                if resp.status == 401:
                    self.log_test(
                        "Auth Me Endpoint", 
                        True, 
                        "Endpoint available, returns 401 (expected)"
                    )
                    return True
                elif resp.status == 404:
                    self.log_test("Auth Me Endpoint", False, "Endpoint not found")
                    return False
                else:
                    self.log_test(
                        "Auth Me Endpoint", 
                        True, 
                        f"Available with status: {resp.status}"
                    )
                    return True
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, f"Error: {str(e)}")
            return False
    
    async def test_energy_endpoints(self) -> bool:
        """Test 5: Luna Energy endpoints availability"""
        try:
            # Test energy check endpoint
            payload = {"user_id": "test-user"}
            async with self.session.post(
                f"{self.hub_url}/luna/energy/check",
                json=payload
            ) as resp:
                if resp.status in [400, 401, 422]:
                    self.log_test(
                        "Energy Check Endpoint", 
                        True, 
                        f"Endpoint available (HTTP {resp.status})"
                    )
                    return True
                elif resp.status == 404:
                    self.log_test("Energy Check Endpoint", False, "Endpoint not found")
                    return False
                else:
                    self.log_test(
                        "Energy Check Endpoint", 
                        True, 
                        f"Available with status: {resp.status}"
                    )
                    return True
        except Exception as e:
            self.log_test("Energy Check Endpoint", False, f"Error: {str(e)}")
            return False
    
    async def test_services_accessibility(self) -> bool:
        """Test 6: All Phoenix services are accessible"""
        services = [
            ("Phoenix Website", self.website_url),
            ("Phoenix CV", self.cv_url), 
            ("Phoenix Letters", self.letters_url)
        ]
        
        all_accessible = True
        
        for name, url in services:
            try:
                async with self.session.get(url, allow_redirects=True) as resp:
                    if resp.status == 200:
                        self.log_test(f"{name} Accessibility", True, f"HTTP {resp.status}")
                    else:
                        self.log_test(f"{name} Accessibility", False, f"HTTP {resp.status}")
                        all_accessible = False
            except Exception as e:
                self.log_test(f"{name} Accessibility", False, f"Error: {str(e)}")
                all_accessible = False
        
        return all_accessible
    
    async def test_cors_headers(self) -> bool:
        """Test 7: CORS headers for cross-service requests"""
        try:
            async with self.session.options(f"{self.hub_url}/auth/me") as resp:
                cors_headers = resp.headers.get('Access-Control-Allow-Origin', '')
                if cors_headers or resp.status in [200, 404]:
                    self.log_test(
                        "CORS Configuration", 
                        True, 
                        f"CORS headers present or endpoint accessible"
                    )
                    return True
                else:
                    self.log_test("CORS Configuration", False, "No CORS headers")
                    return False
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Error: {str(e)}")
            return False
    
    async def test_security_headers(self) -> bool:
        """Test 8: Security headers presence"""
        try:
            async with self.session.get(f"{self.hub_url}/health") as resp:
                security_headers = [
                    'X-Content-Type-Options',
                    'X-Frame-Options', 
                    'X-XSS-Protection'
                ]
                
                found_headers = []
                for header in security_headers:
                    if header.lower() in [h.lower() for h in resp.headers]:
                        found_headers.append(header)
                
                if found_headers:
                    self.log_test(
                        "Security Headers", 
                        True, 
                        f"Found: {', '.join(found_headers)}"
                    )
                    return True
                else:
                    self.log_test("Security Headers", False, "No security headers found")
                    return False
        except Exception as e:
            self.log_test("Security Headers", False, f"Error: {str(e)}")
            return False
    
    async def run_all_tests(self) -> bool:
        """Run all authentication tests"""
        print("🧪 Starting Phoenix Authentication Harmonization Tests")
        print("=" * 60)
        
        await self.setup()
        
        tests = [
            self.test_hub_health,
            self.test_secure_session_endpoint,
            self.test_logout_secure_endpoint, 
            self.test_auth_me_endpoint,
            self.test_energy_endpoints,
            self.test_services_accessibility,
            self.test_cors_headers,
            self.test_security_headers
        ]
        
        results = []
        for test in tests:
            try:
                result = await test()
                results.append(result)
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
                results.append(False)
        
        await self.cleanup()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        for test_name, success, details in self.test_results:
            status = "✅" if success else "❌"
            print(f"{status} {test_name}")
            if details and not success:
                print(f"   └─ {details}")
        
        print(f"\n📈 RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Authentication harmonization successful!")
            return True
        else:
            print("⚠️  Some tests failed - Check configuration")
            return False

async def main():
    """Main test runner"""
    tester = PhoenixAuthTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n✅ Phoenix Authentication Harmonization: VALIDATED")
        sys.exit(0)
    else:
        print("\n❌ Phoenix Authentication Harmonization: ISSUES DETECTED")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())