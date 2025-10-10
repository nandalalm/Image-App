import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IImageService, ImageFileData, ImageUploadData, PaginatedImagesResult } from "../interfaces/services/IImageService";
import { IImageRepository } from "../interfaces/Repositories/IImageRepository";
import { IImage } from "../models/imageModel";
import { logError } from "../middleware/loggerMiddleware";

export class ImageService implements IImageService {
  private _imageRepository: IImageRepository;
  private _s3Client: S3Client;

  constructor(imageRepository: IImageRepository) {
    this._imageRepository = imageRepository;
    
    const requiredEnvVars = {
      AWS_S3_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const missing = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      console.error('Please add these to your .env file in the backend directory:');
      missing.forEach(envVar => {
        console.error(`${envVar}=your_${envVar.toLowerCase()}_value`);
      });
    }
    
    this._s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private async uploadToS3(file: Buffer, fileName: string, contentType: string): Promise<{ url: string; key: string }> {
    try {
      if (!process.env.AWS_BUCKET_NAME) {
        throw new Error('AWS_S3_BUCKET_NAME environment variable is not configured. Please add it to your .env file.');
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const key = `images/${timestamp}-${randomString}-${fileName}`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      };

      const command = new PutObjectCommand(params);
      await this._s3Client.send(command);

      const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createImagesFromFiles(userId: string, files: ImageFileData[]): Promise<IImage[]> {
    const createdImages: IImage[] = [];
    
    try {
      const userImages = await this._imageRepository.findByUserId(userId);
      let maxOrder = userImages.length > 0 ? Math.max(...userImages.map(img => img.order)) : -1;

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        
        try {
          console.log('Uploading to S3...');
          const { url } = await this.uploadToS3(fileData.file, fileData.fileName, fileData.contentType);
          
          const imageData = {
            userId,
            title: fileData.title,
            imageUrl: url,
            order: ++maxOrder,
          };

          const createdImage = await this._imageRepository.create(imageData as any);
          createdImages.push(createdImage);
        } catch (error) {
          console.error(`Failed to create image ${i + 1}:`, error);
          logError(error as Error, undefined, { userId, fileData: { title: fileData.title } });
          throw new Error(`Failed to create image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return createdImages;
    } catch (error) {
      console.error('createImagesFromFiles failed:', error);
      throw error;
    }
  }

  async createImages(userId: string, images: ImageUploadData[]): Promise<IImage[]> {
    const createdImages: IImage[] = [];
    
    const userImages = await this._imageRepository.findByUserId(userId);
    let maxOrder = userImages.length > 0 ? Math.max(...userImages.map(img => img.order)) : -1;

    for (const imageData of images) {
      try {
        const newImage = await this._imageRepository.create({
          userId,
          title: imageData.title,
          imageUrl: imageData.imageUrl,
          order: ++maxOrder,
        } as any);

        createdImages.push(newImage);
      } catch (error) {
        console.error('Failed to create image record:', error);
        logError(error as Error, undefined, { userId, imageData: { title: imageData.title, imageUrl: imageData.imageUrl } });
        throw new Error('Failed to create image record');
      }
    }

    return createdImages;
  }

  async getUserImages(userId: string, limit?: number, skip?: number): Promise<PaginatedImagesResult> {
    if (limit !== undefined && skip !== undefined) {
      const images = await this._imageRepository.findByUserIdPaginated(userId, limit, skip);
      const total = await this._imageRepository.countByUserId(userId);
      return { images, total };
    } else {
      const images = await this._imageRepository.findByUserId(userId);
      return { images, total: images.length };
    }
  }

  async updateImage(userId: string, imageId: string, title: string, file?: ImageFileData): Promise<IImage | null> {
    const existingImage = await this._imageRepository.findByUserIdAndId(userId, imageId);
    if (!existingImage) {
      throw new Error('Image not found');
    }

    let updateData: Partial<IImage> = { title };

    if (file) {
      const { url } = await this.uploadToS3(file.file, file.fileName, file.contentType);
      updateData.imageUrl = url;
    }

    Object.assign(existingImage, updateData);
    await existingImage.save();

    return existingImage;
  }

  async deleteImage(userId: string, imageId: string): Promise<boolean> {
    const existingImage = await this._imageRepository.findByUserIdAndId(userId, imageId);
    if (!existingImage) {
      throw new Error('Image not found');
    }

    return await this._imageRepository.deleteByUserIdAndId(userId, imageId);
  }

  async deleteAllImages(userId: string): Promise<number> {
    try {
      const userImages = await this._imageRepository.findByUserId(userId);
      const imageCount = userImages.length;
      
      if (imageCount === 0) {
        return 0;
      }

      for (const image of userImages) {
        await this._imageRepository.deleteByUserIdAndId(userId, (image as any)._id.toString());
      }

      return imageCount;
    } catch (error) {
      console.error('deleteAllImages failed:', error);
      throw new Error(`Failed to delete all images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reorderImages(userId: string, imageOrders: { id: string; order: number }[]): Promise<void> {
    await this._imageRepository.updateOrder(userId, imageOrders);
  }
}
