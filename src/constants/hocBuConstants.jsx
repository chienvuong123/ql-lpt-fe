import { Tag } from "antd";
import { TRANG_THAI_HOC_BU_MAP, TRANG_THAI_THUC_HANH_MAP } from ".";

export const renderTrangThaiHocBu = (value) => {
    const item = TRANG_THAI_HOC_BU_MAP[value];
    return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag color="default">-</Tag>;
};

export const renderTrangThaiThucHanh = (value) => {
    const item = TRANG_THAI_THUC_HANH_MAP[value];
    return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag color="default">-</Tag>;
};