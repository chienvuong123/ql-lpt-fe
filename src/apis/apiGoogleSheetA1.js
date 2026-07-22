import axios from "axios";
import { baseURL } from "../constants/base";

export const getListGoogleSheetA1 = async (params = {}) => {
    const response = await axios.get(`${baseURL}/google-sheet-a1`, { params });
    return response.data;
};

export const importExcelGoogleSheetA1 = (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    return axios.post(`${baseURL}/google-sheet-a1/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};
