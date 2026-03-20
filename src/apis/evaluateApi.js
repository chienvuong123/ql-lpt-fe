import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/evaluate-hanh-trinh`;
const urlOne = `${baseURL}/hanh-trinh/evaluate-one`;

export const danhSachDashboardDAT = async (params = {}) => {
  const response = await axios.post(url, params);
  return response.data;
};

export const evaluateOne = async (params = {}) => {
  const response = await axios.post(urlOne, params);
  return response.data;
};
