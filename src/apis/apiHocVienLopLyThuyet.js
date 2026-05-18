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

export const capNhatTrangThaiHocVienLyThuyet = async (maDk, payload) => {
  const response = await axios.patch(
    `${baseURL}/hoc-vien-lop-ly-thuyet/trang-thai/${maDk}`,
    payload,
  );
  return response.data;
};

export const capNhatTrangThaiTatCaHocVienLyThuyet = async (payload) => {
  const response = await axios.post(
    `${baseURL}/hoc-vien-lop-ly-thuyet/trang-thai/bulk`,
    payload,
  );
  return response.data;
};

export const getLichSuHocVienLyThuyet = async (maDk) => {
  const response = await axios.get(`${hocVienLyThuyetBaseUrl}/${maDk}/lich-su`);
  return response.data;
};

export const exportDanhSachHocVienLyThuyet = async (enrolmentPlanIid) => {
  const response = await axios.get(
    `${baseURL}/ly-thuyet/hoc-vien/khoa/${enrolmentPlanIid}/export-excel`,
    { responseType: 'blob' }
  );

  // Tạo link download tự động
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `danh-sach-hoc-vien-${enrolmentPlanIid}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
