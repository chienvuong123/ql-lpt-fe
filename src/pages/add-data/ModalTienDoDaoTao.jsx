import React, { useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    Select,
    Row,
    Col,
    Divider,
    Space,
    Typography
} from 'antd';
import {
    CalendarOutlined,
    TeamOutlined,
    CarOutlined,
    SolutionOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getKhoaHocListSql } from '../../apis/apiSynch';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

const ModalTienDoDaoTao = ({ visible, action, data, onCancel, onSubmit, loading }) => {
    const [form] = Form.useForm();

    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["getKhoaHocListSql"],
        queryFn: () => getKhoaHocListSql(),
        staleTime: 1000 * 60 * 5,
        enabled: visible && (action === 'add' || action === 'edit'),
    });

    const normalizeApiList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.result)) return payload.result;
        return [];
    };

    const courseOptions = normalizeApiList(dataKhoaHoc).map((item) => ({
        label: item?.ten_khoa || item?.name || item?.code || '#' + item?.iid,
        value: item?.ma_khoa || item?.code || item?.iid,
    }));

    const handleCourseChange = (maKhoa) => {
        const courses = normalizeApiList(dataKhoaHoc);
        const selectedCourse = courses.find(c => (c.ma_khoa || c.code || c.iid) === maKhoa);

        if (selectedCourse) {
            form.setFieldsValue({
                luu_luong: selectedCourse.total_member || 0,
                ngay_khai_giang: selectedCourse.ngay_bat_dau ? dayjs(selectedCourse.ngay_bat_dau) : null,
            });
        }
    };

    useEffect(() => {
        if (visible) {
            if (action === 'add') {
                form.resetFields();
            } else if (data) {
                // Convert string dates to dayjs objects
                const formattedData = { ...data };
                const dateFields = [
                    'ngay_khai_giang', 'bat_dau_ly_thuyet', 'ket_thuc_ly_thuyet', 'kiem_tra_het_mon',
                    'bat_dau_cabin', 'ket_thuc_cabin', 'bat_dau_dat', 'ket_thuc_dat',
                    'tot_nghiep', 'ghep_tot_nghiep', 'be_giang'
                ];

                dateFields.forEach(field => {
                    if (data[field]) {
                        // Handle ISO strings from API
                        formattedData[field] = dayjs(data[field]);
                    }
                });

                form.setFieldsValue(formattedData);
            }
        }
    }, [visible, action, data, form]);

    const handleOk = () => {
        if (action === 'view') {
            onCancel();
            return;
        }

        form.validateFields()
            .then((values) => {
                // Format dates back to string if needed by API
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

    const getTitle = () => {
        switch (action) {
            case 'add': return 'Thêm Tiến Độ Đào Tạo Mới';
            case 'edit': return 'Chỉnh Sửa Tiến Độ Đào Tạo';
            case 'view': return 'Chi Tiết Tiến Độ Đào Tạo';
            default: return 'Thông Tin Tiến Độ';
        }
    };

    const isReadOnly = action === 'view';

    return (
        <Modal
            title={
                <Space>
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{getTitle()}</span>
                </Space>
            }
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            width={800}
            confirmLoading={loading}
            okText={action === 'view' ? 'Đóng' : (action === 'edit' ? 'Cập nhật' : 'Thêm mới')}
            cancelText="Hủy bỏ"
            okButtonProps={{ style: isReadOnly ? { display: 'none' } : {} }}
            style={{ top: 15 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '16px' }}
        >
            <Form
                form={form}
                layout="vertical"
                disabled={isReadOnly}
                requiredMark={!isReadOnly}
            >
                <Space><Text strong className='!text-base'>Thông tin chung</Text></Space>
                <Row gutter={16} className='mt-1'>
                    <Col span={8}>
                        <Form.Item
                            name="ma_khoa"
                            label="Khóa học"
                            rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
                        >
                            <Select
                                placeholder="Chọn khóa học"
                                showSearch
                                loading={isLoadingKhoaHoc}
                                options={courseOptions}
                                onChange={handleCourseChange}
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="luu_luong" label="Lưu lượng" className='!w-full'>
                            <InputNumber placeholder="0" className="!w-full" min={0} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="ngay_khai_giang" label="Ngày khai giảng" className='w-full'>
                            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                </Row>

                <Space><Text strong className='!text-base'>Lý Thuyết</Text></Space>
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

                <Space><Text strong className='!text-base'>Thực Hành</Text></Space>
                <Row gutter={16} className='mt-1'>
                    <Col span={12}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Thực hành Cabin</Text>
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
                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Học DAT</Text>
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

                <Space><Text strong className='!text-base'>Kết thúc & Tốt nghiệp</Text></Space>
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

                <Form.Item name="ghi_chu" label="Ghi chú">
                    <TextArea rows={3} placeholder="Nhập ghi chú (nếu có)..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalTienDoDaoTao;
