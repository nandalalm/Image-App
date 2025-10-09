import { useAppDispatch, useAppSelector } from "../redux/store";
import { loginUser } from "../redux/authSlice";
import { useState } from "react";
import { loginSchema } from "../validation/loginSchema";
import { validateForm } from "../utils/validateForm";
import { Link } from "react-router-dom";

const Login = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
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
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <button
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <p className="text-red-500 text-center text-sm mt-2">{error}</p>
        )}
      </form>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:text-blue-700">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
