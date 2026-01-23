import type { HttpContext } from '@adonisjs/core/http'
import { AuthLoginDto, AuthRegisterDto } from '../types/auth_types.js'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  /**
   * POST /auth/register
   * Objectif : créer un nouvel utilisateur.
   * - Récupère uniquement les champs attendus (whitelist) via request.only(...)
   * - Crée l'utilisateur en BDD (le hash du password doit être géré par le model/hook Lucid si configuré)
   * - Retourne un payload "safe" sans mot de passe
   */
  async register({ request, response }: HttpContext) {
    // payload typé : aide TS + structure attendue côté API
    const payload: AuthRegisterDto = request.only(['email', 'password', 'fullName'])

    // Création en base (attention : le hash du password doit être assuré côté model)
    const user = await User.create({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
    })

    // Réponse : infos minimales (évite d'exposer des champs sensibles)
    return response.created({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  }

  /**
   * POST /auth/login
   * Objectif : authentifier un utilisateur et générer un access token (guard "api").
   * - Cherche l'utilisateur par email
   * - Vérifie le mot de passe
   * - Crée un token via auth.use('api').createToken(...)
   * - Retourne le token au frontend
   */
  async login({ request, response, auth }: HttpContext) {
    // Récupère email + password depuis la requête
    const payload: AuthLoginDto = request.only(['email', 'password'])

    // Recherche user (null => email inconnu)
    const user = await User.findBy('email', payload.email)
    if (user === null) return response.unauthorized()

    // Vérification du hash (⚠️ note : cette vérification doit être utilisée avec un check du résultat)
    // Ici, on vérifie par sécurité que le password correspond au hash stocké.
    await hash.verify(user.password, payload.password)

    // Vérification complète via helper Adonis (email + password) => user "validé"
    // (Cette méthode gère généralement les erreurs si credentials invalides)
    const userVerified = await User.verifyCredentials(payload.email, payload.password)

    // Génère un token API (access-token Adonis)
    const token = await auth.use('api').createToken(userVerified)

    // Réponse : token renvoyé au client
    return response.ok({ access_token: token })
  }

  /**
   * GET /auth/me
   * Route protégée (middleware auth) : renvoie les infos du user connecté.
   * - auth.user est rempli par le guard après validation du token
   * - on retourne un mini profil (fullName + email)
   */
  async me({ auth, response }: HttpContext) {
    return response.safeStatus(200).json({
      // Accès aux attributs Lucid du user authentifié
      fullName: auth.user?.$attributes.fullName,
      email: auth.user?.$attributes.email,
    })
  }
}
