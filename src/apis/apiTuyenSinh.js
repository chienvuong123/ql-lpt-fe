import axios from "axios";
import { baseURL } from "../constants/base";

export const getHocVienListTuyenSinh = async (params = {}) => {
    const response = await axios.get(`${baseURL}/google-sheet/hoc-vien-list-sql`, { params });
    return response.data;
};

export const syncDataTuyenSinh = async () => {
    const response = await axios.post(`${baseURL}/google-sheet/sync-data`);
    return response.data;
};

export const updateHocVienTuyenSinh = async (oldCccd, data) => {
    const response = await axios.put(`${baseURL}/google-sheet/update-hoc-vien`, { oldCccd, data });
    return response.data;
};

export const getUnassignedStudents = async (search = "") => {
    const response = await axios.get(`${baseURL}/google-sheet/unassigned-students`, { params: { search } });
    return response.data;
};

export const transferFeeTuyenSinh = async (sourceCccd, targetCccd) => {
    const response = await axios.post(`${baseURL}/google-sheet/transfer-fee`, { sourceCccd, targetCccd });
    return response.data;
};
