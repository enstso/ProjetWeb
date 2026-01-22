import type { HttpContext } from '@adonisjs/core/http'
import { AuthLoginDto, AuthRegisterDto } from '../types/auth_types.js'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const payload: AuthRegisterDto = request.only(['email', 'password', 'fullName'])

    const user = await User.create({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
    })

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  }

  async login({ request, response, auth }: HttpContext) {
    const payload: AuthLoginDto = request.only(['email', 'password'])
    const user = await User.findBy('email', payload.email)

    if (user === null) return response.unauthorized()
    await hash.verify(user.password, payload.password)

    const userVerified = await User.verifyCredentials(payload.email, payload.password)
    const token = await auth.use('api').createToken(userVerified)

    return response.ok({ access_token: token })
  }

  async me({ auth, response }: HttpContext) {
    return response.safeStatus(200).json({
      fullName: auth.user?.$attributes.fullName,
      email: auth.user?.$attributes.email,
    })
  }
}
