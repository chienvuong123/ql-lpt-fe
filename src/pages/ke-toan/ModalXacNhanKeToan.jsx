import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Row, Col, message, Typography, InputNumber, Button } from "antd";
import { updateHocVienTuyenSinh } from "../../apis/apiTuyenSinh";

const { Text } = Typography;

const getMaKeToan = (hang, cccd) => {
    if (!cccd) return "";
    const h = (hang || "").toString().trim().toUpperCase();
    if (h === "B2") return `B${cccd}`;
    if (h === "C1") return `C${cccd}`;
    return cccd;
};

const getMaTinhTien = (hang, loai) => {
    const h = (hang || "").toString().trim().toUpperCase();
    const l = (loai || "").toString().trim().toUpperCase();
    if (!h || !l) return "";
    return `${h}${l}`;
};

const getHocPhi = (hang, loai) => {
    const h = (hang || "").toString().trim().toUpperCase();
    const l = (loai || "").toString().trim().toUpperCase();

    if (h === "B2" || h === "B1") {
        if (l === "TT") return 16000000;
        if (l === "LK") return 4200000;
        if (l === "CBNV") return 12000000;
    } else if (h === "C1") {
        if (l === "TT") return 18000000;
        if (l === "LK") return 4700000;
        if (l === "CBNV") return 14000000;
    }
    return null;
};

const parseNumber = (val) => {
    if (val === null || val === undefined) return undefined;
    const num = parseFloat(val.toString().replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? undefined : num;
};

const ModalXacNhanKeToan = ({ open, student, onClose, onSave, onTransferClick }) => {
    const [form] = Form.useForm();
    const [isSaving, setIsSaving] = useState(false);

    // Watch key inputs to recalculate dependent fields
    const watchedHang = Form.useWatch("hang", form);
    const watchedLoai = Form.useWatch("loai", form);
    const watchedCccd = Form.useWatch("cccd", form);

    // Populate initial data when student modal opens
    useEffect(() => {
        if (open && student) {
            form.setFieldsValue({
                ten_hoc_vien: student.ten_hoc_vien,
                cccd: student.cccd,
                ngay_sinh: student.ngay_sinh,
                dien_thoai: student.dien_thoai,
                co_so: student.co_so,
                hang: student.hang,
                loai: student.loai,
                dat_coc: parseNumber(student.dat_coc),
                nguoi_tuyen_sinh: student.nguoi_tuyen_sinh,
                ghi_chu: student.ghi_chu,
                ma_ke_toan: student.ma_ke_toan || getMaKeToan(student.hang, student.cccd),
                ma_tinh_tien: student.ma_tinh_tien || getMaTinhTien(student.hang, student.loai),
                hoc_phi: student.hoc_phi !== null && student.hoc_phi !== undefined
                    ? student.hoc_phi
                    : getHocPhi(student.hang, student.loai),
            });
        } else {
            form.resetFields();
        }
    }, [open, student, form]);

    // Live update dependent fields when core fields change
    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                ma_ke_toan: getMaKeToan(watchedHang, watchedCccd),
                ma_tinh_tien: getMaTinhTien(watchedHang, watchedLoai),
            });

            // Only auto-fill tuition fee if there is a match in our configuration
            const fee = getHocPhi(watchedHang, watchedLoai);
            if (fee !== null) {
                form.setFieldsValue({ hoc_phi: fee });
            }
        }
    }, [watchedHang, watchedLoai, watchedCccd]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setIsSaving(true);
            const submitValues = {
                ...values,
                dat_coc: values.dat_coc !== undefined && values.dat_coc !== null
                    ? values.dat_coc.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    : null
            };
            const res = await updateHocVienTuyenSinh(student.cccd, submitValues);
            if (res?.success) {
                message.success(res.message || "Cập nhật thông tin học viên thành công!");
                onSave();
                onClose();
            } else {
                message.error(res?.message || "Cập nhật thất bại.");
            }
        } catch (error) {
            console.error("Save error:", error);
            if (error?.errorFields) {
                return;
            }
            message.error(error?.message || "Có lỗi xảy ra khi cập nhật học viên.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", paddingBottom: 8 }}>
                    Xác nhận và chỉnh sửa thông tin học viên
                </div>
            }
            open={open}
            onCancel={onClose}
            width={650}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={onClose} style={{ borderRadius: 6 }}>
                    Đóng
                </Button>,
                <Button
                    key="transfer"
                    danger
                    onClick={() => {
                        onTransferClick(student);
                        onClose();
                    }}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                >
                    Chuyển học phí
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
                    Xác nhận thanh toán
                </Button>
            ]}
        >
            {student && (
                <div style={{ marginTop: 16 }}>
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="ten_hoc_vien"
                                    label="Họ và tên"
                                    rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                                >
                                    <Input placeholder="Nhập tên học viên..." />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="cccd"
                                    label="Số CCCD / CMND"
                                    rules={[{ required: true, message: "Vui lòng nhập CCCD" }]}
                                >
                                    <Input placeholder="Nhập số CCCD/CMND..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="ngay_sinh" label="Ngày sinh">
                                    <Input placeholder="VD: 15/08/1998" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="dien_thoai" label="Số điện thoại">
                                    <Input placeholder="Nhập số điện thoại..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="co_so" label="Cơ sở">
                                    <Select placeholder="Chọn cơ sở...">
                                        <Select.Option value="CS 1">Cơ sở 1</Select.Option>
                                        <Select.Option value="CS 3">Cơ sở 3</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="nguoi_tuyen_sinh" label="Người tuyển sinh">
                                    <Input placeholder="Tên người tuyển sinh..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="hang" label="Hạng đăng ký">
                                    <Select placeholder="Chọn hạng...">
                                        <Select.Option value="B1">Hạng B1</Select.Option>
                                        <Select.Option value="B2">Hạng B2</Select.Option>
                                        <Select.Option value="C1">Hạng C1</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="loai" label="Loại hình">
                                    <Select placeholder="Chọn loại hình...">
                                        <Select.Option value="TT">TT</Select.Option>
                                        <Select.Option value="LK">LK</Select.Option>
                                        <Select.Option value="CBNV">CBNV</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="ma_ke_toan" label="Mã kế toán (Tự sinh)">
                                    <Input placeholder="Mã kế toán..." />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="ma_tinh_tien" label="Mã tính tiền (Tự sinh)">
                                    <Input placeholder="Mã tính tiền..." />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="hoc_phi"
                                    label="Học phí dự kiến"
                                    rules={[{ required: true, message: "Vui lòng nhập học phí" }]}
                                >
                                    <InputNumber
                                        placeholder="VD: 16.000.000"
                                        style={{ width: "100%" }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\./g, '')}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="dat_coc" label="Đặt cọc">
                                    <InputNumber
                                        placeholder="VD: 1.000.000"
                                        style={{ width: "100%" }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\./g, '')}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {student.ctv && (
                                    <div style={{ marginTop: 30 }}>
                                        <Text type="secondary">Cộng tác viên (CTV): </Text>
                                        <Text strong>{student.ctv}</Text>
                                    </div>
                                )}
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="ghi_chu" label="Ghi chú">
                                    <Input.TextArea rows={3} placeholder="Nhập ghi chú chi tiết..." />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>
            )}
        </Modal>
    );
};

export default ModalXacNhanKeToan;
