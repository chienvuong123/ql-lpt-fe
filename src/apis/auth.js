import axios from "axios";
// Cấu hình baseURL KHÔNG có dấu / ở cuối

export const DangNhap = async (data) => {
  const url = "http://113.160.131.3:7782/api/Login";
  const response = await axios.post(url, data);
  return response;
};

const randomTeacherAccount = () => {
  const accounts = ["gv03", "gv04", "gv05"];
  const randomIndex = Math.floor(Math.random() * accounts.length);
  return accounts[randomIndex];
};

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DangNhapLopLyThuyet = async () => {
  let session_id = sessionStorage.getItem("session_id");

  if (!session_id) {
    session_id =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : generateUUID();
    sessionStorage.setItem("session_id", session_id);
  }

  const username = randomTeacherAccount();

  const data = new URLSearchParams({
    lname: username,
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
