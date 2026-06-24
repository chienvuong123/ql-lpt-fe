import axios from "axios";
import { baseURL } from "../constants/base";

export const getUnassignedStudents2026 = async (params) => {
    const res = await axios.get(`${baseURL}/google-sheet/unassigned-students-2026`, { params });
    return res.data;
};

export const danhSachKeToan = async (params) => {
    const res = await axios.get(`${baseURL}/ke-toan/danh-sach`, { params });
    return res.data;
};

export const duyetHocPhi = async (data) => {
    const res = await axios.post(`${baseURL}/ke-toan/duyet`, data);
    return res.data;
};

export const baoCaoDoanhThu = async (params) => {
    const res = await axios.get(`${baseURL}/ke-toan/bao-cao`, { params });
    return res.data;
};