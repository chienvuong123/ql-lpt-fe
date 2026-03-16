import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/lich-su-thay-doi`;

export const loggerApi = async () => {
  const response = await axios.get(url);
  return response.data;
};
