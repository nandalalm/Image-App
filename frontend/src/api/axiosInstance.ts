import axios from "axios";
import { store } from "../redux/store";
import { refreshAccessToken } from "../redux/authSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // important to send http-only cookie
});

// 🔑 Request interceptor to attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 🧠 Interceptor for expired access tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Ask Redux slice to get new access token
        const newAccessToken = await store.dispatch(refreshAccessToken()).unwrap();

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token expired or invalid:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
