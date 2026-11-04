import { Tooltip } from "antd";
import {
    CheckOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    ClockCircleFilled,
    ClockCircleOutlined,
    MinusCircleOutlined,
    StopOutlined,
} from "@ant-design/icons";
import { KET_QUA, TRANG_THAI_PHAN, diemText } from "./satHach.constants";

// Màu theo mẫu thiết kế: Đạt chữ xanh lá không nền, Trượt chữ đỏ trên nền đỏ nhạt, Chưa thi chữ xám
const PHAN_STYLE = {
    DAT: { color: "#16a34a", background: "transparent", icon: <CheckOutlined /> },
    TRUOT: { color: "#dc2626", background: "#fee2e2", icon: <CloseCircleFilled /> },
    CHUA_THI: { color: "#6b7280", background: "transparent", icon: <ClockCircleOutlined /> },
    DUNG_THI: { color: "#9ca3af", background: "transparent", icon: <StopOutlined /> },
    KHONG_THI: { color: "#d1d5db", background: "transparent", icon: <MinusCircleOutlined /> },
};

// Kết quả chung: viên thuốc nền đặc, chữ trắng
const KET_QUA_STYLE = {
    DAT: { background: "#16a34a", icon: <CheckCircleFilled /> },
    TRUOT: { background: "#ef4444", icon: <CloseCircleFilled /> },
    CHUA_HOAN_THANH: { background: "#f59e0b", icon: <ClockCircleFilled /> },
};

export const PhanThiTag = ({ phanKey, phan }) => {
    const trangThai = phan?.trang_thai || "KHONG_THI";
    if (trangThai === "KHONG_THI") return <span style={{ color: PHAN_STYLE.KHONG_THI.color }}>—</span>;
    const st = TRANG_THAI_PHAN[trangThai];
    const style = PHAN_STYLE[trangThai];
    const diem = diemText(phanKey, phan);
    const tip = phan?.diem != null
        ? `Điểm: ${diem}${phan.diem_dat != null ? ` — điểm đạt: ${phan.diem_dat}` : ""}`
        : st.label;
    return (
        <Tooltip title={tip}>
            <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[13px] font-medium whitespace-nowrap"
                style={{ color: style.color, background: style.background }}
            >
                {style.icon}
                {st.label}
                {diem && <span className="text-xs font-normal opacity-75">· {diem}</span>}
            </span>
        </Tooltip>
    );
};

export const KetQuaTag = ({ value }) => {
    const key = KET_QUA[value] ? value : "CHUA_HOAN_THANH";
    const style = KET_QUA_STYLE[key];
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[13px] font-semibold text-white whitespace-nowrap"
            style={{ background: style.background }}
        >
            {style.icon}
            {KET_QUA[key].label}
        </span>
    );
};
