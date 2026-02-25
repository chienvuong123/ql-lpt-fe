import { apiClient } from "./clientApi";

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
