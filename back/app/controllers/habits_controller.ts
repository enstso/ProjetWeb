import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Habit from '#models/habit'
import { createHabitValidator, updateHabitValidator } from '#validators/habit'
import {
  calcBestDailyStreak,
  calcBestWeeklyStreak,
  calcCompletionRateDaily,
  calcCompletionRateWeekly,
  calcCurrentDailyStreak,
  calcCurrentWeeklyStreak,
  calcWeeklySuccessMap,
} from '../../utils/habit_stats.js'
import { resolveUserZone, userTodayISO } from '../../utils/timezone.js'
import HabitLog from '#models/habit_log'

export default class HabitsController {
  /**
   * GET /habits?archived=true|false
   * - par défaut: archived=false (actives)
   */
  async index({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()

    const archivedParam = request.input('archived') // "true" | "false" | undefined
    const archived =
      archivedParam === undefined ? false : String(archivedParam).toLowerCase() === 'true'

    return Habit.query()
      .where('user_id', user.id)
      .where('is_archived', archived)
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
      if (!start.isValid)
        return response.badRequest({ message: 'start_date invalide (YYYY-MM-DD)' })
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

  async unarchive({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()

    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    habit.isArchived = false
    await habit.save()

    return response.ok(habit)
  }

  /**
   * GET /habits/:id/stats
   * AC: streak actuel + best streak corrects
   */
  async stats(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.getUserOrFail()

    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()

    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    const zone = resolveUserZone(ctx)
    const todayISO = userTodayISO(ctx)

    // Range pour completion rate (optionnel, sinon depuis start_date jusqu'à today)
    const startISO = (request.input('start_date') as string) || habit.startDate.toISODate()!
    const endISO = (request.input('end_date') as string) || todayISO

    // On récupère les logs dans le range (pour completion rate)
    const logsInRange = await HabitLog.query()
      .where('habit_id', habit.id)
      .whereRaw('date >= ?', [startISO])
      .whereRaw('date <= ?', [endISO])
      .orderBy('date', 'asc')

    const doneDatesInRange = logsInRange.map((l) => l.date.toISODate()!)

    // Pour streak (best/current), on préfère analyser l’historique complet (depuis start_date)
    const allLogs = await HabitLog.query().where('habit_id', habit.id).orderBy('date', 'asc')

    const allDates = allLogs.map((l) => l.date.toISODate()!)
    const allDatesSet = new Set(allDates)

    let currentStreak: number
    let bestStreak: number
    let completionRate: number

    if (habit.frequency === 'daily') {
      // ✅ current streak doit inclure aujourd’hui
      currentStreak = calcCurrentDailyStreak(todayISO, allDatesSet)
      bestStreak = allDates.length ? calcBestDailyStreak(allDates) : 0

      completionRate = calcCompletionRateDaily(startISO, endISO, doneDatesInRange.length)
    } else {
      const weeklyTarget = habit.weeklyTarget ?? 1

      // Map semaine -> nb logs
      const weekCounts = calcWeeklySuccessMap(allDates, zone)

      currentStreak = calcCurrentWeeklyStreak(todayISO, zone, weeklyTarget, weekCounts)
      bestStreak = calcBestWeeklyStreak(zone, weeklyTarget, weekCounts)

      completionRate = calcCompletionRateWeekly(
        startISO,
        endISO,
        zone,
        weeklyTarget,
        doneDatesInRange.length
      )
    }

    return response.ok({
      habit_id: habit.id,
      frequency: habit.frequency,
      weekly_target: habit.weeklyTarget,
      zone,
      today: todayISO,
      range: { start_date: startISO, end_date: endISO },
      stats: {
        current_streak: currentStreak,
        best_streak: bestStreak,
        completion_rate_percent: completionRate,
      },
    })
  }
}
