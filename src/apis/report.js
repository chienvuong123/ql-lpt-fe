import { apiClient } from "./clientApi";

export const exportReport = async (maDK) => {
  const url = maDK ? `/reporthvth/${maDK}` : `/reporthvth`;
  const response = await apiClient({
    method: "get",
    url,
    responseType: "blob",
  });
  return response;
};
