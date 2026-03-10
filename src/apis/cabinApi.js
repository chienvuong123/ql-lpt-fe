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
