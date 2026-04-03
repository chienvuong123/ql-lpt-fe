import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/kiem-tra-tot-nghiep/import`;

export const importHocVienTotNghiep = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / (e.total || 1));
      onProgress?.(percent);
    },
  });
};

export const fetchHocVienTotNghiep = async () => {
  const response = await axios.get(`${baseURL}/kiem-tra-tot-nghiep`);
  return response.data;
};

export const exportExcelTotNghiep = async (params) => {
  const response = await axios.get(
    `${baseURL}/kiem-tra-tot-nghiep/export-excel`,
    {
      params,
      responseType: "blob",
    },
  );

  return response.data;
};
