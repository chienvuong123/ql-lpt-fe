import axios from "axios";

const baseURL = "https://lapphuongthanh.io.vn/api";

export const getDuLieuCabin = async (maDK) => {
  try {
    const response = await axios.get(`${baseURL}/thongtintap`, {
      params: {
        maDK: maDK,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    throw error;
  }
};
