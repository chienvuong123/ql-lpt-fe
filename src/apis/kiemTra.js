import axios from "axios";
import { baseURL } from "../constants/base";

const api = axios.create({
  baseURL: `${baseURL}/check-data-student`,
});

export const importCheckStudentExcel = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / (e.total || 1));
      onProgress?.(percent);
    },
  });
};

export const fetchCheckStudents = async (params = {}) => {
  const response = await api.get("/", { params });
  return response.data;
};

export const optionTeacherCheck = async (params = {}) => {
  const response = await api.get("/giao-vien", { params });
  return response.data;
};

export const kiemTraTrungThoiGian = async (body = {}) => {
  const response = await api.post("/phien", body);
  return response.data;
};

export const kiemTraToanKhoa = async (params = {}, config = {}) => {
  // Gửi token hành trình của người đang đăng nhập để backend thấy đúng
  // học viên thuộc cơ sở của tài khoản này (giống màn chi tiết học viên)
  const hanhTrinhToken = sessionStorage.getItem("token");
  const response = await api.post("/toan-khoa", params, {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(hanhTrinhToken ? { "X-HanhTrinh-Token": hanhTrinhToken } : {}),
    },
  });
  return response.data;
};
