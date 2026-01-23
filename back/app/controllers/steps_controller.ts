import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Goal from '#models/goal'
import Step from '#models/step'
import { createStepValidator, updateStepValidator } from '#validators/step'

export default class StepsController {
  /**
   * GET /goals/:id/steps
   * - Retourne toutes les étapes (steps) d’un objectif donné
   * - Sécurité: l’objectif doit appartenir à l’utilisateur connecté
   * - Tri: d’abord par `order`, puis par `id` pour un ordre stable
   */
  async index({ auth, params, response }: HttpContext) {
    // Récupère l’utilisateur courant depuis le middleware auth
    const user = auth.getUserOrFail()

    // Vérifie que l’objectif existe ET appartient à l’utilisateur
    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()

    // Si l’objectif n’existe pas (ou n’est pas au user), 404
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    // Retourne la query des steps pour cet objectif (triées)
    return Step.query().where('goal_id', goal.id).orderBy('order', 'asc').orderBy('id', 'asc')
  }

  /**
   * POST /goals/:id/steps
   * AC: ajouter step
   * - Crée une étape rattachée à un objectif de l’utilisateur
   * - Valide le payload via `createStepValidator`
   * - Valide la deadline si fournie
   */
  async store({ auth, params, request, response }: HttpContext) {
    // Utilisateur courant
    const user = auth.getUserOrFail()

    // Vérifie que l’objectif est au user
    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()

    // 404 si objectif non trouvé
    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    // Validation du body (ex: title requis, deadline optionnelle, etc.)
    const payload = await request.validateUsing(createStepValidator)

    // Parse de deadline (si présente) en DateTime Luxon
    const deadline = payload.deadline ? DateTime.fromISO(payload.deadline) : null

    // Si une deadline est fournie mais invalide -> 400
    if (payload.deadline && !deadline?.isValid) {
      return response.badRequest({ message: 'Deadline invalide (format: YYYY-MM-DD)' })
    }

    // Création de la step :
    // - goalId: relation
    // - isCompleted false + completedAt null au départ
    // - order par défaut à 0 si non fourni
    const step = await Step.create({
      goalId: goal.id,
      title: payload.title,
      deadline: deadline,
      order: payload.order ?? 0,
      isCompleted: false,
      completedAt: null,
    })

    // 201 + payload de la step créée
    return response.created(step)
  }

  /**
   * PUT /steps/:id
   * AC: modifier step
   * - Met à jour une étape existante
   * - Sécurité: l’étape doit appartenir au user (via relation goal.user_id)
   * - Supporte update partiel (title/order/deadline/is_completed)
   */
  async update({ auth, params, request, response }: HttpContext) {
    // Utilisateur courant
    const user = auth.getUserOrFail()

    // Récupère la step si elle appartient au user :
    // whereHas('goal') assure que le goal lié est au user
    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()

    // 404 si step introuvable / pas au user
    if (!step) return response.notFound({ message: 'Step introuvable' })

    // Validation du payload update
    const payload = await request.validateUsing(updateStepValidator)

    // Mise à jour des champs simples si présents
    if (payload.title !== undefined) step.title = payload.title
    if (payload.order !== undefined) step.order = payload.order

    // Gestion deadline :
    // - deadline peut être mise à jour
    // - supporte aussi "null" (ou absence) selon ton validator
    if (payload.deadline !== undefined) {
      const d = payload.deadline ? DateTime.fromISO(payload.deadline) : null

      // Si deadline fournie mais invalide -> 400
      if (payload.deadline && !d?.isValid) {
        return response.badRequest({ message: 'Deadline invalide (format: YYYY-MM-DD)' })
      }
      step.deadline = d
    }

    // Optionnel: toggle complétion via snake_case `is_completed`
    // - met à jour aussi completedAt (UTC) quand on coche
    // - remet à null quand on décoche
    if (payload.is_completed !== undefined) {
      step.isCompleted = payload.is_completed
      step.completedAt = payload.is_completed ? DateTime.utc() : null
    }

    // Persistance DB
    await step.save()

    // Retour de la step mise à jour
    return step
  }

  /**
   * DELETE /steps/:id
   * AC: supprimer step
   * - Supprime une étape
   * - Sécurité: doit appartenir à l’utilisateur (via goal.user_id)
   */
  async destroy({ auth, params, response }: HttpContext) {
    // Utilisateur courant
    const user = auth.getUserOrFail()

    // Cherche la step appartenant au user
    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()

    // 404 si introuvable / pas au user
    if (!step) return response.notFound({ message: 'Step introuvable' })

    // Suppression
    await step.delete()

    // 204 No Content
    return response.noContent()
  }

  /**
   * PATCH /steps/:id/complete
   * AC: marquer step complétée
   * - Marque l’étape comme complétée (idempotent)
   * - Sécurité: doit appartenir à l’utilisateur (via goal.user_id)
   */
  async complete({ auth, params, response }: HttpContext) {
    // Utilisateur courant
    const user = auth.getUserOrFail()

    // Cherche la step si elle appartient au user
    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()

    // Debug (attention en prod: à retirer ou logger proprement)
    console.log(params.id)

    // 404 si introuvable
    if (!step) return response.notFound({ message: 'Step introuvable' })

    // Idempotence: si déjà complétée, on renvoie tel quel
    if (step.isCompleted) return step

    // Marque complétée + timestamp UTC
    step.isCompleted = true
    step.completedAt = DateTime.utc()

    // Sauvegarde
    await step.save()

    // Retour step complétée
    return step
  }
}
