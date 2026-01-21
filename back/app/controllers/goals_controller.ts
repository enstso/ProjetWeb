import type {HttpContext} from '@adonisjs/core/http'
import {DateTime} from 'luxon'
import Goal from '#models/goal'
import {createGoalValidator, updateGoalValidator} from '#validators/goal'

export default class GoalsController {

  constructor() {}


  /**
   * GET /goals?status=active&priority=high&order=asc|desc
   * AC: lister + filtrer (statut/priorité) + trier deadline
   */
  async index({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()

    const status = request.input('status') as ('active'|'completed'|'abandoned'|undefined)
    const priority = request.input('priority') as ('low'|'medium'|'high'|undefined)
    const order = (request.input('order') ?? 'asc') === 'desc' ? 'desc' : 'asc'

    const query = Goal.query().where('user_id', user.id)

    if (status) query.where('status', status)
    if (priority) query.where('priority', priority)

    query.orderBy('deadline', order)

    return query
  }


  /**
   * POST /goals
   * AC: créer objectif (title obligatoire, priority/status/category, start_date, deadline)
   */
  async store({auth, request, response}: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createGoalValidator)

    const start = DateTime.fromISO(payload.start_date)
    const end = DateTime.fromISO(payload.deadline)
    if (!start.isValid || !end.isValid) {
      return response.badRequest({message: 'Dates invalides (format attendu: YYYY-MM-DD)'})
    }
    if (end < start) {
      return response.badRequest({message: 'La deadline doit être >= start_date'})
    }

    const goal = await Goal.create({
      userId: user.id,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category ?? null,
      priority: payload.priority ?? 'medium',
      status: payload.status ?? 'active',
      startDate: start,
      deadline: end,
      completedAt: payload.status === 'completed' ? DateTime.utc() : null,
    })

    return response.created(goal)
  }

  /**
   * GET /goals/:id
   */
  async show({auth, params, response}: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .first()

    if (!goal) return response.notFound({message: 'Goal introuvable'})
    return goal
  }

  /**
   * PUT /goals/:id
   * AC: update
   */
  async update({auth, params, request, response}: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .first()

    if (!goal) return response.notFound({message: 'Goal introuvable'})

    const payload = await request.validateUsing(updateGoalValidator)

    // merge simple
    if (payload.title !== undefined) goal.title = payload.title
    if (payload.description !== undefined) goal.description = payload.description
    if (payload.category !== undefined) goal.category = payload.category
    if (payload.priority !== undefined) goal.priority = payload.priority
    if (payload.status !== undefined) goal.status = payload.status

    // dates (gérer le cas update partiel)
    const start = payload.start_date ? DateTime.fromISO(payload.start_date) : goal.startDate
    const end = payload.deadline ? DateTime.fromISO(payload.deadline) : goal.deadline

    if (!start.isValid || !end.isValid) {
      return response.badRequest({message: 'Dates invalides (format attendu: YYYY-MM-DD)'})
    }
    if (end < start) {
      return response.badRequest({message: 'La deadline doit être >= start_date'})
    }

    goal.startDate = start
    goal.deadline = end

    // completed_at si on passe en completed
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
   * AC: delete
   */
  async destroy({auth, params, response}: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .first()

    if (!goal) return response.notFound({message: 'Goal introuvable'})

    await goal.delete()
    return response.noContent()
  }

  /**
   * PATCH /goals/:id/complete
   * AC: patch complete (status=completed)
   */
  async complete({auth, params, response}: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .first()

    if (!goal) return response.notFound({message: 'Goal introuvable'})

    goal.status = 'completed'
    goal.completedAt = DateTime.utc()
    await goal.save()

    return goal
  }
}
