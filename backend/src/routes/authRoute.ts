import { Router } from "express";
import { register, verifyOtp, login, refreshToken, getHome, logout } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/refresh-token", refreshToken);
router.get("/home", authMiddleware, getHome);
router.post("/logout", logout);

export default router;
