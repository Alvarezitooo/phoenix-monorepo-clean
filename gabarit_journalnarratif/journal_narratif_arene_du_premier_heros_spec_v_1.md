# 🌙 Journal Narratif — Arène du Premier Héros (Spec v1.0)

**But** : concevoir l’interface centrale qui matérialise les **6 leviers psychologiques** (chapitrage, progression, complicité, projection, appartenance, rempart éthique) pour transformer **un utilisateur** en **Héros**. Respect strict des 5 directives : **Hub Roi • Zéro Frontend Logic • API Contrat Sacré • Tout = Événement • Sécurité par défaut**.

---

## 1) Principes & Contraintes Non Négociables
- **Hub Roi** : toute donnée (progress, insights, énergie, social proof) vient d’API du **phoenix-backend-unified**.
- **Frontend sans logique métier** : affichage + capture d’intentions (clicks, choix, confirmations). Pas de calcul de tendances côté client.
- **Contrat d’API** : utilisation des endpoints existants + 1 endpoint **agrégateur** proposé (à valider) pour servir la page.
- **Event-Driven** : chaque action UI déclenche un **événement** durable.
- **Sécurité** : Security Guardian, validations d’entrée, aucune donnée sensible dans le client, anti-XSS/CSRF.

---

## 2) Parcours Héros — Storyboard UX (6 écrans clés)

### Écran A — **Session Zéro (Arrivée)**
**Objectif** : ancrer la mission du jour et initialiser le Journal.
- Hero copy : « Bonjour [Prénom], quelle est ta mission aujourd’hui ? 🎯 »
- CTA primaires : *Optimiser mon CV*, *Rédiger une lettre*, *Clarifier mon cap*.
- Micro-composants :
  - **Ancrage éthique** (levier 6) : badge « Ton histoire t’appartient. Export possible à tout moment. »
  - **État énergie** (résumé + lien détails).
- Événements : `SessionZeroViewed`, `MissionSelected`.

### Écran B — **Journal (État vide guidé)**
**Objectif** : amorcer l’écriture du 1er chapitre.
- Timeline « Chapitres » (vide) + coach mark : « Chaque action devient un chapitre visuel 📖 » (levier 1).
- Carte « Première étape suggérée » (levier 4 : projection), ex : « Démarrer *Bilan express* (5%) ».
- Événements : `JournalViewed`, `CoachmarkAcknowledged`.

### Écran C — **Journal (Actif)**
**Objectif** : matérialiser la progression et la complicité.
- **Barre de progression narrative** (levier 2) avec palier courant et prochain palier (« ATS moyen 78 → objectif 85 »).
- **Dernier progrès** (levier 3) : message contextualisé (« Tu as surmonté ton doute *réseautage* ✅ »).
- **Prochaine étape** (levier 4) : 2–3 CTA énergie-aware : ex « Optimisation CV (12%) », « Mirror Match (30%) ».
- **Utilisateurs comme toi** (levier 5) : bandeau de comparaison anonymisée (« 90% ont exploré *LinkedIn Power Moves* »).
- **Rempart éthique** (levier 6) : carte « Propriété & export » + bouton *Exporter mon récit*.
- Événements : `NextActionPreviewed`, `EnergyPreviewRequested`, `CTASelected`.

### Écran D — **Confirmation d’Action**
- Copie empathique + prévisualisation de l’impact énergie (issu du Hub) : « Cette optimisation utilisera **12%** de ton énergie. Après : **48%**. On y va ? 🚀 »
- Boutons : *Oui, allons‑y* / *Pas maintenant*.
- Événements : `ActionConfirmed` / `ActionCancelled`.

### Écran E — **Chapitre Détail**
- Avant/après (mini), contributions au capital narratif (+compétences, +preuves, +métriques).
- Zone « Perception & doutes » (capturer note courte → influence boucle comportementale).
- Événements : `ChapterOpened`, `ReflectionAdded`.

