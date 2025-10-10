import { IImage } from "../../models/imageModel";

export interface ImageFileData {
  file: Buffer;
  fileName: string;
  contentType: string;
  title: string;
}

export interface ImageUploadData {
  title: string;
  imageUrl: string;
}

export interface IImageService {
  createImagesFromFiles(userId: string, files: ImageFileData[]): Promise<IImage[]>;
  createImages(userId: string, images: ImageUploadData[]): Promise<IImage[]>;
  getUserImages(userId: string): Promise<IImage[]>;
  updateImage(userId: string, imageId: string, title: string, file?: ImageFileData): Promise<IImage | null>;
  deleteImage(userId: string, imageId: string): Promise<boolean>;
  reorderImages(userId: string, imageOrders: { id: string; order: number }[]): Promise<void>;
}
