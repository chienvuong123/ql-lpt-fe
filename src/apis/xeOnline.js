import { apiClient } from "./clientApi";

export const LoTringOnline = async (params) => {
  return apiClient({
    method: "get",
    url: "/xeOnline",
    params,
  });
};
