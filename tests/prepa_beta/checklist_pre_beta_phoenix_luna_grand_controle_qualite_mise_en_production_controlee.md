# 🎯 Objectif
Assurer que la bêta peut être ouverte en toute sécurité et cohérence, en conformité stricte avec les principes directeurs de l’écosystème Phoenix‑Luna.

> Directives non négociables à respecter **partout** :
> 1) **Le Hub est Roi** (toute logique métier dans `phoenix-backend-unified`).
> 2) **Zéro Logique Métier dans le Frontend** (affichage + capture d’intentions seulement).
> 3) **L’API est un Contrat Sacré** (endpoints & schémas = loi).
> 4) **Tout est un Événement** (chaque changement d’état ⇒ événement Event Store).
> 5) **La Sécurité est une Fondation** (sécurité by‑default, pas en post‑traitement).

---

## 0) Gate global « Go/No‑Go »
- [ ] **Version figée** (tag git, changelog bêta rédigé, numérotation sémantique).
- [ ] **Branche release protégée** (merge via PR + checks obligatoires).
- [ ] **Feature flags** activables pour toutes fonctionnalités bêta.
- [ ] **Plan de rollback** documenté, testé (scripts de retour arrière instantanés).

---

## 1) Architecture & Cohérence (Hub Roi)
- [ ] **Inventaire de la logique métier** : audit des packages/services ; toute règle métier doit vivre dans `phoenix-backend-unified`.
- [ ] **Front‑end** : aucune décision métier ; les composants ne font que : (a) présenter des données, (b) émettre des intentions/action creators.
- [ ] **Lints/CI** : règle bloquante interdisant l’import de modules métier côté front.
- [ ] **Docs d’architecture** à jour (diagrammes, flux, ownership, limites de contexte).

### Vérifications techniques
- [ ] **Bounded contexts** explicites ; pas de couplage fort cross‑domain.
- [ ] **Services de domaine** testés unitairement (happy/edge/evil cases).
- [ ] **Idempotence** des commandes sensibles (création, paiement, provisioning…).

---

## 2) Frontend sans logique métier
- [ ] **Selectors**/formatters purement présentatifs (pas de règles métier cachées).
- [ ] **Appels API** : intentions dispatchées, pas de calculs de règles côté client.
- [ ] **Validation** UI = uniquement syntactique/ergonomique (contrats métiers vérifiés serveur).
- [ ] **Protection anti‑régression** : tests E2E couvrant les parcours clés.

---

## 3) API = Contrat sacré
- [ ] **Schémas** (OpenAPI/Proto/JSON‑Schema) versionnés, publiés, signés.
- [ ] **Tests de contrat** (provider/consumer) verts sur CI pour chaque client.
- [ ] **Compat ascendante** (pas de breaking change sans version majeure/flag).
- [ ] **Génération clients** à partir du schéma (pas d’API « à la main »).
- [ ] **Drift detector** : écart code ↔️ schéma = échec CI.
- [ ] **Idempotency‑Keys** & **retry semantics** documentés.

---

## 4) Event‑Sourcing / Event Store (« Tout est un événement »)
- [ ] **Chaque commande** qui modifie l’état **émet un événement** persistant.
- [ ] **Contrats d’événements** versionnés (eventName, version, payload, source, causationId, correlationId).
- [ ] **Outbox pattern** pour livraison fiable ; **replay** testable à froid.
- [ ] **Projections** (read models) reconstruites from‑scratch sans perte.
- [ ] **Idempotence** des handlers ; **garantie d’ordre** si nécessaire.
- [ ] **Traçabilité** bout‑en‑bout (traceId sur commande → événements → projections).

---

## 5) Sécurité by‑default
- [ ] **AuthN/AuthZ** : RBAC/ABAC centralisé côté Hub ; jamais côté front.
- [ ] **Stockage secrets** (KMS/Vault) ; **rotation** automatisée.
- [ ] **Durcissement** : headers HTTP, CSP, CORS minimal, HSTS, cookies `HttpOnly`/`Secure`.
- [ ] **Chiffrement** : données au repos (KMS) + en transit (TLS) ; PFS.
- [ ] **Journal d’audit** immuable (connexion, changement droits, exports données).
- [ ] **Dépendances** : SCA/SBOM, vulnérabilités critiques = release bloquée.
- [ ] **SAST/DAST** : scans automatiques avec seuils de blocage.
- [ ] **Rate‑limit/anti‑abuse** & **WAF** en amont.
- [ ] **Conformité** (ex. RGPD) : registre traitements, DPA, minimisation, rétention.

