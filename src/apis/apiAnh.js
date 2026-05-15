import axios from "axios";
import { baseURLAnh } from "../constants/base";

export const getAnh = async (ma_dk) => {
    const response = await axios.get(`${baseURLAnh}/images/${ma_dk}`);
    return response.data;
};