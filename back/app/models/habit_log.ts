import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Habit from '#models/habit'

export default class HabitLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare habitId: number

  @column.date()
  declare date: DateTime

  @column()
  declare isCompleted: boolean

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Habit)
  declare habit: BelongsTo<typeof Habit>
}
