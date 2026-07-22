import React from "react";
import GplxHoanStatusTable from "./GplxHoanStatusTable";

const ChoNhapKhoTab = ({ ngayNhanBuuDien, ngayOptions, onChangeNgayNhanBuuDien, active }) => (
    <GplxHoanStatusTable
        trangThai="cho_nhap_kho"
        ngayNhanBuuDien={ngayNhanBuuDien}
        ngayOptions={ngayOptions}
        onChangeNgayNhanBuuDien={onChangeNgayNhanBuuDien}
        scannable
        active={active}
    />
);

export default ChoNhapKhoTab;
