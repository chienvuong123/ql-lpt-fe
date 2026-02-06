import axios from "axios";

export const DangNhap = async (data) => {
  const url = "http://113.160.131.3:7782/api/Login";
  const response = await axios.post(url, data);
  return response;
};
