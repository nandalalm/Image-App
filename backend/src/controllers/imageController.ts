import { Request, Response, NextFunction } from "express";
import { container } from "../config/container";
import { TYPES } from "../config/types";
import { IImageService, ImageFileData } from "../interfaces/services/IImageService";
import { HttpStatus } from "../constants/httpStatus";

export const createImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "No images provided" });
    }

    for (const img of images) {
      if (!img.title || !img.imageUrl || !img.s3Key) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          message: "Each image must have title, imageUrl, and s3Key" 
        });
      }
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const createdImages = await imageService.createImages(userId, images);

    res.status(HttpStatus.CREATED).json({
      message: "Images created successfully",
      images: createdImages
    });
  } catch (err) {
    next(err);
  }
};


export const getUserImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const result = await imageService.getUserImages(userId, limit, skip);

    res.status(HttpStatus.OK).json({
      images: result.images.map(img => ({
        id: img._id,
        title: img.title,
        imageUrl: img.imageUrl,
        order: img.order,
        createdAt: img.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalImages: result.total,
        hasMore: skip + result.images.length < result.total
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { imageId } = req.params;
    const { title } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    if (!title) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "Title is required" });
    }

    let fileData: ImageFileData | undefined;
    if (file) {
      fileData = {
        file: file.buffer,
        fileName: file.originalname,
        contentType: file.mimetype,
        title: title
      };
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const updatedImage = await imageService.updateImage(userId, imageId, title, fileData);

    if (!updatedImage) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Image not found" });
    }

    res.status(HttpStatus.OK).json({
      message: "Image updated successfully",
      image: {
        id: updatedImage._id,
        title: updatedImage.title,
        imageUrl: updatedImage.imageUrl,
        order: updatedImage.order,
        createdAt: updatedImage.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { imageId } = req.params;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const deleted = await imageService.deleteImage(userId, imageId);

    if (!deleted) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Image not found" });
    }

    res.status(HttpStatus.OK).json({
      message: "Image deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAllImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    
    const userImages = await imageService.getUserImages(userId);
    const imageCount = userImages.total;
    
    if (imageCount === 0) {
      return res.status(HttpStatus.OK).json({
        message: "No images to delete",
        deletedCount: 0
      });
    }

    await imageService.deleteAllImages(userId);

    res.status(HttpStatus.OK).json({
      message: `All ${imageCount} images deleted successfully`,
      deletedCount: imageCount
    });
  } catch (err) {
    next(err);
  }
};

export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const files = req.files as Express.Multer.File[];
    const rawTitles = (req.body as any).titles as unknown;

    if (!files || files.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        message: "No files uploaded" 
      });
    }

    let titles: string[] | null = null;
    if (Array.isArray(rawTitles)) {
      titles = rawTitles.map(String);
    } else if (typeof rawTitles === 'string') {
      const trimmed = rawTitles.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            titles = parsed.map(String);
          }
        } catch {
        }
      }
      if (!titles) {
        titles = trimmed.length ? trimmed.split(',').map(s => s.trim()) : [];
      }
    }

    if (!titles || titles.length !== files.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: "Titles must be provided for each file",
        details: {
          receivedFiles: files.length,
          receivedTitles: Array.isArray(titles) ? titles.length : 0,
          hint: "Send 'titles' as a JSON array string matching the number of uploaded files"
        }
      });
    }

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i].trim();
      if (!title) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: `Title for file ${i + 1} cannot be empty`
        });
      }
      if (!/^[A-Za-z0-9\s]+$/.test(title)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: `Title for file ${i + 1} must contain only letters, numbers, and spaces`
        });
      }
      if (title.length > 50) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: `Title for file ${i + 1} must be 50 characters or less`
        });
      }
      titles[i] = title; 
    }

    const imageFiles: ImageFileData[] = files.map((file, index) => ({
      file: file.buffer,
      fileName: file.originalname,
      contentType: file.mimetype,
      title: titles[index]
    }));

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const createdImages = await imageService.createImagesFromFiles(userId, imageFiles);

    res.status(HttpStatus.CREATED).json({
      message: "Images uploaded successfully",
      images: createdImages
    });
  } catch (err) {
    console.error('Controller: Upload failed with error:', err);
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    next(err);
  }
};

export const reorderImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const imageOrders = (req.body as any).imageOrders || (req.body as any).images;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        message: "imageOrders array is required",
        hint: "Send body as { imageOrders: [{ id: string, order: number }] } or { images: [...] }"
      });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    await imageService.reorderImages(userId, imageOrders);

    res.status(HttpStatus.OK).json({
      message: "Images reordered successfully"
    });
  } catch (err) {
    next(err);
  }
};
