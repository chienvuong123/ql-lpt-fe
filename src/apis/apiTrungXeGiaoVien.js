import axios from "axios";
import { baseURL } from "../constants/base";

export const trungXeGiaoVien = async (params = {}) => {
    const response = await axios.get(`${baseURL}/backup/check-trung`, { params });
    return response.data;
}

export const danhSachXeGiaoVien = async (params = {}) => {
    const response = await axios.get(`${baseURL}/xe-giao-vien/danh-sach`, { params });
    return response.data;
}
