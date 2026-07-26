import axios from "axios";
import { baseURL } from "../constants/base";

export const getListGplxHoan = async (params = {}) => {
    const response = await axios.get(`${baseURL}/gplx-hoan`, { params });
    return response.data;
};

export const getNgayNhanBuuDienOptions = async () => {
    const response = await axios.get(`${baseURL}/gplx-hoan/ngay-nhan-buu-dien`);
    return response.data;
};

export const getNgayCapOptions = async () => {
    const response = await axios.get(`${baseURL}/gplx-hoan/ngay-cap`);
    return response.data;
};

export const importExcelGplxHoan = (file, ngayNhanBuuDien, format, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ngay_nhan_buu_dien", ngayNhanBuuDien);
    formData.append("format", format || "scan");

    return axios.post(`${baseURL}/gplx-hoan/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};

export const scanGplxHoan = async ({ scanned_text, ngay_nhan_buu_dien, from_trang_thai }) => {
    const response = await axios.post(`${baseURL}/gplx-hoan/scan`, { scanned_text, ngay_nhan_buu_dien, from_trang_thai });
    return response.data;
};

export const updateTrangThaiGplxHoan = async ({ id, trang_thai }) => {
    const response = await axios.post(`${baseURL}/gplx-hoan/update-trang-thai`, { id, trang_thai });
    return response.data;
};

export const updateGplxHoan = async (id, fields) => {
    const response = await axios.put(`${baseURL}/gplx-hoan/${id}`, fields);
    return response.data;
};

export const exportExcelGplxHoan = async (params = {}) => {
    const response = await axios.get(`${baseURL}/gplx-hoan/export`, {
        params,
        responseType: "blob",
    });
    return response.data;
};
