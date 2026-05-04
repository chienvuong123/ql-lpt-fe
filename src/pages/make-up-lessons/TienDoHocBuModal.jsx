import React from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Row,
    Col,
    Typography,
} from "antd";
import dayjs from "dayjs";

const TienDoHocBuModal = ({ visible, onCancel, selectedCount, onSubmit, loading }) => {
    const [form] = Form.useForm();

    const calculateDates = (ngayKG) => {
        if (!ngayKG) return {};
        const kg = dayjs(ngayKG);
        const bdlt = kg;
        const ktlt = bdlt.add(20, 'day');
        const kthm = ktlt.add(1, 'day');
        const bdc = kthm.add(3, 'day');
        const ktc = bdc.add(20, 'day');
        const bdd = ktc.add(1, 'day');
        const ktd = bdd.add(25, 'day');
        const bg = kg.add(80, 'day');

        return {
            bat_dau_ly_thuyet: bdlt,
            ket_thuc_ly_thuyet: ktlt,
            kiem_tra_het_mon: kthm,
            bat_dau_cabin: bdc,
            ket_thuc_cabin: ktc,
            bat_dau_dat: bdd,
            ket_thuc_dat: ktd,
            be_giang: bg
        };
    };

    React.useEffect(() => {
        if (visible) {
            form.resetFields();
            form.setFieldsValue({
                luu_luong: selectedCount,
            });
        }
    }, [visible, selectedCount]);

    const handleValuesChange = (changedValues) => {
        const { ngay_khai_giang, tot_nghiep } = changedValues;

        if (ngay_khai_giang) {
            const automatedDates = calculateDates(ngay_khai_giang);
            form.setFieldsValue(automatedDates);
        }

        if (tot_nghiep) {
            const tn = dayjs(tot_nghiep);
            const gk = tn.subtract(7, 'day');
            form.setFieldsValue({
                ghep_tot_nghiep: gk
            });
        }
    };

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                const formattedValues = { ...values };
                const dateFields = [
                    'ngay_khai_giang', 'bat_dau_ly_thuyet', 'ket_thuc_ly_thuyet', 'kiem_tra_het_mon',
                    'bat_dau_cabin', 'ket_thuc_cabin', 'bat_dau_dat', 'ket_thuc_dat',
                    'tot_nghiep', 'ghep_tot_nghiep', 'be_giang'
                ];

                dateFields.forEach(field => {
                    if (values[field]) {
                        formattedValues[field] = values[field].format('YYYY-MM-DD');
                    }
                });

                onSubmit(formattedValues);
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            title={<span style={{ fontWeight: 600, fontSize: '18px' }}>Thêm Khóa Học Mới & Tiến Độ</span>}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={800}
            confirmLoading={loading}
            okText="Thêm mới"
            cancelText="Hủy bỏ"
            style={{ top: 15 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '16px' }}
        >
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
            >
                <Typography.Text strong className='!text-base'>Thông tin chung</Typography.Text>
                <Row gutter={16} className='mt-1'>
                    <Col span={6}>
                        <Form.Item
                            name="ma_khoa"
                            label="Mã khóa học"
                            rules={[{ required: true, message: 'Vui lòng nhập mã khóa học!' }]}
                        >
                            <Input placeholder="Nhập mã khóa" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="hang" label="Hạng">
                            <Select
                                placeholder="Chọn hạng"
                                options={[
                                    { label: 'B1', value: 'B1' },
                                    { label: 'B2', value: 'B2' },
                                    { label: 'C', value: 'C' },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="luu_luong" label="Số học viên">
                            <InputNumber className="!w-full" disabled />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="ngay_khai_giang" label="Ngày khai giảng" className='w-full'>
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                </Row>

                <Typography.Text strong className='!text-base'>Lý Thuyết</Typography.Text>
                <Row gutter={16} className='mt-1'>
                    <Col span={8}>
                        <Form.Item name="bat_dau_ly_thuyet" label="Bắt đầu">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="ket_thuc_ly_thuyet" label="Kết thúc">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="kiem_tra_het_mon" label="Kiểm tra hết môn">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                </Row>

                <Typography.Text strong className='!text-base'>Thực Hành</Typography.Text>
                <Row gutter={16} className='mt-1'>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Thực hành Cabin</Typography.Text>
                        <Row gutter={8}>
                            <Col span={12}>
                                <Form.Item name="bat_dau_cabin">
                                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Bắt đầu" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="ket_thuc_cabin">
                                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Kết thúc" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Học DAT</Typography.Text>
                        <Row gutter={8}>
                            <Col span={12}>
                                <Form.Item name="bat_dau_dat">
                                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Bắt đầu" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="ket_thuc_dat">
                                    <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Kết thúc" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Typography.Text strong className='!text-base'>Kết thúc & Tốt nghiệp</Typography.Text>
                <Row gutter={16} className='mt-1'>
                    <Col span={8}>
                        <Form.Item name="tot_nghiep" label="Dự thi tốt nghiệp">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Ngày thi" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="ghep_tot_nghiep" label="Hạn ký ghép tốt nghiệp">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Hạn ký" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="be_giang" label="Bế giảng">
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Ngày bế giảng" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="so_luong_dat" label="SL đạt TN">
                            <InputNumber placeholder="0" className="!w-full" min={0} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="so_luong_truot" label="SL trượt TN">
                            <InputNumber placeholder="0" className="!w-full" min={0} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default TienDoHocBuModal;
