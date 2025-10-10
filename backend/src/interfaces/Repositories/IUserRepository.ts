import { IUser } from "../../models/userModel";
import { IBaseRepository } from "./IBaseRepository";

export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(user: IUser): Promise<IUser>;
  updateProfileImageUrl(id: string, url: string): Promise<IUser | null>;
  updatePasswordByEmail(email: string, passwordHash: string): Promise<void>;
}
