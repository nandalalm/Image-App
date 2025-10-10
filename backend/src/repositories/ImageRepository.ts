import { BaseRepository } from "./BaseRepository";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImage, ImageModel } from "../models/imageModel";

export class ImageRepository extends BaseRepository<IImage> implements IImageRepository {
  constructor() {
    super(ImageModel);
  }

  async findByUserId(userId: string): Promise<IImage[]> {
    return this.model.find({ userId }).sort({ order: 1, createdAt: -1 });
  }

  async findByUserIdPaginated(userId: string, limit: number, skip: number): Promise<IImage[]> {
    return this.model.find({ userId }).sort({ order: 1, createdAt: -1 }).limit(limit).skip(skip);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.model.countDocuments({ userId });
  }

  async findByUserIdAndId(userId: string, imageId: string): Promise<IImage | null> {
    return this.model.findOne({ _id: imageId, userId });
  }

  async updateOrder(userId: string, imageOrders: { id: string; order: number }[]): Promise<void> {
    const bulkOps = imageOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { order }
      }
    }));

    await this.model.bulkWrite(bulkOps);
  }

  async deleteByUserIdAndId(userId: string, imageId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: imageId, userId });
    return result.deletedCount > 0;
  }
}
