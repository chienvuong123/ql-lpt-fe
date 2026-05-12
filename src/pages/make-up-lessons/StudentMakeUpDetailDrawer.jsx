import React, { useMemo } from "react";
import {
    Drawer,
    Tabs,
    Image,
    Typography,
    Tag,
    Empty,
    Table,
    Space,
    Spin,
    Card,
    Button,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRankCabinLesson, formatSecondsToTime } from "../../util/helper";
import { useQuery } from "@tanstack/react-query";
import { getChiTietHocVienLyThuyet } from "../../apis/apiLyThuyetLocal";
import { getDanhSachHocVienHocBuDetail } from "../../apis/apiHocbu";
import {
    computeSummary as computeSummaryHangLoat,
    evaluate as evaluateHangLoat,
    getBienSoTuDong,
    normalizePlate,
} from "../checks/DieuKienKiemTra";

const { Text, Title } = Typography;

const TheoryTab = ({ scoreByRubrik, theoryInfo }) => {
    if (!scoreByRubrik && !theoryInfo) return <Empty description="Chưa có dữ liệu lý thuyết" />;

    const columns = [
        {
            title: "#",
            width: 50,
            align: "center",
            render: (_, __, i) => i + 1
        },
        {
            title: "Tên bài",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Điểm",
            dataIndex: "score",
            key: "score",
            width: 100,
            align: "center",
            render: (v) => <span className="font-medium">{v}</span>
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 120,
            align: "center",
            render: (_, record) => {
                const isPass = record.passed === 1;
                return (
                    <Tag
                        color={isPass ? "green" : "red"}
                        className="m-0"
                        icon={isPass ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                        <span className="font-medium">{isPass ? "Đạt" : "Không đạt"}</span>
                    </Tag>
                );
            }
        }
    ];

    return (
        <div className="space-y-4">
            {theoryInfo && (
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                    <div>
                        <span className="text-gray-600">Học lý thuyết:</span>
                        <span className={`ml-2 font-bold ${theoryInfo.loai_ly_thuyet ? "text-green-600" : "text-red-500"}`}>
                            {theoryInfo.loai_ly_thuyet ? "Đạt" : "Chưa đạt"}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-600">Làm bài hết môn:</span>
                        <span className={`ml-2 font-bold ${theoryInfo.loai_het_mon ? "text-green-600" : "text-red-500"}`}>
                            {theoryInfo.loai_het_mon ? "Đạt" : "Chưa đạt"}
                        </span>
                    </div>
                    {theoryInfo.ghi_chu && (
                        <div>
                            <span className="text-gray-600">Ghi chú:</span>
                            <span className="ml-2 font-bold">{theoryInfo.ghi_chu}</span>
                        </div>
                    )}
                </div>
            )}

            {scoreByRubrik && (
                <Table
                    dataSource={scoreByRubrik.filter(item => item.name !== "Pháp luật GTĐB")}
                    columns={columns}
                    rowKey="iid"
                    pagination={false}
                    size="small"
                    bordered
                    className="table-blue-header"
                />
            )}
        </div>
    );
};

const CabinTab = ({ cabinDetails, cabinSummary }) => {
    if (!cabinDetails && !cabinSummary) return <Empty description="Chưa có dữ liệu Cabin" />;

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
        if (!cabinDetails) return [];
        return [...cabinDetails].sort((a, b) => {
            return getRankCabinLesson(a.ten_bai) - getRankCabinLesson(b.ten_bai);
        });
    }, [cabinDetails]);

    const tongBai = cabinSummary?.tong_bai || 0;
    const tongThoiGian = cabinSummary?.tong_thoi_gian || 0;

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
                <div>
                    <span className="text-gray-500">Tổng số bài:</span>
                    <span className="ml-2 font-bold">{tongBai}/8</span>
                </div>
                <div>
                    <span className="text-gray-500">Tổng thời gian:</span>
                    <span className="ml-2 font-bold">{tongThoiGian} phút</span>
                </div>
                <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="ml-2 font-bold text-gray-800">
                        {tongBai >= 8 && tongThoiGian >= 150 ? "Đạt" : "Chưa đạt"}
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

