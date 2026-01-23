import { DateTime } from 'luxon'

/**
 * Utilitaires dates (ISO date only)
 * Objectif : travailler uniquement au "grain jour" (sans heure),
 * pour éviter les erreurs liées au temps (heures/minutes/seconds).
 */

/**
 * Convertit une string ISO en DateTime au début de la journée (00:00:00).
 * ⚠️ Ici on parse sans timezone spécifique (Luxon utilisera le "local zone"
 * si rien n’est fourni). Pour des calculs purement "date-only", on force ensuite startOf('day').
 */
function isoDay(iso: string) {
  return DateTime.fromISO(iso).startOf('day')
}

/**
 * Transforme un DateTime en clé ISO "YYYY-MM-DD"
 * (format stable pour les Sets/Maps).
 */
function isoKey(dt: DateTime) {
  return dt.toISODate()!
}

/**
 * Construit une clé de semaine ISO (ex: "2026-W03").
 * weekYear/weekNumber = semaine ISO (lundi => début de semaine).
 */
function weekKeyFromDT(dt: DateTime) {
  return `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}`
}

/**
 * Daily — current streak
 * Règle : streak actif uniquement si today est coché.
 *
 * Exemple :
 * - today=2026-01-22
 * - doneDates contient 2026-01-22, 2026-01-21, 2026-01-20 -> streak=3
 * - si today absent -> streak=0
 */
