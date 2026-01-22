import { test } from '@japa/runner'
import { calculateGoalProgress } from '../../utils/goal_progress.js'

test.group('Goal progress (unit)', () => {
  test('0 step => 0%', ({ assert }) => {
    const progress = calculateGoalProgress([])
    assert.equal(progress, 0)
  })

  test('mix => correct percent (rounded)', ({ assert }) => {
    // 1/2 => 50%
    const progress = calculateGoalProgress([{ isCompleted: true }, { isCompleted: false }])
    assert.equal(progress, 50)
  })

  test('100% when all steps completed', ({ assert }) => {
    const progress = calculateGoalProgress([
      { isCompleted: true },
      { isCompleted: true },
      { isCompleted: true },
    ])
    assert.equal(progress, 100)
  })

  test('supports is_completed payload (snake_case)', ({ assert }) => {
    // 2/3 => 67% (round)
    const progress = calculateGoalProgress([
      { is_completed: true },
      { is_completed: true },
      { is_completed: false },
    ])
    assert.equal(progress, 67)
  })

  test('never goes below 0 or above 100', ({ assert }) => {
    const progress = calculateGoalProgress([{ isCompleted: true }])
    assert.equal(progress, 100)
  })
})
