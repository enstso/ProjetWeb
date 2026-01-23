# Projet 4 — Application de gestion d’objectifs et d’habitudes



Application web permettant aux utilisateurs de **créer des objectifs**, les **découper en étapes**, et de **suivre des habitudes** quotidiennes/hebdomadaires avec **tracking**, **streaks**, **stats** et une UI motivante.

---

## Sommaire

- [1. Description](#1-description)
- [2. Stack & Architecture](#2-stack--architecture)
- [3. Fonctionnalités](#3-fonctionnalités)
- [4. Installation & Lancement](#4-installation--lancement)
- [4.1 Lancer avec Docker](#41-lancer-avec-docker)
- [4.2 Lancer en local (sans Docker)](#42-lancer-en-local-sans-docker)
- [5. Configuration (.env)](#5-configuration-env)
- [6. API (Routes)](#6-api-routes)
- [7. Modèle de données](#7-modèle-de-données)
- [8. Algorithmes (progression / streaks / complétion)](#8-algorithmes-progression--streaks--complétion)
- [9. Timezone & Tracking](#9-timezone--tracking)
- [10. Tests](#10-tests)
- [11. CI/CD](#11-cicd)
- [12. Workflow Git / GitHub Projects](#12-workflow-git--github-projects)
- [13. Limitations & pistes d’amélioration](#13-limitations--pistes-damélioration)

---
La doc API: [docs/API.md](docs/API.md) (routes Auth / Goals / Steps / Habits / Logs / Dashboard)

La schéma BDD: [docs/DB.md](docs/DB.md)
## 1. Description

Ce projet vise à fournir une application de développement personnel centrée sur :
- **Objectifs (one-shot)** : créer un objectif avec une deadline, le suivre, le compléter.
- **Étapes d’objectifs** : décomposer un objectif en tâches concrètes et mesurer la progression.
- **Habitudes (récurrentes)** : créer une habitude quotidienne/hebdomadaire, la cocher, afficher un historique.
- **Tableau de bord** : synthèse des objectifs actifs et des habitudes du jour + stats de base.
- **UX motivante** : feedback visuel, messages de motivation, interface responsive.

---

## 2. Stack & Architecture

### Backend
- **AdonisJS (Node.js)** — API REST
- **PostgreSQL** — base relationnelle
- **Lucid ORM** — modèles / relations
- **Luxon** — gestion dates & timezone (tracking “aujourd’hui”)
- **Validation** — VineJS (validators)

### Frontend
- **React**
- **React Router**
- **TailwindCSS** (UI)
- **Axios** (client API)
- Composants UI maison : `Card`, `Button`, `Input`, `Select`, `ProgressBar`, `Toast`, etc.

### Organisation du repo
- `back/` : API AdonisJS
- `front/` : application React

---

## 3. Fonctionnalités

### 3.1 Gestion utilisateurs (MVP)
- Inscription
- Connexion (token)
- Profil (GET /me, PUT /me)

### 3.2 Objectifs (CRUD)
- Créer un objectif :
  - titre (obligatoire), description, catégorie, priorité, statut
  - start_date & deadline (validation : deadline >= start_date)
- Lister les objectifs :
  - filtre par statut/priorité
  - tri par deadline
- Détail d’un objectif
- Modifier / supprimer
- Marquer comme complété

### 3.3 Étapes d’objectifs
- Ajouter / modifier / supprimer des steps
- Cocher une step comme complétée
- Progression de l’objectif = % steps complétées

### 3.4 Habitudes (CRUD)
- Créer / modifier
- Fréquence :
  - `daily`
  - `weekly` avec `weekly_target`
- Archiver / restaurer (unarchive)
- Liste Actives / Archivées côté UI

### 3.5 Habit tracking
- `check today` / `uncheck` (log journalier)
- Unicité (habit_id, date) => pas de double comptage (idempotent)
- Grille mensuelle (historique visuel)
- Stats :
  - streak actuel
  - meilleur streak
  - taux de complétion (%)

### 3.6 Dashboard
- Objectifs actifs (preview + total)
- Habitudes du jour (actives + `completed_today`)
- Stats globales :
  - objectifs complétés
  - streak max (sur toutes les habitudes)
  - habitudes complétées aujourd’hui

---

## 4. Installation & Lancement

### 4.1 Lancer avec Docker

> Objectif : démarrer **PostgreSQL + Backend + Frontend** en une commande.

```bash
docker-compose up --build
````

Ensuite :

* Front : [http://localhost:5173](http://localhost:5173) (selon config)
* API : [http://localhost:3333](http://localhost:3333)

### 4.2 Lancer en local (sans Docker)

#### Prérequis

* Node.js >= 20
* PostgreSQL >= 16

#### Backend

```bash
cd back
npm install
cp .env.example .env
node ace migration:run
npm run dev
```

#### Frontend

```bash
cd front
npm install
cp .env.example .env
npm run dev
```

---

## 5. Configuration (.env)

### Backend (Adonis)

Exemple `.env.example` (à adapter) :

```env
NODE_ENV=development
PORT=3333
HOST=0.0.0.0
LOG_LEVEL=info
APP_KEY=0123456789abcdef0123456789abcdef

DB_CONNECTION=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=habituser
DB_PASSWORD=habitpass
DB_DATABASE=habitdb
```

> ⚠️ En CI, Adonis valide ces variables (PORT/HOST/LOG_LEVEL/DB_*).
> Si tu utilises `PG_HOST/PG_PORT/...` dans GitHub Actions, ça ne match pas le schéma `DB_HOST/DB_PORT/...`.

### Frontend

`.env.example` :

```env
VITE_API_URL=http://localhost:3333
```

---

## 6. API (Routes)

Toutes les routes sont préfixées **sans** `/api` (ex: `/goals`, `/habits`, etc.).

### Auth

* `POST /auth/register` — inscription
* `POST /auth/login` — connexion
* `GET /me` — profil (auth required)
* `PUT /me` — modifier profil (auth required)

### Goals

* `GET /goals?status=active&priority=high&order=asc|desc` — liste + filtres
* `POST /goals` — créer
* `GET /goals/:id` — détail
* `PUT /goals/:id` — modifier
* `DELETE /goals/:id` — supprimer
* `PATCH /goals/:id/complete` — marquer complété
* `GET /goals/:id/progress` — % progression basé sur steps

### Steps

* `GET /goals/:id/steps` — lister steps
* `POST /goals/:id/steps` — ajouter
* `PUT /steps/:id` — modifier (inclut toggle `is_completed`)
* `DELETE /steps/:id` — supprimer
* `PATCH /steps/:id/complete` — compléter (optionnel / legacy)

### Habits

* `GET /habits?archived=true|false` — liste actives/archivées
* `POST /habits` — créer
* `GET /habits/:id` — détail
* `PUT /habits/:id` — modifier
* `PATCH /habits/:id/archive` — archiver
* `PATCH /habits/:id/unarchive` — restaurer

### Habit logs / tracking

* `POST /habits/:id/log` — check aujourd’hui (idempotent)
* `DELETE /habits/:id/log/:date` — uncheck (YYYY-MM-DD)
* `GET /habits/:id/logs?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` — logs
* `GET /habits/:id/stats` — stats (streaks / completion rate)

### Dashboard

* `GET /dashboard?goal_limit=5` — vue d’ensemble

---

## 7. Modèle de données

### Users

* `id`
* `full_name`
* `email` (unique)
* `password` (hashé)
* `created_at`, `updated_at`

### Goals

* `id`, `user_id`
* `title` (required), `description`, `category`
* `priority` enum (`low`/`medium`/`high`)
* `status` enum (`active`/`completed`/`abandoned`)
* `start_date`, `deadline`
* `completed_at` nullable
* relation : `Goal hasMany Steps`

### Steps

* `id`, `goal_id`
* `title` (required), `deadline` nullable
* `order` (tri)
* `is_completed` boolean
* `completed_at` nullable

### Habits

* `id`, `user_id`
* `name` (required), `description`, `category`
* `frequency` enum (`daily`/`weekly`)
* `weekly_target` nullable
* `start_date`
* `is_archived` boolean

### HabitLogs

* `id`, `habit_id`
* `date` (DATE)
* `is_completed` boolean (true)
* `notes` nullable
* contrainte : **(habit_id, date) unique**

---

## 8. Algorithmes (progression / streaks / complétion)

### 8.1 Progression d’un objectif

* `total_steps = count(steps)`
* `done_steps = count(steps where is_completed = true)`
* `progress = total_steps === 0 ? 0 : round(done/total*100)`

Implémenté via la route :

* `GET /goals/:id/progress`

### 8.2 Streak quotidien (daily)

Règle importante : **un streak est actif uniquement si aujourd’hui est coché.**
On remonte ensuite jour par jour tant que la date est présente dans le set.

Fonctions :

* `calcCurrentDailyStreak(todayISO, doneSet)`
* `calcBestDailyStreak(sortedAscDates)`

### 8.3 Streak hebdomadaire (weekly)

Règle importante : **streak actif uniquement si la semaine courante atteint `weeklyTarget`.**
On compte ensuite les semaines successives >= target.

Fonctions :

* `calcWeeklySuccessMap(dates, zone)`
* `calcCurrentWeeklyStreak(todayISO, zone, weeklyTarget, weekCounts)`
* `calcBestWeeklyStreak(zone, weeklyTarget, weekCounts)`

### 8.4 Completion rate

* Daily : `doneCount / nbDays(start..end)`
* Weekly : `doneCount / (nbWeeks(start..end) * weeklyTarget)`

---

## 9. Timezone & Tracking

Le frontend envoie automatiquement le timezone utilisateur :

* Header : `X-Timezone: Europe/Paris` (ex)

Backend :

* `resolveUserZone(ctx)` lit `x-timezone`
* `userTodayISO(ctx)` calcule “aujourd’hui” dans ce timezone

Objectif : éviter les bugs classiques où “aujourd’hui” est calculé en UTC et décale les checks.

---

## 10. Tests

Tests attendus (minimum) :

* calcul progression objectifs
* calcul streaks daily/weekly

Commandes typiques :

```bash
cd back
node ace test
```

---

## 11. CI/CD

Pipeline GitHub Actions :

* Backend : lint + migrations + tests + build
* Frontend : lint + build

Points importants :

* Les migrations doivent avoir toutes les variables `.env` attendues par `Env.schema` (Adonis).
* PostgreSQL est démarré via `services:` dans Actions.

---

## 12. Workflow Git / GitHub Projects

### GitFlow

* `main` : stable
* `develop` : intégration
* `feature/*` : dev de features
* `fix/*` : corrections

Règles :

* PR vers `develop`
* Merge `develop` → `main` pour release

### GitHub Projects (Kanban)

* Backlog → Todo → In Progress → Done
  Chaque issue correspond à une tâche (souvent reliée à une user story et un AC).

---

## 13. Limitations & pistes d’amélioration

### Limitations actuelles (à surveiller)

* `PATCH /steps/:id/complete` est redondant si `PUT /steps/:id` gère déjà `is_completed`.

### Pistes (v2 / v3)

* Heatmap habitudes (calendrier coloré)
* Graphiques d’évolution (streak / progression)
* Tags + filtres
* Notes / journal
* Gamification : XP, niveaux, badges
* Export CSV/PDF
* PWA + offline + notifications push
* Rappels mail (Ethereal pour tests)
