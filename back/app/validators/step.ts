import vine from '@vinejs/vine'

/**
 * Validator: création d’une étape (POST /goals/:id/steps)
 * - Valide le payload avant de créer une Step liée à un Goal.
 *
 * Champs :
 * - title : obligatoire (non vide après trim)
 * - deadline : optionnel, string attendu au format "YYYY-MM-DD"
 *   (la validation stricte + parsing Luxon est faite dans le controller)
 * - order : optionnel, number (sert au tri/ordre d’affichage)
 */
export const createStepValidator = vine.compile(
  vine.object({
    /**
     * Titre obligatoire.
     */
    title: vine.string().trim().minLength(1),

    /**
     * Deadline optionnelle (string).
     * Format attendu : "YYYY-MM-DD" (contrôlé ensuite dans le controller).
     */
    deadline: vine.string().trim().optional(), // YYYY-MM-DD

    /**
     * Ordre optionnel (nombre).
     * Si absent, le controller peut mettre une valeur par défaut (ex: 0).
     */
    order: vine.number().optional(),
  })
)

/**
 * Validator: mise à jour d’une étape (PUT /steps/:id)
 * - Update partiel : tous les champs sont optionnels.
 *
 * Champs :
 * - title : optionnel (si présent, non vide après trim)
 * - deadline : optionnel (string, "YYYY-MM-DD" attendu, parsing/validation Luxon dans controller)
 * - order : optionnel (number)
 * - is_completed : optionnel (boolean)
 *   -> Permet le toggle check/uncheck via PUT, sans endpoint dédié.
 */
export const updateStepValidator = vine.compile(
  vine.object({
    /**
     * Nouveau titre (optionnel).
     */
    title: vine.string().trim().minLength(1).optional(),

    /**
     * Nouvelle deadline (optionnelle).
     * Format attendu : "YYYY-MM-DD" (contrôlé ensuite dans le controller).
     */
    deadline: vine.string().trim().optional(),

    /**
     * Nouvel ordre (optionnel).
     */
    order: vine.number().optional(),

    /**
     * Toggle complétion (optionnel).
     * true  -> step complétée (completedAt set dans controller)
     * false -> step décochée (completedAt remis à null dans controller)
     */
    is_completed: vine.boolean().optional(),
  })
)
