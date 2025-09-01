"""
🧪 Tests pour le système de compliance GDPR
Validation de l'anonymisation, consentements et droits utilisateurs
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta

from app.core.gdpr_compliance import (
    GDPRComplianceManager, DataAnonymizer, 
    ConsentType, DataCategory, ProcessingPurpose
)


class TestDataAnonymizer:
    """Tests des fonctions d'anonymisation"""
    
    def test_anonymize_email(self):
        """
        📧 Test d'anonymisation des emails
        """
        
        anonymizer = DataAnonymizer()
        
        # Test email normal
        assert anonymizer.anonymize_email("user@example.com") == "u***r@example.com"
        
        # Test email court
        assert anonymizer.anonymize_email("a@b.com") == "**@b.com"
        
        # Test email vide/invalide
        assert anonymizer.anonymize_email("") == ""
        assert anonymizer.anonymize_email("invalid") == "invalid"
        
    def test_anonymize_ip(self):
        """
        🌐 Test d'anonymisation des adresses IP
        """
        
        anonymizer = DataAnonymizer()
        
        # IPv4
        assert anonymizer.anonymize_ip("192.168.1.100") == "192.168.xxx.xxx"
        assert anonymizer.anonymize_ip("10.0.0.1") == "10.0.xxx.xxx"
        
        # IPv6
        assert anonymizer.anonymize_ip("2001:db8:85a3:8d3:1319:8a2e:370:7344") == "2001:db8:85a3:8d3::xxxx"
        
        # Cases spéciaux
        assert anonymizer.anonymize_ip("unknown") == "unknown"
        assert anonymizer.anonymize_ip("") == ""
        
    def test_pseudonymize_user_id(self):
        """
        🎭 Test de pseudonymisation des user_id
        """
        
        anonymizer = DataAnonymizer()
        
        user_id = "user-12345"
        
        # Pseudonyme cohérent
        pseudo1 = anonymizer.pseudonymize_user_id(user_id)
        pseudo2 = anonymizer.pseudonymize_user_id(user_id)
        assert pseudo1 == pseudo2
        
        # Pseudonyme différent pour user_id différent
        pseudo3 = anonymizer.pseudonymize_user_id("user-67890")
        assert pseudo1 != pseudo3
        
        # Longueur appropriée
        assert len(pseudo1) == 16
        
        # Ne révèle pas l'original
        assert user_id not in pseudo1
        
    def test_anonymize_text_content(self):
        """
        📝 Test d'anonymisation de contenu textuel
        """
        
        anonymizer = DataAnonymizer()
        
        text = "Contactez-moi à user@example.com ou au 0123456789. Mon IP est 192.168.1.1"
        
        anonymized = anonymizer.anonymize_text_content(text)
        
        assert "[EMAIL_REDACTED]" in anonymized
        assert "[PHONE_REDACTED]" in anonymized
        assert "[IP_REDACTED]" in anonymized
        assert "user@example.com" not in anonymized
        assert "0123456789" not in anonymized
        assert "192.168.1.1" not in anonymized


