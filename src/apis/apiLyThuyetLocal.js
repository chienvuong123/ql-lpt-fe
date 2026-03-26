import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/ly-thuyet`;

export const optionLopLyThuyet = async () => {
  const response = await axios.get(`${url}/lop-hoc`);
  return response.data;
};

export const hocVienTheoKhoaLocal = async (enrolmentPlanIid, params) => {
  const response = await axios.get(`${url}/hoc-vien/${enrolmentPlanIid}`, {
    params,
  });
  return response.data;
};

export const ketQuaKiemTra = async (enrolmentPlanIid, params = {}) => {
  const response = await axios.get(`${url}/hoc-vien/khoa/${enrolmentPlanIid}`, {
    params,
  });
  return response.data;
};

export const ketQuaKiemTraTheoDanhSachIid = async (
  enrolmentPlanIids = [],
  params = {},
) => {
  const response = await axios.post(`${url}/hoc-vien/khoa/danh-sach`, {
    enrolmentPlanIids,
    ...params,
  });
  return response.data;
};

export const getDashboardLyThuyet = async (payload = {}) => {
  const response = await axios.post(`${url}/dashboard`, payload);
  return response.data;
};
