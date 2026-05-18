import axios from "axios";
import { baseURL } from "../constants/base";

export const getLichSuDuyetPhienHoc = async (ma_dk) => {
    const response = await axios.get(`${baseURL}/phien-hoc-duyet/${ma_dk}`);
    return response.data;
};

export const updateDuyetPhienHoc = async (phien_hoc_dat_id, data) => {
    const response = await axios.patch(`${baseURL}/phien-hoc-duyet/${phien_hoc_dat_id}`, data);
    return response.data;
};

export const getHocVienDuyet = async (ma_dk) => {
    const response = await axios.get(`${baseURL}/hoc-vien-duyet/${ma_dk}`);
    return response.data;
};

export const updateHocVienDuyet = async (data = {}) => {
    const response = await axios.patch(
        `${baseURL}/hoc-vien-duyet/${data.ma_dk}/${data.loai_duyet}`,
        data
    );
    return response.data;
};