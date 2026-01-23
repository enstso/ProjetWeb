import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Goal from '#models/goal'

/**
 * Modèle Lucid: Step (Étape d’objectif)
 * Une étape est un sous-élément d’un objectif (Goal) permettant
 * de découper un objectif en actions concrètes.
 *
 * Dans le MVP :
 * - une Step appartient à un Goal
 * - on peut la cocher/décocher (isCompleted)
 * - la progression d’un Goal = (steps complétées / total) * 100
 */
export default class Step extends BaseModel {
  /**
   * Clé primaire.
   */
  @column({ isPrimary: true })
  declare id: number

  /**
   * FK vers goals.id
   * -> l’objectif auquel cette étape est rattachée.
   */
  @column()
  declare goalId: number

  /**
   * Titre de l’étape (obligatoire côté validation).
   * Ex: "Faire la migration DB"
   */
  @column()
  declare title: string

  /**
   * Deadline optionnelle de l’étape (type DATE en DB).
   * Peut être null si l’utilisateur ne met pas de date.
   */
  @column.date()
  declare deadline: DateTime | null

  /**
   * Statut de complétion.
   * - false = à faire
   * - true  = complétée
   */
  @column()
  declare isCompleted: boolean

  /**
   * Champ d’ordre (utile pour trier les étapes dans l’UI).
   * Exemple: 0, 1, 2... ou un ordre libre.
   */
  @column()
  declare order: number

  /**
   * Timestamp (UTC) de complétion.
   * - null si l’étape n’est pas complétée
   * - rempli quand on coche (et remis à null quand on décoche)
   */
  @column.dateTime()
  declare completedAt: DateTime | null

  /**
   * Timestamp de création (auto).
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Timestamp de mise à jour (auto).
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relation: une Step appartient à un Goal.
   * Permet d’accéder à step.goal
   */
  @belongsTo(() => Goal)
  declare goal: BelongsTo<typeof Goal>
}
