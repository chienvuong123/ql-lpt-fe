import { Tag } from "antd";

export const LICENSE_PLATE_TYPE = {
  AUTO: ["B1", "B11"],
  MANUAL: ["B2", "B01", "B", "C1"],
};

export const LICENSE_PLATE_LABEL = {
  B1: "B số tự động",
  B11: "B số tự động",
  B2: "B số sàn",
  B01: "B01 số sàn",
  B: "B số sàn",
  C1: "C số sàn",
};

export const MIN_REST_MINUTES = 15;

export const ROLE_OPTIONS = [
  { label: 'Quản trị hệ thống', value: 1 },
  { label: 'Trưởng phòng đào tạo', value: 2 },
  { label: 'Tổ nghiệp vụ đào tạo', value: 3 },
  { label: 'Tổ lý thuyết', value: 4 },
  { label: 'Tổ thực hành', value: 5 },
  { label: 'Tổ công nghệ', value: 6 },
  { label: 'Tổ tốt nghiệp', value: 7 },
  { label: 'Tổ sát hạch', value: 8 },
]

export const TRANG_THAI_HOC_BU_MAP = {
  1: { color: "orange", label: "Chờ duyệt LT" },
  2: { color: "blue", label: "Chờ xếp lớp LT" },
  3: { color: "cyan", label: "Đang học LT" },
  4: { color: "purple", label: "Chờ duyệt TH" },
  5: { color: "geekblue", label: "Chờ xếp lớp TH" },
  6: { color: "green", label: "Đang học TH" },
  7: { color: "success", label: "Hoàn thành" },
};

export const TRANG_THAI_THUC_HANH_MAP = {
  1: { color: "orange", label: "Chờ duyệt" },
  2: { color: "blue", label: "Đã duyệt" },
  3: { color: "green", label: "Đang học thực hành" },
  4: { color: "success", label: "Hoàn thành thực hành" },
};

export const TRANG_THAI_LY_THUYET_MAP = {
  1: { color: "orange", label: "Chờ duyệt lý thuyết" },
  2: { color: "blue", label: "Đã duyệt lý thuyết" },
  3: { color: "green", label: "Đang học lý thuyết" },
  4: { color: "success", label: "Hoàn thành lý thuyết" },
};
