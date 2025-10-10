import { Container } from "inversify";
import { IUserRepository } from "../interfaces/Repositories/IUserRepository";
import { IUserService } from "../interfaces/services/IUserService";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImageService } from "../interfaces/services/IImageService";
import { UserRepository } from "../repositories/UserRepository";
import { UserService } from "../services/UserService";
import { ImageRepository } from "../repositories/ImageRepository";
import { ImageService } from "../services/ImageService";
import { TYPES } from "./types";

export const container = new Container();

// Bind UserRepository
container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(new UserRepository());

// Bind UserService with dependency injection
container.bind<IUserService>(TYPES.UserService).toDynamicValue(() => {
  const userRepo = container.get<IUserRepository>(TYPES.UserRepository);
  return new UserService(userRepo);
});

// Bind ImageRepository
container.bind<IImageRepository>(TYPES.ImageRepository).toConstantValue(new ImageRepository());

// Bind ImageService with dependency injection
container.bind<IImageService>(TYPES.ImageService).toDynamicValue(() => {
  const imageRepo = container.get<IImageRepository>(TYPES.ImageRepository);
  return new ImageService(imageRepo);
});