---

## 6) Qualité & Tests
- [ ] **Unitaires** : ≥ 90% des domaines critiques, mutants tués (mutation testing idéalement).
- [ ] **Intégration** : tests inter‑services sur environnements éphémères.
- [ ] **Contrats** : provider/consumer (cf. §3) ; échec = blocage release.
- [ ] **E2E** : parcours bêta clés passants (signup, login, paiement, flows métier).
- [ ] **Tests de charge** : SLA/SLO validés (p99 latence, erreurs < seuil, saturation).
- [ ] **Résilience** : chaos/latence artificielle → dégradations contrôlées.

---

## 7) Observabilité & Opérations
- [ ] **Logs structurés** (corrélation traceId, niveaux normalisés).
- [ ] **Metrics** RED/USE + métiers (KPI bêta) exposées & alertées.
- [ ] **Traces distribuées** (Hub, workers, projections, gateways).
- [ ] **Dashboards** prêts (NOC/SRE + Produit) avec SLO et error budget.
- [ ] **Alerting** actionnable (pas d’alertes « bruit ») avec ownership clair.
- [ ] **Runbooks** & **Playbooks** (incidents, saturation, rollback, régénération projections).

---

## 8) Données & Migrations
- [ ] **Scripts de migration** idempotents, testés sur dump réaliste.
- [ ] **Plan de seed** pour comptes/données bêta ; **anonymisation** si données réelles.
- [ ] **Sauvegardes** vérifiées (restore test) ; **RPO/RTO** documentés.
- [ ] **Politique de rétention** (événements, read models, logs).

---

## 9) Infra & Déploiement
- [ ] **IaC** (infra as code) source‑contrôlée ; revues obligatoires.
- [ ] **Parité env** (dev/staging/prod‑bêta) ; variables/secret maps traçables.
- [ ] **Pipelines CI/CD** reproductibles, artefacts immutables signés.
- [ ] **Déploiement progressif** : canary/blue‑green + health checks.
- [ ] **Quotas/limites** (CPU/mémoire/connexions) définis ; autoscaling testé.

---

## 10) Expérience Utilisateur & Accessibilité
- [ ] **Perf FE** (Core Web Vitals) ; pas de calculs lourds côté client.
- [ ] **Accessibilité** (WCAG basiques) ; navigation clavier & lecteurs d’écran.
- [ ] **Internationalisation** : locales, formats, fuseaux (Europe/Paris par défaut si pertinent).

---

## 11) Documentation & Communication
- [ ] **README ops** (démarrage, variables, secrets, migrations, flags, runbooks).
- [ ] **Catalogue d’APIs** signé, partagé avec consommateurs.
- [ ] **Journal des changements** (bêta) & **notes de version** orientées risques.
- [ ] **Plan support** (SLA bêta, canaux, on‑call, escalade, statut public).

---

## 12) Revue Finale Croisée
- [ ] **Walkthrough** par domaine (dev + QA + SRE + sécurité + produit).
- [ ] **Tableau des dettes** identifié avec décisions « maintenant / après bêta ».
- [ ] **Validation Oracle Phoenix** (conformité à la vision) & **Dédale** (exécution technique).

---

## Annexes – Scripts/Automations suggérés (adapter au repo)
- [ ] `make audit` : lint + format + SCA + SAST + licences.
- [ ] `make test-all` : unitaires + intégration + contrats + e2e (headless).
- [ ] `make perf` : charge & rapport SLA/SLO.
- [ ] `make security` : DAST ciblé sur endpoints publics.
- [ ] `make deploy-beta` : déploiement canary + vérifs post‑déploiement + possibilité rollback.
- [ ] `make replay` : reconstruction complète des projections depuis l’Event Store.

---

### Critères « Go » minimum pour ouvrir la bêta
- [ ] Tous les **contrats API** et **contrats d’événements** versionnés et publiés.
- [ ] **Aucune logique métier** détectée côté frontend (lint/scan passants).
- [ ] **Tests de contrat** et **E2E parcours clés** : 100% verts.
- [ ] **Observabilité opérationnelle** prête (dashboards + alertes).
- [ ] **Sécurité** : scans sans critique/bloquante ; secrets/CFG conformes.
- [ ] **Plan de rollback** testé + sauvegardes/restores validés.

