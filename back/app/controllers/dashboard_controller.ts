import type { HttpContext } from '@adonisjs/core/http'
import Goal from '#models/goal'
import Habit from '#models/habit'
import HabitLog from '#models/habit_log'
import { resolveUserZone, userTodayISO } from '../../utils/timezone.js'
import {
  calcBestDailyStreak,
  calcWeeklySuccessMap,
  calcBestWeeklyStreak,
} from '../../utils/habit_stats.js'

export default class DashboardController {
  /**
   * GET /dashboard
   * AC:
   * - objectifs en cours
   * - habitudes du jour
   * - stats: nb objectifs complétés, streak max, habitudes complétées today
   */
  async show(ctx: HttpContext) {
    const { auth, response, request } = ctx
    const user = auth.getUserOrFail()

    const zone = resolveUserZone(ctx)
    const todayISO = userTodayISO(ctx) // "aujourd'hui" basé sur X-Timezone

    /**
     * 1) Objectifs en cours (preview + total)
     */
    const goalLimitRaw = request.input('goal_limit')
    const goalLimit = Number.isFinite(Number(goalLimitRaw)) ? Math.max(1, Number(goalLimitRaw)) : 5

    const activeGoalsPreview = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'active')
      .orderBy('deadline', 'asc')
      .limit(goalLimit)

    const activeGoalsCountRow = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'active')
      .count('* as total')
      .first()

    const activeGoalsTotal = Number((activeGoalsCountRow as any)?.$extras?.total ?? 0)

    /**
     * 2) Habitudes du jour (habitudes actives + completed_today)
     */
    const activeHabits = await Habit.query()
      .where('user_id', user.id)
      .where('is_archived', false)
      .orderBy('id', 'desc')

    const activeHabitIds = activeHabits.map((h) => h.id)

    const todayLogs = activeHabitIds.length
      ? await HabitLog.query()
          .whereIn('habit_id', activeHabitIds)
          .whereRaw('date = ?', [todayISO]) // date (DATE)
          .select(['habit_id'])
      : []

    const todaySet = new Set<number>(todayLogs.map((l) => l.habitId))
    const habitsCompletedToday = todaySet.size

    const habitsToday = activeHabits.map((h) => ({
      ...h.serialize(),
      completed_today: todaySet.has(h.id),
    }))

    /**
     * 3) Stats: nb objectifs complétés
     */
    const completedGoalsRow = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'completed')
      .count('* as total')
      .first()

    const completedGoals = Number((completedGoalsRow as any)?.$extras?.total ?? 0)

    /**
     * 4) Stats: streak max (best streak max parmi toutes les habitudes)
     */
    const allHabits = await Habit.query()
      .where('user_id', user.id)
      .select(['id', 'frequency', 'weekly_target'])

    const allHabitIds = allHabits.map((h) => h.id)

    const allLogs = allHabitIds.length
      ? await HabitLog.query()
          .whereIn('habit_id', allHabitIds)
          .select(['habit_id', 'date'])
          .orderBy('date', 'asc')
      : []

    const byHabit = new Map<number, string[]>()
    for (const l of allLogs) {
      const iso = l.date.toISODate()!
      const arr = byHabit.get(l.habitId) ?? []
      arr.push(iso)
      byHabit.set(l.habitId, arr)
    }

    let maxStreak = 0
    for (const h of allHabits) {
      const datesAsc = byHabit.get(h.id) ?? []
      let best = 0

      if (h.frequency === 'daily') {
        best = datesAsc.length ? calcBestDailyStreak(datesAsc) : 0
      } else {
        const weeklyTarget = (h.weeklyTarget ?? 1) as number
        const weekCounts = calcWeeklySuccessMap(datesAsc, zone)
        best = calcBestWeeklyStreak(zone, weeklyTarget, weekCounts)
      }

      if (best > maxStreak) maxStreak = best
    }

    return response.ok({
      today: todayISO,
      zone,
      goals_active: {
        total: activeGoalsTotal,
        limit: goalLimit,
        items: activeGoalsPreview,
      },
      habits_today: habitsToday,
      stats: {
        completed_goals: completedGoals,
        max_streak: maxStreak,
        habits_completed_today: habitsCompletedToday,
      },
    })
  }
}
