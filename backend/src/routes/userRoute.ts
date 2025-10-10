import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import { getProfile, updateProfilePhoto } from "../controllers/authController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Professional endpoint names
router.get("/profileinfo", authMiddleware, getProfile);
router.patch("/updateImage", authMiddleware, upload.single('image'), updateProfilePhoto);

export default router;
