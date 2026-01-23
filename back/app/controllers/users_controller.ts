import type { HttpContext } from '@adonisjs/core/http'
import { UserDTO } from '../types/user_types.js'

export default class UsersController {
  /**
   * PUT /me (ou /users/me selon ton routing)
   * Objectif:
   * - Permet à l’utilisateur connecté de modifier ses infos (fullName, email)
   * - Retourne l’utilisateur mis à jour
   */
  async updateMe({ auth, request, response }: HttpContext) {
    // Récupère l’utilisateur courant (auth middleware requis sur la route)
    let user = auth.getUserOrFail()

    // Récupère uniquement les champs autorisés depuis le body
    // (évite de laisser passer des champs sensibles)
    const data: UserDTO = request.only(['fullName', 'email'])

    try {
      /**
       * Validation simple de l’email (très basique)
       * - Ici tu fais un check minimal : présence de "@"
       * - Attention: `response.notFound(...)` n’est pas le bon code HTTP pour une validation
       *   (ça devrait plutôt être 400), et surtout il manque un `return` sinon le code continue.
       */
      if (data.email && !String(data.email).includes('@')) {
        response.notFound('Email is not valid')
      }

      /**
       * `merge` met à jour uniquement les champs fournis
       * - Si `data.fullName` est undefined/null => on garde la valeur actuelle
       * - Idem pour `email`
       */
      user.merge({
        fullName: data.fullName ?? user.fullName,
        email: data.email ?? user.email,
      })

      // Persiste en base
      await user.save()

      // Retourne l’utilisateur mis à jour (200 OK)
      return response.ok(user)
    } catch (e) {
      /**
       * Catch global:
       * - Renvoie une 500 si une erreur DB survient (ex: email unique, etc.)
       * - En production, on évite souvent de renvoyer l’erreur brute `e`
       *   (risque de leak d’infos), mais ici c’est pratique pour debug.
       */
      return response.internalServerError(e)
    }
  }
}
