import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository"
import { IUser, UserModel } from "../models/userModel";

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email });
  }

  async createUser(user: IUser): Promise<IUser> {
    return this.model.create(user);
  }
}
