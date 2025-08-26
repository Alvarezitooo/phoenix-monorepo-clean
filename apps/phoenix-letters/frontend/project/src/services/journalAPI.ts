import { authService } from './authService';

// Types from backend JournalDTO
export interface JournalUser {
  id: string;
  first_name: string;
  plan: 'standard' | 'unlimited';
}

export interface JournalEnergy {
  balance_pct: number;
  last_purchase: string | null;
}

export interface JournalKpiAts {
  value: number;
  target: number;
  trend: 'up' | 'down' | 'flat';
  delta_pct_14d: number;
}

export interface JournalKpiLetters {
  value: number;
}

export interface JournalKPIs {
  ats_mean?: JournalKpiAts;
  letters_count?: JournalKpiLetters;
}

export interface JournalChapter {
  id: string;
  type: 'cv' | 'letter' | 'analysis' | 'milestone' | 'energy' | 'other';
  title: string;
  gain: string[];
  ts: string;
}

export interface JournalNextStep {
  action: string;
  cost_pct: number;
  expected_gain: string;
}

export interface JournalNarrative {
  chapters: JournalChapter[];
  kpis: JournalKPIs;
  last_doubt: string | null;
  next_steps: JournalNextStep[];
}

export interface JournalSocialProof {
  peers_percentage_recommended_step: number;
  recommended_label: string | null;
}

export interface JournalEthics {
  ownership: boolean;
  export_available: boolean;
}

export interface JournalDTO {
  user: JournalUser;
  energy: JournalEnergy;
  narrative: JournalNarrative;
  social_proof: JournalSocialProof | null;
  ethics: JournalEthics;
}

export interface EnergyPreviewRequest {
  user_id: string;
  action: string;
}

export interface EnergyPreviewResponse {
  action: string;
  cost_pct: number;
  balance_before: number;
  balance_after: number;
  can_perform: boolean;
  unlimited_user: boolean;
}

export interface JournalExportRequest {
  user_id: string;
  format: 'json' | 'markdown' | 'pdf';
  include_metadata?: boolean;
}

export interface JournalExportResponse {
  success: boolean;
  download_url: string | null;
  content: string | null;
  format: string;
  generated_at: string;
  expires_at: string | null;
}

class JournalAPI {
  private getBaseURL(): string {
    // Use environment variable or fallback to Railway production URL
    return import.meta.env.VITE_LUNA_HUB_URL || 'https://phoenix-backend-unified-production.up.railway.app';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = authService.getToken();
    
    const response = await fetch(`${this.getBaseURL()}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Journal API Error (${response.status}): ${errorData}`);
    }

    return response.json();
  }

  /**
   * 🌙 Récupère le Journal Narratif complet d'un utilisateur
   * Endpoint: GET /luna/journal/{user_id}
   */
  async getJournalData(userId: string, window: '7d' | '14d' | '90d' = '14d'): Promise<JournalDTO> {
    return this.request<JournalDTO>(`/luna/journal/${userId}?window=${window}`);
  }

  /**
   * ⚡ Prévisualise le coût énergétique d'une action
   * Endpoint: POST /luna/energy/preview
   */
  async previewEnergyAction(request: EnergyPreviewRequest): Promise<EnergyPreviewResponse> {
    return this.request<EnergyPreviewResponse>('/luna/energy/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 📄 Exporte le récit narratif de l'utilisateur
   * Endpoint: POST /luna/journal/export
   */
  async exportJournal(request: JournalExportRequest): Promise<JournalExportResponse> {
    return this.request<JournalExportResponse>('/luna/journal/export', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 💬 Récupère un message de confirmation empathique pour une action
   * Endpoint: GET /luna/journal/confirmation-message/{action}
   */
  async getConfirmationMessage(
    action: string, 
    userId: string, 
    costPct?: number
  ): Promise<{ action: string; confirmation_message: string; action_description: string }> {
    const params = new URLSearchParams({ user_id: userId });
    if (costPct !== undefined) {
      params.append('cost_pct', costPct.toString());
    }
    
    return this.request<{ action: string; confirmation_message: string; action_description: string }>(
      `/luna/journal/confirmation-message/${action}?${params}`
    );
  }
}

export const journalAPI = new JournalAPI();