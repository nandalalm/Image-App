import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createImages,
  uploadImages,
  getUserImages,
  updateImage,
  deleteImage,
  reorderImages
} from "../controllers/imageController";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.post("/upload-files", authMiddleware, upload.array('images'), uploadImages);
router.post("/create-from-urls", authMiddleware, createImages);
router.get("/my-images", authMiddleware, getUserImages);
router.put("/update/:imageId", authMiddleware, upload.single('image'), updateImage);
router.delete("/delete/:imageId", authMiddleware, deleteImage);
router.patch("/reorder-images", authMiddleware, reorderImages);

export default router;
