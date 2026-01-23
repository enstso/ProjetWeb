import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

/**
 * Mixin Adonis "AuthFinder"
 * - Permet d'utiliser User.verifyCredentials(email, password)
 * - Configure :
 *   - uids: champs utilisés comme identifiant (ici email)
 *   - passwordColumnName: colonne password dans la table
 *   - hash: algo utilisé pour vérifier les mots de passe
 */
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

/**
 * Modèle Lucid: User
 * - Représente un utilisateur de l’application
 * - Intègre le mixin AuthFinder pour l’auth (login via verifyCredentials)
 * - Utilise le provider DbAccessTokensProvider (mode access-token Adonis)
 *   -> création/gestion de tokens stockés en DB
 */
export default class User extends compose(BaseModel, AuthFinder) {
  /**
   * Clé primaire.
   */
  @column({ isPrimary: true })
  declare id: number

  /**
   * Nom complet (optionnel).
   * Dans ton app : "fullName" est utilisé au register et dans /me.
   */
  @column()
  declare fullName: string | null

  /**
   * Email unique (normalement contrainte unique en migration).
   * Sert d’identifiant (uid) pour l’auth.
   */
  @column()
  declare email: string

  /**
   * Mot de passe hashé.
   * serializeAs: null => ne jamais renvoyer ce champ dans les réponses JSON
   * (protection côté sérialisation).
   */
  @column({ serializeAs: null })
  declare password: string

  /**
   * Timestamp de création (auto).
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Timestamp de mise à jour (auto).
   * Peut être null selon ton schéma.
   */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /**
   * Provider des access tokens (Adonis v6)
   * - Stocke les tokens en base via le modèle
   * - Utilisé par auth.use('api').createToken(user)
   */
  static readonly accessTokens = DbAccessTokensProvider.forModel(User)
}
