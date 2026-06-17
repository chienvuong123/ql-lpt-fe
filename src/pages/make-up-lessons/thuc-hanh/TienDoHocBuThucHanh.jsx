import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dongBoTienDoDaoTaoSql, getTienDoDaoTaoListSql } from '../../../apis/apiSynch';
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
    message,
    Select
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMemo, useRef, useState, useCallback } from 'react';
import { optionLopLyThuyet } from '../../../apis/apiLyThuyetLocal';
import TienDoHocBuModal from '../TienDoHocBuModal';
import ChiTietLopBuThucHanhModal from './ChiTietLopBuThucHanhModal';
import { usePermission } from '../../../util/permission';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TienDoHocBuThucHanh = () => {
    const { canEdit } = usePermission();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('add');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailModal, setDetailModal] = useState({ open: false, maKhoa: null });
    const keywordInputRef = useRef(null);
    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        text: "",
        search_ngay_tn: null,
        khoa_iid: undefined,
        loai: 1,
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

    const dataSource = useMemo(() => {
        const list = normalizeApiList(tienDoData);
        return list.filter(item =>
            item?.bat_dau_cabin ||
            item?.ket_thuc_cabin ||
            item?.bat_dau_dat ||
            item?.ket_thuc_dat ||
            item?.khoa_bu_thuc_hanh
        );
    }, [tienDoData]);
    const totalRecords = dataSource.length;

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

    const handleAdd = useCallback(() => {
        if (!canEdit) return;
        setModalAction('add');
        setSelectedRecord(null);
        setIsModalOpen(true);
    }, [canEdit]);

    const handleView = useCallback((record) => {
        setDetailModal({ open: true, maKhoa: record?.ma_khoa });
    }, []);

    const handleEdit = useCallback((record) => {
        if (!canEdit) return;
        setModalAction('edit');
        setSelectedRecord(record);
        setIsModalOpen(true);
    }, [canEdit]);

    const handleCloseMainModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    }, []);

    const handleCloseDetailModal = useCallback(() => {
        setDetailModal(prev => ({ ...prev, open: false }));
    }, []);

    const handleModalSubmit = useCallback((values) => {
        if (!canEdit) return;
        const userName = sessionStorage.getItem("name") || "unknown";
        const payload = { ...values };

        if (modalAction === 'add') {
            payload.created_by = userName;
        }
        payload.updated_by = userName;

        mutateTienDo(payload);
    }, [modalAction, mutateTienDo, canEdit]);

    const columns = useMemo(() => [
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
            dataIndex: 'ma_khoa',
            key: 'ma_khoa',
            width: 120,
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
                        disabled={!canEdit}
                    />
                </div>
            ),
        },
    ], [handleView, handleEdit, canEdit]);

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
            loai: 1,
        });
    };

    return (
        <div className="p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div className="mb-6">
                <Title level={3} className="!mb-1">
                    Tiến Độ Học Bù Thực Hành
                </Title>
                <div className="flex justify-between items-center">
                    <Text type="secondary">Quản lý và theo dõi tiến độ học bù các khóa học của trung tâm</Text>
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
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                    }}
                />
            </Card>

            <TienDoHocBuModal
                visible={isModalOpen}
                action={modalAction}
                data={selectedRecord}
                onCancel={handleCloseMainModal}
                onSubmit={handleModalSubmit}
                loading={isSaving}
                type="practice"
            />

            <ChiTietLopBuThucHanhModal
                visible={detailModal.open}
                maKhoaBu={detailModal.maKhoa}
                onCancel={handleCloseDetailModal}
            />
        </div>
    );
};

export default TienDoHocBuThucHanh;
