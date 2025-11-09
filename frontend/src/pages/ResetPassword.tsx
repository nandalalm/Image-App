import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthApi } from "../services";
import { useToast } from "../hooks/useToast";

const schema = z
  .object({
    password: z
      .string()
      .refine((val) => val.length > 0, "This field cannot be empty")
      .refine((val) => val.length >= 6, "Password must be at least 6 characters long")
      .refine((val) => /[A-Z]/.test(val), "Password must contain at least 1 uppercase letter")
      .refine((val) => /[a-z]/.test(val), "Password must contain at least 1 lowercase letter")
      .refine((val) => /[0-9]/.test(val), "Password must contain at least 1 number")
      .refine((val) => /[^A-Za-z0-9]/.test(val), "Password must contain at least 1 special character"),
    confirmPassword: z
      .string()
      .refine((val) => val.length > 0, "This field cannot be empty"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const [search] = useSearchParams();
  const token = search.get("token") || "";
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        password: fieldErrors.password?.[0] || "",
        confirmPassword: fieldErrors.confirmPassword?.[0] || "",
      });
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      await AuthApi.resetPassword({
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      show("Password updated. You can now log in.", "success");
      navigate("/login");
    } catch {
      show("Failed to reset password. Link may be invalid or expired.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Reset Password</h2>
        {!token && (
          <p className="text-sm text-red-600 mb-4 text-center">Missing or invalid reset token.</p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className={`border w-full p-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className={`border w-full p-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            disabled={loading || !token}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-60 transition-colors font-medium"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
          
          <div className="text-center mt-6">
            <button 
              type="button" 
              onClick={() => navigate("/login")} 
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
