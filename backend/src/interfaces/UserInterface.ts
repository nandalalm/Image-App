export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
