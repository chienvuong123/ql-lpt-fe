import { apiClient } from "./clientApi";

export const DanhSachTaiKhoan = async (params) => {
  return apiClient({
    method: "get",
    url: "/user",
    params,
  });
};
