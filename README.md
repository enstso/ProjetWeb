## Organisation du projet

Ce dépôt suit une organisation simple :

- `backend/` : API **AdonisJS** (Node.js)
- `frontend/` : application **React** (interface utilisateur)

L’objectif est de fournir une application web de gestion d’objectifs et d’habitudes (objectifs + étapes, habitudes +
suivi/streaks), avec une mise en place DevOps complète (Docker, CI/CD, GitHub Projects).

---

## Workflow Git (GitFlow)

Le projet respecte un workflow inspiré de **GitFlow** :

- `main` : branche de production (stable)
- `develop` : branche d’intégration (développement)
- `feature/*` : nouvelles fonctionnalités (ex: `feature/auth`, `feature/goals-crud`)
- `fix/*` : corrections de bugs (ex: `fix/streak-calculation`)
- `release/*` : préparation d’une version (optionnel)
- `hotfix/*` : correctifs urgents sur `main` (optionnel)

Règles :

- Les développements se font sur des branches `feature/*` à partir de `develop`.
- Les Pull Requests ciblent `develop`.
- Une fois stable, `develop` est fusionnée dans `main` pour livrer une version.

---

## GitHub Projects (Kanban)

La gestion des tâches se fait via **GitHub Projects** en mode Kanban :

- Backlog → Todo → In Progress → Done

Chaque issue correspond à une tâche, groupée par Epics (Foundations, Goals, Habits, Dashboard, Quality).

---

## Docker

L’application est conteneurisée. Le lancement se fait avec :

```bash
docker-compose up --build
````

Objectif : démarrer **frontend + backend + PostgreSQL** avec une seule commande.

---

## CI/CD

Une pipeline **GitHub Actions** est configurée pour automatiser :

* Lint (frontend + backend)
* Tests (au minimum : progression objectifs & streaks)
* Build (frontend + backend)

---

## MVP

## Must have (MVP)

**Utilisateurs**

* Inscription + connexion (authentification sécurisée)
* Profil utilisateur : afficher + modifier les informations

**Objectifs**

* Créer un objectif (titre obligatoire, description, dates début/deadline, priorité, statut, catégorie)
* Voir la liste des objectifs
* Filtrer par statut et priorité
* Trier par date d’échéance (deadline)
* Voir le détail d’un objectif avec sa progression
* Modifier un objectif
* Marquer un objectif comme complété
* Supprimer un objectif

**Étapes d’objectifs**

* Ajouter des étapes à un objectif (titre, deadline optionnelle, statut à faire/complétée)
* Modifier / supprimer une étape
* Marquer une étape comme complétée
* Calculer la progression de l’objectif (% d’étapes complétées)

**Habitudes**

* Créer une habitude (nom obligatoire, description, fréquence quotidienne ou X/semaine, catégorie, date de début)
* Voir la liste des habitudes actives
* Modifier une habitude
* Archiver une habitude

**Suivi des habitudes (tracking)**

* Vue calendrier ou grille pour visualiser l’historique
* Bouton “check” pour marquer l’habitude complétée aujourd’hui
* Possibilité d’annuler (uncheck)
* Pas de double comptage (1 log par habitude et par date)
* Gestion du fuseau horaire pour “aujourd’hui”
* Calcul : streak actuel + meilleur streak + taux de complétion

**Tableau de bord**

* Vue d’ensemble des objectifs en cours
* Vue d’ensemble des habitudes du jour
* Stats de base : nombre d’objectifs complétés, streak le plus long, habitudes complétées aujourd’hui

**Interface**

* Interface responsive (mobile/tablette/desktop)
* Navigation claire entre objectifs et habitudes
* Feedback visuel lors des complétions + messages de motivation

**Exigences techniques obligatoires**

* Docker + `docker-compose up` fonctionnel
* CI/CD (GitHub Actions) : lint + tests + build
* Tests automatisés minimum sur : progression objectifs + streaks
* Documentation minimum : README + `.env.example` + doc API + schéma BDD + explication des algorithmes

---

## Should have (v2)

* Graphiques de progression (objectifs) + graphiques d’évolution des streaks
* Heatmap habitudes (calendrier coloré)
* Statistiques par catégorie
* Tags (objectifs/habitudes) + filtrage par tags
* Notes sur objectifs + journal quotidien

---

## Nice to have (v3)

* Rappels email (habitudes + deadlines)
* Gamification complète (XP, niveaux, badges, défis hebdo)
* Revue hebdomadaire / mensuelle automatique + suggestions
* Templates d’objectifs + duplication
* Partage social / objectifs d’équipe
* Export de données (PDF, CSV/JSON)
* PWA (offline + installation + notifications push)

