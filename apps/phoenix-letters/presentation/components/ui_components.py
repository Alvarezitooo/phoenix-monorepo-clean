"""
Phoenix UI Components - Presentation Layer
Clean Architecture - Composants UI réutilisables avec style Phoenix
"""

import streamlit as st
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

class PhoenixUIComponents:
    """
    Composants UI Phoenix réutilisables
    Design System Phoenix avec CSS custom
    """
    
    @staticmethod
    def load_phoenix_css():
        """Charge le CSS Phoenix personnalisé"""
        phoenix_css = """
        <style>
        /* Phoenix Design System */
        .phoenix-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .phoenix-card {
            background: white;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        
        .phoenix-metric {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 1rem;
            border-radius: 10px;
            text-align: center;
            margin: 0.5rem 0;
        }
        
        .phoenix-success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        
        .phoenix-warning {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        
        .phoenix-premium {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            padding: 1.5rem;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        
        .phoenix-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .phoenix-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .phoenix-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .phoenix-status-indicator {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .status-active { background: #4ade80; color: white; }
        .status-draft { background: #fbbf24; color: white; }
        .status-finalized { background: #06b6d4; color: white; }
        
        .phoenix-letter-preview {
            background: #f8fafc;
            border: 2px dashed #e2e8f0;
            border-radius: 10px;
            padding: 1.5rem;
            margin: 1rem 0;
            font-family: 'Georgia', serif;
            line-height: 1.6;
        }
        
        .phoenix-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        
        /* Animation spinner Phoenix */
        .phoenix-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            border-top-color: #667eea;
            animation: phoenix-spin 1s ease-in-out infinite;
        }
        
        @keyframes phoenix-spin {
            to { transform: rotate(360deg); }
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .phoenix-card { padding: 1rem; }
            .phoenix-header { padding: 1.5rem; }
            .phoenix-stats-grid { grid-template-columns: 1fr; }
        }
        </style>
        """
        st.markdown(phoenix_css, unsafe_allow_html=True)
    
    @staticmethod
    def render_phoenix_header(title: str, subtitle: str, icon: str = "🔥"):
        """En-tête Phoenix avec style gradient"""
        st.markdown(f"""
        <div class="phoenix-header">
            <h1 style="margin: 0; font-size: 2.5rem;">{icon} {title}</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.2rem; opacity: 0.9;">
                {subtitle}
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_metric_card(label: str, value: str, delta: Optional[str] = None, icon: str = "📊"):
        """Carte métrique Phoenix stylée"""
        delta_html = ""
        if delta:
            delta_html = f'<div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">{delta}</div>'
        
        st.markdown(f"""
        <div class="phoenix-metric">
            <div style="font-size: 0.9rem; opacity: 0.8;">{icon} {label}</div>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">{value}</div>
            {delta_html}
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_success_message(message: str, details: Optional[str] = None):
        """Message de succès Phoenix"""
        details_html = ""
        if details:
            details_html = f'<div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.9;">{details}</div>'
        
        st.markdown(f"""
        <div class="phoenix-success">
            <div style="font-size: 1.1rem; font-weight: bold;">✅ {message}</div>
            {details_html}
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_warning_message(message: str, details: Optional[str] = None):
        """Message d'avertissement Phoenix"""
        details_html = ""
        if details:
            details_html = f'<div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.9;">{details}</div>'
        
        st.markdown(f"""
        <div class="phoenix-warning">
            <div style="font-size: 1.1rem; font-weight: bold;">⚠️ {message}</div>
            {details_html}
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_premium_feature_card(title: str, description: str, benefits: List[str]):
        """Carte feature Premium avec style Phoenix"""
        benefits_html = "".join([f"<li>✨ {benefit}</li>" for benefit in benefits])
        
        st.markdown(f"""
        <div class="phoenix-premium">
            <h3 style="margin: 0 0 1rem 0; color: #667eea;">💎 {title}</h3>
            <p style="margin: 0 0 1rem 0; color: #64748b;">{description}</p>
            <ul style="margin: 0; padding-left: 1.5rem; color: #475569;">
                {benefits_html}
            </ul>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_letter_status_badge(status: str):
        """Badge de statut pour les lettres"""
        status_classes = {
            "draft": "status-draft",
            "generated": "status-active", 
            "edited": "status-active",
            "finalized": "status-finalized"
        }
        
        status_icons = {
            "draft": "📝",
            "generated": "🤖",
            "edited": "✏️", 
            "finalized": "✅"
        }
        
        css_class = status_classes.get(status, "status-draft")
        icon = status_icons.get(status, "📄")
        
        st.markdown(f"""
        <span class="phoenix-status-indicator {css_class}">
            {icon} {status.capitalize()}
        </span>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_letter_preview_card(content: str, company: str, position: str, word_count: int):
        """Carte préview de lettre avec style Phoenix"""
        preview = content[:300] + "..." if len(content) > 300 else content
        
        st.markdown(f"""
        <div class="phoenix-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0; color: #667eea;">📄 {company} - {position}</h4>
                    <small style="color: #64748b;">{word_count} mots</small>
                </div>
            </div>
            <div class="phoenix-letter-preview">
                {preview}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_user_stats_dashboard(stats: Dict[str, Any]):
        """Dashboard statistiques utilisateur"""
        st.markdown('<div class="phoenix-stats-grid">', unsafe_allow_html=True)
        
        # Métriques en colonnes
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            PhoenixUIComponents.render_metric_card(
                "Lettres totales", 
                str(stats.get("total", 0)), 
                "📈 Cette session",
                "📚"
            )
        
        with col2:
            PhoenixUIComponents.render_metric_card(
                "Ce mois", 
                str(stats.get("this_month", 0)),
                f"Restantes: {stats.get('remaining', 'Illimité')}",
                "📅"
            )
        
        with col3:
            quality = stats.get("average_quality", 0.5)
            quality_pct = f"{quality * 100:.0f}%"
            PhoenixUIComponents.render_metric_card(
                "Qualité moyenne",
                quality_pct,
                "⭐ Score IA",
                "🎯"
            )
        
        with col4:
            trend = stats.get("productivity_trend", "stable")
            trend_icons = {"up": "📈", "down": "📉", "stable": "➡️", "new_user": "🆕"}
            PhoenixUIComponents.render_metric_card(
                "Tendance",
                trend.capitalize(),
                trend_icons.get(trend, "📊"),
                "📊"
            )
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    @staticmethod
    def render_ai_service_status(ai_service):
        """Indicateur de statut du service IA"""
        if ai_service and ai_service.is_available():
            model_info = ai_service.get_model_info()
            st.markdown(f"""
            <div style="display: flex; align-items: center; padding: 0.5rem 1rem; 
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; border-radius: 8px; margin: 0.5rem 0;">
                <span style="margin-right: 0.5rem;">🤖</span>
                <div>
                    <div style="font-weight: bold;">IA Active</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">{model_info['model_name']}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div style="display: flex; align-items: center; padding: 0.5rem 1rem; 
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                        color: white; border-radius: 8px; margin: 0.5rem 0;">
                <span style="margin-right: 0.5rem;">❌</span>
                <div>
                    <div style="font-weight: bold;">IA Indisponible</div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">Mode fallback</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    @staticmethod
    def render_generation_progress(step: str, progress: float = 0.5):
        """Barre de progression pour génération"""
        progress_pct = int(progress * 100)
        
        st.markdown(f"""
        <div style="background: #f1f5f9; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <span class="phoenix-spinner" style="margin-right: 0.5rem;"></span>
                <span style="font-weight: bold; color: #667eea;">{step}</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           height: 100%; width: {progress_pct}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="text-align: right; font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">
                {progress_pct}%
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_error_card(error_title: str, error_message: str, error_code: Optional[str] = None):
        """Carte d'erreur stylée Phoenix"""
        code_html = ""
        if error_code:
            code_html = f'<div style="font-family: monospace; font-size: 0.8rem; opacity: 0.7; margin-top: 0.5rem;">Code: {error_code}</div>'
        
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #fecaca 0%, #f87171 100%); 
                    color: #7f1d1d; padding: 1.5rem; border-radius: 10px; margin: 1rem 0;
                    border-left: 5px solid #dc2626;">
            <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">
                ❌ {error_title}
            </div>
            <div>{error_message}</div>
            {code_html}
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def render_feature_coming_soon(feature_name: str, description: str):
        """Badge "Coming Soon" pour futures features"""
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%); 
                    color: white; padding: 1rem; border-radius: 10px; margin: 1rem 0;
                    text-align: center; position: relative; overflow: hidden;">
            <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">
                🚀 {feature_name}
            </div>
            <div style="opacity: 0.9; margin-bottom: 0.5rem;">{description}</div>
            <div style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; 
                        border-radius: 15px; display: inline-block; font-size: 0.8rem;">
                ✨ Prochainement
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def create_download_button(content: str, filename: str, label: str = "💾 Télécharger"):
        """Bouton de téléchargement stylé Phoenix"""
        return st.download_button(
            label=label,
            data=content,
            file_name=filename,
            mime="text/plain",
            help=f"Télécharger {filename}"
        )
    
    @staticmethod
    def render_architecture_badge():
        """Badge Clean Architecture"""
        st.sidebar.markdown("""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 0.75rem; border-radius: 8px; margin: 1rem 0;
                    text-align: center;">
            <div style="font-size: 0.9rem; font-weight: bold;">🏗️ Clean Architecture</div>
            <div style="font-size: 0.7rem; opacity: 0.8;">Enterprise Grade</div>
        </div>
        """, unsafe_allow_html=True)