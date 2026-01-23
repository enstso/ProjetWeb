# API.md — Projet 4 : Application de gestion d’objectifs et d’habitudes

API REST du backend (AdonisJS) pour gérer :
- Auth / profil
- Objectifs (Goals) + étapes (Steps)
- Habitudes (Habits) + logs (tracking) + stats
- Dashboard

---

## Base URL

- Dev : `http://localhost:3333`
- Tous les endpoints ci-dessous sont préfixés implicitement par cette base URL.

---

## Authentification

L’API utilise un token **Bearer** (auth guard `api`).

### Headers requis (endpoints protégés)

```http
Authorization: Bearer <access_token>
X-Timezone: Europe/Paris
````

> `X-Timezone` est utilisé pour calculer “aujourd’hui” côté backend (tracking, dashboard, stats).
> Si absent ou invalide : fallback `UTC`.

---

## Conventions de réponses & erreurs

### Codes HTTP fréquents

* `200 OK` : succès
* `201 Created` : ressource créée
* `204 No Content` : suppression ok
* `400 Bad Request` : validation métier / dates invalides / action refusée
* `401 Unauthorized` : token absent ou invalide
* `404 Not Found` : ressource introuvable

### Format d’erreur (généralement)

```json
{ "message": "..." }
```

---

# 1) Auth & Profil

## POST /auth/register

Crée un utilisateur.

### Body

```json
{
  "email": "user@mail.com",
  "password": "secret123",
  "fullName": "Halim"
}
```

### Response 201

```json
{
  "user": {
    "id": 1,
    "email": "user@mail.com",
    "fullName": "Halim"
  }
}
```

**Notes**

* Ce endpoint **crée uniquement l’utilisateur**.
* **Aucun token n’est renvoyé** à l’inscription.
* Pour obtenir un token, appeler ensuite `POST /auth/login`.

---

## POST /auth/login

Connexion et génération d’un token.

### Body

```json
{
  "email": "user@mail.com",
  "password": "secret123"
}
```

### Response 200

```json
{
  "access_token": {
    "type": "bearer",
    "token": "xxxxx.yyyyy.zzzzz",
    "expires_at": "2026-02-23T12:34:56.000Z"
  }
}
```

---

## GET /me (protégé)

Retourne l’utilisateur courant.

### Response 200

```json
{
  "fullName": "Halim",
  "email": "user@mail.com"
}
```

---

## PUT /me (protégé)

Met à jour le profil.

### Body

```json
{
  "fullName": "Halim Djerroud",
  "email": "new@mail.com"
}
```

### Response 200

```json
{
  "id": 1,
  "fullName": "Halim Djerroud",
  "email": "new@mail.com",
  "createdAt": "2026-01-20T10:00:00.000Z",
  "updatedAt": "2026-01-23T08:12:34.000Z"
}
```

---

# 2) Goals (Objectifs)

## GET /goals (protégé)

Liste les objectifs, avec filtres + tri.

### Query params

* `status` : `active | completed | abandoned` (optionnel)
* `priority` : `low | medium | high` (optionnel)
* `order` : `asc | desc` (optionnel, défaut `asc`) — tri sur `deadline`

### Exemple

`GET /goals?status=active&priority=high&order=asc`

### Response 200

```json
[
  {
    "id": 10,
    "userId": 1,
    "title": "Apprendre le japonais",
    "description": "Objectif 6 mois",
    "category": "Carrière",
    "priority": "high",
    "status": "active",
    "startDate": "2026-01-01",
    "deadline": "2026-06-30",
    "completedAt": null,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  }
]
```

---

## POST /goals (protégé)

Crée un objectif.

### Body

```json
{
  "title": "Apprendre le japonais",
  "description": "Objectif 6 mois",
  "category": "Carrière",
  "priority": "high",
  "status": "active",
  "start_date": "2026-01-01",
  "deadline": "2026-06-30"
}
```

### Response 201

```json
{
  "id": 10,
  "userId": 1,
  "title": "Apprendre le japonais",
  "description": "Objectif 6 mois",
  "category": "Carrière",
  "priority": "high",
  "status": "active",
  "startDate": "2026-01-01",
  "deadline": "2026-06-30",
  "completedAt": null,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

### Erreurs possibles

* `400` si dates invalides ou `deadline < start_date`

---

## GET /goals/:id (protégé)

Détails d’un objectif.

### Response 200

```json
{
  "id": 10,
  "userId": 1,
  "title": "Apprendre le japonais",
  "description": "Objectif 6 mois",
  "category": "Carrière",
  "priority": "high",
  "status": "active",
  "startDate": "2026-01-01",
  "deadline": "2026-06-30",
  "completedAt": null,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-20T10:00:00.000Z"
}
```

---

## PUT /goals/:id (protégé)

Met à jour un objectif (partiel autorisé via validator).

### Body (exemple)

```json
{
  "title": "Apprendre le japonais (N5)",
  "priority": "medium",
  "deadline": "2026-07-15"
}
```

### Response 200

```json
{
  "id": 10,
  "userId": 1,
  "title": "Apprendre le japonais (N5)",
  "description": "Objectif 6 mois",
  "category": "Carrière",
  "priority": "medium",
  "status": "active",
  "startDate": "2026-01-01",
  "deadline": "2026-07-15",
  "completedAt": null,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-23T08:15:00.000Z"
}
```

---

## PATCH /goals/:id/complete (protégé)

Marque l’objectif comme complété.

### Response 200

```json
{
  "id": 10,
  "status": "completed",
  "completedAt": "2026-01-23T08:20:00.000Z"
}
```

---

## DELETE /goals/:id (protégé)

Supprime un objectif.

### Response 204

(no content)

---

## GET /goals/:id/progress (protégé)

Calcule la progression d’un objectif (basée sur Steps).

### Règle

* `0%` si aucune step
* sinon `round(done/total * 100)`

### Response 200

```json
{
  "goal_id": 10,
  "total_steps": 4,
  "completed_steps": 1,
  "progress_percent": 25
}
```

---

# 3) Steps (Étapes)

## GET /goals/:id/steps (protégé)

Liste des steps d’un goal (triées `order ASC` puis `id ASC`).

### Response 200

```json
[
  {
    "id": 201,
    "goalId": 10,
    "title": "Apprendre hiragana/katakana",
    "deadline": "2026-02-01",
    "order": 1,
    "isCompleted": false,
    "completedAt": null,
    "createdAt": "2026-01-12T10:00:00.000Z",
    "updatedAt": "2026-01-12T10:00:00.000Z"
  }
]
```

---

## POST /goals/:id/steps (protégé)

Ajoute une step à un goal.

### Body

```json
{
  "title": "Apprendre hiragana/katakana",
  "deadline": "2026-02-01",
  "order": 1
}
```

### Response 201

```json
{
  "id": 201,
  "goalId": 10,
  "title": "Apprendre hiragana/katakana",
  "deadline": "2026-02-01",
  "order": 1,
  "isCompleted": false,
  "completedAt": null,
  "createdAt": "2026-01-12T10:00:00.000Z",
  "updatedAt": "2026-01-12T10:00:00.000Z"
}
```

---

## PUT /steps/:id (protégé)

Modifie une step (titre, deadline, ordre, is_completed).

### Body (exemple : toggle)

```json
{
  "is_completed": true
}
```

### Response 200

```json
{
  "id": 201,
  "goalId": 10,
  "title": "Apprendre hiragana/katakana",
  "deadline": "2026-02-01",
  "order": 1,
  "isCompleted": true,
  "completedAt": "2026-01-23T08:30:00.000Z",
  "createdAt": "2026-01-12T10:00:00.000Z",
  "updatedAt": "2026-01-23T08:30:00.000Z"
}
```

---

## PATCH /steps/:id/complete (protégé)

Marque une step complétée (idempotent).

### Response 200

```json
{
  "id": 201,
  "isCompleted": true,
  "completedAt": "2026-01-23T08:30:00.000Z"
}
```

---

## DELETE /steps/:id (protégé)

Supprime une step.

### Response 204

(no content)

---

# 4) Habits (Habitudes)

## GET /habits (protégé)

Liste les habitudes (actives par défaut).

### Query params

* `archived` : `true | false`

  * défaut : `false` (actives)

### Exemples

* `GET /habits` → actives
* `GET /habits?archived=true` → archivées

### Response 200

```json
[
  {
    "id": 8,
    "userId": 1,
    "name": "Méditer 10 min",
    "description": "Respiration",
    "category": "Santé",
    "frequency": "daily",
    "weeklyTarget": null,
    "startDate": "2026-01-01",
    "isArchived": false,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  }
]
```

---

## POST /habits (protégé)

Crée une habitude.

### Body (daily)

```json
{
  "name": "Méditer 10 min",
  "description": "Respiration",
  "category": "Santé",
  "frequency": "daily",
  "start_date": "2026-01-01"
}
```

### Body (weekly)

```json
{
  "name": "Sport",
  "description": "Salle",
  "category": "Santé",
  "frequency": "weekly",
  "weekly_target": 3,
  "start_date": "2026-01-01"
}
```

### Response 201

```json
{
  "id": 8,
  "userId": 1,
  "name": "Méditer 10 min",
  "description": "Respiration",
  "category": "Santé",
  "frequency": "daily",
  "weeklyTarget": null,
  "startDate": "2026-01-01",
  "isArchived": false,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

---

## GET /habits/:id (protégé)

Détails d’une habitude.

### Response 200

```json
{
  "id": 8,
  "userId": 1,
  "name": "Méditer 10 min",
  "description": "Respiration",
  "category": "Santé",
  "frequency": "daily",
  "weeklyTarget": null,
  "startDate": "2026-01-01",
  "isArchived": false
}
```

---

## PUT /habits/:id (protégé)

Met à jour une habitude.

### Body (exemple)

```json
{
  "name": "Méditer 15 min",
  "description": "Respiration + scan",
  "category": "Santé",
  "frequency": "daily",
  "start_date": "2026-01-01"
}
```

### Response 200

```json
{
  "id": 8,
  "name": "Méditer 15 min",
  "frequency": "daily",
  "weeklyTarget": null,
  "isArchived": false
}
```

---

## PATCH /habits/:id/archive (protégé)

Archive une habitude.

### Response 200

```json
{
  "id": 8,
  "isArchived": true
}
```

---

## PATCH /habits/:id/unarchive (protégé)

Restaure une habitude archivée.

### Response 200

```json
{
  "id": 8,
  "isArchived": false
}
```

---

# 5) Habit Tracking (Logs)

## POST /habits/:id/log (protégé)

Check “aujourd’hui” (en fonction de `X-Timezone`).
Idempotent : si déjà checké → renvoie le log existant avec `already_exists=true`.

### Headers

* `X-Timezone: Europe/Paris` (recommandé)

### Response 201 (création)

```json
{
  "id": 1001,
  "habitId": 8,
  "date": "2026-01-23",
  "isCompleted": true,
  "already_exists": false,
  "date_iso": "2026-01-23"
}
```

### Response 200 (déjà existant)

```json
{
  "id": 1001,
  "habitId": 8,
  "date": "2026-01-23",
  "isCompleted": true,
  "already_exists": true,
  "date_iso": "2026-01-23"
}
```

### Erreurs possibles

* `404` si habitude introuvable
* `400` si habitude archivée (`Habitude archivée`)

---

## DELETE /habits/:id/log/:date (protégé)

Uncheck (suppression du log à une date donnée).

### Params

* `date` : `YYYY-MM-DD`

### Response 204

(no content)

### Erreurs possibles

* `404` si habitude/log introuvable
* **Note** : le blocage “habitude archivée => interdit d’uncheck” est à ajouter côté backend (si souhaité).

---

## GET /habits/:id/logs (protégé)

Liste des logs dans une période.

### Query params (optionnels)

* `start_date=YYYY-MM-DD`
* `end_date=YYYY-MM-DD`

### Exemple

`GET /habits/8/logs?start_date=2026-01-01&end_date=2026-01-31`

### Response 200

```json
[
  { "id": 1001, "habitId": 8, "date": "2026-01-23", "isCompleted": true, "notes": null },
  { "id": 1002, "habitId": 8, "date": "2026-01-24", "isCompleted": true, "notes": null }
]
```

---

## POST /habits/:id/logs (protégé) — legacy / à éviter

⚠️ Route présente mais non utilisée par le frontend actuel.
Elle renvoie la liste des logs (équivalent à `GET /habits/:id/logs`).

**Recommandation**

* Soit la supprimer pour éviter la confusion
* Soit garder uniquement `GET /habits/:id/logs`

---

# 6) Stats Habitudes

## GET /habits/:id/stats (protégé)

Calcule :

* streak actuel
* best streak
* completion rate (%)

Basé sur :

* `frequency=daily` → streak quotidien (inclut aujourd’hui sinon 0)
* `frequency=weekly` → streak hebdo si semaine courante >= `weekly_target`
* Gestion timezone via `X-Timezone`

### Query params (optionnels)

* `start_date=YYYY-MM-DD`
* `end_date=YYYY-MM-DD`

### Response 200 (daily)

```json
{
  "habit_id": 8,
  "frequency": "daily",
  "weekly_target": null,
  "zone": "Europe/Paris",
  "today": "2026-01-23",
  "range": { "start_date": "2026-01-01", "end_date": "2026-01-23" },
  "stats": {
    "current_streak": 7,
    "best_streak": 14,
    "completion_rate_percent": 65
  }
}
```

---

# 7) Dashboard

## GET /dashboard (protégé)

Retourne :

* preview objectifs actifs (triés par deadline)
* habitudes actives + `completed_today`
* stats globales

### Query params

* `goal_limit` : nombre d’objectifs actifs à retourner (défaut: 5)

### Response 200

```json
{
  "today": "2026-01-23",
  "zone": "Europe/Paris",
  "goals_active": {
    "total": 12,
    "limit": 5,
    "items": [
      {
        "id": 10,
        "title": "Apprendre le japonais",
        "status": "active",
        "priority": "high",
        "deadline": "2026-06-30"
      }
    ]
  },
  "habits_today": [
    {
      "id": 8,
      "name": "Méditer 10 min",
      "category": "Santé",
      "frequency": "daily",
      "weeklyTarget": null,
      "completed_today": true
    }
  ],
  "stats": {
    "completed_goals": 3,
    "max_streak": 14,
    "habits_completed_today": 1
  }
}
```

---

# Notes / points d’attention

1. Register vs Front

* Backend `POST /auth/register` renvoie `{ user: {...} }` (**pas de token**).
* Le token est renvoyé uniquement par `POST /auth/login`.
  ➡️ Côté front : après register, faire un login ou rediriger vers la page login.

2. Fuseau horaire

* Les endpoints “today” (`/dashboard`, `/habits/:id/log`, `/habits/:id/stats`) utilisent `X-Timezone`.
* Valeur invalide → fallback `UTC`.

3. Logs idempotents

* `POST /habits/:id/log` ne crée pas de doublon : si déjà loggé aujourd’hui → renvoie `already_exists=true`.

4. Archivage habitudes

* `GET /habits` filtre via `archived=true|false`.
* Le backend refuse déjà `POST /habits/:id/log` si l’habitude est archivée.
* Le blocage `DELETE /habits/:id/log/:date` quand archivée est à ajouter si nécessaire (cohérence sécurité).

