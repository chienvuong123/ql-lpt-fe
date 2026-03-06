import axios from "axios";

const baseURL = "https://lapphuongthanh.netlify.app/api";
let isSessionExpiredDialogShown = false;

const api = axios.create({
  baseURL: baseURL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-public");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log(response);

    const isInvalidSessionResponse =
      response?.status === 200 &&
      response?.data?.success === false &&
      (response?.data?.message === "token_invalid" ||
        Number(response?.data?.err_code) === 402);

    if (isInvalidSessionResponse && !isSessionExpiredDialogShown) {
      isSessionExpiredDialogShown = true;
      localStorage.removeItem("token-public");
      const shouldReload = window.confirm(
        "Phiên làm việc đã kết thúc. Nhấn OK để tải lại trang.",
      );
      if (shouldReload) {
        window.location.reload();
      }
      isSessionExpiredDialogShown = false;
    }

    return response;
  },
  (error) => Promise.reject(error),
);

export const DangNhapPublic = async (data) => {
  const response = await api.post("/Login", data);

  if (response.data && response.data.Token) {
    localStorage.setItem("token-public", response.data.Token);
  }

  return response;
};

export const HanhTrinhPublic = async (params) => {
  return api({
    method: "get",
    url: "/HanhTrinh",
    params,
  });
};

export const DanhSachHocVienDeploy = async (params) => {
  return api({
    method: "get",
    url: "/HocVienTH",
    params,
  });
};
