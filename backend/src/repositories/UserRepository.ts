import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository"
import { IUser, UserModel } from "../models/userModel";

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async createUser(user: IUser): Promise<IUser> {
    return this.create(user);
  }

  async updateProfileImageUrl(id: string, url: string): Promise<IUser | null> {
    return this.update(id, { $set: { profileImageUrl: url } });
  }

  async updatePasswordByEmail(email: string, passwordHash: string): Promise<void> {
    await this.model.updateOne({ email }, { $set: { password: passwordHash } });
  }
}
