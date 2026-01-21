import { DateTime, IANAZone } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export function resolveUserZone(ctx: HttpContext): string {
  // 1) si tu as plus tard user.timezone, tu peux le brancher ici
  const headerTz = ctx.request.header('x-timezone') || ctx.request.input('tz')
  if (headerTz && IANAZone.isValidZone(headerTz)) return headerTz
  return 'UTC'
}

export function userTodayISO(ctx: HttpContext): string {
  const zone = resolveUserZone(ctx)
  return DateTime.now().setZone(zone).toISODate()! // YYYY-MM-DD
}