export function calcCurrentDailyStreak(todayISO: string, doneDates: Set<string>) {
  // Normalise today au format "YYYY-MM-DD"
  const today = isoKey(isoDay(todayISO))

  // Streak "actif" uniquement si aujourd’hui est fait
  if (!doneDates.has(today)) return 0

  // On remonte jour par jour tant que chaque date est cochée
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
 *
 * Objectif : trouver la plus longue séquence de jours consécutifs.
 */
export function calcBestDailyStreak(sortedDatesAsc: string[]) {
  if (sortedDatesAsc.length === 0) return 0

  // ✅ sécurité : dédoublonnage + normalisation (coupe au format YYYY-MM-DD)
  const dates = Array.from(new Set(sortedDatesAsc.map((d) => d.slice(0, 10)))).sort()

  if (dates.length === 0) return 0

  // Si au moins une date => best et current démarrent à 1
  let best = 1
  let current = 1

  // On parcourt les dates triées et on détecte les "runs" consécutifs
  for (let i = 1; i < dates.length; i++) {
    const prev = isoDay(dates[i - 1])
    const cur = isoDay(dates[i])

    // ✅ évite les flottants : on compare au jour suivant exact
    if (prev.plus({ days: 1 }).toISODate() === cur.toISODate()) {
      current++
      if (current > best) best = current
    } else {
      // Rupture de consécutivité => reset
      current = 1
    }
  }
  return best
}

/**
 * Renvoie le début de semaine ISO (lundi) pour une date ISO donnée,
 * en tenant compte d’un timezone explicite.
 *
 * Exemple : si la date est dans une zone spécifique, weekYear/weekNumber
 * dépendront de cette zone (important proche des transitions / minuit).
 */
function weekStartFromISO(isoDate: string, zone: string) {
  // ISO week (lundi = début)
  const dt = DateTime.fromISO(isoDate, { zone }).startOf('day')

  // On reconstruit un DateTime pointant sur le lundi de cette semaine ISO
  return DateTime.fromObject(
    { weekYear: dt.weekYear, weekNumber: dt.weekNumber, weekday: 1 },
    { zone }
  ).startOf('day')
}

/**
 * Weekly — map semaine ISO => count
 * Entrée : dates ISO (YYYY-MM-DD). (Si doublons : on peut dédupliquer.)
 *
 * Objectif : compter combien de "checks" par semaine ISO.
 * La réussite d’une semaine = count >= weeklyTarget.
 */
export function calcWeeklySuccessMap(dates: string[], zone: string) {
  const map = new Map<string, number>()

  // ✅ sécurité : dédoublonnage des dates (anti "double comptage" dans les stats)
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
 *
 * Exemple weeklyTarget=3 :
 * - Semaine courante a 2 checks => current streak = 0
 * - Si semaine courante a >=3 => on remonte semaine par semaine tant que "success"
 */
export function calcCurrentWeeklyStreak(
  todayISO: string,
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
  // Début (lundi) de la semaine ISO correspondant à todayISO
  const start = weekStartFromISO(todayISO, zone)

  // Clé de la semaine courante + nombre de checks
  const curKey = weekKeyFromDT(start)
  const curCount = weekCounts.get(curKey) ?? 0

  // Streak "actif" uniquement si la semaine actuelle est déjà "success"
  if (curCount < weeklyTarget) return 0

  // Sinon, on remonte semaine par semaine tant que count >= weeklyTarget
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
 *
 * Objectif : trouver la plus longue série de semaines "success" consécutives.
 */
export function calcBestWeeklyStreak(
  zone: string,
  weeklyTarget: number,
  weekCounts: Map<string, number>
) {
  const successStarts: DateTime[] = []

  // 1) Filtre les semaines qui "réussissent" (count >= weeklyTarget)
  // 2) Convertit chaque clé de semaine en DateTime (lundi de la semaine)
  for (const [key, count] of weekCounts.entries()) {
    if (count < weeklyTarget) continue
    const [wy, wn] = key.split('-W')
    const weekYear = Number(wy)
    const weekNumber = Number(wn)

    const start = DateTime.fromObject({ weekYear, weekNumber, weekday: 1 }, { zone }).startOf('day')
    successStarts.push(start)
  }

  // Aucun succès => best = 0
  if (successStarts.length === 0) return 0

  // Tri chronologique
  successStarts.sort((a, b) => a.toMillis() - b.toMillis())

  // Au moins une semaine success => best/current démarrent à 1
  let best = 1
  let current = 1

  // On parcourt les semaines success et on détecte les runs de semaines consécutives
  for (let i = 1; i < successStarts.length; i++) {
    const prev = successStarts[i - 1]
    const cur = successStarts[i]

    // ✅ évite diff('weeks') flottant : compare au +1 week exact
    if (prev.plus({ weeks: 1 }).toISODate() === cur.toISODate()) {
      current++
      if (current > best) best = current
    } else {
      // Rupture => reset
      current = 1
    }
  }

  return best
}

/**
 * Completion rate (daily)
 * - Calcule le nombre de jours inclusifs entre start et end.
 * - doneCount = nombre de jours cochés dans la période.
 * - Retour : pourcentage arrondi (0..100+ possible selon doneCount, mais en pratique doneCount <= days).
 */
export function calcCompletionRateDaily(startISO: string, endISO: string, doneCount: number) {
  const start = isoDay(startISO)
  const end = isoDay(endISO)

  // +1 car inclusif (ex: start=end => 1 jour)
  const days = Math.floor(end.diff(start, 'days').days) + 1
  if (days <= 0) return 0

  return Math.round((doneCount / days) * 100)
}

/**
 * Compte le nombre de semaines ISO inclusives entre startISO et endISO
 * (en considérant le lundi comme début de semaine ISO).
 */
export function countWeeksInclusive(startISO: string, endISO: string, zone: string) {
  const start = weekStartFromISO(startISO, zone)
  const end = weekStartFromISO(endISO, zone)

  // +1 car inclusif (même semaine => 1)
  const weeks = Math.floor(end.diff(start, 'weeks').weeks) + 1
  return Math.max(0, weeks)
}

/**
 * Completion rate (weekly)
 * - expected = nbSemaines * weeklyTarget
 * - doneCount = nb de checks (logs) dans la période
 *
 * ⚠️ Ici c’est une "rate" basée sur le volume attendu,
 * pas sur "semaines success / semaines totales".
 */
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
