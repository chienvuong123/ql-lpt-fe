import { Tag } from "antd";
import { TRANG_THAI_HOC_BU_MAP, TRANG_THAI_LY_THUYET_MAP, TRANG_THAI_THUC_HANH_MAP } from ".";

export const renderTrangThaiHocBu = (value) => {
    const item = TRANG_THAI_HOC_BU_MAP[value];
    return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag color="default">-</Tag>;
};

export const renderTrangThaiThucHanh = (value, loaiThucHanh) => {
    const item = TRANG_THAI_THUC_HANH_MAP[value];
    if (!item) return <Tag color="default">-</Tag>;

    // Với trạng thái 1, 2 thì hiển thị kèm loại cabin/dat
    if (value === 1 || value === 2) {
        const loaiLabel = loaiThucHanh === "dat" ? "DAT" : "Cabin";
        return <Tag color={item.color}>{`${item.label} ${loaiLabel}`}</Tag>;
    }

    return <Tag color={item.color}>{item.label}</Tag>;
};

export const renderTrangThaiLyThuyet = (value) => {
    const item = TRANG_THAI_LY_THUYET_MAP[value];
    return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag color="default">-</Tag>;
};