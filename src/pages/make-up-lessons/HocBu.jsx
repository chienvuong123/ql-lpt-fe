import React, { useMemo, useState } from "react";
import {
    Table,
    Button,
    Input,
    Select,
    Row,
    Col,
    Card,
    Image,
    Tag,
    Space,
    message,
    Modal,
} from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu, updateHocBuStatus } from "../../apis/apiHocbu";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "./StudentMakeUpDetailDrawer";
import dayjs from "dayjs";
import { Typography } from 'antd'

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const HocBu = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        text: "",
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // 1. Lấy danh sách khóa học
    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["optionLopLyThuyet"],
        queryFn: () => optionLopLyThuyet(),
        staleTime: 1000 * 60 * 10,
    });

    const courseOptions = useMemo(() => {
        const list = normalizeApiList(dataKhoaHoc);
        return list.map((item) => ({
            label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
            value: item?.code,
        }));
    }, [dataKhoaHoc]);

    // 2. Lấy danh sách học viên cần bù
    const { data: studentData, isFetching: isFetchingStudents, refetch: refetchStudents } = useQuery({
        queryKey: [
            "hocVienHocBu",
            appliedFilters.ma_khoa,
            appliedFilters.text,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBu({
                ma_khoa: appliedFilters.ma_khoa,
                text: appliedFilters.text,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => normalizeApiList(studentData), [studentData]);
    const totalItems = studentData?.total || studentData?.pagination?.total || 0;

    const handleApplyFilter = () => {
        setAppliedFilters({ ma_khoa, text: searchText });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setAppliedFilters({ ma_khoa: null, text: "" });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleOpenDetail = (record) => {
        setSelectedStudent(record);
        setIsDetailOpen(true);
    };

    const handleUpdateStatus = (record) => {
        Modal.confirm({
            title: "Xác nhận đăng ký học bù",
            content: `Bạn có chắc chắn muốn đăng ký học bù cho học viên "${record.ho_ten || record.student?.ho_ten}" không?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
                const payload = {
                    id: record.id,
                    trang_thai: 2,
                    nguoi_update: userName,
                    updated_at: new Date().toISOString(),
                    trang_thai_hoc_bu: 1
                };
                try {
                    await updateHocBuStatus(payload);
                    message.success("Cập nhật trạng thái học bù thành công!");
                    refetchStudents();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
                }
            }
        });
    };

    const handleBulkUpdateStatus = () => {
        if (!selectedRowKeys.length) return;
        Modal.confirm({
            title: "Xác nhận đăng ký học bù hàng loạt",
            content: `Bạn có chắc chắn muốn đăng ký học bù cho ${selectedRowKeys.length} học viên đã chọn không?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
                try {
                    const selectedStudents = students.filter(item => selectedRowKeys.includes(item.id || item.ma_dk));
                    await Promise.all(selectedStudents.map(async (st) => {
                        const payload = {
                            id: st.id,
                            trang_thai: 2,
                            nguoi_update: userName,
                            updated_at: new Date().toISOString(),
                            trang_thai_hoc_bu: 1
                        };
                        await updateHocBuStatus(payload);
                    }));
                    message.success("Đăng ký học bù cho các học viên được chọn thành công!");
                    setSelectedRowKeys([]);
                    refetchStudents();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
                }
            }
        });
    };

    const columns = [
        {
            title: "#",
            key: "stt",
            width: 35,
            align: "center",
            render: (_, __, index) =>
                (pagination.page - 1) * pagination.limit + index + 1,
        },
        {
            title: "Học viên",
            key: "hoc_vien",
            width: 280,
            render: (value) => {
                if (!value) return <span className="text-gray-400 italic">Thiếu dữ liệu HV</span>;

                return (
                    <Space>
                        <Image
                            src={value.anh}
                            width={40}
                            height={40}
                            className="rounded-md"
                            fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{value.ho_ten}</span>
                            <Typography.Text
                                className="!text-[12px]"
                                copyable={{ text: value.ma_dk }}
                            >
                                {value.ma_dk}
                            </Typography.Text>
                        </div>
                    </Space>
                );
            },
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
                return (
                    date ? dayjs(date).format("DD/MM/YYYY") : "-"
                );
            },
        },
        {
            title: "Khóa",
            key: "ten_khoa",
            width: 100,
            align: "center",
            render: (_, record) => record.ten_khoa || "-",
        },
        {
            title: "Giáo viên",
            key: "thay_giao",
            width: 180,
            render: (_, record) => record.thay_giao || "-",
        },
        {
            title: "Lý thuyết",
            key: "theory_status",
            width: 70,
            align: "center",
            render: (_, record) => {
                const theory = record.detail?.theoryInfo;
                const isPass = theory?.loai_ly_thuyet && theory?.loai_het_mon;
                return (
                    <Tag color={isPass ? "green" : "red"}>
                        {isPass ? "Đạt" : "Chưa đạt"}
                    </Tag>
                );
            }
        },
        {
            title: "Cabin",
            key: "cabin_status",
            width: 100,
            align: "center",
            render: (_, record) => {
                const cabin = record.detail?.cabinInfo;
                const isPass = (cabin?.tong_bai || 0) >= 8 && (cabin?.tong_thoi_gian || 0) >= 150;
                return (
                    <Tag color={isPass ? "green" : "red"}>
                        {isPass ? "Đạt" : "Chưa đạt"}
                    </Tag>
                );
            }
        },
        {
            title: "Km đã học",
            key: "tong_quang_duong",
            width: 110,
            align: "center",
            render: (_, record) => (
                <span className="font-medium">
                    {record.detail?.datInfo?.tong_quang_duong || 0} km
                </span>
            ),
        },
        {
            title: "Thời gian học",
            key: "tong_thoi_gian",
            width: 120,
            align: "center",
            render: (_, record) => (
                <span className="font-medium">
                    {record.detail?.datInfo?.tong_thoi_gian}
                </span>
            ),
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai_hoc_bu",
            align: "center",
            width: 140,
            render: (_, record) => {
                const val = record.student?.trang_thai_hoc_bu ?? record.trang_thai_hoc_bu;
                if (val === null || val === undefined) {
                    return <Tag color="default">Chưa học bù</Tag>;
                }
                const numVal = Number(val);
                if (isNaN(numVal)) {
                    return <Tag color="default">Chưa học bù</Tag>;
                }
                if (numVal === 1) {
                    return <Tag color="orange">Đang đăng ký</Tag>;
                }
                if (numVal >= 2) {
                    return <Tag color="green">Lần {numVal - 1}</Tag>;
                }
                return <Tag color="default">Chưa học bù</Tag>;
            },
        },
        {
            title: "Thời gian đăng ký học bù",
            key: "created_at",
            width: 180,
            align: "center",
            render: (_, record) => (
                <span >
                    {dayjs(record.created_at).format("DD/MM/YYYY HH:mm:ss")}
                </span>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            align: "left",
            render: (_, record) => {
                const hasKhoaBuAndThoiGian = String(record.trang_thai_hoc_bu) === "1";
                return (
                    <Space>
                        <Button
                            type="primary"
                            className="!bg-[#3366cc]"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleOpenDetail(record)}
                        />
                        {!hasKhoaBuAndThoiGian && (
                            <Button
                                type="primary"
                                className="!bg-[#52c41a]"
                                icon={<PlusOutlined />}
                                size="small"
                                onClick={() => handleUpdateStatus(record)}
                            />
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Danh sách học viên học bù
                </h1>
            </div>

            <Card className="!mb-5">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={10} md={8} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Khóa Học
                        </label>
                        <Select
                            className="w-full"
                            placeholder="Chọn khóa học"
                            loading={isLoadingKhoaHoc}
                            value={ma_khoa}
                            onChange={setMaKhoa}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={courseOptions}
                        />
                    </Col>
                    <Col xs={24} sm={10} md={8} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Học viên / Mã DK
                        </label>
                        <Input
                            placeholder="Nhập tên hoặc mã học viên"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleApplyFilter}
                        />
                    </Col>
                    <Col xs={24} sm={4} md={8} lg={6}>
                        <Space>
                            <Button
                                type="primary"
                                className="!bg-[#3366cc]"
                                onClick={handleApplyFilter}
                            >
                                Tìm kiếm
                            </Button>
                            <Button onClick={handleResetFilter}>
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleBulkUpdateStatus}
                                className="!bg-green-600 hover:!bg-green-700 border-none"
                                disabled={selectedRowKeys.length === 0}
                            >
                                Đăng ký học bù ({selectedRowKeys.length})
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Table
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => {
                        const hasKhoaBuAndThoiGian = (String(record.trang_thai_hoc_bu) === "1");
                        return {
                            disabled: hasKhoaBuAndThoiGian,
                            name: record.ho_ten || record.student?.ho_ten,
                        };
                    }
                }}
                columns={columns}
                dataSource={students}
                rowKey={(record) => record.id || record.ma_dk}
                loading={isFetchingStudents}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: totalItems,
                    showSizeChanger: true,
                    onChange: (page, limit) => setPagination({ page, limit }),
                }}
                size="small"
                scroll={{ x: 1300 }}
                bordered
                className="table-blue-header"
                rowClassName={(record) => {
                    const graduationDate = record.be_giang || record.student?.be_giang;
                    if (!graduationDate) return "";

                    const deadline = dayjs(graduationDate).add(1, "year");
                    const today = dayjs();
                    const monthsLeft = deadline.diff(today, "month", true);

                    if (monthsLeft < 3) {
                        return "!bg-red-100 hover:!bg-red-200 transition-colors";
                    } else if (monthsLeft <= 6) {
                        return "!bg-blue-50 hover:!bg-blue-200 transition-colors";
                    }
                    return "";
                }}
            />

            <StudentMakeUpDetailDrawer
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                student={selectedStudent}
            />
        </div>
    );
};

export default HocBu;
