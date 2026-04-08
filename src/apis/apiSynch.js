import axios from "axios";
import { baseURL } from "../constants/base";

export const dongBoHocVienSql = async (params = {}) => {
    const response = await axios.post(`${baseURL}/sync/students`, params);
    return response.data;
};

export const dongBoKhoaHocSql = async (params = {}) => {
    const response = await axios.post(`${baseURL}/sync/courses`, params);
    return response.data;
};

export const dongBoXeGiaoVienSql = (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(`${baseURL}/sync/import-sql`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};