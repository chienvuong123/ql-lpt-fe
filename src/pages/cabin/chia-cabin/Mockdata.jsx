import dayjs from "dayjs";

export const CABINS = [
  { id: 1, name: "Cabin A", color: "#6366f1" },
  { id: 2, name: "Cabin B", color: "#f59e0b" },
  { id: 3, name: "Cabin C", color: "#10b981" },
  { id: 4, name: "Cabin D", color: "#ef4444" },
  { id: 5, name: "Cabin E", color: "#8b5cf6" },
];

// 5 ca học từ 7h đến 22h, mỗi ca 2h30p
export const ALL_SLOTS = [
  { id: 1, label: "Ca 1", start: "07:00", end: "09:30" },
  { id: 2, label: "Ca 2", start: "09:30", end: "12:00" },
  { id: 3, label: "Ca 3", start: "12:00", end: "14:30" },
  { id: 4, label: "Ca 4", start: "14:30", end: "17:00" },
  { id: 5, label: "Ca 5", start: "17:00", end: "19:30" },
];

// Fake danh sách học viên
const NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Bình",
  "Lê Văn Cường",
  "Phạm Thị Dung",
  "Hoàng Văn Em",
  "Vũ Thị Phương",
  "Đặng Văn Giang",
  "Bùi Thị Hoa",
  "Đỗ Văn Inh",
  "Ngô Thị Kim",
  "Lý Văn Long",
  "Trịnh Thị Mai",
  "Phan Văn Nam",
  "Đinh Thị Oanh",
  "Cao Văn Phúc",
  "Dương Thị Quyên",
  "Lưu Văn Rồng",
  "Tô Thị Sương",
  "Mai Văn Tuấn",
  "Hồ Thị Uyên",
  "Võ Văn Vinh",
  "Tạ Thị Xuân",
  "Châu Văn Yên",
  "Kiều Thị Zoa",
  "Trương Văn Anh",
  "Nghiêm Thị Ba",
  "Quách Văn Công",
  "Lương Thị Diệu",
  "Đoàn Văn Đức",
  "Cù Thị Ếch",
  "Mạc Văn Phong",
  "Thái Thị Gấm",
  "La Văn Hùng",
  "Hứa Thị Iris",
  "Bạch Văn Kiên",
];

export const generateStudents = (count = 35) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `SV${String(i + 1).padStart(3, "0")}`,
    name: NAMES[i % NAMES.length],
    phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
    course: ["Tiếng Anh Giao Tiếp", "IELTS", "TOEIC", "Tiếng Anh Thiếu Nhi"][
      i % 4
    ],
    registeredAt: dayjs()
      .subtract(Math.floor(Math.random() * 30), "day")
      .format("DD/MM/YYYY"),
    status: "pending", // pending = chưa xếp lịch
  }));
};

// Config mặc định
export const DEFAULT_DAY_CONFIG = {
  activeSlotsCount: 5, // số ca hoạt động trong ngày
  cutoffSlot: 5, // Ca cuối cùng nhận học viên, sau đó đẩy sang ngày mai
};
