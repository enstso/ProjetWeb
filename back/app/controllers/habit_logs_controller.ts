import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Habit from '#models/habit'
import HabitLog from '#models/habit_log'
import { userTodayISO } from '../../utils/timezone.js'

export default class HabitLogsController {
  async store(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.getUserOrFail()

    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()

    if (!habit) return response.notFound({ message: 'Habitude introuvable' })
    if (habit.isArchived) return response.badRequest({ message: 'Habitude archivée' })

    const todayISO = userTodayISO(ctx) // ✅ dépend du timezone
    const existing = await HabitLog.query()
      .where('habit_id', habit.id)
      .whereRaw('date = ?', [todayISO])
      .first()

    // ✅ idempotent : si déjà log -> renvoyer existant (pas de double comptage)
    if (existing) {
      return response.ok({ ...existing.serialize(), already_exists: true, date_iso: todayISO })
    }

    try {
      const created = await HabitLog.create({
        habitId: habit.id,
        date: DateTime.fromISO(todayISO),
        isCompleted: true,
      })

      return response.created({ ...created.serialize(), already_exists: false, date_iso: todayISO })
    } catch (e: any) {
      // unique violation (habit_id, date) -> on renvoie l’existant
      if (e?.code === '23505') {
        const row = await HabitLog.query()
          .where('habit_id', habit.id)
          .whereRaw('date = ?', [todayISO])
          .first()

        if (row)
          return response.ok({ ...row.serialize(), already_exists: true, date_iso: todayISO })
      }
      throw e
    }
  }

  /**
   * DELETE /habits/:id/log/:date
   * AC: uncheck (suppression log) + anti-double reste garanti
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { id: habitId, date } = params // date = YYYY-MM-DD

    const habit = await Habit.query().where('id', habitId).where('user_id', user.id).first()

    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    const log = await HabitLog.query()
      .where('habit_id', habit.id)
      .whereRaw('date = ?', [date])
      .first()

    if (!log) return response.notFound({ message: 'Log introuvable' })

    await log.delete()
    return response.noContent()
  }

  /**
   * (Optionnel mais utile pour plus tard #18)
   * GET /habits/:id/logs?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async index({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()

    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    const start = request.input('start_date')
    const end = request.input('end_date')

    const q = HabitLog.query().where('habit_id', habit.id).orderBy('date', 'asc')
    if (start) q.whereRaw('date >= ?', [start])
    if (end) q.whereRaw('date <= ?', [end])

    return q
  }
}
