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
    Modal,
} from "antd";
import { EyeOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyetThucHanh, updateHocBuStatus } from "../../../apis/apiHocbu";
import dayjs from "dayjs";
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import StudentMakeUpDetailDrawer from "../StudentMakeUpDetailDrawer";
import HocVienInfo from "../../../components/HocVienInfor";
import { renderTrangThaiHocBu, renderTrangThaiLyThuyet, renderTrangThaiThucHanh } from "../../../constants/hocBuConstants";
import { useTableHeight } from "../../../components/hooks/useTableHeight";

const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

const DanhSachHocVienBuThucHanh = () => {
    const [tableRef, tableHeight] = useTableHeight();
    const [ma_khoa, setMaKhoa] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [loai, setLoai] = useState(["theory", "practice"]);

    const [appliedFilters, setAppliedFilters] = useState({
        ma_khoa: null,
        search: "",
        loai: undefined,
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isSelectingAllPages, setIsSelectingAllPages] = useState(false);
    const [totalValidKeys, setTotalValidKeys] = useState(-1);
    const [selectedStudentMap, setSelectedStudentMap] = useState({});

    const checkIsEligible = (record) => {
        return (
            record.trang_thai === null ||
            record.trang_thai === undefined ||
            (String(record.trang_thai) === "4" && (record.trang_thai_thuc_hanh === null || record.trang_thai_thuc_hanh === undefined))
        );
    };

    const handleToggleSelectAllPages = async (checked) => {
        if (!checked) {
            setSelectedRowKeys([]);
            setSelectedStudentMap({});
            return;
        }

        setIsSelectingAllPages(true);
        try {
            message.loading({ content: 'Đang tải toàn bộ dữ liệu...', key: 'selectAll' });
            
            let selectedLoai = undefined;
            if (loai && loai.length === 1) {
                selectedLoai = loai[0] === "theory" ? "ly_thuyet" : "thuc_hanh";
            }

            const res = await getDanhSachHocVienHocBuChoDuyetThucHanh({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                loai: selectedLoai,
                page: 1,
                limit: 10000,
            });
            const list = normalizeApiList(res);
            const validRecords = list.filter(checkIsEligible);
            const validKeys = validRecords.map(record => record.id || record.ma_dk);

            setSelectedRowKeys(validKeys);
            setTotalValidKeys(validKeys.length);
            
            const newMap = {};
            validRecords.forEach(r => {
                newMap[r.id || r.ma_dk] = r;
            });
            setSelectedStudentMap(newMap);

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

        setSelectedStudentMap(prev => {
            const next = { ...prev };
            if (checked) {
                next[rowKey] = record;
            } else {
                delete next[rowKey];
            }
            return next;
        });
    };

    const handleUpdateStatus = (record) => {
        Modal.confirm({
            title: "Xác nhận đăng ký học bù",
            content: `Bạn có chắc chắn muốn đăng ký học bù cho học viên "${record.ho_ten || record.student?.ho_ten}" không?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: async () => {
                const userName = sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";
                let payload = {
                    id: record.id,
                    nguoi_update: userName,
                    updated_at: new Date().toISOString(),
                };

                if (String(record.trang_thai) === "4") {
                    payload.trang_thai = 4;
                    payload.trang_thai_thuc_hanh = 1;
                    if (record.loai_thuc_hanh === null || record.loai_thuc_hanh === undefined) {
                        payload.loai_thuc_hanh = "cabin";
                    }
                } else {
                    payload.trang_thai = 1;
                    payload.trang_thai_ly_thuyet = 1;
                }

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
                    const selectedStudents = selectedRowKeys.map(key => selectedStudentMap[key] || students.find(s => (s.id || s.ma_dk) === key)).filter(Boolean);
                    await Promise.all(selectedStudents.map(async (st) => {
                        let payload = {
                            id: st.id,
                            nguoi_update: userName,
                            updated_at: new Date().toISOString(),
                        };

                        if (String(st.trang_thai) === "4") {
                            payload.trang_thai = 4;
                            payload.trang_thai_thuc_hanh = 1;
                            if (st.loai_thuc_hanh === null || st.loai_thuc_hanh === undefined) {
                                payload.loai_thuc_hanh = "cabin";
                            }
                        } else {
                            payload.trang_thai = 1;
                            payload.trang_thai_ly_thuyet = 1;
                        }
                        await updateHocBuStatus(payload);
                    }));
                    message.success("Đăng ký học bù cho các học viên được chọn thành công!");
                    setSelectedRowKeys([]);
                    setSelectedStudentMap({});
                    refetchStudents();
                } catch (error) {
                    message.error(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
                }
            }
        });
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
            appliedFilters.loai,
            pagination.page,
            pagination.limit,
        ],
        queryFn: () =>
            getDanhSachHocVienHocBuChoDuyetThucHanh({
                ma_khoa: appliedFilters.ma_khoa,
                search: appliedFilters.search,
                loai: appliedFilters.loai,
                page: pagination.page,
                limit: pagination.limit,
            }),
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        const list = normalizeApiList(studentData);
        return list;
    }, [studentData, appliedFilters]);

    const totalItems = studentData?.total || studentData?.pagination?.total || 0;
    const currentTotal = totalValidKeys !== -1 ? totalValidKeys : totalItems;
    const isAllSelected = currentTotal > 0 && selectedRowKeys.length >= currentTotal;
    const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

    const handleApplyFilter = () => {
        let selectedLoai = undefined;
        if (loai && loai.length === 1) {
            selectedLoai = loai[0] === "theory" ? "ly_thuyet" : "thuc_hanh";
        }

        setAppliedFilters({
            ma_khoa,
            search: searchText,
            loai: selectedLoai,
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleResetFilter = () => {
        setMaKhoa(null);
        setSearchText("");
        setLoai(["theory", "practice"]);
        setAppliedFilters({
            ma_khoa: null,
            search: "",
            loai: undefined,
        });
        setSelectedRowKeys([]);
        setSelectedStudentMap({});
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
                    disabled={isFetchingStudents || isSelectingAllPages}
                    onChange={(e) => handleToggleSelectAllPages(e.target.checked)}
                />
            ),
            key: "select_all",
            width: 40,
            align: "center",
            render: (_, record) => {
                const isEligible = checkIsEligible(record);
                return (
                    <Checkbox
                        checked={selectedRowKeys.includes(record.id || record.ma_dk)}
                        disabled={!isEligible || isSelectingAllPages}
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
            width: 280,
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
            width: 90,
            align: "center",
            render: (_, record) => record.khoa || "-",
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
            width: 100,
            align: "center",
            render: (_, record) => record.xe_b1 || "-",
        },
        {
            title: "Xe B2",
            key: "xe_b2",
            width: 100,
            align: "center",
            render: (_, record) => record.xe_b2 || "-",
        },
        {
            title: "Trạng thái",
            key: "trang_thai",
            align: "center",
            width: 100,
            render: (_, record) => renderTrangThaiHocBu(record.trang_thai, record.trang_thai_thuc_hanh),
        },
        {
            title: "Trạng thái học bù",
            key: "trang_thai",
            align: "center",
            width: 140,
            render: (_, record) => {
                const st = Number(record.trang_thai);
                if (st >= 1 && st <= 3) {
                    return renderTrangThaiLyThuyet(record.trang_thai_ly_thuyet);
                }
                if (st >= 4 && st <= 7) {
                    return renderTrangThaiThucHanh(record.trang_thai_thuc_hanh, record.loai_thuc_hanh);
                }
                return <Tag color="default">-</Tag>;
            },
        },
        {
            title: "Thao tác",
            key: "action",
            width: 80,
            align: "left",
            render: (_, record) => {
                const isEligible =
                    record.trang_thai === null ||
                    record.trang_thai === undefined ||
                    (String(record.trang_thai) === "4" && (record.trang_thai_thuc_hanh === null || record.trang_thai_thuc_hanh === undefined));
                return (
                    <Space>
                        <Button
                            type="primary"
                            className="!bg-[#3366cc]"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleOpenDetail(record)}
                        />
                        {isEligible && (
                            <Button
                                type="primary"
                                className="!bg-[#52c41a]"
                                icon={<PlusCircleOutlined />}
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
                    Danh sách học bù thực hành
                </h1>
            </div>

            <Card className="!mb-5">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={12} md={8} lg={6}>
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
                    <Col xs={24} sm={12} md={8} lg={6}>
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
                    <Col xs={24} sm={12} md={10} lg={6}>
                        <label className="block text-xs text-gray-500 uppercase">
                            Loại học bù
                        </label>
                        <div className="mt-[6px]">
                            <Checkbox.Group
                                value={loai}
                                onChange={setLoai}
                                options={[
                                    { label: "Lý thuyết", value: "theory" },
                                    { label: "Thực hành", value: "practice" },
                                ]}
                            />
                        </div>
                    </Col>

                    <Col xs={24} sm={12} md={12} lg={6}>
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
                                onClick={handleBulkUpdateStatus}
                                className="!bg-[#3366cc] !text-white"
                                disabled={selectedRowKeys.length === 0}
                            >
                                Đăng ký học bù ({selectedRowKeys.length})
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

        </div>
    );
};

export default DanhSachHocVienBuThucHanh;
