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
    Checkbox,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu, updateHocBuStatus } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { Typography } from 'antd'
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import TienDoHocBuModal from "../TienDoHocBuModal";
import { dongBoTienDoDaoTaoSql } from "../../../apis/apiSynch";
import { renderTrangThaiHocBu, renderTrangThaiLyThuyet } from "../../../constants/hocBuConstants";
import HocVienInfo from "../../../components/HocVienInfor";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachChoXepLopLyThuyet = () => {
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        trang_thai: 2,
        loai: "ly_thuyet",
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

    const [isSavingCourse, setIsSavingCourse] = useState(false);

    const handleCourseSubmit = async (values) => {
        const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
        const payload = {
            ...values,
            loai: values.loai || 1,
            luu_luong: selectedRowKeys.length,
            created_by: userName,
            updated_by: userName,
        };

        setIsSavingCourse(true);
        try {
            await dongBoTienDoDaoTaoSql(payload);

            const selectedStudents = students.filter(item => selectedRowKeys.includes(item.id || item.ma_dk));
            await Promise.all(selectedStudents.map(async (st) => {
                await updateHocBuStatus({
                    ...st,
                    trang_thai: 3,
                    khoa_bu_ly_thuyet: values.ma_khoa,
                    trang_thai_ly_thuyet: 3,
                    thoi_gian_xep_ly_thuyet: new Date().toISOString(),
                });
            }));

            message.success('Thêm mới tiến độ thành công');
            setIsCourseModalOpen(false);
            setSelectedRowKeys([]);
            refetchStudents?.();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
        } finally {
            setIsSavingCourse(false);
        }
    };

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
            "hocVienHocBuChoDuyet",
            appliedFilters.ma_khoa,
            appliedFilters.search,
            appliedFilters.trang_thai,
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBu({
                ma_khoa: appliedFilters.ma_khoa,
                text: appliedFilters.search,
                trang_thai: appliedFilters.trang_thai,
                loai: appliedFilters.loai,
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
            trang_thai: 2,
            loai: "ly_thuyet",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setAppliedFilters({
            ma_khoa: null,
            search: "",
            trang_thai: 2,
            loai: "ly_thuyet",
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
            title: "Khóa",
            key: "khoa",
            width: 100,
            align: "center",
            render: (_, record) => record.khoa || "-",
        },
        {
            title: "Khóa bù",
            key: "khoa_bu_ly_thuyet",
            width: 100,
            align: "center",
            render: (_, record) => record.khoa_bu_ly_thuyet || "-",
        },
        {
            title: "Giáo viên",
            key: "giao_vien",
            width: 180,
            render: (_, record) => record.giao_vien || "-",
        },
        {
            title: "Trạng thái",
            key: "trang_thai",
            align: "center",
            width: 120,
            render: (_, record) => renderTrangThaiHocBu(record.trang_thai),
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai_ly_thuyet",
            width: 100,
            align: "center",
            render: (_, record) => renderTrangThaiLyThuyet(record.trang_thai_ly_thuyet)
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
                    Danh sách chờ xếp lớp lý thuyết
                </h1>
            </div>

            <Card className="!mb-5">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={10} md={8} lg={8}>
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
                    <Col xs={24} sm={10} md={8} lg={8}>
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

                    <Col xs={24} sm={14} md={12} lg={8}>
                        <Space className="w-full justify-start flex-wrap mt-[18px]">
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
                                icon={<PlusCircleOutlined />}
                                onClick={() => setIsCourseModalOpen(true)}
                                className="!bg-green-600 hover:!bg-green-700 border-none"
                                disabled={selectedRowKeys.length === 0}
                            >
                                Thêm vào khóa ({selectedRowKeys.length})
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
                        const canCheck = String(record.trang_thai) === "2" && String(record.trang_thai_ly_thuyet) === "2";
                        return {
                            disabled: !canCheck,
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

            <TienDoHocBuModal
                visible={isCourseModalOpen}
                onCancel={() => setIsCourseModalOpen(false)}
                selectedCount={selectedRowKeys.length}
                onSubmit={handleCourseSubmit}
                loading={isSavingCourse}
                type="theory"
            />
        </div>
    );
};

export default DanhSachChoXepLopLyThuyet;
