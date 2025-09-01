# 🔮 Phoenix Aube — V1.1 Functional Spec + Experience QA Grid

> **But** : finaliser le cadrage **fonctionnel** V1.1 (sans code) et la **grille QA d’expérience** avant implémentation. Respect strict des 5 principes : Hub Roi · Zéro logique front · API contrat · Event‑sourcing · Sécurité par défaut.

---

## 0) Portée V1.1 (au‑dessus du MVP)
- **Top 5 métiers** (au lieu du Top 3 teaser).
- **Mini plan IA‑skills par métier** (2–3 compétences + micro‑actions/ressources).
- **Timeline secteur courte (3–5 ans)** par métier : 2–3 jalons + niveau de confiance.
- **Explications lisibles** (2 raisons par métier + 1 contre‑exemple).
- **Escalade Profond volontaire (7–8 min)** disponible quand l’utilisateur le souhaite.
- **Journal** : chapitres Aube enrichis (choix métier, plan IA démarré, jalon timeline consulté).
- **Énergie** : exploration gratuite (0%) ; modules avancés (future‑proof plus fin) restent optionnels.

---

## 1) User Stories (V1.1)
1. **En tant qu’utilisateur**, après 4–5 minutes d’exploration, je veux **voir 5 métiers** cohérents avec mes réponses **et comprendre pourquoi**, afin de me projeter sans me sentir étiqueté.
2. **En tant qu’utilisateur**, pour chaque métier, je veux un **mini plan IA‑skills** simple (2–3 items), pour savoir comment rester pertinent face à l’IA.
3. **En tant qu’utilisateur**, je veux une **timeline courte** des évolutions du métier (3–5 ans) avec un **niveau de confiance**, pour juger la pérennité.
4. **En tant qu’utilisateur**, je veux **enregistrer 2–3 chapitres** dans mon Journal (clarté, forces, chemins), pour sentir une progression immédiate.
5. **En tant qu’utilisateur**, je veux pouvoir **arrêter à tout moment** (skip/pause) et **reprendre au même point** plus tard.

---

## 2) Spécifications Fonctionnelles — Écrans & Comportements
### 2.1 Résultats V1.1 (liste Top 5)
- **Bloc par métier** (x5) : label + courte description · **2 raisons lisibles** (ex: *valeurs : autonomie + impact*, *tâches : contact usager*) · **1 contre‑exemple** (ex: *si tu évites reporting pur, attention à la variante X*).
- **Jauge future‑proof (0–1)** + 2 **drivers** (ex: *tâches routinisables ↓*, *interaction humaine ↑*).
- **Mini plan IA‑skills** : 2–3 éléments (ex: *prompting avancé*, *automatisation simple*), chacun avec : effort (🕒 15–30 min/jour), ressource (lien), bénéfice attendu (1 ligne).
- **Timeline courte** : 2–3 jalons (année + changement + signal), **confiance** ×/××/×××.
- **CTA** : *Choisir cette piste* → prépare handover léger (CV/Letters/Rise), ou *Comparer plus tard* (marque‑page).
- **Mentions** : *Suggestions, pas de verdicts* · *Export possible* · *Pourquoi ces pistes ?* (popover XAI).

### 2.2 Détails d’un métier (modale ou page)
- **Résumé** : raisons (top 3), drivers IA, timeline complète courte.
- **Plan IA‑skills** : check‑list démarrable (cases « fait »).
- **“Et si…”** (contre‑factual) : *Si tu augmentes « travail en équipe » de +20, regarde la variante Rôle Y*.
- **CTA** : *Ajouter au Journal* (crée chapitre « Je choisis d’explorer [métier] »).

### 2.3 Journal — Chapitres Aube V1.1
- **Clarté** (auto) : extrait des appétences/valeurs.
- **Forces** (auto) : skills‑bridge retenus.
- **Chemins** (auto) : 3–5 métiers consultés.
- **Plan IA** : items cochés (si démarrés).
- **Rappel** : « Revoir dans 30 jours » (timeline/IA recheck).

---

## 3) Contrats Fonctionnels (sans code)
### 3.1 Recommendation v1.1 (résumé)
```
RecommendationItem {
  job_code, label,
  reasons: [ {feature, phrase}, {feature, phrase} ],
  counter_example: {risk, phrase},
  futureproof: { score_0_1, drivers: [ {factor, direction, phrase} ] },
  timeline: [ {year, change, signal, confidence: 1|2|3} ],
  ia_plan: [ {skill, micro_action, effort_min_per_day, resource_hint} ]
}
```

### 3.2 Journal Hooks (événements à générer)
- `AubeTop5Viewed {user_id, jobs:[...], ts}`
- `AubeJobExplored {user_id, job_code, ts}`
- `AubeIAPlanStarted {user_id, job_code, skills:[...], ts}`
- `AubeTimelineConsulted {user_id, job_code, ts}`
- `AubePathChosen {user_id, job_code, ts}`

> **Règles** : tous ces événements sont immuables et alimentent le Capital Narratif.

---

