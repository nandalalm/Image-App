import { IImage } from "../../models/imageModel";
import { IBaseRepository } from "./IBaseRepository";

export interface IImageRepository extends IBaseRepository<IImage> {
  findByUserId(userId: string): Promise<IImage[]>;
  findByUserIdPaginated(userId: string, limit: number, skip: number): Promise<IImage[]>;
  countByUserId(userId: string): Promise<number>;
  findByUserIdAndId(userId: string, imageId: string): Promise<IImage | null>;
  updateOrder(userId: string, imageOrders: { id: string; order: number }[]): Promise<void>;
  deleteByUserIdAndId(userId: string, imageId: string): Promise<boolean>;
}
