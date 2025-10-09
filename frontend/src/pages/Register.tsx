import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerSchema } from "../validation/registerSchema";
import { validateForm } from "../utils/validateForm";
import axiosInstance from "../api/axiosInstance";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(registerSchema, formData);
    if (!result.valid) return setErrors(result.errors);
    
    setErrors({});
    setLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/auth/register", result.data);
      navigate("/verify-otp");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className={`border w-full p-2 rounded ${
              errors.firstName ? "border-red-500" : "border-gray-300"
            }`}
            value={formData.firstName}
            onChange={handleChange}
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <input
            type="text"
            name="lastName"
            placeholder="Last Name (Optional)"
            className={`border w-full p-2 rounded ${
              errors.lastName ? "border-red-500" : "border-gray-300"
            }`}
            value={formData.lastName}
            onChange={handleChange}
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>

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
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {error && (
          <p className="text-red-500 text-center text-sm mt-2">{error}</p>
        )}
      </form>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
