import axios from "axios";

export const apiLyThuyet = axios.create({
  baseURL: "https://staging-api.lotuslms.com",
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiLyThuyet.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config?.params?.noReqNo) {
      delete config.headers.reqNo;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiLyThuyet.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status && error.response.status >= 500) {
      window.location.href = "/500";
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      window.location.href = "/login";

      try {
        if (originalRequest.headers) {
          return apiLyThuyet(originalRequest);
        }
        throw new Error("Headers are undefined");
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export async function apiRequest(config) {
  const response = await apiLyThuyet(config);
  return response.data;
}

export async function apiRequestAll(config) {
  const response = await apiLyThuyet(config);
  return response;
}
