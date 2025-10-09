import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { otpSchema } from "../validation/otpSchema";
import { validateForm } from "../utils/validateForm";
import axiosInstance from "../api/axiosInstance";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", otp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(otpSchema, formData);
    if (!result.valid) return setErrors(result.errors);
    
    setErrors({});
    setLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/auth/verify-otp", result.data);
      navigate("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-semibold mb-4 text-center">Verify OTP</h1>
        
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
              type="text"
              name="otp"
              placeholder="Enter OTP"
              className={`border w-full p-2 rounded ${
                errors.otp ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.otp}
              onChange={handleChange}
            />
            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          {error && (
            <p className="text-red-500 text-center text-sm mt-2">{error}</p>
          )}
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already verified?{" "}
            <Link to="/login" className="text-blue-500 hover:text-blue-700">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
