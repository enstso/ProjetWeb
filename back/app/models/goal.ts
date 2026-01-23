import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Step from '#models/step'

/**
 * Modèle Lucid: Goal (Objectif)
 * Représente un objectif appartenant à un utilisateur, composé de plusieurs étapes.
 */
export default class Goal extends BaseModel {
  /**
   * Clé primaire auto-incrémentée (ou définie côté DB).
   */
  @column({ isPrimary: true })
  declare id: number

  /**
   * FK vers users.id
   * -> propriétaire de l’objectif.
   */
  @column()
  declare userId: number

  /**
   * Titre de l’objectif (obligatoire côté validation/AC).
   */
  @column()
  declare title: string

  /**
   * Description optionnelle (nullable en base).
   */
  @column()
  declare description: string | null

  /**
   * Catégorie optionnelle (ex: Santé, Carrière…).
   */
  @column()
  declare category: string | null

  /**
   * Priorité (enum logique).
   * Stockée en DB via un champ texte/enum selon ta migration.
   */
  @column()
  declare priority: 'low' | 'medium' | 'high'

  /**
   * Statut (enum logique).
   * - active: en cours
   * - completed: terminé
   * - abandoned: abandonné
   */
  @column()
  declare status: 'active' | 'completed' | 'abandoned'

  /**
   * Date de début (DATE).
   * `@column.date()` => sans heure (type DateTime Luxon en runtime)
   */
  @column.date()
  declare startDate: DateTime

  /**
   * Deadline / date d’échéance (DATE).
   * Souvent contrainte: deadline >= startDate (check constraint).
   */
  @column.date()
  declare deadline: DateTime

  /**
   * Date/heure de complétion (nullable).
   * `@column.dateTime()` => avec heure (timestamp).
   */
  @column.dateTime()
  declare completedAt: DateTime | null

  /**
   * createdAt géré automatiquement par Lucid à l’insertion.
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * updatedAt géré automatiquement par Lucid à l’update.
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relation: un Goal appartient à un User.
   * Permet d'accéder à goal.user
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Relation: un Goal a plusieurs Steps.
   * Permet d'accéder à goal.steps
   */
  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
