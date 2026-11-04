import axios from "axios";
import { baseURL } from "../constants/base";

// Import 1..n file XML của ngày thi; backend tự nhận diện file danh sách / lý thuyết / sa hình / đường trường
export const importXmlSatHach = (files, ngayThi, onProgress) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (ngayThi) formData.append("ngay_thi", ngayThi);

    return axios.post(`${baseURL}/sat-hach/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10 * 60 * 1000,
        onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1));
            onProgress?.(percent);
        },
    });
};

export const getKySatHachList = async () => {
    const response = await axios.get(`${baseURL}/sat-hach/ky`);
    return response.data?.data || [];
};

export const getKetQuaKySatHach = async (maKySh) => {
    const response = await axios.get(`${baseURL}/sat-hach/ky/${encodeURIComponent(maKySh)}`);
    return response.data?.data || null;
};

export const getThongKeCacKySatHach = async (denKy, limit = 5) => {
    const response = await axios.get(`${baseURL}/sat-hach/thong-ke-cac-ky`, {
        params: { den_ky: denKy || undefined, limit },
    });
    return response.data?.data || [];
};

export const getLichSuSatHach = async ({ soCmt, maDk }) => {
    const response = await axios.get(`${baseURL}/sat-hach/lich-su`, {
        params: { so_cmt: soCmt || undefined, ma_dk: maDk || undefined },
    });
    return response.data?.data || [];
};

export const getAnhSatHachUrl = (maKySh, maDk) =>
    `${baseURL}/sat-hach/anh/${encodeURIComponent(maKySh)}/${encodeURIComponent(maDk)}`;
