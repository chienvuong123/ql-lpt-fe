import axios from "axios";
// Cấu hình baseURL KHÔNG có dấu / ở cuối
const baseURL = "https://lapphuongthanh.netlify.app/api/Login";

export const DangNhap = async (data) => {
  // const url = "http://113.160.131.3:7782/api/Login";
  const url = baseURL;
  const response = await axios.post(url, data);
  return response;
};

export const DangNhapLopLyThuyet = async () => {
  const session_id = crypto.randomUUID();

  sessionStorage.setItem("session_id", session_id);

  const data = new URLSearchParams({
    lname: "gv05",
    pass: "lpt12345",
    _sand_domain: "lapphuongthanh",
    _sand_web_url: "https://lapphuongthanh.huelms.com/admin/enrolment-plan",
    _sand_session_id: session_id,
  });
  const url = "https://staging-api.lotuslms.com/user/login";

  const response = await axios.post(url, data);
  const result = response?.data?.result;

  if (result) {
    const userInfo = {
      token_lt: result.token,
      iid: result.iid,
      id: result.id,
      session_id,
    };

    sessionStorage.setItem("user_info", JSON.stringify(userInfo));
  }

  return response.data;
};
