import type {HttpContext} from '@adonisjs/core/http'
import {inject} from "@adonisjs/core";
import {AuthService} from "#services/auth_service";
import {AuthLoginDto, AuthRegisterDto} from "../types/auth_types.js";

@inject()
export default class AuthController {

  constructor(protected authService: AuthService) {
  }

  async register({request, response}: HttpContext) {
    const payload: AuthRegisterDto = request.only(['email', 'password', 'fullName']);
    const user = await this.authService.register(payload);
    return response.created({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        }
      }
    );
  }

  async login({request, response, auth}: HttpContext) {
    const payload: AuthLoginDto = request.only(['email', 'password']);
    const user = await this.authService.login(payload);
    const token = await auth.use('api').createToken(user);
    return response.ok({access_token:token});
  }

  async me({auth, response}: HttpContext) {
    return response.safeStatus(200).json({
      fullName: auth.user?.$attributes.fullName,
      email: auth.user?.$attributes.email
    })
  }
};
