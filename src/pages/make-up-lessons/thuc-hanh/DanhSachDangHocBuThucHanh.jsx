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
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Typography } from 'antd'
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import { getDanhSachHocVienHocBuDangHocBu } from "../../../apis/apiHocbu";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import HocVienInfo from "../../../components/HocVienInfor";
import { renderTrangThaiThucHanh } from "../../../constants/hocBuConstants";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachDangHocBuThucHanh = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);



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
            "hocVienHocBuDangHocBu",
            appliedFilters.ma_khoa,
            appliedFilters.search,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBuDangHocBu({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                trang_thai: 6,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        const list = normalizeApiList(studentData);
        return list;
    }, [studentData]);

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;

    const handleApplyFilter = () => {
        setAppliedFilters({
            ma_khoa,
            search: searchText,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setAppliedFilters({
            ma_khoa: null,
            search: "",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleOpenDetail = (record) => {
        setSelectedStudent(record);
        setIsDetailOpen(true);
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
            width: 310,
            render: (_, record) => <HocVienInfo record={record} />,
        },
        {
            title: "CCCD",
            key: "cccd",
            width: 100,
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
            title: "Khóa học CK",
            key: "khoa",
            width: 100,
            align: "center",
            render: (_, record) => record.khoa?.ten_khoa || "-",
        },
        {
            title: "Khóa bù LT",
            key: "khoa_bu_ly_thuyet",
            width: 100,
            align: "center",
            render: (_, record) => record.khoa_bu_ly_thuyet?.ten_khoa || "-",
        },
        {
            title: "Khóa bù TH",
            key: "khoa_bu_thuc_hanh",
            width: 120,
            align: "center",
            render: (_, record) => record.khoa_bu_thuc_hanh?.ten_khoa || "-",
        },
        {
            title: "Giáo viên",
            key: "giao_vien",
            width: 180,
            render: (_, record) => record.giao_vien || "-",
        },
        {
            title: "Xe B1",
            key: "xe_b1",
            width: 110,
            align: "center",
            render: (_, record) => record.xe_b1 || "-",
        },
        {
            title: "Xe B2",
            key: "xe_b2",
            width: 110,
            align: "center",
            render: (_, record) => record.xe_b2 || "-",
        },
        {
            title: "Bắt đầu LT",
            key: "bat_dau_ly_thuyet",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_ly_thuyet?.bat_dau_ly_thuyet || record.khoa?.bat_dau_ly_thuyet;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Kết thúc LT",
            key: "ket_thuc_ly_thuyet",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_ly_thuyet?.ket_thuc_ly_thuyet || record.khoa?.ket_thuc_ly_thuyet;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Kết thúc môn",
            key: "kiem_tra_het_mon",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_ly_thuyet?.kiem_tra_het_mon || record.khoa?.kiem_tra_het_mon;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Bắt đầu Cabin",
            key: "bat_dau_cabin",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_thuc_hanh?.bat_dau_cabin || record.khoa?.bat_dau_cabin;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Kết thúc Cabin",
            key: "ket_thuc_cabin",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_thuc_hanh?.ket_thuc_cabin || record.khoa?.ket_thuc_cabin;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Bắt đầu DAT",
            key: "bat_dau_dat",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_thuc_hanh?.bat_dau_dat || record.khoa?.bat_dau_dat;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Kết thúc DAT",
            key: "ket_thuc_dat",
            width: 110,
            align: "center",
            render: (_, record) => {
                const date = record.khoa_bu_thuc_hanh?.ket_thuc_dat || record.khoa?.ket_thuc_dat;
                return date ? dayjs(date).format("DD/MM/YYYY") : "-";
            },
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai_thuc_hanh",
            align: "center",
            width: 140,
            render: (_, record) => renderTrangThaiThucHanh(record.trang_thai_thuc_hanh, "thuc hanh"),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        className="!bg-[#3366cc]"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleOpenDetail(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Học viên đang học bù
                </h1>
            </div>

            <Card className="!mb-5">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={10} md={8} lg={5}>
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
                    <Col xs={24} sm={10} md={8} lg={5}>
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

                    <Col xs={24} sm={14} md={12} lg={4}>
                        <Space className="w-full justify-start flex-wrap">
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
            </Card>

            <Table
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
                scroll={{ x: 2200 }}
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

export default DanhSachDangHocBuThucHanh;