### Écran F — **Palier atteint (Rituel de Clôture)**
- Célébration concise (« Tu viens d’atteindre ATS 85 🎉 ») + *Prochain jalon*.
- Option *Plan de 7 jours* (levier 2 + 4), micro-objectifs quotidiens.
- Événements : `MilestoneReached`, `Plan7DaysStarted`.

---

## 3) Architecture d’Interface — Information Architecture
- **Header Journal** : salutation, mission du jour, statut énergie.
- **Timeline Chapitres** : items (icône, titre, gain narratif, date).
- **KPI Narratifs** : cartes KPI (ATS moyen, compatibilité, preuves ajoutées…), tendances.
- **Next Steps (CTA)** : liste d’actions avec coût énergie estimé + bénéfice attendu.
- **Social Proof** : bandeau comparaisons anonymisées contextuelles.
- **Ethical Anchor** : bloc propriété/export + préférences de partage.

---

## 4) États & Machine à États (simplifiée)
- `EMPTY` → `ONBOARDING` → `ACTIVE` → `MILESTONE` → `MAINTAIN`.
- Transitions clés :
  - `EMPTY`→`ONBOARDING` : première mission choisie.
  - `ACTIVE`→`MILESTONE` : KPI atteint.
  - `ACTIVE`→`MAINTAIN` : baisse d’activité > N jours → mode relance bienveillant.

---

## 5) Contrats de Données — **JournalDTO v1** (servi par le Hub)

> **Route agrégatrice proposée** (à valider) : `GET /luna/journal/{user_id}`
> Retourne toutes les données nécessaires à l’écran en **une seule** réponse (éviter n+1 appels en front).

```json
{
  "user": {"id": "uuid", "first_name": "string", "plan": "standard|unlimited"},
  "energy": {"balance_pct": 48, "last_purchase": "iso8601"},
  "narrative": {
    "chapters": [
      {"id":"uuid","type":"cv","title":"CV optimisé","gain":["+2 compétences","ATS +6"],"ts":"iso8601"}
    ],
    "kpis": {
      "ats_mean": {"value": 82, "target": 85, "trend":"up","delta_pct_14d": 12},
      "letters_count": {"value": 2}
    },
    "last_doubt": "reseautage",
    "next_steps": [
      {"action":"optimisation_cv","cost_pct":12,"expected_gain":"ATS +3"},
      {"action":"mirror_match","cost_pct":30,"expected_gain":"Compatibilité +8"}
    ]
  },
  "social_proof": {
    "peers_percentage_recommended_step": 0.9,
    "recommended_label": "LinkedIn Power Moves"
  },
  "ethics": {"ownership": true, "export_available": true}
}
```

**Notes** :
- `cost_pct` doit provenir de la **grille énergie** serveur.
- Les tendances/targets sont calculées côté Hub.

---

## 6) Endpoints (existants & proposés)
**Existants** (lecture serveur → front) :
- `GET /luna/narrative/{user_id}` : reconstruction narrative (source primaire).
- `POST /luna/energy/check` : solde / règle Unlimited.
- `GET /luna/energy/analytics/{user_id}` : historiques & agrégats.

**Proposés** (à valider, non breaking) :
- `GET /luna/journal/{user_id}` : **agrégateur JournalDTO v1**.
- `POST /luna/energy/preview` : estimation coût d’action (utilisé en modale de confirmation).

---

## 7) Schémas d’Événements (Event Store)
- `SessionZeroViewed { user_id, ts }`
- `MissionSelected { user_id, mission, ts }`
- `JournalViewed { user_id, ts }`
- `NextActionPreviewed { user_id, action, cost_pct, ts }`
- `EnergyPreviewRequested { user_id, action, ts }`
- `ActionConfirmed { user_id, action, cost_pct, ts }`
- `ActionCancelled { user_id, action, ts }`
- `ChapterOpened { user_id, chapter_id, ts }`
- `ReflectionAdded { user_id, text, sentiment?, ts }`
- `MilestoneReached { user_id, kpi, value, target, ts }`
- `Plan7DaysStarted { user_id, plan_id, ts }`

