import axios from "axios";
import { baseURL } from "../constants/base";

const hocVienLyThuyetBaseUrl = `${baseURL}/hoc-vien-lop-ly-thuyet`;

export const getDanhSachHocVienLyThuyet = async (params = {}) => {
  const response = await axios.get(hocVienLyThuyetBaseUrl, { params });
  return response.data;
};

export const getChiTietHocVienLyThuyet = async (maDk) => {
  const response = await axios.get(`${hocVienLyThuyetBaseUrl}/${maDk}`);
  return response.data;
};

export const capNhatTrangThaiHocVienLyThuyet = async (
  maDk,
  payload,
  updatedBy,
) => {
  const response = await axios.patch(
    `${hocVienLyThuyetBaseUrl}/${maDk}/trang-thai`,
    payload,
    {
      headers: updatedBy ? { "x-user": updatedBy } : undefined,
    },
  );
  return response.data;
};

export const capNhatTrangThaiTatCaHocVienLyThuyet = async (payload) => {
  const response = await axios.patch(
    `${hocVienLyThuyetBaseUrl}/trang-thai/tat-ca`,
    payload,
  );
  return response.data;
};

export const getLichSuHocVienLyThuyet = async (maDk) => {
  const response = await axios.get(`${hocVienLyThuyetBaseUrl}/${maDk}/lich-su`);
  return response.data;
};
