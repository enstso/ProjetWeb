import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Modèle Lucid: Habit (Habitude)
 * Représente une habitude récurrente (daily/weekly) appartenant à un utilisateur.
 */
export default class Habit extends BaseModel {
  /**
   * Clé primaire de l’habitude.
   */
  @column({ isPrimary: true })
  declare id: number

  /**
   * FK vers users.id
   * -> propriétaire de l’habitude.
   */
  @column()
  declare userId: number

  /**
   * Nom de l’habitude (obligatoire côté validation/AC).
   * Ex: "Méditer 10 minutes"
   */
  @column()
  declare name: string

  /**
   * Description optionnelle (nullable).
   */
  @column()
  declare description: string | null

  /**
   * Catégorie optionnelle (ex: Santé, Personnel…).
   */
  @column()
  declare category: string | null

  /**
   * Fréquence de suivi :
   * - daily : tous les jours
   * - weekly : X fois par semaine (weeklyTarget)
   */
  @column()
  declare frequency: 'daily' | 'weekly'

  /**
   * Objectif hebdomadaire (uniquement si frequency='weekly').
   * Ex: 3 => 3 fois/semaine
   * Doit être null si frequency='daily'.
   */
  @column()
  declare weeklyTarget: number | null

  /**
   * Date de début (DATE).
   * Sert aussi de base pour calculer les stats (range par défaut).
   */
  @column.date()
  declare startDate: DateTime

  /**
   * Indique si l’habitude est archivée (pause/stop).
   * Quand true, on doit généralement empêcher le check/uncheck (tracking).
   */
  @column()
  declare isArchived: boolean

  /**
   * createdAt géré automatiquement par Lucid à l’insertion.
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * updatedAt géré automatiquement par Lucid à chaque mise à jour.
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relation: une Habitude appartient à un User.
   * Permet d'accéder à habit.user
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
