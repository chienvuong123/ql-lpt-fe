import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Tag,
    message,
    Select,
    Modal,
} from "antd";
import {
    EditOutlined,
    SearchOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { getDanhSachXeVaGiaoVien, editDangKyXeGiaoVien } from "../../apis/apiXeGiaoVien";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import dayjs from "dayjs";
import HocVienInfo from "../../components/HocVienInfor";
import { normalizeApiList } from "../../util/helper";

const { Title, Text } = Typography;

const DangKyXeGiaoVien = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [form] = Form.useForm();
    const keywordInputRef = useRef(null);

    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        search: "",
        khoa: undefined,
    });

    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["optionLopLyThuyet"],
        queryFn: () => optionLopLyThuyet(),
        staleTime: 1000 * 60 * 5,
    });

    const classOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const options = normalizeApiList(dataKhoaHoc).map((item) => ({
            label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
            value: item?.code || item?.iid,
            ngay_bat_dau: item?.ngay_bat_dau
        }));

        return options.sort((a, b) => {
            const dateA = a.ngay_bat_dau ? new Date(a.ngay_bat_dau).getFullYear() : 0;
            const dateB = b.ngay_bat_dau ? new Date(b.ngay_bat_dau).getFullYear() : 0;

            if (dateA === currentYear && dateB !== currentYear) return -1;
            if (dateA !== currentYear && dateB === currentYear) return 1;

            const timeA = a.ngay_bat_dau ? new Date(a.ngay_bat_dau).getTime() : 0;
            const timeB = b.ngay_bat_dau ? new Date(b.ngay_bat_dau).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;

            return String(b.label).localeCompare(String(a.label));
        });
    }, [dataKhoaHoc]);

    const { data: listData, isLoading: isLoadingList } = useQuery({
        queryKey: ["getDanhSachXeVaGiaoVien", params],
        queryFn: () => getDanhSachXeVaGiaoVien(params),
        staleTime: 1000 * 60 * 5,
    });

    const dataSource = useMemo(() => normalizeApiList(listData), [listData]);
    const totalRecords = listData?.pagination?.total || listData?.total || dataSource.length || 0;

    const { mutate: mutateEdit, isLoading: isEditing } = useMutation({
        mutationFn: ({ id, payload }) => editDangKyXeGiaoVien(id, payload),
        onSuccess: () => {
            message.success("Cập nhật thông tin đăng ký xe và giáo viên thành công!");
            setIsModalOpen(false);
            queryClient.invalidateQueries(["getDanhSachXeVaGiaoVien"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật!");
        }
    });

    const handleEditClick = (record) => {
        setSelectedRecord(record);
        form.setFieldsValue({
            giao_vien: record.giao_vien,
            xe_b1: record.xeB1,
            xe_b2: record.xeB2,
        });
        setIsModalOpen(true);
    };

    const handleModalSubmit = (values) => {
        if (!selectedRecord) return;
        mutateEdit({
            id: selectedRecord.id,
            payload: {
                giao_vien: values.giao_vien?.trim() || "",
                xe_b1: values.xe_b1?.trim() || "",
                xe_b2: values.xe_b2?.trim() || "",
            }
        });
    };

    const handleFilter = () => {
        const search = keywordInputRef.current?.input?.value?.trim() || "";
        setParams(prev => ({
            ...prev,
            page: 1,
            search,
        }));
    };

    const handleReset = () => {
        if (keywordInputRef.current?.input) {
            keywordInputRef.current.input.value = "";
        }
        setParams({
            page: 1,
            limit: 10,
            search: "",
            khoa: undefined,
        });
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 50,
            align: 'center',
            render: (_, __, index) => (params.page - 1) * params.limit + index + 1,
        },
        {
            title: 'Học viên',
            key: 'hocVien',
            width: 230,
            render: (_, record) => <HocVienInfo record={record} />
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
            width: 130,
            align: 'center',
            render: (text) => text || '-'
        },
        {
            title: 'Năm sinh',
            dataIndex: 'ngay_sinh',
            key: 'ngay_sinh',
            width: 100,
            align: 'center',
            render: (text) => text ? dayjs(text).format('YYYY') : '-'
        },
        {
            title: 'Khóa học',
            dataIndex: 'khoa',
            key: 'khoa',
            width: 140,
            align: 'center',
            render: (text) => <Text>{text || '-'}</Text>
        },
        {
            title: 'Hạng',
            dataIndex: 'hang',
            key: 'hang',
            width: 80,
            align: 'center',
            render: (text) => {
                if (!text) return '-';
                let label = text;
                if (text === 'B' || text === 'B2') label = 'B2';
                if (text === 'B.01' || text === 'B1') label = 'B1';
                return <Tag color="#3366cc">{label}</Tag>;
            }
        },
        {
            title: 'Giáo viên',
            dataIndex: 'giao_vien',
            key: 'giao_vien',
            width: 180,
            render: (text) => text || <Text type="secondary" italic>Chưa đăng ký</Text>
        },
        {
            title: 'Xe B1',
            dataIndex: 'xeB1',
            key: 'xeB1',
            width: 120,
            align: 'center',
            render: (text) => <Text>{text || '-'}</Text>
        },
        {
            title: 'Xe B2',
            dataIndex: 'xeB2',
            key: 'xeB2',
            width: 120,
            align: 'center',
            render: (text) => <Text>{text || '-'}</Text>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 80,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EditOutlined style={{ color: '#1890ff' }} />}
                    onClick={() => handleEditClick(record)}
                />
            ),
        },
    ];

    return (
        <div>
            <Card className="!mb-4">
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={9}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Tìm kiếm học viên
                        </label>
                        <Input
                            ref={keywordInputRef}
                            placeholder="Nhập tên học viên, CCCD hoặc mã đăng ký..."
                            onPressEnter={handleFilter}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={9}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Khóa học
                        </label>
                        <Select
                            className="w-full"
                            placeholder="--Chọn khóa--"
                            value={params.khoa}
                            onChange={(value) => setParams(prev => ({ ...prev, khoa: value, page: 1 }))}
                            options={classOptions}
                            loading={isLoadingKhoaHoc}
                            showSearch
                            optionFilterProp="label"
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={6}>
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
                loading={isLoadingList}
                scroll={{ x: 1400 }}
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
            />

            <Modal
                title={
                    <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Cập Nhật Xe & Giáo Viên
                        </Title>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleModalSubmit}
                >
                    <Form.Item
                        name="giao_vien"
                        label={<span className="font-semibold">Tên Giáo Viên</span>}
                    >
                        <Input placeholder="Nhập tên giáo viên giảng dạy..." allowClear />
                    </Form.Item>

                    <Form.Item
                        name="xe_b1"
                        label={<span className="font-semibold">Xe B1 (Biển kiểm soát)</span>}
                    >
                        <Input placeholder="Nhập biển số xe B1..." allowClear />
                    </Form.Item>

                    <Form.Item
                        name="xe_b2"
                        label={<span className="font-semibold">Xe B2 (Biển kiểm soát)</span>}
                    >
                        <Input placeholder="Nhập biển số xe B2..." allowClear />
                    </Form.Item>

                    <div className="flex justify-end gap-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '24px' }}>
                        <Button onClick={() => setIsModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isEditing}
                            style={{ backgroundColor: '#3366cc' }}
                        >
                            Cập nhật
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DangKyXeGiaoVien;
