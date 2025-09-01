🔒 Phoenix Aube — V1.1 Decision Pack (Lock)
1) “Contre-exemple” — définition, règles, micro-copy

But : avertir sans alarmer, montrer une limite concrète + alternative actionnable.

Quand l’afficher : pour chaque métier du Top 5, 1 seul contre-exemple maximum, uniquement si un signal utilisateur (valeur/contrainte/avoid) est en conflit fort.

Format UX : puce courte « ⚠️ À surveiller » + phrase lisible + alternative.

Micro-copy type

“⚠️ Si tu évites reporting pur, la variante Analyst classique risque de te peser. Alternative : UX Research junior, plus contact usager.”

Règles de ton : jamais de “mauvais profil”, pas d’étiquette. Toujours proposer 1 alternative.

Suppression : si aucun conflit fort, pas de contre-exemple (éviter le bruit).

2) Mini Plan IA-skills — structure unique (par métier)

But : rendre la pérennité actionnable (≤ 30 min/jour).

Schema (contrat fonctionnel)

{
  "ia_plan": [
    {
      "skill": "Prompting avancé",
      "micro_action": "Reformuler 3 prompts de ton activité en gabarits réutilisables",
      "effort_min_per_day": 20,
      "resource_hint": "kb://ia/prompting-quickstart",
      "benefit_phrase": "Gagner en vitesse sans sacrifier la qualité",
      "difficulty": 1,
      "prereq": null
    },
    {
      "skill": "Automatisation simple",
      "micro_action": "Créer 1 automatisation 'si nouveau brief → checklist'",
      "effort_min_per_day": 25,
      "resource_hint": "kb://automation/zapier-checklists",
      "benefit_phrase": "Réduire les tâches répétitives",
      "difficulty": 2,
      "prereq": "Notions de workflows"
    }
  ]
}


Cardinalité : 2–3 items par métier, jamais plus.

Effort : 15–30 min/jour.

Variantes selon appétit IA :

Faible → items niveau 1 uniquement, vocabulaire B1, zéro jargon.

Élevé → autoriser 1 item niveau 3 (ex. “fine-tuning light” → “atelier guidé 30 min”).

3) Timeline secteur — échelle de confiance et affichage

Horizon : 3–5 ans, 2–3 jalons par métier.

Confiance (icônes remplies) :

× = spéculatif (signaux faibles, opinions d’experts divergentes)

×× = consensus émergent (plusieurs sources convergentes)

××× = confiance forte (tendance établie/stable)

Micro-copy jalon : “2027 — ↑ outillage IA en design ops (××)”

Règles :

Toujours relier 1 jalon ↔ 1 driver de la jauge IA (cohérence narrative).

Disclaimer visible : “Estimations — marchés variables. Relecture conseillée à 3–6 mois.”

Rappel Journal : créer AubeTimelineConsulted + planifier re-check à 90 jours.

4) Explications lisibles (XAI) — gabarits verrouillés

Raisons (2 max) : chaque raison = signal utilisateur → mapping piste.

“Valeurs : autonomie + impact → métiers avec ownership.”

“Tâches aimées : atelier usager → UX/Produit orienté terrain.”

Poids (option, discret) : indicateur simple ↑, →, ↓ (pas de score brut).

Contre-factual rapide (“Et si…”) :

“Et si tu augmentes ‘travail en équipe’ de +20 → regarde Rôle Y.”

Popover ‘Pourquoi ?’ : toujours présent ; pas de jargon modèle.

5) Jauge future-proof (0–1) — règles d’affichage

Arrondir à 2 décimales, sans pourcentage.

Toujours accompagner de 2 drivers (ex. “tâches routinisables ↓”, “interaction humaine ↑”).

Pas de couleur anxiogène : échelle neutre, texte explicite.

Disclaimer court sous la jauge (une ligne).

6) Escalade & Handover — décisions finales

Par défaut : UL (60 s) → proposer Court (3–4 min) uniquement si 👍 et temps ≥ 3 min.

Profond (7–8 min) : opt-in après un mini-gain (chapitre créé ou métier cliqué).

Handover léger (CV/Letters/Rise) en V1.1 : 0% énergie, pré-remplissage minimal, événement journalisé.

7) Micro-copy canonique (à réutiliser telle quelle)

Bandeau résultats :

“Suggestions, pas de verdicts. Tu peux ajuster et exporter. 🌙”

Jauge IA :

“Pérennité estimée : 0.76 — pourquoi : tâches routinisables ↓, interaction humaine ↑”

Contre-exemple :

“⚠️ Si tu évites reporting pur, la variante Analyst classique risque de te peser. Alternative : UX Research junior (plus contact usager).”

Plan IA-skills (titre section) :

“Devenir IA-proof en 30 min/jour — 2 idées pour commencer”

8) Contrats fonctionnels figés (extraits pour intégration)

RecommendationItem v1.1

{
  "job_code": "UXD",
  "label": "UX Designer",
  "reasons": [
    {"feature": "valeurs", "phrase": "Autonomie + impact → métiers à ownership"},
    {"feature": "taches_like", "phrase": "Ateliers usagers → UX terrain"}
  ],
  "counter_example": {"risk": "reporting_pur", "phrase": "Si tu évites le reporting pur… Alternative : UX Research junior"},
  "futureproof": {
    "score_0_1": 0.76,
    "drivers": [
      {"factor": "taches_routinisables", "direction": "down", "phrase": "Tâches routinisables ↓"},
      {"factor": "interaction_humaine", "direction": "up", "phrase": "Interaction humaine ↑"}
    ]
  },
  "timeline": [
    {"year": 2026, "change": "↑ design ops outillé IA", "signal": "adoption large", "confidence": 2},
    {"year": 2028, "change": "↑ co-création homme-IA", "signal": "pratiques établies", "confidence": 3}
  ],
  "ia_plan": [
    {"skill": "Prompting avancé", "micro_action": "Créer 3 gabarits", "effort_min_per_day": 20, "resource_hint": "kb://ia/prompting-quickstart", "benefit_phrase": "Gagner en vitesse", "difficulty": 1}
  ]
}

9) Critères d’acceptation (UX visibles à la démo)

Top 5 : chaque carte affiche 2 raisons, 1 contre-exemple (si conflit fort), jauge + 2 drivers, 2–3 items IA-skills, 2–3 jalons timeline.

Popover Pourquoi ? et footer “suggestions, pas de verdicts” présents.

Journal : 2–3 chapitres créés après la session.

Escalade & handover : opt-in uniquement ; 0% énergie pour V1.1.
