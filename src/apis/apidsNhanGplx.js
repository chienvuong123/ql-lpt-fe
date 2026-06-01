import axios from "axios";
import { baseURL } from "../constants/base";

export const getListStudentsReceiveGplx = async (params = {}) => {
    const response = await axios.get(`${baseURL}/ds-nhan-gplx`, { params });
    return response.data;
};

export const updateStudentReceiveGplx = async (id, data) => {
    const response = await axios.put(`${baseURL}/ds-nhan-gplx/${id}`, data);
    return response.data;
};

export const bulkUpdateStudentReceiveGplx = async (data) => {
    const response = await axios.post(`${baseURL}/ds-nhan-gplx/bulk-update`, data);
    return response.data;
};

export const importExcelReceiveGplx = (file, ngay_gui, ngay_thi, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    if (ngay_gui) formData.append("ngay_gui", ngay_gui);
    if (ngay_thi) formData.append("ngay_thi", ngay_thi);

    return axios.post(`${baseURL}/ds-nhan-gplx/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};

export const getListDates = async () => {
    const response = await axios.get(`${baseURL}/ds-nhan-gplx/dates`);
    return response.data;
};

export const exportExcelReceiveGplx = async (params = {}) => {
    const response = await axios.get(`${baseURL}/ds-nhan-gplx/export`, {
        params,
        responseType: "blob"
    });
    return response.data;
};