class TestGDPRComplianceManager:
    """Tests du gestionnaire de compliance GDPR"""
    
    @pytest.fixture
    def gdpr_manager_instance(self):
        """Instance de GDPR manager pour tests"""
        return GDPRComplianceManager()
    
    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase pour les tests"""
        with patch('app.core.supabase_client.sb') as mock_sb:
            yield mock_sb
    
    @pytest.fixture
    def mock_create_event(self):
        """Mock create_event pour tests"""
        with patch('app.core.events.create_event') as mock_event:
            mock_event.return_value = True
            yield mock_event
    
    @pytest.mark.asyncio
    async def test_record_data_processing(
        self, 
        gdpr_manager_instance, 
        mock_supabase, 
        mock_create_event
    ):
        """
        📊 Test d'enregistrement de traitement de données
        """
        
        user_id = "test_user_123"
        data_category = DataCategory.ENERGY_DATA
        processing_purpose = ProcessingPurpose.SERVICE_PROVISION
        data_fields = ["current_energy", "max_energy"]
        
        # Mock réponse Supabase
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        
        # Test de l'enregistrement
        success = await gdpr_manager_instance.record_data_processing(
            user_id=user_id,
            data_category=data_category,
            processing_purpose=processing_purpose,
            data_fields=data_fields,
            legal_basis="legitimate_interest",
            retention_days=365
        )
        
        assert success is True
        
        # Vérifier appels
        mock_supabase.table.assert_called_with("gdpr_processing_records")
        mock_create_event.assert_called_once()
        
        # Vérifier les données d'événement
        event_call = mock_create_event.call_args[0][0]
        assert event_call["type"] == "gdpr_processing_recorded"
        assert event_call["actor_user_id"] == user_id
        assert event_call["payload"]["data_category"] == data_category.value
    
    @pytest.mark.asyncio
    async def test_record_user_consent(
        self, 
        gdpr_manager_instance, 
        mock_supabase, 
        mock_create_event
    ):
        """
        ✅ Test d'enregistrement de consentement utilisateur
        """
        
        user_id = "test_user_123"
        consent_type = ConsentType.AI_PROCESSING
        consent_given = True
        client_ip = "192.168.1.100"
        user_agent = "Mozilla/5.0 Test Browser"
        
        # Mock réponse Supabase
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()
        
        success = await gdpr_manager_instance.record_user_consent(
            user_id=user_id,
            consent_type=consent_type,
            consent_given=consent_given,
            client_ip=client_ip,
            user_agent=user_agent
        )
        
        assert success is True
        
        # Vérifier que l'IP a été anonymisée
        insert_call = mock_supabase.table.return_value.insert.call_args[0][0]
        assert insert_call["consent_ip"] == "192.168.xxx.xxx"  # IP anonymisée
        assert insert_call["consent_given"] == consent_given
        assert insert_call["consent_type"] == consent_type.value
        
        # Vérifier événement
        mock_create_event.assert_called_once()
        event_call = mock_create_event.call_args[0][0]
        assert event_call["type"] == "gdpr_consent_updated"
    
    @pytest.mark.asyncio
    async def test_get_user_consent(self, gdpr_manager_instance, mock_supabase):
        """
        🔍 Test de récupération de consentement utilisateur
        """
        
        user_id = "test_user_123"
        consent_type = ConsentType.ANALYTICS
        
        # Mock données Supabase
        mock_consent_data = {
            "user_id": user_id,
            "consent_type": consent_type.value,
            "consent_given": True,
            "consent_timestamp": datetime.now(timezone.utc).isoformat(),
            "consent_ip": "192.168.xxx.xxx",
            "consent_user_agent": "Test Browser",
            "withdrawal_timestamp": None,
            "consent_version": "1.0"
        }
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [mock_consent_data]
        
        consent = await gdpr_manager_instance.get_user_consent(user_id, consent_type)
        
        assert consent is not None
        assert consent.user_id == user_id
        assert consent.consent_type == consent_type
        assert consent.consent_given is True
        assert consent.withdrawal_timestamp is None
    
    @pytest.mark.asyncio
    async def test_check_consent_required(self, gdpr_manager_instance):
        """
        ❓ Test de vérification si consentement requis
        """
        
        user_id = "test_user_123"
        
        # Mock get_user_consent pour différents scénarios
        with patch.object(gdpr_manager_instance, 'get_user_consent') as mock_get_consent:
            
            # Cas 1: Consentement donné et actif
            mock_consent = MagicMock()
            mock_consent.consent_given = True
            mock_consent.withdrawal_timestamp = None
            mock_get_consent.return_value = mock_consent
            
            consent_required = await gdpr_manager_instance.check_consent_required(
                user_id, DataCategory.BEHAVIORAL
            )
            assert consent_required is False  # Pas besoin, déjà donné
            
            # Cas 2: Consentement retiré
            mock_consent.withdrawal_timestamp = datetime.now(timezone.utc)
            consent_required = await gdpr_manager_instance.check_consent_required(
                user_id, DataCategory.BEHAVIORAL
            )
            assert consent_required is True  # Besoin car retiré
            
            # Cas 3: Pas de consentement
            mock_get_consent.return_value = None
            consent_required = await gdpr_manager_instance.check_consent_required(
                user_id, DataCategory.BEHAVIORAL
            )
            assert consent_required is True  # Besoin car absent
            
            # Cas 4: Catégorie ne nécessitant pas consentement
            consent_required = await gdpr_manager_instance.check_consent_required(
                user_id, DataCategory.TECHNICAL
            )
            assert consent_required is False  # Pas de consentement requis
    
    @pytest.mark.asyncio
    async def test_anonymize_user_data_in_logs(
        self, 
        gdpr_manager_instance, 
        mock_supabase
    ):
        """
        🎭 Test d'anonymisation des données utilisateur dans les logs
        """
        
        user_id = "test_user_123"
        
        # Mock événements avec données sensibles
        mock_events = [
            {
                "id": 1,
                "payload": {
                    "email": "user@example.com",
                    "ip": "192.168.1.100",
                    "user_agent": "Mozilla/5.0 Test"
                }
            },
            {
                "id": 2,
                "payload": {
                    "action": "login",
                    "ip": "10.0.0.1"
                }
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = mock_events
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        
        anonymized_count = await gdpr_manager_instance.anonymize_user_data_in_logs(user_id)
        
        assert anonymized_count == 2
        
        # Vérifier que update a été appelé pour anonymiser
        update_calls = mock_supabase.table.return_value.update.call_args_list
        assert len(update_calls) == 2
        
        # Vérifier que l'email a été anonymisé dans le premier appel
        first_update_data = update_calls[0][0][0]
        assert first_update_data["payload"]["email"] == "u***r@example.com"
        assert first_update_data["payload"]["ip"] == "192.168.xxx.xxx"
    
    @pytest.mark.asyncio
    async def test_export_user_data(
        self, 
        gdpr_manager_instance, 
        mock_supabase, 
        mock_create_event
    ):
        """
        📤 Test d'export des données utilisateur
        """
        
        user_id = "test_user_123"
        
        # Mock différentes tables avec données
        mock_energy_data = [{"user_id": user_id, "current_energy": 75.0}]
        mock_transactions = [{"user_id": user_id, "action_type": "consume", "energy_amount": 5.0}]
        mock_consents = [{"user_id": user_id, "consent_type": "ai_processing", "consent_given": True}]
        
        # Configure les mocks pour chaque table
        def mock_table_select(table_name):
            table_mock = MagicMock()
            if table_name == "user_energy":
                table_mock.select.return_value.eq.return_value.execute.return_value.data = mock_energy_data
            elif table_name == "energy_transactions":
                table_mock.select.return_value.eq.return_value.execute.return_value.data = mock_transactions
            elif table_name == "user_consents":
                table_mock.select.return_value.eq.return_value.execute.return_value.data = mock_consents
            else:
                table_mock.select.return_value.eq.return_value.execute.return_value.data = []
            return table_mock
        
        mock_supabase.table.side_effect = mock_table_select
        
        export_data = await gdpr_manager_instance.export_user_data(user_id)
        
        assert export_data["user_id"] == user_id
        assert "export_timestamp" in export_data
        assert "data_categories" in export_data
        
        # Vérifier présence des catégories avec données
        assert "energy" in export_data["data_categories"]
        assert "energy_transactions" in export_data["data_categories"]
        assert "consents" in export_data["data_categories"]
        
        # Vérifier événement d'export
        mock_create_event.assert_called_once()
        event_call = mock_create_event.call_args[0][0]
        assert event_call["type"] == "gdpr_data_exported"
    
    @pytest.mark.asyncio
    async def test_delete_user_data(
        self, 
        gdpr_manager_instance, 
        mock_supabase, 
        mock_create_event
    ):
        """
        🗑️ Test de suppression complète des données utilisateur
        """
        
        user_id = "test_user_to_delete"
        
        # Mock réponses de suppression
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        
        # Mock anonymisation
        with patch.object(gdpr_manager_instance, 'anonymize_user_data_in_logs', return_value=5) as mock_anonymize:
            
            deletion_summary = await gdpr_manager_instance.delete_user_data(
                user_id, keep_anonymized=True
            )
            
            assert "user_id" in deletion_summary
            assert "deletion_timestamp" in deletion_summary
            assert "deleted_tables" in deletion_summary
            assert "anonymized_records" in deletion_summary
            
            # Vérifier que l'anonymisation a été appelée
            mock_anonymize.assert_called_once_with(user_id)
            assert deletion_summary["anonymized_records"] == 5
            
            # Vérifier que des tables ont été supprimées
            assert len(deletion_summary["deleted_tables"]) > 0
            expected_tables = ["user_energy", "energy_transactions", "user_consents"]
            for table in expected_tables:
                assert table in deletion_summary["deleted_tables"]
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_data(
        self, 
        gdpr_manager_instance, 
        mock_supabase, 
        mock_create_event
    ):
        """
        🧹 Test de nettoyage des données expirées
        """
        
        # Mock données expirées supprimées
        mock_supabase.table.return_value.delete.return_value.lt.return_value.execute.return_value.data = [
            {"id": 1}, {"id": 2}, {"id": 3}
        ]
        
        # Mock anciens événements pour anonymisation
        one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
        mock_old_events = [
            {
                "id": 10,
                "actor_user_id": "old_user_1",
                "payload": {"email": "old@example.com"}
            }
        ]
        
        # Configure mock pour événements anciens
        select_mock = mock_supabase.table.return_value.select.return_value.lt.return_value.execute
        select_mock.return_value.data = mock_old_events
        
        cleanup_summary = await gdpr_manager_instance.cleanup_expired_data()
        
        assert "cleanup_timestamp" in cleanup_summary
        assert "expired_processing_records" in cleanup_summary
        assert "old_events_anonymized" in cleanup_summary
        
        # Vérifier nettoyage des enregistrements expirés
        assert cleanup_summary["expired_processing_records"] == 3
        
        # Vérifier événement de nettoyage
        mock_create_event.assert_called_once()
        event_call = mock_create_event.call_args[0][0]
        assert event_call["type"] == "gdpr_cleanup_executed"