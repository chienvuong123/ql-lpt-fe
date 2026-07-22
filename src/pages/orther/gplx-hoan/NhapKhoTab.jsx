import React from "react";
import GplxHoanStatusTable from "./GplxHoanStatusTable";

const NhapKhoTab = ({ ngayNhanBuuDien, ngayOptions, onChangeNgayNhanBuuDien, active }) => (
    <GplxHoanStatusTable
        trangThai="da_nhap_kho"
        ngayNhanBuuDien={ngayNhanBuuDien}
        ngayOptions={ngayOptions}
        onChangeNgayNhanBuuDien={onChangeNgayNhanBuuDien}
        scannable
        active={active}
    />
);

export default NhapKhoTab;
