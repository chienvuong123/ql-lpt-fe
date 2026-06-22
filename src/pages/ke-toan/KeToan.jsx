import React, { useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Select,
    Table,
    Tag,
    Typography,
    Space,
    message,
    Modal,
    Descriptions,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { SyncOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { getHocVienListTuyenSinh, syncDataTuyenSinh } from "../../apis/apiTuyenSinh";
import { useTableHeight } from "../../components/hooks/useTableHeight";
import ModalXacNhanKeToan from "./ModalXacNhanKeToan";
import ModalChuyenHocPhi from "./ModalChuyenHocPhi";

const { Title, Text } = Typography;

const KeToan = () => {
    const [tableRef, tableHeight] = useTableHeight({ bottomPadding: 60 });
    const [form] = Form.useForm();

    // Pagination and filter states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchFilters, setSearchFilters] = useState({
        search: undefined,
        co_so: undefined,
        hang: undefined,
        nguoi_tuyen_sinh: undefined,
    });

    const [isSyncing, setIsSyncing] = useState(false);

    // Modal states for Student Confirmation
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleOpenModal = (student) => {
        setSelectedStudent(student);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setSelectedStudent(null);
        setIsModalVisible(false);
    };

    // Transfer modal states
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [transferSourceStudent, setTransferSourceStudent] = useState(null);

    const handleOpenTransferModal = (student) => {
        setTransferSourceStudent(student);
        setIsTransferModalVisible(true);
    };

    const handleCloseTransferModal = () => {
        setTransferSourceStudent(null);
        setIsTransferModalVisible(false);
    };

    // Compute query params for React Query
    const queryParams = useMemo(() => ({
        page,
        limit,
        ...searchFilters,
    }), [page, limit, searchFilters]);

    // Query student list from database
    const { data: responseData, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["getHocVienListTuyenSinh", queryParams],
        queryFn: () => getHocVienListTuyenSinh(queryParams),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

    const studentList = useMemo(() => {
        return responseData?.data || [];
    }, [responseData]);

    const totalRecords = responseData?.total || 0;

    // Search submit handler
    const handleSearchSubmit = (values) => {
        setPage(1);
        setSearchFilters({
            search: values.search || undefined,
            co_so: values.co_so || undefined,
            hang: values.hang || undefined,
            nguoi_tuyen_sinh: values.nguoi_tuyen_sinh || undefined,
        });
    };

    // Reset form and filters
    const handleReset = () => {
        form.resetFields();
        setPage(1);
        setSearchFilters({
            search: undefined,
            co_so: undefined,
            hang: undefined,
            nguoi_tuyen_sinh: undefined,
        });
    };

    // Trigger Google Sheet synchronization
    const handleSyncData = async () => {
        setIsSyncing(true);
        const hideLoading = message.loading("Đang đồng bộ dữ liệu từ Google Sheets về SQL Server...", 0);
        try {
            const res = await syncDataTuyenSinh();
            if (res?.success) {
                message.success(`Đồng bộ dữ liệu thành công! Tổng số: ${res.count} học viên.`);
                refetch();
            } else {
                message.error(res?.message || "Đồng bộ thất bại.");
            }
        } catch (error) {
            message.error(error?.message || "Có lỗi xảy ra khi đồng bộ dữ liệu.");
        } finally {
            hideLoading();
            setIsSyncing(false);
        }
    };

    // Columns definition
    const columns = [
        {
            title: "STT",
            key: "stt",
            width: 45,
            align: "center",
            fixed: "left",
            render: (_, record, index) => (page - 1) * limit + index + 1,
        },
        {
            title: "Học Viên",
            key: "ten_hoc_vien",
            width: 200,
            fixed: "left",
            render: (_, record) => (
                <span onClick={() => handleOpenModal(record)} className="cursor-pointer">
                    {record.ten_hoc_vien}
                </span>
            ),
        },
        {
            title: "CCCD / CMND",
            dataIndex: "cccd",
            key: "cccd",
            width: 125,
        },
        {
            title: "Ngày Sinh",
            dataIndex: "ngay_sinh",
            key: "ngay_sinh",
            width: 110,
            align: "center",
        },
        {
            title: "Điện Thoại",
            dataIndex: "dien_thoai",
            key: "dien_thoai",
            width: 110,
            render: (val) => val || <span className="text-center">-</span>,
        },
        {
            title: "Cơ Sở",
            dataIndex: "co_so",
            key: "co_so",
            width: 70,
            align: "center",
            render: (val) => {
                return val ? <span>{val}</span> : <span className="text-center">-</span>;
            },
        },
        {
            title: "Hạng",
            dataIndex: "hang",
            key: "hang",
            width: 70,
            align: "center",
            render: (val) => val ? <span>{val}</span> : <span className="text-center">-</span>,
        },
        {
            title: "Loại hình",
            dataIndex: "loai",
            key: "loai",
            width: 70,
            align: "center",
            render: (val) => val ? <span>{val}</span> : <span className="text-center">-</span>,
        },
        {
            title: "Đặt Cọc",
            dataIndex: "dat_coc",
            key: "dat_coc",
            width: 90,
            align: "right",
            render: (val) => {
                if (!val) return <span className="text-center">-</span>;
                const num = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
                if (!isNaN(num)) {
                    return <span>{num.toLocaleString()}đ</span>;
                }
                return val;
            },
        },
        {
            title: "CCCD Photo",
            dataIndex: "cccd_pho_to",
            key: "cccd_pho_to",
            width: 90,
            align: "center",
            render: (val) => (
                <Tag color={val ? "success" : "error"} className="font-medium">
                    {val ? "Đã có" : "Chưa có"}
                </Tag>
            ),
        },
        {
            title: "Người Tuyển Sinh",
            dataIndex: "nguoi_tuyen_sinh",
            key: "nguoi_tuyen_sinh",
            width: 180,
            render: (val, record) => (
                <div>
                    <div className="font-medium text-slate-700">{val || <span className="text-center">-</span>}</div>
                    {record.ctv && <div className="text-xs text-slate-400">CTV: {record.ctv}</div>}
                </div>
            ),
        },
        {
            title: "Mã Ảnh",
            dataIndex: "ma_anh",
            key: "ma_anh",
            width: 100,
            align: "center",
            render: (val) => val || <span className="text-center">-</span>,
        },
        {
            title: "Thời Gian Đăng Ký",
            dataIndex: "thoi_gian",
            key: "thoi_gian",
            width: 160,
            align: "center",
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 130,
            align: "center",
            render: (_, record) => {
                const hasMaKeToan = record.ma_ke_toan && record.ma_ke_toan.toString().trim() !== "";
                return (
                    <Tag color={hasMaKeToan ? "success" : "warning"} className="font-semibold">
                        {hasMaKeToan ? "Đã đóng tiền" : "Chưa đóng tiền"}
                    </Tag>
                );
            }
        },
        {
            title: "Ghi Chú",
            dataIndex: "ghi_chu",
            key: "ghi_chu",
            width: 250,
            render: (val) => (
                <Text ellipsis={{ tooltip: val }} style={{ maxWidth: 230 }}>
                    {val || <span className="text-center">-</span>}
                </Text>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 200,
            fixed: "right",
            align: "center",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleOpenModal(record)}
                        style={{ backgroundColor: "#2b6cb0", borderColor: "#2b6cb0", fontWeight: 600, borderRadius: 4 }}
                    >
                        Xác nhận
                    </Button>
                    <Button
                        type="default"
                        danger
                        size="small"
                        onClick={() => handleOpenTransferModal(record)}
                        style={{ fontWeight: 600, borderRadius: 4 }}
                    >
                        Chuyển học phí
                    </Button>
                </Space>
            ),
        }
    ];

    return (
        <div className="!space-y-4">
            {/* Header and Title */}
            <div className="!flex !justify-between !items-center !bg-white !p-4 !rounded-xl !shadow-sm">
                <div>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1a1a2e" }}>
                        Quản lý dữ liệu kế toán học viên
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Xem và đồng bộ dữ liệu học viên tuyển sinh từ Google Sheets vào SQL Server
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<SyncOutlined spin={isSyncing} />}
                    loading={isSyncing}
                    onClick={handleSyncData}
                    style={{
                        backgroundColor: "#2b6cb0",
                        borderColor: "#2b6cb0",
                        borderRadius: 8,
                        fontWeight: 600,
                    }}
                >
                    Đồng bộ Google Sheets
                </Button>
            </div>

            {/* Filter Card */}
            <Card
                bordered={false}
                className="!shadow-sm !rounded-xl"
                bodyStyle={{ padding: "16px 20px" }}
            >
                <Form form={form} layout="vertical" onFinish={handleSearchSubmit}>
                    <Row gutter={[16, 12]}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="search" label="Từ khóa tìm kiếm" style={{ marginBottom: 0 }}>
                                <Input
                                    placeholder="Nhập tên học viên"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="nguoi_tuyen_sinh" label="Người tuyển sinh" style={{ marginBottom: 0 }}>
                                <Input placeholder="Tên người tuyển sinh..." allowClear />
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6} md={5}>
                            <Form.Item name="hang" label="Hạng đăng ký" style={{ marginBottom: 0 }}>
                                <Select placeholder="Tất cả" allowClear>
                                    <Select.Option value="B1">Hạng B1</Select.Option>
                                    <Select.Option value="B2">Hạng B2</Select.Option>
                                    <Select.Option value="C1">Hạng C1</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={12} sm={6} md={4}>
                            <Form.Item name="co_so" label="Cơ sở tuyển sinh" style={{ marginBottom: 0 }}>
                                <Select placeholder="Tất cả" allowClear>
                                    <Select.Option value="CS 1">Cơ sở 1</Select.Option>
                                    <Select.Option value="CS 3">Cơ sở 3</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12} md={3} className="!flex !items-end">
                            <Form.Item style={{ marginBottom: 0, width: "100%" }}>
                                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                                    <Button
                                        type="default"
                                        icon={<ReloadOutlined />}
                                        onClick={handleReset}
                                        className="!w-full"
                                    >
                                        Làm mới
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SearchOutlined />}
                                        className="!w-full"
                                    >
                                        Lọc
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Main Table Card */}
            <div ref={tableRef}>
                <Table
                    columns={columns}
                    dataSource={studentList}
                    rowKey="cccd"
                    loading={isLoading || isFetching}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: totalRecords,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100"],
                        onChange: (p, s) => {
                            setPage(p);
                            setLimit(s);
                        },
                        showTotal: (total) => `Tổng cộng ${total} học viên`,
                    }}
                    className="table-blue-header"
                    scroll={{ x: 1800, y: tableHeight }}
                    size="small"
                    bordered
                />
            </div>

            {/* Standalone Modal for Confirming & Editing Student Accounts */}
            <ModalXacNhanKeToan
                open={isModalVisible}
                student={selectedStudent}
                onClose={handleCloseModal}
                onSave={refetch}
                onTransferClick={handleOpenTransferModal}
            />

            {/* Standalone Modal for Transferring and Swapping Student Fees */}
            <ModalChuyenHocPhi
                open={isTransferModalVisible}
                sourceStudent={transferSourceStudent}
                onClose={handleCloseTransferModal}
                onSave={refetch}
            />
        </div>
    );
};

export default KeToan;
