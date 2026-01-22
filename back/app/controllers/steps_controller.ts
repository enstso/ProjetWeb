import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Goal from '#models/goal'
import Step from '#models/step'
import { createStepValidator, updateStepValidator } from '#validators/step'

export default class StepsController {
  /**
   * GET /goals/:id/steps
   */
  async index({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()

    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    return Step.query().where('goal_id', goal.id).orderBy('order', 'asc').orderBy('id', 'asc')
  }

  /**
   * POST /goals/:id/steps
   * AC: ajouter step
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const goal = await Goal.query().where('id', params.id).where('user_id', user.id).first()

    if (!goal) return response.notFound({ message: 'Goal introuvable' })

    const payload = await request.validateUsing(createStepValidator)

    const deadline = payload.deadline ? DateTime.fromISO(payload.deadline) : null
    if (payload.deadline && !deadline?.isValid) {
      return response.badRequest({ message: 'Deadline invalide (format: YYYY-MM-DD)' })
    }

    const step = await Step.create({
      goalId: goal.id,
      title: payload.title,
      deadline: deadline,
      order: payload.order ?? 0,
      isCompleted: false,
      completedAt: null,
    })

    return response.created(step)
  }

  /**
   * PUT /steps/:id
   * AC: modifier step
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()

    if (!step) return response.notFound({ message: 'Step introuvable' })

    const payload = await request.validateUsing(updateStepValidator)

    if (payload.title !== undefined) step.title = payload.title
    if (payload.order !== undefined) step.order = payload.order
    if (payload.deadline !== undefined) {
      const d = payload.deadline ? DateTime.fromISO(payload.deadline) : null
      if (payload.deadline && !d?.isValid) {
        return response.badRequest({ message: 'Deadline invalide (format: YYYY-MM-DD)' })
      }
      step.deadline = d
    }

    // optionnel
    if (payload.is_completed !== undefined) {
      step.isCompleted = payload.is_completed
      step.completedAt = payload.is_completed ? DateTime.utc() : null
    }

    await step.save()
    return step
  }

  /**
   * DELETE /steps/:id
   * AC: supprimer step
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()

    if (!step) return response.notFound({ message: 'Step introuvable' })

    await step.delete()
    return response.noContent()
  }

  /**
   * PATCH /steps/:id/complete
   * AC: marquer step complétée
   */
  async complete({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const step = await Step.query()
      .where('id', params.id)
      .whereHas('goal', (q) => q.where('user_id', user.id))
      .first()
    console.log(params.id)

    if (!step) return response.notFound({ message: 'Step introuvable' })

    if (step.isCompleted) return step
    step.isCompleted = true
    step.completedAt = DateTime.utc()
    await step.save()
    return step
  }
}
