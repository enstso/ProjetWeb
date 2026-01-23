# DB.md — Schéma de base de données & logique (Projet 4)

Ce document décrit le **schéma PostgreSQL** (migrations AdonisJS) ainsi que les **relations** et **contraintes** de cohérence utilisées dans l’application “gestion d’objectifs et d’habitudes”.

---

## Sommaire

- [1. Vue d’ensemble](#1-vue-densemble)
- [2. Diagramme (ERD)](#2-diagramme-erd)
- [3. Tables](#3-tables)
  - [users](#users)
  - [auth_access_tokens](#auth_access_tokens)
  - [goals](#goals)
  - [steps](#steps)
  - [habits](#habits)
  - [habit_logs](#habit_logs)
- [4. Relations & règles métier](#4-relations--règles-métier)
- [5. Contraintes et cohérence des données](#5-contraintes-et-cohérence-des-données)
- [6. Indexation](#6-indexation)
- [7. Notes sur les dates & timezone](#7-notes-sur-les-dates--timezone)

---

## 1. Vue d’ensemble

L’application repose sur 2 entités “cœur” :

- **Goals** (objectifs ponctuels) décomposés en **Steps** (étapes)
- **Habits** (habitudes récurrentes) suivies via **HabitLogs** (logs journaliers)

L’authentification est gérée via un système de tokens (**auth_access_tokens**) lié à **users**.

---

## 2. Diagramme (ERD)

```mermaid
erDiagram
  USERS ||--o{ GOALS : "has many"
  GOALS ||--o{ STEPS : "has many"

  USERS ||--o{ HABITS : "has many"
  HABITS ||--o{ HABIT_LOGS : "has many"

  USERS ||--o{ AUTH_ACCESS_TOKENS : "has many"

  USERS {
    int id PK
    string full_name
    string email "UNIQUE"
    string password
    timestamp created_at
    timestamp updated_at
  }

  AUTH_ACCESS_TOKENS {
    int id PK
    int tokenable_id FK "-> USERS.id (ON DELETE CASCADE)"
    string type
    string name
    string hash
    text abilities
    timestamp created_at
    timestamp updated_at
    timestamp last_used_at
    timestamp expires_at
  }

  GOALS {
    int id PK
    int user_id FK "-> USERS.id (ON DELETE CASCADE)"
    string title
    text description
    string category
    enum priority "low|medium|high (default: medium)"
    enum status "active|completed|abandoned (default: active)"
    date start_date
    date deadline "CHECK deadline >= start_date"
    timestamptz completed_at
    timestamptz created_at
    timestamptz updated_at
  }

  STEPS {
    int id PK
    int goal_id FK "-> GOALS.id (ON DELETE CASCADE)"
    string title
    date deadline
    boolean is_completed "default: false"
    int order "default: 0"
    timestamptz completed_at
    timestamptz created_at
    timestamptz updated_at
  }

  HABITS {
    int id PK
    int user_id FK "-> USERS.id (ON DELETE CASCADE)"
    string name
    text description
    string category
    enum frequency "daily|weekly (default: daily)"
    int weekly_target "CHECK weekly => >=1"
    date start_date
    boolean is_archived "default: false"
    timestamptz created_at
    timestamptz updated_at
  }

  HABIT_LOGS {
    int id PK
    int habit_id FK "-> HABITS.id (ON DELETE CASCADE)"
    date date
    boolean is_completed "default: true"
    text notes
    timestamptz created_at
    string unique_key "UNIQUE(habit_id, date)"
  }
````

---

## 3. Tables

### users

**Rôle :** comptes utilisateurs.

| Champ      | Type        | Null | Contraintes               |
| ---------- | ----------- | ---- | ------------------------- |
| id         | integer     | non  | PK, auto-increment        |
| full_name  | string      | oui  | —                         |
| email      | string(254) | non  | **unique**                |
| password   | string      | non  | hashé (scrypt via Adonis) |
| created_at | timestamp   | non  | —                         |
| updated_at | timestamp   | oui  | —                         |

---

### auth_access_tokens

**Rôle :** tokens d’accès “API” (AdonisJS).
**Lien :** `tokenable_id -> users.id` (suppression en cascade).

| Champ        | Type      | Null | Contraintes                         |
| ------------ | --------- | ---- | ----------------------------------- |
| id           | integer   | —    | PK                                  |
| tokenable_id | integer   | non  | FK users(id), **ON DELETE CASCADE** |
| type         | string    | non  | ex: "api"                           |
| name         | string    | oui  | —                                   |
| hash         | string    | non  | hash du token                       |
| abilities    | text      | non  | permissions                         |
| created_at   | timestamp | oui  | —                                   |
| updated_at   | timestamp | oui  | —                                   |
| last_used_at | timestamp | oui  | —                                   |
| expires_at   | timestamp | oui  | —                                   |

---

### goals

**Rôle :** objectifs “one-shot” appartenant à un utilisateur.

| Champ        | Type        | Null | Contraintes                                        |
| ------------ | ----------- | ---- | -------------------------------------------------- |
| id           | integer     | —    | PK                                                 |
| user_id      | integer     | non  | FK users(id), **ON DELETE CASCADE**                |
| title        | string      | non  | —                                                  |
| description  | text        | oui  | —                                                  |
| category     | string      | oui  | —                                                  |
| priority     | enum        | non  | low / medium / high, default **medium**            |
| status       | enum        | non  | active / completed / abandoned, default **active** |
| start_date   | date        | non  | —                                                  |
| deadline     | date        | non  | —                                                  |
| completed_at | timestamptz | oui  | rempli quand status=completed                      |
| created_at   | timestamptz | oui  | —                                                  |
| updated_at   | timestamptz | oui  | —                                                  |

**Règle DB :**

* `CHECK (deadline >= start_date)` via contrainte `goals_deadline_after_start`

---

### steps

**Rôle :** étapes d’un objectif (progression calculée via étapes complétées).

| Champ        | Type        | Null | Contraintes                         |
| ------------ | ----------- | ---- | ----------------------------------- |
| id           | integer     | —    | PK                                  |
| goal_id      | integer     | non  | FK goals(id), **ON DELETE CASCADE** |
| title        | string      | non  | —                                   |
| deadline     | date        | oui  | optionnel                           |
| is_completed | boolean     | non  | default **false**                   |
| order        | integer     | non  | default **0**                       |
| completed_at | timestamptz | oui  | rempli si `is_completed=true`       |
| created_at   | timestamptz | oui  | —                                   |
| updated_at   | timestamptz | oui  | —                                   |

---

### habits

**Rôle :** habitudes récurrentes appartenant à un utilisateur, daily ou weekly.

| Champ         | Type        | Null | Contraintes                         |
| ------------- | ----------- | ---- | ----------------------------------- |
| id            | integer     | —    | PK                                  |
| user_id       | integer     | non  | FK users(id), **ON DELETE CASCADE** |
| name          | string      | non  | —                                   |
| description   | text        | oui  | —                                   |
| category      | string      | oui  | —                                   |
| frequency     | enum        | non  | daily / weekly, default **daily**   |
| weekly_target | integer     | oui  | requis si weekly (>=1)              |
| start_date    | date        | non  | —                                   |
| is_archived   | boolean     | non  | default **false**                   |
| created_at    | timestamptz | oui  | —                                   |
| updated_at    | timestamptz | oui  | —                                   |

**Règles DB (checks) :**

* si `frequency='weekly'` ⇒ `weekly_target IS NOT NULL AND weekly_target >= 1`
* si `frequency='daily'` ⇒ `weekly_target` peut être NULL (ou ignoré)

---

### habit_logs

**Rôle :** suivi des habitudes (1 log max par habitude et par date).

| Champ        | Type        | Null | Contraintes                          |
| ------------ | ----------- | ---- | ------------------------------------ |
| id           | integer     | —    | PK                                   |
| habit_id     | integer     | non  | FK habits(id), **ON DELETE CASCADE** |
| date         | date        | non  | date “YYYY-MM-DD”                    |
| is_completed | boolean     | non  | default **true**                     |
| notes        | text        | oui  | optionnel                            |
| created_at   | timestamptz | oui  | —                                    |

**Contrainte clé :**

* `UNIQUE(habit_id, date)` via index `habit_logs_habit_id_date_unique`

---

## 4. Relations & règles métier

### Relations (cardinalités)

* `users (1) -> goals (N)`
* `goals (1) -> steps (N)`
* `users (1) -> habits (N)`
* `habits (1) -> habit_logs (N)`
* `users (1) -> auth_access_tokens (N)`

### Règles métier principales

* Un objectif appartient à un seul user.
* Une étape appartient à un seul objectif (et donc indirectement à un user).
* Une habitude appartient à un seul user.
* Un log appartient à une seule habitude.
* **Un seul log par jour et par habitude** (via `UNIQUE(habit_id, date)`).
* Une habitude peut être **archivée** (`is_archived=true`) :

    * elle n’apparaît plus dans les habitudes actives
    * (côté API) le check/uncheck devrait être refusé si archivée

---

## 5. Contraintes et cohérence des données

### Intégrité référentielle (FK + cascade)

* Suppression user ⇒ supprime ses goals/habits/tokens
* Suppression goal ⇒ supprime ses steps
* Suppression habit ⇒ supprime ses habit_logs

### Contraintes de cohérence

* `goals.deadline >= goals.start_date` (CHECK)
* `habits.frequency='weekly'` ⇒ `weekly_target >= 1` (CHECK)
* `habit_logs` :

    * `UNIQUE(habit_id, date)` empêche le double comptage

---

## 6. Indexation

Des index existent pour accélérer les requêtes fréquentes :

* `goals`: index `['user_id', 'deadline']` (liste + tri + prochaines deadlines)
* `steps`: index `['goal_id']` (liste steps d’un goal)
* `habits`:

    * index `['user_id']`
    * index `['user_id', 'is_archived']` (onglet actives/archivées)
    * index `['user_id', 'frequency']`
* `habit_logs`:

    * index `['habit_id']` (logs d’une habitude)
    * index `['date']` (requêtes par période)
    * unique index `['habit_id', 'date']`

---

## 7. Notes sur les dates & timezone

* En base, `habit_logs.date`, `goals.start_date`, `goals.deadline`, etc. sont des **dates** (sans heure).
* Pour le tracking “aujourd’hui”, l’application calcule un `YYYY-MM-DD` selon le **timezone du user** :

    * le frontend envoie `X-Timezone` (ex: `Europe/Paris`)
    * le backend calcule `todayISO` dans ce timezone
* Objectif : éviter les erreurs “jour décalé” (UTC vs timezone local).

---

## Annexes (optionnel)

### Exemples de requêtes utiles

* Tous les objectifs actifs d’un user, triés par deadline :

    * filtre `goals.user_id = ? AND goals.status='active' ORDER BY deadline ASC`
* Toutes les habitudes actives d’un user :

    * filtre `habits.user_id = ? AND habits.is_archived=false`
* Logs d’une habitude sur une période :

    * filtre `habit_logs.habit_id = ? AND date BETWEEN ? AND ?`

---
