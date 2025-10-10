import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "../redux/store";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOtp from "../pages/VerifyOtp";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import ResetPassword from "../pages/ResetPassword";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAppSelector((state) => state.auth);
  return accessToken ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken } = useAppSelector((state) => state.auth);
  return !accessToken ? <>{children}</> : <Navigate to="/home" replace />;
};

const Router = () => {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />
    <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/" element={<Navigate to="/home" replace />} />
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
</BrowserRouter>

  );
};

export default Router;
