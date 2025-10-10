import mongoose from "mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IImageService, ImageUploadData, ImageFileData } from "../interfaces/services/IImageService";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImage } from "../models/imageModel";
import { logError } from "../middleware/loggerMiddleware";

export class ImageService implements IImageService {
  private imageRepository: IImageRepository;
  private s3Client: S3Client;

  constructor(imageRepository: IImageRepository) {
    this.imageRepository = imageRepository;
    
    // Configure AWS S3 client
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private async uploadToS3(file: Buffer, fileName: string, contentType: string): Promise<{ url: string; key: string }> {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const key = `images/${timestamp}-${randomString}-${fileName}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
    };

    const command = new PutObjectCommand(params);
    await this.s3Client.send(command);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return { url, key };
  }


  async createImagesFromFiles(userId: string, files: ImageFileData[]): Promise<IImage[]> {
    const createdImages: IImage[] = [];
    
    // Get current max order for user
    const userImages = await this.imageRepository.findByUserId(userId);
    let maxOrder = userImages.length > 0 ? Math.max(...userImages.map(img => img.order)) : -1;

    for (const fileData of files) {
      try {
        // Upload to S3
        const { url } = await this.uploadToS3(fileData.file, fileData.fileName, fileData.contentType);
        
        // Create database record
        const newImage = await this.imageRepository.create({
          title: fileData.title,
          imageUrl: url,
          userId: new mongoose.Types.ObjectId(userId),
          order: ++maxOrder
        } as Partial<IImage>);

        createdImages.push(newImage);
      } catch (error) {
        console.error('Failed to create image record:', error);
        logError(error as Error, undefined, { userId, fileData: { fileName: fileData.fileName, title: fileData.title } });
        throw new Error('Failed to create image record');
      }
    }

    return createdImages;
  }

  async createImages(userId: string, images: ImageUploadData[]): Promise<IImage[]> {
    const createdImages: IImage[] = [];
    
    // Get current max order for user
    const userImages = await this.imageRepository.findByUserId(userId);
    let maxOrder = userImages.length > 0 ? Math.max(...userImages.map(img => img.order)) : -1;

    for (const imageData of images) {
      try {
        const newImage = await this.imageRepository.create({
          title: imageData.title,
          imageUrl: imageData.imageUrl,
          userId: new mongoose.Types.ObjectId(userId),
          order: ++maxOrder
        } as Partial<IImage>);

        createdImages.push(newImage);
      } catch (error) {
        console.error('Failed to create image record:', error);
        logError(error as Error, undefined, { userId, imageData: { title: imageData.title, imageUrl: imageData.imageUrl } });
        throw new Error('Failed to create image record');
      }
    }

    return createdImages;
  }

  async getUserImages(userId: string): Promise<IImage[]> {
    return this.imageRepository.findByUserId(userId);
  }

  async updateImage(userId: string, imageId: string, title: string, file?: ImageFileData): Promise<IImage | null> {
    const existingImage = await this.imageRepository.findByUserIdAndId(userId, imageId);
    if (!existingImage) {
      throw new Error('Image not found');
    }

    let updateData: Partial<IImage> = { title };

    if (file) {
      // Upload new file to S3
      const { url } = await this.uploadToS3(file.file, file.fileName, file.contentType);
      updateData.imageUrl = url;
    }

    // Update the image
    Object.assign(existingImage, updateData);
    await existingImage.save();

    return existingImage;
  }

  async deleteImage(userId: string, imageId: string): Promise<boolean> {
    const existingImage = await this.imageRepository.findByUserIdAndId(userId, imageId);
    if (!existingImage) {
      return false;
    }

    // Only delete from database - S3 files remain
    return this.imageRepository.deleteByUserIdAndId(userId, imageId);
  }

  async reorderImages(userId: string, imageOrders: { id: string; order: number }[]): Promise<void> {
    await this.imageRepository.updateOrder(userId, imageOrders);
  }
}
