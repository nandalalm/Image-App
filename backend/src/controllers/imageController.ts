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

    // Validate image data
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

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const images = await imageService.getUserImages(userId);

    res.status(HttpStatus.OK).json({
      images: images.map(img => ({
        id: img._id,
        title: img.title,
        imageUrl: img.imageUrl,
        order: img.order,
        createdAt: img.createdAt
      }))
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

// Upload files to S3 and create image records
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

    // Normalize titles: accept array, JSON string, or comma-separated string
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
          // fall through to comma-separated handling
        }
      }
      if (!titles) {
        // comma-separated fallback
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

    // Convert files to ImageFileData format
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
    next(err);
  }
};

export const reorderImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    // Accept both 'imageOrders' and 'images' for compatibility
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
