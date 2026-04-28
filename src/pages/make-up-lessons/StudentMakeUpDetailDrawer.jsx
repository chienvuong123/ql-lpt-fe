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
    Divider,
    Button,
    Spin,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getRankCabinLesson, formatSecondsToTime } from "../../util/helper";
import { useQuery } from "@tanstack/react-query";
import { getChiTietHocVienLyThuyet } from "../../apis/apiLyThuyetLocal";
import {
    computeSummary as computeSummaryHangLoat,
    evaluate as evaluateHangLoat,
} from "../checks/DieuKienKiemTra";

const { Text, Title } = Typography;

const TheoryTab = ({ data, studentId, enrolmentPlanIid }) => {
    console.log("studentId", studentId);
    console.log("enrolmentPlanIid", enrolmentPlanIid);
    const { data: theoryDetail, isLoading } = useQuery({
        queryKey: ["chiTietHocVienLyThuyet", enrolmentPlanIid, studentId],
        queryFn: () => getChiTietHocVienLyThuyet(enrolmentPlanIid, studentId),
        enabled: !!studentId && !!enrolmentPlanIid,
    });

    const progressData = theoryDetail?.data?.learning_progress || theoryDetail?.learning_progress;

    if (!data && !progressData && !isLoading) return <Empty description="Chưa có dữ liệu lý thuyết" />;

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
        <Spin spinning={isLoading}>
            <div className="space-y-4">
                {progressData && (
                    <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                        <div>
                            <span className="text-gray-600">Lý thuyết online:</span>
                            <span className="ml-2 font-bold">
                                {progressData.passed === 1 ? "Đạt" : "Không đạt"}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Làm bài hết môn:</span>
                            <span className="ml-2 font-bold">
                                {progressData.learned ? "Đã làm" : "Chưa làm"}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Tiến độ:</span>
                            <span className="ml-2 font-bold">{progressData.progress}%</span>
                        </div>
                    </div>
                )}

                {progressData?.score_by_rubrik && (
                    <Table
                        dataSource={progressData.score_by_rubrik.filter(item => item.name !== "Pháp luật GTĐB")}
                        columns={columns}
                        rowKey="iid"
                        pagination={false}
                        size="small"
                        bordered
                        className="table-blue-header"
                    />
                )}
            </div>
        </Spin>
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

const DatTab = ({ data, student }) => {
    if (!data) return <Empty description="Chưa có dữ liệu DAT" />;

    const sessions = data.datDetails?.sessions || [];
    const summary = data.datDetails?.summary || {};

    const mappedSessions = useMemo(() => {
        return sessions.map(s => ({
            ThoiDiemDangNhap: s.gio_vao,
            ThoiDiemDangXuat: s.gio_ra,
            TongThoiGian: Number(s.thoi_gian || 0),
            TongQuangDuong: Number(s.tong_km || 0),
            BienSo: s.bien_so_xe,
            HoTenGV: s.ho_ten_gv,
            HangDaoTao: student?.HangDaoTao || student?.hang_dao_tao || data?.hang_dao_tao || "B1",
        }));
    }, [sessions, student, data]);

    const summaryData = useMemo(() => {
        return computeSummaryHangLoat(mappedSessions, student?.HangDaoTao || student?.hang_dao_tao || "B1", null);
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
            dataIndex: "gio_vao",
            width: 100,
            align: "center",
            render: (v) => v ? dayjs(v).format("DD/MM/YYYY") : "-"
        },
        {
            title: "Phiên học",
            width: 110,
            align: "center",
            render: (_, record) => {
                const start = record.gio_vao ? dayjs(record.gio_vao).format("HH:mm") : "-";
                const end = record.gio_ra ? dayjs(record.gio_ra).format("HH:mm") : "-";
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
                    if (!record.gio_vao) return "";
                    const hour = dayjs(record.gio_vao).hour();
                    if (hour >= 18) return "!bg-gray-50 hover:!bg-gray-100 transition-colors cursor-default";
                    return "";
                }}
            />

            <div className={`p-4 rounded-lg border ${isPass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold">Kết quả đánh giá:</span>
                    <Tag color={isPass ? "success" : "error"} icon={isPass ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                        {isPass ? "Đạt" : "Chưa đạt"}
                    </Tag>
                </div>

                {allIssues.length > 0 && (
                    <div className="space-y-2">
                        <p className="font-semibold text-gray-700 m-0">Lý do:</p>
                        <ul className="list-none p-0 m-0 space-y-2">
                            {allIssues.map((issue, idx) => (
                                <li key={idx} className={issue.type === "error" ? "text-red-700" : "text-orange-600"}>
                                    <Space>
                                        {issue.type === "warning" ? <WarningOutlined /> : <CloseCircleOutlined />}
                                        <span className="font-medium">
                                            {issue.type === "warning" && "Cảnh báo: "}
                                            {issue.message}
                                        </span>
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
    const enrolmentPlanIid = student?.ma_khoa || "";

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
            children: <TheoryTab data={student?.detail?.theoryInfo} studentId={studentId} enrolmentPlanIid={enrolmentPlanIid} />,
        },
        {
            key: "cabin",
            label: "Cabin",
            children: <CabinTab data={student?.detail?.cabinInfo} />,
        },
        {
            key: "dat",
            label: "DAT",
            children: <DatTab data={student?.detail?.datInfo} student={student} />,
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
