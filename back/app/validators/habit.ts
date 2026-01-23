import vine from '@vinejs/vine'

/**
 * Validator: création d’une habitude (POST /habits)
 * - Valide et normalise le payload entrant
 * - Objectif : sécuriser les types et appliquer des contraintes minimales avant controller
 *
 * Remarques :
 * - weekly_target est optionnel ici, mais ton controller impose la règle :
 *   si frequency === "weekly" alors weekly_target est requis.
 * - start_date est validé comme string ici ; le parsing/validation stricte du format (YYYY-MM-DD)
 *   est fait dans le controller (Luxon + isValid).
 */
export const createHabitValidator = vine.compile(
  vine.object({
    /**
     * Nom obligatoire (non vide après trim).
     */
    name: vine.string().trim().minLength(1),

    /**
     * Description optionnelle.
     */
    description: vine.string().trim().optional(),

    /**
     * Catégorie optionnelle.
     */
    category: vine.string().trim().optional(),

    /**
     * Fréquence obligatoire : "daily" ou "weekly".
     */
    frequency: vine.enum(['daily', 'weekly']),

    /**
     * Objectif hebdo (uniquement pour weekly).
     * - Contrainte: >= 1
     * - Optionnel au niveau validator, mais requis en pratique si frequency=weekly (controller).
     */
    weekly_target: vine.number().min(1).optional(),

    /**
     * Date de début obligatoire (string) — format attendu: "YYYY-MM-DD".
     * La validation stricte du format est gérée dans le controller.
     */
    start_date: vine.string().trim(), // YYYY-MM-DD
  })
)

/**
 * Validator: mise à jour d’une habitude (PUT /habits/:id)
 * - Tous les champs sont optionnels (update partiel)
 *
 * Remarques :
 * - Si on change la frequency vers weekly, ton controller vérifie que weekly_target existe.
 * - Si on passe en daily, ton controller remet weeklyTarget à null.
 */
export const updateHabitValidator = vine.compile(
  vine.object({
    /**
     * Nom optionnel, mais s’il est présent il doit être non vide.
     */
    name: vine.string().trim().minLength(1).optional(),

    /**
     * Description optionnelle.
     */
    description: vine.string().trim().optional(),

    /**
     * Catégorie optionnelle.
     */
    category: vine.string().trim().optional(),

    /**
     * Fréquence optionnelle : "daily" ou "weekly".
     */
    frequency: vine.enum(['daily', 'weekly']).optional(),

    /**
     * Objectif hebdo optionnel (>= 1).
     * Requis en pratique si frequency=weekly (logique dans le controller).
     */
    weekly_target: vine.number().min(1).optional(),

    /**
     * Date de début optionnelle (string) — parsing/validation stricte dans le controller.
     */
    start_date: vine.string().trim().optional(),
  })
)
