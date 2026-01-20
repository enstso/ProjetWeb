import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Goal from '#models/goal'

export default class Step extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare goalId: number

  @column()
  declare title: string

  @column.date()
  declare deadline: DateTime | null

  @column()
  declare isCompleted: boolean

  @column()
  declare order: number

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Goal)
  declare goal: BelongsTo<typeof Goal>
}