Chaque événement est **immuable**, utilisé pour reconstruire le Capital Narratif.

---

## 8) UI Components (nommage & responsabilités)
- `<JournalHeader />` : greeting, mission du jour, énergie.
- `<NarrativeProgress />` : KPIs barres + paliers.
- `<ChaptersTimeline />` : liste chapitres (tri desc.)
- `<NextSteps />` : CTA list (actions + coûts + gains attendus).
- `<EnergyConfirmationModal />` : message empathique + coût + boutons.
- `<SocialProofBanner />` : comparaisons anonymisées.
- `<EthicalAnchor />` : propriété/export/préférences.
- `<Coachmarks />` : pédagogie progressive.

> **Front** = rendu + intents. Le **Hub** décide.

---

## 9) Microcopy Library (exemples prêts à l’emploi)
- Greeting : « Bonjour [Prénom], prêt à écrire la suite ? 🌙 »
- Progrès : « +20% de compatibilité ATS en 14 jours — bien joué ! ✅ »
- Doubtes : « On transforme *réseautage* en plan concret, pas à pas. »
- CTA : « Optimisation CV (12%) — objectif ATS 85 🎯 »
- Ethique : « Ton histoire est sauvegardée. Elle t’appartient. Export possible à tout moment. »

---

## 10) Accessibilité & Internationalisation
- Contrastes AA, focus visibles, support clavier, aria‑labels.
- Emojis assortis d’aria‑label (ex. `aria-label="lune"`).
- Chaînes en i18n (FR d’abord).

---

## 11) KPIs & Expériences à Tester
- **Activation** : % d’utilisateurs complétant Session Zéro.
- **Engagement** : temps dans le Journal, chapitres/sem., confirmations d’actions.
- **Progression** : delta ATS moyen 14j.
- **Énergie** : taux d’actions énergie-aware, achats pack vs Unlimited.
- **Rétention** : D1/D7/D14 retour au Journal.
- **Éthique** : taux d’exports, taux d’opt‑in social proof.

A/B internes :
- Ouverture « Félicitations » vs « Objectif du jour ».
- 2 vs 3 CTA dans *Next Steps*.

---

## 12) Sécurité & Confidentialité
- Aucun identifiant sensible dans le client.
- Données « social proof » **agrégées/anonymisées** par le Hub.
- Consentement explicite pour tout partage futur (case opt‑in stockée côté Hub).
- Journaux d’audit : émission d’événements pour toutes les interactions Journal.

---

## 13) Plan d’Intégration Technique
1. **BE (Hub)** : implémenter `GET /luna/journal/{user_id}` (agrégateur) + `POST /luna/energy/preview`.
2. **BE (Satellites)** : aucune logique — consomment/émettent via Hub.
3. **FE** : créer composants + appels **uniques** à l’agrégateur.
4. **Observabilité** : logs structurés + métriques (latence, erreurs) + événements analysables.

---

## 14) Critères d’Acceptation (MVP Héros)
- Page Journal charge en < 500 ms (95e) avec **1 appel** agrégateur.
- Tous les CTA affichent un **coût énergie** issu du Hub.
- Chaque interaction déclenche un **événement** (vérifié en base).
- Affichage d’au moins **3 chapitres** après 1 journée d’usage normal.
- Progrès narratif et **prochaine étape** toujours visibles.
- Bouton **Exporter mon récit** fonctionnel (fichier JSON/Markdown).

---

## 15) Annexes (exemples JSON)

### 15.1 Energy Preview (réponse)
```json
{ "action":"optimisation_cv", "cost_pct":12, "balance_before":60, "balance_after":48 }
```

### 15.2 Événement Milestone
```json
{ "type":"MilestoneReached", "user_id":"uuid", "kpi":"ats_mean", "value":85, "target":85, "ts":"iso8601" }
```

---

**Fin de la Spec v1.0 — prête pour exécution.**

