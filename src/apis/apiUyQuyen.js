import axios from "axios";
import { baseURL } from "../constants/base";

export const getDanhSachUyQuyen = async (params = {}) => {
    const response = await axios.get(`${baseURL}/uy-quyen/danh-sach`, { params });
    return response.data;
};

export const getChiTietUyQuyen = async (bien_so_xe) => {
    const response = await axios.get(`${baseURL}/uy-quyen/chi-tiet/${bien_so_xe}`);
    return response.data;
};

export const addUyQuyen = async (data) => {
    const response = await axios.post(`${baseURL}/uy-quyen/add`, data);
    return response.data;
};

export const editUyQuyen = async (id, data) => {
    const response = await axios.patch(`${baseURL}/uy-quyen/edit/${id}`, data);
    return response.data;
};

export const deleteUyQuyen = async (id) => {
    const response = await axios.delete(`${baseURL}/uy-quyen/delete/${id}`);
    return response.data;
};

export const importExcelUyQuyen = (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(`${baseURL}/uy-quyen/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};