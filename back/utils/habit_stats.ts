import { DateTime } from 'luxon'

/**
 * Utilitaires dates (ISO date only)
 */
function isoDay(iso: string) {
  return DateTime.fromISO(iso).startOf('day')
}

function isoKey(dt: DateTime) {
  return dt.toISODate()!
}

function weekKeyFromDT(dt: DateTime) {
  return `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}`
}

/**
 * Daily — current streak
 * Règle : streak actif uniquement si today est coché.
 */
export function calcCurrentDailyStreak(todayISO: string, doneDates: Set<string>) {
  const today = isoKey(isoDay(todayISO))
  if (!doneDates.has(today)) return 0

  let streak = 0
  let cursor = isoDay(today)

  while (doneDates.has(isoKey(cursor))) {
    streak++
    cursor = cursor.minus({ days: 1 })
  }
  return streak
}

/**
 * Daily — best streak
 * Entrée attendue : dates uniques triées ASC (YYYY-MM-DD).
 * Si tu n'es pas sûr d'avoir des dates uniques, on peut les dédupliquer ici.
 */
export function calcBestDailyStreak(sortedDatesAsc: string[]) {
  if (sortedDatesAsc.length === 0) return 0

  // ✅ sécurité : dédoublonnage + normalisation
  const dates = Array.from(new Set(sortedDatesAsc.map((d) => d.slice(0, 10)))).sort()

  if (dates.length === 0) return 0
  let best = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = isoDay(dates[i - 1])
    const cur = isoDay(dates[i])

    // ✅ évite les flottants : on compare au jour suivant exact
    if (prev.plus({ days: 1 }).toISODate() === cur.toISODate()) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}

function weekStartFromISO(isoDate: string, zone: string) {
  // ISO week (lundi = début)
  const dt = DateTime.fromISO(isoDate, { zone }).startOf('day')
  return DateTime.fromObject(
    { weekYear: dt.weekYear, weekNumber: dt.weekNumber, weekday: 1 },
    { zone }
  ).startOf('day')
}

/**
 * Weekly — map semaine ISO => count
 * Entrée : dates ISO (YYYY-MM-DD). (Si doublons : on peut dédupliquer.)
 */
export function calcWeeklySuccessMap(dates: string[], zone: string) {
  const map = new Map<string, number>()
  const uniq = Array.from(new Set(dates.map((d) => d.slice(0, 10))))

  for (const iso of uniq) {
    const dt = DateTime.fromISO(iso, { zone }).startOf('day')
    const key = weekKeyFromDT(dt)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

/**
 * Weekly — current streak
 * Règle : streak actif seulement si la semaine courante >= weeklyTarget
 */
export function calcCurrentWeeklyStreak(
  todayISO: string,
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
  const start = weekStartFromISO(todayISO, zone)
  const curKey = weekKeyFromDT(start)
  const curCount = weekCounts.get(curKey) ?? 0

  if (curCount < weeklyTarget) return 0

  let streak = 0
  let cursor = start

  while (true) {
    const key = weekKeyFromDT(cursor)
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

/**
 * Weekly — best streak
 * On transforme les semaines success en startOfWeek, on trie et on compte les runs.
 */
export function calcBestWeeklyStreak(
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
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

    // ✅ évite diff('weeks') flottant : compare au +1 week exact
    if (prev.plus({ weeks: 1 }).toISODate() === cur.toISODate()) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }

  return best
}

export function calcCompletionRateDaily(startISO: string, endISO: string, doneCount: number) {
  const start = isoDay(startISO)
  const end = isoDay(endISO)

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
