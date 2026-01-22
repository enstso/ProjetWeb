import { DateTime, IANAZone } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export function resolveUserZone(ctx: HttpContext): string {
  const tz = ctx.request.header('x-timezone')
  if (tz && IANAZone.isValidZone(tz)) return tz
  return 'UTC'
}

export function userTodayISO(ctx: HttpContext): string {
  const zone = resolveUserZone(ctx)
  // "aujourd’hui" = date locale du user (pas UTC)
  return DateTime.now().setZone(zone).toISODate()! // "YYYY-MM-DD"
}
