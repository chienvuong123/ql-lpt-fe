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

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 300;
