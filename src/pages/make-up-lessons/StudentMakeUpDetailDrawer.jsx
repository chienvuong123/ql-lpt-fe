import React from "react";
import {
    Drawer,
    Tabs,
    Image,
    Typography,
    Tag,
    Empty,
    Table,
    Space,
    Divider,
    Button,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRankCabinLesson, formatSecondsToTime } from "../../util/helper";

const { Text, Title } = Typography;

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
            title: "Ngày đào tạo",
            dataIndex: "ThoiDiemDangNhap",
            width: 100,
            align: "center",
            render: (v) => dayjs(v).format("DD/MM/YYYY")
        },
        {
            title: "Phiên học",
            width: 110,
            align: "center",
            render: (_, record) => {
                const start = dayjs(record.ThoiDiemDangNhap).format("HH:mm");
                const end = dayjs(record.ThoiDiemDangXuat).format("HH:mm");
                return `${start} - ${end}`;
            }
        },
        {
            title: "Giáo viên",
            dataIndex: "ho_ten_gv",
            width: 150,
            align: "center",
        },
        {
            title: "Biển số",
            dataIndex: "bien_so_xe",
            width: 70,
            align: "center",
        },
        {
            title: "Quãng đường",
            dataIndex: "tong_km",
            width: 100,
            align: "center",
            render: (v) => <span className="font-medium">{v} km</span>
        },
        {
            title: "Thời gian",
            dataIndex: "thoi_gian",
            width: 100,
            align: "center",
            render: (v) => <span className="font-medium">{formatSecondsToTime(v)}</span>
        },
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
                rowClassName={(record) => {
                    const hour = dayjs(record.ThoiDiemDangNhap).hour();
                    if (hour >= 18) return "!bg-gray-50 hover:!bg-gray-100 transition-colors cursor-default";
                    return "";
                }}
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
    const studentName = student?.ho_ten || "Học viên";
    const studentId = student?.ma_dk || "";

    const infoItems = [
        { label: "Mã", value: studentId || "-" },
        { label: "Tên", value: studentName },
        { label: "Ngày sinh", value: student?.ngay_sinh ? dayjs(student.ngay_sinh).format("DD/MM/YYYY") : "-" },
        { label: "CCCD/CMT", value: student?.cccd || "-" },
        { label: "Khóa học", value: student?.ten_khoa || "-" },
        { label: "Giáo viên", value: student?.thay_giao || "-" },
    ];

    const tabItems = [
        {
            key: "theory",
            label: "Lý thuyết",
            children: <TheoryTab data={student?.detail?.theoryInfo} />,
        },
        {
            key: "cabin",
            label: "Cabin",
            children: <CabinTab data={student?.detail?.cabinInfo} />,
        },
        {
            key: "dat",
            label: "DAT",
            children: <DatTab data={student?.detail?.datInfo} />,
        },
    ];

    return (
        <Drawer
            title={
                <div className="text-gray-600 font-medium text-md mx-[-24px] px-[36px]">
                    {studentName.toUpperCase()}
                </div>
            }
            placement="right"
            onClose={onClose}
            open={open}
            width={900}
            destroyOnClose
            closable={false}
            extra={
                <div
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-400 cursor-pointer hover:bg-gray-500 transition-colors"
                    onClick={onClose}
                >
                    <CloseOutlined className="!text-white text-[10px]" />
                </div>
            }
        >
            {student && (
                <div className="">
                    {/* Header Title */}
                    <Title level={4} className="!mb-6 !text-gray-700 !font-semibold">
                        {studentName.toUpperCase()} (#{studentId})
                    </Title>

                    {/* Profile Info Section */}
                    <div className="flex flex-row gap-10 mb-8 border-b border-gray-200 pb-8">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <Image
                                    src={student.anh}
                                    alt="avatar"
                                    className="!w-48 !h-48 rounded-full object-cover border-4 border-white shadow-sm"
                                    fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
                                />
                            </div>
                        </div>

                        <div className="flex-grow">
                            <div className="flex flex-col gap-y-0">
                                {infoItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-baseline">
                                        <Text className="text-gray-400 min-w-[120px] text-[13px]">{item.label}:</Text>
                                        <Text strong className="text-gray-700 text-[13px]">{item.value}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <Tabs
                        defaultActiveKey="theory"
                        items={tabItems}
                        className="theory-tabs"
                    />
                </div>
            )}
        </Drawer>
    );
};


export default StudentMakeUpDetailDrawer;
