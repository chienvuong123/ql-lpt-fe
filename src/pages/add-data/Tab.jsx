import React from "react";
import { Tabs } from "antd";
import Xe from "./Xe";
import DangKyXeGiaoVien from "./DangKyXeGiaoVien";

const Tab = () => {
    const tabItems = [
        {
            key: "xe",
            label: <span className="text-base font-medium">Quản lý Xe</span>,
            children: <Xe />,
        },
        {
            key: "dang_ky",
            label: <span className="text-base font-medium">Đăng ký Xe & Giáo Viên</span>,
            children: <DangKyXeGiaoVien />,
        },
    ];

    return (
        <div className="p-4">
            <Tabs defaultActiveKey="xe" items={tabItems} />
        </div>
    );
};

export default Tab;