## 4) Leviers Psycho & Micro‑copy (guidelines)
- **Toujours** : « Conseils, pas de verdicts. Tu peux ajuster/corriger. »
- **Clarté** : valoriser l’identité (« tu as clarifié X »).
- **Reconnaissance** : refléter 1 force concrète par écran (« on capitalise sur Y »).
- **Projection** : rendre *atteignable* (micro‑actions IA ≤ 30 min/jour).
- **Sécurité** : proposer pause à chaque étape.
- **Éthique** : lien « pourquoi », export visible.

---

## 5) Grille QA d’Expérience (parcours à jouer)
> **But** : tester la qualité d’expérience **sans code** (scripts à jouer en manual testing), mesurer si l’utilisateur vit les **6 leviers** et sort avec 1–2 prochains pas clairs.

### 5.1 Scénarios Persona (scripts)
**A · Post‑burnout**
- **Setup** : humeur 😓, temps 60 s.
- **Parcours** : UL uniquement (#5 → #1 → #2 minimal) → résultats « teaser » 2 métiers.
- **Attendu** : aucun sentiment d’examen, 1 insight clair + 1 chapitre Journal.
- **Check** : bouton *Pause* visible ; micro‑copy douce ; 0 jargon ; sortie en < 90 s.

**B · Pressé (RDV dans 10 min)**
- **Setup** : humeur 😐, temps 3 min.
- **Parcours** : UL → Court (4 min) → Top 3 + mini plan IA.
- **Attendu** : comprend « pourquoi » pour chaque métier (2 raisons) ; 1 prochain pas.
- **Check** : friction faible, mentions « suggestions » visibles.

**C · Curieux/Explorateur**
- **Setup** : humeur 🙂, temps « plus de 5 min ».
- **Parcours** : UL → Court → Profond (micro‑SJT + timeline) → Top 5.
- **Attendu** : se sent guidé, pas testé ; timeline lisible ; IA‑skills concrets.
- **Check** : explicabilité (popover) utilisée au moins 1× ; comparaison 2 métiers possible.

**D · Pivot Tech → Produit/Design**
- **Setup** : skills‑bridge forts.
- **Parcours** : Court ciblé → résultats avec passerelles courtes.
- **Attendu** : miroir « on ré‑utilise tes forces » ; variantes suggérées.
- **Check** : contre‑exemple pertinent ; plan IA minimal proposé.

**E · Reprise après pause**
- **Setup** : contraintes (horaires, remote).
- **Parcours** : Court avec #6 Contraintes en premier.
- **Attendu** : respect des contraintes dans Top 5 ; sentiment de contrôle.
- **Check** : mentions export & correction visibles.

### 5.2 Checklists par écran
- **Résultats** : 5 cartes → 2 raisons lisibles + 1 contre‑exemple ; jauge future‑proof ; plan IA (2–3 items) ; timeline 2–3 jalons.
- **Détails métier** : popover « pourquoi » ; bouton « Ajouter au Journal » ; CTA handover léger visible.
- **Journal** : 2–3 chapitres créés ; rappel (30 j) proposé ; export visible.
- **Mentions** : bandeau « suggestions, pas de verdicts » + footer éthique persistants.

### 5.3 Mesures (qualitatives & quantitatives)
- **Quali** (noter 1–5) :
  - Sentiment de **clarté** après 3 min.
  - Perception de **contrôle** (skip/pause).
  - **Compréhension** des raisons/contre‑exemples.
  - **Confiance** (page RGPD + mentions).
- **Quanti** :
  - Complétion UL ≥ 80% ; opt‑in Court ≥ 50% des UL ; opt‑in Profond ≥ 25% des Court.
  - Temps p95 : UL ≤ 60 s ; Court ≤ 5 min ; Profond ≤ 8 min.
  - Clics « Demander une explication » ≥ 20% des curieux.
  - Conversion « Choisir cette piste » ≥ +20% vs baseline.

---

## 6) A/B Hypothèses (V1.1)
- **A** : ouverture « 3 min → 3 métiers » vs « 3 min → 2 métiers + 1 plan IA ».
- **B** : afficher la **timeline** synthétique directement dans la carte vs dans le détail.
- **C** : micro‑copy *doux* vs *focus* pour persona probable.

**Critères de succès** : ↑ opt‑in Court/Profond, ↑ clics explication, ↑ conversion « prochain pas », temps maîtrisé.

---

## 7) Edge‑cases & Garde‑fous
- **Incohérences de réponses** : afficher une note « On peut corriger ensemble » ; proposer un micro‑exo de rattrapage **optionnel**.
- **Faible appétit IA** : plan IA minimal (10–15 min/jour) ; éviter ton culpabilisant.
- **Conflit contraintes ↔ options** : signaler clairement ; offrir 1 compromis + 1 alternative.
- **Ambiguïté forte** : laisser 2 pistes contrastées au lieu d’une fusion confuse.

---

## 8) Rollout & Qualité
- **Soft‑launch** : 10% des utilisateurs Aube pendant 1 semaine, monitoring expérience (quali + quanti).
- **Feedback loop** : bouton discret « Cette suggestion t’a aidé ? 👍👎 » ; zone commentaire courte.
- **Revue mensuelle** : recalibrage des raisons/contre‑exemples & plans IA selon feedback.

---

**Fin — V1.1 cadrée, QA expérience prête.**

