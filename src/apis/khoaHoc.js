import axios from "axios";

export const danhSachKhoaHoc = async (params) => {
  return axios.get("http://localhost:3000/api/courses", { params });
};

export const importCourses = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("http://localhost:3000/api/courses/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const sourceOptions = async () => {
  return axios.get("http://localhost:3000/api/courses/options");
};
