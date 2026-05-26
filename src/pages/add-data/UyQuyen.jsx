import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    Input,
    Button,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Popconfirm,
    Tag,
    message,
} from "antd";
import {
    EditOutlined,
    PlusOutlined,
    UploadOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    FileProtectOutlined,
} from "@ant-design/icons";
import {
    getDanhSachUyQuyen,
    addUyQuyen,
    editUyQuyen,
    deleteUyQuyen,
    importExcelUyQuyen,
} from "../../apis/apiUyQuyen";
import { getDanhSachXe } from "../../apis/xe";
import { normalizeApiList } from "../../util/helper";
import ModalFormUyQuyen from "./ModalFormUyQuyen";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const UyQuyen = () => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const searchInputRef = useRef(null);

    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        search: "",
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);

    // Fetch lists of authorizations
    const { data: listData, isLoading } = useQuery({
        queryKey: ["getDanhSachUyQuyen", params],
        queryFn: () => getDanhSachUyQuyen(params),
        staleTime: 1000 * 60 * 5,
    });

    // Fetch lists of vehicles for options dropdown when adding/editing
    const { data: listXeData } = useQuery({
        queryKey: ["getDanhSachXeOptions"],
        queryFn: () => getDanhSachXe({ page: 1, limit: 1000 }),
        staleTime: 1000 * 60 * 5,
    });

    const dataSource = useMemo(() => normalizeApiList(listData), [listData]);
    const listXe = useMemo(() => normalizeApiList(listXeData), [listXeData]);
    const totalRecords = listData?.pagination?.total || listData?.total || dataSource.length || 0;

    // Mutate operations
    const { mutate: mutateAdd, isLoading: isAdding } = useMutation({
        mutationFn: (payload) => addUyQuyen(payload),
        onSuccess: () => {
            message.success("Thêm ủy quyền mới thành công!");
            setIsModalOpen(false);
            setSelectedRecord(null);
            queryClient.invalidateQueries(["getDanhSachUyQuyen"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi thêm ủy quyền!");
        }
    });

    const { mutate: mutateUpdate, isLoading: isUpdating } = useMutation({
        mutationFn: ({ id, payload }) => editUyQuyen(id, payload),
        onSuccess: () => {
            message.success("Cập nhật ủy quyền thành công!");
            setIsModalOpen(false);
            setSelectedRecord(null);
            queryClient.invalidateQueries(["getDanhSachUyQuyen"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
        }
    });

    const { mutate: mutateDelete, isLoading: isDeleting } = useMutation({
        mutationFn: (id) => deleteUyQuyen(id),
        onSuccess: () => {
            message.success("Xóa ủy quyền thành công!");
            queryClient.invalidateQueries(["getDanhSachUyQuyen"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa ủy quyền!");
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
            await importExcelUyQuyen(file, (percent) => {
                setUploadPercent(percent);
            });
            message.success("Nhập dữ liệu ủy quyền từ Excel thành công!");
            queryClient.invalidateQueries(["getDanhSachUyQuyen"]);
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

    const handleFilter = () => {
        const search = searchInputRef.current?.input?.value?.trim() || "";
        setParams(prev => ({
            ...prev,
            page: 1,
            search,
        }));
    };

    const handleReset = () => {
        if (searchInputRef.current?.input) {
            searchInputRef.current.input.value = "";
        }
        setParams({
            page: 1,
            limit: 10,
            search: "",
        });
    };

    const formatThoiHan = (monthsStr) => {
        const months = parseInt(monthsStr, 10);
        if (isNaN(months) || months <= 0) return monthsStr || "-";
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        let result = "";
        if (years > 0) {
            result += `${years} năm`;
        }
        if (remainingMonths > 0) {
            if (result) result += " ";
            result += `${remainingMonths} tháng`;
        }
        return result || `${months} tháng`;
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 40,
            align: 'center',
            fixed: 'left',
            render: (_, __, index) => (params.page - 1) * params.limit + index + 1,
        },
        {
            title: 'Biển số xe',
            dataIndex: 'bien_so_xe',
            key: 'bien_so_xe',
            width: 100,
            align: 'center',
            fixed: 'left',
            render: (text) => <span>{text || '-'}</span>,
        },
        {
            title: 'Người ký HĐ',
            dataIndex: 'nguoi_ky_hd',
            key: 'nguoi_ky_hd',
            width: 180,
            render: (text) => <span>{text || '-'}</span>,
        },
        {
            title: 'Số CCCD',
            dataIndex: 'scccd_hd',
            key: 'scccd_hd',
            width: 110,
            align: 'center',
            render: (text) => text || '-',
        },
        {
            title: 'Ngày cấp',
            dataIndex: 'ngay_cap_cc_hd',
            key: 'ngay_cap_cc_hd',
            width: 100,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Nơi cấp',
            dataIndex: 'noi_cap_hd',
            key: 'noi_cap_hd',
            width: 100,
            render: (text) => text || '-',
        },
        {
            title: 'Địa chỉ người ký',
            dataIndex: 'dia_chi_nguoi_ky',
            key: 'dia_chi_nguoi_ky',
            width: 240,
            render: (text) => text || '-',
        },
        {
            title: 'Chủ xe',
            dataIndex: 'chu_xe',
            key: 'chu_xe',
            width: 160,
            render: (text) => text || '-',
        },
        {
            title: 'Địa chỉ chủ xe',
            dataIndex: 'dia_chi_chu_xe',
            key: 'dia_chi_chu_xe',
            width: 240,
            render: (text) => text || '-',
        },
        {
            title: 'Thời hạn ủy quyền',
            dataIndex: 'thoi_han_uy_quyen',
            key: 'thoi_han_uy_quyen',
            width: 110,
            align: 'center',
            render: (text) => <span>{formatThoiHan(text)}</span>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 70,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <div className="flex justify-center">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEditClick(record)}
                        style={{ padding: 0 }}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa ủy quyền này?"
                        onConfirm={() => {
                            const id = record.id || record._id;
                            if (id) {
                                mutateDelete(id);
                            } else {
                                message.error("Không tìm thấy ID của ủy quyền!");
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
            <div className="mb-6">
                <Title level={3} className="!mb-1">
                    Quản lý Ủy quyền Xe
                </Title>
                <div className="flex justify-between items-center">
                    <Text type="secondary">Quản lý và theo dõi thông tin ủy quyền xe của trung tâm</Text>
                    <div>
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
                            className="bg-white text-gray-600 !h-8 !mr-3"
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
                            className="!bg-[#3366cc] !text-white !h-8"
                        >
                            Thêm ủy quyền mới
                        </Button>
                    </div>
                </div>
            </div>
            <Card className="!mb-4">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={16} md={18}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Tìm kiếm thông tin ủy quyền
                        </label>
                        <Input
                            ref={searchInputRef}
                            placeholder="Nhập biển số xe, tên người ký hoặc tên chủ xe..."
                            onPressEnter={handleFilter}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={8} md={6}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleFilter}
                                style={{ backgroundColor: '#3366cc' }}
                            >
                                Lọc
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                className="table-blue-header"
                dataSource={dataSource}
                columns={columns}
                bordered
                size="small"
                loading={isLoading}
                scroll={{ x: 1800 }}
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
                rowKey={(record) => record.id || record._id || record.bien_so_xe || record.key}
            />

            <ModalFormUyQuyen
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSubmit={handleSubmit}
                record={selectedRecord}
                confirmLoading={isAdding || isUpdating}
                showBienSoXe={true}
                listXe={listXe}
            />
        </div>
    );
};

export default UyQuyen;
