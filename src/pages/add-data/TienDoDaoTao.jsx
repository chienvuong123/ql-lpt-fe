import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optionLopLyThuyet } from '../../apis/apiLyThuyetLocal';
import { dongBoTienDoDaoTaoSql, getTienDoB1Sql, getTienDoB2Sql, getTienDoC1Sql } from '../../apis/apiSynch';
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
import ModalTienDoDaoTao from './ModalTienDoDaoTao';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { usePermission } from '../../util/permission';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TienDoDaoTao = () => {
    const { canEdit } = usePermission();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState('add');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const keywordInputRef = useRef(null);
    const [paramsB1, setParamsB1] = useState({
        page: 1,
        limit: 10,
        text: "",
        search_ngay_tn: null,
        khoa_iid: undefined,
    });
    const [paramsB2, setParamsB2] = useState({
        page: 1,
        limit: 10,
        text: "",
        search_ngay_tn: null,
        khoa_iid: undefined,
    });
    const [paramsC1, setParamsC1] = useState({
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

    const { data: tienDoDataB1, isLoading: isLoadingTienDoB1 } = useQuery({
        queryKey: ["getTienDoB1", paramsB1],
        queryFn: () => getTienDoB1Sql(paramsB1),
        staleTime: 1000 * 60 * 5,
    });

    const { data: tienDoDataB2, isLoading: isLoadingTienDoB2 } = useQuery({
        queryKey: ["getTienDoB2", paramsB2],
        queryFn: () => getTienDoB2Sql(paramsB2),
        staleTime: 1000 * 60 * 5,
    });

    const { data: tienDoDataC1, isLoading: isLoadingTienDoC1 } = useQuery({
        queryKey: ["getTienDoC1", paramsC1],
        queryFn: () => getTienDoC1Sql(paramsC1),
        staleTime: 1000 * 60 * 5,
    });

    const dataSourceB1 = useMemo(() => normalizeApiList(tienDoDataB1), [tienDoDataB1]);
    const dataSourceB2 = useMemo(() => normalizeApiList(tienDoDataB2), [tienDoDataB2]);
    const dataSourceC1 = useMemo(() => normalizeApiList(tienDoDataC1), [tienDoDataC1]);

    const totalRecordsB1 = tienDoDataB1?.total || dataSourceB1.length || 0;
    const totalRecordsB2 = tienDoDataB2?.total || dataSourceB2.length || 0;
    const totalRecordsC1 = tienDoDataC1?.total || dataSourceC1.length || 0;

    const luuLuongB1 = useMemo(() => {
        return dataSourceB1.reduce((sum, item) => {
            if (!item.be_giang) return sum;
            const beGiang = dayjs(item.be_giang);
            if (beGiang.isAfter(dayjs(), 'day')) {
                return sum + (Number(item.luu_luong) || 0);
            }
            return sum;
        }, 0);
    }, [dataSourceB1]);

    const luuLuongB2 = useMemo(() => {
        return dataSourceB2.reduce((sum, item) => {
            if (!item.be_giang) return sum;
            const beGiang = dayjs(item.be_giang);
            if (beGiang.isAfter(dayjs(), 'day')) {
                return sum + (Number(item.luu_luong) || 0);
            }
            return sum;
        }, 0);
    }, [dataSourceB2]);

    const luuLuongC1 = useMemo(() => {
        return dataSourceC1.reduce((sum, item) => {
            if (!item.be_giang) return sum;
            const beGiang = dayjs(item.be_giang);
            if (beGiang.isAfter(dayjs(), 'day')) {
                return sum + (Number(item.luu_luong) || 0);
            }
            return sum;
        }, 0);
    }, [dataSourceC1]);

    const tongLuuLuong = useMemo(() => {
        return luuLuongB1 + luuLuongB2 + luuLuongC1;
    }, [luuLuongB1, luuLuongB2, luuLuongC1]);

    const { mutate: mutateTienDo, isLoading: isSaving } = useMutation({
        mutationFn: dongBoTienDoDaoTaoSql,
        onSuccess: () => {
            message.success(modalAction === 'add' ? 'Thêm mới thành công' : 'Cập nhật thành công');
            setIsModalOpen(false);
            queryClient.invalidateQueries(["getTienDoB1"]);
            queryClient.invalidateQueries(["getTienDoB2"]);
            queryClient.invalidateQueries(["getTienDoC1"]);
        },
        onError: (err) => {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
        }
    });
    const getColumns = (classType) => {
        const isC1 = classType === 'C1';
        const headerBg = isC1
            ? '!bg-[#9ccb9c]'
            : classType === 'B1'
                ? '!bg-[#FFCC99]'
                : '!bg-[#ffe3b3]';

        // Define common Cell class
        const bodyCellClass = '!bg-[#cdece1] !text-black border border-black text-sm font-semibold text-center';

        const headerCell = (className = '') => () => ({
            className: `${headerBg} !text-black !font-extrabold text-center border border-black text-sm py-2 px-1 ${className}`
        });

        const redHeaderCell = (className = '') => () => ({
            className: `${headerBg} !text-red-600 !font-extrabold text-center border border-black text-sm py-2 px-1 ${className}`
        });

        const blueHeaderCell = (className = '') => () => ({
            className: `${headerBg} !text-blue-600 !font-extrabold text-center border border-black text-sm py-2 px-1 ${className}`
        });

        const yellowHeaderCell = (className = '') => () => ({
            className: `!bg-[#ffff00] !text-red-600 !font-extrabold text-center border border-black text-sm py-2 px-1 ${className}`
        });

        const yellowHeaderCellBlack = (className = '') => () => ({
            className: `!bg-[#ffff00] !text-black !font-extrabold text-center border border-black text-sm py-2 px-1 ${className}`
        });

        const defaultCell = (record) => {
            const beGiang = record?.be_giang ? dayjs(record.be_giang) : null;
            const today = dayjs().startOf('day');
            const isClosed = beGiang && beGiang.diff(today, 'day') < 0;
            return {
                className: isClosed
                    ? '!bg-[#ffd1d1] !text-black border border-black text-sm font-semibold text-center'
                    : bodyCellClass
            };
        };

        const cabinAndDatCols = [
            {
                title: 'CABIN',
                onHeaderCell: redHeaderCell(),
                children: [
                    {
                        title: 'BẮT ĐẦU',
                        dataIndex: 'bat_dau_cabin',
                        key: 'bat_dau_cabin',
                        width: 75,
                        align: 'center',
                        onHeaderCell: blueHeaderCell(),
                        onCell: defaultCell,
                        render: (text) => text ? <span className="text-blue-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                    },
                    {
                        title: 'KẾT THÚC',
                        dataIndex: 'ket_thuc_cabin',
                        key: 'ket_thuc_cabin',
                        width: 75,
                        align: 'center',
                        onHeaderCell: redHeaderCell(),
                        onCell: defaultCell,
                        render: (text) => text ? <span className="text-red-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                    },
                ]
            },
            {
                title: 'HỌC DAT',
                onHeaderCell: redHeaderCell(),
                children: [
                    {
                        title: 'BẮT ĐẦU',
                        dataIndex: 'bat_dau_dat',
                        key: 'bat_dau_dat',
                        width: 75,
                        align: 'center',
                        onHeaderCell: blueHeaderCell(),
                        onCell: defaultCell,
                        render: (text) => text ? <span className="text-blue-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                    },
                    {
                        title: 'KẾT THÚC',
                        dataIndex: 'ket_thuc_dat',
                        key: 'ket_thuc_dat',
                        width: 75,
                        align: 'center',
                        onHeaderCell: redHeaderCell(),
                        onCell: defaultCell,
                        render: (text) => text ? <span className="text-red-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                    },
                ]
            }
        ];

        const middleSection = isC1 ? cabinAndDatCols : [
            {
                title: 'THỰC HÀNH',
                onHeaderCell: redHeaderCell(),
                children: cabinAndDatCols
            }
        ];

        const cols = [
            {
                title: 'STT',
                dataIndex: 'index',
                key: 'index',
                width: 40,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (_, __, index) => <span className="font-bold">{index + 1}</span>,
            },
            {
                title: isC1 ? 'KHÓA HỌC' : 'KHÓA',
                dataIndex: 'ten_khoa',
                key: 'ten_khoa',
                width: 80,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => <span className="font-bold text-black">{text || '-'}</span>
            },
            {
                title: 'SL',
                dataIndex: 'luu_luong',
                key: 'luu_luong',
                width: 45,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => <span className="font-semibold text-black">{text || '0'}</span>
            },
            {
                title: 'KHAI GIẢNG',
                dataIndex: 'ngay_khai_giang',
                key: 'ngay_khai_giang',
                width: 80,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => text ? <span className="font-bold text-black">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
            },
            {
                title: 'LÝ THUYẾT',
                onHeaderCell: redHeaderCell(),
                children: [
                    {
                        title: 'ONLINE',
                        onHeaderCell: redHeaderCell(),
                        children: [
                            {
                                title: 'BẮT ĐẦU',
                                dataIndex: 'bat_dau_ly_thuyet',
                                key: 'bat_dau_ly_thuyet',
                                width: 75,
                                align: 'center',
                                onHeaderCell: blueHeaderCell(),
                                onCell: defaultCell,
                                render: (text) => text ? <span className="text-blue-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                            },
                            {
                                title: 'KẾT THÚC',
                                dataIndex: 'ket_thuc_ly_thuyet',
                                key: 'ket_thuc_ly_thuyet',
                                width: 75,
                                align: 'center',
                                onHeaderCell: redHeaderCell(),
                                onCell: defaultCell,
                                render: (text) => text ? <span className="text-red-600 font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                            },
                        ]
                    },
                    {
                        title: 'Kiểm tra hết môn',
                        dataIndex: 'kiem_tra_het_mon',
                        key: 'kiem_tra_het_mon',
                        width: 75,
                        align: 'center',
                        onHeaderCell: yellowHeaderCell(),
                        onCell: defaultCell,
                        render: (text) => text ? <span className="text-black font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
                    }
                ]
            },
            ...middleSection,
            {
                title: 'Dự thi tốt nghiệp',
                dataIndex: 'tot_nghiep',
                key: 'tot_nghiep',
                width: 80,
                align: 'center',
                onHeaderCell: yellowHeaderCellBlack(),
                onCell: defaultCell,
                render: (text) => text ? <span className="text-black font-bold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
            },
            {
                title: 'Hạn ký ghép thi tốt nghiệp',
                dataIndex: 'ghep_tot_nghiep',
                key: 'ghep_tot_nghiep',
                width: 110,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => {
                    if (!text) return '-';
                    const d = dayjs(text);
                    if (!d.isValid()) return '-';
                    const dayOfWeek = d.day();
                    let dayName = '';
                    if (dayOfWeek === 0) dayName = 'CHỦ NHẬT';
                    else dayName = `THỨ ${dayOfWeek + 1}`;

                    return (
                        <div className="text-red-600 font-bold text-center leading-tight text-sm">
                            <div className="uppercase">HẾT {dayName}</div>
                            <div>ngày {d.format('DD/MM/YYYY')}</div>
                        </div>
                    );
                }
            },
            {
                title: 'Bế Giảng',
                dataIndex: 'be_giang',
                key: 'be_giang',
                width: 75,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => text ? <span className="font-semibold">{dayjs(text).format('DD/MM/YYYY')}</span> : '-'
            },
            {
                title: 'Số ngày còn lại',
                key: 'soNgayConLai',
                width: 100,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
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
                title: 'SL đạt TN',
                dataIndex: 'so_luong_dat',
                key: 'so_luong_dat',
                width: 100,
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
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
                onHeaderCell: headerCell(),
                onCell: defaultCell,
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
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (text) => <span className="text-gray-700">{text || '-'}</span>
            },
            {
                title: 'Thao tác',
                key: 'action',
                width: 70,
                fixed: 'right',
                align: 'center',
                onHeaderCell: headerCell(),
                onCell: defaultCell,
                render: (_, record) => (
                    <div className='flex justify-center gap-1'>
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: '#1890ff' }} />}
                            onClick={() => handleView(record)}
                            size="small"
                        />
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: canEdit ? '#1890ff' : '#bfbfbf' }} />}
                            onClick={() => handleEdit(record)}
                            disabled={!canEdit}
                            size="small"
                        />
                    </div>
                ),
            },
        ];

        const mainTitle = classType === 'B1'
            ? 'Hạng B số tự động'
            : classType === 'B2'
                ? 'Hạng B số sàn'
                : 'Hạng C1';

        const mainTitleBg = classType === 'C1'
            ? '!bg-[#8fbe8f]'
            : classType === 'B1'
                ? '!bg-[#FFCC99]'
                : '!bg-[#ffe3b3]';

        return [
            {
                title: mainTitle,
                onHeaderCell: () => ({
                    className: `${mainTitleBg} !text-black !font-extrabold text-center sticky border border-black text-xl py-2 uppercase tracking-wide`
                }),
                children: cols
            }
        ];
    };

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
        const updateFn = prev => ({
            ...prev,
            page: 1,
            text,
        });
        setParamsB1(updateFn);
        setParamsB2(updateFn);
        setParamsC1(updateFn);
    };

    const handleReset = () => {
        if (keywordInputRef.current?.input) {
            keywordInputRef.current.input.value = "";
        }
        const resetVal = {
            page: 1,
            limit: 10,
            text: "",
            search_ngay_tn: null,
            khoa_iid: undefined,
        };
        setParamsB1(resetVal);
        setParamsB2(resetVal);
        setParamsC1(resetVal);
    };

    return (
        <div className="p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div className="mb-6">
                <Title level={3} className="!mb-1">
                    Tiến Độ Đào Tạo
                </Title>
                <div className="flex justify-between items-center">
                    <Text type="secondary">Quản lý và theo dõi tiến độ đào tạo các khóa học của trung tâm</Text>
                    {canEdit && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            style={{ borderRadius: '6px', height: '40px' }}
                        >
                            Thêm tiến độ mới
                        </Button>
                    )}
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
                            value={paramsB1.khoa_iid}
                            onChange={(value) => {
                                const updateFn = prev => ({ ...prev, khoa_iid: value, page: 1 });
                                setParamsB1(updateFn);
                                setParamsB2(updateFn);
                                setParamsC1(updateFn);
                            }}
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
                            value={paramsB1.search_ngay_tn ? dayjs(paramsB1.search_ngay_tn, 'DD/MM/YYYY') : null}
                            onChange={(date, dateString) => {
                                const updateFn = prev => ({ ...prev, search_ngay_tn: dateString || null, page: 1 });
                                setParamsB1(updateFn);
                                setParamsB2(updateFn);
                                setParamsC1(updateFn);
                            }}
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
                <Row gutter={[16, 16]} className="!mt-8 !ml-1">
                    <div className='flex gap-6'>
                        <div className="text-sm">
                            Tổng Lưu Lượng: <Text strong>{tongLuuLuong}</Text>
                        </div>
                        <div className="text-sm">
                            Lưu lượng B1: <Text strong>{luuLuongB1}</Text>
                        </div>
                        <div className="text-sm">
                            Lưu lượng B2: <Text strong>{luuLuongB2}</Text>
                        </div>
                        <div className="text-sm">
                            Lưu lượng C1: <Text strong>{luuLuongC1}</Text>
                        </div>
                    </div>
                </Row>
            </Card>


            {/* Tiến Độ Hạng B1 */}
            <div className="mb-8">
                <Table
                    className="custom-schedule-table"
                    dataSource={dataSourceB1}
                    columns={getColumns('B1')}
                    bordered
                    size="small"
                    loading={isLoadingTienDoB1}
                    scroll={{ x: 2200 }}
                    pagination={{
                        current: paramsB1.page,
                        pageSize: paramsB1.limit,
                        total: totalRecordsB1,
                        onChange: (page, pageSize) => {
                            setParamsB1((prev) => ({
                                ...prev,
                                page,
                                limit: pageSize,
                            }));
                        },
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                    }}
                />
            </div>

            {/* Tiến Độ Hạng B2 */}
            <div className="mb-8">
                <Table
                    className="custom-schedule-table"
                    dataSource={dataSourceB2}
                    columns={getColumns('B2')}
                    bordered
                    size="small"
                    loading={isLoadingTienDoB2}
                    scroll={{ x: 2200 }}
                    pagination={{
                        current: paramsB2.page,
                        pageSize: paramsB2.limit,
                        total: totalRecordsB2,
                        onChange: (page, pageSize) => {
                            setParamsB2((prev) => ({
                                ...prev,
                                page,
                                limit: pageSize,
                            }));
                        },
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                    }}
                />
            </div>

            {/* Tiến Độ Hạng C1 */}
            <div className="mb-8">
                <Table
                    className="custom-schedule-table"
                    dataSource={dataSourceC1}
                    columns={getColumns('C1')}
                    bordered
                    size="small"
                    loading={isLoadingTienDoC1}
                    scroll={{ x: 2200 }}
                    pagination={{
                        current: paramsC1.page,
                        pageSize: paramsC1.limit,
                        total: totalRecordsC1,
                        onChange: (page, pageSize) => {
                            setParamsC1((prev) => ({
                                ...prev,
                                page,
                                limit: pageSize,
                            }));
                        },
                        showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                    }}
                />
            </div>

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
