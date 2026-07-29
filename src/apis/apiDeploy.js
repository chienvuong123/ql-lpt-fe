import axios from "axios";

const baseURL = "https://lapphuongthanh.netlify.app/api";
const APP_URL = "https://lapphuongthanh.netlify.app";
let isSessionExpiredDialogShown = false;

const api = axios.create({
  baseURL: baseURL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiLocal = axios.create({
  baseURL: `${APP_URL}/api-local`,
  timeout: 50000,
  headers: { "Content-Type": "application/json" },
});

export const apiNew = axios.create({
  baseURL: `${APP_URL}/api-new`,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiNew.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-public-new");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token-public");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const isInvalidSessionResponse =
      response?.status === 200 &&
      response?.data?.success === false &&
      (response?.data?.message === "token_invalid" ||
        Number(response?.data?.err_code) === 402);

    if (isInvalidSessionResponse && !isSessionExpiredDialogShown) {
      isSessionExpiredDialogShown = true;
      localStorage.removeItem("token-public");
      const shouldReload = window.confirm(
        "Phiên làm việc đã kết thúc. Nhấn OK để tải lại trang.",
      );
      if (shouldReload) {
        window.location.reload();
      }
      isSessionExpiredDialogShown = false;
    }

    return response;
  },
  (error) => Promise.reject(error),
);

export const DangNhapPublic = async (data, isNewCourse = false) => {
  const response = await api.post("/Login", data);

  if (response.data && response.data.Token) {
    const tokenKey = isNewCourse ? "token-public-new" : "token-public";
    localStorage.setItem(tokenKey, response.data.Token);
  }

  return response;
};

export const HanhTrinhPublic = async (params, isNewCourse = false) => {
  const client = isNewCourse ? apiNew : api;
  return client({
    method: "get",
    url: "/HanhTrinh",
    params,
  });
};

export const DanhSachHocVienDeploy = async (params) => {
  return api({
    method: "get",
    url: "/HocVienTH",
    params,
  });
};

export const LoTringOnlinePublic = async (params) => {
  return api({
    method: "get",
    url: "/xeOnline",
    params,
  });
};


const url = "https://api-v2.lapphuongthanh.io.vn/api/";

export const getChiTietHocVienLyThuyetPublic = async (maDk) => {
  const response = await axios.get(`${url}hoc-vien-lop-ly-thuyet/${maDk}`);
  return response.data;
};

export const fetchCheckStudentsPublic = async (params = {}) => {
  const response = await axios.get(`${url}check-data-student/`, { params });
  return response.data;
};

export const getPhienHocDATPublic = async (maHocVien) => {
  const response = await axios.get(`${url}phien-hoc-dat/${maHocVien}`);

  return response.data;
};

export const hocVienKyDATPublic = async (maHocVien) => {
  const response = await axios.get(`${url}ky-dat/${maHocVien}`);

  return response.data;
};

export const hocVienTheoKhoaPublic = async (enrolmentPlanIid, params) => {
  const response = await axios.get(
    `${url}ly-thuyet/hoc-vien/${enrolmentPlanIid}`,
    {
      params,
    },
  );
  return response.data;
};

export const ketQuaKiemTraPublic = async (enrolmentPlanIid, params = {}) => {
  const response = await axios.get(`${url}ly-thuyet/hoc-vien/khoa/${enrolmentPlanIid}`, {
    params,
  });
  return response.data;
};

export const optionLopLyThuyetPublic = async () => {
  const response = await axios.get(`${url}ly-thuyet/lop-hoc`);
  return response.data;
};

export const getTienDoDaoTaoByMaHocVienSqlDeploy = async (params = {}) => {
  const response = await axios.get(`${url}tien-do-dao-tao`, { params });
  return response.data
};

export const getCheckConfigsPublic = async () => {
  const response = await axios.get(`${url}check-configs`);
  return response;
};

export const getLichSuDuyetPhienHocPublic = async (ma_dk) => {
  const response = await axios.get(`${url}phien-hoc-duyet/${ma_dk}`);
  return response.data;
};

export const getHocVienDuyetPublic = async (ma_dk) => {
  const response = await axios.get(`${url}hoc-vien-duyet/${ma_dk}`);
  return response.data;
};

export const searchHocVienDatPublic = async (params = {}) => {
  const response = await axios.get(`${url}hoc-vien/search`, { params });
  return response.data;
};

export const getHocVienByMaKhoaSqlPublic = async (params = {}) => {
  const response = await axios.get(`${url}sync/students`, { params });
  return response.data;
};

// Tìm kiếm học viên khóa MỚI (từ K26B014 trở đi) qua hệ thống DAT (soCmt nhận cả tên hoặc CMT).
// Dùng tài khoản MỚI (MaCSDT 31011) — cùng host với /api nhưng khác tenant nên phải qua apiNew.
export const searchHocVienTHPublic = async (params = {}) => {
  const response = await apiNew.get("/HocVienTH", { params });
  return response.data;
};

// Danh sách khóa học bên hệ thống DAT (tenant MỚI) — dùng để lấy ID khóa (idkhoahoc) khi tìm học viên khóa mới
export const getKhoaHocListPublic = async (params = {}) => {
  const response = await apiNew.get("/course", { params });
  return response.data;
};
