import axios from "axios";
import { baseURL } from "../constants/base";

export const getListGplxHoan = async (params = {}) => {
    const response = await axios.get(`${baseURL}/gplx-hoan`, { params });
    return response.data;
};

export const importExcelGplxHoan = (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(`${baseURL}/gplx-hoan/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};
