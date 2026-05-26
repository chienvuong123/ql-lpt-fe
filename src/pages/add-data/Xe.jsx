import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Modal,
    message,
    DatePicker,
    Popconfirm,
    Image,
} from "antd";
import {
    EditOutlined,
    PlusOutlined,
    UploadOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { importExcelXe, getDanhSachXe, addXe, updateXe, deleteXe } from "../../apis/xe";
import { normalizeApiList } from "../../util/helper";
import dayjs from "dayjs";
import ModalXe from "./ModalXe";

const { Title } = Typography;

const Xe = () => {
    const queryClient = useQueryClient();
    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        ten_xe: "",
        nam_san_xuat: "",
        het_han_dang_kiem: null,
        het_han_gpxtl: null,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const fileInputRef = useRef(null);

    const { data: listData, isLoading } = useQuery({
        queryKey: ["getDanhSachXe", params],
        queryFn: () => getDanhSachXe(params),
        staleTime: 1000 * 60 * 5,
    });

    const dataSource = useMemo(() => {
        let list = normalizeApiList(listData);

        if (params.het_han_dang_kiem) {
            const filterDate = dayjs(params.het_han_dang_kiem);
            list = list.filter(item => {
                const itemDate = item.ngay_het_han_gcn_kiem_dinh ? dayjs(item.ngay_het_han_gcn_kiem_dinh) : null;
                return itemDate && (itemDate.isBefore(filterDate, 'day') || itemDate.isSame(filterDate, 'day'));
            });
        }

        if (params.het_han_gpxtl) {
            const filterDate = dayjs(params.het_han_gpxtl);
            list = list.filter(item => {
                const itemDate = item.ngay_het_han_gpxtl ? dayjs(item.ngay_het_han_gpxtl) : null;
                return itemDate && (itemDate.isBefore(filterDate, 'day') || itemDate.isSame(filterDate, 'day'));
            });
        }

        return list;
    }, [listData, params.het_han_dang_kiem, params.het_han_gpxtl]);
    const totalRecords = listData?.pagination?.total || listData?.total || dataSource.length || 0;

    const { mutate: mutateAdd, isLoading: isAdding } = useMutation({
        mutationFn: (payload) => addXe(payload),
        onSuccess: () => {
            message.success("Thêm xe mới thành công!");
            setIsModalOpen(false);
            setSelectedRecord(null);
            queryClient.invalidateQueries(["getDanhSachXe"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi thêm xe!");
        }
    });

    const { mutate: mutateUpdate, isLoading: isUpdating } = useMutation({
        mutationFn: ({ id, payload }) => updateXe(id, payload),
        onSuccess: () => {
            message.success("Cập nhật thông tin xe thành công!");
            setIsModalOpen(false);
            setSelectedRecord(null);
            queryClient.invalidateQueries(["getDanhSachXe"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
        }
    });

    const { mutate: mutateDelete, isLoading: isDeleting } = useMutation({
        mutationFn: (id) => deleteXe(id),
        onSuccess: () => {
            message.success("Xóa xe thành công!");
            queryClient.invalidateQueries(["getDanhSachXe"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa xe!");
        }
    });

    const handleSubmit = (formData) => {
        if (selectedRecord) {
            const id = selectedRecord.id || selectedRecord._id;
            mutateUpdate({ id, payload: formData });
        } else {
            mutateAdd(formData);
        }
    };

    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleImport = async (file) => {
        setUploading(true);
        setUploadPercent(0);
        try {
            await importExcelXe(file, (percent) => {
                setUploadPercent(percent);
            });
            message.success("Nhập dữ liệu xe từ Excel thành công!");
            queryClient.invalidateQueries(["getDanhSachXe"]);
        } catch (err) {
            message.error(err.response?.data?.message || "Lỗi khi nhập Excel!");
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImport(file);
            e.target.value = "";
        }
    };

    const checkStatus = (record) => {
        const today = dayjs();
        const expiryGpx = record.ngay_het_han_gpxtl ? dayjs(record.ngay_het_han_gpxtl) : null;
        const expiryDangKiem = record.ngay_het_han_gcn_kiem_dinh ? dayjs(record.ngay_het_han_gcn_kiem_dinh) : null;

        let isExpired = false;
        let isWarning = false;

        [expiryGpx, expiryDangKiem].forEach((date) => {
            if (date && date.isValid()) {
                const diffMonths = date.diff(today, "month", true);
                if (diffMonths < 0) {
                    isExpired = true;
                } else if (diffMonths <= 2) {
                    isWarning = true;
                }
            }
        });

        if (isExpired) return "expired";
        if (isWarning) return "warning";
        return "normal";
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 60,
            align: 'center',
            fixed: 'left',
            render: (_, __, index) => (params.page - 1) * params.limit + index + 1,
        },
        {
            title: 'Biển số xe',
            dataIndex: 'bien_so_xe',
            key: 'bien_so_xe',
            width: 130,
            align: 'center',
            fixed: 'left',
            render: (text, record) => text || record.bien_so || record.bienSo || record.plate || '-',
        },
        {
            title: 'Nhãn hiệu',
            dataIndex: 'nhan_hieu',
            key: 'nhan_hieu',
            width: 180,
            render: (text, record) => text || record.ten_xe || record.tenXe || record.name || '-',
        },
        {
            title: 'Số đăng ký xe',
            dataIndex: 'so_dang_ky_xe',
            key: 'so_dang_ky_xe',
            width: 140,
            align: 'center',
        },
        {
            title: 'Màu sắc',
            dataIndex: 'mau_sac',
            key: 'mau_sac',
            width: 100,
            align: 'center',
        },
        {
            title: 'Số GPXTL',
            dataIndex: 'so_gpxtl',
            key: 'so_gpxtl',
            width: 160,
            align: 'center',
        },
        {
            title: 'Năm sản xuất',
            dataIndex: 'nam_san_xuat',
            key: 'nam_san_xuat',
            width: 110,
            align: 'center',
        },
        {
            title: 'Ngày cấp GPXTL',
            dataIndex: 'ngay_cap_gpxtl',
            key: 'ngay_cap_gpxtl',
            width: 130,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Ngày hết hạn GPXTL',
            dataIndex: 'ngay_het_han_gpxtl',
            key: 'ngay_het_han_gpxtl',
            width: 150,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Ngày cấp GCN kiểm định',
            dataIndex: 'ngay_cap_gcn_kiem_dinh',
            key: 'ngay_cap_gcn_kiem_dinh',
            width: 180,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Ngày hết hạn đăng kiểm',
            dataIndex: 'ngay_het_han_gcn_kiem_dinh',
            key: 'ngay_het_han_gcn_kiem_dinh',
            width: 180,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Cơ quan cấp GPXTL',
            dataIndex: 'co_quan_cap_gpxtl',
            key: 'co_quan_cap_gpxtl',
            width: 160,
        },
        {
            title: 'Sở hữu',
            dataIndex: 'so_huu',
            key: 'so_huu',
            width: 120,
            align: 'center',
        },
        {
            title: 'Hạng xe tập lái',
            dataIndex: 'hang_xe_tap_lai',
            key: 'hang_xe_tap_lai',
            width: 130,
            align: 'center',
        },
        {
            title: 'Số khung',
            dataIndex: 'so_khung',
            key: 'so_khung',
            width: 200,
        },
        {
            title: 'Số máy',
            dataIndex: 'so_may',
            key: 'so_may',
            width: 140,
        },
        {
            title: 'Loại xe',
            dataIndex: 'loai_xe',
            key: 'loai_xe',
            width: 120,
        },
        {
            title: 'Ảnh xe tập lái',
            dataIndex: 'anh_xe_tap_lai',
            key: 'anh_xe_tap_lai',
            width: 140,
            align: 'center',
            render: (text) =>
                text ? (
                    <Image
                        src={text}
                        alt="Ảnh"
                        width={60}
                        height={60}
                        className="rounded"
                    />
                ) : (
                    "-"
                ),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'ghi_chu',
            key: 'ghi_chu',
            width: 180,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 80,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <div className="flex">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEditClick(record)}
                        style={{ padding: 0 }}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa xe này?"
                        onConfirm={() => {
                            const id = record.id || record._id;
                            if (id) {
                                mutateDelete(id);
                            } else {
                                message.error("Không tìm thấy ID của xe!");
                            }
                        }}
                        okText="Có"
                        cancelText="Không"
                        okButtonProps={{ loading: isDeleting }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                            style={{ padding: 0 }}
                        />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div>
            <style>{`
                .row-expired td {
                    background-color: #ffd9d9 !important;
                }
                .row-expired:hover td {
                    background-color: #ffcccc !important;
                }
                .row-warning td {
                    background-color: #fff7cc !important;
                }
                .row-warning:hover td {
                    background-color: #fff2a3 !important;
                }
            `}</style>

            <Card className="!mb-4">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={12} md={5}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Tên xe
                        </label>
                        <Input
                            placeholder="Nhập tên xe..."
                            value={params.ten_xe}
                            onChange={(e) => setParams(prev => ({ ...prev, ten_xe: e.target.value, page: 1 }))}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Năm sản xuất
                        </label>
                        <Input
                            placeholder="Nhập năm sản xuất..."
                            value={params.nam_san_xuat}
                            onChange={(e) => setParams(prev => ({ ...prev, nam_san_xuat: e.target.value, page: 1 }))}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Ngày hết hạn đăng kiểm
                        </label>
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Chọn ngày hết hạn..."
                            value={params.het_han_dang_kiem ? dayjs(params.het_han_dang_kiem) : null}
                            onChange={(date, dateString) => setParams(prev => ({ ...prev, het_han_dang_kiem: dateString || null, page: 1 }))}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Ngày hết hạn GPXTL
                        </label>
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Chọn ngày hết hạn..."
                            value={params.het_han_gpxtl ? dayjs(params.het_han_gpxtl) : null}
                            onChange={(date, dateString) => setParams(prev => ({ ...prev, het_han_gpxtl: dateString || null, page: 1 }))}
                            allowClear
                        />
                    </Col>
                </Row>
            </Card>
            <Space className="!flex !justify-end mb-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
                <Button
                    type="default"
                    icon={<UploadOutlined />}
                    onClick={triggerFileInput}
                    loading={uploading}
                >
                    {uploading ? `Importing (${uploadPercent}%)` : "Import Excel"}
                </Button>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSelectedRecord(null);
                        setIsModalOpen(true);
                    }}
                    style={{ backgroundColor: '#3366cc' }}
                >
                    Thêm xe
                </Button>
            </Space>
            <Table
                className="table-blue-header"
                dataSource={dataSource}
                columns={columns}
                bordered
                size="small"
                loading={isLoading}
                scroll={{ x: 2500 }}
                rowClassName={(record) => {
                    const status = checkStatus(record);
                    if (status === "expired") return "row-expired";
                    if (status === "warning") return "row-warning";
                    return "";
                }}
                pagination={{
                    current: params.page,
                    pageSize: params.limit,
                    total: totalRecords,
                    onChange: (page, pageSize) => {
                        setParams((prev) => ({
                            ...prev,
                            page,
                            limit: pageSize,
                        }));
                    },
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                }}
                rowKey={(record) => record.id || record._id || record.bien_so_xe || record.bien_so || record.bienSo || record.key}
            />

            <ModalXe
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSubmit={handleSubmit}
                record={selectedRecord}
                confirmLoading={isAdding || isUpdating}
            />
        </div>
    );
};

export default Xe;
