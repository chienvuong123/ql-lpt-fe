import axios from "axios";
import { baseURL } from "../constants/base";

export const importExcelPhienHocThucHanhCsdt = (file, ngayImport, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ngay_import", ngayImport);

    return axios.post(`${baseURL}/phien-hoc-thuc-hanh-csdt/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};

// Trả về map { [ma_phien_hoc]: record } — chỉ gồm các phiên CSĐT đang "Khả dụng".
export const getPhienHocThucHanhCsdtByMaPhienHocList = async (maPhienHocList) => {
    if (!Array.isArray(maPhienHocList) || maPhienHocList.length === 0) return {};
    const response = await axios.post(`${baseURL}/phien-hoc-thuc-hanh-csdt/by-ma-phien-hoc`, {
        ma_phien_hoc_list: maPhienHocList,
    });
    return response.data?.data || {};
};
