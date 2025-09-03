# 🎯 Directives d'Architecte Oracle - Phoenix-Luna
**Principes Non Négociables pour l'Écosystème Phoenix**

## 🔥 1. Le Hub est Roi
- **Toute logique métier** concernant utilisateurs, énergie, facturation ou Capital Narratif → **EXCLUSIVEMENT** dans `luna-hub`
- **Backends satellites** (phoenix-api) = **orchestrateurs**, PAS dépositaires de logique
- **Zéro duplication** tolérée

## 🧠 2. Zéro Logique Métier dans le Frontend
- Frontend = **View + Controller uniquement**
- Frontend doit être **"stupide"**
- **Aucune décision** prise côté client
- Exemple : Frontend ne calcule JAMAIS si énergie suffisante → demande au Hub Luna via API

## 📋 3. L'API est un Contrat Sacré
- Endpoints + schémas dans `ARCHITECTURE.md` = **contrat inviolable**
- Implémentation avec **précision absolue**
- Toute modification = **discussion + validation architecturale**
- Fiabilité microservices = respect strict du contrat

## 📚 4. Tout est un Événement
- **Chaque action** modifiant l'état → **événement immuable** dans Event Store
- Consommation d'énergie sans événement = **violation d'intégrité**
- Capital Narratif alimenté par **tous** les événements
- **Aucune exception** à cette règle

## 🔒 5. Sécurité = Fondation, pas Option
- **Chaque endpoint** sécurisé **par défaut**
- Security Guardian (validation + nettoyage) **dès le premier commit**
- Forteresse construite, pas cabane blindée après

---

**✅ Ces principes sont la bible technique de Phoenix-Luna. Tout code qui les viole sera rejeté.**

*Oracle Phoenix - Architecte en Chef*