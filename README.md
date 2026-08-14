# Project 4 — Goal and Habit Management Application

A web application that allows users to **create goals**, **break them down into steps**, and **track daily or weekly habits** with **tracking, streaks, statistics, and a motivating user interface**.

---

## Table of Contents

* [1. Description](#1-description)
* [2. Stack & Architecture](#2-stack--architecture)
* [3. Features](#3-features)
* [4. Installation & Setup](#4-installation--setup)
* [4.1 Run with Docker](#41-run-with-docker)
* [4.2 Run Locally Without Docker](#42-run-locally-without-docker)
* [5. Configuration (.env)](#5-configuration-env)
* [6. API Routes](#6-api-routes)
* [7. Data Model](#7-data-model)
* [8. Algorithms: Progress, Streaks & Completion](#8-algorithms-progress-streaks--completion)
* [9. Timezone & Tracking](#9-timezone--tracking)
* [10. Tests](#10-tests)
* [11. CI/CD](#11-cicd)
* [12. Git / GitHub Projects Workflow](#12-git--github-projects-workflow)
* [13. Limitations & Future Improvements](#13-limitations--future-improvements)

---

API documentation: [docs/API.md](docs/API.md)
Covers Auth, Goals, Steps, Habits, Logs, and Dashboard routes.

Database schema: [docs/DB.md](docs/DB.md)

## 1. Description

This project aims to provide a personal development application focused on:

* **Goals (one-time)**: create a goal with a deadline, track it, and mark it as completed.
* **Goal steps**: break a goal down into concrete tasks and measure progress.
* **Habits (recurring)**: create daily or weekly habits, check them off, and view their history.
* **Dashboard**: overview of active goals, today's habits, and basic statistics.
* **Motivating UX**: visual feedback, motivational messages, and a responsive interface.

---

## 2. Stack & Architecture

### Backend

* **AdonisJS (Node.js)** — REST API
* **PostgreSQL** — relational database
* **Lucid ORM** — models and relationships
* **Luxon** — date and timezone management for "today" tracking
* **VineJS** — request validation

### Frontend

* **React**
* **React Router**
* **TailwindCSS** — UI styling
* **Axios** — API client
* Custom UI components: `Card`, `Button`, `Input`, `Select`, `ProgressBar`, `Toast`, etc.

### Repository Structure

* `back/` — AdonisJS API
* `front/` — React application

---

## 3. Features

### 3.1 User Management (MVP)

* Registration
* Login using token-based authentication
* Profile management with `GET /me` and `PUT /me`

### 3.2 Goals (CRUD)

Users can create a goal with:

* title — required
* description
* category
* priority
* status
* `start_date`
* `deadline`

Validation rule:

```text
deadline >= start_date
```

Available features:

* list goals;
* filter by status and priority;
* sort by deadline;
* view goal details;
* update a goal;
* delete a goal;
* mark a goal as completed.

### 3.3 Goal Steps

* Add steps
* Update steps
* Delete steps
* Mark a step as completed
* Calculate goal progress based on completed steps

Goal progress is calculated as the percentage of completed steps.

### 3.4 Habits (CRUD)

Users can create and update habits with the following frequencies:

* `daily`
* `weekly`, with a configurable `weekly_target`

Additional features:

* archive habits;
* restore archived habits;
* display active and archived habits separately in the UI.

### 3.5 Habit Tracking

* Check today's habit
* Uncheck a habit
* Daily habit logs
* Monthly history grid
* Unique constraint on `(habit_id, date)` to prevent duplicate counting
* Idempotent tracking operations

Statistics include:

* current streak;
* best streak;
* completion rate.

### 3.6 Dashboard

The dashboard provides:

* active goals with preview and total count;
* today's active habits with `completed_today` status;
* global statistics:

  * completed goals;
  * highest streak across all habits;
  * habits completed today.

---

## 4. Installation & Setup

### 4.1 Run with Docker

The goal is to start **PostgreSQL + Backend + Frontend** with a single command.

```bash
docker-compose up --build
```

Then open:

* Frontend: `http://localhost:5173`
* API: `http://localhost:3333`

Exact ports may depend on your configuration.

### 4.2 Run Locally Without Docker

#### Requirements

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

### Backend — AdonisJS

Example `.env.example`:

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

> In CI environments, Adonis validates these variables through its environment schema.
> If GitHub Actions uses `PG_HOST`, `PG_PORT`, etc., they will not match the expected
> `DB_HOST`, `DB_PORT`, and related variables.

### Frontend

Example `.env.example`:

```env
VITE_API_URL=http://localhost:3333
```

---

## 6. API Routes

All routes are exposed **without an `/api` prefix**.

Examples:

```text
/goals
/habits
/dashboard
```

### Auth

* `POST /auth/register` — register a user
* `POST /auth/login` — authenticate a user
* `GET /me` — retrieve authenticated user profile
* `PUT /me` — update authenticated user profile

### Goals

* `GET /goals?status=active&priority=high&order=asc|desc` — list and filter goals
* `POST /goals` — create a goal
* `GET /goals/:id` — retrieve goal details
* `PUT /goals/:id` — update a goal
* `DELETE /goals/:id` — delete a goal
* `PATCH /goals/:id/complete` — mark a goal as completed
* `GET /goals/:id/progress` — calculate progress based on steps

### Steps

* `GET /goals/:id/steps` — list goal steps
* `POST /goals/:id/steps` — create a step
* `PUT /steps/:id` — update a step, including `is_completed`
* `DELETE /steps/:id` — delete a step
* `PATCH /steps/:id/complete` — complete a step, optional / legacy route

### Habits

* `GET /habits?archived=true|false` — list active or archived habits
* `POST /habits` — create a habit
* `GET /habits/:id` — retrieve habit details
* `PUT /habits/:id` — update a habit
* `PATCH /habits/:id/archive` — archive a habit
* `PATCH /habits/:id/unarchive` — restore an archived habit

### Habit Logs / Tracking

* `POST /habits/:id/log` — check today's habit, idempotent
* `DELETE /habits/:id/log/:date` — uncheck a date in `YYYY-MM-DD` format
* `GET /habits/:id/logs?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` — retrieve logs
* `GET /habits/:id/stats` — retrieve streak and completion statistics

### Dashboard

* `GET /dashboard?goal_limit=5` — retrieve dashboard overview

---

## 7. Data Model

### Users

* `id`
* `full_name`
* `email` — unique
* `password` — hashed
* `created_at`
* `updated_at`

### Goals

* `id`
* `user_id`
* `title` — required
* `description`
* `category`
* `priority` enum:

  * `low`
  * `medium`
  * `high`
* `status` enum:

  * `active`
  * `completed`
  * `abandoned`
* `start_date`
* `deadline`
* `completed_at` — nullable

Relationship:

```text
Goal hasMany Steps
```

### Steps

* `id`
* `goal_id`
* `title` — required
* `deadline` — nullable
* `order`
* `is_completed` — boolean
* `completed_at` — nullable

### Habits

* `id`
* `user_id`
* `name` — required
* `description`
* `category`
* `frequency` enum:

  * `daily`
  * `weekly`
* `weekly_target` — nullable
* `start_date`
* `is_archived` — boolean

### HabitLogs

* `id`
* `habit_id`
* `date` — `DATE`
* `is_completed` — boolean, typically `true`
* `notes` — nullable

Database constraint:

```text
(habit_id, date) UNIQUE
```

---

## 8. Algorithms: Progress, Streaks & Completion

### 8.1 Goal Progress

```text
total_steps = count(steps)
done_steps = count(steps where is_completed = true)
progress = total_steps === 0 ? 0 : round(done_steps / total_steps * 100)
```

Implemented through:

```text
GET /goals/:id/progress
```

### 8.2 Daily Streak

Important rule:

**A current streak is active only if today's habit is completed.**

The algorithm then moves backward one day at a time while each date exists in the completed-date set.

Functions:

```text
calcCurrentDailyStreak(todayISO, doneSet)
calcBestDailyStreak(sortedAscDates)
```

### 8.3 Weekly Streak

Important rule:

**A weekly streak is active only if the current week reaches `weeklyTarget`.**

The algorithm then counts consecutive successful weeks that meet or exceed the target.

Functions:

```text
calcWeeklySuccessMap(dates, zone)
calcCurrentWeeklyStreak(todayISO, zone, weeklyTarget, weekCounts)
calcBestWeeklyStreak(zone, weeklyTarget, weekCounts)
```

### 8.4 Completion Rate

Daily:

```text
doneCount / numberOfDays(start..end)
```

Weekly:

```text
doneCount / (numberOfWeeks(start..end) * weeklyTarget)
```

---

## 9. Timezone & Tracking

The frontend automatically sends the user's timezone through an HTTP header.

Example:

```text
X-Timezone: Europe/Paris
```

Backend functions:

```text
resolveUserZone(ctx)
userTodayISO(ctx)
```

`resolveUserZone(ctx)` reads the `x-timezone` header.

`userTodayISO(ctx)` calculates "today" using the user's timezone.

The purpose is to avoid common tracking bugs where "today" is calculated in UTC and habit checks are shifted to the wrong calendar day.

---

## 10. Tests

Minimum expected tests include:

* goal progress calculation;
* daily streak calculation;
* weekly streak calculation.

Typical command:

```bash
cd back
node ace test
```

---

## 11. CI/CD

The GitHub Actions pipeline includes:

### Backend

* linting;
* database migrations;
* tests;
* build.

### Frontend

* linting;
* build.

Important considerations:

* Migrations require all environment variables expected by the Adonis `Env.schema`.
* PostgreSQL is started through GitHub Actions `services:`.

---

## 12. Git / GitHub Projects Workflow

### GitFlow

Branches:

* `main` — stable production-ready branch
* `develop` — integration branch
* `feature/*` — feature development
* `fix/*` — bug fixes

Rules:

* Pull requests target `develop`.
* `develop` is merged into `main` for releases.

### GitHub Projects — Kanban

Workflow:

```text
Backlog → Todo → In Progress → Done
```

Each issue represents a task and can be associated with a user story and acceptance criteria.

---

## 13. Limitations & Future Improvements

### Current Limitations

* `PATCH /steps/:id/complete` may be redundant if `PUT /steps/:id` already supports updating `is_completed`.

### Possible v2 / v3 Improvements

* habit heatmap / calendar;
* progress and streak charts;
* tags and advanced filters;
* notes and personal journal;
* gamification:

  * XP;
  * levels;
  * badges;
* CSV / PDF export;
* PWA support;
* offline mode;
* push notifications;
* email reminders using services such as Ethereal for testing.
