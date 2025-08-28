import axios from "axios";
import { toast } from "react-toastify";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: "https://libraflow-libraray-management-system.onrender.com/api/v1",
  withCredentials: true, // send cookies with requests
});

// Attach access token automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        const refreshRes = await axios.get(
          "https://libraflow-libraray-management-system.onrender.com/api/v1/auth/refresh",
          { withCredentials: true }
        );

        const newToken = refreshRes.data.token;
        localStorage.setItem("token", newToken);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "/login"; // redirect to login
        return Promise.reject(refreshError);
      }
    }

    // Generic error
    const message = error.response?.data?.message || error.message || "Something went wrong";
    toast.error(message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
