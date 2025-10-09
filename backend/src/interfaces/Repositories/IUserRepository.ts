import { IUser } from "../../models/userModel";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(user: IUser): Promise<IUser>;
}
