import React from "react";
import {
    Drawer,
    Tabs,
    Image,
    Descriptions,
    Typography,
    Tag,
    Empty,
    Table,
    Card,
    Space,
    Divider,
    Button,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRankCabinLesson } from "../../util/helper";

const { Text } = Typography;

const TheoryTab = ({ data }) => {
    if (!data) return <Empty description="Chưa có dữ liệu lý thuyết" />;

    return (
        <div className="p-4 bg-white border rounded-lg">
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Đủ điều kiện dự thi lý thuyết:</span>
                        <Tag color={data.loai_ly_thuyet ? "green" : "red"} className="m-0">
                            {data.loai_ly_thuyet ? "ĐẠT" : "CHƯA ĐẠT"}
                        </Tag>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-gray-600">Trạng thái thi hết môn:</span>
                        <Tag color={data.loai_het_mon ? "green" : "red"} className="m-0">
                            {data.loai_het_mon ? "ĐÃ HOÀN THÀNH" : "CHƯA HOÀN THÀNH"}
                        </Tag>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs uppercase font-semibold mb-1">Ghi chú lý thuyết</span>
                    <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800">
                        {data.ghi_chu || "Chưa có ghi chú chi tiết."}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CabinTab = ({ data }) => {
    if (!data) return <Empty description="Chưa có dữ liệu Cabin" />;

    const columns = [
        {
            title: "#",
            width: 50,
            align: "center",
            render: (_, __, i) => i + 1
        },
        {
            title: "Tên bài tập",
            dataIndex: "ten_bai",
            key: "ten_bai",
        },
        {
            title: "Tổng phút",
            dataIndex: "tong_phut",
            key: "tong_phut",
            width: 120,
            align: "center",
            render: (v) => <span className="font-medium">{v} phút</span>
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 120,
            align: "center",
            render: (_, record) => {
                const isPass = (record.tong_phut || 0) > 0;
                return (
                    <Tag
                        color={isPass ? "green" : "red"}
                        className="m-0"
                        icon={isPass ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >

                        <span className="font-medium">{isPass ? "Đạt" : "Chưa đạt"}</span>
                    </Tag>
                );
            }
        }
    ];

    const sortedDetails = React.useMemo(() => {
        if (!data.cabinDetails) return [];
        return [...data.cabinDetails].sort((a, b) => {
            return getRankCabinLesson(a.ten_bai) - getRankCabinLesson(b.ten_bai);
        });
    }, [data.cabinDetails]);

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                <div>
                    <span className="text-gray-500">Tổng số bài:</span>
                    <span className="ml-2 font-bold">{data.tong_bai}/8</span>
                </div>
                <div>
                    <span className="text-gray-500">Tổng thời gian:</span>
                    <span className="ml-2 font-bold">{data.tong_thoi_gian} phút</span>
                </div>
                <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="ml-2 font-bold text-gray-800">
                        {data.tong_bai >= 8 && data.tong_thoi_gian >= 150 ? "Đạt" : "Chưa đạt"}
                    </span>
                </div>
            </div>
            <Table
                dataSource={sortedDetails}
                columns={columns}
                pagination={false}
                size="small"
                bordered
                className="table-blue-header"
            />
        </div>
    );
};

const DatTab = ({ data }) => {
    if (!data) return <Empty description="Chưa có dữ liệu DAT" />;

    const sessions = data.datDetails?.sessions || [];
    const summary = data.datDetails?.summary || {};

    const columns = [
        {
            title: "#",
            width: 35,
            align: "center",
            render: (_, __, i) => i + 1
        },
        {
            title: "Thời điểm đăng nhập",
            dataIndex: "ThoiDiemDangNhap",
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm:ss")
        },
        {
            title: "Thời điểm đăng xuất",
            dataIndex: "ThoiDiemDangXuat",
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm:ss")
        },
        {
            title: "Giao viên",
            dataIndex: "HoTenGV",
            width: 100,
            align: "center",
        },
        {
            title: "Biển số",
            dataIndex: "BienSo",
            width: 100,
            align: "center",
        },
        {
            title: "Quãng đường",
            dataIndex: "TongQuangDuong",
            width: 120,
            align: "center",
            render: (v) => <span className="text-blue-600 font-medium">{v} km</span>
        },
        {
            title: "Thời gian",
            dataIndex: "TongThoiGian",
            width: 120,
            align: "center",
            render: (v) => <span className="text-blue-600 font-medium">{v} phút</span>
        },
        {
            title: "Trạng thái",
            dataIndex: "TrangThai",
            width: 120,
            align: "center",
            render: (v) => (
                <Tag color={v === "DA_DUYET" ? "green" : "orange"}>
                    {v === "DA_DUYET" ? "Đã duyệt" : "Chờ duyệt"}
                </Tag>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                <div>
                    <span className="text-gray-500">Tổng quãng đường:</span>
                    <span className="ml-2 font-bold">{data.tong_quang_duong} km</span>
                </div>
                <div>
                    <span className="text-gray-500">Tổng thời gian:</span>
                    <span className="ml-2 font-bold">{data.tong_thoi_gian}</span>
                </div>
                <div>
                    <span className="text-gray-500">Số phiên:</span>
                    <span className="ml-2 font-bold">{summary.soPhien || 0}</span>
                </div>
            </div>

            <Table
                dataSource={sessions}
                columns={columns}
                pagination={false}
                size="small"
                bordered
                className="table-blue-header"
            />

            <div className={`p-4 rounded-lg border ${summary.evaluationStatus === "pass" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold">Kết quả đánh giá:</span>
                    <Tag color={summary.evaluationStatus === "pass" ? "success" : "error"} icon={summary.evaluationStatus === "pass" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                        {summary.evaluationStatus === "pass" ? "Đạt" : "Chưa đạt"}
                    </Tag>
                </div>

                {summary.errors?.length > 0 && (
                    <div className="space-y-2">
                        <p className="font-semibold text-red-700 m-0">Lý do chưa đạt:</p>
                        <ul className="list-disc pl-5 text-red-600 space-y-1">
                            {summary.errors.map((error, idx) => (
                                <li key={idx}>
                                    <Space>
                                        <WarningOutlined />
                                        <span className="font-medium">{error.label}:</span>
                                        {error.message}
                                    </Space>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const StudentMakeUpDetailDrawer = ({ open, onClose, student }) => {
    return (
        <Drawer
            title={<span className="text-xl font-bold">Chi tiết quá trình đào tạo</span>}
            placement="right"
            onClose={onClose}
            open={open}
            width={900}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>Đóng</Button>
                </Space>
            }
        >
            {student && (
                <div className="space-y-6">
                    {/* 1. Thông tin học viên */}
                    <div className="bg-gray-50 p-4 rounded-lg flex gap-6">
                        <Image
                            src={student.anh}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover shadow-sm"
                            fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
                        />
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Họ tên">
                                    <Text strong>{student.ho_ten}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Mã ĐK">
                                    <Text strong copyable>{student.ma_dk}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="CCCD">
                                    <Text strong>{student.cccd}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Ngày sinh">
                                    <Text strong>{student.ngay_sinh ? dayjs(student.ngay_sinh).format("DD/MM/YYYY") : "-"}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Khóa học">
                                    <Text strong>{student.ten_khoa}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Giáo viên">
                                    <Text strong>{student.thay_giao}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>

                    <Divider className="!my-2" />

                    {/* 2. Tabs quá trình đào tạo */}
                    <Tabs defaultActiveKey="theory" type="card">
                        <Tabs.TabPane tab="Lý thuyết" key="theory">
                            <TheoryTab data={student.detail?.theoryInfo} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Cabin" key="cabin">
                            <CabinTab data={student.detail?.cabinInfo} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="DAT" key="dat">
                            <DatTab data={student.detail?.datInfo} />
                        </Tabs.TabPane>
                    </Tabs>
                </div>
            )}
        </Drawer>
    );
};

export default StudentMakeUpDetailDrawer;