const DatTab = ({ datDetails, datSummary, student }) => {
    if (!datDetails && !datSummary) return <Empty description="Chưa có dữ liệu DAT" />;

    const sessions = datDetails?.sessions || [];
    console.log("sessions", sessions);

    const mappedSessions = useMemo(() => {
        return sessions.map(s => ({
            ThoiDiemDangNhap: s.ThoiDiemDangNhap,
            ThoiDiemDangXuat: s.ThoiDiemDangXuat,
            TongThoiGian: Number(s.TongThoiGian || 0),
            TongQuangDuong: Number(s.TongQuangDuong || 0),
            BienSo: s.BienSo,
            HoTenGV: s.HoTenGV,
            HangDaoTao: student?.HangDaoTao || student?.hang_dao_tao || student?.hang || "B1",
        }));
    }, [sessions, student]);

    const bienSoTuDong = useMemo(() => {
        return getBienSoTuDong(mappedSessions, null);
    }, [mappedSessions]);

    const summaryData = useMemo(() => {
        return computeSummaryHangLoat(mappedSessions, student?.HangDaoTao || student?.hang_dao_tao || student?.hang || "B1", null);
    }, [mappedSessions, student]);

    const evaluationData = useMemo(() => {
        if (mappedSessions.length === 0) return { status: "fail", errors: [], warnings: [] };
        return evaluateHangLoat(summaryData, mappedSessions, [], null);
    }, [summaryData, mappedSessions]);

    const allIssues = [...(evaluationData.warnings || []), ...(evaluationData.errors || [])];
    const isPass = evaluationData.status === "pass";

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
            render: (v) => v ? dayjs(v).format("DD/MM/YYYY") : "-"
        },
        {
            title: "Phiên học",
            width: 110,
            align: "center",
            render: (_, record) => {
                const start = record.ThoiDiemDangNhap ? dayjs(record.ThoiDiemDangNhap).format("HH:mm") : "-";
                const end = record.ThoiDiemDangXuat ? dayjs(record.ThoiDiemDangXuat).format("HH:mm") : "-";
                return `${start} - ${end}`;
            }
        },
        {
            title: "Giáo viên",
            dataIndex: "HoTenGV",
            width: 150,
            align: "center",
        },
        {
            title: "Biển số",
            dataIndex: "BienSo",
            width: 70,
            align: "center",
        },
        {
            title: "Quãng đường",
            dataIndex: "TongQuangDuong",
            width: 100,
            align: "center",
            render: (v) => <span className="font-medium">{v} km</span>
        },
        {
            title: "Thời gian",
            dataIndex: "TongThoiGian",
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
                    <span className="ml-2 font-bold">{datSummary?.tong_quang_duong || 0} km</span>
                </div>
                <div>
                    <span className="text-gray-500">Tổng thời gian:</span>
                    <span className="ml-2 font-bold">{datSummary?.tong_thoi_gian || "0h 0'"}</span>
                </div>
                <div>
                    <span className="text-gray-500">Số phiên:</span>
                    <span className="ml-2 font-bold">{sessions.length || 0}</span>
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
                    if (!record.gio_vao) return "";
                    const isTuDong = bienSoTuDong && normalizePlate(record.bien_so_xe) === normalizePlate(bienSoTuDong);
                    if (isTuDong) {
                        return "!bg-blue-300 hover:!bg-blue-400 transition-colors cursor-default";
                    }
                    const hour = dayjs(record.gio_vao).hour();
                    if (hour >= 18) return "!bg-gray-200 hover:!bg-gray-300 transition-colors cursor-default";
                    return "";
                }}
            />

            <Card
                style={{
                    marginTop: 16,
                    borderColor: isPass ? "#52c41a" : "#ff4d4f",
                    backgroundColor: isPass ? "#f6ffed" : "#fff2f0",
                }}
            >
                <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                >
                    <Space>
                        <Text strong style={{ fontSize: 14 }}>
                            Kết quả đánh giá:
                        </Text>
                        <Tag
                            color={isPass ? "success" : "error"}
                            icon={
                                isPass ? (
                                    <CheckCircleOutlined />
                                ) : (
                                    <CloseCircleOutlined />
                                )
                            }
                            style={{ fontSize: 14 }}
                        >
                            {isPass ? "Đạt" : "Chưa đạt"}
                        </Tag>
                    </Space>

                    {allIssues.length > 0 && (
                        <div>
                            <Text strong>Lý do:</Text>
                            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                                {allIssues.map((issue, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            color:
                                                issue.type === "error"
                                                    ? "#990000"
                                                    : "#CC9966",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {issue.type === "warning" ? (
                                            <WarningOutlined
                                                style={{ color: "#CC9966", marginRight: 4 }}
                                            />
                                        ) : (
                                            <CloseCircleOutlined
                                                style={{ marginRight: 4 }}
                                            />
                                        )}
                                        <span className="font-medium text-[#CC9966]">
                                            {issue.type === "warning" && "Cảnh báo: "}
                                        </span>
                                        <span className="font-medium ">
                                            {issue.message}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Space>
            </Card>
        </div>
    );
};

const StudentMakeUpDetailDrawer = ({ open, onClose, student }) => {
    const { data: detailRes, isLoading } = useQuery({
        queryKey: ["getDanhSachHocVienHocBuDetail", student?.ma_dk],
        queryFn: () => getDanhSachHocVienHocBuDetail({ ma_dk: student?.ma_dk }),
        enabled: !!open && !!student?.ma_dk,
    });

    const apiData = detailRes?.data || {};
    const finalStudent = Object.keys(apiData).length > 0 ? apiData : (student || {});

    const studentName = finalStudent.ho_ten || "Học viên";
    const studentId = finalStudent.ma_dk || student?.ma_dk || "";

    const infoItems = [
        { label: "Mã", value: studentId || "-" },
        { label: "Tên", value: studentName },
        { label: "Ngày sinh", value: finalStudent.ngay_sinh ? dayjs(finalStudent.ngay_sinh).format("DD/MM/YYYY") : "-" },
        { label: "CCCD/CMT", value: finalStudent.cccd || "-" },
        { label: "Khóa học", value: finalStudent.khoa || finalStudent.ten_khoa || "-" },
        { label: "Giáo viên", value: finalStudent.giao_vien || finalStudent.thay_giao || "-" },
    ];

    const tabItems = [
        {
            key: "theory",
            label: "Lý thuyết",
            children: <TheoryTab scoreByRubrik={apiData.scoreByRubrik} theoryInfo={apiData.theoryInfo} />,
        },
        {
            key: "cabin",
            label: "Cabin",
            children: <CabinTab cabinDetails={apiData.cabinDetails} cabinSummary={apiData.cabinSummary} />,
        },
        {
            key: "dat",
            label: "DAT",
            children: <DatTab datDetails={apiData.datDetails} datSummary={apiData.datSummary} student={finalStudent} />,
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
            <Spin spinning={isLoading}>
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
                                        src={finalStudent.anh}
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
                            tabBarExtraContent={
                                <Button type="primary">
                                    Đăng ký học bù
                                </Button>
                            }
                        />
                    </div>
                )}
            </Spin>
        </Drawer>
    );
};


export default StudentMakeUpDetailDrawer;
