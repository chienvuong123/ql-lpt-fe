import React, { useMemo, useState, useRef } from "react";
import { Table, Input, Button, Card, Row, Col, Space, Typography, message, Modal } from "antd";
import { SearchOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getListGplxHoan, importExcelGplxHoan } from "../../apis/apiGplxHoan";
import { usePermission } from "../../util/permission";

const { Title, Text } = Typography;

const GplxHoan = () => {
    const { canEdit } = usePermission();
    const queryClient = useQueryClient();
    const fileInputRefModal = useRef(null);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);

    // Filters State
    const [hoTenText, setHoTenText] = useState("");
    const [soGplxText, setSoGplxText] = useState("");
    const [hangText, setHangText] = useState("");

    // Applied Filters State
    const [appliedHoTen, setAppliedHoTen] = useState("");
    const [appliedSoGplx, setAppliedSoGplx] = useState("");
    const [appliedHang, setAppliedHang] = useState("");

    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    // Query to fetch list from API
    const { data: apiResponse, isFetching } = useQuery({
        queryKey: ["listGplxHoan", pagination.page, pagination.limit, appliedHoTen, appliedSoGplx, appliedHang],
        queryFn: () =>
            getListGplxHoan({
                page: pagination.page,
                limit: pagination.limit,
                ho_ten: appliedHoTen,
                so_gplx: appliedSoGplx,
                hang: appliedHang,
            }),
        keepPreviousData: true,
    });

    const records = useMemo(() => apiResponse?.data || [], [apiResponse]);
    const totalItems = apiResponse?.pagination?.total || 0;

    const handleSearch = () => {
        setAppliedHoTen(hoTenText);
        setAppliedSoGplx(soGplxText);
        setAppliedHang(hangText);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleReset = () => {
        setHoTenText("");
        setSoGplxText("");
        setHangText("");
        setAppliedHoTen("");
        setAppliedSoGplx("");
        setAppliedHang("");
        setPagination({ page: 1, limit: 10 });
    };

    // Excel Import Confirmation
    const handleConfirmImport = async () => {
        if (!canEdit) return;
        if (!selectedFile) {
            message.warning("Vui lòng chọn file Excel!");
            return;
        }
        setUploading(true);
        setUploadPercent(0);
        try {
            const res = await importExcelGplxHoan(selectedFile, (percent) => {
                setUploadPercent(percent);
            });
            const { total, inserted, updated, skipped } = res?.data?.data || {};
            message.success(
                `Import thành công! Hợp lệ: ${total ?? 0} (thêm mới: ${inserted ?? 0}, cập nhật: ${updated ?? 0})` +
                (skipped ? `, bỏ qua ${skipped} dòng thiếu thông tin` : "")
            );
            setIsImportModalOpen(false);
            setSelectedFile(null);
            queryClient.invalidateQueries(["listGplxHoan"]);
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi khi nhập Excel!");
        } finally {
            setUploading(false);
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
            title: "Số GPLX",
            dataIndex: "so_gplx",
            key: "so_gplx",
            align: "center",
            render: (val) => val || "—",
        },
        {
            title: "Họ và tên",
            dataIndex: "ho_ten",
            key: "ho_ten",
            sorter: (a, b) => (a.ho_ten || "").localeCompare(b.ho_ten || ""),
        },
        {
            title: "Ngày sinh",
            dataIndex: "ngay_sinh",
            key: "ngay_sinh",
            align: "center",
            width: 110,
            render: (val) => val || "—",
        },
        {
            title: "Hạng",
            dataIndex: "hang",
            key: "hang",
            align: "center",
            width: 80,
            render: (val) => val || "—",
        },
        {
            title: "Ngày cấp",
            dataIndex: "ngay_cap",
            key: "ngay_cap",
            align: "center",
            width: 110,
            render: (val) => val || "—",
        },
        {
            title: "Thời hạn",
            dataIndex: "thoi_han",
            key: "thoi_han",
            align: "center",
            width: 130,
            render: (val) => val || "—",
        },
        {
            title: "Địa chỉ",
            dataIndex: "dia_chi",
            key: "dia_chi",
            render: (val) => val || "—",
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={3} className="!mb-1">
                        GPLX Hoàn Trả Bưu Điện
                    </Title>
                    <Text type="secondary">
                        Quản lý danh sách giấy phép lái xe tồn được trả về qua bưu điện
                    </Text>
                </div>
                <div>
                    <Button
                        type="default"
                        icon={<UploadOutlined />}
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-gray-600 !h-8"
                        disabled={!canEdit}
                    >
                        Import Excel
                    </Button>
                </div>
            </div>

            <Card className="!mb-4">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={20} md={20}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Tìm theo họ tên
                                </label>
                                <Input
                                    placeholder="Nhập họ và tên..."
                                    value={hoTenText}
                                    onChange={(e) => setHoTenText(e.target.value)}
                                    onPressEnter={handleSearch}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} md={8}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Tìm theo số GPLX
                                </label>
                                <Input
                                    placeholder="Nhập số GPLX..."
                                    value={soGplxText}
                                    onChange={(e) => setSoGplxText(e.target.value)}
                                    onPressEnter={handleSearch}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} md={8}>
                                <label className="block text-xs text-gray-500 uppercase mb-1">
                                    Tìm theo hạng xe
                                </label>
                                <Input
                                    placeholder="Nhập hạng xe (A1, B, C...)..."
                                    value={hangText}
                                    onChange={(e) => setHangText(e.target.value)}
                                    onPressEnter={handleSearch}
                                    allowClear
                                />
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

            <Table
                columns={columns}
                dataSource={records}
                rowKey="id"
                bordered
                size="small"
                scroll={{ x: 1100, y: "calc(100vh - 350px)" }}
                className="table-blue-header"
                loading={isFetching}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: totalItems,
                    onChange: (page, limit) => setPagination({ page, limit }),
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                }}
            />

            {/* Import Excel Modal */}
            <Modal
                title="Nhập danh sách GPLX hoàn trả bưu điện từ Excel"
                open={isImportModalOpen}
                onCancel={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
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
                </div>
            </Modal>
        </div>
    );
};

export default GplxHoan;
