import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Habit from '#models/habit'

/**
 * Modèle Lucid: HabitLog (Suivi d’habitude)
 * Représente un "check" d’une habitude à une date donnée.
 *
 * ⚠️ Règle métier importante (MVP) :
 * - 1 seul log par (habit_id, date) => contrainte UNIQUE en DB
 *   pour éviter le double comptage.
 */
export default class HabitLog extends BaseModel {
  /**
   * Clé primaire.
   */
  @column({ isPrimary: true })
  declare id: number

  /**
   * FK vers habits.id
   * -> l’habitude concernée par ce log.
   */
  @column()
  declare habitId: number

  /**
   * Date du log (type DATE côté DB).
   * On stocke une journée (YYYY-MM-DD), pas une heure.
   *
   * ⚠️ "Aujourd’hui" doit être calculé avec le timezone user
   * (ex: via header X-Timezone), puis stocké en DB correctement.
   */
  @column.date()
  declare date: DateTime

  /**
   * Indique si l’entrée représente une complétion.
   * Dans ton cas, tu crées le log avec isCompleted=true,
   * et "uncheck" = suppression du log (plus simple).
   */
  @column()
  declare isCompleted: boolean

  /**
   * Notes optionnelles associées à ce log (nullable).
   * (Optionnel dans le MVP, mais utile si tu ajoutes journal/notes plus tard.)
   */
  @column()
  declare notes: string | null

  /**
   * Date de création du log (timestamp).
   * Auto-généré par Lucid à l’insertion.
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Relation: un Log appartient à une Habitude.
   * Permet d’accéder à habitLog.habit
   */
  @belongsTo(() => Habit)
  declare habit: BelongsTo<typeof Habit>
}
