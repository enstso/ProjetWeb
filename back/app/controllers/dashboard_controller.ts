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
   * Endpoint "résumé" pour alimenter le dashboard front.
   *
   * AC:
   * - objectifs en cours
   * - habitudes du jour
   * - stats: nb objectifs complétés, streak max, habitudes complétées today
   */
  async show(ctx: HttpContext) {
    const { auth, response, request } = ctx

    // User authentifié (middleware auth). Si pas connecté => exception/401 en amont.
    const user = auth.getUserOrFail()

    /**
     * Timezone & "today"
     * - zone est résolue depuis la requête (ex: header X-Timezone) via resolveUserZone
     * - todayISO est un "YYYY-MM-DD" calculé dans ce fuseau, pour que le tracking soit juste
     */
    const zone = resolveUserZone(ctx)
    const todayISO = userTodayISO(ctx) // "aujourd'hui" basé sur X-Timezone

    /**
     * 1) Objectifs en cours (preview + total)
     * - On renvoie une preview paginée "simple" via limit (goal_limit)
     * - + un total pour afficher "X objectifs en cours"
     */
    const goalLimitRaw = request.input('goal_limit') // query param optionnel
    const goalLimit = Number.isFinite(Number(goalLimitRaw)) ? Math.max(1, Number(goalLimitRaw)) : 5

    // Preview : objectifs "active" triés par deadline la plus proche
    const activeGoalsPreview = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'active')
      .orderBy('deadline', 'asc')
      .limit(goalLimit)

    // Total : count(*) des objectifs actifs (pour affichage global)
    const activeGoalsCountRow = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'active')
      .count('* as total')
      .first()

    // $extras.total vient du count. On cast en number pour éviter les strings.
    const activeGoalsTotal = Number((activeGoalsCountRow as any)?.$extras?.total ?? 0)

    /**
     * 2) Habitudes du jour
     * - On prend uniquement les habitudes actives (is_archived = false)
     * - On récupère les logs du "todayISO" pour marquer completed_today côté UI
     */
    const activeHabits = await Habit.query()
      .where('user_id', user.id)
      .where('is_archived', false)
      .orderBy('id', 'desc')

    // ids utiles pour faire un whereIn sur HabitLogs
    const activeHabitIds = activeHabits.map((h) => h.id)

    // Logs du jour (uniquement les habit_id) pour savoir quelles habitudes sont cochées aujourd'hui
    const todayLogs = activeHabitIds.length
      ? await HabitLog.query()
          .whereIn('habit_id', activeHabitIds)
          .whereRaw('date = ?', [todayISO]) // colonne DATE, comparée à "YYYY-MM-DD"
          .select(['habit_id'])
      : []

    // Set pour lookup O(1) : habitId => "cochée aujourd'hui ?"
    const todaySet = new Set<number>(todayLogs.map((l) => l.habitId))
    const habitsCompletedToday = todaySet.size

    // Payload final des habitudes du jour + champ dérivé "completed_today"
    const habitsToday = activeHabits.map((h) => ({
      ...h.serialize(),
      completed_today: todaySet.has(h.id),
    }))

    /**
     * 3) Stats: nombre d'objectifs complétés
     * - Compte tous les goals user avec status = completed
     */
    const completedGoalsRow = await Goal.query()
      .where('user_id', user.id)
      .where('status', 'completed')
      .count('* as total')
      .first()

    const completedGoals = Number((completedGoalsRow as any)?.$extras?.total ?? 0)

    /**
     * 4) Stats: streak max
     * - On calcule le "best streak" pour chaque habitude (daily/weekly)
     * - On prend le maximum parmi toutes les habitudes de l'utilisateur
     *
     * Note: on inclut ici toutes les habitudes (archivées ou non) selon ce query.
     * Si tu veux exclure les archivées du calcul, ajoute .where('is_archived', false)
     */
    const allHabits = await Habit.query()
      .where('user_id', user.id)
      .select(['id', 'frequency', 'weekly_target'])

    const allHabitIds = allHabits.map((h) => h.id)

    // Tous les logs de toutes les habitudes, triés asc pour faciliter les calculs
    const allLogs = allHabitIds.length
      ? await HabitLog.query()
          .whereIn('habit_id', allHabitIds)
          .select(['habit_id', 'date'])
          .orderBy('date', 'asc')
      : []

    // Regroupement des dates (YYYY-MM-DD) par habitId
    // byHabit: habitId -> [date1, date2, ...] (tri asc)
    const byHabit = new Map<number, string[]>()
    for (const l of allLogs) {
      const iso = l.date.toISODate()!
      const arr = byHabit.get(l.habitId) ?? []
      arr.push(iso)
      byHabit.set(l.habitId, arr)
    }

    // On calcule le max streak (best) parmi toutes les habitudes
    let maxStreak = 0
    for (const h of allHabits) {
      const datesAsc = byHabit.get(h.id) ?? []
      let best = 0

      // Daily: meilleure série de jours consécutifs
      if (h.frequency === 'daily') {
        best = datesAsc.length ? calcBestDailyStreak(datesAsc) : 0
      } else {
        // Weekly: meilleure série de semaines "success" (>= weekly_target)
        // weeklyTarget fallback à 1 si null/undefined
        const weeklyTarget = (h.weeklyTarget ?? 1) as number
        const weekCounts = calcWeeklySuccessMap(datesAsc, zone)
        best = calcBestWeeklyStreak(zone, weeklyTarget, weekCounts)
      }

      if (best > maxStreak) maxStreak = best
    }

    /**
     * Réponse JSON finale
     * - today/zone: utiles au front (affichage + debug timezone)
     * - goals_active: preview + total + limit utilisé
     * - habits_today: liste + completed_today
     * - stats: compte objectifs complétés + max streak + nombre cochées aujourd'hui
     */
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
