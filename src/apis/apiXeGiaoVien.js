import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/xe-giao-vien`;

export const getDanhSachXeVaGiaoVien = async (params = {}) => {
    const response = await axios.get(`${url}/danh-sach`, { params });
    return response.data;
};

export const editDangKyXeGiaoVien = async (id, payload = {}) => {
    const response = await axios.patch(`${url}/edit/${id}`, payload);
    return response.data;
};


