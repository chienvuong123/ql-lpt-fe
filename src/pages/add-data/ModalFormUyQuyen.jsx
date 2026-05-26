import React, { useEffect } from "react";
import {
    Modal,
    Form,
    Row,
    Col,
    Input,
    DatePicker,
    Button,
    Typography,
    Space,
} from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

const ModalFormUyQuyen = ({ open, onCancel, onSubmit, record, confirmLoading }) => {
    const [form] = Form.useForm();
    const isEdit = !!record;

    useEffect(() => {
        if (open) {
            if (isEdit) {
                form.setFieldsValue({
                    nguoi_ky_hd: record.nguoi_ky_hd,
                    scccd_hd: record.scccd_hd,
                    ngay_cap_cc_hd: record.ngay_cap_cc_hd ? dayjs(record.ngay_cap_cc_hd) : null,
                    noi_cap_hd: record.noi_cap_hd,
                    dia_chi_nguoi_ky: record.dia_chi_nguoi_ky,
                    chu_xe: record.chu_xe,
                    dia_chi_chu_xe: record.dia_chi_chu_xe,
                    thoi_han_uy_quyen: record.thoi_han_uy_quyen,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, record, isEdit, form]);

    const handleFinish = (values) => {
        const payload = {
            ...values,
            ngay_cap_cc_hd: values.ngay_cap_cc_hd ? values.ngay_cap_cc_hd.format("YYYY-MM-DD") : null,
        };
        onSubmit(payload);
    };

    return (
        <Modal
            title={
                <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "12px", marginBottom: "16px" }}>
                    <Space>
                        {isEdit ? (
                            <EditOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
                        ) : (
                            <PlusOutlined style={{ fontSize: "20px", color: "#52c41a" }} />
                        )}
                        <Title level={4} style={{ margin: 0 }}>
                            {isEdit ? "Cập Nhật Ủy Quyền" : "Thêm Ủy Quyền Mới"}
                        </Title>
                    </Space>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={720}
            destroyOnClose
            maskClosable={false}
            keyboard={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="nguoi_ky_hd"
                            label={<span className="font-semibold text-gray-700">Người ký hợp đồng</span>}
                            rules={[{ required: true, message: "Vui lòng nhập người ký hợp đồng!" }]}
                        >
                            <Input placeholder="Ví dụ: Nguyễn Thanh Nam" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="scccd_hd"
                            label={<span className="font-semibold text-gray-700">Số CCCD người ký</span>}
                            rules={[{ required: true, message: "Vui lòng nhập số CCCD!" }]}
                        >
                            <Input placeholder="Ví dụ: 030094002669" allowClear />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name="ngay_cap_cc_hd"
                            label={<span className="font-semibold text-gray-700">Ngày cấp CCCD</span>}
                            rules={[{ required: true, message: "Vui lòng nhập ngày cấp CCCD!" }]}
                        >
                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="noi_cap_hd"
                            label={<span className="font-semibold text-gray-700">Nơi cấp CCCD</span>}
                            rules={[{ required: true, message: "Vui lòng nhập nơi cấp CCCD!" }]}
                        >
                            <Input placeholder="Ví dụ: Cục Cảnh Sát" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="thoi_han_uy_quyen"
                            label={<span className="font-semibold text-gray-700">Thời hạn ủy quyền (tháng)</span>}
                            rules={[{ required: true, message: "Vui lòng nhập thời hạn ủy quyền!" }]}
                        >
                            <Input type="number" min={1} placeholder="Ví dụ: 60" allowClear />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name="dia_chi_nguoi_ky"
                            label={<span className="font-semibold text-gray-700">Địa chỉ người ký</span>}
                        >
                            <Input placeholder="Nhập địa chỉ người ký..." allowClear />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="chu_xe"
                            label={<span className="font-semibold text-gray-700">Chủ xe</span>}
                            rules={[{ required: true, message: "Vui lòng nhập tên chủ xe!" }]}
                        >
                            <Input placeholder="Ví dụ: Bùi Đức Hùng" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="dia_chi_chu_xe"
                            label={<span className="font-semibold text-gray-700">Địa chỉ chủ xe</span>}
                        >
                            <Input placeholder="Nhập địa chỉ chủ xe..." allowClear />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: "16px",
                    marginTop: "24px"
                }}>
                    <Button onClick={onCancel}>
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={confirmLoading}
                        style={{ backgroundColor: "#3366cc" }}
                    >
                        {isEdit ? "Cập nhật" : "Thêm mới"}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ModalFormUyQuyen;
