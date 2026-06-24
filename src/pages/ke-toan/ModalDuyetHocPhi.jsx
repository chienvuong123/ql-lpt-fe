import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Row, Col, message, Typography, InputNumber, Button, DatePicker } from "antd";
import dayjs from "dayjs";
import { duyetHocPhi } from "../../apis/apiKeToan";

const { Text, Title } = Typography;

const ModalDuyetHocPhi = ({ open, student, onClose, onSave }) => {
    const [form] = Form.useForm();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && student) {
            form.setFieldsValue({
                cccd: student.cccd,
                ten_hoc_vien: student.ten_hoc_vien,
                so_tien_da_nop: student.so_tien_con_lai > 0 ? student.so_tien_con_lai : undefined,
                phuong_thuc: "chuyen_khoan",
                ngay_nop: dayjs(),
                ghi_chu_ke_toan: "",
            });
        } else {
            form.resetFields();
        }
    }, [open, student, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);

            const submitData = {
                cccd: values.cccd,
                so_tien_da_nop: values.so_tien_da_nop,
                phuong_thuc: values.phuong_thuc,
                ngay_nop: values.ngay_nop ? values.ngay_nop.toISOString() : new Date().toISOString(),
                ghi_chu_ke_toan: values.ghi_chu_ke_toan || undefined,
            };

            const res = await duyetHocPhi(submitData);
            if (res?.success) {
                message.success(res.message || "Duyệt thanh toán học viên thành công!");
                onSave();
                onClose();
            } else {
                message.error(res?.message || "Duyệt thanh toán thất bại.");
            }
        } catch (error) {
            console.error("Duyet hoc phi error:", error);
            if (error?.errorFields) {
                return;
            }
            message.error(error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi duyệt thanh toán.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return "0đ";
        return `${Number(val).toLocaleString("vi-VN")}đ`;
    };

    return (
        <Modal
            title={
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", paddingBottom: 8 }}>
                    Duyệt học phí học viên
                </div>
            }
            open={open}
            onCancel={onClose}
            width={600}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose} style={{ borderRadius: 6 }}>
                    Đóng
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isSaving}
                    onClick={handleOk}
                    style={{
                        backgroundColor: "#2b6cb0",
                        borderColor: "#2b6cb0",
                        borderRadius: 6,
                        fontWeight: 600,
                    }}
                >
                    Duyệt thanh toán
                </Button>
            ]}
        >
            {student && (
                <div style={{ marginTop: 8 }}>
                    {/* Summary Info Banner */}
                    <div style={{
                        background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 16,
                        borderLeft: "4px solid #2b6cb0"
                    }}>
                        <Row gutter={[16, 8]}>
                            <Col span={12}>
                                <Text type="secondary">Học viên: </Text>
                                <Text strong>{student.ten_hoc_vien}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">Số CCCD: </Text>
                                <Text strong>{student.cccd}</Text>
                            </Col>
                            <Col span={8}>
                                <div style={{ fontSize: 12, color: "#64748b" }}>Học phí phải nộp</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                                    {formatCurrency(student.hoc_phi || student.so_tien_phai_nop)}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ fontSize: 12, color: "#64748b" }}>Đã nộp tích lũy</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#16a34a" }}>
                                    {formatCurrency(student.so_tien_da_nop)}
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ fontSize: 12, color: "#64748b" }}>Còn lại</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>
                                    {formatCurrency(student.so_tien_con_lai ?? (student.hoc_phi || student.so_tien_phai_nop || 0))}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <Form form={form} layout="vertical">
                        {/* Hidden fields */}
                        <Form.Item name="cccd" hidden><Input /></Form.Item>
                        <Form.Item name="ten_hoc_vien" hidden><Input /></Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="so_tien_da_nop"
                                    label="Số tiền nộp đợt này"
                                    rules={[{ required: true, message: "Vui lòng nhập số tiền nộp" }]}
                                >
                                    <InputNumber
                                        placeholder="VD: 5.000.000"
                                        style={{ width: "100%" }}
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\./g, '')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="phuong_thuc"
                                    label="Phương thức thanh toán"
                                    rules={[{ required: true, message: "Vui lòng chọn phương thức" }]}
                                >
                                    <Select placeholder="Chọn phương thức...">
                                        <Select.Option value="chuyen_khoan">Chuyển khoản</Select.Option>
                                        <Select.Option value="tien_mat">Tiền mặt</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="ngay_nop"
                                    label="Ngày nộp học phí"
                                    rules={[{ required: true, message: "Vui lòng chọn ngày nộp" }]}
                                >
                                    <DatePicker
                                        showTime
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY HH:mm:ss"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="ghi_chu_ke_toan" label="Ghi chú của kế toán">
                                    <Input.TextArea rows={3} placeholder="Nhập ghi chú nộp tiền (VD: Thu tiền đợt 1,...) " />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>
            )}
        </Modal>
    );
};

export default ModalDuyetHocPhi;
