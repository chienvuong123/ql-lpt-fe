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
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/hoc-bu/dat`, { params });
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
