import type { HttpContext } from '@adonisjs/core/http'
import { UserDTO } from '../types/user_types.js'

export default class UsersController {
  async updateMe({ auth, request, response }: HttpContext) {
    let user = auth.getUserOrFail()
    const data: UserDTO = request.only(['fullName', 'email'])
    try {
      if (data.email && !String(data.email).includes('@')) {
        response.notFound('Email is not valid')
      }
      user.merge({
        fullName: data.fullName ?? user.fullName,
        email: data.email ?? user.email,
      })
      await user.save()
      return response.ok(user)
    } catch (e) {
      return response.internalServerError(e)
    }
  }
}
