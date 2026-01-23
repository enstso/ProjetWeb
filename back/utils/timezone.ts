import { DateTime, IANAZone } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Résout le fuseau horaire "utilisateur" à partir de la requête HTTP.
 *
 * Règle :
 * - On lit l’en-tête `x-timezone` (ex: "Europe/Paris", "America/New_York")
 * - On vérifie qu’il s’agit d’un vrai fuseau IANA (Luxon: IANAZone.isValidZone)
 * - Sinon, fallback en UTC
 *
 * Pourquoi :
 * - Garantir un comportement stable et sécurisé (pas de timezone invalide)
 * - Permettre au front d’imposer le "aujourd’hui" correct côté user
 */
export function resolveUserZone(ctx: HttpContext): string {
  // Lecture de l’en-tête custom "x-timezone"
  const tz = ctx.request.header('x-timezone')

  // Si présent et valide (IANA), on le garde
  if (tz && IANAZone.isValidZone(tz)) return tz

  // Sinon on retombe sur UTC (valeur sûre)
  return 'UTC'
}

/**
 * Retourne "aujourd’hui" (YYYY-MM-DD) basé sur le fuseau horaire utilisateur.
 *
 * Important :
 * - On ne prend PAS "today" en UTC si l’utilisateur est dans une autre zone,
 *   sinon il peut être "hier" ou "demain" pour lui.
 *
 * Exemple :
 * - Serveur en UTC, il est 23:30 UTC
 * - User en Europe/Paris (UTC+1/UTC+2), il est déjà 00:30 => nouveau jour
 * - On veut donc renvoyer la date du user
 */
export function userTodayISO(ctx: HttpContext): string {
  // Détermine le timezone user via resolveUserZone
  const zone = resolveUserZone(ctx)

  // "aujourd’hui" = date locale du user (pas UTC)
  // toISODate() => "YYYY-MM-DD"
  return DateTime.now().setZone(zone).toISODate()! // "YYYY-MM-DD"
}
