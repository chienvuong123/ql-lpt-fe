import { apiClient } from "./clientApi";
import axios from "axios";
import { baseURL } from "../constants/base";

export const DanhSachXe = async (params) => {
  if (!params) {
    return apiClient({
      method: "get",
      url: "/xe",
    });
  } else {
    return apiClient({
      method: "get",
      url: "/xe",
      params,
    });
  }
};

export const DanhSachLoaiXe = async () => {
  return apiClient({
    method: "get",
    url: "/loaixe",
  });
};


export const DanhSachXeOnline = async () => {
  return apiClient({
    method: "get",
    url: "/XeOnline",
  });
};

export const importExcelXe = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${baseURL}/xe/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / (e.total || 1));
      onProgress?.(percent);
    },
  });
};

export const getDanhSachXe = async (params = {}) => {
  const response = await axios.get(`${baseURL}/xe/danh-sach`, { params });
  return response.data;
};

export const addXe = async (data) => {
  const response = await axios.post(`${baseURL}/xe/add`, data);
  return response.data;
};

export const updateXe = async (id, data) => {
  const response = await axios.put(`${baseURL}/xe/edit/${id}`, data);
  return response.data;
};

export const deleteXe = async (id) => {
  const response = await axios.delete(`${baseURL}/xe/delete/${id}`);
  return response.data;
};
