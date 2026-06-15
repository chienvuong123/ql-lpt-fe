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

export const dongBoTienDoDaoTaoSql = async (data) => {
    const response = await axios.post(`${baseURL}/sync/tien-do`, data);
    return response.data;
};

export const getTienDoDaoTaoListSql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/sync/tien-do`, { params });
    return response.data;
};

export const getKhoaHocListSql = async () => {
    const response = await axios.get(`${baseURL}/sync/courses`);
    return response.data;
};

export const getTienDoDaoTaoByMaHocVienSql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao`, { params });
    return response.data
};

export const getHocVienByMaKhoaSql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/sync/students`, { params });
    return response.data;
};

export const kiemTraDongBoSql = async (data) => {
    const response = await axios.post(`${baseURL}/sync/kiem-tra-dong-bo`, data);
    return response.data;
};

export const getTienDoB1Sql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/sync/tien-do/b1`, { params });
    return response.data;
};

export const getTienDoB2Sql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/sync/tien-do/b2`, { params });
    return response.data;
};

export const getTienDoC1Sql = async (params = {}) => {
    const response = await axios.get(`${baseURL}/sync/tien-do/c1`, { params });
    return response.data;
};

export const importXML = async (file, onProgress, createdBy, updatedBy) => {
    const formData = new FormData();
    formData.append("file", file);
    if (createdBy) formData.append("created_by", createdBy);
    if (updatedBy) formData.append("updated_by", updatedBy);

    return axios.post(`${baseURL}/sync/import-xml`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};

