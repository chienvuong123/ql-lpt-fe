import { apiClient } from "./clientApi";

export const DanhSachGiaoVien = async (params) => {
  return apiClient({
    method: "get",
    url: "/GiaoVienTH",
    params,
  });
};
