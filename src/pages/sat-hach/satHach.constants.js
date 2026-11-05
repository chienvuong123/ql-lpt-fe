import dayjs from "dayjs";

export const PHAN_THI = [
    { key: "ly_thuyet", label: "Lý thuyết", short: "LT", color: "#2f6fed" },
    { key: "sa_hinh", label: "Sa hình", short: "Hình", color: "#16a34a" },
    { key: "duong_truong", label: "Đường trường", short: "Đường", color: "#f59e0b" },
];

// Trạng thái từng phần thi (backend: satHach.service TRANG_THAI)
export const TRANG_THAI_PHAN = {
    DAT: { label: "Đạt", color: "success" },
    TRUOT: { label: "Trượt", color: "error" },
    CHUA_THI: { label: "Chưa thi", color: "warning" },
    DUNG_THI: { label: "Dừng thi", color: "default" },
    KHONG_THI: { label: "Không thi", color: "default" },
    BAO_LUU: { label: "Bảo lưu", color: "processing" },
};

// Định danh học viên: CCCD (mã đăng ký nếu không có CCCD)
export const idThiSinh = (r) => r?.so_cmt || r?.ma_dk;

export const KET_QUA = {
    DAT: { label: "Đạt", color: "#16a34a", tag: "success" },
    TRUOT: { label: "Trượt", color: "#dc2626", tag: "error" },
    CHUA_HOAN_THANH: { label: "Chưa hoàn thành", color: "#f59e0b", tag: "warning" },
};

export const formatDate = (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "");

export const formatSbd = (v) => (v == null ? "" : String(v).padStart(3, "0"));

export const diemText = (key, phan) => {
    if (!phan || phan.diem == null) return "";
    if (key === "duong_truong") return `${phan.diem}/${phan.diem_toi_da ?? 100}`;
    return String(phan.diem);
};

// So khớp không dấu cho ô tìm kiếm
export const boDau = (s) =>
    (s || "")
        .toString()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
