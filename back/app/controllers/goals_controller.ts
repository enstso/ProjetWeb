import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Goal from '#models/goal'
import { createGoalValidator, updateGoalValidator } from '#validators/goal'
import db from '@adonisjs/lucid/services/db'

export default class GoalsController {
  /**
   * GET /goals?status=active&priority=high&order=asc|desc
   *
   * AC:
   * - lister + filtrer (statut/priorité)
   * - trier par deadline
   *
   * Notes:
   * - status / priority proviennent des query params
   * - order contrôle le tri (asc par défaut)
   * - On filtre TOUJOURS par user_id pour isoler les données par utilisateur
   */
  async index({ auth, request }: HttpContext) {
    // user authentifié (middleware auth)
    const user = auth.getUserOrFail()

    // Lecture query params (et typage TS pour limiter les valeurs)
    const status = request.input('status') as 'active' | 'completed' | 'abandoned' | undefined
    const priority = request.input('priority') as 'low' | 'medium' | 'high' | undefined
    const order = (request.input('order') ?? 'asc') === 'desc' ? 'desc' : 'asc'

    // Base query: uniquement les goals du user courant
    const query = Goal.query().where('user_id', user.id)

    // Filtres optionnels
    if (status) query.where('status', status)
    if (priority) query.where('priority', priority)

    // Tri par deadline (la plus proche d'abord si asc)
    query.orderBy('deadline', order)

    return query
  }

  /**
   * POST /goals
   *
   * AC:
   * - créer objectif (title obligatoire, priority/status/category, start_date, deadline)
   *
   * Notes:
   * - createGoalValidator assure la structure/contraintes de base du payload
   * - On valide ici la cohérence des dates (deadline >= start_date)
   * - Les dates sont stockées en DateTime (Lucid) côté model
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Validation du payload (types + règles)
    const payload = await request.validateUsing(createGoalValidator)

    // Parsing dates (format attendu: YYYY-MM-DD)
    const start = DateTime.fromISO(payload.start_date)
    const end = DateTime.fromISO(payload.deadline)

    // Validation format ISO
    if (!start.isValid || !end.isValid) {
      return response.badRequest({ message: 'Dates invalides (format attendu: YYYY-MM-DD)' })
    }

    // Validation business rule: deadline >= start_date
    if (end < start) {
      return response.badRequest({ message: 'La deadline doit être >= start_date' })
    }

    // Création en base
    const goal = await Goal.create({
      userId: user.id, // association au propriétaire
      title: payload.title, // obligatoire
      description: payload.description ?? null,
      category: payload.category ?? null,
      priority: payload.priority ?? 'medium',
      status: payload.status ?? 'active',
      startDate: start,
      deadline: end,
      // si créé directement en completed, on peut set completedAt
      completedAt: payload.status === 'completed' ? DateTime.utc() : null,
    })

    return response.created(goal)
  }

  /**
   * GET /goals/:id
   *
   * Objectif :
   * - retourner le goal demandé s'il appartient au user
   * - sinon 404
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // On s'assure que le goal appartient au user (sécurité)
    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()

    if (!goal) return response.notFound({ message: 'Goal introuvable' })
    return goal
  }

  /**
   * PUT /goals/:id
   *
   * AC:
   * - update (modifier les infos)
   *
   * Notes:
   * - updateGoalValidator valide les champs (souvent optionnels)
   * - On gère les updates partiels des dates (si start_date ou deadline manquent)
   * - On synchronise completedAt selon le status
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    // Validation payload update
    const payload = await request.validateUsing(updateGoalValidator)

    // Merge champ par champ (update partiel)
    if (payload.title !== undefined) goal.title = payload.title
    if (payload.description !== undefined) goal.description = payload.description
    if (payload.category !== undefined) goal.category = payload.category
    if (payload.priority !== undefined) goal.priority = payload.priority
    if (payload.status !== undefined) goal.status = payload.status

    /**
     * Dates :
     * - si l'utilisateur fournit une date -> on parse
     * - sinon on garde celle existante en base
     */
    const start = payload.start_date ? DateTime.fromISO(payload.start_date) : goal.startDate
    const end = payload.deadline ? DateTime.fromISO(payload.deadline) : goal.deadline

    if (!start.isValid || !end.isValid) {
      return response.badRequest({ message: 'Dates invalides (format attendu: YYYY-MM-DD)' })
    }
    if (end < start) {
      return response.badRequest({ message: 'La deadline doit être >= start_date' })
    }

    goal.startDate = start
    goal.deadline = end

    /**
     * completedAt:
     * - si status devient "completed" et qu'on n'avait pas de completedAt => set maintenant
     * - si on quitte "completed" => reset completedAt
     */
    if (payload.status === 'completed' && !goal.completedAt) {
      goal.completedAt = DateTime.utc()
    }
    if (payload.status && payload.status !== 'completed') {
      goal.completedAt = null
    }

    await goal.save()
    return goal
  }

  /**
   * DELETE /goals/:id
   *
   * AC:
   * - delete
   *
   * Notes:
   * - sécurité: suppression uniquement si le goal appartient au user
   * - renvoie 204 No Content si OK
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    await goal.delete()
    return response.noContent()
  }

  /**
   * PATCH /goals/:id/complete
   *
   * AC:
   * - patch “complete” (status=completed)
   *
   * Notes:
   * - force status à completed
   * - set completedAt à maintenant (UTC)
   */
  async complete({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    // 1) compter steps
    const totalRow = await db.from('steps').where('goal_id', goal.id).count('* as total').first()
    const doneRow = await db
      .from('steps')
      .where('goal_id', goal.id)
      .where('is_completed', true)
      .count('* as done')
      .first()

    const total = Number(totalRow?.total ?? 0)
    const done = Number(doneRow?.done ?? 0)

    // 2) si il y a des steps => il faut 100%
    if (total > 0 && done < total) {
      return response.badRequest({
        message: `Impossible de compléter : ${done}/${total} étape(s) complétée(s).`,
        total_steps: total,
        completed_steps: done,
      })
    }

    goal.status = 'completed'
    goal.completedAt = DateTime.utc()
    await goal.save()

    return response.ok(goal)
  }

  /**
   * GET /goals/:id/progress
   *
   * AC:
   * - 0% si aucune étape
   * - progression = steps complétées / total
   *
   * Implémentation:
   * - On vérifie d'abord que le goal appartient au user
   * - On compte total steps + done steps via requêtes SQL (db.from)
   * - On calcule le pourcentage (arrondi)
   */
  async progress({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    // count(*) total steps
    const totalRow = await db.from('steps').where('goal_id', goal.id).count('* as total').first()

    // count(*) done steps
    const doneRow = await db
      .from('steps')
      .where('goal_id', goal.id)
      .where('is_completed', true)
      .count('* as done')
      .first()

    const total = Number(totalRow?.total ?? 0)
    const done = Number(doneRow?.done ?? 0)

    // Règle: 0% si aucune étape
    const progress = total === 0 ? 0 : Math.round((done / total) * 100)

    // Payload explicite pour le front (progress + breakdown)
    return response.ok({
      goal_id: goal.id,
      total_steps: total,
      completed_steps: done,
      progress_percent: progress,
    })
  }
}
