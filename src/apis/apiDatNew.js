import axios from "axios";

// Client riêng cho tài khoản DAT hệ MỚI (tenant 31011): khóa học đã đổi tên,
// xe đã chuyển mã mới... Token lưu riêng, KHÔNG ghi đè sessionStorage "token"
// (token hệ cũ) mà các trang khác đang dùng qua apiClient.
const DAT_BASE = "http://113.160.131.3:7782/api";
const TOKEN_TTL_MS = 1000 * 60 * 50;

const USERNAME = import.meta.env.VITE_USERNAME_NEW || "dltx_lpt_31011";
const PASSWORD = import.meta.env.VITE_PASSWORD_NEW || "@tcdbvn";

let token = null;
let expiredAt = 0;
let loginPromise = null;

const login = async () => {
  if (token && Date.now() < expiredAt) return token;
  if (loginPromise) return loginPromise;

  loginPromise = axios
    .post(`${DAT_BASE}/Login`, { Username: USERNAME, Password: PASSWORD })
    .then((res) => {
      if (!res?.data?.Token || res?.data?.ID === 0) {
        throw new Error(res?.data?.Name || "Đăng nhập DAT tài khoản mới thất bại");
      }
      token = res.data.Token;
      expiredAt = Date.now() + TOKEN_TTL_MS;
      return token;
    })
    .finally(() => {
      loginPromise = null;
    });

  return loginPromise;
};

const invalidate = () => {
  token = null;
  expiredAt = 0;
};

const datNewClient = axios.create({ baseURL: DAT_BASE, timeout: 50000 });

datNewClient.interceptors.request.use(async (config) => {
  config.headers.Authorization = `Bearer ${await login()}`;
  return config;
});

datNewClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      invalidate();
      return datNewClient(originalRequest);
    }
    return Promise.reject(error);
  },
);

export const DanhSachKhoaHocNew = () => datNewClient.get("/course");

export const DanhSachXeNew = (params) => datNewClient.get("/xe", { params });

export const DanhSachLoaiXeNew = () => datNewClient.get("/loaixe");

export const DanhSachXeOnlineNew = () => datNewClient.get("/XeOnline");

export const DanhSachGiaoVienNew = (params) =>
  datNewClient.get("/GiaoVienTH", { params });
