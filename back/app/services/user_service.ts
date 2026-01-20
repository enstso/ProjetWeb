import {UserDTO} from "../types/user_types.js";
import User from "#models/user";

export class UserService {
  async update(dataToModified: UserDTO, user: User) {

    if (dataToModified.email && !String(dataToModified.email).includes('@')) {
      throw new Error('Email is not valid')
    }
    try {
      user.merge({
        fullName: dataToModified.fullName ?? user.fullName,
        email: dataToModified.email ?? user.email
      });
      await user.save();
      return user;
    } catch (e) {
      throw e;
    }
  }
}
