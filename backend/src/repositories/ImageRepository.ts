import { BaseRepository } from "./BaseRepository";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImage, ImageModel } from "../models/imageModel";

export class ImageRepository extends BaseRepository<IImage> implements IImageRepository {
  constructor() {
    super(ImageModel);
  }

  async findById(id: string): Promise<IImage | null> {
    return this.model.findById(id);
  }

  async find(filter: object = {}): Promise<IImage[]> {
    return this.model.find(filter);
  }

  async update(id: string, data: Partial<IImage>): Promise<IImage | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<IImage[]> {
    return this.model.find({ userId }).sort({ order: 1, createdAt: -1 });
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
