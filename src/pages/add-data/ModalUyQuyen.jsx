import React, { useState, useEffect } from "react";
import {
    Modal,
    Table,
    Button,
    Popconfirm,
    Space,
    Typography,
    Tag,
    message,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FileProtectOutlined,
} from "@ant-design/icons";
import {
    getChiTietUyQuyen,
    addUyQuyen,
    editUyQuyen,
    deleteUyQuyen,
} from "../../apis/apiUyQuyen";
import ModalFormUyQuyen from "./ModalFormUyQuyen";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ModalUyQuyen = ({ open, onCancel, bien_so_xe, onSuccess }) => {
    const [listUyQuyen, setListUyQuyen] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchList = async () => {
        if (!bien_so_xe) return;
        setLoading(true);
        try {
            const res = await getChiTietUyQuyen(bien_so_xe);
            const data = res?.data || res || [];
            setListUyQuyen(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết ủy quyền:", error);
            message.error("Không thể lấy danh sách chi tiết ủy quyền!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && bien_so_xe) {
            setSelectedRecord(null);
            setIsFormOpen(false);
            fetchList();
        }
    }, [open, bien_so_xe]);

    const handleAddNewClick = () => {
        setSelectedRecord(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (record) => {
        setSelectedRecord(record);
        setIsFormOpen(true);
    };

    const handleDeleteClick = async (id) => {
        try {
            await deleteUyQuyen(id);
            message.success("Xóa ủy quyền thành công!");
            fetchList();
            onSuccess?.();
        } catch (error) {
            message.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa ủy quyền!");
        }
    };

    const handleFormSubmit = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                bien_so_xe,
            };

            if (selectedRecord) {
                await editUyQuyen(selectedRecord.id, payload);
                message.success("Cập nhật ủy quyền thành công!");
            } else {
                await addUyQuyen(payload);
                message.success("Thêm ủy quyền thành công!");
            }
            setIsFormOpen(false);
            setSelectedRecord(null);
            fetchList();
            onSuccess?.();
        } catch (error) {
            message.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu ủy quyền!");
        } finally {
            setSubmitting(false);
        }
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
            title: "#",
            dataIndex: "index",
            key: "index",
            width: 30,
            align: "center",
            render: (_, __, idx) => idx + 1,
        },
        {
            title: "Người ký HĐ",
            dataIndex: "nguoi_ky_hd",
            key: "nguoi_ky_hd",
            width: 140,
            render: (text) => <Text className="font-semibold text-gray-800">{text}</Text>,
        },
        {
            title: "CCCD Người ký",
            key: "cccd_info",
            width: 180,
            render: (_, record) => (
                <div className="text-xs">
                    <div><Text strong>Số:</Text> {record.scccd_hd || "-"}</div>
                    {record.ngay_cap_cc_hd && (
                        <div><Text strong>Ngày cấp:</Text> {dayjs(record.ngay_cap_cc_hd).format("DD/MM/YYYY")}</div>
                    )}
                    {record.noi_cap_hd && (
                        <div><Text strong>Nơi cấp:</Text> {record.noi_cap_hd}</div>
                    )}
                </div>
            ),
        },
        {
            title: "SCCCD HĐ",
            dataIndex: "dia_chi_nguoi_ky",
            key: "dia_chi_nguoi_ky",
            width: 180,
        },
        {
            title: "Chủ xe",
            dataIndex: "chu_xe",
            key: "chu_xe",
            width: 130,
            render: (text) => <Text className="text-indigo-700">{text}</Text>,
        },
        {
            title: "Nơi Cấp HĐ",
            dataIndex: "dia_chi_chu_xe",
            key: "dia_chi_chu_xe",
            width: 180,
        },
        {
            title: "Thời hạn HĐ",
            dataIndex: "thoi_han_uy_quyen",
            key: "thoi_han_uy_quyen",
            width: 100,
            align: "center",
            render: (text) => (
                <Tag color="blue" className="font-semibold" style={{ padding: "2px 8px" }}>
                    {formatThoiHan(text)}
                </Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 70,
            align: "center",
            fixed: "right",
            render: (_, record) => (
                <div className="flex">
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => handleEditClick(record)}
                        style={{ padding: 0 }}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa ủy quyền này?"
                        onConfirm={() => handleDeleteClick(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                            style={{ padding: 0 }}
                        />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <>
            <Modal
                title={
                    <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "12px", marginBottom: "16px" }}>
                        <Space size="middle">
                            <FileProtectOutlined style={{ fontSize: "22px", color: "#3366cc" }} />
                            <Title level={4} style={{ margin: 0 }}>
                                Chi Tiết Ủy Quyền - Xe {bien_so_xe || ""}
                            </Title>
                        </Space>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                footer={null}
                width={1280}
                destroyOnClose
            >
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddNewClick}
                            style={{ backgroundColor: "#3366cc" }}
                        >
                            Thêm ủy quyền mới
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={listUyQuyen}
                        bordered
                        size="small"
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 5,
                            showTotal: (total) => `Tổng số: ${total} ủy quyền`,
                        }}
                        scroll={{ x: 1000 }}
                        className="table-blue-header"
                    />
                </div>
            </Modal>

            <ModalFormUyQuyen
                open={isFormOpen}
                onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedRecord(null);
                }}
                onSubmit={handleFormSubmit}
                record={selectedRecord}
                confirmLoading={submitting}
            />
        </>
    );
};

export default ModalUyQuyen;
