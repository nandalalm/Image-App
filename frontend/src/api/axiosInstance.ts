import axios from "axios";
import { store } from "../redux/store";
import { refreshAccessToken } from "../redux/authSlice";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, 
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      const authHeader = originalRequest.headers?.Authorization || originalRequest.headers?.authorization;
      if (!authHeader) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        const newAccessToken = await store.dispatch(refreshAccessToken()).unwrap();

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
