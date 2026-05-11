import axios from "axios";
import { baseURL } from "../constants/base";

export const getDanhSachHocVienHocBuCabin = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/cabin`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBu = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuLyThuyet = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/ly-thuyet`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuLyThuyetDetail = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/ly-thuyet/detail`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuDat = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuDetail = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/detail`, { params });
    return response.data;
};

export const addHocBu = async (data) => {
    const response = await axios.post(`${baseURL}/tien-do-dao-tao/hoc-bu`, data);
    return response.data;
};

export const updateHocBuStatus = async (data = {}) => {
    const response = await axios.post(`${baseURL}/tien-do-dao-tao/hoc-bu/update-status`, data);
    return response.data;
};

export const getDanhSachHocVienHocBuChoDuyet = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/cho-duyet`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuDangHocBu = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/dang-hoc-bu`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuChoDuyetLyThuyet = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/cho-duyet-ly-thuyet`, { params });
    return response.data;
};

export const getDanhSachHocVienHocBuChoDuyetThucHanh = async (params = {}) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/cho-duyet-thuc-hanh`, { params });
    return response.data;
};

export const importHocBuExcel = async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata.loai) formData.append("loai", metadata.loai);
    if (metadata.khoa_bu) formData.append("khoa_bu", metadata.khoa_bu);
    if (metadata.ghi_chu) formData.append("ghi_chu", metadata.ghi_chu);
    if (metadata.nguoi_tao) formData.append("nguoi_tao", metadata.nguoi_tao);

    const response = await axios.post(`${baseURL}/tien-do-dao-tao/hoc-bu/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};
