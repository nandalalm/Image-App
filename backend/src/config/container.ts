import { Container } from "inversify";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";
import { IUserService } from "../interfaces/services/IUserService";
import { UserRepository } from "../repositories/UserRepository";
import { UserService } from "../services/UserService";
import { TYPES } from "../types/symbols";

export const container = new Container();

// Bind UserRepository
container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(new UserRepository());

// Bind UserService with dependency injection
container.bind<IUserService>(TYPES.UserService).toDynamicValue(() => {
  const userRepo = container.get<IUserRepository>(TYPES.UserRepository);
  return new UserService(userRepo);
});
