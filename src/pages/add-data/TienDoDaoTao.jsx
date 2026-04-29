import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optionLopLyThuyet } from '../../apis/apiLyThuyetLocal';
import { dongBoTienDoDaoTaoSql, getTienDoDaoTaoListSql } from '../../apis/apiSynch';
import {
    Table,
    Form,
    Input,
    DatePicker,
    Button,
    Card,
    Row,
    Col,
    Space,
    Typography,
    Tag,
    Modal,
    message,
    Popconfirm,
    Tooltip,
    Select
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    CalendarOutlined,
    TeamOutlined,
    CarryOutOutlined,
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import ModalTienDoDaoTao from './ModalTienDoDaoTao';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TienDoDaoTao = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('add');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const keywordInputRef = useRef(null);
    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        text: "",
        search_ngay_tn: null,
        khoa_iid: undefined,
    });

    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["optionLopLyThuyet"],
        queryFn: () => optionLopLyThuyet(),
        staleTime: 1000 * 60 * 5,
    });

    const normalizeApiList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.result)) return payload.result;
        return [];
    };

    const classOptions = useMemo(() => {
        return normalizeApiList(dataKhoaHoc).map((item) => ({
            label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
            value: item?.code || item?.iid,
        }));
    }, [dataKhoaHoc]);

    const { data: tienDoData, isLoading: isLoadingTienDo } = useQuery({
        queryKey: ["getTienDoTaoList", params],
        queryFn: () => getTienDoDaoTaoListSql(params),
        staleTime: 1000 * 60 * 5,
    });

    const dataSource = useMemo(() => normalizeApiList(tienDoData), [tienDoData]);
    const totalRecords = tienDoData?.total || dataSource.length || 0;

    const { mutate: mutateTienDo, isLoading: isSaving } = useMutation({
        mutationFn: dongBoTienDoDaoTaoSql,
        onSuccess: () => {
            message.success(modalAction === 'add' ? 'Thêm mới thành công' : 'Cập nhật thành công');
            setIsModalOpen(false);
            queryClient.invalidateQueries(["getTienDoTaoList"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
        }
    });

    const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-');

    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: 40,
            fixed: 'left',
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Khóa',
            dataIndex: 'ten_khoa',
            key: 'ten_khoa',
            width: 100,
            fixed: 'left',
            align: 'center',
            render: (text) => <Text strong>{text ? text : '-'}</Text>
        },
        {
            title: 'Hạng',
            dataIndex: 'hang',
            key: 'hang',
            width: 70,
            align: 'center',
            render: (text) => <Tag color="blue">{text || '-'}</Tag>
        },
        {
            title: 'SL',
            dataIndex: 'luu_luong',
            key: 'luu_luong',
            width: 60,
            align: 'center',
        },
        {
            title: 'Khai giảng',
            dataIndex: 'ngay_khai_giang',
            key: 'ngay_khai_giang',
            width: 110,
            align: 'center',
            render: formatDate
        },
        {
            title: 'Lý Thuyết',
            children: [
                {
                    title: 'Online',
                    children: [
                        {
                            title: 'Bắt đầu',
                            dataIndex: 'bat_dau_ly_thuyet',
                            key: 'bat_dau_ly_thuyet',
                            width: 110,
                            align: 'center',
                            className: 'column-online',
                            render: formatDate
                        },
                        {
                            title: 'Kết thúc',
                            dataIndex: 'ket_thuc_ly_thuyet',
                            key: 'ket_thuc_ly_thuyet',
                            width: 110,
                            align: 'center',
                            className: 'column-online',
                            render: formatDate
                        },
                    ],
                },
                {
                    title: 'Kiểm tra hết môn',
                    dataIndex: 'kiem_tra_het_mon',
                    key: 'kiem_tra_het_mon',
                    width: 120,
                    align: 'center',
                    className: 'column-exam',
                    render: formatDate
                },
            ],
        },
        {
            title: 'Thực Hành',
            children: [
                {
                    title: 'Cabin',
                    children: [
                        {
                            title: 'Bắt đầu',
                            dataIndex: 'bat_dau_cabin',
                            key: 'bat_dau_cabin',
                            width: 110,
                            align: 'center',
                            className: 'column-cabin',
                            render: formatDate
                        },
                        {
                            title: 'Kết thúc',
                            dataIndex: 'ket_thuc_cabin',
                            key: 'ket_thuc_cabin',
                            width: 110,
                            align: 'center',
                            className: 'column-cabin',
                            render: formatDate
                        },
                    ],
                },
                {
                    title: 'Học DAT',
                    children: [
                        {
                            title: 'Bắt đầu',
                            dataIndex: 'bat_dau_dat',
                            key: 'bat_dau_dat',
                            width: 110,
                            align: 'center',
                            className: 'column-dat',
                            render: formatDate
                        },
                        {
                            title: 'Kết thúc',
                            dataIndex: 'ket_thuc_dat',
                            key: 'ket_thuc_dat',
                            width: 110,
                            align: 'center',
                            className: 'column-dat',
                            render: formatDate
                        },
                    ],
                },
            ],
        },
        {
            title: 'Dự thi tốt nghiệp',
            dataIndex: 'tot_nghiep',
            key: 'tot_nghiep',
            width: 120,
            align: 'center',
            className: 'column-graduation',
            render: formatDate
        },
        {
            title: 'Hạn ký ghép tốt nghiệp',
            dataIndex: 'ghep_tot_nghiep',
            key: 'ghep_tot_nghiep',
            width: 150,
            align: 'center',
            render: (text) => (
                <div style={{ color: '#cf1322', fontWeight: '500' }}>
                    {formatDate(text)}
                </div>
            )
        },
        {
            title: 'Bế Giảng',
            dataIndex: 'be_giang',
            key: 'be_giang',
            width: 110,
            align: 'center',
            render: formatDate
        },
        {
            title: 'Số ngày còn lại',
            key: 'soNgayConLai',
            width: 110,
            align: 'center',
            render: (_, record) => {
                const beGiang = record.be_giang ? dayjs(record.be_giang) : null;
                const today = dayjs().startOf('day');

                if (!beGiang) return '-';

                const diffDays = beGiang.diff(today, 'day');

                if (diffDays < 0) {
                    return <Tag color="error">Đóng khóa</Tag>;
                }

                return <Tag color="processing">{diffDays} ngày</Tag>;
            }
        },
        {
            title: 'Lưu lượng',
            dataIndex: 'luu_luong',
            key: 'luu_luong',
            width: 100,
            align: 'center',
            render: (text, record) => {
                const beGiang = record.be_giang ? dayjs(record.be_giang) : null;
                const isClosed = beGiang && beGiang.isBefore(dayjs(), 'day');
                return isClosed ? '-' : (text || '-');
            }
        },
        {
            title: 'SL đạt TN',
            dataIndex: 'so_luong_dat',
            key: 'so_luong_dat',
            width: 100,
            align: 'center',
            render: (text, record) => {
                const beGiang = record.be_giang ? dayjs(record.be_giang) : null;
                const isClosed = beGiang && beGiang.isBefore(dayjs(), 'day');
                if (isClosed && Number(text) > 0) return text;
                return '-';
            }
        },
        {
            title: 'SL trượt TN',
            dataIndex: 'so_luong_truot',
            key: 'so_luong_truot',
            width: 100,
            align: 'center',
            render: (text, record) => {
                const beGiang = record.be_giang ? dayjs(record.be_giang) : null;
                const isClosed = beGiang && beGiang.isBefore(dayjs(), 'day');
                if (isClosed && Number(text) > 0) return text;
                return '-';
            }
        },
        {
            title: 'Ghi chú',
            dataIndex: 'ghi_chu',
            key: 'ghi_chu',
            width: 150,
            align: 'center',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <div className='flex'>
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleView(record)}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => handleEdit(record)}
                    />
                </div>
            ),
        },
    ];

    const handleAdd = () => {
        setModalAction('add');
        setSelectedRecord(null);
        setIsModalOpen(true);
    };

    const handleView = (record) => {
        setModalAction('view');
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleEdit = (record) => {
        setModalAction('edit');
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleDelete = (key) => {
        setData(prev => prev.filter(item => item.key !== key));
        message.success('Xóa bản ghi thành công');
    };

    const handleModalSubmit = (values) => {
        const userName = sessionStorage.getItem("name") || "unknown";
        const payload = { ...values };

        if (modalAction === 'add') {
            payload.created_by = userName;
        }
        payload.updated_by = userName;

        mutateTienDo(payload);
    };

    const handleFilter = () => {
        const text = keywordInputRef.current?.input?.value?.trim() || "";
        setParams(prev => ({
            ...prev,
            page: 1,
            text,
        }));
    };

    const handleReset = () => {
        if (keywordInputRef.current?.input) {
            keywordInputRef.current.input.value = "";
        }
        setParams({
            page: 1,
            limit: 10,
            text: "",
            search_ngay_tn: null,
            khoa_iid: undefined,
        });
    };

    return (
        <div className="p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div className="mb-6">
                <Title level={3} className="!mb-1">
                    Tiến Độ Đào Tạo
                </Title>
                <div className="flex justify-between items-center">
                    <Text type="secondary">Quản lý và theo dõi tiến độ đào tạo các khóa học của trung tâm</Text>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={{ borderRadius: '6px', height: '40px' }}
                    >
                        Thêm tiến độ mới
                    </Button>
                </div>
            </div>

            <Card className="!mt-5 !mb-4">
                <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24} md={7}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Chọn Khóa
                        </label>
                        <Select
                            className="w-full"
                            placeholder="--Chọn khóa--"
                            value={params.khoa_iid}
                            onChange={(value) => setParams(prev => ({ ...prev, khoa_iid: value, page: 1 }))}
                            options={classOptions}
                            loading={isLoadingKhoaHoc}
                            showSearch
                            optionFilterProp="label"
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={7}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Tìm kiếm
                        </label>
                        <Input
                            ref={keywordInputRef}
                            placeholder="Nhập tên học viên hoặc mã khóa..."
                            onPressEnter={handleFilter}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={7}>
                        <label className="block text-xs text-gray-500 uppercase mb-1">
                            Ngày tốt nghiệp
                        </label>
                        <DatePicker
                            placeholder="Chọn ngày tốt nghiệp"
                            className="w-full"
                            format="DD/MM/YYYY"
                            value={params.search_ngay_tn ? dayjs(params.search_ngay_tn, 'DD/MM/YYYY') : null}
                            onChange={(date, dateString) => setParams(prev => ({ ...prev, search_ngay_tn: dateString || null, page: 1 }))}
                        />
                    </Col>
                    <Col xs={24} md={3}>
                        <Space>
                            <Button
                                type="primary"
                                className="!bg-[#3366cc]"
                                onClick={handleFilter}
                            >
                                Lọc
                            </Button>
                            <Button
                                onClick={handleReset}
                            >
                                Bỏ Lọc
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    className="table-blue-header"
                    dataSource={dataSource}
                    columns={columns}
                    bordered
                    size="small"
                    loading={isLoadingTienDo}
                    scroll={{ x: 1800 }}
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
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                    }}
                />
            </Card>

            <ModalTienDoDaoTao
                visible={isModalOpen}
                action={modalAction}
                data={selectedRecord}
                onCancel={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                loading={isSaving}
            />
        </div>
    );
};

export default TienDoDaoTao;
