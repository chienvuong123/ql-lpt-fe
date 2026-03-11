import axios from "axios";
import { baseURL } from "../constants/base";

const url = `${baseURL}/cabin`;

export const danhSachHocVienCaBin = async (enrolmentPlanIid, params = {}) => {
  const response = await axios.get(`${url}/hoc-vien/${enrolmentPlanIid}`, {
    params,
  });
  return response.data;
};
