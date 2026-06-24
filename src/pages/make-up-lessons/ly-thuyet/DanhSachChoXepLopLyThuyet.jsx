import React, { useMemo, useState } from "react";
import {
    Table,
    Button,
    Input,
    Select,
    Row,
    Col,
    Card,
    Space,
    message,
    Checkbox,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyet, updateHocBuStatusBulk } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import TienDoHocBuModal from "../TienDoHocBuModal";
import { dongBoTienDoDaoTaoSql } from "../../../apis/apiSynch";
import { renderTrangThaiHocBu, renderTrangThaiLyThuyet } from "../../../constants/hocBuConstants";
import HocVienInfo from "../../../components/HocVienInfor";
import { useTableHeight } from "../../../components/hooks/useTableHeight";
import { usePermission } from "../../../util/permission";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const isClassEligible = (record) => {
    if (!record) return false;
    const st = String(record.trang_thai);
    const stLt = String(record.trang_thai_ly_thuyet);
    return (st === "1" || st === "2") && (stLt === "1" || stLt === "2");
};

const isSelectionEligible = (record) => {
    if (!record) return false;
    const st = String(record.trang_thai);
    const stLt = String(record.trang_thai_ly_thuyet);
    return st === "2" && stLt === "2";
};



const DanhSachChoXepLopLyThuyet = () => {
    const { canEdit } = usePermission();
    const [tableRef, tableHeight] = useTableHeight();
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [ma_dk, setMaDk] = useState("");

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        ma_dk: "",
        trang_thai: 2,
        loai: "ly_thuyet",
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

    const [isSavingCourse, setIsSavingCourse] = useState(false);
    const [isSelectingAllPages, setIsSelectingAllPages] = useState(false);
    const [totalValidKeys, setTotalValidKeys] = useState(-1);

    const handleToggleSelectAllPages = async (checked) => {
        if (!checked) {
            setSelectedRowKeys([]);
            return;
        }

        setIsSelectingAllPages(true);
        try {
            message.loading({ content: 'Đang tải toàn bộ dữ liệu...', key: 'selectAll' });
            const res = await getDanhSachHocVienHocBuChoDuyet({
                ma_khoa: appliedFilters.ma_khoa,
                text: appliedFilters.search,
                ma_dk: appliedFilters.ma_dk,
                trang_thai: appliedFilters.trang_thai,
                loai: appliedFilters.loai,
                page: 1,
                limit: 10000,
            });
            const list = normalizeApiList(res);
            const validKeys = list
                .filter(isSelectionEligible)
                .map(record => record.id || record.ma_dk);
            
            setSelectedRowKeys(validKeys);
            setTotalValidKeys(validKeys.length);
            message.success({ content: `Đã chọn ${validKeys.length} bản ghi`, key: 'selectAll' });
        } catch (error) {
            message.error({ content: 'Có lỗi xảy ra khi chọn tất cả', key: 'selectAll' });
        } finally {
            setIsSelectingAllPages(false);
        }
    };

    const handleToggleSelectRecord = (record, checked) => {
        const rowKey = record.id || record.ma_dk;
        if (!rowKey) return;

        setSelectedRowKeys((prev) =>
            checked
                ? Array.from(new Set([...prev, rowKey]))
                : prev.filter((key) => key !== rowKey),
        );
    };

    const handleCourseSubmit = async (values) => {
        if (!canEdit) return;
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

            await updateHocBuStatusBulk({
                ids: selectedRowKeys,
                trang_thai: 3,
                khoa_bu_ly_thuyet: values.ma_khoa,
                thoi_gian_xep_ly_thuyet: new Date().toISOString(),
                trang_thai_ly_thuyet: 3,
                nguoi_update: userName,
            });

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
            appliedFilters.ma_dk,
            appliedFilters.trang_thai,
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBuChoDuyet({
                ma_khoa: appliedFilters.ma_khoa,
                text: appliedFilters.search,
                ma_dk: appliedFilters.ma_dk,
                trang_thai: appliedFilters.trang_thai,
                loai: appliedFilters.loai,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        const list = normalizeApiList(studentData);
        return list.filter(isClassEligible);
    }, [studentData]);

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;

    const currentTotal = totalValidKeys !== -1 ? totalValidKeys : totalItems;
    const isAllSelected = currentTotal > 0 && selectedRowKeys.length >= currentTotal;
    const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

    const handleApplyFilter = () => {
        const cleanedMaDk = ma_dk
            ? ma_dk
                .split(/[\s,;\u3000]+/)
                .map((item) => item.trim())
                .filter(Boolean)
                .join(",")
            : "";
        setAppliedFilters({
            ma_khoa,
            search: searchText,
            ma_dk: cleanedMaDk,
            trang_thai: 2,
            loai: "ly_thuyet",
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setMaDk("");
        setAppliedFilters({
            ma_khoa: null,
            search: "",
            ma_dk: "",
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
            title: (
                <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    disabled={isFetchingStudents || isSelectingAllPages || !canEdit}
                    onChange={(e) => handleToggleSelectAllPages(e.target.checked)}
                />
            ),
            key: "select_all",
            width: 40,
            align: "center",
            fixed: "left",
            render: (_, record) => {
                const canCheck = isSelectionEligible(record);
                return (
                    <Checkbox
                        checked={selectedRowKeys.includes(record.id || record.ma_dk)}
                        disabled={!canCheck || isSelectingAllPages || !canEdit}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleToggleSelectRecord(record, e.target.checked)}
                    />
                );
            },
        },
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
                    <Col xs={24} sm={12} md={6} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
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
                    <Col xs={24} sm={12} md={6} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Học viên
                        </label>
                        <Input
                            placeholder="Nhập tên hoặc mã học viên"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleApplyFilter}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Danh sách Mã ĐK (dấu phẩy, cách hoặc xuống dòng)
                        </label>
                        <Input.TextArea
                            placeholder="VD: 30004-xxx, 30004-yyy hoặc xuống dòng"
                            value={ma_dk}
                            onChange={(e) => setMaDk(e.target.value)}
                            autoSize={{ minRows: 1, maxRows: 1 }}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleApplyFilter();
                                }
                            }}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6} lg={6}>
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
                <Row className="mt-4">
                    <Col>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusCircleOutlined />}
                                onClick={() => setIsCourseModalOpen(true)}
                                className="!bg-green-600 hover:!bg-green-700 border-none"
                                disabled={selectedRowKeys.length === 0 || !canEdit}
                            >
                                Thêm vào khóa ({selectedRowKeys.length})
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <div ref={tableRef}>
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
                        showTotal: (total) => `Tổng số: ${total} bản ghi`,
                    }}
                    size="small"
                    scroll={{ x: 1300, y: tableHeight }}
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
            </div>

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
