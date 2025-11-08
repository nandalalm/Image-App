import { Container } from "inversify";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";
import { IUserService } from "../interfaces/services/IAuthService";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImageService } from "../interfaces/services/IImageService";
import { UserRepository } from "../repositories/UserRepository";
import { UserService } from "../services/AuthService";
import { ImageRepository } from "../repositories/ImageRepository";
import { ImageService } from "../services/ImageService";
import { TYPES } from "./types";

export const container = new Container();

container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(new UserRepository());

container.bind<IUserService>(TYPES.UserService).toDynamicValue(() => {
  const userRepo = container.get<IUserRepository>(TYPES.UserRepository);
  return new UserService(userRepo);
});

container.bind<IImageRepository>(TYPES.ImageRepository).toConstantValue(new ImageRepository());

container.bind<IImageService>(TYPES.ImageService).toDynamicValue(() => {
  const imageRepo = container.get<IImageRepository>(TYPES.ImageRepository);
  return new ImageService(imageRepo);
});
