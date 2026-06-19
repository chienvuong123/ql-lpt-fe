import axios from "axios";
import { baseURL } from "../constants/base";

export const getTienDoChiTietDaoTao = async (params) => {
    const response = await axios.get(`${baseURL}/tien-do-dao-tao/chi-tiet`, {
        params,
    });
    return response.data;
}
