import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Habit from '#models/habit'
import { createHabitValidator, updateHabitValidator } from '#validators/habit'

export default class HabitsController {
  /**
   * GET /habits
   * AC: lister actives
   */
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Habit.query()
      .where('user_id', user.id)
      .where('is_archived', false)
      .orderBy('id', 'desc')
  }

  /**
   * GET /habits/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })
    return habit
  }

  /**
   * POST /habits
   * AC: créer
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createHabitValidator)

    const start = DateTime.fromISO(payload.start_date)
    if (!start.isValid) return response.badRequest({ message: 'start_date invalide (YYYY-MM-DD)' })

    if (payload.frequency === 'weekly' && !payload.weekly_target) {
      return response.badRequest({ message: 'weekly_target requis si frequency=weekly' })
    }

    const habit = await Habit.create({
      userId: user.id,
      name: payload.name,
      description: payload.description ?? null,
      category: payload.category ?? null,
      frequency: payload.frequency,
      weeklyTarget: payload.frequency === 'weekly' ? payload.weekly_target! : null,
      startDate: start,
      isArchived: false,
    })

    return response.created(habit)
  }

  /**
   * PUT /habits/:id
   * AC: edit
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    const payload = await request.validateUsing(updateHabitValidator)

    if (payload.name !== undefined) habit.name = payload.name
    if (payload.description !== undefined) habit.description = payload.description
    if (payload.category !== undefined) habit.category = payload.category
    if (payload.frequency !== undefined) habit.frequency = payload.frequency

    if (payload.start_date !== undefined) {
      const start = DateTime.fromISO(payload.start_date)
      if (!start.isValid) return response.badRequest({ message: 'start_date invalide (YYYY-MM-DD)' })
      habit.startDate = start
    }

    // weekly_target logique
    if (payload.weekly_target !== undefined) habit.weeklyTarget = payload.weekly_target

    if (habit.frequency === 'weekly' && !habit.weeklyTarget) {
      return response.badRequest({ message: 'weekly_target requis si frequency=weekly' })
    }
    if (habit.frequency === 'daily') {
      habit.weeklyTarget = null
    }

    await habit.save()
    return habit
  }

  /**
   * PATCH /habits/:id/archive
   * AC: archiver (pause/stop)
   */
  async archive({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    habit.isArchived = true
    await habit.save()
    return habit
  }
}
