import { DateTime } from 'luxon'

export function calcCurrentDailyStreak(todayISO: string, doneDates: Set<string>) {
  if (!doneDates.has(todayISO)) return 0
  let streak = 0
  let cursor = DateTime.fromISO(todayISO)
  while (doneDates.has(cursor.toISODate()!)) {
    streak++
    cursor = cursor.minus({ days: 1 })
  }
  return streak
}

export function calcBestDailyStreak(sortedDatesAsc: string[]) {
  if (sortedDatesAsc.length === 0) return 0

  let best = 1
  let current = 1

  for (let i = 1; i < sortedDatesAsc.length; i++) {
    const prev = DateTime.fromISO(sortedDatesAsc[i - 1])
    const cur = DateTime.fromISO(sortedDatesAsc[i])
    const diff = cur.diff(prev, 'days').days

    if (diff === 1) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}

function weekStartFromISO(isoDate: string, zone: string) {
  // On force l’ISO week (lundi = début)
  const dt = DateTime.fromISO(isoDate, { zone })
  return DateTime.fromObject(
    { weekYear: dt.weekYear, weekNumber: dt.weekNumber, weekday: 1 },
    { zone }
  ).startOf('day')
}

export function calcWeeklySuccessMap(dates: string[], zone: string) {
  // map key = "YYYY-Www" => count
  const map = new Map<string, number>()
  for (const iso of dates) {
    const dt = DateTime.fromISO(iso, { zone })
    const key = `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

export function calcCurrentWeeklyStreak(
  todayISO: string,
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
  const start = weekStartFromISO(todayISO, zone)
  const curKey = `${start.weekYear}-W${String(start.weekNumber).padStart(2, '0')}`
  const curCount = weekCounts.get(curKey) ?? 0

  // streak actif uniquement si semaine en cours >= target
  if (curCount < weeklyTarget) return 0

  let streak = 0
  let cursor = start
  while (true) {
    const key = `${cursor.weekYear}-W${String(cursor.weekNumber).padStart(2, '0')}`
    const count = weekCounts.get(key) ?? 0
    if (count >= weeklyTarget) {
      streak++
      cursor = cursor.minus({ weeks: 1 })
      continue
    }
    break
  }
  return streak
}

export function calcBestWeeklyStreak(
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
  // On transforme les semaines "success" en dates de startOfWeek pour trier & détecter les runs
  const successStarts: DateTime[] = []
  for (const [key, count] of weekCounts.entries()) {
    if (count < weeklyTarget) continue
    const [wy, wn] = key.split('-W')
    const weekYear = Number(wy)
    const weekNumber = Number(wn)
    const start = DateTime.fromObject({ weekYear, weekNumber, weekday: 1 }, { zone }).startOf('day')
    successStarts.push(start)
  }

  if (successStarts.length === 0) return 0
  successStarts.sort((a, b) => a.toMillis() - b.toMillis())

  let best = 1
  let current = 1

  for (let i = 1; i < successStarts.length; i++) {
    const prev = successStarts[i - 1]
    const cur = successStarts[i]
    const diffWeeks = cur.diff(prev, 'weeks').weeks

    if (diffWeeks === 1) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}

export function calcCompletionRateDaily(startISO: string, endISO: string, doneCount: number) {
  const start = DateTime.fromISO(startISO).startOf('day')
  const end = DateTime.fromISO(endISO).startOf('day')
  const days = Math.floor(end.diff(start, 'days').days) + 1
  if (days <= 0) return 0
  return Math.round((doneCount / days) * 100)
}

export function countWeeksInclusive(startISO: string, endISO: string, zone: string) {
  const start = weekStartFromISO(startISO, zone)
  const end = weekStartFromISO(endISO, zone)
  const weeks = Math.floor(end.diff(start, 'weeks').weeks) + 1
  return Math.max(0, weeks)
}

export function calcCompletionRateWeekly(
  startISO: string,
  endISO: string,
  zone: string,
  weeklyTarget: number,
  doneCount: number
) {
  const weeks = countWeeksInclusive(startISO, endISO, zone)
  const expected = weeks * weeklyTarget
  if (expected <= 0) return 0
  return Math.round((doneCount / expected) * 100)
}
