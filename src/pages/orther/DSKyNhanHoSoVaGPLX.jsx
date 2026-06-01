import React, { useMemo, useState, useRef } from "react";
import { Table, Input, Button, Card, Row, Col, Space, Typography, Checkbox, message, Modal, DatePicker, Select } from "antd";
import { SearchOutlined, ReloadOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
    getListStudentsReceiveGplx,
    updateStudentReceiveGplx,
    bulkUpdateStudentReceiveGplx,
    importExcelReceiveGplx,
    getListDates,
    exportExcelReceiveGplx
} from "../../apis/apidsNhanGplx";

const { Title, Text } = Typography;

const DSKyNhanHoSoVaGPLX = () => {
    const queryClient = useQueryClient();
    const fileInputRefModal = useRef(null);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [ngayThiImport, setNgayThiImport] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [exporting, setExporting] = useState(false);

    // Duyệt theo ngày thi State
    const [isDuyetModalOpen, setIsDuyetModalOpen] = useState(false);
    const [selectedNgayThiDuyet, setSelectedNgayThiDuyet] = useState(null);
    const [isFetchingAllForDuyet, setIsFetchingAllForDuyet] = useState(false);

    // Filters State
    const [searchText, setSearchText] = useState("");
    const [filterDaNhan, setFilterDaNhan] = useState(true);
    const [filterChuaNhan, setFilterChuaNhan] = useState(true);
    const [ngayThiFilter, setNgayThiFilter] = useState(undefined);
    const [sortByDauMoi, setSortByDauMoi] = useState(false);

    // Applied Filters State
    const [appliedSearch, setAppliedSearch] = useState("");
    const [appliedFilterDaNhan, setAppliedFilterDaNhan] = useState(true);
    const [appliedFilterChuaNhan, setAppliedFilterChuaNhan] = useState(true);
    const [appliedNgayThiFilter, setAppliedNgayThiFilter] = useState(undefined);
    const [appliedSortByDauMoi, setAppliedSortByDauMoi] = useState(false);

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // Query to fetch dates for selector
    const { data: datesResponse } = useQuery({
        queryKey: ["listDates"],
        queryFn: getListDates,
        staleTime: 1000 * 60 * 5,
    });

    const examDates = useMemo(() => datesResponse?.data || [], [datesResponse]);

    // Query to fetch students from API
    const { data: apiResponse, isFetching } = useQuery({
        queryKey: [
            "listStudentsReceiveGplx",
            pagination.page,
            pagination.limit,
            appliedSearch,
            appliedFilterDaNhan,
            appliedFilterChuaNhan,
            appliedNgayThiFilter,
            appliedSortByDauMoi,
        ],
        queryFn: () => {
            let da_nhan = undefined;
            if (appliedFilterDaNhan && !appliedFilterChuaNhan) da_nhan = true;
            if (!appliedFilterDaNhan && appliedFilterChuaNhan) da_nhan = false;
            if (!appliedFilterDaNhan && !appliedFilterChuaNhan) da_nhan = "none";

            return getListStudentsReceiveGplx({
                page: pagination.page,
                limit: pagination.limit,
                search: appliedSearch,
                ho_ten: appliedSearch,
                da_nhan,
                ngay_thi: appliedNgayThiFilter,
                dau_moi: appliedSortByDauMoi,
            });
        },
        keepPreviousData: true,
    });

    const students = useMemo(() => {
        let list = apiResponse?.data || [];
        return list;
    }, [apiResponse]);

    const totalItems = apiResponse?.pagination?.total || apiResponse?.total || 0;

    // Single Update Mutation
    const { mutate: mutateUpdate, isLoading: isUpdating } = useMutation({
        mutationFn: ({ id, da_nhan }) => updateStudentReceiveGplx(id, { da_nhan }),
        onSuccess: (res) => {
            message.success(res?.message || "Cập nhật trạng thái nhận GPLX thành công!");
            queryClient.invalidateQueries(["listStudentsReceiveGplx"]);
        },
        onError: (err) => {
            message.error(err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
        },
    });

    // Bulk Update Mutation
    const { mutate: mutateBulkUpdate, isLoading: isBulkUpdating } = useMutation({
        mutationFn: ({ ids, da_nhan }) => bulkUpdateStudentReceiveGplx({ ids, da_nhan }),
        onSuccess: (res) => {
            message.success(res?.message || "Cập nhật hàng loạt thành công!");
            setSelectedRowKeys([]);
            queryClient.invalidateQueries(["listStudentsReceiveGplx"]);
        },
        onError: (err) => {
            message.error(err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật hàng loạt!");
        },
    });

    const handleSearch = () => {
        setAppliedSearch(searchText);
        setAppliedFilterDaNhan(filterDaNhan);
        setAppliedFilterChuaNhan(filterChuaNhan);
        setAppliedNgayThiFilter(ngayThiFilter);
        setAppliedSortByDauMoi(sortByDauMoi);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleReset = () => {
        setSearchText("");
        setFilterDaNhan(true);
        setFilterChuaNhan(true);
        setNgayThiFilter(undefined);
        setSortByDauMoi(false);
        setAppliedSearch("");
        setAppliedFilterDaNhan(true);
        setAppliedFilterChuaNhan(true);
        setAppliedNgayThiFilter(undefined);
        setAppliedSortByDauMoi(false);
        setPagination({ page: 1, limit: 10 });
        setSelectedRowKeys([]);
        setIsDuyetModalOpen(false);
        setSelectedNgayThiDuyet(null);
    };

    const handleToggleDaNhan = (record) => {
        mutateUpdate({ id: record.id, da_nhan: !record.da_nhan });
    };

    const handleBulkUpdate = (status) => {
        if (selectedRowKeys.length === 0) return;
        mutateBulkUpdate({ ids: selectedRowKeys, da_nhan: status });
    };

    // Duyệt theo ngày thi (Duyệt tất cả bản ghi của ngày đó)
    const handleDuyetTheoNgayThi = async () => {
        if (!selectedNgayThiDuyet) return;
        setIsFetchingAllForDuyet(true);
        try {
            // Fetch all records of selected exam date (limit 9999 to cover all pages)
            const res = await getListStudentsReceiveGplx({
                page: 1,
                limit: 9999,
                ngay_thi: selectedNgayThiDuyet,
            });
            const allIds = (res?.data || []).map(item => item.id);
            if (allIds.length === 0) {
                message.warning(`Không có học viên nào thuộc ngày thi ${selectedNgayThiDuyet} để duyệt!`);
                return;
            }
            mutateBulkUpdate({ ids: allIds, da_nhan: true });
            setIsDuyetModalOpen(false);
            setSelectedNgayThiDuyet(null);
        } catch (err) {
            message.error("Lỗi khi lấy danh sách học viên để duyệt!");
        } finally {
            setIsFetchingAllForDuyet(false);
        }
    };

    const handleCancelDuyetModal = () => {
        setIsDuyetModalOpen(false);
        setSelectedNgayThiDuyet(null);
        setSelectedRowKeys([]);
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        onSelectAll: (selected) => {
            if (selected) {
                setIsDuyetModalOpen(true);
                setSelectedRowKeys(students.map(item => item.id));
            } else {
                setSelectedRowKeys([]);
            }
        }
    };

    // Excel Import Confirmation
    const handleConfirmImport = async () => {
        if (!selectedFile) {
            message.warning("Vui lòng chọn file Excel!");
            return;
        }
        if (!ngayThiImport) {
            message.warning("Vui lòng nhập ngày thi!");
            return;
        }
        setUploading(true);
        setUploadPercent(0);
        try {
            const ngayGuiStr = dayjs().format("DD/MM/YYYY");
            const ngayThiStr = ngayThiImport.format("DD/MM/YYYY");
            await importExcelReceiveGplx(selectedFile, ngayGuiStr, ngayThiStr, (percent) => {
                setUploadPercent(percent);
            });
            message.success("Nhập danh sách nhận GPLX từ Excel thành công!");
            setIsImportModalOpen(false);
            setSelectedFile(null);
            setNgayThiImport(null);
            queryClient.invalidateQueries(["listStudentsReceiveGplx"]);
            queryClient.invalidateQueries(["listDates"]); // reload dates list
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi khi nhập Excel!");
        } finally {
            setUploading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            let da_nhan = undefined;
            if (appliedFilterDaNhan && !appliedFilterChuaNhan) da_nhan = true;
            if (!appliedFilterDaNhan && appliedFilterChuaNhan) da_nhan = false;

            const blob = await exportExcelReceiveGplx({
                search: appliedSearch,
                ho_ten: appliedSearch,
                da_nhan,
                ngay_thi: appliedNgayThiFilter,
                dau_moi: appliedSortByDauMoi,
            });

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            const cleanDate = appliedNgayThiFilter ? appliedNgayThiFilter.replace(/\//g, "-") : "tat_ca";
            link.setAttribute("download", `danh_sach_nhan_gplx_${cleanDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            message.success("Xuất file Excel thành công!");
        } catch (err) {
            console.error("Export Excel error", err);
            message.error("Lỗi khi xuất file Excel!");
        } finally {
            setExporting(false);
        }
    };

    const columns = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (text, record, index) => (pagination.page - 1) * pagination.limit + index + 1,
        },
        {
            title: "Tên học viên",
            dataIndex: "ho_ten",
            key: "ho_ten",
            sorter: (a, b) => (a.ho_ten || "").localeCompare(b.ho_ten || ""),
        },
        {
            title: "Ngày sinh",
            dataIndex: "ngay_sinh",
            key: "ngay_sinh",
            align: "center",
            width: 100,
        },
        {
            title: "Ngày thi",
            dataIndex: "ngay_thi",
            key: "ngay_thi",
            align: "center",
            width: 110,
            render: (val) => val || "—",
        },
        {
            title: "Đầu mối",
            dataIndex: "dau_moi",
            key: "dau_moi",
            render: (val) => val || "—",
        },
        {
            title: "Số GPLX",
            dataIndex: "so_gplx",
            key: "so_gplx",
            align: "center",
            render: (val) => val || "—",
        },
        {
            title: "Địa chỉ",
            dataIndex: "dia_chi",
            key: "dia_chi",
            render: (val) => val || "—",
        },
        {
            title: "Đã nhận",
            dataIndex: "da_nhan",
            key: "da_nhan",
            align: "center",
            width: 100,
            render: (val, record) => (
                <Checkbox
                    checked={val}
                    onChange={() => handleToggleDaNhan(record)}
                    disabled={isUpdating}
                />
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={3} className="!mb-1">
                        Danh Sách Ký Nhận Hồ Sơ & GPLX
                    </Title>
                    <Text type="secondary">
                        Quản lý việc nhận hồ sơ gốc và giấy phép lái xe trực tiếp tại trung tâm
                    </Text>
                </div>
                <div>
                    <Space>
                        <Button
                            type="default"
                            icon={<UploadOutlined />}
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-white text-gray-600 !h-8"
                        >
                            Import Excel
                        </Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            loading={exporting}
                            className="!h-8"
                        >
                            Xuất Excel
                        </Button>
                    </Space>
                </div>
            </div>

            <Card className="!mb-4">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={20} md={20}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={9}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Tìm kiếm học viên
                                </label>
                                <Input
                                    placeholder="Nhập tên học viên..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onPressEnter={handleSearch}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} md={7}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Lọc Ngày thi
                                </label>
                                <Select
                                    placeholder="Chọn ngày thi..."
                                    className="w-full"
                                    value={ngayThiFilter}
                                    onChange={setNgayThiFilter}
                                    allowClear
                                    options={examDates.map(d => ({ label: d, value: d }))}
                                />
                            </Col>
                            <Col xs={24} md={8}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Trạng thái nhận
                                </label>
                                <div className="h-8 flex items-center gap-4">
                                    <Checkbox
                                        checked={filterDaNhan}
                                        onChange={(e) => setFilterDaNhan(e.target.checked)}
                                    >
                                        Đã nhận
                                    </Checkbox>
                                    <Checkbox
                                        checked={filterChuaNhan}
                                        onChange={(e) => setFilterChuaNhan(e.target.checked)}
                                    >
                                        Chưa nhận
                                    </Checkbox>
                                    <Checkbox
                                        checked={sortByDauMoi}
                                        onChange={(e) => setSortByDauMoi(e.target.checked)}
                                        className="font-medium text-blue-600"
                                    >
                                        Sắp xếp theo đầu mối
                                    </Checkbox>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} sm={4} md={4} className="text-right">
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                style={{ backgroundColor: "#3366cc" }}
                                loading={isFetching}
                            >
                                Lọc
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                disabled={isFetching}
                            >
                                Reset
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Standard Bulk Action Alert */}
            {selectedRowKeys.length > 0 && !isDuyetModalOpen && (
                <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded p-3 mb-4 flex justify-between items-center transition-all duration-300">
                    <span className="text-[#1890ff] font-medium">
                        Đang chọn <strong>{selectedRowKeys.length}</strong> học viên
                    </span>
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleBulkUpdate(true)}
                            className="!bg-green-600 !border-green-600 !hover:bg-green-500"
                            loading={isBulkUpdating}
                        >
                            Đánh dấu đã nhận
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="small"
                            onClick={() => handleBulkUpdate(false)}
                            loading={isBulkUpdating}
                        >
                            Đánh dấu chưa nhận
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setSelectedRowKeys([])}
                            disabled={isBulkUpdating}
                        >
                            Bỏ chọn
                        </Button>
                    </Space>
                </div>
            )}

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={students}
                rowKey="id"
                bordered
                size="small"
                scroll={{ x: 1000 }}
                className="table-blue-header"
                loading={isFetching}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: totalItems,
                    onChange: (page, limit) => setPagination({ page, limit }),
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} học viên`,
                }}
            />

            {/* Duyệt theo ngày thi Config Modal */}
            <Modal
                title="Bạn có muốn duyệt tất cả học viên trong ngày thi dưới đây không?"
                open={isDuyetModalOpen}
                onCancel={handleCancelDuyetModal}
                footer={[
                    <Button key="cancel" onClick={handleCancelDuyetModal}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        disabled={!selectedNgayThiDuyet}
                        loading={isBulkUpdating || isFetchingAllForDuyet}
                        onClick={handleDuyetTheoNgayThi}
                    >
                        Duyệt
                    </Button>
                ]}
            >
                <div className="space-y-4 my-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-2">
                            Chọn Ngày Thi Cần Duyệt
                        </label>
                        <Select
                            placeholder="Chọn ngày thi..."
                            className="w-full"
                            value={selectedNgayThiDuyet}
                            onChange={setSelectedNgayThiDuyet}
                            options={examDates.map(d => ({ label: d, value: d }))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Import Excel Modal */}
            <Modal
                title="Nhập danh sách nhận GPLX từ Excel"
                open={isImportModalOpen}
                onCancel={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                    setNgayThiImport(null);
                }}
                onOk={handleConfirmImport}
                confirmLoading={uploading}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <div className="space-y-4 my-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Chọn File Excel
                        </label>
                        <div
                            className="border border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => fileInputRefModal.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRefModal}
                                style={{ display: "none" }}
                                accept=".xlsx, .xls"
                                onChange={(e) => setSelectedFile(e.target.files?.[0])}
                            />
                            <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                            <div>
                                {selectedFile ? (
                                    <span className="text-green-600 font-semibold">{selectedFile.name}</span>
                                ) : (
                                    <span className="text-gray-500">Nhấp để chọn file excel (.xlsx, .xls)</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Ngày thi
                        </label>
                        <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày thi"
                            value={ngayThiImport}
                            onChange={setNgayThiImport}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DSKyNhanHoSoVaGPLX;
