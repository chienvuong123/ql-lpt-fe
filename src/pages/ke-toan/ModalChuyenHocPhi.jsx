import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Row, Col, Typography, Card, Button, Divider, message, Spin } from "antd";
import { transferFeeTuyenSinh } from "../../apis/apiTuyenSinh";
import { getUnassignedStudents2026 } from "../../apis/apiKeToan";

const { Text, Title } = Typography;
const { Option } = Select;

const ModalChuyenHocPhi = ({ open, sourceStudent, onClose, onSave }) => {
    const [form] = Form.useForm();
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState([]);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initial search to populate some target options
    useEffect(() => {
        if (open && sourceStudent) {
            handleSearch("");
        } else {
            form.resetFields();
            setSelectedTarget(null);
            setOptions([]);
        }
    }, [open, sourceStudent]);

    const handleSearch = async (value) => {
        setFetching(true);
        try {
            const res = await getUnassignedStudents2026({ search: value });
            if (res?.success) {
                // Filter out the source student from options
                const filtered = res.data.filter(item => item.cccd !== sourceStudent?.cccd);
                setOptions(filtered);
            }
        } catch (error) {
            console.error("Search unassigned error:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSelectTarget = (cccd) => {
        const student = options.find(item => item.cccd === cccd);
        setSelectedTarget(student || null);
    };

    const formatCurrency = (val) => {
        if (!val) return "0đ";
        const num = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? "0đ" : `${num.toLocaleString("vi-VN")}đ`;
    };

    const handleOk = async () => {
        try {
            if (!selectedTarget) {
                message.error("Vui lòng chọn học viên nhận chuyển học phí.");
                return;
            }
            setIsSaving(true);
            const res = await transferFeeTuyenSinh(sourceStudent.cccd, selectedTarget.cccd);
            if (res?.success) {
                message.success(res.message || "Chuyển học phí thành công!");
                onSave();
                onClose();
            } else {
                message.error(res?.message || "Chuyển thất bại.");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            message.error(error?.response?.data?.message || error?.message || "Lỗi khi chuyển học phí.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", paddingBottom: 8 }}>
                    Chuyển / Đổi học phí & Đặt cọc
                </div>
            }
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            okText="Xác nhận chuyển"
            cancelText="Đóng"
            width={650}
            destroyOnClose
            confirmLoading={isSaving}
            okButtonProps={{
                style: {
                    backgroundColor: "#e53e3e",
                    borderColor: "#e53e3e",
                    borderRadius: 6,
                    fontWeight: 600,
                }
            }}
            cancelButtonProps={{
                style: {
                    borderRadius: 6,
                }
            }}
        >
            {sourceStudent && (
                <div style={{ marginTop: 16 }}>
                    <Form form={form} layout="vertical">
                        {/* Source Student Card */}
                        <Card size="small" style={{ backgroundColor: "#fff5f5", borderColor: "#feb2b2", borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>HỌC VIÊN NGUỒN (CHUYỂN ĐI)</Text>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#9b2c2c" }}>{sourceStudent.ten_hoc_vien}</div>
                                    <Text style={{ fontSize: 13 }}>CCCD: {sourceStudent.cccd} | SĐT: {sourceStudent.dien_thoai || "-"}</Text>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div><Text type="secondary">Học phí: </Text><Text strong>{formatCurrency(sourceStudent.hoc_phi)}</Text></div>
                                    <div><Text type="secondary">Đặt cọc: </Text><Text strong style={{ color: "#e53e3e" }}>{formatCurrency(sourceStudent.dat_coc)}</Text></div>
                                </div>
                            </div>
                        </Card>

                        {/* Search Target Student */}
                        <Form.Item
                            label={<span style={{ fontWeight: 600, color: "#2d3748" }}>Chọn học viên nhận chuyển (Chưa đóng phí & chưa xếp khóa)</span>}
                            name="targetCccd"
                            rules={[{ required: true, message: "Vui lòng chọn học viên nhận" }]}
                        >
                            <Select
                                showSearch
                                placeholder="Nhập tên, CCCD hoặc SĐT học viên..."
                                defaultActiveFirstOption={false}
                                showArrow={false}
                                filterOption={false}
                                onSearch={handleSearch}
                                onChange={handleSelectTarget}
                                notFoundContent={fetching ? <Spin size="small" /> : <Text type="secondary">Không tìm thấy học viên phù hợp</Text>}
                                style={{ width: "100%" }}
                            >
                                {options.map(item => (
                                    <Option key={item.cccd} value={item.cccd}>
                                        {item.ten_hoc_vien}({item.ngay_sinh}) - CCCD: {item.cccd} (SĐT: {item.dien_thoai || "-"})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Swap preview compare block */}
                        {selectedTarget && (
                            <>
                                <Divider style={{ margin: "16px 0" }} />
                                <Title level={5} style={{ margin: "0 0 12px 0", color: "#2d3748" }}>Xem trước thay đổi (Đổi học phí)</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Card size="small" title="Sau khi chuyển (Học viên nguồn)" headStyle={{ fontWeight: 600, color: "#4a5568" }} style={{ borderRadius: 8 }}>
                                            <div style={{ fontSize: 13 }}>
                                                <div><Text type="secondary">Học viên: </Text><Text strong>{sourceStudent.ten_hoc_vien}</Text></div>
                                                <div><Text type="secondary">Học phí mới: </Text><Text strong>{formatCurrency(selectedTarget.hoc_phi)}</Text></div>
                                                <div><Text type="secondary">Đặt cọc mới: </Text><Text strong style={{ color: "#38a169" }}>{formatCurrency(selectedTarget.dat_coc)}</Text></div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={12}>
                                        <Card size="small" title="Sau khi nhận (Học viên nhận)" headStyle={{ fontWeight: 600, color: "#2b6cb0" }} style={{ borderRadius: 8, borderColor: "#bee3f8", backgroundColor: "#ebf8ff" }}>
                                            <div style={{ fontSize: 13 }}>
                                                <div><Text type="secondary">Học viên: </Text><Text strong>{selectedTarget.ten_hoc_vien}</Text></div>
                                                <div><Text type="secondary">Học phí mới: </Text><Text strong>{formatCurrency(sourceStudent.hoc_phi)}</Text></div>
                                                <div><Text type="secondary">Đặt cọc mới: </Text><Text strong style={{ color: "#e53e3e" }}>{formatCurrency(sourceStudent.dat_coc)}</Text></div>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Form>
                </div>
            )}
        </Modal>
    );
};

export default ModalChuyenHocPhi;
