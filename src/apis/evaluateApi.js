import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/evaluate-hanh-trinh`;

export const danhSachDashboardDAT = async (params = {}) => {
  const response = await axios.post(url, params);
  return response.data;
};
