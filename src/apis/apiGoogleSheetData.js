import axios from "axios";
import { baseURL } from "../constants/base";

export const importExcelGoogleSheetData = (file, onProgress, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.sheetName) formData.append("sheetName", options.sheetName);
    if (options.year) formData.append("year", options.year);

    return axios.post(`${baseURL}/google-sheet/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};
