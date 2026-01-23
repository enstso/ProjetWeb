import { test } from '@japa/runner'
import {
  calcCurrentDailyStreak,
  calcBestDailyStreak,
  calcWeeklySuccessMap,
  calcCurrentWeeklyStreak,
  calcBestWeeklyStreak,
} from '../../utils/habit_stats.js'

test.group('Habit stats (unit)', () => {
  test('daily: current streak includes today (if missing today => 0)', ({ assert }) => {
    const today = '2026-01-22'
    const logs = ['2026-01-20', '2026-01-21'] // pas de today
    const doneSet = new Set(logs)

    assert.equal(calcCurrentDailyStreak(today, doneSet), 0)
  })

  test('daily: current streak correct', ({ assert }) => {
    const today = '2026-01-22'
    const logs = ['2026-01-20', '2026-01-21', '2026-01-22']
    const doneSet = new Set(logs)

    assert.equal(calcCurrentDailyStreak(today, doneSet), 3)
    assert.equal(calcBestDailyStreak(logs), 3)
  })

  test('daily: deletion updates streak', ({ assert }) => {
    const today = '2026-01-22'

    const logs = ['2026-01-20', '2026-01-21', '2026-01-22']
    assert.equal(calcCurrentDailyStreak(today, new Set(logs)), 3)

    // suppression du 21 => streak retombe
    const afterDelete = ['2026-01-20', '2026-01-22']
    assert.equal(calcCurrentDailyStreak(today, new Set(afterDelete)), 1)
    assert.equal(calcBestDailyStreak(afterDelete), 1)
  })

  test('weekly: current + best streak correct (weekly_target=3)', ({ assert }) => {
    const zone = 'Europe/Paris'
    const today = '2026-01-22'

    const logs = [
      // semaine courante: 3 logs
      '2026-01-19',
      '2026-01-20',
      '2026-01-21',
      // semaine précédente: 3 logs
      '2026-01-12',
      '2026-01-13',
      '2026-01-14',
    ]

    const weekCounts = calcWeeklySuccessMap(logs, zone)

    // ✅ ordre correct: (todayISO, zone, weeklyTarget, weekCounts)
    assert.equal(calcCurrentWeeklyStreak(today, zone, 3, weekCounts), 2)
    assert.equal(calcBestWeeklyStreak(zone, 3, weekCounts), 2)
  })

  test('weekly: if current week not success => current streak 0', ({ assert }) => {
    const zone = 'Europe/Paris'
    const today = '2026-01-22'

    const logs = [
      // semaine courante: 2 logs => pas success
      '2026-01-19',
      '2026-01-20',
      // semaine précédente: 3 logs => success
      '2026-01-12',
      '2026-01-13',
      '2026-01-14',
    ]

    const weekCounts = calcWeeklySuccessMap(logs, zone)

    assert.equal(calcCurrentWeeklyStreak(today, zone, 3, weekCounts), 0)
    assert.equal(calcBestWeeklyStreak(zone, 3, weekCounts), 1)
  })
})
