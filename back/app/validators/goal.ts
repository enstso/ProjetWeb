import vine from '@vinejs/vine'

/**
 * Validator: création d’un objectif (POST /goals)
 * - Valide et normalise le payload entrant côté API
 * - Objectif : garantir les types + contraintes minimales avant d’arriver au controller
 *
 * Remarques :
 * - Les champs dates sont validés ici comme string, la validation de format/ordre (deadline >= start_date)
 *   est faite dans le controller (via Luxon).
 * - priority/status sont optionnels : le controller applique des valeurs par défaut si absents.
 */
export const createGoalValidator = vine.compile(
  vine.object({
    /**
     * Titre obligatoire (non vide après trim).
     */
    title: vine.string().trim().minLength(1),

    /**
     * Description optionnelle.
     */
    description: vine.string().trim().optional(),

    /**
     * Catégorie optionnelle (ex: Santé, Carrière...).
     */
    category: vine.string().trim().optional(),

    /**
     * Priorité optionnelle, limitée aux valeurs autorisées.
     * Si absent, ton controller met "medium" par défaut.
     */
    priority: vine.enum(['low', 'medium', 'high']).optional(),

    /**
     * Statut optionnel, limité aux valeurs autorisées.
     * Si absent, ton controller met "active" par défaut.
     */
    status: vine.enum(['active', 'completed', 'abandoned']).optional(),

    /**
     * Date de début obligatoire au format attendu "YYYY-MM-DD".
     * Ici : string trim => la vérification stricte du format se fait ensuite (Luxon + isValid).
     */
    start_date: vine.string().trim(),

    /**
     * Deadline obligatoire au format attendu "YYYY-MM-DD".
     * Ici : string trim => la vérification stricte du format et la règle deadline>=start_date
     * sont gérées ensuite dans le controller.
     */
    deadline: vine.string().trim(),
  })
)

/**
 * Validator: mise à jour d’un objectif (PUT /goals/:id)
 * - Tous les champs sont optionnels (update partiel possible)
 * - Les enums protègent contre des valeurs hors contrat
 * - Les dates restent des string : parsing/contrôle de cohérence (deadline >= start_date)
 *   est fait dans le controller.
 */
export const updateGoalValidator = vine.compile(
  vine.object({
    /**
     * Titre optionnel, mais s’il est présent il doit être non vide.
     */
    title: vine.string().trim().minLength(1).optional(),

    /**
     * Description optionnelle (peut être fournie/vidée selon ta logique côté controller).
     */
    description: vine.string().trim().optional(),

    /**
     * Catégorie optionnelle.
     */
    category: vine.string().trim().optional(),

    /**
     * Priorité optionnelle, limitée aux valeurs autorisées.
     */
    priority: vine.enum(['low', 'medium', 'high']).optional(),

    /**
     * Statut optionnel, limité aux valeurs autorisées.
     * Ton controller gère aussi completedAt selon le statut.
     */
    status: vine.enum(['active', 'completed', 'abandoned']).optional(),

    /**
     * start_date optionnelle (string) — parsing/validation plus stricte faite dans le controller.
     */
    start_date: vine.string().trim().optional(),

    /**
     * deadline optionnelle (string) — parsing/validation plus stricte faite dans le controller.
     */
    deadline: vine.string().trim().optional(),
  })
)
