import { IUser } from "../../models/userModel";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(user: IUser): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  updateProfileImageUrl(id: string, url: string): Promise<IUser | null>;
  updatePasswordByEmail(email: string, passwordHash: string): Promise<void>;
}
