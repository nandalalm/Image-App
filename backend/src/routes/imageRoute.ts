import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createImages,
  uploadImages,
  getUserImages,
  updateImage,
  deleteImage,
  deleteAllImages,
  reorderImages,
  serveImage,
  getSignedUrl
} from "../controllers/imageController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_, file, cb) => {
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
router.get("/serve/:imageId", serveImage);
router.get("/signed-url/:imageId", authMiddleware, getSignedUrl);
router.put("/update/:imageId", authMiddleware, upload.single('image'), updateImage);
router.delete("/delete/:imageId", authMiddleware, deleteImage);
router.delete("/delete-all", authMiddleware, deleteAllImages);
router.patch("/reorder-images", authMiddleware, reorderImages);

export default router;
