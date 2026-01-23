import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Habit from '#models/habit'
import HabitLog from '#models/habit_log'
import { userTodayISO } from '../../utils/timezone.js'

export default class HabitLogsController {
  /**
   * POST /habits/:id/log
   *
   * Objectif:
   * - "check today" (créer un log pour aujourd'hui)
   *
   * AC:
   * - pas de double comptage (1 log par habitude et par date)
   * - "aujourd'hui" dépend du timezone user (via userTodayISO)
   * - doit refuser si l'habitude est archivée
   *
   * Comportement:
   * - idempotent: si le log existe déjà, on renvoie 200 + already_exists=true
   * - sinon on crée et renvoie 201 + already_exists=false
   */
  async store(ctx: HttpContext) {
    const { auth, params, response } = ctx

    // 1) Sécurité: user connecté
    const user = auth.getUserOrFail()

    // 2) Sécurité: l'habitude doit appartenir au user
    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    // 3) Règle métier: une habitude archivée n'est plus "trackable"
    // => on bloque check/uncheck tant qu'elle n'est pas restaurée
    if (habit.isArchived) return response.badRequest({ message: 'Habitude archivée' })

    // 4) "Today" dépend du fuseau utilisateur (ex: header X-Timezone)
    const todayISO = userTodayISO(ctx) // ex: "2026-01-22"

    // 5) Anti-double (niveau applicatif): on cherche si le log existe déjà
    const existing = await HabitLog.query()
      .where('habit_id', habit.id)
      .whereRaw('date = ?', [todayISO]) // colonne DATE, comparée au ISO date
      .first()

    // Idempotence: si déjà log => on ne recrée pas
    if (existing) {
      return response.ok({ ...existing.serialize(), already_exists: true, date_iso: todayISO })
    }

    // 6) Création du log (on se repose aussi sur la contrainte UNIQUE en base)
    try {
      const created = await HabitLog.create({
        habitId: habit.id,
        date: DateTime.fromISO(todayISO), // stocké en DATE en DB
        isCompleted: true,
      })

      return response.created({ ...created.serialize(), already_exists: false, date_iso: todayISO })
    } catch (e: any) {
      /**
       * Sécurité anti-double (niveau DB):
       * - si deux requêtes concurrentes passent en même temps,
       *   la contrainte UNIQUE (habit_id, date) peut lever 23505.
       * - On renvoie alors l'existant (comportement idempotent).
       */
      if (e?.code === '23505') {
        const row = await HabitLog.query()
          .where('habit_id', habit.id)
          .whereRaw('date = ?', [todayISO])
          .first()

        if (row) return response.ok({ ...row.serialize(), already_exists: true, date_iso: todayISO })
      }

      // sinon on laisse remonter l'erreur (500) pour debug
      throw e
    }
  }

  /**
   * DELETE /habits/:id/log/:date
   *
   * Objectif:
   * - "uncheck" (supprimer un log à une date donnée)
   *
   * AC:
   * - uncheck fonctionne
   * - anti-double reste garanti (puisqu'on supprime)
   * - doit refuser si l'habitude est archivée
   *
   * Notes:
   * - params.date doit être au format YYYY-MM-DD
   */
  async destroy({ auth, params, response }: HttpContext) {
    // 1) Sécurité: user connecté
    const user = auth.getUserOrFail()

    // 2) Extraction params
    const { id: habitId, date } = params // habitId = id habitude, date = "YYYY-MM-DD"

    // 3) Sécurité: habit appartient au user
    const habit = await Habit.query().where('id', habitId).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    // 4) Règle métier: habitude archivée => pas de progression / pas de modifications tracking
    if (habit.isArchived) return response.badRequest({ message: 'Habitude archivée' })

    // 5) Cherche le log exact à supprimer
    const log = await HabitLog.query()
      .where('habit_id', habit.id)
      .whereRaw('date = ?', [date])
      .first()

    if (!log) return response.notFound({ message: 'Log introuvable' })

    // 6) Suppression
    await log.delete()
    return response.noContent()
  }

  /**
   * GET /habits/:id/logs?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   *
   * Objectif:
   * - retourner l'historique (utile pour la grille/calendrier)
   *
   * Notes:
   * - filtrage optionnel par start_date/end_date
   * - pas besoin de bloquer si archivée: lire l'historique reste OK (en général)
   *   (si tu veux masquer l'historique d'une archive, ajoute un guard ici)
   */
  async index({ auth, params, request, response }: HttpContext) {
    // 1) Sécurité: user connecté
    const user = auth.getUserOrFail()

    // 2) Sécurité: habit appartient au user
    const habit = await Habit.query().where('id', params.id).where('user_id', user.id).first()
    if (!habit) return response.notFound({ message: 'Habitude introuvable' })

    // 3) Filtres date optionnels
    const start = request.input('start_date')
    const end = request.input('end_date')

    // 4) Query logs (tri asc pour une grille)
    const q = HabitLog.query().where('habit_id', habit.id).orderBy('date', 'asc')

    if (start) q.whereRaw('date >= ?', [start])
    if (end) q.whereRaw('date <= ?', [end])

    return q
  }
}
