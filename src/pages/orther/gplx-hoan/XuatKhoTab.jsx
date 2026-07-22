import React from "react";
import GplxHoanStatusTable from "./GplxHoanStatusTable";

const XuatKhoTab = ({ ngayNhanBuuDien, ngayOptions, onChangeNgayNhanBuuDien }) => (
    <GplxHoanStatusTable
        trangThai="da_xuat_kho"
        ngayNhanBuuDien={ngayNhanBuuDien}
        ngayOptions={ngayOptions}
        onChangeNgayNhanBuuDien={onChangeNgayNhanBuuDien}
    />
);

export default XuatKhoTab;
