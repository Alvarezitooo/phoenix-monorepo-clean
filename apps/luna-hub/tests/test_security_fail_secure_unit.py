"""
🛡️ Tests unitaires fail-secure pour SecurityGuardian
"""

import pytest
from unittest.mock import patch
from fastapi import HTTPException
from app.core.security_guardian import SecurityGuardian


def test_sanitize_string_fails_secure_on_bleach_error():
    """
    Test unitaire direct : sanitize_string doit échouer de manière sécurisée
    """
    
    malicious_input = "<script>alert('xss')</script>"  # Valid length
    
    # Mock bleach.clean to raise exception
    with patch('app.core.security_guardian.bleach.clean') as mock_clean:
        mock_clean.side_effect = RuntimeError("Memory corruption in bleach library")
        
        # Should raise HTTPException (fail-secure)
        with pytest.raises(HTTPException) as exc_info:
            SecurityGuardian.sanitize_string(malicious_input)
        
        # Verify fail-secure behavior
        assert exc_info.value.status_code == 400
        assert "Security sanitization failed" in str(exc_info.value.detail)


def test_sanitize_string_works_normally_when_no_error():
    """
    Test que sanitize_string fonctionne normalement sans erreur
    """
    
    normal_input = "Hello World"
    
    # Should work normally
    result = SecurityGuardian.sanitize_string(normal_input)
    
    # Should be cleaned but not raise exception
    assert result == normal_input  # No dangerous content to clean


@pytest.mark.asyncio
async def test_ensure_request_is_clean_global_exception_handling():
    """
    Test du comportement fail-secure au niveau global avec exception simulée
    """
    
    from unittest.mock import MagicMock
    from app.core.security_guardian import ensure_request_is_clean
    
    mock_request = MagicMock()
    mock_request.client.host = "192.168.1.100"
    mock_request.headers = {"user-agent": "TestAgent"}
    mock_request.method = "POST"
    mock_request.url.path = "/api/test"  # Not in allow-list
    
    # Force une exception profonde dans le processus de validation
    with patch('builtins.len') as mock_len:
        # Forcer une erreur système critique
        mock_len.side_effect = SystemError("Critical system failure during security check")
        
        # Doit lever HTTPException (fail-secure) au lieu de return None (fail-open) 
        with pytest.raises(HTTPException) as exc_info:
            await ensure_request_is_clean(mock_request)
        
        # Vérifier comportement fail-secure
        assert exc_info.value.status_code == 403
        assert "Security validation error" in str(exc_info.value.detail)


def test_validate_user_id_fail_secure():
    """
    Test que validate_user_id échoue de manière sécurisée
    """
    
    # Force exception dans la validation d'UUID
    with patch('uuid.UUID') as mock_uuid:
        mock_uuid.side_effect = ValueError("UUID validation error")
        
        # Should raise HTTPException instead of allowing malicious input
        with pytest.raises(HTTPException) as exc_info:
            SecurityGuardian.validate_user_id("malicious-uuid")
        
        assert exc_info.value.status_code == 400
        assert "Invalid user ID format" in str(exc_info.value.detail)


def test_validate_action_name_fail_secure():
    """
    Test que validate_action_name échoue de manière sécurisée
    """
    
    # Force exception interne
    with patch('app.core.security_guardian.SecurityGuardian.sanitize_string') as mock_sanitize:
        mock_sanitize.side_effect = MemoryError("Out of memory during sanitization")
        
        # Should raise HTTPException (fail-secure)
        with pytest.raises(HTTPException) as exc_info:
            SecurityGuardian.validate_action_name("some_action")
        
        # Our sanitize_string fail-secure should trigger
        assert exc_info.value.status_code == 400
        assert "Security sanitization failed" in str(exc_info.value.detail)