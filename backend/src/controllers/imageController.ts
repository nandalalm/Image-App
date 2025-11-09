import { Request, Response, NextFunction } from "express";
import { container } from "../config/container";
import { TYPES } from "../config/types";
import { IImageService, ImageFileData } from "../interfaces/services/IImageService";
import { IImage } from "../models/imageModel";
import { HttpStatus } from "../constants/httpStatus";
import { Messages } from "../constants/messages";
import { JwtPayload } from "jsonwebtoken";

interface AuthenticatedJwtPayload extends JwtPayload {
  id: string;
  email: string;
}

export const createImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.NO_IMAGES_PROVIDED });
    }

    for (const img of images) {
      if (!img.title || !img.imageUrl || !img.s3Key) {
        return res.status(HttpStatus.BAD_REQUEST).json({ 
          message: Messages.IMAGE_FIELDS_REQUIRED 
        });
      }
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const createdImages = await imageService.createImages(userId, images);

    res.status(HttpStatus.CREATED).json({
      message: Messages.IMAGES_CREATED,
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
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const skip = (page - 1) * limit;

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const result = await imageService.getUserImages(userId, limit, skip);

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];
    
    res.status(HttpStatus.OK).json({
      images: result.images.map(img => ({
        id: img._id,
        title: img.title,
        imageUrl: `/api/images/serve/${img._id}${accessToken ? `?token=${accessToken}` : ''}`, 
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
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    if (!title) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: Messages.TITLE_REQUIRED });
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
      return res.status(HttpStatus.NOT_FOUND).json({ message: Messages.IMAGE_NOT_FOUND });
    }

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];

    res.status(HttpStatus.OK).json({
      message: Messages.IMAGE_UPDATED,
      image: {
        id: updatedImage._id,
        title: updatedImage.title,
        imageUrl: `/api/images/serve/${updatedImage._id}${accessToken ? `?token=${accessToken}` : ''}`,
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
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    const deleted = await imageService.deleteImage(userId, imageId);

    if (!deleted) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: Messages.IMAGE_NOT_FOUND });
    }

    res.status(HttpStatus.OK).json({
      message: Messages.IMAGE_DELETED
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAllImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    
    const userImages = await imageService.getUserImages(userId);
    const imageCount = userImages.total;
    
    if (imageCount === 0) {
      return res.status(HttpStatus.OK).json({
        message: Messages.NO_IMAGES_TO_DELETE,
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
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const files = req.files as { buffer: Buffer; originalname: string; mimetype: string }[];
    const rawTitles = req.body.titles as unknown;

    if (!files || files.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        message: Messages.NO_FILES_UPLOADED 
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
          titles = null;
        }
      }
      if (!titles) {
        titles = trimmed.length ? trimmed.split(',').map(s => s.trim()) : [];
      }
    }

    if (!titles || titles.length !== files.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: Messages.TITLES_REQUIRED,
        details: {
          receivedFiles: files.length,
          receivedTitles: Array.isArray(titles) ? titles.length : 0,
          hint: Messages.TITLES_HINT
        }
      });
    }

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i].trim();
      if (!title) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: Messages.TITLE_CANNOT_BE_EMPTY.replace('{fileNumber}', (i + 1).toString())
        });
      }
      if (!/^[A-Za-z0-9\s]+$/.test(title)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: Messages.TITLE_INVALID_CHARS.replace('{fileNumber}', (i + 1).toString())
        });
      }
      if (title.length > 50) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: Messages.TITLE_TOO_LONG.replace('{fileNumber}', (i + 1).toString())
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
    
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1];

    res.status(HttpStatus.CREATED).json({
      message: Messages.IMAGES_UPLOADED,
      images: createdImages.map(img => ({
        _id: img._id,
        title: img.title,
        imageUrl: `/api/images/serve/${img._id}${accessToken ? `?token=${accessToken}` : ''}`,
        order: img.order,
        createdAt: img.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const reorderImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const imageOrders = req.body.imageOrders || req.body.images;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    if (!imageOrders || !Array.isArray(imageOrders)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ 
        message: Messages.IMAGE_ORDERS_REQUIRED,
        hint: Messages.IMAGE_ORDERS_HINT
      });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    await imageService.reorderImages(userId, imageOrders);

    res.status(HttpStatus.OK).json({
      message: Messages.IMAGES_REORDERED
    });
  } catch (err) {
    next(err);
  }
};

export const serveImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId: string | undefined;
    const { imageId } = req.params;
    const { token } = req.query;

    const authHeader = req.headers.authorization;
    const authToken = authHeader?.split(" ")[1];
    
    if (authToken) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const accessSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessSecret) throw new Error("Missing ACCESS_TOKEN_SECRET");
        const decoded = jwt.verify(authToken, accessSecret) as AuthenticatedJwtPayload;
        userId = decoded.id;
      } catch {
        userId = undefined;
      }
    }

    if (!userId && token) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const accessSecret = process.env.ACCESS_TOKEN_SECRET;
        if (!accessSecret) throw new Error("Missing ACCESS_TOKEN_SECRET");
        const decoded = jwt.verify(token as string, accessSecret) as AuthenticatedJwtPayload;
        userId = decoded.id;
      } catch {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
      }
    }

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
  
    const result = await imageService.getUserImages(userId);
    const images = result.images as IImage[];
    const image = images.find(img => img._id?.toString() === imageId);
    
    if (!image) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: Messages.IMAGE_NOT_FOUND });
    }
    const signedUrl = await imageService.generateSignedUrl(image.s3Key, 300); 
    
    const fetch = (await import('node-fetch')).default;
    const imageResponse = await fetch(signedUrl);
    
    if (!imageResponse.ok) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: Messages.IMAGE_NOT_FOUND });
    }
    
    res.set({
      'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
      'Content-Length': imageResponse.headers.get('content-length') || '',
      'Cache-Control': 'private, max-age=300', 
    });
   
    imageResponse.body?.pipe(res);
  } catch (err) {
    next(err);
  }
};

export const getSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { imageId } = req.params;
    const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: Messages.USER_NOT_AUTHENTICATED });
    }

    const imageService = container.get<IImageService>(TYPES.ImageService);
    
    const result = await imageService.getUserImages(userId);
    const images = result.images as IImage[];
    const image = images.find(img => img._id?.toString() === imageId);
    
    if (!image) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: Messages.IMAGE_NOT_FOUND });
    }
    
    const signedUrl = await imageService.generateSignedUrl(image.s3Key, expiresIn);

    res.status(HttpStatus.OK).json({
      signedUrl,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    });
  } catch (err) {
    next(err);
  }
};

