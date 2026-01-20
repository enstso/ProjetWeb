import type {HttpContext} from '@adonisjs/core/http'
import {UserDTO} from "../types/user_types.js";
import {UserService} from "#services/user_service";
import {inject} from "@adonisjs/core";

@inject()
export default class UsersController {

  constructor(protected userService: UserService) {
  }

  async updateMe({auth, request, response}: HttpContext) {

    let user = auth.getUserOrFail();
    const data: UserDTO = request.only(['fullName', 'email']);
    try {
      let res = await this.userService.update(data, user);
      return response.ok(res);
    } catch (e) {
      return response.internalServerError(e);
    }
  }
}
