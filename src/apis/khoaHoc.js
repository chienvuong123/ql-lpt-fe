import axios from "axios";
import { buildParams } from "../util/helper";
import { apiClient } from "./clientApi";
import { DangNhapLopLyThuyet } from "./auth";

export const danhSachKhoaHoc = async (params) => {
  return axios.get("http://localhost:3000/api/courses", { params });
};

export const importCourses = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("http://localhost:3000/api/courses/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const sourceOptions = async () => {
  return axios.get("http://localhost:3000/api/courses/options");
};

export const courseOptions = async (params) => {
  return apiClient({
    method: "get",
    url: "/course",
    params,
  });
};

export const lopHocLyThuyet = async (login, searchParams = {}) => {
  const callApi = async (loginData) => {
    const session_id = sessionStorage.getItem("session_id");

    const query = buildParams({
      ...searchParams,
      _sand_session_id: session_id,
      _sand_token: loginData?.token,
      _sand_uid: loginData?.organizations?.[0]?.id,
      _sand_uiid: loginData?.iid,
    });

    const response = await axios.post(
      `https://staging-api.lotuslms.com/enrolment-plan/search?${query}`,
    );

    return response.data;
  };

  let result = await callApi(login);

  if (
    result?.message === "token_invalid" ||
    result?.err_code === 402 ||
    result?.is_guest
  ) {
    const loginResponse = await DangNhapLopLyThuyet();
    const newLogin = loginResponse?.result;

    result = await callApi(newLogin);
  }

  return result;
};
