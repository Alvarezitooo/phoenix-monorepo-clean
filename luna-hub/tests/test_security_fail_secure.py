"""
🛡️ Tests pour Security Guardian fail-secure 
Doit échouer avant correction fail-open → fail-secure
"""

import pytest
from unittest.mock import patch
from fastapi import HTTPException
from app.core.security_guardian import SecurityGuardian, ensure_request_is_clean


@pytest.mark.asyncio
async def test_security_guardian_fails_secure_on_exception():
    """
    Test critique : SecurityGuardian doit BLOQUER les requêtes en cas d'erreur
    Ce test ÉCHOUE avec l'implémentation fail-open actuelle
    """
    
    # Mock Request object
    from unittest.mock import MagicMock
    mock_request = MagicMock()
    mock_request.client.host = "127.0.0.1"
    mock_request.headers = {"user-agent": "TestAgent/1.0"}
    mock_request.method = "POST"
    mock_request.url.path = "/admin/users"  # Endpoint NOT in allow-list
    
    # Forcer une exception en mockant une fonction interne qui va exploser
    with patch('app.core.security_guardian.SecurityGuardian.sanitize_string') as mock_sanitize:
        mock_sanitize.side_effect = Exception("Critical security module failure")
        
        # Le test doit réussir APRÈS le patch fail-secure
        # Pour l'instant il va ÉCHOUER car ensure_request_is_clean retourne None (fail-open)
        result = await ensure_request_is_clean(mock_request)
        
        # FAIL-OPEN ACTUEL: result = None (requête autorisée)
        # FAIL-SECURE ATTENDU: HTTPException levée (requête bloquée)
        
        # APRÈS CORRECTION: Ce test doit ÉCHOUER car ensure_request_is_clean lève HTTPException (fail-secure)
        # AVANT CORRECTION: result = None (fail-open) 
        
        # Le test va maintenant ÉCHOUER si notre correction fonctionne
        try:
            result = await ensure_request_is_clean(mock_request)
            # Si on arrive ici, c'est que la correction n'a pas fonctionné
            assert False, "Security Guardian should block request on exception (fail-secure), got: " + str(result)
        except HTTPException as e:
            # SUCCESS: La requête a été bloquée (fail-secure)
            assert e.status_code == 403
            assert "Security validation error" in str(e.detail) or "blocked" in str(e.detail)


@pytest.mark.asyncio
async def test_security_guardian_blocks_malicious_during_system_error():
    """
    Test que même lors d'erreurs système, les requêtes malicieuses sont bloquées
    """
    
    from unittest.mock import MagicMock
    mock_request = MagicMock()
    mock_request.client.host = "192.168.1.100"
    mock_request.headers = {"user-agent": "<script>alert('xss')</script>"}
    mock_request.method = "POST"
    mock_request.url.path = "/admin/users"  # Endpoint NOT in allow-list
    
    # Simuler erreur système pendant validation
    with patch.object(SecurityGuardian, 'sanitize_string') as mock_sanitize:
        mock_sanitize.side_effect = Exception("Memory allocation failed")
        
        # Même avec erreur système, doit bloquer (fail-secure)
        with pytest.raises(HTTPException) as exc_info:
            await ensure_request_is_clean(mock_request)
        
        assert exc_info.value.status_code == 403
        assert "Security validation error" in str(exc_info.value.detail) or "Security check failed" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_security_guardian_proper_error_logging():
    """
    Test que les erreurs de sécurité sont correctement loggées
    """
    
    from unittest.mock import MagicMock, patch
    import structlog
    
    mock_request = MagicMock()
    mock_request.client.host = "10.0.0.1"
    mock_request.headers = {"user-agent": "AttackBot/2.0"}
    mock_request.method = "GET"
    mock_request.url.path = "/admin"
    
    # Simuler erreur dans la validation
    with patch.object(SecurityGuardian, 'validate_request_headers') as mock_headers, \
         patch('app.core.security_guardian.logger') as mock_logger:
        
        mock_headers.side_effect = RuntimeError("Critical security module failure")
        
        # Doit lever exception ET logger l'erreur
        with pytest.raises(HTTPException):
            await ensure_request_is_clean(mock_request)
        
        # Vérifier que l'erreur est loggée
        mock_logger.error.assert_called()
        logged_args = mock_logger.error.call_args
        assert "Security validation failed" in str(logged_args) or "security" in str(logged_args).lower()


def test_security_guardian_sanitize_fails_secure():
    """
    Test unitaire : sanitize_string doit échouer de manière sécurisée
    """
    
    # Input malicieux qui pourrait causer une exception
    malicious_input = "<script>alert('xss')</script>" * 1000  # Very long
    
    # Simuler une exception dans bleach.clean
    with patch('app.core.security_guardian.bleach.clean') as mock_clean:
        mock_clean.side_effect = MemoryError("Out of memory during sanitization")
        
        # Doit lever HTTPException au lieu de retourner la chaîne non-sécurisée
        with pytest.raises(HTTPException) as exc_info:
            SecurityGuardian.sanitize_string(malicious_input)
        
        assert exc_info.value.status_code == 400
        assert "sanitization failed" in str(exc_info.value.detail).lower() or "security" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio 
async def test_security_guardian_rate_limit_failure_blocks():
    """
    Test que l'échec de vérification rate limit bloque la requête
    """
    
    from unittest.mock import MagicMock, patch
    
    mock_request = MagicMock()
    mock_request.client.host = "suspicious-ip.com"
    mock_request.headers = {"user-agent": "Bot"}
    mock_request.method = "POST" 
    mock_request.url.path = "/admin/users"  # Endpoint NOT in allow-list
    
    # Simuler échec du rate limiter
    with patch('app.core.security_guardian.rate_limiter') as mock_limiter:
        # Rate limiter lève une exception
        mock_limiter.check_rate_limit.side_effect = Exception("Redis connection failed")
        
        # Doit bloquer par sécurité
        with pytest.raises(HTTPException) as exc_info:
            await ensure_request_is_clean(mock_request)
        
        # Vérifier blocage sécurisé
        assert exc_info.value.status_code in [403, 429, 500]  # Acceptable security responses