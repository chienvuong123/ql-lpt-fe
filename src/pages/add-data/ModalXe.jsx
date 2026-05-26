import React, { useEffect } from "react";
import {
    Modal,
    Form,
    Row,
    Col,
    Input,
    DatePicker,
    Button,
    Upload,
    Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

const ModalXe = ({ open, onCancel, onSubmit, record, confirmLoading }) => {
    const [form] = Form.useForm();

    const isEdit = !!record;

    useEffect(() => {
        if (open) {
            if (isEdit) {
                form.setFieldsValue({
                    bien_so: record.bien_so_xe || record.bien_so || record.bienSo || record.plate,
                    ten_xe: record.nhan_hieu || record.ten_xe || record.tenXe || record.name,
                    so_dang_ky_xe: record.so_dang_ky_xe,
                    mau_sac: record.mau_sac,
                    so_gpxtl: record.so_gpxtl,
                    nam_san_xuat: record.nam_san_xuat,
                    ngay_cap_gpxtl: record.ngay_cap_gpxtl ? dayjs(record.ngay_cap_gpxtl) : null,
                    ngay_het_han_gpxtl: record.ngay_het_han_gpxtl ? dayjs(record.ngay_het_han_gpxtl) : null,
                    ngay_cap_gcn_kiem_dinh: record.ngay_cap_gcn_kiem_dinh ? dayjs(record.ngay_cap_gcn_kiem_dinh) : null,
                    ngay_het_han_gcn_kiem_dinh: record.ngay_het_han_gcn_kiem_dinh ? dayjs(record.ngay_het_han_gcn_kiem_dinh) : null,
                    co_quan_cap_gpxtl: record.co_quan_cap_gpxtl,
                    so_huu: record.so_huu,
                    hang_xe_tap_lai: record.hang_xe_tap_lai,
                    so_khung: record.so_khung,
                    so_may: record.so_may,
                    loai_xe: record.loai_xe,
                    anh_xe_tap_lai: record.anh_xe_tap_lai
                        ? [
                            {
                                uid: "-1",
                                name: "anh_xe_tap_lai.png",
                                status: "done",
                                url: record.anh_xe_tap_lai,
                            },
                        ]
                        : [],
                    ghi_chu: record.ghi_chu,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, record, isEdit, form]);

    const handleFinish = (values) => {
        const formData = new FormData();

        Object.keys(values).forEach((key) => {
            const val = values[key];
            if (val === undefined || val === null) {
                return;
            }

            if (key === "ngay_cap_gpxtl" || key === "ngay_het_han_gpxtl" || key === "ngay_cap_gcn_kiem_dinh" || key === "ngay_het_han_gcn_kiem_dinh") {
                formData.append(key, val.format("YYYY-MM-DD"));
            } else if (key === "anh_xe_tap_lai") {
                if (Array.isArray(val) && val.length > 0) {
                    const fileItem = val[0];
                    if (fileItem.originFileObj) {
                        formData.append("anh_xe_tap_lai", fileItem.originFileObj);
                    } else if (fileItem.url) {
                        formData.append("anh_xe_tap_lai", fileItem.url);
                    }
                }
            } else {
                formData.append(key, val);
            }
        });

        onSubmit(formData);
    };

    return (
        <Modal
            title={
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {isEdit ? "Cập Nhật Thông Tin Xe" : "Thêm Xe Mới"}
                    </Title>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={920}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="bien_so"
                            label={<span className="font-semibold">Biển số xe (Biển kiểm soát)</span>}
                            rules={[{ required: true, message: "Vui lòng nhập biển số xe!" }]}
                        >
                            <Input placeholder="Ví dụ: 30A-12345" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ten_xe"
                            label={<span className="font-semibold">Nhãn hiệu / Tên xe</span>}
                            rules={[{ required: true, message: "Vui lòng nhập tên nhãn hiệu!" }]}
                        >
                            <Input placeholder="Ví dụ: KIA" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="so_dang_ky_xe"
                            label={<span className="font-semibold">Số đăng ký xe</span>}
                        >
                            <Input placeholder="Nhập số đăng ký xe..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="mau_sac"
                            label={<span className="font-semibold">Màu sắc</span>}
                        >
                            <Input placeholder="Nhập màu sắc xe..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="so_gpxtl"
                            label={<span className="font-semibold">Số GPXTL</span>}
                        >
                            <Input placeholder="Nhập số GPXTL..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="nam_san_xuat"
                            label={<span className="font-semibold">Năm sản xuất</span>}
                        >
                            <Input placeholder="Ví dụ: 2022" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ngay_cap_gpxtl"
                            label={<span className="font-semibold">Ngày cấp GPXTL</span>}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ngay_het_han_gpxtl"
                            label={<span className="font-semibold">Ngày hết hạn GPXTL</span>}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ngay_cap_gcn_kiem_dinh"
                            label={<span className="font-semibold">Ngày cấp GCN kiểm định</span>}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ngay_het_han_gcn_kiem_dinh"
                            label={<span className="font-semibold">Ngày hết hạn đăng kiểm</span>}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày..." />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="co_quan_cap_gpxtl"
                            label={<span className="font-semibold">Cơ quan cấp GPXTL</span>}
                        >
                            <Input placeholder="Nhập cơ quan cấp..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="so_huu"
                            label={<span className="font-semibold">Sở hữu</span>}
                        >
                            <Input placeholder="Ví dụ: Hợp đồng, Sở hữu" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="hang_xe_tap_lai"
                            label={<span className="font-semibold">Hạng xe tập lái</span>}
                        >
                            <Input placeholder="Ví dụ: B2" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="so_khung"
                            label={<span className="font-semibold">Số khung</span>}
                        >
                            <Input placeholder="Nhập số khung..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="so_may"
                            label={<span className="font-semibold">Số máy</span>}
                        >
                            <Input placeholder="Nhập số máy..." allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="loai_xe"
                            label={<span className="font-semibold">Loại xe</span>}
                        >
                            <Input placeholder="Ví dụ: Ô tô Con" allowClear />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="anh_xe_tap_lai"
                            label={<span className="font-semibold">Ảnh xe tập lái</span>}
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                listType="picture-card"
                            >
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="ghi_chu"
                            label={<span className="font-semibold">Ghi chú</span>}
                        >
                            <Input placeholder="Nhập ghi chú..." allowClear />
                        </Form.Item>
                    </Col>
                </Row>

                <div className="flex justify-end gap-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '24px' }}>
                    <Button onClick={onCancel}>
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={confirmLoading}
                        style={{ backgroundColor: '#3366cc' }}
                    >
                        {isEdit ? "Cập nhật" : "Thêm mới"}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ModalXe;
