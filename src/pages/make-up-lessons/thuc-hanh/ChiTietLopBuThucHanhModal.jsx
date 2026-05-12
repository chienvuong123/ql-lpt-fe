import React, { useState, useEffect, useMemo } from "react";
import { Modal, Table, Tag, message, Space, Image, Typography, Button } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { getChiTietLopBuThucHanh } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { renderTrangThaiHocBu, renderTrangThaiThucHanh } from "../../../constants/hocBuConstants";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import HocVienInfo from "../../../components/HocVienInfor";

const { Text } = Typography;

const ChiTietLopBuThucHanhModal = ({ visible, maKhoaBu, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchData = async (maKhoa) => {
        setLoading(true);
        try {
            const res = await getChiTietLopBuThucHanh(maKhoa);
            // The response structure is likely { success: true, data: [...] }
            const resultList = res?.data || res || [];
            setData(Array.isArray(resultList) ? resultList : []);
        } catch (error) {
            message.error("Lỗi khi tải dữ liệu chi tiết lớp học bù thực hành.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!visible || !maKhoaBu) {
            return;
        }
        const timer = setTimeout(() => fetchData(maKhoaBu), 300);
        return () => clearTimeout(timer);
    }, [visible, maKhoaBu]);

    const handleOpenDetail = (record) => {
        setSelectedStudent(record);
        setDetailDrawerOpen(true);
    };

    const columns = useMemo(() => [
        {
            title: "#",
            key: "stt",
            width: 45,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Học viên",
            key: "hoc_vien",
            width: 260,
            fixed: "left",
            render: (_, record) => <HocVienInfo record={record} />,
        },
        {
            title: "CCCD",
            key: "cccd",
            width: 120,
            align: "center",
            render: (_, record) => record.cccd || "-",
        },
        {
            title: "Ngày sinh",
            key: "ngay_sinh",
            width: 100,
            align: "center",
            render: (_, record) => {
                const date = record.ngay_sinh;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Khóa",
            key: "ten_khoa",
            width: 90,
            align: "center",
            render: (_, record) => record.khoa || record.ten_khoa || "-",
        },
        {
            title: "Giáo viên",
            key: "thay_giao",
            width: 200,
            render: (_, record) => record.giao_vien || record.thay_giao || "-",
        },
        {
            title: "Cabin",
            key: "cabin_status",
            width: 100,
            align: "center",
            render: (_, record) => {
                const cabin = record.cabinSummary;
                const isPass = (cabin?.tong_bai || 0) >= 8 && (cabin?.tong_thoi_gian || 0) >= 150;
                return (
                    <Tag color={isPass ? "green" : "red"} className="!m-0 !text-center">
                        {isPass ? "Đạt" : "Chưa đạt"}
                    </Tag>
                );
            },
        },
        {
            title: "Km đã học",
            key: "tong_quang_duong",
            width: 100,
            align: "center",
            render: (_, record) => {
                const km = record.datSummary?.tong_quang_duong || 0;
                return <span className="font-medium ">{km} km</span>;
            },
        },
        {
            title: "Thời gian học",
            key: "tong_thoi_gian",
            width: 100,
            align: "center",
            render: (_, record) => {
                const duration = record.datSummary?.tong_thoi_gian || "-";
                return <span className="font-medium">{duration}</span>;
            },
        },
        {
            title: "Trạng thái",
            key: "trang_thai",
            align: "center",
            width: 140,
            render: (_, record) => renderTrangThaiHocBu(record.trang_thai),
        },
        {
            title: "Trạng thái TH",
            key: "trang_thai_thuc_hanh",
            align: "center",
            width: 140,
            render: (_, record) => renderTrangThaiThucHanh(record.trang_thai_thuc_hanh, "dat"),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Button
                    type="primary"
                    className="!bg-[#3366cc]"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => handleOpenDetail(record)}
                />
            ),
        },
    ], []);

    return (
        <>
            <Modal
                title={`Chi tiết lớp học bù thực hành: ${maKhoaBu || ""}`}
                open={visible}
                onCancel={onCancel}
                footer={null}
                width={1600}
                centered
                destroyOnClose={true}
                afterClose={() => setData([])}
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey={(record) => record.id || record.ma_dk}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                        showSizeChanger: true,
                    }}
                    size="small"
                    bordered
                    scroll={{ x: 1500 }}
                    className="table-blue-header"
                />
            </Modal>

            <StudentMakeUpDetailDrawer
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                student={selectedStudent}
            />
        </>
    );
};

export default React.memo(ChiTietLopBuThucHanhModal);
