import axios from "axios";
import { baseURL } from "../constants/base";

const hocVienCabinBaseUrl = `${baseURL}/cabin`;
const urlCabinOnline = "https://lapphuongthanh.io.vn/api/thongtintap";

export const getDanhSachHocVienCabin = async (params = {}) => {
  const response = await axios.get(hocVienCabinBaseUrl, { params });
  return response.data;
};

export const getDanhSachKetQuaHocCabin = async (params) => {
  try {
    const response = await axios.get(`${urlCabinOnline}/danh-sach`, {
      params,
    });

    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    throw error;
  }
};

export const getDanhSachHocVienChiaCabin = async (params = {}) => {
  const response = await axios.get(
    `${hocVienCabinBaseUrl}/danh-sach-chia-lich`,
    { params },
  );
  return response.data;
};

export const saveLichCabin = async (data = {}) => {
  const response = await axios.post(`${hocVienCabinBaseUrl}/save-lich`, data);
  return response.data;
};

export const getLichCabin = async (params = {}) => {
  const response = await axios.get(`${hocVienCabinBaseUrl}/get-lich`, { params });
  return response.data;
};

export const updateGhiChuLichCabin = async (id, data = {}) => {
  const response = await axios.patch(`${hocVienCabinBaseUrl}/update-lich-note/${id}`, data);
  return response.data;
};

export const checkOnlineStatus = async (data = {}) => {
  const response = await axios.post(`${hocVienCabinBaseUrl}/check-online`, data);
  return response.data;
};


