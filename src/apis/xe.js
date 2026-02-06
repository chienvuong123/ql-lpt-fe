import { apiClient } from "./clientApi";

export const DanhSachXe = async () => {
  return apiClient({
    method: "get",
    url: "/xe",
  });
};

export const DanhSachLoaiXe = async () => {
  return apiClient({
    method: "get",
    url: "/loaixe",
  });
};
