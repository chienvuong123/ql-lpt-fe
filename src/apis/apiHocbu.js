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