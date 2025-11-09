import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import { getProfile, updateProfilePhoto, serveProfileImage } from "../controllers/authController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/profileinfo", authMiddleware, getProfile);
router.get("/profile-image", serveProfileImage);
router.patch("/updateImage", authMiddleware, upload.single('image'), updateProfilePhoto);

export default router;
