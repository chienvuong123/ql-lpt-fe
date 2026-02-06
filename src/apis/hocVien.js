import { apiClient } from "./clientApi";

export const DanhSachHocVien = async (params) => {
  return apiClient({
    method: "get",
    url: "/HocVienTH",
    params,
  });
};

export const DanhSachKhoaHoc = async () => {
  return apiClient({
    method: "get",
    url: "/course",
  });
};

export const HanhTrinh = async (params) => {
  return apiClient({
    method: "get",
    url: "/HanhTrinh",
    params,
  });
};
