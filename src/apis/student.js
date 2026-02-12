import axios from "axios";

export const studentList = async (params) => {
  return axios.get("http://localhost:3000/api/students", { params });
};

export const importStudents = async (formData) => {
  return axios.post("http://localhost:3000/api/students/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
