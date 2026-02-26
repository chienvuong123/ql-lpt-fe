import axios from "axios";
import { baseURL } from "../constants/base";

const api = axios.create({
  baseURL: `${baseURL}/check-data-student`,
});

export const importCheckStudentExcel = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / (e.total || 1));
      onProgress?.(percent);
    },
  });
};

export const fetchCheckStudents = async (params = {}) => {
  const response = await api.get("/", { params });
  return response.data;
};
