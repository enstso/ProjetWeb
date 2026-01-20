import {AuthLoginDto, AuthRegisterDto} from "../types/auth_types.js";
import User from "#models/user";
import hash from "@adonisjs/core/services/hash";

export class AuthService {
  async register(user: AuthRegisterDto) {
    return await User.create(user);
  }

  async login(credentials: AuthLoginDto) {
    /**
     * Find a user by email. Return error if a user does
     * not exists
     */
    const user = await User.findBy('email', credentials.email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    /**
     * Verify the password using the hash service
     */
    await hash.verify(user.password, credentials.password)
    return await User.verifyCredentials(
      credentials.email,
      credentials.password
    )
  }

}
