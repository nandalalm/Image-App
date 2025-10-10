import { useAppDispatch, useAppSelector } from "../redux/store";
import { loginUser } from "../redux/authSlice";
import { useState } from "react";
import { loginSchema } from "../validation/loginSchema";
import { validateForm } from "../utils/validateForm";
import { Link } from "react-router-dom";
import { z } from "zod";
import axiosInstance from "../api/axiosInstance";
import { useToast } from "../components/ToastProvider";

const Login = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { show } = useToast();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const forgotSchema = z.object({ email: z.string().trim().email("Invalid email format") });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(loginSchema, formData);
    if (!result.valid) return setErrors(result.errors);
    setErrors({});
    dispatch(loginUser(result.data as { email: string; password: string }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl font-semibold mb-4 text-center">{mode === "login" ? "Login" : "Forgot Password"}</h2>
      {mode === "login" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`border w-full p-2 rounded ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={`border w-full p-2 rounded ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            onChange={handleChange}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => { setMode("forgot"); setForgotEmail(formData.email); setForgotError(""); }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setForgotError("");
            const parsed = forgotSchema.safeParse({ email: forgotEmail });
            if (!parsed.success) {
              setForgotError(parsed.error.flatten().fieldErrors.email?.[0] || "Invalid email");
              return;
            }
            try {
              setForgotLoading(true);
              await axiosInstance.post("/auth/forgot-password", { email: parsed.data.email });
              show("Reset link sent to your email", "success");
            } catch (err: any) {
              const errorMessage = err.response?.data?.message || "Failed to send reset link";
              if (errorMessage === "Email not registered") {
                setForgotError("Email not registered");
              } else {
                show(errorMessage, "error");
              }
            } finally {
              setForgotLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <input
              type="email"
              name="forgotEmail"
              placeholder="Enter your email"
              className={`border w-full p-2 rounded ${forgotError ? "border-red-500" : "border-gray-300"}`}
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {forgotError && <p className="text-red-500 text-xs mt-1">{forgotError}</p>}
          </div>
          <button
            disabled={forgotLoading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
          >
            {forgotLoading ? "Sending..." : "Send reset link"}
          </button>
          <div className="text-center">
            <button type="button" onClick={() => setMode("login")} className="text-sm text-gray-600 hover:text-gray-800">
              Back to login
            </button>
          </div>
        </form>
      )}
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:text-blue-700">
            Register here
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};

export default Login;
