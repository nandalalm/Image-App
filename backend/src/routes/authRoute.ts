import { Router } from "express";
import { register, verifyOtp, resendOtp, login, refreshToken, getHome, logout, forgotPassword, resetPassword } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/refresh-token", refreshToken);
router.get("/home", authMiddleware, getHome);
router.post("/logout", logout);

export default router;
