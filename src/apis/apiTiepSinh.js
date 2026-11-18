import axios from "axios";
import { baseURL } from "../constants/base";

const api = axios.create({ baseURL: `${baseURL}/tiep-sinh` });

// Gửi tên người thao tác để lưu lịch sử hồ sơ
api.interceptors.request.use((config) => {
  const name = sessionStorage.getItem("name") || sessionStorage.getItem("username");
  if (name) config.headers["X-User-Name"] = encodeURIComponent(name);
  return config;
});

const unwrap = (p) => p.then((r) => r.data);

export const getThongKeTiepSinh = (params) => unwrap(api.get("/thong-ke", { params }));
export const getDanhSachHoSo = (params) => unwrap(api.get("/ho-so", { params }));
export const getChiTietHoSo = (id) => unwrap(api.get(`/ho-so/${id}`));
export const taoHoSo = (body) => unwrap(api.post("/ho-so", body));
export const capNhatHoSo = (id, body) => unwrap(api.put(`/ho-so/${id}`, body));
export const xoaHoSo = (id) => unwrap(api.delete(`/ho-so/${id}`));
export const capNhatAnhHoSo = (id, anh) => unwrap(api.put(`/ho-so/${id}/anh`, { anh }));
export const duyetHoSo = (id) => unwrap(api.post(`/ho-so/${id}/duyet`));
export const traBoSungHoSo = (id, ly_do) => unwrap(api.post(`/ho-so/${id}/tra-bo-sung`, { ly_do }));
export const moLaiHoSo = (id) => unwrap(api.post(`/ho-so/${id}/mo-lai`));
export const ghiNhanInHoSo = (id) => unwrap(api.post(`/ho-so/${id}/in`));
export const getCauHinhTiepSinh = () => unwrap(api.get("/cau-hinh"));
export const luuCauHinhTiepSinh = (body) => unwrap(api.put("/cau-hinh", body));
export const dongBoGoogleSheetTiepSinh = (body) => unwrap(api.post("/dong-bo-google-sheet", body));
/** OCR ảnh CCCD (tối đa 2 ảnh) -> { data, text, do_tin_cay } */
export const ocrAnhCccd = (files) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return unwrap(api.post("/ocr-cccd", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 }));
};

export const importExcelTiepSinh = (file, tu_ngay) => {
  const fd = new FormData();
  fd.append("file", file);
  if (tu_ngay) fd.append("tu_ngay", tu_ngay);
  return unwrap(api.post("/import-excel", fd, { headers: { "Content-Type": "multipart/form-data" } }));
};

export const errMsg = (err, fallback = "Có lỗi xảy ra") =>
  err?.response?.data?.message || err?.message || fallback;
