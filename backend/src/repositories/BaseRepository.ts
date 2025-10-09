import { Model, Document } from "mongoose";

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findOne(filter: object): Promise<T | null> {
    return this.model.findOne(filter);
  }
}
